# Kickoff prompts (paste into Claude/Copilot, in order). Replace <A|B|C>. Always start a new AI session with the PREAMBLE.

## PREAMBLE (paste first, every new session)
You are helping me, Person <A|B|C>, on the "Binlytics" hackathon repo. Read CONTEXT.md, shared/schemas.py,
shared/constants.py and docs/TASKS.md fully before writing code. I own only: <folders from the CONTEXT.md table>.
Rules: do not invent fields/endpoints/enums; do not edit files outside my folders or /shared (tell me instead);
keep it minimal and runnable; run `make test` after changes and fix failures; explain what you changed in 5 lines.

## Person A (backend, ML)
1. "Run `make fixtures seed test`. Then implement real.bins() in backend/app/real.py from data/waste.db: latest reading per bin joined with bins, plus overflow risk placeholder = clip((fill-45)/55,0,1). Must return list[Bin] exactly per schemas.py. Add a test that real.bins() returns 40 valid Bin objects and that REAL_ENDPOINTS=bins serves it."
2. "Implement real.forecast(): daily kg per building aggregated from readings, LightGBM with features lag1/lag7, dow, rolling7, event flag; time-based holdout (last 5 days); compute wape and baseline_wape (seasonal-naive, lag7); return ForecastResponse with lower/upper from residual std. Add a unit test on WAPE < baseline."
3. "Replace the overflow-risk placeholder with a real estimate: per-bin fill rate by hour-of-day/weekday from history, simulate forward horizon_h hours, risk = fraction of Monte-Carlo runs (200) hitting 100%. Keep it under 300ms for all 40 bins."
4. "Implement real.plan_routes() with OR-Tools: nodes = depot + bins with risk >= threshold, capacity per truck (kg from fill*capacity_l*WASTE_DENSITY_KG_PER_L), shift limit TRUCK_SHIFT_MIN, haversine distances, 15 km/h + 4 min/stop. baseline_km = nearest-neighbour fixed route over ALL bins. Fill every field of RoutePlanResponse."
5. "Implement real.kpis() and persist work orders in SQLite (table work_orders) replacing the in-memory dict in main.py, keeping responses identical."
6. "Implement real.trends() and real.compare() per shared/schemas.py (TrendResponse, CompareResponse) and extend real.kpis() with recycling_pct and waste_change_wow_pct. Add tests: weekly sums equal their days, ranks 1-6 unique, compare numbers match kpis."
7. "Write scripts/simulate_impact.py: replay 30 days with fixed daily collection vs risk-triggered collection; output km, trips, overflow bin-hours into docs/metrics.md as a table."

## Person B (agents, RAG, MCP)
1. "Run `make test`. Start the backend (`make backend`) and verify `make mcp` tools work; write docs/mcp_claude_desktop.md with the exact Claude Desktop config JSON to launch `python -m agents.mcp_server` from this repo, then test each tool by chat."
2. "In agents/graph.py use agents/llm.ask() with prompts/planner.md to write a 3-sentence plain-English summary of the plan (from tool results only) stored in state['plan_summary']; keep the deterministic path working when GEMINI_API_KEY is missing. Extend tests/test_graph.py accordingly."
3. "Wire agents/runner.stream_chat into backend `/chat` (SSE) WITHOUT breaking tests: if the graph import fails fall back to fixtures. Add POST /chat/resume {thread_id, approved} that resumes the interrupt. Ask Person A to merge the backend/ change; give them the diff."
4. "Implement agents/rag ingestion per manifest.yaml: clause-aware chunking, BM25 (rank_bm25) + bge-small embeddings (Chroma), RRF fusion, store citations metadata. Implement interface.retrieve() returning list[Citation]."
5. "Implement interface.answer(): retrieve -> if top score < ABSTAIN_THRESHOLD return abstained=True; else llm.ask with prompts/rag_answer.md and return RagAnswer with citations. Build agents/rag/eval.py over eval_qa.json printing hit@k and abstain accuracy; tune the threshold."
6. "Add a Critic failure path: when a route exceeds TRUCK_SHIFT_MIN the graph replans with fewer bins per truck; show it in the trace events."

## Person C (frontend, pitch)
1. "Scaffold Vite+React+TS in frontend/ per frontend/README.md. Run `make types` against the running backend and build a typed API client (no hand-written types). Show a `mock`/`real` source badge from API responses."
2. "Build the Map page with react-leaflet: 40 bins as circle markers coloured by risk_level, depot marker, click opens a side panel with fill %, risk, category and a 24h sparkline from /bins/{id}/readings."
3. "Build the Dashboard: KPI cards from /kpis and a Recharts forecast chart (p50 line + lower/upper area) with a building selector (BUILDING_IDS)."
4. "Build Chat+Trace: POST /chat SSE via fetch streaming, render TraceEvent rows (agent badge, type, payload summary), and on approval_request store thread_id and show Approve/Reject buttons calling POST /chat/resume. Handle `done` and errors."
5. "Build the Approval inbox: list GET /work-orders?status=DRAFT, preview the route polyline on the map, approve/reject with optimistic UI."
6. "Build the Trends view (day/week toggle, campus or building) from /trends and the Comparison view (kg per person per day bar chart + table with wow change, segregation %, recycling %, rank) from /compare."
7. "Build the Impact page using RoutePlanResponse (km_saved_pct, baseline vs ours) and the numbers in docs/metrics.md. Then draft the 3-minute demo script in docs/demo.md."
