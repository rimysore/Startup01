# ExceptionOS v0: production-impact intelligence for supplier delivery exceptions in Epicor manufacturers · Business plan

**Verdict: Incomplete**

- ✗ 0 of 20 simulated buyers buy (0%, the bar is 25%).
- No numbers yet. Run /founder-cfo, then compile again.

## The idea

- What it is: ExceptionOS finds supplier delivery changes that put open work orders at risk, before planners discover the shortage manually. Scope v0: ONE exception type (supplier changes a promised delivery date) mapped to ONE downstream object (open work orders, via BOM requirements and current inventory). Outcome: which supplier-date changes actually threaten production, ranked. Positioning: "Your ERP/procurement system tells you what changed. ExceptionOS tells you what the change will break." Complementary to acknowledgement-chasing tools (SourceDay, Didero), not competing with them.
- Who it is for: U.S. machinery/equipment manufacturers, ~50–500 employees, running Epicor Kinetic. Personas: materials/purchasing manager, production planner, buyer; economic buyer supply chain director/COO.
- What it sells, at what price: right now a FREE "Supplier Delay Risk Audit". The manufacturer provides sanitized exports (open PO lines; open work orders/BOM requirements; current inventory if available; supplier acknowledgement/date-change history if available). Processed read-only and offline: no ERP credentials, no inbox access, no write-back, no autonomous agent. Output: the supplier-date exceptions found, the work orders each threatens, our priority order, and a question back: "which of these did your team already know about?" A paid continuation comes only after an audit shows value; its price is NOT set (no real buyer has named one).
- Where and how: founder-led conversations with Epicor machinery shops around one question: "Tell me about the last supplier delivery-date change that threatened an open work order. How did your team discover the impact?" then ask for sanitized exports. Built as a concierge tool: Python + CSVs + a database + BOM/work-order dependency logic + a basic report. No SaaS platform, no polished UI, no agent yet.
- Budget and constraints: pre-MVP. Killer metric: **missed high-impact exceptions found** (production-threatening supplier changes the team had not prioritised). Secondary: hours to detect, investigation hours avoided, work orders affected, expedites avoided, shortages prevented, later dollars protected. Milestone: 5 interviews → 3 willing to share data → 3 free audits → ≥1 meaningful missed exception → 1 paid continuation. Kill rule: if three real datasets show the existing Epicor workflow already identifies and prioritises everything correctly, change the thesis. Team, funding and paid price still unstated. Long-term OS vision is kept internally (../strategy-long-term.md), not pitched.

## Summary

"ExceptionOS finds supplier delivery changes that put open work orders at risk, before planners discover the shortage manually." U.S. machinery shops, 50–500 people, Epicor Kinetic. Free, read-only, offline Supplier Delay Risk Audit on sanitized exports.

**Verdict: Incomplete** (compile.py): correct, because no real buyer has named a price, so there are no unit economics to test. Round 1's $2,000 price and $117K cash need are retired; the concierge test costs ~$20–3,400 plus founder time (cfo.md).

**Board: 3 × FUND IF, 5.3/10 (up from 4.7).** Credit for focus, the one-sentence pitch, lower buyer effort and an honest kill rule. Top shared risk: Epicor may already show it. Other risks: the export burden is now the customer's, no pay signal yet, the moat isn't proprietary yet (pooled supplier-reliability data could become one), false alarms.

**Panel: 0 of 20 would send exports within 30 days; 19 of 20 for trust.** The objection moved. Round 1: "prove it on my data." Round 2: "I can't send my data to an unknown company without IT/legal/Epicor-partner sign-off, and it's half a day of export work." Their flips, in order: a written data-handling/deletion one-pager IT accepts; a sample report on dummy or last year's data BEFORE sending anything; a reference Epicor plant; Epicor partner endorsement; an export template under an hour.

