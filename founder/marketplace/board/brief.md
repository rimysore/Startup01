# Board brief: Mitra marketplace (as built, 21 Oct 2026)

This is the third look at Mitra. Read it as a stranger: everything you need is here.

## History (for context only; score the business as it is now)
- Round 1 (an ₹99/month AI analytics coach for Indian-language YouTubers): board 2 FUND IF, 1 PASS, avg 3.7/10. A 20-creator simulated panel: 0 of 20 would pay. Main objections: YouTube Studio/ChatGPT are free; won't give an unknown app channel access; no proof.
- Round 2 (the vision: plan -> content -> measured result -> help creators get paid): 3 FUND IF, avg 5.7. Panel: 0 of 20 pay ₹299/month up front; what would flip them is "one real local deal that pays me before I pay Mitra", approval before anything goes out, fee shown first. New fear: audience trust (feeling "sold to").
- The founders then pivoted to an earn-first marketplace and built it.

## The idea now
- What it is: a free app where Kannada and English creators get paid local deals and check every offer they receive for scams and missing terms, and where Bengaluru businesses (cafés, restaurants, salons, gyms, clinics, shops) post a goal and budget, get 3-5 matched creators with reasons, and count the customers each post brings in.
- Who it is for: two sides. (1) Creators in and around Bengaluru who post in Kannada and/or English on Instagram, YouTube, Facebook or Moj/ShareChat, roughly 2K-200K followers, food / local lifestyle first, who get brand DMs and want paid work. (2) Owner-run local businesses in Bengaluru with a small marketing budget (roughly ₹5,000-50,000 a campaign) who already try creators or Instagram ads.
- What it sells, at what price: creators pay nothing, ever, to join, apply, be seen or be verified, and keep 100% of the agreed fee. Pilot (to ~Jan 2027): free for everyone. After: on deals Mitra matched, the business pays Mitra 10% of the creator fee on top (min ₹199 per deal, + 18% GST on the fee); later Mitra for Business ₹999/month (unlimited briefs, reports, fee drops to 5%), managed campaigns for brands/agencies at 15-20%, an optional Creator Pro ₹99-149/month for growth tools only, and opt-in disclosed affiliate.
- Where and how: web app (Next.js on Vercel) plus a WhatsApp bot; Bengaluru first, Kannada + English. Founders recruit creators and businesses by hand (DMs, walking in, WhatsApp groups). Deals and payment happen directly between the two sides (UPI/cash) and are recorded in Mitra; payment protection via a payment provider's split payouts after a CA signs off.
- Budget and constraints: bootstrapped, two founders (product/engineering in the US; marketing and outreach in India, part-time). Infra ~₹1,850-3,950/month. 0 paying users, 0 closed marketplace deals yet; the creator analytics beta is live with a handful of testers; the marketplace is built and on a preview (dev) only, not launched.

## What is built (on a preview, behind a feature flag; not launched)
Creator side:
- Sign up with Google without connecting any channel; choose role (creator, local business, brand, agency) and screen language (Kannada/English); consents logged.
- Media kit across six platforms; typed numbers labelled "Self-reported"; "Verify with YouTube" (read-only) replaces them with the real count (lapses after 30 days per YouTube API rules). Instagram verification not built.
- Offer inbox: offers arrive by paste, screenshot (AI transcribes, 1 credit), forwarding email to a private address, or forwarding on WhatsApp. Each is checked twice: what it says (pay, deliverables, date, payment timing, usage rights, exclusivity, disclosure; a "registration fee" is not read as pay) and who sent it (scam patterns: pay-to-collab, buy-then-refund, OTP/ID requests, task jobs, APKs, crypto, Telegram, urgency, short links; free email vs brand domain; domain age via RDAP; mail servers via DNS; Wikidata official website; reports from other creators shown only when 2+ agree; senders who paid creators through Mitra). Verdict: likely scam / be careful / looks OK / unknown, with sources. Reply drafts in English or Kannada; save to a private deal log.
- Deal log with statuses and money received; fair-rate range once 5+ creators in a niche share rates.
- "Let local businesses find me" opt-in; invites show the fee, Mitra's fee (shown as paid by the business, waived in pilot) and the offer check; contact details shared only on accept.
Business side:
- Brief: goal, what to post, kind of creators, language, budget, area, date, link.
- Matching with a written reason per creator (shared niche or area required; language, verified reach, rate within budget rank higher). Mitra's plan splits the budget.
- Deal room for both sides: messages, WhatsApp hand-off, promo code (e.g. RUCHI-SR) and a tracked link; the business counts customers at the counter (+1/-1) and records payment; both rate. Results: customers, paid to creators, cost per customer, link visits.
Also live from before: a creator analytics beta (Video Doctor, title/thumbnail studio, trends, weekly report), a WhatsApp bot.

## Pricing and money model (decided: the business pays)
- Principles: a creator who never earns through Mitra never pays Mitra; creators keep 100%; no fee on deals creators find themselves; every rupee itemised; pay for results, not access; no dark patterns, no selling data or visibility.
- Example: a café pays a creator ₹5,000; café pays ₹5,590 total (₹500 fee + ₹90 GST); after ~2% payment charges Mitra keeps ~₹388.
- Founders' own sizing (assumptions, untested): pilot 30 businesses x 2 deals/month ≈ ₹23k/month; one city at depth (400 businesses, 150 on the ₹999 plan) ≈ ₹4.6 lakh/month; five cities ≈ ₹25-30 lakh/month.
- Tax points pending a CA: GST on the fee; possible e-commerce operator TDS (194-O)/TCS if money flows through Mitra; businesses' TDS (194J/194C/194R); ASCI disclosure.

## Market context the founders have
- Main comparable: Influish (Udaipur, founded 2022): creator subscription reported ₹499/year, campaign marketplace, "0% commission" but campaign fees, funds held until approval; 1M+ Play Store downloads, ~3.3 stars, reviews complain "paid ₹499, got no collaborations"; raised a pre-seed at a reported ₹25 crore valuation (2026).
- Creators commonly get scam "collab" DMs asking for registration fees or buy-first-refund-later.
- Unknowns nobody has measured yet: what Bengaluru local businesses pay creators today, barter vs cash share, how many deals a business runs a month, cost to acquire a business, repeat rate.

## Plan and gates
- Weeks 5-6: payment links, invoices, ratings, admin pilot dashboard; pilot 30 creators + 10 businesses in Bengaluru, food/local lifestyle, Kannada.
- Gates: after week 6, 10+ businesses posted a brief, 5+ deals closed, outcomes measured on 3+; after week 8, 3+ businesses come back, creators earned through Mitra, no audience-trust complaints. If businesses won't pay creators, keep the creator side and pivot demand to brands/agencies.
- Funding being considered: YC W27 (deadline 2 Nov 2026), Startup India Seed Fund via an incubator, angels after pilot data. Company structure (Indian entity vs Delaware parent) undecided.

## Team
Two founders: one builds product (US-based), one does marketing/outreach/customer conversations in India (IST, part-time).
