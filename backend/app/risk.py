"""Overflow risk engine.
Estimates P(overflow within horizon_h) for campus waste bins using Monte-Carlo simulation.
Conforms to A4 in docs/FEATURES.md (<300 ms for all 40 bins)."""
import time
from datetime import datetime, timezone
from typing import Dict, Tuple

import numpy as np
import pandas as pd

from shared.constants import RISK_THRESHOLD, RiskLevel
from .db import get_connection

_STATS_CACHE: Dict[str, Tuple[float, dict]] = {}
CACHE_TTL_SEC = 300  # 5 minutes


def get_hourly_delta_stats(con=None) -> dict:
    """Computes mean and std of positive hourly fill increments for each (bin_id, hour)."""
    now = time.time()
    if "stats" in _STATS_CACHE and (now - _STATS_CACHE["stats"][0]) < CACHE_TTL_SEC:
        return _STATS_CACHE["stats"][1]

    close_con = False
    if con is None:
        con = get_connection()
        close_con = True

    try:
        # Load readings ordered by bin and timestamp
        df = pd.read_sql("SELECT ts, bin_id, fill_pct FROM readings ORDER BY bin_id, ts", con)
    finally:
        if close_con:
            con.close()

    if df.empty:
        return {}

    df["ts"] = pd.to_datetime(df["ts"], utc=True)
    df["hour"] = df["ts"].dt.hour
    df["prev_fill"] = df.groupby("bin_id")["fill_pct"].shift(1)
    df["delta"] = df["fill_pct"] - df["prev_fill"]

    # Filter out emptyings/collections (negative deltas)
    positive_deltas = df[df["delta"] >= 0]
    grouped = positive_deltas.groupby(["bin_id", "hour"])["delta"].agg(["mean", "std"])

    stats_dict = {}
    for (bin_id, hour), row in grouped.iterrows():
        m = float(row["mean"]) if not np.isnan(row["mean"]) else 1.5
        s = float(row["std"]) if not np.isnan(row["std"]) else 0.5
        stats_dict[(bin_id, int(hour))] = (m, max(0.1, s))

    _STATS_CACHE["stats"] = (now, stats_dict)
    return stats_dict


def calculate_bin_overflow_risk(
    bin_id: str,
    current_fill: float,
    current_hour: int,
    horizon_h: int = 12,
    num_simulations: int = 200,
    stats: dict = None,
) -> float:
    """Simulates forward horizon_h hours to calculate probability of fill >= 100%."""
    if current_fill >= 100.0:
        return 1.0

    if stats is None:
        stats = get_hourly_delta_stats()

    sim_fills = np.full(num_simulations, current_fill, dtype=np.float64)
    has_overflowed = np.zeros(num_simulations, dtype=bool)

    for step in range(horizon_h):
        target_hour = (current_hour + 1 + step) % 24
        mean, std = stats.get((bin_id, target_hour), (2.0, 0.5))
        # Positive random normal increments
        increments = np.maximum(0.0, np.random.normal(mean, std, num_simulations))
        sim_fills += increments
        has_overflowed |= (sim_fills >= 100.0)

    risk = float(np.mean(has_overflowed))
    return round(float(np.clip(risk, 0.0, 1.0)), 2)


def get_risk_level(risk: float) -> RiskLevel:
    if risk >= RISK_THRESHOLD:
        return RiskLevel.HIGH
    if risk >= 0.4:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def compute_all_bin_risks(horizon_h: int = 12, num_simulations: int = 200) -> Dict[str, Tuple[float, RiskLevel]]:
    """Calculates risk and risk level for all 40 bins."""
    con = get_connection()
    try:
        latest_df = pd.read_sql(
            """
            SELECT b.bin_id, r.fill_pct, r.ts 
            FROM bins b 
            JOIN readings r ON b.bin_id = r.bin_id 
            WHERE r.ts = (SELECT MAX(r2.ts) FROM readings r2 WHERE r2.bin_id = b.bin_id)
            """,
            con,
        )
        stats = get_hourly_delta_stats(con)
    finally:
        con.close()

    results = {}
    for _, row in latest_df.iterrows():
        bid = row["bin_id"]
        fill = float(row["fill_pct"])
        ts = pd.to_datetime(row["ts"], utc=True)
        hour = ts.hour
        risk = calculate_bin_overflow_risk(
            bin_id=bid,
            current_fill=fill,
            current_hour=hour,
            horizon_h=horizon_h,
            num_simulations=num_simulations,
            stats=stats,
        )
        results[bid] = (risk, get_risk_level(risk))

    return results
