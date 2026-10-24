"""Tests for Person A's real backend implementations against real data."""
import pytest
from datetime import datetime, timezone

from backend.app import real
from shared.constants import BUILDINGS, RISK_THRESHOLD
from shared.schemas import (
    Bin,
    CompareResponse,
    ForecastResponse,
    KPIs,
    Reading,
    RoutePlanRequest,
    RoutePlanResponse,
    TrendResponse,
)


def test_real_bins():
    bins = real.bins()
    assert len(bins) == 40
    for b in bins:
        assert isinstance(b, Bin)
        assert 0.0 <= b.risk_overflow <= 1.0
        assert 0.0 <= b.fill_pct <= 100.0
        if b.risk_overflow >= RISK_THRESHOLD:
            assert b.risk_level == "high"
        elif b.risk_overflow >= 0.4:
            assert b.risk_level == "medium"
        else:
            assert b.risk_level == "low"


def test_real_readings():
    first_bin = real.bins()[0]
    readings = real.readings(first_bin.bin_id, None, None)
    assert len(readings) > 0
    for r in readings:
        assert isinstance(r, Reading)
        assert r.bin_id == first_bin.bin_id
        assert 0.0 <= r.fill_pct <= 100.0


def test_real_forecast():
    fc = real.forecast("H01", days=7)
    assert isinstance(fc, ForecastResponse)
    assert fc.building_id == "H01"
    assert len(fc.points) == 7
    assert fc.source == "real"
    assert fc.wape is not None
    assert fc.baseline_wape is not None
    for pt in fc.points:
        assert pt.p50 >= 0
        assert pt.lower <= pt.p50 <= pt.upper


def test_real_plan_routes():
    req = RoutePlanRequest(horizon_h=12, trucks=2, risk_threshold=RISK_THRESHOLD)
    plan = real.plan_routes(req)
    assert isinstance(plan, RoutePlanResponse)
    assert plan.source == "real"
    assert plan.total_bin_count == 40
    assert plan.baseline_km > 0
    assert plan.km_saved_pct >= 0


def test_real_kpis():
    k = real.kpis()
    assert isinstance(k, KPIs)
    assert k.source == "real"
    assert k.kg_today >= 0
    assert 0 <= k.segregation_pct <= 100
    assert k.overflow_count_7d >= 0
    assert k.recycling_pct is not None and 0 <= k.recycling_pct <= 100
    assert k.waste_change_wow_pct is not None

    # Building specific KPI
    k_h01 = real.kpis("H01")
    assert k_h01.building_id == "H01"
    assert k_h01.kg_today >= 0


def test_real_trends():
    t_day = real.trends(days=14, granularity="day")
    assert isinstance(t_day, TrendResponse)
    assert t_day.granularity == "day"
    assert len(t_day.points) > 0

    t_week = real.trends(days=14, granularity="week")
    assert isinstance(t_week, TrendResponse)
    assert t_week.granularity == "week"


def test_real_compare():
    cmp_res = real.compare(days=7)
    assert isinstance(cmp_res, CompareResponse)
    assert len(cmp_res.buildings) == 6
    ranks = sorted(b.rank for b in cmp_res.buildings)
    assert ranks == [1, 2, 3, 4, 5, 6]
    for b in cmp_res.buildings:
        assert b.building_id in BUILDINGS
        assert b.kg_period > 0
        assert b.kg_per_person_day > 0
