# Founding plan: an agentic money coach that acts at the moment you spend

> **Status (2026-10-08): parked.** We are now exploring vertical B2B ideas instead; see `VERTICALS.md`. Kept for reference.

Working name: **Tapwise** (placeholder; check trademark and domain before using it publicly).

Written 2026-10-08. This is a living document. Every number marked *(assumption)* must be checked before it goes in front of an investor.

---

## 1. Cofounder reflection: what is true, what is hard

**What's good about this idea**
- You have the problem yourself. You are customer #1 and can test every feature on your own money every day.
- The timing is real: prices are high, young people feel squeezed, and LLM agents can now do what used to need a human financial coach.
- "Save, then invest, then grow" is a goal people stick with for years. If the product actually helps, they stay.

**What's hard (and we have to be honest about it)**
1. **The market is crowded.** Mint shut down in 2024, and its users scattered to Copilot Money, Monarch, YNAB, Rocket Money, Cleo, Origin, Albert and the banks' own apps. "AI budgeting app" on its own is not a company. We need a **wedge**: a specific user group plus a specific moment that nobody serves well.
2. **Dashboards don't change behavior.** Most personal finance apps lose most of their users within a few weeks. Seeing a pie chart of last month doesn't stop you overspending tomorrow. The product has to step in **before or right when** you spend, not after.
3. **You can't read "every Apple Pay tap" directly.** Apple doesn't give third-party apps a feed of Wallet taps. What we *can* do:
   - **Bank and card data** through an aggregator (Plaid, MX, Teller, Finicity). This covers every card, including taps made with Apple Pay. It arrives with a delay of minutes to a day.
   - **Apple FinanceKit** (iOS 17.4+) for Apple Card, Apple Cash and Apple Savings transactions on the device. It needs Apple to approve an entitlement.
   - **Shortcuts "Transaction" automation** (iOS 17+): the user sets up an automation that runs when they tap a card in Wallet. It passes the merchant and amount to our app, which can respond **within seconds**. This is our real-time hook. Getting users to set it up has to take one tap, with a guided flow.
4. **Investment advice is regulated.** Recommending specific securities to a specific person makes us an investment adviser (SEC or state registration). Until we register or partner with someone who is registered, we offer education, general allocation frameworks, savings automation and "what-if" simulations. We never tell someone to "buy X."
5. **Trust and security come first.** People are handing us their bank data. That means read-only access, encryption, no selling data, and a SOC 2 plan before we sell to institutions.

**Conclusion:** the idea works if we narrow it down and build it around **the moment of spending**. That moment is the differentiator, not "AI" by itself.

---

## 2. The wedge

**Who:** college students and early-career people in their first 3 years of earning, starting with **international students** in the US.
- They have no credit history and a tight budget, deal with remittances and currency swings, are financially on their own for the first time, and often have the least support.
- We can reach them cheaply: campus orgs, international student offices, WhatsApp and Discord groups, career fairs. You're at IU, so the first 500 users can come from one campus.
- Universities and employers already pay for "financial wellness." That gives us a B2B2C route to scale (section 6).

**The promise (one line):** *"Tap your card, and Tapwise tells you in 2 seconds whether you can afford it and what it does to your goals. It then quietly moves the difference into savings."*

---

## 3. Product: what we build

### Core loop (the only thing that matters in v1)
1. **Tap**: the user pays with Apple Pay. The Shortcut automation sends merchant and amount to Tapwise.
2. **Nudge** (within seconds): a notification such as *"$6.40 at Starbucks: 82% of this week's fun budget is used. Skip one more and you hit your laptop goal 4 days sooner."*
3. **Act**: one-tap options like "move $5 to savings," "set a coffee cap," or "it's fine, it's a treat."
4. **Weekly 2-minute check-in** with the agent, by chat or voice: what happened, one decision for next week.
5. **60-second lesson** triggered by what the user actually did, for example "Why your credit utilization jumped this week" right after a large card charge.

### The agent (what makes it "agentic" and not just a chatbot)
It has tools and takes actions, always with user approval:
| Level | What it does | When |
|---|---|---|
| Read | Categorizes spending, spots subscriptions, unusual charges, rising bills | v1 |
| Plan | Builds and adjusts the budget automatically from real spending, sets goals, runs "can I afford X?" simulations | v1 |
| Nudge | Real-time tap feedback, payday "pay yourself first" prompts | v1 |
| Act (with approval) | Drafts subscription-cancellation emails, finds cheaper plans, schedules transfers to savings | v2 |
| Grow | Teaches investing basics, simulates "invest $50/month from age 22," connects to a licensed partner for investing | v3 (needs a licensed partner or adviser registration) |

