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

| strategy | synthetic, 40 tools | real MCP servers, 78 tools |
|---|---:|---:|
| all schemas, as published | 6,780 | 12,514 |
| slimmed, level 1 (structural noise only) | 4,879 (-28%) | 11,076 (-11.5%) |
| slimmed, level 2 (+ first-sentence descriptions) | 4,529 (-33%) | 8,905 (-29%) |
| slimmed, level 3 (+ no param descriptions) | 3,322 (-51%) | 6,617 (-47%) |
| lazy gateway, first request | 190 (-97%) | 190 (-98.5%) |
| lazy gateway, after search + describe | 492 (-93%) | 506 (-96%) |

My synthetic schemas were noisier than real ones, so they overstated level-1 slimming (28% vs 11.5% on real servers). Trust the right-hand column.

Slimming levels:

- **1**: lossless for tool calling (`title`, `$schema`, `examples`, `additionalProperties: false`).
- **2** and **3**: lossy. Not yet validated against real model behavior.

The lazy rows use the hybrid retriever below. They only hold if the model finds the right tool on the first search, so retrieval quality matters as much as the token numbers.

## Retrieval

The first version used lexical BM25 only and found the right tool in the top 5 for just 50% of paraphrased queries. Retrievers compared, recall@5 (MRR), 40 queries per set:

| retriever | dev | held-out, user-style | held-out, agent-style |
|---|---:|---:|---:|
| bm25 | 50% (0.34) | 42% (0.22) | 100% (0.98) |
| dense (`wordllama` embeddings) | 70% (0.54) | 68% (0.45) | 100% (0.98) |
| **hybrid-rrf** (BM25 + dense, reciprocal rank fusion, default) | 78% (0.49) | 68% (0.35) | 100% (1.00) |

Seven variants in total are in `python -m toolslim bench --sets all`.

How to read this:

- **Embeddings are the real gain.** BM25 -> dense is +20 points on dev and +26 on held-out user-style queries; the effect shows up in both sets.
- **Fusion did not beat plain dense.** Hybrid won by 3 queries on dev but tied on held-out (and has a lower MRR). With 40 queries per set that gap is noise. Hybrid stays the default because it was chosen on dev before the held-out run, and it keeps exact-keyword matching for identifiers; plain dense is an equally good, simpler choice on this data.
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
| hybrid-rrf (default) | 69% (0.45) | 99% (0.95) |
| hybrid-minmax 1:1 | 77% (0.50) | 99% (0.96) |
| hybrid-minmax 1:2 | 78% (0.54) | 99% (0.96) |

What this says:

- **Embeddings help again** (BM25 51% -> dense 73%), matching the synthetic result (+20 to +26 points).
- **The default did not win.** `hybrid-rrf` (69%) trailed plain dense and both min-max fusions (77-78%). I did not change the default, because switching on the strength of the test set would make it a tuning set. Min-max fusion now looks better on two independent sets; deciding that properly needs fresh queries (see next steps). With 77 queries and 8 variants, treat gaps under ~8 points as noise.
- **Agent-style queries are solved** (96-99%), as before. The author caveat still applies.
- **Failures are mostly domain-level, not near-misses**: for 16 of the 24 user-style misses the top result was from a different server than the right tool. Eight of the misses are the memory server, whose tools talk about a "knowledge graph" of "entities" and "observations" while people say "remember" and "forget". Tool descriptions written in the server's own jargon are hard to find from everyday words, which suggests index-side enrichment (usage hints or aliases per tool) as the next lever.
- **Asking for more results pays off on real catalogs**: recall@10 is 86% vs 69% at k=5 for the default (the synthetic set plateaued at ~80%). Each extra result costs roughly 40 tokens, so this is a cheap lever to evaluate properly.

### Fresh test set, and what its schemas show

`catalogs/test/` has 70 more tools from 5 servers in other domains (browser automation, SQLite, Slack, Notion, Google Maps), captured after the dev results and not yet labeled. It exists so retriever choices can be confirmed on data they were not tuned on (details in `catalogs/README.md`). One thing is already visible from token counts alone (no queries involved):

| | tools | all schemas | slim L1 | slim L2 | slim L3 |
|---|---:|---:|---:|---:|---:|
| notion | 24 | 21,340 | -5.7% | -10.6% | -16.8% |
| playwright | 25 | 5,034 | -12.4% | -30.5% | -60.5% |
| other three | 21 | 2,018 | 0% | -2% | -29% |
| **all test tools** | 70 | 28,389 | -6.5% | -13.6% | -25.6% |

Notion's OpenAPI-derived tools average ~890 tokens each (the dev set averages ~160), and the slimmer barely touches them. The reason: **74% of Notion's tokens are `$defs`, and 94% of those definitions are not referenced by the tool that carries them** (only 6 of its 24 tools use any). The same 9-definition block is copied into every tool. Pruning unreferenced `$defs` would be lossless and is the obvious next slimming lever; the lazy gateway is unaffected (190 tokens either way), though `describe_tool` on such a tool is expensive.

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Label `catalogs/test/` (ideally someone other than the person who tuned the retrievers), decide fusion (RRF vs min-max) and result count on the dev data, then score the test set once.
2. Slimming level 0.5: prune `$defs` that no `$ref` reaches (lossless; ~64% of Notion's tokens).
3. Index-side enrichment for jargon-heavy tools (author-supplied `when to use` hints or generated aliases) and a "no match" threshold for dense search.
4. Query rewriting or reranking with a real model, to push past the retrieval ceiling.
5. Count tokens with the API's token counter instead of the estimate.
6. End-to-end eval with a real model: task success and total cost for full vs. slim vs. lazy (this also measures the retry cost of retrieval misses).
7. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
8. A proxy MCP server so any client can use the gateway unchanged.
