"""Tool catalog: the shape of an MCP `tools/list` result, plus loading helpers."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

EMPTY_SCHEMA = {"type": "object", "properties": {}}


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    input_schema: dict

    def to_api(self) -> dict:
        """The definition as it is sent in the `tools` array of a Messages API request."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


def load_catalogs(paths) -> list[Tool]:
    """Merge several catalogs (files, or directories of *.json) into one.

    This is what an agent connected to several MCP servers sees. Tool names
    must be unique across servers.
    """
    files: list[Path] = []
    for p in map(Path, paths):
        files += sorted(p.glob("*.json")) if p.is_dir() else [p]
    tools: list[Tool] = []
    origin: dict[str, Path] = {}
    for f in files:
        for tool in load_catalog(f):
            if tool.name in origin:
                raise ValueError(f"duplicate tool name {tool.name!r} in {f} (already defined in {origin[tool.name]})")
            origin[tool.name] = f
            tools.append(tool)
    return tools


def load_catalog(path: str | Path) -> list[Tool]:
    """Load tools from a JSON file.

    Accepts either a raw MCP `tools/list` result (`{"tools": [...]}` with
    `inputSchema`) or a plain list of Messages API tool definitions
    (`input_schema`).
    """
    data = json.loads(Path(path).read_text())
    items = data["tools"] if isinstance(data, dict) else data
    return [
        Tool(
            name=t["name"],
            description=t.get("description", ""),
            input_schema=t.get("inputSchema") or t.get("input_schema") or EMPTY_SCHEMA,
        )
        for t in items
    ]
