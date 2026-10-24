"""Contract tests: fixtures validate against schemas, every endpoint returns schema-valid data. `make test`."""
import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from shared.schemas import Bin, CompareResponse, TrendResponse, ForecastResponse, KPIs, RagAnswer, RoutePlanResponse, TraceEvent, WorkOrder

FIX = Path("shared/fixtures")
c = TestClient(app)


def test_fixtures_valid():
    assert len([Bin(**b) for b in json.loads((FIX / "bins.json").read_text())]) == 40
    RoutePlanResponse(**json.loads((FIX / "route_plan.json").read_text()))
    [TraceEvent(**e) for e in json.loads((FIX / "trace_events.json").read_text())]


def test_endpoints():
    assert c.get("/api/v1/health").json()["ok"]
    assert len(c.get("/api/v1/bins").json()) == 40
    assert len(c.get("/api/v1/bins", params={"building_id": "H01"}).json()) == 7
    ForecastResponse(**c.get("/api/v1/forecast", params={"building_id": "H02"}).json())
    plan = RoutePlanResponse(**c.post("/api/v1/routes/plan", json={}).json())
    assert plan.routes
    KPIs(**c.get("/api/v1/kpis").json())
    RagAnswer(**c.get("/api/v1/rag/ask", params={"q": "x"}).json())


def test_work_order_flow():
    plan = RoutePlanResponse(**c.post("/api/v1/routes/plan", json={}).json())
    wo = WorkOrder(**c.post("/api/v1/work-orders", json={"route_id": plan.routes[0].route_id}).json())
    assert wo.status == "DRAFT"
    assert c.post(f"/api/v1/work-orders/{wo.work_order_id}/approve", json={"approved": True}).json()["status"] == "APPROVED"
    assert c.post("/api/v1/work-orders/NOPE/approve", json={"approved": True}).status_code == 404


def test_chat_sse_ends_with_done():
    with c.stream("POST", "/api/v1/chat", json={"message": "hi"}) as r:
        lines = [x for x in r.iter_lines() if x.startswith("data:")]
    assert '"type":"done"' in lines[-1].replace(" ", "")


def test_chat_resume_sse():
    thread_id = "test_resume_flow"
    with c.stream("POST", "/api/v1/chat", json={"message": "plan routes", "thread_id": thread_id}) as r:
        lines = [x for x in r.iter_lines() if x.startswith("data:")]
    assert len(lines) > 0
    assert '"type":"done"' in lines[-1].replace(" ", "")

    with c.stream("POST", "/api/v1/chat/resume", json={"thread_id": thread_id, "approved": True, "decided_by": "test"}) as r:
        resume_lines = [x for x in r.iter_lines() if x.startswith("data:")]
    assert len(resume_lines) > 0
    assert '"type":"done"' in resume_lines[-1].replace(" ", "")


def test_trends_and_compare():
    t = TrendResponse(**c.get("/api/v1/trends", params={"building_id": "H01"}).json())
    assert len(t.points) == 30 and t.building_id == "H01"
    cmp_ = CompareResponse(**c.get("/api/v1/compare").json())
    assert len(cmp_.buildings) == 6 and sorted(b.rank for b in cmp_.buildings) == [1, 2, 3, 4, 5, 6]
    k = KPIs(**c.get("/api/v1/kpis").json())
    assert k.recycling_pct is not None and k.waste_change_wow_pct is not None
