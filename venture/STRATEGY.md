# Going forward: building Capital Plan Copilot as B2B SaaS

Written 2026-10-08. Prices, timelines and cycle lengths marked *(assumption)* need checking in customer interviews.

## Short answer
Yes. This is **vertical B2B SaaS**: software sold to institutions (universities first, then school districts, local governments and hospitals) for one industry's workflow. It becomes "enterprise software" as we move up to large systems, which bring security reviews, single sign-on (SSO), procurement and multi-year contracts.

We don't start there. We **start as a service, turn the repeated work into product, sell to mid-size institutions first, and become enterprise-ready in year 2.**

## What kind of business this is
| | Consumer app (old idea) | This |
|---|---|---|
| Customer | Individuals | Institutions (a VP or director buys, a team uses) |
| Price | $5–8/month | ~$12k–100k+/year per institution *(assumption)* |
| Customers needed for $1M ARR | ~12,000 paying users | ~20–40 institutions *(assumption)* |
| Sales | Ads, app stores | Relationships, pilots, referrals, conferences |
| Main risk | Users churn | Long sales cycles, data trust |

Institutional sales are slow. Institutional customers stay for years, and their annual contract value (ACV) goes up as they add modules and campuses.

## The four stages

### Stage 0: "service as software" (now → month 3)
- Do the work **for** 2–3 design partners: they send AiM and e-Builder exports and spreadsheets, and we deliver the analysis, KPIs and a draft board report, using AI plus human checking.
- Charge a small fixed fee if possible *(e.g. $5–15k pilot, assumption)*. Payment proves the pain; free pilots prove politeness.
- Write down every step we repeat. **That list is the product spec.**

### Stage 1: MVP product (months 3–9)
- Secure web app, one workspace per institution.
- **Upload first, integrations later:** users drop in standard AiM, e-Builder and Excel exports. No API work and no IT project for the customer, so the sale is faster.
- Core features: clean register with reconciliation checks, KPI dashboard (efficiency, backlog, project variance), scenario planner, board-report generator, Q&A with citations.
- Goal: a new customer gets a first report in under 2 weeks, with no custom code.

### Stage 2: enterprise-ready (months 9–18)
- **Connectors:** scheduled sync from AiM, e-Builder, finance systems and condition-assessment data, through vendor APIs or scheduled exports where available.
- **What large institutions require before buying:**
  - SSO (SAML), user roles, audit log
  - **SOC 2** (Type I, then Type II)
  - **HECVAT**, the higher-ed security questionnaire
  - **VPAT** / WCAG accessibility conformance
  - Data processing agreement; data stays the customer's
- **Contracts:** cooperative purchasing agreements (higher-ed and public-sector co-ops) so public institutions can buy without a full RFP.

### Stage 3: scale (months 18–36)
- Same core, new segments: K-12 districts, cities and counties, hospital and health-system facilities.
- **Channels:** facilities consultants, condition-assessment firms and integrators who resell or refer. Incumbent vendors become partners or acquirers.
- **Expansion revenue:** more campuses in a system, more modules (energy, space utilization, compliance).

## How the product is built (so it can scale)
```
Sources        AiM · e-Builder · finance · FCAs (PDF) · Excel
                 │  upload (Stage 1) → connectors (Stage 2)
Data layer     one standard facilities data model:
               buildings · assets · condition · work orders · projects · funding
                 │
Metrics engine deterministic calculations (FCI, backlog, variance, KPIs)
                 │  every number is computed, never guessed by AI
AI layer       extraction from messy files · Q&A · narrative drafting
               always cites the source rows behind each figure
                 │
Outputs        dashboards · scenarios · board reports in the client's template
```
**Rule we never break:** the AI reads documents and writes the narrative. **Math is done by code**, and every figure links to its source row. Trust is the product.

**One model for everyone:** each customer's data maps into the same standard model. Per-customer differences live in configuration (templates, KPI definitions), never in custom code. This is the line between a SaaS company and a consulting shop.

## Metrics we'll track
- Pilot → paid conversion; time to first report
- ARR, ACV, number of institutions
- Net revenue retention (target >110% once expansion modules exist, *assumption*)
- Sales-cycle length (expect 3–9 months, with budgets tied to the July fiscal year, *assumption*)
- Weekly active users per customer (does the team actually use it?)

## Funding path
1. **Now:** pitch competitions and grants, plus paid pilots. Spend almost nothing.
2. **Pre-seed** after 2–3 paying design partners: hire the technical cofounder or first engineer and build Stage 1.
3. **Seed** at roughly $300k–1M ARR with strong retention *(assumption)*, to fund enterprise readiness and the first salesperson.
4. Look for investors who back **vertical SaaS, GovTech or EdTech**. They understand slow sales cycles and sticky customers.

## Biggest risks and our answers
| Risk | Answer |
|---|---|
| Sales cycles too long for a small team | Start with mid-size private colleges; paid pilots; co-op contracts later |
| Becoming a consulting shop | Standard data model, configuration not code, productize anything we repeat |
| AI makes a wrong number in a board report | Deterministic metrics engine, citations, a human check in pilots |
| Incumbents add AI features | Move fast; work across *all* their systems, which each of them can't; partner where possible |
| Security reviews block deals | Start SOC 2 and HECVAT in Stage 2, before the first large system deal |
| Employer conflict | Policies checked, no employer data, personal time and devices; employer only as a customer through proper channels |

## Decisions for us to make next
1. Do we charge for the first pilots? **Recommendation: yes, even a small amount.**
2. Pick the first 3 design-partner targets: mid-size institutions outside our own.
3. Find the technical cofounder before Stage 1 starts.
