"""OWNER: B. LangGraph: planner -> critic -> (retry|approval) -> dispatcher. Human approval via interrupt().
Skeleton is deterministic (no LLM) so it runs end-to-end on mocks; B adds llm.ask() for explanations/replanning.
Usage:  g = build_graph(); cfg = {"configurable": {"thread_id": "t1"}}
        g.invoke({"request": "plan tonight"}, cfg)           # pauses at approval (returns __interrupt__)
        g.invoke(Command(resume={"approved": True}), cfg)    # resumes, dispatcher creates the work order"""
import os
from typing import Any, TypedDict

import httpx
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt  # noqa: F401  (Command re-exported for callers)

from shared.constants import MAX_STOPS_PER_ROUTE, TRUCK_SHIFT_MIN

BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
http: httpx.Client | None = None  # tests inject a TestClient here


def _h() -> httpx.Client:
    global http
    if http is None:
        http = httpx.Client(base_url=BASE, timeout=60)
    return http


class State(TypedDict, total=False):
    request: str
    attempts: int
    risk_threshold: float
    plan: dict[str, Any]
    critic: dict[str, Any]
    decision: dict[str, Any]
    work_orders: list[dict[str, Any]]


def planner(s: State) -> State:
    thr = s.get("risk_threshold", 0.7)
    plan = _h().post("/routes/plan", json={"horizon_h": 12, "trucks": 2, "risk_threshold": thr}).raise_for_status().json()
    return {"plan": plan, "attempts": s.get("attempts", 0) + 1}  # TODO(B): llm.ask() to explain choices


def critic(s: State) -> State:
    issues = []
    for r in s["plan"]["routes"]:
        if r["est_min"] > TRUCK_SHIFT_MIN:
            issues.append(f"{r['route_id']}: {r['est_min']} min exceeds shift {TRUCK_SHIFT_MIN}")
        if len(r["stops"]) > MAX_STOPS_PER_ROUTE:
            issues.append(f"{r['route_id']}: {len(r['stops'])} stops exceeds {MAX_STOPS_PER_ROUTE}")
    if not s["plan"]["routes"]:
        issues.append("no routes produced")
    return {"critic": {"ok": not issues, "issues": issues}}


def after_critic(s: State) -> str:
    if s["critic"]["ok"]:
        return "approval"
    return "planner" if s.get("attempts", 0) < 3 else END


def approval(s: State) -> State:
    decision = interrupt({"type": "approval_request", "plan": s["plan"], "critic": s["critic"]})
    return {"decision": decision}


def dispatcher(s: State) -> State:
    if not s["decision"].get("approved"):
        return {"work_orders": []}
    out = []
    for r in s["plan"]["routes"]:
        wo = _h().post("/work-orders", json={"route_id": r["route_id"], "route": r}).raise_for_status().json()
        wo = _h().post(f"/work-orders/{wo['work_order_id']}/approve",
                       json={"approved": True, "decided_by": s["decision"].get("decided_by", "admin")}).raise_for_status().json()
        out.append(wo)
    return {"work_orders": out}  # TODO(B): notify (Telegram) after dispatch


def build_graph(checkpointer=None):
    g = StateGraph(State)
    g.add_node("planner", planner)
    g.add_node("critic", critic)
    g.add_node("approval", approval)
    g.add_node("dispatcher", dispatcher)
    g.add_edge(START, "planner")
    g.add_edge("planner", "critic")
    g.add_conditional_edges("critic", after_critic, {"approval": "approval", "planner": "planner", END: END})
    g.add_edge("approval", "dispatcher")
    g.add_edge("dispatcher", END)
    return g.compile(checkpointer=checkpointer or MemorySaver())
