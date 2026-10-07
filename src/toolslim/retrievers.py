"""Build any named retriever. Names match the ones used in the selection scripts."""

from __future__ import annotations

from .catalog import Tool
from .hybrid import HybridIndex, Retriever
from .index import ToolIndex

NAMES = [
    "bm25",
    "dense",
    "bm25+server",
    "dense+server",
    "hybrid-rrf",
    "hybrid-rrf+server",
    "hybrid-minmax 1:1",
    "hybrid-minmax 1:1+server",
]


def build_retriever(name: str, tools: list[Tool], embed=None) -> Retriever:
    """Construct the retriever called `name`.

    `+server` variants put the tool's server name into its index text (BM25 name
    field, dense document text); tools without a server are unaffected.
    Dense and hybrid variants need the `dense` extra (raises ImportError without it).
    """
    if name not in NAMES:
        raise ValueError(f"unknown retriever {name!r}; choose from {NAMES}")
    use_server = name.endswith("+server")
    base = name.removesuffix("+server")
    if base == "bm25":
        return ToolIndex(tools, use_server=use_server)

    from .dense import DenseIndex, text_name_desc, text_with_server, wordllama_embedder

    embed = embed or wordllama_embedder()
    dense = DenseIndex(tools, embed, text_with_server if use_server else text_name_desc)
    if base == "dense":
        return dense
    fusion = "rrf" if base == "hybrid-rrf" else "minmax"
    return HybridIndex([ToolIndex(tools, use_server=use_server), dense], fusion=fusion)
