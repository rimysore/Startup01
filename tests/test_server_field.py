import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from toolslim.catalog import Tool, load_catalog, load_catalogs
from toolslim.fixtures import synthetic_catalog
from toolslim.index import ToolIndex
from toolslim.slim import slim_tool

ROOT = Path(__file__).resolve().parent.parent
HAS_NUMPY = importlib.util.find_spec("numpy") is not None


def tool(name, desc="does the thing", server=""):
    return Tool(name, desc, {"type": "object", "properties": {}}, server)


class ServerFieldTests(unittest.TestCase):
    def test_server_defaults_to_empty_and_is_not_part_of_the_api_definition(self):
        t = Tool("a", "d", {"type": "object"})
        self.assertEqual(t.server, "")
        self.assertEqual(set(tool("a", server="notion").to_api()), {"name", "description", "input_schema"})

    def test_catalog_files_with_provenance_set_the_server_and_plain_lists_do_not(self):
        tools = load_catalogs([ROOT / "catalogs" / "test"])
        self.assertEqual({t.server for t in tools if t.name.startswith("API-")}, {"notion"})
        self.assertEqual({t.server for t in tools if t.name.startswith("browser_")}, {"playwright"})
        self.assertTrue(all(t.server for t in tools))
        plain = Path(tempfile.mkdtemp()) / "plain.json"
        plain.write_text(json.dumps([{"name": "x", "input_schema": {"type": "object"}}]))
        self.assertEqual(load_catalog(plain)[0].server, "")

    def test_slimming_keeps_the_server(self):
        for level in range(4):
            self.assertEqual(slim_tool(tool("a", server="git"), level).server, "git")

    def test_synthetic_servers_are_their_service_prefix(self):
        for t in synthetic_catalog():
            self.assertEqual(t.server, t.name.split("_")[0])

    def test_every_committed_dev_catalog_tool_has_a_server(self):
        for d in ("catalogs", "catalogs/test", "catalogs/test2"):
            self.assertTrue(all(t.server for t in load_catalogs([ROOT / d])), d)


class ServerInBm25Tests(unittest.TestCase):
    def setUp(self):
        self.tools = [tool("alpha_one", server="zeta"), tool("alpha_two", server="omega")]  # equal-length names: no length-normalization difference

    def test_query_naming_the_server_surfaces_its_tool_only_when_enabled(self):
        with_server = ToolIndex(self.tools, use_server=True).search("zeta thing", k=2)
        self.assertEqual([t.name for t, _ in with_server], ["alpha_one", "alpha_two"])
        self.assertGreater(with_server[0][1], with_server[1][1])
        plain = ToolIndex(self.tools).search("zeta thing", k=2)
        self.assertEqual(plain[0][1], plain[1][1])  # server name ignored: a tie

    def test_tools_without_a_server_are_unaffected(self):
        bare = [tool("alpha_one"), tool("alpha_two")]
        self.assertEqual(
            [(t.name, round(s, 6)) for t, s in ToolIndex(bare, use_server=True).search("thing")],
            [(t.name, round(s, 6)) for t, s in ToolIndex(bare).search("thing")],
        )


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class ServerInDenseTextTests(unittest.TestCase):
    def test_text_with_server_prefixes_and_normalizes(self):
        from toolslim.dense import text_name_desc, text_with_server

        t = tool("get_x", "Gets x.", server="google-maps")
        self.assertEqual(text_with_server(t), "google maps get x. Gets x.")
        bare = tool("get_x", "Gets x.")
        self.assertEqual(text_with_server(bare), text_name_desc(bare))


