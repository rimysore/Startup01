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
- The BM25 tokenizer splits camel-case brand names ("GitHub" -> `git hub`), so they never match the lowercase form in tool or server names (details under "Server names in the index"). A fix exists as an option (`camel_join=True`) but was not adopted: it changed the outcome of 3 of 1,002 queries for BM25 and 1 for the default hybrid (see "Tokenizer and hub experiment"). It weakens the BM25 half of the default hybrid; the dense half is unaffected.
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

Confirmation plan for the third batch, declared before the run (its result is in "Third test result" below): when `catalogs/test3` was labeled and scored once, the headline is `hybrid-rrf+server` (the default), with two pre-declared comparisons, each reported with its paired counts and nothing decided from them: against `dense` (the old default) and against `hybrid-rrf` (does the server name matter on top of fusion?).

### Third test result (confirmation, scored once)

Protocol (`scripts/score_test3.py`, committed before the run, with the reading declared in its docstring): headline `hybrid-rrf+server`, the round-2 default; paired comparisons C1 against `dense` and C2 against `hybrid-rrf`; the adoption counts as **confirmed** only if C1 on all queries clears the 2-SE bar *and* the headline's agent-style recall is within 1 point of the best candidate's. One run, no edits afterwards. Raw output: `results/test3-score.txt`.

189 user-style and 189 agent-style queries over 189 tools / 6 servers (loaded with the `add_table` namespacing); recall@5 with 95% intervals:

| retriever | user-style | MRR | recall@10 | agent-style | all |
|---|---:|---:|---:|---:|---:|
| bm25 | 73.0% [66, 79] | 0.56 | 79.4% | 99.5% | 86.2% |
| dense (old default, C1) | 69.3% [62, 75] | 0.54 | 78.3% | 95.2% | 82.3% |
| bm25+server | 73.0% [66, 79] | 0.58 | 81.5% | 99.5% | 86.2% |
| dense+server | 72.0% [65, 78] | 0.56 | 78.8% | 94.7% | 83.3% |
| hybrid-rrf (C2) | 73.0% [66, 79] | 0.58 | 83.1% | 97.9% | 85.4% |
| **hybrid-rrf+server (headline)** | **74.6% [68, 80]** | 0.59 | 84.7% | **98.4%** | 86.5% |
| hybrid-minmax 1:1 | 76.7% [70, 82] | 0.60 | 84.7% | 98.9% | 87.8% |
| hybrid-minmax 1:1+server | 78.8% [72, 84] | 0.63 | 86.2% | 98.4% | 88.6% |

Declared comparisons (paired, gained / lost): C1 `hybrid-rrf+server` vs `dense`: user-style 19 / 9 (net +10, bar 10.6: does not clear), agent-style 6 / 0 (net +6, bar 4.9: clears), **all 25 / 9 (net +16, bar 11.7: clears)**. C2 vs `hybrid-rrf`: user-style 6 / 3, agent-style 1 / 0, all 7 / 3 (net +4, bar 6.3: does not clear).

**Declared reading: NOT CONFIRMED.** Condition (a) passes. Condition (b) fails narrowly: the headline's agent-style recall is 98.4% (3 misses) against 99.5% for BM25 (1 miss), a gap of 1.06 points against the 1.00 allowed, i.e. two queries. The threshold was not moved. The default is not changed by this run, and a new decision would need a new round.

How to read it:

