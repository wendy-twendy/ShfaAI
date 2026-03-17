from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class SecurityEvent(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_type: str  # "prompt_injection_detected" | "tool_call_blocked" | "chunk_dropped"
    layer: str  # "normalization" | "heuristic" | "classifier" | "llm_judge" | "datamarking" | "tool_judge"
    details: dict[str, Any] = Field(default_factory=dict)


class LayerResult(BaseModel):
    layer_number: int = 0
    chunks_in: list[str]
    chunks_out: list[str]
    flagged: list[str] = Field(default_factory=list)
    security_events: list[SecurityEvent] = Field(default_factory=list)
    execution_time_ms: float = 0.0
    chunk_categories: list[str] = Field(default_factory=list)  # "clean"/"poisoned" per chunk_in


class ToolCallRecord(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    status: str = "allowed"  # "allowed" | "blocked"
    judge_reason: str = ""
    call_id: str = ""


class ConversationTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    query: str
    enabled_layers: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5, 6])
    active_doc_ids: list[str] = Field(default_factory=list)
    retrieval_mode: str = "topk"  # "topk" | "all"
    agent_model: str | None = None
    judge_model: str | None = None
    defense_prompt_enabled: bool | None = None  # None = use env var default
    must_include_doc_ids: list[str] = Field(default_factory=list)
    conversation_history: list[ConversationTurn] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    tool_calls: list[ToolCallRecord] = Field(default_factory=list)
    security_events: list[SecurityEvent] = Field(default_factory=list)
    pipeline_trace: list[LayerResult] = Field(default_factory=list)
    retrieved_docs: list[dict[str, Any]] = Field(default_factory=list)


class PromptMessage(BaseModel):
    role: str  # "system" | "user"
    content: str
    label: str = ""  # "system_prompt" | "retrieved_context" | "user_query"


class SystemPromptBreakdown(BaseModel):
    base: str
    defense_instruction: str | None = None
    datamarking_instruction: str | None = None


class PromptPreviewResponse(BaseModel):
    messages: list[PromptMessage]
    system_prompt_breakdown: SystemPromptBreakdown
    tool_definitions: list[dict[str, Any]] = Field(default_factory=list)
    pipeline_trace: list[LayerResult] = Field(default_factory=list)
    security_events: list[SecurityEvent] = Field(default_factory=list)
    retrieved_docs: list[dict[str, Any]] = Field(default_factory=list)
    surviving_chunks: list[str] = Field(default_factory=list)
    config_snapshot: dict[str, Any] = Field(default_factory=dict)
