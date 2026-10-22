# CFO: three versions of Mitra's first year (Bengaluru, two neighbourhoods)

Updated with real prices from the ops research (`ops.md`). Full tool output: `cfo-A.md`, `cfo-B.md`, `cfo-C.md` (inputs in `numbers-A/B/C.json`, sources below). Unit = one Creator Pass (₹499 for a year). Amounts in ₹, before GST. **Every input except the price is an estimate: there are no quotes or real sales yet.** Not financial, tax or legal advice: an accountant should check the structure, GST on the pass and TDS before money moves.

## The comparison

| | A: current plan | B: founder's referral model | C: board's alternative |
|---|---|---|---|
| What changes | Pass ₹499/yr, businesses free | + ₹150 per pass to the referring business, + ₹200/month per active business, + accountant for TDS | + ₹5,000/month for in-person setup and a results guarantee; no cash to businesses |
| Contribution per pass | ₹487 (98%) | ₹337 (68%) | ₹487 (98%) |
| Fixed per month | ₹34,667 | ₹41,587 | ₹39,667 |
| Break-even | 3 passes a day | 5 passes a day | 3 passes a day |
| Passes sold in year 1 (assumed ramp) | ~492 | ~246 (half of A; panel had 0/20 creators buying) | ~590 (A + 20%; assumption) |
| **Year 1 operating result** | **-₹1,76,400** | **-₹4,16,142** | **-₹1,88,479** |
| Cash needed before it pays for itself | ₹2,04,499 | ₹4,36,142 | ₹2,22,065 |
| Year 1 result if the founders do outreach themselves (no paid rep) | about **+₹1,23,600** | about -₹1,16,100 | about **+₹1,11,500** |

(The last row is a hand calculation from the same inputs: contribution × passes − remaining fixed costs × 12.)

## The CFO's note

- **The margin.** On paper the pass is almost pure margin: ₹487 of every ₹499 is left after the gateway fee and its GST. The referral model cuts that to ₹337, a 31% drop on every sale, before the ₹200 monthly payouts.
- **The line to watch: how many creators pay.** Everything rides on the ramp (about 2–3 paid passes a day by month 12). A 20% lower volume takes plan A's margin at plan from 25% to 6% (`cfo-A.md` what-if). The panels say nearly nobody pays before a cash collab, so treat this ramp as optimistic.
- **The referral model can't win on these numbers.** To match plan A's year-1 result, plan B would need about **957 paid passes, 95% more than A**, while its own panel says creators are *less* likely to pay (0/20 vs 6/20). Paying the referrer out of the pass shrinks the margin and the volume at the same time.
- **Cash.** Plan A needs about ₹2.0 lakh before it pays for itself with a paid rep; plan B about ₹4.4 lakh; plan C about ₹2.2 lakh. The biggest single cost in all three is the rep (an estimate). If the founding team does the walk-ins themselves for the first months, plans A and C can turn a small profit in year 1; plan B still loses money.

**Three ways to improve the margin (from the tool and the table):**
1. **Don't pay commissions out of the pass:** contribution per pass stays at ₹487 instead of ₹337 (+₹150 a pass).
2. **Founders do the first walk-ins instead of a paid rep:** fixed costs fall from ₹34,667 to ₹9,667 a month; year 1 goes from -₹1.76 lakh to about +₹1.24 lakh in plan A.
3. **Raise conversion, not the price:** a 10% price cut makes plan A's year 1 about ₹24,600 worse (what-if); the same effort spent on cash collabs (more creators paying) moves it the other way. Plan C's guarantee costs ₹60,000 a year and pays for itself if it adds about 123 paid passes (₹60,000 ÷ ₹487).

**The board's money conditions:** "no money from creators' payments to businesses" is met by A and C, not by B. "Test a business-side price once counts are proven" (October board) is not modelled here: all three keep businesses free, so revenue rests on creators alone. A business price after the counter is proven is the biggest upside none of these plans include.

## Sources and assumptions (cfo-sources)

| Input | Value | Source |
|---|---|---|
| Pass price | ₹499/yr | Founder's decision |
| Payment gateway | 2% + 18% GST on the fee (₹12) | [Razorpay pricing](https://razorpay.com/pricing/), May 2026 |
| Referral commission | ₹150 per pass | Founder's idea, as tested in the panel |
| Business payout | ₹200/month × 20 active businesses | Founder's idea, as tested; 20 businesses is an assumption |
| Field rep | ₹25,000/month | Bengaluru sales executive average ₹24,174/month ([Indeed](https://in.indeed.com/career/sales-executive/salaries/Bengaluru--Karnataka), Mar 2026); field-executive listings ₹24,000–32,000 ([JobHai](https://www.jobhai.com/field-sales-field-executive-job-in-adecco-india-private-limited-koramangala-bangalore-0-to-6-plus-years-1770193809-7227529-jid)); PF and payroll extras not included |
| Travel | ₹5,000/month | **Estimate** |
| Hosting, database, email, domain | ₹3,000/month | **Estimate** |
| Accountant for TDS (plan B) | ₹2,000/month | **Estimate** |
| Results guarantee (plan C) | ₹5,000/month | **Estimate** |
| Company registration | ₹15,000 one-off | Karnataka two-director Pvt Ltd ₹13,500–17,500 ([eAuditor](https://eauditoroffice.com/blog/new-business/private-limited-company-registration-cost-breakdown)) |
| Annual compliance | ₹1,667/month (₹20k/yr) | ₹15k–30k/yr ([CorporateWalla](https://corporatewalla.com/blog/pvt-ltd-registration-cost-breakdown)) |
| Payouts (plan B) | ₹920/month | [RazorpayX](https://razorpay.com/x/payouts_x/): ₹4 + GST per payout under ₹1,000; plan from ₹2,476/quarter ([Razorpay pricing](https://razorpay.com/pricing/)) |
| Print for first 20 shops | ₹5,000 one-off | A5 acrylic table stands ₹199 ([yourPrint](https://www.yourprint.in/product/acrylic-customized-display-table-stand-with-replaceable-photo-print-a6a5a4-sizes/)) to ₹714 ([Nivara](https://www.nivaraprint.in/products/acrylic-counter-top-a-stand-custom-uv-digital-printed-display)) each; ₹5,000 assumes the cheaper option |
| Ramp (plan A) | 0 in the free launch month, rising to 2.8 passes a day by month 12 (~492 in year 1) | **Assumption**, not from data; panels suggest it is optimistic |
| Ramp (plan B) | 50% of A | Panel: 0/20 creators with this pitch vs 6/20 without; halving is generous |
| Ramp (plan C) | 120% of A | **Assumption**: proven counts bring more cash collabs |
