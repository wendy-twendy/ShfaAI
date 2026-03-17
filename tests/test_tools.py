from backend.tools import (
    execute_tool,
    get_tool_definitions,
    send_email,
    share_document,
    update_case_status,
)


def test_send_email():
    result = send_email("alice@example.com", "Hello", "Hi Alice")
    assert "alice@example.com" in result
    assert "Hello" in result


def test_update_case_status():
    result = update_case_status("CASE-001", "CLOSED")
    assert "CASE-001" in result
    assert "CLOSED" in result


def test_share_document():
    result = share_document("DOC-123", "bob@example.com")
    assert "DOC-123" in result
    assert "bob@example.com" in result


def test_execute_tool_valid():
    result = execute_tool("send_email", {
        "recipient": "test@test.com",
        "subject": "Test",
        "body": "Body",
    })
    assert "test@test.com" in result


def test_execute_tool_invalid():
    result = execute_tool("nonexistent_tool", {})
    assert "Error" in result
    assert "nonexistent_tool" in result


def test_tool_definitions_format():
    defs = get_tool_definitions()
    assert len(defs) == 3
    for tool_def in defs:
        assert tool_def["type"] == "function"
        func = tool_def["function"]
        assert "name" in func
        assert "description" in func
        assert "parameters" in func
        params = func["parameters"]
        assert params["type"] == "object"
        assert "properties" in params
        assert "required" in params


def test_tool_definitions_names():
    defs = get_tool_definitions()
    names = [d["function"]["name"] for d in defs]
    assert "send_email" in names
    assert "update_case_status" in names
    assert "share_document" in names
