import copy
import unittest
from pathlib import Path
from urllib.parse import unquote

from toolslim.catalog import Tool, load_catalogs
from toolslim.fixtures import synthetic_catalog
from toolslim.slim import first_sentence, prune_unused_defs, slim_tool
from toolslim.tokens import estimate_tokens

ROOT = Path(__file__).resolve().parent.parent

SCHEMA = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Args",
    "type": "object",
    "additionalProperties": False,
    "properties": {
        # A property *named* like a schema keyword must survive.
        "title": {"title": "Title", "type": "string", "description": "The title. Extra detail follows here."},
        "mode": {"type": "string", "enum": ["a", "b"], "default": "a", "description": "Mode"},
        "meta": {"type": "object", "default": {"title": "keep me"}},
    },
    "required": ["title"],
}


class SlimTests(unittest.TestCase):
    def tool(self):
        return Tool("t", "Does a thing. More detail that is dropped at level 2.", SCHEMA)

    def test_level0_is_identity(self):
        t = self.tool()
        self.assertIs(slim_tool(t, 0), t)

    def test_level1_removes_noise_but_keeps_property_named_title(self):
        s = slim_tool(self.tool(), 1).input_schema
        self.assertNotIn("$schema", s)
        self.assertNotIn("title", s)  # schema-level title keyword
        self.assertNotIn("additionalProperties", s)
        self.assertIn("title", s["properties"])  # property name
        self.assertNotIn("title", s["properties"]["title"])  # its title keyword
        self.assertEqual(s["required"], ["title"])
        self.assertEqual(s["properties"]["mode"]["enum"], ["a", "b"])

    def test_default_values_are_never_rewritten(self):
        s = slim_tool(self.tool(), 3).input_schema
        self.assertEqual(s["properties"]["meta"]["default"], {"title": "keep me"})

    def test_level2_truncates_descriptions(self):
        t = slim_tool(self.tool(), 2)
        self.assertEqual(t.description, "Does a thing.")
        self.assertEqual(t.input_schema["properties"]["title"]["description"], "The title.")

    def test_level3_drops_param_descriptions_keeps_tool_description(self):
        t = slim_tool(self.tool(), 3)
        self.assertTrue(t.description)
        self.assertNotIn("description", t.input_schema["properties"]["title"])

    def test_input_not_mutated(self):
        before = repr(SCHEMA)
        slim_tool(self.tool(), 3)
        self.assertEqual(repr(SCHEMA), before)

    def test_tokens_decrease_monotonically_on_catalog(self):
        tools = synthetic_catalog()
        counts = [estimate_tokens([slim_tool(t, lvl).to_api() for t in tools]) for lvl in range(4)]
        self.assertEqual(counts, sorted(counts, reverse=True))
        self.assertLess(counts[3], counts[0])

    def test_first_sentence_limit(self):
        self.assertEqual(first_sentence("one two three four five", 10), "one two...")


def _follow(root, ref):
    node = root
    for part in ref[2:].split("/"):
        node = node[unquote(part).replace("~1", "/").replace("~0", "~")]
    return node


def resolve(node, root, stack=(), top=False):
    """Inline every `#/...` $ref (cycles become a marker); drop root def containers.

    Two schemas that resolve to the same structure accept exactly the same inputs.
    """
    if isinstance(node, list):
        return [resolve(n, root, stack) for n in node]
    if not isinstance(node, dict):
        return node
    ref = node.get("$ref")
    if isinstance(ref, str) and ref.startswith("#/"):
        if ref in stack:
            return {"$cycle": ref}
        siblings = {k: resolve(v, root, stack) for k, v in node.items() if k != "$ref"}
        return {**resolve(_follow(root, ref), root, stack + (ref,)), **siblings}
    return {k: resolve(v, root, stack) for k, v in node.items() if not (top and k in ("$defs", "definitions"))}


def schema(properties, **containers):
    return {"type": "object", "properties": properties, **containers}


def ref(name, container="$defs"):
    return {"$ref": f"#/{container}/{name}"}


