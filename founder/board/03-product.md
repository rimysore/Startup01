# Product lens
Score: 3/10 | Vote: PASS

## What is strong
- The raw ingredient really works. Curated skills raise agent pass rates by about 16 points on average, and smaller models with skills can match larger ones without them ([SkillsBench, arXiv 2602.12670](https://arxiv.org/html/2602.12670v1)). So "a specialist beats a generalist" has evidence behind it.
- Focused skills beat sprawling ones, and self-written skills add roughly nothing (same paper). Curation and testing are real work, the one part a company could own.
- The founder builds agent infrastructure (toolslim), so the hidden plumbing is within reach.

## What would kill it (top 3, most dangerous first)
1. **There is no one thing.** "A marketplace of AI workers for anyone, built on any skill" is a catalog, not a product. The customer field in the brief is blank. The same paper shows gains swing from +4.5 points (software) to +51.9 (healthcare), with 16 of 84 tasks getting worse ([SkillsBench](https://arxiv.org/html/2602.12670v1)). So the quality of a horizontal catalog is a lottery the buyer pays to play.
2. **Every touchpoint that matters belongs to someone else.** The model is Anthropic's or OpenAI's. The skill is a free MIT file written by a stranger, and 12-13% of public skills have critical or malicious problems (Snyk and Koi, in the brief). The buyer's files, repo and tools sit in their own systems. The platform owns only the catalog page and the bill. When the deliverable is wrong, who fixes it? This can be assembled but not crafted.
3. **The first five minutes are the hardest part, and they are unsolved.** Walk it through. A buyer browses thousands of near-identical "workers" with no install signal (one publisher has 767 installs across 162 skills, per the brief). They pick one, then hit "connect your files/repo/tools", which is a trust and permissions wall for exactly the non-technical buyer this is meant to replace Upwork for. Then they wait, with no human to talk to. Upwork is already testing human-supervised agents in its existing marketplace and plans to roll them out to all customers this year ([Upwork Q2 2026 commentary](https://investors.upwork.com/node/13216/pdf); [MCP release](https://investors.upwork.com/news-releases/news-release-details/upwork-talent-now-everywhere-ai-works)). That buyer already has a seamless default.

## The questions I would ask the founder
- Finish this sentence with no "or": "Skill-hire is the fastest way for ___ to get ___ done."
- What does the buyer see at minute five?
- When a hired agent hands back broken work, what happens next, and who does it?
- Why would a developer pay instead of installing the free skill in 30 seconds?
- What do you test before an agent is listed, and what pass rate would you publish?
- What would you cut? (My answer: the marketplace, the revenue share, subscriptions and every skill but one.)

## If FUND IF: the conditions
Not applicable as pitched. Here is what would change the vote to FUND IF:
- **One job, one buyer.** Pick the one where skills give the biggest measured lift and the buyer can't do it themselves. My pick: spreadsheet and finance work (xlsx) for small businesses with no analyst, sold as "send the file, get the finished model back". A file is the input, so there's almost no connection wall.
- **Own the result, not the listing.** One branded agent, tested on a public eval, output guaranteed (redo or refund). No third-party listings until that one job has paying repeat users.
- **Design the seam.** A human reviewer, or a clear "this failed, here's why" handoff, in the first version. Will buyers pay for it? Open question for `/founder-consumer`.
- Open question: what each finished task costs in compute versus what a buyer will pay. Nobody has that number yet; `/founder-cfo`.

## Market ceiling
As pitched it is a million-dollar company at best. A horizontal catalog of free, copyable skills sits under platforms that already distribute skills without commission, and the GPT Store and Agent.ai versions of this stalled or got folded in (brief). The bigger version is the vertical one: a single "AI worker" that owns one job end to end, priced on outcomes. Comparables of that shape (Sierra at about $200M ARR, Harvey) show it can reach a billion, but only by owning the whole experience.
