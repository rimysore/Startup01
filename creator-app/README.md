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
| `/dashboard/studio` | YouTube research of viral hits, AI titles, 15-second hook; pro thumbnails (the creator painted into a new scene by Gemini), editable canvas text in every Indian script, 1920×1080 JPEG export | Claude, Gemini, Cloudflare |
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
- **Plans** (`src/lib/plans.ts`): Free (10 AI credits / month), Pro ₹99 launch price (100), Creator+ ₹249 (250); Agency ₹1,999 is sold by conversation. The first 100 creators to connect a channel become **Founding Creators** (`users.founder_number`) with a **Founder Pass**: 50 free uses a month, for life, of the small-model features (titles, thumbnails, trends, audience, slang, comments, Ask Mitra), counted in `usage.founder_uses` apart from credits. Video Doctor and pro thumbnails still use credits.
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
   - Use Mitra's official account, **mitracontentsupport@gmail.com**, as the Google Cloud project owner,
     the consent screen's *User support email* and *Developer contact*. Add it to `ADMIN_EMAILS` so it
     sees AI costs and the creator finder.
5. **Razorpay:** in Test Mode first. Create two monthly plans (₹99, ₹249) and set `RAZORPAY_PLAN_PRO` /
   `RAZORPAY_PLAN_CREATOR`; set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`; add a webhook to
   `<your-url>/api/billing/webhook` for the `subscription.*` events and set `RAZORPAY_WEBHOOK_SECRET`.
   Before charging real customers you'll also need Razorpay account activation (KYC) and published
   terms, privacy and refund policies.

## Private beta (waitlist)

Until Google verifies the app, only test users added in Google Cloud can connect YouTube, so the site is
invite-only by default: visitors join a waitlist, admins invite them from **Waitlist** (copy emails into Google's
test users, then press Invite). Set `NEXT_PUBLIC_INVITE_ONLY=0` to open sign-ups. Plan: docs/LAUNCH_AND_GROWTH.md.

## WhatsApp and email reports

Every Monday ~8:45 IST creators get a weekly report (wins, fixes, what to post next), and ~2 days after each upload
a check on how it's doing, on WhatsApp (or email). On WhatsApp they can also ask questions, get titles and ideas,
change language and stop reports. Architecture, costs and the Meta setup steps: **docs/WHATSAPP.md**.

## Legal pages

`/terms`, `/privacy`, `/refunds` and `/contact` describe what the app actually does (data collected, YouTube
Limited Use, cookies, credits, auto-renewal, cancellation and refunds, grievance officer). Before launch:

The official contact address is **mitracontentsupport@gmail.com** (`OFFICIAL_EMAIL` in
`src/lib/company.ts`), used for support, privacy, grievances and creator outreach.

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
| Titles, Comments, Ask Mitra, Thumbnail design | Claude Haiku 5.5 | low | $0.002 (₹0.15) |

*2,000 input + 3,000 output tokens at ₹88/$. Worst case per plan if every credit is spent on Video Doctor:
Free ≈ ₹9, Pro ≈ ₹100 of ₹99 (break-even at the launch price; typical use ≈ ₹20), Creator+ ≈ ₹250 of ₹249. Founder Pass: at most 50 small-model answers per founder a month (≈ ₹15–20), so ≈ ₹2,000/month for all 100.
Real usage mixes features and repeats (cache hits are free), so typical cost is far lower; check `/api/admin/costs`.

**Prompt safety:** a fixed system prompt carries YouTube Community Guidelines rules; text from other people
(video titles, comments, channel data) is wrapped in `<untrusted>` tags the model is told never to obey; chat is
limited to creator topics; Sonnet requests use Anthropic's server-side refusal fallback.

**Comment clean-up before AI** (`src/lib/comment-filter.ts`, plain code, free): link/phone spam and duplicates
dropped, emoji and one-word reactions folded into one count line, the 40 most-liked comments kept, each trimmed
to 300 chars. About a third fewer input tokens on a typical batch of 60.

`tests/ai-pipeline.e2e.py` checks all of this against a local mock of the Anthropic API (`tests/mock-anthropic.mjs`).

## Thumbnails

**Pro thumbnails** (`/api/thumbnail/compose`, needs `GEMINI_API_KEY`): the creator adds 1–3 photos of themselves
(plus up to 2 of the place or product) and presses **Make my thumbnail**. Claude plans the shot from the title and
the most-viewed reference hit (side, expression and pose, scene, colours, headline), then Google's Nano Banana 2.1
paints a new 2K photo with the creator in it (`src/lib/compose.ts`, storage off). The canvas puts the headline on
the side kept clear, so text is always crisp and editable. 6 credits (~₹4.8 cost), refunded on failure.

Mitra plans, the browser draws. "Design with Mitra" sends the topic, the current text and up to 3 of the
creator's photos (shrunk in the browser to ≤768px JPEG, a few hundred image tokens each) to Haiku, which returns
a layout: which photo is the subject, crop focus, headline and highlight word, colours, badge, emoji, arrow and
English search words for a background. The canvas then renders it at 1280×720, so Devanagari/Telugu/Tamil text
is always correct and everything stays editable. With `PEXELS_API_KEY` set, the background is a matching free
stock photo (streamed through `/api/thumbnail/background` so the canvas can export it); without it, a drawn
gradient with glow, light rays and grain.

With `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_AI_TOKEN` set (free: Cloudflare Workers AI gives ~170 images a day at
no cost), or `FAL_KEY` as a paid backup, the background is instead **generated** by FLUX.1 [schnell] from the
design's `imagePrompt` (scene only, never text): 1 credit (free on the Founder Pass), behind the same sign-in, rate
limit, daily budget and refund-on-failure checks as the text AI, and logged in `ai_calls` as feature `image`.

## Languages, trends and audience

- **Language:** every AI prompt names the language *and* script ("Telugu script (తెలుగు)"; Hinglish = Roman
  letters). Outputs in the wrong script are logged (`AI titles: expected te but got …`) for tuning.
  `tests/insights.test.mts` and the language e2e check all 7 AI features × 9 languages.
- **Trend Radar** (`/api/trends`): YouTube's Trending chart for India (top 100, 2 quota units, cached 3 h), each
  video's language detected from its title script and YouTube's audio language, sorted by views per hour.
  "Analyse with Mitra" (Haiku, 1 credit) returns topics, the emotions driving them, places/festivals and formats,
  plus an angle for the creator. YouTube only offers trending per country, not per state.
- **Audience** (`/api/audience`, Analytics API, cached 12 h): top countries and cities, traffic sources, YouTube
  search terms, age/gender and subscribed vs not, for the channel or one video (`?video=`). "Analyse with Mitra"
  (Haiku, 1 credit) gives a persona, region insights, discovery, emotions and next steps. Video Doctor now also
  receives the video's cities, traffic sources and search terms.

## Growth features

- **Live dashboard:** the hero subscriber count rolls like an odometer, polls `/api/channel/live` (1 quota unit,
  cached 2 min) every 3 minutes while the tab is visible, and celebrates gains with confetti and a toast —
  including "+N since you last looked" (last count kept in localStorage). Milestone ring to the next 1K/10K/
  Silver/Gold award with an ETA from the 28-day pace, automatic "wins" chips, sparkline KPI tiles. All motion
  respects `prefers-reduced-motion`. YouTube rounds counts above 1,000 to 3 significant digits, so large
  channels see the live number move in steps; daily gains from Analytics are exact. The demo channel ticks up
  on its own so the celebration can be tried signed out.
- **Slang** (Audience page, Haiku, 1 credit): current slang by generation in the chosen language, grounded in
  trending titles in that language and the channel's latest comments; each term says where it was seen.
- **Competitors** (`/api/competitors`, table `competitors`, max 5): add by @handle or channel URL (names are
  refused: YouTube search costs 100 units). Each channel's last 15 uploads (3 units, cached 6 h) give
  comparable metrics; "Compare with Mitra" (Haiku, medium effort, 1 credit) explains gaps and moves.

## Finding creators (admin)

**Find creators** (`/dashboard/prospects`, admins only) searches YouTube for videos uploaded in the last 7–30
days in India matching keywords and a language, keeps channels in a subscriber range (default 1K–1L) that
aren't already Mitra users, and scores them (size sweet spot ≈ 12K, recent uploads, language, views per video,
a public way to reach them). Emails come only from the channel description (including "name [at] gmail
[dot] com"); scraping YouTube's "View email address" is against its Terms. Quota: 100 units per 50 videos
searched + 1 per 50 channels, capped at `PROSPECT_DAILY_UNITS` (3,000) a day. Uses `YOUTUBE_API_KEY`, or the
admin's own YouTube connection. Haiku writes personal subjects/openers 10 per call; "Open in Gmail" opens a
pre-filled compose window and marks the creator contacted; "Do not contact" is permanent; CSV export.
Plan and rules: `docs/PROSPECTING.md`.

Admins (`ADMIN_EMAILS`) get **AI costs** in the sidebar: spend, calls and average tokens per feature, the latest
calls, and a button to reset their own credits while testing. `FREE_CREDITS` raises the Free plan's allowance.

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

## Branches and deploying

| Branch | Purpose | Deploys to |
|---|---|---|
| `dev` | Day-to-day work; feature branches merge here | Vercel preview URL (staging database) |
| `prod` | Only what's live; updated by merging `dev` → `prod` | Production domain (production database) |

Vercel setup (once): import the GitHub repo, **Root Directory** `creator-app`, **Production Branch** `prod`.
`vercel.json` runs `npm run db:migrate` before every build, so give Preview and Production different
`DATABASE_URL`s (e.g. two Neon branches) or a `dev` deploy would migrate the live database.
Region `sin1` (Singapore) matches the Neon database region (Neon has no Mumbai region). The app talks to
the database several times per page, so keeping the two together matters more than being in India itself.

Our domain is **trymitraapp.com**: set `APP_URL=https://trymitraapp.com` in Vercel and register
`https://trymitraapp.com/api/auth/google/callback` in Google Cloud.

No domain yet? Leave `APP_URL` unset: sign-in uses whatever address the visitor arrived on, so the free
`<project>.vercel.app` address works. Register that address's `/api/auth/google/callback` in Google Cloud.

Before the first production deploy, with the production values exported in your shell:

```bash
npm run check:env -- --live   # every setting present and accepted; prints no secret values
```

`GET /api/health` returns 200 when the app can reach its database, for an uptime monitor.

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
