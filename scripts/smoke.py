"""`make smoke` (backend running): hits every endpoint, validates against shared schemas. Run before EVERY push."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # works without `make`/PYTHONPATH

import httpx

from shared.schemas import (Bin, CompareResponse, TrendResponse, ForecastResponse, KPIs, RagAnswer, Reading, RoutePlanResponse, WorkOrder)

BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
fails = 0


def check(name, fn):
    global fails
    try:
        fn()
        print(f"  ok   {name}")
    except Exception as e:  # noqa: BLE001
        fails += 1
        print(f"  FAIL {name}: {e!r}")


c = httpx.Client(base_url=BASE, timeout=60)
bins = []


def t_bins():
    global bins
    bins = [Bin(**b) for b in c.get("/bins").raise_for_status().json()]
    assert len(bins) == 40, f"expected 40 bins, got {len(bins)}"


check("GET /bins", t_bins)
check("GET /bins/{id}/readings", lambda: [Reading(**x) for x in c.get(f"/bins/{bins[0].bin_id}/readings").raise_for_status().json()])
check("GET /forecast", lambda: ForecastResponse(**c.get("/forecast", params={"building_id": "H01", "days": 7}).raise_for_status().json()))
plan = {}


def t_plan():
    global plan
    plan = RoutePlanResponse(**c.post("/routes/plan", json={"horizon_h": 12, "trucks": 2}).raise_for_status().json())
    assert plan.routes, "no routes"


check("POST /routes/plan", t_plan)


def t_wo():
    wo = WorkOrder(**c.post("/work-orders", json={"route_id": plan.routes[0].route_id}).raise_for_status().json())
    assert wo.status == "DRAFT"
    assert WorkOrder(**c.post(f"/work-orders/{wo.work_order_id}/approve", json={"approved": True}).raise_for_status().json()).status == "APPROVED"


check("work-order draft -> approve", t_wo)
check("GET /trends", lambda: TrendResponse(**c.get("/trends").raise_for_status().json()))
check("GET /compare", lambda: CompareResponse(**c.get("/compare").raise_for_status().json()))
check("GET /kpis", lambda: KPIs(**c.get("/kpis").raise_for_status().json()))
check("GET /rag/ask", lambda: RagAnswer(**c.get("/rag/ask", params={"q": "Can mess waste be composted?"}).raise_for_status().json()))


def t_chat():
    with c.stream("POST", "/chat", json={"message": "plan tonight"}) as r:
        lines = [x for x in r.iter_lines() if x.startswith("data:")]
    assert lines and '"type":"done"' in lines[-1].replace(" ", ""), "SSE must end with a done event"


check("POST /chat (SSE)", t_chat)
print("SMOKE", "PASSED" if not fails else f"FAILED ({fails})")
sys.exit(1 if fails else 0)
