# toolslim

Agents with many MCP tools pay for every tool schema on **every request**, whether or not the tool is used. `toolslim` measures that overhead and tests two ways to cut it:

1. **Slim** the schemas (`slim.py`): drop tokens the model doesn't need to call a tool.
2. **Load lazily** (`gateway.py`): replace the whole catalog with three meta-tools (`search_tools`, `describe_tool`, `call_tool`), so the model pays for a schema only when it needs one.

Core has no dependencies (Python 3.10+). Embedding retrieval is an optional extra: `pip install -e .[dense]` (numpy + `wordllama`, whose 16 MB of weights ship inside the wheel, so nothing is downloaded at runtime).

```bash
export PYTHONPATH=src
python -m toolslim bench                       # token + retrieval benchmark (dev queries)
python -m toolslim bench --sets all            # also score the held-out sets
python -m toolslim search "post a message"     # what the model sees from search_tools
python -m toolslim slim github_create_issue --level 2
python -m unittest discover -s tests
```

## Results so far (estimated tokens)

| strategy | synthetic, 40 tools | dev: real servers, 78 tools | fresh test: real servers, 70 tools |
|---|---:|---:|---:|
| all schemas, as published | 6,780 | 12,514 | 28,389 |
| slimmed, level 1 (lossless) | 4,879 (-28%) | 11,076 (-11.5%) | 12,600 (-55.6%) |
| slimmed, level 2 (+ first-sentence descriptions) | 4,529 (-33%) | 8,905 (-29%) | 10,583 (-62.7%) |
| slimmed, level 3 (+ no param descriptions) | 3,322 (-51%) | 6,617 (-47%) | 7,184 (-74.7%) |
| lazy gateway, first request | 190 (-97%) | 190 (-98.5%) | 190 (-99.3%) |
| lazy gateway, after search + describe | 494 (-93%) | 503 (-96%) | 537 (-98.1%), optimistic: 40% of user-style queries missed at k=5 |

How much slimming saves depends heavily on how a server generates its schemas: level 1 saves 11.5% on the dev servers but 55.6% on the test servers, almost entirely because Notion's generator attaches ~14k tokens of unused definitions to its tools (see below). The synthetic set overstated level 1 relative to the dev servers (28% vs 11.5%). Lazy loading's cost does not depend on the catalog.

Slimming levels:

- **1**: lossless for tool calling: `title`, `$schema`, `examples`, `additionalProperties: false`, and `$defs`/`definitions` entries that no `$ref` reaches (transitively; skipped when a schema uses `$anchor`/`$id`/`$dynamicRef`, which are not resolved).
- **2** and **3**: lossy. Not yet validated against real model behavior.

The lazy rows use the default retriever (plain embedding search; see "Choosing the default" below). They only hold if the model finds the right tool on the first search, so retrieval quality matters as much as the token numbers.

## Retrieval

The first version used lexical BM25 only and found the right tool in the top 5 for just 50% of paraphrased queries. Retrievers compared, recall@5 (MRR), 40 queries per set:

| retriever | dev | held-out, user-style | held-out, agent-style |
|---|---:|---:|---:|
| bm25 | 50% (0.34) | 42% (0.22) | 100% (0.98) |
| dense (`wordllama` embeddings) | 70% (0.54) | 68% (0.45) | 100% (0.98) |
| hybrid-rrf (BM25 + dense, reciprocal rank fusion; the default when these numbers were first measured) | 78% (0.49) | 68% (0.35) | 100% (1.00) |

Seven variants in total are in `python -m toolslim bench --sets all`.

How to read this:

- **Embeddings are the real gain.** BM25 -> dense is +20 points on dev and +26 on held-out user-style queries; the effect shows up in both sets.
- **Fusion did not beat plain dense.** Hybrid won by 3 queries on dev but tied on held-out (and has a lower MRR). With 40 queries per set that gap is noise. Hybrid was the default when this was written; the default was later chosen by a pre-registered rule (see "Choosing the default"), which picked plain dense.
- **Agent-style queries are easy.** Short intents like "refund a payment" hit 100% for every retriever, which supports the idea that model-written queries do better than user paraphrases. They were written by the same author who knows the tool names, so treat 100% as an upper bound, not a measurement.
- **A ceiling around 80%.** Recall barely moves from k=5 (78%) to k=10 (82%) on dev. What's left needs inference ("hand PLAT-77 over to Dana" means *assign*; "how many users signed up" means *run a SQL query*) that static word vectors can't do. Next lever: an LLM-written or rewritten query, or a reranker.

