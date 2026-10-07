import hashlib
import unittest
from pathlib import Path

from toolslim.catalog import load_catalogs
from toolslim.labels import check_labels, load_labels

ROOT = Path(__file__).resolve().parent.parent
IND = ROOT / "queries" / "independent"
BATCHES = {
    "dev": (["catalogs"], "error", 78, 156, "mcp-reference"),
    "first-test": (["catalogs/test"], "error", 70, 140, "mcp-test"),
    "second-test": (["catalogs/test2"], "error", 105, 210, "mcp-test2"),
    "third-test": (["catalogs/test3"], "namespace", 189, 378, "mcp-test3"),
}


class IndependentLabelTests(unittest.TestCase):
    def test_files_match_the_manifest_of_the_authors_originals(self):
        for line in (IND / "MANIFEST.sha256").read_text().splitlines():
            digest, name = line.split()
            self.assertEqual(hashlib.sha256((IND / name).read_bytes()).hexdigest(), digest, f"{name} was edited after the authors wrote it")
        self.assertEqual(len((IND / "MANIFEST.sha256").read_text().splitlines()), len(BATCHES) + 1)  # + the fifth batch

    def test_each_file_is_valid_complete_and_matches_its_catalog(self):
        for batch, (dirs, policy, n_tools, n_queries, _) in BATCHES.items():
            tools = load_catalogs([ROOT / d for d in dirs], on_duplicate=policy)
            labels = load_labels(IND / f"{batch}.jsonl")
            self.assertEqual((len(tools), len(labels)), (n_tools, n_queries), batch)
            check = check_labels(labels, tools)
            self.assertEqual(check.errors, [], batch)  # unknown names, duplicates
            self.assertFalse([w for w in check.warnings if "no labeled query" in w], batch)  # full coverage
            self.assertEqual({lb.style for lb in labels}, {"user", "agent"}, batch)
            first = {(lb.style, lb.expected[0]) for lb in labels}
            for t in tools:  # every tool is the preferred answer of one query of each style
                self.assertIn(("user", t.name), first, (batch, t.name))
                self.assertIn(("agent", t.name), first, (batch, t.name))

    def test_independence_no_user_style_query_is_copied_from_the_author_written_labels(self):
        mine = {lb.query.lower() for _, _, _, _, f in BATCHES.values() for lb in load_labels(ROOT / "queries" / f"{f}.jsonl")}
        for batch in BATCHES:
            copied = [lb.query for lb in load_labels(IND / f"{batch}.jsonl") if lb.style == "user" and lb.query.lower() in mine]
            self.assertEqual(copied, [], batch)
        agent_dups = sum(lb.query.lower() in mine for batch in BATCHES for lb in load_labels(IND / f"{batch}.jsonl"))
        self.assertEqual(agent_dups, 33)  # documented: short agent-style convergence only

    def test_fifth_batch_labels_are_valid_complete_and_scoped(self):
        tools = load_catalogs([ROOT / "catalogs" / "test4"])
        labels = load_labels(IND / "fifth-test.jsonl")
        self.assertEqual((len(tools), len(labels)), (213, 434))
        check = check_labels(labels, tools)
        self.assertEqual(check.errors, [])
        self.assertFalse([w for w in check.warnings if "no labeled query" in w])
        self.assertEqual({lb.style: sum(x.style == lb.style for x in labels) for lb in labels}, {"user": 217, "agent": 217})
        first = {(lb.style, lb.expected[0]) for lb in labels}
        for t in tools:
            self.assertIn(("user", t.name), first, t.name)
            self.assertIn(("agent", t.name), first, t.name)

    def test_fifth_batch_overlap_with_earlier_query_files_is_documented(self):
        earlier = set()
        for f in list((ROOT / "queries").glob("*.jsonl")) + [IND / f"{b}.jsonl" for b in BATCHES]:
            earlier |= {lb.query.lower() for lb in load_labels(f)}
        same = [lb for lb in load_labels(IND / "fifth-test.jsonl") if lb.query.lower() in earlier]
        self.assertEqual(len(same), 7)  # documented in queries/independent/README.md
        self.assertEqual(sum(lb.style == "user" for lb in same), 1)

    def test_third_batch_uses_the_namespaced_names(self):
        used = {e for lb in load_labels(IND / "third-test.jsonl") for e in lb.expected}
        self.assertIn("word__add_table", used)
        self.assertIn("powerpoint__add_table", used)
        self.assertNotIn("add_table", used)


if __name__ == "__main__":
    unittest.main()
