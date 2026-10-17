# Unit economics: what a creator costs us, and what we keep

October 2026 estimates, at ₹88 per US dollar. Real numbers replace these once creators use it: **Admin → AI costs**
shows the actual cost of every AI call, per feature.

## Cost of each action

| Action | What runs | Cost to us |
| --- | --- | --- |
| Titles (with YouTube research) | Haiku 5.5, ~1.5K tokens in, ~1.5K out; YouTube search is free (quota) | ~₹0.08 |
| Thumbnail design (5 photos + 3 reference thumbnails) | Haiku 5.5 with images, ~4K in, ~1.5K out | ~₹0.10 |
| Blend my photos (cut-out) | MediaPipe, runs on the creator's phone | ₹0 |
| AI background, full HD | Cloudflare FLUX.2 klein: first ~30 a day free (whole account), then ~$0.0034 | ₹0 → ~₹0.30 |
| Trends, audience, slang, comments, breakouts, competitors, Ask Mitra | Haiku 5.5, ~3K in, ~2K out | ~₹0.06–0.12 |
| Video Doctor | Sonnet 5.5 (deeper reasoning), ~4K in, ~3–4K out | **~₹3–4** |
| Monday report / 2-day check (AI part) | Haiku 5.5 | ~₹0.05 each |
| WhatsApp report outside the 24-hour window | Meta utility template, India | ~₹0.14 each incl. GST |
| PDF report, email, YouTube data | Our servers, Gmail, YouTube API | ₹0 |

One Haiku credit costs us about ₹0.10. One Video Doctor (3 credits) costs about ₹3.3, i.e. ₹1.1 per credit:
**Video Doctor is where the money goes.**

## Per creator, per month

What a plan brings in after GST (18%, inside the price) and Razorpay (~2% + GST on the fee):

| Plan | Price | We keep | Typical use | Typical cost | Margin (typical) | Worst case (all credits on Video Doctor) |
| --- | --- | --- | --- | --- | --- | --- |
| Free | ₹0 | ₹0 | 1 Doctor + 5 Haiku uses + reports | ~₹6 | −₹6 | ~₹13 |
| Founder Pass (100 creators) | ₹0 | ₹0 | 50 free Haiku uses + reports | ~₹7 | −₹7 | ~₹7 + Free plan |
| Pro | ₹99 | ~₹82 | 4 Doctors + 40 Haiku uses + 15 HD images + reports | ~₹24 | **~₹58 (70%)** | ~₹112 → **−₹30** |
| Creator+ | ₹249 | ~₹206 | 10 Doctors + 80 Haiku uses + 40 HD images + reports | ~₹55 | **~₹150 (73%)** | ~₹280 → **−₹74** |
| Agency | ₹1,999+ | ~₹1,650 | custom | priced per deal | — | — |

"Typical" assumes creators use about half their credits. Reports (4 weekly + ~6 video checks) cost ~₹2 a creator.

## Fixed costs (whole company, per month)

| Item | Cost |
| --- | --- |
| Vercel Pro (hosting, cron) | $20 ≈ ₹1,760 |
| Neon Postgres | free tier now; Launch plan $19 ≈ ₹1,670 when we outgrow it |
| Cloudflare Workers paid (only if >30 HD images a day) | $5 ≈ ₹440 |
| Domain trymitraapp.com | ≈ ₹85 |
| **Total** | **≈ ₹1,850–3,950** |

**Break-even:** about 35–70 Pro creators (at ~₹58 margin each), before the founders' time.
100 Founder Pass holders cost about ₹700 a month: a good price for 100 testimonials and referrals.

## Recommendation: protect the worst case

A Pro creator who spends all 100 credits on Video Doctor costs ~₹112 against ₹82 kept. Before paid plans open,
pick one:

1. **Video Doctor = 5 credits** (from 3): worst case Pro = 20 diagnoses ≈ ₹68 → still profitable. Simplest.
2. **Run Video Doctor on Haiku 5.5 at medium effort** (~₹0.4 each), keeping Sonnet for a "Deep diagnosis"
   option. Test quality on 20 real videos first.
3. Keep 3 credits but cap Video Doctor at 15 a month on Pro, 40 on Creator+.

Everything else is cheap enough that credits could even be more generous: 100 Haiku credits cost us ~₹10.
