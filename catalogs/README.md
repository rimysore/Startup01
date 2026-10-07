# Real MCP tool catalogs

`catalogs/*.json` is the **dev** set (used while building and choosing retrievers). `catalogs/test/` is a **fresh test set** captured afterwards; see the end of this file.

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
