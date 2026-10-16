# Mitra on WhatsApp: Monday report, 2-day video check, and the chat bot

We're not building a mobile app early, so WhatsApp *is* the app: creators get their reports there and can
ask, check and change things without opening the website.

## How it fits together

```
                       ┌────────────── Vercel Cron, daily 03:15 UTC (8:45 IST) ──────────────┐
                       ▼                                                                      │
 /api/cron/daily ─► runDaily (src/lib/reports/run.ts)                                         │
                    for each creator with a channel who can be reached, 4 at a time:          │
                      Monday?  → weekly report        every day → videos that turned 36–60h old│
                      claim(user, kind, key)  ← unique row in `notifications` = never twice   │
                      build  (facts.ts: pure numbers → coachWeekly/coachVideo: one small AI   │
                              call, Mitra pays ~₹0.05; plain fallback if AI is off)           │
                      deliver (deliver.ts):                                                   │
                         WhatsApp, 24h window open → full report + buttons (service message)  │
                         WhatsApp, window closed   → approved template (utility, ~₹0.115+GST) │
                         no WhatsApp / it failed   → email (Gmail SMTP)                       │
                    out of time? → calls itself again with ?cursor=… (no queue service needed)┘

 Creator's phone ──► Meta ──► /api/whatsapp/webhook  (signature checked, 200 at once, work after)
                                 └► handleInbound (src/lib/whatsapp/bot.ts)
                                      dedupe by message id → JOIN code? link number
                                      menu / buttons / STOP / START / language / plan → plain code, free
                                      titles, ideas, any question → runPaidAi (same credits, Founder
                                      Pass, rate limit, daily budget and logging as the website)
```

Files: `src/lib/whatsapp/api.ts` (Cloud API client, limits, signature), `bot.ts`, `strings.ts`
(fixed words in English, Hinglish, Hindi), `templates.ts`; `src/lib/reports/*`; `src/lib/email.ts`;
settings page `src/app/dashboard/whatsapp/page.tsx`.

## Why it's cheap
- **One template a week per creator**, plus one per upload. Everything after the creator taps a button is
  inside the free 24-hour window (1,000 free service messages per number per month, then ~utility rate).
- **Menus are code, not AI.** Only questions, titles and ideas use AI, charged to the creator's credits or
  Founder Pass exactly like the website.
- **Reports use the numbers we already cache** (YouTube summary, 1 hour) plus one Analytics call per older
  video for the "usual first two days" baseline, cached for 30 days.
- Rough cost per creator per month: 4 weekly + ~4 video templates ≈ 8 × ₹0.115 + GST ≈ **₹1.1**, AI ≈
  **₹0.4**. 1,000 creators ≈ ₹1,500/month.

Check Meta's current rate card before scaling: Meta bills per delivered template, and from 1 October 2026
service replies beyond 1,000 per number per month are reported to be billable too.

## Linking a number (opt-in)
1. Creator taps **Connect WhatsApp** on the website: we create a 6-digit code (30 minutes).
2. WhatsApp opens with `JOIN 123456` typed to Mitra's number; they press Send.
3. That message proves the number is theirs, is their opt-in, and opens the free 24-hour window. The page
   notices within 3 seconds and celebrates.

STOP pauses reports (they can still chat); START resumes. Disconnect on the website forgets the number.

## Setting it up (one time, ~1 hour + Meta review)
1. **Meta Business account** at business.facebook.com, signed in as mitracontentsupport@gmail.com.
   Business name "Mitra". Verification (business documents) can come later; unverified accounts can still
   message, with a lower daily limit.
2. **developers.facebook.com → Create app → Business → add WhatsApp.** Meta gives you a free test number to
   try everything with up to 5 of your own numbers.
3. **Add a real number** (WhatsApp Manager → Phone numbers): a SIM that isn't already on WhatsApp (or delete
   WhatsApp from it first). Display name "Mitra". Note its Phone number ID.
4. **Permanent token:** Business settings → Users → System users → add one (Admin) → assign the app and the
   WhatsApp account → Generate token with `whatsapp_business_messaging` and `whatsapp_business_management`.
5. **Vercel env vars:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_NUMBER` (e.g. 9198…),
   `WHATSAPP_APP_SECRET` (App settings → Basic), `WHATSAPP_VERIFY_TOKEN` (make one up), `CRON_SECRET`
   (make one up). Redeploy.
6. **Webhook:** app → WhatsApp → Configuration → Callback URL
   `https://mitra-creators.vercel.app/api/whatsapp/webhook`, Verify token = your `WHATSAPP_VERIFY_TOKEN`,
   then subscribe to the **messages** field.
7. **Templates:** `WHATSAPP_TOKEN=… WHATSAPP_WABA_ID=… npx tsx scripts/whatsapp-templates.mts`. When they're
   approved, set `WHATSAPP_TEMPLATE_LANGS=en,hi`. If Meta files one as MARKETING instead of UTILITY, it costs
   ~₹0.86: edit the wording to be more report-like and resubmit.
8. **Email fallback:** on mitracontentsupport@gmail.com turn on 2-Step Verification → App passwords → create
   one for "Mitra". Set `SMTP_USER=mitracontentsupport@gmail.com` and `SMTP_PASS=<app password>`.
9. Open **WhatsApp & reports** in the dashboard → Connect → **Send my weekly report** to see it live.

`npm run check:env` lists anything missing.

## Limits to know
- Vercel Hobby runs crons once a day (±1 hour), so the video check lands 36–60 hours after upload. On Vercel
  Pro, change the schedule to hourly and narrow the window in `videosDueForCheck` for an exact 48 hours.
- YouTube Analytics lags 1–2 days, so the weekly report covers the latest 7 days Analytics has; the video
  check uses live view counts (Data API) against older videos' first two days (Analytics).
- New Meta numbers start at 250 business-initiated conversations a day and rise automatically with quality.
- Fixed bot words exist in English, Hinglish and Hindi; AI answers come in all 9 languages. Add Telugu and
  Tamil strings and templates after a native speaker reviews them.
