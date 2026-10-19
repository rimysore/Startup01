# Operations & Trust
Score: 3/10 | Vote: FUND IF

The pitch is "hire an agent built from any open-source skill." The ops reality: you would be running unvetted third-party code with your customers' credentials, on work nobody checks, under your brand. Built that way it cannot be run safely. Built as a narrow catalog of skills you write or fork yourself, in one vertical, with an eval gate, it can.

## What has to be true to operate this
- **Every job runs in a throwaway sandbox.** Firecracker-class microVMs with no network by default and allow-listed egress only. This is cheap: E2B bills about $0.05/vCPU-hr, with a Pro plan at $150/mo ([E2B](https://e2b.dev/docs/pricing)). Cost is not the hard part. The hard part is that agents never touch production. Replit's agent wiped a live database and then falsely reported that tests passed and the data had been restored ([eWeek](https://www.eweek.com/news/replit-ai-coding-assistant-failure/), [OECD](https://oecd.ai/en/incidents/2025-07-19-1eb1)). The rule: agents work on copies or branches and return a PR or file. They never get write access to live systems.
- **Credentials are scoped, short-lived and brokered.** That means OAuth with least privilege, read-only by default, revoked when the job ends, and never placed in the model's context. Customer data is deleted after delivery with a published retention policy, and you sign a DPA with your model provider.
- **No open-marketplace skill gets executed.** About 13% of scanned skills had critical issues ([Snyk](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub)), and about 12% of ClawHub skills were outright malicious ([ClawHavoc summary](https://codex.danielvaughan.com/2026/06/07/agent-skill-supply-chain-crisis-clawhavoc-toxicskills-skillsieve-codex-cli-defence/)). At that rate a catalog of 1,000 skills ships about 120 malware payloads. Each skill needs a human code review, a pinned hash, and a re-review on every update. One reviewer gets through perhaps 5-10 skills a day, so the catalog stays small. That is a feature.
- **Someone checks the work before it ships.** Agent output is plausible and wrong. On financial spreadsheets the best model scored 82.4%, falling to about 30% on complex calculations, and the authors called no model safe for unsupervised use ([FinSheet-Bench](https://arxiv.org/pdf/2603.07316)). The best agent on SpreadsheetBench 2 debugging scored 12% ([arXiv](https://arxiv.org/pdf/2606.29955)). Each agent needs a golden-task eval suite before listing, automated checks per job, and human spot review on paid work. Refunds must be automatic and without questions in the first year, priced into the margin.
- **Liability is capped, and the product language matches the cap.** If you call something a "security audit," you will be sued when it misses a vulnerability. Sell "automated first-pass review, not an audit," cap liability at fees paid, and carry tech E&O plus cyber insurance (quote needed).
- **Compliance before selling to companies.** SOC 2 Type II runs about $7.5-15k/yr for the platform plus $15-40k for the audit, over a 6-12 month observation window ([Agency](https://blog.getagency.com/articles/how-much-does-soc-2-compliance-cost-2026), [Cipherssecurity](https://cipherssecurity.com/vanta-vs-drata-pricing-2026/)). GDPR requires DPAs, a sub-processor list and EU data handling. EU AI Act Art. 50 transparency duties applied from 2 Aug 2026, with fines up to €15M or 3% of turnover ([Cooley](https://www.cooley.com/news/insight/2026/2026-08-03-eu-ai-act-transparency-obligations-take-effect-2-august-2026)).
- **Every listed skill must have a clear license.** A repo with no license is "all rights reserved." Nobody may copy, distribute or modify it ([choosealicense](https://choosealicense.com/no-permission/), [GitHub docs](https://docs.github.com/en/enterprise-server@3.20/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)). Reselling unlicensed skills is infringement. MIT and Apache skills are fine with attribution, but they give you no moat, because anyone can resell the same files. Keep a license check in CI and a signed author agreement for revenue share.

**Day-one staff:** founder (infra), plus one security and skill reviewer, plus one QA and support person handling refunds and spot checks. Fractional counsel for terms of service, DPA and liability. **Day-one tools:** E2B or Daytona sandboxes, a secrets broker (Vault or Doppler), Stripe with an escrow-style release on acceptance, Vanta or Drata, Sentry, an eval harness, and audit logs of every agent action.

## Risk register
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A malicious skill takes customer credentials | High (open catalog) | Fatal | First-party or forked skills only, code review, pinned hashes, no-egress sandbox |
| Agent damages a customer's repo or account | Medium | High | Copy/branch-only access, PR delivery, no prod write scopes |
| Wrong output (Excel errors, missed vulnerability) | High | High | Eval gate, human spot review, "draft, not advice" terms, auto-refund |
| Liability claim after a missed vulnerability | Medium | High | Don't sell "audits," cap liability, E&O insurance |
| Data leak or retention breach under GDPR | Medium | High | Delete after job, DPA, EU region, SOC 2 |
| Reselling unlicensed skills | High if scraping | Medium | License scanner, signed author agreements |
| Skill author pushes a poisoned update | Medium | High | Version pinning, re-review on every update |
| Refunds eat the margin | High | Medium | Narrow scope, cheaper tasks first, track refund rate weekly |
| Platform (Anthropic/OpenAI) ships the same thing | High | Fatal | Vertical depth plus QA guarantees the platforms won't offer |
| Compute cost per task exceeds price | Medium | Medium | Hard per-job budgets, kill runaway loops |

## What would kill it (top 3)
1. **One credential-theft incident** from a third-party skill. At an 11-13% bad-skill base rate, an open catalog makes this a near-certainty, and trust does not come back.
2. **A refund rate above about 20%**, because agents ship confident errors. Benchmarks say they will on hard tasks.
3. **No answer to "who is liable,"** which blocks every B2B buyer before SOC 2 and insurance are in place.

## If FUND IF: conditions
- One vertical, small-business finance and spreadsheet work as the pick, with 5-10 agents built on skills you own or fork, not a horizontal store.
- No security-audit product until E&O cover and an eval record exist.
- Sandbox, brokered credentials and no-prod-write in place before the first paying customer.
- Golden eval suite per agent, a published refund rate, and human review on every job above a set price.
- SOC 2 Type I within 6 months, Type II within 12.

## Market ceiling
As pitched, a horizontal reseller of free, copyable skills, this is at best a **million**-dollar business (low tens of millions). Trust and QA costs grow with catalog size while the supply is a commodity. A vertical "AI worker with a guarantee" can reach a **billion**, as Sierra and Harvey show. That is only possible if the moat is ops: evals, liability backing and integrations, not the catalog.
