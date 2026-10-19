# Product lens (round 2)
Score: 6/10 | Vote: FUND IF

## What changed since round 1
Better: focus. One exception (supplier moves a promised date), one object (open work orders), one ERP (Epicor Kinetic), one vertical. The pitch now fits in a sentence: "Your ERP tells you what changed; ExceptionOS tells you what the change will break." The buyer's effort dropped: no credentials, no inbox, no write-back. The OS vision is off the pitch. A killer metric and a kill rule exist.
Worse or new: the audit hands the hardest part of the experience, the data export, to the customer. And it is free, so there is no signal of willingness to pay.
Round-1 conditions: narrow plus one-sentence pitch: **met**. OS off roadmap: **met**. Written offer: **partly met** (the audit is defined; the paid step is not). Alert accuracy bar: **partly met** (the killer metric counts hits but sets no ceiling on false alarms). Incumbent coverage map: **partly met** (competitors mapped, but Epicor's own shortage/time-phase reports are still unchecked). 3 design partners with a measured baseline: **not met**. 1 paid pilot: **not met**. Channel to customer 100 and a named team: **not met**.

## What is strong
- The first moment is clear: a ranked list of "these supplier date changes threaten these work orders", plus "which did you already know?" That question is the right test.
- Read-only and offline removes the round-1 IT/security gate.
- Concierge build (Python, CSVs) means the founder sees every seam by hand before automating it.

## What would kill it (the top 3, most dangerous first)
1. **The export breaks the experience before the product starts.** Walk it through: a planner must pull open PO lines, open work orders with BOM requirements, inventory and date-change history out of Epicor, then sanitize them. Date-change history is "if available", yet it is the exception itself; without it, one snapshot shows current dates, not changes, so the audit needs two snapshots or history. Sanitizing can strip the part and supplier keys needed to join POs to BOMs. Inventory is optional, but without it every late PO looks threatening. Who on their side does this, how many hours, and which Epicor reports? Unknown.
2. **The report is wrong in ways the customer sees at once.** Multi-level BOMs, substitutes, allocations to other jobs, safety stock, firm vs. planned orders, partial receipts. One "threat" the planner knows is fine and trust is gone (15 of 20 simulated buyers cited trust). There is no stated false-alarm bar.
3. **Epicor already shows it.** If Kinetic's time-phase or shortage reports surface the same threatened jobs, the report is a reformatted screen. The kill rule covers this, but the founder should check it before audit 1, not after audit 3.

## Scale
Each audit is hand-built from one customer's exports. That is right for 3 audits and wrong for 30. The path from "founder joins CSVs" to "recurring feed the customer does not have to think about" is not described, and that seam (a one-off export becoming a weekly habit) is where the paid product lives. The 13,002 U.S. firms figure is a market count, not a reachable list.

## The questions I would ask the founder
- Exactly which Epicor exports, which fields, and how long does a planner take to produce them? Have you done it yourself on a sandbox?
- Without date-change history, how do you detect a change at all?
- What does the report look like, page one? How many items, and what makes the top one obviously right?
- What false-alarm rate makes a planner stop reading?
- How fast is the turnaround, and is the data still current when it lands?
- What does Kinetic's own shortage view show on the same data?
- Who is on the team, and what does the paid continuation deliver weekly?

## If FUND IF: the conditions
1. A written export spec (reports, fields, join keys, a sanitization method that keeps the joins), tested on one real or sandbox Epicor dataset.
2. A side-by-side of Epicor's native shortage view vs. the audit on the same data.
3. An accuracy bar set before audit 1: e.g. maximum false alarms in the top 10, and "missed high-impact exception" defined so the customer confirms it, not the founder.
4. A one-page report mock-up, reviewed by one planner.
5. Three audits run; at least one confirmed missed exception; a price named by a buyer.
