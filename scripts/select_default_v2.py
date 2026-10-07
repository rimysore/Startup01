#!/usr/bin/env python3
"""Choose the default retriever, round 2, on DEV data only, by a rule fixed in advance.

This file was committed BEFORE it was run. It never reads `catalogs/test3/` (the
untouched confirmation batch, still unlabeled); a unit test checks that this file
never names it.

Disclosure: this rule was written after the author had seen the headline numbers
of the second test batch (including that plain `dense` was weak on agent-style
queries there and that putting the server name in the index text helped). So it
is not blind. The confirmation is the third batch, scored once afterwards.

Why a new rule. Round 1 used user-style recall only, with a loose 2-point
agent-style guard, and picked plain `dense`; on the next batch its agent-style
recall was 9.5 points below BM25's. Model-written queries are probably the main
regime for a real gateway, so both styles count here.

Data (all of it dev: it includes the two batches that were scored and are spent):
  synthetic     40 tools, 8 servers; user-style 80, agent-style 40
  real-merged   253 tools, 19 servers = catalogs/ + catalogs/test/ + catalogs/test2/,
                all merged into ONE catalog (cross-server confusion needs shared
                catalogs); user-style 252, agent-style 252 from mcp-reference,
                mcp-test and mcp-test2
"Sources" for the do-no-harm check: synthetic, and the real queries split by file
(dev / spent-test / test2), each scored against the merged catalog.

Candidates: bm25, dense, hybrid-rrf, hybrid-minmax 1:1, each with and without the
server name in the index text (8 in all).

Rule (all thresholds fixed here). Metric: a query is a hit if an accepted tool is
in the top 5. "All" pools both styles.
  1. Eligible = pooled agent-style recall within 1 point of the best candidate's.
  2. best = highest pooled "all" recall among eligible (ties: simplest).
  3. tied = eligible candidates that `best` is NOT significantly better than,
     by a paired sign test on all queries: significant iff g > l and
     g - l >= 2 * sqrt(g + l), with g = queries best hits and the other misses,
     l = the reverse. Choose the SIMPLEST tied candidate (order below).
  4. Adopt that choice over the incumbent `dense` only if (a) it beats `dense`
     in the same paired test on all queries AND (b) in every source its "all"
     recall is not more than 2 points below `dense`'s. Otherwise keep `dense`.
MRR and recall@10 are reported, not used. The result count (`limit`, default 5)
and the BM25 camel-case tokenizer are deliberately not touched here.

Writes results/dev-selection-v2.json.
"""

from __future__ import annotations

import json
import math
import platform
import sys
from importlib.metadata import version
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import server_name_experiment as sne  # noqa: E402  (build, ranks, hit5)

from toolslim import bench  # noqa: E402
from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import wordllama_embedder  # noqa: E402
from toolslim.fixtures import synthetic_catalog  # noqa: E402
from toolslim.hybrid import HybridIndex  # noqa: E402
from toolslim.labels import as_query_sets, load_labels  # noqa: E402

# Simplest first. A server-name prefix is a smaller change than a second retriever.
SIMPLICITY = [
    "bm25",
    "dense",
    "bm25+server",
    "dense+server",
    "hybrid-rrf",
    "hybrid-rrf+server",
    "hybrid-minmax 1:1",
    "hybrid-minmax 1:1+server",
]
INCUMBENT = "dense"
AGENT_GUARD = 0.01
HARM = 0.02
Z = 2.0


def sign_test(hits, a, b, idx):
    """(g, l): queries `a` hits and `b` misses, and the reverse."""
    g = sum(hits[a][i] and not hits[b][i] for i in idx)
    l = sum(hits[b][i] and not hits[a][i] for i in idx)
    return g, l


def significantly_better(hits, a, b, idx):
    g, l = sign_test(hits, a, b, idx)
    return g > l and (g - l) >= Z * math.sqrt(g + l)


def decide(hits, styles, sources, simplicity=SIMPLICITY, incumbent=INCUMBENT):
    """The rule, as a pure function.

    hits[v][i]  bool, candidate v found an accepted tool in the top 5 for query i
    styles[i]   "user" | "agent";  sources[i]  source name of query i
    """
    n = len(styles)
    everything = list(range(n))
    agent = [i for i in everything if styles[i] == "agent"]
    user = [i for i in everything if styles[i] == "user"]
    by_source = {s: [i for i in everything if sources[i] == s] for s in dict.fromkeys(sources)}
    rec = lambda v, idx: sum(hits[v][i] for i in idx) / len(idx)  # noqa: E731
    order = {v: k for k, v in enumerate(simplicity)}

    best_agent = max(rec(v, agent) for v in simplicity)
    eligible = [v for v in simplicity if rec(v, agent) >= best_agent - AGENT_GUARD]
    best = max(eligible, key=lambda v: (rec(v, everything), -order[v]))
    tied = [v for v in eligible if v == best or not significantly_better(hits, best, v, everything)]
    chosen = min(tied, key=lambda v: order[v])

    adopt, reasons = False, []
    if chosen == incumbent:
        reasons.append(f"the rule chose the incumbent {incumbent}")
    else:
        g, l = sign_test(hits, chosen, incumbent, everything)
        beats = significantly_better(hits, chosen, incumbent, everything)
        worst_source = min(rec(chosen, ix) - rec(incumbent, ix) for ix in by_source.values())
        harm_ok = worst_source >= -HARM
        reasons.append(f"(a) vs {incumbent}: gained {g}, lost {l}, need g-l >= {Z * math.sqrt(g + l):.2f} -> {'pass' if beats else 'FAIL'}")
        reasons.append(f"(b) worst source difference vs {incumbent}: {worst_source:+.3f} (allowed >= {-HARM:+.3f}) -> {'pass' if harm_ok else 'FAIL'}")
        adopt = beats and harm_ok

    return {
        "best_eligible": best,
        "eligible": eligible,
        "tied_with_best": tied,
        "chosen_by_rule": chosen,
        "decision": chosen if adopt else incumbent,
        "adopted": adopt,
        "reasons": reasons,
        "table": {
            v: {
                "all": rec(v, everything),
                "user": rec(v, user),
                "agent": rec(v, agent),
                "sources": {s: rec(v, ix) for s, ix in by_source.items()},
            }
            for v in simplicity
        },
        "n": {"all": n, "user": len(user), "agent": len(agent), **{s: len(ix) for s, ix in by_source.items()}},
    }


