# Mitra beta

The beta tests one thing: **does Video Doctor measurably improve a Hindi or Kannada creator's retention, and do they keep coming back to it?** Everything else waits.

`NEXT_PUBLIC_BETA` (on unless set to `0`) switches all of this on or off without a code change. Settings live in `src/lib/beta.ts`.

## What changes in the beta

| Area | During the beta |
|---|---|
| Features | Overview, Video Doctor, Title & Thumbnail Studio, **Your progress** (new), Connections, Account. Audience, Comments, Breakout ideas, Trend Radar, Competitors, WhatsApp and Ask Mitra are paused: hidden from the menus, their pages show a "paused" note, and their AI answers 404. **Admins still see and use everything.** |
| Languages | Creators choose Hindi or Kannada (sign-in picker, top bar, waitlist). Accounts with another language are asked again; AI requests in another language fall back to Hindi. All nine stay in the code (WhatsApp, trend detection). |
| Pricing | No prices or credits shown: no pricing section, no credit meter, no credit labels on buttons, no "Upgrade" links. *Plan & billing* becomes **Account** for Free users (beta note + delete account). Anyone already on a paid plan still sees their plan and can cancel. |
| Credits | Free accounts get `BETA_FREE_CREDITS` (100 a month, about 20 diagnoses) as a hidden safety cap; `FREE_CREDITS` still overrides it. The daily AI budget (`AI_DAILY_BUDGET_USD`) still applies. |
| Founder Pass | **No new passes** during the beta (the "free for life" offer is hidden). Creators who already hold one keep it. |
| Video Doctor | Below 300 views, or without a retention curve, it gives an **early read** (title, length, first 15 seconds) instead of inventing drop-offs. The sample "typical" curve no longer appears next to a real channel's data. After a diagnosis: **"I'll apply these fixes"** (starts a Retention Sprint), a language rating, and after the second diagnosis a 4-question price survey. |
| Interview | First question added: earning from YouTube / managing channels / just starting. |
| Data | First-party beta events (`beta_events`) and sprints (`sprints`), both deleted with the account. Creators can switch stats off, and opt in to benchmark sharing, in Connections. Privacy Policy updated. |

## The board's checklist

| # | Condition | Status |
|---|---|---|
| 1 | Cut to Video Doctor + one supporting feature | **Done.** Supporting feature: Title & Thumbnail Studio (correct Indic thumbnail text is the gap no competitor fills). |
| 2 | Free real diagnosis + low-data fallback | **Done.** No paywall; early read under 300 views. |
| 3 | 1–3 languages, native review | **Built; needs people.** Hindi and Kannada, with spoken-language writing rules in `src/lib/languages.ts` and per-answer ratings. Recruit 2 reviewers per language (below). |
| 4 | Earning creators and managers pay; beginners free | **Built.** Interview segment question; Beta metrics splits by it. Recruit earners and managers first. |
| 5 | 5–10 documented results | **Built; needs creators.** Retention Sprint → *Your progress* (average % viewed after vs before) → "Share result" (naming the channel is opt-in). |
| 6 | Sell an outcome, not credits | **Done.** The 4-upload Retention Sprint, with a one-on-one review if it doesn't improve. |
| 7 | Test 2–5x price for earners | **Built; run it.** In-app price survey (CSV export for `van_westendorp.py`), and the call script below. |
| 8 | Replace "free for life" | **Done / planned.** No new Founder Passes; the founding offer below launches after the beta. |
| 9 | CAC by channel, month-2/3 retention, repeat use | **Built.** Admin → **Beta metrics**. Tag every link with `?utm_source=…` and type spend per source on that page. |
| 10 | Name the proprietary asset | **Done.** Opt-in Hindi/Kannada retention benchmark (below). |

## Running it

- **Before deploying:** nothing new to set. The two new tables are created by `npm run db:migrate` on the Vercel build (additive only).
- **Google OAuth** is still in Testing: add each beta creator's Gmail as a test user (100 maximum), via the Waitlist page.
- **Weekly:** open Admin → **Beta metrics**. Download *language reviews* for the reviewers and the *price survey CSV* for `python3 ~/.claude/skills/founder-pricing/van_westendorp.py mitra-price-survey.csv --price 299`.
- **Link tags:** `?utm_source=dm-ig`, `dm-email`, `mgr-<name>`, `wa-<group>`, `reel-organic`, `reel-paid`. Count founder hours at a fixed rate (e.g. ₹500/hour) in the spend column.

## Native-speaker review

- **Reviewers:** two per language, native speakers who watch YouTube in it daily (ideally creators), paid per batch. At least one Kannada reviewer from outside Bengaluru.
- **Each week (about an hour):** review every answer rated "a bit off" or "sounds translated", plus 10 random ones per language. Score 1–5 on *natural*, *correct* (script, grammar, English YouTube words kept in English), *specific* and *respectful*. Rewrite anything at 3 or below the way a native speaker would say it, and turn repeated problems into rules in `src/lib/languages.ts`.
- **Gate:** a language stays open to new creators only while average *natural* is 4.0+ and under 15% of creator ratings say "sounds translated".
- **Also review** the fixed Hindi and Kannada lines on the landing page (`src/app/page.tsx`, `src/components/landing.tsx`) and the language picker; they were written without native review.

## Price test (2–5x for earners)

- In-app survey (split by segment on the Beta metrics page).
- In calls with earners and managers after a result: "We're planning ₹199 / ₹299 / ₹499 a month (rotate one per call). Would you pay that today?" Ask managers about ₹199–₹299 per channel per month.
- **Decision rule:** the highest price at which at least 40% of earning creators who saw a result say yes.

## Founding offer (after the beta, replaces "free for life")

- **Founding Creator:** the chosen price at 40% off for 12 months, then the normal price. UPI monthly, with a one-time payment option (many creators refuse new autopay mandates).
- **Limit:** the first 200 creators or 60 days after launch, whichever comes first. Real limit, no fake countdown.
- Beta creators who shared a result get it automatically. Existing Founder Pass holders keep their pass.

## The data asset

- **What grows with use:** opt-in, anonymous Hindi/Kannada retention samples (language, channel size band, length band, % viewed, intro drop, where viewers drop off), joined with which fixes were applied and what happened next.
- **Why YouTube won't build it:** Studio shows each creator only their own numbers. It doesn't benchmark a Kannada cooking channel against other Kannada cooking channels its size, or say which fixes worked for channels like it.
- **The loop:** more diagnoses → "channels like yours" benchmarks (a group appears once it has 10+ channels) → more accurate advice than generic AI → more creators. Later the same audience data is what regional brands need for creator deals: the second network effect.
- **Rules:** opt-in (off by default), no titles or video IDs in samples, never shown for groups under 10 channels.
