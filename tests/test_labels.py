import json
import tempfile
import unittest
from pathlib import Path

from toolslim.bench import evaluate
from toolslim.catalog import load_catalogs
from toolslim.fixtures import synthetic_catalog
from toolslim.labels import LabelError, as_query_sets, check_labels, load_labels, name_overlap

ROOT = Path(__file__).resolve().parent.parent


def write_labels(lines: list[str]) -> Path:
    f = tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False)
    f.write("\n".join(lines) + "\n")
    f.close()
    return Path(f.name)


class LoadTests(unittest.TestCase):
    def test_loads_and_normalizes(self):
        path = write_labels(
            [
                json.dumps({"query": "a  ", "expected": "github_create_issue"}),
                "",
                json.dumps({"query": "b", "expected": ["x", "y"], "style": "agent", "note": "n"}),
            ]
        )
        a, b = load_labels(path)
        self.assertEqual((a.query, a.expected, a.style, a.line), ("a", ("github_create_issue",), "user", 1))
        self.assertEqual((b.expected, b.style, b.note, b.line), (("x", "y"), "agent", "n", 3))

    def test_errors_carry_file_and_line(self):
        cases = {
            "not json": "invalid JSON",
            json.dumps([1]): "expected a JSON object",
            json.dumps({"query": "", "expected": ["a"]}): "'query'",
            json.dumps({"query": "q", "expected": []}): "'expected'",
            json.dumps({"query": "q", "expected": [1]}): "'expected'",
            json.dumps({"query": "q", "expected": ["a"], "style": "robot"}): "'style'",
        }
        for line, fragment in cases.items():
            path = write_labels([line])
            with self.assertRaises(LabelError) as ctx:
                load_labels(path)
            self.assertIn(fragment, str(ctx.exception))
            self.assertIn(":1:", str(ctx.exception))


class CheckTests(unittest.TestCase):
    def labels(self, *rows):
        return load_labels(write_labels([json.dumps(r) for r in rows]))

    def test_unknown_tool_and_duplicate_are_errors(self):
        tools = synthetic_catalog()
        check = check_labels(
            self.labels(
                {"query": "q one", "expected": ["nope"]},
                {"query": "Q ONE", "expected": ["stripe_get_balance"]},
            ),
            tools,
        )
        self.assertFalse(check.ok)
        self.assertTrue(any("unknown tool" in e for e in check.errors))
        self.assertTrue(any("duplicate query" in e for e in check.errors))

    def test_uncovered_tools_and_leaky_user_queries_are_warnings_not_errors(self):
        tools = synthetic_catalog()
        check = check_labels(self.labels({"query": "stripe get balance", "expected": ["stripe_get_balance"]}), tools)
        self.assertTrue(check.ok)
        self.assertTrue(any("no labeled query" in w for w in check.warnings))
        self.assertTrue(any("every word of its tool's name" in w for w in check.warnings))

    def test_agent_style_queries_are_not_flagged_for_leakage(self):
        tools = synthetic_catalog()
        check = check_labels(self.labels({"query": "stripe get balance", "expected": ["stripe_get_balance"], "style": "agent"}), tools)
        self.assertFalse(any("every word" in w for w in check.warnings))

    def test_name_overlap(self):
        self.assertEqual(name_overlap("create an issue", "github_create_issue"), 2 / 3)
        self.assertEqual(name_overlap("unrelated words", "github_create_issue"), 0.0)

    def test_as_query_sets_groups_by_style(self):
        labels = self.labels(
            {"query": "a", "expected": ["x"]},
            {"query": "b", "expected": ["y"], "style": "agent"},
        )
        self.assertEqual(as_query_sets(labels), {"user": [("a", ("x",))], "agent": [("b", ("y",))]})


class MultiExpectedScoringTests(unittest.TestCase):
    class Fixed:
        def __init__(self, names):
            from toolslim.catalog import Tool

            self.hits = [(Tool(n, "", {}), 1.0) for n in names]

        def search(self, query, k=5):
            return self.hits[:k]

    def test_any_acceptable_tool_counts_and_rank_is_the_best_one(self):
        r = self.Fixed(["a", "b", "c"])
        m = evaluate(r, [("q", ("c", "b"))])
        self.assertEqual(m.recall[1], 0.0)
        self.assertEqual(m.recall[3], 1.0)
        self.assertEqual(m.mrr, 0.5)  # best acceptable rank is 2

    def test_single_string_expected_still_works(self):
        m = evaluate(self.Fixed(["a"]), [("q", "a")])
        self.assertEqual((m.recall[1], m.mrr), (1.0, 1.0))

    def test_miss_reports_all_acceptable_names(self):
        m = evaluate(self.Fixed(["a"]), [("q", ("x", "y"))])
        self.assertEqual(m.misses[0][1], "x | y")


