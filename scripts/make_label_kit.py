#!/usr/bin/env python3
"""Build a BLIND labeling kit: what an independent author gets, and nothing else.

For each batch the kit holds only tool names, server names, descriptions (truncated) and
parameter names. It deliberately contains no retrieval code, no earlier queries, no results,
and no mention of how the labels will be used. The shared guidelines and a standalone
validator (no imports from this repository) are written next to it.

    python scripts/make_label_kit.py OUT_DIR

Writes OUT_DIR/GUIDELINES.md, OUT_DIR/validate.py and OUT_DIR/<batch>/tools.json for
batches: dev, first-test, second-test, third-test.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from toolslim.catalog import load_catalogs  # noqa: E402

BATCHES = {
    "dev": (["catalogs"], "error"),
    "first-test": (["catalogs/test"], "error"),
    "second-test": (["catalogs/test2"], "error"),
    "third-test": (["catalogs/test3"], "namespace"),  # Word and PowerPoint both define add_table
}
DESC_LIMIT = 700

GUIDELINES = """# Writing search queries for a tool library

An AI assistant can use a library of tools (they come from several servers). Before the assistant
picks a tool it searches the library with a short text query. We are building a set of realistic
queries, each labelled with the tool(s) that would actually do the job, to measure how good that
search is.

You get `tools.json`: every tool has a `name`, the `server` it belongs to, a `description`, and its
`parameters`. Work only from that file and from this guide.

## What to write

For EVERY tool write exactly two queries whose intended target is that tool:

* **user** - what a person would say to their AI assistant, in everyday words, describing what they
  want done and not the tool. Natural, concrete, a full thought ("save these notes to a new file called
  todo.txt in my home folder"). Do not copy the tool's name or description wording unless a real person
  would.
* **agent** - the short query an AI agent would send to a tool-search function when it needs a tool for
  its current step, typically 3 to 10 words ("write text to a file", "list repository branches").

For N tools you write 2N queries.

## What to label

For each query, `expected` lists the tools from `tools.json` that would accomplish what the query asks,
preferred first. Rules:

1. List EVERY tool in the list that would do the job equally well or nearly so (for example two near-duplicate
   tools, or a general tool that can do a specific one's job). Do not list tools that would only partly help.
2. If a query could be answered by tools from different servers, either make the query specific enough that a
   real person would have named the service ("... in my Slack workspace"), or list all the acceptable tools.
3. Use the exact tool names from `tools.json`.
4. Every tool must be the FIRST entry of `expected` in at least one `user` query and at least one `agent` query.
5. No two queries may have the same text. Vary concreteness and phrasing; include realistic specifics
   (names, numbers, paths, dates) the way real requests do.
6. Do not try to make queries easy or hard. Write what a realistic person or agent would write.

## Output

One JSON object per line in a `.jsonl` file:

    {"query": "what is the weather like in Lisbon tomorrow", "expected": ["get_forecast"], "style": "user"}
    {"query": "get weather forecast for a city", "expected": ["get_forecast", "get_current_conditions"], "style": "agent", "note": "either tool answers this"}

(`note` is optional; use it only to explain why several tools are acceptable.) Those two lines are an invented
example, unrelated to your tool list.

Check your file with `python3 validate.py tools.json YOUR_FILE.jsonl` (standalone; it only checks format,
names and coverage) and fix whatever it reports.

Do not read any other file on this machine and do not look anything else up: work only from `tools.json`
and this guide.
"""

VALIDATOR = '''#!/usr/bin/env python3
"""Standalone format check: python3 validate.py tools.json labels.jsonl"""
import json, sys

tools = json.load(open(sys.argv[1]))["tools"]
names = {t["name"] for t in tools}
problems, seen = [], set()
first = {"user": set(), "agent": set()}
n = 0
for lineno, raw in enumerate(open(sys.argv[2]), 1):
    if not raw.strip():
        continue
    n += 1
    try:
        o = json.loads(raw)
    except json.JSONDecodeError as e:
        problems.append(f"line {lineno}: invalid JSON ({e.msg})"); continue
    q, exp, style = o.get("query"), o.get("expected"), o.get("style")
    if not isinstance(q, str) or not q.strip():
        problems.append(f"line {lineno}: 'query' must be a non-empty string"); continue
    if style not in first:
        problems.append(f"line {lineno}: 'style' must be 'user' or 'agent'"); continue
    if not isinstance(exp, list) or not exp or not all(isinstance(x, str) for x in exp):
        problems.append(f"line {lineno}: 'expected' must be a non-empty list of tool names"); continue
    unknown = [x for x in exp if x not in names]
    if unknown:
        problems.append(f"line {lineno}: unknown tool name(s) {unknown}")
    if q.strip().lower() in seen:
        problems.append(f"line {lineno}: duplicate query text")
    seen.add(q.strip().lower())
    if exp[0] in names:
        first[style].add(exp[0])
for style in first:
    missing = sorted(names - first[style])
    if missing:
        problems.append(f"{len(missing)} tool(s) are not the first expected tool of any {style} query: {missing}")
print(f"{n} queries, {len(names)} tools")
for p in problems:
    print("PROBLEM:", p)
print("OK" if not problems else f"{len(problems)} problem(s)")
sys.exit(1 if problems else 0)
'''


def describe(tool) -> dict:
    props = tool.input_schema.get("properties", {}) or {}
    required = set(tool.input_schema.get("required", []) or [])
    params = []
    for name, sub in props.items():
        kind = sub.get("type", "") if isinstance(sub, dict) else ""
        kind = "|".join(kind) if isinstance(kind, list) else kind
        entry = f"{name}{'*' if name in required else ''}"
        if kind:
            entry += f" ({kind})"
        desc = sub.get("description", "") if isinstance(sub, dict) else ""
        params.append(entry + (f": {' '.join(desc.split())[:80]}" if desc else ""))
    text = " ".join(tool.description.split())
    if len(text) > DESC_LIMIT:
        text = text[:DESC_LIMIT].rsplit(" ", 1)[0] + " ..."
    return {"name": tool.name, "server": tool.server, "description": text, "parameters": params}


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    (out / "GUIDELINES.md").write_text(GUIDELINES)
    (out / "validate.py").write_text(VALIDATOR)
    for batch, (dirs, policy) in BATCHES.items():
        tools = load_catalogs([ROOT / d for d in dirs], on_duplicate=policy)
        (out / batch).mkdir(exist_ok=True)
        payload = {"batch": batch, "tools": [describe(t) for t in tools]}
        (out / batch / "tools.json").write_text(json.dumps(payload, indent=1, ensure_ascii=False) + "\n")
        print(f"{batch}: {len(tools)} tools, {len({t.server for t in tools})} servers")


if __name__ == "__main__":
    main()
