"""Schema slimming: remove tokens the model does not need to call a tool.

Levels (each includes the previous):
  0  untouched
  1  structural noise only: `$schema`, `title`, `examples`, `$comment`,
     `additionalProperties: false`, and `$defs`/`definitions` entries that no
     `$ref` reaches. Lossless for tool calling.
  2  1 + descriptions cut to their first sentence (tool: 200 chars, param: 80).
  3  2 + parameter descriptions dropped entirely (names, types, enums and
     `required` are kept). Lossy: validate with the benchmark before using.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import unquote

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


_DEF_CONTAINERS = ("$defs", "definitions")
# Reference mechanisms this module does not resolve. If any appears, pruning is skipped.
_UNRESOLVABLE_KEYS = {"$id", "$anchor", "$dynamicRef", "$dynamicAnchor", "$recursiveRef", "$recursiveAnchor"}


def _scan_refs(node: Any, refs: list[str]) -> bool:
    """Append every `$ref` string under `node` to `refs`.

    Returns False when `node` uses a reference mechanism we cannot resolve, in
    which case the caller must not prune. Deliberately over-collects (it also
    sees `$ref`-looking data inside `default`/`const`): keeping an extra
    definition is always safe, dropping a needed one is not.
    """
    if isinstance(node, list):
        return all([_scan_refs(item, refs) for item in node])
    if isinstance(node, dict):
        for key, value in node.items():
            if key in _UNRESOLVABLE_KEYS:
                return False
            if key == "$ref" and isinstance(value, str):
                refs.append(value)
            elif not _scan_refs(value, refs):
                return False
    return True


def _def_target(ref: str) -> tuple[str, str] | None:
    """`#/$defs/Name[/...]` -> ("$defs", "Name"), with JSON-pointer and URI unescaping."""
    for container in _DEF_CONTAINERS:
        prefix = f"#/{container}"
        if ref == prefix:
            return container, ""
        if ref.startswith(prefix + "/"):
            name = ref[len(prefix) + 1 :].split("/", 1)[0]
            return container, unquote(name).replace("~1", "/").replace("~0", "~")
    return None


def prune_unused_defs(schema: dict) -> dict:
    """Drop root `$defs`/`definitions` entries not reachable from the rest of the schema.

    Reachability follows `$ref` transitively, so a definition used only by
    another used definition stays, and a self-referencing definition that
    nothing else reaches goes. Many OpenAPI-derived servers attach the same
    block of definitions to every tool whether or not it uses them. Returns
    `schema` itself when there is nothing to prune or pruning is not provably safe.
    """
    containers = {c: schema[c] for c in _DEF_CONTAINERS if isinstance(schema.get(c), dict)}
    if not containers:
        return schema
    body = {k: v for k, v in schema.items() if k not in containers}
    pending: list[str] = []
    if not _scan_refs(body, pending):
        return schema

    keep: dict[str, set[str]] = {c: set() for c in containers}
    while pending:
        target = _def_target(pending.pop())
        if target is None:
            continue
        container, name = target
        if name == "":  # a ref to the whole container: cannot tell what it needs
            return schema
        if container not in containers or name not in containers[container] or name in keep[container]:
            continue  # dangling or already handled
        keep[container].add(name)
        if not _scan_refs(containers[container][name], pending):
            return schema

    out: dict = {}
    for key, value in schema.items():
        if key in containers:
            kept = {n: v for n, v in value.items() if n in keep[key]}
            if kept:
                out[key] = kept
        else:
            out[key] = value
    return out


def slim_tool(tool: Tool, level: int) -> Tool:
    if level <= 0:
        return tool
    description = tool.description
    if level >= 2:
        description = first_sentence(description, TOOL_DESC_LIMIT)
    return Tool(tool.name, description, prune_unused_defs(_walk(tool.input_schema, level)))
