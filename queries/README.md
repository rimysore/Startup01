# Labeled queries

Format: JSON Lines, documented in `src/toolslim/labels.py`. `independent/` holds labels written by authors who never saw the retrievers (see its README). Validate with
`python -m toolslim --catalog <catalogs> --labels <file> check`.

| file | catalog | role | queries |
|---|---|---|---:|
| `mcp-reference.jsonl` | `catalogs/` (8 servers, 78 tools) | **dev**: used while building and choosing retrievers | 154 |
| `mcp-test.jsonl` | `catalogs/test/` (5 servers, 70 tools) | scored once on 2026-10-07, so **spent** (counts as dev data from now on) | 140 |
| `mcp-test2.jsonl` | `catalogs/test2/` (6 servers, 105 tools) | scored once on 2026-10-07, so **spent** | 210 |
| `mcp-test3.jsonl` | `catalogs/test3/` (6 servers, 189 tools) | scored once as the confirmation batch, so **spent** | 378 |

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

## `mcp-test2.jsonl` (scored once; written by the retriever's author)

Written for `catalogs/test2/` by the same AI assistant that built the retrievers, so it is a draft and not an independent test; an independent author or a human reviewer would strengthen it. It was written from tool names, descriptions and parameter names only, before any retrieval was run on this batch, and committed before scoring.

It applies the lessons from the previous set. The overlap audit was done for **all** queries up front, not only for ones that later fail:

- **Overlap groups in this batch:** logs (Heroku `get_app_logs`, Kubernetes `kubectl_logs`, MongoDB `mongodb-logs`); scale/restart (Heroku `ps_*`, Kubernetes `kubectl_scale`/`kubectl_rollout`); indexes (MongoDB `*-index`, Pinecone `*-index*`); documentation lookup (Pinecone `search-docs`, MongoDB `search-knowledge`, Tavily web search); and "run any command" (`kubectl_generic`).
- **Every query names its service** in the words a person would use (Heroku, pod/cluster, MongoDB/Mongo, DynamoDB, Pinecone, Helm) or lists every acceptable tool.
- **`kubectl_generic` is accepted wherever a dedicated `kubectl_*` tool is expected**, because it can run any kubectl command. This is applied uniformly (12 user-style queries, mirrored by 12 agent-style ones) and makes those queries more lenient than they would otherwise be.
- **Documentation questions** (`search-knowledge`, `search-docs`) also accept `tavily_search`, since a web search finds the same pages.
- A few further genuine alternatives are listed with a note in the file (`get_app_info` also reports dynos, `aggregate` can count, `kubectl_apply`/`kubectl_create`, `cascading-search` over one index).

Lint result (`check`): 210 queries, 105/105 tools covered, no unknown tools, no duplicates, no user-style query containing every word of its tool's name. One query that did (`collection-indexes`) was re-paraphrased before committing; that was a text fix, made without running any retrieval.

| | `mcp-reference` (dev) | `mcp-test` (spent) | `mcp-test2` |
|---|---:|---:|---:|
| user-style mean overlap with tool-name words | 0.14 | 0.13 | 0.20 |
| agent-style mean overlap with tool-name words | 0.83 | 0.57 | 0.68 |
| queries accepting several tools | 8 / 154 | 14 / 140 | 34 / 210 |
| user-style queries that name their server | 15 / 77 (19%) | 1 / 70 (1%) | 77 / 105 (73%) |
| agent-style queries that name their server | 17 / 77 (22%) | 11 / 70 (16%) | 93 / 105 (89%) |

Comparison caveats: this set names the service in most queries (the lesson from last time), which makes cross-server confusion easier to avoid than in `mcp-test`; and it is more lenient (34 multi-answer queries, 24 of them from the `kubectl_generic` rule). Scores are not directly comparable with the earlier sets.

Scoring protocol is unchanged: fix any retriever or index change on dev data first (which now includes the spent test set), record it before scoring, score once, and do not edit labels afterwards without disclosure.

The last two rows (a crude, tokenizer-independent detector; a server called `time` or `everything` is "named" by those ordinary words, and `kubernetes` is not named by "pod" or "cluster") matter for any feature that uses the server name: dev data can barely exercise it, while this set favors it. See "Server names in the index" in the top-level README.

### Scoring protocol for `mcp-test2.jsonl` (fixed before the run)

