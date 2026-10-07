import importlib.util
from pathlib import Path
import unittest
import zlib

from toolslim.catalog import Tool
from toolslim.fixtures import synthetic_catalog, synthetic_queries
from toolslim.gateway import LazyToolGateway
from toolslim.hybrid import HybridIndex

HAS_NUMPY = importlib.util.find_spec("numpy") is not None
HAS_WORDLLAMA = importlib.util.find_spec("wordllama") is not None


def tool(name: str) -> Tool:
    return Tool(name, f"{name} description", {"type": "object", "properties": {}})


class FakeRetriever:
    """Returns a fixed ranking regardless of the query."""

    def __init__(self, ranking: list[tuple[str, float]]):
        self._ranking = [(tool(n), s) for n, s in ranking]

    def search(self, query, k=5):
        return self._ranking[:k]


class HybridTests(unittest.TestCase):
    def names(self, index, k=5):
        return [t.name for t, _ in index.search("q", k=k)]

    def test_rrf_rewards_agreement_over_a_single_first_place(self):
        a = FakeRetriever([("x", 9), ("shared", 8), ("y", 1)])
        b = FakeRetriever([("z", 9), ("shared", 8), ("w", 1)])
        self.assertEqual(self.names(HybridIndex([a, b]))[0], "shared")

    def test_results_are_deduplicated_across_retrievers(self):
        a = FakeRetriever([("x", 2), ("y", 1)])
        b = FakeRetriever([("y", 2), ("x", 1)])
        self.assertCountEqual(self.names(HybridIndex([a, b])), ["x", "y"])

    def test_weights_shift_the_winner(self):
        a = FakeRetriever([("from_a", 1.0)])
        b = FakeRetriever([("from_b", 1.0)])
        self.assertEqual(self.names(HybridIndex([a, b], weights=[1, 3]))[0], "from_b")
        self.assertEqual(self.names(HybridIndex([a, b], weights=[3, 1]))[0], "from_a")

    def test_minmax_uses_score_magnitude_rrf_ignores_it(self):
        a = FakeRetriever([("a1", 100.0), ("a2", 1.0)])
        b = FakeRetriever([("b1", 0.30), ("a2", 0.29)])
        # minmax: a1 = 1.0, b1 = 1.0, a2 = 0.0 (lowest in both pools) -> a2 loses.
        self.assertEqual(self.names(HybridIndex([a, b], fusion="minmax"))[-1], "a2")
        # rrf only sees ranks: a2 is 2nd in both lists, which beats 1st in just one.
        self.assertEqual(self.names(HybridIndex([a, b], fusion="rrf"))[0], "a2")

    def test_empty_retriever_is_ignored(self):
        a = FakeRetriever([("x", 1)])
        self.assertEqual(self.names(HybridIndex([a, FakeRetriever([])])), ["x"])

    def test_unknown_fusion_rejected(self):
        with self.assertRaises(ValueError):
            HybridIndex([], fusion="nope")

    def test_k_limits_results(self):
        a = FakeRetriever([(f"t{i}", 10 - i) for i in range(8)])
        self.assertEqual(len(self.names(HybridIndex([a]), k=3)), 3)


def bag_of_words_embedder(texts):
    """Deterministic toy embedder: hashed bag of words (stable across runs)."""
    import numpy as np

    out = np.zeros((len(texts), 64), dtype=np.float32)
    for i, text in enumerate(texts):
        for word in text.lower().replace("_", " ").split():
            out[i, zlib.crc32(word.strip(".,").encode()) % 64] += 1
    return out


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class DenseTests(unittest.TestCase):
    def test_dense_ranks_word_sharing_doc_first(self):
        from toolslim.dense import DenseIndex

        index = DenseIndex(synthetic_catalog(), bag_of_words_embedder)
        top = index.search("refund payment fully or partially", k=1)[0][0]
        self.assertEqual(top.name, "stripe_refund_payment")

    def test_dense_always_returns_k_results(self):
        from toolslim.dense import DenseIndex

        index = DenseIndex(synthetic_catalog(), bag_of_words_embedder)
        self.assertEqual(len(index.search("zzzz qqqq", k=5)), 5)  # known limitation: no "no match" signal

    def test_zero_vector_embeddings_do_not_produce_nan(self):
        import numpy as np

        from toolslim.dense import DenseIndex

        index = DenseIndex(synthetic_catalog(), lambda texts: np.zeros((len(texts), 8)))
        scores = [s for _, s in index.search("anything", k=3)]
        self.assertTrue(all(s == 0.0 for s in scores))


