"""OWNER: A (endpoints), C reads /openapi.json to generate TS types. Run: make backend
Every endpoint serves a FIXTURE until its real implementation in real.py exists. `source` field says which."""
import asyncio
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

from shared.constants import WorkOrderStatus
from shared.schemas import (Bin, ChatRequest, ChatResumeRequest, CompareResponse, TrendResponse, Decision, ForecastResponse, KPIs, RagAnswer, Reading,
                            RoutePlanRequest, RoutePlanResponse, TraceEvent, WorkOrder, WorkOrderCreate)
from . import real
from . import db

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

FIX = Path(__file__).resolve().parents[2] / "shared" / "fixtures"
USE_MOCKS = os.getenv("USE_MOCKS", "false").lower() == "true"
REAL = {s.strip() for s in os.getenv("REAL_ENDPOINTS", "").split(",") if s.strip()}

app = FastAPI(title="Binlytics API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def fx(name):
    return json.loads((FIX / name).read_text())


def serve(name, real_fn, mock_fn):
    """Use real impl if enabled and implemented; otherwise the mock."""
    if (not USE_MOCKS) or name in REAL:
        try:
            return real_fn()
        except NotImplementedError:
            pass
    return mock_fn()


WORK_ORDERS: dict[str, WorkOrder] = {}  # mock state; A moves to SQLite table work_orders

r = APIRouter(prefix="/api/v1")


@r.get("/health")
def health():
    return {"ok": True, "use_mocks": USE_MOCKS, "real_endpoints": sorted(REAL)}


@r.get("/bins", response_model=list[Bin])
def get_bins(building_id: str | None = None, min_risk: float = 0.0):
    data = serve("bins", lambda: real.bins(), lambda: [Bin(**b) for b in fx("bins.json")])
    return [b for b in data if (building_id is None or b.building_id == building_id) and b.risk_overflow >= min_risk]


@r.get("/bins/{bin_id}/readings", response_model=list[Reading])
def get_readings(bin_id: str, ts_from: datetime | None = Query(None, alias="from"),
                 ts_to: datetime | None = Query(None, alias="to")):
    return serve("readings", lambda: real.readings(bin_id, ts_from, ts_to),
                 lambda: [Reading(**{**x, "bin_id": bin_id}) for x in fx("readings_sample.json")])


@r.get("/forecast", response_model=ForecastResponse)
def get_forecast(building_id: str, days: int = 7):
    return serve("forecast", lambda: real.forecast(building_id, days),
                 lambda: ForecastResponse(**{**fx("forecast.json"), "building_id": building_id}))


@r.post("/routes/plan", response_model=RoutePlanResponse)
def plan(req: RoutePlanRequest):
    return serve("routes", lambda: real.plan_routes(req), lambda: RoutePlanResponse(**fx("route_plan.json")))


@r.post("/work-orders", response_model=WorkOrder)
def create_work_order(body: WorkOrderCreate):
    wo = WorkOrder(work_order_id=f"WO-{uuid.uuid4().hex[:6].upper()}", route_id=body.route_id, status=WorkOrderStatus.DRAFT,
                   created_ts=datetime.now(timezone.utc), notes=body.notes, route=body.route)
    return db.insert_work_order(wo)


@r.get("/work-orders", response_model=list[WorkOrder])
def list_work_orders(status: str | None = None):
    return db.list_work_orders(status)


def _decide(wo_id: str, d: Decision, status: WorkOrderStatus):
    wo = db.get_work_order(wo_id)
    if not wo:
        raise HTTPException(404, "work order not found")
    wo.status, wo.decided_by, wo.notes = status, d.decided_by, d.comment or wo.notes
    return db.update_work_order(wo)


@r.post("/work-orders/{wo_id}/approve", response_model=WorkOrder)
def approve(wo_id: str, d: Decision = Decision(approved=True)):
    return _decide(wo_id, d, WorkOrderStatus.APPROVED)


@r.post("/work-orders/{wo_id}/reject", response_model=WorkOrder)
def reject(wo_id: str, d: Decision = Decision(approved=False)):
    return _decide(wo_id, d, WorkOrderStatus.REJECTED)


@r.get("/kpis", response_model=KPIs)
def get_kpis(building_id: str | None = None):
    return serve("kpis", lambda: real.kpis(building_id), lambda: KPIs(**{**fx("kpis.json"), "building_id": building_id}))


@r.get("/trends", response_model=TrendResponse)
def get_trends(building_id: str | None = None, granularity: str = "day", days: int = 30):
    return serve("trends", lambda: real.trends(building_id, granularity, days),
                 lambda: TrendResponse(**{**fx("trends.json"), "building_id": building_id, "granularity": granularity}))


@r.get("/compare", response_model=CompareResponse)
def get_compare(days: int = 7):
    return serve("compare", lambda: real.compare(days), lambda: CompareResponse(**fx("compare.json")))


@r.get("/rag/ask", response_model=RagAnswer)
def rag_ask(q: str):
    """B wires agents.rag.interface.answer here (import inside the function to keep backend importable without ML deps)."""
    try:
        from agents.rag.interface import answer
        return answer(q)
    except NotImplementedError:
        return RagAnswer(**{**fx("rag_answer.json"), "question": q})


async def _stream_chat_sse(message: str, thread_id: str = "default", resume: dict | None = None):
    done_emitted = False
    try:
        import agents.graph as G
        from agents.runner import stream_chat
        from fastapi.testclient import TestClient

        if G.http is None:
            G.http = TestClient(app, base_url="http://testserver/api/v1")

        for event in stream_chat(message=message, thread_id=thread_id, resume=resume):
            if event.type == "done":
                done_emitted = True
            yield f"data: {event.model_dump_json()}\n\n"
            await asyncio.sleep(0.02)
    except Exception as exc:
        error_ev = TraceEvent(
            trace_id=f"T-{uuid.uuid4().hex[:6].upper()}",
            ts=datetime.now(timezone.utc),
            agent="system",
            type="error",
            payload={"message": str(exc)},
        )
        yield f"data: {error_ev.model_dump_json()}\n\n"

    # Ensure the terminal 'done' event is always sent
    if not done_emitted:
        done_ev = TraceEvent(
            trace_id=f"T-{uuid.uuid4().hex[:6].upper()}",
            ts=datetime.now(timezone.utc),
            agent="system",
            type="done",
            payload={},
        )
        yield f"data: {done_ev.model_dump_json()}\n\n"


@r.post("/chat")
async def chat(req: ChatRequest):
    """SSE stream of TraceEvent. Runs LangGraph agents via stream_chat with fallback to fixtures."""
    return StreamingResponse(
        _stream_chat_sse(message=req.message, thread_id=req.thread_id),
        media_type="text/event-stream",
    )


@r.post("/chat/resume")
async def chat_resume(req: ChatResumeRequest):
    """Resume an interrupted LangGraph cycle (e.g. human approval) and stream TraceEvents until done."""
    decision_payload = {
        "approved": req.approved,
        "decided_by": req.decided_by,
    }
    if req.comment:
        decision_payload["comment"] = req.comment
    return StreamingResponse(
        _stream_chat_sse(message="", thread_id=req.thread_id, resume=decision_payload),
        media_type="text/event-stream",
    )


app.include_router(r)
