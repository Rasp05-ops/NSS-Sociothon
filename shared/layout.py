"""Deterministic bin layout. Simulator, fixtures and tests ALL use this, so IDs always match."""
import random

from .constants import BIN_CAPACITY_L, BUILDINGS, WasteCategory

_CATS = {
    "hostel": [WasteCategory.WET, WasteCategory.DRY, WasteCategory.PLASTIC],
    "mess": [WasteCategory.WET, WasteCategory.WET, WasteCategory.DRY],
    "academic": [WasteCategory.DRY, WasteCategory.PAPER, WasteCategory.PLASTIC],
    "library": [WasteCategory.PAPER, WasteCategory.DRY],
}


def generate_bins(seed: int = 7) -> list[dict]:
    rng = random.Random(seed)
    out = []
    for bid, b in BUILDINGS.items():
        cats = _CATS[b["kind"]]
        for i in range(1, b["bins"] + 1):
            out.append({
                "bin_id": f"{bid}-{i:02d}",
                "building_id": bid,
                "lat": round(b["lat"] + rng.uniform(-0.0004, 0.0004), 6),
                "lon": round(b["lon"] + rng.uniform(-0.0004, 0.0004), 6),
                "capacity_l": BIN_CAPACITY_L,
                "category": cats[(i - 1) % len(cats)].value,
            })
    return out
