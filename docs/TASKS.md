> Detailed feature specs with inputs/outputs and "done when" criteria: docs/FEATURES.md

# Task board (12h). Tick as you go. P0 = must ship, P1 = should, P2 = only if time.
Timeline: H0-1 contract+scaffold (all) · H1-4 build on mocks · H4-7 real endpoints + wiring · H7-9 end-to-end · H9-10.5 metrics+slides · H10.5-12 freeze, rehearse, record backup.

## Person A — Data, ML, API (backend/)
- [ ] P0 `make seed` works; sanity-check overflow stats (baseline ~5% bin-hours at 100%, mostly MESS01/H01)
- [ ] P0 real `bins()` : latest reading per bin + overflow risk
- [ ] P0 forecast: LightGBM per building (daily kg), time-based holdout, WAPE vs seasonal-naive baseline
- [ ] P0 overflow risk: P(bin >=100% within horizon) from fill rate + hour/weekday profile; flag >= RISK_THRESHOLD
- [ ] P0 routing: OR-Tools VRP (capacity, TRUCK_SHIFT_MIN, depot) over flagged bins; baseline_km = fixed route over ALL bins
- [ ] P0 KPIs: kg_today, segregation_pct (sim audits), overflow_count_7d, km_saved_pct
- [ ] P0 /trends and /compare endpoints (real.trends, real.compare) + recycling_pct and waste_change_wow_pct in /kpis (A11-A13)
- [ ] P1 persist work orders + agent_trace in SQLite; anomaly flag (residual z>3) shown in KPIs/bins
- [ ] P1 30-day simulation: fixed schedule vs risk-triggered -> docs/metrics.md numbers (km, trips, overflow bin-hours)
- [ ] P2 quantile band from LightGBM; help B with RAG eval

## Person B — Agents, RAG, MCP (agents/)
- [ ] P0 `make mcp` runs; 6 tools work against mock backend; test in Claude Desktop
- [ ] P0 LangGraph cycle (agents/graph.py) passes `make test`; wire llm.ask() for Planner explanations + Critic reasoning
- [ ] P0 runner.stream_chat -> replace fixture replay in backend `/chat` (SSE, ends with done); approval resume endpoint
- [ ] P0 RAG: ingest 3-4 docs (manifest.yaml), clause-aware chunks, BM25 + embeddings + RRF, cited answers, abstain
- [ ] P1 RAG eval: 15 Q&A + 2 out-of-scope; report hit@k and abstain accuracy; optional RAGAS faithfulness
- [ ] P1 failure demo: Critic rejects an over-length route, Planner replans (visible in trace)
- [ ] P2 VLM segregation audit (one image -> JSON misplaced items); Telegram notification on dispatch

## Person C — Frontend, product, pitch (frontend/, docs/demo.md)
- [ ] P0 Vite+React+TS scaffold, `make types`, API client using generated types, `source` badge
- [ ] P0 Map: 40 bins coloured by risk_level, click -> bin panel with readings sparkline
- [ ] P0 Trends chart (day/week toggle) and building comparison chart (C10-C11)
- [ ] P0 KPI cards + forecast chart (p50 line, lower/upper band) per building
- [ ] P0 Chat + live agent trace (SSE) + Approve/Reject buttons on approval_request
- [ ] P0 Approval inbox (GET /work-orders) with route preview on map
- [ ] P1 Impact page: baseline vs ours (km, trips, overflow bin-hours) from /routes/plan + metrics.md
- [ ] P1 Slides (problem, solution, architecture, demo, impact, cost/scale plan) + 3-min script; record backup video
- [ ] P2 Dark mode, mobile layout

## Everyone
- [ ] `make test` green before every push · [ ] daily 10-min sync on what changed in /shared · [ ] 2 full demo rehearsals before submission

## Scope reminder
Build P0 first and stop adding anything not used in the 3-minute demo or a slide. P1 only after P0 works end to end; P2 only if idle.
