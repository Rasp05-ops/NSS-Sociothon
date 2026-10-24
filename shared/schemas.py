"""Pydantic v2 models = the API/MCP/agent contract. DO NOT redefine these elsewhere.
Changing a field? Edit here, update CONTEXT.md + fixtures (`make fixtures`), tell the team, then change code."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from .constants import RiskLevel, WasteCategory, WorkOrderStatus


class Bin(BaseModel):
    bin_id: str                       # "H01-03"
    building_id: str                  # "H01"
    lat: float
    lon: float
    capacity_l: int
    category: WasteCategory
    fill_pct: float = Field(ge=0, le=100)
    risk_overflow: float = Field(ge=0, le=1, description="P(overflow within horizon)")
    risk_level: RiskLevel
    last_reading_ts: datetime


class Reading(BaseModel):
    ts: datetime
    bin_id: str
    fill_pct: float = Field(ge=0, le=100)
    weight_kg: float = Field(ge=0)


class ForecastPoint(BaseModel):
    ts: datetime
    p50: float                        # kg expected in that hour/day bucket
    lower: float
    upper: float


class ForecastResponse(BaseModel):
    building_id: str
    unit: Literal["kg"] = "kg"
    granularity: Literal["hour", "day"] = "day"
    points: list[ForecastPoint]
    wape: Optional[float] = None            # model error on holdout
    baseline_wape: Optional[float] = None   # seasonal-naive error on same holdout
    source: Literal["mock", "real"] = "real"


class RoutePlanRequest(BaseModel):
    horizon_h: int = 12
    trucks: int = 2
    risk_threshold: float = 0.7


class RouteStop(BaseModel):
    seq: int
    bin_id: str
    building_id: str
    lat: float
    lon: float
    eta_min: int
    expected_fill_pct: float


class Route(BaseModel):
    route_id: str
    truck_id: str
    stops: list[RouteStop]
    km: float
    est_min: int


class RoutePlanResponse(BaseModel):
    routes: list[Route]
    total_km: float
    baseline_km: float                # fixed daily route over ALL bins
    km_saved_pct: float
    flagged_bin_count: int
    total_bin_count: int
    source: Literal["mock", "real"] = "real"


class WorkOrderCreate(BaseModel):
    route_id: str
    notes: Optional[str] = None
    route: Optional[Route] = None      # snapshot, so approval does not depend on plan cache


class WorkOrder(BaseModel):
    work_order_id: str
    route_id: str
    status: WorkOrderStatus
    created_ts: datetime
    decided_by: Optional[str] = None
    notes: Optional[str] = None
    route: Optional[Route] = None


class Decision(BaseModel):
    approved: bool
    comment: Optional[str] = None
    decided_by: str = "admin"


class KPIs(BaseModel):
    building_id: Optional[str] = None  # None = campus-wide
    kg_today: float
    segregation_pct: float
    overflow_count_7d: int
    km_saved_pct: Optional[float] = None
    recycling_pct: Optional[float] = None          # (dry+paper+plastic kg) / total kg * 100
    waste_change_wow_pct: Optional[float] = None   # this 7d vs previous 7d, negative = reduction
    kg_per_person_day: Optional[float] = None
    source: Literal["mock", "real"] = "real"


class TrendPoint(BaseModel):
    ts: datetime                       # start of the day/week bucket (UTC)
    kg: float


class TrendResponse(BaseModel):
    building_id: Optional[str] = None  # None = campus-wide
    granularity: Literal["day", "week"] = "day"
    unit: Literal["kg"] = "kg"
    points: list[TrendPoint]
    source: Literal["mock", "real"] = "real"


class BuildingComparison(BaseModel):
    building_id: str
    name: str
    kind: str                          # hostel | mess | academic | library
    kg_period: float
    kg_per_person_day: float
    wow_change_pct: float              # negative = reduction
    segregation_pct: float
    recycling_pct: float
    rank: int                          # 1 = lowest kg_per_person_day (best)


class CompareResponse(BaseModel):
    period_days: int = 7
    buildings: list[BuildingComparison]
    source: Literal["mock", "real"] = "real"


class Citation(BaseModel):
    doc_id: str
    title: str
    clause: Optional[str] = None
    snippet: str                       # <= 300 chars
    score: float


class RagAnswer(BaseModel):
    question: str
    answer: str
    citations: list[Citation]
    abstained: bool = False            # True when retrieval confidence is below threshold


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"


class ChatResumeRequest(BaseModel):
    thread_id: str = "default"
    approved: bool = True
    decided_by: str = "admin"
    comment: Optional[str] = None


class TraceEvent(BaseModel):
    """One SSE `data:` line. The UI renders these as the live agent trace."""
    trace_id: str
    ts: datetime
    agent: str                         # AgentName value
    type: Literal["tool_call", "tool_result", "message", "approval_request", "error", "done"]
    payload: dict[str, Any] = {}
