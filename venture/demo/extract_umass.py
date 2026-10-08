"""Turn the UMass FY26-30 capital plan (public PDF, fetched as text) into clean CSVs.

Source: https://www.umassp.edu/sites/default/files/publications/budget-office/capital-plans/fy26-30-capital-plan-final-for-website.pdf
(Board of Trustees, Administration & Finance Committee, September 25, 2025).

Usage: python extract_umass.py <pdf-as-text.txt> <out_dir>
Extracts the UMass Amherst authorized/approved project register and checks it
against the totals printed in the plan.
"""
import csv
import sys

AUTHORITY = {"Board": (1719, 1735), "President": [(1748, 1770), (1777, 1800)]}
PRINTED_TOTALS = {"Board": 638_170_000, "President": 189_405_000}


def num(s):
    s = s.strip().replace(",", "")
    return int(s) if s and s not in {"-", "TBD"} else 0


def rows(lines, start, end):
    for line in lines[start - 1:end]:
        if line.startswith("|"):
            yield [c.strip() for c in line.strip().strip("|").split("|")]


def main(src, out_dir):
    lines = open(src, encoding="utf-8").read().splitlines()
    projects, building_dm = [], {}
    for authority, spans in AUTHORITY.items():
        spans = [spans] if isinstance(spans, tuple) else spans
        for start, end in spans:
            for c in rows(lines, start, end):
                name, building = c[0], c[1]
                if c[2]:
                    building_dm[building] = num(c[2])
                if name in {"Subtotal", "Total"}:
                    continue
                projects.append({
                    "campus": "Amherst", "authority": authority, "project": name,
                    "building": building, "total_cost": num(c[3]),
                    "dm_investment": num(c[4]), "campus_reserves": num(c[5]),
                    "external": num(c[6]), "borrowed": num(c[7]), "state": num(c[8]),
                    "status": c[9],
                })
    for p in projects:
        p["building_dm_backlog"] = building_dm.get(p["building"], "")

    # Every table row as extracted, including subtotal and total lines, so the
    # double counting a naive extraction would cause can be shown and checked.
    extracted = []
    for authority, spans in AUTHORITY.items():
        spans = [spans] if isinstance(spans, tuple) else spans
        for start, end in spans:
            for c in rows(lines, start, end):
                kind = {"Subtotal": "subtotal", "Total": "total"}.get(c[0], "project")
                extracted.append({
                    "authority": authority, "row_type": kind, "project": c[0], "building": c[1],
                    "building_dm_backlog": num(c[2]), "total_cost": num(c[3]), "dm_investment": num(c[4]),
                    "campus_reserves": num(c[5]), "external": num(c[6]), "borrowed": num(c[7]),
                    "state": num(c[8]), "status": c[9],
                })

    # Reconcile against the totals printed in the plan.
    for authority, printed in PRINTED_TOTALS.items():
        got = sum(p["total_cost"] for p in projects if p["authority"] == authority)
        status = "OK" if got == printed else "MISMATCH"
        print(f"{authority}: extracted {got:,} vs printed {printed:,} -> {status}")
    for p in projects:
        funded = p["campus_reserves"] + p["external"] + p["borrowed"] + p["state"]
        if funded != p["total_cost"]:
            print(f"  funding != cost: {p['project']} ({funded:,} vs {p['total_cost']:,})")

    fields = ["campus", "authority", "project", "building", "building_dm_backlog", "total_cost",
              "dm_investment", "campus_reserves", "external", "borrowed", "state", "status"]
    with open(f"{out_dir}/umass_amherst_projects.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(projects)
    with open(f"{out_dir}/umass_amherst_rows_as_extracted.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(extracted[0].keys()))
        w.writeheader()
        w.writerows(extracted)
    print(f"{len(projects)} projects written; {len(extracted)} rows as extracted")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
