# Binlytics — Smarter data. Cleaner tomorrow.

## 1. One-line pitch

Binlytics is an agentic campus waste-operations platform that predicts which bins
will overflow, plans efficient collection routes, explains waste regulations with
citations, and keeps a human supervisor in control before dispatch.

## 2. The problem

Campus waste collection is often handled with fixed schedules:

- Every bin is visited whether it needs service or not.
- High-use mess and hostel bins can overflow between scheduled collections.
- Operations teams lack a single view of fill levels, risk, forecasts, routes, and
  compliance rules.
- Route decisions are difficult to audit because the reasoning is scattered
  across spreadsheets, calls, and messaging.
- A fully autonomous system is risky because dispatch affects people, vehicles,
  and campus operations.

The result is a combination of overflowing bins, unnecessary vehicle kilometres,
poor visibility, and reactive decision-making.

## 3. Our solution

Binlytics creates one operational loop:

1. Read current and historical bin telemetry.
2. Forecast waste generation by building.
3. Estimate the probability that each bin will overflow in the next horizon.
4. Flag only the bins that need attention.
5. Build capacity- and time-constrained collection routes.
6. Let a critic agent check the plan.
7. Ask a human supervisor for approval.
8. Create approved work orders and update operational KPIs.
9. Answer regulations questions using retrieved source documents and citations.

The important design principle is **human-in-the-loop automation**:
Binlytics recommends and explains; a supervisor authorizes dispatch.

## 4. What is implemented

### 4.1 Synthetic campus data

The prototype uses calibrated synthetic data so the complete workflow can be
demonstrated without exposing real campus or student information.

Current dataset:

- 6 buildings.
- 40 bins.
- 30 days of hourly readings.
- 28,800 telemetry rows.
- Fill percentage and weight readings.
- Building, weekday, hour-of-day, and event patterns.
- A fixed daily collection route as the baseline.

The simulator models higher waste generation around hostel and mess activity and
records baseline overflow bin-hours.

**How to explain it:**

> The data is synthetic but the data contract and processing pipeline are real.
> The same APIs can receive sensor data when deployed with ESP32 and ultrasonic
> or weight sensors.

### 4.2 Risk map

The Risk Map displays all campus bins geographically.

Features:

- Leaflet-based campus map.
- 40 bin markers.
- Green, amber, and red risk levels.
- Building filter.
- Minimum-risk slider.
- High-, medium-, and low-risk counts.
- Depot marker.
- Bin detail panel.
- Fill percentage, category, current risk, and last reading.
- Reading sparkline for the selected bin.
- Route preview after approval or work-order review.

**Judge value:** The map turns raw telemetry into an immediately understandable
operational view.

### 4.3 Waste forecasting

The forecasting service estimates daily waste generation for each building.

The model uses:

- Previous-day waste.
- Seven-day lag.
- Day of week.
- Weekend indicator.
- Rolling seven-day average.
- Time-based holdout evaluation.
- LightGBM regression.

The response includes:

- P50 expected waste.
- Lower and upper uncertainty band.
- WAPE for the model.
- Seasonal-naive baseline WAPE.

**How to explain it:**

> The system does not only show a point prediction. It shows uncertainty and
> compares the model against a simple seasonal baseline.

Be accurate when presenting results:

> On the current synthetic dataset, the model beats the baseline in most
> buildings. Forecast quality varies by building, so we present WAPE honestly
> instead of claiming perfect prediction.

### 4.4 Overflow-risk engine

The risk engine estimates:

> `P(bin reaches 100% within the next horizon)`.

It considers historical fill behavior by:

- Bin.
- Hour of day.
- Weekday.
- Recent fill level.
- Forward horizon.

The result is a continuous risk score from 0 to 1 and a category:

- Low: below 0.4.
- Medium: 0.4 to below 0.7.
- High: 0.7 or above.

High-risk bins become route-planning candidates.

**Why this matters:** The platform does not blindly collect every bin. It
prioritizes intervention based on predicted need.

### 4.5 Route optimization

The route planner uses OR-Tools to plan routes over flagged bins.

It considers:

- Depot location.
- Haversine distance.
- Number of trucks.
- Truck payload capacity.
- Maximum shift duration.
- Travel speed.
- Four-minute service time per stop.
- Maximum stops per route.
- Risk threshold.

The API returns:

- Route IDs.
- Truck assignments.
- Ordered stops.
- ETA per stop.
- Route distance.
- Estimated route duration.
- Total route distance.
- Fixed-route baseline distance.
- Percentage distance saved.

