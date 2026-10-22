# 01. Progress review: where Mitra stands vs pre-seed expectations (22 Oct 2026)

Inputs: `founder/marketplace/GUIDE.md`, `board.md`, `competitors.md`, `SHORT-TERM-PLAN.md`, `founder/vision/PLAN-marketplace.md`, `founder/vision/REPORT.md`, `creator-app/docs/BUSINESS_MODEL.md`, `creator-app/docs/MARKETPLACE.md`, and the git history of `dev`. Outside facts are linked with dates. My judgements are marked **(judgement)**.

## 1. The honest one-paragraph read

Mitra has a **well-built product and a sharp wedge, but nothing has been proven in the market yet.** The marketplace preview has the offer inbox with sender checks, the media kit, briefs and matching, the deal room, and Track, which uses coupons redeemed at the counter with a PIN (`MARKETPLACE.md`). All of it is behind a flag and none of it is live in production. The founders' own board (simulated) scored it **5.0/10 because it has 0 deals, 0 measured outcomes and 0 businesses signed** (`board.md`). Every buy rate so far comes from simulated panels: 10 of 20 creators would sign up, 4 of 20 businesses would try it. Those are upper bounds, not evidence. Investors in 2026 are explicitly funding "performance today" ([ET, mid-2026](https://economictimes.indiatimes.com/tech/startups/startup-seed-rounds-double-as-vcs-turn-more-selective/articleshow/132023936.cms)). A US company in the same model already has the numbers Mitra lacks (section 3), so the gap is concrete.

## 2. What is proven, what is not

