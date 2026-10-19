# Skill-hire (working name)

- What it is: a marketplace where people and companies "hire" specialized AI agents. Each agent is a base model plus one open-source Agent Skill (e.g. ui-ux-pro-max, Excel/xlsx, security audit), tuned, tested and run on the platform as a named "AI worker".
- Who it is for: not yet specified by the founder. Candidates: solo founders and small businesses who would otherwise hire a freelancer on Upwork/Fiverr; developers and teams who want a specialist agent without setting up skills themselves.
- What it sells, at what price: hireable specialist agents, per task or on subscription. Price not yet set by the founder (open question for /founder-pricing).
- Where and how: online. Buyer browses a catalog, hires an agent, connects files/repo/tools, receives finished work. Supply comes from the open-source skill ecosystem; skill authors may list agents and get a revenue share. Founder's analogy: OpenAI's GPTs / GPT Store, but for skill-specialized workers.
- Budget and constraints: not stated. Early-stage founder; existing repo work is an MCP tool-schema token optimizer (toolslim), so the founder has agent-infrastructure skills.
# Market research (gathered 2026-10-19, public web sources)

Figures marked (secondary) come from aggregator/blog sources, not primary filings. Treat as rough.

## The skills ecosystem (supply)
- Anthropic published Agent Skills as an open standard (agentskills.io) on 2025-12-18. OpenAI added skills support to ChatGPT and Codex CLI shortly after; Microsoft (VS Code, GitHub), Cursor, Gemini CLI, Goose, Amp, OpenCode, Kiro adopted it. ~32 tools by March 2026. https://venturebeat.com/technology/anthropic-launches-enterprise-agent-skills-and-opens-the-standard , https://www.solobusinesshub.com/trend-watch/ai-agent-skills-boom-2026/
- Catalog sizes: Vercel's skills.sh ~89,753 skills (Mar 2026, secondary); SkillsMP claims 425,000+; AgentSkill.sh claims 107,000+; one landscape report claims 1.2M+ (unverified). https://www.kdnuggets.com/top-5-agent-skill-marketplaces-for-building-powerful-ai-agents , https://presenc.ai/research/ai-agent-marketplaces-landscape-2026
- Install counts are small: one skills.sh publisher page listing ui-ux-pro-max shows 162 skills with 767 total installs. https://www.skills.sh/jarmen423
- Skills are free, MIT/open, a markdown file plus scripts. Copying is trivial.

## Platform owners already distributing skills/agents
- Anthropic "Claude Marketplace" (enterprise procurement) launched 2026-03-06; reportedly no commission. Reported expansion 2026-09-23 to 2,000+ connectors/plugins plus consultant directory (single source). Claude Code plugin marketplace: ~2,800 skills / 400 plugins by May 2026 (single blog). 10 enterprise plug-ins with LSEG, FactSet (Feb 2026). https://www.letsdatascience.com/news/anthropic-launches-claude-marketplace-for-enterprises-36871422 , https://www.it-connect.fr/claude-marketplace-connecteurs-plugins-agents/
- OpenAI: GPT Store (Jan 2024) promised builder revenue share; ran only as a small US pilot; Wired reported most builders never got paid; creators resorted to affiliate links. ChatGPT apps reportedly renamed plugins (Jul 2026), unified directory with Codex; digital-goods monetization in apps was "no" as of Jan 2026. https://tech.slashdot.org/story/24/10/11/1033247/openais-gpt-store-has-left-some-developers-in-the-lurch , https://community.openai.com/t/chatgpt-app-monetization-apps-sdk/1372343/4
- HubSpot's Agent.ai (community marketplace for agents) is being folded into HubSpot CRM; standalone platform ceases 2026-08-22. https://www.startuphub.ai/news/hubspot-absorbs-agent-ai-into-crm-core
- Upwork: launched an MCP server 2026-08-10 so AI tools can hire on Upwork; management lists "launching agents in our marketplace" as a growth lever (Q1 2026 call). FY2025 revenue $787.8M (+2%), 785k active clients, GSV ~$4B (secondary). https://www.sec.gov/Archives/edgar/data/1627475/000162747526000012/upwk-20251231.htm , https://www.insidermonkey.com/blog/upwork-inc-nasdaqupwk-q1-2026-earnings-call-transcript-1760949/
- Fiverr: FY2025 revenue ~$430.9M (+10%), 3.1M active buyers (down 13.6%), take rate ~27.7% (secondary); losing low-value work to AI. https://www.nasdaq.com/articles/upwork-or-fiverr-picking-winner-freelance-race

## "AI employee" / vertical agent companies (the incumbents of "hire an AI worker")
- Sierra (customer service): ~$200M ARR May 2026 (Sacra est.), valued $15B+; outcome-based pricing. Decagon: reported $4.5B valuation (Jan 2026). https://sacra.com/c/sierra/ , https://www.dragapp.com/blog/decagon-vs-sierra/
- Harvey (legal) $200M Series C at $2.1B reported July 2026 (secondary tracker). https://aifunding.me/insights/ai-agent-funding-july-2026
- Artisan (AI SDR "Ava", ~$250-600/mo), 11x (AI SDR, ~$3.75-5k/mo), Lindy (~$30/user/mo), Relevance AI (multi-agent workforce builder). Prices from vendor-affiliated comparisons. https://www.vellum.ai/blog/best-ai-employees , https://cellcog.ai/compare/ai-employee-platforms
- Pattern: the large outcomes are vertical (one job done end-to-end, deeply integrated, priced on outcomes), not horizontal catalogs.

## Market size anchors
- Foundation Capital "service-as-software": $4.6T opportunity over five years as AI displaces salaries and outsourced services; e.g. marketing+sales salaries $1.1T vs Salesforce $35B revenue. https://foundationcapital.com/ai-service-as-software/
- AI took ~70% of venture dollars in H1 2026 (secondary). https://the-agent-report.com/2026/07/ai-agent-q2-2026-funding-wrap-record-venture/

## Risks seen in the market
- Gartner (Jun 2025): >40% of agentic AI projects canceled by end of 2027; "agent washing"; only ~130 of thousands of agentic vendors are real. https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- Skill supply-chain security: Snyk ToxicSkills (Feb 2026) scanned 3,984 skills from ClawHub/skills.sh, ~13% critical issues, ~37% some flaw; Koi "ClawHavoc" found 341 malicious of 2,857 ClawHub skills (~11.9%). https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub , https://codex.danielvaughan.com/2026/06/07/agent-skill-supply-chain-crisis-clawhavoc-toxicskills-skillsieve-codex-cli-defence/
- Agent startups dying from compute cost (SmartLayer) or being absorbed by platforms (Agent.ai, Project Treehouse citing platform monopolisation). https://www.crowdfundinsider.com/2026/04/270695-agentic-technology-provider-smartlayer-winds-down-operations/

## Gaps (nobody has a number yet)
- No public figure for how many people pay for skill-based agents, or willingness to pay per task.
- No public CAC benchmarks for agent marketplaces.

# Note to board members
The founder asked for a ruthless, unpolished evaluation and a call on whether this is a million-, billion- or trillion-dollar company. The founder has not set a customer segment, price or budget; treat those as open questions, and say which one you would pick.
