"""OWNER: A. Real implementations. Each function mirrors a mock in main.py and MUST return the same schema.
Flip one endpoint at a time:  REAL_ENDPOINTS=forecast,routes uvicorn ...   (or USE_MOCKS=false for all)
Until implemented, a function raises NotImplementedError and the endpoint falls back to the mock automatically."""
from datetime import datetime, timedelta, timezone
from typing import Optional

import numpy as np
import pandas as pd

from shared.constants import (
    BUILDINGS,
    KG_PER_PERSON_PER_DAY,
    PUBLIC_BIN_SHARE,
    RISK_THRESHOLD,
    WasteCategory,
)
from shared.schemas import (
    Bin,
    BuildingComparison,
    CompareResponse,
    ForecastResponse,
    KPIs,
    Reading,
    RoutePlanRequest,
    RoutePlanResponse,
    TrendPoint,
    TrendResponse,
)
from .db import get_connection
from .forecast import generate_forecast
from .risk import compute_all_bin_risks
from .routing import plan_routes_ortools


def bins() -> list[Bin]:
    """Returns all 40 bins with latest fill_pct and computed overflow risk from the model."""
    con = get_connection()
    try:
        query = """
            SELECT b.bin_id, b.building_id, b.lat, b.lon, b.capacity_l, b.category,
                   r.fill_pct, r.ts as last_reading_ts
            FROM bins b
            LEFT JOIN readings r ON b.bin_id = r.bin_id
              AND r.ts = (SELECT MAX(r2.ts) FROM readings r2 WHERE r2.bin_id = b.bin_id)
            ORDER BY b.bin_id
        """
        rows = con.execute(query).fetchall()
        risks = compute_all_bin_risks(horizon_h=12)
    finally:
        con.close()

    result = []
    for r in rows:
        bid = r["bin_id"]
        risk, level = risks.get(bid, (0.0, "low"))
        last_ts = (
            datetime.fromisoformat(r["last_reading_ts"])
            if r["last_reading_ts"]
            else datetime.now(timezone.utc)
        )
        fill = float(r["fill_pct"]) if r["fill_pct"] is not None else 0.0
        result.append(
            Bin(
                bin_id=bid,
                building_id=r["building_id"],
                lat=float(r["lat"]),
                lon=float(r["lon"]),
                capacity_l=int(r["capacity_l"]),
                category=WasteCategory(r["category"]),
                fill_pct=round(fill, 1),
                risk_overflow=risk,
                risk_level=level,
                last_reading_ts=last_ts,
            )
        )
    return result


def readings(bin_id: str, ts_from: Optional[datetime], ts_to: Optional[datetime]) -> list[Reading]:
    """Historical readings for a specific bin within optional ts_from and ts_to bounds."""
    con = get_connection()
    try:
        sql = "SELECT ts, bin_id, fill_pct, weight_kg FROM readings WHERE bin_id = ?"
        params = [bin_id]
        if ts_from:
            sql += " AND ts >= ?"
            params.append(ts_from.isoformat())
        if ts_to:
            sql += " AND ts <= ?"
            params.append(ts_to.isoformat())
        sql += " ORDER BY ts ASC"

        rows = con.execute(sql, params).fetchall()
    finally:
        con.close()

    return [
        Reading(
            ts=datetime.fromisoformat(r["ts"]),
            bin_id=r["bin_id"],
            fill_pct=float(r["fill_pct"]),
            weight_kg=float(r["weight_kg"]),
        )
        for r in rows
    ]


def forecast(building_id: str, days: int = 7) -> ForecastResponse:
    """Daily waste forecast per building using LightGBM model and holdout validation."""
    return generate_forecast(building_id=building_id, days=days)


def plan_routes(req: RoutePlanRequest) -> RoutePlanResponse:
    """Plans dynamic collection routes over bins exceeding the risk threshold using OR-Tools."""
    all_bins = bins()
    flagged = [b for b in all_bins if b.risk_overflow >= req.risk_threshold]
    return plan_routes_ortools(flagged_bins=flagged, all_bins=all_bins, req=req)


