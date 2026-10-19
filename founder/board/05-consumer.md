# Consumer Panel
Score: 3/10 | Vote: PASS

Method: 24 persona cards dealt by `panel.py` (seed 5) across 5 segments. The pitch they saw: a catalog of AI workers at $9-99 per task or $49/mo per worker, first task free, no SOC 2. I played every buyer myself (no sub-agents), which makes the panel weaker, so I pushed answers toward no on purpose. Files: `founder/panel/`. **Buy rate 2/24 = 8%, and that is an upper bound.** "Maybe" means "will take the free task." It is not revenue.

## Tally (buy / maybe / no, by segment)
| Segment | Buy | Maybe | No |
|---|---|---|---|
| Small-business owners on Fiverr/Upwork (5) | 1 | 3 | 1 |
| Agency owners (5) | 1 | 1 | 3 |
| Solo founders / indie hackers (5) | 0 | 1 | 4 |
| In-house devs on Claude Code/Cursor (5) | 0 | 0 | 5 |
| Enterprise IT/security (4) | 0 | 0 | 4 |
| **Total (24)** | **2** | **5** | **17** |

Reasons for no: trust 8, need/habit 7, price 3. Price is not the problem. The problems are trust and that the product is redundant.

## Top objections in buyers' words
1. **"It's a wrapper around a markdown file I can git clone."** (in-house dev). "Claude Code already loads skills natively. This is literally what my $20 plan does." (indie). Technical buyers already have the product.
2. **"Fails our vendor intake on question one. Community-sourced skills with code execution is exactly the supply-chain risk we block."** (enterprise). The brief's Snyk/ClawHavoc numbers (11-13% malicious or critical) make this objection concrete.
3. **"If I have to check the work anyway, what am I paying for over ChatGPT?"** (SMB owner). Even the people who are interested will check every output.
4. **"When it's wrong I eat the cost, not them."** / "If a client deliverable is wrong, the agent doesn't take the call, I do." Nobody carries the liability.
5. **"GPT Store all over again."** Real buyers say the same. On the closest HN precedent ("Fiverr/Upwork for AI agents") the top reply was a question about why anyone should trust the agents ([Show HN: 47jobs](https://hn.svelte.dev/item/45264755)). OpenAI forum: most people "aren't interested in using other people's GPTs" ([link](https://community.openai.com/t/a-pragmatic-approach-to-custom-gpts-why-i-chose-airtable-over-building-a-store/495487/4)). One AI-services marketplace listed for sale shows 35 users and about $147 MRR ([Microns](https://microns.io/startup-listings/ai-agent-hiring-platform)).

## The segment that buys, if any
**Non-technical small-business owners who already pay Fiverr $40-80 for small jobs** (spreadsheets, mockups, copy). Why: "$9-29 in an hour vs. days on Fiverr." The catch is that they don't care about skills or the catalog. They care about one finished deliverable, and their real alternative is plain ChatGPT, not you. A second, narrower opening: **agency owners who want white-label workers** ("$49/mo is noise if the report is client-ready"). They would pay for audited, repeatable output they can resell. Devs and enterprise: 0/9, drop them.

## What would flip a no
- **Pay only for accepted output, with a refund guarantee** (named by SMB, indie and burned-before buyers).
- **Proof that the specialist beats plain Claude/ChatGPT** on the buyer's own kind of task: public benchmarks and real before/after samples.
- **Distribution inside Claude/ChatGPT's own marketplace** ("if it showed up as an app inside ChatGPT with one click"). (Makes you a supplier, not a platform.)
- **A human-reviewed tier with escalation.** (Rebuilds Fiverr.)
- Enterprise: SOC 2, VPC deploy, signed skills, indemnity (12-18 months away).

## What would kill it (top 3)
1. **Platforms ship it for free.** Anthropic's marketplace (reportedly no commission), Claude Code plugins, ChatGPT apps/Codex and Upwork's agent plans all sit closer to the buyer.
2. **No moat on supply.** The thing being sold is a markdown file. "Tuned and tested" is the only defensible layer.
3. **Trust and liability with no owner.** Community skills plus customer credentials, with a documented ~12% malicious rate, means one incident ends the brand.

## If FUND IF: conditions
I vote PASS on the marketplace as pitched. I would revisit it as a FUND IF the founder narrows it to **one vertical deliverable sold to Fiverr-type SMBs** (e.g. "Excel/financial-model cleanup, $29, pay on acceptance"). Proof: 50 paying customers in 60 days from a priced landing page, ≥30% month-2 repeat, refunds <15%.

## Willingness to pay (per task unless noted; panel medians, rough)
| Segment | Too cheap | Cheap | Expensive | Too expensive |
|---|---|---|---|---|
| SMB / Fiverr buyers | $5 | $15-20 | $60-75 | $150 |
| Agency owners | $10 | $30-50/mo per worker | $150-300/mo | $500-1,000/mo |
| Indie hackers | $1-2 | $5-9 | $25-35 | $60-80 |
| In-house devs | $1-3 | $5-10 | $15-40 | $30-100 |
| Enterprise (per worker/mo, contract) | $30-100 | $300-1,000 | $2,000-5,000 | $6,000-15,000 (blocked by procurement, not price) |

For pricing: $49/mo is too much for indies/devs and too little for agencies. SMBs anchor on $20-60 per deliverable, so price by outcome.

## Market ceiling
**Million-dollar.** A horizontal "GPT Store for skills" competes with free catalogs and with platform owners who take no commission. Panel buyers only paid for finished deliverables, which makes it a services business with software margins at best. Realistic ceiling is a $1-20M ARR niche, or an acqui-hire. A vertical "service-as-software" play could reach $100M+ (the Sierra/Harvey pattern in the brief), but that is a different company from this marketplace.

