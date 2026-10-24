# Feature spec (what each person is actually building)
Format: ID · what it does · input -> output · done when (targets are goals to measure, not claims) · depends on · priority.
Contract details live in CONTEXT.md and shared/schemas.py. "Mock" = already served from fixtures today.

# PERSON A — Data, ML, API (backend/)
A1 Synthetic campus data [P0, done in scaffold, verify]
 - 6 buildings, 40 bins, 30 days hourly (28,800 rows); hourly/weekday/event patterns; baseline = fixed daily 06:00 collection.
 - Done when: `make seed` runs <30s; baseline overflow ~3-8% of bin-hours, concentrated in MESS01/H01; same bin IDs as fixtures.
A2 Bin status API (GET /bins, /bins/{id}/readings) [P0] · SQLite -> Bin[]/Reading[]
 - Latest fill per bin, risk_overflow in [0,1], risk_level from RISK_THRESHOLD; filters building_id, min_risk; readings window by from/to.
 - Done when: 40 valid Bin objects; <100 ms; real.bins()/readings() replace mocks via REAL_ENDPOINTS.
A3 Waste forecast (GET /forecast) [P0] · building_id, days -> ForecastResponse
 - Daily kg per building, LightGBM (lag1, lag7, dow, rolling7, event flag), lower/upper from residual std; wape + baseline_wape on last-5-day holdout.
 - Done when: wape < baseline_wape for >= 4 of 6 buildings; <1 s per call (train offline, load model).
A4 Overflow risk engine [P0] · bin history -> risk_overflow per bin
 - Per-bin fill rate by hour/weekday, Monte-Carlo forward over horizon_h (200 runs); risk = share of runs hitting 100%.
 - Done when: all 40 bins in <300 ms; high-risk bins have higher true overflow in a backtest than low-risk (report precision/recall at 0.7).
A5 Route planner (POST /routes/plan) [P0] · {horizon_h, trucks, risk_threshold} -> RoutePlanResponse
 - OR-Tools VRP over flagged bins: truck capacity (kg), TRUCK_SHIFT_MIN, depot, haversine, 15 km/h + 4 min/stop. baseline_km = fixed route over ALL bins.
 - Done when: <2 s; every flagged bin appears exactly once; km_saved_pct computed; no route exceeds MAX_STOPS_PER_ROUTE.
A6 KPIs (GET /kpis) [P0] · building_id? -> KPIs: kg_today, segregation_pct (simulated audits), overflow_count_7d, km_saved_pct.
A7 Work orders (POST/GET/approve/reject) [P1] · persist in SQLite (work_orders), statuses from WorkOrderStatus, 404 on unknown id, reject keeps record.
A8 Anomaly detection [P1] · residual z-score > 3 vs forecast -> flag on bins/KPIs ("Hostel B +38% vs forecast").
A9 Impact simulation [P1] · replay 30 days: fixed schedule vs risk-triggered -> km, stops, overflow bin-hours in docs/metrics.md.
A11 Trends API (GET /trends) [P0, Area-4 core] · building_id?, granularity=day|week, days -> TrendResponse
 - Collected kg per day/week from readings (campus-wide when building_id omitted).
 - Done when: 30 daily points; weekly sums equal the sum of their days; <100 ms.
A12 Building comparison API (GET /compare) [P0, Area-4 core] · days -> CompareResponse
 - Per building: kg_period, kg_per_person_day (uses BUILDINGS population), wow_change_pct, segregation_pct, recycling_pct, rank (1 = lowest kg/person/day).
 - Done when: 6 buildings, ranks 1-6 unique, numbers match /kpis for the same building.
A13 Recycling + reduction KPIs [P0, Area-4 core] · extend /kpis: recycling_pct = (dry+paper+plastic kg)/total kg; waste_change_wow_pct = this 7d vs previous 7d.
 - Add a `--nudge` option in the simulator (e.g. -8% waste and +10 pts segregation in one hostel after day 15) so a measured reduction can be shown; label it simulated.
A10 Quantile band / extra buildings / RAG eval help [P2]

