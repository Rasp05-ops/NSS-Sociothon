"""OWNER: A. Real implementations. Each function mirrors a mock in main.py and MUST return the same schema.
Flip one endpoint at a time:  REAL_ENDPOINTS=forecast,routes uvicorn ...   (or USE_MOCKS=false for all)
Until implemented, a function raises NotImplementedError and the endpoint falls back to the mock automatically."""
from shared.schemas import (Bin, CompareResponse, ForecastResponse, KPIs, Reading, RoutePlanRequest, RoutePlanResponse,
                            TrendResponse)


def bins() -> list[Bin]:
    raise NotImplementedError  # TODO(A): latest reading per bin from SQLite + overflow risk from the model


def readings(bin_id: str, ts_from, ts_to) -> list[Reading]:
    raise NotImplementedError  # TODO(A)


def forecast(building_id: str, days: int) -> ForecastResponse:
    raise NotImplementedError  # TODO(A): LightGBM per building; fill wape and baseline_wape on a time-based holdout


def plan_routes(req: RoutePlanRequest) -> RoutePlanResponse:
    raise NotImplementedError  # TODO(A): OR-Tools VRP over bins with risk >= threshold; baseline_km = fixed route over ALL bins


def kpis(building_id: str | None) -> KPIs:
    raise NotImplementedError  # TODO(A)


def trends(building_id: str | None, granularity: str, days: int) -> TrendResponse:
    raise NotImplementedError  # TODO(A): SUM(weight_kg) of collected waste per day/week from readings (campus-wide if building_id is None)


def compare(days: int) -> CompareResponse:
    raise NotImplementedError  # TODO(A): per building: kg, kg_per_person_day (BUILDINGS population), wow change, segregation, recycling; rank 1 = lowest kg/person/day
