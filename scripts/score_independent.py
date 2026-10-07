#!/usr/bin/env python3
"""Score the retrievers on the INDEPENDENT labels (queries/independent/), exactly once.

This file was committed BEFORE it was run on the independent labels. What this run is and is not:
the labels were written by authors who never saw the retrievers, but the tools are the four spent
batches that were used to design the retrievers, so this is an independent-label check on dev
data, NOT a fresh confirmation set, and no default is changed by it. Each batch is scored against
its own catalog (as before); the four are pooled (884 queries). A query is a hit if an accepted
tool is in the top 5.

Protocol, fixed in advance:

  Headline        `hybrid-rrf+server` (the current default): recall@5 on user-style queries,
                  agent-style queries and both pooled ("all"), with 95% intervals, pooled over the
                  four batches and per batch.
  Context         the other seven candidates, MRR and recall@10.
  Declared paired comparisons (queries gained g / lost l, reported with counts; the 2-SE bar is
                  g > l and g - l >= 2*sqrt(g + l); nothing is changed because of them)
                    C1  default vs dense       C2  default vs bm25
                    C3  default vs hybrid-rrf  (does the server name matter on top of fusion?)
                    C4  bm25 vs dense          (the embedding advantage)
                    C5  dense+server vs dense  (the server name on plain dense)
  Declared readings
    R1 label-source check: Spearman rank correlation, over the eight candidates, between their
       pooled "all" recall@5 on MY labels and on the INDEPENDENT labels. "Conclusions did not depend
       on who wrote the labels" iff rho >= 0.8; otherwise "labeling affected the conclusions".
    R2 the round-2 adoption, repeated on independent labels: SUPPORTED iff (a) C1 on all queries
       clears the 2-SE bar AND (b) the default's agent-style recall is within 1 point of the best
       candidate's. Otherwise NOT SUPPORTED. (Same reading as the confirmation run.)
  Descriptive only   user-style recall of bm25, dense and the default by how many words the query
       shares with its tool's name (0 / some / half or more): tests the earlier suspicion that
       BM25 gains when queries overlap more with tool names; the per-server misses of the headline.
  Not allowed        editing labels or retrievers after seeing the result.

The script takes --independent-dir so it can be dry-run with other label files in their place; the
run that counts uses the default directory.
"""

from __future__ import annotations

import argparse
import json
import math
import platform
import sys
from importlib.metadata import version
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import select_default_v2 as sel  # noqa: E402  (build_variants, SIMPLICITY, sign_test)
import server_name_experiment as sne  # noqa: E402  (ranks, hit5, summary)

from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import wordllama_embedder  # noqa: E402
from toolslim.labels import as_query_sets, check_labels, load_labels, name_overlap  # noqa: E402

BATCHES = {
    "dev": (["catalogs"], "error", "mcp-reference"),
    "first-test": (["catalogs/test"], "error", "mcp-test"),
    "second-test": (["catalogs/test2"], "error", "mcp-test2"),
    "third-test": (["catalogs/test3"], "namespace", "mcp-test3"),
}
HEADLINE = "hybrid-rrf+server"
COMPARISONS = {"C1": (HEADLINE, "dense"), "C2": (HEADLINE, "bm25"), "C3": (HEADLINE, "hybrid-rrf"), "C4": ("bm25", "dense"), "C5": ("dense+server", "dense")}
RHO_MIN = 0.8
AGENT_GUARD = 0.01


# ------------------------------------------------------------------ pure helpers (unit-tested)
def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return centre - half, centre + half


