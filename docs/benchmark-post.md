# Lazy tool loading for MCP: what 31 real servers say

*Draft. Numbers below are copied from `results/` and `README.md` in this repository; the checklist at the end lists what must be settled before publishing.*

## TL;DR

- **The tool list is the cost.** Connected to the 8 reference servers (78 tools), a client sends about 12,500 estimated tokens of tool definitions on *every* request. For a 213-tool batch with GitLab, Mapbox and Firecrawl it is about 96,000. Replacing the list with three meta-tools (`search_tools`, `describe_tool`, `call_tool`) costs a fixed 190 tokens.
- **Shrinking schemas is a lottery.** Lossless slimming saved anywhere from 2% to 56% depending on which server generated the schemas. Most of the weight is in descriptions, not JSON scaffolding.
- **Lazy loading only works if search works.** On labels written by people who never saw the retrievers (here: fresh model instances, see the caveats), the best simple retriever finds the right tool in the top 5 for **86% of everyday-language requests and 98% of agent-style queries**. BM25 plus embeddings fused beat either alone; putting the server name into each tool's text was a small extra that did not clear the significance bar.
- **We did not measure task success or dollar cost with a real model yet.** Everything here is token estimates (characters / 3.5) and retrieval recall. That is the biggest gap, and we say so up front.

## The problem

An MCP client lists every tool of every connected server in the request, each time. A GitHub server alone has 26 tools. Add a browser, a database and a docs server and you are paying for thousands of tokens the model mostly ignores, on every turn, and the prompt cache only partly hides that.

Two ideas to cut it:

1. **Slim** each schema: remove what the model does not need to call a tool.
2. **Load lazily:** give the model three meta-tools and let it *search* the catalog, *describe* one tool, and *call* it. The `tools` array never changes, so it stays cache-friendly.

The question for the second idea is not the token count, which is easy to compute. It is: **does the search find the right tool?** If it misses, the model burns turns or gives up. So we benchmarked retrieval against real catalogs.

## What we measured on

| | |
|---|---|
| Servers | 31 real MCP servers captured with their own `tools/list`, unmodified (provenance and licenses in `catalogs/README.md`) |
| Tools | 655 in five batches (78, 70, 105, 189, 213), each scored on its own catalog. The fifth was captured after everything was tuned and scored once, on its own |
| Queries | per tool, one **user-style** request in everyday words ("save these notes to a new file called todo.txt") and one **agent-style** query as a model would send to a search function ("write text to a file") |
| Metric | recall@5: any acceptable tool in the top 5 results |

