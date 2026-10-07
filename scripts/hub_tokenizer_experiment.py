#!/usr/bin/env python3
"""Fix the BM25 camel-case tokenizer and the "hub" problem? DEV data only; rules fixed in advance.

This file was committed BEFORE it was run. All data it reads is dev data: there is no
untouched batch left (all four are spent), so adoption below rests on dev evidence and a
leave-one-batch-out check, and a fifth batch or independent labels would still be needed
for a real confirmation. Disclosure: both problems were found by reading the misses of the
third batch, so the design is not blind.

Sources (each scored against ITS OWN catalog, as the batches were scored before):
  synthetic     40 tools; user 80, agent 40
  dev           catalogs/ + queries/mcp-reference.jsonl            (78 tools)
  spent-test    catalogs/test + queries/mcp-test.jsonl             (70 tools)
  test2         catalogs/test2 + queries/mcp-test2.jsonl           (105 tools)
  test3         catalogs/test3 (namespacing) + queries/mcp-test3.jsonl (189 tools)
All retrievers below are the current default, `hybrid-rrf+server`, with one thing changed.
A query is a hit if an accepted tool is in the top 5; "all" pools user- and agent-style.

PART 1, tokenizer (a bug fix: judged on "no harm", not significance).
  The BM25 tokenizer splits "GitHub" into git+hub, which never matches the lowercase
  "github" in tool and server names. Fix: camel-case words also yield their joined form.
  Compare legacy vs joined for `bm25+server` and for the default hybrid.
  ADOPT iff, for both retrievers: (a) pooled over all sources, queries gained - lost >= 0,
  and (b) no source's "all" recall drops by more than 2 points.

PART 2, hubs (a design change: needs out-of-sample evidence).
  Two knobs, on the hybrid with the Part 1 tokenizer:
    lambda in {0, 0.25, 0.5, 1.0}  hubness correction of the dense half: a tool's cosine
                                   score is reduced by lambda x its mean similarity to its 10
                                   nearest other tools (tools close to everything win queries
                                   they should not)
    b      in {0.75, 0.4, 0.1}     BM25 length normalization (short generic tools such as
                                   `add_slide` gain from it)
  Baseline = (lambda 0, b 0.75), i.e. today's default. Leave-one-batch-out: for each source,
  pick the config with the best pooled "all" recall on the OTHER four sources (ties: smaller
  lambda, then larger b), and score that choice on the held-out source against the baseline.
  ADOPT iff, pooled over the five held-out scorings: (a) selected beats baseline in a
  paired sign test on all queries (gained > lost and gained - lost >= 2*sqrt(gained+lost));
  (b) no held-out source is worse than the baseline by more than 2 points ("all");
  (c) pooled agent-style recall is not lower than the baseline's by more than 0.5 points.
  If adopted, the config adopted is the best on all five sources (same tie-break).

Hubness is also measured (descriptive only): how concentrated the false positives are in a
few tools, before and after. Writes results/hub-tokenizer.json.
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
import server_name_experiment as sne  # noqa: E402  (ranks, hit5)

from toolslim import bench  # noqa: E402
from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import DenseIndex, text_with_server, wordllama_embedder  # noqa: E402
from toolslim.fixtures import synthetic_catalog  # noqa: E402
from toolslim.hybrid import HybridIndex  # noqa: E402
from toolslim.index import ToolIndex  # noqa: E402
from toolslim.labels import as_query_sets, load_labels  # noqa: E402

LAMBDAS = [0.0, 0.25, 0.5, 1.0]
BS = [0.75, 0.4, 0.1]
BASELINE = (0.0, 0.75)
HARM = 0.02
AGENT_TOL = 0.005
Z = 2.0
SOURCES = ["synthetic", "dev", "spent-test", "test2", "test3"]
STYLES = ("user", "agent")


# ---------------------------------------------------------------- pure decision logic (unit-tested)
def recall(hits):
    return sum(hits) / len(hits)


def pooled(H, config, sources, styles=STYLES):
    """Concatenate hits of `config` over `sources` (in order) and `styles`."""
    return [h for s in sources for st in styles for h in H[config][s][st]]


def sign_counts(a, b):
    """(g, l): positions where `a` hits and `b` misses, and the reverse."""
    return sum(x and not y for x, y in zip(a, b)), sum(y and not x for x, y in zip(a, b))


def clears(g, l):
    return g > l and (g - l) >= Z * math.sqrt(g + l)


def tokenizer_decision(H, sources):
    """H[name][source][style] -> hits; names '<retriever>|legacy' and '<retriever>|camel'."""
    out = {"retrievers": {}, "adopt": True}
    for r in sorted({n.split("|")[0] for n in H}):
        old, new = pooled(H, f"{r}|legacy", sources), pooled(H, f"{r}|camel", sources)
        g, l = sign_counts(new, old)
        per_source = {s: recall(pooled(H, f"{r}|camel", [s])) - recall(pooled(H, f"{r}|legacy", [s])) for s in sources}
        ok = (g - l >= 0) and all(d >= -HARM for d in per_source.values())
        out["retrievers"][r] = {"gained": g, "lost": l, "per_source_diff": per_source, "ok": ok}
        out["adopt"] &= ok
    return out


def order_key(cfg):
    lam, b = cfg
    return (lam, -b)  # smaller lambda first, then larger b: closest to the baseline wins ties


def select(H, configs, sources):
    """Best config on `sources` by pooled recall; ties go to the one closest to the baseline."""
    return max(configs, key=lambda c: (recall(pooled(H, c, sources)), tuple(-x for x in order_key(c))))


def lobo_decision(H, configs, sources, baseline=BASELINE):
    folds = {}
    sel_all, base_all, sel_agent, base_agent = [], [], [], []
    for held in sources:
        train = [s for s in sources if s != held]
        chosen = select(H, configs, train)
        s_hits, b_hits = pooled(H, chosen, [held]), pooled(H, baseline, [held])
        folds[held] = {"chosen": chosen, "diff_all": recall(s_hits) - recall(b_hits)}
        sel_all += s_hits
        base_all += b_hits
        sel_agent += pooled(H, chosen, [held], ("agent",))
        base_agent += pooled(H, baseline, [held], ("agent",))
    g, l = sign_counts(sel_all, base_all)
    cond_a = clears(g, l)
    cond_b = all(f["diff_all"] >= -HARM for f in folds.values())
    agent_diff = recall(sel_agent) - recall(base_agent)
    cond_c = agent_diff >= -AGENT_TOL
    adopt = cond_a and cond_b and cond_c
    return {
        "folds": folds,
        "gained": g,
        "lost": l,
        "agent_diff": agent_diff,
        "conditions": {"a_sign_test": cond_a, "b_no_source_worse": cond_b, "c_agent_not_lower": cond_c},
        "adopt": adopt,
        "final_config": select(H, configs, sources) if adopt else baseline,
    }


# ---------------------------------------------------------------- data and retrievers
def load_sources():
    ref = as_query_sets(load_labels(ROOT / "queries" / "mcp-reference.jsonl"))
    spt = as_query_sets(load_labels(ROOT / "queries" / "mcp-test.jsonl"))
    t2 = as_query_sets(load_labels(ROOT / "queries" / "mcp-test2.jsonl"))
    t3 = as_query_sets(load_labels(ROOT / "queries" / "mcp-test3.jsonl"))
    synthetic = {"user": bench.QUERY_SETS["dev"]() + bench.QUERY_SETS["heldout-user"](), "agent": bench.QUERY_SETS["heldout-agent"]()}
    return {
        "synthetic": (synthetic_catalog(), synthetic),
        "dev": (load_catalogs([ROOT / "catalogs"]), ref),
        "spent-test": (load_catalogs([ROOT / "catalogs" / "test"]), spt),
        "test2": (load_catalogs([ROOT / "catalogs" / "test2"]), t2),
        "test3": (load_catalogs([ROOT / "catalogs" / "test3"], on_duplicate="namespace"), t3),
    }


def hits_for(retriever, qsets):
    return {st: [sne.hit5(r) for r in sne.ranks(retriever, qsets[st])] for st in STYLES}


def false_positive_concentration(retriever, tools, qsets, top=8):
    """Descriptive hubness: how many top-5 slots held by wrong tools sit in the few most frequent ones."""
    counts: dict[str, int] = {}
    total = 0
    for st in STYLES:
        for query, want in qsets[st]:
            accepted = {want} if isinstance(want, str) else set(want)
            for t, _ in retriever.search(query, k=5):
                if t.name not in accepted:
                    counts[t.name] = counts.get(t.name, 0) + 1
                    total += 1
    ranked = sorted(counts.items(), key=lambda kv: -kv[1])[:top]
    return {"false_positive_slots": total, "top_share": sum(c for _, c in ranked) / total if total else 0.0, "top": ranked}


def main() -> None:
    try:
        embed = wordllama_embedder()
    except ImportError as exc:
        sys.exit(f"needs the dense extra: {exc}")
    data = load_sources()
    n_queries = {s: sum(len(q) for q in qs.values()) for s, (_, qs) in data.items()}
    print("sources:", {s: f"{len(t)} tools, {n_queries[s]} queries" for s, (t, _) in data.items()})

    dense_cache: dict = {}

    def dense_for(source, tools, lam):
        key = (source, lam)
        if key not in dense_cache:
            dense_cache[key] = DenseIndex(tools, embed, text_with_server, hub_lambda=lam)
        return dense_cache[key]

    def hybrid(source, tools, camel, lam, b):
        bm25 = ToolIndex(tools, b=b, use_server=True, camel_join=camel)
        return HybridIndex([bm25, dense_for(source, tools, lam)], fusion="rrf"), bm25

    # ---- Part 1: tokenizer
    H1: dict = {}
    for source, (tools, qsets) in data.items():
        for camel in (False, True):
            tag = "camel" if camel else "legacy"
            hyb, bm25 = hybrid(source, tools, camel, 0.0, 0.75)
            H1.setdefault(f"bm25+server|{tag}", {})[source] = hits_for(bm25, qsets)
            H1.setdefault(f"hybrid-rrf+server|{tag}", {})[source] = hits_for(hyb, qsets)
    tok = tokenizer_decision(H1, SOURCES)
    print("\nPART 1: tokenizer (legacy -> camel-join), gained / lost over all queries, and worst source change")
    for r, info in tok["retrievers"].items():
        worst = min(info["per_source_diff"].values())
        print(f"  {r:<20} +{info['gained']}/-{info['lost']}  worst source {worst:+.3f}  per source: " + ", ".join(f"{s} {d:+.3f}" for s, d in info["per_source_diff"].items()) + f"  -> {'ok' if info['ok'] else 'FAIL'}")
    camel = tok["adopt"]
    print(f"  => {'ADOPT' if camel else 'KEEP legacy'} tokenizer fix")

    # ---- Part 2: hubs, with the Part 1 tokenizer
    configs = [(lam, b) for lam in LAMBDAS for b in BS]
    H2: dict = {c: {} for c in configs}
    for source, (tools, qsets) in data.items():
        for lam, b in configs:
            H2[(lam, b)][source] = hits_for(hybrid(source, tools, camel, lam, b)[0], qsets)
    print(f"\nPART 2: hubness correction (lambda) x BM25 length normalization (b), tokenizer={'camel' if camel else 'legacy'}")
    print(f"{'lambda':>7}{'b':>6}{'all':>8}{'user':>8}{'agent':>8}  " + "".join(f"{s:>12}" for s in SOURCES))
    for lam, b in configs:
        allr = recall(pooled(H2, (lam, b), SOURCES))
        u, a = recall(pooled(H2, (lam, b), SOURCES, ("user",))), recall(pooled(H2, (lam, b), SOURCES, ("agent",)))
        per = "".join(f"{recall(pooled(H2, (lam, b), [s])):>12.1%}" for s in SOURCES)
        print(f"{lam:>7}{b:>6}{allr:>8.1%}{u:>8.1%}{a:>8.1%}  {per}" + ("   <- baseline" if (lam, b) == BASELINE else ""))
    lobo = lobo_decision(H2, configs, SOURCES)
    print("\nleave-one-batch-out (config chosen without the held-out source -> its all-query recall minus the baseline's):")
    for s, f in lobo["folds"].items():
        print(f"  held out {s:<11} chosen (lambda, b) = {f['chosen']}   {f['diff_all']:+.3f}")
    print(f"  pooled out-of-sample, selected vs baseline: gained {lobo['gained']}, lost {lobo['lost']} (need g-l >= {Z * math.sqrt(lobo['gained'] + lobo['lost']):.1f}); agent-style diff {lobo['agent_diff']:+.4f}")
    for k, v in lobo["conditions"].items():
        print(f"  {k}: {'pass' if v else 'FAIL'}")
    print(f"  => {'ADOPT ' + str(lobo['final_config']) if lobo['adopt'] else 'KEEP the baseline ' + str(BASELINE)}")

    # ---- descriptive hubness, before/after
    show = lobo["final_config"] if lobo["adopt"] else select(H2, configs, SOURCES)
    print(f"\nhubness (descriptive): share of wrong top-5 slots held by each source's 8 most frequent wrong tools; baseline {BASELINE} vs best-on-all-data {show}")
    hub = {}
    for source, (tools, qsets) in data.items():
        row = {}
        for label, (lam, b) in (("baseline", BASELINE), ("best", show)):
            row[label] = false_positive_concentration(hybrid(source, tools, camel, lam, b)[0], tools, qsets)
        hub[source] = row
        print(f"  {source:<11} baseline: {row['baseline']['false_positive_slots']:>4} wrong slots, top-8 hold {row['baseline']['top_share']:.0%} | best: {row['best']['false_positive_slots']:>4}, {row['best']['top_share']:.0%}   baseline top hubs: " + ", ".join(f"{n}({c})" for n, c in row["baseline"]["top"][:4]))

    result = {
        "tokenizer": tok,
        "camel_join_adopted": camel,
        "hub": {"grid_all_query_recall": {f"lambda={l},b={b}": recall(pooled(H2, (l, b), SOURCES)) for l, b in configs},
                "lobo": {**lobo, "folds": {s: {"chosen": list(f["chosen"]), "diff_all": f["diff_all"]} for s, f in lobo["folds"].items()}, "final_config": list(lobo["final_config"])}},
        "hubness": hub,
        "sizes": {s: {"tools": len(t), "queries": n_queries[s]} for s, (t, _) in data.items()},
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
        "caveat": "all data is dev; the design was inspired by the third batch's misses; no untouched batch remains",
    }
    out = ROOT / "results"
    out.mkdir(exist_ok=True)
    (out / "hub-tokenizer.json").write_text(json.dumps(result, indent=2, default=str) + "\n")
    print(f"\nwrote {out / 'hub-tokenizer.json'}")


if __name__ == "__main__":
    main()