**How to explain it:**

> The optimizer is not simply connecting points on a map. It produces feasible
> routes under operational constraints. If the optimizer cannot produce a
> solution, the fallback still respects payload, time, and stop constraints.

Avoid presenting the simulation's 29% saving as a guaranteed live result. Say:

> The 29% result is from the 30-day synthetic impact simulation. Live savings
> vary with the current risk threshold, flagged bins, truck count, and capacity.

### 4.6 Multi-agent workflow

The LangGraph workflow contains four stages:

#### Planner

Calls the route-planning API and creates a route plan summary. When Gemini is
configured, Gemini explains the plan using the tool result.

#### Critic

Checks:

- Route shift duration.
- Maximum stops.
- Whether routes exist.
- Whether the plan is operationally valid.

If the plan fails, the graph can replan up to the configured attempt limit.

#### Approval

The graph pauses using a LangGraph interrupt and emits an approval request.

The approval request includes:

- Thread ID.
- Route ID.
- All route IDs.
- Route plan.
- Critic result.

#### Dispatcher

After approval:

- Creates work orders.
- Approves them using the supervisor decision.
- Emits work-order IDs in the live trace.

After rejection:

- No work orders are dispatched.
- The trace explicitly reports that no work orders were dispatched.

### 4.7 Live agent chat and trace

The chat interface uses Server-Sent Events.

The UI displays:

- Planner tool results.
- Planner explanation.
- Critic result.
- Approval request.
- Dispatcher output.
- Completion event.
- Error event when execution fails.

Every stream terminates with a `done` event.

The approval flow is real:

1. The frontend receives the real thread ID.
2. The user clicks Approve or Reject.
3. The frontend calls `/chat/resume`.
4. LangGraph resumes the paused thread.
5. Dispatcher output appears only after the decision.

This is not a fake approval button and does not approve a made-up work order.

### 4.8 Human approval and work-order inbox

The Approval Inbox provides operational control over persisted work orders.

Features:

- List work orders.
- Filter by status.
- View route ID.
- View stop count and distance.
- Preview the route on the map.
- Add an approval comment.
- Approve or reject.
- Persist status, decision maker, timestamp, notes, and route snapshot.
- Return 404 for unknown work-order IDs.

Agents and MCP tools create drafts only. A human approval is required before
dispatch.

### 4.9 KPI dashboard

The dashboard presents:

- Waste generated in the latest rolling 24-hour period.
- Source-segregation percentage from audit records.
- Recycling percentage.
- Week-over-week waste change.
- Overflow incidents in the last seven days.
- Route distance savings.
- Forecast chart with uncertainty band.
- Model WAPE versus baseline WAPE.

Important metric definitions:

- `kg_today` is a rolling 24-hour metric based on the latest telemetry time.
- `overflow_count_7d` counts transitions into overflow, not every saturated
  hourly reading.
- `segregation_pct` comes from the audit table.
- `recycling_pct` is the dry, paper, and plastic weight share.

### 4.10 Trends and comparison

The trends view supports:

- Campus-wide trends.
- Building-specific trends.
- Daily aggregation.
- Weekly aggregation.
- Waste-volume change over time.

The comparison view ranks six buildings by kilograms per person per day and
shows:

- Waste in the selected period.
- Waste per person per day.
- Week-over-week change.
- Segregation percentage.
- Recycling percentage.
- Rank.

### 4.11 Rules Assistant: agentic RAG

The Rules Assistant answers campus waste-regulation questions using retrieved
documents.

Pipeline:

1. Load documents listed in the manifest.
2. Extract Markdown and PDF text.
3. Split content into clause- or heading-aware chunks.
4. Run BM25 lexical retrieval.
5. Run embedding retrieval with BGE embeddings when installed.
6. Fuse rankings using reciprocal rank fusion.
7. Return the top citations.
8. Ask Gemini to synthesize an answer using only retrieved context.
9. Abstain when evidence is weak.

Each answer can include:

- Document ID.
- Document title.
- Clause or section.
- Source snippet.
- Retrieval score.

If Gemini is unavailable, Binlytics does not pretend that a generated answer
exists. It reports that AI synthesis is unavailable and preserves the evidence
state.

### 4.12 Gemini integration

All agent LLM calls go through one module:

`agents/llm.py`

It provides:

- `.env` loading from the repository root.
- API-key validation.
- Model configuration.
- Stable cache location.
- Retry handling.
- Empty-response detection.
- Explicit configuration and request errors.

