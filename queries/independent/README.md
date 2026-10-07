# Independent labels

Labeled queries for the four real-server batches, written by authors who did not build or tune the
retrievers and never saw the retrieval code, any earlier query, or any result. Same file format as the
other label files (`src/toolslim/labels.py`). They are stored in a subdirectory on purpose: the
integrity tests that scan `queries/*.jsonl` do not touch them.

| file | catalog | tools | queries |
|---|---|---:|---:|
| `dev.jsonl` | `catalogs/` | 78 | 156 |
| `first-test.jsonl` | `catalogs/test/` | 70 | 140 |
| `second-test.jsonl` | `catalogs/test2/` | 105 | 210 |
| `third-test.jsonl` | `catalogs/test3/` (`--on-duplicate namespace`) | 189 | 378 |

`MANIFEST.sha256` holds the checksums of the files exactly as the authors wrote them; a test checks it.

## How they were produced

- **Authors:** four fresh subagent instances, one per batch, each started with an empty context. They are the same
  model family as the assistant that built the retrievers, so shared stylistic habits are possible; they did not
  see its context, code or results.
- **Inputs (`scripts/make_label_kit.py`):** the shared guidelines, a standalone format validator, and one
  `tools.json` for their batch with tool names, server names, descriptions (truncated to 700 characters) and
  parameter names. Nothing else. The kit contains no retrieval code, no earlier queries and no results (a test
  checks it for project-specific terms).
- **Task:** for every tool, one `user` query (what a person would ask an assistant, in everyday words) and one
  `agent` query (the short query an agent sends to a tool-search function), and for each query the list of
  tools that would accomplish it, preferred first. The guidelines say to name the service as a real person
  would or to list all acceptable tools, and not to make queries easier or harder. They deliberately do not
  say anything about how the labels will be used.
- **Constraint:** the authors were told to read only the guidelines and their `tools.json` and to look nothing
  else up. I cannot verify that beyond their reports (one stated it opened only the two permitted files; they
  also wrote small helper scripts to generate their files, which are not part of the data).
- **No edits:** I did not change any label. Each file passes the repo's own `check` (all tools covered, no unknown
  names, no duplicates). The lint also warns about user-style queries containing every word of a tool's name
  (3, 3, 11 and 13 per file); I left them, since a natural author does that.

## How they differ from the author-written labels

| | dev | first test | second test | third test |
|---|---|---|---|---|
| independent: mean words (user / agent) | 11.4 / 5.9 | 13.6 / 6.4 | 13.6 / 5.7 | 13.0 / 6.4 |
| independent: user-style name overlap with tool name | 0.28 | 0.35 | 0.39 | 0.32 |
| mine: user-style name overlap | 0.14 | 0.13 | 0.20 | 0.25 |
| independent: queries accepting several tools | 5% | 6% | 3% | 6% |
| mine: queries accepting several tools | 5% | 10% | 16% | 11% |
| independent: queries naming their server (user / agent) | 21% / 27% | 54% / 53% | 34% / 64% | 58% / 20% |
| mine: queries naming their server (user / agent) | 19% / 22% | 1% / 16% | 73% / 89% | 32% / 97% |

The independent authors share more words with the tool names in user-style queries (0.28-0.39 against 0.13-0.25),
which favors lexical search, accept fewer alternatives, and name the service in quite different proportions
(notably agent-style queries in the third batch: 20% against my 97%).

Independence check: exactly 33 of the 884 independent queries are word-for-word identical to one of mine, all of
them short agent-style queries (mean 4.6 words, at most 7) that restate a short tool description ("merge a pull
request", "echo a string back"), and none is a user-style query. That is convergence on obvious phrasing, not
evidence of copying, but it does mean agent-style queries are a weak discriminator.

## What they are good for, and what they are not

- They give an estimate of retrieval quality that does not depend on the retrievers' author's phrasing, on tools
  that have already been used to design the retrievers. The *tools* are not new: the four batches are spent,
  so these are independent labels on dev data, not a fresh confirmation set.
- They come from another instance of the same model family, not from human users; real traffic would still
  differ.
- Any scoring should fix its protocol first (headline, comparisons, reading) and be committed before it is
  run, as with the earlier batches.
