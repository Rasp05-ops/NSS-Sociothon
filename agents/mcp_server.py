"""OWNER: B. MCP server exposing the campus system as tools. Run: make mcp  (stdio) -- then add it to Claude Desktop.
Tool names/args are a CONTRACT: see shared/mcp_tools.md. Tools only call the backend HTTP API (never the DB directly).
WRITE tools create DRAFTS only; approval is a human action in the UI, never an MCP tool."""
import os

import httpx
from mcp.server.fastmcp import FastMCP

BASE = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
mcp = FastMCP("campus-waste")
_c = httpx.Client(base_url=BASE, timeout=60)


@mcp.tool()
def get_bin_levels(building_id: str | None = None, min_risk: float = 0.0) -> list[dict]:
    """List bins with current fill % and P(overflow) risk. Filter by building and minimum risk."""
    p = {"min_risk": min_risk, **({"building_id": building_id} if building_id else {})}
    return _c.get("/bins", params=p).raise_for_status().json()


@mcp.tool()
def forecast_waste(building_id: str, days: int = 7) -> dict:
    """Forecast waste (kg) for a building for the next N days with uncertainty band and model error."""
    return _c.get("/forecast", params={"building_id": building_id, "days": days}).raise_for_status().json()


@mcp.tool()
def plan_routes(horizon_h: int = 12, trucks: int = 2, risk_threshold: float = 0.7) -> dict:
    """Plan collection routes for bins likely to overflow within the horizon. Returns routes, km and savings vs fixed route."""
    body = {"horizon_h": horizon_h, "trucks": trucks, "risk_threshold": risk_threshold}
    return _c.post("/routes/plan", json=body).raise_for_status().json()


@mcp.tool()
def draft_work_order(route_id: str, notes: str | None = None) -> dict:
    """Create a DRAFT work order for a planned route. A human must approve it in the UI before dispatch."""
    return _c.post("/work-orders", json={"route_id": route_id, "notes": notes}).raise_for_status().json()


@mcp.tool()
def building_kpis(building_id: str | None = None) -> dict:
    """Waste today (kg), segregation %, overflow count (7d), km saved. Omit building for campus-wide."""
    p = {"building_id": building_id} if building_id else {}
    return _c.get("/kpis", params=p).raise_for_status().json()


@mcp.tool()
def ask_rules(question: str) -> dict:
    """Answer a waste-rules question with clause citations (agentic RAG). Abstains if evidence is weak."""
    return _c.get("/rag/ask", params={"q": question}).raise_for_status().json()


if __name__ == "__main__":
    mcp.run()  # stdio transport
