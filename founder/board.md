# Board decision: Skill-hire (hire skill-specialized AI agents)

Date: 2026-10-19. Eleven members, each a sub-agent applying one founder-skill method. Memos in `founder/board/`. Compiled plan: `founder/business-plan.md` (computed verdict: **Not yet**).

## 1. The vote

**6 PASS, 5 FUND IF, 0 FUND. Average score 3.1 / 10.**

| # | Member | Score | Vote | Ceiling as pitched |
|---|---|---:|---|---|
| 1 | Offers lens | 3 | PASS | millions |
| 2 | Monopoly lens | 2 | PASS | millions |
| 3 | Product lens | 3 | PASS | millions (vertical: up to $1B) |
| 4 | Competitor Scout | 3 | PASS | single-digit $M ARR |
| 5 | Consumer Panel | 3 | PASS | $1-20M ARR; buy rate 2/24 (8%) |
| 6 | Pricing Strategist | 4 | FUND IF | millions; vertical low $100Ms |
| 7 | Offer Architect | 4 | FUND IF | $5-30M ARR |
| 8 | CFO | 3 | PASS | $5-30M revenue; 51% contribution at $15/task |
| 9 | Marketing Director | 3 | FUND IF | low single-digit $M; vertical $100Ms-$1B |
| 10 | Operations & Trust | 3 | FUND IF | low tens of $M |
| 11 | Launch Lead | 3 | FUND IF | low tens of $M |

Every FUND IF requires the same thing: stop being a marketplace. Nobody funds the idea as pitched.

## 2. Risks raised by more than one member (most-cited first)

1. **No moat on supply (11/11).** The "worker" is a free, MIT-licensed markdown file running on someone else's model. Copy time: a weekend.
2. **Platforms bundle it for free (11/11).** Anthropic's Claude Marketplace (reportedly no commission), Claude Code plugins, ChatGPT/Codex skills, skills.sh. Claude already auto-loads a matching skill. Upwork has an MCP server and is putting human-supervised agents in front of 785k clients. Direct look-alikes already exist (Agent37 pays creators 80%, MuleRun pays per run). Closest precedents died or were absorbed: GPT Store builder payouts, HubSpot's Agent.ai.
3. **Trust, security and liability (8/11).** ~12-13% of scanned public skills are malicious or critically flawed (Snyk, Koi). An open catalog running on customer credentials makes an incident near-certain, and nobody owns the bill when an agent ships a wrong audit or a broken model.
4. **CAC above LTV (5/11).** CFO: ~$702 CAC vs $256-614 LTV; Marketing: paid search ~$195/customer vs ~$70 affordable. Discovery happens inside the chat window, which you don't own.
5. **No market picked (4/11).** "People and companies" is not a customer. Developers and enterprise buyers: 0 of 9 would pay in the panel.
6. **Fragile unit economics (3/11).** Token cost varies up to ~30x run to run; pay-on-accept refunds plus hard tasks turn contribution negative (bear case: -$2.42/task).

## 3. Conditions checklist (merged)

- [ ] **Kill the catalog.** One job, one buyer, one price. No two-sided marketplace or author revenue share until $10k MRR from that one offer.
- [ ] **Sell the finished outcome, not the agent.** Fixed price per deliverable, pay on acceptance or refund, human review on every job above a set price.
- [ ] **Price against the human, not tokens.** $39-249 per deliverable; no subscription until the numbers below hold.
- [ ] **Own the skills you run** (write or fork them), sandboxed, brokered credentials, no prod writes, eval gate before anything ships.
- [ ] **Prove it beats DIY**: side-by-side vs plain Claude/ChatGPT on the buyer's own task; if most buyers would DIY, stop.
- [ ] **Real-money test in 14-60 days** (strictest bars merged): ≥15 paid orders from strangers in 14 days, then 50-100 paid jobs in 60 days, ≥70% accepted, refunds ≤15-20%, ≥25-30% repeat.
- [ ] **Measured economics from ≥100 real tasks**: P95 token cost ≤20-25% of price; founder/QA minutes per job ≤15-20 by day 60 (otherwise it's an agency).
- [ ] **One channel with CAC under $70-150**, proven on real spend; 3-month retention ≥40%.
- [ ] **Distribution hedge**: ship the same agent as a Claude/ChatGPT app and an MCP server, so you're inside the platform surfaces rather than fighting them.
- [ ] **No security-audit product** until E&O insurance and an eval record exist; SOC 2 Type I at 6 months if selling B2B.
- [ ] **Raise $1.5-2.5M, gated** on the items above (CFO).

## 4. The strongest version the board can see

It is not what was pitched. The board sees no business in a horizontal "hire any skill" marketplace: the platforms own the models, the skills and the discovery surface, and the supply is free. What survives is a **vertical, outcome-priced AI worker for non-technical small businesses**: send a file, get the finished deliverable back in hours, checked, guaranteed, at a fraction of a Fiverr price. Five members independently picked the same first job, **spreadsheet / finance cleanup for small businesses** (file in, file out, so no connect-your-tools wall; easy to verify; low liability). Three preferred **security/code audits for small dev teams** (bigger tickets, uses the founder's agent-infra background, but needs insurance and an eval record first). Open-source skills become a cost advantage inside that company, not the product.

The board disagreed on how far the vertical can go: Offer Architect, Ops and Launch see a $5-30M ceiling (a productized agency that Upwork may copy in 6-12 months); Product, Marketing and Pricing see a $100M-$1B path if the vertical owns one job end to end with its own evals and data.

## 5. Market verdict: million, billion or trillion?

- **As pitched (horizontal skill marketplace): a million-dollar company.** Board range: $1-30M ARR before it is copied or bundled. CFO's math: at $15/task, $1B revenue needs 183k tasks/day, or ~2.9M buyers, about 94% of Fiverr's entire active buyer base.
- **Vertical outcome-priced version: a billion-dollar outcome is possible, not probable.** Precedent exists (Sierra ~$200M ARR at a $15B+ valuation, Harvey, Decagon) but each owns one job deeply, with integrations and outcome data. That requires the pivot, real proof, and beating Upwork/Fiverr to the SMB buyer.
- **Trillion: no.** The category is trillion-scale (Foundation Capital: $4.6T "service-as-software"), but the trillion-dollar slot belongs to whoever owns the model and the surface: Anthropic, OpenAI, Microsoft. A company that resells their free skills on their models is a tenant, not a landlord.