# PERSON B — Agents, RAG, MCP (agents/)
B1 MCP server [P0] · 6 tools (get_bin_levels, forecast_waste, plan_routes, draft_work_order, building_kpis, ask_rules)
 - Only calls backend HTTP; writes create DRAFT only; documented Claude Desktop config (docs/mcp_claude_desktop.md).
 - Done when: each tool works from Claude Desktop with real (or mock) backend; errors returned as readable messages.
B2 Multi-agent graph [P0] · LangGraph Planner -> Critic -> (replan <=3x | approval) -> Dispatcher
 - Human approval via interrupt(); reject creates nothing; Planner summary written by LLM from tool results only; deterministic fallback with no API key.
 - Done when: tests/test_graph.py passes; a full cycle completes in <20 s with the LLM on.
B3 Live trace + chat endpoint [P0] · POST /chat (SSE of TraceEvent) + POST /chat/resume
 - Streams tool_call/tool_result/message/approval_request/error and ALWAYS ends with done; first event <1 s.
B4 Critic constraints + replan [P1] · checks shift time, stops, coverage of HIGH-risk bins, duplicates; failure shown in trace (demo moment).
B5 Agentic RAG [P0] · question -> RagAnswer(citations, abstained)
 - Corpus per manifest.yaml; clause-aware chunks (300-500 tokens, parent title kept); BM25 + bge-small embeddings, RRF (k=60), top 8; optional reranker.
 - Answers only from retrieved chunks, cites [doc_id, clause]; abstains below ABSTAIN_THRESHOLD; answer <120 words.
 - Done when: eval (15 Q + 2 out-of-scope) shows hit@3 >= 80% and all out-of-scope questions abstain.
B6 Router behaviour [P1] · agent chooses between stats tool (KPIs/forecast) and RAG by question type (e.g. "how much waste in H01?" vs "is composting allowed?").
B7 VLM segregation audit [P2] · image -> JSON {items, misplaced}; test on ~50 labelled photos, report accuracy.
B8 Telegram dispatch notification [P2] · after approval, send crew message per route (prompts/dispatcher.md).

# PERSON C — Frontend, product, pitch (frontend/, docs/demo.md)
C1 App shell + typed client [P0] · Vite React TS; types generated via `make types`; nav: Map, Dashboard, Chat, Approvals, Impact; visible mock/real badge; loading + error states.
C2 Risk map [P0] · 40 bins coloured by risk_level, depot marker, building filter, click -> side panel (fill %, risk, category, 24h sparkline); legend.
 - Done when: renders <1 s on a phone-width viewport; colours match low/medium/high.
C3 Dashboard [P0] · KPI cards (kg today, segregation %, recycling %, week-over-week change, overflow 7d, km saved) + forecast chart (p50 line, lower/upper band), building selector, shows wape vs baseline.
C4 Chat + live trace [P0] · SSE reader; rows with agent badge, type, payload summary; approval_request shows Approve/Reject; stops on done; handles disconnect/error.
C5 Approval inbox [P0] · list DRAFT work orders, route polyline preview on map, approve/reject with comment, status updates live.
C6 Rules assistant UI [P1] · question box -> answer with clickable citation chips (doc, clause, snippet); distinct "can't answer from documents" state when abstained.
C7 Impact page [P1] · baseline vs ours (km, stops, overflow bin-hours, WAPE) from /routes/plan + docs/metrics.md; one big "km saved %" number; "simulated data" label.
C8 Pitch kit [P0] · slides (problem, solution, architecture, demo, impact, cost/scale), 3-min script (docs/demo.md), backup screen recording, 1-page implementation plan (sensors ~INR 500-800/bin, free-tier stack, rollout to 6 -> 20 buildings).
C9 Polish [P2] · dark mode, mobile layout, empty/error states.
C10 Trends view [P0, Area-4 core] · daily/weekly toggle line/bar chart (campus or one building) from /trends; highlight weekends and event spikes.
C11 Building comparison [P0, Area-4 core] · bar chart of kg per person per day across the 6 buildings from /compare, best/worst highlighted, table with wow change, segregation %, recycling %, rank (this replaces the leaderboard).

# Cross-cutting (everyone, P0)
X1 `make test` green before every push · X2 never break `source`/`done` · X3 daily /shared review · X4 two full demo rehearsals.
