# Real MCP tool catalogs

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
