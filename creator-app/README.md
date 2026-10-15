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

The output language (top bar) controls what language the AI writes in.

## Going live

1. **AI**: set `ANTHROPIC_API_KEY`. Calls use `claude-opus-5-5` with structured outputs
   (`src/lib/ai.ts`) and server-side refusal fallbacks enabled.
2. **YouTube**: in Google Cloud, enable *YouTube Data API v3* and *YouTube Analytics API*, create an
   OAuth client (Web application) and add `http://localhost:3000/api/auth/youtube/callback` (plus your
   production URL) as a redirect URI. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and a random
   `SESSION_SECRET` (≥32 chars).
   - Scopes requested: `youtube.readonly`, `yt-analytics.readonly`. These are *sensitive* scopes:
     while the Google app is in "Testing", only test users you add can sign in. Public launch needs
     Google's OAuth verification, so start that early.

## Architecture

- Next.js 16 (App Router, Cache Components) + Tailwind v4, TypeScript.
- Pages are client components that read from route handlers under `src/app/api/`.
- OAuth tokens are stored in an AES-256-GCM encrypted, httpOnly cookie (`src/lib/session.ts`) and
  refreshed automatically. No database yet; that comes with accounts, history and billing.
- Without keys, every endpoint returns demo data (`src/lib/demo.ts`, `src/lib/demo-ai.ts`), so the
  whole product can be demoed offline.

## Not built yet

Database + user accounts, payments (Razorpay / UPI Autopay), live trend data, WhatsApp weekly reports,
Instagram, interface translation (only AI output is multilingual today).
