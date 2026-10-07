# Labeled queries

Format: JSON Lines, documented in `src/toolslim/labels.py`. Validate with
`python -m toolslim --catalog <catalogs> --labels <file> check`.

| file | catalog | role | queries |
|---|---|---|---:|
| `mcp-reference.jsonl` | `catalogs/` (8 servers, 78 tools) | **dev**: used while building and choosing retrievers | 154 |
| `mcp-test.jsonl` | `catalogs/test/` (5 servers, 70 tools) | **test**: draft, not yet scored | 140 |

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