**The sharpest finding (competitors-epicor.md): the wedge is the promise date vs due date gap.** Epicor's Time Phase, MRP, PO suggestions and the Planner Workbench plan on the PO **due date** and ignore the supplier **promise date**; changing the due date means unapproving and re-approving the PO. So a supplier slip that only updates the promise date creates false availability, and no job is flagged until someone re-dates the PO. EpiUsers threads (2017–2025) describe exactly this ("haven't found a fast way to see which jobs are now short"); the workarounds are the Workbench and a PartDtl BAQ. Biggest threat: Epicor's own Prism agents (demoed 2026, Kinetic Cloud, no public promise-date spec). Verdict: partly solved, with a specific hole.

**So v0 becomes even sharper:** "Every supplier promise date that slipped past the PO due date, and the jobs it will now short, ranked by days short against operation start."

**Do this week (in this order):**
1. Build the sample report on synthetic Epicor-shaped data (no customer data needed) and a one-page data-handling statement (what you receive, where it sits, deletion in 30 days, no AI training, no Epicor access).
2. Write the export spec: the exact Epicor BAQ (PO release due vs promise date, PartDtl requirements by job, on-hand), under an hour for a planner, keys preserved.
3. Offer a second path that sends nothing: you run the script on their laptop over a screen-share, or they run it themselves.
4. Five interviews; first question: "When a supplier slips, do your buyers update the due date or only the promise date?" Then: "Tell me the last one that threatened a job."
5. Talk to two Epicor partners (VARs/consultants): they are the trust and distribution channel buyers named.

