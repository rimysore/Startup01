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
2. **Creators keep 100% of the fee they agree to.** Mitra's fee on a deal Mitra brought is paid by the business,
   on top, and both sides see it before anyone accepts. (`FEE_PAID_BY` in `src/lib/marketplace/flag.ts`.)
3. **No fee on deals creators find themselves.** The offer inbox, sender checks, deal log and media kit are free
   tools, forever.
4. **Every rupee is itemised** in the deal room: fee to creator, Mitra's fee, GST, payment charges.
5. **Pay for results, not promises.** Businesses pay when a deal is agreed, not to browse. Later, money is held by
   a payment provider until the post is live, and refunded if it never goes up.
6. **No dark patterns.** No auto-renew without a reminder, no hidden markups, no selling creator data, no fake
   "brands are looking at your profile" notifications, cancel in one click.

## Revenue, in the order it should switch on

| When | Stream | Who pays | Price (*assumption*) | Why it's fair |
| --- | --- | --- | --- | --- |
| Now to ~Jan 2027 | Nothing. Pilot in Bengaluru | Nobody | Free | We need proof (deals, repeat businesses) before charging |
| After 10+ businesses come back for a second campaign | **Platform fee on Mitra-matched deals** | Business, on top | 10% of the creator fee, min ₹199 per deal, + 18% GST on the fee | Agencies charge 15-20% and can't show customers per post; we show a promo-code count |
| Same time | Payment protection (via a payment provider's marketplace/split product) | Included in the fee | Payment charges ~2% *assumption* absorbed or itemised | The creator is paid on posting; the business gets a refund if nothing is posted |
| When businesses run monthly campaigns | **Mitra for Business** | Business | ₹999/month *assumption*: unlimited briefs, counter tools, monthly report, and the platform fee drops to 5% | Cheaper for regulars; optional |
| When brands/agencies arrive | **Managed campaigns** | Brand/agency | 15-20% service fee | We do the shortlisting, briefs and reporting for them |
| Once creators ask for it | **Creator Pro** (optional) | Creator | ₹99-149/month *assumption*: deeper Video Doctor, unlimited screenshot reads, AI-written replies, rate insights | Growth tools only; nothing about getting deals is behind it |
| Later | **Affiliate** (opt-in, disclosed) | Brand | Commission split, creator gets the larger share | Creator chooses the products; every post labelled |

What we will **not** sell: creators' contact details, access to creators, verification, visibility.

## What a deal looks like (example)

A café pays a creator ₹5,000 for one reel and two stories through Mitra.

| Line | Amount |
| --- | --- |
| Creator receives | ₹5,000 (100%) |
| Mitra's fee (10%), paid by the café | ₹500 |
| GST on Mitra's fee (18%) | ₹90 |
| Café pays in total | ₹5,590 |
| Payment charges if collected online (~2%, *assumption*) | ~₹112, from Mitra's fee |
| Mitra keeps | ~₹388 |

## How big this gets (*assumptions*, to replace with pilot numbers)

- Bengaluru pilot: 30 businesses × 2 deals a month × ₹388 ≈ **₹23,000/month**. Small, and that's fine; the pilot is
  for proof (repeat rate, customers per post), not revenue.
- One city at depth: 400 active businesses × 2 deals × ₹388 ≈ ₹3.1 lakh/month in fees, plus 150 on Mitra for Business
  (₹1.5 lakh) ≈ **₹4.6 lakh/month**.
- Five cities: ≈ **₹25-30 lakh/month**, before managed campaigns and Creator Pro.
- The numbers investors will ask for first: deals per business per month, second-campaign rate, customers per
  post (promo codes) and creator earnings through Mitra. The product already records all four.

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

- Invite and brief screens say who pays the fee and how much ("you receive ₹5,000 in full; the business pays Mitra's
  10% on top"), with the pilot waiver shown.
- The landing page's money answer says the same in plain words.
- Payments through Mitra (held until posting, refund if not) are the next build after a CA's sign-off.