`scripts/score_test2.py`, committed before it was run on this batch. Headline: `dense` (the recorded default), user-style recall@5 over 105 queries, with a 95% interval. Declared second comparison: `dense+server` vs `dense`, paired (queries gained / lost), reported with counts and no decision attached. Everything else (BM25 and hybrids, with and without the server name, recall@10, MRR) is context. One run; labels and retrievers are not edited afterwards (an objectively wrong label may be fixed in a separate, disclosed commit with both scores reported). Results go to `results/test2-score.txt` and `.json`.

### Result (2026-10-07)

Scored once with `scripts/score_test2.py`, protocol as above; raw output in `results/test2-score.txt`. Headline `dense`: user-style recall@5 = 66.7% (70/105, 95% interval 57-75%). Details, the declared `dense+server` comparison and caveats are in the top-level README. No labels or retrievers were changed afterwards, and no label was found to be objectively wrong.

## `mcp-test3.jsonl` (scored once as the confirmation batch; written by the retriever's author)

Written for `catalogs/test3/` by the same AI assistant that built the retrievers and chose the default, so it is a draft and not an independent test; a human reviewer or an independent author would strengthen it considerably. Written from tool names, descriptions and parameter names only, before any retrieval was run on this batch, and committed before scoring. One user-style and one agent-style query per tool (189 tools, 378 queries). Load it with `--catalog catalogs/test3 --on-duplicate namespace`.

The overlap audit was done for all queries up front:

- **Overlap groups:** the Office trio (tables: Excel `create_table`, Word `add_table`, PowerPoint `add_table`; charts; images; merging cells; creating, listing, reading and searching documents), Obsidian vs Word (appending, searching, reading), and the many look-alike Redis operations across data types (list/set/sorted set/hash/stream/JSON).
- **Rule 1:** a query that another Office server could also answer names the product or its documents ("spreadsheet", "workbook", "Word document", "slide", "deck"); user-style Office queries do so in 114 of 117 cases.
- **Rule 2:** tools that do equivalent jobs are all accepted: Word's five footnote-adding tools (by paragraph or by search text), its two footnote-deleting tools, rectangular vs single-row or single-column cell merges, one vs several column widths, Redis's two key scans, Obsidian's single and batch reads, PowerPoint's overlapping text and slide tools, and a few more (each marked with a note). 21 of the 189 rows (42 of 378 queries) accept several tools.
- **Rule 3:** the two colliding `add_table` tools are labeled with their namespaced names, `word__add_table` and `powerpoint__add_table`.
- **Rule 4:** where an action is unique within the batch (Docker, most of Redis), the user-style query does not force the service name in.

Lint (`check`): 378 queries, 189/189 tools covered, no unknown tools, no duplicates, no user-style query containing every word of its tool's name (one that did, for `add_footnote_to_document`, was re-paraphrased before committing: a text fix, made without running retrieval).

| | `mcp-reference` (dev) | `mcp-test` (spent) | `mcp-test2` (spent) | `mcp-test3` |
|---|---:|---:|---:|---:|
| user-style mean overlap with tool-name words | 0.14 | 0.13 | 0.20 | 0.25 |
| agent-style mean overlap with tool-name words | 0.83 | 0.57 | 0.68 | 0.74 |
| queries accepting several tools | 8 / 154 | 14 / 140 | 34 / 210 | 42 / 378 |
| user-style queries that name their server | 19% | 1% | 73% | 32% |
| agent-style queries that name their server | 22% | 16% | 89% | **97%** |

Caveat for the confirmation: nearly every agent-style query here names its service (I put the product word in almost all of them), the same favorable regime as the second batch. So this batch tests the BM25/dense fusion well and tests the value of the server name in the index text under conditions that favor it; it says little about how often real model-written queries name their service. Scoring protocol and the declared comparisons are in the top-level README ("Choosing the default, round 2").

### Result (confirmation run)

Scored once with `scripts/score_test3.py`; raw output in `results/test3-score.txt`. Headline `hybrid-rrf+server`: user-style recall@5 = 74.6% (141/189, 95% interval 68-80%), agent-style 98.4%. The declared reading was NOT CONFIRMED: the fusion gain over `dense` cleared its bar (25 gained, 9 lost on all queries), but the agent-style guard missed by 0.06 points (two queries). Details and caveats are in the top-level README. No labels or retrievers were changed afterwards, and no label was found to be objectively wrong.
