# Competitor Scout
Score: 3/10 | Vote: PASS

The verdict up front: "Hire a skill-specialized AI agent" is already on sale, under several business models, from companies with more distribution than this founder has. The supply side (open skills) is free and anyone can copy it. The platforms that own the models are bundling skills into the subscriptions users already pay for. I found no defensible gap in a horizontal catalog.

## Competitor table

| Name | Type | What / price | Positioning | Public complaint | Link |
|---|---|---|---|---|---|
| Agent37 | Direct | Hosts a creator's Claude skill behind a paywall: free trial, then subscription through Stripe; creator keeps 80% | "Monetize your Claude Skills" | None found (too new) | https://www.agent37.com/creators |
| MuleRun | Direct | Agent marketplace; creators set their own price and get paid per run; 1,000-credit grant for approved creators | Calls its Creator Studio the "World's First Platform Built for AI Agent Monetization" | 80% share and earnings figures not verified from an official source | https://www.globenewswire.com/news-release/2025/12/24/3210283/0/en/MuleRun-Launches-Creator-Studio-the-World-s-First-Platform-Built-for-AI-Agent-Monetization.html |
| Sokosumi / FutureTools AI / Botigigs | Direct | Hire specialist agents pay-per-task (FutureTools charges in USDC); Sokosumi lists 25+ agents | "Hire specialized AI agents for any task" | Crypto onboarding is a hurdle ("learning curve" funding the wallet) | https://hunted.space/product/sokosumi , https://aiindigo.com/tool/futuretools-ai |
| Fiverr Go | Direct (with a human attached) | Buyers hire a freelancer's personal AI model; the freelancer pays $25/mo to create it and sets their own prices | AI trained on a vetted freelancer's own work | Creation limited to "thousands" of "top, vetted" freelancers | https://techcrunch.com/2025/02/18/fiverr-wants-gig-workers-to-offload-some-of-their-work-to-ai |
| Upwork (Uma, MCP server, ChatGPT app) | Direct, coming | Uma scopes jobs and matches talent; plans to "integrate agents to deliver work outcomes" | AI-assisted work marketplace for SMBs | Agents are on the roadmap, not live as hireable workers yet | https://investors.upwork.com/news-releases/news-release-details/upwork-updates-spring-2026-ai-powered-innovations-help-small |
| Claude Cowork plugins / Claude Marketplace | Indirect (platform) | Plugins (skills, connectors, sub-agents) are free inside a paid Claude plan | Claude Code for non-coding knowledge workers | Anthropic controls the marketplace; custom plugin creation was undocumented as of May 2026 | https://theaicareerlab.com/blog/claude-plugins-explained-marketplace-2026 |
| Relevance AI | Indirect | Agent workforce builder; 400+ agent templates; seats plus credits (Team plan listed at $199/mo on G2) | Build an "AI workforce" | "subscription charges are very high"; overages from two billing meters | https://prospeo.io/s/relevance-ai-pricing-reviews-pros-and-cons , https://g2.com/products/relevance-ai/reviews |
| Manus | Indirect | General agent that does tasks for credits | Does the whole task for you | Credits wiped (~$2,380); "900 credits" spent on one task | https://www.eesel.ai/blog/manus-ai-pricing , https://www.trustpilot.com/review/manus.im?page=1 |
| Genspark | Indirect | Super Agent; paid plans about $20-25/mo plus credits | Routes each subtask to the best model or tool | 1.7 stars on Trustpilot; billing disputes, "vanishing credits" | https://fast.io/resources/genspark-ai-review-2026/ |
| Lindy | Indirect | AI assistant/employee; about $30-60/mo plans with credit pools | AI employees for operations work | Billed after cancelling; "kill my months credits (3000) in one day" | https://computertech.co/lindy-ai-review |
| CrewAI | Indirect (for developers) | Open-source framework free; enterprise pricing opaque | Multi-agent orchestration | "very technical"; enterprise pricing not transparent | https://www.lindy.ai/blog/crew-ai-pricing |
| Agensi / skills.sh / SkillsMP | Substitute | Free or one-time skill files (Agensi pays creators 70-80%) | Skill catalogs | Median paid skill earns "less than $50 per month" | https://www.agensi.io/learn/ai-skills-marketplace-comparison-2026 , https://www.promptspace.in/blog/how-to-monetize-skill-md-skills-developer-guide-2026 |
| DIY: install the skill in Claude/ChatGPT/Codex | Substitute | $0 on top of an existing $20/mo plan | n/a | Requires setup; skills carry security risk (brief: ~13% critical) | brief.md |

Price range for the comparable offer: $0 (DIY skill) up to roughly $20-60/mo (general agents) and $199/mo (Relevance Team). Median is about $25/mo. Per-task pricing has no public benchmark.

## Positioning map (text)

The two axes are **breadth** (one job or any job) and **who carries the outcome** (the buyer configures it, or the vendor delivers it).

- Vertical, vendor delivers: Sierra, Harvey, 11x, Artisan. This is where the money is (brief).
- Horizontal, vendor delivers: Manus, Genspark, Fiverr Go, Upwork-with-agents (coming). Skill-hire sits here.
- Horizontal, buyer configures: Relevance AI, Lindy, CrewAI, Claude Cowork plugins.
- Raw supply, buyer configures: skills.sh, SkillsMP, Agensi, Agent37, MuleRun.

Skill-hire would sit in the most crowded and lowest-trust square. The general agents there already do "any skill" for $20/mo, and Fiverr and Upwork bring the buyers.

## The gap, if any

Mostly no. There are two thin openings, both backed by the complaints:
1. **Price and delivery that buyers can trust.** Every horizontal agent's top complaint is credits and billing (Manus, Genspark, Lindy, Relevance). A fixed price per deliverable, with a refund if the work fails a published test suite, would answer that directly. Anyone can copy it.
2. **Vetted, security-audited skills.** The skill supply chain is about 12-13% malicious or critical (brief). A "tested and safe" badge is real value, but Anthropic, Vercel or Snyk could ship it as a feature.

Neither is a company on its own unless it is narrowed to one vertical.

## What would kill it (top 3)

1. **Bundling by the platforms.** Claude Cowork plugins and ChatGPT skills give away the same specialist behavior inside a plan users already pay for. Agent.ai's absorption into HubSpot (brief) shows how that ends.
2. **Upwork and Fiverr switching agents on.** They already have the demand side, escrow, reviews and a take rate. Upwork says outright it plans to deliver outcomes with agents.
3. **No moat on supply.** Skills are MIT-licensed markdown. Agent37 and MuleRun already pay creators 80% and still show no proof of buyer demand. Most paid skills earn less than $50 a month, so the revenue share will not keep authors loyal.

## If FUND IF: the conditions

Not applicable, since I vote PASS. I would re-vote FUND IF the founder:
- picks one vertical with clear outcomes (my pick: security or code audit for small dev teams, which uses the founder's agent-infrastructure background);
- sells a fixed-price deliverable with a pass/fail guarantee;
- shows 20 paying repeat customers within 90 days.

## Market ceiling

As described (a horizontal catalog of skill agents) it is a **million**-dollar business at best, likely single-digit millions in ARR before it is copied or bundled. The **trillion**-dollar "service-as-software" pool is real, but vertical companies that own outcomes capture it, not catalogs. A pivot to one vertical could reach the low hundreds of millions. A billion would need Sierra-level depth in one job.
