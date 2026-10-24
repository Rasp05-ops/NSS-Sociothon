"""Database connection and queries for SQLite at data/waste.db."""
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from shared.constants import WorkOrderStatus
from shared.schemas import Route, WorkOrder

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def get_db_path() -> Path:
    env_path = os.getenv("DB_PATH", "data/waste.db")
    p = Path(env_path)
    if not p.is_absolute():
        p = PROJECT_ROOT / p
    return p


def get_connection() -> sqlite3.Connection:
    path = get_db_path()
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    # Ensure tables exist
    init_sql = PROJECT_ROOT / "backend" / "migrations" / "001_init.sql"
    if init_sql.exists():
        con.executescript(init_sql.read_text())
    return con


# Work orders repository in SQLite
def insert_work_order(wo: WorkOrder) -> WorkOrder:
    con = get_connection()
    try:
        route_json = wo.route.model_dump_json() if wo.route else None
        con.execute(
            """INSERT OR REPLACE INTO work_orders 
               (work_order_id, route_id, status, created_ts, decided_by, notes, route_json)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                wo.work_order_id,
                wo.route_id,
                wo.status.value if hasattr(wo.status, "value") else str(wo.status),
                wo.created_ts.isoformat(),
                wo.decided_by,
                wo.notes,
                route_json,
            ),
        )
        con.commit()
        return wo
    finally:
        con.close()


def get_work_order(wo_id: str) -> Optional[WorkOrder]:
    con = get_connection()
    try:
        cur = con.execute("SELECT * FROM work_orders WHERE work_order_id = ?", (wo_id,))
        row = cur.fetchone()
        if not row:
            return None
        route = Route.model_validate_json(row["route_json"]) if row["route_json"] else None
        return WorkOrder(
            work_order_id=row["work_order_id"],
            route_id=row["route_id"],
            status=WorkOrderStatus(row["status"]),
            created_ts=datetime.fromisoformat(row["created_ts"]),
            decided_by=row["decided_by"],
            notes=row["notes"],
            route=route,
        )
    finally:
        con.close()


def list_work_orders(status: Optional[str] = None) -> list[WorkOrder]:
    con = get_connection()
    try:
        if status:
            cur = con.execute("SELECT * FROM work_orders WHERE status = ? ORDER BY created_ts DESC", (status,))
        else:
            cur = con.execute("SELECT * FROM work_orders ORDER BY created_ts DESC")
        results = []
        for row in cur.fetchall():
            route = Route.model_validate_json(row["route_json"]) if row["route_json"] else None
            results.append(
                WorkOrder(
                    work_order_id=row["work_order_id"],
                    route_id=row["route_id"],
                    status=WorkOrderStatus(row["status"]),
                    created_ts=datetime.fromisoformat(row["created_ts"]),
                    decided_by=row["decided_by"],
                    notes=row["notes"],
                    route=route,
                )
            )
        return results
    finally:
        con.close()


def update_work_order(wo: WorkOrder) -> WorkOrder:
    return insert_work_order(wo)
