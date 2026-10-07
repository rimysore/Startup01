import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS_NUMPY = importlib.util.find_spec("numpy") is not None
SIMPLE = ["bm25", "dense", "dense+server"]  # simplest first; dense is the incumbent


def rows(spec):
    """spec: list of (source, style, n, {variant: number_of_hits_among_n}) -> hits, styles, sources.

    The first k queries of each block are the hits, so blocks with more hits are supersets of blocks with fewer."""
    hits = {v: [] for v in SIMPLE}
    styles, sources = [], []
    for source, style, n, counts in spec:
        for v in SIMPLE:
            hits[v] += [i < counts[v] for i in range(n)]
        styles += [style] * n
        sources += [source] * n
    return hits, styles, sources


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class DecideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "scripts"))
        import select_default_v2

        cls.decide = staticmethod(lambda *a: select_default_v2.decide(*a, simplicity=SIMPLE, incumbent="dense"))

    def test_identical_candidates_choose_the_simplest(self):
        counts = {"bm25": 60, "dense": 60, "dense+server": 60}
        r = self.decide(*rows([("a", "user", 100, counts), ("a", "agent", 100, {k: 100 for k in counts})]))
        self.assertEqual(r["chosen_by_rule"], "bm25")
        self.assertEqual(r["decision"], "dense")  # the incumbent is kept unless the rule picks something that beats it

    def test_clear_winner_is_chosen_and_adopted(self):
        spec = [("a", "user", 100, {"bm25": 50, "dense": 60, "dense+server": 90}), ("a", "agent", 100, {"bm25": 100, "dense": 100, "dense+server": 100})]
        r = self.decide(*rows(spec))
        self.assertEqual(r["chosen_by_rule"], "dense+server")
        self.assertTrue(r["adopted"])
        self.assertEqual(r["decision"], "dense+server")

    def test_agent_guard_removes_a_candidate_even_if_it_wins_overall(self):
        spec = [("a", "user", 100, {"bm25": 90, "dense": 50, "dense+server": 50}), ("a", "agent", 100, {"bm25": 90, "dense": 100, "dense+server": 100})]
        r = self.decide(*rows(spec))
        self.assertNotIn("bm25", r["eligible"])  # 10 points below the best agent-style recall
        self.assertNotEqual(r["chosen_by_rule"], "bm25")

    def test_small_unprovable_lead_leaves_the_incumbent(self):
        spec = [("a", "user", 100, {"bm25": 50, "dense": 60, "dense+server": 63}), ("a", "agent", 100, {"bm25": 100, "dense": 100, "dense+server": 100})]
        r = self.decide(*rows(spec))  # g=3, l=0: net +3 < 2*sqrt(3)
        self.assertEqual(r["decision"], "dense")
        self.assertFalse(r["adopted"])

    def test_harm_in_one_source_blocks_adoption(self):
        spec = [
            ("big", "user", 200, {"bm25": 100, "dense": 100, "dense+server": 190}),
            ("big", "agent", 200, {"bm25": 200, "dense": 200, "dense+server": 200}),
            ("small", "user", 20, {"bm25": 10, "dense": 12, "dense+server": 11}),  # 5 points worse than dense here
            ("small", "agent", 20, {"bm25": 20, "dense": 20, "dense+server": 20}),
        ]
        r = self.decide(*rows(spec))
        self.assertEqual(r["chosen_by_rule"], "dense+server")
        self.assertFalse(r["adopted"])
        self.assertEqual(r["decision"], "dense")
        self.assertTrue(any("FAIL" in line for line in r["reasons"]))

    def test_tied_candidates_resolve_to_the_simpler_one(self):
        # dense+server is nominally best but not significantly better than dense -> dense (simpler) is chosen
        spec = [("a", "user", 100, {"bm25": 40, "dense": 70, "dense+server": 72}), ("a", "agent", 100, {"bm25": 100, "dense": 100, "dense+server": 100})]
        r = self.decide(*rows(spec))
        self.assertEqual(r["best_eligible"], "dense+server")
        self.assertEqual(r["chosen_by_rule"], "dense")


class SelectionScriptIsolationTests(unittest.TestCase):
    def test_select_default_v2_never_names_the_confirmation_batch(self):
        code = (ROOT / "scripts" / "select_default_v2.py").read_text().split('"""', 2)[2]
        for forbidden in ("test3", "mcp-test3"):
            self.assertNotIn(forbidden, code)

    def test_the_rule_is_documented_in_the_script(self):
        doc = (ROOT / "scripts" / "select_default_v2.py").read_text().split('"""', 2)[1]
        for phrase in ("committed BEFORE it was run", "Disclosure", "Rule (all thresholds fixed here)", "Eligible", "paired sign test"):
            self.assertIn(phrase, doc)


if __name__ == "__main__":
    unittest.main()
