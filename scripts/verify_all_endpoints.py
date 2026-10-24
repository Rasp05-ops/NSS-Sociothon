"""Exhaustive check of every API endpoint on the running backend server.
Validates status codes, payloads, Pydantic schemas, and query parameters."""
import json
import sys
from datetime import datetime, timedelta, timezone

import httpx

from shared.schemas import (
    Bin,
    CompareResponse,
    ForecastResponse,
    KPIs,
    RagAnswer,
    Reading,
    RoutePlanResponse,
    TraceEvent,
    TrendResponse,
    WorkOrder,
)

BASE = "http://127.0.0.1:8000"
API = f"{BASE}/api/v1"
client = httpx.Client(base_url=API, timeout=30.0)

results = []


def record(endpoint, method, status_code, ok, details=""):
    results.append({
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "ok": ok,
        "details": details
    })
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {method:4s} {endpoint:42s} -> {status_code} ({details})")


def run_checks():
    # 0. /openapi.json & /docs
    r_docs = httpx.get(f"{BASE}/docs")
    record("/docs", "GET", r_docs.status_code, r_docs.status_code == 200, "Swagger UI available")

    r_openapi = httpx.get(f"{BASE}/openapi.json")
    record("/openapi.json", "GET", r_openapi.status_code, r_openapi.status_code == 200, f"{len(r_openapi.json().get('paths', {}))} paths declared")

    # 1. GET /health
    r = client.get("/health")
    data = r.json()
    record("/api/v1/health", "GET", r.status_code, r.status_code == 200 and data.get("ok") is True, f"use_mocks={data.get('use_mocks')}")

    # 2. GET /bins (all 40 bins)
    r = client.get("/bins")
    bins_data = r.json()
    parsed_bins = [Bin(**b) for b in bins_data]
    record("/api/v1/bins", "GET", r.status_code, len(parsed_bins) == 40, f"Returned {len(parsed_bins)} bins, source={parsed_bins[0].risk_level}")

    # 2b. GET /bins with filters
    r_h01 = client.get("/bins", params={"building_id": "H01"})
    h01_bins = [Bin(**b) for b in r_h01.json()]
    record("/api/v1/bins?building_id=H01", "GET", r_h01.status_code, len(h01_bins) == 7, f"Returned {len(h01_bins)} bins for H01")

    r_risk = client.get("/bins", params={"min_risk": 0.5})
    risk_bins = [Bin(**b) for b in r_risk.json()]
    record("/api/v1/bins?min_risk=0.5", "GET", r_risk.status_code, all(b.risk_overflow >= 0.5 for b in risk_bins), f"{len(risk_bins)} bins with risk >= 0.5")

    # 3. GET /bins/{bin_id}/readings
    first_bin_id = parsed_bins[0].bin_id
    r = client.get(f"/bins/{first_bin_id}/readings")
    readings = [Reading(**x) for x in r.json()]
    record(f"/api/v1/bins/{first_bin_id}/readings", "GET", r.status_code, len(readings) > 0, f"{len(readings)} historical sensor readings")

    # 3b. GET /bins/{bin_id}/readings with timestamp window
    now = datetime.now(timezone.utc)
    ts_from = (now - timedelta(days=7)).isoformat()
    r_win = client.get(f"/bins/{first_bin_id}/readings", params={"from": ts_from})
    win_readings = [Reading(**x) for x in r_win.json()]
    record(f"/api/v1/bins/{first_bin_id}/readings?from=...", "GET", r_win.status_code, len(win_readings) > 0, f"{len(win_readings)} readings in 7d window")

    # 4. GET /forecast
    r = client.get("/forecast", params={"building_id": "H01", "days": 7})
    fc = ForecastResponse(**r.json())
    record("/api/v1/forecast?building_id=H01&days=7", "GET", r.status_code, len(fc.points) == 7, f"WAPE={fc.wape}, Baseline WAPE={fc.baseline_wape}")

    # 5. POST /routes/plan
    r = client.post("/routes/plan", json={"horizon_h": 12, "trucks": 2, "risk_threshold": 0.7})
    plan = RoutePlanResponse(**r.json())
    record("/api/v1/routes/plan", "POST", r.status_code, r.status_code == 200, f"{len(plan.routes)} routes, total_km={plan.total_km}, saved={plan.km_saved_pct}%")

    # 6. POST /work-orders
    sample_route_id = plan.routes[0].route_id if plan.routes else "R-TEST01"
    r = client.post("/work-orders", json={"route_id": sample_route_id, "notes": "Test dispatch work order"})
    wo = WorkOrder(**r.json())
    record("/api/v1/work-orders", "POST", r.status_code, wo.status == "DRAFT", f"Created work order {wo.work_order_id} (DRAFT)")

    # 7. GET /work-orders
    r = client.get("/work-orders")
    wo_list = [WorkOrder(**x) for x in r.json()]
    record("/api/v1/work-orders", "GET", r.status_code, len(wo_list) >= 1, f"{len(wo_list)} work orders retrieved")

    # 7b. GET /work-orders?status=DRAFT
    r_draft = client.get("/work-orders", params={"status": "DRAFT"})
    draft_list = [WorkOrder(**x) for x in r_draft.json()]
    record("/api/v1/work-orders?status=DRAFT", "GET", r_draft.status_code, all(w.status == "DRAFT" for w in draft_list), f"{len(draft_list)} DRAFT work orders")

    # 8. POST /work-orders/{id}/approve
    r_appr = client.post(f"/work-orders/{wo.work_order_id}/approve", json={"approved": True, "comment": "Approved by Admin", "decided_by": "supervisor"})
    wo_appr = WorkOrder(**r_appr.json())
    record(f"/api/v1/work-orders/{wo.work_order_id}/approve", "POST", r_appr.status_code, wo_appr.status == "APPROVED", f"Status updated to {wo_appr.status}")

    # 9. POST /work-orders (reject test)
    r_rej_create = client.post("/work-orders", json={"route_id": "R-REJ01", "notes": "Order to reject"})
    wo_rej = WorkOrder(**r_rej_create.json())
    r_rej = client.post(f"/work-orders/{wo_rej.work_order_id}/reject", json={"approved": False, "comment": "Route invalid", "decided_by": "supervisor"})
    wo_rejected = WorkOrder(**r_rej.json())
    record(f"/api/v1/work-orders/{wo_rej.work_order_id}/reject", "POST", r_rej.status_code, wo_rejected.status == "REJECTED", f"Status updated to {wo_rejected.status}")

    # 10. GET /kpis (Campus-wide)
    r = client.get("/kpis")
    kpi = KPIs(**r.json())
    record("/api/v1/kpis", "GET", r.status_code, kpi.source == "real", f"kg_today={kpi.kg_today}, recycling={kpi.recycling_pct}%, wow={kpi.waste_change_wow_pct}%")

    # 10b. GET /kpis (Specific building)
    r_kpi_b = client.get("/kpis", params={"building_id": "H01"})
    kpi_b = KPIs(**r_kpi_b.json())
    record("/api/v1/kpis?building_id=H01", "GET", r_kpi_b.status_code, kpi_b.building_id == "H01", f"kg_today={kpi_b.kg_today}, overflow_7d={kpi_b.overflow_count_7d}")

    # 11. GET /trends (day)
    r = client.get("/trends", params={"granularity": "day", "days": 14})
    trend_day = TrendResponse(**r.json())
    record("/api/v1/trends?granularity=day", "GET", r.status_code, len(trend_day.points) > 0, f"{len(trend_day.points)} daily points")

    # 11b. GET /trends (week)
    r_w = client.get("/trends", params={"granularity": "week", "days": 30})
    trend_week = TrendResponse(**r_w.json())
    record("/api/v1/trends?granularity=week", "GET", r_w.status_code, len(trend_week.points) > 0, f"{len(trend_week.points)} weekly points")

    # 12. GET /compare
    r = client.get("/compare", params={"days": 7})
    cmp_res = CompareResponse(**r.json())
    ranks = [b.rank for b in cmp_res.buildings]
    record("/api/v1/compare?days=7", "GET", r.status_code, sorted(ranks) == [1, 2, 3, 4, 5, 6], f"6 buildings ranked 1..6: best={cmp_res.buildings[0].name}")

    # 13. GET /rag/ask
    r = client.get("/rag/ask", params={"q": "Can mess food waste be composted on campus?"})
    rag = RagAnswer(**r.json())
    record("/api/v1/rag/ask?q=...", "GET", r.status_code, len(rag.answer) > 0, f"Citations count: {len(rag.citations)}, abstained={rag.abstained}")

    # 14. POST /chat (SSE streaming)
    test_thread = "verify_thread_01"
    with client.stream("POST", "/chat", json={"message": "plan route for today", "thread_id": test_thread}) as sse_stream:
        lines = [line for line in sse_stream.iter_lines() if line.startswith("data:")]
    last_event_is_done = len(lines) > 0 and '"type":"done"' in lines[-1].replace(" ", "")
    record("/api/v1/chat (SSE stream)", "POST", sse_stream.status_code, last_event_is_done, f"Streamed {len(lines)} events, terminal event is done")

    # 15. POST /chat/resume (SSE streaming approval continuation)
    with client.stream("POST", "/chat/resume", json={"thread_id": test_thread, "approved": True, "decided_by": "admin"}) as sse_resume:
        resume_lines = [line for line in sse_resume.iter_lines() if line.startswith("data:")]
    resume_done = len(resume_lines) > 0 and '"type":"done"' in resume_lines[-1].replace(" ", "")
    record("/api/v1/chat/resume (SSE stream)", "POST", sse_resume.status_code, resume_done, f"Streamed {len(resume_lines)} events on resume, terminal event is done")

    # Overall Summary
    total = len(results)
    passed = sum(1 for x in results if x["ok"])
    failed = total - passed
    print("\n" + "=" * 60)
    print(f"VERIFICATION COMPLETE: {passed}/{total} endpoints passed ({failed} failures)")
    print("=" * 60)
    return failed == 0


if __name__ == "__main__":
    success = run_checks()
    sys.exit(0 if success else 1)
