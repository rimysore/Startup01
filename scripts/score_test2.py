#!/usr/bin/env python3
"""Score the untouched next batch (catalogs/test2 + queries/mcp-test2.jsonl) exactly once.

This file was committed BEFORE it was run on test2. Protocol, fixed in advance:

  Headline        `dense` (the recorded default, chosen on dev data by a rule committed
                  beforehand): user-style recall@5 over the 105 user-style queries.
  Declared second `dense+server` vs `dense`: a paired comparison (queries gained g, lost l
                  by the server name in the index text), on user-style and agent-style.
                  Reported with its counts; no default is changed because of it.
  Context only    bm25 / hybrid-rrf with and without the server name, recall@10, MRR.
  Not allowed     editing labels or retrievers after seeing the result. An objectively
                  wrong label (an unknown tool name) may be fixed in a separate, disclosed
                  commit with both scores reported.

The script takes --catalog/--labels/--out so it can be dry-run on dev data; the default
arguments are the test2 files, and the run that counts is the default one.
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
import server_name_experiment as sne  # noqa: E402  (variants, ranks, paired, summary)

from toolslim.catalog import load_catalogs  # noqa: E402
from toolslim.dense import wordllama_embedder  # noqa: E402
from toolslim.gateway import LazyToolGateway  # noqa: E402
from toolslim.labels import as_query_sets, check_labels, load_labels  # noqa: E402
from toolslim.slim import slim_tool  # noqa: E402
from toolslim.tokens import estimate_tokens  # noqa: E402

HEADLINE = "dense"
SECONDARY = ("dense", "dense+server")


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    p = k / n
    centre = (p + z * z / (2 * n)) / (1 + z * z / n)
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return centre - half, centre + half


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--catalog", default=str(ROOT / "catalogs" / "test2"))
    ap.add_argument("--labels", default=str(ROOT / "queries" / "mcp-test2.jsonl"))
    ap.add_argument("--out", default=str(ROOT / "results" / "test2-score"), help="prefix; writes <prefix>.txt and <prefix>.json")
    args = ap.parse_args()

    tools = load_catalogs([args.catalog])
    labels = load_labels(args.labels)
    problems = check_labels(labels, tools).errors
    if problems:
        sys.exit("labels do not match the catalog:\n  " + "\n  ".join(problems))
    sets = as_query_sets(labels)
    server_of = {t.name: t.server for t in tools}

    lines: list[str] = []

    def say(text: str = "") -> None:
        print(text)
        lines.append(text)

    embed = wordllama_embedder()
    retrievers = sne.build(tools, embed)
    ranks = {v: {style: sne.ranks(r, qs) for style, qs in sets.items()} for v, r in retrievers.items()}
    n_user, n_agent = len(sets["user"]), len(sets["agent"])

    full = estimate_tokens([t.to_api() for t in tools])
    say(f"Catalog: {len(tools)} tools, {len({t.server for t in tools})} servers | queries: user-style {n_user}, agent-style {n_agent}")
    say(f"Tokens (estimates): all schemas {full:,}; slim L1 {estimate_tokens([slim_tool(t, 1).to_api() for t in tools]):,}; "
        f"slim L3 {estimate_tokens([slim_tool(t, 3).to_api() for t in tools]):,}; lazy gateway first request {estimate_tokens(LazyToolGateway(tools).tool_definitions())}")
    say()
    say(f"{'retriever':<20}{'user r@5':>10}{'95% CI':>16}{'MRR':>6}{'r@10':>7}{'agent r@5':>11}")
    table = {}
    for v in sne.VARIANTS:
        u, a = sne.summary(ranks[v]["user"]), sne.summary(ranks[v]["agent"])
        lo, hi = wilson(round(u["recall5"] * n_user), n_user)
        table[v] = {"user": u, "agent": a, "user_ci95": [lo, hi]}
        mark = "  <- HEADLINE" if v == HEADLINE else ("  (declared second)" if v == SECONDARY[1] else "")
        say(f"{v:<20}{u['recall5']:>10.1%}{f'[{lo:.0%}, {hi:.0%}]':>16}{u['mrr']:>6.2f}{u['recall10']:>7.1%}{a['recall5']:>11.1%}{mark}")

    say()
    base, var = SECONDARY
    paired = {}
    for style in ("user", "agent"):
        g, l = sne.paired(ranks[base][style], ranks[var][style])
        paired[style] = {"gained": g, "lost": l}
        clears = g > l and (g - l) >= 2 * math.sqrt(g + l)
        say(f"Declared comparison, {style}-style: {var} vs {base}: gained {g}, lost {l}, net {g - l:+d} "
            f"(2-SE bar {2 * math.sqrt(g + l):.1f}; {'clears' if clears else 'does not clear'} it; for information, nothing is decided from this)")

    # where the headline retriever misses
    say()
    dense = retrievers[HEADLINE]
    by_server: dict[str, list[int]] = {}
    cross = 0
    miss_rows = []
    for (query, want), rank in zip(sets["user"], ranks[HEADLINE]["user"]):
        accepted = (want,) if isinstance(want, str) else want
        srv = server_of[accepted[0]]
        by_server.setdefault(srv, [0, 0])[1] += 1
        if not sne.hit5(rank):
            by_server[srv][0] += 1
            top = dense.search(query, k=3)
            cross += server_of[top[0][0].name] not in {server_of[a] for a in accepted}
            miss_rows.append((query, " | ".join(accepted), [t.name for t, _ in top]))
    say(f"{HEADLINE} user-style misses by server: " + ", ".join(f"{s} {m}/{n}" for s, (m, n) in sorted(by_server.items())))
    say(f"{len(miss_rows)} misses; {cross} had a top result from a different server than any accepted tool")
    say()
    say(f"Misses of {HEADLINE} (user-style):")
    for query, want, got in miss_rows:
        say(f"- {query!r}\n    want {want}; got {got}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.with_suffix(".txt").write_text("\n".join(lines) + "\n")
    out.with_suffix(".json").write_text(json.dumps({
        "headline": {"retriever": HEADLINE, **table[HEADLINE]},
        "table": table,
        "declared_comparison": {"base": base, "variant": var, **paired},
        "misses": {"headline_user": len(miss_rows), "top1_other_server": cross, "by_server": by_server},
        "sizes": {"tools": len(tools), "user": n_user, "agent": n_agent},
        "environment": {"python": platform.python_version(), "wordllama": version("wordllama"), "numpy": version("numpy")},
    }, indent=2) + "\n")
    say(f"\nwrote {out.with_suffix('.txt')} and {out.with_suffix('.json')}")


if __name__ == "__main__":
    main()