Method, so the numbers can be trusted (or not):

- Retriever choice was made on the **dev** queries only. The **held-out** queries were written and committed *before* any retrieval change, and scored once after the configuration was fixed.
- Selection was among 7 configurations on 40 queries, so dev numbers are optimistic. 95% intervals on any single recall figure here are roughly +/-15 points.
- Same author wrote the tools, the dev queries, and the held-out queries. Real catalogs will behave differently.

Known limitations:

- Dense and hybrid search always return `k` results, even for nonsense queries (BM25 returns nothing when no words match). There is no "no match" signal yet.
- `wordllama` 0.4.0 looks for its tokenizer in the wrong directory (`tokenizer/` vs the shipped `tokenizers/`); `dense.wordllama_embedder` works around it through the public `cache_dir` argument.
- Token counts are a chars/3.5 estimate, not the API's counter.

## Real MCP catalogs

`catalogs/` holds `tools/list` captured verbatim from 8 real servers (78 tools; provenance and licenses in `catalogs/README.md`). `queries/mcp-reference.jsonl` has 154 labeled queries for them: 77 user-style paraphrases and 77 agent-style intents. A label lists *every* tool that would do the job (8 queries have several), because real catalogs contain near-duplicates such as `read_file`/`read_text_file` or local `git_create_branch` vs GitHub's `create_branch`.

```bash
python -m toolslim --catalog catalogs --labels queries/mcp-reference.jsonl check   # validate + leakage lint
python -m toolslim --catalog catalogs --labels queries/mcp-reference.jsonl bench   # score retrievers
python scripts/capture_catalog.py --name time --out catalogs/time.json -- python3 -m mcp_server_time   # add a server
```

Use your own catalogs and labels the same way (format in `src/toolslim/labels.py`). `check` fails on unknown tool names and duplicates, and warns about untested tools and user-style queries that contain every word of the tool's name (those aren't paraphrases).

Retrieval, recall@5 (MRR), 77 queries per set. The retrievers were fixed on the synthetic data before these queries existed, the queries were written and committed before they were scored, and this set was scored once:

| retriever | user-style | agent-style |
|---|---:|---:|
| bm25 | 51% (0.38) | 99% (0.94) |
| dense | 73% (0.52) | 96% (0.93) |
| hybrid-rrf (the default at the time) | 69% (0.45) | 99% (0.95) |
| hybrid-minmax 1:1 | 77% (0.50) | 99% (0.96) |
| hybrid-minmax 1:2 | 78% (0.54) | 99% (0.96) |

What this says:

- **Embeddings help again** (BM25 51% -> dense 73%), matching the synthetic result (+20 to +26 points).
- **The default at the time did not win.** `hybrid-rrf` (69%) trailed plain dense and both min-max fusions (77-78%). I did not change it on the strength of that one set; the choice was made later by a fixed rule on all dev data pooled (below). With 77 queries and 8 variants, treat gaps under ~8 points as noise.
- **Agent-style queries are solved** (96-99%), as before. The author caveat still applies.
- **Failures are mostly domain-level, not near-misses**: for 16 of the 24 user-style misses the top result was from a different server than the right tool. Eight of the misses are the memory server, whose tools talk about a "knowledge graph" of "entities" and "observations" while people say "remember" and "forget". Tool descriptions written in the server's own jargon are hard to find from everyday words, which suggests index-side enrichment (usage hints or aliases per tool) as the next lever.
- **Asking for more results pays off on real catalogs**: recall@10 is 86% vs 69% at k=5 for the default (the synthetic set plateaued at ~80%). Each extra result costs roughly 40 tokens, so this is a cheap lever to evaluate properly.

### Choosing the default

The default retriever was chosen by `scripts/select_config.py`, whose rule was committed before it was run, using **dev data only** (the synthetic sets and `catalogs/` + `queries/mcp-reference.jsonl`; the fresh test set is never read, and a test checks that). Rule: among candidates whose agent-style recall@5 is within 2 points of the best, take those whose pooled user-style recall@5 is within one standard error of the best, and pick the simplest.

