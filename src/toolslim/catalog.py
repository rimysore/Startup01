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
