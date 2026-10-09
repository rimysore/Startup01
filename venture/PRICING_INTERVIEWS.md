# Pricing interviews: validating what campuses will pay

Goal: replace the assumed prices in `MARKET_SIZING.md` ($100k R1/R2, $30k other 4-year, $15k 2-year) with evidence.
Use these questions with **outside institutions only**, not with your own employer.

## Rules
1. **Ask about money already spent, not future intentions.** "What did you pay last year?" beats "Would you pay $X?" People are polite about the future and accurate about the past.
2. **Find the budget before the price.** A price is meaningless if nobody owns a budget line for it.
3. **Price questions come last**, after the pain is established and the demo is shown.
4. **Never defend a number.** Write down their reaction word for word and move on.
5. **Ask for documents**: a quote, an invoice line, a board agenda item. One document beats ten opinions.

## Part 1: what they spend today (10 min)
Ask everyone in a budget or leadership role.
1. "What did you spend in the last 2 years on condition assessments? Who did them, and how often do you repeat them?"
2. "What do you pay each year for software in this area: Gordian/Sightlines, AkitaBox, AiM add-ons such as reporting, BI tools, e-Builder modules?"
3. "Have you hired consultants for capital planning, board reporting or data clean-up? Roughly what did that cost?"
4. "How many staff hours go into one board report or capital request cycle? How many cycles per year?"
5. "When a capital decision was wrong because the data was wrong, what did it cost?" (Get one story.)

**Record:** each spend line, its amount, how often it recurs, and who approved it.

## Part 2: who pays and how buying works (5 min)
6. "If a tool like this were bought, whose budget would it come from: facilities operating, capital planning, IT, the CFO's office?"
7. "What's the largest amount you can approve yourself? What needs the CFO, a purchasing bid (RFP) or the board?"
8. "When does your fiscal year start, and when is next year's budget set?"
9. "Do you buy through cooperative contracts (E&I, OMNIA Partners, Sourcewell)? Would that make buying faster?"
10. "What was the last software your department bought? How long did it take from first demo to signed contract?"

**Record:** the budget owner, the signing limit, the RFP threshold, the fiscal-year start, the cooperative contracts they use, and the length of their last purchase.

## Part 3: after the demo, the price questions (10 min)
Show the Metric Studio prototype first. Then:

11. **Value in their own words:** "If this worked on your AiM and e-Builder data, what would it replace or save? Hours, consultants, a tool?"
12. **Value ranking:** "Which part matters most: personal dashboards, readable definitions, known-number testing, reconciliation checks, or drafted board reports?" (Value-based pricing ties to the top answer.)
13. **Van Westendorp price questions** (ask all four, for an annual subscription for their institution):
    - "At what price would this be **so cheap** you'd doubt the quality?"
    - "At what price is it a **bargain**, a great buy?"
    - "At what price does it start to feel **expensive**, though you'd still consider it?"
    - "At what price is it **too expensive** to consider at all?"
14. **Pricing basis:** "Would you rather pay per building or square foot, per user, or a flat fee for the institution? Why?"
15. **Pilot test:** "Would you pay **$[X]** for a 90-day pilot on your own data, with the fee credited toward a first-year license?" Rotate X across interviews: $5k, $10k, $15k.
16. **Commitment test:** "Who else would need to see this before you could say yes? Can you introduce me?"

## Strong vs weak signals
| Strong (counts as evidence) | Weak (doesn't count) |
|---|---|
| Names a current spend line with an amount | "That seems reasonable" |
| Shares a quote, invoice or board item | "We'd probably pay for that" |
| Agrees to a paid pilot or asks for a proposal | Compliments on the demo |
| Introduces the budget owner | "Send me more information" |
| Gives a fiscal-year date to target | Can't say whose budget it is |

## Notes sheet (one per interview)
```
Institution type (R1/R2, other 4-year, 2-year, K-12, hospital) · GSF · # buildings
Role · budget owner? (Y/N) · approval limit $ · RFP threshold $ · FY start
Current spend:  FCA $___ every ___ yrs | software $___/yr | consultants $___ | staff hrs/cycle ___
Top value (Q12): ________
Van Westendorp: too cheap $___ | bargain $___ | expensive $___ | too expensive $___
Preferred basis: per sq ft / per user / flat
Pilot at $____: yes / no / maybe · next step + date: ________
Quotes (exact words):
```

## Turning answers into prices (after 15+ interviews)
1. Group results by segment (R1/R2, other 4-year, 2-year).
2. For each segment, take the **median** "expensive" and "bargain" answers. The acceptable range lies between them; start the list price just under the median "expensive".
3. Check the price against current spend. It should be **under** what they already pay for consultants and assessments each year, so the purchase replaces a line instead of adding one.
4. Check approval limits. If most buyers can sign alone below $25k, consider an entry tier under that so first deals skip the RFP.
5. Update the table in `MARKET_SIZING.md` and slide 11 with the medians, and note the number of interviews behind each one.

**Decision rule:** if at least 5 of 15 budget owners accept the pilot fee, and the median "expensive" answer for 4-year colleges is $25k or more, the model works as planned. If not, revisit the price model (per square foot, modules) before building more.
