#!/usr/bin/env python3
"""Exploratory follow-up to server_name_experiment.py (post hoc, dev data only, decides nothing).

Why was the gain from putting server names in the index so small?
  1. What does merging servers into one catalog cost? (same queries, alone vs merged)
  2. How many queries even mention their server? The server name can only help
     a query that contains it. (Gain by whether the query names its server.)

NOTE: a first version of this script detected server mentions with the BM25 tokenizer, which
splits "GitHub" into git+hub and so undercounted them (4 instead of the figure below). The
detection is now tokenizer-independent.

Never reads catalogs/test2 or queries/mcp-test2.jsonl. Writes results/server-name-analysis.json.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import server_name_experiment as sne  # noqa: E402

from toolslim.dense import wordllama_embedder  # noqa: E402


def mentions_server(query: str, server: str) -> bool:
    """Does the query contain the server's name? Independent of the BM25 tokenizer, which splits
    camel-case brands ("GitHub" -> git, hub) and so cannot see them. Crude: a server called
    "everything" or "time" is also 'named' by those ordinary words."""
    q = re.sub(r"[^a-z0-9]+", " ", query.lower())
    words = [w for w in re.split(r"[-_ ]+", server.lower()) if w]
    return all(w in q.split() for w in words) or "".join(words) in q.replace(" ", "")


def recall5(rank_list):
    return sum(sne.hit5(r) for r in rank_list) / len(rank_list)


def main() -> None:
    embed = wordllama_embedder()
    primary, secondary = sne.sources()
    by_name = {n: (tools, qs) for n, tools, qs in primary + secondary}
    merged_tools, merged_qs = by_name["real-merged"]
    merged = sne.evaluate_source(merged_tools, merged_qs, embed)
    dev_tools, dev_qs = by_name["real-dev-alone"]
    spent_tools, spent_qs = by_name["real-spent-alone"]
    alone = {"dev": sne.evaluate_source(dev_tools, dev_qs, embed), "spent": sne.evaluate_source(spent_tools, spent_qs, embed)}
    n_dev = len(dev_qs["user"])  # merged user-style order: dev queries first, then spent queries

    print("1. Cost of merging servers into one catalog (user-style recall@5)")
    cost = {}
    for variant in ("dense", "dense+server"):
        d_alone, s_alone = recall5(alone["dev"][variant]["user"]), recall5(alone["spent"][variant]["user"])
        d_merged, s_merged = recall5(merged[variant]["user"][:n_dev]), recall5(merged[variant]["user"][n_dev:])
        cost[variant] = {"dev_alone": d_alone, "dev_merged": d_merged, "spent_alone": s_alone, "spent_merged": s_merged}
        print(f"   {variant:<13} dev queries: {d_alone:.1%} alone -> {d_merged:.1%} merged   spent-test queries: {s_alone:.1%} alone -> {s_merged:.1%} merged")

    print("\n2. Does the query name its server? (real-merged, user-style, 147 queries)")
    server_of_tool = {t.name: t.server for t in merged_tools}
    strata = {"names its server": [], "does not": []}
    for i, (query, want) in enumerate(merged_qs["user"]):
        accepted = (want,) if isinstance(want, str) else want
        names_it = any(mentions_server(query, server_of_tool[a]) for a in accepted)
        strata["names its server" if names_it else "does not"].append(i)
    analysis = {}
    for label, idx in strata.items():
        b = [merged["dense"]["user"][i] for i in idx]
        v = [merged["dense+server"]["user"][i] for i in idx]
        g, l = sne.paired(b, v)
        analysis[label] = {"n": len(idx), "dense": recall5(b), "dense+server": recall5(v), "gained": g, "lost": l}
        print(f"   {label:<17} n={len(idx):<4} dense {recall5(b):.1%} -> dense+server {recall5(v):.1%}   (+{g}/-{l})")

    print("\n3. In the merged catalog, dense misses (user-style): how many have a top-1 hit from another server?")
    miss_idx = [i for i, r in enumerate(merged["dense"]["user"]) if not sne.hit5(r)]
    dense_ret = sne.build(merged_tools, embed)["dense"]
    server_of = {t.name: t.server for t in merged_tools}
    cross = 0
    for i in miss_idx:
        query, want = merged_qs["user"][i]
        accepted = (want,) if isinstance(want, str) else want
        top = dense_ret.search(query, k=1)[0][0].name
        cross += server_of[top] not in {server_of[a] for a in accepted}
    print(f"   {len(miss_idx)} misses, {cross} with the top result from a different server than any accepted tool")

    out = {"merging_cost": cost, "server_named_in_query": analysis, "misses": {"total": len(miss_idx), "top1_other_server": cross}, "note": "exploratory and post hoc; decides nothing"}
    (HERE.parent / "results" / "server-name-analysis.json").write_text(json.dumps(out, indent=2) + "\n")


if __name__ == "__main__":
    main()
