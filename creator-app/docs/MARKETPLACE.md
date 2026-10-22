# Marketplace, phase 1 (weeks 1-3)

The new direction: paid deals between Kannada and English creators and the businesses near them, Bengaluru
first. Plan: `founder/vision/PLAN-marketplace.md` on the `claude/bold-curie-ex5854` branch.

## Switching it on

Behind `NEXT_PUBLIC_MARKETPLACE`. On by default in local development; off in production and previews unless set to
`1` (set `0` to force it off locally). While off, every `/m`, `/kit` and `/api/m` route answers 404 and the landing
page's hero button scrolls to the pilot waitlist instead of the sign-up. The live beta (dashboard, Video Doctor,
Studio) is untouched either way.

## What's built

| Week | Piece | Where |
| --- | --- | --- |
| 1 | Data model: `members` (role, screen language), `creator_profiles`, `creator_handles` (self-reported or verified), `business_profiles`, `opportunities`, `deals`, `deal_outcomes`, `consents`. All cascade-delete with the account. Migration `drizzle/0012_marketplace.sql` only creates tables. | `src/db/schema.ts`, `src/lib/marketplace/store.ts` |
| 1 | English and Kannada screen text (type-checked so a missing key fails the build) | `src/lib/marketplace/i18n.ts` |
| 2 | Sign up without connecting: Google sign-in asks only for name and email; `/m/start` picks the role (creator, local business, brand, agency) and language, and logs the Terms and contact consents with a wording version | `/m/start`, `POST /api/m/join` |
| 2 | Media kit: name, line, area, niches, languages, accounts on six platforms with typed numbers labelled **Self-reported**, rates, contact email, public switch | `/m/kit`, `PUT /api/m/kit` |
| 2 | Verified: with YouTube connected (read-only), "Verify with YouTube" replaces the typed number with the real subscriber count. It can't be overwritten by typing; changing the handle drops it; it lapses after 30 days (YouTube API data rule; the daily clean-up clears it) | `POST /api/m/kit/verify`, `src/lib/reports/run.ts` |
| 2 | Public media kit, shareable with any brand, honest about which numbers are verified; `noindex` | `/kit/<slug>` |
| 2 | Business profile (name, category, area, private budget range, website, Instagram) | `/m/business`, `PUT /api/m/business` |
| 3 | Paste an offer in the app: the rule-based checker (pay, deliverables, date, payment timing, usage, exclusivity, disclosure), a reply in English or Kannada, and the deal form pre-filled with the fee and deliverables | `/m/offers/new`, `src/lib/offer-check.ts` |
| 3 | Private deal log: status (offered → talking → agreed → posted → paid, or declined/cancelled), terms, promo code, tracked link, customers, amount paid, date, rating, notes; totals for money received and open deals | `/m/deals`, `/m/deals/<id>`, `/api/m/deals` |
| 3 | Fair-rate range: the middle half (25th-75th percentile) of rates other creators in the same niche set, shown only once 5 or more have shared one | `rateRange()` in `store.ts` |

### Weeks 3-4: the business side

| Piece | Where |
| --- | --- |
| Migration `0013_marketplace_business.sql` (additive): `invites`, `deal_messages`; creators' `open_to_offers` and `whatsapp`; businesses' `whatsapp`; briefs' `post_by` and `destination_url`; outcomes' `link_code` (unique) and `clicks` | `src/db/schema.ts` |
| Brief: goal (presets or own words), details, what to post, kind of creators, language, total budget, area, date, an https link for viewers | `/m/briefs/new`, `POST /api/m/briefs` |
| Matching with a reason for every suggestion: shared niche or same area required; language, verified reach and a rate inside the budget rank higher; creators priced above the whole budget are left out. Only creators who switched on "Let local businesses find me" (logged as a `matching` consent) are ever suggested | `matchCreators()` in `src/lib/marketplace/business.ts` |
| Mitra's plan: the best matches whose fees fit the budget, then a suggested share for creators who haven't set a price, and what's left over | `planBudget()` |
| Invites with the fee and a note; creators get an email, see the brief, the terms (base fee or barter, plus any bonus per customer; Mitra takes no cut) and the offer checker's reading, then accept or decline. Contact details are shared only on accept | `/m/briefs/<id>`, `/m/invites/<id>`, `/api/m/invites/<id>` |
| On accept: the deal opens in the creator's log as a Mitra deal, with a promo code (business name + creator initials, e.g. RUCHI-SR) and a tracked link `/r/<code>` that counts visits and redirects to the brief's https link | `respondToInvite()`, `src/app/r/[code]/route.ts` |
| Deal room for both sides: terms, code, link, WhatsApp/email hand-off, messages; the creator marks it posted, the business counts customers at the counter (+1/−1) and records payment; both rate | `/m/room/<id>` |
| Results per brief: customers, paid to creators, cost per customer (once something is paid), link visits | `briefResults()` |

Matching reasons are written in English for now, also on Kannada screens.

### The offer inbox (in-house checking)

