# CFO
Score: 3/10 | Vote: PASS

Full model: `founder/numbers.json`, `founder/cfo.md`, `founder/cfo-sources.md`. Unit = one finished, accepted agent task. Every input is labelled SOURCED or ESTIMATE.

## Contribution per task and margin
Base case: a horizontal catalog at **$15/task** (ESTIMATE, since nobody has a willingness-to-pay number). Variable cost is **$7.33**:
- Tokens: $2.40, built from a sourced average of $1.857 per agentic coding task (4.17M tokens) times 1.3 for retries
- Verifier pass: $0.40
- Sandbox: $0.06 (E2B rates, sourced)
- Stripe: $0.73 (sourced)
- Author share at 15%: $2.25
- Compute burned on the 15% of tasks that get rejected: $0.64
- Human QA spot-checks: $0.50
- Support: $0.30

That leaves **$7.67 per task, a 51% gross margin.** That is a services margin, not a marketplace margin. Fiverr and the App Store keep 20-30% of someone else's work and pay almost nothing to deliver it. You keep 85% of the price and pay for every token. Token use on the same task can vary **30x from run to run** (sourced), so your biggest cost line is also your least predictable one.

The real problem is LTV vs CAC. A buyer doing 4 tasks a month contributes $30.68 a month. At 5%, 8% or 12% monthly churn, LTV is **$614, $384 or $256**. The median self-serve SaaS CAC is about **$702** (vendor benchmark). That is underwater at every churn rate. If buyers behave like Fiverr's ($342 a year), LTV per year is about $174.

## Break-even and cash needed
| | bear ($8) | base ($15) | bull ($49 productized) |
|---|---:|---:|---:|
| Contribution/task | **-$2.42** | $7.67 | $31.30 |
| Break-even tasks/day | never | 731 | 179 |
| Year 1 op. profit | -$2.15M | -$1.15M | +$0.09M |
| Cash needed | $2.5M+ (no floor) | **$1.50M** | $0.96M |

Fixed costs are $168k a month: a 5-person team, $40k of paid acquisition, and security vetting. In the base case, month 12 reaches 680 tasks a day and is still short of break-even. Reaching that volume means acquiring about 5,100 active buyers, which costs roughly $3.6M at benchmark CAC against a $480k annual ad budget. **The ramp is the lie in this model, and I wrote it generously.**

The bear case is not exotic. Claude and ChatGPT subscriptions at about $20 a month already run these same open skills for free. That pushes the price toward $8. Double the tokens, add 25% rejections, and every task loses money.

## Path to $10M / $100M / $1B
| revenue | @$15 tasks/day | @$49 | @$149 | buyers at Fiverr's $342/yr |
|---|---:|---:|---:|---:|
| $10M | 1,826 | 559 | 184 | 29k |
| $100M | 18,265 | 5,591 | 1,839 | 292k |
| $1B | 182,648 (67M/yr) | 55,913 | 18,387 | **2.92M** |

At small-buyer spend levels, $1B of revenue takes **94% of Fiverr's entire active buyer base**, and that base is shrinking 13.6% a year. That is the same population Fiverr spent 15 years and billions in marketing to assemble. $10M is plausible. $100M requires either a 10x higher price per task or business buyers who spend thousands a year. $1B at $15 a task is not a plan.

## What would kill it (top 3)
1. **The price collapses to zero.** The supply is free MIT markdown, and the model owners bundle skills into subscriptions people already pay for. Anthropic's marketplace takes no commission. OpenAI never paid GPT Store builders. You are reselling tokens at a markup against the token seller. The bear case shows the result: a negative contribution.
2. **CAC is above LTV.** No channel has been identified, and you would be bidding against Fiverr and Upwork for the same Google traffic. Upwork is adding agents to a marketplace that already has 785k clients. At $702 CAC and roughly $400 LTV, growth burns more cash the faster it goes.
3. **Token cost variance plus pay-on-accept.** With 30x run-to-run variance, a tail of $40 runs on $15 tasks, and 15-25% rejections, the margin can disappear without warning. Add liability for a malicious skill (about 12-13% of scanned hub skills are flawed or malicious) touching a customer's repo, and a single incident wipes out a year of contribution.

## If FUND IF: conditions
Not voting FUND IF on the catalog as pitched. These would flip me:
- **One deliverable at $79-$249**, for one buyer type, with human review priced in. The bull case at $49 already breaks even at 179 tasks a day.
- **Measured numbers from 100 real paid tasks.** P50 and P95 token cost per task with P95 under 20% of price, and a rejection rate under 15%.
- **A channel with CAC under $150**, proven on $10k of spend, plus 3-month buyer retention of at least 40%.
- **Raise $1.5-2.5M, not less**, and gate spending on the three items above.

## Market ceiling
**Million-dollar.** As a horizontal per-task catalog, this tops out around $5-30M in revenue. The supply is free, the platforms give it away, and a $1B outcome needs a buyer base the size of Fiverr's. A single vertical, outcome-priced deliverable could reach $100M+, but that is a different company from the one pitched. The trillion-dollar "service-as-software" pool is real, but this model captures margin from it only where it charges for outcomes, not tokens.
