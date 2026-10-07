"""Dense (embedding) retrieval. Optional: needs numpy, and `wordllama` for the
bundled default embedder (`pip install toolslim[dense]`).

The embedder is any callable `list[str] -> 2-D array`, so a hosted embedding
API or a sentence-transformers model can be dropped in.
"""

from __future__ import annotations

from typing import Callable, Sequence

import numpy as np

from .catalog import Tool

Embedder = Callable[[Sequence[str]], "np.ndarray"]


def text_name_desc(tool: Tool) -> str:
    return f"{tool.name.replace('_', ' ')}. {tool.description}"


def text_with_server(tool: Tool) -> str:
    """`text_name_desc` prefixed with the server name (unchanged when the tool has none)."""
    server = tool.server.replace("-", " ").replace("_", " ").strip()
    return f"{server} {text_name_desc(tool)}" if server else text_name_desc(tool)


def text_with_params(tool: Tool) -> str:
    params = " ".join(p.replace("_", " ") for p in tool.input_schema.get("properties", {}))
    return f"{text_name_desc(tool)} Parameters: {params}" if params else text_name_desc(tool)


def wordllama_embedder() -> Embedder:
    """Static embeddings bundled inside the `wordllama` wheel (no network).

    `wordllama` 0.4.0 looks for its tokenizer in `<pkg>/tokenizer/` but ships it
    in `<pkg>/tokenizers/`; passing the package dir as `cache_dir` is the
    supported way to make both files resolve locally.
    """
    from pathlib import Path

    import wordllama
    from wordllama import WordLlama

    model = WordLlama.load(cache_dir=Path(wordllama.__file__).parent, disable_download=True)
    return lambda texts: model.embed(list(texts))


def _normalize(m: np.ndarray) -> np.ndarray:
    m = np.atleast_2d(np.asarray(m, dtype=np.float32))
    norms = np.linalg.norm(m, axis=1, keepdims=True)
    return m / np.where(norms == 0, 1.0, norms)


class DenseIndex:
    """Cosine search over embedded tool texts.

    `hub_lambda` > 0 turns on a hubness correction (in the spirit of CSLS): a tool that sits close to
    many other tools in the catalog is a "hub" that wins queries it should not, so its score is reduced
    by `hub_lambda` times its mean cosine similarity to its `hub_k` nearest other tools. Needs no
    queries; 0 (the default) leaves plain cosine similarity.
    """

    def __init__(
        self,
        tools: list[Tool],
        embed: Embedder,
        doc_text: Callable[[Tool], str] = text_name_desc,
        hub_lambda: float = 0.0,
        hub_k: int = 10,
    ):
        self.tools = tools
        self._embed = embed
        self._mat = _normalize(embed([doc_text(t) for t in tools]))
        self._penalty = np.zeros(len(tools), dtype=np.float32)
        if hub_lambda and len(tools) > 1:
            sims = self._mat @ self._mat.T
            np.fill_diagonal(sims, -np.inf)
            k = min(hub_k, len(tools) - 1)
            nearest = -np.partition(-sims, k - 1, axis=1)[:, :k]  # the k largest similarities per tool
            self._penalty = (hub_lambda * nearest.mean(axis=1)).astype(np.float32)

    def search(self, query: str, k: int = 5) -> list[tuple[Tool, float]]:
        scores = self._mat @ _normalize(self._embed([query]))[0] - self._penalty
        order = np.argsort(-scores)[:k]
        return [(self.tools[i], float(scores[i])) for i in order]