A label lists *every* tool that would do the job, because real catalogs contain near-duplicates (local `git_create_branch` vs GitHub's `create_branch`).

## Token numbers

Estimated tokens (compact JSON characters / 3.5, not the API's counter):

| batch | tools | all schemas | lossless slimming (L1) | aggressive (L3) | lazy gateway, first request |
|---|---:|---:|---:|---:|---:|
| reference servers | 78 | 12,514 | -11.5% | -47% | 190 (-98.5%) |
| first test (Playwright, Notion, ...) | 70 | 28,389 | -55.6% | -74.7% | 190 (-99.3%) |
| fifth batch (GitLab, Mapbox, ...) | 213 | 96,454 | -2.2% | -66.3% | 190 (-99.8%) |

Two things to take from this:

- **Lossless slimming depends on the generator.** The 55.6% on the first test batch is almost entirely Notion's generator attaching ~14k tokens of unused `$defs` to its tools; pruning definitions no `$ref` reaches removes them. On the fifth batch (dominated by GitLab's 118 tools) the same pass saves 2.2%, because the tokens are in long descriptions.
- **The lazy gateway's "first request" number flatters it.** After one search and one describe the cost is 494-547 tokens (93-98% less), and that assumes the first search hits. A miss costs more turns. The honest comparison is end to end, which we have not run.

## Retrieval: what actually found the tool

Final scoring on labels written by fresh model instances that saw only the tool lists (884 queries, 442 per style, over the four scored batches), recall@5 with 95% intervals:

| retriever | everyday-language | agent-style | both |
|---|---:|---:|---:|
| BM25 | 80.8% [77, 84] | 98.6% | 89.7% |
| embeddings (static `wordllama`) | 79.6% [76, 83] | 93.9% | 86.8% |
| BM25 + embeddings fused (RRF) | 84.8% [81, 88] | 98.0% | 91.4% |
| **same, with server name in the index text** | **86.0% [82, 89]** | **98.2%** | **92.1%** |

What held up, and what did not:

- **Fusion is the real gain.** The fused retriever with the server name beat embeddings alone on all queries (58 queries gained, 11 lost, paired) and beat BM25 alone on everyday-language queries (31 gained, 8 lost). Embeddings alone are weak on short agent-style queries and BM25 repairs that: on pooled development data, fusing BM25 in gained 12 agent-style queries and lost none. The fusion-only and server-name-only effects were separated on the development data, not on these labels: fusion is significant there, the server name is not.
- **The server name is a small extra, not a headline.** Prefixing each tool's text with its server's name looked decisive on one batch whose queries mostly name the service (+10 / -0 paired) and nearly vanished on others. On top of fusion it is 11 gained / 5 lost: not significant, three times in a row. It does no harm, and we ship it, but we would not claim it.
- **The embedding advantage shrank across batches.** On author-written labels, embeddings beat BM25 by 22 points on everyday-language queries on the first batch (the reference servers: 73% vs 51%); on the fourth batch they were 4 points behind (69% vs 73%). The share of words queries had in common with their tool's name rose over the same batches (0.14 to 0.25), so a good part of this is the labels getting less paraphrased, not retrieval changing. Do not expect a fixed gap.
- **Word overlap with the tool name dominates.** With no shared word, BM25 / embeddings / the fused default score 62% / 69% / 72%. With half the name's words present: 96% / 92% / 97%.

### The fresh batch said less than the four it followed

The fifth batch (213 tools, 6 servers, GitLab alone 118) was captured after everything was tuned and scored once, on independent labels, under a protocol committed before the labels existed:

| retriever | everyday-language | agent-style | both |
|---|---:|---:|---:|
| BM25 | 75.6% [69, 81] | 99.1% | 87.3% |
| embeddings | 67.3% [61, 73] | 90.3% | 78.8% |
| BM25 + embeddings fused | 77.9% [72, 83] | 98.6% | 88.2% |
| **same, with server name** | **78.3% [72, 83]** | **98.6%** | **88.5%** |

By the rule we had fixed, the choice of default was confirmed: fusion beats embeddings alone by a wide margin (49 queries gained, 7 lost). But it is the *only* thing that held. The fused default is statistically indistinguishable from plain BM25 here (17 gained, 12 lost), the server name did nothing, and everyday-language recall (78%) was lower than the 86% on the earlier batches. About half of the difference is one server: GitLab's 118 near-duplicate tools score 72% on everyday-language queries, while the other five servers pooled score 86%. In 38 of the 47 misses the right server was found and the wrong tool in it was ranked first, so the remaining failures are not cross-server confusion. If we had stopped at the four spent batches, we would have reported a cleaner story.

## How we tried not to fool ourselves

This part is as much of the result as the table, because the early numbers were wrong in instructive ways.

- **Pre-registration.** Every selection rule or scoring protocol was committed *before* it was run, including the thresholds. Guard tests pin the thresholds, and we mutation-checked them by deliberately breaking each one to confirm a test fails.
- **Spent test sets.** Each new batch of servers was scored once; after that it counts as development data. All four are now spent, which is why the fifth is held back.
- **Paired tests, not overlapping intervals.** With ~100-400 queries a 95% interval is +/-3 to +/-9 points. We counted queries gained vs lost between retrievers and required net gain >= 2 sqrt(g + l).
- **A confirmation that failed, and was reported as failed.** The default chosen in round two was confirmed only if its agent-style recall was within one point of the best. On the third batch it was 1.06 points behind (98.4% vs 99.5%, i.e. two queries). The threshold was not moved. We noted that a fixed one-point guard on ~190 queries is a two-query rule.
- **Null results, kept.** A fix to the BM25 tokenizer (camel-case brand names such as "GitHub" splitting into `git hub`) changed the outcome of 3 of 1,002 queries; a "hubness" correction helped one batch and hurt others. Neither was adopted. `results/` has the numbers.
- **Independent labels.** The first three sets of labels were written by the author of the retrievers, which is a conflict of interest we could not remove by being careful. So the final scoring uses labels written by fresh model instances given only the tool lists and a guide (`queries/independent/`). The same retrievers scored 3-8 points *higher* on those labels because the queries share more words with tool names. Their ranking of the retrievers mostly agreed with ours (Spearman 0.90, a threshold fixed in advance at 0.8).

## Limitations you should weigh

- **No end-to-end measurement.** No model was asked to complete tasks, so we cannot say what an 86% hit rate costs in turns, dollars or failures, or whether a model's own re-search closes the gap.
- **The "independent" authors are another instance of the same model family**, not people. The tools they labeled are the ones we used to design the retrievers, so this is an independent-label check on development data, not a fresh confirmation.
- **Token counts are estimates**, not the API's counter.
- **Dense and fused search always return something**, even for nonsense; there is no "no match" signal.
- **We did not compare against built-in tool search** from model providers or clients. That is the baseline to beat.
- The lossy slimming levels (2 and 3) were never validated against real model behavior.

## Reproduce it

```bash
git clone <repo-url> && cd <repo>
pip install -e .[dense]
export PYTHONPATH=src
python -m toolslim --catalog catalogs/test3 --on-duplicate namespace \
    --labels queries/independent/third-test.jsonl bench
python scripts/score_independent.py        # the final scoring, pooled over four batches
python -m unittest discover -s tests
```

## What is next

1. A sixth batch with human-written queries.
2. An end-to-end run with a real model: task success and total cost for full vs slim vs lazy, including retrieval misses.
3. Ship the gateway as a drop-in MCP proxy: one config listing your upstream servers, three meta-tools out.
4. Compare against built-in tool search.

---

### Before publishing (not for the post body)

- [ ] **License.** The repository has no `LICENSE` file. Add one, and a notice file for the captured catalogs (MIT / Apache-2.0 tool definitions by their authors).
- [ ] **Repo URL and install command** (`<repo-url>` above); check `pip install -e .[dense]` from a clean environment.
- [ ] **End-to-end result.** Strongest single addition; if it contradicts the token story, the TL;DR changes.
- [ ] **Human check of a sample of the independent labels**, since "independent" currently means "another model instance".
- [ ] **Re-run every number** from a clean checkout and diff against `results/` (they are produced by committed scripts).
- [ ] All five batches are now spent. Any new claim needs a sixth, ideally with human-written queries.
- [ ] Remove or soften any claim you cannot reproduce. The 12-gained-0-lost fusion figure, the 22-point and 4-point embedding-vs-BM25 gaps, and the word-overlap trend come from `README.md` tables and per-batch results, not from the single final results file.
