from __future__ import annotations

import time

from backend.models import LayerResult

DATAMARK_CHAR = "\uE000"  # Unicode Private Use Area


def datamark(text: str) -> str:
    """Insert datamark character between every word."""
    return DATAMARK_CHAR.join(text.split())


def run(chunks: list[str]) -> LayerResult:
    """Layer 5: Datamarking. Transforms but never drops chunks."""
    start = time.perf_counter()
    chunks_out = [datamark(chunk) for chunk in chunks]
    elapsed_ms = (time.perf_counter() - start) * 1000

    return LayerResult(
        chunks_in=chunks,
        chunks_out=chunks_out,
        flagged=[],
        security_events=[],
        execution_time_ms=elapsed_ms,
    )
