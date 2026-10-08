# Product design: configurable dashboards on a calculation engine

Written 2026-10-08. Contains no employer data; the examples are generic.

## Principle
**Code calculates. People define. AI only translates and writes.**
- Every number comes from an explicit, versioned **metric definition** run by a deterministic engine.
- AI helps people **write** definitions in plain English and **draft narrative** around computed numbers. It never produces a number itself.
- Every figure on screen can be clicked to show its definition, the filters applied and the source rows.

## 1. Metric library (ships standard)
A starter library for **work-order performance**, the first module. These are common facilities metrics every campus with a CMMS asks about:

| Group | Metrics |
|---|---|
| Volume | Work orders by month / priority / shop / building; per working day; year-over-year change |
| Speed | Median days entered → closed by priority; % closed same day / ≤1 / ≤3 / ≤7 / ≤30 days; open backlog and age |
| Coverage | Share raised at night or on weekends; multi-shop (multi-crew) jobs |
| Cost | Labor vs materials; cost by month raised; material attach rate; median and mean material cost; jobs over a threshold and their share of spend |
| Concentration | How many buildings make up 50% of volume or cost (Pareto); top buildings by count, cost and materials |
| Workforce | Technicians closing work; labor hours; work orders per technician |

Later modules: capital projects (budget vs actual, change-order %, schedule variance, funding sources) and condition (FCI, backlog, keep-up vs target).

## 2. Definitions are explicit, and the rules are the product
Facilities numbers differ between institutions because of **counting rules**, not math. Each metric stores its rules as settings, not hidden code:

```
metric: "Emergencies closed within 1 day"
source: work_orders
filter: priority = "Emergency" AND campus = <selected> AND date_raised in <period>
grain:  one row per work order (phases rolled up; costs summed across phases)
measure: share where (date_closed - date_entered) <= 1 calendar day
time basis: month the work order was raised
calendar: institution working-day calendar (holidays excluded)
caveat: recent months marked "costs still posting"
owner: <name> · status: certified · version: 3 · last changed: <date>
```

Rules we must support from day one: phase roll-up, which date drives the period (raised, closed, posted), calendar vs working days, what counts as "closed", multi-shop counting (once per order vs once per shop), and pending-cost flags for recent months.

## 3. "Explain your calculation" chat
How custom metrics and reconciliations get built:
1. The user describes it in words: *"Count urgent and emergency orders once, add up all phase costs, and compare each month with the same month last year."*
2. AI drafts a **formal definition** (the format above), not a number.
3. The app shows a **plain-English readback**, the generated rules and **sample rows** it would include and exclude.
4. **Test against a known number:** "Your last report said 1,905 for January. This definition gives 1,905 ✓". Mismatches show which rows differ.
5. The user approves. The definition is saved, versioned and runs deterministically from then on.

Reconciliations work the same way: "Total cost in AiM should equal the finance ledger for the same accounts, within $X" becomes a rule that runs on every refresh and raises a flag when it breaks.

## 4. Everyone builds their own dashboard
- Each user composes tiles from approved metrics: KPI tile, trend, ranking, table, comparison (this period vs last).
- Personal filters and layouts are saved per user (a VP sees the campus; a shop supervisor sees their shop).
- **Certified vs personal metrics:** leadership-facing dashboards use only certified definitions. Personal variants are allowed but labeled, and the app shows how they differ from the certified version, so two people never quietly report two different "closure rates".
- Roles: viewer, builder, metric owner, admin.

## 5. Reports from the same definitions
- A report template (sections, KPI tiles, tables, charts) is filled from certified metrics on a schedule (monthly or year-to-date).
- AI drafts the narrative ("September is the busiest month…") **only from computed values**. Each number in the text is tagged to its metric so it can be checked.
- Built-in checks before sending: parts sum to totals, months sum to year-to-date, recent-month caveats are present.

## 6. Why this beats the alternatives
| | Vendor AI (inside one system) | Power BI / DIY | Us |
|---|---|---|---|
| Works across systems | No | Yes, with an IT project | Yes |
| Facilities metric library | Partial | No | Yes |
| Definitions in plain English, versioned, tested | No | Hidden in DAX/SQL | Yes |
| Narrative report drafting | Some | No | Yes, number-tagged |
| Time to first useful dashboard | n/a | Months | Days |

## 7. Build order
1. Upload a work-order export → map columns to the standard model (with AI-suggested mapping and human confirmation).
2. Standard metric library + engine + certified definitions.
3. Personal dashboards.
4. Calculation chat with test-against-known-number.
5. Scheduled report packs with drafted narrative.
6. Second source (capital projects), then cross-source metrics.
