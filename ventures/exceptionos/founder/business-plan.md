# ExceptionOS · Business plan

**Verdict: Not yet**

- ✓ Each paying plant-month earns $1400.00 before fixed costs (70% contribution).
- ✗ Year 1 operating LOSS: $60,400.
- ✗ 0 of 20 simulated buyers buy (0%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $2000.00 a paying plant-month |
| Profit margin at plan | 51% per paying plant-month |
| Break-even | 7 paying plant-months a day |
| Year 1 operating profit | $-60,400 |
| Startup spend | $51,000 |
| Cash needed before it pays for itself | $117,200 |
| Startup money earned back | not in year 1 |
| Buyer panel | 0 buy · 20 pass |

## The idea

- What it is: supplier-delivery exception intelligence for mid-market manufacturers. It ingests supplier communications (email, PDF, Excel, portal acknowledgements) and open-PO data, detects real discrepancies (changed promised dates, quantities, missing acknowledgements, backorders, partial shipments, substitutions), ranks them by downstream operational impact (work orders, customer orders, revenue) rather than PO value, gathers evidence, recommends and drafts next actions, and tracks each exception to resolution. Long-term vision: an "Exception Management OS" across supplier, PO, inventory, work order, customer order and revenue.
- Who it is for: U.S. discrete / make-to-order / engineer-to-order / mixed-mode manufacturers with 50–1,000 employees (sweet spot 100–500, ~$30M–$300M revenue), 3–30 buyers/planners, 100+ suppliers, on a mid-market ERP (Epicor Kinetic, Infor SyteLine, NetSuite, Dynamics 365/Business Central, Acumatica, Plex, QAD, Sage X3, SAP B1) but with exceptions spilling into Outlook, Excel, Teams and manual follow-up. First verticals: industrial machinery, electrical/electronic components, fabricated metal, automotive Tier 2/3, industrial distribution with light assembly. Personas: buyer, purchasing manager, materials manager/planner, supply chain director/VP, COO/GM/owner.
- What it sells, at what price: not decided. Plan is customer discovery → concierge/manual design-partner tests → paid pilot → product. Pricing "not finalized" per the brief.
- Where and how: B2B SaaS sold in the United States through low-volume, highly personalised founder-led outreach (an AI prospecting agent researches and drafts; the founder escalates pricing, security, legal and integration). North-star learning metrics: independent prospects describing the same painful exception, willingness to show workflow/data, to run a design-partner test, to pay for a pilot.
- Budget and constraints: Status Oct 2026 = customer discovery / pre-MVP; no product, no customers, no pilots yet. Team size, funding and founder background are not stated in the brief. Must not modify commercial terms or send consequential supplier messages without approval. Security/data access is a known objection; aerospace/defense deferred.

## Summary

ExceptionOS ranks supplier delivery exceptions (changed dates, short quantities, missing acknowledgements) by what they will hit downstream (work orders, customer orders) for U.S. mid-market discrete manufacturers, and drives each to resolution. Pre-MVP, customer discovery.

**Verdict: Not yet** (computed by compile.py): each paying plant at a $2,000/month test price leaves ~$1,400 (70%), but year 1 loses money on the assumed ramp and 0 of 20 simulated buyers would sign a paid pilot today. That is normal for pre-MVP; the panel's signal is the free test.

**Board:** 3 × FUND IF, average 4.7/10. All three: narrow to one exception type, one ERP, one vertical; prove it by hand with 3 design partners against a measured baseline; get one paid pilot.

**Panel:** the blocker is trust/proof (15 of 20), not price (2). 18 of 20 said a free test on their own data that catches something their team missed would change their mind, and most would take that free test. Next most common gates: IT/security sign-off on email/ERP data, and "will this startup exist next year".

**Competition (competitors.md):** crowded on PO-acknowledgement chasing (Didero ~$37M raised incl. Microsoft's fund, SourceDay ~$55M and resold by Epicor, Magentic $18M, Axya, Leverage AI; QAD bought Kavida.ai; Microsoft ships a D365 supplier agent). Nobody publicly claims impact-ranking against work orders/customer orders for mid-market ERPs: that is the gap, and it is narrow.

**Scale:** 13,002 U.S. firms with 50–999 employees in NAICS 332–336 (5,851 with 100–499, Census 2022). If every one bought, $156M–$780M a year at $12K–$60K; a realistic share is a fraction. A good venture-scale outcome needs repeatable ERP setup and a channel (ERP partners), otherwise it is a solid niche.

**Biggest risk:** a funded player (Didero) or an ERP vendor adds impact ranking as a feature.

**What it needs to start (CFO, estimates):** ~$117K before it pays for itself with one modestly paid founder.

**The one thing to do this week:** pick one ERP (Epicor machinery shops is the board's suggestion) and book 5 discovery calls about the last real supplier slip that hit a work order; offer the free test on exports.

Simulated buyers and estimated numbers; real interviews and quotes confirm them. Not financial, legal or tax advice.

## What the board said

**Vote: 3 FUND IF. Average score 4.7 / 10** (Offers 5, Product 5, Monopoly 4).

### Risks more than one member raised (most dangerous first)
1. **No proof yet, and the first result costs the buyer a lot of effort.** (Offers, Product) Data access, a security review and a weekly champion are needed before any value shows. One wrong "this stops Line 3" alert sends buyers back to Outlook.
2. **Feature, not a company.** (Monopoly, Offers) ERP vendors, supplier portals, procurement suites and funded AI startups reach the same buyer; if an ERP ships it as a module it becomes free. Coverage of incumbents is unknown.
3. **Scope sprawl and custom integration.** (Product, Monopoly) Four input formats, six exception types, nine ERPs, five verticals and an "OS" vision is five products; if each customer needs custom ERP work this becomes consulting.

### Conditions (checklist)
- [ ] One beachhead: one exception type (e.g. changed promise dates on parts feeding open work orders), one ERP, one vertical, one persona; one-sentence pitch. (Product, Monopoly)
- [ ] A one-page map of what incumbents already catch, proving the gap. (Offers, Monopoly)
- [ ] 3 design partners meeting 5/7 criteria, value delivered by hand against a measured baseline. (all)
- [ ] 1 paid pilot priced on measured impact. (Offers)
- [ ] A written offer: name, price, time to first result, an affordable guarantee. (Offers)
- [ ] An alert accuracy bar and a designed "uncertain data" experience. (Product)
- [ ] A channel to customer 100 (e.g. ERP partners/VARs) and a first cost-to-win estimate; a named team with ERP-integration or manufacturing-sales experience. (Monopoly)
- [ ] Keep "OS" off the roadmap until 3 paid pilots. (Product)

### Where they disagree
Offers and Product see a real, well-framed wedge (impact ranking) worth testing by hand. Monopoly is cooler: nothing is 10x better than spreadsheet + ERP report yet, and the data moat only arrives after many customers.

### Scale (all three agree on the shape)
If it works: the system of record for supply exceptions in mid-market manufacturing, expanding to inventory, work orders and customer orders. It needs: one exception that recurs with a measurable cost across many plants; repeatable (not custom) ERP setup; pricing anchored to prevented downtime/late orders; accumulated context that improves ranking over time; and a channel beyond the founder. If integration stays custom, it is a good consulting-style niche, not a large company.

### The strongest version the board can see
A narrow, provable wedge: "Every morning, the 5 supplier date changes that will hit a work order this week, with the evidence", for Epicor (or one ERP) machinery shops, delivered first by hand from exports, sold on one avoided expedite or line stop, then distributed through that ERP's partner channel.

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
| $106,000 to $141,000 | 7 | 0%  (thin) |
| $141,000 and up | 7 | 0%  (thin) |
| under $106,000 | 6 | 0%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 15 | "I run a 100-500 person shop and a tool that reads our POs and supplier emails and ranks what will hit our work orders sounds useful, but I have heard this pitch before and a wrong date is what costs us a shortage on the floor. I would take the free six-week test with exports and a few forwarded emails, and I would not sign a monthly paid pilot until my buyers say the ranked list is right." (P002) · "I'd take the free six-week test because it costs me nothing but an export and a few forwarded emails. I would not sign up for $2,000 a month from a company that may not be around next year, and I'd have to explain that payback to our CFO with nothing but a pilot result." (P003) |
| habit | 2 | "My ERP partner is the first call I make for anything touching purchasing data, and I don't want a second tool reading our POs and supplier mail from outside the system. A free six-week test I might agree to look at, but I would not sign a $2,000 a month pilot on the strength of a deck and a demo." (P001) · "My ERP already flags late POs and my open-PO tracker in Excel catches the rest if my buyers keep it current. The real problem is discipline, and I don't see why I'd pay $2,000 a month to get that from a startup's tool." (P014) |
| price | 2 | "I'd take the free six-week test to see if it catches anything my team misses, but I can't put a $2,000 a month line into this year's budget on a tool with no track record here. It has to pay back fast and nobody has shown me that yet." (P012) · "I'd take the free six-week test because it costs me nothing and my team is already drowning in the open-PO spreadsheet. I have no budget line for $2,000 a month this year, so I'd need to see it pay back fast before I could argue for it to finance." (P013) |
| timing | 1 | "I have no budget this year unless something pays back fast, and a $2,000 a month tool from a startup that hasn't built the product yet doesn't pay back on a sales pitch. I might take the free six-week test with a few exports, but I wouldn't approve the paid pilot without seeing it catch real late POs first." (P008) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |

### What would flip a no

- A six-week test that catches a late supplier date or a short ship before it hits a work order, with the premium freight or line-down cost it prevented written down in dollars.
- Proof on our own data during the free test: it catches real late and short shipments that my buyers had not yet seen, with few false alarms, and my team says it saves them time in the daily shortage meeting.
- A plant that ran the free test shows me a real late or short order that the tool caught in time, with the dollar value written down, and the vendor commits to continuity terms I can show the CFO.
- A paying customer I can call as a reference, or a signed commitment with data export and a refund if they fold, plus proof the alerts catch things my buyers miss.
- A six-week free test on our own open POs that catches at least a few real late or short supplier changes before my shortage meeting, plus a reference from a plant of similar size that has run it for a year.
- A free six-week test that catches real late or short supplier dates our team had already missed, with our ERP partner signing off on how the export is pulled.
- My IT and security team signing off on the data handling, plus a free-test result showing it caught a late supplier date that our shortage meeting would otherwise have missed.
- The free six-week test flags at-risk work orders that my team had not already caught, with a payback number I can show my plant manager.
- A free test that shows, on our own open POs, a couple of real late or short shipments caught before they hit a work order, with the drafted supplier follow-ups our buyers would actually send.
- In the free test, it flags a real short ship or backorder that would have hit a work order, early enough that we could act on it, and my buyers do not have to log into anything new.
- A named reference at a similar make-to-order plant that ran it for at least a quarter and proved it caught real late-supplier problems before they hit work orders.
- A free test on our own open POs that shows a few real late-order catches I could tie to avoided customer penalties, plus a clear answer from my ERP partner that nothing conflicts with their system.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

### What simulated buyers said (pricing-curve.md, 20 buyers, per plant per month)
Acceptable range **~$300–$2,000**; least resistance ~$300; indifference ~$1,000; median "getting expensive" $1,500, "too expensive" $2,500. The test price of $2,000 sits at the top edge. Simulated answers choose what to test; they are not proof.

### What the panel really said
0 of 20 would sign the paid pilot today, but **18 of 20 said a free test on their own data, catching something their team missed, would change their mind**, and most volunteered they would take the free 6-week test. The blocker is proof and trust (15 of 20), not price (2 of 20).

### What the business needs (cfo.md, all estimates)
At $2,000/plant/month each plant leaves ~$1,400 after its own costs; break-even ~7 plants with one modestly paid founder. At $1,000, break-even rises to ~25 plants; at $3,500, ~4 plants.

### Recommendation
1. Keep the **free design-partner test**, but make its exit explicit: "If in 6 weeks it caught at least one exception your team missed, the paid pilot starts at $X."
2. Test **$1,000–1,500/plant/month** for the first paid pilots (inside the range), with an annual price later anchored to measured avoided expedite/downtime cost.
3. Offer what buyers asked for to remove the trust gap: data-handling one-pager for IT, no training on customer data, export-and-delete terms, month-to-month.

## The numbers

Every number below comes from the input file. Nothing is looked up or guessed.

### One paying plant-month

| line | per paying plant-month |
| --- | ---: |
| Price | $2,000.00 |
| AI processing of supplier emails/PDFs and ranking (estimate) | -$120.00 |
| Cloud hosting, storage, per-tenant (estimate) | -$60.00 |
| Customer success / data-cleanup time, ~6 h at $60/h (estimate) | -$360.00 |
| Card / invoicing fees ~3% | -$60.00 |
| **Contribution** (what each paying plant-month leaves to pay the fixed costs) | **$1,400.00** (70%) |

### The margin that matters

Fixed costs: $9,700 a month (Founder pay, one founder, modest (estimate) $8,000, Software, tools, email sending, insurance (estimate) $900, Security / SOC 2 compliance tooling (estimate) $800).

- **Break-even: 7 paying plant-months a day.** Below that you lose money every month.
- **Profit margin at your plan** (25 a day): **51%** of every sale, after every cost.

### Year 1, month by month

| month | paying plant-months a day | revenue | profit | cumulative (after $51,000 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$9,700 | -$60,700 |
| 2 | 0 | $0 | -$9,700 | -$70,400 |
| 3 | 0 | $0 | -$9,700 | -$80,100 |
| 4 | 1 | $2,000 | -$8,300 | -$88,400 |
| 5 | 1 | $2,000 | -$8,300 | -$96,700 |
| 6 | 2 | $4,000 | -$6,900 | -$103,600 |
| 7 | 3 | $6,000 | -$5,500 | -$109,100 |
| 8 | 4 | $8,000 | -$4,100 | -$113,200 |
| 9 | 5 | $10,000 | -$2,700 | -$115,900 |
| 10 | 6 | $12,000 | -$1,300 | -$117,200 |
| 11 | 8 | $16,000 | $1,500 | -$115,700 |
| 12 | 10 | $20,000 | $4,300 | -$111,400 |

- **Year 1 operating profit: -$60,400** on $80,000 of revenue.
- After the $51,000 startup spend: -$111,400.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$117,200**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 51% | 7 | -$60,400 |
| Price -10% | 45% | 9 | -$68,400 |
| Volume -20% | 46% | 7 | -$71,600 |
| Unit costs +15% | 46% | 8 | -$64,000 |

### Red flags

- Year 1 loses money on operations (-$60,400).
- The startup spend is not earned back within year 1.

## Not done yet

- The offer: run /founder-offer
- Marketing: run /founder-marketing
- Brand: run /founder-brand
- Operations: run /founder-ops
- Launch plan: run /founder-launch

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
