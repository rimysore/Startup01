# Launch checklist: free pilot (target: one week)

Goal: open Mitra free in Bengaluru and measure interest on both sides. Creators join the pilot waitlist (and can
create a free account); businesses, brands and agencies sign up. Nothing is charged. Numbers live at
`/dashboard/pilot` (admins).

## Do we need a company to launch?

Not to launch free (judgement; confirm with a CA). Collecting sign-ups, running a free product and measuring interest
can be done by the current operator (an individual, as the legal pages say). You need a registered company before:
charging anyone (GST registration and invoices), taking money through Razorpay/Cashfree, applying for DPIIT or
Indian grants, or signing contracts with brands. The research (`founder/research/02-funding.md`) recommends
incorporating an Indian Pvt Ltd in Karnataka in November anyway. What applies from day one regardless: India's
DPDP Act (consent, purpose, deletion: the privacy page and account deletion cover these), ASCI disclosure rules for
paid posts, and Google and Instagram (Meta) platform terms.

## What the launch looks like

| Visitor | What they do | Where |
| --- | --- | --- |
| Creator | "Join the pilot, free" → waitlist form (role, handle, area, language). After joining: "Create your free account" | Landing `#join`, then `/m/start?role=creator` |
| Creator with an account | Home: free-pilot notice (Pro and Agency coming), **Collabs for you** (every listed business and brand, ranked to the creator's area and niches, with reasons and "Interested"), **Open programs** (10 real programmes), invites, offer inbox, media kit | `/m` |
| Creator connecting | **Instagram only** (YouTube is off for launch). "Connect Instagram" on home and at the top of the profile: followers, average views (median of recent reels), engagement rate, posts a week, share of reels, audience (top cities, ages, % women), last 6 posts. Fills empty profile fields from the bio and captions: name, bio, niches, languages, area. Never overwrites what the creator typed | `/m`, `/m/kit#verify` |
| Business / brand / agency | "Sign up your business, free" → Google sign-in → role, language → profile (listed for creators straight away; can unlist) → home shows interested creators and creators who fit → Track a post | `/m/start?role=business` |
| Admin | Members (everyone, with verified accounts and usage), Pilot numbers, Open programs | `/dashboard/members` |

`/dashboard` is **admin-only** when the marketplace is on: members are sent to `/m`. Creators who can't connect
yet can type their Instagram numbers (shown as self-reported). The whole product is labelled **Beta**. The old
YouTube analytics product is kept on the `analytics-dashboard` branch (a copy of `prod` before this launch).

## Before going live (owner)

1. **Google Cloud → OAuth consent screen → Publishing status: In production.** Google is only used for sign-in
   now (email, profile), which needs no Google verification. In "Testing", Google blocks sign-in for everyone not
   on the test list.
2. **Vercel production environment variables**
   - `NEXT_PUBLIC_MARKETPLACE=1` (turns on `/m`, sign-up, Track; without it the landing only offers the waitlist)
   - `NEXT_PUBLIC_INVITE_ONLY=0` once the consent screen is in production (hides the "private beta" note on sign-in)
   - `ADMIN_EMAILS` = founders' emails (pilot numbers, programs admin)
   - `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL=https://trymitraapp.com`
   - `SMTP_USER` / `SMTP_PASS` (invite emails), `CRON_SECRET`
   - Optional: `NEXT_PUBLIC_SUPPORT_WHATSAPP` (WhatsApp button on the landing), `ANTHROPIC_API_KEY` (screenshot
     reading in the offer inbox; pasting and forwarding work without it), `INBOUND_EMAIL_DOMAIN` +
     `INBOUND_EMAIL_SECRET` (email forwarding; hidden until set)
3. **Instagram (Meta app): the launch depends on this.** Without it the Instagram button says "opens soon" and
   creators can only type their numbers.
   - developers.facebook.com → Create app → type Business → add the **Instagram** product → "API setup with
     Instagram login".
   - Valid OAuth redirect URI: `https://trymitraapp.com/api/auth/instagram/callback` (and
     `http://localhost:3000/api/auth/instagram/callback` for testing).
   - Vercel env: `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` (the *Instagram* app id and secret on that page, not the
     Facebook app's).
   - Permissions: `instagram_business_basic` (profile, posts, likes, comments) and
     `instagram_business_manage_insights` (views and audience). Until **App Review** approves both (privacy policy
     URL `https://trymitraapp.com/privacy`, a screencast of connect → profile filled, data-deletion instructions =
     the privacy page; usually 1-2 weeks), only accounts added under App roles → Instagram testers can connect, and
     each tester must accept the invite in Instagram (Settings → Website permissions → Tester invites). Submit on day 1.
   - Audience numbers need 100+ followers; views need posts from after the account turned professional. Missing
     ones are simply left out.
   - Only professional (creator or business) Instagram accounts can connect; personal accounts are told to switch
     (free, in Instagram settings).
4. **Database:** migrations 0012-0018 run automatically on deploy (`npm run db:migrate` in the Vercel build). All are
   additive. 0017 seeds the 10 open programs; 0018 adds verified stats, Instagram connections and business listing.
5. **Content**
   - Add the co-founder to `TEAM` in `src/lib/company.ts`.
   - A native Kannada speaker checks `src/lib/marketplace/i18n.ts`, the landing page and the coupon page.
   - Review the 10 seeded programs at `/dashboard/programs` (links, eligibility) and hide any you don't want shown.
   - Add local businesses there **only with the owner's permission**.
6. **Smoke test on the production URL** (15 minutes): join the waitlist as a creator; sign up as a creator and see
   10+ open programs; mark one "I'm interested"; connect Instagram (as a tester until App Review approves) and check the profile filled itself; sign up as a business
   in the same area and check it appears in the creator's "Collabs for you"; mark it interested and check the
   business sees the creator; track a post, set a PIN, open the link on a phone, redeem; check `/dashboard/members`
   and `/dashboard/pilot` show all of it.

## The week

| Day | Product (USA) | People (India) |
| --- | --- | --- |
| 1 | Merge to dev, preview, fix anything found | Kannada check of all copy; pick 2 neighbourhoods |
| 2 | Consent screen to production; prod env vars | List 50 creators and 30 businesses to contact |
| 3 | Production deploy (after your go-ahead); smoke test | Add the first local businesses (with permission) |
| 4 | Watch `/dashboard/pilot`; fix issues | Post the waitlist link in 10 creator WhatsApp groups |
| 5-7 | Daily numbers; small fixes only | Walk into businesses: "free customer counter" |

**Numbers to read daily:** waitlist by role, accounts by role, creators interested in programs (which ones),
businesses tracking, customers counted.

## What's switched off for launch

- Paid plans (`PLANS_ENFORCED = false`): pricing is shown, nothing is charged; "I'd pay for this" is recorded.
- Payments through Mitra (needs a company and a CA's sign-off).
- The YouTube analytics tools: `/dashboard` is admin-only; the full product lives on the `analytics-dashboard` branch.