- **The fusion gain over `dense` held up on fresh data.** On all queries the adopted candidate beats the old default by 25 gained to 9 lost, and agent-style by 6 to 0. That part of the round-2 decision replicated.
- **The server name is again a small, unproven extra on top of fusion** (net +4, not significant), as on the dev data in round 2. It was never the strong part of the evidence.
- **BM25 alone is a strong baseline here**: 86.2% on all queries against 86.5% for the headline, and the best agent-style recall (99.5%). The same held on the second batch (BM25 100% agent-style) and on pooled dev (99.7%). Across batches, BM25's user-style recall was 51%, 50%, 69%, 73% (dev, first, second, third batch, each on its own catalog) while dense's was 73%, 60%, 67%, 69%: the embedding advantage that looked large on the dev set shrank to nothing on later batches. In the same order, the share of words that user-style queries have in common with their tool's name rose (0.14, 0.13, 0.20, 0.25), so part of this is likely the labels becoming less paraphrased over time, not retrieval getting worse. That is a confound I cannot separate here.
- **The best-scoring candidate nominally was `hybrid-minmax 1:1+server`** (88.6% on all queries), but nothing here supports switching to it: it was not the pre-declared headline, and it was among the candidates the round-2 rule found statistically tied.
- **The agent-style guard is a knife-edge for the second time** (round 2: plain hybrid-rrf missed it by 0.03 points; now the headline misses it by 0.06). A fixed 1-point guard on ~190 queries is a two-query rule; a future rule should use a paired test for the guard too.
- **Misses (48 user-style, 3 agent-style)**: PowerPoint 13/37, Word 10/54, Redis 9/53, Excel 8/26, Obsidian 8/15, Docker 0/4; only 13 of the 48 have a top result from another server. Looking at them (descriptive, after the fact), the failures look like hub words rather than missing vocabulary: queries containing "slide" return `add_slide`, `get_slide_info`, `extract_slide_text`; "workbook"/"spreadsheet" return `describe_workbook`, `export_workbook`, `import_workbook`; Redis "queue list" queries drift to `list-containers` and `list_presentations`; Obsidian "note" queries return the periodic-note tools. Redis queries that never say "Redis" (lpush, rpush, lrange, llen, sadd, srem) are hard for both halves of the hybrid.
- **Caveats unchanged**: the labels were drafted by the retriever's author, and 97% of the agent-style queries (32% of user-style) name their service, which favors the server name in the index text. With 189 queries a 95% interval is about +/-6 points, so most differences between the top candidates are not established.

### Tokenizer and hub experiment (dev data, leave-one-batch-out)

Two problems the third batch's misses suggested: the BM25 tokenizer splits camel-case brand names ("GitHub" -> `git hub`, which never matches the lowercase `github` in tool and server names), and a few generic tools ("hubs") that win queries they should not. `scripts/hub_tokenizer_experiment.py` fixed both decision rules in advance (committed before the run, thresholds mutation-checked) and `results/hub-tokenizer.json` holds the output. All four batches are dev data and no untouched batch exists, so the design is not blind and adoption would have rested on a leave-one-batch-out estimate; each source is scored against its own catalog (1,002 queries in all).

**Part 1, tokenizer fix** (camel-case words also yield their joined form; judged on "no harm", since it is a bug fix). Legacy -> fixed, queries gained / lost over all sources:

| retriever | gained / lost | worst source |
|---|---|---|
| `bm25+server` | 3 / 0 | +0.0 |
| `hybrid-rrf+server` (the default) | 0 / 1 | -0.5 points (test2) |

Rule: adopt only if neither retriever loses. The hybrid lost one query, so **the legacy tokenizer stays the default**; the fix is available as `ToolIndex(camel_join=True)` / `tokenize(join_camel=True)`. The bug is real but its effect on these query sets is a handful of queries out of 1,002, so it was never a major source of misses.

**Part 2, hubs.** Two knobs on the default hybrid: a hubness correction on the dense half (`DenseIndex(hub_lambda=...)`, which lowers the score of tools that sit close to many other tools, in the spirit of CSLS) and BM25's length normalization `b` (short generic tools gain from it). Pooled recall@5 over all 1,002 queries; the baseline is today's default (lambda 0, b 0.75):

| lambda | b | all | synthetic | dev | spent test | test2 | test3 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.75 | 85.0% | 80.8% | 85.1% | 82.1% | 86.7% | 86.5% |
| 0 | 0.1 | 85.3% | 80.8% | 84.4% | 82.1% | 86.7% | 87.6% |
| 0.25 | 0.1 | 85.3% | 81.7% | 82.5% | 80.7% | 88.6% | 87.6% |
| 0.5 | 0.75 | 84.4% | 81.7% | 78.6% | 78.6% | 90.0% | 86.8% |
| 1.0 | 0.75 | 83.1% | 77.5% | 77.3% | 75.7% | 89.5% | 86.5% |

