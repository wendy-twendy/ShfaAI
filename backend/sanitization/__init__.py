from __future__ import annotations

from typing import Any

from backend.models import LayerResult, SecurityEvent


def run_pipeline(
    chunks: list[str],
    enabled_layers: list[int],
    llm_client: Any = None,
    l4_client: Any = None,
    initial_categories: list[str] | None = None,
) -> tuple[list[str], list[LayerResult], list[SecurityEvent]]:
    """Chain enabled sanitization layers sequentially (L1 → L2 → L3 → L4 → L5).

    Returns:
        (surviving_chunks, per_layer_trace, all_security_events)
    """
    current_chunks = list(chunks)
    current_categories = list(initial_categories) if initial_categories else ["clean"] * len(chunks)
    trace: list[LayerResult] = []
    all_events: list[SecurityEvent] = []

    layer_modules = {
        1: "backend.sanitization.layer1_normalize",
        2: "backend.sanitization.layer2_heuristic",
        3: "backend.sanitization.layer3_classifier",
        4: "backend.sanitization.layer4_llm_judge",
        5: "backend.sanitization.layer5_datamarking",
    }

    for layer_num in sorted(enabled_layers):
        if layer_num not in layer_modules:
            continue

        import importlib
        mod = importlib.import_module(layer_modules[layer_num])

        if layer_num == 4:
            result: LayerResult = mod.run(current_chunks, llm_client=l4_client or llm_client)
        else:
            result = mod.run(current_chunks)

        result.layer_number = layer_num
        result.chunk_categories = list(current_categories)

        # Annotate chunk_dropped security events with chunk_category
        for evt in result.security_events:
            if evt.event_type == "chunk_dropped" and "chunk_preview" in evt.details:
                preview = evt.details["chunk_preview"]
                for ci, chunk in enumerate(current_chunks):
                    if chunk[:120] == preview[:120] and ci < len(current_categories):
                        evt.details["chunk_category"] = current_categories[ci]
                        break

        trace.append(result)
        all_events.extend(result.security_events)

        # Update categories to match surviving chunks (dropping layers don't transform content)
        if len(result.chunks_out) < len(current_chunks):
            surviving_categories = []
            for ci, chunk in enumerate(current_chunks):
                if chunk in result.chunks_out and ci < len(current_categories):
                    surviving_categories.append(current_categories[ci])
            current_categories = surviving_categories
        current_chunks = result.chunks_out

    return current_chunks, trace, all_events
