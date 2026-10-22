# AI Marketing Manager (businesses) vs AI Talent Manager (creators), side by side

Pitches: `businesses/pitch.md`, `creators/pitch.md`. Panels: `businesses/panel` (seed 571712) and `creators/panel` (seed 527407). These are the same buyer cards as the coupon panels, so the results compare directly. CFO: `cfo-tool.md` (inputs in `numbers.json`). Competitors: `competitors.md`.

These are simulated buyers, so treat the buy rates as an upper bound. Every cost except Razorpay's is an estimate.

## Results
| | Idea 1: AI Marketing Manager (₹999/month) | Idea 2: AI Talent Manager (₹199/yr or 5% of deals) |
| --- | --- | --- |
| **Buy rate** | **11/20 (55%)**. All 11 are free-month trials, and most say they cancel unless they see enquiries that became real orders. | **0/20** |
| Same cards, coupon pitch | 10/20 (coupon counter at ₹299 after proof) | 0/20 (₹499 pass) |
| Why buyers say yes | convenience 8 ("just reply on WhatsApp", "no coupons, no staff steps"), need 2, price 1 | none |
| Why buyers pass | habit 3 (agency or nephew already does it), need 3 (word of mouth is enough), trust 3 (handing Instagram to a beta startup) | trust 10 (an app messaging brands from their account, no visible company, Auto-DM ban fear), need 8 ("cafés pay in food, nothing to negotiate"), habit 2 |
| Price medians | ₹/month: too cheap 299 · bargain 699 · expensive 1,750 · too expensive 3,250 | ₹/yr: too cheap 0 · bargain 99 · expensive 499 · too expensive 999 |
| ₹2,499 creator-campaign plan | Most refused it: creators had burned them before | n/a |
| What flips a no | A nearby business of the same type showing real bookings or UPI takings went up | **Mitra actually bringing them paid collabs** (said by 12 of 20) |

## CFO, idea 1 (no rep)
- **Price and costs:** ₹999/month. Costs per business are about ₹204: Razorpay ₹24, AI text ~₹150, images ~₹10, WhatsApp ~₹20, all estimates. That leaves **₹795 (80%)**.
- **Fixed costs:** ₹10,167/month, the same as the earlier plans.
- **Break-even: about 13 paying businesses.**
- **Ramp (an assumption):** 3–8 new paying businesses a month after a free month, with 10% leaving each month. That gives about 43 paying businesses by month 12.
- **Year 1: +₹72,469** on ₹2.44 lakh of revenue. You need about ₹40,000 in cash, and it is profitable from month 4.
- **What-ifs:** 20% fewer businesses gives +₹33,574. Half as many gives about -₹24,800. Twice as many gives about +₹2.67 lakh.
- **For comparison:** the best coupon plan was about -₹6,000 in year 1 and needed 48 cafés to break even.
- **The line to watch:** how many free-month trials convert to paying. The panel says it depends on enquiries the owner can tie to real orders in month 1.
- **The second line:** AI cost per business. Get a real Claude API cost per business from a week of usage before setting the price.

## CFO, idea 2
- Creators expect it to be free (bargain median ₹99/yr), and most deals are barter, so a 5% fee on deals earns close to nothing.
- **Treat idea 2 as a free feature that brings creators in, not as revenue.**

## What the two panels say together
The creators' top "flip" is the thing idea 1 creates. Businesses paying ₹999 or more get creator campaigns, and those are **paid collabs for creators**. So the ideas are not rivals:

- **Businesses pay** for the AI Marketing Manager (₹999/month, first month free).
- **Creators use the talent tools for free:** scam check, fair rate, media kit and reminders. They get **paid campaigns from Mitra businesses**. Make the scam check work by pasting an offer, without connecting Instagram.
- **Mitra earns from businesses only.** Optional extras: a creator-campaign add-on priced per campaign, not ₹2,499 bundled in, and a ₹99–199 creator Pro later.

## Fixes the panels asked for
1. **Count enquiries, and ask the owner which became orders.** The Sunday report asks one question, "Which of these came in?", with tap-to-confirm. That is how the owner sees value in month 1.
2. **Make the company visible:** a registered name, named founders, a support number, and a page that says Mitra never posts or messages anyone without approval. Trust was 3 of 9 business passes and 10 of 20 creator passes.
3. **Kannada quality:** a native-speaker review of the first weeks of AI captions. Several buyers said "if it looks generic, I'll STOP".
4. **Sell where the yes is.** In this panel, barter veterans and businesses that had been burned by influencers said yes most; word-of-mouth-only owners passed. Target owners who already give creators free meals.
5. **Payment reminders only after the creator approves each one,** never sent automatically from their account.

## Competitors (competitors.md, sources read 22 Oct 2026)
- **₹999 AI posting has no gap.**
  - Manva.ai: ₹199–1,999/mo. Kannada captions start on its ₹999 plan, and owners approve posts on WhatsApp.
  - ZocialOne: ₹1,999/mo for AI posts plus comment and DM replies.
  - Meta's Business Agent on WhatsApp: free replies and lead capture in Indian languages. It is still rolling out.
  - Bengaluru agencies: ₹3,999–12,000/mo, usually with a minimum of 2–3 months.
- **The gap is creator campaigns done for the owner,** with results the owner can check. Under ₹20k, nobody does this over WhatsApp. Petpooja bundles influencers for ₹20–40k, and only for restaurants. The gap sits on Mitra's existing creator marketplace.
- **The talent manager has a small gap.** Socialji's AI talent manager is free. Influish takes 0% commission and has a rate tool and invoices. Fees on closed deals are hard to collect because deals close outside the platform.
- **No rule blocks either idea.**
  - ASCI requires AI-generated influencers to be labelled and bans made-up testimonials. Barter posts still need #ad.
  - Posting to a business's Instagram needs `instagram_business_content_publish` and Meta App Review.
  - WhatsApp marketing messages cost about ₹1.09 each, so keep reports and approvals as utility or service messages.
  - Meta's own agent excludes health businesses.

## Revised recommendation
- **Lead with the moat, not the commodity.** Sell "Bengaluru creators for your business, run for you, results on WhatsApp." The AI posting and replies are included, not the headline. Competing on ₹999 AI captions alone means competing with Meta for free.
- **Price the campaign by results so the panel's "creators burned me" fear is covered.** The ₹2,499 bundle was refused, so drop it.
  - The AI manager costs ₹999/mo, first month free.
  - A creator campaign costs a flat fee per campaign, for example ₹999. The owner pays only once the creator's post is live and the report shows its enquiries.
  - The creator is paid by the business. Mitra takes no cut from the creator.
- **Talent manager:** free for creators, with paste-to-check (no Instagram connection needed). It is how creators find the paid campaigns.
- **CFO before and after:** this keeps ₹999/mo as the base, so the +₹72k estimate for year 1 stands. Campaign fees are extra and not yet modelled.
