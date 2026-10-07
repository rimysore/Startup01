"""Benchmark: what does each strategy cost in context tokens, and does the
lazy loader still find the right tool?"""

from __future__ import annotations

from dataclasses import dataclass, field

from .catalog import Tool
from .fixtures import synthetic_queries
from .gateway import LazyToolGateway
from .heldout import heldout_queries
from .hybrid import HybridIndex, Retriever
from .index import ToolIndex
from .slim import slim_tool
from .tokens import Counter, estimate_tokens

# (query, expected): expected is one tool name, or several acceptable ones (any is a hit).
Queries = list[tuple[str, "str | tuple[str, ...]"]]


def _wanted(want: "str | tuple[str, ...]") -> tuple[str, ...]:
    return (want,) if isinstance(want, str) else tuple(want)

QUERY_SETS = {
    "dev": synthetic_queries,  # used for choosing the retrieval configuration
    "heldout-user": lambda: heldout_queries("user"),
    "heldout-agent": lambda: heldout_queries("agent"),
}


@dataclass
class Metrics:
    n: int
    recall: dict[int, float]
    mrr: float
    misses: list[tuple[str, str, list[str]]] = field(default_factory=list)


def evaluate(retriever: Retriever, queries: Queries, ks: tuple[int, ...] = (1, 3, 5)) -> Metrics:
    hits = {k: 0 for k in ks}
    rr_sum = 0.0
    misses = []
    for query, want in queries:
        accepted = _wanted(want)
        ranked = [t.name for t, _ in retriever.search(query, k=max(ks))]
        rank = next((i for i, name in enumerate(ranked, start=1) if name in accepted), None)
        if rank is not None:
            rr_sum += 1 / rank
            for k in ks:
                hits[k] += rank <= k
        if rank is None or rank > 5:
            misses.append((query, " | ".join(accepted), ranked[:3]))
    n = len(queries) or 1
    return Metrics(len(queries), {k: v / n for k, v in hits.items()}, rr_sum / n, misses)


def candidate_retrievers(tools: list[Tool]) -> tuple[dict[str, Retriever], str | None]:
    """BM25 always; dense and hybrid variants when `wordllama` is installed.

    Returns (retrievers, note) where note explains anything that was skipped.
    """
    bm25 = ToolIndex(tools)
    out: dict[str, Retriever] = {"bm25": bm25}
    try:
        from .dense import DenseIndex, text_name_desc, text_with_params, wordllama_embedder

        embed = wordllama_embedder()
    except ImportError as exc:
        return out, f"dense/hybrid retrievers skipped ({exc.name or exc} not installed; pip install wordllama)"
    dense = DenseIndex(tools, embed, text_name_desc)
    dense_p = DenseIndex(tools, embed, text_with_params)
    out["dense"] = dense
    out["dense+params"] = dense_p
    out["hybrid-rrf"] = HybridIndex([bm25, dense], fusion="rrf")
    out["hybrid-rrf+params"] = HybridIndex([bm25, dense_p], fusion="rrf")
    out["hybrid-minmax 1:1"] = HybridIndex([bm25, dense], fusion="minmax")
    out["hybrid-minmax 1:2"] = HybridIndex([bm25, dense], weights=[1.0, 2.0], fusion="minmax")
    out["hybrid-minmax+params 1:1"] = HybridIndex([bm25, dense_p], fusion="minmax")
    return out, None


@dataclass
class Report:
    n_tools: int
    full_tokens: int
    primary: str = "bm25"
    slim_tokens: dict[int, int] = field(default_factory=dict)
    lazy_fixed_tokens: int = 0
    lazy_after_discovery_tokens: float = 0.0
    retrieval: dict[str, dict[str, Metrics]] = field(default_factory=dict)
    note: str | None = None

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

        sets = list(next(iter(self.retrieval.values())))
        width = 24
        lines += ["", "Retrieval: recall@5 (MRR) by retriever and query set", ""]
        lines.append(f"{'retriever':<28}" + "".join(f"{s:<{width}}" for s in sets))
        lines.append("-" * (28 + width * len(sets)))
        for name, per_set in self.retrieval.items():
            cells = "".join(f"{f'{per_set[s].recall[5]:.0%} ({per_set[s].mrr:.2f})':<{width}}" for s in sets)
            lines.append(f"{name + (' *' if name == self.primary else ''):<28}{cells}")
        lines.append(f"(* = retriever behind the lazy rows above; n per set: " + ", ".join(f"{s}={next(iter(self.retrieval.values()))[s].n}" for s in sets) + ")")
        if self.note:
            lines += ["", self.note]

        first = self.retrieval[self.primary][sets[0]]
        if first.misses:
            lines += [
                "",
                "Caution: the lazy rows assume the right tool is found on the first search.",
                f"{len(first.misses) / first.n:.0%} of '{sets[0]}' queries missed at k=5 with {self.primary}; "
                "those cost extra search calls (tokens + turns) in practice.",
            ]
        return "\n".join(lines)


def run(
    tools: list[Tool],
    query_sets: dict[str, Queries],
    primary: str = "bm25",
    counter: Counter = estimate_tokens,
    slim_levels: tuple[int, ...] = (1, 2, 3),
) -> Report:
    retrievers, note = candidate_retrievers(tools)
    if primary not in retrievers:
        note = (note + "; " if note else "") + f"primary retriever {primary!r} unavailable, using bm25"
        primary = "bm25"
    full = counter([t.to_api() for t in tools])
    report = Report(n_tools=len(tools), full_tokens=full, primary=primary, note=note)
    for level in slim_levels:
        report.slim_tokens[level] = counter([slim_tool(t, level).to_api() for t in tools])

    gateway = LazyToolGateway(tools, index=retrievers[primary])
    report.lazy_fixed_tokens = counter(gateway.tool_definitions())

    for name, retriever in retrievers.items():
        report.retrieval[name] = {s: evaluate(retriever, q) for s, q in query_sets.items()}

    # Context the lazy path adds once the model has found its tool: the search
    # result plus (worst case) describe_tool for the right one.
    first_queries = next(iter(query_sets.values()))
    discovery = sum(counter(gateway.search(q)) + counter(gateway.describe(_wanted(want)[0])) for q, want in first_queries)
    report.lazy_after_discovery_tokens = report.lazy_fixed_tokens + discovery / (len(first_queries) or 1)
    return report