def _get_daily_waste_df(building_id: Optional[str] = None) -> pd.DataFrame:
    con = get_connection()
    try:
        sql = """
            SELECT r.ts, r.bin_id, b.building_id, b.category, r.weight_kg 
            FROM readings r 
            JOIN bins b ON r.bin_id = b.bin_id 
        """
        params = []
        if building_id:
            sql += " WHERE b.building_id = ?"
            params.append(building_id)
        sql += " ORDER BY r.bin_id, r.ts"
        df = pd.read_sql(sql, con, params=params)
    finally:
        con.close()

    if df.empty:
        return pd.DataFrame()

    df["ts"] = pd.to_datetime(df["ts"], utc=True)
    df["prev_wt"] = df.groupby("bin_id")["weight_kg"].shift(1)
    df["delta"] = df["weight_kg"] - df["prev_wt"]
    df["add_kg"] = df["delta"].apply(lambda x: x if x > 0 else 0.0)
    df["date"] = df["ts"].dt.date
    return df


def kpis(building_id: Optional[str] = None) -> KPIs:
    """Calculates real KPIs (kg_today, segregation_pct, overflow_count_7d, recycling_pct, wow change)."""
    df = _get_daily_waste_df(building_id)
    current_plan = plan_routes(RoutePlanRequest(risk_threshold=RISK_THRESHOLD))
    con = get_connection()
    try:
        # Count overflow incidents (transitions into 100%), not every saturated hour.
        # Find latest timestamp in readings
        max_ts_row = con.execute("SELECT MAX(ts) FROM readings").fetchone()
        if max_ts_row and max_ts_row[0]:
            max_ts = datetime.fromisoformat(max_ts_row[0])
            start_7d = max_ts - timedelta(days=7)
            sql_ovf = """
                SELECT r.ts, r.bin_id, r.fill_pct
                FROM readings r
                JOIN bins b ON r.bin_id = b.bin_id
                WHERE r.ts >= ? {building_filter}
                ORDER BY r.bin_id, r.ts
            """.format(building_filter="AND b.building_id = ?" if building_id else "")
            params = [start_7d.isoformat()] + ([building_id] if building_id else [])
            overflow_rows = con.execute(sql_ovf, params).fetchall()
            ovf_count = 0
            previous = {}
            for row in overflow_rows:
                was_overflowing = previous.get(row["bin_id"], False)
                is_overflowing = float(row["fill_pct"]) >= 100.0
                if is_overflowing and not was_overflowing:
                    ovf_count += 1
                previous[row["bin_id"]] = is_overflowing
        else:
            ovf_count = 0

        # Segregation audit
        audits_sql = "SELECT AVG(correct_pct) FROM segregation_audits"
        audits_params = []
        if building_id:
            audits_sql += " WHERE building_id = ?"
            audits_params.append(building_id)
        avg_audit = con.execute(audits_sql, audits_params).fetchone()[0]
        seg_pct = round(float(avg_audit), 1) if avg_audit is not None else 0.0
    finally:
        con.close()

    if df.empty:
        return KPIs(
            building_id=building_id,
            kg_today=0.0,
            segregation_pct=seg_pct,
            overflow_count_7d=ovf_count,
            km_saved_pct=current_plan.km_saved_pct,
            recycling_pct=0.0,
            waste_change_wow_pct=0.0,
            kg_per_person_day=0.0,
            source="real",
        )

    daily_totals = df.groupby("date")["add_kg"].sum().sort_index()
    latest_ts = df["ts"].max()
    kg_today = round(float(df.loc[df["ts"] > latest_ts - pd.Timedelta(hours=24), "add_kg"].sum()), 1)

    # Week over week waste change
    if len(daily_totals) >= 14:
        last_7d = float(daily_totals.iloc[-7:].sum())
        prev_7d = float(daily_totals.iloc[-14:-7].sum())
        wow_change = round(((last_7d - prev_7d) / prev_7d) * 100, 1) if prev_7d > 0 else 0.0
    else:
        wow_change = 0.0

    # Recycling pct: (dry + paper + plastic) / total
    total_kg = float(df["add_kg"].sum())
    recyclable_kg = float(df[df["category"].isin(["dry", "paper", "plastic"])]["add_kg"].sum())
    recycling_pct = round((recyclable_kg / total_kg) * 100, 1) if total_kg > 0 else 0.0

    # Kg per person per day
    if building_id and building_id in BUILDINGS:
        pop = BUILDINGS[building_id]["population"]
        kpp = round((last_7d / (pop * 7)), 3) if len(daily_totals) >= 7 else 0.0
    else:
        campus_pop = sum(b["population"] for b in BUILDINGS.values())
        kpp = round((last_7d / (campus_pop * 7)), 3) if len(daily_totals) >= 7 else 0.0

    # KM saved from current route plan
    return KPIs(
        building_id=building_id,
        kg_today=kg_today,
        segregation_pct=seg_pct,
        overflow_count_7d=ovf_count,
        km_saved_pct=current_plan.km_saved_pct,
        recycling_pct=recycling_pct,
        waste_change_wow_pct=wow_change,
        kg_per_person_day=kpp,
        source="real",
    )


