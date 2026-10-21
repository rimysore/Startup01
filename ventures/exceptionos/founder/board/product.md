# Product lens (round 2)
Score: 6/10 | Vote: FUND IF

## What changed since round 1
Better: focus. One exception (supplier moves a promised date), one object (open work orders), one ERP, one vertical, and a one-sentence pitch: "Your ERP tells you what changed; ExceptionOS tells you what the change will break." Buyer effort fell: no credentials, inbox or write-back. OS is off the pitch. A killer metric and kill rule exist.
Worse: the hardest step, the data export, is now the customer's job, and a free audit gives no pay signal.
Round-1 conditions: narrow plus one-sentence pitch **met**; OS off roadmap **met**; written offer **partly met** (audit defined, paid step not); accuracy bar **partly met** (counts hits, no false-alarm ceiling); incumbent map **partly met** (Epicor's own shortage reports unchecked); 3 design partners with baseline **not met**; paid pilot **not met**; channel to customer 100 and named team **not met**.

## What is strong
- The first moment is clear: a ranked list of supplier date changes and the work orders each threatens, plus "which did you already know?" That question is the right test.
- Read-only and offline removes the round-1 IT/security gate.
- Concierge build: the founder sees every seam by hand first.

## What would kill it (the top 3, most dangerous first)
1. **The export breaks the experience before the product starts.** A planner must pull open PO lines, open work orders with BOM requirements, inventory and date-change history, then sanitize them. History is "if available", yet it is the exception itself; one snapshot shows current dates, not changes. Sanitizing can strip the part and supplier keys that join POs to BOMs. Without inventory, every late PO looks threatening. Who does this, in how many hours, from which Epicor reports? Unknown.
2. **The report is wrong in ways the planner sees at once.** Multi-level BOMs, substitutes, allocations, safety stock, partial receipts. One false "threat" and trust is gone (15 of 20 simulated buyers cited trust). No false-alarm bar is stated.
3. **Epicor already shows it.** If Kinetic's time-phase or shortage views surface the same jobs, the report is a reformatted screen. Check this before audit 1, not after audit 3.

## Scale
Each audit is hand-built from one customer's exports: right for 3, wrong for 30. The step from a one-off export to a weekly feed the customer never thinks about is undescribed, and that seam is where the paid product lives. 13,002 U.S. firms is a market count, not a reachable list.

## The questions I would ask the founder
- Which Epicor exports and fields, and how long does a planner take? Have you done it yourself on a sandbox?
- Without date-change history, how do you detect a change?
- Why is the report's top item obviously right?
- How fast is turnaround; is the data still current?
- What does Kinetic's own shortage view show on the same data?
- Who is the team, and what does the paid continuation deliver each week?

## If FUND IF: the conditions
1. A written export spec (reports, fields, join keys, sanitization that keeps the joins), tested on one real or sandbox dataset.
2. Epicor's native shortage view vs. the audit, side by side on the same data.
3. An accuracy bar set before audit 1 (maximum false alarms in the top 10), with "missed exception" confirmed by the customer, not the founder.
4. A one-page report mock-up reviewed by one planner.
5. Three audits, at least one confirmed missed exception, and a price named by a buyer.