The currently verified model is:

```text
gemini-2.5-flash
```

The API key was tested with a live request. The key itself is never committed,
displayed, or returned by the health endpoint.

### 4.13 MCP integration

Binlytics exposes the same operational capabilities to MCP clients such as
Claude Desktop.

Available tools:

- `get_bin_levels`
- `forecast_waste`
- `plan_routes`
- `draft_work_order`
- `building_kpis`
- `ask_rules`

MCP calls the backend HTTP API and never accesses the database directly.
Write operations create DRAFT work orders only.

This makes Binlytics usable from:

- The web dashboard.
- The built-in agent chat.
- MCP-compatible assistants.

## 5. Architecture explanation

```text
Synthetic sensors / future IoT sensors
                |
                v
        SQLite telemetry store
                |
                v
       FastAPI backend contract
       /bins /forecast /routes
       /kpis /work-orders /chat
                |
       +--------+---------+
       |                  |
       v                  v
  ML/risk/routing     LangGraph agents
       |              Planner -> Critic
       |                    -> Approval
       |                    -> Dispatcher
       v                  |
  KPI and route data       v
       |              SSE live trace
       +--------+---------+
                |
                v
         React TypeScript UI
                |
                +--> Human approval
                |
                +--> MCP clients
```

## 6. Three-minute demo script

### 0:00-0:20 — Problem

> Campuses commonly collect waste on fixed schedules. That creates two
> problems: some bins overflow before the next visit, while collection teams
> still spend time visiting bins that are mostly empty. Binlytics turns campus
> telemetry into predictive, explainable collection decisions.

Show the Risk Map.

### 0:20-0:45 — Risk map

> This map shows all 40 campus bins. Green, amber, and red indicate predicted
> overflow risk. I can filter by building or minimum risk and inspect any bin's
> fill history.

Click a high-risk bin and show its readings.

### 0:45-1:05 — Forecast and KPIs

> The dashboard combines current operations with a building-level waste
> forecast. The line is the expected load and the shaded band represents
> uncertainty. We also show segregation, recycling, overflow incidents, and
> change versus the previous week.

Select a building and point out WAPE versus the baseline.

### 1:05-1:35 — Agent planning

Ask chat:

```text
Plan tonight's collection for high-risk bins.
```

Say:

> The Planner requests a route plan from the backend. The Critic checks shift
> time, stop count, and feasibility. The trace makes each step visible instead
> of hiding the automation behind one unexplained answer.

### 1:35-1:55 — Human approval

> The graph pauses before dispatch. This is intentional: the system can
> recommend a route, but a supervisor must approve it.

Click Approve and show:

- `/chat/resume` behavior through the trace.
- Dispatcher output.
- Work-order IDs.

Optionally repeat with Reject:

> On rejection, no work orders are dispatched.

### 1:55-2:20 — Rules RAG

Ask:

```text
Can mess food waste be composted on campus?
```

Say:

> This answer is grounded in retrieved policy and regulation passages. The
> assistant shows document and clause citations. For questions outside its
> indexed evidence, it abstains rather than hallucinating.

### 2:20-2:40 — MCP

> The same backend tools are available through MCP. An MCP client can inspect
> bin levels, forecast waste, plan routes, create draft work orders, read KPIs,
> and ask rules questions.

### 2:40-3:00 — Impact and scale

> In our 30-day synthetic simulation, risk-triggered routing reduced distance,
> stops, and overflow bin-hours relative to the fixed daily baseline. These are
> simulated results, not a claim about a live campus. The deployment path is
> straightforward: connect sensor telemetry, calibrate building populations and
> routes, and expand from six buildings to larger campuses.

## 7. Impact metrics to present carefully

### What impact metrics do

Impact metrics convert the technical pipeline into operational and business
outcomes. They answer the judge's most important question: **what improves when
Binlytics is used instead of a fixed collection schedule?**

- **Distance per day / km saved:** measures vehicle travel. Lower distance can
  reduce fuel use, driver time, emissions, and fleet wear. It compares the
  fixed route over all bins with the risk-triggered route over flagged bins.
- **Stops per day:** measures unnecessary collection visits. Fewer stops mean
  less loading and unloading time and more capacity for urgent work.
- **Overflow bin-hours:** measures exposure to bins remaining at or above 100%
  fill. Lower bin-hours indicate better sanitation coverage; this is different
  from counting unique overflow incidents.