@unittest.skipUnless(HAS_WORDLLAMA, "wordllama not installed (pip install toolslim[dense])")
class WordLlamaRegressionTests(unittest.TestCase):
    """Regression floors under the measured dev scores (dense 70%, hybrid 78% recall@5)."""

    @classmethod
    def setUpClass(cls):
        from toolslim.bench import candidate_retrievers, evaluate

        cls.tools = synthetic_catalog()
        cls.retrievers, note = candidate_retrievers(cls.tools)
        cls.evaluate = staticmethod(evaluate)
        assert note is None, note

    def test_dense_beats_bm25_on_paraphrased_queries(self):
        q = synthetic_queries()
        bm25 = self.evaluate(self.retrievers["bm25"], q).recall[5]
        dense = self.evaluate(self.retrievers["dense"], q).recall[5]
        self.assertGreater(dense, bm25 + 0.10)

    def test_hybrid_floor(self):
        self.assertGreaterEqual(self.evaluate(self.retrievers["hybrid-rrf"], synthetic_queries()).recall[5], 0.70)

    def test_gateway_accepts_hybrid_index(self):
        gw = LazyToolGateway(self.tools, index=self.retrievers["hybrid-rrf"])
        self.assertIn("calendar_delete_event", gw.search("remove an event from my schedule"))


class DefaultConfigTests(unittest.TestCase):
    RESULTS = Path(__file__).resolve().parent.parent / "results"

    def test_default_matches_the_recorded_round_2_selection_and_round_1_is_kept_as_history(self):
        import json

        from toolslim.config import DEFAULT_RETRIEVER

        v2 = json.loads((self.RESULTS / "dev-selection-v2.json").read_text())
        self.assertEqual(DEFAULT_RETRIEVER, v2["decision"])
        self.assertTrue(v2["adopted"])
        self.assertEqual(json.loads((self.RESULTS / "dev-selection.json").read_text())["chosen"], "dense")  # round 1

    def test_default_retriever_falls_back_to_bm25_with_a_note_when_dense_is_missing(self):
        import sys

        from toolslim.config import default_retriever
        from toolslim.index import ToolIndex

        # Hide only `wordllama`. (Snapshot/restoring all of sys.modules would also evict
        # numpy if it were first imported inside the block, and numpy cannot be re-imported.)
        missing = object()
        saved = sys.modules.get("wordllama", missing)
        sys.modules["wordllama"] = None
        try:
            retriever, note = default_retriever(synthetic_catalog())
        finally:
            if saved is missing:
                del sys.modules["wordllama"]
            else:
                sys.modules["wordllama"] = saved
        self.assertIsInstance(retriever, ToolIndex)
        self.assertIn("falls back to BM25", note)

    @unittest.skipUnless(HAS_WORDLLAMA, "wordllama not installed")
    def test_default_retriever_is_the_hybrid_with_server_names_when_available(self):
        from toolslim.config import default_retriever

        retriever, note = default_retriever(synthetic_catalog())
        self.assertIsInstance(retriever, HybridIndex)
        self.assertIsNone(note)

    @unittest.skipUnless(HAS_WORDLLAMA, "wordllama not installed")
    def test_bench_uses_the_default_as_its_primary_retriever(self):
        from toolslim import bench
        from toolslim.config import DEFAULT_RETRIEVER

        report = bench.run(synthetic_catalog(), {"dev": bench.QUERY_SETS["dev"]()})
        self.assertEqual(report.primary, DEFAULT_RETRIEVER)
        self.assertIsNone(report.note)


@unittest.skipUnless(HAS_WORDLLAMA, "wordllama not installed")
class BuildRetrieverTests(unittest.TestCase):
    def test_every_named_retriever_builds_and_answers(self):
        from toolslim.dense import DenseIndex
        from toolslim.index import ToolIndex
        from toolslim.retrievers import NAMES, build_retriever

        tools = synthetic_catalog()
        expected = {"bm25": ToolIndex, "bm25+server": ToolIndex, "dense": DenseIndex, "dense+server": DenseIndex}
        for name in NAMES:
            retriever = build_retriever(name, tools)
            self.assertIsInstance(retriever, expected.get(name, HybridIndex), name)
            self.assertTrue(retriever.search("send an email", k=3), name)

    def test_unknown_name_is_rejected(self):
        from toolslim.retrievers import build_retriever

        with self.assertRaises(ValueError):
            build_retriever("hybrid-xyz", synthetic_catalog())

    def test_server_variants_differ_only_for_tools_that_have_a_server(self):
        from toolslim.catalog import Tool
        from toolslim.retrievers import build_retriever

        bare = [Tool("alpha_one", "does the thing", {"type": "object"}), Tool("alpha_two", "does the thing", {"type": "object"})]
        a = [(t.name, round(sc, 6)) for t, sc in build_retriever("bm25", bare).search("thing")]
        b = [(t.name, round(sc, 6)) for t, sc in build_retriever("bm25+server", bare).search("thing")]
        self.assertEqual(a, b)


class GatewayCustomIndexTests(unittest.TestCase):
    def test_gateway_uses_injected_index(self):
        gw = LazyToolGateway(synthetic_catalog(), index=FakeRetriever([("stripe_get_balance", 1.0)]))
        self.assertTrue(gw.search("anything").startswith("- "))


if __name__ == "__main__":
    unittest.main()
