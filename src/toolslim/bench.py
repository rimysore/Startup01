"""Benchmark: what does each strategy cost in context tokens, and does the
lazy loader still find the right tool?"""

from __future__ import annotations

from dataclasses import dataclass, field

from .catalog import Tool
from .gateway import LazyToolGateway
from .index import ToolIndex
from .slim import slim_tool
from .tokens import Counter, estimate_tokens


@dataclass
class Report:
    n_tools: int
    full_tokens: int
    n_queries: int = 0
    slim_tokens: dict[int, int] = field(default_factory=dict)
    lazy_fixed_tokens: int = 0
    lazy_after_discovery_tokens: float = 0.0
    recall_at: dict[int, float] = field(default_factory=dict)
    mrr: float = 0.0
    misses: list[tuple[str, str, list[str]]] = field(default_factory=list)

    def render(self) -> str:
        pct = lambda t: f"{100 * (1 - t / self.full_tokens):5.1f}% less"  # noqa: E731
        rows = [("all schemas, as published", self.full_tokens, "")]
        for level, tokens in sorted(self.slim_tokens.items()):
            rows.append((f"slimmed, level {level}", tokens, pct(tokens)))
        rows.append(("lazy gateway, first request", self.lazy_fixed_tokens, pct(self.lazy_fixed_tokens)))
        after = round(self.lazy_after_discovery_tokens)
        rows.append(("lazy gateway, after search+describe", after, pct(after)))
        lines = [
            f"Catalog: {self.n_tools} tools (token counts are estimates)",
            "",
            f"{'strategy':<38}{'tokens/request':>15}   vs. full",
            "-" * 68,
        ]
        lines += [f"{name:<38}{tokens:>15,}   {delta}" for name, tokens, delta in rows]
        lines += ["", "Tool retrieval (BM25 over name + description + param names):"]
        lines += [f"  recall@{k}: {v:.0%}" for k, v in sorted(self.recall_at.items())]
        lines.append(f"  MRR:      {self.mrr:.2f}")
        if self.misses:
            missed = len(self.misses) / self.n_queries
            lines += [
                "",
                "Caution: the lazy rows assume the right tool is found on the first search.",
                f"{missed:.0%} of queries missed at k=5; those cost extra search calls (tokens + turns) in practice.",
            ]
        if self.misses:
            lines += ["", f"Missed at k=5 ({len(self.misses)}):"]
            lines += [f"  {q!r}\n      wanted {want}, got {got or 'nothing'}" for q, want, got in self.misses]
        return "\n".join(lines)


def run(
    tools: list[Tool],
    queries: list[tuple[str, str]],
    counter: Counter = estimate_tokens,
    ks: tuple[int, ...] = (1, 3, 5),
    slim_levels: tuple[int, ...] = (1, 2, 3),
) -> Report:
    full = counter([t.to_api() for t in tools])
    report = Report(n_tools=len(tools), full_tokens=full, n_queries=len(queries))
    for level in slim_levels:
        report.slim_tokens[level] = counter([slim_tool(t, level).to_api() for t in tools])

    gateway = LazyToolGateway(tools)
    report.lazy_fixed_tokens = counter(gateway.tool_definitions())

    index = ToolIndex(tools)
    hits_at = {k: 0 for k in ks}
    rr_sum = 0.0
    discovery_sum = 0
    for query, want in queries:
        ranked = [t.name for t, _ in index.search(query, k=max(ks))]
        if want in ranked:
            rank = ranked.index(want) + 1
            rr_sum += 1 / rank
            for k in ks:
                hits_at[k] += rank <= k
        if want not in ranked[:5]:
            report.misses.append((query, want, ranked[:3]))
        # Context the lazy path adds once the model has found its tool:
        # the search result plus (worst case) describe_tool for the right one.
        discovery_sum += counter(gateway.search(query)) + counter(gateway.describe(want))

    n = len(queries) or 1
    report.recall_at = {k: hits_at[k] / n for k in ks}
    report.mrr = rr_sum / n
    report.lazy_after_discovery_tokens = report.lazy_fixed_tokens + discovery_sum / n
    return report
