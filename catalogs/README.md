# Real MCP tool catalogs

Five generations of catalogs, in order of capture:

| directory | status |
|---|---|
| `catalogs/*.json` | **dev**: used while building and choosing retrievers |
| `catalogs/test/` | scored once on 2026-10-07, so **spent**: treat it as dev data from now on |
| `catalogs/test2/` | scored once on 2026-10-07 (second time), so also **spent**: dev data from now on |
| `catalogs/test3/` | scored once as the confirmation batch (2026-10-07), so also **spent** |
| `catalogs/test4/` | scored once on independent labels (2026-10-07), so also **spent** |

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

## `test2/`: second batch (scored once, spent)

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

## `test3/`: third batch (scored once, spent)

Captured after the second batch was spent. It is the largest so far (189 tools) and was chosen with the results of the first two in mind:

- **New domains with heavy internal overlap**: three Office servers (Excel, Word, PowerPoint) that share verbs (`add_table`, `add_paragraph`, `create_*`), a key-value store (Redis) next to the earlier MongoDB/DynamoDB, a notes server (Obsidian) next to Notion and the filesystem, and a container server (Docker) next to Kubernetes and Heroku.
- **A spread of naming styles.** Whether a tool's own text names its server varies a lot: Obsidian 15/15 and Docker 4/4 tools do, Redis 47/53, Word 23/54, Excel 6/26, PowerPoint 5/37 (word-boundary match on name + description). Heroku in the second batch showed that this asymmetry is what hurts a retriever when a query names the service, and it is exactly what the "server name in the index text" idea changes.

| file | package | license | tools |
|---|---|---|---:|
| `test3/excel.json` | PyPI `excel-mcp-server@1.1.1` | MIT | 26 |
| `test3/word.json` | PyPI `office-word-mcp-server@1.1.11` | MIT | 54 |
| `test3/powerpoint.json` | PyPI `office-powerpoint-mcp-server@2.0.7` | MIT | 37 |
| `test3/redis.json` | PyPI `redis-mcp-server@0.5.1` | MIT | 53 |
| `test3/obsidian.json` | PyPI `mcp-obsidian@0.2.3` | MIT | 15 |
| `test3/docker.json` | PyPI `docker-mcp@0.2.0` | MIT (license file; its copyright line is an unfilled template) | 4 |

Load it with `--catalog catalogs/test3 --on-duplicate namespace`.

**One name collision, handled explicitly.** `add_table` is defined by both the Word and the PowerPoint server, and my loader requires unique tool names. The files are left verbatim; the new `--on-duplicate namespace` policy (`load_catalogs(..., on_duplicate="namespace")`) renames only the colliding tools to `word__add_table` and `powerpoint__add_table`, a minimal version of what real MCP clients do for every tool. Labels for those two tools must use the namespaced names, and for those two the name text now contains the server, a small departure from the other 187 tools. The default policy still raises an error, so nothing is renamed silently. (Excel's `create_table` also collides with the spent SQLite server's; that only matters if the batches are merged.)

Capture notes:

- Excel ran against `mcp` 2.x (its latest release needs it); the others ran against isolated `mcp` 1.x installs. Reported `serverInfo` versions are often the SDK's, not the package's (Obsidian, PowerPoint and Redis report 1.30.0, Word 3.4.8, Docker 0.1.0), so the package versions above are the ones installed.
- Fake credentials were used where a server asked for one; the files contain no credentials or local paths (checked).
- Excel was started with a scratch working directory; tool lists did not depend on it.

Token profile (estimates): 35,694 tokens for all 189 schemas; lossless slimming (level 1) saves 12.0%, level 3 saves 43.8%; the lazy gateway's 190-token fixed cost is 99.5% less. The weight is spread across all six servers (Excel 9,090, Redis 8,762, PowerPoint 8,610, Word 6,356, Obsidian 2,618, Docker 258).