Milestone unchanged: 5 interviews → 3 sharing data → 3 audits → ≥1 missed high-impact exception (confirmed by the customer, and also missed by Epicor's native views) → 1 buyer names and pays a price.

Simulated buyers lean agreeable; real interviews decide. Not financial, legal or tax advice.

## What the board said

**Vote: 3 FUND IF. Average 5.3 / 10** (Offers 5, Monopoly 5 ↑ from 4, Product 6 ↑ from 5). Round 1 was 4.7.

### What all three credit
Narrowed to one sentence, one exception, one object, one ERP, one vertical ("tells you what the change will break"); OS off the pitch; buyer effort and IT friction lower (no credentials, inbox or write-back); a countable killer metric and an honest kill rule. Round-1 conditions: narrowing **met**, OS off roadmap **met**, written offer / accuracy bar / incumbent map **partly met**, design partners, paid pilot, channel and team **not met**.

### Risks more than one member raised (most dangerous first)
1. **Epicor already shows it.** (all three) Time Phase, shortage reports and MRP may surface the same threatened jobs; then the audit is a reformatted screen. Check this BEFORE audit 1. See competitors-epicor.md.
2. **The export is now the customer's job and can break the experience.** (Product, Offers) Which Epicor reports, how many hours, and sanitizing can strip the keys that join POs to BOMs; without date-change history a single snapshot shows current dates, not changes; without inventory every late PO looks threatening.
3. **No pay signal.** (Offers, Monopoly) Free audit ends at "thanks" unless the next step has a scope, a price and a dollar anchor (line stop, expedite, late order).
4. **The moat isn't proprietary yet.** (Monopoly) The per-customer graph is rebuilt from data Epicor and SourceDay already hold; "complementary" is one feature away from being copied by the partner. The thing that could compound: pooled supplier-reliability data across customers.
5. **False alarms kill trust.** (Product) Multi-level BOMs, substitutes, allocations, safety stock, partial receipts; no false-alarm ceiling set.

### Conditions (merged checklist)
- [ ] Side-by-side: Epicor's native shortage/Time Phase view vs the audit on the same data, before audit 1. (all)
- [ ] Written export spec: Epicor reports/BAQs, fields, join keys, sanitization that keeps joins, under an hour for a planner; tested on sandbox or synthetic data. (Product)
- [ ] Accuracy bar set before audit 1: max false alarms in the top 10; "missed" confirmed by the customer. (Product)
- [ ] One-page report mock-up reviewed by one planner. (Product)
- [ ] 3 audits with a written "did your team already know?" and ≥1 high-impact miss Epicor's native reports also missed. (all)
- [ ] One buyer names a price and pays, even a small one; paid continuation scoped with a dollar anchor. (Offers, Monopoly)
- [ ] One-page moat plan on a cross-customer asset (supplier reliability) or a channel; decide whether SourceDay/Epicor partners are partners or threats; named team; path to 100. (Monopoly)

## The competition

Public sources only. Full rows with links are in `competitors.csv`. G2 returned 403, Coupa and Jaggaer were blocked by bot protection, and Didero's, Lumari's and Leverage's review pages could not be found, so the review evidence is thin.

### 1. Who is there (most direct first)

| # | Name | Type | What it actually does for PO/delivery exceptions | Public price |
|---|---|---|---|---|
| 1 | [Didero](https://www.didero.ai/) | Direct | AI agents for PO management, supplier communication, logistics & delivery and "exception handling" on top of email + ERP. Claims "100+ mid-market and enterprise deployments" | None |
| 2 | [Lumari](https://www.ycombinator.com/companies/lumari) (YC Spring 2025) | Direct | "Handles the manual chase: quote follow-ups, PO confirmations, delivery status updates, and risk escalation". Email-native: "No portal required" | None |
| 3 | [Leverage AI](https://www.tryleverage.ai/) | Direct | Automated supplier follow-ups, acknowledgements, open-order reports and delay tracking "right in your ERP" | None |
| 4 | [SourceDay](https://sourceday.com/) | Direct | AI-driven supplier portal: "Stop chasing suppliers for updates on dates, prices, and quantities". [Epicor reseller](https://www.epicor.com/en/blog/technology-and-data/sourceday-and-epicor-join-forces/) | ["Contact vendor"](https://www.capterra.com/p/187682/SourceDay/) |
| 5 | [Kavida.ai → QAD Redzone](https://www.qad.com/about/news/-/room/read/2025/qad-redzone-acquires-kavida-ai-freeing-up-to-50-of-manufacturing-buyers-time) | Direct (now ERP-owned) | Email PO agent for date/qty/price changes, offered to QAD Redzone customers | None |
| 6 | [Axya](https://www.axya.co/) | Direct | "Sourcing, purchase orders, and supplier follow-up alongside your ERP". Deep [Infor integration](https://procurementmag.com/news/axya-raises-17m-cad-series-a-to-scale-ai-procurement) | None |
| 7 | [D365 Supplier Communications Agent](https://www.sikich.com/insight/from-inbox-chaos-to-proactive-procurement-meet-the-d365-finance-supply-chain-management-supplier-communications-agent/) | Direct (ERP-native) | Automates follow-ups to confirm dates and quantities, reads replies, proposes PO updates and flags exceptions. D365 F&SCM only, ["production ready preview"](https://learn.microsoft.com/en-us/dynamics365/supply-chain/faq-supplier-communications-agent) | Not confirmed |
| 8 | [Spendflo PO-ack agent](https://www.spendflo.com/agents/ai-purchase-order-acknowledgment-agent) | Direct-adjacent | Matches confirmations to POs, lists the differences and drafts chases. Mostly indirect/SaaS spend | None |
| 9 | [Magentic](https://tech.eu/2026/09/17/magentic-raises-18m-to-automate-industrial-operations-with-ai-agents/) | Direct-adjacent | Procurement agents for manufacturers, from supplier selection to invoice. Global 500 focus | None |
| 10 | [Epicor Prism](https://www.businesswire.com/news/home/20250903859301/en/Epicor-Launches-Industrys-First-ERP-AI-Agent-with-Outcomes-Based-Pricing-to-Accelerate-Supplier-Decisions) | Indirect (ERP) | RFQ and quote-to-PO agent in Kinetic. No public sign it handles acknowledgements | Outcomes-based (pay per RFQ→PO), no amount |
| 11 | [SupplyOn](https://www.supplyon.com/en/), [NetSuite custom portal](https://ecosire.com/de/apps/netsuite/netsuite-vendor-self-service-portal) | Indirect (portal) | PO & confirmation modules. The supplier has to log in | None |
| 12 | [Netstock](https://www.netstock.com/pricing/), [Kinaxis](https://www.kinaxis.com/en), [o9](https://o9solutions.com/) | Indirect (planning) | Plan inventory and supply. They do not chase suppliers | Netstock "starts at $900/month" (annual); others none |
| 13 | [Prewave](https://www.prewave.com/), [Everstream](https://www.everstream.ai/), [Interos](https://www.interos.ai/) | Indirect (risk) | Event- and supplier-level risk, not PO lines | [Quote-based](https://erpresearch.com/erp-add-ons/supplier-management/prewave) |
| 14 | [Tacto](https://www.tacto.ai/en), [Lio](https://techcrunch.com/2026/03/05/lio-ai-series-a-a16z-30m-raise-automate-enterprise-procurement/), [Fairmarkit](https://www.fairmarkit.com/), [Keelvar](https://www.keelvar.com/), [Arkestro](https://www.arkestro.com/), [Zip](https://ziphq.com/) | Indirect (sourcing/intake) | Sourcing, intake and negotiation. No public delivery-exception workflow found | None |
| S1 | Excel open-PO tracker + Outlook | Substitute | Mid-market procurement still runs on ["decentralized, error-prone Excel spreadsheets"](https://www.tacto.ai/en/resources-posts/tacto-secures-50-million-to-build-future-proof-supply-chains-for-the-mid-market) | Staff time |
| S2 | [Offshore expediting VA](https://stealthagents.com/manufacturing-supplier-expediting-virtual-assistant) | Substitute | A person tracks promised dates and escalates shortages | "From $10/hour" (≈$20.8K/yr full-time, our arithmetic) |
| S3 | [Copilot Studio reference architecture](https://learn.microsoft.com/en-us/power-platform/architecture/reference-architectures/order-acknowledgment-validation) | Substitute (DIY) | Microsoft's own blueprint: extract acknowledgements, compare them with POs, apply tolerances, escalate "only genuine discrepancies" | Capacity credits + build effort |

Checked and left out: **Arda** has two meanings. [Bob McGrew's Arda](https://tech.slashdot.org/story/26/03/08/0253259/) is building factory video and robotics automation, and [arda.cards](https://www.capterra.com/p/10043674/Arda/) is kanban replenishment at $149/user/month. Neither handles PO exceptions. [Tradeswell](https://vcnewsdaily.com/tradeswell/venture-capital-funding/dzkbydlrgf) is e-commerce software. I found no public acknowledgement feature for Arkestro.

### 2. Price range

No direct AI competitor publishes a price, so every one is demo-only. The only public anchors:

- **Low:** offshore VA from $10/hr, about $20.8K/yr
- **Mid:** Netstock planning from $10.8K/yr ($900 × 12)
- **High:** not public
- **Median:** cannot be computed from public data
- **Pricing models:** Epicor Prism is outcomes-based, Arda is per seat, Microsoft charges capacity credits. Expect quote-only pricing from every direct player.

### 3. Funding of direct players

| Company | Funding (public) |
|---|---|
| Didero | $30M Series A, Feb 2026 (Chemistry, Headline, M12/Microsoft) + $7M seed 2024, ≈$37M total ([SiliconANGLE](https://siliconangle.com/2026/02/12/didero-raises-30m-series-expand-agentic-ai-enterprise-procurement/)) |
| SourceDay | $31.5M Series C 2022 (Norwest), $54.8M total ([BusinessWire](https://www.businesswire.com/news/home/20220215005519/en/SourceDay-Closes-31.5-Million-Series-C-Funding-Following-Record-Breaking-Year-of-Customer-Growth)) |
| Magentic | $18M Series A, Sep 2026 (Felicis, Sequoia) ([tech.eu](https://tech.eu/2026/09/17/magentic-raises-18m-to-automate-industrial-operations-with-ai-agents/)) |
| Axya | CAD 17M (US$12.6M) Series A, Sep 2026 (McRock) ([BetaKit](https://betakit.com/axya-closes-17-million-series-a-to-modernize-manufacturing-procurement/)) |
| Leverage AI | $7M, Jul 2023 (Chicago Ventures), ≈$13.9M total ([AccessWire](https://www.accessnewswire.com/newsroom/en/transportation/leverage-raises-7m-to-modernize-global-supply-chains-with-visibility-platform-767961), [AlleyWatch](https://alleywatch.com/2023/07/leverage-automated-supply-chain-visibility-platform-nadav-ullman/)) |
| Lumari | YC. About $500K per [aggregator](https://www.caplight.com/company/lumari), not confirmed |
| Kavida.ai | About $1–2M (sources conflict), then acquired by QAD Nov 2025 ([BusinessWire](https://www.businesswire.com/news/home/20251111766416/en/QAD-Redzone-Acquires-Kavida.ai-Freeing-up-to-50-of-Manufacturing-Buyers-Time)) |
| Adjacent | Lio $30M A, Mar 2026 (a16z). Tacto $50M, Dec 2023 (Sequoia, Index) |

### 4. Positioning map (how a purchasing manager would see it)

- **X axis:** supplier effort. On the left the supplier must log into a portal; on the right it works over the email the supplier already sends.
- **Y axis:** what decides priority. At the bottom it is PO status or date; at the top it is the impact on work orders, customer orders and revenue.

```
 impact-ranked ^
               | Netstock/Kinaxis/o9 (impact-aware, no supplier chasing)
               |                                  [ EMPTY: email-native + work-order impact,
               |                                    mid-market ERPs ]   <- ExceptionOS target
               | Prewave/Everstream (event risk)  Didero (claims exceptions + planning)
               |
 PO-status     | SourceDay, SupplyOn,     Leverage   Lumari, Kavida/QAD, Axya,
               | NetSuite portal                     D365 agent, Spendflo, Excel+VA
               +----------------------------------------------------------------->
                 portal required                                      email-native
```

None of the public pages I read says it ranks supplier exceptions by downstream work-order or customer-order impact. Didero sits closest, because its pages pair "exception handling" with "Planning & Replenishment".

### 5. Complaints (ranked)

1. **Exception handling is still hard** (thin, 1 review). A SourceDay user: "We are still trying to figure out how to use PO Exceptions and has turned into more of a headache than anything else" ([Capterra](https://www.capterra.com/p/187682/SourceDay/reviews/)).
2. **Supplier info sits outside the structured fields, so buyers chase anyway** (thin, 2). One SourceDay user: "We still have to request weekly order reports from vendors due to the 'comment' section in Sourceday isn't super accessible. Unfortunately a lot of our shipments are partials". Another: "Supplier comments cannot be easily copied from the approval tab" ([Capterra](https://www.capterra.com/p/187682/SourceDay/reviews/)).
3. **Planning tools are blind to live supplier status** (thin, 2). Netstock users: "The lack of live data has been a real challenge when looking for backordered items specifically", and "I would like to see features open up where information can be written back and forth between the ERP and Netstock" ([Capterra](https://www.capterra.com/p/152724/NETSTOCK/reviews/)).
4. **Reporting is rigid** (4+ reviews across both tools). "Limited report options." and "there could be more reports or customizable by the user" (SourceDay). "Program will only let you export reports with 10,000 sku's" (Netstock).
5. **Slow fixes and learning curve** (3+). "It can take a while to resolve issues" (SourceDay). "There has been a steep learning curve with the setup" (Netstock).

The tools are well rated overall: SourceDay 4.7 from 27 reviews, Netstock 4.8 from 75 on Capterra. The complaints are about edges, not failures.

### 6. Market size (U.S. Census SUSB 2022)

The counts are firms by **enterprise** size within each NAICS ([2022 SUSB tables](https://www.census.gov/data/tables/2022/econ/susb/2022-susb-annual.html), [detailed-size file](https://www2.census.gov/programs-surveys/susb/tables/2022/us_state_naics_detailedsizes_2022.txt)).

| NAICS | 50–999 employees | 100–499 |
|---|---|---|
| 332 Fabricated metal | 5,417 | 2,282 |
| 333 Machinery | 3,108 | 1,427 |
| 334 Computer/electronic | 1,660 | 777 |
| 335 Electrical equipment | 811 | 371 |
| 336 Transportation equipment | 2,006 | 994 |
| **Total (5 NAICS)** | **13,002** | **5,851** |

For context, all manufacturing (31–33) has 27,531 firms with 50–999 employees. A firm with plants in two of these NAICS can be counted twice, and 336 includes OEMs as well as suppliers.

**Bottom-up illustration only.** It assumes every firm buys, which none will.

| Price per year | 13,002 firms (50–999) | 5,851 firms (100–499) |
|---|---|---|
| $12K | $156M | $70M |
| $30K | $390M | $176M |
| $60K | $780M | $351M |

### 7. The gap

The gap is narrow. Email-native AI follow-up on POs is now crowded: at least six products, three of them (Didero, Axya, Magentic) raising rounds in 2026, plus Microsoft's own agent and blueprint. Chasing an acknowledgement is not a gap.

What is still open is **impact-ranked exceptions for mid-market discrete manufacturers on Epicor, Infor SyteLine, Acumatica, Plex and Business Central**. That means joining each supplier slip to the work orders and customer orders it hits, so the buyer works the 5 exceptions that stop a line instead of the 200 that are late.

The evidence is thin but points the same way. Planning users lack live supplier status (Netstock reviews). Portal users still struggle with "PO Exceptions" and partials (SourceDay reviews). No competitor page I read claims to rank by downstream impact. Microsoft's agent is documented for D365 F&SCM (I found no Business Central version), and the Epicor and QAD agents are tied to their own ERPs.

### 8. The threat

1. **Didero** is the fastest. It has $37M with Microsoft's M12, already claims mid-market deployments and lists exception handling plus planning. Adding an impact ranking is a feature for them, not a pivot.
2. **ERP vendors** come next. Microsoft has a D365 agent and a published reference architecture any partner can deploy. Epicor resells SourceDay and has Prism agents with outcomes-based pricing. QAD owns Kavida. Each could add work-order impact natively, because they already hold the BOM and the schedule.
3. **Freshly funded startups** (Magentic, Axya, Lio) could move down-market from enterprise or follow Axya's Infor-first route.

The defence would be ERP-specific depth (Epicor, SyteLine, Acumatica, Plex), a design-partner moat and speed.

## The buyer panel

**0 buy · 20 pass** (0% buy) out of 20 simulated buyers. Seed 176352, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Purchasing or materials manager (owns the team and the shortage meeting) | 7 | 0%  (thin) |
| COO, GM or owner of a 100-500 person manufacturer | 3 | 0%  (thin) |
| Buyer / senior buyer (chases suppliers daily) | 6 | 0%  (thin) |
| Supply chain director or VP (owns OTIF, expedite cost, budget) | 4 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| ERP loyalist | 4 | 0%  (thin) |
| Improvement champion | 3 | 0%  (thin) |
| Budget gatekeeper | 3 | 0%  (thin) |
| Burned by software | 3 | 0%  (thin) |
| Security-first IT partner | 3 | 0%  (thin) |
| Spreadsheet owner | 4 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $99,000 to $181,000 | 7 | 0%  (thin) |
| $181,000 and up | 7 | 0%  (thin) |
| under $99,000 | 6 | 0%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 19 | "A free audit that wants our open POs, jobs and inventory sent to a startup I've never heard of is the first thing I'd question. Sending that data out needs IT and security sign-off, and I'd check with our Epicor partner before anything leaves the building, which won't happen within 30 days." (P001) · "The audit is free, but it still means pulling PO, job and inventory data out of Epicor and handing it to an early-stage company I have never worked with. My IT and legal people would need to sign off on that, and my planners are already stretched, so I don't see this getting done inside 30 days." (P002) |
| convenience | 1 | "Pulling clean Epicor exports is half a day of work I don't have, and sending PO and job data to an outside startup needs IT and my boss to sign off, which won't happen inside 30 days. I'd take a look if someone else did the export for me." (P013) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |

### What would flip a no

- Our Epicor partner vouches for them and IT approves the data handling in writing, plus a reference from a similar plant that caught a real supplier miss we had not already seen.
- A written data-handling and deletion commitment that my IT team accepts, plus an export template my planner can run in under an hour.
- A reference from another Epicor Kinetic shop of my size that I can call, plus a sample report run on dummy or last year's data so I can see the output before exposing live jobs.
- A written security and data-handling one-pager, a commitment to delete the exports after the audit, and a reference from a plant that already ran the audit.
- A named plant running Epicor Kinetic that has used it for a few months and will say the findings were real, plus a written data-handling statement IT will accept.
- Our Epicor partner vouching for them and IT approving a read-only export process that they run on our data before any commitment.
- A written data handling and security summary that my IT lead can review, plus a reference from an Epicor shop of similar size that has already been through the audit.
- IT and management approve a sanitized export with a written data-handling and deletion policy, and I can send only the open PO lines and jobs without any Epicor access.
- A named reference at a similar Epicor shop that tells me the audit caught a real late supplier date that their planners had missed, plus a sample of what the output looks like before I send any data.
- A concrete example from a plant like mine, shown to me before I send any data, where a supplier date change threatened a job that my planners had missed.
- An endorsement from our Epicor partner or a peer plant that has used it, plus a written data-handling and deletion commitment that legal will accept.
- Our Epicor partner vouches for them and IT signs off on a sanitized export, and the audit can show a supplier date change on one of my open jobs that my planners had not already flagged.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

**No price is set, on purpose.** Simulated answers are not pricing evidence; a real buyer naming a number is.

For orientation only (pricing-curve.md, 20 simulated buyers, paid monthly continuation for one plant): acceptable ~$250–$1,500, indifference ~$700, median "too expensive" $2,500. Round 1 (broader product) was ~$300–$2,000. The narrower product is anchored lower, which suggests the paid step must be tied to a dollar outcome (one avoided expedite or line stop), not to a monthly subscription feel.

What to do instead: at the end of each audit, ask "If this list arrived every Monday, what would it be worth to you, and who would sign for it?" Record the exact answer. The first real number replaces this file.

## The numbers

**No unit economics yet, on purpose.** No real buyer has named a price, so a per-plant margin would be a modelling assumption (round 1's $2,000/month and $117K cash need were exactly that and are retired; see round1/cfo.md). The verdict tool will say **Incomplete** until a buyer names a price.

### What the 90-day test actually costs (all estimates, replace with receipts)

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

### When unit economics become meaningful
After the first buyer names a price for the continuation. Then: price per plant per month; variable cost per plant (mostly founder/CS hours per audit refresh; measure it on audits 1–3); fixed cost (founder pay when it starts). Run `unit_economics.py` then, and check: does one audit refresh take under ~4 hours of manual work? If it takes days, the business is consulting until that is automated.

## Not done yet

- The offer: run /founder-offer
- Marketing: run /founder-marketing
- Brand: run /founder-brand
- Operations: run /founder-ops
- Launch plan: run /founder-launch

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