- **Forecast WAPE:** measures forecast error using
  `sum(abs(actual - predicted)) / sum(actual)`. Lower WAPE is better. Comparing
  LightGBM with seasonal-naive shows whether the model adds value over a simple
  baseline.
- **Route feasibility:** confirms that efficiency did not come from creating
  impossible routes. Every proposed route must respect truck capacity, shift
  duration, and stop-count constraints.

These metrics are not all the same kind of measurement. Distance, stops, and
overflow are impact outcomes from the 30-day synthetic replay. WAPE is a model
quality metric. Route feasibility is a safety/operational constraint. Together
they show efficiency, service quality, prediction quality, and reliability.

Current documented simulation:

| Metric | Fixed baseline | Risk-triggered simulation |
|---|---:|---:|
| Distance per day | 2.62 km | 1.86 km |
| Stops per day | 40 | 17.2 |
| Overflow bin-hours over 30 days | 1,535 | 337 |
| Forecast WAPE | 0.327 seasonal-naive | 0.282 LightGBM |

Use this wording:

> In our synthetic 30-day replay, the risk-triggered strategy reduced route
> kilometres by approximately 29%, reduced stops by approximately 57%, and
> reduced overflow bin-hours by approximately 78%.

Immediately add:

> These are simulation results using calibrated synthetic data. Live savings
> depend on telemetry quality, route density, truck capacity, and operating
> policy.

## 8. Cost and scale story

Prototype assumptions:

- Low-cost fill or weight sensors.
- Approximate sensor cost: INR 500–800 per bin.
- SQLite for the prototype.
- FastAPI backend.
- React TypeScript frontend.
- OR-Tools for optimization.
- Gemini API for explanations and synthesis.
- MCP for assistant interoperability.

Scale path:

1. Connect real sensor ingestion.
2. Add authentication and role-based approval.
3. Replace SQLite with a managed database.
4. Add route history and driver feedback.
5. Calibrate risk thresholds by building.
6. Add notifications after approved dispatch.
7. Expand from one campus to multiple campuses.

## 9. Safety and trust points

These are strong points to mention:

- Synthetic data is explicitly labelled.
- Human approval is required before dispatch.
- Agents create drafts rather than silently executing writes.
- Route plans are checked against constraints.
- RAG answers include citations.
- RAG abstains when evidence is weak.
- API failures are surfaced instead of being disguised as successful demos.
- Gemini API keys remain in `.env` and are not committed.
- The system emits a visible execution trace.

## 10. Likely judge questions and answers

### Is the data real?

> The current demo data is synthetic and calibrated to campus-like patterns.
> This protects privacy while exercising the complete pipeline. The APIs are
> designed for the same schema with real sensor readings.

### Why use AI instead of fixed thresholds?

> Fixed thresholds only react to the current state. Forecasting and risk
> estimation consider how quickly a bin is filling and whether it is likely to
> overflow during the next collection horizon.

### Why not let the agent dispatch automatically?

> Dispatch is an operational write action. We deliberately keep a supervisor
> approval gate so the system is explainable, auditable, and safe.

### How do you prevent hallucinations in rules answers?

> The RAG system retrieves source passages, attaches citations, restricts
> synthesis to retrieved context, and abstains below a relevance threshold.

### What happens if Gemini is unavailable?

> The operational route workflow remains deterministic, while LLM-dependent
> explanations report an explicit configuration or request error. The system
> does not present a fabricated AI answer.

### How is route quality measured?

> We compare risk-triggered routing with a fixed route over all bins and enforce
> truck payload, shift duration, stop count, and depot constraints.

### What is the business value?

> Fewer unnecessary stops, earlier intervention on likely overflow, measurable
> operational KPIs, auditable decisions, and a reusable control layer for campus
> sustainability teams.

## 11. Claims to avoid

Do not claim:

- That the data is live if the demo is using synthetic telemetry.
- That 29% savings are guaranteed in production.
- That the forecast is accurate for every building.
- That every regulation document is automatically current.
- That Gemini is used when the key or model is unavailable.
- That an approval dispatches work orders before the resume step.
- That a citation proves more than the retrieved source passage actually says.

## 12. Closing statement

> Binlytics is not just a dashboard and not just a chatbot. It is an
> explainable decision layer for campus waste operations: it predicts risk,
> optimizes action, grounds regulatory answers in evidence, and keeps people in
> control of real-world dispatch. The result is smarter data today and a
> cleaner tomorrow.
