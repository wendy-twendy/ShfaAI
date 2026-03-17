from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from openai import OpenAI

from backend.config import DEFAULT_AGENT_MODEL, DEFAULT_JUDGE_MODEL, OPENROUTER_API_KEY, OPENROUTER_BASE_URL


@dataclass
class LLMResponse:
    content: str | None
    finish_reason: str
    tool_calls: list[dict[str, Any]]


_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY)
    return _client


def chat_completion(
    messages: list[dict[str, Any]],
    tools: list[dict[str, Any]] | None = None,
    tool_choice: str = "auto",
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    response_format: dict[str, Any] | None = None,
) -> LLMResponse:
    """Main LLM call for the agent. Returns parsed response."""
    client = _get_client()
    model = model or DEFAULT_AGENT_MODEL

    kwargs: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_completion_tokens": max_tokens,
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = tool_choice
    if response_format:
        kwargs["response_format"] = response_format

    response = client.chat.completions.create(**kwargs)
    message = response.choices[0].message
    finish_reason = response.choices[0].finish_reason

    parsed_tool_calls: list[dict[str, Any]] = []
    if message.tool_calls:
        for tc in message.tool_calls:
            parsed_tool_calls.append({
                "id": tc.id,
                "name": tc.function.name,
                "arguments": json.loads(tc.function.arguments),
            })

    return LLMResponse(
        content=message.content,
        finish_reason=finish_reason or "stop",
        tool_calls=parsed_tool_calls,
    )


def judge_completion(
    messages: list[dict[str, Any]],
    model: str | None = None,
    max_tokens: int = 1024,
    response_format: dict[str, Any] | None = None,
) -> LLMResponse:
    """LLM call for judge layers: deterministic, no tools."""
    return chat_completion(
        messages=messages,
        tools=None,
        model=model or DEFAULT_JUDGE_MODEL,
        temperature=0.0,
        max_tokens=max_tokens,
        response_format=response_format,
    )