(All 12 configurations are in the JSON.) The hubness correction helps the second batch (86.7% -> 90.0% at lambda 0.5) and hurts the dev and first test batches (85.1% -> 78.6% and 82.1% -> 78.6%): it moves different sources in opposite directions. Leave-one-batch-out, choosing the configuration without the held-out source and scoring it there, gave pooled **6 queries gained and 12 lost** against the baseline (needs gained - lost >= 8.5, and no source worse by more than 2 points); the dev fold was 2.6 points worse, the first test fold 1.4 worse. **Decision: keep the baseline.** Length normalization alone moves nothing (best 85.3% vs 85.0%).

What this says:

- **Neither fix earns a place.** The tokenizer bug is real and tiny; the hubness correction does not generalize across batches.
- **The "few hub tools cause the misses" picture is not borne out as a main cause.** Counting wrong top-5 slots, each source's 8 most frequent wrong tools hold only 13-31% of them, and the top ones differ by source (dev: `get_issue`, `get_pull_request`, `create_branch`; first test: `browser_find`, `API-retrieve-page-markdown`; second: `maintenance_on`, `list_apps`, `count`, `find`; third: `get_paragraph_text_from_document`, `add_slide`, `get_document_text`). Many are legitimate neighbors of the right tool, not generic noise, which a global penalty cannot tell apart. The correction helped where a server's tools share generic verbs (the second batch) and hurt where tools have close, natural neighbors (the GitHub pull-request family, Notion); that explanation is plausible but not tested here.
- **The remaining misses look like wording gaps, not scoring artifacts**: "draw a rounded rectangle" versus a tool described as "add an auto shape", "queue list" versus "Redis list". That points at the tool text and the query (enrichment, rewriting by a model), not at the ranking formula.

### Independent labels (scored once)

Every query set above was written by the same author who built and tuned the retrievers. `queries/independent/` holds labels for all four real-server batches written by four fresh subagent instances that saw only the tool lists and the labeling guidelines (`scripts/make_label_kit.py` builds that blind kit; a test checks it contains no retrieval code, earlier queries or results): 884 queries, one user-style and one agent-style per tool. I did not edit any of them (checksums in `queries/independent/MANIFEST.sha256`), and they pass the repo's own validator. Details, the differences from my labels, and the limits are in `queries/independent/README.md`:

- Their user-style queries share more words with tool names (0.28-0.39 against 0.13-0.25 for mine), accept fewer alternative tools, and name the service in different proportions (third batch, agent-style: 20% against my 97%).
- They are another instance of the same model family, not human users, and the tools are the ones already used to design the retrievers. These are independent labels on dev data, not a fresh confirmation set.

**Protocol** (`scripts/score_independent.py`, committed in `ff7a225` before it was run on these labels; only dry-run on my own labels): headline `hybrid-rrf+server`, the configured default; five declared paired comparisons (C1 vs `dense`, C2 vs `bm25`, C3 vs `hybrid-rrf`, C4 `bm25` vs `dense`, C5 `dense+server` vs `dense`); two declared readings. **R1**: the label author does not change the conclusions iff the Spearman correlation, over the eight candidates, between pooled recall@5 on my labels and on the independent ones is at least 0.8. **R2**: the round-2 adoption is *supported* iff C1 on all queries clears the 2-SE bar and the default's agent-style recall is within 1 point of the best. One run, no edits afterwards; nothing here changes the default. Raw output: `results/independent-score.txt` / `.json`.

442 user-style and 442 agent-style queries over the four batches (each scored on its own catalog), recall@5 with 95% intervals:

