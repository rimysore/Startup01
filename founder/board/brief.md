# Mitra (trymitraapp.com)

- What it is: an AI growth coach for Indian-language YouTube creators that reads their own channel (YouTube Data + Analytics APIs, read-only) and tells them what to post next and why their last video did what it did, in their language.
- Who it is for: small and mid-size YouTube creators in India (roughly 1K to 500K subscribers) who make videos in Hindi, Hinglish, Telugu, Tamil, Marathi, Bengali, Kannada or Malayalam, are trying to grow or monetise, and find English-first tools (vidIQ, TubeBuddy) generic or hard to use.
- What it sells, at what price: monthly subscriptions in INR. Free (10 AI credits/month), Pro ₹99/month (100 credits), Creator+ ₹249/month (250 credits), Agency ₹1,999+/month by conversation. Features: channel overview with outlier ("×-your-usual") scores, Video Doctor (diagnoses one video), Title & Thumbnail Studio, Trend Radar by language, audience, comments and slang insights, competitor comparison, breakout ideas, an "Ask Mitra" chat, and a Monday report plus a 2-day check after each upload by email (WhatsApp coming). First 100 creators get a lifetime "Founder Pass" (50 free small-model uses a month).
- Where and how: web app (Next.js on Vercel), India-focused, online only. Customers find it through the founders' outreach to creators (an admin prospecting tool, DMs and email), build-in-public posts on X/Threads/Instagram, and creator referrals. Payment via Razorpay (not switched on yet).
- Budget and constraints:
  - Bootstrapped; two founders: Rithvik (engineering/product, US Eastern time, individual operator in Bloomington, Indiana) and a co-founder in India (marketing, outreach, customer conversations, IST), part-time and slower-paced.
  - Infrastructure costs about ₹1,850–3,950 a month; AI cost per action ~₹0.06–0.12 (small model) to ~₹3–4 (Video Doctor) and ~₹4.8 (AI thumbnail).
  - Status (Oct 2026): live; a handful of test users (one active tester, Ujjwal); 0 paying customers; billing off; free testers get 100 credits/month.
  - Google OAuth data-access verification for YouTube scopes submitted, pending. YouTube API policy forbids "derived metrics" unless the Analytics & Reporting amendment is accepted (not yet submitted). WhatsApp delivery waits for an Indian business number.

## More context a stranger needs

- Unit economics (founders' estimates, Oct 2026, ₹88/$): after 18% GST (inside the price) and ~2% Razorpay, Pro keeps ~₹82 and Creator+ ~₹206. Typical AI cost: Pro ~₹23, Creator+ ~₹55 a month, i.e. ~72% margin. Worst case (all credits on Video Doctor) still positive. Break-even on fixed infrastructure: about 35–70 Pro creators, before any founder salary.
- Free plan and Founder Pass cost ~₹6–7 per creator per month.
- Big platforms nearby: YouTube Studio itself (adding AI inspiration/insights features), vidIQ and TubeBuddy (English-first, ~$7.5–50/month globally, cheaper India pricing exists), ViewStats (MrBeast's tool, premium), and general chatbots (ChatGPT, Gemini) creators already use for titles.
- What the founders believe is the edge: regional Indian languages done natively (not translated English), coaching that reads the creator's own analytics rather than generic tips, a weekly report that pushes to them (email now, WhatsApp later) instead of a dashboard they must open, and India pricing (₹99).
- What is not known yet: whether creators pay ₹99/month, retention after month 1, how many creators the founders can reach per week, cost to acquire a creator, and whether YouTube/Google ships equivalent features in regional languages for free.
