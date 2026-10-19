# Launch Lead
Score: 3/10 | Vote: FUND IF

## The cheapest real test and its pass/fail line
Don't build a marketplace. Buyers don't pay for "a skill"; skills are free markdown files ([skills.sh publisher page: 767 installs across 162 skills](https://www.skills.sh/jarmen423)). What could sell is a finished deliverable. So test that and nothing else.

**Segment I'd pick:** solo founders and small businesses who would otherwise post a $100-400 Fiverr/Upwork gig. Developers can install skills themselves for free, so they are the wrong buyer.

**The test (Wizard of Oz):** one page, "Hire an AI specialist," three fixed-price offers, paid up front through Stripe Payment Links, delivered within 48h:
1. Landing-page UX audit plus redesigned hero (ui-ux-pro-max): $149
2. Messy spreadsheet to clean model with dashboard (xlsx): $99
3. Security audit of a small repo, with fixes as a PR (security skill): $249

Behind the page, the founder runs Claude Code with the skill and checks every output by hand. Money-back guarantee. No catalog, no supply side, no revenue share. Cost: about $1,500 in ads, plus a domain and Stripe fees.

**Pass/fail, 14 days, strangers only (friends don't count):**
- PASS: at least 15 paid orders, average at least $120, refunds at most 20%, founder time at most 45 min per order, at least 3 repeat buyers or requests for a subscription.
- ITERATE ONCE: 5-14 orders. Change the offer or price and rerun for 7 days, with the same bar.
- KILL: fewer than 5 paid orders, or more than 90 min of hand-fixing per order. Either one means it's a freelancing business with an AI label, and the margin is gone.

## Countdown
| Date | Task | Owner |
|---|---|---|
| Tue 10-20 | Pick the 3 offers, Stripe links, page live on Carrd/Framer | Founder |
| 10-21 to 10-23 | Run each skill on 5 of your own samples. Time each run. Publish 3 before/after samples on the page. **Critical path:** if outputs need heavy rework, stop here | Founder |
| 10-24 to 10-25 | Soft open: 10 friendly founders pay full price. Fix delivery flow, intake form and turnaround | Founder |
| Mon 10-26 | Build a list of 300 named prospects (indie hackers, Shopify owners, Upwork clients with open gigs). Queue ads ($100/day, Google search on "fix my spreadsheet", "landing page audit"). Draft posts | Founder |
| **Tue 10-27** | **Launch day** | Founder |
| 10-27 to 11-09 | 14-day test window | Founder |
| Tue 11-10 | Decision against the line above. No moving the goalposts | Founder |

**Launch-day run sheet (ET):**
- 08:00: Ads on. Check the page and a $1 test charge.
- 09:00: Show HN / Indie Hackers / r/smallbusiness post, with real samples and a real price.
- 10:00-12:00: 100 personal DMs/emails, each offering the one deliverable that fits that prospect.
- 13:00: Reply to every comment. Log every objection word for word.
- 15:00: Start any orders. Promise delivery in 48h, aim for 24h.
- 17:00: Second batch of 100 DMs.
- 21:00: Tally visits, checkout starts, paid orders, CAC.
- If something breaks: Stripe fails, so fall back to a manual invoice. A skill output is bad, so refund on the spot and keep the customer by delivering by hand.

## First 30 days (10-27 to 11-25)
Track every week: visitor-to-paid conversion (target at least 2%), CAC against average order (CAC must stay under 50% of the order), founder minutes per order, refunds, repeat rate, and which of the 3 offers wins.
- **Day 7 (11-03):** Is one offer at more than 60% of orders? If so, drop the other two. If ads CAC is over $150, stop paid traffic and go all outbound.
- **Day 14 (11-10):** Pass/kill decision. If pass, raise prices 30% to find the ceiling.
- **Day 30 (11-25):** Can the winning offer be 80% automated (intake, run, QA)? Sell 5 buyers a monthly retainer ($299-499/mo). Only then write a line of platform code.

## Timing: too late?
For a horizontal "GPT Store for skills," yes. Late 2026 is too late:
- [Anthropic's marketplace](https://www.letsdatascience.com/news/anthropic-launches-claude-marketplace-for-enterprises-36871422) and Claude Code plugins already distribute skills.
- skills.sh and SkillsMP list hundreds of thousands of skills for free.
- The GPT Store showed that builder payouts don't happen ([Slashdot/Wired](https://tech.slashdot.org/story/24/10/11/1033247/openais-gpt-store-has-left-some-developers-in-the-lurch)).
- Upwork has shipped [ChatGPT/Claude apps and an MCP server](https://snipework.com/news/upwork-mcp-server-ai-integration) and names ["launching agents in our marketplace"](https://www.insidermonkey.com/blog/upwork-inc-nasdaqupwk-q1-2026-earnings-call-transcript-1760949/) as its next growth lever. It has 785k clients you can't match.

It is not too late for a done-for-you outcome sold to non-technical buyers. That window stays open until Upwork ships agents, maybe 6-12 months.

## What would kill it (top 3)
1. **No moat on supply.** Skills are MIT-licensed and copyable. Any Fiverr freelancer already runs Claude with the same skill, and Fiverr shows [AI-agent searches up 18,347%](https://block.fiverr.com/news/spring-bti-2025) on the human side.
2. **Platform absorption.** Agent.ai was [folded into HubSpot](https://www.startuphub.ai/news/hubspot-absorbs-agent-ai-into-crm-core), and Anthropic, OpenAI and Upwork each own distribution you would rent.
3. **QA cost and liability.** About 12-13% of public skills are [malicious or critically flawed](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub). Vetting, plus fixing bad outputs by hand, eats the margin on $99-249 tickets.

## If FUND IF: conditions
1. The 14-day test above passes, with strangers and real money.
2. Narrow to the single winning deliverable and sell the outcome, not the catalog.
3. Do not build a two-sided marketplace or author revenue share until there is $10k MRR from that one offer.
4. Keep founder minutes per order under 20 by day 60. If not, it's an agency, not a company.

## Market ceiling
A horizontal skill-agent marketplace is a **million-dollar** business at best, low tens of millions in ARR before a platform owner absorbs it. Anthropic, OpenAI and Upwork own the buyers and give distribution away for free. The [$4.6T service-as-software pool](https://foundationcapital.com/ai-service-as-software/) is real, but Sierra- and Harvey-scale companies capture it by owning one vertical outcome end to end. **Billion** is possible only if the test reveals one job worth going deep on, and that would be a different company.
