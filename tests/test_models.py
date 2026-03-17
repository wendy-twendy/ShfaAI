from backend.models import (
    ChatRequest,
    ChatResponse,
    LayerResult,
    SecurityEvent,
    ToolCallRecord,
)
from backend.security_logger import SecurityLogger


def test_security_event_instantiation():
    event = SecurityEvent(
        event_type="prompt_injection_detected",
        layer="heuristic",
        details={"matched_patterns": ["instruction_override"], "confidence": 0.95},
    )
    assert event.event_type == "prompt_injection_detected"
    assert event.layer == "heuristic"
    assert event.timestamp  # auto-generated
    assert event.details["confidence"] == 0.95


def test_security_event_defaults():
    event = SecurityEvent(event_type="chunk_dropped", layer="classifier")
    assert event.details == {}
    assert event.timestamp


def test_layer_result():
    result = LayerResult(
        chunks_in=["chunk1", "chunk2"],
        chunks_out=["chunk1"],
        flagged=["chunk2"],
        execution_time_ms=1.5,
    )
    assert len(result.chunks_in) == 2
    assert len(result.chunks_out) == 1
    assert len(result.flagged) == 1
    assert result.execution_time_ms == 1.5


def test_layer_result_defaults():
    result = LayerResult(chunks_in=["a"], chunks_out=["a"])
    assert result.flagged == []
    assert result.security_events == []
    assert result.execution_time_ms == 0.0


def test_tool_call_record():
    record = ToolCallRecord(
        name="send_email",
        arguments={"recipient": "test@test.com", "subject": "Hi", "body": "Hello"},
        status="allowed",
        judge_reason="User requested this action",
        call_id="call_123",
    )
    assert record.name == "send_email"
    assert record.status == "allowed"
    assert record.arguments["recipient"] == "test@test.com"


def test_tool_call_record_defaults():
    record = ToolCallRecord(name="update_case_status")
    assert record.arguments == {}
    assert record.status == "allowed"
    assert record.judge_reason == ""


def test_chat_request():
    req = ChatRequest(query="What is the NDA?")
    assert req.query == "What is the NDA?"
    assert req.enabled_layers == [1, 2, 3, 4, 5, 6]
    assert req.retrieval_mode == "topk"


def test_chat_request_custom():
    req = ChatRequest(
        query="test",
        enabled_layers=[1, 2, 5],
        active_doc_ids=["doc1", "doc2"],
        retrieval_mode="all",
        agent_model="custom/model",
    )
    assert req.enabled_layers == [1, 2, 5]
    assert req.active_doc_ids == ["doc1", "doc2"]
    assert req.agent_model == "custom/model"


def test_chat_response():
    resp = ChatResponse(answer="The NDA covers confidentiality.")
    assert resp.answer == "The NDA covers confidentiality."
    assert resp.tool_calls == []
    assert resp.security_events == []
    assert resp.pipeline_trace == []


def test_chat_response_full():
    event = SecurityEvent(event_type="tool_call_blocked", layer="tool_judge")
    tool_call = ToolCallRecord(name="send_email", status="blocked", judge_reason="Not user requested")
    layer_result = LayerResult(chunks_in=["a"], chunks_out=["a"])
    resp = ChatResponse(
        answer="Done.",
        tool_calls=[tool_call],
        security_events=[event],
        pipeline_trace=[layer_result],
    )
    assert len(resp.tool_calls) == 1
    assert resp.tool_calls[0].status == "blocked"
    assert len(resp.security_events) == 1


def test_security_logger():
    logger = SecurityLogger()
    assert logger.get_events() == []

    event1 = SecurityEvent(event_type="prompt_injection_detected", layer="heuristic")
    event2 = SecurityEvent(event_type="tool_call_blocked", layer="tool_judge")
    logger.log(event1)
    logger.log(event2)

    assert len(logger.get_events()) == 2
    assert logger.get_events()[0].event_type == "prompt_injection_detected"


def test_security_logger_clear():
    logger = SecurityLogger()
    logger.log(SecurityEvent(event_type="chunk_dropped", layer="classifier"))
    assert len(logger.get_events()) == 1
    logger.clear()
    assert len(logger.get_events()) == 0


def test_security_logger_format_summary():
    logger = SecurityLogger()
    assert logger.format_summary() == "No security events."

    logger.log(SecurityEvent(
        event_type="prompt_injection_detected",
        layer="heuristic",
        details={"action_taken": "flagged"},
    ))
    summary = logger.format_summary()
    assert "Security Events (1)" in summary
    assert "prompt_injection_detected" in summary
