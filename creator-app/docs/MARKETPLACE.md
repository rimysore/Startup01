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

Mitra's fee is mentioned wherever a deal is logged: only on deals Mitra brought (`source = "mitra"`), never on
deals the creator found. No fee is charged in code yet.

## Before launch

- A native Kannada speaker checks every line in `i18n.ts`, the Kannada reply in `offer-check.ts` and the landing page.
- Instagram verification (Meta's API) is not built; Instagram numbers stay self-reported.
- The business side's matching, briefs and the CMO agent are weeks 3-4 (`opportunities` is ready for it).
- Check the Terms cover the marketplace (roles, deals made between users, Mitra not being a party to deals it
  didn't bring, the disclosed fee) with whoever reviews the legal pages.

## Tests

`tests/marketplace.test.mts` (joining, kits, verification rules, deal ownership, totals, rate ranges, account
deletion) and `tests/offer.test.mts` run in `npm test`.
