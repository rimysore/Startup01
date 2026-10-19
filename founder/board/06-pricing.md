# Pricing Strategist
Score: 4/10 | Vote: FUND IF

No buyer panel has run, so there is no Van Westendorp range. These are public prices, for choosing what to test.

## Reference prices
| Substitute | Public price | Source |
| --- | --- | --- |
| Fiverr UI/UX design | $150-$717 per project; $20-$125/hr; landing page $103-$121 | [Fiverr guide](https://fiverr.com/resources/guides/costs/ui-ux-designer) |
| Upwork Excel expert | median $12-$30/hr (expert tier $225/hr) | [Upwork](https://www.upwork.com/hire/microsoft-excel-experts/cost/) |
| Fiverr Excel dashboards | $35-$100/hr | [Fiverr guide](https://fiverr.com/resources/guides/costs/excel-expert) |
| Web-app pentest (startup) | $5k-$15k; under ~$2k-4k "is very likely an automated scan" | [Blaze](https://www.blazeinfosec.com/post/how-much-does-penetration-testing-cost/), [Startup Defense](https://www.startupdefense.io/blog/penetration-testing-cost) |
| Claude Pro / ChatGPT Plus | $20/mo; Max $100-$200/mo | [Morph comparison](https://www.morphllm.com/chatgpt-vs-claude) (secondary) |
| Intercom Fin (outcome-priced) | $0.99 per resolution | [Intercom](https://www.intercom.com/learning-center/intercom-pricing) |
| Sierra | no public rate card; $150-500k/yr contracts (unverified) | [Vantaige](https://vantaige.io/blog/intercom-fin-vs-decagon-vs-sierra-2026) |
| Lindy | $29.99 / $99.99 / $199.99 per seat per month, credit-metered | [Jetadmin](https://www.jetadmin.io/blog/lindy-pricing/amp/) (secondary) |
| Artisan / 11x (AI SDR) | ~$250-600/mo / ~$3.75-5k/mo | brief, [Vellum](https://www.vellum.ai/blog/best-ai-employees) |
| Devin | $20 Pro, $200 Max; legacy $2-2.25 per ACU | [CostBench](https://costbench.com/software/ai-coding-assistants/devin-ai/) |
| Agent inference per task | $0.80-$4.50 on Sonnet, $4-$20 on Opus (estimate) | [Morph](https://www.morphllm.com/claude-code-api-cost) |

## The pricing model I'd pick and why
**Per deliverable, at a fixed price, with a free redo and a refund if the buyer rejects the work.** Not a subscription.

The squeeze is the whole story. A buyer who knows what a "skill" is will put the free MIT file into their own $20 plan, so that buyer is worth $0 to this business. Subscription pricing puts you in a fight with that $20 plan and with Lindy's $30 seat, and you lose it. The only buyer who pays is the one who would otherwise go to Fiverr, and that buyer thinks in **projects** ($100-$700), not tokens. So price against the freelancer and charge for the finished file, not for access to the agent.

Margin math (estimate): one deliverable takes about 3 runs with retries. At $2-$20 inference per run, that is about $6-$60 of cost. On Opus-heavy tasks a $29 price is underwater, so **the price has to be set per task type, and capped by metered cost**. Outcome pricing (Fin-style, pay only when accepted) is the right long-run shape. But it means you eat the cost of rejected work, so it only works once the acceptance rate is known (above 70%).

Revenue share for skill authors should come out of margin after inference, not out of gross revenue. If it comes out of gross, the GPT Store payout failure happens again.

## Price points to test
- **Excel/xlsx job:** $19 vs $39 per workbook. The Upwork median is $12-$30/hr, so a 2-3 hour job costs a buyer $25-$90.
- **UI/UX landing page:** $49 vs $99. That undercuts Fiverr's $103-$121 landing pages by half or more.
- **Security "pre-audit" (automated, clearly labeled as not a pentest):** $149 vs $399. Stay below the ~$2k line where buyers expect a human, and never call it a pentest.
- **Ladder:** single job → $99/mo bundle of 5 jobs in one category → "worker on retainer" at $299/mo with priority and integrations.
- **How to test:** two landing pages per task type, each with a pre-paid checkout (Stripe, refundable). Success is above a 3% visit-to-pay rate at the higher price.

## What would kill it (top 3)
1. **Commodity floor:** the skill is free, the model is $20, and Anthropic and OpenAI already distribute skills with no commission. Any price above inference has to be justified by a finished, accepted deliverable, and the platform owners can bundle that in for free.
2. **Inverted unit economics on hard jobs:** agent loops on Opus-class models cost $4-$20+ per run (estimate), and the rework buyers expect comes on top. A fixed $29 price with heavy redos goes negative (see SmartLayer).
3. **Liability ceiling:** security and design output that is wrong costs the buyer more than the fee. Refunds, plus the ~12-13% malicious-skill rate in the brief, cap what buyers will pay a horizontal catalog with no brand.

## If FUND IF: conditions
- Pick **one** vertical (I'd pick Excel/finance-ops deliverables for SMBs: cheap to run, easy to verify, no liability) and drop the catalog for now.
- Within 60 days, 50 paid jobs at at least $39 average, with an acceptance rate of 70% or more.
- Fully loaded inference cost under 25% of price, measured from logs rather than estimated.
- No subscription until those three hold.

## Market ceiling
**Million-dollar as pitched. Low hundreds of millions at best if it narrows.** A horizontal marketplace that resells free skills on rented models has no pricing power: its ceiling is the spread between Fiverr's prices and API cost, and that spread shrinks every model release. The billion-dollar outcomes in the evidence (Sierra, Harvey) are vertical, deeply integrated and outcome-priced.
