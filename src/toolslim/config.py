"""The default retriever, and how it was chosen.

`DEFAULT_RETRIEVER` was picked by `scripts/select_config.py` on dev data only,
by a rule committed before it was run (see `results/dev-selection.json`): the
simplest candidate within one standard error of the best pooled user-style
recall@5. On dev data plain embedding search ("dense") met that bar, so
fusion with BM25 is not part of the default. The result count of
`search_tools` (default 5) was deliberately not tuned.
"""

from __future__ import annotations

from .catalog import Tool
from .hybrid import Retriever
from .index import ToolIndex

DEFAULT_RETRIEVER = "dense"


def default_retriever(tools: list[Tool]) -> tuple[Retriever, str | None]:
    """Build the default retriever; falls back to BM25 (with a note) if the dense extra is missing."""
    try:
        from .dense import DenseIndex, text_name_desc, wordllama_embedder

        return DenseIndex(tools, wordllama_embedder(), text_name_desc), None
    except ImportError as exc:
        note = f"note: {exc.name or 'a dependency'} is not installed, so search falls back to BM25 (pip install toolslim[dense])"
        return ToolIndex(tools), note
