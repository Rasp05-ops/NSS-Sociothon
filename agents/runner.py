"""OWNER: B. Turns graph execution into TraceEvents for the /chat SSE endpoint (the UI's live agent trace).
Wire into backend/app/main.py `chat()` by replacing the fixture replay with `stream_chat(...)`."""
import uuid
from datetime import datetime, timezone
from typing import Iterator

from langgraph.types import Command

from shared.schemas import TraceEvent

from .graph import build_graph

GRAPH = build_graph()


def _ev(trace_id, agent, type_, payload):
    return TraceEvent(trace_id=trace_id, ts=datetime.now(timezone.utc), agent=agent, type=type_, payload=payload)


def stream_chat(message: str, thread_id: str = "default", resume: dict | None = None) -> Iterator[TraceEvent]:
    tid, cfg = uuid.uuid4().hex[:8], {"configurable": {"thread_id": thread_id}}
    inp = Command(resume=resume) if resume is not None else {"request": message}
    for upd in GRAPH.stream(inp, cfg, stream_mode="updates"):
        for node, val in upd.items():
            if node == "__interrupt__":
                yield _ev(tid, "dispatcher", "approval_request", {"interrupt": str(val[0].value)[:2000]})
            elif node == "planner":
                p = val["plan"]
                yield _ev(tid, "planner", "tool_result",
                          {"tool": "plan_routes", "summary": f"{len(p['routes'])} routes, {p['total_km']} km, saves {p['km_saved_pct']}%"})
                if val.get("plan_summary"):
                    yield _ev(tid, "planner", "message", {"text": val["plan_summary"]})
            elif node == "critic":
                critic = val["critic"]
                yield _ev(tid, "critic", "message", critic)
            elif node == "dispatcher":
                yield _ev(tid, "dispatcher", "tool_result", {"work_orders": [w["work_order_id"] for w in val["work_orders"]]})
    yield _ev(tid, "system", "done", {})