| retriever | user-style | MRR | recall@10 | agent-style | all |
|---|---:|---:|---:|---:|---:|
| bm25 | 80.8% [77, 84] | 0.65 | 86.4% | 98.6% | 89.7% |
| dense | 79.6% [76, 83] | 0.63 | 88.0% | 93.9% | 86.8% |
| bm25+server | 81.9% [78, 85] | 0.66 | 87.6% | 98.6% | 90.3% |
| dense+server | 79.9% [76, 83] | 0.66 | 89.8% | 96.2% | 88.0% |
| hybrid-rrf | 84.8% [81, 88] | 0.69 | 91.2% | 98.0% | 91.4% |
| **hybrid-rrf+server (headline)** | **86.0% [82, 89]** | 0.69 | 93.0% | **98.2%** | 92.1% |
| hybrid-minmax 1:1 | 85.1% [81, 88] | 0.69 | 91.0% | 98.9% | 92.0% |
| hybrid-minmax 1:1+server | 86.2% [83, 89] | 0.70 | 92.3% | 99.1% | 92.6% |

Declared comparisons (paired, gained / lost; "clears" = g > l and g - l >= 2*sqrt(g + l)):

| | user-style | agent-style | all |
|---|---|---|---|
| C1 headline vs `dense` | 39 / 11, clears | 19 / 0, clears | **58 / 11, clears** |
| C2 headline vs `bm25` | 31 / 8, clears | 3 / 5, no | **34 / 13, clears** |
| C3 headline vs `hybrid-rrf` | 9 / 4, no | 2 / 1, no | 11 / 5, no |
| C4 `bm25` vs `dense` | 41 / 36, no | 24 / 3, clears | 65 / 39, clears |
| C5 `dense+server` vs `dense` | 12 / 11, no | 14 / 4, clears | 26 / 15, no |

**Declared readings.** R1: rho = 0.90, so the conclusions did not depend on who wrote the labels (by this rule). R2: C1 on all queries clears (58 / 11), and the headline's agent-style recall is 98.2% against 99.1% for the best (within 1 point): the round-2 adoption is **supported**. The default is not changed.

How to read it:

- **Everything scores higher on the independent labels** (+3 to +8 points on all queries, e.g. 82.0% to 89.7% for BM25). The independent user-style queries share more words with tool names, which is the easier setting, so absolute numbers are not comparable between the two label sets. The ordering of the candidates is mostly the same (rho = 0.90), but there are swaps: `dense+server` fell from above both BM25 variants to below them, and `hybrid-rrf+server` moved ahead of plain `hybrid-minmax 1:1` (92.1% against 92.0%: a tie in practice).
- **Fusion is the part that holds up.** The hybrid beats `dense` and also beats `bm25` on user-style queries (31 / 8), so it is not just BM25 with extras. With these labels neither single retriever has a clear user-style advantage over the other (C4: 41 / 36), while BM25 is clearly ahead on agent-style queries (24 / 3).
- **The server name is a small extra that does not clear, again.** On top of fusion it is 11 / 5 (C3), as in round 2 and on the third batch. On plain `dense` the user-style effect that motivated the idea in the dev experiment all but disappears (12 / 11, C5); only the agent-style gain remains (14 / 4). Why is untested. One possible reason is that in two batches the independent user-style queries name the service far more often than mine (first batch 54% against 1%, third 58% against 32%), which would leave less for the index text to add; in the second batch they name it less (34% against 73%), so this cannot be the whole story, and I did not test it. So the evidence for putting the server name in the index text is weaker than the round-2 adoption suggested, although including it does no harm here.
- **Where the headline's misses are (descriptive, after the fact):** 62 user-style misses and 8 agent-style. By server: Excel 8/26, Obsidian 6/15, PowerPoint 6/37, Word 5/54; 4 each for Filesystem, Heroku, Kubernetes, Memory, Notion and Redis; 3 each for Git, GitHub, MongoDB and Playwright; 1 for Google Maps; none for Docker, DynamoDB, Everything, Pinecone, Slack, SQLite, Tavily and the smaller servers.
- **Overlap with the tool name matters a lot (descriptive):** user-style recall for BM25 / dense / headline is 62% / 69% / 72% when the query shares no word with the tool's name (165 queries), 81% / 71% / 88% with some overlap (80), and 96% / 92% / 97% with half or more (197). Dense is better than BM25 only when there is no overlap, which fits the earlier suspicion that the embedding advantage depends on how paraphrased the queries are. It does not prove it.
- **Limits.** Same-model-family authors, not people; the catalogs are the four batches used to tune the retrievers; the scored "all" mixes user- and agent-style queries equally; and with 442 queries per style a 95% interval is about +/-3 points, so differences among the top four candidates are within noise. A fifth batch with independent labels (Next steps) remains the real test.

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

