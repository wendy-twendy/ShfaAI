from __future__ import annotations

import re
import time
from collections import Counter

from backend.models import LayerResult, SecurityEvent

# Threshold for flagging a chunk
FLAG_THRESHOLD = 0.3

# --- Heuristic patterns ---
# Each entry: (pattern_name, compiled_regex, weight)

PATTERNS: list[tuple[str, re.Pattern[str], float]] = [
    # Instruction override
    (
        "instruction_override",
        re.compile(
            r"(?:ignore|disregard|forget|override|bypass)\s+"
            r"(?:all\s+)?(?:previous|prior|above|earlier|your|system)\s+"
            r"(?:instructions?|prompts?|rules?|guidelines?|context)",
            re.IGNORECASE,
        ),
        0.5,
    ),
    # Tool invocation
    (
        "tool_invocation",
        re.compile(
            r"(?:call|execute|invoke|run|trigger|use)\s+"
            r"(?:the\s+)?(?:send_email|update_case_status|share_document|"
            r"create_ticket|send_notification|lookup_user)\b",
            re.IGNORECASE,
        ),
        0.5,
    ),
    # Role-play / persona switching
    (
        "role_play",
        re.compile(
            r"(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|switch\s+to|"
            r"from\s+now\s+on\s+you\s+are|assume\s+the\s+role)",
            re.IGNORECASE,
        ),
        0.4,
    ),
    # System prompt escape / delimiter tokens
    (
        "delimiter_escape",
        re.compile(
            r"\[/?INST\]|\[/?SYSTEM\]|<\|/?system\|>|<\|/?user\|>|"
            r"</?(retrieved_context|system_prompt|instructions?)>|"
            r"</s>|<\|im_start\|>|<\|im_end\|>",
            re.IGNORECASE,
        ),
        0.5,
    ),
    # Encoding tricks
    (
        "encoding_tricks",
        re.compile(
            r"\b(?:base64|decode\s+this|in\s+hexadecimal|rot13|"
            r"hex\s+encoded|url\s+encoded|convert\s+from\s+base)",
            re.IGNORECASE,
        ),
        0.3,
    ),
]


def _count_qa_pairs(text: str) -> int:
    """Count Q&A-like patterns (Example N:, User:, Q:, etc.)."""
    qa_patterns = [
        re.compile(r"^(?:Example|Q|Question|User)\s*\d*\s*:", re.IGNORECASE | re.MULTILINE),
        re.compile(r"\n(?:Assistant|A|Answer)\s*\d*\s*:", re.IGNORECASE),
    ]
    counts = [len(p.findall(text)) for p in qa_patterns]
    return max(counts) if counts else 0


def _check_token_flooding(text: str) -> bool:
    """Check if any single word repeats excessively (>50% of total words, min 10 repeats)."""
    words = text.lower().split()
    if len(words) < 10:
        return False
    counts = Counter(words)
    most_common_word, most_common_count = counts.most_common(1)[0]
    # Skip common English stop words
    stop_words = {"the", "a", "an", "is", "of", "and", "to", "in", "for", "it", "on", "that", "this", "with", "as", "be", "or"}
    if most_common_word in stop_words:
        return False
    return most_common_count > 3 and most_common_count / len(words) > 0.3


def scan_chunk(text: str) -> tuple[float, list[str]]:
    """Scan a single chunk. Returns (score, matched_pattern_names)."""
    matched: list[str] = []
    score = 0.0

    # Regex patterns
    for name, pattern, weight in PATTERNS:
        if pattern.search(text):
            matched.append(name)
            score += weight

    # Many-shot detection
    qa_count = _count_qa_pairs(text)
    if qa_count > 3:
        matched.append("many_shot")
        score += 0.4

    # Token flooding
    if _check_token_flooding(text):
        matched.append("token_flooding")
        score += 0.3

    return min(score, 1.0), matched


def run(chunks: list[str]) -> LayerResult:
    """Layer 2: Heuristic scanner. Flags but does not drop chunks."""
    start = time.perf_counter()
    flagged: list[str] = []
    security_events: list[SecurityEvent] = []

    for chunk in chunks:
        score, matched = scan_chunk(chunk)
        if score >= FLAG_THRESHOLD and matched:
            flagged.append(chunk)
            security_events.append(SecurityEvent(
                event_type="prompt_injection_detected",
                layer="heuristic",
                details={
                    "chunk_preview": chunk[:200],
                    "matched_patterns": matched,
                    "score": round(score, 2),
                    "action_taken": "flagged",
                },
            ))

    elapsed_ms = (time.perf_counter() - start) * 1000

    return LayerResult(
        chunks_in=chunks,
        chunks_out=chunks,  # heuristic layer flags but does not drop
        flagged=flagged,
        security_events=security_events,
        execution_time_ms=elapsed_ms,
    )
