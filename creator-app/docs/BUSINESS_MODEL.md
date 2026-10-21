# How Mitra makes money (and why nobody should feel scammed)

Draft, 21 Oct 2026. Numbers marked *assumption* need checking against pilot data; tax points need a CA.

## The problem we're designing against

Creator apps in India have taught creators to expect a catch. The most common complaint about the market leader
(reported ₹499/year creator subscription) is "I paid and got no collaborations". Scams make it worse: fake brands
asking for "registration fees", buy-first-refund-later offers, "task jobs". Our offer inbox now flags all of those.
So the money model has to pass one test: **a creator who never earns a rupee through Mitra should never have paid
Mitra a rupee.**

## Principles (non-negotiable)

1. **Creators never pay to join, apply, be seen or be verified.** No subscriptions for access to offers, no
   "priority listing", no paid Verified badge. Verified comes only from connecting an account.
2. **Creators keep 100% of what they agree to**: the base fee for the post and every customer bonus.
3. **Mitra doesn't take a cut of deals.** Businesses pay for the platform they use every day (a monthly plan), not
   for an introduction. A deal done outside Mitra costs Mitra nothing, so there's nothing to route around and no
   reason to police anyone.
4. **Free tools stay free:** for creators the offer inbox, sender checks, deal log and media kit; for businesses
   Track on a small number of posts a month.
5. **Every rupee is itemised**: base fee, bonus, plan, GST, payment charges.
6. **Pay for results, not promises.** Businesses are asked to upgrade only after Mitra has counted real customers for
   them. Later, deal money is held by a payment provider until the post is live and refunded if it never goes up.
7. **No dark patterns.** No auto-renew without a reminder, no hidden markups, no selling creator data, no fake
   "brands are looking at your profile" notifications, cancel in one click.

## The deal: a fee for the post plus a bonus per customer

Creators need a guaranteed fee to make a reel; businesses want to pay for results. So a deal has two parts, both
paid to the creator in full:

| Part | Example (café: one reel + 2 stories) |
| --- | --- |
| Base fee for making and posting | ₹3,000 |
| Bonus per customer who redeems the creator's code, up to a cap | ₹30 per customer, cap ₹1,500 |
| Barter instead of a fee | allowed; counted the same way |

Customers are counted by coupon: the creator's link gives each visitor a coupon with the business's offer (e.g. 10%
off), and staff redeem it with the counter PIN or type the code in counter mode. (Built: `src/lib/marketplace/track.ts`.)

## Revenue: businesses pay for the platform

| Plan | Price (*assumption*, to test with the first 30 owners) | What it includes |
| --- | --- | --- |
| **Free** | ₹0 | Track 2 creator posts a month (paid or barter), coupons, counter mode, results |
| **Mitra Local** | ₹499/month | Unlimited tracked posts, 3 AI-matched creators a month, weekly report on WhatsApp (Kannada or English) |
| **Mitra Growth** | ₹1,499/month | Unlimited matches, payment protection (money held until the post is live, bonus paid per counted customer), the AI marketing manager, local cost-per-customer benchmarks, Verified creators first |
| **Brands and agencies** | Per campaign or yearly | Multi-city planner, reports, API |
| **Creator Pro** (optional, much later) | ₹99/month (panel range ₹50-300) | Growth tools only; never deals or visibility |

Per deal, only the payment provider's charge (~2%, *assumption*) is passed on, itemised. During the Bengaluru pilot
everything is free (`PLANS_ENFORCED = false` in `src/lib/marketplace/flag.ts`).

**When to ask for money:** after the free plan has counted customers ("You counted 38 customers from creators this
month. Upgrade to track every post"), never before.

**Why this holds up when people meet off the platform:** the value lives in Mitra (counting, bonus payouts,
protection, history, invoices, the AI), and the creator bonus is only paid through Mitra, so creators prefer to keep
deals here. A business that leaves loses its numbers; Mitra loses nothing.

What we will **not** sell: creators' contact details, access to creators, verification, visibility.

## How big this gets (*assumptions*, to replace with pilot numbers)

- Fixed costs are about ₹9,700/month (`founder/marketplace/cfo.md`): about 20 businesses on Mitra Local cover them.
- Bengaluru after the pilot: 100 paying businesses at ~₹800 average ≈ **₹80,000/month**, recurring.
- One city at depth: 1,000 paying businesses ≈ ₹8 lakh/month; plus brand campaigns.
- The numbers investors will ask for first: businesses that come back every month, customers counted per post,
  money flowing through Mitra, and the cost of signing up a business. Track records the first two now.

## Costs worth knowing

- Offer checks are rules and free public records: about zero per check. Screenshot reading uses a small AI model,
  about a rupee or less per read *assumption*, and costs the creator one credit.
- Lookups (domain registration, DNS, Wikidata) are cached for days to stay within free limits.

## Tax and legal points to settle with a CA before charging

- GST (18%) on Mitra's fee, invoiced to the business.
- If money flows through Mitra, Mitra may count as an e-commerce operator (TDS under section 194-O, and TCS under
  GST). Using a payment provider's split payouts doesn't remove this; get advice before switching it on.
- Businesses paying creators may need to deduct TDS (e.g. 194J/194C for fees, 194R for gifted products above the
  limit). Mitra can remind both sides, not decide for them.
- ASCI: every paid or gifted post carries "Paid partnership" or #ad. The offer check already reminds creators.

## Product changes that follow from this

- Built: Track (free customer counting for any creator post, barter included), coupons with counter-PIN redeem,
  counter mode, paid vs barter results. Next: base fee + bonus deals, the plans and the upgrade prompt, then payments.
- The 10% matched-deal fee shown on invites (`MITRA_FEE_PCT`, waived in the pilot) is replaced by the plans once they
  ship; until then it stays waived.
