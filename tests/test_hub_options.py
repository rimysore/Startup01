import importlib.util
import unittest

from toolslim.catalog import Tool
from toolslim.index import ToolIndex, tokenize

HAS_NUMPY = importlib.util.find_spec("numpy") is not None


def tool(name, desc="does the thing", server=""):
    return Tool(name, desc, {"type": "object", "properties": {}}, server)


class TokenizerJoinTests(unittest.TestCase):
    def test_legacy_behavior_is_the_default_and_unchanged(self):
        self.assertEqual(tokenize("GitHub"), ["git", "hub"])
        self.assertEqual(tokenize("MongoDB"), ["mongo", "db"])
        self.assertEqual(tokenize("createIssue"), tokenize("create_issues"))

    def test_join_camel_adds_the_joined_form_first_and_keeps_the_parts(self):
        self.assertEqual(tokenize("GitHub", join_camel=True), ["github", "git", "hub"])
        self.assertEqual(tokenize("MongoDB", join_camel=True), ["mongodb", "mongo", "db"])
        self.assertEqual(tokenize("github", join_camel=True), ["github"])

    def test_text_without_internal_capitals_is_identical_in_both_modes(self):
        for text in ("create a new issue in the repo", "mongodb-logs", "get_app_info", "Open the NOTES (Draft) now", "sheet1 and Sheet2"):
            self.assertEqual(tokenize(text), tokenize(text, join_camel=True), text)

    def test_mixed_text(self):
        tokens = tokenize("push to GitHub and read getUserById", join_camel=True)
        for expected in ("github", "git", "hub", "getuserbyid", "get", "user", "id", "push", "read"):
            self.assertIn(_stem(expected), tokens)


def _stem(word):
    from toolslim.index import _stem as stem

    return stem(word)


class Bm25CamelJoinTests(unittest.TestCase):
    def setUp(self):
        self.tools = [tool("alpha_one", server="github"), tool("alpha_two", server="gitlab")]

    def test_brand_cased_query_matches_the_lowercase_server_name_only_with_join(self):
        # Old tokenizer: "GitHub" -> git, hub, which match nothing, so the query finds no tool at all.
        self.assertEqual(ToolIndex(self.tools, use_server=True).search("report on GitHub", k=2), [])
        # With the joined form the server name is found, and only the right server's tool matches.
        joined = ToolIndex(self.tools, use_server=True, camel_join=True).search("report on GitHub", k=2)
        self.assertEqual([t.name for t, _ in joined], ["alpha_one"])

    def test_default_index_is_unchanged(self):
        a = [(t.name, round(s, 6)) for t, s in ToolIndex(self.tools).search("thing")]
        b = [(t.name, round(s, 6)) for t, s in ToolIndex(self.tools, camel_join=False).search("thing")]
        self.assertEqual(a, b)


