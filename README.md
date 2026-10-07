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

## Results so far (synthetic 40-tool catalog, estimated tokens)

| strategy | tokens/request | vs. full |
|---|---:|---:|
| all schemas, as published | 6,780 | |
| slimmed, level 1 (structural noise only) | 4,879 | 28% less |
| slimmed, level 2 (+ first-sentence descriptions) | 4,529 | 33% less |
| slimmed, level 3 (+ no param descriptions) | 3,322 | 51% less |
| lazy gateway, first request | 190 | 97% less |
| lazy gateway, after search + describe | 492 | 93% less |

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

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Run against real `tools/list` dumps (`--catalog`) with a labeled-queries file, so retrieval is measured on something I did not write.
2. Query rewriting or reranking with a real model, to push past the ~80% ceiling; add a "no match" threshold.
3. Count tokens with the API's token counter instead of the estimate.
4. End-to-end eval with a real model: task success and total cost for full vs. slim vs. lazy (this also measures the retry cost of retrieval misses).
5. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
6. A proxy MCP server so any client can use the gateway unchanged.
