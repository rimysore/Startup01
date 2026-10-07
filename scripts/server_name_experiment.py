#!/usr/bin/env python3
"""Does putting the server name in each tool's index text improve retrieval? DEV data only.

This file was committed BEFORE it was run. It never reads `catalogs/test2/` or
`queries/mcp-test2.jsonl` (the untouched final test); a unit test checks that
this file never names them.

Motivation and a caveat: the idea comes from failure analyses of the dev set
(16 of 24 misses were cross-server) and of the first test set (20 of 28). So
the data used here is the data that inspired the idea, and passing the rule
below is weaker evidence than a gain on fresh data. The rule only decides
whether the idea has earned a confirmation run on the untouched batch.

What varies: only whether the index text of a tool includes its server name.
  dense         doc text = "name words. description"                 (current default)
  dense+server  doc text = "server name words. description"
(and, for context, the same switch on BM25 and on hybrid-rrf)

Setting. Cross-server confusion exists only when servers share a catalog, so the
real data is evaluated MERGED, as an agent connected to all of them would see it:
  synthetic    40 tools, 8 servers (service prefixes)
               user-style 80 (dev 40 + held-out 40), agent-style 40
  real-merged  148 tools, 13 servers = catalogs/ + catalogs/test/ (the spent test set)
               user-style 147 (mcp-reference 77 + mcp-test 70), agent-style 147
Reported but not used in the decision: the same real queries on their own
separate catalogs.

Decision rule: adopt `dense+server` as the default iff ALL hold, on user-style
queries pooled over the two sources above (metric: hit within the top 5):
  (a) paired sign test: with g = queries `dense+server` finds and `dense`
      misses, l = the reverse, require g - l >= 2 * sqrt(g + l) and g > l;
  (b) pooled agent-style recall@5 of `dense+server` is not more than 2 points
      below `dense`;
  (c) g - l >= 0 in each of the two sources (no source gets worse).
Otherwise keep `dense`. MRR and recall@10 are reported, not used.

Writes results/server-name-dev.json.
"""

from __future__ import annotations

import json
import math
import platform
import sys
from importlib.metadata import version
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from toolslim import bench  # noqa: E402
from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import DenseIndex, text_name_desc, text_with_server, wordllama_embedder  # noqa: E402
from toolslim.fixtures import synthetic_catalog  # noqa: E402
from toolslim.hybrid import HybridIndex  # noqa: E402
from toolslim.index import ToolIndex  # noqa: E402
from toolslim.labels import as_query_sets, load_labels  # noqa: E402

VARIANTS = ["bm25", "bm25+server", "dense", "dense+server", "hybrid-rrf", "hybrid-rrf+server"]
PAIRS = [("dense", "dense+server"), ("bm25", "bm25+server"), ("hybrid-rrf", "hybrid-rrf+server")]
DECISION_PAIR = ("dense", "dense+server")
AGENT_GUARD = 0.02
Z = 2.0


def build(tools, embed):
    bm25, bm25s = ToolIndex(tools), ToolIndex(tools, use_server=True)
    dense, denses = DenseIndex(tools, embed, text_name_desc), DenseIndex(tools, embed, text_with_server)
    return {
        "bm25": bm25,
        "bm25+server": bm25s,
        "dense": dense,
        "dense+server": denses,
        "hybrid-rrf": HybridIndex([bm25, dense]),
        "hybrid-rrf+server": HybridIndex([bm25s, denses]),
    }


def ranks(retriever, queries):
    """Best rank (1-based, up to 10) of any accepted tool for each query; None if absent."""
    out = []
    for query, want in queries:
        accepted = {want} if isinstance(want, str) else set(want)
        names = [t.name for t, _ in retriever.search(query, k=10)]
        out.append(next((i for i, n in enumerate(names, start=1) if n in accepted), None))
    return out


def hit5(rank):
    return rank is not None and rank <= 5


def sources():
    dev = load_catalogs([ROOT / "catalogs"])
    spent = load_catalogs([ROOT / "catalogs" / "test"])  # the first test set, spent: dev data from now on
    ref = as_query_sets(load_labels(ROOT / "queries" / "mcp-reference.jsonl"))
    spt = as_query_sets(load_labels(ROOT / "queries" / "mcp-test.jsonl"))
    primary = [
        ("synthetic", synthetic_catalog(), {"user": bench.QUERY_SETS["dev"]() + bench.QUERY_SETS["heldout-user"](), "agent": bench.QUERY_SETS["heldout-agent"]()}),
        ("real-merged", dev + spent, {"user": ref["user"] + spt["user"], "agent": ref["agent"] + spt["agent"]}),
    ]
    secondary = [("real-dev-alone", dev, ref), ("real-spent-alone", spent, spt)]
    return primary, secondary