class ExperimentScriptIsolationTests(unittest.TestCase):
    def test_experiment_scripts_never_name_the_next_batch(self):
        for script in ("server_name_experiment.py", "server_name_analysis.py"):
            code = (ROOT / "scripts" / script).read_text().split('"""', 2)[2]
            for forbidden in ("test2", "mcp-test2"):
                self.assertNotIn(forbidden, code, script)


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class MentionsServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import sys

        sys.path.insert(0, str(ROOT / "scripts"))
        from server_name_analysis import mentions_server

        cls.mentions = staticmethod(mentions_server)

    def test_brand_spellings_and_separators(self):
        self.assertTrue(self.mentions("close issue 42 on GitHub", "github"))
        self.assertTrue(self.mentions("look up this place on Google Maps", "google-maps"))
        self.assertTrue(self.mentions("search my slack messages", "slack"))

    def test_non_mentions(self):
        self.assertFalse(self.mentions("find the page called Q3 roadmap", "notion"))
        self.assertFalse(self.mentions("show me the pull requests", "github"))


class ScoringScriptTests(unittest.TestCase):
    def test_score_script_defaults_to_the_next_batch_and_declares_its_protocol(self):
        code = (ROOT / "scripts" / "score_test2.py").read_text()
        self.assertIn('"catalogs" / "test2"', code)
        self.assertIn('"mcp-test2.jsonl"', code)
        for phrase in ("Headline", "Declared second", "Context only", "Not allowed"):
            self.assertIn(phrase, code)


class RecordedResultsTests(unittest.TestCase):
    def test_test2_headline_was_the_default_at_the_time_and_protocol_was_followed(self):
        # `dense` was the recorded default when test2 was scored (round 1); the default has since moved
        # (round 2), so this is deliberately not compared with the current DEFAULT_RETRIEVER.
        round_1 = json.loads((ROOT / "results" / "dev-selection.json").read_text())["chosen"]
        result = json.loads((ROOT / "results" / "test2-score.json").read_text())
        self.assertEqual(result["headline"]["retriever"], round_1)
        self.assertEqual(result["sizes"], {"tools": 105, "user": 105, "agent": 105})
        self.assertEqual(result["declared_comparison"]["variant"], "dense+server")


class Test3ScoringScriptTests(unittest.TestCase):
    def test_score_test3_defaults_to_the_confirmation_batch_and_declares_its_protocol(self):
        code = (ROOT / "scripts" / "score_test3.py").read_text()
        self.assertIn('"catalogs" / "test3"', code)
        self.assertIn('"mcp-test3.jsonl"', code)
        self.assertIn('default="namespace"', code)  # add_table collides between Word and PowerPoint
        for phrase in ("Headline", "Declared comparisons", "Context only", "Reading of the result", "CONFIRMED", "Not allowed"):
            self.assertIn(phrase, code)

    def test_the_headline_is_the_current_default(self):
        from toolslim.config import DEFAULT_RETRIEVER

        code = (ROOT / "scripts" / "score_test3.py").read_text()
        self.assertIn(f'HEADLINE = "{DEFAULT_RETRIEVER}"', code)

    def test_recorded_test3_result_is_consistent_with_the_declared_reading(self):
        result = json.loads((ROOT / "results" / "test3-score.json").read_text())
        self.assertEqual(result["headline"]["retriever"], "hybrid-rrf+server")
        self.assertEqual(result["sizes"], {"tools": 189, "user": 189, "agent": 189})
        reading = result["declared_reading"]
        self.assertEqual(reading["confirmed"], reading["c1_all_clears_2se"] and reading["headline_agent_within_1pt_of_best"])
        # the paired comparison named in the protocol: the headline against dense and against hybrid-rrf
        self.assertEqual({c["base"] for c in result["comparisons"].values()}, {"dense", "hybrid-rrf"})


class KnownTokenizerLimitationTests(unittest.TestCase):
    @unittest.expectedFailure
    def test_camel_case_brand_names_should_match_their_lowercase_form(self):
        """Known limitation: the BM25 tokenizer splits "GitHub" into git+hub, so it never matches the
        lowercase token "github" in tool or server names (same for MongoDB, DynamoDB, PostgreSQL).
        This test is expected to fail until that is fixed; it will then report an unexpected success."""
        from toolslim.index import tokenize

        self.assertEqual(tokenize("GitHub"), tokenize("github"))


if __name__ == "__main__":
    unittest.main()
