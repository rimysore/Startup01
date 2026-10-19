# ExceptionOS: competitors (researched 2026-10-19)

Public sources only. Full rows with links are in `competitors.csv`. G2 returned 403, Coupa and Jaggaer were blocked by bot protection, and Didero's, Lumari's and Leverage's review pages could not be found, so the review evidence is thin.

## 1. Who is there (most direct first)

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

## 2. Price range

No direct AI competitor publishes a price, so every one is demo-only. The only public anchors:

- **Low:** offshore VA from $10/hr, about $20.8K/yr
- **Mid:** Netstock planning from $10.8K/yr ($900 × 12)
- **High:** not public
- **Median:** cannot be computed from public data
- **Pricing models:** Epicor Prism is outcomes-based, Arda is per seat, Microsoft charges capacity credits. Expect quote-only pricing from every direct player.

## 3. Funding of direct players

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

## 4. Positioning map (how a purchasing manager would see it)

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

## 5. Complaints (ranked)

1. **Exception handling is still hard** (thin, 1 review). A SourceDay user: "We are still trying to figure out how to use PO Exceptions and has turned into more of a headache than anything else" ([Capterra](https://www.capterra.com/p/187682/SourceDay/reviews/)).
2. **Supplier info sits outside the structured fields, so buyers chase anyway** (thin, 2). One SourceDay user: "We still have to request weekly order reports from vendors due to the 'comment' section in Sourceday isn't super accessible. Unfortunately a lot of our shipments are partials". Another: "Supplier comments cannot be easily copied from the approval tab" ([Capterra](https://www.capterra.com/p/187682/SourceDay/reviews/)).
3. **Planning tools are blind to live supplier status** (thin, 2). Netstock users: "The lack of live data has been a real challenge when looking for backordered items specifically", and "I would like to see features open up where information can be written back and forth between the ERP and Netstock" ([Capterra](https://www.capterra.com/p/152724/NETSTOCK/reviews/)).
4. **Reporting is rigid** (4+ reviews across both tools). "Limited report options." and "there could be more reports or customizable by the user" (SourceDay). "Program will only let you export reports with 10,000 sku's" (Netstock).
5. **Slow fixes and learning curve** (3+). "It can take a while to resolve issues" (SourceDay). "There has been a steep learning curve with the setup" (Netstock).

The tools are well rated overall: SourceDay 4.7 from 27 reviews, Netstock 4.8 from 75 on Capterra. The complaints are about edges, not failures.

## 6. Market size (U.S. Census SUSB 2022)

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

## 7. The gap

The gap is narrow. Email-native AI follow-up on POs is now crowded: at least six products, three of them (Didero, Axya, Magentic) raising rounds in 2026, plus Microsoft's own agent and blueprint. Chasing an acknowledgement is not a gap.

What is still open is **impact-ranked exceptions for mid-market discrete manufacturers on Epicor, Infor SyteLine, Acumatica, Plex and Business Central**. That means joining each supplier slip to the work orders and customer orders it hits, so the buyer works the 5 exceptions that stop a line instead of the 200 that are late.

The evidence is thin but points the same way. Planning users lack live supplier status (Netstock reviews). Portal users still struggle with "PO Exceptions" and partials (SourceDay reviews). No competitor page I read claims to rank by downstream impact. Microsoft's agent is documented for D365 F&SCM (I found no Business Central version), and the Epicor and QAD agents are tied to their own ERPs.

## 8. The threat

1. **Didero** is the fastest. It has $37M with Microsoft's M12, already claims mid-market deployments and lists exception handling plus planning. Adding an impact ranking is a feature for them, not a pivot.
2. **ERP vendors** come next. Microsoft has a D365 agent and a published reference architecture any partner can deploy. Epicor resells SourceDay and has Prism agents with outcomes-based pricing. QAD owns Kavida. Each could add work-order impact natively, because they already hold the BOM and the schedule.
3. **Freshly funded startups** (Magentic, Axya, Lio) could move down-market from enterprise or follow Axya's Infor-first route.

The defence would be ERP-specific depth (Epicor, SyteLine, Acumatica, Plex), a design-partner moat and speed.
