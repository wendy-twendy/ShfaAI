"""Interactive CLI chat for the Legal/HR document assistant."""

from __future__ import annotations

import sys
import time

from backend.agent import run_agent
from backend.knowledge_base import get_all_documents
from backend.models import ChatRequest, ChatResponse


LAYER_NAMES = {
    1: "Text Normalization",
    2: "Heuristic Scanner",
    3: "ML Classifier",
    4: "LLM Chunk Judge",
    5: "Datamarking",
    6: "Tool Call Judge",
}


def _print_banner(settings: ChatRequest) -> None:
    print("\n╔══════════════════════════════════════════════════╗")
    print("║   Meridian Legal Group — Document Assistant CLI  ║")
    print("╚══════════════════════════════════════════════════╝")
    print()
    _print_settings(settings)
    print("Commands: quit | layers | docs | retrieval | help")
    print("─" * 52)


def _print_settings(settings: ChatRequest) -> None:
    enabled = settings.enabled_layers
    layer_str = ", ".join(
        f"L{n}" for n in sorted(LAYER_NAMES) if n in enabled
    ) or "(none)"
    print(f"  Layers:    {layer_str}")
    print(f"  Docs:      {len(settings.active_doc_ids)} active")
    print(f"  Retrieval: {settings.retrieval_mode}")
    print()


def _print_response(resp: ChatResponse, elapsed: float) -> None:
    # Answer
    print(f"\n{'─' * 52}")
    print("ANSWER:")
    print(resp.answer)

    # Tool calls
    if resp.tool_calls:
        print(f"\n{'─' * 30}")
        print("TOOL CALLS:")
        for tc in resp.tool_calls:
            status_icon = "✓ ALLOWED" if tc.status == "allowed" else "✗ BLOCKED"
            print(f"  [{status_icon}] {tc.name}({tc.arguments})")
            if tc.judge_reason:
                print(f"           Reason: {tc.judge_reason}")

    # Security events
    if resp.security_events:
        print(f"\n{'─' * 30}")
        print(f"SECURITY EVENTS ({len(resp.security_events)}):")
        for ev in resp.security_events:
            detail_summary = ", ".join(
                f"{k}={v}" for k, v in ev.details.items()
                if k not in ("chunk_preview",)
            )
            print(f"  [{ev.layer}] {ev.event_type}: {detail_summary}")

    # Pipeline trace
    if resp.pipeline_trace:
        print(f"\n{'─' * 30}")
        print("PIPELINE TRACE:")
        for i, layer_result in enumerate(resp.pipeline_trace):
            cin = len(layer_result.chunks_in)
            cout = len(layer_result.chunks_out)
            flagged = len(layer_result.flagged)
            ms = layer_result.execution_time_ms
            dropped = cin - cout
            flag_info = f", flagged={flagged}" if flagged else ""
            drop_info = f", dropped={dropped}" if dropped else ""
            print(f"  Layer {i+1}: {cin} in → {cout} out{flag_info}{drop_info} ({ms:.0f}ms)")

    print(f"\n({elapsed:.1f}s)")
    print("─" * 52)


def _toggle_layers(settings: ChatRequest) -> None:
    enabled = set(settings.enabled_layers)
    print("\nLayers (toggle by number, 'all', or 'none'):")
    for n, name in sorted(LAYER_NAMES.items()):
        status = "ON" if n in enabled else "OFF"
        print(f"  {n}. {name} [{status}]")
    choice = input("Toggle> ").strip().lower()
    if choice == "all":
        settings.enabled_layers = list(LAYER_NAMES.keys())
    elif choice == "none":
        settings.enabled_layers = []
    else:
        for ch in choice.replace(",", " ").split():
            try:
                n = int(ch)
                if n in LAYER_NAMES:
                    if n in enabled:
                        enabled.discard(n)
                    else:
                        enabled.add(n)
            except ValueError:
                pass
        settings.enabled_layers = sorted(enabled)
    _print_settings(settings)


def _toggle_docs(settings: ChatRequest) -> None:
    all_docs = get_all_documents()
    active = set(settings.active_doc_ids)
    print("\nDocuments (toggle by number, 'all', 'clean', 'poisoned', or 'none'):")
    for i, doc in enumerate(all_docs, 1):
        status = "ON" if doc["id"] in active else "OFF"
        tag = f" [{doc['attack_type']}]" if doc["attack_type"] else ""
        print(f"  {i}. {doc['title']}{tag} [{status}]")
    choice = input("Toggle> ").strip().lower()
    if choice == "all":
        settings.active_doc_ids = [d["id"] for d in all_docs]
    elif choice == "clean":
        settings.active_doc_ids = [d["id"] for d in all_docs if d["category"] == "clean"]
    elif choice == "poisoned":
        settings.active_doc_ids = [d["id"] for d in all_docs if d["category"] == "poisoned"]
    elif choice == "none":
        settings.active_doc_ids = []
    else:
        for ch in choice.replace(",", " ").split():
            try:
                idx = int(ch) - 1
                if 0 <= idx < len(all_docs):
                    doc_id = all_docs[idx]["id"]
                    if doc_id in active:
                        active.discard(doc_id)
                    else:
                        active.add(doc_id)
            except ValueError:
                pass
        settings.active_doc_ids = [d["id"] for d in all_docs if d["id"] in active]
    print(f"  Active: {len(settings.active_doc_ids)} docs")


def _toggle_retrieval(settings: ChatRequest) -> None:
    current = settings.retrieval_mode
    new = "all" if current == "topk" else "topk"
    settings.retrieval_mode = new
    print(f"  Retrieval mode: {new}")


def main() -> None:
    all_doc_ids = [d["id"] for d in get_all_documents()]
    settings = ChatRequest(
        query="",
        enabled_layers=[1, 2, 3, 4, 5, 6],
        active_doc_ids=all_doc_ids,
        retrieval_mode="topk",
    )

    _print_banner(settings)

    while True:
        try:
            user_input = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break

        if not user_input:
            continue

        cmd = user_input.lower()
        if cmd in ("quit", "exit", "q"):
            print("Bye!")
            break
        elif cmd == "layers":
            _toggle_layers(settings)
            continue
        elif cmd == "docs":
            _toggle_docs(settings)
            continue
        elif cmd == "retrieval":
            _toggle_retrieval(settings)
            continue
        elif cmd == "help":
            print("Commands: quit | layers | docs | retrieval | help")
            print("Anything else is sent as a query to the agent.")
            continue
        elif cmd == "settings":
            _print_settings(settings)
            continue

        # Run agent
        settings.query = user_input
        start = time.time()
        try:
            resp = run_agent(user_input, settings)
        except Exception as e:
            print(f"\nError: {e}")
            continue
        elapsed = time.time() - start

        _print_response(resp, elapsed)


if __name__ == "__main__":
    main()
