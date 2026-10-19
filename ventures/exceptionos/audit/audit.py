"""Supplier Delay Risk Audit: which supplier promise-date slips will short which open jobs.

Reads four CSV exports (see generate_sample.py for the shape), runs read-only and offline, no AI, no network:

1. For every purchased part, nets on-hand stock and open PO receipts against open job requirements in date order,
   twice: once with receipts on the PO **due date** (what Epicor's MRP/Time Phase plan on) and once on the
   supplier **promise date** (what the supplier actually committed to).
2. A job material that is covered on due dates but short on promise dates is a **hidden** exception: the due-date
   view still shows it on time. One short on both is **already visible**.
3. Slips that land before any job needs the part are filtered out, so the list only holds slips that break a job.
4. Ranks threatened jobs by how soon they start, days short, and the customer order behind them.

    python3 audit.py sample_data --as-of 2026-10-19 --out out/
"""
import argparse
import csv
import html
import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path


def read(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def day(s):
    return date.fromisoformat(s) if s else None


@dataclass
class Release:
    po: str
    supplier: str
    part: str
    qty: float
    due: date
    promise: date | None
    seq: int = 0  # row order in the export: a tie-breaker that survives sanitizing

    @property
    def slip(self):
        return (self.promise - self.due).days if self.promise else None

    def arrives(self, basis):
        return self.due if basis == "due" or self.promise is None else self.promise


@dataclass
class Need:
    job: str
    part: str
    desc: str
    qty: float
    req: date
    seq: int = 0
    covered: dict = field(default_factory=dict)  # basis -> (date or None, release completing coverage)


def net(part_rels, part_needs, on_hand, basis):
    """FIFO netting for one part. Records, for each need, when cumulative supply first covers it."""
    supply = sorted(part_rels, key=lambda r: (r.arrives(basis), r.seq))
    cum_supply, i, last = on_hand, 0, None
    cum_need = 0.0
    for n in sorted(part_needs, key=lambda n: (n.req, n.seq)):
        cum_need += n.qty
        while cum_supply < cum_need and i < len(supply):
            cum_supply += supply[i].qty
            last = supply[i]
            i += 1
        if cum_supply >= cum_need:
            when = last.arrives(basis) if last and cum_supply - last.qty < cum_need else None
            n.covered[basis] = (when, last if when else None)  # None date = covered by stock already on hand
        else:
            n.covered[basis] = ("never", None)


def short_days(n, basis):
    when, _ = n.covered[basis]
    if when == "never":
        return None  # no open supply covers it at all
    if when is None:
        return 0
    return max(0, (when - n.req).days)


def run(folder, as_of):
    folder = Path(folder)
    rels = [Release(f'{r["PONum"]}-{r["POLine"]}-{r["PORelNum"]}', r["VendorName"], r["PartNum"], float(r["RelQty"]) - float(r.get("ReceivedQty") or 0), day(r["DueDate"]), day(r["PromiseDt"]), i) for i, r in enumerate(read(folder / "po_releases.csv"))]
    rels = [r for r in rels if r.qty > 0]
    needs = [Need(m["JobNum"], m["PartNum"], m.get("Description", ""), float(m["RequiredQty"]) - float(m.get("IssuedQty") or 0), day(m["ReqDate"]), i) for i, m in enumerate(read(folder / "job_materials.csv"))]
    needs = [n for n in needs if n.qty > 0]
    stock = {r["PartNum"]: float(r["OnhandQty"]) for r in read(folder / "on_hand.csv")}
    orders = {r["JobNum"]: r for r in read(folder / "job_orders.csv")}
    job_start = {m["JobNum"]: day(m.get("JobStartDate") or m["ReqDate"]) for m in read(folder / "job_materials.csv")}

    for part in {n.part for n in needs}:
        pr = [r for r in rels if r.part == part]
        pn = [n for n in needs if n.part == part]
        for basis in ("due", "promise"):
            net(pr, pn, stock.get(part, 0.0), basis)

    findings = []
    for n in needs:
        sd_p, sd_d = short_days(n, "promise"), short_days(n, "due")
        if sd_p is None or sd_p == 0:
            continue  # covered on promise dates, or no supply at all (a plain shortage, not a supplier slip)
        # Blame the slip: a release of this part that was due by the need date but is now promised after it.
        # If there isn't one (stock was used up by earlier jobs), show the release that finally covers it.
        culprits = [r for r in rels if r.part == n.part and r.promise and r.due <= n.req < r.promise]
        rel = max(culprits, key=lambda r: (r.slip, r.qty)) if culprits else n.covered["promise"][1]
        o = orders.get(n.job, {})
        findings.append({
            "job": n.job, "part": n.part, "desc": n.desc, "qty": n.qty, "req": n.req.isoformat(),
            "start": (job_start.get(n.job) or n.req).isoformat(), "days_short": sd_p,
            "hidden": sd_d == 0, "po": rel.po if rel else "", "supplier": rel.supplier if rel else "",
            "due": rel.due.isoformat() if rel else "", "promise": rel.promise.isoformat() if rel and rel.promise else "",
            "slip": rel.slip if rel else None, "order": o.get("OrderNum", ""), "customer": o.get("CustomerName", ""),
            "ship_by": o.get("ShipByDate", ""), "value": float(o.get("OrderValue") or 0),
        })
    # Rank: soonest-starting jobs first within the next 3 weeks, then most days short, then biggest order.
    for f in findings:
        f["starts_in"] = (date.fromisoformat(f["start"]) - as_of).days
    # Hidden ones first: they are the ones a due-date view (and maybe the team) hasn't flagged.
    findings.sort(key=lambda f: (not f["hidden"], f["starts_in"] > 21, -f["days_short"], f["starts_in"], -f["value"]))

    slipped = [r for r in rels if r.slip and r.slip > 0]
    breaking = {f["po"] for f in findings}
    unacked = [r for r in rels if r.promise is None and 0 <= (r.due - as_of).days <= 14 and any(n.part == r.part for n in needs)]
    jobs = {}
    for f in findings:
        j = jobs.setdefault(f["job"], {"hidden": True, "value": f["value"], "customer": f["customer"]})
        j["hidden"] = j["hidden"] and f["hidden"]
    summary = {
        "as_of": as_of.isoformat(),
        "releases": len(rels), "slipped": len(slipped), "slips_harmless": len([r for r in slipped if r.po not in breaking]),
        "jobs_threatened": len(jobs), "jobs_hidden": len([j for j in jobs.values() if j["hidden"]]),
        "lines_threatened": len(findings), "lines_hidden": len([f for f in findings if f["hidden"]]),
        "orders_value": sum({f["order"]: f["value"] for f in findings}.values()),
        "unacked_14d": len(unacked), "parts": len({n.part for n in needs}), "jobs_open": len({n.job for n in needs}),
    }
    return summary, findings, unacked


def money(v):
    return f"${v / 1000:,.0f}K" if v >= 1000 else f"${v:,.0f}"


def nice(iso):
    return date.fromisoformat(iso).strftime("%b %-d") if iso else "none"


def report_html(summary, findings, unacked, company, sample):
    top = [f for f in findings if f["hidden"]][:10]
    visible = len([f for f in findings if not f["hidden"]])
    rows = []
    for i, f in enumerate(top, 1):
        why = f'starts in {f["starts_in"]}d' if f["starts_in"] >= 0 else "already started"
        tag = '<span class="tag hidden">Hidden</span>' if f["hidden"] else '<span class="tag seen">Visible</span>'
        rows.append(f"""<tr>
<td class="n">{i}</td>
<td><b>{html.escape(f["job"])}</b><div class="sub">{html.escape(f["customer"])} · SO {html.escape(str(f["order"]))} · {money(f["value"])}</div></td>
<td><b>{html.escape(f["part"])}</b><div class="sub">{html.escape(f["desc"])} · need {f["qty"]:g}</div></td>
<td>{html.escape(f["supplier"])}<div class="sub">PO {html.escape(f["po"])}</div></td>
<td class="dates">{nice(f["due"])} → <b>{nice(f["promise"])}</b><div class="sub">+{f["slip"]}d slip</div></td>
<td class="short"><b>{f["days_short"]}d short</b><div class="sub">needed {nice(f["req"])} · {why}</div></td>
<td>{tag}</td>
<td class="knew">☐ Yes&nbsp; ☐ No</td></tr>""")
    s = summary
    banner = '<div class="banner">SAMPLE REPORT · synthetic data for a fictional plant · not a real customer</div>' if sample else ""
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>Supplier Delay Risk Audit · {html.escape(company)}</title>
<style>
@page {{ size: Letter landscape; margin: 0.4in; }}
:root {{ --ink:#14171f; --muted:#5d6472; --line:#e3e6ec; --soft:#f5f7fa; --accent:#c2410c; --accent-soft:#fff1e8; --ok:#1d6b4f; }}
* {{ box-sizing:border-box; }}
body {{ margin:0; font-family: "Inter", -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; color:var(--ink); font-size:10.5px; background:#fff; }}
.page {{ max-width:10.2in; margin:0 auto; }}
.banner {{ background:#14171f; color:#fff; font-size:9.5px; letter-spacing:.08em; padding:5px 10px; border-radius:6px; text-align:center; margin-bottom:10px; }}
header {{ display:flex; justify-content:space-between; align-items:flex-end; border-bottom:2px solid var(--ink); padding-bottom:8px; }}
.brand {{ font-weight:800; font-size:13px; letter-spacing:-.01em; }} .brand span {{ color:var(--accent); }}
h1 {{ margin:2px 0 0; font-size:20px; letter-spacing:-.02em; }}
.meta {{ text-align:right; color:var(--muted); line-height:1.5; }}
.lede {{ margin:10px 0 10px; font-size:12.5px; max-width:9.4in; }}
.tiles {{ display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:10px; }}
.tile {{ background:var(--soft); border-radius:8px; padding:8px 10px; }}
.tile b {{ display:block; font-size:20px; letter-spacing:-.02em; }} .tile span {{ color:var(--muted); font-size:10px; }}
.tile.hot {{ background:var(--accent-soft); }} .tile.hot b {{ color:var(--accent); }}
table {{ width:100%; border-collapse:collapse; }}
th {{ text-align:left; font-size:9.5px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); font-weight:600; padding:5px 6px; border-bottom:1px solid var(--ink); }}
td {{ padding:4px 6px; border-bottom:1px solid var(--line); vertical-align:top; }}
.sub {{ color:var(--muted); font-size:9.5px; margin-top:1px; }}
.n {{ color:var(--muted); width:16px; }} .dates, .short {{ white-space:nowrap; }} .short b {{ color:var(--accent); }} .knew {{ white-space:nowrap; color:var(--muted); }}
.tag {{ display:inline-block; font-size:9px; font-weight:700; padding:2px 6px; border-radius:999px; }}
.tag.hidden {{ background:var(--accent-soft); color:var(--accent); }} .tag.seen {{ background:var(--soft); color:var(--muted); }}
.foot {{ display:grid; grid-template-columns:1.2fr 1fr; gap:14px; margin-top:10px; color:var(--muted); font-size:9.5px; line-height:1.45; }}
.foot h3 {{ margin:0 0 3px; font-size:10px; color:var(--ink); }}
</style></head><body><div class="page">
{banner}
<header><div><div class="brand">Exception<span>OS</span></div><h1>Supplier Delay Risk Audit</h1></div>
<div class="meta"><b>{html.escape(company)}</b><br>Data as of {nice(s["as_of"])}, {s["as_of"][:4]} · {s["releases"]} open PO releases · {s["jobs_open"]} open jobs · {s["parts"]} purchased parts</div></header>
<p class="lede"><b>{s["jobs_hidden"]} open jobs will run short because a supplier pushed a promise date past the PO due date, and they still look on time</b>
in a due-date view (Time Phase, MRP), because the due date was never changed.
We also set aside {s["slips_harmless"]} supplier slips that don't hit any job, so your team can ignore them.</p>
<div class="tiles">
<div class="tile hot"><b>{s["jobs_hidden"]}</b><span>jobs short on promise dates but on time on due dates</span></div>
<div class="tile"><b>{s["jobs_threatened"] - s["jobs_hidden"]}</b><span>more jobs already short in a due-date view</span></div>
<div class="tile"><b>{s["slipped"]}</b><span>releases with promise date after due date</span></div>
<div class="tile"><b>{s["slips_harmless"]}</b><span>slips that hit no job: safe to ignore</span></div>
<div class="tile"><b>{money(s["orders_value"])}</b><span>customer orders behind threatened jobs</span></div>
</div>
<table><thead><tr><th>#</th><th>Job · customer order</th><th>Part</th><th>Supplier · PO</th><th>Due → promise</th><th>Impact</th><th>Due-date view</th><th>Did your team know?</th></tr></thead>
<tbody>{"".join(rows)}</tbody></table>
<div class="foot">
<div><h3>How this was worked out</h3>For each purchased part, on-hand stock and open PO receipts were netted against open job requirements in date order, once on PO due dates and once on supplier promise dates. The table lists job lines that are covered on due dates but short on promise dates. Ranked by jobs starting in the next 3 weeks, then days short, then order value. {s["lines_hidden"]} hidden job lines in total, top {len(top)} shown; {visible} more are already short in a due-date view (all in findings.csv). Also: {s["unacked_14d"]} releases due in the next 14 days have no supplier acknowledgement at all.</div>
<div><h3>Limits, said plainly</h3>Uses only the exports provided. Doesn't yet see allocations, substitutes, safety stock, partial receipts in transit, or multi-level sub-assemblies; your planners will know some of these. "Hidden" means hidden from a due-date view, not from your team: that's what the last column is for. Processed read-only and offline; no AI model saw the data.</div>
</div></div></body></html>"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("folder")
    ap.add_argument("--as-of", default=date.today().isoformat())
    ap.add_argument("--company", default="Sample Machine Works (fictional)")
    ap.add_argument("--sample", action="store_true", help="mark the report as a sample on synthetic data")
    ap.add_argument("--out", default="out")
    a = ap.parse_args()
    summary, findings, unacked = run(a.folder, date.fromisoformat(a.as_of))
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    with open(out / "findings.csv", "w", newline="") as fh:
        if findings:
            w = csv.DictWriter(fh, fieldnames=list(findings[0]))
            w.writeheader()
            w.writerows(findings)
    (out / "summary.json").write_text(json.dumps(summary, indent=2))
    (out / "report.html").write_text(report_html(summary, findings, unacked, a.company, a.sample))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
