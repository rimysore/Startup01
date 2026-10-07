"""Labeled queries for scoring tool retrieval on a real catalog.

File format: JSON Lines, one object per line, blank lines ignored.

    {"query": "show me what is in this folder",
     "expected": ["list_directory", "list_directory_with_sizes"],
     "style": "user",
     "note": "either listing tool answers this"}

  query     what the user (or the model) would type into search_tools
  expected  non-empty list of tool names; ANY of them counts as a hit. List
            every tool that would accomplish the request equally well; the
            first one is the preferred answer.
  style     "user"  - a person's paraphrase, little word overlap with tool names
            "agent" - the short intent a model writes when it searches for a tool
  note      optional, why the label is what it is
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .catalog import Tool
from .index import tokenize

STYLES = ("user", "agent")
LEAK_WARN = 1.0  # a user-style query containing every word of the tool's name is not a paraphrase


class LabelError(ValueError):
    pass


@dataclass(frozen=True)
class Label:
    query: str
    expected: tuple[str, ...]
    style: str = "user"
    note: str = ""
    line: int = 0


def load_labels(path: str | Path) -> list[Label]:
    labels = []
    for lineno, raw in enumerate(Path(path).read_text().splitlines(), start=1):
        if not raw.strip():
            continue
        where = f"{path}:{lineno}"
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise LabelError(f"{where}: invalid JSON ({exc.msg})") from None
        if not isinstance(obj, dict):
            raise LabelError(f"{where}: expected a JSON object")
        query, expected = obj.get("query"), obj.get("expected")
        if isinstance(expected, str):
            expected = [expected]
        if not isinstance(query, str) or not query.strip():
            raise LabelError(f"{where}: 'query' must be a non-empty string")
        if not isinstance(expected, list) or not expected or not all(isinstance(e, str) for e in expected):
            raise LabelError(f"{where}: 'expected' must be a non-empty list of tool names")
        style = obj.get("style", "user")
        if style not in STYLES:
            raise LabelError(f"{where}: 'style' must be one of {STYLES}, got {style!r}")
        labels.append(Label(query.strip(), tuple(expected), style, str(obj.get("note", "")), lineno))
    return labels


def as_query_sets(labels: list[Label]) -> dict[str, list[tuple[str, tuple[str, ...]]]]:
    """Group by style, in the shape `bench.run` takes."""
    sets: dict[str, list[tuple[str, tuple[str, ...]]]] = {}
    for style in STYLES:
        group = [(lb.query, lb.expected) for lb in labels if lb.style == style]
        if group:
            sets[style] = group
    return sets


def name_overlap(query: str, tool_name: str) -> float:
    """Share of the tool name's words that also appear in the query (1.0 = fully leaked)."""
    name_terms = set(tokenize(tool_name))
    return len(name_terms & set(tokenize(query))) / len(name_terms) if name_terms else 0.0


@dataclass
class Check:
    errors: list[str]
    warnings: list[str]
    stats: dict[str, str]

    @property
    def ok(self) -> bool:
        return not self.errors


def check_labels(labels: list[Label], tools: list[Tool]) -> Check:
    names = {t.name for t in tools}
    errors: list[str] = []
    warnings: list[str] = []

    seen: dict[str, int] = {}
    for lb in labels:
        unknown = [e for e in lb.expected if e not in names]
        if unknown:
            errors.append(f"line {lb.line}: unknown tool(s) {unknown} for {lb.query!r}")
        key = lb.query.lower()
        if key in seen:
            errors.append(f"line {lb.line}: duplicate query (first at line {seen[key]}): {lb.query!r}")
        seen.setdefault(key, lb.line)

    labeled = {e for lb in labels for e in lb.expected}
    uncovered = sorted(names - labeled)
    if uncovered:
        warnings.append(f"{len(uncovered)} tool(s) have no labeled query: {', '.join(uncovered)}")

    leaky = [lb for lb in labels if lb.style == "user" and any(name_overlap(lb.query, e) >= LEAK_WARN for e in lb.expected if e in names)]
    for lb in leaky:
        warnings.append(f"line {lb.line}: user-style query contains every word of its tool's name: {lb.query!r}")

    stats: dict[str, str] = {"queries": str(len(labels)), "tools in catalog": str(len(names)), "tools labeled": f"{len(labeled & names)}/{len(names)}"}
    for style in STYLES:
        group = [lb for lb in labels if lb.style == style]
        if group:
            overlaps = [max((name_overlap(lb.query, e) for e in lb.expected if e in names), default=0.0) for lb in group]
            stats[f"{style}: n / mean name overlap"] = f"{len(group)} / {sum(overlaps) / len(overlaps):.2f}"
    multi = sum(len(lb.expected) > 1 for lb in labels)
    stats["queries with several acceptable tools"] = str(multi)
    return Check(errors, warnings, stats)