Pooled dev, 157 user-style and 117 agent-style queries (full output in `results/dev-selection.json`):

| retriever | user recall@5 | MRR | user recall@10 | agent recall@5 | eligible |
|---|---:|---:|---:|---:|:--:|
| bm25 | 48.4% | 0.34 | 60.5% | 99.1% | no |
| **dense** | 70.7% | 0.53 | 82.8% | 97.4% | **chosen** |
| dense+params | 72.0% | 0.55 | 82.2% | 99.1% | yes |
| hybrid-rrf | 70.7% | 0.45 | 81.5% | 99.1% | yes |
| hybrid-minmax 1:1 | 73.9% | 0.48 | 84.1% | 99.1% | yes |
| hybrid-rrf+params | 67.5% | 0.45 | 79.0% | 99.1% | no |
| hybrid-minmax+params 1:1 | 70.7% | 0.47 | 80.9% | 99.1% | yes |
| hybrid-minmax 1:2 | 73.2% | 0.51 | 84.7% | 99.1% | yes |

One standard error is 3.5 points here, so five candidates are statistically tied and the rule falls back to simplicity: no fusion. Things to know:

- Dense has the lowest agent-style recall of the eligible candidates (97.4% vs 99.1%, two queries). That passed the pre-set guard, but if real traffic is mostly model-written queries, a hybrid is marginally safer on this data.
- Nothing in the data tests identifier-style queries (exact names, IDs), where BM25 would matter; dense-only has no keyword path.
- The result count of `search_tools` (default 5) was not tuned: the model passes `limit` per call, and the best value depends on what an extra search turn costs, which dev data cannot measure. Recall@10 is shown for reference.

### Fresh test set, and what its schemas showed

`catalogs/test/` has 70 more tools from 5 servers in other domains (browser automation, SQLite, Slack, Notion, Google Maps), captured after the dev results. 140 labeled queries (`queries/mcp-test.jsonl`) were scored once (result below), so this set is now spent as a test. It existed so retriever choices can be confirmed on data they were not tuned on (details in `catalogs/README.md`). Token counts need no queries, and they exposed a problem the dev servers don't have:

| | tools | all schemas | slim L1 | slim L2 | slim L3 |
|---|---:|---:|---:|---:|---:|
| notion | 24 | 21,340 | -71.1% | -75.9% | -82.2% |
| playwright | 25 | 5,034 | -12.4% | -30.5% | -60.5% |
| other three | 21 | 2,018 | 0% | -2% | -29% |
| **all test tools** | 70 | 28,389 | -55.6% | -62.7% | -74.7% |

Notion's OpenAPI-derived tools average ~890 tokens each (the dev set averages ~160). **74% of their tokens were `$defs`, and 94% of those definitions were not referenced by the tool carrying them** (only 6 of its 24 tools use any): the same 9-definition block is copied into every tool. Before pruning, the slimmer saved only 5.7% on Notion at level 1; `prune_unused_defs` now makes that 71.1%, with no loss of meaning.

How it is verified: unit tests for cycles, transitive references, escaped names, both `$defs`/`definitions`, and the cases where it must back off; a test that inlines every `$ref` in the original and pruned schema of all 148 committed tools and requires identical results; and mutation checks showing that a pruner that drops everything, or ignores transitive references, fails those tests.

Caveats: the dev and synthetic catalogs contain no `$defs`, so their numbers did not change and the gain is demonstrated only on the test catalogs. The transform has no tuned parameters, but it was found by looking at the test catalogs' token counts. `describe_tool` on the largest Notion tools drops from 1,096-1,656 tokens to 406-991; the lazy gateway's fixed cost (190 tokens) is unchanged.

### Test-set result (scored once)

Protocol (`queries/README.md`): configuration fixed on dev data and committed first (`dense`, see above), then one run: `python -m toolslim --catalog catalogs/test --labels queries/mcp-test.jsonl bench` (raw output in `results/test-score.txt`). No labels or retrievers were changed afterwards.

