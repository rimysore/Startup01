"""Schema slimming: remove tokens the model does not need to call a tool.

Levels (each includes the previous):
  0  untouched
  1  structural noise only: `$schema`, `title`, `examples`, `$comment`,
     `additionalProperties: false`. Lossless for tool calling.
  2  1 + descriptions cut to their first sentence (tool: 200 chars, param: 80).
  3  2 + parameter descriptions dropped entirely (names, types, enums and
     `required` are kept). Lossy: validate with the benchmark before using.
"""

from __future__ import annotations

import re
from typing import Any

from .catalog import Tool

TOOL_DESC_LIMIT = 200
PARAM_DESC_LIMIT = 80

_NOISE_KEYS = {"$schema", "title", "examples", "$comment"}
# Values under these keys are data, not schemas: never rewrite them.
_VERBATIM_KEYS = {"enum", "const", "default", "required"}
# Keys whose value maps *names* to sub-schemas: the names must survive.
_NAMED_SCHEMA_MAPS = {"properties", "$defs", "definitions", "patternProperties"}


def first_sentence(text: str, limit: int) -> str:
    text = " ".join(text.split())
    m = re.search(r"(?<=[.!?])\s", text)
    if m:
        text = text[: m.start()]
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(",;:") + "..."
    return text


def _walk(node: Any, level: int) -> Any:
    if isinstance(node, list):
        return [_walk(n, level) for n in node]
    if not isinstance(node, dict):
        return node
    out: dict = {}
    for key, value in node.items():
        if level >= 1 and key in _NOISE_KEYS:
            continue
        if level >= 1 and key == "additionalProperties" and value is False:
            continue
        if key in _NAMED_SCHEMA_MAPS and isinstance(value, dict):
            out[key] = {name: _walk(sub, level) for name, sub in value.items()}
        elif key in _VERBATIM_KEYS:
            out[key] = value
        elif key == "description" and isinstance(value, str):
            if level >= 3:
                continue
            out[key] = first_sentence(value, PARAM_DESC_LIMIT) if level >= 2 else value
        else:
            out[key] = _walk(value, level)
    return out


def slim_tool(tool: Tool, level: int) -> Tool:
    if level <= 0:
        return tool
    description = tool.description
    if level >= 2:
        description = first_sentence(description, TOOL_DESC_LIMIT)
    return Tool(tool.name, description, _walk(tool.input_schema, level))