### Personalized learning
- v1: a library of about 50 short, script-based lessons (text plus 30–60 second vertical video). We make them with AI-assisted scripts and our own voice and face, because authentic beats polished for this audience. The agent picks the next lesson from the user's behavior.
- v2: lessons generated on the fly from the user's own numbers ("here's *your* credit utilization, and here's how to lower it").
- The learning content also works as **marketing**: post the same videos on TikTok, Reels and Shorts.

### What we do NOT build in v1
No web dashboard, Android app, couples' budgeting, crypto, tax filing, investing execution or bill negotiation. Each of these is a distraction until retention is proven.

---

## 4. Technical architecture (v1)

```
iOS app (SwiftUI, or Expo/React Native if the builder knows JS)
  ├─ App Intent "Log tap" ← called by Shortcuts Transaction automation (real-time)
  ├─ FinanceKit (Apple Card/Cash, on-device; apply for entitlement early)
  └─ Push notifications, chat UI, lessons player
Backend (Python FastAPI or Supabase: Postgres + auth + edge functions)
  ├─ Plaid (or Teller) read-only: transactions, balances, webhooks
  ├─ Categorization: rules first, LLM fallback, user corrections feed back
  ├─ Agent service: LLM (e.g. Claude) with tools:
  │     get_transactions, get_budget, set_budget, simulate_goal,
  │     find_subscriptions, draft_email, recommend_lesson
  ├─ Guardrails: no money movement without explicit approval;
  │     no individualized securities advice; every action logged
  └─ Jobs: weekly check-in, payday detection, anomaly alerts
Security: encryption at rest, tokens never on device, least-privilege,
          audit log, SOC 2 Type I before selling to universities/employers
```

**Cost per user to watch** *(assumptions, verify with vendors)*: the aggregator costs roughly $0.30–$1.50 per connected user per month, and LLM calls cost cents per user per month if we cache and use small models for categorization. A premium price of at least $5/month covers this with margin. **Free users must not get unlimited bank connections.**

---

## 5. Step-by-step plan

### Phase 0: Validate (weeks 0–3, cost ≈ $0)
- [ ] **Dogfood:** track every purchase of your own for 2 weeks by hand. Note the moments you wished someone had stopped you. These become the product.
- [ ] **30 customer interviews** with students and recent grads, at least 10 of them international. Ask about the past ("tell me about the last time money stressed you out"), not about the future ("would you use an app that…").
- [ ] **Landing page and waitlist** (Carrd, Framer or Typedream) with the one-line promise. Goal: 300 signups from campus channels.
- [ ] Write down the **top 3 painful moments**. If "the moment of spending" isn't among them, change the wedge before writing any code.

### Phase 1: Concierge MVP (weeks 3–7, cost < $200)
- [ ] 20–30 users. They set up the Shortcut automation that texts or WhatsApps their taps to us (or share weekly statements). We (you plus Claude) send nudges and weekly check-ins **by hand**.
- [ ] Measure: are they still replying in week 4? Did savings go up? Would they pay $5/month? Ask for pre-payment from 5 of them.
- [ ] This proves demand before we pay for Plaid or build an app.

### Phase 2: Build the v1 app (weeks 6–16)
- [ ] iOS app with the core loop only: tap capture, nudge, one-tap savings move (start with "reminder to move," and add real transfers later via a partner), weekly agent check-in, 20 lessons.
- [ ] Plaid sandbox first, then production. Apply for the FinanceKit entitlement early.
- [ ] TestFlight beta with 100–300 users from the waitlist.
- [ ] **Bar to move on** *(target)*: ≥35% of users active weekly at week 4, ≥50% of users with the tap automation installed, and median savings rate visibly up versus their own baseline.

### Phase 3: Launch and monetize (months 4–8)
- [ ] App Store launch, campus ambassador program (5 schools), TikTok lesson channel.
- [ ] Freemium: free core loop with 1 account; **Premium $5–8/month** for unlimited accounts, the action agent and personalized lessons.
- [ ] First **B2B pilot**: one university's financial wellness or international student office, or a credit union. Even a free pilot gives us a logo and a case study.

