"""The default retriever, and how it was chosen.

`DEFAULT_RETRIEVER` is set by a rule fixed before it was run, on dev data only:
round 1 (`scripts/select_config.py`, `results/dev-selection.json`) chose plain
`dense`; round 2 (`scripts/select_default_v2.py`, `results/dev-selection-v2.json`)
re-ran the choice on all dev data after the second test batch showed dense was weak
on model-written (agent-style) queries, and adopted `hybrid-rrf+server`: BM25 and
dense rankings fused with reciprocal rank fusion, with the tool's server name in the
index text. See the README for the evidence and for how much of the gain comes from
each part. The result count of `search_tools` (default 5) was deliberately not tuned.
"""

from __future__ import annotations

from .catalog import Tool
from .hybrid import Retriever
from .index import ToolIndex
from .retrievers import build_retriever

DEFAULT_RETRIEVER = "hybrid-rrf+server"


def default_retriever(tools: list[Tool]) -> tuple[Retriever, str | None]:
    """Build the default retriever; falls back to BM25 (with a note) if the dense extra is missing."""
    try:
        return build_retriever(DEFAULT_RETRIEVER, tools), None
    except ImportError as exc:
        note = f"note: {exc.name or 'a dependency'} is not installed, so search falls back to BM25 (pip install toolslim[dense])"
        return ToolIndex(tools, use_server=DEFAULT_RETRIEVER.endswith("+server")), note