Rules for keeping it a clean test set: decisions about retrievers, the server-name idea and the default are made on **dev data only, which now includes `catalogs/test/` and `catalogs/test2/`**, with a rule fixed beforehand; labels should be written by someone other than whoever built the retrievers (or flagged as a draft) and committed before scoring, naming the service or listing every acceptable tool; score once.

## `test4/`: fifth batch (captured 2026-10-07, scored once, spent)

Captured after the independent-label run, so the next decision can be made on tools nobody tuned against. Nothing was tuned against it. It was captured before any labels existed, labeled by an independent author, and scored once (`results/fifth-score.txt`); it is now spent. `--catalog catalogs/test4` loads it. `MANIFEST.sha256` pins the files.

Selection criteria, fixed before capturing: a stdio MCP server installable from npm or PyPI through this environment's proxy, whose `tools/list` works with fake credentials, in a domain that either shares vocabulary with servers in the earlier batches (cross-server confusion was the main failure so far) or is new.

| file | package | license | tools | why |
|---|---|---|---:|---|
| `test4/gitlab.json` | npm `@zereight/mcp-gitlab@2.1.69` (community server) | MIT | 118 | repositories, issues, merge requests; same vocabulary as GitHub/git in earlier batches, and by far the largest catalog so far |
| `test4/mapbox.json` | npm `@mapbox/mcp-server@0.14.0` | MIT | 29 | geocoding, routing, isochrones: a new domain |
| `test4/firecrawl.json` | npm `firecrawl-mcp@3.28.2` | MIT | 28 | scraping, crawling, search: overlaps Fetch/Tavily vocabulary and Puppeteer |
| `test4/desktop-commander.json` | npm `@wonderwhy-er/desktop-commander@0.2.52` | MIT | 26 | files, processes, search: overlaps Filesystem vocabulary |
| `test4/puppeteer.json` | npm `@modelcontextprotocol/server-puppeteer@2025.5.12` | MIT | 7 | browser automation: overlaps Playwright, Firecrawl |
| `test4/todoist.json` | npm `@abhiz123/todoist-mcp-server@0.1.0` | MIT | 5 | tasks and projects: new domain |

213 tools, 6 servers, no name collisions inside the batch (19 names also exist in earlier batches, mostly GitLab imitating GitHub's names; batches are scored on their own catalogs, so that does not matter). Estimated tokens: 96,454 in total, of which GitLab is 48,074. Level-1 slimming saves only 2.2% (level 2: 46.0%, level 3: 66.3%); the lazy gateway's fixed cost is 190 tokens (99.8% less). GitLab is 55% of the tools, so any scoring protocol must also report per server and not only pooled.

Rules it was held to: independent labels first (the blind kit in `scripts/make_label_kit.py`), a scoring protocol fixed and committed before the labels existed (`scripts/score_fifth.py`), retrievers chosen on the earlier four batches only, score once. All were followed.

Capture notes (what did not make it in, and why):

- **`@modelcontextprotocol/server-gitlab@2025.4.25` (the official, deprecated server) was not captured.** Its 9 tools declare `inputSchema` as `{"$schema": ...}` with no `type` and no properties, so the MCP Python client rejects the response (a validation error) and clients that follow the spec could not use it either. Read over raw JSON-RPC it does list 9 tools; I did not patch around it, because catalogs here are meant to be verbatim and usable. The community server above replaced it.
- **Supabase (`@supabase/mcp-server-supabase@0.13.0`) was not captured**: it fetches its docs GraphQL schema from supabase.com at startup and that request is blocked here (HTTP 403).
- **Neon (`@neondatabase/mcp-server-neon@0.6.5`) could not be installed**: one dependency is fetched from `codeload.github.com`, which is blocked here.
- **Linear (`@tacticlaunch/mcp-linear@1.4.4`) was captured and then left out**: 198 tools would have made two issue trackers more than 80% of the batch. Its capture was not kept.
- Servers that want a credential were started with obviously fake ones; the committed files contain no credentials, hostnames or local paths (checked by search).
