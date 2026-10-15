# Mitra — creator dashboard

A web app for YouTube creators who make videos in Hindi, Hinglish, Telugu, Tamil and other languages.
It connects to a creator's channel (read-only), explains why videos performed the way they did, and
helps with titles, thumbnails, comments and planning, in the creator's own language.

Runs out of the box in **demo mode** (a sample channel and sample AI answers). Add keys to go live.

## Run it

```bash
cd creator-app
npm install
cp .env.example .env.local   # optional, see below
npm run dev                  # http://localhost:3000
```

## Features

| Page | What it does | Data |
|---|---|---|
| `/` | Landing page | — |
| `/dashboard` | KPIs, 28-day views chart, weekly suggested actions, recent uploads | YouTube Data + Analytics API |
| `/dashboard/doctor` | Retention curve vs channel norm, drop/spike markers, AI diagnosis with fixes | Analytics API (`audienceWatchRatio`) + Claude |
| `/dashboard/studio` | AI titles, 15-second hook, thumbnail text; canvas thumbnail maker that renders Indian scripts correctly, exports 1280×720 PNG | Claude |
| `/dashboard/trends` | Trend ideas by language and niche | **Sample data** for now |
| `/dashboard/comments` | Mood, themes, questions, video ideas, reply drafts from mixed-language comments | `commentThreads` + Claude |
| `/dashboard/assistant` | "Ask Mitra" chat that knows the channel's numbers | Claude |
| `/dashboard/connections` | Connect / disconnect YouTube, setup status | Google OAuth |
| `/dashboard/billing` | Current plan, monthly AI credits, upgrade / cancel | Razorpay |
| `/login` | Google sign-in (plus a local test sign-in) | Google OAuth |

The output language (top bar) controls what language the AI writes in.

## Accounts, plans and payments

- **Sign-in:** "Continue with Google" (OpenID: email + profile). Sessions are random tokens in an httpOnly
  cookie; only their SHA-256 hash is stored. Locally there's also an email-only **test sign-in**
  (disabled in production unless `ALLOW_DEV_LOGIN=1`).
- **YouTube** is connected separately, after sign-in, with read-only scopes. Tokens are stored per user,
  encrypted (AES-256-GCM, key from `SESSION_SECRET`), and refreshed automatically.
- **Plans** (`src/lib/plans.ts`): Free (10 AI credits / month), Pro ₹399 (300), Creator+ ₹999 (1,000).
  One credit = one AI answer. Credits are reserved atomically before the AI call and refunded if it fails.
  Signed-out visitors get sample answers only, so the public demo costs nothing.
- **Payments:** Razorpay Subscriptions (UPI Autopay, cards, netbanking).
  1. The billing page calls `POST /api/billing/checkout`, which creates a subscription and opens Razorpay Checkout.
  2. On success the browser posts the signed response to `/api/billing/verify` (HMAC of `payment_id|subscription_id`).
  3. `POST /api/billing/webhook` (HMAC of the raw body, de-duplicated by `X-Razorpay-Event-Id`) keeps plans in
     sync for renewals, failed payments (`halted` → Free) and cancellations.
  4. Cancelling keeps the plan until the end of the paid period.
  Without Razorpay keys, local builds run upgrades in **test mode** (no money moves).

## Going live

1. **Database:** set `DATABASE_URL` to a Postgres database (Neon, Supabase, RDS…). Tables are created
   automatically on first request from the SQL in `drizzle/`. After changing `src/db/schema.ts`, run
   `npm run db:generate` to add a migration. Locally, an embedded Postgres in `.data/` is used instead.
2. **Secrets:** set `SESSION_SECRET` (≥32 random characters).
3. **AI:** set `ANTHROPIC_API_KEY`. Calls use `claude-opus-5-5` with structured outputs
   (`src/lib/ai.ts`) and server-side refusal fallbacks enabled.
4. **Google:** in Google Cloud, enable *YouTube Data API v3* and *YouTube Analytics API*, create an
   OAuth client (Web application) and add `<your-url>/api/auth/google/callback` as a redirect URI.
   Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - The YouTube scopes are *sensitive*: while the Google app is in "Testing", only test users you add
     can connect. Public launch needs Google's OAuth verification, so start that early.
5. **Razorpay:** in Test Mode first. Create two monthly plans (₹399, ₹999) and set `RAZORPAY_PLAN_PRO` /
   `RAZORPAY_PLAN_CREATOR`; set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`; add a webhook to
   `<your-url>/api/billing/webhook` for the `subscription.*` events and set `RAZORPAY_WEBHOOK_SECRET`.
   Before charging real customers you'll also need Razorpay account activation (KYC) and published
   terms, privacy and refund policies.

## Tests

`npm test` runs the credit-limit and plan-entitlement tests against an in-memory database.

## Architecture

- Next.js 16 (App Router, Cache Components) + Tailwind v4, TypeScript, Drizzle ORM on Postgres.
- Pages are client components that read from route handlers under `src/app/api/`.
- Without keys, data endpoints return demo data (`src/lib/demo.ts`, `src/lib/demo-ai.ts`), so the whole
  product can be demoed offline.

## Not built yet

Live trend data, WhatsApp weekly reports, Instagram, GST invoices, team seats for the Agency plan,
interface translation (only AI output is multilingual today), terms/privacy pages.
