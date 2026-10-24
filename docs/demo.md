# 3-minute demo script (owner: C). Rehearse twice. Record a backup video.
Setup: `make seed`, backend + frontend running, USE_MOCKS=false for the endpoints that are real. Pre-warm the LLM cache.
1. (0:00) Problem in 15s: fixed schedules overflow mess/hostel bins, waste trips elsewhere. Show map: bins coloured by risk.
2. (0:20) Dashboard: Hostel/Mess forecast with band; point out anomaly (+x% vs forecast).
3. (0:45) Chat: "Plan tonight's collection." Trace shows Planner -> tool call -> Critic.
4. (1:15) Failure path: Critic rejects an over-long route; Planner replans with a different threshold.
5. (1:35) Approval: admin approves; work orders appear; KPIs update.
6. (2:00) Rules assistant: "Can mess food waste be composted, and what do the rules say?" -> cited answer; then an out-of-scope question -> abstains.
7. (2:20) MCP: same tools from Claude Desktop (30s clip or live).
8. (2:40) Impact slide: km/trips saved and overflow bin-hours vs fixed schedule (simulated, 30 days), cost per bin, scaling plan.
Say clearly: data is synthetic and calibrated (0.45 kg/person/day); the pipeline is real and runs on sensor data unchanged.
