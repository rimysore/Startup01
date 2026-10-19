# Skill-hire (working name) · Business plan

**Verdict: Not yet**

- ✓ Each agent task earns $7.67 before fixed costs (51% contribution).
- ✗ Year 1 operating LOSS: $1,154,837.
- ✗ 2 of 24 simulated buyers buy (8%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $15.00 a agent task |
| Profit margin at plan | 26% per agent task |
| Break-even | 731 agent tasks a day |
| Year 1 operating profit | $-1,154,837 |
| Startup spend | $350,000 |
| Cash needed before it pays for itself | $1,504,837 |
| Startup money earned back | not in year 1 |
| Buyer panel | 2 buy · 22 pass |

## The idea

- What it is: a marketplace where people and companies "hire" specialized AI agents. Each agent is a base model plus one open-source Agent Skill (e.g. ui-ux-pro-max, Excel/xlsx, security audit), tuned, tested and run on the platform as a named "AI worker".
- Who it is for: not yet specified by the founder. Candidates: solo founders and small businesses who would otherwise hire a freelancer on Upwork/Fiverr; developers and teams who want a specialist agent without setting up skills themselves.
- What it sells, at what price: hireable specialist agents, per task or on subscription. Price not yet set by the founder (open question for /founder-pricing).
- Where and how: online. Buyer browses a catalog, hires an agent, connects files/repo/tools, receives finished work. Supply comes from the open-source skill ecosystem; skill authors may list agents and get a revenue share. Founder's analogy: OpenAI's GPTs / GPT Store, but for skill-specialized workers.
- Budget and constraints: not stated. Early-stage founder; existing repo work is an MCP tool-schema token optimizer (toolslim), so the founder has agent-infrastructure skills.

## The buyer panel

**2 buy · 22 pass** (8% buy) out of 24 simulated buyers. Seed 5, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Small-business owner who buys on Fiverr/Upwork | 5 | 20%  (thin) |
| Agency owner (dev/design/marketing, 3-30 staff) | 5 | 20%  (thin) |
| Enterprise IT/security buyer | 4 | 0%  (thin) |
| In-house developer already using Claude Code/Cursor | 5 | 0%  (thin) |
| Solo founder / indie hacker | 5 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Deal hunter | 3 | 33%  (thin) |
| Outcome buyer | 5 | 20%  (thin) |
| Burned before | 4 | 0%  (thin) |
| Procurement-gated | 3 | 0%  (thin) |
| Tinkerer | 5 | 0%  (thin) |
| Loyal to a platform | 4 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $217,000 and up | 8 | 12% |
| $143,000 to $217,000 | 8 | 12% |
| under $143,000 | 8 | 0% |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 9 | "I've watched three 'AI workers' break things in prod. An unaudited startup running community skills against our systems is a hard no." (P001) · "No SOC 2, no contract, no DPA. I can't even start the review." (P004) |
| need | 4 | "I already run these exact skills in Claude Code for free on my existing seat. And procurement would take 6 months for a vendor with no SOC 2." (P002) · "I build my own agents. I'd rather fork the skill than pay you per task." (P013) |
| habit | 3 | "My devs already run Claude Code with skills. I might use a design or audit worker as white-label overflow, but I'd test before I pay $49/mo per worker." (P005) · "I do everything in ChatGPT now. I'm not adding another login and handing over my files." (P009) |
| price | 3 | "The skill is free. I'll install it myself in ten minutes. $49 a month is a real bill on my income." (P007) · "First task free, then I cancel. Claude Pro plus free skills covers this." (P008) |
| convenience | 2 | "I hire on Upwork for small design jobs. I'd try the free task, but I'd want to see it inside Claude where I already work." (P014) · "I'd buy a finished deliverable, but I live in Claude and don't want a new vendor. If the result were clearly better than Claude alone I'd pay $30 a task." (P017) |
| quality | 1 | "I'd take the free task, an Excel cleanup. If it's right first time, maybe $20 a job, but I'll still be checking every cell." (P003) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| price | 1 | "Fiverr charges me $40-80 for a spreadsheet or a landing page mockup and takes days. $9-29 in an hour, first one free? I'll try two jobs." (P012) |
| quality | 1 | "Margins are getting squeezed; if a security-audit or UI worker produces a client-ready report I can white-label, $49/mo per worker is noise. I'll pay for one and test it on two clients." (P024) |

### What would flip a no

- SOC 2 Type II, single-tenant/VPC deploy, contractual indemnity, and a security team that pentests every skill
- Nothing realistic; maybe if it ran inside our own cloud and procurement already approved it
- A money-back guarantee on bad output, and examples of real finished work
- SOC 2 plus a named account manager and outcome SLA
- White-label output I can resell to clients, with a quality track record per worker
- Local/self-hosted runner where code never leaves my machine
- Nothing; maybe $2-3 per task as convenience
- Bundled into a tool I already pay for
- If it showed up as an app inside ChatGPT with one click
- Pay only on accepted output, plus public benchmark results per worker
- Signed, pinned, audited skills; SOC 2; private deployment; 12+ months of references
- A private catalog for my agency with my own tuned workers, billed to clients

Buyers say they would buy **1.5 times** in the first month on average.

24 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## The numbers

**Unit mapping.** The tool was written for a cafe; here one "unit" = one finished, accepted agent task. Price = what the buyer pays per task (platform is merchant of record, so revenue is gross and the skill author's share is a per-task cost). Paid acquisition is held as a fixed monthly budget. No capacity cap: compute is elastic; the cap is demand. Full mapping and per-line sources in `numbers.json` (`basis` fields) and `cfo-sources.md`. Every input is labelled SOURCED (link) or ESTIMATE.

- **The margin:** $15 task, $7.33 variable cost, **$7.67 contribution (51% gross/contribution margin)**. Profit margin at the 1,500/day plan: 26%. A real software marketplace runs 70-80%; this is closer to a services business because the platform pays for every token.
- **The line to watch:** price, then token cost. Price -10% moves break-even from 731 to 909 tasks/day; unit costs +15% moves it to 854. Token use per agentic task varies up to 30x run to run (sourced), so the $2.40 token line is the least stable number in the file.
- **Cash:** $1.50M before it pays for itself (base). Year 1: -$1.15M operating on $1.69M revenue; startup spend not earned back in year 1.
- **Three ways to improve the margin (what-ifs run):** (1) raise price to a productized deliverable ($49, bull case): contribution $31.30, break-even 179/day; (2) cut author share from 15% to 5%: +$1.50/task, contribution to ~$9.17; (3) route to cheaper models / cache harder so tokens fall 50%: +$1.20/task. The first is the only one that changes the answer.
- **Acquisition is the hidden killer:** at 4 tasks/month a buyer yields $30.68/month contribution; LTV at 5/8/12% monthly churn = $614 / $384 / $256 vs a self-serve SaaS CAC median of ~$702 (sourced, vendor blog). LTV < CAC in every churn case.
- Not financial, tax or legal advice; an accountant should check structure, payroll and sales tax (digital services are taxable in many US states; revenue here is pre-tax).

### Base / bear / bull

| | bear | base | bull |
| --- | ---: | ---: | ---: |
| Shape | $8 catalog vs free skills in $20 subs | $15 horizontal catalog | $49 productized deliverable |
| Price / task | $8.00 | $15.00 | $49.00 |
| Variable / task | $10.42 | $7.33 | $17.70 |
| Contribution / task | **-$2.42 (-30%)** | $7.67 (51%) | $31.30 (64%) |
| Key assumptions | tokens 2x, 25% rejected | tokens $2.40, 15% rejected | 10-min human review, 10% rejected, author 10% |
| Break-even tasks/day | never | 731 | 179 |
| Plan tasks/day | 750 | 1,500 | 900 |
| Margin at plan | -124% | 26% | 51% |
| Year 1 revenue | $0.45M | $1.69M | $3.30M |
| Year 1 operating profit | -$2.15M | -$1.15M | +$0.09M |
| Cash needed | $2.50M (and never stops) | $1.50M | $0.96M |

Same $168k/month fixed base in all three. Bear/bull input files: scratch copies built from numbers.json with only price, variable lines and ramp changed (bear ramp x0.5, bull ramp x0.6).

### Path to scale (revenue = tasks/day x price x 365)

| revenue | @$8 | @$15 | @$49 | @$149 | buyers needed at Fiverr's $342/yr spend |
| --- | ---: | ---: | ---: | ---: | ---: |
| $10M | 3,425/day | 1,826/day | 559/day | 184/day | 29k |
| $100M | 34,247/day | 18,265/day | 5,591/day | 1,839/day | 292k |
| $1B | 342,466/day | 182,648/day (67M tasks/yr) | 55,913/day | 18,387/day | 2.92M (= ~94% of Fiverr's 3.1M active buyers) |

At 4 tasks/buyer/month, $15 needs 13.7k / 137k / 1.37M paying buyers for $10M / $100M / $1B.

---

## Unit economics: Skill-hire: online per-task marketplace of skill-specialized AI agents (base case: horizontal catalog, ~$15 per finished task)

Every number below comes from the input file. Nothing is looked up or guessed.

### One agent task

| line | per agent task |
| --- | ---: |
| Price | $15.00 |
| Model tokens incl. retries (ESTIMATE from SOURCED $1.857/agentic coding task avg x1.3 retry overhead) | -$2.40 |
| Verifier / eval agent pass (ESTIMATE) | -$0.40 |
| Sandbox compute, 2 vCPU + 4 GiB x 20 min (SOURCED rate) | -$0.06 |
| Storage, egress, logging, observability (ESTIMATE) | -$0.05 |
| Card fees 2.9% + $0.30 (SOURCED) | -$0.73 |
| Skill-author revenue share, 15% of price (ESTIMATE vs SOURCED norms) | -$2.25 |
| Compute + fees burned on rejected tasks, 15% rejection, pay-on-accept (ESTIMATE) | -$0.64 |
| Human QA spot-check, 25% of tasks x 3 min at $40/h (ESTIMATE) | -$0.50 |
| Support (ESTIMATE) | -$0.30 |
| **Contribution** (what each agent task leaves to pay the fixed costs) | **$7.67** (51%) |

### The margin that matters

Fixed costs: $168,000 a month (Team: 5 people, fully loaded (ESTIMATE) $110,000, Paid acquisition budget (ESTIMATE; self-serve CAC median ~$702, SOURCED https://saashero.net/google-ppc/saas-cac-benchmarks-2026/) $40,000, Software, monitoring, model-provider minimums (ESTIMATE) $6,000, Skill security vetting / red-team (ESTIMATE; ~13% of skills critical per Snyk, brief) $8,000, Legal, insurance, accounting (ESTIMATE) $4,000).

- **Break-even: 731 agent tasks a day.** Below that you lose money every month.
- **Profit margin at your plan** (1,500 a day): **26%** of every sale, after every cost.

### Year 1, month by month

| month | agent tasks a day | revenue | profit | cumulative (after $350,000 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 15 | $6,750 | -$164,551 | -$514,551 |
| 2 | 40 | $18,000 | -$158,802 | -$673,353 |
| 3 | 80 | $36,000 | -$149,604 | -$822,957 |
| 4 | 130 | $58,500 | -$138,106 | -$961,063 |
| 5 | 190 | $85,500 | -$124,310 | -$1,085,373 |
| 6 | 260 | $117,000 | -$108,213 | -$1,193,586 |
| 7 | 330 | $148,500 | -$92,116 | -$1,285,702 |
| 8 | 400 | $180,000 | -$76,020 | -$1,361,722 |
| 9 | 470 | $211,500 | -$59,923 | -$1,421,646 |
| 10 | 540 | $243,000 | -$43,827 | -$1,465,473 |
| 11 | 610 | $274,500 | -$27,730 | -$1,493,203 |
| 12 | 680 | $306,000 | -$11,634 | -$1,504,837 |

- **Year 1 operating profit: -$1,154,837** on $1,685,250 of revenue.
- After the $350,000 startup spend: -$1,504,837.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$1,504,837**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 26% | 731 | -$1,154,837 |
| Price -10% | 18% | 909 | -$1,323,362 |
| Volume -20% | 20% | 731 | -$1,327,070 |
| Unit costs +15% | 19% | 854 | -$1,278,450 |

### Red flags

- Year 1 loses money on operations (-$1,154,837).
- The startup spend is not earned back within year 1.

## Not done yet

- Summary: run /founder-plan
- What the board said: run /founder-board
- The competition: run /founder-competitors
- Pricing: run /founder-pricing
- The offer: run /founder-offer
- Marketing: run /founder-marketing
- Brand: run /founder-brand
- Operations: run /founder-ops
- Launch plan: run /founder-launch

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
