import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS_NUMPY = importlib.util.find_spec("numpy") is not None


def hits(n_hit, n):
    return [i < n_hit for i in range(n)]


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class ScoreFifthTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "scripts"))
        import score_fifth

        cls.s = score_fifth

    def test_constants_and_text_agree(self):
        import score_independent

        doc = self.s.__doc__
        self.assertEqual(self.s.HEADLINE, score_independent.HEADLINE)
        self.assertEqual(self.s.COMPARISONS, score_independent.COMPARISONS)
        self.assertEqual(self.s.EARLIER_USER_RECALL, 0.860)
        self.assertIn("86.0%", doc)
        self.assertEqual(self.s.BIG_SERVER, "gitlab")
        for tag in self.s.COMPARISONS:
            self.assertIn(tag, doc)
        self.assertIn("2*sqrt(g + l)", doc)
        self.assertEqual(self.s.__name__, "score_fifth")

    def test_defaults_point_at_the_fifth_batch_only(self):
        src = (ROOT / "scripts" / "score_fifth.py").read_text()
        self.assertIn('"catalogs" / "test4"', src)
        self.assertIn("fifth-test.jsonl", src)
        for earlier in ("catalogs/test3", "mcp-test", "third-test", "first-test"):
            self.assertNotIn(earlier, src.split('"""', 2)[2])  # code, not the docstring

    def test_paired_agent_guard(self):
        n = 200
        base = hits(180, n)
        better = [True] * 200  # beats the headline on 20 queries and loses none: clears
        ok, beaten = self.s.agent_guard_paired({"H": base, "X": better}, headline="H")
        self.assertFalse(ok)
        self.assertEqual(beaten, ["X"])
        # a candidate ahead by a few queries is not significant, so the headline passes
        near = base[:]
        for i in range(180, 183):
            near[i] = True
        ok, beaten = self.s.agent_guard_paired({"H": base, "X": near}, headline="H")
        self.assertTrue(ok)
        self.assertEqual(beaten, [])
        # exactly at the bar: 4 gained, 0 lost clears (net 4 >= 2*sqrt(4))
        four = base[:]
        for i in range(180, 184):
            four[i] = True
        self.assertFalse(self.s.agent_guard_paired({"H": base, "X": four}, headline="H")[0])
        three = base[:]
        for i in range(180, 183):
            three[i] = True
        self.assertTrue(self.s.agent_guard_paired({"H": base, "X": three}, headline="H")[0])

    def test_readings(self):
        agent = {"H": hits(190, 200), "X": hits(193, 200)}  # 3 queries ahead (1.5 points): not significant, but the old 1-point rule would fail it
        r = self.s.readings((60, 10), agent, (0.80, 0.90), headline="H")
        self.assertTrue(r["R2_a_c1_clears"])
        self.assertTrue(r["R2_b_no_significantly_better_on_agent"])  # 3 gained, 0 lost: net 3 < 2*sqrt(3)
        self.assertTrue(r["R2_confirmed"])
        self.assertFalse(r["old_guard_within_1pt_info_only"])  # the old rule would have failed it; it does not decide
        self.assertTrue(r["R3_user_recall_consistent_with_earlier"])
        # each condition can fail alone
        self.assertFalse(self.s.readings((12, 10), agent, (0.80, 0.90), headline="H")["R2_confirmed"])
        far = {"H": hits(150, 200), "X": hits(200, 200)}
        self.assertFalse(self.s.readings((60, 10), far, (0.80, 0.90), headline="H")["R2_confirmed"])
        # R3 boundaries are inclusive
        self.assertTrue(self.s.readings((60, 10), agent, (0.86, 0.95), headline="H")["R3_user_recall_consistent_with_earlier"])
        self.assertTrue(self.s.readings((60, 10), agent, (0.70, 0.86), headline="H")["R3_user_recall_consistent_with_earlier"])
        self.assertFalse(self.s.readings((60, 10), agent, (0.861, 0.95), headline="H")["R3_user_recall_consistent_with_earlier"])
        self.assertFalse(self.s.readings((60, 10), agent, (0.70, 0.859), headline="H")["R3_user_recall_consistent_with_earlier"])


if __name__ == "__main__":
    unittest.main()
