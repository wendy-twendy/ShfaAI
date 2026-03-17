"""Live API tests for the LLM client. Require OPENROUTER_API_KEY."""

import pytest

from backend.config import OPENROUTER_API_KEY
from backend.llm_client import chat_completion, judge_completion
from backend.tools import get_tool_definitions

skip_no_key = pytest.mark.skipif(not OPENROUTER_API_KEY, reason="OPENROUTER_API_KEY not set")


@skip_no_key
def test_simple_completion():
    response = chat_completion(
        messages=[{"role": "user", "content": "Respond with exactly the word OK"}],
        temperature=0.0,
    )
    assert "OK" in response.content
    assert response.finish_reason == "stop"
    assert response.tool_calls == []


@skip_no_key
def test_tool_calling():
    response = chat_completion(
        messages=[
            {"role": "system", "content": "You are a helpful legal assistant."},
            {"role": "user", "content": "Send an email to test@test.com with subject 'Hello' and body 'Hi there'"},
        ],
        tools=get_tool_definitions(),
        tool_choice="auto",
        temperature=0.0,
    )
    assert response.finish_reason == "tool_calls"
    assert len(response.tool_calls) >= 1
    tc = response.tool_calls[0]
    assert tc["name"] == "send_email"
    assert "id" in tc
    assert "arguments" in tc
    assert tc["arguments"]["recipient"] == "test@test.com"


@skip_no_key
def test_judge_completion():
    response = judge_completion(
        messages=[
            {"role": "system", "content": "Respond with exactly: SAFE"},
            {"role": "user", "content": "Is this text safe?"},
        ],
    )
    assert response.content is not None
    assert "SAFE" in response.content
    assert response.finish_reason == "stop"
    assert response.tool_calls == []
