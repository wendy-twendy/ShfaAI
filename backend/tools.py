from __future__ import annotations


# --- Stub implementations ---

def send_email(recipient: str, subject: str, body: str) -> str:
    return f"Email sent to {recipient}: {subject}"


def update_case_status(case_id: str, status: str) -> str:
    return f"Case {case_id} updated to {status}"


def share_document(document_id: str, recipient: str) -> str:
    return f"Document {document_id} shared with {recipient}"


# --- Dispatcher ---

_TOOL_REGISTRY = {
    "send_email": send_email,
    "update_case_status": update_case_status,
    "share_document": share_document,
}


def execute_tool(name: str, args: dict) -> str:
    func = _TOOL_REGISTRY.get(name)
    if func is None:
        return f"Error: Unknown tool '{name}'"
    return func(**args)


# --- OpenRouter-format tool definitions ---

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Sends an email to the specified recipient with the given subject and body.",
            "parameters": {
                "type": "object",
                "properties": {
                    "recipient": {
                        "type": "string",
                        "description": "Email address of the recipient",
                    },
                    "subject": {
                        "type": "string",
                        "description": "Email subject line",
                    },
                    "body": {
                        "type": "string",
                        "description": "Email body content",
                    },
                },
                "required": ["recipient", "subject", "body"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_case_status",
            "description": "Updates the status of a legal case by case ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "case_id": {
                        "type": "string",
                        "description": "The unique identifier of the case",
                    },
                    "status": {
                        "type": "string",
                        "description": "The new status for the case",
                    },
                },
                "required": ["case_id", "status"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "share_document",
            "description": "Shares a document with the specified recipient.",
            "parameters": {
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "string",
                        "description": "The unique identifier of the document to share",
                    },
                    "recipient": {
                        "type": "string",
                        "description": "Email address of the person to share the document with",
                    },
                },
                "required": ["document_id", "recipient"],
            },
        },
    },
]


def get_tool_definitions() -> list[dict]:
    return TOOL_DEFINITIONS
