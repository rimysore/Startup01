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
paid posts, and Google/YouTube API terms.

## What the launch looks like

| Visitor | What they do | Where |
| --- | --- | --- |
| Creator | "Join the pilot, free" → waitlist form (role, handle, area, language). After joining: "Create your free account" | Landing `#join`, then `/m/start?role=creator` |
| Creator with an account | Home: free-pilot notice (Pro and Agency coming), invites, **Open programs** (10 real programmes + local businesses you add), offer inbox, media kit | `/m` |
| Creator verifying | "Connect YouTube to verify" asks Google only for read-only channel details; the subscriber count replaces the typed number automatically | `/m/kit#verify` |
| Business / brand / agency | "Sign up your business, free" → Google sign-in → role, language → profile → Track a post | `/m/start?role=business` |

Instagram numbers stay self-reported (Meta's API isn't connected).

## Before going live (owner)

1. **Google Cloud → OAuth consent screen → Publishing status: In production.** In "Testing", Google blocks sign-in
   for everyone not on the test list. Sign-in (email, profile) needs no verification. YouTube read-only is a
   sensitive scope: until Google verifies the app, creators see "Google hasn't verified this app" when verifying
   and there's a 100-user cap for that scope. Submit verification (`docs/GOOGLE_VERIFICATION.md`) with only
   `youtube.readonly` for the marketplace.
2. **Vercel production environment variables**
   - `NEXT_PUBLIC_MARKETPLACE=1` (turns on `/m`, sign-up, Track; without it the landing only offers the waitlist)
   - `NEXT_PUBLIC_INVITE_ONLY=0` once the consent screen is in production (hides the "private beta" note on sign-in)
   - `ADMIN_EMAILS` = founders' emails (pilot numbers, programs admin)
   - `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL=https://trymitraapp.com`
   - `SMTP_USER` / `SMTP_PASS` (invite emails), `CRON_SECRET`
   - Optional: `NEXT_PUBLIC_SUPPORT_WHATSAPP` (WhatsApp button on the landing), `ANTHROPIC_API_KEY` (screenshot
     reading in the offer inbox; pasting and forwarding work without it), `INBOUND_EMAIL_DOMAIN` +
     `INBOUND_EMAIL_SECRET` (email forwarding; hidden until set)
3. **Database:** migrations 0012-0017 run automatically on deploy (`npm run db:migrate` in the Vercel build). All are
   additive. 0017 seeds the 10 open programs.
4. **Content**
   - Add the co-founder to `TEAM` in `src/lib/company.ts`.
   - A native Kannada speaker checks `src/lib/marketplace/i18n.ts`, the landing page and the coupon page.
   - Review the 10 seeded programs at `/dashboard/programs` (links, eligibility) and hide any you don't want shown.
   - Add local businesses there **only with the owner's permission**.
5. **Smoke test on the production URL** (15 minutes): join the waitlist as a creator; sign up as a creator and see
   10+ open programs; mark one "I'm interested"; sign up as a business, track a post, set a PIN, open the link on a
   phone, redeem; check `/dashboard/pilot` shows all of it.

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
- The YouTube analytics tools stay at `/dashboard`, off the first screen.
