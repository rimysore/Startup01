# Capital Plan Copilot: demo

A demo of the product idea in `../VERTICALS.md`, built only on public data: the
[UMass FY26–FY30 Capital Plan](https://www.umassp.edu/sites/default/files/publications/budget-office/capital-plans/fy26-30-capital-plan-final-for-website.pdf)
(Board of Trustees, Sept 25, 2025). No IU data is used.

- `extract_umass.py`: pulls the UMass Amherst project register out of the PDF text and reconciles it against the totals printed in the plan.
- `data/umass_amherst_projects.csv`: the clean register (54 projects, $827.6M).
- `template.html` + `build_demo.py`: build `capital-plan-copilot.html`, the demo page.

```bash
python3 extract_umass.py <plan-as-text.txt> data   # re-extract (needs the PDF converted to text)
python3 build_demo.py                              # rebuild the page
```

System-level figures and the building and conceptual-project tables are transcribed by hand from the plan into `template.html`.