def average_ranks(values):
    """1-based ranks, ties share their average rank (largest value gets the largest rank)."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return ranks


def spearman(a, b):
    ra, rb = average_ranks(a), average_ranks(b)
    ma, mb = sum(ra) / len(ra), sum(rb) / len(rb)
    cov = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    va, vb = sum((x - ma) ** 2 for x in ra), sum((y - mb) ** 2 for y in rb)
    return cov / math.sqrt(va * vb) if va and vb else float("nan")


def clears(g, l):
    return g > l and (g - l) >= 2 * math.sqrt(g + l)


def readings(mine_all, indep_all, c1_all_gl, agent_recall, headline=HEADLINE):
    """mine_all/indep_all: {variant: pooled all-query recall}; c1_all_gl: (g, l); agent_recall: {variant: recall}."""
    names = list(indep_all)
    rho = spearman([mine_all[v] for v in names], [indep_all[v] for v in names])
    r1 = rho >= RHO_MIN - 1e-9  # tolerance only for float noise at exactly 0.8
    best = max(agent_recall.values())
    a_ok, b_ok = clears(*c1_all_gl), agent_recall[headline] >= best - AGENT_GUARD
    return {"rho": rho, "R1_conclusions_independent_of_label_author": r1, "R2_a_c1_clears": a_ok, "R2_b_agent_within_1pt": b_ok, "R2_supported": a_ok and b_ok}


def overlap_stratum(x):
    return "none" if x == 0 else ("half or more" if x >= 0.5 else "some")


# ------------------------------------------------------------------ main
def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--independent-dir", default=str(ROOT / "queries" / "independent"))
    ap.add_argument("--out", default=str(ROOT / "results" / "independent-score"), help="prefix; writes <prefix>.txt and <prefix>.json")
    args = ap.parse_args()

    lines: list[str] = []

    def say(text: str = "") -> None:
        print(text)
        lines.append(text)

    embed = wordllama_embedder()
    variants = sel.SIMPLICITY
    # data[label_set][batch] = {"user": [(q, want)], "agent": [...]}, plus per-batch retrievers
    ranks = {ls: {v: {st: [] for st in ("user", "agent")} for v in variants} for ls in ("indep", "mine")}
    per_batch = {ls: {b: {v: {"user": [], "agent": []} for v in variants} for b in BATCHES} for ls in ("indep", "mine")}
    meta = {"user": [], "agent": []}  # for the independent labels: (batch, server of first expected, overlap)
    for batch, (dirs, policy, mine_name) in BATCHES.items():
        tools = load_catalogs([ROOT / d for d in dirs], on_duplicate=policy)
        server_of = {t.name: t.server for t in tools}
        retrievers = sel.build_variants(tools, embed)
        label_sets = {"indep": load_labels(Path(args.independent_dir) / f"{batch}.jsonl"), "mine": load_labels(ROOT / "queries" / f"{mine_name}.jsonl")}
        for ls, labels in label_sets.items():
            problems = check_labels(labels, tools).errors
            if problems:
                sys.exit(f"{ls} labels for {batch} do not match the catalog:\n  " + "\n  ".join(problems))
            qsets = as_query_sets(labels)
            for v in variants:
                for st in ("user", "agent"):
                    rk = sne.ranks(retrievers[v], qsets[st])
                    ranks[ls][v][st] += rk
                    per_batch[ls][batch][v][st] = rk
            if ls == "indep":
                for lb in labels:
                    meta[lb.style].append((batch, server_of[lb.expected[0]], name_overlap(lb.query, lb.expected[0])))
                # keep per-style order identical to as_query_sets (file order within a style)
    n = {st: len(ranks["indep"][variants[0]][st]) for st in ("user", "agent")}
    hits = lambda ls, v, st: [sne.hit5(r) for r in ranks[ls][v][st]]  # noqa: E731
    pooled = lambda ls, v: hits(ls, v, "user") + hits(ls, v, "agent")  # noqa: E731
    rec = lambda h: sum(h) / len(h)  # noqa: E731

    say(f"Independent labels: {n['user']} user-style + {n['agent']} agent-style queries over 4 batches (each on its own catalog)")
    say()
    say(f"{'retriever':<26}{'user r@5':>10}{'95% CI':>16}{'MRR':>6}{'r@10':>7}{'agent r@5':>11}{'all':>8}")
    table = {}
    for v in variants:
        u, a = sne.summary(ranks["indep"][v]["user"]), sne.summary(ranks["indep"][v]["agent"])
        lo, hi = wilson(round(u["recall5"] * n["user"]), n["user"])
        allr = rec(pooled("indep", v))
        table[v] = {"user": u, "agent": a, "user_ci95": [lo, hi], "all_recall5": allr}
        say(f"{v:<26}{u['recall5']:>10.1%}{f'[{lo:.0%}, {hi:.0%}]':>16}{u['mrr']:>6.2f}{u['recall10']:>7.1%}{a['recall5']:>11.1%}{allr:>8.1%}{'  <- HEADLINE' if v == HEADLINE else ''}")

    say()
    say("Per batch, headline vs the others (all-query recall@5, independent labels):")
    say(f"{'batch':<14}" + "".join(f"{v[:15]:>17}" for v in variants))
    batch_rows = {}
    for batch in BATCHES:
        row = {v: rec([sne.hit5(r) for st in ("user", "agent") for r in per_batch["indep"][batch][v][st]]) for v in variants}
        batch_rows[batch] = row
        say(f"{batch:<14}" + "".join(f"{row[v]:>17.1%}" for v in variants))

    say()
    say("Declared paired comparisons (A vs B; gained = A hits and B misses):")
    comps = {}
    for tag, (a_, b_) in COMPARISONS.items():
        comps[tag] = {"a": a_, "b": b_}
        for name, ha, hb in (("user", hits("indep", a_, "user"), hits("indep", b_, "user")), ("agent", hits("indep", a_, "agent"), hits("indep", b_, "agent")), ("all", pooled("indep", a_), pooled("indep", b_))):
            g = sum(x and not y for x, y in zip(ha, hb))
            l = sum(y and not x for x, y in zip(ha, hb))
            comps[tag][name] = {"gained": g, "lost": l, "clears_2se": clears(g, l)}
            say(f"  {tag} {a_} vs {b_:<10} {name:<6}: gained {g:>3}, lost {l:>3}, net {g - l:+4d} (2-SE bar {2 * math.sqrt(g + l):4.1f}; {'clears' if clears(g, l) else 'does not clear'})")

    mine_all = {v: rec(pooled("mine", v)) for v in variants}
    indep_all = {v: table[v]["all_recall5"] for v in variants}
    agent_recall = {v: table[v]["agent"]["recall5"] for v in variants}
    c1 = comps["C1"]["all"]
    rd = readings(mine_all, indep_all, (c1["gained"], c1["lost"]), agent_recall)
    say()
    say("Label-source check: pooled all-query recall@5 on MY labels vs the INDEPENDENT labels")
    say(f"{'retriever':<26}{'mine':>8}{'independent':>13}{'diff':>8}")
    for v in variants:
        say(f"{v:<26}{mine_all[v]:>8.1%}{indep_all[v]:>13.1%}{indep_all[v] - mine_all[v]:>+8.1%}")
    say(f"Spearman rho across the eight candidates = {rd['rho']:.2f} (R1 needs >= {RHO_MIN})  ->  "
        f"{'conclusions did not depend on who wrote the labels' if rd['R1_conclusions_independent_of_label_author'] else 'LABELING AFFECTED THE CONCLUSIONS'}")
    say(f"R2: (a) C1 on all queries clears the 2-SE bar: {'yes' if rd['R2_a_c1_clears'] else 'NO'}; "
        f"(b) headline agent-style recall {agent_recall[HEADLINE]:.1%} vs best {max(agent_recall.values()):.1%} (within 1 point): {'yes' if rd['R2_b_agent_within_1pt'] else 'NO'}"
        f"  ->  round-2 adoption {'SUPPORTED' if rd['R2_supported'] else 'NOT SUPPORTED'} on independent labels (no default is changed by this run)")

    say()
    say("Descriptive: user-style recall@5 by how many words the query shares with its tool's name (independent labels)")
    strata: dict[str, list[int]] = {}
    for i, (_, _, ov) in enumerate(meta["user"]):
        strata.setdefault(overlap_stratum(ov), []).append(i)
    strat_out = {}
    say(f"{'overlap':<14}{'n':>5}{'bm25':>9}{'dense':>9}{HEADLINE:>20}")
    for s in ("none", "some", "half or more"):
        idx = strata.get(s, [])
        if not idx:
            continue
        row = {v: rec([hits("indep", v, "user")[i] for i in idx]) for v in ("bm25", "dense", HEADLINE)}
        strat_out[s] = {"n": len(idx), **row}
        say(f"{s:<14}{len(idx):>5}{row['bm25']:>9.1%}{row['dense']:>9.1%}{row[HEADLINE]:>20.1%}")

    say()
    miss_by_server: dict[str, list[int]] = {}
    for i, (_, srv, _) in enumerate(meta["user"]):
        miss_by_server.setdefault(srv, [0, 0])[1] += 1
        miss_by_server[srv][0] += not hits("indep", HEADLINE, "user")[i]
    say(f"{HEADLINE} user-style misses by server: " + ", ".join(f"{s} {m}/{t}" for s, (m, t) in sorted(miss_by_server.items())))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    out.with_suffix(".json").write_text(json.dumps({
        "headline": {"retriever": HEADLINE, **table[HEADLINE]},
        "table": table,
        "per_batch_all_recall5": batch_rows,
        "comparisons": comps,
        "mine_vs_independent": {"mine": mine_all, "independent": indep_all, "readings": rd},
        "overlap_strata_user": strat_out,
        "misses_by_server_user": miss_by_server,
        "sizes": n,
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
        "caveat": "independent labels on spent dev tools; not a fresh confirmation set; no default is changed by this run",
    }, indent=2) + "\n")
    say(f"\nwrote {out.with_suffix('.txt')} and {out.with_suffix('.json')}")


if __name__ == "__main__":
    main()