class PruneDefsTests(unittest.TestCase):
    def test_removes_unreferenced_keeps_referenced_and_drops_empty_container(self):
        s = schema({"a": ref("Used")}, **{"$defs": {"Used": {"type": "string"}, "Unused": {"type": "integer"}}})
        self.assertEqual(prune_unused_defs(s)["$defs"], {"Used": {"type": "string"}})
        none_used = schema({"a": {"type": "string"}}, **{"$defs": {"Unused": {"type": "integer"}}})
        self.assertNotIn("$defs", prune_unused_defs(none_used))

    def test_transitive_references_are_kept(self):
        defs = {"A": {"properties": {"b": ref("B")}}, "B": {"properties": {"c": ref("C")}}, "C": {"type": "string"}, "D": {"type": "null"}}
        out = prune_unused_defs(schema({"x": ref("A")}, **{"$defs": defs}))
        self.assertEqual(set(out["$defs"]), {"A", "B", "C"})

    def test_cycles_terminate_and_unreachable_cycles_are_pruned(self):
        defs = {"Node": {"properties": {"next": ref("Node")}}, "Orphan": {"properties": {"self": ref("Orphan")}}}
        out = prune_unused_defs(schema({"head": ref("Node")}, **{"$defs": defs}))
        self.assertEqual(set(out["$defs"]), {"Node"})

    def test_both_containers_and_mixed_refs(self):
        s = schema(
            {"a": ref("X", "definitions"), "b": ref("Y")},
            **{"definitions": {"X": {"type": "string"}, "Z": {}}, "$defs": {"Y": {"type": "integer"}, "W": {}}},
        )
        out = prune_unused_defs(s)
        self.assertEqual(set(out["definitions"]), {"X"})
        self.assertEqual(set(out["$defs"]), {"Y"})

    def test_pointer_into_a_definition_keeps_that_definition(self):
        s = schema({"a": {"$ref": "#/$defs/A/properties/x"}}, **{"$defs": {"A": {"properties": {"x": {"type": "string"}}}, "B": {}}})
        self.assertEqual(set(prune_unused_defs(s)["$defs"]), {"A"})

    def test_escaped_and_percent_encoded_names(self):
        s = schema({"a": {"$ref": "#/$defs/a~1b"}, "c": {"$ref": "#/$defs/sp%20ace"}}, **{"$defs": {"a/b": {}, "sp ace": {}, "gone": {}}})
        self.assertEqual(set(prune_unused_defs(s)["$defs"]), {"a/b", "sp ace"})

    def test_backs_off_when_references_cannot_be_resolved_safely(self):
        defs = {"A": {"type": "string"}, "B": {"type": "integer"}}
        for body in (
            {"a": ref("A"), "$anchor": "root"},
            {"a": {"$dynamicRef": "#node"}},
            {"a": {"$ref": "#/$defs"}},  # points at the container itself
            {"$id": "https://example.com/s", "a": ref("A")},
        ):
            s = {"type": "object", "properties": body.get("a") and {"a": body["a"]} or {}, **{k: v for k, v in body.items() if k != "a"}, "$defs": defs}
            self.assertIs(prune_unused_defs(s), s, body)

    def test_backs_off_when_a_kept_definition_uses_an_unresolvable_mechanism(self):
        s = schema({"a": ref("A")}, **{"$defs": {"A": {"$dynamicRef": "#x"}, "B": {}}})
        self.assertIs(prune_unused_defs(s), s)

    def test_dangling_ref_does_not_crash(self):
        s = schema({"a": ref("Missing")}, **{"$defs": {"Other": {}}})
        self.assertNotIn("$defs", prune_unused_defs(s))

    def test_property_named_defs_is_not_a_container(self):
        s = schema({"$defs": {"type": "string"}, "a": ref("Used")}, **{"$defs": {"Used": {"type": "integer"}, "Unused": {}}})
        out = prune_unused_defs(s)
        self.assertEqual(out["properties"]["$defs"], {"type": "string"})
        self.assertEqual(set(out["$defs"]), {"Used"})

    def test_root_recursion_ref_is_fine(self):
        s = schema({"child": {"$ref": "#"}}, **{"$defs": {"Unused": {}}})
        self.assertNotIn("$defs", prune_unused_defs(s))

    def test_idempotent_and_does_not_mutate(self):
        s = schema({"a": ref("Used")}, **{"$defs": {"Used": {"type": "string"}, "Unused": {}}})
        before = copy.deepcopy(s)
        once = prune_unused_defs(s)
        self.assertEqual(s, before)
        self.assertEqual(prune_unused_defs(once), once)

    def test_schema_without_defs_is_returned_as_is(self):
        s = schema({"a": {"type": "string"}})
        self.assertIs(prune_unused_defs(s), s)

    def test_slim_tool_prunes_from_level_1_but_not_level_0(self):
        t = Tool("t", "d", schema({"a": ref("Used")}, **{"$defs": {"Used": {"type": "string"}, "Unused": {"type": "integer"}}}))
        self.assertIn("Unused", slim_tool(t, 0).input_schema["$defs"])
        for level in (1, 2, 3):
            self.assertEqual(set(slim_tool(t, level).input_schema["$defs"]), {"Used"})

    def test_pruning_is_semantically_lossless_on_every_committed_real_tool(self):
        tools = load_catalogs([ROOT / "catalogs"]) + load_catalogs([ROOT / "catalogs" / "test"])
        self.assertGreater(len(tools), 140)
        pruned_any = 0
        for t in tools:
            out = prune_unused_defs(t.input_schema)
            pruned_any += out is not t.input_schema
            self.assertEqual(
                resolve(t.input_schema, t.input_schema, top=True),
                resolve(out, out, top=True),
                f"pruning changed the meaning of {t.name}",
            )
        self.assertGreater(pruned_any, 0, "expected the Notion tools to be pruned")

    def test_real_world_savings_on_notion(self):
        notion = [t for t in load_catalogs([ROOT / "catalogs" / "test"]) if t.name.startswith("API-")]
        self.assertGreater(len(notion), 20)
        before = estimate_tokens([t.to_api() for t in notion])
        after = estimate_tokens([slim_tool(t, 1).to_api() for t in notion])
        self.assertLess(after, before * 0.5)  # measured: ~ -71% at level 1 (pruning plus noise removal)


if __name__ == "__main__":
    unittest.main()
