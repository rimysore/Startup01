# Summary: ExceptionOS v0 (round 2)

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
