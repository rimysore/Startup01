# Marketing Director
Score: 3/10 | Vote: FUND IF

## Positioning
As written, "GPT Store for skill-based workers" can't be marketed. GPT Store is a cautionary tale ([Slashdot/Wired](https://tech.slashdot.org/story/24/10/11/1033247/openais-gpt-store-has-left-some-developers-in-the-lurch)), and "skills" means nothing to a small-business buyer. My recommended line:

**"Hand off the job you'd post on Fiverr. A tested AI specialist finishes it today, for a fixed price, or you don't pay."**

The buyer pays for a finished outcome with a guarantee, not for a skill. Supply comes from open-source skills, but that's invisible plumbing, not the pitch. Nearest alternatives: a Fiverr/Upwork freelancer (slow, $50-500) or doing it yourself in ChatGPT (free, but you supply the expertise). The gap is that the work is vetted, run for you and guaranteed. Vetting also answers the supply-chain fear: ~13% of scanned skills had critical issues ([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub)).

## First buyers and channels
- **Pick:** non-technical solo founders and 1-10 person businesses that already buy small fixed-scope gigs. Examples: an Excel model cleaned up, a landing-page UI pass, a pre-launch security check. Fiverr's 3.1M buyers, down 13.6%, show the demand is already leaving humans for AI ([Nasdaq](https://www.nasdaq.com/articles/upwork-or-fiverr-picking-winner-freelance-race)).
- **Do not pick developers.** They install skills themselves for free in Claude Code, Codex and Cursor. Selling to them means selling a free markdown file back to its own audience.
- **Channels they actually use:** Google search with intent ("fix my excel formulas", "landing page review"), X/Indie Hackers/r/smallbusiness/r/Entrepreneur, YouTube how-to creators, and the Fiverr/Upwork listing pages themselves.
- **Not doing:** paid social, or a launch built around "AI marketplace" (agent washing fatigue, [Gartner](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027)).

## First 100 customers: how and at what cost
Assumption, not data: a $29-99 fixed-price task, plus a $49/mo plan for repeat buyers.
1. **Founder-led, ~40 customers, ~$0 cash and 3-4 hours each.** Do the job free in public: reply to "can someone fix my sheet / roast my landing page" posts with the finished deliverable and a link. Convert 1 in 10.
2. **One wedge, SEO and free tools, ~30 customers, ~$30-60 each in content time.** About 50 "fix my X" pages, each with a free preview of the output.
3. **Paid search test, ~20 customers, ~$150-250 each.** Business-services CPC is around $5.87 ([WordStream via secondary](https://www.wordstream.com/blog/2026-google-ads-benchmarks)). At a 3% click-to-paid rate that's about $195 per customer.
4. **Skill-author co-marketing, ~10 customers, revenue share only.** Authors push "hire my agent" to their GitHub audience. Weak lever: installs are tiny, with 162 skills totalling 767 installs ([skills.sh](https://www.skills.sh/jarmen423)).

Blended cost for 100 customers: roughly $5-8k cash plus 300+ founder hours.

**Max affordable CAC:** $49/mo × ~55% gross margin (compute-heavy) × ~8 months retention ≈ $215 contribution. Keep CAC to a third of that: **about $70.** Paid search fails that test by about 3×. **Organic and community channels have to carry this, or it doesn't work.**

## Hooks
1. "Your Fiverr gig, done before lunch. Fixed price. Don't love it? Don't pay."
2. "1 in 8 free AI skills had critical security flaws. Ours are vetted before they touch your files."
3. "Paste your landing page. Get a designer-grade teardown and the fixed code in 10 minutes."
4. "That spreadsheet you've been avoiding: send it, get it back clean."
5. "Security review before you launch, for $49, not $4,900."

## What would kill it (top 3)
1. **The platforms own the discovery surface.** Anthropic's marketplace (reportedly no commission), ChatGPT's app directory, GitHub/VS Code and Vercel's skills.sh all sit where the intent happens. Claude already loads the right installed skill on its own when a task matches ([guide](https://www.buildfastwithai.com/blogs/claude-skills-complete-guide-2026)). Install is still manual for now, but a single release could make it automatic. Upwork is already inside Claude (connector June 2026, MCP server August 2026) ([Upwork](https://snipework.com/news/upwork-mcp-server-ai-integration)). The buyer never leaves the chat window, so this startup has no surface of its own to win them on.
2. **No moat to market.** The product is a free MIT file plus a model, so any hook is copyable within a week.
3. **CAC is higher than LTV.** Small-ticket buyers, compute costs, churn as the base models improve, and paid channels at about 3× the affordable CAC. Agent.ai, run by HubSpot with HubSpot's distribution, still got folded back into the CRM ([StartupHub](https://www.startuphub.ai/news/hubspot-absorbs-agent-ai-into-crm-core)).

## If FUND IF: conditions
- Drop the horizontal catalog. Launch **one** vertical job (my pick: pre-launch security and QA review for indie and no-code apps, or spreadsheet/finance cleanup), with an outcome guarantee and verified output.
- Within 60 days: 50 paying customers, ≥30% buying a second job, and organic CAC under $70. Otherwise stop.
- Build a distribution hedge: ship the same agent as a Claude/ChatGPT app and an MCP server, so we're listed *inside* the platform surfaces instead of competing with them.

## Market ceiling
As pitched, a horizontal skill marketplace, this is a **million-dollar** business at best (low single-digit $M ARR) before a platform absorbs it or it gets squeezed out. The platforms give distribution away free and the supply is free. A single vertical "AI worker" with outcome pricing can reach **hundreds of millions** (Sierra is around $200M ARR, [Sacra](https://sacra.com/c/sierra/)). That's a different company, though. Billion-dollar potential exists only through that vertical path. Trillion-dollar is not credible.
