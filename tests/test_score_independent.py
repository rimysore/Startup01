import importlib.util
import math
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS_NUMPY = importlib.util.find_spec("numpy") is not None


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class ScoreIndependentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "scripts"))
        import make_label_kit
        import score_independent

        cls.s = score_independent
        cls.kit = make_label_kit

    # the protocol's constants are tied to the rest of the repository
    def test_headline_is_the_configured_default(self):
        from toolslim.config import DEFAULT_RETRIEVER

        self.assertEqual(self.s.HEADLINE, DEFAULT_RETRIEVER)

    def test_comparisons_name_real_candidates(self):
        for a, b in self.s.COMPARISONS.values():
            self.assertIn(a, self.s.sel.SIMPLICITY)
            self.assertIn(b, self.s.sel.SIMPLICITY)

    def test_batches_match_the_labeling_kit(self):
        # the scorer covers the four spent batches; the fifth gets its own protocol, so it must not be scored here
        kit = {k: (dirs, policy) for k, (dirs, policy) in self.kit.BATCHES.items() if k != "fifth-test"}
        self.assertNotIn("fifth-test", self.s.BATCHES)
        got = {k: (dirs, policy) for k, (dirs, policy, _) in self.s.BATCHES.items()}
        self.assertEqual(kit, got)
        for _, (_, _, mine) in self.s.BATCHES.items():
            self.assertTrue((ROOT / "queries" / f"{mine}.jsonl").exists())

    def test_declared_thresholds_appear_in_the_protocol_text(self):
        doc = self.s.__doc__
        self.assertEqual(self.s.RHO_MIN, 0.8)
        self.assertIn("rho >= 0.8", doc)
        self.assertIn("within 1 point", doc)
        self.assertEqual(self.s.AGENT_GUARD, 0.01)
        self.assertIn("2*sqrt(g + l)", doc)
        for tag in self.s.COMPARISONS:
            self.assertIn(tag, doc)

    # statistics
    def test_clears_boundary(self):
        self.assertTrue(self.s.clears(20, 4))  # net 16 >= 2*sqrt(24)=9.8
        self.assertFalse(self.s.clears(13, 7))  # net 6 < 2*sqrt(20)=8.9
        self.assertFalse(self.s.clears(5, 5))
        self.assertFalse(self.s.clears(0, 10))
        self.assertTrue(self.s.clears(4, 0))  # net 4 >= 2*sqrt(4)=4 exactly
        self.assertFalse(self.s.clears(3, 0))

    def test_wilson_matches_known_value(self):
        lo, hi = self.s.wilson(50, 100)
        self.assertAlmostEqual(lo, 0.4038, places=3)
        self.assertAlmostEqual(hi, 0.5962, places=3)
        lo, hi = self.s.wilson(100, 100)
        self.assertLess(lo, 1.0)
        self.assertAlmostEqual(hi, 1.0, places=6)

    def test_average_ranks_share_ties(self):
        self.assertEqual(self.s.average_ranks([10, 20, 20, 30]), [1.0, 2.5, 2.5, 4.0])

    def test_spearman(self):
        self.assertAlmostEqual(self.s.spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1.0)
        self.assertAlmostEqual(self.s.spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1.0)
        self.assertTrue(math.isnan(self.s.spearman([1, 1, 1], [1, 2, 3])))  # no variation: undefined, so R1 fails
        self.assertAlmostEqual(self.s.spearman([1, 2, 3, 4], [1, 3, 2, 4]), 0.8)

    def test_overlap_strata(self):
        self.assertEqual(self.s.overlap_stratum(0.0), "none")
        self.assertEqual(self.s.overlap_stratum(0.34), "some")
        self.assertEqual(self.s.overlap_stratum(0.5), "half or more")
        self.assertEqual(self.s.overlap_stratum(1.0), "half or more")

    # the declared readings
    def test_readings(self):
        names = ["a", "b", "c", "H"]
        mine = {"a": 0.7, "b": 0.8, "c": 0.75, "H": 0.9}
        agree = {"a": 0.6, "b": 0.7, "c": 0.65, "H": 0.85}
        flipped = {"a": 0.9, "b": 0.7, "c": 0.75, "H": 0.6}
        agent_ok = {"a": 0.97, "b": 0.99, "c": 0.9, "H": 0.985}
        agent_bad = {"a": 0.97, "b": 0.99, "c": 0.9, "H": 0.95}
        r = self.s.readings(mine, agree, (30, 5), agent_ok, headline="H")
        self.assertTrue(r["R1_conclusions_independent_of_label_author"])
        self.assertTrue(r["R2_supported"])
        # each condition can fail alone
        self.assertFalse(self.s.readings(mine, flipped, (30, 5), agent_ok, headline="H")["R1_conclusions_independent_of_label_author"])
        self.assertFalse(self.s.readings(mine, agree, (8, 5), agent_ok, headline="H")["R2_supported"])
        self.assertFalse(self.s.readings(mine, agree, (30, 5), agent_bad, headline="H")["R2_supported"])
        # exactly 1 point below the best is still within; more is not
        edge = {"a": 0.99, "H": 0.98, "b": 0.5, "c": 0.5}
        self.assertTrue(self.s.readings(mine, agree, (30, 5), edge, headline="H")["R2_b_agent_within_1pt"])
        edge["H"] = 0.979
        self.assertFalse(self.s.readings(mine, agree, (30, 5), edge, headline="H")["R2_b_agent_within_1pt"])
        # R1 boundary: one adjacent swap among four gives rho = 0.8 exactly, which passes; a bigger disagreement does not
        mild = {"a": 0.6, "b": 0.65, "c": 0.7, "H": 0.85}  # c and b swapped relative to `mine`
        self.assertAlmostEqual(self.s.readings(mine, mild, (30, 5), agent_ok, headline="H")["rho"], 0.8)
        self.assertTrue(self.s.readings(mine, mild, (30, 5), agent_ok, headline="H")["R1_conclusions_independent_of_label_author"])
        worse = {"a": 0.6, "b": 0.85, "c": 0.7, "H": 0.65}
        self.assertFalse(self.s.readings(mine, worse, (30, 5), agent_ok, headline="H")["R1_conclusions_independent_of_label_author"])
        self.assertEqual(sorted(r), sorted(["rho", "R1_conclusions_independent_of_label_author", "R2_a_c1_clears", "R2_b_agent_within_1pt", "R2_supported"]))
        self.assertEqual(names, list(agree)[:3] + ["H"])  # keeps the test's own dict order honest


if __name__ == "__main__":
    unittest.main()
