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
        self.tools = [tool("do_it", server="zeta"), tool("do_it_too", server="omega")]

    def test_query_naming_the_server_surfaces_its_tool_only_when_enabled(self):
        with_server = ToolIndex(self.tools, use_server=True).search("zeta thing", k=2)
        self.assertEqual([t.name for t, _ in with_server], ["do_it", "do_it_too"])
        self.assertGreater(with_server[0][1], with_server[1][1])
        plain = ToolIndex(self.tools).search("zeta thing", k=2)
        self.assertEqual(plain[0][1], plain[1][1])  # server name ignored: a tie

    def test_tools_without_a_server_are_unaffected(self):
        bare = [tool("do_it"), tool("do_it_too")]
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
    def test_server_name_experiment_never_names_the_next_batch(self):
        code = (ROOT / "scripts" / "server_name_experiment.py").read_text().split('"""', 2)[2]
        for forbidden in ("test2", "mcp-test2"):
            self.assertNotIn(forbidden, code)


if __name__ == "__main__":
    unittest.main()
