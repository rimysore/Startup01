#!/usr/bin/env python3
"""Choose the default retriever using DEV data only, by a rule fixed in advance.

This file was committed BEFORE it was run. The fresh test set (`catalogs/test/`,
`queries/mcp-test.jsonl`) is deliberately not read here, and a unit test checks
that this file never names it.

Dev data pooled across three sources (all of which the author has already seen
results for, which is why they are dev and not test):
  - synthetic catalog, dev queries                (40 user-style)
  - synthetic catalog, held-out user queries      (40 user-style)
  - real servers in catalogs/, queries/mcp-reference.jsonl  (77 user-style)
and, as a guard, the agent-style queries of the synthetic held-out set and of
mcp-reference.jsonl (117 queries).

Candidates: the retrievers built by `toolslim.bench.candidate_retrievers`.

Rule (one-standard-error, prefer the simpler):
  1. Metric: pooled user-style recall@5 (hits / queries).
  2. Guard: a candidate is ineligible if its pooled agent-style recall@5 is more
     than 2 points below the best candidate's.
  3. best = highest user-style recall among candidates passing the guard;
     SE = sqrt(best * (1 - best) / n_user).
  4. Eligible = passing the guard and user-style recall >= best - SE.
  5. Choose the eligible candidate that comes first in SIMPLICITY below
     (fewer moving parts first). MRR and recall@10 are reported, not used.

The result count (`limit` of search_tools, default 5) is NOT decided here: the
model passes it per call, and the right value depends on what an extra search
turn costs, which dev data cannot measure. Recall@10 is reported for reference.

Writes results/dev-selection.json.
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
from toolslim.fixtures import synthetic_catalog  # noqa: E402
from toolslim.labels import as_query_sets, load_labels  # noqa: E402

# Simplest first: single retrievers, then fusion without knobs, then richer
# document text, then a weight knob.
SIMPLICITY = [
    "bm25",
    "dense",
    "dense+params",
    "hybrid-rrf",
    "hybrid-minmax 1:1",
    "hybrid-rrf+params",
    "hybrid-minmax+params 1:1",
    "hybrid-minmax 1:2",
]
KS = (1, 3, 5, 10)
AGENT_GUARD = 0.02


def dev_sources():
    synthetic = {
        "user": bench.QUERY_SETS["dev"]() + bench.QUERY_SETS["heldout-user"](),
        "agent": bench.QUERY_SETS["heldout-agent"](),
    }
    real = as_query_sets(load_labels(ROOT / "queries" / "mcp-reference.jsonl"))
    return [("synthetic", synthetic_catalog(), synthetic), ("real-dev", load_catalogs([ROOT / "catalogs"]), real)]


def main() -> None:
    pooled: dict[str, dict[str, dict]] = {}  # retriever -> style -> {"n", "hits", "mrr_sum"}
    for _, tools, sets in dev_sources():
        retrievers, note = bench.candidate_retrievers(tools)
        if note:
            sys.exit(f"cannot select without dense retrievers: {note}")
        for name, retriever in retrievers.items():
            for style, queries in sets.items():
                m = bench.evaluate(retriever, queries, ks=KS)
                acc = pooled.setdefault(name, {}).setdefault(style, {"n": 0, "hits5": 0.0, "hits10": 0.0, "mrr_sum": 0.0})
                acc["n"] += m.n
                acc["hits5"] += m.recall[5] * m.n
                acc["hits10"] += m.recall[10] * m.n
                acc["mrr_sum"] += m.mrr * m.n

    assert set(pooled) == set(SIMPLICITY), set(pooled) ^ set(SIMPLICITY)
    rows = {}
    for name, styles in pooled.items():
        u, a = styles["user"], styles["agent"]
        rows[name] = {
            "user_recall5": u["hits5"] / u["n"],
            "user_hits5": round(u["hits5"]),
            "user_n": u["n"],
            "user_recall10": u["hits10"] / u["n"],
            "user_mrr": u["mrr_sum"] / u["n"],
            "agent_recall5": a["hits5"] / a["n"],
            "agent_n": a["n"],
        }

    best_agent = max(r["agent_recall5"] for r in rows.values())
    guarded = [n for n, r in rows.items() if r["agent_recall5"] >= best_agent - AGENT_GUARD]
    best = max(rows[n]["user_recall5"] for n in guarded)
    n_user = next(iter(rows.values()))["user_n"]
    se = math.sqrt(best * (1 - best) / n_user)
    eligible = [n for n in guarded if rows[n]["user_recall5"] >= best - se]
    chosen = min(eligible, key=SIMPLICITY.index)

    print(f"dev queries pooled: user-style n={n_user}, agent-style n={next(iter(rows.values()))['agent_n']}")
    print(f"best guarded user recall@5 = {best:.3f}; SE = {se:.3f}; eligibility threshold = {best - se:.3f}\n")
    print(f"{'retriever':<28}{'user r@5':>10}{'hits':>9}{'MRR':>7}{'r@10':>7}{'agent r@5':>11}  eligible")
    for name in SIMPLICITY:
        r = rows[name]
        flag = ("yes" if name in eligible else "no") + ("  <- chosen" if name == chosen else "")
        print(f"{name:<28}{r['user_recall5']:>10.1%}{r['user_hits5']:>6}/{n_user:<3}{r['user_mrr']:>7.2f}{r['user_recall10']:>7.1%}{r['agent_recall5']:>11.1%}  {flag}")
    print(f"\nchosen: {chosen}")

    out = {
        "chosen": chosen,
        "rule": "pooled user-style recall@5, 1-SE rule, simplest eligible; agent-style guard 2 points",
        "best_user_recall5": best,
        "se": se,
        "threshold": best - se,
        "simplicity_order": SIMPLICITY,
        "candidates": rows,
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
        "data": ["synthetic: dev + heldout-user + heldout-agent", "real-dev: catalogs/ + queries/mcp-reference.jsonl"],
    }
    results = ROOT / "results"
    results.mkdir(exist_ok=True)
    (results / "dev-selection.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"wrote {results / 'dev-selection.json'}")


if __name__ == "__main__":
    main()
