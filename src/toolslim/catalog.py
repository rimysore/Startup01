"""Tool catalog: the shape of an MCP `tools/list` result, plus loading helpers."""

from __future__ import annotations

import json
from dataclasses import dataclass, replace
from pathlib import Path

EMPTY_SCHEMA = {"type": "object", "properties": {}}


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    input_schema: dict
    # Which MCP server the tool comes from (e.g. "notion"). Not part of the API definition;
    # a gateway knows it from its configuration, and it can be used as retrieval context.
    server: str = ""

    def to_api(self) -> dict:
        """The definition as it is sent in the `tools` array of a Messages API request."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


def load_catalogs(paths, on_duplicate: str = "error") -> list[Tool]:
    """Merge several catalogs (files, or directories of *.json) into one.

    This is what an agent connected to several MCP servers sees. Tool names
    must be unique, so a name defined by more than one server is a conflict:

      on_duplicate="error"      (default) raise ValueError
      on_duplicate="namespace"  rename every tool that shares a name to
                                `<server>__<name>`, leaving all other names alone
                                (real MCP clients namespace every tool like this)
    """
    if on_duplicate not in ("error", "namespace"):
        raise ValueError(f"on_duplicate must be 'error' or 'namespace', got {on_duplicate!r}")
    files: list[Path] = []
    for p in map(Path, paths):
        files += sorted(p.glob("*.json")) if p.is_dir() else [p]
    tools: list[tuple[Tool, Path]] = []
    origin: dict[str, Path] = {}
    shared: set[str] = set()
    for f in files:
        for tool in load_catalog(f):
            if tool.name in origin:
                if on_duplicate == "error":
                    raise ValueError(f"duplicate tool name {tool.name!r} in {f} (already defined in {origin[tool.name]})")
                shared.add(tool.name)
            origin.setdefault(tool.name, f)
            tools.append((tool, f))
    out: list[Tool] = []
    for tool, f in tools:
        if tool.name in shared:
            tool = replace(tool, name=f"{tool.server or f.stem}__{tool.name}")
        out.append(tool)
    names = [t.name for t in out]
    if len(set(names)) != len(names):
        dup = sorted({n for n in names if names.count(n) > 1})
        raise ValueError(f"tool names are still not unique after namespacing (the same server twice?): {dup}")
    return out


def load_catalog(path: str | Path) -> list[Tool]:
    """Load tools from a JSON file.

    Accepts either a raw MCP `tools/list` result (`{"tools": [...]}` with
    `inputSchema`) or a plain list of Messages API tool definitions
    (`input_schema`).
    """
    data = json.loads(Path(path).read_text())
    items = data["tools"] if isinstance(data, dict) else data
    server = str(data.get("source", {}).get("name", "")) if isinstance(data, dict) else ""
    return [
        Tool(
            name=t["name"],
            description=t.get("description", ""),
            input_schema=t.get("inputSchema") or t.get("input_schema") or EMPTY_SCHEMA,
            server=server,
        )
        for t in items
    ]
