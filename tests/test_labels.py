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

    def test_next_batch_is_separate_and_collision_free(self):
        dev = {t.name for t in load_catalogs([ROOT / "catalogs"])}
        spent = {t.name for t in load_catalogs([ROOT / "catalogs" / "test"])}
        batch = load_catalogs([ROOT / "catalogs" / "test2"])
        names = {t.name for t in batch}
        self.assertGreaterEqual(len(batch), 100)
        self.assertEqual(len(names), len(batch))
        self.assertFalse(names & dev)
        self.assertFalse(names & spent)

    def test_next_batch_labels_are_clean_and_confined_to_their_catalog(self):
        tools = load_catalogs([ROOT / "catalogs" / "test2"])
        names = {t.name for t in tools}
        labels = load_labels(ROOT / "queries" / "mcp-test2.jsonl")
        check = check_labels(labels, tools)
        self.assertEqual(check.errors, [])
        self.assertEqual(check.warnings, [])  # full coverage, no leaky user-style queries
        self.assertEqual({lb.style for lb in labels}, {"user", "agent"})
        # no other label file may reference this batch, and these labels reference nothing else
        for f in (ROOT / "queries").glob("*.jsonl"):
            if f.name != "mcp-test2.jsonl":
                self.assertFalse({e for lb in load_labels(f) for e in lb.expected} & names, f.name)
        other = {t.name for d in ("catalogs", "catalogs/test") for t in load_catalogs([ROOT / d])}
        self.assertFalse({e for lb in labels for e in lb.expected} & other)

    def test_all_label_files_share_no_query_text(self):
        seen: dict[str, str] = {}
        for f in sorted((ROOT / "queries").glob("*.jsonl")):
            for lb in load_labels(f):
                key = lb.query.lower()
                self.assertNotIn(key, seen, f"{f.name} repeats a query from {seen.get(key)}: {lb.query!r}")
                seen[key] = f.name

    def test_kubectl_generic_rule_is_applied_uniformly(self):
        # Documented rule: kubectl_generic is accepted wherever a dedicated kubectl tool is the expected answer.
        labels = load_labels(ROOT / "queries" / "mcp-test2.jsonl")
        dedicated = {"kubectl_get", "kubectl_describe", "kubectl_delete", "kubectl_logs", "kubectl_scale", "kubectl_patch", "kubectl_rollout", "kubectl_context"}
        for lb in labels:
            if lb.expected[0] in dedicated:
                self.assertIn("kubectl_generic", lb.expected, lb.query)

    def test_third_batch_needs_namespacing(self):
        with self.assertRaisesRegex(ValueError, "duplicate tool name 'add_table'"):
            load_catalogs([ROOT / "catalogs" / "test3"])
        batch = load_catalogs([ROOT / "catalogs" / "test3"], on_duplicate="namespace")
        names = {t.name for t in batch}
        self.assertEqual(len(batch), 189)
        self.assertEqual(len(names), len(batch))
        self.assertEqual({n for n in names if "__" in n}, {"word__add_table", "powerpoint__add_table"})
        self.assertEqual({t.server for t in batch}, {"excel", "word", "powerpoint", "redis", "obsidian", "docker"})
        for d in ("catalogs", "catalogs/test2"):
            self.assertFalse(names & {t.name for t in load_catalogs([ROOT / d])}, d)

    def test_third_batch_labels_are_clean_and_use_the_namespaced_names(self):
        tools = load_catalogs([ROOT / "catalogs" / "test3"], on_duplicate="namespace")
        names = {t.name for t in tools}
        labels = load_labels(ROOT / "queries" / "mcp-test3.jsonl")
        check = check_labels(labels, tools)
        self.assertEqual(check.errors, [])
        self.assertEqual(check.warnings, [])  # full coverage, no leaky user-style queries
        self.assertEqual(len(labels), 378)
        self.assertEqual({lb.style for lb in labels}, {"user", "agent"})
        used = {e for lb in labels for e in lb.expected}
        self.assertIn("word__add_table", used)
        self.assertIn("powerpoint__add_table", used)
        self.assertNotIn("add_table", used)
        # no other label file may reference names unique to this batch (the spent SQLite label `create_table`
        # legitimately shares a name with Excel's tool, so shared names are excluded)
        others = {t.name for d in ("catalogs", "catalogs/test", "catalogs/test2") for t in load_catalogs([ROOT / d])}
        for f in (ROOT / "queries").glob("*.jsonl"):
            if f.name != "mcp-test3.jsonl":
                self.assertFalse({e for lb in load_labels(f) for e in lb.expected} & (names - others), f.name)
        # and these labels reference nothing outside the batch
        self.assertFalse(used - names)

    def test_footnote_rule_is_applied_uniformly(self):
        # Documented rule: every tool that adds a footnote "by paragraph" is accepted wherever one of them is expected.
        by_paragraph = {"add_footnote_to_document", "add_footnote_enhanced", "add_footnote_robust"}
        for lb in load_labels(ROOT / "queries" / "mcp-test3.jsonl"):
            if lb.expected[0] in {"add_footnote_to_document", "add_footnote_enhanced"}:
                self.assertTrue(by_paragraph <= set(lb.expected), lb.query)

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
        for f in sorted((ROOT / "catalogs").glob("*.json")) + sorted((ROOT / "catalogs" / "test").glob("*.json")) + sorted((ROOT / "catalogs" / "test2").glob("*.json")) + sorted((ROOT / "catalogs" / "test3").glob("*.json")):
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
    def _two_servers(self, shared="same", other=("only_a", "only_b")):
        d = Path(tempfile.mkdtemp())
        for server, extra in (("srv_a", other[0]), ("srv_b", other[1])):
            (d / f"{server}.json").write_text(json.dumps({
                "source": {"name": server},
                "tools": [{"name": shared, "inputSchema": {"type": "object"}}, {"name": extra, "inputSchema": {"type": "object"}}],
            }))
        return d

    def test_namespace_policy_renames_only_the_colliding_tools(self):
        tools = load_catalogs([self._two_servers()], on_duplicate="namespace")
        self.assertEqual(sorted(t.name for t in tools), ["only_a", "only_b", "srv_a__same", "srv_b__same"])
        self.assertEqual({t.name: t.server for t in tools}["srv_a__same"], "srv_a")

    def test_default_policy_still_errors_and_bad_policy_is_rejected(self):
        d = self._two_servers()
        with self.assertRaisesRegex(ValueError, "duplicate tool name 'same'"):
            load_catalogs([d])
        with self.assertRaises(ValueError):
            load_catalogs([d], on_duplicate="ignore")

    def test_namespacing_cannot_hide_a_duplicate_within_one_server(self):
        d = Path(tempfile.mkdtemp())
        (d / "a.json").write_text(json.dumps({"source": {"name": "a"}, "tools": [{"name": "x", "inputSchema": {"type": "object"}}, {"name": "x", "inputSchema": {"type": "object"}}]}))
        with self.assertRaisesRegex(ValueError, "still not unique"):
            load_catalogs([d], on_duplicate="namespace")

    def test_load_catalogs_rejects_duplicates_across_files(self):
        d = Path(tempfile.mkdtemp())
        for name in ("a.json", "b.json"):
            (d / name).write_text(json.dumps({"tools": [{"name": "same", "inputSchema": {"type": "object"}}]}))
        with self.assertRaisesRegex(ValueError, "duplicate tool name 'same'"):
            load_catalogs([d])


if __name__ == "__main__":
    unittest.main()