**Pre-registered headline: `dense`, user-style recall@5 = 60% (42/70), MRR 0.44; agent-style 100%.** Other retrievers, for reference only (none of this selects anything):

| retriever | user-style recall@5 (MRR) | agent-style |
|---|---:|---:|
| bm25 | 50% (0.36) | 100% |
| **dense (default)** | **60% (0.44)** | 100% |
| dense+params | 67% (0.49) | 100% |
| hybrid-rrf | 66% (0.44) | 100% |
| hybrid-rrf+params | 67% (0.45) | 100% |
| hybrid-minmax 1:1 | 64% (0.40) | 100% |
| hybrid-minmax 1:2 | 66% (0.46) | 100% |
| hybrid-minmax+params 1:1 | 69% (0.44) | 100% |

What it says, and what it does not:

- **The dense default scored lower than on pooled dev data (60% vs 70.7%) and below most alternatives (64-69%).** With 70 queries the 95% interval on 60% is about +/-11 points, so neither gap is established. But the direction is worth noting: six of the seven alternatives beat dense here, and on dev five of those six were equal or slightly ahead (up to +3 points; `hybrid-rrf+params` was 3 behind). The one-standard-error rule chose the simplest option; this result suggests that was conservative and fusion may add a few points. Switching would be a new decision that needs fresh data, since this test set is now spent.
- **Embeddings still help, less than on dev.** BM25 stayed put (50% vs 48.4% on dev); dense's lead shrank from ~22 to 10 points.
- **Notion is where it fails**: 15 of 24 Notion queries missed (Playwright 8/25, Slack 2/8, SQLite 2/6, Maps 1/7). Its descriptions are terse ("Notion | Retrieve a page Error Responses: ...") and its tools are named `API-...`.
- **Cross-server confusion is the main failure mode**: in 20 of the 28 misses the top result came from a different server, e.g. Notion "table" queries returned SQLite's `create_table`/`describe_table`. In a lazy gateway fronting many servers, that is the realistic problem. A candidate fix is a free signal the gateway already knows: the server name (and a short server description) in each tool's index text. Not tried; it needs fresh data to evaluate.
- **Part of the miss rate is my labeling flaw.** Several Notion queries say "table" or "workspace" without naming Notion, so a SQLite or Slack tool was a plausible correct answer that the labels did not accept (for example `create_table` for "set up a brand new table for tracking customer feedback", `describe_table` for "what columns does the bug tracker table have", `read_query` for "show me every row in the tasks table where..."). Recall is therefore somewhat higher than 60%. I did not re-label: I noticed this while reading the misses, so any adjusted number would be biased upward.
- Recall@10 for dense is 69% (vs 60% at 5); recall@1 is 34%.

### Next batch (captured, unlabeled)

`catalogs/test2/` has 105 more tools from 6 servers (Kubernetes, Heroku, MongoDB, DynamoDB, Pinecone, Tavily), chosen to overlap in vocabulary because cross-server confusion was the main failure on the first test set. A draft of 210 labeled queries (`queries/mcp-test2.jsonl`, written by me, so not independent) is committed; it has not been scored. Token profile: 42,367 estimated tokens in total, but lossless slimming saves only 5.9% (level 3: 63%), since the weight is in long descriptions rather than schema scaffolding; the lazy gateway's fixed cost is still 190 tokens (99.6% less). Details and the rules for keeping it a clean test set are in `catalogs/README.md`. The first test set is spent and counts as dev data from now on.

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Have someone other than me review or replace `queries/mcp-test2.jsonl`, make any retriever or index decision (fusion, server names in the index) on dev data first, record it, then score `catalogs/test2` once.
2. Add the server name (and a short server description) to each tool's index text, to attack cross-server confusion; evaluate on the fresh batch, and on the dev sets as a no-regression check.
3. Index-side enrichment for jargon-heavy or terse tools (author-supplied `when to use` hints or generated aliases) and a "no match" threshold for dense search.
4. Query rewriting or reranking with a real model, to push past the retrieval ceiling.
5. Count tokens with the API's token counter instead of the estimate.
6. End-to-end eval with a real model: task success and total cost for full vs. slim vs. lazy (this also measures the retry cost of retrieval misses and the right default `limit`).
7. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
8. A proxy MCP server so any client can use the gateway unchanged.
