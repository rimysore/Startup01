# Mitra: earn-first marketplace with the growth core (co-founder plan, 21 Oct 2026)

## The decision
Move toward a creator + business + brand platform with monetisation agents, cross-platform, Kannada + English, **but do not drop platform data. Make it optional instead of the front door.**

- **Join without connecting.** Creators, local businesses and brands sign up directly. Creators list handles on any platform (Instagram, YouTube, Facebook, Moj/ShareChat/Josh) and their own numbers. This removes the #1 trust objection ("unknown app with access to my channel") and the Google-verification wait.
- **Connect to get Verified.** Connecting YouTube/Instagram (read-only) earns a Verified badge, ranks higher with businesses, and unlocks the personal growth plan (today's Video Doctor / Retention Sprint core). Brands' biggest fear in influencer marketing is inflated, self-reported numbers; unverified stats can't be the long-term basis for matching.
- **Own the outcome data ourselves.** Each deal runs through instruments Mitra controls: a unique promo code, a tracked WhatsApp/UPI link, the payment record, and both sides' ratings. This data is ours, platform-independent, and it is the moat: "which creators actually bring customers to which businesses". YouTube's 30-day rule doesn't touch it.

If verified creators turn out to matter less than expected to local businesses, we've lost nothing. If they matter a lot, we already have the connect flow.

## Influish: what they are, and how we differ
From the research the founder shared plus public coverage (their site couldn't be reached from here, so prices are as reported):
- Creator app: Instagram auto-DM, campaign discovery (paid and barter), AI hooks/captions, account health, rate calculator, invoices. Creator subscription reported at ₹499/year; referral rewards up to 50% recurring.
- Brands: post a campaign (niche, city, follower range, budget), creators apply, shortlist, chat, approve, pay. "0% commission" but campaign/platform fees; funds held until deliverables are approved.
- Traction (reported): 1M+ Play Store downloads, ~3.3★; app reviews complain "paid ₹499, got no collaborations".
- Funding: pre-seed at a reported ₹25 crore valuation, angels incl. Clovia co-founder Pankaj Vermani; announced June 2026 (some sources say closed March 2026); amount undisclosed (one aggregator lists $2.6M, unconfirmed). Founded 2022, Udaipur; uses Meta APIs.
  Sources: Campaign India, Ascendants, The SaaS News, The Quint, Briter (links in chat).
- **Lessons to take:** one free hook that's useful on day one; onboarding in minutes; creators and businesses in one place; payment protection; in-app deal room; referral loop.
- **Where we differ:** they sell access to campaigns (and creators blame them when none come); we are **free for creators and earn only when a creator earns** (a disclosed fee on deals Mitra brings). They're Instagram-first across India; we go deep in one language and city first, cross-platform, and match on verified performance and measured outcomes, showing 3 fitting opportunities, not 100.

## Business model
- Creators: free. Mitra takes a clearly disclosed fee (test 10%) only on deals Mitra sourced; never on deals the creator brings. Paid "Pro" growth tools can come later.
- Local businesses: the "CMO agent" (goal, budget, area → plan + shortlist + brief + results) free to try; pay per campaign or a small monthly plan once results show. Test both.
- Brands/agencies: managed campaigns for creator pools with a service fee.
- Affiliate: opt-in, disclosed, creator-picked products; commission split.
- Money handling: don't hold funds ourselves; use a payment provider's split/marketplace product (e.g. Razorpay Route) after a CA confirms the setup. Influencer payments carry GST/TDS rules (incl. Section 194R on benefits); ASCI disclosure labels on every paid or affiliate post.

## Build plan (separate branch `claude/phase-1-weekly-plan` → rename to fit, cut from `dev`, behind a flag; the live beta keeps working)
| Weeks | Build | Manual work in parallel |
| --- | --- | --- |
| 1 (to 1 Nov) | Data model: account role (creator / business / brand / agency); cross-platform creator profile (handles, self-reported stats, verified flag, languages, area, niche); business profile (category, area, budget); opportunity, deal (offer, rate, deliverables, status), outcome (code, link, redemptions, payment, ratings), consent. Kannada + English UI strings. | Pick the beachhead: Kannada + one niche (food or local lifestyle) + Bengaluru. List 50 creators and 30 local businesses. |
| 2–3 | **Creator side:** sign up without connecting; profile + media kit (self-reported numbers or insight screenshots read by AI, clearly labelled "self-reported"; connect for Verified); "paste an offer" checker (missing terms, fair-rate range); private deal log. | 2 Nov beta recruiting continues; founder WhatsApp checks. Talk to 10 local businesses: what they pay creators today, barter vs cash, how they judge results. |
| 3–4 | **Business side, the CMO agent:** goal + budget + area → a short plan and 3–5 matched creators with reasons (verified first) → creator approves before any contact → deal room (WhatsApp hand-off allowed) → promo code / tracked link generated → results page. | Close 5 deals by hand using the flow. |
| 5–6 | Payments via a payment link first (split payouts once a CA signs off); invoices; ratings both ways; admin pilot dashboard. | Pilot: 30 creators, 10 businesses in Bengaluru. |
| 7–8 | Measure: deals, redemptions, repeat businesses, creator earnings; fix what broke; opt-in affiliate test with 5 creators. | Write the results for investors. |
The growth core stays: connected creators keep Video Doctor, Studio and the weekly plan, and the "Today" card can now include "a business near you wants this".

## Gates
- After week 6: ≥10 businesses posted a brief, ≥5 deals closed, outcomes measured on ≥3.
- After week 8: ≥3 businesses come back for a second campaign; creators earned money through Mitra; no audience-trust complaints from disclosed deals.
- If businesses won't pay for creators at all: keep the creator side (growth + offer checker) and pivot the demand side to brands/agencies.

## Funding: where and when (as of 21 Oct 2026)
| When | What | Notes |
| --- | --- | --- |
| Now, rolling | Cloud/AI credit programs (Google for Startups Cloud, AWS Activate, Microsoft for Startups) | Lowers running cost; no equity. |
| **2 Nov 2026, 8pm PT** | **Y Combinator Winter 2027** (on-time deadline; decisions by ~11–18 Dec, sources differ) | Worth applying now: two founders, live product, clear market, comparable raised (Influish). Late applications are possible but weaker. |
| 13 Nov 2026 | Karnataka ELEVATE: current calls are DeepTech (NxT) and Minorities only | Probably not a fit; needs a Karnataka-registered startup. Prepare for the next general call (the 25th opened 25 May 2026). |
| Jan–Feb 2027 | Startup India Seed Fund Scheme via an incubator (up to ₹20 lakh grant, ₹50 lakh debt) | Needs an Indian Pvt Ltd/LLP, DPIIT recognition, ≤2 years old, ≥51% Indian promoters. Apply through incubators on seedfund.startupindia.gov.in. |
| ~Feb 2027 | YC Spring 2027 | Spring deadlines have been early February; not yet announced. |
| ~Mar–Apr 2027 | Google for Startups Accelerator: India (equity-free) | 2026 window was 31 Mar–19 Apr, for AI-first startups; 2027 not yet announced. |
| ~May 2027 | Karnataka ELEVATE general call | Up to ₹50 lakh grant; Karnataka entity. |
| Rolling, after pilot data (Jan–Mar 2027) | Angels and pre-seed: angel networks (Indian Angel Network, Venture Catalysts, Inflection Point Ventures), Antler India, 100X.VC (cohorts) | Consumer/D2C founder angels fit (Influish's round came from that crowd). Lead with pilot numbers. |

**Structure first:** Indian grants need an Indian company with ≥51% Indian promoters; YC and US investors usually want a Delaware parent with an Indian subsidiary. Decide with a CA/lawyer this month; it changes which forms you can submit.
