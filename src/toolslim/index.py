"""BM25 search over a tool catalog (name, description, parameter names)."""

from __future__ import annotations

import math
import re
from collections import Counter

from .catalog import Tool

_CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")
_STOP = {"a", "an", "the", "of", "to", "in", "on", "for", "and", "or", "is", "it", "with", "that", "this", "me", "my", "our", "i"}

# Field weights: a hit in the tool name matters more than one in prose.
NAME_WEIGHT = 3.0
PARAM_WEIGHT = 1.0
DESC_WEIGHT = 1.0


def _stem(w: str) -> str:
    if w.endswith("ies") and len(w) > 4:
        w = w[:-3] + "y"
    elif w.endswith("ing") and len(w) > 5:
        w = w[:-3]
    elif w.endswith("ed") and len(w) > 4:
        w = w[:-2]
    elif w.endswith(("ches", "shes", "sses", "xes")):
        w = w[:-2]
    elif w.endswith("s") and not w.endswith("ss") and len(w) > 3:
        w = w[:-1]
    if w.endswith("e") and len(w) > 3:
        w = w[:-1]
    return w


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-z0-9]+", _CAMEL.sub(" ", text).lower())
    return [_stem(w) for w in words if w not in _STOP]


class ToolIndex:
    def __init__(self, tools: list[Tool], k1: float = 1.5, b: float = 0.75, use_server: bool = False):
        self.tools = tools
        self.k1, self.b = k1, b
        self._tf: list[Counter] = []
        for t in tools:
            tf: Counter = Counter()
            for term in tokenize(t.name):
                tf[term] += NAME_WEIGHT
            if use_server:  # the server name counts like a word of the tool's name
                for term in tokenize(t.server):
                    tf[term] += NAME_WEIGHT
            for term in tokenize(t.description):
                tf[term] += DESC_WEIGHT
            for param in t.input_schema.get("properties", {}):
                for term in tokenize(param):
                    tf[term] += PARAM_WEIGHT
            self._tf.append(tf)
        self._len = [sum(tf.values()) for tf in self._tf]
        self._avg = (sum(self._len) / len(self._len)) if self._len else 0.0
        df: Counter = Counter()
        for tf in self._tf:
            df.update(tf.keys())
        n = len(tools)
        self._idf = {term: math.log(1 + (n - d + 0.5) / (d + 0.5)) for term, d in df.items()}

    def search(self, query: str, k: int = 5) -> list[tuple[Tool, float]]:
        terms = [t for t in tokenize(query) if t in self._idf]
        scored: list[tuple[Tool, float]] = []
        for tool, tf, dl in zip(self.tools, self._tf, self._len):
            score = 0.0
            for term in terms:
                f = tf.get(term, 0.0)
                if f:
                    norm = f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * dl / self._avg))
                    score += self._idf[term] * norm
            if score > 0:
                scored.append((tool, score))
        scored.sort(key=lambda x: -x[1])
        return scored[:k]
