import json
import unittest

from toolslim.fixtures import synthetic_catalog, synthetic_queries
from toolslim.gateway import LazyToolGateway, signature
from toolslim.index import ToolIndex, tokenize


class IndexTests(unittest.TestCase):
    def test_tokenize_handles_snake_camel_and_plurals(self):
        self.assertEqual(tokenize("createIssue"), tokenize("create_issues"))

    def test_search_prefers_name_match(self):
        index = ToolIndex(synthetic_catalog())
        top = index.search("create issue", k=1)[0][0]
        self.assertEqual(top.name, "github_create_issue")

    def test_no_match_returns_empty(self):
        self.assertEqual(ToolIndex(synthetic_catalog()).search("zzzz qqqq"), [])

    def test_retrieval_baseline_on_synthetic_set(self):
        # Measured baseline for lexical BM25 on deliberately paraphrased
        # queries is 50% recall@5. This floor only catches regressions; raising
        # it is the point of the next iteration (see README, "Known weakness").
        index = ToolIndex(synthetic_catalog())
        queries = synthetic_queries()
        hits = sum(want in [t.name for t, _ in index.search(q, k=5)] for q, want in queries)
        self.assertGreaterEqual(hits / len(queries), 0.45)


class GatewayTests(unittest.TestCase):
    def setUp(self):
        self.calls = []
        self.gw = LazyToolGateway(
            synthetic_catalog(),
            handlers={"stripe_get_balance": lambda: {"usd": 1200}, "slack_post_message": lambda channel, text, thread_ts=None: self.calls.append((channel, text)) or "ok"},
        )

    def test_definitions_are_three_meta_tools_and_stable(self):
        defs = self.gw.tool_definitions()
        self.assertEqual([d["name"] for d in defs], ["search_tools", "describe_tool", "call_tool"])
        self.assertEqual(json.dumps(defs), json.dumps(self.gw.tool_definitions()))

    def test_signature_marks_required_and_enums(self):
        tool = next(t for t in synthetic_catalog() if t.name == "github_merge_pull_request")
        sig = signature(tool)
        self.assertIn("pull_number*:int", sig)
        self.assertIn("merge_method:merge|squash|rebase", sig)

    def test_search_returns_signatures(self):
        out = self.gw.handle("search_tools", {"query": "post a message to slack"})
        self.assertIn("slack_post_message(channel*:str, text*:str", out)

    def test_describe_returns_slim_json(self):
        out = json.loads(self.gw.handle("describe_tool", {"name": "stripe_get_balance"}))
        self.assertEqual(out["name"], "stripe_get_balance")
        self.assertNotIn("title", out["input_schema"])

    def test_call_dispatches_and_serializes(self):
        self.assertEqual(self.gw.handle("call_tool", {"name": "stripe_get_balance"}), '{"usd":1200}')
        self.gw.handle("call_tool", {"name": "slack_post_message", "arguments": {"channel": "#a", "text": "hi"}})
        self.assertEqual(self.calls, [("#a", "hi")])

    def test_call_reports_missing_required_with_signature(self):
        out = self.gw.handle("call_tool", {"name": "slack_post_message", "arguments": {"channel": "#a"}})
        self.assertIn("missing required argument(s) for slack_post_message: text", out)
        self.assertIn("slack_post_message(", out)

    def test_unknown_tool_suggests_near_matches(self):
        out = self.gw.handle("call_tool", {"name": "slack_post", "arguments": {}})
        self.assertIn("slack_post_message", out)

    def test_handler_exception_becomes_error_text(self):
        gw = LazyToolGateway(synthetic_catalog(), handlers={"stripe_get_balance": lambda: 1 / 0})
        self.assertIn("ZeroDivisionError", gw.handle("call_tool", {"name": "stripe_get_balance"}))

    def test_pinned_tool_is_exposed_and_directly_callable(self):
        gw = LazyToolGateway(synthetic_catalog(), handlers={"stripe_get_balance": lambda: "5"}, pinned=("stripe_get_balance",))
        self.assertEqual(len(gw.tool_definitions()), 4)
        self.assertEqual(gw.handle("stripe_get_balance", {}), "5")


if __name__ == "__main__":
    unittest.main()
