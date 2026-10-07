"""Token estimation.

This is an offline estimate (compact JSON length / ~3.5 chars per token), good
enough to compare strategies against each other. For billing-grade numbers swap
in the API's token counting endpoint: anything with the signature
`(obj) -> int` can be passed wherever a `counter` is accepted.
"""

from __future__ import annotations

import json
import math
from typing import Any, Callable

CHARS_PER_TOKEN = 3.5

Counter = Callable[[Any], int]


def estimate_tokens(obj: Any) -> int:
    text = obj if isinstance(obj, str) else json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
    return math.ceil(len(text) / CHARS_PER_TOKEN)
