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
| lazy gateway, after search + describe | 494 (-93%) | 505 (-96%) | 547 (-98.1%), optimistic: 36% of user-style queries missed at k=5 |

How much slimming saves depends heavily on how a server generates its schemas: level 1 saves 11.5% on the dev servers but 55.6% on the test servers, almost entirely because Notion's generator attaches ~14k tokens of unused definitions to its tools (see below). The synthetic set overstated level 1 relative to the dev servers (28% vs 11.5%). Lazy loading's cost does not depend on the catalog.

Slimming levels:

- **1**: lossless for tool calling: `title`, `$schema`, `examples`, `additionalProperties: false`, and `$defs`/`definitions` entries that no `$ref` reaches (transitively; skipped when a schema uses `$anchor`/`$id`/`$dynamicRef`, which are not resolved).
- **2** and **3**: lossy. Not yet validated against real model behavior.

The lazy rows use the default retriever (`hybrid-rrf+server`: BM25 and embedding search fused, with each tool's server name in its index text; see "Choosing the default" below). They only hold if the model finds the right tool on the first search, so retrieval quality matters as much as the token numbers.

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
- **Fusion did not beat plain dense.** Hybrid won by 3 queries on dev but tied on held-out (and has a lower MRR). With 40 queries per set that gap is noise. Hybrid was the default when this was written; a pre-registered rule then picked plain dense (round 1), and a second round, after the second test batch, picked a hybrid with server names (see "Choosing the default, round 2").
- **Agent-style queries are easy.** Short intents like "refund a payment" hit 100% for every retriever, which supports the idea that model-written queries do better than user paraphrases. They were written by the same author who knows the tool names, so treat 100% as an upper bound, not a measurement.
- **A ceiling around 80%.** Recall barely moves from k=5 (78%) to k=10 (82%) on dev. What's left needs inference ("hand PLAT-77 over to Dana" means *assign*; "how many users signed up" means *run a SQL query*) that static word vectors can't do. Next lever: an LLM-written or rewritten query, or a reranker.

Method, so the numbers can be trusted (or not):

- Retriever choice was made on the **dev** queries only. The **held-out** queries were written and committed *before* any retrieval change, and scored once after the configuration was fixed.
- Selection was among 7 configurations on 40 queries, so dev numbers are optimistic. 95% intervals on any single recall figure here are roughly +/-15 points.
- Same author wrote the tools, the dev queries, and the held-out queries. Real catalogs will behave differently.

Known limitations:

- Dense and hybrid search always return `k` results, even for nonsense queries (BM25 returns nothing when no words match). There is no "no match" signal yet.
- `wordllama` 0.4.0 looks for its tokenizer in the wrong directory (`tokenizer/` vs the shipped `tokenizers/`); `dense.wordllama_embedder` works around it through the public `cache_dir` argument.
- The BM25 tokenizer splits camel-case brand names ("GitHub" -> `git hub`), so they never match the lowercase form in tool or server names (details under "Server names in the index"). It weakens the BM25 half of the default hybrid; the dense half is unaffected.
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

### Choosing the default (round 1, superseded by round 2 below)

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

### Server names in the index (dev experiment)

Idea: the failure analyses found cross-server confusion to be the main problem, and a gateway knows each tool's server for free, so put the server name into each tool's index text. The rule was committed before the run (`scripts/server_name_experiment.py`) and used dev data only, evaluated the way an agent would see it: all 13 real servers merged into one 148-tool catalog (plus the synthetic one). The untouched `catalogs/test2` batch was never read.

Result on pooled user-style queries (227), recall@5 (full output: `results/server-name-dev.json`):

| | without server name | with server name |
|---|---:|---:|
| bm25 | 45.4% | 46.3% |
| **dense (default)** | **64.3%** | **66.1%** |
| hybrid-rrf | 64.3% | 66.5% |

The pre-registered rule for adopting `dense+server` needs the paired gain (queries gained minus lost) to clear 2 standard errors. It gained 7 queries and lost 3: net +4, needed +6.3. **Decision at the time: keep `dense` (round 2 later moved the default).** The direction is mildly positive in all three comparisons (net +4, +2, +5), so this is "not shown", not "shown not to work".

Why the gain is so small (exploratory and post hoc, `scripts/server_name_analysis.py`, `results/server-name-analysis.json`):

- **Cross-server confusion is real**: in the merged catalog, 41 of dense's 56 user-style misses have a top result from a different server, and merging costs dense about 4-5 points (72.7% alone -> 67.5% merged on the dev queries, 60.0% -> 55.7% on the spent test queries).
- **But the queries rarely carry the server name** that the feature could match: only 16 of 147 user-style queries (11%) mention their server, and for those the feature helped once and hurt never; for the other 131 the effect is +5/-3, i.e. noise. The confusion is semantic ("a new table" fits SQLite and Notion alike), and a server label does not resolve it unless the query says which one.
- **The label sets differ sharply in this respect**: user-style queries that name their server are 19% in `mcp-reference`, 1% in `mcp-test`, and 73% in `mcp-test2` (agent-style: 22%, 16%, 89%). So dev data can barely exercise this feature, while the next batch is far more favorable to it, because I wrote it after learning that lesson. Whether real users or models name the service as often is unknown; a good result on `mcp-test2` would partly reflect how I wrote the queries, not just the feature.
- The idea came from these same failures, so even a positive dev result would have earned a confirmation run, not adoption.

A limitation found along the way: the BM25 tokenizer splits camel-case brand names, so "GitHub" becomes `git hub` and never matches the lowercase `github` in tool or server names (same for MongoDB, DynamoDB, PostgreSQL). It does not affect the dense part of any retriever, but it weakens the BM25 half of every hybrid, including the current default, and the `+server` variants above. There is an expected-failure test for it; fixing it would shift recorded BM25 baselines, so it is left for a deliberate follow-up.

### Second test result (scored once)

Protocol (`queries/README.md`, `scripts/score_test2.py`, committed before the run): headline `dense`, the recorded default; `dense+server` declared as a second, paired comparison with nothing decided from it; one run, no edits afterwards. Raw output: `results/test2-score.txt`.

105 user-style and 105 agent-style queries over 105 tools / 6 servers; recall@5 with 95% intervals:

| retriever | user-style | MRR | recall@10 | agent-style |
|---|---:|---:|---:|---:|
| bm25 | 68.6% [59, 77] | 0.55 | 81.0% | 100% |
| **dense (headline)** | **66.7% [57, 75]** | 0.50 | 79.0% | **90.5%** |
| dense+server (declared second) | 76.2% [67, 83] | 0.58 | 84.8% | 97.1% |
| hybrid-rrf | 73.3% [64, 81] | 0.56 | 80.0% | 98.1% |
| hybrid-rrf+server | 75.2% [66, 83] | 0.62 | 88.6% | 98.1% |

What it says:

- **The headline matches dev** (66.7% vs 64.3% merged / 70.7% pooled), so the dense default did not collapse. But it is not the best option here, and its agent-style recall of 90.5% is the lowest of any set so far (BM25 missed none; dense missed 10 of 105). The earlier note that dense was weakest on agent-style queries, and that a hybrid would be safer if real traffic is mostly model-written, turned out to matter.
- **The server name in the index text helped a lot, on a batch whose queries name their service.** Paired, `dense+server` vs `dense`: user-style gained 10 and lost 0, agent-style gained 7 and lost 0, and both clear the 2-SE bar the dev rule used. On dev data the same switch was +4 net and unprovable, because only 11% of those queries named their server; here 73% (user-style) and 89% (agent-style) do. That is partly a fact about how I wrote these queries, so the size of the gain should not be assumed for real traffic.
- **The mechanism is visible in the misses.** Six of dense's ten agent-style misses are Heroku, and their top results are mostly the same few tools (`deploy_to_heroku`, `list_apps`, `maintenance_on`, the `ps_*` tools). Only 11 of Heroku's 33 tools say "Heroku" anywhere in their name or description (15 of MongoDB's 27 mention MongoDB), so a query containing the service name is pulled towards that lopsided subset whatever action it asks for. Putting the server name into every tool's text removes the asymmetry. After it, 7 of those 10 agent-style misses are found in the top 5.
- **The failure mode changed.** In the dev and first test sets, most misses (41/56, 20/28) had a top result from a different server. Here only 5 of the 35 dense user-style misses did: when queries name their service the problem moves *within* a server. Heroku (15 of 33) and MongoDB (13 of 27) account for 28 of the 35 misses; Tavily and Pinecone are nearly perfect.
- **Differences to read carefully.** With 105 queries, a 95% interval is about +/-9 points, so dense, BM25 and hybrid-rrf are not separable on user-style queries. The paired `+server` result is the only comparison here that is statistically clear. No label was found to be objectively wrong, and none was changed.

Consequences, stated as a decision for a new round and not something this run settles: the scoring protocol attached no default change to this comparison, and none was made. The evidence for putting the server name in the index text is now consistent in direction (dev: net positive for dense, BM25 and hybrid, never negative; this batch: strongly positive), but the strong part comes from a label set that mostly names its service, and this batch is now spent. Adopting it, and switching the default away from plain `dense` toward `dense+server` or a hybrid, should be tested on fresh data, ideally with queries written by someone else.

### Choosing the default, round 2

Why again: on the second test batch the round-1 default (`dense`) had the lowest agent-style recall of any set (90.5%, BM25 100%), and putting the server name in the index text helped a lot. Round 1's rule had counted user-style queries only, with a loose 2-point agent-style guard. `scripts/select_default_v2.py` (committed before it was run; `results/dev-selection-v2.json`) pools **all dev data**, which now includes both spent batches: the synthetic set plus dev, first test and second test merged into one **253-tool, 19-server catalog**, 624 queries (332 user-style, 292 agent-style). Both styles count, with a strict 1-point agent-style guard; ties are resolved by a paired sign test and then simplicity; and a switch away from `dense` must be significant in a paired test and leave no source more than 2 points worse.

Disclosed: the rule was written after seeing the second batch's headline numbers, so it is not blind. The third batch is the confirmation.

Pooled recall@5 (all / user-style / agent-style) and "all" by source:

| candidate | all | user | agent | synthetic | dev | spent test | test2 | |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| bm25 | 74.0% | 51.5% | 99.7% | 64.2% | 72.1% | 70.0% | 83.8% | |
| bm25+server | 74.7% | 52.7% | 99.7% | 64.2% | 72.7% | 70.0% | 85.2% | |
| dense (round-1 default) | 77.2% | 62.0% | 94.5% | 79.2% | 79.2% | 73.6% | 77.1% | fails agent guard |
| dense+server | 81.2% | 67.5% | 96.9% | 80.0% | 81.8% | 75.7% | 85.2% | fails agent guard |
| hybrid-rrf | 80.6% | 64.8% | 98.6% | 81.7% | 80.5% | 76.4% | 82.9% | misses guard by 0.03 pt |
| **hybrid-rrf+server** | **81.4%** | 66.0% | 99.0% | 80.8% | 81.8% | 77.9% | 83.8% | **chosen** |
| hybrid-minmax 1:1 | 81.1% | 65.4% | 99.0% | 80.8% | 80.5% | 76.4% | 84.8% | |
| hybrid-minmax 1:1+server | 82.5% | 67.8% | 99.3% | 80.0% | 83.8% | 77.9% | 86.2% | best, tied with the chosen one |

The best-scoring eligible candidate is `hybrid-minmax 1:1+server`; it is not significantly better than `hybrid-rrf+server` (net +7, bar 9.2), so the simpler one is chosen. Against `dense` the chosen candidate gained 45 queries and lost 19 (net +26, bar +16), and the worst source is still +1.7 points ahead of `dense`. **Decision: adopt `hybrid-rrf+server` as the default** (`config.DEFAULT_RETRIEVER`; `toolslim.retrievers.build_retriever` builds any named variant).

What the evidence supports, from a post-hoc check on the same data (`scripts/select_default_v2_analysis.py`, `results/dev-selection-v2-analysis.txt`; paired gained/lost, all queries):

| change | gained / lost | clears 2 SE? |
|---|---|:--:|
| `dense` -> `hybrid-rrf` (fuse BM25 in) | 40 / 19 (agent-style 12 / 0) | yes |
| `hybrid-rrf` -> `hybrid-rrf+server` | 11 / 6 | no |
| `dense` -> `dense+server` | 28 / 3 | yes |
| `bm25` -> `bm25+server` | 5 / 1 | no |
| `dense` -> `hybrid-rrf+server` (the adopted change) | 45 / 19 | yes |

- **Most of the gain is the fusion.** Bringing BM25 in repairs the agent-style weakness of embeddings (12 gained, 0 lost) and is significant on its own.
- **The server name is a small, not significant extra once BM25 is in** (+5 net on top of the hybrid), although it is a large, significant gain for plain `dense`. `+server` is in the chosen candidate partly because plain `hybrid-rrf` missed the agent-style guard by 0.03 of a point; with a slightly looser guard the rule would have chosen the simpler `hybrid-rrf`. I did not move the threshold.
- Merging servers into one catalog is what makes the server name matter at all; and these dev sets name their service in 19% (dev), 1% (spent test) and 73% (test2) of user-style queries, so the server-name effect depends on how queries are phrased.
- The BM25 half of the default still has the camel-case tokenizer limitation (see Known limitations).

Confirmation plan for the third batch, declared now: when `catalogs/test3` is labeled and scored once, the headline is `hybrid-rrf+server` (the default), with two pre-declared comparisons, each reported with its paired counts and nothing decided from them: against `dense` (the old default) and against `hybrid-rrf` (does the server name matter on top of fusion?).

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

`catalogs/test2/` has 105 more tools from 6 servers (Kubernetes, Heroku, MongoDB, DynamoDB, Pinecone, Tavily), chosen to overlap in vocabulary because cross-server confusion was the main failure on the first test set. 210 labeled queries (`queries/mcp-test2.jsonl`, written by me, so not independent) were scored once; the result is in "Second test result" below, so this batch is spent too. Token profile: 42,367 estimated tokens in total, but lossless slimming saves only 5.9% (level 3: 63%), since the weight is in long descriptions rather than schema scaffolding; the lazy gateway's fixed cost is still 190 tokens (99.6% less). Details and the rules for keeping it a clean test set are in `catalogs/README.md`. The first test set is spent and counts as dev data from now on.

### Third batch (captured, unlabeled)

`catalogs/test3/` has 189 more tools from 6 servers (Excel, Word, PowerPoint, Redis, Obsidian, Docker), chosen for heavy internal overlap and a spread of naming styles (some servers' tools nearly always say the server's name, others almost never). It has no labels and has not been scored. Estimated 35,694 tokens in total (level-1 slimming -12.0%, level 3 -43.8%, lazy gateway 190 tokens, 99.5% less). Because Word and PowerPoint both define `add_table`, loading it needs `--on-duplicate namespace`, which renames only the colliding tools. Details and the rules for keeping it a clean test set are in `catalogs/README.md`.

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Label `catalogs/test3` (189 tools; ideally someone other than me, naming the service or listing every acceptable tool; the two `add_table` tools need namespaced names), commit the labels, then score it once under the confirmation plan in "Choosing the default, round 2".
2. Find out how often real users and real model-written search queries name the service (it decides how much the server name is worth); this needs real traffic or an end-to-end eval.
3. Fix the BM25 camel-case tokenizer and re-run the comparisons (BM25 and the BM25 half of the hybrids shift; dense does not).
4. Index-side enrichment for jargon-heavy or terse tools (author-supplied `when to use` hints, server descriptions from the MCP `instructions` field) and a "no match" threshold for dense search.
5. Query rewriting or reranking with a real model, to push past the retrieval ceiling.
6. Count tokens with the API's token counter instead of the estimate.
7. End-to-end eval with a real model: task success and total cost for full vs. slim vs. lazy (this also measures the retry cost of retrieval misses and the right default `limit`).
8. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
9. A proxy MCP server so any client can use the gateway unchanged.
