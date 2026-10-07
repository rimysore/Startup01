#!/usr/bin/env python3
"""Score the retrievers on the FIFTH batch (catalogs/test4, independent labels), exactly once.

This file is committed BEFORE the labels for this batch exist and before it is run on them.
What this run is: the first scoring on tools that no retriever setting was ever tuned against
(213 tools, 6 servers: GitLab 118, Mapbox 29, Firecrawl 28, Desktop Commander 26, Puppeteer 7,
Todoist 5), with queries written by an author who never saw the retrievers. What it is not:
a human-labeled set (the author is another instance of the same model family). Candidates and
the default were fixed on the earlier four batches; nothing is tuned here and no default is
changed by this run.

Protocol, fixed in advance (headline and comparisons as in scripts/score_independent.py):

  Headline        `hybrid-rrf+server` (the configured default): recall@5 on user-style queries,
                  agent-style queries and both pooled ("all"), with 95% Wilson intervals.
  Context         the other seven candidates, MRR and recall@10.
  Declared paired comparisons (queries gained g / lost l; the 2-SE bar is g > l and
                  g - l >= 2*sqrt(g + l); nothing is changed because of them)
                    C1 default vs dense       C2 default vs bm25
                    C3 default vs hybrid-rrf  C4 bm25 vs dense      C5 dense+server vs dense
  Declared readings
    R2 the round-2 adoption is CONFIRMED on this batch iff
         (a) C1 on all queries clears the 2-SE bar, AND
         (b) no other candidate beats the default on agent-style queries by the 2-SE bar
             (a PAIRED guard; the earlier fixed "within 1 point of the best" guard was a
             two-query rule and decided two earlier runs by a hair, so it is reported here
             as information but does not decide).
       Otherwise NOT CONFIRMED.
    R3 consistency with the earlier independent-label run: the default's user-style recall here is
       CONSISTENT iff the 95% interval contains 86.0% (its pooled value on the four earlier batches);
       otherwise DIFFERENT.
  Reported, not used to decide
    - per server (default, bm25, dense) user-style and agent-style recall, and a pooled view
      WITHOUT GitLab (it is 55% of the tools, so the pooled headline is mostly a GitLab result);
    - the macro-average over the six servers;
    - user-style recall by how many words the query shares with its tool's name.
  Not allowed     editing labels or retrievers after seeing the result.

`--labels` and `--out` exist so the script can be dry-run on other label files (the real run uses
the defaults: queries/independent/fifth-test.jsonl and results/fifth-score).
"""

from __future__ import annotations

import argparse
import json
import math
import platform
import sys
from importlib.metadata import version
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import score_independent as si  # noqa: E402  (wilson, clears, overlap_stratum, COMPARISONS)
import select_default_v2 as sel  # noqa: E402
import server_name_experiment as sne  # noqa: E402

from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import wordllama_embedder  # noqa: E402
from toolslim.labels import as_query_sets, check_labels, load_labels, name_overlap  # noqa: E402

HEADLINE = si.HEADLINE
COMPARISONS = si.COMPARISONS
EARLIER_USER_RECALL = 0.860  # the default's pooled user-style recall on the four earlier batches
OLD_GUARD = 0.01  # reported only
BIG_SERVER = "gitlab"


# ------------------------------------------------------------------ pure helpers (unit-tested)
def agent_guard_paired(hits_agent, headline=HEADLINE):
    """(b): True iff no other candidate beats `headline` on agent-style queries by the 2-SE bar."""
    h = hits_agent[headline]
    beaten_by = []
    for v, hv in hits_agent.items():
        if v == headline:
            continue
        g = sum(a and not b for a, b in zip(hv, h))  # v hits, headline misses
        l = sum(b and not a for a, b in zip(hv, h))
        if si.clears(g, l):
            beaten_by.append(v)
    return not beaten_by, beaten_by


def readings(c1_all_gl, hits_agent, user_ci, headline=HEADLINE):
    guard_ok, beaten_by = agent_guard_paired(hits_agent, headline)
    a_ok = si.clears(*c1_all_gl)
    best = max(sum(h) / len(h) for h in hits_agent.values())
    mine = sum(hits_agent[headline]) / len(hits_agent[headline])
    lo, hi = user_ci
    return {
        "R2_a_c1_clears": a_ok,
        "R2_b_no_significantly_better_on_agent": guard_ok,
        "R2_beaten_on_agent_by": beaten_by,
        "R2_confirmed": a_ok and guard_ok,
        "old_guard_within_1pt_info_only": mine >= best - OLD_GUARD - 1e-12,
        "R3_user_recall_consistent_with_earlier": lo <= EARLIER_USER_RECALL <= hi,
    }


