# Labeled queries

Format: JSON Lines, documented in `src/toolslim/labels.py`. Validate with
`python -m toolslim --catalog <catalogs> --labels <file> check`.

| file | catalog | role | queries |
|---|---|---|---:|
| `mcp-reference.jsonl` | `catalogs/` (8 servers, 78 tools) | **dev**: used while building and choosing retrievers | 154 |
| `mcp-test.jsonl` | `catalogs/test/` (5 servers, 70 tools) | **test**: scored once on 2026-10-07 (spent) | 140 |

## How `mcp-test.jsonl` was produced

- **Author: the same AI assistant that built the retrievers.** It is not an independent party, and it had already seen the dev failure patterns, so treat the set as a draft. A human reviewer, or an independent author writing `mcp-test-<name>.jsonl`, would make it a stronger test; the scorer accepts any labels file.
- Written from the tools' names, descriptions and parameter names only, **before any retrieval was run on these tools**, and committed before scoring.
- Two queries per tool, as in the dev set: a `user` paraphrase and a short `agent` intent. Each label lists *every* tool that would accomplish the request.
- Lint result: 140 queries, 70/70 tools covered, no unknown tools, no duplicates, no user-style query containing every word of its tool's name.

## Differences from the dev set that affect comparisons

| | dev | test |
|---|---:|---:|
| user-style mean overlap with tool-name words | 0.14 | 0.13 |
| agent-style mean overlap with tool-name words | 0.83 | 0.57 |
| queries with several acceptable tools | 8 | 14 |

- Agent-style test queries share fewer words with tool names (Notion's `API-` and Playwright's `browser_` prefixes rarely appear in short intents), so that end is somewhat harder than dev.
- More queries accept several tools (Notion and Playwright have many overlapping operations), which is more lenient than dev. Scores are not directly comparable between the two sets.
- Notion's tool descriptions are terse ("Notion | Retrieve a page Error Responses: ..."), so retrieval there leans on tool names, which is exactly what makes it a useful test.

## Scoring protocol

1. Fix the retriever configuration (fusion method, result count) using the dev data only, and record it before scoring.
2. Score once: `python -m toolslim --catalog catalogs/test --labels queries/mcp-test.jsonl bench`.
3. Do not change labels or retrievers after seeing the result. If a label is objectively wrong (an unknown tool name, a mislabeled tool), fix it in a separate commit that states what changed and why, and report both scores.

## Result and lessons (2026-10-07)

Scored once with the dev-selected `dense` retriever: user-style recall@5 = 60% (42/70), agent-style 100%; details and caveats in the top-level README. Labels and retrievers were not changed afterwards.

Lessons for whoever writes the next set (this one has a flaw you can avoid):

- **Name the service, or accept cross-server answers.** In a merged catalog, "add a new column to the tasks table" is answerable by a Notion tool *and* by SQLite's `write_query`. Several of my Notion queries said "table" or "workspace" without saying Notion, so correct answers from other servers were scored as misses. Either mention the service in the query (as the dev set does for GitHub vs local git) or list every server's acceptable tool in `expected`. Audit this for all queries up front, not only for the ones that fail: auditing only after seeing misses biases the score upward.
- **Score once means score once.** The temptation after a surprising result is to fix labels; any fix made after seeing misses should be disclosed as such and reported next to the original number.