def build_variants(tools, embed):
    base = sne.build(tools, embed)
    bm25, bm25s, dense, denses = base["bm25"], base["bm25+server"], base["dense"], base["dense+server"]
    return {
        "bm25": bm25,
        "bm25+server": bm25s,
        "dense": dense,
        "dense+server": denses,
        "hybrid-rrf": base["hybrid-rrf"],
        "hybrid-rrf+server": base["hybrid-rrf+server"],
        "hybrid-minmax 1:1": HybridIndex([bm25, dense], fusion="minmax"),
        "hybrid-minmax 1:1+server": HybridIndex([bm25s, denses], fusion="minmax"),
    }


def collect(embed):
    """Per-query rows over all dev sources: hits per variant, style, source."""
    merged = load_catalogs([ROOT / "catalogs", ROOT / "catalogs" / "test", ROOT / "catalogs" / "test2"])  # strict: no name collisions
    real = {
        "dev": as_query_sets(load_labels(ROOT / "queries" / "mcp-reference.jsonl")),
        "spent-test": as_query_sets(load_labels(ROOT / "queries" / "mcp-test.jsonl")),
        "test2": as_query_sets(load_labels(ROOT / "queries" / "mcp-test2.jsonl")),
    }
    synthetic_sets = {
        "user": bench.QUERY_SETS["dev"]() + bench.QUERY_SETS["heldout-user"](),
        "agent": bench.QUERY_SETS["heldout-agent"](),
    }
    blocks = [("synthetic", synthetic_catalog(), synthetic_sets)]
    blocks += [(name, merged, qs) for name, qs in real.items()]

    hits = {v: [] for v in SIMPLICITY}
    ranks_all = {v: [] for v in SIMPLICITY}
    styles, sources = [], []
    built: dict[int, dict] = {}
    for name, tools, qsets in blocks:
        key = id(tools)
        if key not in built:
            built[key] = build_variants(tools, embed)
        retrievers = built[key]
        for style in ("user", "agent"):
            queries = qsets[style]
            for v in SIMPLICITY:
                rk = sne.ranks(retrievers[v], queries)
                hits[v] += [sne.hit5(r) for r in rk]
                ranks_all[v] += rk
            styles += [style] * len(queries)
            sources += [name] * len(queries)
    return hits, ranks_all, styles, sources, len(merged)


def main() -> None:
    try:
        embed = wordllama_embedder()
    except ImportError as exc:
        sys.exit(f"needs the dense extra: {exc}")
    hits, ranks_all, styles, sources, n_tools = collect(embed)
    result = decide(hits, styles, sources)

    n = result["n"]
    print(f"queries: {n['all']} (user-style {n['user']}, agent-style {n['agent']}); merged real catalog: {n_tools} tools")
    print("per-source query counts:", {k: v for k, v in n.items() if k not in ("all", "user", "agent")})
    srcs = list(next(iter(result["table"].values()))["sources"])
    print(f"\n{'candidate':<26}{'all':>7}{'user':>7}{'agent':>7}  " + "".join(f"{s:>12}" for s in srcs) + "   flags")
    for v in SIMPLICITY:
        r = result["table"][v]
        flags = ("eligible " if v in result["eligible"] else "ineligible ") + ("tied " if v in result["tied_with_best"] else "") + ("<- CHOSEN BY RULE" if v == result["chosen_by_rule"] else "")
        print(f"{v:<26}{r['all']:>7.1%}{r['user']:>7.1%}{r['agent']:>7.1%}  " + "".join(f"{r['sources'][s]:>12.1%}" for s in srcs) + f"   {flags}")
    print(f"\nbest among eligible: {result['best_eligible']}; tied with it: {result['tied_with_best']}; chosen by the rule: {result['chosen_by_rule']}")
    for line in result["reasons"]:
        print("  " + line)
    print(f"\nDECISION: {'ADOPT ' + result['decision'] if result['adopted'] else 'KEEP ' + result['decision']}")

    # context only: MRR and recall@10 for each candidate
    context = {}
    for v in SIMPLICITY:
        rk = ranks_all[v]
        context[v] = {"mrr": sum(1 / r for r in rk if r) / len(rk), "recall10": sum(r is not None for r in rk) / len(rk)}
    result["context"] = context
    result["environment"] = {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")}
    result["rule"] = "agent guard 1pt; best pooled recall; paired sign test ties -> simplest; adopt over dense only if significantly better and no source >2pt worse"
    out = ROOT / "results"
    out.mkdir(exist_ok=True)
    (out / "dev-selection-v2.json").write_text(json.dumps(result, indent=2) + "\n")
    print(f"wrote {out / 'dev-selection-v2.json'}")


if __name__ == "__main__":
    main()
