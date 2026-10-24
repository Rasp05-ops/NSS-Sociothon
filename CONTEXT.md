# Campus Waste Copilot — READ THIS FIRST (humans and AI assistants)

12-hour hackathon (SOCIOTHON 2026, waste management). Team of 3, each using Claude/Copilot. This file + `/shared` are the
ONLY coordination mechanism. If code and this file disagree, this file wins; fix the code (or update this file in a PR).

## What we are building (one vertical slice)
Forecast waste per building -> flag bins likely to overflow in 12h -> agents plan routes (OR-Tools) -> Critic checks
constraints -> HUMAN approves -> work orders created -> KPIs update. Plus a cited rules assistant (agentic RAG) and
an MCP server exposing the same tools to any MCP client (Claude Desktop). All data is SYNTHETIC (say so in the pitch).

## Ownership (edit only your own folders; /shared changes need a PR all 3 see)
| Person | Owns | Never edit |
|---|---|---|
| A (Data/ML/API) | backend/, shared/make_fixtures.py, shared/layout.py, scripts/smoke.py, docs/metrics.md | agents/, frontend/ |
| B (Agents/RAG/MCP) | agents/, shared/mcp_tools.md, shared/events.md | backend/app/real.py, frontend/ |
| C (Frontend/Pitch) | frontend/, docs/demo.md, slides | backend/, agents/ |
| Shared (PR + all approve) | shared/schemas.py, shared/constants.py, shared/constants.ts, CONTEXT.md | — |

## Hard conventions
- Python 3.11+, FastAPI, Pydantic v2. TypeScript strict. JSON keys snake_case.
- Timestamps: UTC ISO-8601 everywhere (DB/API). Convert to Asia/Kolkata ONLY in the UI.
- Units: weight kg, fill_pct float 0-100, distance km, capacity litres, time minutes. Risk = P(overflow in horizon) in [0,1].
- IDs are strings: building `H01 H02 H03 ACAD01 MESS01 LIB01`; bin `{building_id}-{nn}` e.g. `H01-03`; route `R-xxxx`; work order `WO-xxxxxx`.
- Enums/constants: ONLY from `shared/constants.py` (TS mirror: `shared/constants.ts`). Never hardcode strings like "APPROVED".
- Types: ONLY from `shared/schemas.py`. Never redefine a model. Frontend types are GENERATED (`make types`), never hand-written.
- DB: SQLite at `data/waste.db`, schema in `backend/migrations/001_init.sql`. Only `backend/` touches the DB. Agents/MCP/UI use HTTP.
- All LLM calls go through `agents/llm.py`. All prompts live in `agents/prompts/*.md` (no inline prompt strings).
- Secrets only in `.env` (never commit). Copy `.env.example`.

## API (all under /api/v1; OpenAPI at /openapi.json)
GET /health · GET /bins?building_id&min_risk -> Bin[] · GET /bins/{id}/readings?from&to -> Reading[]
GET /forecast?building_id&days -> ForecastResponse · POST /routes/plan {horizon_h,trucks,risk_threshold} -> RoutePlanResponse
POST /work-orders {route_id,notes?,route?} -> WorkOrder(DRAFT) · GET /work-orders?status · POST /work-orders/{id}/approve|reject {Decision}
GET /kpis?building_id -> KPIs (incl. recycling_pct, waste_change_wow_pct) · GET /trends?building_id&granularity=day|week&days -> TrendResponse · GET /compare?days -> CompareResponse · GET /rag/ask?q -> RagAnswer · POST /chat (SSE of TraceEvent, ALWAYS ends with type=done)

## Mock-first workflow (nobody waits for anybody)
- `USE_MOCKS=true`: explicitly opt into fixture-backed endpoints for demos. The runtime default is real mode (`USE_MOCKS=false`); responses carry `source: "mock"|"real"`.
- A flips endpoints one by one via `REAL_ENDPOINTS=forecast,routes` as real versions land in `backend/app/real.py`.
- Real functions MUST return the same schema as the mock. Changing a schema? Edit `shared/schemas.py` -> `make fixtures` -> tell the team -> then code.

## Rules for AI assistants (paste/obey)
1. Read CONTEXT.md and shared/schemas.py before writing code. Do not invent fields, endpoints, enums or IDs.
2. Touch only the folders the user owns. If you need a change in another person's folder or /shared, STOP and tell the user to ask the owner.
3. Keep changes minimal and runnable. After changes run `make test` (and `make smoke` if the backend is running). Fix before finishing.
4. Never commit secrets, never call real external APIs in tests, never remove the `source` field or the final `done` SSE event.
5. WRITE actions by agents/MCP create DRAFT work orders only. Approval is a human UI action.
6. Prefer boring, working code over clever code. This is a 12-hour build: no new frameworks without asking the team.

## Commands
`make setup` · `make setup-ml` · `make fixtures` · `make seed` · `make backend` · `make mcp` · `make test` · `make smoke` · `make types`

## Git
Branch per person (`a/…`, `b/…`, `c/…`), small PRs, merge to `main` at least every 2 hours, never push broken `main`
(`make test` must pass). Feature freeze at H10.5; after that, bug fixes only.
