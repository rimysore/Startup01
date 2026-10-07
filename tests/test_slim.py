import unittest

from toolslim.catalog import Tool
from toolslim.fixtures import synthetic_catalog
from toolslim.slim import first_sentence, slim_tool
from toolslim.tokens import estimate_tokens

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


if __name__ == "__main__":
    unittest.main()
