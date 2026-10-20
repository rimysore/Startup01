# Mitra (trymitraapp.com) · Business plan

**Verdict: Not yet**

- ✓ Each paying Pro creator-month earns $56.56 before fixed costs (67% contribution).
- ✗ Year 1 operating LOSS: $13,845.
- ✗ 0 of 20 simulated buyers buy (0%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $83.90 a paying Pro creator-month |
| Profit margin at plan | 39% per paying Pro creator-month |
| Break-even | 64 paying Pro creator-months a day |
| Year 1 operating profit | $-13,845 |
| Startup spend | $17,000 |
| Cash needed before it pays for itself | $34,827 |
| Startup money earned back | not in year 1 |
| Buyer panel | 0 buy · 20 pass |

## The idea

- What it is: an AI growth coach for Indian-language YouTube creators that reads their own channel (YouTube Data + Analytics APIs, read-only) and tells them what to post next and why their last video did what it did, in their language.
- Who it is for: small and mid-size YouTube creators in India (roughly 1K to 500K subscribers) who make videos in Hindi, Hinglish, Telugu, Tamil, Marathi, Bengali, Kannada or Malayalam, are trying to grow or monetise, and find English-first tools (vidIQ, TubeBuddy) generic or hard to use.
- What it sells, at what price: monthly subscriptions in INR. Free (10 AI credits/month), Pro ₹99/month (100 credits), Creator+ ₹249/month (250 credits), Agency ₹1,999+/month by conversation. Features: channel overview with outlier ("×-your-usual") scores, Video Doctor (diagnoses one video), Title & Thumbnail Studio, Trend Radar by language, audience, comments and slang insights, competitor comparison, breakout ideas, an "Ask Mitra" chat, and a Monday report plus a 2-day check after each upload by email (WhatsApp coming). First 100 creators get a lifetime "Founder Pass" (50 free small-model uses a month).
- Where and how: web app (Next.js on Vercel), India-focused, online only. Customers find it through the founders' outreach to creators (an admin prospecting tool, DMs and email), build-in-public posts on X/Threads/Instagram, and creator referrals. Payment via Razorpay (not switched on yet).
- Budget and constraints:
  - Bootstrapped; two founders: Rithvik (engineering/product, US Eastern time, individual operator in Bloomington, Indiana) and a co-founder in India (marketing, outreach, customer conversations, IST), part-time and slower-paced.
  - Infrastructure costs about ₹1,850–3,950 a month; AI cost per action ~₹0.06–0.12 (small model) to ~₹3–4 (Video Doctor) and ~₹4.8 (AI thumbnail).
  - Status (Oct 2026): live; a handful of test users (one active tester, Ujjwal); 0 paying customers; billing off; free testers get 100 credits/month.
  - Google OAuth data-access verification for YouTube scopes submitted, pending. YouTube API policy forbids "derived metrics" unless the Analytics & Reporting amendment is accepted (not yet submitted). WhatsApp delivery waits for an Indian business number.

## Summary

Mitra is an AI growth coach for Indian regional-language YouTube creators: it reads a creator's own channel and says what to post next and why the last video did what it did, in their language, with a Monday report. ₹99 / ₹249 a month.

**Verdict: Not yet** (computed by compile.py). Each paying creator earns ~₹57 a month after costs (67%), but year 1 loses ~₹13,800 on the assumed ramp, and 0 of 20 simulated creators would pay today.

**Where the board and the panel agree:** the blocker is trust and proof, not price or features. Creators say YouTube Studio, free vidIQ and ChatGPT "already do this", and they won't hand channel access to an unknown app. Every "what would flip me" answer asks for the same thing: one specific, checkable insight on their own channel, for free, ideally on WhatsApp, or a creator they follow vouching for it.

**Where they disagree:** Product and Offers lenses see the push report as the real product (fund if); the Monopoly lens passes because there is no moat and YouTube controls the inputs.

**Biggest risk:** YouTube/Google. The headline outlier score needs the Analytics & Reporting amendment, OAuth verification is pending, and YouTube's free Ask Studio already reads the channel and may support Indian languages.

**What it needs to start:** under ₹35,000 of cash (CFO), because founders are unpaid. Money is not the constraint; proof is.

**The one thing to do this week:** submit the YouTube API amendment, then get 5 real creators (via the co-founder) to connect, and hand-deliver each one specific insight about their own channel. Ask at the end: "Would you pay ₹299 a month for this every week?"

The panel is simulated buyers and the numbers are projections; real creators and real quotes confirm them. Not financial, legal or tax advice.

## What the board said

**Vote: 2 FUND IF · 1 PASS. Average score 3.7 / 10** (Offers 4, Product 4, Monopoly 3).

### Risks more than one member raised (most dangerous first)
1. **Google/YouTube owns the inputs and the front door.** All three: the outlier ("×-your-usual") score looks like a "derived metric" YouTube's API policy forbids without the Analytics & Reporting amendment (not yet submitted), and OAuth verification is still pending, so new creators may see "unverified app" in their first minute. YouTube Studio can also ship regional-language AI insights for free.
2. **No proof anyone pays.** Offers and Product: 0 paying creators, one active tester, billing off. Nothing shows a creator grew because of Mitra.
3. **No distribution engine.** Offers and Monopoly: reach per week, conversion and cost per creator are all unknown; founder DMs alone can't scale at ~₹82 a month per customer.
4. **Price as the pitch.** Offers and Monopoly: "₹99" is a commodity position and leaves no budget to win customers.

### Conditions (checklist for the rest of the pack)
- [ ] Submit the YouTube Analytics & Reporting amendment; clear OAuth verification. Until then, make the product work without derived metrics. (all three)
- [ ] Turn on Razorpay; get **10 paying creators within 60 days**, no lifetime freebies counted; measure month-2 retention. (Offers, Product)
- [ ] **3 case studies** with before/after channel numbers. (Offers)
- [ ] Cut to **one core loop**: connect → first insight in 5 minutes → Monday report → 2-day check. Launch in 1–2 languages, not 8. (Product, Monopoly)
- [ ] Rebuild the offer around an outcome with a guarantee; test a higher tier for monetising creators instead of leading with ₹99. (Offers)
- [ ] Measure creators reached per week and cost per creator; find one repeatable channel or a distribution partner (MCN, creator academy, regional community). (Monopoly, Offers)
- [ ] Native-speaker check of reports in each launch language. (Product)

### Where they disagree
Product and Offers think the push report is "the real product" and worth funding with conditions. Monopoly says even a good product here has no moat: it's a wrapper on a general model and public APIs, and the only possible moat (cross-creator benchmarks per language) needs thousands of channels first.

### The strongest version the board can see
Not "an AI dashboard with ten tools at ₹99". It is **a weekly WhatsApp coach for one language community** (say Telugu or Marathi creators, 10K–200K subs, already monetised), that sends one specific, checkable call each week from the creator's own numbers, proves it with public case studies, and charges ₹299–999 to creators who earn from YouTube, sold through a creator community or MCN rather than one DM at a time. That differs from what is built today: it means cutting features, raising the price for a narrower buyer, and finishing WhatsApp.

## The competition

Sources: public pages read on 2026-10-18 unless marked. **Couldn't reach:** Reddit (403 to curl, and the search tool can't access it), Trustpilot (bot check), youseo.app (bot check), the official Spotter Studio pricing page (now 404), chatgpt.com/in/pricing (403). So the complaints below come from app stores and Capterra, not Reddit.