@unittest.skipUnless(HAS_NUMPY, "numpy not installed")
class HubnessCorrectionTests(unittest.TestCase):
    VECTORS = {"hub": (1, 1, 1), "x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1), "q": (1, 1, 0)}

    def embed(self, texts):
        import numpy as np

        return np.array([self.VECTORS[t] for t in texts], dtype=np.float32)

    def index(self, **kw):
        from toolslim.dense import DenseIndex

        tools = [tool(n) for n in ("hub", "x", "y", "z")]
        return DenseIndex(tools, self.embed, doc_text=lambda t: t.name, **kw)

    def search(self, index):
        import numpy as np

        # query vector (1,1,0): closer to the hub than to x or y, but the hub is close to everything
        index._embed = lambda texts: np.array([self.VECTORS["q"]], dtype=np.float32)
        return [t.name for t, _ in index.search("q", k=4)]

    def test_without_correction_the_hub_wins(self):
        self.assertEqual(self.search(self.index())[0], "hub")
        self.assertEqual(self.search(self.index(hub_lambda=0.0))[0], "hub")

    def test_correction_demotes_the_hub_below_the_better_specific_match(self):
        ranking = self.search(self.index(hub_lambda=1.0, hub_k=3))
        self.assertNotEqual(ranking[0], "hub")
        self.assertIn(ranking[0], ("x", "y"))
        self.assertLess(ranking.index("z"), ranking.index("hub") + 1 + 3)  # still returns every tool

    def test_degenerate_catalogs_do_not_crash(self):
        from toolslim.dense import DenseIndex

        one = DenseIndex([tool("hub")], self.embed, doc_text=lambda t: t.name, hub_lambda=1.0, hub_k=10)
        self.assertEqual(len(one.search("hub", k=1)), 1)
        big_k = self.index(hub_lambda=0.5, hub_k=100)  # k larger than the catalog
        self.assertEqual(len(big_k.search("hub", k=4)), 4)


class RecordedDecisionTests(unittest.TestCase):
    def test_library_defaults_match_the_recorded_experiment_decisions(self):
        import inspect
        import json
        from pathlib import Path

        result = json.loads((Path(__file__).resolve().parent.parent / "results" / "hub-tokenizer.json").read_text())
        index_defaults = inspect.signature(ToolIndex.__init__).parameters
        self.assertEqual(index_defaults["camel_join"].default, result["camel_join_adopted"])
        lam, b = result["hub"]["lobo"]["final_config"]
        self.assertEqual(index_defaults["b"].default, b)
        if HAS_NUMPY:
            from toolslim.dense import DenseIndex

            self.assertEqual(inspect.signature(DenseIndex.__init__).parameters["hub_lambda"].default, lam)


class LabelKitTests(unittest.TestCase):
    def test_the_blind_kit_contains_only_tool_information(self):
        import json
        import subprocess
        import sys
        import tempfile
        from pathlib import Path

        root = Path(__file__).resolve().parent.parent
        out = Path(tempfile.mkdtemp())
        subprocess.run([sys.executable, str(root / "scripts" / "make_label_kit.py"), str(out)], check=True, capture_output=True)
        files = sorted(str(p.relative_to(out)) for p in out.rglob("*") if p.is_file())
        self.assertEqual(files, ["GUIDELINES.md", "dev/tools.json", "fifth-test/tools.json", "first-test/tools.json", "second-test/tools.json", "third-test/tools.json", "validate.py"])
        counts = {b: len(json.loads((out / b / "tools.json").read_text())["tools"]) for b in ("dev", "first-test", "second-test", "third-test", "fifth-test")}
        self.assertEqual(counts, {"dev": 78, "first-test": 70, "second-test": 105, "third-test": 189, "fifth-test": 213})
        everything = "".join(p.read_text() for p in out.rglob("*") if p.is_file()).lower()
        for forbidden in ("toolslim", "bm25", "hybrid-rrf", "mcp-test", "mcp-reference", "recall@", "leave-one", "lazy gateway", "search_tools"):
            self.assertNotIn(forbidden, everything)
        # the third batch uses the namespaced names for the colliding add_table tools
        names = {t["name"] for t in json.loads((out / "third-test" / "tools.json").read_text())["tools"]}
        self.assertIn("word__add_table", names)
        self.assertNotIn("add_table", names)

    def test_the_validator_is_standalone_and_catches_problems(self):
        import json
        import subprocess
        import sys
        import tempfile
        from pathlib import Path

        root = Path(__file__).resolve().parent.parent
        out = Path(tempfile.mkdtemp())
        subprocess.run([sys.executable, str(root / "scripts" / "make_label_kit.py"), str(out)], check=True, capture_output=True)
        tools = {"tools": [{"name": "a"}, {"name": "b"}]}
        (out / "t.json").write_text(json.dumps(tools))
        good = [{"query": "q1", "expected": ["a"], "style": "user"}, {"query": "q2", "expected": ["a"], "style": "agent"},
                {"query": "q3", "expected": ["b", "a"], "style": "user"}, {"query": "q4", "expected": ["b"], "style": "agent"}]
        (out / "good.jsonl").write_text("\n".join(map(json.dumps, good)))
        bad = good[:3] + [{"query": "q1", "expected": ["zzz"], "style": "agent"}]
        (out / "bad.jsonl").write_text("\n".join(map(json.dumps, bad)))
        run = lambda f: subprocess.run([sys.executable, str(out / "validate.py"), str(out / "t.json"), str(out / f)], capture_output=True, text=True)
        self.assertEqual(run("good.jsonl").returncode, 0)
        r = run("bad.jsonl")
        self.assertEqual(r.returncode, 1)
        for fragment in ("unknown tool", "duplicate query", "not the first expected tool of any agent query"):
            self.assertIn(fragment, r.stdout)


if __name__ == "__main__":
    unittest.main()
