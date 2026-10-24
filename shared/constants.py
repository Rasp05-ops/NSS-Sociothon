"""SINGLE SOURCE OF TRUTH for enums, IDs and numeric conventions.
Mirror every change in shared/constants.ts (same PR). Never hardcode these elsewhere."""
from enum import Enum


class WasteCategory(str, Enum):
    WET = "wet"
    DRY = "dry"
    PAPER = "paper"
    PLASTIC = "plastic"
    EWASTE = "ewaste"
    HAZARDOUS = "hazardous"


class WorkOrderStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"


class RiskLevel(str, Enum):
    LOW = "low"        # P(overflow in horizon) < 0.4
    MEDIUM = "medium"  # 0.4 <= p < 0.7
    HIGH = "high"      # p >= 0.7  (== flagged for collection)


class AgentName(str, Enum):
    PLANNER = "planner"
    CRITIC = "critic"
    DISPATCHER = "dispatcher"
    RAG = "rag"
    SYSTEM = "system"


# --- Conventions (units are NOT negotiable) ---
RISK_THRESHOLD = 0.7          # flag bin if P(overflow within horizon) >= this
DEFAULT_HORIZON_H = 12
DEFAULT_TRUCKS = 2
TRUCK_SHIFT_MIN = 240         # max minutes per route (Critic checks this)
TRUCK_CAPACITY_KG = 120       # maximum collected waste per truck per shift
MAX_STOPS_PER_ROUTE = 20      # Critic checks this
WASTE_DENSITY_KG_PER_L = 0.12  # used by simulator: kg = fill_pct/100 * capacity_l * density
TZ_DISPLAY = "Asia/Kolkata"   # DB/API are ALWAYS UTC; convert only in the UI

# --- Campus layout (synthetic but calibrated: ~0.45 kg/person/day, ~45% lands in public bins) ---
# kind: hostel | mess | academic | library
BUILDINGS = {
    "H01":    {"name": "Hostel 1",       "kind": "hostel",   "population": 500, "bins": 7, "lat": 29.8660, "lon": 77.8960},
    "H02":    {"name": "Hostel 2",       "kind": "hostel",   "population": 450, "bins": 7, "lat": 29.8645, "lon": 77.8985},
    "H03":    {"name": "Hostel 3",       "kind": "hostel",   "population": 400, "bins": 7, "lat": 29.8630, "lon": 77.8950},
    "ACAD01": {"name": "Academic Block", "kind": "academic", "population": 450, "bins": 6, "lat": 29.8655, "lon": 77.8975},
    "MESS01": {"name": "Central Mess",   "kind": "mess",     "population": 800, "bins": 8, "lat": 29.8650, "lon": 77.8965},
    "LIB01":  {"name": "Library",        "kind": "library",  "population": 300, "bins": 5, "lat": 29.8640, "lon": 77.8970},
}
DEPOT = {"name": "Waste Depot", "lat": 29.8610, "lon": 77.9000}
KG_PER_PERSON_PER_DAY = 0.45
PUBLIC_BIN_SHARE = 0.45
BIN_CAPACITY_L = 240
