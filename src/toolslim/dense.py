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
    def __init__(self, tools: list[Tool], embed: Embedder, doc_text: Callable[[Tool], str] = text_name_desc):
        self.tools = tools
        self._embed = embed
        self._mat = _normalize(embed([doc_text(t) for t in tools]))

    def search(self, query: str, k: int = 5) -> list[tuple[Tool, float]]:
        sims = self._mat @ _normalize(self._embed([query]))[0]
        order = np.argsort(-sims)[:k]
        return [(self.tools[i], float(sims[i])) for i in order]