| Piece | Where |
| --- | --- |
| Migration `0014_offer_inbox.sql` (additive): `inbox_offers`, `sender_reports`, `lookup_cache`, `members.inbox_token` | `src/db/schema.ts` |
| Ways in: paste (with who sent it), screenshot (AI transcribes it; image not kept; 1 credit through the usual credit/limit pipeline), forwarding email to `offers+<token>@INBOUND_EMAIL_DOMAIN`, and WhatsApp (offers sent to the bot are saved and checked; no AI) | `/m/inbox`, `/api/m/inbox*`, `/api/inbound/email`, `src/lib/whatsapp/bot.ts` |
| Sender check: scam patterns (pay-to-collaborate, buy-then-refund, OTP/PIN, task jobs, APKs, crypto, urgency, short links); free mail vs the brand's domain; RDAP domain age; DNS MX; Wikidata official website and lookalikes; other creators' reports (shown only when 2+ agree); businesses that paid creators through Mitra. Each finding names its source; lookups are cached and time out after 4 s | `src/lib/marketplace/sender-check.ts` |
| Inbox actions: reply in English or Kannada, save to the deal log (pre-filled), dismiss, report "scam" / "went fine", correct who sent it (re-checks) | `/m/inbox/<id>` |

**Turning on email forwarding:** point an inbound-email service at `POST /api/inbound/email` with header
`x-inbound-secret: $INBOUND_EMAIL_SECRET` (Postmark's inbound JSON works as is; anything posting `{ from, to,
subject, text }` works too), route `offers+*@<domain>` to it, and set `INBOUND_EMAIL_DOMAIN` and
`INBOUND_EMAIL_SECRET` in Vercel. Until then the inbox says forwarding opens soon.

### Track: counting customers from any creator post

| Piece | Where |
| --- | --- |
| Migration `0015_track_coupons.sql` (additive): `tracked_posts`, `coupons`, `business_profiles.counter_pin_hash` | `src/db/schema.ts` |
| A business tracks any creator post, paid (base fee) or barter, found on Mitra or not; gets a promo code (unique per business) and a link `/r/<code>` | `/m/track`, `/m/track/new`, `/m/track/<id>`, `POST /api/m/track` |
| The link gives each visitor a coupon (cookie keeps the same one) at `/c/<id>`: the offer, the code, and a staff-only box; English and Kannada together | `src/app/r/[code]/route.ts`, `src/app/c/[id]/page.tsx` |
| Staff redeem with the counter PIN (hashed with scrypt; 5 tries per coupon; PIN redeeming pauses after 20 wrong PINs in an hour per business), or type the code in counter mode (10-minute undo) | `POST /api/c/<id>/redeem`, `/m/track/counter`, `/api/m/track/counter`, `/api/m/track/pin` |
| Results: customers per post, cost per customer for paid posts, paid vs barter totals. Mitra deals get a tracked post sharing their code and link, so coupons count towards the deal | `src/lib/marketplace/track.ts` |
| First screen: business home leads with Track; creators land on the inbox; sign-in goes to `/m` when the marketplace is on; the growth tools stay at `/dashboard` | `src/app/m/page.tsx`, `MTop.tsx`, `safeNext()` |

Free plan allowance (`FREE_TRACKED_PER_MONTH = 2`) applies only once `PLANS_ENFORCED` is switched on; the pilot is unlimited.

### Deals and plans (weeks 3-4)

| Piece | Where |
| --- | --- |
| Migration `0016_deals_bonus_plans.sql` (additive): invite kind / barter / bonus, deal bonus, tracked-post bonus, business plan and plan interest | `src/db/schema.ts` |
| Deal terms: a base fee for the post or barter, plus an optional bonus per counted customer up to a cap, all to the creator. Validation, bonus earned, amount owed, most a creator can earn, cost per customer | `src/lib/marketplace/money.ts` |
| Invite card (paid/barter, bonus, cap, "most they can earn"), the creator's invite page, the deal room (bonus earned, owed so far; payment pre-filled with it), Track form and post page | `BriefParts.tsx`, `/m/invites/<id>`, `/m/room/<id>`, `TrackParts.tsx`, `/m/track/<id>` |
| Plans: Free / Mitra Local ₹499 / Mitra Growth ₹1,499 (`PLANS` in `flag.ts`); limits apply only when `PLANS_ENFORCED`; owners can say "I'd pay for this" (recorded, never charged); after 10+ counted customers in a month on Free, Track and home suggest upgrading | `src/lib/marketplace/plans.ts`, `/m/plans`, `PUT /api/m/plans` |

### Who pays

Creators never pay, and Mitra takes no cut of deals: the creator gets the whole base fee and every bonus. Businesses
pay for the platform (the plans above); everything is free during the pilot. See `docs/BUSINESS_MODEL.md`.

## Before launch

- A native Kannada speaker checks every line in `i18n.ts`, the Kannada reply in `offer-check.ts` and the landing page.
- Instagram verification (Meta's API) is not built; Instagram numbers stay self-reported.
- Payments go between the two sides directly (UPI, cash); Mitra records them. Split payouts through a payment
  provider come after a CA confirms the setup (weeks 5-6).
- `PLANS_ENFORCED` in `flag.ts` stays off until billing exists (Razorpay subscriptions, after a CA confirms GST invoicing).
- Check the Terms cover the marketplace (roles, deals made between users, Mitra not being a party to deals it
  didn't bring, the disclosed fee) with whoever reviews the legal pages.

## Tests

`tests/marketplace.test.mts` (joining, kits, verification rules, deal ownership, totals, rate ranges, account
deletion), `tests/business.test.mts` (opt-in, matching and its reasons, the plan, invites, contact hand-off only
after accepting, deal room access, counters, payments, tracked links, deletion) and `tests/offer.test.mts` run in
`npm test`, with `tests/inbox.test.mts` (scam patterns, sender checks against a fake network, caching, reports,
privacy, forwarding webhook) `tests/track.test.mts` (codes, coupons, PIN limits, counter mode, totals, deal link-up,
deletion) and `tests/deals.test.mts` (terms, bonus maths, invites to deals to tracked posts, plans, nudge) alongside.
