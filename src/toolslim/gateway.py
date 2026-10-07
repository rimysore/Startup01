"""Lazy tool gateway: three meta-tools stand in for the whole catalog.

Instead of shipping N tool schemas on every request, the model gets:

  search_tools(query, limit)    -> compact signatures of the best matches
  describe_tool(name)           -> the full (slimmed) schema of one tool
  call_tool(name, arguments)    -> executes the tool

The `tools` array is the same on every request, so the prompt-cache prefix
stays stable. The trade-off: arguments to `call_tool` are an opaque object,
so the API cannot schema-validate them (the gateway checks `required` itself).
"""

from __future__ import annotations

import json
from typing import Any, Callable, Mapping

from .catalog import Tool
from .hybrid import Retriever
from .index import ToolIndex
from .slim import first_sentence, slim_tool

Handler = Callable[..., Any]

_TYPE_ABBREV = {"string": "str", "integer": "int", "boolean": "bool", "number": "num", "array": "list", "object": "obj"}

META_TOOLS = [
    {
        "name": "search_tools",
        "description": "Find tools by describing what you need. Returns matching tool signatures (* = required). Call this before call_tool.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "describe_tool",
        "description": "Get the full input schema of one tool, by exact name.",
        "input_schema": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    },
    {
        "name": "call_tool",
        "description": "Run a tool found via search_tools.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "arguments": {"type": "object"},
            },
            "required": ["name"],
        },
    },
]


def _kind(sub: dict) -> str:
    """Compact type label for one property schema.

    Real schemas use more than a bare string `type`: enums, type lists such as
    ["string", "null"], and anyOf/oneOf unions.
    """
    if "enum" in sub:
        return "|".join(str(v) for v in sub["enum"])
    kind = sub.get("type")
    if isinstance(kind, str):
        return _TYPE_ABBREV.get(kind, kind)
    if isinstance(kind, list):
        return "|".join(_TYPE_ABBREV.get(k, str(k)) for k in kind)
    for union in ("anyOf", "oneOf"):
        if isinstance(sub.get(union), list):
            return "|".join(_kind(option) for option in sub[union] if isinstance(option, dict))
    return "any"


def signature(tool: Tool) -> str:
    """`name(a*:str, b:int, mode:x|y)` - often enough to call the tool without describe_tool."""
    props = tool.input_schema.get("properties", {})
    required = set(tool.input_schema.get("required", []))
    parts = [f"{name}{'*' if name in required else ''}:{_kind(sub)}" for name, sub in props.items()]
    return f"{tool.name}({', '.join(parts)})"


def _dumps(obj: Any) -> str:
    return json.dumps(obj, separators=(",", ":"), ensure_ascii=False, default=str)


class LazyToolGateway:
    def __init__(
        self,
        tools: list[Tool],
        handlers: Mapping[str, Handler] | None = None,
        slim_level: int = 1,
        pinned: tuple[str, ...] = (),
        index: Retriever | None = None,
    ):
        self._tools = {t.name: t for t in tools}
        self._index = index or ToolIndex(tools)
        self._handlers = dict(handlers or {})
        self._slim_level = slim_level
        self._pinned = [self._tools[n] for n in pinned]

    def tool_definitions(self) -> list[dict]:
        """The `tools` array to send on every request (stable across turns)."""
        pinned = [slim_tool(t, self._slim_level).to_api() for t in self._pinned]
        return META_TOOLS + pinned

    def handle(self, name: str, arguments: dict | None = None) -> str:
        """Execute a tool_use block from the model; returns the tool_result text."""
        arguments = arguments or {}
        if name == "search_tools":
            return self.search(arguments.get("query", ""), int(arguments.get("limit", 5)))
        if name == "describe_tool":
            return self.describe(arguments.get("name", ""))
        if name == "call_tool":
            return self.call(arguments.get("name", ""), arguments.get("arguments") or {})
        if any(t.name == name for t in self._pinned):
            return self.call(name, arguments)
        return f"Error: unknown tool {name!r}"

    def search(self, query: str, limit: int = 5) -> str:
        hits = self._index.search(query, k=max(1, min(limit, 10)))
        if not hits:
            return "No matching tools. Try different keywords."
        return "\n".join(f"- {signature(t)}: {first_sentence(t.description, 100)}" for t, _ in hits)

    def describe(self, name: str) -> str:
        tool = self._tools.get(name)
        if tool is None:
            return self._unknown(name)
        return _dumps(slim_tool(tool, self._slim_level).to_api())

    def call(self, name: str, arguments: dict) -> str:
        tool = self._tools.get(name)
        if tool is None:
            return self._unknown(name)
        missing = [r for r in tool.input_schema.get("required", []) if r not in arguments]
        if missing:
            return f"Error: missing required argument(s) for {name}: {', '.join(missing)}. Signature: {signature(tool)}"
        handler = self._handlers.get(name)
        if handler is None:
            return f"Error: tool {name!r} has no handler registered"
        try:
            result = handler(**arguments)
        except Exception as exc:  # surfaced to the model so it can self-correct
            return f"Error: {type(exc).__name__}: {exc}"
        return result if isinstance(result, str) else _dumps(result)

    def _unknown(self, name: str) -> str:
        near = [t.name for t, _ in self._index.search(name, k=3)]
        hint = f" Did you mean: {', '.join(near)}?" if near else ""
        return f"Error: unknown tool {name!r}.{hint}"
