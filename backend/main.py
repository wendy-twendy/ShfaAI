"""FastAPI API layer for the prompt-injection demo app."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.agent import preview_prompt, run_agent
from backend.config import (
    AVAILABLE_MODELS,
    DEFAULT_AGENT_MODEL,
    DEFAULT_JUDGE_MODEL,
    DEFENSE_PROMPT_ENABLED,
)
from backend.eval_runner import EvalResult, build_all_scenarios, run_all_evals
from backend.knowledge_base import get_all_documents, get_all_documents_full
from backend.models import ChatRequest, ChatResponse, PromptPreviewResponse
from backend.sanitization.layer3_classifier import AVAILABLE as L3_AVAILABLE

app = FastAPI(title="Prompt-Injection Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "http://127.0.0.1:*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.ngrok-free\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LAYER_INFO = [
    {"number": 1, "name": "Text Normalization", "description": "Unicode NFKC, strip zero-width/tag/bidi chars, homoglyph resolution"},
    {"number": 2, "name": "Heuristic Scanner", "description": "Regex patterns for injection, delimiter escape, many-shot, encoding tricks"},
    {"number": 3, "name": "ML Classifier", "description": "ONNX Llama Prompt Guard 2 — flags likely injection chunks"},
    {"number": 4, "name": "LLM Chunk Judge", "description": "LLM reviews each chunk for hidden instructions"},
    {"number": 5, "name": "Datamarking", "description": "Inserts marker chars between words so LLM can distinguish data from instructions"},
    {"number": 6, "name": "Tool Call Judge", "description": "LLM reviews proposed tool calls against user intent before execution"},
]


@app.get("/api/settings")
def get_settings() -> dict:
    layers = []
    for layer in LAYER_INFO:
        available = True
        if layer["number"] == 3:
            available = L3_AVAILABLE
        layers.append({**layer, "available": available})

    return {
        "layers": layers,
        "documents": get_all_documents(),
        "models": AVAILABLE_MODELS,
        "defaults": {
            "agent_model": DEFAULT_AGENT_MODEL,
            "judge_model": DEFAULT_JUDGE_MODEL,
            "defense_prompt_enabled": DEFENSE_PROMPT_ENABLED,
        },
    }


@app.get("/api/knowledge-base")
def get_knowledge_base() -> list[dict]:
    return get_all_documents_full()


@app.post("/api/preview-prompt")
def preview(request: ChatRequest) -> PromptPreviewResponse:
    return preview_prompt(request.query, request)


@app.post("/api/chat")
def chat(request: ChatRequest) -> ChatResponse:
    return run_agent(request.query, request)


@app.post("/api/eval")
def run_evals() -> list[dict]:
    scenarios = build_all_scenarios()
    results: list[EvalResult] = run_all_evals(scenarios)
    return [_serialize_eval_result(r) for r in results]


def _serialize_eval_result(r: EvalResult) -> dict:
    return {
        "scenario": {
            "id": r.scenario.id,
            "name": r.scenario.name,
            "query": r.scenario.query,
            "enabled_layers": r.scenario.enabled_layers,
            "active_doc_ids": r.scenario.active_doc_ids,
            "expected": asdict(r.scenario.expected),
        },
        "passed": r.passed,
        "failure_reasons": r.failure_reasons,
        "elapsed_ms": r.elapsed_ms,
        "response": r.response.model_dump(),
    }


# --- Serve built frontend (for ngrok / production deploys) ---
_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if _DIST_DIR.is_dir():
    # Serve static assets (JS, CSS, images) at /assets
    app.mount("/assets", StaticFiles(directory=_DIST_DIR / "assets"), name="assets")

    # SPA catch-all: any non-API GET returns index.html
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse(_DIST_DIR / "index.html")
