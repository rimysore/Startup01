# Real MCP tool catalogs

Three generations of catalogs, in order of capture:

| directory | status |
|---|---|
| `catalogs/*.json` | **dev**: used while building and choosing retrievers |
| `catalogs/test/` | scored once on 2026-10-07, so **spent**: treat it as dev data from now on |
| `catalogs/test2/` | **fresh batch**: captured after that result, unlabeled and unscored |

Verbatim `tools/list` results captured from real MCP servers with
`scripts/capture_catalog.py` (the `source` block in each file records the exact
package, version, server name and capture date). They are used to benchmark
tool-schema size and tool retrieval on definitions nobody here wrote.

| file | package | tools |
|---|---|---:|
| `filesystem.json` | npm `@modelcontextprotocol/server-filesystem@2026.8.31` | 14 |
| `git.json` | PyPI `mcp-server-git@2026.8.18` | 12 |
| `github.json` | npm `@modelcontextprotocol/server-github@2025.4.8` (deprecated upstream, still widely deployed) | 26 |
| `memory.json` | npm `@modelcontextprotocol/server-memory@2026.8.31` | 9 |
| `everything.json` | npm `@modelcontextprotocol/server-everything@2026.8.31` (a protocol demo server) | 13 |
| `sequential-thinking.json` | npm `@modelcontextprotocol/server-sequential-thinking@2026.8.31` | 1 |
| `fetch.json` | PyPI `mcp-server-fetch@2026.8.18` | 1 |
| `time.json` | PyPI `mcp-server-time@2026.8.18` | 2 |

All eight servers come from the `modelcontextprotocol/servers` project and are
MIT-licensed (stated in each package's README / package metadata). The tool
names, descriptions and schemas are their authors' work, reproduced here
unmodified for benchmarking; see the upstream repository for the full license
text.

Loaded together (`python -m toolslim --catalog catalogs ...`) they model an
agent connected to eight servers: 78 tools, no name collisions.

To refresh or extend, install a server and re-run the capture, e.g.

```bash
python scripts/capture_catalog.py --name time --package pypi:mcp-server-time@2026.8.18 \
    --license MIT --out catalogs/time.json -- python3 -m mcp_server_time
```

## `test/`: fresh test set

Captured *after* the dev results were in, from servers in different domains (browser, database, chat, docs, maps). The directory is deliberately a subfolder, so `--catalog catalogs` still loads only the dev set; load it with `--catalog catalogs/test`.

| file | package | license | tools |
|---|---|---|---:|
| `test/playwright.json` | npm `@playwright/mcp@0.0.83` | Apache-2.0 | 25 |
| `test/notion.json` | npm `@notionhq/notion-mcp-server@2.5.2` (tools generated from Notion's OpenAPI spec) | MIT | 24 |
| `test/slack.json` | npm `@modelcontextprotocol/server-slack@2025.4.25` (deprecated upstream) | MIT | 8 |
| `test/google-maps.json` | npm `@modelcontextprotocol/server-google-maps@0.6.2` | MIT | 7 |
| `test/sqlite.json` | PyPI `mcp-server-sqlite@2025.4.25` | MIT (per package README) | 6 |

70 tools, no name collisions with each other or with the dev set. Tool names, descriptions and schemas are their authors' work, reproduced unmodified for benchmarking (the Playwright MCP package declares Apache-2.0; see its upstream repository for the license text and any NOTICE).

Rules for keeping it a test set: no labeled queries existed when it was captured (a draft is now in `queries/mcp-test.jsonl`, committed before any scoring; see `queries/README.md`), retrievers and slimmer settings must be chosen on the dev set only, and it should be scored once (it was, on 2026-10-07, so it is now spent: any further tuning must treat it as dev data).

Capture notes:

- **Stripe could not be captured.** The current `@stripe/mcp` is a stdio proxy to Stripe's hosted server; its tools live remotely and `mcp.stripe.com` is blocked by this environment's egress policy, so Google Maps took the fifth slot. (An older package version that ran tools locally would be a different, stale catalog, so it was not substituted.)
- **`mcp-server-sqlite` needs the 1.x `mcp` SDK.** It uses decorators removed in `mcp` 2.x and declares only `mcp>=1.6.0`. It was run against an isolated `mcp<2` install while the capture client stayed on 2.x (`--env PYTHONPATH=<dir with mcp 1.x>`). Its tool list does not depend on the SDK version.
- Vendor servers that insist on a credential were started with obviously fake ones; `tools/list` needs no real account, and the committed files contain no credentials or local paths.

## `test2/`: next batch (unlabeled, unscored)

Captured after the first test set was spent, for the next round of evaluation. The previous failure analysis (see the top-level README) found cross-server confusion to be the main problem, so this batch was chosen to **overlap in vocabulary**: two infrastructure servers that both talk about apps, logs, scaling and deploys; three data stores that all talk about collections/tables, indexes and queries; and a web-search server next to the dev set's `fetch`. `--catalog catalogs/test2` loads it.

| file | package | license | tools |
|---|---|---|---:|
| `test2/kubernetes.json` | npm `mcp-server-kubernetes@4.1.9` | MIT | 23 |
| `test2/heroku.json` | npm `@heroku/mcp-server@1.2.11` | Apache-2.0 | 33 |
| `test2/mongodb.json` | npm `mongodb-mcp-server@3.0.5` | Apache-2.0 | 27 |
| `test2/dynamodb.json` | PyPI `awslabs.dynamodb-mcp-server@2.1.8` | Apache-2.0 | 8 |
| `test2/pinecone.json` | npm `@pinecone-database/mcp@0.3.0` | Apache-2.0 | 9 |
| `test2/tavily.json` | npm `tavily-mcp@0.2.22` | MIT | 5 |

105 tools, no name collisions within the batch or with `catalogs/` and `catalogs/test/`. Licenses are the ones each package declares; the tool definitions are their authors' work, reproduced unmodified.

Capture notes:

- **Heroku** logged `@heroku/plugin-ai: NOT INSTALLED - Skipping AI tools`, so this is the server without its optional AI plugin (33 tools).
- **MongoDB** was started with telemetry disabled and otherwise default settings; no `atlas-*` management tools appear in the capture. Servers that expose tool groups by configuration will list different tools under different settings.
- **DynamoDB** ran against an isolated `mcp<2` install (it targets the 1.x SDK) and reports the SDK's version (1.26.0) as its server version; the package version above is the one that was installed.
- Fake credentials were used where a server insisted on one; the files contain no credentials or local paths (checked).
- Sentry's MCP server was skipped (FSL license, not permissive), and deprecated packages were skipped where an active alternative existed.

Token profile (estimates): 42,367 tokens for all 105 schemas; lossless slimming (level 1) saves only 5.9% and level 3 saves 63%, because the weight is in long descriptions (DynamoDB averages ~1,040 tokens per tool; MongoDB totals 17,192) rather than in schema scaffolding.

Rules for keeping it a clean test set:

- Retrievers, slimmer settings and any new index features are chosen on **dev data only**, which now includes `catalogs/test/` with `queries/mcp-test.jsonl`.
- Labels should be written by someone other than whoever built the retrievers, and committed before scoring. The lessons from the last set are in `queries/README.md`: name the service in each query or list every server's acceptable tool, and audit that up front for all queries.
- Score once.
