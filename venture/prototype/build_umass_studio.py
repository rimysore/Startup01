"""Build metric-studio-umass.html from umass-template.html and the extracted UMass data.

Inputs (public UMass FY26-30 Capital Plan, Amherst campus):
- ../demo/data/umass_amherst_rows_as_extracted.csv  project, subtotal and total lines
- the plan's alternative-delivery (P3) table and building backlog table, transcribed below
Styles are shared with metric-studio.html.
"""
import csv
import json
import re

INT = {"building_dm_backlog", "total_cost", "dm_investment", "campus_reserves", "external", "borrowed", "state"}

rows = []
for r in csv.DictReader(open("../demo/data/umass_amherst_rows_as_extracted.csv")):
    row = {k: int(v) if k in INT else v for k, v in r.items()}
    row["delivery"] = "Traditional"
    rows.append(row)
# Alternative finance & delivery table: one Amherst P3 project, cost TBD.
rows.append({"authority": "Board", "row_type": "project", "project": "Campus Development Opportunities (P3)", "building": "Campuswide",
             "building_dm_backlog": 0, "total_cost": 0, "dm_investment": 0, "campus_reserves": 0, "external": 0, "borrowed": 0,
             "state": 0, "status": "BOT Vote 1 Authorized (5/22/24), cost TBD", "delivery": "P3"})

# Building backlog: the plan's "Buildings by Total Deferred Maintenance" table ($M, FCI), Lederle rows combined.
PLAN_TOP = {
    "Dubois Library": (116.7, "33%"), "Lederle Graduate Research Center": (90.1, "21–29%"), "Bartlett Hall": (57.8, "62%"),
    "Tobin Hall": (51.6, "58%"), "Morrill Science Center III": (45.2, "87%"), "Fine Arts Center": (44.7, "16%"),
    "Lincoln Campus Center": (41.5, "24%"), "Herter Hall": (33.8, "58%"), "Morrill Science Center I": (31.7, "65%"),
}
projects = [r for r in rows if r["row_type"] == "project" and r["delivery"] == "Traditional"]
register = {}
for r in rows:
    b = r["building"]
    if r["building_dm_backlog"] and b and b not in ("Campuswide", "New Construction"):
        register[b] = r["building_dm_backlog"]
names = sorted(set(register) | set(PLAN_TOP))
buildings = []
for b in names:
    dm = sum(p["dm_investment"] for p in projects if p["building"] == b)
    plan = PLAN_TOP.get(b)
    backlog = register.get(b) or int(round(plan[0] * 1e6))
    buildings.append({"building": b, "backlog": backlog, "fci": plan[1] if plan else "",
                      "authorized_dm": dm, "hasProject": dm > 0, "topBacklog": bool(plan),
                      "registerBacklog": register.get(b, 0), "planBacklog": int(round(plan[0] * 1e6)) if plan else 0})

style = re.search(r"<style>\n(.*?)</style>", open("metric-studio.html").read(), re.S).group(1)
html = (open("umass-template.html").read()
        .replace("__STYLE__", style.strip().replace("--track: #e7ecea;", "--track: #e7ecea;\n  --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #c98500;", 1))
        .replace("__ROWS__", json.dumps(rows))
        .replace("__BUILDINGS__", json.dumps(buildings)))
open("metric-studio-umass.html", "w").write(html)
print(f"wrote metric-studio-umass.html: {len(rows)} table rows, {len(buildings)} buildings")