def evaluate_source(tools, query_sets, embed):
    retrievers = build(tools, embed)
    return {v: {style: ranks(r, qs) for style, qs in query_sets.items()} for v, r in retrievers.items()}


def paired(base_ranks, var_ranks):
    g = sum(hit5(v) and not hit5(b) for b, v in zip(base_ranks, var_ranks))
    l = sum(hit5(b) and not hit5(v) for b, v in zip(base_ranks, var_ranks))
    return g, l


def summary(rank_lists):
    n = len(rank_lists)
    return {
        "n": n,
        "recall5": sum(hit5(r) for r in rank_lists) / n,
        "recall10": sum(r is not None for r in rank_lists) / n,
        "mrr": sum(1 / r for r in rank_lists if r is not None) / n,
    }


def main() -> None:
    try:
        embed = wordllama_embedder()
    except ImportError as exc:
        sys.exit(f"needs the dense extra: {exc}")
    primary, secondary = sources()
    results = {name: evaluate_source(tools, qs, embed) for name, tools, qs in primary + secondary}
    sizes = {name: {"tools": len(tools), "servers": len({t.server for t in tools}), **{s: len(q) for s, q in qs.items()}} for name, tools, qs in primary + secondary}

    def pooled(variant, style, names):
        return [r for n in names for r in results[n][variant][style]]

    pn = [n for n, _, _ in primary]
    print("sources:", json.dumps(sizes))
    print(f"\nPOOLED over {pn} (the decision data)")
    print(f"{'variant':<20}{'user r@5':>10}{'MRR':>7}{'r@10':>7}{'agent r@5':>11}")
    pooled_rows = {}
    for v in VARIANTS:
        u, a = summary(pooled(v, "user", pn)), summary(pooled(v, "agent", pn))
        pooled_rows[v] = {"user": u, "agent": a}
        print(f"{v:<20}{u['recall5']:>10.1%}{u['mrr']:>7.2f}{u['recall10']:>7.1%}{a['recall5']:>11.1%}")

    print("\nPAIRED (user-style, top-5): gained g / lost l, by source")
    pair_rows = {}
    for base, var in PAIRS:
        row = {}
        for name in pn + [n for n, _, _ in secondary]:
            row[name] = paired(results[name][base]["user"], results[name][var]["user"])
        g, l = paired(pooled(base, "user", pn), pooled(var, "user", pn))
        row["POOLED"] = (g, l)
        pair_rows[f"{base} -> {var}"] = row
        cells = "  ".join(f"{k}: +{v[0]}/-{v[1]}" for k, v in row.items())
        print(f"  {base:<12} -> {var:<18}{cells}")

    base, var = DECISION_PAIR
    g, l = pair_rows[f"{base} -> {var}"]["POOLED"]
    need = Z * math.sqrt(g + l)
    a_base, a_var = pooled_rows[base]["agent"]["recall5"], pooled_rows[var]["agent"]["recall5"]
    per_source = {n: pair_rows[f"{base} -> {var}"][n] for n in pn}
    cond_a = g > l and (g - l) >= need
    cond_b = a_var >= a_base - AGENT_GUARD
    cond_c = all(gg - ll >= 0 for gg, ll in per_source.values())
    adopt = cond_a and cond_b and cond_c
    print(f"\nDECISION {var} vs {base}")
    print(f"  (a) paired sign test: g={g}, l={l}, g-l={g - l}, need >= {need:.2f}  -> {'pass' if cond_a else 'FAIL'}")
    print(f"  (b) agent-style guard: {a_var:.1%} vs {a_base:.1%} (allowed drop {AGENT_GUARD:.0%})  -> {'pass' if cond_b else 'FAIL'}")
    print(f"  (c) no source worse: {per_source}  -> {'pass' if cond_c else 'FAIL'}")
    print(f"  => {'ADOPT ' + var if adopt else 'KEEP ' + base}")

    out = {
        "decision": var if adopt else base,
        "rule": "paired sign test z>=2 on pooled user-style recall@5; agent-style guard 2 points; no source worse",
        "conditions": {"a_sign_test": cond_a, "b_agent_guard": cond_b, "c_no_source_worse": cond_c},
        "decision_pair": {"gained": g, "lost": l, "needed_margin": need},
        "pooled": pooled_rows,
        "paired_by_source": {k: {s: list(v) for s, v in row.items()} for k, row in pair_rows.items()},
        "sizes": sizes,
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
        "caveat": "the idea was generated from failures on this very data; confirm on the untouched batch",
    }
    results_dir = ROOT / "results"
    results_dir.mkdir(exist_ok=True)
    (results_dir / "server-name-dev.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"\nwrote {results_dir / 'server-name-dev.json'}")


if __name__ == "__main__":
    main()
