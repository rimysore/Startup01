#!/usr/bin/env python3
"""Score the confirmation batch (catalogs/test3 + queries/mcp-test3.jsonl) exactly once.

This file was committed BEFORE it was run on test3. Protocol, fixed in advance:

  Headline        `hybrid-rrf+server` (the default adopted in round 2, on dev data only):
                  user-style recall@5 over the 189 user-style queries, with a 95% interval;
                  agent-style and pooled recall are reported next to it.
  Declared comparisons (paired: queries gained g / lost l; reported with counts; nothing
                  is changed because of them)
                    C1  hybrid-rrf+server vs dense       (the old default)
                    C2  hybrid-rrf+server vs hybrid-rrf  (does the server name matter on top of fusion?)
  Context only    the other five candidates, MRR, recall@10, per-server recall, the misses.
  Reading of the result, declared now:
                  The round-2 adoption is CONFIRMED iff (a) C1 on all queries (user + agent
                  pooled) has g > l and g - l >= 2 * sqrt(g + l), AND (b) the headline's
                  agent-style recall is within 1 point of the best agent-style recall among
                  the eight candidates. Otherwise it is NOT CONFIRMED. Either way the default
                  is not changed by this run; a new decision needs a new round.
  Not allowed     editing labels or retrievers after seeing the result. An objectively wrong
                  label (an unknown tool name) may be fixed in a separate, disclosed commit
                  with both scores reported.

Caveats recorded before the run: the labels were drafted by the retriever's author, and 97% of
the agent-style queries (32% of the user-style ones) name their service, a regime that favors
the server name in the index text. The two colliding `add_table` tools are loaded with the
namespacing policy and labeled `word__add_table` / `powerpoint__add_table`.

The script takes --catalog/--labels/--out/--on-duplicate so it can be dry-run on dev data;
the defaults are the test3 files, and the run that counts is the default one.
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
import select_default_v2 as sel  # noqa: E402  (build_variants, SIMPLICITY, sign_test, significantly_better)
import server_name_experiment as sne  # noqa: E402  (ranks, hit5)

from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import wordllama_embedder  # noqa: E402
from toolslim.gateway import LazyToolGateway  # noqa: E402
from toolslim.labels import as_query_sets, check_labels, load_labels  # noqa: E402
from toolslim.slim import slim_tool  # noqa: E402
from toolslim.tokens import estimate_tokens  # noqa: E402

HEADLINE = "hybrid-rrf+server"
COMPARISONS = [("C1", "dense"), ("C2", "hybrid-rrf")]
AGENT_GUARD = 0.01


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return centre - half, centre + half


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--catalog", default=str(ROOT / "catalogs" / "test3"))
    ap.add_argument("--labels", default=str(ROOT / "queries" / "mcp-test3.jsonl"))
    ap.add_argument("--on-duplicate", default="namespace", choices=("error", "namespace"))
    ap.add_argument("--out", default=str(ROOT / "results" / "test3-score"), help="prefix; writes <prefix>.txt and <prefix>.json")
    args = ap.parse_args()

    tools = load_catalogs([args.catalog], on_duplicate=args.on_duplicate)
    labels = load_labels(args.labels)
    problems = check_labels(labels, tools).errors
    if problems:
        sys.exit("labels do not match the catalog:\n  " + "\n  ".join(problems))
    sets = as_query_sets(labels)
    n_user, n_agent = len(sets["user"]), len(sets["agent"])
    server_of = {t.name: t.server for t in tools}

    lines: list[str] = []

    def say(text: str = "") -> None:
        print(text)
        lines.append(text)

    retrievers = sel.build_variants(tools, wordllama_embedder())
    ranks = {v: {style: sne.ranks(r, sets[style]) for style in ("user", "agent")} for v, r in retrievers.items()}
    hits = {v: {s: [sne.hit5(r) for r in ranks[v][s]] for s in ("user", "agent")} for v in retrievers}
    pooled = {v: hits[v]["user"] + hits[v]["agent"] for v in retrievers}  # user-style first, then agent-style
    idx_all = list(range(n_user + n_agent))

    full = estimate_tokens([t.to_api() for t in tools])
    say(f"Catalog: {len(tools)} tools, {len({t.server for t in tools})} servers | queries: user-style {n_user}, agent-style {n_agent}")
    say(f"Tokens (estimates): all schemas {full:,}; slim L1 {estimate_tokens([slim_tool(t, 1).to_api() for t in tools]):,}; "
        f"slim L3 {estimate_tokens([slim_tool(t, 3).to_api() for t in tools]):,}; lazy gateway first request {estimate_tokens(LazyToolGateway(tools).tool_definitions())}")
    say()
    say(f"{'retriever':<26}{'user r@5':>10}{'95% CI':>16}{'MRR':>6}{'r@10':>7}{'agent r@5':>11}{'all':>8}")
    table = {}
    for v in sel.SIMPLICITY:
        u, a = sne.summary(ranks[v]["user"]), sne.summary(ranks[v]["agent"])
        lo, hi = wilson(round(u["recall5"] * n_user), n_user)
        allr = sum(pooled[v]) / len(pooled[v])
        table[v] = {"user": u, "agent": a, "user_ci95": [lo, hi], "all_recall5": allr}
        mark = "  <- HEADLINE" if v == HEADLINE else ("  (C1 baseline)" if v == "dense" else ("  (C2 baseline)" if v == "hybrid-rrf" else ""))
        say(f"{v:<26}{u['recall5']:>10.1%}{f'[{lo:.0%}, {hi:.0%}]':>16}{u['mrr']:>6.2f}{u['recall10']:>7.1%}{a['recall5']:>11.1%}{allr:>8.1%}{mark}")

    say()
    paired = {}
    for tag, base in COMPARISONS:
        paired[tag] = {"base": base}
        for name, idx in (("user", range(0, n_user)), ("agent", range(n_user, n_user + n_agent)), ("all", idx_all)):
            g, l = sel.sign_test(pooled, HEADLINE, base, list(idx))
            clears = g > l and (g - l) >= 2 * math.sqrt(g + l)
            paired[tag][name] = {"gained": g, "lost": l, "clears_2se": clears}
            say(f"{tag} {HEADLINE} vs {base:<11} {name:<6}: gained {g:>3}, lost {l:>3}, net {g - l:+4d} (2-SE bar {2 * math.sqrt(g + l):4.1f}; {'clears' if clears else 'does not clear'} it)")

    best_agent = max(table[v]["agent"]["recall5"] for v in sel.SIMPLICITY)
    c1_all = paired["C1"]["all"]["clears_2se"]
    guard_ok = table[HEADLINE]["agent"]["recall5"] >= best_agent - AGENT_GUARD
    confirmed = c1_all and guard_ok
    say()
    say(f"Declared reading: (a) C1 on all queries clears the 2-SE bar: {'yes' if c1_all else 'NO'}; "
        f"(b) headline agent-style recall {table[HEADLINE]['agent']['recall5']:.1%} vs best {best_agent:.1%} (within 1 point): {'yes' if guard_ok else 'NO'}")
    say(f"=> round-2 adoption {'CONFIRMED' if confirmed else 'NOT CONFIRMED'} (the default is not changed by this run either way)")

    # where the headline misses
    say()
    best = retrievers[HEADLINE]
    by_server: dict[str, list[int]] = {}
    cross = 0
    miss_rows = []
    for (query, want), rank in zip(sets["user"], ranks[HEADLINE]["user"]):
        accepted = (want,) if isinstance(want, str) else want
        srv = server_of[accepted[0]]
        by_server.setdefault(srv, [0, 0])[1] += 1
        if not sne.hit5(rank):
            by_server[srv][0] += 1
            top = best.search(query, k=3)
            cross += server_of[top[0][0].name] not in {server_of[a] for a in accepted}
            miss_rows.append((query, " | ".join(accepted), [t.name for t, _ in top]))
    say(f"{HEADLINE} user-style misses by server: " + ", ".join(f"{s} {m}/{n}" for s, (m, n) in sorted(by_server.items())))
    say(f"{len(miss_rows)} user-style misses; {cross} had a top result from a different server than any accepted tool")
    agent_misses = [(q, " | ".join((w,) if isinstance(w, str) else w), [t.name for t, _ in best.search(q, k=3)])
                    for (q, w), r in zip(sets["agent"], ranks[HEADLINE]["agent"]) if not sne.hit5(r)]
    say(f"{len(agent_misses)} agent-style misses")
    say()
    say(f"Misses of {HEADLINE} (user-style):")
    for query, want, got in miss_rows:
        say(f"- {query!r}\n    want {want}; got {got}")
    say()
    say(f"Misses of {HEADLINE} (agent-style):")
    for query, want, got in agent_misses:
        say(f"- {query!r}\n    want {want}; got {got}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    out.with_suffix(".json").write_text(json.dumps({
        "headline": {"retriever": HEADLINE, **table[HEADLINE]},
        "table": table,
        "comparisons": paired,
        "declared_reading": {"c1_all_clears_2se": c1_all, "headline_agent_within_1pt_of_best": guard_ok, "confirmed": confirmed},
        "misses": {"headline_user": len(miss_rows), "headline_agent": len(agent_misses), "top1_other_server": cross, "by_server": by_server},
        "sizes": {"tools": len(tools), "user": n_user, "agent": n_agent},
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
    }, indent=2) + "\n")
    say(f"\nwrote {out.with_suffix('.txt')} and {out.with_suffix('.json')}")


if __name__ == "__main__":
    main()
