"""CLI: python -m toolslim {bench,check,search,slim} [--catalog PATH ...] [--labels FILE]"""

from __future__ import annotations

import argparse
import json
import sys

from . import bench
from .catalog import load_catalogs
from .config import DEFAULT_RETRIEVER, default_retriever
from .fixtures import synthetic_catalog
from .gateway import LazyToolGateway
from .labels import LabelError, as_query_sets, check_labels, load_labels
from .slim import slim_tool


def main() -> None:
    parser = argparse.ArgumentParser(prog="toolslim", description=__doc__)
    parser.add_argument(
        "--catalog",
        action="append",
        metavar="PATH",
        help="catalog JSON (MCP tools/list result or list of tool definitions) or a directory of them; repeat to merge several servers",
    )
    parser.add_argument(
        "--on-duplicate",
        choices=("error", "namespace"),
        default="error",
        help="what to do when servers define the same tool name: fail (default), or rename the colliding tools to <server>__<name>",
    )
    parser.add_argument("--labels", metavar="FILE", help="labeled queries (JSONL, see toolslim/labels.py) for scoring retrieval on --catalog")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p_bench = sub.add_parser("bench", help="token and retrieval benchmark (synthetic catalog by default)")
    p_bench.add_argument(
        "--sets",
        default="dev",
        help="synthetic catalog only; comma-separated query sets: " + ", ".join(bench.QUERY_SETS) + ", or 'all'. Default 'dev': choose "
        "retrieval configs on dev; score the held-out sets only once the config is fixed.",
    )
    p_bench.add_argument(
        "--primary", default=DEFAULT_RETRIEVER, help="retriever behind the lazy-gateway token rows (falls back to bm25 if dense deps are missing)"
    )
    sub.add_parser("check", help="validate --labels against --catalog and report leakage/coverage")
    p_search = sub.add_parser("search", help="what the model would see for a search_tools call")
    p_search.add_argument("query")
    p_slim = sub.add_parser("slim", help="print a slimmed tool definition")
    p_slim.add_argument("name")
    p_slim.add_argument("--level", type=int, default=2, choices=(0, 1, 2, 3))
    args = parser.parse_args()

    if args.labels and not args.catalog:
        parser.error("--labels needs --catalog")
    tools = load_catalogs(args.catalog, on_duplicate=args.on_duplicate) if args.catalog else synthetic_catalog()

    labels = None
    if args.labels:
        try:
            labels = load_labels(args.labels)
        except (LabelError, OSError) as exc:
            parser.exit(2, f"error: {exc}\n")

    if args.cmd == "check":
        if labels is None:
            parser.error("check needs --labels and --catalog")
        report = check_labels(labels, tools)
        for key, value in report.stats.items():
            print(f"{key + ':':<44}{value}")
        for line in report.errors:
            print(f"ERROR   {line}")
        for line in report.warnings:
            print(f"warning {line}")
        print("\nOK" if report.ok else f"\n{len(report.errors)} error(s)")
        sys.exit(0 if report.ok else 1)
    elif args.cmd == "bench":
        if labels is not None:
            report = check_labels(labels, tools)
            if not report.ok:
                parser.exit(2, "error: labels do not match the catalog:\n  " + "\n  ".join(report.errors) + "\n")
            query_sets = as_query_sets(labels)
        elif args.catalog:
            parser.error("bench on --catalog needs --labels (see toolslim/labels.py for the format)")
        else:
            names = list(bench.QUERY_SETS) if args.sets == "all" else args.sets.split(",")
            unknown = [n for n in names if n not in bench.QUERY_SETS]
            if unknown:
                parser.error(f"unknown query set(s) {unknown}; choose from {list(bench.QUERY_SETS)}")
            query_sets = {n: bench.QUERY_SETS[n]() for n in names}
        print(bench.run(tools, query_sets, primary=args.primary).render())
    elif args.cmd == "search":
        retriever, note = default_retriever(tools)
        if note:
            print(note, file=sys.stderr)
        print(LazyToolGateway(tools, index=retriever).search(args.query))
    else:
        tool = next((t for t in tools if t.name == args.name), None)
        if tool is None:
            parser.error(f"no tool named {args.name!r}")
        print(json.dumps(slim_tool(tool, args.level).to_api(), indent=2))


if __name__ == "__main__":
    main()
