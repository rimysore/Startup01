# Offer Architect
Score: 4/10 | Vote: FUND IF

## The best offer I can build
**Segment I'd pick:** non-technical solo founders and small businesses that already buy $50-$500 gigs on Fiverr/Upwork (landing pages, pitch decks, spreadsheet models, UI cleanups). Fiverr's annual spend per buyer is $342 ([Fiverr Q4 2025](https://investors.fiverr.com/node/9886/pdf)), so a typical buyer pays for one or two jobs a year.

**Name:** *Accepted-or-Free Deliverables* (product line: "48-Hour Deck", "48-Hour Landing Page", "Clean Model").

**Core promise:** "Send us your brief and files. Within 48 hours you get a finished, checked deliverable. You pay only if you accept it." Sell the finished file, not "an AI worker". No catalog in the pitch.

**Stack (obstacle → solution):**
| Buyer obstacle | Solution | Value / Cost |
|---|---|---|
| "Which of 400k skills do I even use?" | Around 10 fixed products, each matched to one job. The buyer never sees a skill | 5 / 1 |
| "Is this thing safe on my files?" | Only skills we have audited or forked ourselves (about 13% of public skills have critical issues, [Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub)) and sandboxed runs | 4 / 2 |
| "AI output is generic slop" | A human QA pass before delivery, plus a brand/style kit captured once | 5 / 3 |
| "What if it's wrong?" | Two revision rounds included | 4 / 2 |
| "Will it work in my tools?" | Native files (Figma/Webflow/xlsx/pptx) handed off, not chat text | 4 / 2 |
| "Fiverr freelancers ghost me" | 48h SLA. If we miss it, the job is free | 4 / 1 |

**Bonuses (each one kills an objection):** (1) a free first job up to $49, which answers "I can do this in ChatGPT" by letting buyers compare side by side; (2) the brand kit is kept for future jobs, which raises switching cost; (3) the source prompt/skill config is handed over with the file, so there's no fear of lock-in.

**Guarantee:** pay on acceptance, with a card authorized up front and captured on accept. A rejected job costs us compute (likely $1-$10) plus 10-20 minutes of QA labor. At a price of $79-$249 and a 15% rejection rate, the guarantee costs about 5-8% of revenue. We can afford it, but only if QA minutes are capped. Cap rejections at 2 per account.

**Urgency (real only):** human QA capacity is genuinely limited, so say so: "We take N jobs per day." Add a founding-customer price lock for the first 200 buyers. No countdown timers.

**Value equation:** outcome 6→7, likelihood 3→7, time 5→8, effort 3→8.

## Does it survive the main objection
**For developers and AI-literate buyers: no.** Skills now reportedly run on Claude's free tier when code execution is on, not just Pro ([Skywork, citing Anthropic help docs, June 2026](https://skywork.ai/blog/?p=67759); verify). For these buyers, "hire an agent = skill + model" is a markup on something they already own. No stack fixes visible, free ingredients.

**For the non-technical SMB buyer: partly yes.** But it survives only because the offer stops being a skill marketplace. The things people pay for are the guarantee, the human QA, the SLA and the native file handoff, and none of those come from the skill. That makes this an AI-leveraged productized agency. The open-source supply is a cost advantage, not the product. Drop the author revenue share.

## What would kill it (top 3)
1. **Platforms ship "done-for-you" first.** Upwork is already putting agents into its marketplace and opened an MCP server ([Upwork 10-K / Q1 call](https://www.insidermonkey.com/blog/upwork-inc-nasdaqupwk-q1-2026-earnings-call-transcript-1760949/)). Anthropic and OpenAI keep adding native file outputs. Our edge becomes a feature in their products.
2. **QA labor eats the margin.** If human review takes 30+ minutes per job, unit economics look like Fiverr's without its liquidity.
3. **No acquisition channel.** At $342 a year in buyer spend, CAC has to stay under about $100. The buyers are on Fiverr and Google, where we'd be bidding against incumbents, and no public CAC benchmark exists.

## If FUND IF: conditions
- Narrow to ONE deliverable, for ONE buyer, at one price (e.g. "investor deck in 48h, $149, pay on accept"). Kill the catalog for now.
- Within 60 days, sell 100 paid jobs to strangers, with at least 70% acceptance, under 15 QA minutes per job, and at least 25% repeat purchases within 90 days.
- Side-by-side test against DIY in ChatGPT/Claude; if over half would DIY, stop.

## Market ceiling
**Million-dollar, likely $5-30M ARR as a horizontal productized-AI agency.** The [$4.6T service-as-software pool](https://foundationcapital.com/ai-service-as-software/) is real, but the billion-dollar outcomes are vertical companies that own one job end to end (Sierra, Harvey). A horizontal catalog built on free, copyable skills has no moat to defend a billion. Billion is possible only if a single deliverable goes deep enough to become its own vertical company.