def trends(building_id: Optional[str] = None, granularity: str = "day", days: int = 30) -> TrendResponse:
    """SUM(weight_kg) of waste collected/generated per day/week from readings."""
    df = _get_daily_waste_df(building_id)
    if df.empty:
        return TrendResponse(building_id=building_id, granularity=granularity, points=[], source="real")

    daily = df.groupby("date")["add_kg"].sum().reset_index()
    daily["ts"] = pd.to_datetime(daily["date"], utc=True)
    daily = daily.sort_values("ts").tail(days)

    if granularity == "week":
        daily["week_start"] = daily["ts"].apply(lambda t: t - timedelta(days=t.weekday()))
        weekly = daily.groupby("week_start")["add_kg"].sum().reset_index()
        points = [
            TrendPoint(
                ts=row["week_start"].to_pydatetime().replace(tzinfo=timezone.utc),
                kg=round(float(row["add_kg"]), 1),
            )
            for _, row in weekly.iterrows()
        ]
    else:
        points = [
            TrendPoint(
                ts=row["ts"].to_pydatetime().replace(tzinfo=timezone.utc),
                kg=round(float(row["add_kg"]), 1),
            )
            for _, row in daily.iterrows()
        ]

    return TrendResponse(
        building_id=building_id,
        granularity=granularity,
        unit="kg",
        points=points,
        source="real",
    )


def compare(days: int = 7) -> CompareResponse:
    """Per building comparison: kg, kg_per_person_day, wow change, segregation, recycling, ranked 1..6."""
    comps = []
    con = get_connection()
    try:
        max_ts_row = con.execute("SELECT MAX(ts) FROM readings").fetchone()
        max_ts = datetime.fromisoformat(max_ts_row[0]) if max_ts_row and max_ts_row[0] else datetime.now(timezone.utc)
    finally:
        con.close()

    period_start = max_ts - timedelta(days=days)
    prev_period_start = period_start - timedelta(days=days)

    audit_con = get_connection()
    try:
        for bid, binfo in BUILDINGS.items():
            b_df = _get_daily_waste_df(bid)
            if not b_df.empty:
                period_df = b_df[(b_df["ts"] >= period_start) & (b_df["ts"] <= max_ts)]
                prev_df = b_df[(b_df["ts"] >= prev_period_start) & (b_df["ts"] < period_start)]

                kg_period = round(float(period_df["add_kg"].sum()), 1)
                kg_prev = float(prev_df["add_kg"].sum())
                wow = round(((kg_period - kg_prev) / kg_prev) * 100, 1) if kg_prev > 0 else 0.0

                rec_kg = float(period_df[period_df["category"].isin(["dry", "paper", "plastic"])]["add_kg"].sum())
                recycling_pct = round((rec_kg / kg_period) * 100, 1) if kg_period > 0 else 0.0
            else:
                kg_period = round(binfo["population"] * KG_PER_PERSON_PER_DAY * PUBLIC_BIN_SHARE * days, 1)
                wow = 0.0
                recycling_pct = 0.0

            kg_per_person_day = round(kg_period / (binfo["population"] * days), 3)
            audit_sql = "SELECT AVG(correct_pct) FROM segregation_audits WHERE building_id = ?"
            audit_value = audit_con.execute(audit_sql, (bid,)).fetchone()[0]
            seg_pct = round(float(audit_value), 1) if audit_value is not None else 0.0

            comps.append(
            {
                "building_id": bid,
                "name": binfo["name"],
                "kind": binfo["kind"],
                "kg_period": kg_period,
                "kg_per_person_day": kg_per_person_day,
                "wow_change_pct": wow,
                "segregation_pct": seg_pct,
                "recycling_pct": recycling_pct,
            }
            )
    finally:
        audit_con.close()

    # Sort by kg_per_person_day ascending: rank 1 = lowest (best)
    sorted_comps = sorted(comps, key=lambda c: c["kg_per_person_day"])
    for rank_idx, c in enumerate(sorted_comps, start=1):
        c["rank"] = rank_idx

    return CompareResponse(
        period_days=days,
        buildings=[BuildingComparison(**c) for c in sorted_comps],
        source="real",
    )