# ------------------------------------------------------------------ main
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--labels", default=str(ROOT / "queries" / "independent" / "fifth-test.jsonl"))
    ap.add_argument("--out", default=str(ROOT / "results" / "fifth-score"), help="prefix; writes <prefix>.txt and <prefix>.json")
    args = ap.parse_args()

    lines: list[str] = []

    def say(text: str = "") -> None:
        print(text)
        lines.append(text)

    tools = load_catalogs([ROOT / "catalogs" / "test4"])
    server_of = {t.name: t.server for t in tools}
    labels = load_labels(Path(args.labels))
    problems = check_labels(labels, tools).errors
    if problems:
        sys.exit("labels do not match the catalog:\n  " + "\n  ".join(problems))
    embed = wordllama_embedder()
    retrievers = sel.build_variants(tools, embed)
    variants = sel.SIMPLICITY
    qsets = as_query_sets(labels)
    ranks = {v: {st: sne.ranks(retrievers[v], qsets[st]) for st in ("user", "agent")} for v in variants}
    n = {st: len(qsets[st]) for st in ("user", "agent")}
    hit = lambda v, st: [sne.hit5(r) for r in ranks[v][st]]  # noqa: E731
    pooled = lambda v: hit(v, "user") + hit(v, "agent")  # noqa: E731
    rec = lambda h: sum(h) / len(h) if h else float("nan")  # noqa: E731

    say(f"Fifth batch, independent labels: {n['user']} user-style + {n['agent']} agent-style queries over {len(tools)} tools / {len({t.server for t in tools})} servers")
    say()
    say(f"{'retriever':<26}{'user r@5':>10}{'95% CI':>16}{'MRR':>6}{'r@10':>7}{'agent r@5':>11}{'all':>8}")
    table = {}
    for v in variants:
        u, a = sne.summary(ranks[v]["user"]), sne.summary(ranks[v]["agent"])
        lo, hi = si.wilson(round(u["recall5"] * n["user"]), n["user"])
        table[v] = {"user": u, "agent": a, "user_ci95": [lo, hi], "all_recall5": rec(pooled(v))}
        say(f"{v:<26}{u['recall5']:>10.1%}{f'[{lo:.0%}, {hi:.0%}]':>16}{u['mrr']:>6.2f}{u['recall10']:>7.1%}{a['recall5']:>11.1%}{table[v]['all_recall5']:>8.1%}{'  <- HEADLINE' if v == HEADLINE else ''}")

    say()
    say("Declared paired comparisons (A vs B; gained = A hits and B misses):")
    comps = {}
    for tag, (a_, b_) in COMPARISONS.items():
        comps[tag] = {"a": a_, "b": b_}
        for name, ha, hb in (("user", hit(a_, "user"), hit(b_, "user")), ("agent", hit(a_, "agent"), hit(b_, "agent")), ("all", pooled(a_), pooled(b_))):
            g = sum(x and not y for x, y in zip(ha, hb))
            l = sum(y and not x for x, y in zip(ha, hb))
            comps[tag][name] = {"gained": g, "lost": l, "clears_2se": si.clears(g, l)}
            say(f"  {tag} {a_} vs {b_:<10} {name:<6}: gained {g:>3}, lost {l:>3}, net {g - l:+4d} (2-SE bar {2 * math.sqrt(g + l):4.1f}; {'clears' if si.clears(g, l) else 'does not clear'})")

    c1 = comps["C1"]["all"]
    rd = readings((c1["gained"], c1["lost"]), {v: hit(v, "agent") for v in variants}, table[HEADLINE]["user_ci95"])
    say()
    best_agent = max(table[v]["agent"]["recall5"] for v in variants)
    say(f"R2: (a) C1 on all queries clears the 2-SE bar: {'yes' if rd['R2_a_c1_clears'] else 'NO'}; "
        f"(b) no candidate beats the default on agent-style queries by the 2-SE bar: {'yes' if rd['R2_b_no_significantly_better_on_agent'] else 'NO, beaten by ' + ', '.join(rd['R2_beaten_on_agent_by'])}"
        f"  ->  round-2 adoption {'CONFIRMED' if rd['R2_confirmed'] else 'NOT CONFIRMED'} (no default is changed by this run)")
    say(f"    for information, the old fixed guard (within 1 point of the best, {best_agent:.1%}): {'would pass' if rd['old_guard_within_1pt_info_only'] else 'would fail'} (default {table[HEADLINE]['agent']['recall5']:.1%})")
    lo, hi = table[HEADLINE]["user_ci95"]
    say(f"R3: user-style recall {table[HEADLINE]['user']['recall5']:.1%} [{lo:.1%}, {hi:.1%}] vs {EARLIER_USER_RECALL:.1%} on the earlier batches: {'CONSISTENT' if rd['R3_user_recall_consistent_with_earlier'] else 'DIFFERENT'}")

    say()
    say("Reported, not decided: recall@5 by server (user-style / agent-style) for the default, bm25 and dense")
    servers = sorted({server_of[lb.expected[0]] for lb in labels})
    first_server = {st: [server_of[exp[0]] for _, exp in qsets[st]] for st in ("user", "agent")}
    per_server = {}
    say(f"{'server':<20}{'tools':>6}{'n(u/a)':>9}" + "".join(f"{v[:17]:>20}" for v in (HEADLINE, "bm25", "dense")))
    for srv in servers:
        row = {}
        for v in (HEADLINE, "bm25", "dense"):
            ru = rec([h for h, s in zip(hit(v, "user"), first_server["user"]) if s == srv])
            ra = rec([h for h, s in zip(hit(v, "agent"), first_server["agent"]) if s == srv])
            row[v] = {"user": ru, "agent": ra}
        nu = sum(s == srv for s in first_server["user"])
        na = sum(s == srv for s in first_server["agent"])
        per_server[srv] = {"n_user": nu, "n_agent": na, **row}
        say(f"{srv:<20}{sum(t.server == srv for t in tools):>6}{f'{nu}/{na}':>9}" + "".join(f"{row[v]['user']:>12.0%} / {row[v]['agent']:.0%}" for v in (HEADLINE, "bm25", "dense")))
    macro = {v: {st: sum(per_server[s][v][st] for s in servers) / len(servers) for st in ("user", "agent")} for v in (HEADLINE, "bm25", "dense")}
    say("macro-average over servers (user / agent): " + "; ".join(f"{v} {m['user']:.1%} / {m['agent']:.1%}" for v, m in macro.items()))
    excl = {}
    for v in (HEADLINE, "bm25", "dense"):
        eu = [h for h, s in zip(hit(v, "user"), first_server["user"]) if s != BIG_SERVER]
        ea = [h for h, s in zip(hit(v, "agent"), first_server["agent"]) if s != BIG_SERVER]
        excl[v] = {"user": rec(eu), "agent": rec(ea), "n_user": len(eu), "n_agent": len(ea)}
    say(f"pooled WITHOUT {BIG_SERVER} (user / agent): " + "; ".join(f"{v} {m['user']:.1%} / {m['agent']:.1%}" for v, m in excl.items()) + f" (n = {excl[HEADLINE]['n_user']}/{excl[HEADLINE]['n_agent']})")

    say()
    say("Reported, not decided: user-style recall@5 by how many words the query shares with its tool's name")
    strata: dict[str, list[int]] = {}
    for i, (q, exp) in enumerate(qsets["user"]):
        strata.setdefault(si.overlap_stratum(name_overlap(q, exp[0])), []).append(i)
    strat_out = {}
    say(f"{'overlap':<14}{'n':>5}{'bm25':>9}{'dense':>9}{HEADLINE:>20}")
    for s in ("none", "some", "half or more"):
        idx = strata.get(s, [])
        if not idx:
            continue
        row = {v: rec([hit(v, "user")[i] for i in idx]) for v in ("bm25", "dense", HEADLINE)}
        strat_out[s] = {"n": len(idx), **row}
        say(f"{s:<14}{len(idx):>5}{row['bm25']:>9.1%}{row['dense']:>9.1%}{row[HEADLINE]:>20.1%}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    out.with_suffix(".json").write_text(json.dumps({
        "headline": {"retriever": HEADLINE, **table[HEADLINE]},
        "table": table,
        "comparisons": comps,
        "readings": rd,
        "per_server": per_server,
        "macro_average_over_servers": macro,
        "pooled_without_big_server": {"server": BIG_SERVER, **excl},
        "overlap_strata_user": strat_out,
        "sizes": {"queries": n, "tools": len(tools)},
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
        "caveat": "independent labels (another model instance) on tools not used for tuning; no default is changed by this run",
    }, indent=2) + "\n")
    say(f"\nwrote {out.with_suffix('.txt')} and {out.with_suffix('.json')}")


if __name__ == "__main__":
    main()
