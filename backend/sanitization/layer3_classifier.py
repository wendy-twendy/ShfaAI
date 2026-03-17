from __future__ import annotations

import threading
import time
from typing import Any

import numpy as np

from backend.models import LayerResult, SecurityEvent

# Threshold for dropping a chunk (per-segment score)
SCORE_THRESHOLD = 0.8

# Minimum segment length to classify (skip short headers/metadata to avoid FPs)
MIN_SEGMENT_LEN = 80

# Graceful import — if onnxruntime or transformers not installed, layer is unavailable
AVAILABLE = False
_session: Any = None
_tokenizer: Any = None
_lock = threading.Lock()

try:
    import onnxruntime as ort
    from transformers import AutoTokenizer

    AVAILABLE = True
except ImportError:
    pass

MODEL_ID = "protectai/deberta-v3-base-prompt-injection-v2"
ONNX_FILENAME = "model.onnx"
ONNX_SUBFOLDER = "onnx"

# Label mapping — ProtectAI uses INJECTION/SAFE (id2label: 0=SAFE, 1=INJECTION)
ID2LABEL = {0: "SAFE", 1: "INJECTION"}
MALICIOUS_LABEL = "INJECTION"


def _softmax(logits: np.ndarray) -> np.ndarray:
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    return exp / np.sum(exp, axis=-1, keepdims=True)


def _load_model() -> tuple[Any, Any]:
    """Lazy-load the ONNX session and tokenizer on first use (thread-safe)."""
    global _session, _tokenizer
    if _session is not None and _tokenizer is not None:
        return _session, _tokenizer
    with _lock:
        if _session is None and AVAILABLE:
            from huggingface_hub import hf_hub_download

            model_path = hf_hub_download(
                repo_id=MODEL_ID,
                filename=ONNX_FILENAME,
                subfolder=ONNX_SUBFOLDER,
            )
            _session = ort.InferenceSession(
                model_path, providers=["CPUExecutionProvider"]
            )
            _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    return _session, _tokenizer


def _classify(session: Any, tokenizer: Any, text: str) -> tuple[str, float]:
    """Classify a single text segment. Returns (label, score)."""
    inputs = tokenizer(text, return_tensors="np", truncation=True, max_length=512)
    expected = {inp.name for inp in session.get_inputs()}
    ort_inputs = {k: v for k, v in inputs.items() if k in expected}
    logits = session.run(None, ort_inputs)[0]
    probs = _softmax(logits)[0]
    predicted_id = int(np.argmax(probs))
    return ID2LABEL[predicted_id], float(probs[predicted_id])


def _split_segments(text: str) -> list[str]:
    """Split a chunk into paragraph-level segments for classification.

    Full-document classification misses embedded attacks because the attack payload
    is diluted by surrounding legitimate text. Paragraph-level splitting isolates
    the malicious segment so the classifier can detect it.
    """
    segments = []
    for para in text.split("\n\n"):
        para = para.strip()
        if len(para) >= MIN_SEGMENT_LEN:
            segments.append(para)
    # If no paragraphs found (single block), split on newlines
    if not segments:
        for line in text.split("\n"):
            line = line.strip()
            if len(line) >= MIN_SEGMENT_LEN:
                segments.append(line)
    return segments if segments else [text]


def run(chunks: list[str]) -> LayerResult:
    """Layer 3: ML classifier. Splits chunks into segments, drops if any segment is malicious."""
    start = time.perf_counter()

    if not AVAILABLE:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return LayerResult(
            chunks_in=chunks,
            chunks_out=chunks,
            flagged=[],
            security_events=[],
            execution_time_ms=elapsed_ms,
        )

    session, tokenizer = _load_model()
    chunks_out: list[str] = []
    flagged: list[str] = []
    security_events: list[SecurityEvent] = []

    for chunk in chunks:
        segments = _split_segments(chunk)
        chunk_flagged = False

        for segment in segments:
            label, score = _classify(session, tokenizer, segment)

            if label == MALICIOUS_LABEL and score >= SCORE_THRESHOLD:
                chunk_flagged = True
                flagged.append(chunk)
                security_events.append(SecurityEvent(
                    event_type="chunk_dropped",
                    layer="classifier",
                    details={
                        "chunk_preview": chunk[:200],
                        "segment_preview": segment[:200],
                        "confidence": round(score, 4),
                        "action_taken": "dropped",
                    },
                ))
                break  # One flagged segment is enough to drop the chunk

        if not chunk_flagged:
            chunks_out.append(chunk)

    elapsed_ms = (time.perf_counter() - start) * 1000

    return LayerResult(
        chunks_in=chunks,
        chunks_out=chunks_out,
        flagged=flagged,
        security_events=security_events,
        execution_time_ms=elapsed_ms,
    )
