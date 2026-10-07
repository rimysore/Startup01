"""CLI: python -m toolslim {bench,search,slim} [--catalog tools.json]"""

from __future__ import annotations

import argparse
import json

from . import bench
from .catalog import load_catalog
from .fixtures import synthetic_catalog, synthetic_queries
from .gateway import LazyToolGateway
from .slim import slim_tool


def main() -> None:
    parser = argparse.ArgumentParser(prog="toolslim", description=__doc__)
    parser.add_argument("--catalog", help="JSON file: an MCP tools/list result or a list of tool definitions")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("bench", help="token and retrieval benchmark (needs --catalog queries; defaults to the synthetic set)")
    p_search = sub.add_parser("search", help="what the model would see for a search_tools call")
    p_search.add_argument("query")
    p_slim = sub.add_parser("slim", help="print a slimmed tool definition")
    p_slim.add_argument("name")
    p_slim.add_argument("--level", type=int, default=2, choices=(0, 1, 2, 3))
    args = parser.parse_args()

    tools = load_catalog(args.catalog) if args.catalog else synthetic_catalog()

    if args.cmd == "bench":
        if args.catalog:
            parser.error("bench needs labeled queries; with --catalog use `search`/`slim`, or add a queries file (planned)")
        print(bench.run(tools, synthetic_queries()).render())
    elif args.cmd == "search":
        print(LazyToolGateway(tools).search(args.query))
    else:
        tool = next((t for t in tools if t.name == args.name), None)
        if tool is None:
            parser.error(f"no tool named {args.name!r}")
        print(json.dumps(slim_tool(tool, args.level).to_api(), indent=2))


if __name__ == "__main__":
    main()