class CommittedDataTests(unittest.TestCase):
    """Guards the real-catalog data checked into the repo."""

    def test_catalogs_load_with_unique_names(self):
        tools = load_catalogs([ROOT / "catalogs"])
        self.assertGreaterEqual(len(tools), 70)
        self.assertEqual(len({t.name for t in tools}), len(tools))

    def test_fresh_test_catalogs_are_separate_and_collision_free(self):
        dev = load_catalogs([ROOT / "catalogs"])
        test = load_catalogs([ROOT / "catalogs" / "test"])
        self.assertGreaterEqual(len(test), 60)
        self.assertFalse({t.name for t in dev} & {t.name for t in test})
        # --catalog catalogs must not silently pull in the test set
        self.assertFalse({t.name for t in test} & {t.name for t in load_catalogs([ROOT / "catalogs"])})

    def test_next_batch_is_separate_collision_free_and_unlabeled(self):
        dev = {t.name for t in load_catalogs([ROOT / "catalogs"])}
        spent = {t.name for t in load_catalogs([ROOT / "catalogs" / "test"])}
        batch = load_catalogs([ROOT / "catalogs" / "test2"])
        names = {t.name for t in batch}
        self.assertGreaterEqual(len(batch), 100)
        self.assertEqual(len(names), len(batch))
        self.assertFalse(names & dev)
        self.assertFalse(names & spent)
        # Labels for this batch must be added deliberately (committed before scoring); update this test and
        # catalogs/README.md when they are.
        for f in (ROOT / "queries").glob("*.jsonl"):
            self.assertFalse({e for lb in load_labels(f) for e in lb.expected} & names, f.name)

    def test_dev_labels_do_not_reference_test_tools(self):
        test_names = {t.name for t in load_catalogs([ROOT / "catalogs" / "test"])}
        dev_labels = load_labels(ROOT / "queries" / "mcp-reference.jsonl")
        self.assertFalse({e for lb in dev_labels for e in lb.expected} & test_names)

    def test_test_labels_match_test_catalogs_cleanly(self):
        tools = load_catalogs([ROOT / "catalogs" / "test"])
        labels = load_labels(ROOT / "queries" / "mcp-test.jsonl")
        check = check_labels(labels, tools)
        self.assertEqual(check.errors, [])
        self.assertEqual(check.warnings, [])  # full coverage, no leaky user-style queries
        self.assertEqual({lb.style for lb in labels}, {"user", "agent"})

    def test_dev_and_test_label_files_share_no_queries(self):
        dev = {lb.query.lower() for lb in load_labels(ROOT / "queries" / "mcp-reference.jsonl")}
        test = {lb.query.lower() for lb in load_labels(ROOT / "queries" / "mcp-test.jsonl")}
        self.assertFalse(dev & test)

    def test_test_labels_only_reference_test_tools(self):
        dev_names = {t.name for t in load_catalogs([ROOT / "catalogs"])}
        labels = load_labels(ROOT / "queries" / "mcp-test.jsonl")
        self.assertFalse({e for lb in labels for e in lb.expected} & dev_names)

    def test_catalogs_carry_provenance(self):
        for f in sorted((ROOT / "catalogs").glob("*.json")) + sorted((ROOT / "catalogs" / "test").glob("*.json")) + sorted((ROOT / "catalogs" / "test2").glob("*.json")):
            src = json.loads(f.read_text())["source"]
            for key in ("name", "package", "license", "server", "captured_at"):
                self.assertTrue(src.get(key), f"{f.name}: missing source.{key}")

    def test_committed_labels_match_committed_catalogs(self):
        tools = load_catalogs([ROOT / "catalogs"])
        check = check_labels(load_labels(ROOT / "queries" / "mcp-reference.jsonl"), tools)
        self.assertEqual(check.errors, [])
        self.assertFalse([w for w in check.warnings if "every word" in w or "no labeled query" in w], check.warnings)


class SelectionScriptIsolationTests(unittest.TestCase):
    def test_select_config_never_names_the_test_set(self):
        """The dev-only selection script must not be able to read the held-back test data."""
        code = (ROOT / "scripts" / "select_config.py").read_text()
        code_without_docstring = code.split('"""', 2)[2]
        for forbidden in ("catalogs/test", '"test"', "mcp-test", "catalogs\" / \"test"):
            self.assertNotIn(forbidden, code_without_docstring)


class DuplicateToolNamesTests(unittest.TestCase):
    def test_load_catalogs_rejects_duplicates_across_files(self):
        d = Path(tempfile.mkdtemp())
        for name in ("a.json", "b.json"):
            (d / name).write_text(json.dumps({"tools": [{"name": "same", "inputSchema": {"type": "object"}}]}))
        with self.assertRaisesRegex(ValueError, "duplicate tool name 'same'"):
            load_catalogs([d])


if __name__ == "__main__":
    unittest.main()