### Phase 4: Scale (months 8–24)
- [ ] **B2B2C** is the scalable channel: universities, employers (HR benefits), credit unions and community banks (white-label "money coach"). One contract brings thousands of users with no ad spend.
- [ ] **Grow layer:** partner with a licensed investing provider (brokerage API or registered robo-adviser) so users can act on what they learned, or register as an investment adviser once revenue justifies it.
- [ ] Android, couples and families, newcomers to other countries (UK, Canada, India-to-US corridors).

---

## 6. Business model

| Stream | When | Notes |
|---|---|---|
| Consumer subscription ($5–8/mo) | Phase 3 | Main early revenue; target ≥5% free→paid *(assumption)* |
| B2B2C licenses (per seat, e.g. $2–5/employee or student/month) | Phase 3–4 | Scalable, sticky, cheap to acquire |
| Referral partnerships (high-yield savings, credit-builder cards) | Phase 3+ | Only products we'd recommend anyway; disclose clearly; never let payouts drive advice |
| Investing via licensed partner (revenue share) | Phase 4 | Needs the legal work in section 8 |

---

## 7. Team and funding

**Team**
- If you aren't technical, the cofounder **must** be the builder (iOS and backend). Look in IU CS and Informatics, at hackathons, and among people already building with LLMs. Do a small 2-week project together before splitting equity. Use 4-year vesting with a 1-year cliff for both of you.
- Your role: customers, interviews, content and lessons, partnerships, fundraising. Learn enough no-code (and how to use Claude) to prototype yourself.

**Funding (in order, don't raise before traction)**
1. **$0–5k, non-dilutive:** university pitch competitions and innovation centers (IU has entrepreneurship programs and competitions; check current ones), startup credits (cloud, Plaid startup programs, Apple developer, LLM API credits).
2. **Pre-seed, $100k–500k:** accelerators (Y Combinator, Techstars and its fintech programs, Antler), Indiana state-backed early-stage funds (e.g. Elevate Ventures), angels. **What you show:** the Phase 2 retention numbers, the pre-payments and one B2B pilot LOI.
3. **Seed, $1–3M:** after a B2B contract or two and consumer revenue growing month over month.

**The pitch in one sentence:** *"Budgeting apps show you what went wrong last month; Tapwise steps in the second you spend and turns that money into savings, starting with the 1M+ international students in the US who've never had a financial safety net."* (Verify the student count from current IIE Open Doors data before using it.)

---

## 8. Legal, compliance and trust checklist
- [ ] Form an entity (Delaware C-corp if raising VC) once there's a cofounder and real users. Not before.
- [ ] Privacy policy and terms; follow the GLBA safeguards rule and state privacy laws for financial data.
- [ ] Read-only data access in v1. **No holding or moving money ourselves**, which would raise money-transmitter issues. Use a licensed partner for transfers.
- [ ] No individualized securities advice until we have adviser registration or a licensed partner. Get a 1-hour fintech lawyer consult before Phase 3 (many offer startup rates or free clinics through the law school).
- [ ] Track US open-banking rules (CFPB Section 1033). Their status has been in flux, and they affect aggregator access and cost.
- [ ] Security: MFA, encryption, vendor review, incident plan; SOC 2 Type I before B2B.

---

## 9. Metrics we live by
- **North star:** dollars moved to savings per active user per month.
- Activation: tap automation installed, plus one account connected within 24 hours.
- Retention: users active weekly at weeks 1, 4 and 12.
- Behavior: share of nudges that lead to an action, and savings rate versus the user's own baseline.
- Business: free→paid conversion, cost per user (aggregator + LLM), B2B pipeline.

## 10. Biggest risks and how we de-risk them
| Risk | Mitigation |
|---|---|
| Nobody keeps using it (the PFM curse) | Concierge test before building; the core loop is the moment of spending, not a dashboard |
| Users won't set up the Shortcut automation | Guided one-tap setup; Plaid fallback still gives near-real-time nudges |
| Aggregator costs eat margin | Limit free connections; negotiate startup pricing; push B2B |
| Regulation (advice, data rules) | Education-only investing in v1; licensed partners; early lawyer consult |
| Big player copies it | Win the niche (international students, universities) plus distribution and trust; move faster |
| Founder burnout or cash | Keep costs near $0 until Phase 2; don't spend your own savings on this, practice what we preach |

---

## 11. This week's to-do (founder)
1. Start the 2-week self-tracking log today.
2. Book 10 interviews (5 international students).
3. Put up the landing page and waitlist.
4. Post in 3 campus groups.
5. List 5 potential technical cofounders and message them.
