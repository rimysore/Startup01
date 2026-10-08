# Metric Studio: prototype

A single-page prototype of the product described in `../PRODUCT.md`, running on **made-up data** for a fictional "Ridgeview University" (about 25,700 work orders, Jan 2025 – Sep 2026, generated from a fixed seed in the page). No employer data is used.

What it shows:
- **Personal dashboards** for three example roles (VP, HVAC supervisor, capital planner). Add, remove and reorder tiles. Layouts are saved in the browser.
- **Metric engine**: every number comes from a written definition (filters, counting unit, date basis, calendar vs working days). Click any number to see its definition, a plain-English readback and the work orders behind it.
- **Certified vs personal metrics**, with an automatic comparison when a personal metric differs from the certified one.
- **Explain your calculation**: describe a metric in words. The assistant (Claude, through the page's `sample` capability) drafts a definition, never a number. Four built-in examples work without AI.
- **Test against a known number**, with an automatic diagnosis of which counting rule explains a gap.
- **Reconciliation checks**: months sum to the total, labor + materials = cost, phases roll up, multi-shop counting, costs still posting.
- **Draft summary**: AI writes bullets from dashboard values only, and every figure is checked against the dashboard.

Open `metric-studio.html` in a browser; the AI features only appear when it's opened as a claude.ai artifact.
