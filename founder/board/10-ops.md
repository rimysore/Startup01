# Operations & Trust
Score: 3/10 | Vote: FUND IF

As pitched ("hire an agent built from any open-source skill"), you would run unvetted third-party code with customers' credentials, on work nobody checks, under your brand. That can't be run safely. A small catalog of skills you write or fork yourself, in one vertical, with an eval gate, can.

## What has to be true to operate this
- **Every job runs in a throwaway, no-egress microVM.** Cheap: E2B is about $0.05/vCPU-hr ([E2B](https://e2b.dev/docs/pricing)). The hard rule is that agents never touch production. Replit's agent wiped a live database, then claimed the tests passed ([eWeek](https://www.eweek.com/news/replit-ai-coding-assistant-failure/)). Agents work on copies or branches and deliver a PR or file.
- **Credentials:** brokered OAuth, read-only by default, revoked when the job ends, never in the model's context. Data deleted after delivery. A DPA with the model provider.
- **No open-marketplace skill gets executed.** About 13% of scanned skills had critical issues ([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub)), and about 12% of ClawHub skills were malicious ([summary](https://codex.danielvaughan.com/2026/06/07/agent-skill-supply-chain-crisis-clawhavoc-toxicskills-skillsieve-codex-cli-defence/)). So 1,000 listed skills means about 120 payloads. Each skill needs human review, a pinned hash, and re-review on every update.
- **Someone checks the work.** The best model scored 82.4% on financial spreadsheets, falling to about 30% on complex calculations, and the authors called no model safe unsupervised ([FinSheet-Bench](https://arxiv.org/pdf/2603.07316)). The best score on SpreadsheetBench 2 debugging was 12% ([arXiv](https://arxiv.org/pdf/2606.29955)). That means a golden eval suite before listing, human spot review on paid jobs, and automatic refunds priced into the margin.
- **Liability is capped and the wording matches.** Sell an "automated first-pass review," never an "audit." Cap liability at fees paid. Carry tech E&O and cyber insurance (quote needed).
- **Compliance:** SOC 2 Type II costs about $7.5-15k/yr for the platform plus $15-40k for the audit, over 6-12 months ([Agency](https://blog.getagency.com/articles/how-much-does-soc-2-compliance-cost-2026)). GDPR needs DPAs and a sub-processor list. EU AI Act Art. 50 transparency duties have applied since Aug 2026, with fines up to 3% of turnover ([Cooley](https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026)).
- **Licensing:** a repo with no license is all-rights-reserved, so reselling it is infringement ([choosealicense](https://choosealicense.com/no-permission/)). MIT and Apache skills are legal with attribution but give no moat, since anyone can resell the same files. Run a license check in CI and get signed author agreements for revenue share.

**Day one:** founder (infra), one security and skill reviewer (5-10 skills a day, so the catalog stays small, which is fine), one QA and refunds person, and fractional counsel. Tools: E2B or Daytona, Vault or Doppler, Stripe with payment released on acceptance, Vanta or Drata, an eval harness, and audit logs of every agent action.

## Risk register
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Malicious skill takes credentials | High (open catalog) | Fatal | First-party or forked skills, review, pinned hashes, no egress |
| Agent damages a repo or account | Medium | High | Branch-only access, PR delivery, no prod write |
| Wrong output (Excel errors, missed vulnerability) | High | High | Eval gate, spot review, "draft" terms, auto-refund |
| Liability claim | Medium | High | No "audit" products, liability cap, E&O |
| GDPR or data-retention breach | Medium | High | Delete after job, DPA, EU region, SOC 2 |
| Reselling unlicensed skills | High if scraping | Medium | License scanner, author agreements |
| Author pushes a poisoned update | Medium | High | Version pinning, re-review |
| Refunds eat the margin | High | Medium | Narrow scope, track refund rate weekly |
| Platform owner clones the product | High | Fatal | Vertical depth plus a guarantee |
| Runaway compute per task | Medium | Medium | Hard per-job budgets |

## What would kill it (top 3)
1. **One credential-theft incident** from a third-party skill. At an 11-13% bad-skill rate, an open catalog makes this near-certain.
2. **A refund rate above about 20%**, because agents ship confident errors on hard tasks.
3. **No answer to "who is liable,"** which blocks every B2B buyer until SOC 2 and insurance are in place.

## If FUND IF: conditions
- One vertical (I'd pick small-business spreadsheet and finance work), with 5-10 agents on skills you own or fork. No horizontal store.
- No security-audit product until E&O cover and an eval record exist.
- Sandbox, brokered credentials and no-prod-write in place before the first paying customer.
- A published refund rate, and human review on every job above a set price.
- SOC 2 Type I in 6 months, Type II in 12.

## Market ceiling
As a horizontal reseller of free, copyable skills: **million** (low tens of millions at best). Trust and QA costs grow with the catalog while the supply is a commodity. A vertical "AI worker with a guarantee" can reach a **billion**, as Sierra and Harvey show, but only if the moat is ops (evals, liability backing, integrations) rather than the catalog.
