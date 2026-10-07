# toolslim

Agents with many MCP tools pay for every tool schema on **every request**, whether or not the tool is used. `toolslim` measures that overhead and tests two ways to cut it:

1. **Slim** the schemas (`slim.py`): drop tokens the model doesn't need to call a tool.
2. **Load lazily** (`gateway.py`): replace the whole catalog with three meta-tools (`search_tools`, `describe_tool`, `call_tool`), so the model pays for a schema only when it needs one.

No dependencies; Python 3.10+.

```bash
export PYTHONPATH=src
python -m toolslim bench                       # token + retrieval benchmark
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
| lazy gateway, after search + describe | 428 | 94% less |

Slimming levels:

- **1**: lossless for tool calling (`title`, `$schema`, `examples`, `additionalProperties: false`).
- **2** and **3**: lossy. Not yet validated against real model behavior.

### Known weakness: retrieval

The lazy numbers are only worth anything if the model finds the right tool. Lexical BM25 on deliberately paraphrased queries ("cancel the Friday sync" -> `calendar_delete_event`) scores **recall@5 = 50%, MRR 0.34**. The benchmark prints every miss. Treat the 94-97% as an upper bound until retrieval improves.

Caveats on these numbers:

- The catalog and queries are synthetic and written by the same author (me), so they are not a benchmark of any real MCP server.
- Token counts are a chars/3.5 estimate, not the API's counter.
- In real use the *model* writes the search query, usually in tool-ish vocabulary, which should score better than user-style paraphrases. That is a hypothesis; measure it.

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Run against real `tools/list` dumps (`--catalog`); add a labeled-queries file so `bench` works on them.
2. Improve retrieval: embeddings or hybrid ranking, query rewriting, tool-usage examples in the index.
3. Count tokens with the API's token counter instead of the estimate.
4. End-to-end eval with a real model: task success and total cost for full vs. slim vs. lazy.
5. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
6. A proxy MCP server so any client can use the gateway unchanged.
