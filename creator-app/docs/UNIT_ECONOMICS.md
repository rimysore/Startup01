# Unit economics: what a creator costs us, and what we keep

October 2026 estimates, at ₹88 per US dollar. Real numbers replace these once creators use it: **Admin → AI costs**
shows the actual cost of every AI call, per feature.

## Cost of each action

| Action | What runs | Cost to us |
| --- | --- | --- |
| Titles (with YouTube research) | Haiku 5.5, ~1.5K tokens in, ~1.5K out; YouTube search is free (quota) | ~₹0.08 |
| Thumbnail design (5 photos + 3 reference thumbnails) | Haiku 5.5 with images, ~4K in, ~1.5K out | ~₹0.10 |
| Pro thumbnail ("Make my thumbnail", the creator painted into the scene) | Haiku plan + Gemini Nano Banana 2.1, 2K image (~$0.0504) + photo input | **~₹4.8** (charged 6 credits) |
| AI background, full HD | Cloudflare FLUX.2 klein: first ~30 a day free (whole account), then ~$0.0034 | ₹0 → ~₹0.30 |
| Trends, audience, slang, comments, breakouts, competitors, Ask Mitra | Haiku 5.5, ~3K in, ~2K out | ~₹0.06–0.12 |
| Video Doctor | Sonnet 5.5 (deeper reasoning), ~4K in, ~3–4K out | **~₹3–4** |
| Monday report / 2-day check (AI part) | Haiku 5.5 | ~₹0.05 each |
| WhatsApp report outside the 24-hour window | Meta utility template, India | ~₹0.14 each incl. GST |
| PDF report, email, YouTube data | Our servers, Gmail, YouTube API | ₹0 |

One Haiku credit costs us about ₹0.10. One Video Doctor (5 credits since October 2026) costs about ₹3.3, i.e.
₹0.66 per credit. A pro thumbnail costs ~₹4.8 for 6 credits (₹0.80 per credit). **Video Doctor and pro thumbnails
are where the money goes.** Worst case on Pro if every credit went to pro thumbnails: 16 × ₹4.8 ≈ ₹78 against
₹82 kept: still (barely) positive, so 6 credits is the floor for it.

## Per creator, per month

What a plan brings in after GST (18%, inside the price) and Razorpay (~2% + GST on the fee):

| Plan | Price | We keep | Typical use | Typical cost | Margin (typical) | Worst case (all credits on Video Doctor, 5 each) |
| --- | --- | --- | --- | --- | --- | --- |
| Free | ₹0 | ₹0 | 1 Doctor + 5 Haiku uses + reports | ~₹6 | −₹6 | ~₹9 |
| Founder Pass (100 creators) | ₹0 | ₹0 | 50 free Haiku uses + reports | ~₹7 | −₹7 | ~₹7 + Free plan |
| Pro | ₹99 | ~₹82 | 4 Doctors + 30 Haiku uses + 15 HD images + reports | ~₹23 | **~₹59 (72%)** | ~₹68 → **+₹14** |
| Creator+ | ₹249 | ~₹206 | 10 Doctors + 75 Haiku uses + 40 HD images + reports | ~₹55 | **~₹150 (73%)** | ~₹167 → **+₹39** |
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

## Decision: Video Doctor costs 5 credits (October 2026)

At 3 credits, a Pro creator who spent all 100 credits on Video Doctor cost ~₹112 against ₹82 kept. At 5 credits the
worst case is 20 diagnoses ≈ ₹68, so every plan stays profitable even at full use. Free plan: 2 diagnoses a month.

Next, once real creators are on it: raise Pro's price based on traction and demand, and consider running Video
Doctor on Haiku 5.5 at medium effort (~₹0.4 each) with Sonnet kept for a "Deep diagnosis".
