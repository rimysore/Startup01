# Buyer panel: Skill-hire: a marketplace to hire specialized AI agents (base model + one open-source Agent Skill) as named AI workers

**2 buy · 22 pass** (8% buy) out of 24 simulated buyers. Seed 5, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Small-business owner who buys on Fiverr/Upwork | 5 | 20%  (thin) |
| Agency owner (dev/design/marketing, 3-30 staff) | 5 | 20%  (thin) |
| Enterprise IT/security buyer | 4 | 0%  (thin) |
| In-house developer already using Claude Code/Cursor | 5 | 0%  (thin) |
| Solo founder / indie hacker | 5 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Deal hunter | 3 | 33%  (thin) |
| Outcome buyer | 5 | 20%  (thin) |
| Burned before | 4 | 0%  (thin) |
| Procurement-gated | 3 | 0%  (thin) |
| Tinkerer | 5 | 0%  (thin) |
| Loyal to a platform | 4 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $217,000 and up | 8 | 12% |
| $143,000 to $217,000 | 8 | 12% |
| under $143,000 | 8 | 0% |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 9 | "I've watched three 'AI workers' break things in prod. An unaudited startup running community skills against our systems is a hard no." (P001) · "No SOC 2, no contract, no DPA. I can't even start the review." (P004) |
| need | 4 | "I already run these exact skills in Claude Code for free on my existing seat. And procurement would take 6 months for a vendor with no SOC 2." (P002) · "I build my own agents. I'd rather fork the skill than pay you per task." (P013) |
| habit | 3 | "My devs already run Claude Code with skills. I might use a design or audit worker as white-label overflow, but I'd test before I pay $49/mo per worker." (P005) · "I do everything in ChatGPT now. I'm not adding another login and handing over my files." (P009) |
| price | 3 | "The skill is free. I'll install it myself in ten minutes. $49 a month is a real bill on my income." (P007) · "First task free, then I cancel. Claude Pro plus free skills covers this." (P008) |
| convenience | 2 | "I hire on Upwork for small design jobs. I'd try the free task, but I'd want to see it inside Claude where I already work." (P014) · "I'd buy a finished deliverable, but I live in Claude and don't want a new vendor. If the result were clearly better than Claude alone I'd pay $30 a task." (P017) |
| quality | 1 | "I'd take the free task, an Excel cleanup. If it's right first time, maybe $20 a job, but I'll still be checking every cell." (P003) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| price | 1 | "Fiverr charges me $40-80 for a spreadsheet or a landing page mockup and takes days. $9-29 in an hour, first one free? I'll try two jobs." (P012) |
| quality | 1 | "Margins are getting squeezed; if a security-audit or UI worker produces a client-ready report I can white-label, $49/mo per worker is noise. I'll pay for one and test it on two clients." (P024) |

## What would flip a no

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
