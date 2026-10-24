"""Agent graph end-to-end on mocks: plan -> critic -> approval interrupt -> resume -> work orders approved."""
from fastapi.testclient import TestClient
from langgraph.types import Command

from agents import graph as G
from backend.app.main import app


def test_graph_cycle():
    G.http = TestClient(app, base_url="http://testserver/api/v1")
    g = G.build_graph()
    cfg = {"configurable": {"thread_id": "t-test"}}
    out = g.invoke({"request": "plan tonight"}, cfg)
    assert "__interrupt__" in out, "graph must pause for human approval"
    out = g.invoke(Command(resume={"approved": True, "decided_by": "test"}), cfg)
    assert out["work_orders"] and all(w["status"] == "APPROVED" for w in out["work_orders"])


def test_reject_creates_nothing():
    G.http = TestClient(app, base_url="http://testserver/api/v1")
    g = G.build_graph()
    cfg = {"configurable": {"thread_id": "t-reject"}}
    g.invoke({"request": "plan"}, cfg)
    out = g.invoke(Command(resume={"approved": False}), cfg)
    assert out["work_orders"] == []
