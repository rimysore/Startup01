#!/usr/bin/env python3
"""Capture a real MCP server's `tools/list` into a catalog file.

    python scripts/capture_catalog.py --name time --package pypi:mcp-server-time@2026.8.18 \\
        --out catalogs/time.json -- python3 -m mcp_server_time

Everything after `--` is the server's stdio command. Needs the `mcp` Python
package (client side only). The output keeps the server's tool definitions
verbatim (aliased field names such as `inputSchema`) plus provenance, and loads
with `toolslim.load_catalog`.
"""

from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import os
import sys
from pathlib import Path

from mcp import ClientSession
from mcp.client.stdio import StdioServerParameters, stdio_client
from mcp.types import PaginatedRequestParams


async def capture(command: list[str], env: dict[str, str], timeout: float) -> tuple[dict, list[dict]]:
    params = StdioServerParameters(command=command[0], args=command[1:], env={**os.environ, **env})
    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            init = await asyncio.wait_for(session.initialize(), timeout)
            tools: list[dict] = []
            cursor = None
            while True:
                page = await asyncio.wait_for(
                    session.list_tools(params=PaginatedRequestParams(cursor=cursor) if cursor else None), timeout
                )
                tools += [t.model_dump(mode="json", exclude_none=True, by_alias=True) for t in page.tools]
                cursor = page.next_cursor
                if not cursor:
                    break
    server = init.server_info
    return {"name": server.name, "version": server.version}, tools


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--name", required=True, help="short catalog name, e.g. 'filesystem'")
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--package", default="", help="provenance, e.g. 'npm:@modelcontextprotocol/server-memory@2026.8.31'")
    parser.add_argument("--license", default="", help="license of the server, for the provenance block")
    parser.add_argument("--env", action="append", default=[], metavar="KEY=VALUE", help="extra environment for the server (repeatable)")
    parser.add_argument("--timeout", type=float, default=60.0)
    parser.add_argument("command", nargs=argparse.REMAINDER, help="after `--`: the server's stdio command")
    args = parser.parse_args()

    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command:
        parser.error("give the server command after `--`")
    env = dict(kv.split("=", 1) for kv in args.env)

    server, tools = asyncio.run(capture(command, env, args.timeout))
    names = [t["name"] for t in tools]
    if len(set(names)) != len(names):
        sys.exit(f"duplicate tool names in {args.name}: refusing to write")
    out = {
        "source": {
            "name": args.name,
            "package": args.package,
            "license": args.license,
            "server": server,
            "captured_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"),
        },
        "tools": tools,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"{args.name}: {len(tools)} tools -> {args.out}")


if __name__ == "__main__":
    main()
