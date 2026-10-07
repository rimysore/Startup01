"""Hybrid retrieval: fuse the rankings of several retrievers.

Two fusion rules:
  rrf     reciprocal rank fusion: sum of w / (rrf_k + rank). Score-scale free.
  minmax  weighted sum of per-retriever scores rescaled to [0, 1] over the pool.
"""

from __future__ import annotations

from typing import Protocol

from .catalog import Tool


class Retriever(Protocol):
    def search(self, query: str, k: int = 5) -> list[tuple[Tool, float]]: ...


class HybridIndex:
    def __init__(
        self,
        retrievers: list[Retriever],
        weights: list[float] | None = None,
        fusion: str = "rrf",
        rrf_k: int = 60,
        pool: int = 20,
    ):
        if fusion not in ("rrf", "minmax"):
            raise ValueError(f"unknown fusion {fusion!r}")
        self.retrievers = retrievers
        self.weights = weights or [1.0] * len(retrievers)
        self.fusion = fusion
        self.rrf_k = rrf_k
        self.pool = pool

    def search(self, query: str, k: int = 5) -> list[tuple[Tool, float]]:
        fused: dict[str, float] = {}
        by_name: dict[str, Tool] = {}  # Tool holds a dict, so it is not hashable
        for retriever, weight in zip(self.retrievers, self.weights):
            hits = retriever.search(query, k=self.pool)
            if not hits:
                continue
            scores = [s for _, s in hits]
            lo, hi = min(scores), max(scores)
            for rank, (tool, score) in enumerate(hits, start=1):
                by_name[tool.name] = tool
                if self.fusion == "rrf":
                    contribution = 1.0 / (self.rrf_k + rank)
                else:
                    contribution = (score - lo) / (hi - lo) if hi > lo else 1.0
                fused[tool.name] = fused.get(tool.name, 0.0) + weight * contribution
        ranked = sorted(fused.items(), key=lambda kv: -kv[1])[:k]
        return [(by_name[name], score) for name, score in ranked]
