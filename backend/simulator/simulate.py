"""OWNER: A. Generates 30 days of hourly bin data + the FIXED-SCHEDULE BASELINE (every bin collected daily 06:00).
Usage: python -m backend.simulator.simulate [--days 30] [--db data/waste.db]
Rates: building kg/day = population * 0.45 * 0.45 (public-bin share), split across bins with lognormal noise,
shaped by hour-of-day, weekday and 3 random event days (fest/move-out = x2 for hostel/mess)."""
import argparse
import math
import random
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from shared.constants import (BUILDINGS, KG_PER_PERSON_PER_DAY, PUBLIC_BIN_SHARE, WASTE_DENSITY_KG_PER_L)
from shared.layout import generate_bins

HOURLY = {  # relative weight per hour 0..23
    "hostel":   [1, 1, 1, 1, 1, 2, 4, 7, 9, 6, 3, 3, 4, 4, 3, 3, 4, 5, 6, 8, 9, 9, 6, 3],
    "mess":     [0, 0, 0, 0, 0, 1, 3, 8, 10, 6, 3, 5, 9, 10, 6, 3, 3, 5, 9, 10, 8, 4, 1, 0],
    "academic": [0, 0, 0, 0, 0, 0, 1, 2, 5, 8, 9, 9, 8, 8, 9, 9, 8, 6, 3, 2, 1, 0, 0, 0],
    "library":  [0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 6, 5, 6, 7, 7, 7, 7, 6, 6, 5, 3, 1, 0],
}
WEEKEND = {"hostel": 1.10, "mess": 1.00, "academic": 0.30, "library": 0.60}


def run(days: int, db: Path, seed: int = 42):
    rng = random.Random(seed)
    end = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(days=days)
    event_days = {(start + timedelta(days=rng.randint(3, days - 2))).date() for _ in range(3)}
    bins = generate_bins()
    db.parent.mkdir(parents=True, exist_ok=True)
    if db.exists():
        db.unlink()
    con = sqlite3.connect(db)
    con.executescript(Path(__file__).parents[1].joinpath("migrations/001_init.sql").read_text())
    con.executemany("INSERT INTO bins VALUES (:bin_id,:building_id,:lat,:lon,:capacity_l,:category)", bins)
    nbins = {k: v["bins"] for k, v in BUILDINGS.items()}
    rows, cols, overflow_hours = [], [], 0
    for b in bins:
        bd = BUILDINGS[b["building_id"]]
        kind = bd["kind"]
        kg_day = bd["population"] * KG_PER_PERSON_PER_DAY * PUBLIC_BIN_SHARE / nbins[b["building_id"]]
        kg_day *= math.exp(rng.gauss(0, 0.35))          # per-bin heterogeneity
        cap_kg = b["capacity_l"] * WASTE_DENSITY_KG_PER_L
        w = HOURLY[kind]
        wsum = sum(w)
        fill = rng.uniform(2, 15)
        for i in range(days * 24):
            t = start + timedelta(hours=i)
            f = (WEEKEND[kind] if t.weekday() >= 5 else 1.0)
            if t.date() in event_days and kind in ("hostel", "mess"):
                f *= 2.0
            add_kg = kg_day * w[t.hour] / wsum * f * math.exp(rng.gauss(0, 0.15))
            fill += add_kg / cap_kg * 100
            if t.hour == 6:                                  # BASELINE: fixed daily collection of EVERY bin
                fill = 3.0
                cols.append((t.isoformat(), b["bin_id"], "baseline_fixed"))
            if fill >= 100:
                fill, overflow_hours = 100.0, overflow_hours + 1
            rows.append((t.isoformat(), b["bin_id"], round(fill, 2), round(fill / 100 * cap_kg, 2)))
    con.executemany("INSERT INTO readings VALUES (?,?,?,?)", rows)
    con.executemany("INSERT INTO collections VALUES (?,?,?)", cols)
    con.commit()
    con.close()
    print(f"{len(bins)} bins, {len(rows)} readings, {len(cols)} baseline collections, "
          f"{overflow_hours} bin-hours at 100% (baseline overflow), event days: {sorted(map(str, event_days))}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--db", default="data/waste.db")
    a = ap.parse_args()
    run(a.days, Path(a.db))
