"""Regenerates shared/fixtures/*.json from the schemas (validated). Run: make fixtures
Fixtures are what mocks serve (USE_MOCKS=true) and what tests/UI use before real models exist."""
import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .constants import BUILDINGS, DEPOT, KG_PER_PERSON_PER_DAY, PUBLIC_BIN_SHARE, RISK_THRESHOLD
from .layout import generate_bins
from .schemas import (Bin, BuildingComparison, CompareResponse, TrendPoint, TrendResponse, ForecastPoint, ForecastResponse, KPIs, RagAnswer, Citation, Reading,
                      Route, RoutePlanResponse, RouteStop, TraceEvent, WorkOrder)

OUT = Path(__file__).parent / "fixtures"
NOW = datetime(2026, 10, 24, 6, 0, tzinfo=timezone.utc)  # fixed so fixtures are stable
rng = random.Random(11)


def hav(a, b):
    R = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dl, dp = math.radians(b[1] - a[1]), p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def level(p):
    return "high" if p >= RISK_THRESHOLD else "medium" if p >= 0.4 else "low"


def dump(name, obj):
    data = [o.model_dump(mode="json") for o in obj] if isinstance(obj, list) else obj.model_dump(mode="json")
    (OUT / name).write_text(json.dumps(data, indent=2))


def route_from(bins, truck, rid):
    pts, cur, km, t, seq, stops = list(bins), (DEPOT["lat"], DEPOT["lon"]), 0.0, 0, 1, []
    while pts:
        nxt = min(pts, key=lambda b: hav(cur, (b.lat, b.lon)))
        pts.remove(nxt)
        d = hav(cur, (nxt.lat, nxt.lon))
        km, t = km + d, t + int(d / 15 * 60) + 4  # 15 km/h in campus + 4 min per stop
        stops.append(RouteStop(seq=seq, bin_id=nxt.bin_id, building_id=nxt.building_id, lat=nxt.lat,
                               lon=nxt.lon, eta_min=t, expected_fill_pct=min(100, nxt.fill_pct + 8)))
        cur, seq = (nxt.lat, nxt.lon), seq + 1
    km += hav(cur, (DEPOT["lat"], DEPOT["lon"]))
    return Route(route_id=rid, truck_id=truck, stops=stops, km=round(km, 2), est_min=t + 8)


def main():
    OUT.mkdir(exist_ok=True)
    bins = []
    for b in generate_bins():
        base = {"MESS01": 62, "H01": 55, "H02": 48}.get(b["building_id"], 35)
        fill = max(2, min(100, rng.gauss(base, 22)))
        p = max(0, min(1, (fill - 45) / 55 + rng.uniform(-0.05, 0.05)))
        bins.append(Bin(**b, fill_pct=round(fill, 1), risk_overflow=round(p, 2), risk_level=level(p),
                        last_reading_ts=NOW))
    dump("bins.json", bins)

    readings = [Reading(ts=NOW - timedelta(hours=23 - i), bin_id="H01-01", fill_pct=round(min(100, 8 + i * 3.4), 1),
                        weight_kg=round((8 + i * 3.4) / 100 * 240 * 0.12, 2)) for i in range(24)]
    dump("readings_sample.json", readings)

    pts = []
    for d in range(7):
        m = 150 * (1.15 if d % 7 in (5, 6) else 1.0)
        pts.append(ForecastPoint(ts=NOW + timedelta(days=d), p50=round(m, 1), lower=round(m * .88, 1), upper=round(m * 1.14, 1)))
    dump("forecast.json", ForecastResponse(building_id="H01", points=pts, wape=0.11, baseline_wape=0.19, source="mock"))

    flagged = sorted([b for b in bins if b.risk_overflow >= RISK_THRESHOLD], key=lambda b: b.lon)
    half = len(flagged) // 2 or 1
    routes = [route_from(flagged[:half], "T1", "R-MOCK-1"), route_from(flagged[half:], "T2", "R-MOCK-2")]
    routes = [r for r in routes if r.stops]
    total = round(sum(r.km for r in routes), 2)
    baseline = round(total * 2.3, 2)
    dump("route_plan.json", RoutePlanResponse(routes=routes, total_km=total, baseline_km=baseline,
         km_saved_pct=round((1 - total / baseline) * 100, 1), flagged_bin_count=len(flagged),
         total_bin_count=len(bins), source="mock"))
    dump("work_order.json", WorkOrder(work_order_id="WO-MOCK-1", route_id=routes[0].route_id, status="DRAFT",
                                      created_ts=NOW, route=routes[0]))
    dump("kpis.json", KPIs(kg_today=412.6, segregation_pct=71.4, overflow_count_7d=9, km_saved_pct=57.0,
                           recycling_pct=38.2, waste_change_wow_pct=-4.3, kg_per_person_day=0.21, source="mock"))
    base = sum(b["population"] for b in BUILDINGS.values()) * KG_PER_PERSON_PER_DAY * PUBLIC_BIN_SHARE
    tp = [TrendPoint(ts=NOW - timedelta(days=29 - i),
                     kg=round(base * (1.12 if (NOW - timedelta(days=29 - i)).weekday() >= 5 else 1.0) * rng.uniform(.92, 1.08), 1))
          for i in range(30)]
    dump("trends.json", TrendResponse(points=tp, granularity="day", source="mock"))
    comps = []
    for bid, b in BUILDINGS.items():
        kpp = round(KG_PER_PERSON_PER_DAY * PUBLIC_BIN_SHARE * rng.uniform(.8, 1.3), 3)
        comps.append(dict(building_id=bid, name=b["name"], kind=b["kind"], kg_period=round(kpp * b["population"] * 7, 1),
                          kg_per_person_day=kpp, wow_change_pct=round(rng.uniform(-9, 6), 1),
                          segregation_pct=round(rng.uniform(55, 88), 1), recycling_pct=round(rng.uniform(22, 55), 1)))
    for i, c in enumerate(sorted(comps, key=lambda c: c["kg_per_person_day"]), 1):
        c["rank"] = i
    dump("compare.json", CompareResponse(period_days=7, buildings=[BuildingComparison(**c) for c in comps], source="mock"))
    dump("rag_answer.json", RagAnswer(
        question="Can mess food waste be composted on campus?",
        answer="MOCK ANSWER. Replace with a grounded answer that cites clauses from the indexed rules.",
        citations=[Citation(doc_id="swm-rules-2016", title="Solid Waste Management Rules, 2016",
                            clause="TODO", snippet="MOCK snippet.", score=0.0)]))
    ev = lambda i, a, t, p: TraceEvent(trace_id="T-MOCK", ts=NOW + timedelta(seconds=i), agent=a, type=t, payload=p)
    dump("trace_events.json", [
        ev(0, "planner", "tool_call", {"tool": "plan_routes", "args": {"horizon_h": 12, "trucks": 2}}),
        ev(1, "planner", "tool_result", {"tool": "plan_routes", "summary": f"{len(routes)} routes, {total} km"}),
        ev(2, "critic", "message", {"text": "Route R-MOCK-1 within shift limit. OK."}),
        ev(3, "dispatcher", "approval_request", {"route_id": routes[0].route_id}),
        ev(4, "system", "done", {})])
    print(f"fixtures written to {OUT} ({len(bins)} bins, {len(flagged)} flagged)")


if __name__ == "__main__":
    main()
