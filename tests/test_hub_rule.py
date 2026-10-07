import importlib.util
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HAS_NUMPY = importlib.util.find_spec("numpy") is not None
SOURCES = ["s1", "s2", "s3", "s4", "s5"]


def hits(k, n):
    return [i < k for i in range(n)]


def grid(counts, n=40):
    """counts: {config: {source: (user_hits, agent_hits)}} -> H[config][source][style] (n queries per style)."""
    return {c: {s: {"user": hits(u, n), "agent": hits(a, n)} for s, (u, a) in per.items()} for c, per in counts.items()}


def uniform(user, agent, sources=SOURCES):
    return {s: (user, agent) for s in sources}


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class RuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sys.path.insert(0, str(ROOT / "scripts"))
        import hub_tokenizer_experiment as hte

        cls.hte = hte

    # ---- part 1
    def test_tokenizer_fix_with_a_gain_and_no_harm_is_adopted(self):
        H = grid({"bm25+server|legacy": uniform(20, 38), "bm25+server|camel": uniform(22, 38),
                  "hybrid-rrf+server|legacy": uniform(30, 39), "hybrid-rrf+server|camel": uniform(30, 39)})
        d = self.hte.tokenizer_decision(H, SOURCES)
        self.assertTrue(d["adopt"])
        self.assertEqual(d["retrievers"]["bm25+server"]["gained"], 10)

    def test_tokenizer_fix_that_loses_overall_is_rejected(self):
        H = grid({"bm25+server|legacy": uniform(20, 38), "bm25+server|camel": uniform(22, 38),
                  "hybrid-rrf+server|legacy": uniform(30, 39), "hybrid-rrf+server|camel": uniform(29, 39)})
        self.assertFalse(self.hte.tokenizer_decision(H, SOURCES)["adopt"])

    def test_tokenizer_fix_that_hurts_one_source_badly_is_rejected(self):
        legacy = uniform(30, 39)
        camel = {**uniform(33, 39), "s3": (26, 39)}  # +3 on four sources, -4 on s3 (-5 points of that source's all-query recall)
        H = grid({"bm25+server|legacy": legacy, "bm25+server|camel": camel, "hybrid-rrf+server|legacy": legacy, "hybrid-rrf+server|camel": legacy})
        d = self.hte.tokenizer_decision(H, SOURCES)
        self.assertGreaterEqual(d["retrievers"]["bm25+server"]["gained"] - d["retrievers"]["bm25+server"]["lost"], 0)
        self.assertFalse(d["adopt"])

    # ---- part 2
    BASE, CAND = (0.0, 0.75), (0.5, 0.4)

    def lobo(self, cand_counts):
        H = grid({self.BASE: uniform(20, 38), self.CAND: cand_counts})
        return self.hte.lobo_decision(H, [self.BASE, self.CAND], SOURCES)

    def test_a_consistent_out_of_sample_gain_is_adopted(self):
        d = self.lobo(uniform(28, 38))
        self.assertTrue(d["adopt"])
        self.assertEqual(d["final_config"], self.CAND)
        self.assertTrue(all(f["chosen"] == self.CAND for f in d["folds"].values()))

    def test_identical_configs_resolve_to_the_baseline(self):
        d = self.lobo(uniform(20, 38))
        self.assertEqual({f["chosen"] for f in d["folds"].values()}, {self.BASE})
        self.assertFalse(d["adopt"])
        self.assertEqual(d["final_config"], self.BASE)

    def test_a_small_out_of_sample_gain_below_the_bar_is_not_adopted(self):
        # +1 query in three sources: each of those, when held out, is scored with the candidate chosen on the others,
        # so the pooled out-of-sample gain is 3 gained / 0 lost, below the bar 2*sqrt(3) = 3.46.
        d = self.lobo({**uniform(20, 38), "s1": (21, 38), "s2": (21, 38), "s3": (21, 38)})
        self.assertEqual((d["gained"], d["lost"]), (3, 0))
        self.assertFalse(d["conditions"]["a_sign_test"])
        self.assertFalse(d["adopt"])

    def test_a_gain_in_a_single_source_cannot_show_out_of_sample(self):
        d = self.lobo({**uniform(20, 38), "s1": (30, 38)})
        self.assertEqual(d["folds"]["s1"]["chosen"], self.BASE)  # chosen without s1, so it cannot benefit from s1

    def test_harm_to_one_held_out_source_blocks_adoption(self):
        d = self.lobo({**uniform(30, 38), "s4": (14, 38)})  # big gains elsewhere, -6 queries (-7.5 points) in s4
        self.assertTrue(d["conditions"]["a_sign_test"])
        self.assertFalse(d["conditions"]["b_no_source_worse"])
        self.assertFalse(d["adopt"])

    def test_a_pooled_agent_style_drop_blocks_adoption(self):
        d = self.lobo(uniform(30, 36))  # +10 user hits per source but -2 agent hits per source (-5 points)
        self.assertTrue(d["conditions"]["a_sign_test"])
        self.assertFalse(d["conditions"]["c_agent_not_lower"])
        self.assertFalse(d["adopt"])

    def test_selection_never_looks_at_the_held_out_source(self):
        # CAND is better everywhere except s5, where it is far worse: when s5 is held out, CAND is still chosen
        d = self.lobo({**uniform(30, 38), "s5": (0, 0)})
        self.assertEqual(d["folds"]["s5"]["chosen"], self.CAND)
        self.assertLess(d["folds"]["s5"]["diff_all"], -0.02)
        self.assertFalse(d["adopt"])


class DocumentedProtocolTests(unittest.TestCase):
    def test_the_rules_and_disclosures_are_in_the_script(self):
        doc = " ".join((ROOT / "scripts" / "hub_tokenizer_experiment.py").read_text().split('"""', 2)[1].split())  # normalize line wraps
        for phrase in ("committed BEFORE it was run", "no untouched batch left", "not blind", "PART 1", "PART 2", "Leave-one-batch-out", "ADOPT iff"):
            self.assertIn(phrase, doc)


if __name__ == "__main__":
    unittest.main()