| Area | Status | Evidence |
| --- | --- | --- |
| Can the team build? | **Proven** | 80+ commits; marketplace data model, inbox, sender check, Track and redeem, tests (`MARKETPLACE.md`) |
| Is there a real gap? | **Partly proven (desk research)** | No Bengaluru rival combines Kannada matching, counter-counted customers and a free scam check (`competitors.md`). No funded rival focused on creator-driven local footfall was found in Bengaluru as of 21 Oct 2026 (see `05-timing.md`) |
| Do creators want the inbox? | **Not proven** | Simulated panel only. No count of real creators forwarding real offers. The outreach run drafts emails, but the reply numbers are not in the repo |
| Will businesses use Track? | **Not proven** | 0 businesses on Track. The plan targets 15 by weeks 3–4 (`SHORT-TERM-PLAN.md`) |
| Is the counted number trusted? | **Not proven** | Counter-PIN redeem is built. No check against bills yet (gate: within ~20% at 3 cafés) |
| Will businesses pay? | **Not proven, and the biggest risk** | The business panel says most pay creators in barter, not cash (`board.md`). Indian free-merchant tools have historically monetised badly: Khatabook FY24 revenue ₹102.7 cr against a ₹116 cr loss ([YourStory, Nov 2024](https://cwv.yourstory.com/2024/11/ms-dhoni-backed-khatabook-clocks-rs-1027-cr-revenue-cuts-losses-7-in-fy24)), OkCredit FY25 ₹23.3 cr ([Inc42](https://inc42.com/buzz/tiger-global-backed-okcredit-narrows-fy25-loss-by-34-to-inr-23-cr/)) |
| Can you reach businesses cheaply? | **Not proven** | Every business so far would come from a founder or rep walking in. Cost to sign one up is unmeasured |
| Money model | **Unsettled** | The docs moved from 10% per matched deal, to a flat ₹299 per deal, to monthly plans (Free / ₹499 / ₹1,499) within the same week (`GUIDE.md`, `BUSINESS_MODEL.md`). The code still shows `MITRA_FEE_PCT`. Pick one story for investors (the plans) and stop changing it until pilot data says otherwise |
| Company | **Not set up** | No entity, no GST, no DPIIT. This blocks every Indian scheme and any collection of fees (`02-funding.md`) |
| Team | **Weak spot** | One founder builds from the USA; the other is part-time in India. YC requires full-time founders during and after the batch ([YC FAQ](https://www.ycombinator.com/faq), read 21 Oct 2026). Antler India requires full-time founders in Bengaluru ([Antler India](https://www.antler.co/location/india), read 21 Oct 2026) |
| Public face | **Out of date** | trymitraapp.com still presents the earlier YouTube-retention "digital manager" for Hindi and Kannada creators, not the inbox and Track (checked 21 Oct 2026; see `04-brand.md`). An investor or café owner who visits today sees a different company |

## 3. What investors and accelerators expect at pre-seed in India (2026)

- **The bar has risen.** Seed round count in India fell to **420 in H1 2026 from 797** a year earlier, and first-time-funded companies fell 31% ([Tracxn H1 2026](https://tracxn.com/d/insights/market-reports/india-tech-h1-2026-geo-semi-annual-report/__lHq3otGqbon6v-RYcm3-B2GCw3b6bqZ3djS7ZXQ7As0)). The median seed ticket is about $1M ([Inc42, 30 Jun 2026](https://inc42.com/features/indian-startup-funding-slips-9-to-5-2-bn-in-h1-2026/)), or ₹8.0 cr median ([Finval, 22 Aug 2026](https://finvalresearch.in/india-startup-funding-report-2026/)).
- **Typical pre-seed asks** (secondary sources, treat as indicative): a working product plus one or two paying pilots ([Backrr](https://backrr.com/blog/pre-seed-seed-series-a-metrics-india), undated). Angels look for signals like "10 paying customers, even at ₹500/month" ([Super Launch, 1 Apr 2026](https://superlaunch.in/blog/indian-angel-investors-what-they-look-for-2026)).
- **Blume's published floors** (read 21 Oct 2026) are useful as a seed-stage yardstick: marketplaces at **₹50 lakh monthly GMV**, B2B or transaction plays at **₹3 cr annualised revenue**. Blume also says it has "very little appetite for narrowly defined SMB products... catering only to an Indian market" ([blume.vc](https://blume.vc/)). That is a warning about the ₹499 SMB story.
- **YC funds ideas, but the bar for this exact idea is now visible.** About 40% of each YC batch is "just an idea" ([YC FAQ](https://www.ycombinator.com/faq)). **TryNearby (YC Summer 2026, Los Angeles)** sells restaurants a **$399/month** subscription for nearby creators who visit, film and post. It reports **120+ paying restaurants, 37% month-on-month growth and over 90% monthly restaurant retention** (company-reported on its [YC page](https://www.ycombinator.com/companies/trynearby), read 22 Oct 2026). Any YC partner reading Mitra's application will have that benchmark in mind.
- **The comparable Indian valuation:** Influish raised a pre-seed at a **₹25 cr valuation** from angels, claiming 5–10 lakh creators and 50% month-on-month revenue growth ([Entrackr, 17 Jun 2026](https://entrackr.com/snippets/influencer-marketing-startup-influish-raises-pre-seed-funding-at-rs-25-cr-valuation-12046273)). Creedom raised a ₹4.1 cr seed at ₹42 cr ([Entrackr, 2 Sep 2026](https://entrackr.com/snippets/ai-content-creator-platform-creedom-raises-seed-round-12484133)). Both had users at scale. Mitra has none yet.

**(judgement)** Measured against these, Mitra today is **an idea-stage company with a strong prototype**. That is fundable by idea-stage cheques: First Cheque says "the best time to pitch is when you haven't got a single customer" ([firstcheque.vc](https://www.firstcheque.vc/), read 21 Oct 2026). The rest of the market will want the numbers below first.

## 4. The five numbers to get in the next 8 weeks (to 16 Dec 2026)

Chosen because each answers a question investors will ask first (`SHORT-TERM-PLAN.md` lists the same four questions) and each can be measured from what is already built. The targets are **(judgement)**, set against TryNearby's public numbers and the existing week-8 gate.

| # | Number | Why it matters | Target by 16 Dec 2026 | How to measure |
| --- | --- | --- | --- | --- |
| 1 | **Businesses with a coupon redeemed in the last 14 days** | Proves owners use Track, not just sign up | **20** (stretch 30) in 1–2 neighbourhoods | `tracked_posts` and `coupons` in the admin view |
| 2 | **Customers counted per creator post, and match against the bill** | The number is the product. If owners don't trust it, nothing else sells | Median and range across 30+ posts; **within ~20% of bills at 3+ venues** | Count vs POS or bill book, checked by hand at 3 venues |
| 3 | **Businesses paying anything** (plan or paid deal) **and MRR** | Willingness to pay is the biggest unknown (section 2) | **5–10 paying**, any price. Even ₹499 counts | Payment links or invoices; switch on `PLANS_ENFORCED` for a test group |
| 4 | **Repeat rate: businesses that run a 2nd tracked post within 30 days, unprompted** | Retention is what TryNearby leads with (over 90% monthly, company-reported) | **≥50%** of active businesses | Cohort table from `tracked_posts` |
| 5 | **Creators who forward a real offer to the inbox without a founder DM, and scams caught** | Tests whether the creator wedge pulls supply by itself (the board's moat question) | **100+** organic forwarders, with the count of offers flagged as scams published | `inbox_offers` by source; `sender_reports` |

Track every week, too: **cost to sign up one business** (rep hours, travel and printed standees, divided by businesses active). It is the number most likely to kill the model. Dukaan dropped micro-merchants because inside sales cost more than they paid ([Inc42](https://inc42.com/buzz/exclusive-lightspeed-backed-dukaan-lays-off-30-workforce)).

## 5. What would change the read fast

- **One founder in Bengaluru, full-time, for the pilot months.** This raises every funding row in `02-funding.md` more than any feature would. It is also the condition YC and Antler state in writing.
- **Freeze building for 4 weeks.** The product is ahead of the evidence. Each extra feature before 20 active businesses adds to the "too many products" risk all three board lenses named.
- **Fix the public site** so it describes the inbox and Track before any outreach or application links to it.

Not legal, tax or financial advice.
