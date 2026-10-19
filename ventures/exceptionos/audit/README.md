# Supplier Delay Risk Audit (concierge v0)

Finds supplier promise-date slips that will short open jobs, including the ones a due-date view (Epicor Time
Phase / MRP) still shows as on time. Plain Python 3.10+, standard library only, read-only, offline, no AI.

| file | what it is |
| --- | --- |
| `audit.py` | the engine: nets on-hand + PO receipts against job requirements on due dates and on promise dates; writes `findings.csv`, `summary.json`, `report.html` |
| `sanitize.py` | run at the plant before sending: codes identifiers with the plant's secret, drops prices/descriptions, keeps joins |
| `generate_sample.py` | fictional, Epicor-shaped sample data (no real company) |
| `out/sample-report.pdf` | the one-page sample report to show prospects before they send anything |
| `data-handling.html` / `out/data-handling.pdf` | the one-pager for IT |
| `render.mjs` | HTML → PDF/PNG with Chromium |

```bash
python3 generate_sample.py                                   # fictional data in sample_data/
python3 audit.py sample_data --as-of 2026-10-19 --sample --out out
node render.mjs $PWD/out/report.html $PWD/out/sample-report.pdf $PWD/out/sample-report.png
# a real audit, on sanitized exports:
python3 sanitize.py exports/ sanitized/ --secret "their phrase" --key-file key.csv   # at the plant
python3 audit.py sanitized/ --as-of 2026-11-03 --company "Plant name" --out audits/plant-1
```

## Before you hand out the data-handling page
- Fill the orange placeholders: date, founder name, email, phone, company/website.
- Only keep promises you will actually keep: one encrypted laptop, no uploads, deletion within 30 days with
  written confirmation, no AI. If any of that isn't true for you, change the page, not the practice later.
- It is a plain-language commitment, not a contract. Have a lawyer glance at it, and sign the plant's NDA.

## Known limits (also printed on the report)
No allocations, substitutes, safety stock, in-transit partials or multi-level sub-assemblies yet; ties between
same-day requirements are broken by export row order. Epicor column names vary by version: confirm the export
with the planner on the first call. "Hidden" means hidden from a due-date view, not necessarily from the team:
the "Did your team know?" column on the report is the measurement.
