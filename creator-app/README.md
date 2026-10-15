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
| `/terms`, `/privacy`, `/refunds`, `/contact` | Legal and contact pages (required by Razorpay and Google's OAuth review) | `src/lib/company.ts` |

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
3. **AI:** set `ANTHROPIC_API_KEY` and `AI_DAILY_BUDGET_USD`. See "AI costs and guardrails" below.
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

## Legal pages

`/terms`, `/privacy`, `/refunds` and `/contact` describe what the app actually does (data collected, YouTube
Limited Use, cookies, credits, auto-renewal, cancellation and refunds, grievance officer). Before launch:

1. Fill in every `[bracketed]` value in `src/lib/company.ts` — the pages show a "Draft" banner until you do.
2. Fill in your hosting and database providers in the Privacy Policy's provider table.
3. Have a lawyer review the text. The refund rules (7 days / 20 credits for a first-payment refund) are a
   business choice; change them in `src/app/refunds/page.tsx` if you prefer different terms.
4. Update `LEGAL_EFFECTIVE_DATE` whenever the text changes.

Users can delete their account from Plan & billing; this cancels any live Razorpay subscription first and
then removes all their data.

## AI costs and guardrails

Every AI endpoint goes through one pipeline (`src/lib/ai-route.ts`), cheapest checks first:

| Step | What it does | Response |
|---|---|---|
| Validate input | Zod schemas cap every field (topic 500 chars, 60 comments × 1,000 chars, 12 chat turns / 8,000 chars) | 400 |
| Sample answers | Signed-out visitors (and servers without a key) get free sample answers — the public demo costs nothing | 200 |
| Rate limit | Max `AI_RATE_PER_MINUTE` (8) real calls per user per minute | 429 |
| Answer cache | Same user + same input within 6–24 h returns the stored answer: no model call, no credits | 200 |
| Daily budget | Once today's spend reaches `AI_DAILY_BUDGET_USD`, AI pauses until 00:00 UTC | 503 |
| Credits | Reserved atomically per plan; Video Doctor costs 3, everything else 1 | 402 |
| Model call | Routed model (below); refusals and cut-off answers refund the credits | 422 / 502 |
| Clean-up | Scores, percentages and list lengths clamped; text trimmed before display | — |
| Logging | Tokens, cost and latency per call in `ai_calls` (no content); `GET /api/admin/costs` for admins | — |

**Model routing** (`src/lib/ai.ts`, overridable per feature with `AI_MODEL_<FEATURE>` / `AI_EFFORT_<FEATURE>`):

| Feature | Model | Effort | ≈ cost per answer* |
|---|---|---|---|
| Video Doctor | Claude Sonnet 5.5 | medium | $0.034 (₹3) |
| Titles, Comments, Ask Mitra | Claude Haiku 5.5 | low | $0.002 (₹0.15) |

*2,000 input + 3,000 output tokens at ₹88/$. Worst case per plan if every credit is spent on Video Doctor:
Free ≈ ₹9, Pro ≈ ₹300 of ₹399, Creator+ ≈ ₹1,000 of ₹999 (break-even — consider 750 credits for Creator+).
Real usage mixes features and repeats (cache hits are free), so typical cost is far lower; check `/api/admin/costs`.

**Prompt safety:** a fixed system prompt carries YouTube Community Guidelines rules; text from other people
(video titles, comments, channel data) is wrapped in `<untrusted>` tags the model is told never to obey; chat is
limited to creator topics; Sonnet requests use Anthropic's server-side refusal fallback.

**Comment clean-up before AI** (`src/lib/comment-filter.ts`, plain code, free): link/phone spam and duplicates
dropped, emoji and one-word reactions folded into one count line, the 40 most-liked comments kept, each trimmed
to 300 chars. About a third fewer input tokens on a typical batch of 60.

`tests/ai-pipeline.e2e.py` checks all of this against a local mock of the Anthropic API (`tests/mock-anthropic.mjs`).

## YouTube quota and caching

Google gives a project 10,000 YouTube Data API units a day. Mitra uses only 1-unit calls (no `search.list`, which
costs 100): a dashboard load is 3 units plus 2 Analytics API calls (separate quota), comments are 1 unit.

`src/lib/memo.ts` caches every YouTube response in two levels: server memory, then Postgres (encrypted, shared by
all instances). Fresh for 1 h (channel summary), 6 h (comments) and 24 h (retention; YouTube Analytics only
updates about daily). Requests arriving together share one call. If YouTube fails or the quota runs out, the last
good copy (up to 7 days old) is shown with a notice instead of demo data. On a cache hit no token is decrypted
or refreshed.

Tokens refresh 5 minutes before expiry, with concurrent requests sharing one refresh. If Google answers
`invalid_grant` (the user revoked access), the connection is flagged, Google is not called again, and
Connections shows **Reconnect YouTube**.

## Tests

`npm test` runs the credit-limit, plan-entitlement, YouTube cache, token-refresh and comment-filter tests against
an in-memory database. See the AI section above for the end-to-end pipeline test.

## Architecture

- Next.js 16 (App Router, Cache Components) + Tailwind v4, TypeScript, Drizzle ORM on Postgres.
- Pages are client components that read from route handlers under `src/app/api/`.
- Without keys, data endpoints return demo data (`src/lib/demo.ts`, `src/lib/demo-ai.ts`), so the whole
  product can be demoed offline.

## Not built yet

Live trend data, WhatsApp weekly reports, Instagram, GST invoices, team seats for the Agency plan,
interface translation (only AI output is multilingual today).