### 1. The table (most direct first)

| # | Name | Type | Comparable price | Indian-language? | Rating (count) |
|---|---|---|---|---|---|
| 1 | [VidUp](https://www.vidup.in/) | Direct, Indian | ₹49/5 credits, ₹199/25, ₹449/60, no subscription | Yes: Hindi, Marathi, Tamil + 7 more | not listed |
| 2 | [vidIQ](https://vidiq.com/plans/) | Direct | Boost $19/mo, Max $49/mo (US); India Boost ₹999, Max ₹2,490 per [GrabOn](https://www.grabon.in/vidiq-coupons/) (third party) | No (site locales: fr, es, ru, pt, tr, vi) | 4.4 [Play IN](https://play.google.com/store/apps/details?id=com.vidiq.app&hl=en_IN&gl=IN) (3.91 lakh); 4.64 [App Store IN](https://apps.apple.com/in/app/vidiq-for-youtube-instagram/id1458235345) (14,081) |
| 3 | [TubeBuddy](https://www.capterra.com/p/172520/TubeBuddy/) | Direct | Pro $3, Star $19, Legend $49/mo (Capterra) | Not found | 4.6 Capterra (114) |
| 4 | [1of10](https://1of10.com/pricing) | Direct (outliers) | Basic $19/mo ($15 yearly); Pro $89 | Hindi **interface** ([1of10.com/hi](https://1of10.com/hi)) | not found |
| 5 | [ViewStats](https://www.viewstats.com/) | Direct (outliers) | Pro $49.99/mo ([Tubefilter](https://www.tubefilter.com/2024/05/29/mrbeast-launches-viewstats-pro-premium-analytics-platform-jimmy-donaldson-jon-youshaei/)) | Not found | not found |
| 6 | [OutlierKit](https://outlierkit.com/app/pricing) | Direct (outliers) | Hobby $24.92/mo billed yearly | Not found | not found |
| 7 | Spotter Studio | Direct, maybe closed | $49/mo or $299/yr ([OutlierKit](https://outlierkit.com/resources/spotter-studio-pricing/)); official page 404 | No; listed as US/CA/UK/AU/EU only (third party) | not found |
| 8 | [YouTube Studio / Ask Studio](https://support.google.com/youtube/answer/16291691) | Substitute, first-party | Free | Ask Studio: "any supported language" set in your YouTube interface, "if you are in an eligible country". [Inspiration tab](https://support.google.com/youtube/answer/15575509?hl=en): "can only give you content ideas in English", being deprecated from Aug 2026 | 4.5 [Play IN](https://play.google.com/store/apps/details?id=com.google.android.apps.youtube.creator&hl=en_IN&gl=IN) (23.6 lakh) |
| 9 | ChatGPT Go | Substitute | ₹399/mo; free 12 months in India from Nov 2025 ([TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/chatgpt-go-is-now-free-in-india-and-u-s-users-are-wondering-if-theyre-next)) | Yes (general chat) | n/a |
| 10 | Gemini | Substitute | Free; AI Plus ₹199 then ₹399/mo ([TechCrunch](https://techcrunch.com/2025/12/10/google-launches-sub-5-ai-plus-plan-in-india-to-compete-with-chatgpt-go)); AI Pro free 18 months on Jio 5G ([AIM](https://analyticsindiamag.com/ai-news-updates/reliance-jio-expands-free-google-ai-pro-access-to-users-of-all-ages)) | Yes (general chat) | n/a |
| 11 | [Creator Kit Tamil AI](https://play.google.com/store/apps/details?id=com.bhelnatarajan.creatorkittamilaiyoutuberhelperapp) | Indirect | Free with ads | English + Tamil generators; no channel data | 10+ downloads |
| 12 | [YouSEO](https://www.capterra.in/software/1109744/YouSEO-YouTube-Creator-Toolkit) | Indirect, Ahmedabad | Free version listed | None listed | 0 reviews |

Full rows, taglines and dates: `founder/competitors.csv`.

### 2. Price range (cheapest paid monthly plan, at ₹88/$)

Eight data points: TubeBuddy Pro $3, ChatGPT Go ₹399, Gemini AI Plus ₹399, vidIQ Boost $19, 1of10 Basic $19, OutlierKit $24.92 (yearly billing), Spotter $49, ViewStats $49.99.

| | USD | ₹ |
|---|---|---|
| Lowest (TubeBuddy Pro) | $3.00 | ₹264 |
| Median | $19.00 | ₹1,672 |
| Highest (ViewStats Pro) | $49.99 | ₹4,399 |

If you use vidIQ's reported India price (₹999 = $11.35) in place of the US $19, the median falls to about $15 (₹1,336). Free floor: YouTube Studio and Gemini free. VidUp has no plan; about ₹8 a credit. **Mitra's ₹99 ($1.13) and ₹249 ($2.83) are below every paid YouTube tool on the list, including TubeBuddy Pro.**

### 3. Positioning map

X axis: how well it speaks the creator's language (none, then interface only, then output in Indian languages, then reads your channel and coaches you in your language). Y axis: monthly cost to an Indian creator.

```
 ₹4,000+ | ViewStats  Spotter
         | OutlierKit(₹2.2k yr-billed)
 ₹1,000- | vidIQ Boost(₹999 IN / $19)   1of10(Hindi UI)
 ₹2,000  | TubeBuddy Legend
         |
 ₹250-   | TubeBuddy Pro(₹264)        ChatGPT Go / Gemini Plus (₹399, Hindi chat,
 ₹400    |                             no channel data unless pasted)
         |                                      VidUp (₹49-449 packs, Indian
 <₹250   |                                      output, pre-production only)
         |                                                 [MITRA ₹99/₹249: reads
 Free    | YouSEO  Creator Kit Tamil   YouTube Ask Studio (reads channel;  channel +
         |                             Hindi support unconfirmed)          coaches in-language]
         +-------------------------------------------------------------------------->
           English only       UI in Hindi      Output in Indian languages   Channel-aware coach in language
```

### 4. Complaints, ranked

Main sources: vidIQ App Store reviews, 1–3 stars ([India feed](https://itunes.apple.com/in/rss/customerreviews/page=1/id=1458235345/sortBy=mostRecent/json), [US feed](https://itunes.apple.com/us/rss/customerreviews/page=1/id=1458235345/sortBy=mostRecent/json)); the vidIQ and YouTube Studio Play India pages; TubeBuddy on Capterra. Counts are reviews read, not a sample of all reviews.

1. **Bugs, lag, re-logins (about 9).** IN: "Lags so much"; US: "I'm paying $50 per month for this app, but it constantly stops working"; Play IN: "after I canceled AutoPay, the app stopped working entirely".
2. **Paywall and credit limits (about 8).** US: "even with $60 you're still limited"; US: "You get basically nothing if you don't pay"; IN: "I spent 999 rs in may 2025 and It was fully waste"; TubeBuddy: "A lot of features behind the paywall" ([Capterra](https://www.capterra.com/p/172520/TubeBuddy/)).
3. **No better than free tools, Studio or ChatGPT (4).** IN: "no better than youtube studio or the free service available online"; IN: "just get use gpt that is far better"; Play: "back to screenshots of YT studio on ChatGPT".
4. **Inconsistent or untrustworthy AI advice (3, thin).** US: "It changes its mind all the time on it's own recommendation"; IN: "Worst AI I used ever in my life".
5. **Billing and price differs by device (2, thin).** IN: "they charge 499 from mobile app and if you open in laptop then shown charge for one month will be different".
6. **Account permissions and trust (2, thin).** IN: "i found so many unauthorised subscriptions in my account after giving permission to this app"; US: "it also requires full access to your account".
7. **Language (0 reviews found).** No review I could read complains that vidIQ or TubeBuddy is weak in Hindi or regional languages. The language evidence comes only from the products themselves: no Indian locale on vidIQ, an English-only Inspiration tab, and Hindi not confirmed for Ask Studio. Reddit, where such threads would most likely be, was unreachable.

### 5. THE GAP

**A coach that reads your own channel, explains in Hindi/Telugu/Tamil why your last video did what it did and what to post next, for under ₹300 a month.** Nobody on this list does all three:
- vidIQ, 1of10 and ViewStats diagnose a channel, but in English, at ₹999 to ₹4,399 a month, and their reviewers complain about paywalls and credits (themes 1–2).
- VidUp is in Indian languages and reads channel stats, but only writes pre-upload packs. Its page shows no post-upload diagnosis, weekly report or trend radar.
- ChatGPT/Gemini speak the language and are free or ₹399, but can't see the channel. Creators paste screenshots instead (theme 3 quote).

Mitra's "2-day check after upload", its Monday report and ₹99 price fall straight into that space. Two caveats: the language half of the gap comes from product features, not from customer complaints (theme 7 is empty), and it lasts only until Ask Studio speaks Hindi.

### 6. THE THREAT

1. **YouTube Ask Studio (fastest, worst).** It is free and first-party, already reads the creator's channel and comments, and help pages say it works in "any supported language" once you're in an eligible country. Third-party reviews say India is one ([kdcc](https://blog.kdcc.social/how-to-use-ask-studio-youtube/)). Hindi is unconfirmed today. If Google switches it on, Mitra's core diagnosis becomes a free feature, and Google needs none of the OAuth verification or "derived metrics" approval Mitra still waits on. Defence: things Studio won't do. Trend Radar by language, a competitor comparison, slang and comment insights, and WhatsApp delivery.
2. **vidIQ.** It already has an AI Coach, 50 lakh+ Play installs (global count), reported India rupee pricing and an MCP. Turning on Hindi output and a ₹199 India plan would be a pricing-page and prompt change, done in weeks.
3. **VidUp.** Same buyer, same languages, already in INR and already reading channel data. Adding a "why did this video flop" report is one feature away.
4. **DIY substitute.** ChatGPT Go or Gemini is free for a year for many Indian users, and vidIQ and OutlierKit already connect to Claude and ChatGPT through MCP. "Free AI + paste screenshots" is the default to beat.

## The buyer panel

**0 buy · 20 pass** (0% buy) out of 20 simulated buyers. Seed 249806, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Growing part-time creator (10K-100K subs, earns some AdSense or brand deals) | 7 | 0%  (thin) |
| Small hobby-to-serious creator (1K-10K subs, not monetised or just monetised), student or day job | 9 | 0% |
| Full-time regional creator (100K-500K subs, YouTube is main income, may have an editor) | 4 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Copies what is trending | 3 | 0%  (thin) |
| Free-tools only | 5 | 0%  (thin) |
| Already pays for vidIQ or TubeBuddy | 2 | 0%  (thin) |
| Busy, phone-only | 4 | 0%  (thin) |
| Learns from YouTube gurus | 4 | 0%  (thin) |
| Data-curious | 2 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| under $487,000 | 6 | 0%  (thin) |
| $487,000 to $979,000 | 7 | 0%  (thin) |
| $979,000 and up | 7 | 0%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 9 | "I'm a Hindi creator and I already get growth tips free from the big channels I watch at night. Handing my YouTube login to an app I've never heard of, just to get a chatbot's take on my own numbers, doesn't feel worth it when I can check the analytics myself." (P001) · "Tools don't grow channels, consistency and luck do. I already check YouTube Studio every morning for free, and I'd rather copy what the Hindi guys in my feed say than pay a bot to tell me what my own numbers already show." (P010) |
| need | 6 | "I already pay for vidIQ or TubeBuddy and only use half of it, so I don't need another tool. Honestly my videos do better when I post consistently, not when I buy another dashboard." (P003) · "YouTube Studio already tells me which videos beat my usual views, and I can see my own comments. Mitra sounds like the same data with a Monday email on top, and I live in WhatsApp, not my inbox. I need to see it find something I couldn't have seen in Studio before I pay anything." (P004) |
| habit | 3 | "I tried vidIQ and it didn't help, and I've never paid for a creator tool. Ten free credits a month is enough to poke at it, but I'm not paying until it shows me something YouTube Studio doesn't already show me." (P002) · "I've never paid for a creator tool. vidIQ, TubeBuddy and YouTube Studio already give me numbers for free, and ChatGPT tells me what to post. I don't have time to read another dashboard, and a monthly report by email is one more thing I'll skip." (P006) |
| price | 2 | "I'm not paying ₹99 a month for something when my channel earns nothing yet. Even if the analytics are useful, I don't know yet whether they'd turn into views, and I'd rather spend that money on editing help." (P007) · "My channel earns nothing yet, so paying ₹99 a month for an AI coach feels like throwing money away. I already open YouTube Studio every morning and can see my own numbers there for free." (P009) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |

### What would flip a no

- A creator I already follow telling me it helped their channel, so I'd trust it before giving it access.
- If it named a specific, checkable reason one of my videos underperformed, and my next upload using its advice clearly beat my usual views.
- If I connected my channel on the free 10 credits and it correctly showed me a specific video that beat my usual views and explained why in Hindi or Hinglish, in a way I could check myself.
- A free look at one real video where it caught something specific that Studio missed, delivered on WhatsApp.
- It showed me something from my own channel data that YouTube Studio and ChatGPT clearly can't, like exactly why a specific video in Hindi underperformed.
- A clear free trial that shows me, on my own channel, a specific video I should repost or a title that would have beaten my last ten, in Hinglish, with no sign-up hassle.
- If it sent the report and video insights on WhatsApp, and the free 10 credits showed me one concrete idea from my own analytics that actually beat my usual views.
- If a free try on my own channel gave me a specific, checkable reason a video underperformed and a title or thumbnail change that actually beat my usual views.
- A free trial or a clear example, using my own channel, that shows a title or video idea that actually brought in more views.
- A free trial that correctly predicts which of my next few videos will beat my usual views, and gives a title or thumbnail idea that actually gets clicks.
- If I connect my channel for free and it names a specific video of mine that beat my usual views and gives a reason I can check against my own comments, in language that sounds like how my audience talks.
- If it showed me something in my Studio data that I couldn't find myself, like which of my Hindi videos beat my usual views and why, and that I could check against my own numbers before paying.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

### What simulated buyers said (founder/pricing-curve.md, 20 buyers)
Acceptable range ₹29–149 a month; least resistance ~₹30; indifference ~₹79; median "too expensive" ₹200. ₹99 sits inside the range, but **0 of 20 would pay at any price today**, so price is not the blocker: trust and proof are. Simulated answers pick what to test, not proof.

### What competitors charge
Cheapest paid monthly plans: TubeBuddy ₹264, median ~₹1,336–1,672, ViewStats ₹4,399 (founder/competitors.md, ₹88/$). Mitra at ₹99/₹249 is below every paid YouTube tool, so there is room to charge more for a proven result.

### What the business needs (founder/cfo.md)
Each paying Pro creator leaves ~₹57 a month. Break-even on infrastructure alone is ~64 paying creators. Paying one founder ₹50,000 a month would need ~950 Pro creators. At ₹99 this is a hobby-sized business unless it reaches thousands of payers.

### Recommendation
1. **Keep a real free tier and put the proof in it.** The panel's #1 flip is "show me one specific, checkable thing on my own channel". Make the first connect produce that (one video, one reason, one fix) for free.
2. **Price for creators who earn**, not for hobbyists: test ₹299 (Pro) and ₹799 (Creator+, with a monthly human/AI review) with monetised creators 10K+ subs. Keep ₹99 as an intro month, ending on a fixed date.
3. **What to test with real buyers:** ₹99 vs ₹299 on the billing page for monetised creators, 2 weeks each, after the free first insight.
4. **Price objections to answer in marketing:** "my channel earns nothing yet", "YouTube Studio is free", "vidIQ didn't help me".

## The numbers

Every number below comes from the input file. Nothing is looked up or guessed.

### One paying Pro creator-month

| line | per paying Pro creator-month |
| --- | ---: |
| Price | $83.90 |
| AI calls, typical Pro use (~half the credits) | -$23.00 |
| Reports: 4 weekly + ~6 video checks (AI + WhatsApp template) | -$2.00 |
| Razorpay ~2% + 18% GST on the fee | -$2.34 |
| **Contribution** (what each paying Pro creator-month leaves to pay the fixed costs) | **$56.56** (67%) |

### The margin that matters

Fixed costs: $3,600 a month (Hosting, database, images, domain (midpoint of ₹1,850–3,950) $2,900, Free + Founder Pass users (~100 x ₹7) $700, Founder salaries $0).

- **Break-even: 64 paying Pro creator-months a day.** Below that you lose money every month.
- **Profit margin at your plan** (150 a day): **39%** of every sale, after every cost.

### Year 1, month by month

| month | paying Pro creator-months a day | revenue | profit | cumulative (after $17,000 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$3,600 | -$20,600 |
| 2 | 5 | $420 | -$3,317 | -$23,917 |
| 3 | 10 | $839 | -$3,034 | -$26,952 |
| 4 | 18 | $1,510 | -$2,582 | -$29,534 |
| 5 | 26 | $2,181 | -$2,129 | -$31,663 |
| 6 | 35 | $2,936 | -$1,620 | -$33,283 |
| 7 | 45 | $3,776 | -$1,055 | -$34,338 |
| 8 | 55 | $4,614 | -$489 | -$34,827 |
| 9 | 65 | $5,454 | $76 | -$34,751 |
| 10 | 75 | $6,292 | $642 | -$34,109 |
| 11 | 85 | $7,132 | $1,208 | -$32,901 |
| 12 | 100 | $8,390 | $2,056 | -$30,845 |

- **Year 1 operating profit: -$13,845** on $43,544 of revenue.
- After the $17,000 startup spend: -$30,845.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$34,827**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 39% | 64 | -$13,845 |
| Price -10% | 32% | 75 | -$18,200 |
| Volume -20% | 32% | 64 | -$19,716 |
| Unit costs +15% | 34% | 69 | -$15,974 |

### Red flags

- Year 1 loses money on operations (-$13,845).
- The startup spend is not earned back within year 1.

## Not done yet

- The offer: run /founder-offer
- Marketing: run /founder-marketing
- Brand: run /founder-brand
- Operations: run /founder-ops
- Launch plan: run /founder-launch

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
