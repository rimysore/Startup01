# Mitra: short-term plan (next 12 weeks, from 21 Oct 2026)

## The deal model, corrected: fee for the reel + bonus per customer
Creators need a guaranteed fee to make a reel; that is the motivation. Pay-per-customer alone won't work for them. Businesses want to pay for results. So every Mitra deal has two parts:

| Part | Who gets it | Example (café, one reel + 2 stories) |
| --- | --- | --- |
| **Base fee:** paid for making and posting the content | Creator, 100% | ₹3,000 |
| **Customer bonus:** a set amount per customer who redeems the creator's code, up to a cap | Creator, 100% | ₹30 per customer, cap ₹1,500 (50 customers) |
| **Payment charges:** itemised, never hidden | Payment provider | ~2% of what's collected |

**Mitra doesn't take a cut of deals** (updated 21 Oct): businesses pay a monthly plan instead: Free (2 tracked posts a month), Mitra Local ₹499, Mitra Growth ₹1,499 (payment protection, AI marketing manager), so a deal done off the platform costs Mitra nothing. See `creator-app/docs/BUSINESS_MODEL.md`.

With payment protection, the business pays the deal upfront inside Mitra: ₹3,000 + ₹1,500 bonus cap + charges. Then:
- **Base fee is released to the creator** when the post is live. The business confirms, or it is released automatically 48 hours after the creator submits the link with no complaint.
- **Bonus is released weekly** for counted customers.
- **Unused bonus goes back to the business** when the deal closes, 14 days after posting.
- **Barter deals** and deals the business found itself: tracking free, no Mitra fee.

Why this works:
- Creators are paid for the work, can earn more when they bring customers, and get paid on time because the money is already collected.
- Businesses risk only the base fee for the post itself. The rest is paid per result, and they get a refund if customers don't come.
- Mitra gets paid by the plan, so nobody has a reason to go around it; the bonus only pays out through Mitra, so creators prefer to keep deals here. Every rupee is recorded.

**The payment gateway is built on a provider's marketplace product, not our own licence.** Razorpay Route or Cashfree Easy Split hold the money and split payouts. Being a payment aggregator ourselves needs RBI authorisation and large net-worth requirements, so don't. A CA must confirm GST, TDS (194-O / 194J / 194R) and how turnover is booked before money moves. Until then, use payment links for Mitra's fee only, and record the creator's payment.

## 12-week goals

| Weeks | Build (product) | Do (people) | Goal at the end |
| --- | --- | --- | --- |
| **1–2** (to 4 Nov) | ✅ Built on `claude/track-redeem`: analytics off the first screen; free **Track** (code + link for any creator post, barter included); **customer coupon** redeemed with the counter PIN or counter mode. | Choose the company setup with a CA. Submit YC W27 (2 Nov). Recruit 2 city reps. Pick 1–2 neighbourhoods (e.g. Indiranagar + Koramangala), food only. | Track and redeem are live on a preview; company setup decided |
| **3–4** | **Deal = base fee + customer bonus** (invites, deal room, results). Deal types: paid / barter. **Plans** (Free / Local ₹499 / Growth ₹1,499) with the "you counted X customers, upgrade" prompt. | Reps walk into 30 food places with "free customer counter". Seed creators: WhatsApp-forward scam check in 10 creator groups, 3 paid creator reels about it. | 15 businesses using Track; 60 creators signed up; 3 businesses with a brief |
| **5–6** | **Payments inside Mitra** via a provider's split product (after CA sign-off): collect upfront, hold, release the base fee on posting, bonus weekly, refund unused. Invoices. | Close the first 5 matched paid deals, hand-held. Check counts against bills at 3 cafés. | 5 paid deals with money through Mitra; counts within ~20% of bills; first owners on a paid plan |
| **7–8** | AI marketing manager on WhatsApp (voice brief → plan → report), first predicted cost per customer, public case-study page (with permission). | Publish 3 case studies. Meta creator-ad test ₹10–15k. Ask every business for a second deal. | **Gate:** 10+ businesses briefed, 5+ paid deals, 3+ repeat, counted outcomes on 3+ |
| **9–12** | Creator wallet (earned / held / paid), payout history; post-checking agent that releases the base fee. Small fixes from watching 5 owners and 5 creators use it. | Grow to 50 businesses on Track, 20 paying matched deals a month. Collect the pilot numbers deck. Apply to the next cohorts (below). | ~20 matched deals/month, ~₹1L/month GMV through Mitra, repeat rate known |

**The numbers to report every week:** businesses on Track, codes redeemed, matched deals (paid / barter), GMV through Mitra, repeat businesses, creators who came through the inbox without a founder DM, cost to sign up a business.

**Spend in 12 weeks** *(estimates)*: CA + company + GST ~₹25–30k; legal review of terms ~₹15k; reps ~₹30–40k; creator reels + Meta test ~₹25k; total **~₹1–1.1 lakh**.

## Funding: honest chances right now
My judgement of the odds, not data. Each line says what moves it.

| Option | Fit | Chance now (pre-traction) | After the week-8 gate | What moves it |
| --- | --- | --- | --- | --- |
| **YC W27** (deadline 2 Nov) | Medium. Live product and a clear wedge, but no deals; one founder part-time; the founder is remote from the market | **Low, ~2–4%** (overall YC acceptance is low single digits) | Spring 2027 batch: **~5–8%** with real deal numbers | Both founders full-time; 5+ paid deals and repeat; a crisp "why we win Bengaluru" |
| **Antler India** (pre-seed, residency) | Good: backs early teams | **~10–15%** | **~20–25%** | Full-time commitment; one founder in India |
| **100X.VC** (cohorts) | OK | **~5%** | **~15%** | Revenue and repeat numbers |
| **Google for Startups Accelerator India** (equity-free, AI-first) | Medium: needs a real AI angle (offer reading, matching, cost-per-customer prediction) | **~5%** | **~10–15%** (2027 window ~Mar–Apr) | Show the AI parts as core, not add-ons |
| **Startup India Seed Fund via an incubator** (grant up to ₹20L) | Good if Indian entity + DPIIT | **~15–25%** once incorporated | **~30–40%** | Indian Pvt Ltd, DPIIT, an incubator in Bengaluru |
| **Karnataka ELEVATE** (up to ₹50L grant) | Good if Karnataka entity | Not eligible yet | **~10–20%** next general call (~May 2027) | Karnataka-registered company |
| **Angels / pre-seed** (consumer and D2C founder angels, angel networks) | Good after proof (Influish raised from this crowd) | **~5%** | **~25–35%** for a ₹50L–1.5 crore round | 3 public case studies, GMV growing month on month, repeat businesses |

**The big vision (local performance ads + creator payments) helps the story**, but nobody funds the vision alone at this stage. Investors will ask:
1. Do businesses come back?
2. Is the customer count trusted?
3. Does money flow through Mitra?
4. Can you get businesses without founders walking in?

The week-8 gate answers 1–3. The reps and the inbox seeding test 4.

**Biggest fixable negatives:** a part-time co-founder, and the product founder being in the US. Committing to full-time, or one founder spending the pilot months in Bengaluru, raises every row above more than any feature would.

Not financial, legal or tax advice.