### Third batch (captured, labeled, scored once)

`catalogs/test3/` has 189 more tools from 6 servers (Excel, Word, PowerPoint, Redis, Obsidian, Docker), chosen for heavy internal overlap and a spread of naming styles (some servers' tools nearly always say the server's name, others almost never). 378 labeled queries (`queries/mcp-test3.jsonl`, written by me, so not independent; 97% of the agent-style ones name their service) were scored once as the confirmation batch; the result is in "Third test result" above, so this batch is spent too. Estimated 35,694 tokens in total (level-1 slimming -12.0%, level 3 -43.8%, lazy gateway 190 tokens, 99.5% less). Because Word and PowerPoint both define `add_table`, loading it needs `--on-duplicate namespace`, which renames only the colliding tools. Details and the rules for keeping it a clean test set are in `catalogs/README.md`.

### Fifth batch (captured, unlabeled, untouched)

`catalogs/test4/` has 213 tools from 6 servers (GitLab with 118 tools, Mapbox, Firecrawl, Desktop Commander, Puppeteer, Todoist), captured after the independent-label run so the next decision is not made on spent data. No labels exist yet and nothing has been tuned against it. It is the largest catalog so far (96,454 estimated tokens; lossless slimming saves 2.2%, level 3 66.3%, the lazy gateway's fixed cost is 190 tokens). Two servers I tried first could not be captured (the official GitLab server emits tool schemas without a `type`; Supabase needs a blocked host), and Neon and Linear were dropped (blocked dependency; too large). Details, selection criteria and the rules for keeping it clean are in `catalogs/README.md`.

## Design notes

- **Cache-friendly.** The three meta-tool definitions never change, so the prompt-cache prefix (`tools` renders first) stays stable. Dynamically adding tools after a search would invalidate the cache each time.
- **Cost of that choice.** `call_tool` takes an opaque `arguments` object, so the API can't schema-validate calls. The gateway checks `required` itself and returns the signature on error so the model can self-correct.
- **Signatures in search results.** `name(a*:str, mode:x|y)` is often enough to call the tool, saving a `describe_tool` round trip.
- **Pinned tools.** Hot-path tools can be exposed directly alongside the meta-tools.

## Next steps

1. Human-written labels or real traffic. The independent labels came from another instance of the same model family, and the catalogs they were scored on are the ones used to design the retrievers.
2. End-to-end eval with a real model (needs an API key): task success and total cost for full vs. slim vs. lazy, how often real queries name their service, the cost of a retrieval miss, and the right default `limit`. This is also the only way to learn whether the ~86% recall@5 matters in practice, because a model can search again.
3. Attack the wording gap rather than the ranking formula: index-side enrichment for terse or jargon-heavy tools (author-supplied `when to use` hints, server descriptions from the MCP `instructions` field), and query rewriting or reranking by a model. Server-level routing (pick the server first, then rank inside it) is an untested alternative to a global penalty.
4. Label the fifth batch (`catalogs/test4/`, captured) with independent authors, fix a scoring protocol, and score it once.
5. A "no match" threshold for dense search.
6. Count tokens with the API's token counter instead of the estimate.
7. Compare against the API's built-in tool search (`defer_loading`) as the baseline to beat.
8. A proxy MCP server so any client can use the gateway unchanged.
