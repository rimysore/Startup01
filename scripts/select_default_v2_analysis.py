#!/usr/bin/env python3
"""Post-hoc robustness check of the round-2 selection (decides nothing; dev data only).

Where does the gain of the chosen candidate over `dense` come from: fusing BM25 with
dense, or the server name? And how close was the agent-style guard?
Never reads catalogs/test3 or queries/mcp-test3.jsonl.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import select_default_v2 as sel  # noqa: E402

from toolslim.dense import wordllama_embedder  # noqa: E402


def main() -> None:
    hits, _, styles, sources, _ = sel.collect(wordllama_embedder())
    everything = list(range(len(styles)))
    parts = {
        "all": everything,
        "user-style": [i for i in everything if styles[i] == "user"],
        "agent-style": [i for i in everything if styles[i] == "agent"],
    }
    pairs = [
        ("dense", "hybrid-rrf", "fusing BM25 with dense (no server name)"),
        ("hybrid-rrf", "hybrid-rrf+server", "adding the server name to the hybrid"),
        ("dense", "dense+server", "adding the server name to plain dense"),
        ("bm25", "bm25+server", "adding the server name to BM25"),
        ("dense", "hybrid-rrf+server", "the adopted change in total"),
        ("hybrid-rrf+server", "hybrid-minmax 1:1+server", "the best-scoring candidate vs the chosen one"),
    ]
    print(f"{'comparison (base -> variant)':<48}{'part':<13}{'gained':>7}{'lost':>6}{'net':>6}{'2-SE bar':>10}  clears?")
    for base, var, what in pairs:
        print(f"{base + ' -> ' + var:<48}  ({what})")
        for name, idx in parts.items():
            g, l = sel.sign_test(hits, var, base, idx)
            bar = sel.Z * math.sqrt(g + l)
            print(f"{'':<48}{name:<13}{g:>7}{l:>6}{g - l:>+6}{bar:>10.1f}  {'yes' if g > l and g - l >= bar else 'no'}")
    agent = parts["agent-style"]
    print("\nagent-style recall@5 vs the guard (best - 1 point):")
    best = max(sum(hits[v][i] for i in agent) / len(agent) for v in sel.SIMPLICITY)
    for v in sel.SIMPLICITY:
        r = sum(hits[v][i] for i in agent) / len(agent)
        print(f"  {v:<26}{r:.2%}  margin to the guard {r - (best - sel.AGENT_GUARD):+.2%}")


if __name__ == "__main__":
    main()
