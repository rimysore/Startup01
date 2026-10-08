"""Build capital-plan-copilot.html from template.html and the extracted register CSV."""
import csv
import json

INT_FIELDS = {"total_cost", "dm_investment", "campus_reserves", "external", "borrowed", "state"}

rows = []
for r in csv.DictReader(open("data/umass_amherst_projects.csv")):
    rows.append({k: int(v) if k in INT_FIELDS else v for k, v in r.items()})
html = open("template.html").read().replace("__PROJECTS__", json.dumps(rows))
open("capital-plan-copilot.html", "w").write(html)
print(f"wrote capital-plan-copilot.html with {len(rows)} projects")
