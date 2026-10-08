# Picking one vertical

Written 2026-10-08. Market figures marked *(verify)* are from memory and must be checked before they go into a pitch.

## The question

The consumer finance app in `PLAN.md` goes up against dozens of funded competitors, and we have no special advantage there. We're looking for a vertical where:
1. **we have an unfair advantage** (access, knowledge, trust),
2. a buyer with a budget feels **acute, recurring pain**,
3. the work is **messy documents, spreadsheets and judgment calls**, which is where AI agents are now much better than old software,
4. incumbent software is **old** (systems of record, not systems that do the work).

## Scoring the three candidates

| Criterion (1–5) | Automotive | Healthcare | Campus capital planning & facilities |
|---|---|---|---|
| Your unfair advantage | 1: interest only | 1: interest only | **5: you do this job today** |
| Pain is acute and recurring | 3 | 5 | **4: deferred maintenance backlog, yearly capital requests, board reporting** |
| Buyer has budget | 3 | 5 | 4: capital and operating budgets are large; software spend is small but real |
| Competition from AI startups | 4: crowded (dealer AI, repair-shop AI) | 5: very crowded (scribes, billing, prior auth) | **2: few AI-native players** |
| Regulatory burden | 2 | 5: HIPAA, FDA, payers | 2: public procurement, data ownership |
| Speed to first customer | 3 | 1 | 3: procurement is slow, but pilots and small colleges move faster |
| **Total (higher is better; burden counted inversely)** | **~16** | **~15** | **~23** |

**Recommendation: campus capital planning and facilities.** Healthcare is the bigger market, but without clinical or billing insiders we would be the 200th AI scribe. In facilities, you're the insider. You know the vocabulary, the reports, the politics and who signs.

There's also a thread from the original idea: it's still **"an agent that helps people make better money decisions about the things they own."** The owner is just an institution, not a person, and institutions pay.

## What the facilities world looks like (to confirm in interviews)

- Universities, K-12 districts, cities and hospitals each manage hundreds of buildings, many from the 1960s and 70s. The **deferred maintenance backlog** in US higher education runs to tens of billions of dollars *(verify: Gordian/APPA "State of Facilities" reports)*.
- **Facility Condition Assessments (FCAs)**: consultants walk the buildings every 3–5 years and produce huge PDFs and spreadsheets. These are expensive, and **out of date as soon as they're delivered**.
- Meanwhile the **work order system** (CMMS such as AiM, Maximo, TMA, Brightly or FAMIS) logs every repair. It's a live condition signal that almost nobody connects back to the capital plan.
- **Capital planning** still happens mostly in Excel: ranking projects, building funding requests (state appropriations, bonds, donors, energy grants and incentives), and making board-ready decks every cycle.
- Incumbents: Gordian (Sightlines, VFA), AssetWorks (AiM), Brightly (Siemens), Accruent, IBM Maximo/TRIRIGA, project tools like e-Builder and Kahua. These are systems of record. **They store data. They don't do the analyst's job.**

## The idea: an AI capital planning analyst for campuses

**One line:** *"Feed it your condition assessments, work orders and budget spreadsheets. It keeps a live picture of every building and writes the capital plan, the funding request and the board report for you."*

What the agent does:
1. **Ingest the mess.** It reads FCA PDFs, CMMS exports, Excel capital lists, utility bills and project closeouts, and builds one clean asset and condition register. On day one, this alone saves weeks.
2. **Keep condition live.** It uses work-order patterns (for example, "this AHU had 14 calls in 6 months") to update condition and remaining-life estimates between assessments.
3. **Prioritize and run scenarios.** "If we get $12M this cycle, which projects, and what happens to FCI and risk?" It compares fund-it-now vs. defer-it-and-pay-more-later.
4. **Draft the documents.** Capital request narratives, board slides, state submissions and grant applications, all in the institution's own format and checked against the data.
5. **Answer questions.** "What did we spend on roofs in the last 5 years?" or "Which buildings have original 1970s chillers?", answered in seconds rather than days.

**Why customers buy:** the capital planning office is a handful of people answering questions about thousands of assets and billions in replacement value. A board report that takes 3 weeks taking 3 days is something a VP can approve quickly.

**Expansion path (where your healthcare interest comes back):**
higher ed → K-12 districts → cities and counties → **hospital and health system facilities** (heavy compliance, very costly downtime) → corporate real estate.

## ⚠️ Before anything else: protect yourself with your employer
- **Don't use any IU data, documents or internal tools** to build this, not even "just to test." Use public data: state capital requests, public board packets and published FCAs. Many public universities post these online.
- Read IU's policies on **outside activities, conflict of interest and intellectual property**, and keep the work on personal time and personal devices. A one-hour consult with a startup lawyer is worth it before you build anything.
- Your employer can become a **design partner or first customer later**, through the proper channels.

## The next 4 weeks: discovery, not code

1. **Shadow yourself (week 1).** For 2 weeks, log every task at work that takes more than an hour and feels repetitive: what you did, which files, who asked, how often. These are the product requirements.
2. **20 interviews (weeks 1–4)** with capital planners, facilities directors and budget officers at *other* institutions. Reach them through APPA and its regional chapters, LinkedIn, and conference speaker lists. Ask:
   - "Walk me through the last capital request you put together. Where did the time go?"
   - "Where does condition data live, and how out of date is it?"
   - "What have you paid consultants for in the last 2 years?"
   - "If this were solved, whose budget would pay for it?"
3. **A public-data demo (weeks 2–4).** Take a public university's published capital plan or FCA and use Claude to turn it into a clean register, a prioritized list and a draft board summary. Show it in the interviews: *"Is this useful? What's wrong?"*
4. **Decision gate.** If at least 5 of the 20 say "I'd pilot this" and name the same top pain, we go. If the pain is scattered, we pick the next vertical on the list (hospital facilities).

## Business model (first guess)
- Annual SaaS license per institution, priced by building count or square footage. Small colleges in the tens of thousands of dollars per year, large systems more *(verify with interviews)*.
- Optional paid onboarding: "we clean your data in 30 days" is a natural paid pilot.
- Sales: start with small and mid-size private colleges (fewer procurement layers) and use cooperative purchasing contracts later for public institutions.

## Questions for you
1. Which tools does your office use today (CMMS, capital planning, project management, Excel)?
2. Which recurring report or task do you dread most?
3. Who above you would sign a software purchase, and what was the last tool they bought?
