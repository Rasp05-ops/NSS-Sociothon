# MCP tool contract (owner: B). Names/args change only via PR + CONTEXT.md update.
| tool | args | returns | writes? |
|---|---|---|---|
| get_bin_levels | building_id?, min_risk=0.0 | Bin[] | no |
| forecast_waste | building_id, days=7 | ForecastResponse | no |
| plan_routes | horizon_h=12, trucks=2, risk_threshold=0.7 | RoutePlanResponse | no |
| draft_work_order | route_id, notes? | WorkOrder (status=DRAFT) | DRAFT only |
| building_kpis | building_id? | KPIs | no |
| ask_rules | question | RagAnswer (citations, abstained) | no |
Approval/dispatch is NOT a tool: humans approve via POST /work-orders/{id}/approve in the UI.
