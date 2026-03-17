from __future__ import annotations

import json

from backend.models import SecurityEvent


class SecurityLogger:
    def __init__(self) -> None:
        self.events: list[SecurityEvent] = []

    def log(self, event: SecurityEvent) -> None:
        self.events.append(event)
        print(f"[SECURITY] {event.event_type} | layer={event.layer} | {json.dumps(event.details)}")

    def get_events(self) -> list[SecurityEvent]:
        return list(self.events)

    def clear(self) -> None:
        self.events.clear()

    def format_summary(self) -> str:
        if not self.events:
            return "No security events."
        lines = []
        for e in self.events:
            lines.append(f"  [{e.event_type}] layer={e.layer} action={e.details.get('action_taken', 'n/a')}")
        return f"Security Events ({len(self.events)}):\n" + "\n".join(lines)
