"""OWNER: B. Turns graph execution into TraceEvents for the /chat SSE endpoint (the UI's live agent trace).
Wire into backend/app/main.py `chat()` by replacing the fixture replay with `stream_chat(...)`."""
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

from langgraph.types import Command

from shared.schemas import TraceEvent

from .graph import build_graph
from .llm import ask, LLMConfigurationError
from .rag.interface import answer as answer_rules

GRAPH = build_graph()
GENERAL_PROMPT = (Path(__file__).parent / "prompts" / "general.md").read_text(encoding="utf-8")
WORKFLOW_TERMS = {"route", "routes", "collection", "collect", "bin", "overflow", "truck", "dispatch", "plan tonight"}
RULE_TERMS = {"rule", "rules", "sop", "segregat", "compost", "recycl", "plastic", "e-waste", "ewaste", "hazardous"}


def _ev(trace_id, agent, type_, payload):
    return TraceEvent(trace_id=trace_id, ts=datetime.now(timezone.utc), agent=agent, type=type_, payload=payload)


def _is_workflow_request(message: str) -> bool:
    text = message.lower()
    return any(term in text for term in WORKFLOW_TERMS)


def _is_rules_request(message: str) -> bool:
    text = message.lower()
    return any(term in text for term in RULE_TERMS)


def _stream_conversation(message: str, trace_id: str) -> Iterator[TraceEvent]:
    if _is_rules_request(message):
        result = answer_rules(message)
        if result.abstained:
            text = result.answer
        else:
            citations = ", ".join(
                f"{citation.doc_id}{f' ({citation.clause})' if citation.clause else ''}"
                for citation in result.citations[:3]
            )
            text = f"{result.answer}\n\nSources: {citations}"
        yield _ev(trace_id, "rag", "message", {"text": text, "abstained": result.abstained})
        return

    prompt = f"{GENERAL_PROMPT}\n\nUser question: {message}"
    try:
        text = ask(prompt, system="You are a general conversational AI for Binlytics.")
    except LLMConfigurationError as exc:
        text = f"AI answer unavailable: {exc}"
    yield _ev(trace_id, "system", "message", {"text": text.strip()})


def stream_chat(message: str, thread_id: str = "default", resume: dict | None = None) -> Iterator[TraceEvent]:
    tid, cfg = uuid.uuid4().hex[:8], {"configurable": {"thread_id": thread_id}}
    if resume is None and not _is_workflow_request(message):
        yield from _stream_conversation(message, tid)
        yield _ev(tid, "system", "done", {})
        return
    inp = Command(resume=resume) if resume is not None else {"request": message}
    for upd in GRAPH.stream(inp, cfg, stream_mode="updates"):
        for node, val in upd.items():
            if node == "__interrupt__":
                interrupt_value = val[0].value
                plan = interrupt_value.get("plan", {})
                route_ids = [route["route_id"] for route in plan.get("routes", [])]
                yield _ev(
                    tid,
                    "dispatcher",
                    "approval_request",
                    {
                        "thread_id": thread_id,
                        "route_id": route_ids[0] if route_ids else None,
                        "route_ids": route_ids,
                        "plan": plan,
                        "critic": interrupt_value.get("critic", {}),
                    },
                )
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
                work_orders = [w["work_order_id"] for w in val["work_orders"]]
                yield _ev(
                    tid,
                    "dispatcher",
                    "tool_result",
                    {
                        "work_orders": work_orders,
                        "summary": (
                            f"{len(work_orders)} work order(s) dispatched"
                            if work_orders
                            else "Approval rejected; no work orders dispatched"
                        ),
                    },
                )
    yield _ev(tid, "system", "done", {})
