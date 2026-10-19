# CFO note: ExceptionOS v0 (concierge phase)

**No unit economics yet, on purpose.** No real buyer has named a price, so a per-plant margin would be a modelling assumption (round 1's $2,000/month and $117K cash need were exactly that and are retired; see round1/cfo.md). The verdict tool will say **Incomplete** until a buyer names a price.

## What the 90-day test actually costs (all estimates, replace with receipts)

| item | 90 days |
| --- | ---: |
| Founder time | unpaid (the real cost: about 90 days of one person) |
| Laptop tooling: Python, CSV parsing, local Postgres/SQLite, dependency graph, report generator | $0 |
| One small cloud VM or encrypted storage for exports (optional; can stay offline) | ~$0–60 |
| Domain + business email for outreach | ~$20–50 |
| LinkedIn Sales Navigator or similar for finding Epicor machinery shops (optional) | ~$0–300 |
| Mutual NDA + one-page data-handling/deletion statement (template, optional lawyer review) | ~$0–1,500 |
| Travel to 1–2 nearby plants (optional, high value) | ~$0–1,500 |
| **Total** | **~$20–3,400** |

So the concierge test costs hundreds to a few thousand dollars, not $117K. The constraint is founder time and access to five real Epicor shops, not money.

## When unit economics become meaningful
After the first buyer names a price for the continuation. Then: price per plant per month; variable cost per plant (mostly founder/CS hours per audit refresh; measure it on audits 1–3); fixed cost (founder pay when it starts). Run `unit_economics.py` then, and check: does one audit refresh take under ~4 hours of manual work? If it takes days, the business is consulting until that is automated.
