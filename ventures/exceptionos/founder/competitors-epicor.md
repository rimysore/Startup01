# ExceptionOS: Epicor-specific competitor check (researched 2026-10-19)

**The question:** at a U.S. machinery shop on Epicor Kinetic, what already tells a planner which open jobs are threatened when a supplier changes a promise date?

Public sources only. **What could not be reached:** sourceday.com, epicor.com and distributionstrategy.com returned Cloudflare blocks, and businesswire.com cut the connection. SourceDay and Epicor product claims below therefore come from search-result snippets of those pages and are marked *(snippet)*. EpiUsers threads were read in full. The Reddit searches returned no threads, so the practitioner evidence is all from EpiUsers.help.

## 1. What Epicor Kinetic already does

| Feature | What it shows | What it does not do |
|---|---|---|
| **PO Promise Date field** | The date the supplier gave | It does not drive planning. Epicor support (EpiCare), as quoted by a user: "due date is the one used by the MRP and purchasing system… if the supplier says he can't deliver for that date, we would advise that the due date be changed" ([EpiUsers 2023](https://www.epiusers.help/t/promise-dates-vs-running-balance-vs-aps-ctp/104057)). Changing the due date means "unaprove, change and re-approve the PO" ([EpiUsers 2025](https://www.epiusers.help/t/po-dates-due-date-promise-date/126544)). An open Epicor Idea, KIN-I-6528, asks to remove that step (same thread). |
| **Time Phase Inquiry** | Running balance of supply and demand for **one part** | It uses due dates only: "All of our promise dates are ignored by Time Phased Inquiry" ([2023](https://www.epiusers.help/t/promise-dates-vs-running-balance-vs-aps-ctp/104057)). It works "a single part at a time" ([2017](https://www.epiusers.help/t/going-from-purchase-direct-to-purchase-to-inventory/41838)). It "doesn't clearly show the link between a PO/Line/Rel and Job/Asm/Mtl" ([2020](https://epiusers.help/t/time-phase-showing-link-between-po-and-job/69949)). |
| **MRP + PO Change Suggestions** | Expedite/postpone messages per PO | It does say "call the vendor and EXPEDITE", but "it's only a Suggestion" ([2022](https://www.epiusers.help/t/constrained-materials-and-planning/89288)). The suggestions follow due dates, so a promise-date slip produces no message. |
| **Production Planner Workbench** (run after MRP, usually nightly) | Jobs with full, partial or no material availability | This is the closest native answer. "That will show you which jobs have material shortages" ([2025](https://www.epiusers.help/t/listing-material-shortages-in-an-mts-mto-hybrid-environment/131447)). It is batch and due-date driven, and users report false shortages: "we're already fighting the battle to get production to 'trust' the system" ([2021](https://www.epiusers.help/t/production-planner-showing-false-shortage/78042)). It also counts expedite suggestions as availability unless an option is set ([2023](https://epiusers.help/t/part-shortages/105128)). |
| **Multi-Level Pegging** | Ties supply to demand even for buy-to-stock parts | "The Multi-level Pegging Display app is very clunky and weak. So you will want to write BAQs" ([2025](https://www.epiusers.help/t/listing-material-shortages-in-an-mts-mto-hybrid-environment/131447)) |
| **Constrained materials / APS** | Holds operations until the material arrives | One user said it "crashed MRP" on large BOMs, and "we could never find out what part caused the delay. Odd since Epicor knew but wouldn't tell us" ([2022](https://www.epiusers.help/t/constrained-materials-and-planning/89288)). Another said it ignored open PO dates ([2019](https://epiusers.help/t/scheduling-material-with-contraints/55333)). |
| **Notifications / BAQ dashboards** | Can alert on "a late PO, a job falling behind schedule" ([2W Tech, partner blog](https://2wtech.com/epicor-kinetic-the-most-underused-features-that-deliver-fast-wins/)) | You build them yourself, per rule. Nothing ranks the alerts by job impact. |
| **Supplier Portal** (Kinetic 2023.2) | Supplier-side PO fulfillment | I could not reach any official page on how the portal writes dates back (epicor.com was blocked). |
| **Prism AI agents** | RFQ to PO (2025). At Insights 2026, demos of agents that "autoprioritize expedited orders… and resequence shop floor jobs based on live supply signals" ([SoftwareReviews](https://www.softwarereviews.com/vendor-technology-notes/at-insights-2026-epicor-reframes-erp-from-record-keeper-to-action-taker)) | Shown as demos. "Most of these capabilities require Epicor Kinetic Cloud… On-premises customers cannot access them" (same source). No published spec says they map promise-date changes to jobs. **This is the biggest threat.** |

## 2. What the add-ons do

- **SourceDay** (Epicor's own partner since July 2025). It "captures [MRP] messages, summarizes them for prioritization" and "quiet[s] the noise" *(snippet, [sourceday.com](https://sourceday.com/?p=5642))*. Changes "automatically updated in the ERP" *(snippet)*. A "Hot" flag marks critical lines by hand *(snippet, [sourceday.com](https://sourceday.com/?p=2185))*. Epicor's page claims it "predicts risks before they impact production" *(snippet, [epicor.com](https://www.epicor.com/en/products/enterprise-resource-planning-erp/kinetic/supply-chain-management/sourceday/))*. I found nothing public showing SourceDay listing the jobs a date change hits. Its priority comes from MRP messages, and those follow due dates.
- **Axya** writes "Promise dates written back to Epicor" ([Axya docs](https://docs.app.axya.co/en/user-guide/erp-integration/supported-erps/epicor-kinetic)). If MRP ignores promise dates, that write-back alone does not reach job availability.
- **PlanetTogether** imports "Purchase orders, expected receipts, and shortages" and says it helps "planners see when material shortages… affect the production plan" ([planettogether.com/epicor](https://www.planettogether.com/epicor)). This is the closest outside product. It is a full APS sold to schedulers and needs implementation work.
- **Bezlio, Datix, Dot Net IT, ERP Advisors, cre8tive:** none turned up in any search for a shortage, expedite or supply-risk add-on. That does not prove there is none. Preactor/Opcenter, Asprova and User Solutions were not researched for this question.

## 3. Practitioner evidence (EpiUsers only; thin to moderate)

The pain is real and recurring, from 2017 to 2025, across about 8 threads:
- "Once on-hand inventory is exhausted, we haven't found a fast way to see which jobs are now short" ([2025](https://www.epiusers.help/t/listing-material-shortages-in-an-mts-mto-hybrid-environment/131447)).
- "Currently doing this off-system in a spreadsheet" ([2023](https://epiusers.help/t/part-shortages/105128)).
- "Epicor still calculates based on the due date, not with promise dates. This creates a false view of material availability" ([2021](https://www.epiusers.help/t/time-phase-does-not-calculate-or-suggest-changes-based-on-promised-date/79010)).
- "Promise date is a glorified CONFIRMED box" ([2025](https://www.epiusers.help/t/po-dates-due-date-promise-date/126544)).
- Buyers "want to see 'all requirements of jobs and the suggestions that are for them'" once they buy to stock ([2017](https://www.epiusers.help/t/going-from-purchase-direct-to-purchase-to-inventory/41838)).

Counter-evidence: experts answer every one of these threads with "Production Planner Workbench", "PartDtl BAQ" or "multi-level pegging". A shared BAQ for Time Phase, JobMtl and PO already circulates ([2023](https://epiusers.help/t/part-shortages/105128)). One expert called due-date-only logic "working as designed" and suggested a dashboard that updates due dates ([2021](https://www.epiusers.help/t/time-phase-does-not-calculate-or-suggest-changes-based-on-promised-date/79010)). Well-run shops therefore have a workaround.

## 4. Verdict: **partly solved**

Epicor can tell you which jobs are short against **due dates**, in a nightly batch, if the planner has kept due dates current, set up the Planner Workbench correctly and trusts its output. It does **not** automatically turn a *supplier promise-date change* into "these jobs are now threatened, ranked". The promise date is not used by planning. Re-dating the PO takes an unapprove and re-approve cycle. Buying to stock removes the PO-to-job link. Ranking (by job due date, customer order or slack) is left to the planner. SourceDay and Axya move dates into Epicor but show no public job-impact view. Epicor's cloud agents may close this gap; that is not proven yet.

**What ExceptionOS must beat (a good planner with Time Phase + a PartDtl BAQ):**
1. **Use the promise date, not the due date.** Catch the gap between the promise date and the due date the moment it opens, before anyone re-dates the PO. In Epicor, that gap is exactly where the false availability sits.
2. **Allocate across all parts at once.** Allocate stock-bought supply to jobs, the way pegging does, but in one readable list instead of one part at a time.
3. **Rank by slack and consequence.** That means days short versus the operation start (not the job start, which is where the Workbench gives false shortages), plus the downstream sales order and ship date, alternate supply and on-hand.
4. **Prove it against the audit question.** The audit asks "which of these did you already know?" If three shops with a disciplined due-date process answer "all of them", the kill rule applies.

Next check: ask each interviewee whether buyers update the **due date** or only the **promise date** when a supplier slips. Shops that update only the promise date are the ones Epicor misleads.
