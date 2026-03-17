from __future__ import annotations

import time
import unicodedata

from backend.models import LayerResult, SecurityEvent

# Zero-width characters to strip
ZERO_WIDTH_CHARS = frozenset([
    "\u200B",  # zero-width space
    "\u200C",  # zero-width non-joiner
    "\u200D",  # zero-width joiner
    "\uFEFF",  # BOM / zero-width no-break space
    "\u00AD",  # soft hyphen
])

# Bidirectional override characters to strip
BIDI_CHARS = frozenset([
    "\u202A",  # left-to-right embedding
    "\u202B",  # right-to-left embedding
    "\u202C",  # pop directional formatting
    "\u202D",  # left-to-right override
    "\u202E",  # right-to-left override
    "\u2066",  # left-to-right isolate
    "\u2067",  # right-to-left isolate
    "\u2068",  # first strong isolate
    "\u2069",  # pop directional isolate
])

# Cyrillic → Latin homoglyph mapping (common confusables)
HOMOGLYPH_MAP = {
    "\u0430": "a",  # Cyrillic а → Latin a
    "\u0435": "e",  # Cyrillic е → Latin e
    "\u043E": "o",  # Cyrillic о → Latin o
    "\u0440": "p",  # Cyrillic р → Latin p
    "\u0441": "c",  # Cyrillic с → Latin c
    "\u0443": "y",  # Cyrillic у → Latin y
    "\u0445": "x",  # Cyrillic х → Latin x
    "\u0410": "A",  # Cyrillic А → Latin A
    "\u0412": "B",  # Cyrillic В → Latin B
    "\u0415": "E",  # Cyrillic Е → Latin E
    "\u041A": "K",  # Cyrillic К → Latin K
    "\u041C": "M",  # Cyrillic М → Latin M
    "\u041D": "H",  # Cyrillic Н → Latin H
    "\u041E": "O",  # Cyrillic О → Latin O
    "\u0420": "P",  # Cyrillic Р → Latin P
    "\u0421": "C",  # Cyrillic С → Latin C
    "\u0422": "T",  # Cyrillic Т → Latin T
    "\u0425": "X",  # Cyrillic Х → Latin X
}

ALL_STRIP_CHARS = ZERO_WIDTH_CHARS | BIDI_CHARS


def _is_unicode_tag(c: str) -> bool:
    """Check if character is in the Unicode Tags block (U+E0001–U+E007F)."""
    cp = ord(c)
    return 0xE0001 <= cp <= 0xE007F


def normalize_text(text: str) -> tuple[str, list[str]]:
    """Normalize text and return (normalized_text, list_of_findings)."""
    findings: list[str] = []

    # Step 1: NFKC normalization
    normalized = unicodedata.normalize("NFKC", text)

    # Step 2: Strip zero-width and bidi chars
    stripped_chars = []
    result_chars = []
    for c in normalized:
        if c in ALL_STRIP_CHARS:
            stripped_chars.append(c)
        elif _is_unicode_tag(c):
            stripped_chars.append(c)
        else:
            result_chars.append(c)

    if stripped_chars:
        zwc_count = sum(1 for c in stripped_chars if c in ZERO_WIDTH_CHARS)
        bidi_count = sum(1 for c in stripped_chars if c in BIDI_CHARS)
        tag_count = sum(1 for c in stripped_chars if _is_unicode_tag(c))
        if zwc_count:
            findings.append(f"zero_width_chars:{zwc_count}")
        if bidi_count:
            findings.append(f"bidi_overrides:{bidi_count}")
        if tag_count:
            findings.append(f"unicode_tags:{tag_count}")

    normalized = "".join(result_chars)

    # Step 3: Homoglyph resolution
    homoglyph_count = 0
    resolved_chars = []
    for c in normalized:
        if c in HOMOGLYPH_MAP:
            resolved_chars.append(HOMOGLYPH_MAP[c])
            homoglyph_count += 1
        else:
            resolved_chars.append(c)

    if homoglyph_count:
        findings.append(f"homoglyphs:{homoglyph_count}")

    normalized = "".join(resolved_chars)

    return normalized, findings


def run(chunks: list[str]) -> LayerResult:
    """Layer 1: Text normalization. Transforms but never drops chunks."""
    start = time.perf_counter()
    chunks_out = []
    flagged = []
    security_events = []

    for chunk in chunks:
        normalized, findings = normalize_text(chunk)
        chunks_out.append(normalized)

        if findings:
            flagged.append(chunk)
            security_events.append(SecurityEvent(
                event_type="prompt_injection_detected",
                layer="normalization",
                details={
                    "chunk_preview": chunk[:200],
                    "findings": findings,
                    "action_taken": "normalized",
                },
            ))

    elapsed_ms = (time.perf_counter() - start) * 1000

    return LayerResult(
        chunks_in=chunks,
        chunks_out=chunks_out,
        flagged=flagged,
        security_events=security_events,
        execution_time_ms=elapsed_ms,
    )
