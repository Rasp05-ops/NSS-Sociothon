# Binlytics

## Smarter data. Cleaner tomorrow.

## Judge-facing pitch guide

This document is written to be spoken to non-technical judges. It explains
what Binlytics does, why it matters, and what to show in the product. Avoid
leading with algorithms, APIs, databases, or model names. Lead with the
campus problem and the decision Binlytics helps a supervisor make.

---

## 1. The 30-second opening

> Every campus has the same waste problem: some bins overflow before the next
> collection, while collection vehicles still spend time visiting bins that
> are almost empty.
>
> Binlytics turns waste collection from a fixed timetable into a smart,
> priority-based service. It predicts where waste will build up, identifies
> which bins need attention, plans a practical route, explains why that route
> was chosen, and keeps a human supervisor in control before anything is
> dispatched.
>
> The result is a cleaner campus, fewer unnecessary trips, and better use of
> the people and vehicles already available.

### The memorable one-line version

> **Binlytics helps a campus collect the right waste, at the right place, at the
> right time, with a human always in control.**

---

## 2. The problem in simple terms

Most waste collection is scheduled by habit:

- A vehicle follows the same route every day.
- Empty bins receive the same attention as full bins.
- Busy hostels, messes, and event areas can overflow between visits.
- Supervisors have to make decisions using scattered readings, calls, and
  spreadsheets.
- A route may look efficient on a map but still be too long for a shift or
  too heavy for a vehicle.
- Rules and compliance questions take time to find and verify.

This creates two types of waste at the same time:

1. **Waste left unmanaged:** overflowing bins, unpleasant surroundings, and
   avoidable sanitation issues.
2. **Resources wasted:** unnecessary vehicle kilometres, fuel, staff time, and
   repeated visits to bins that do not need service.

### The transition to emphasize

> We are moving from **"visit every bin because the calendar says so"** to
> **"prioritize the bins that are most likely to need service."**

---

## 3. What Binlytics does: the complete story

Binlytics follows one clear operational loop:

1. It sees current and historical waste levels.
2. It forecasts how much waste each building is likely to generate.
3. It predicts which bins are likely to overflow soon.
4. It highlights the most urgent bins for the operations team.
5. It creates a route that respects vehicle capacity and staff working time.
6. A checking step challenges the plan before it is used.
7. A human supervisor approves or rejects the plan.
8. Approved work becomes a trackable collection task.
9. The dashboard shows the resulting operational and environmental impact.

This is important: Binlytics is not presented as an unchecked robot. It is a
decision-support system that makes a supervisor faster, better informed, and
more consistent.

---

## 4. Feature-by-feature explanation

### 4.1 The campus operations dashboard

**What it is:** A single screen for the health of the campus waste operation.

**What it shows:**

- Waste generated in the latest 24-hour period.
- Segregation performance.
- Recycling performance.
- Change compared with the previous week.
- Recent overflow activity.
- Route efficiency.
- Forecast quality.

**Why judges should care:** A supervisor should not need five spreadsheets to
understand whether the campus is under control. The dashboard turns many
individual readings into a quick answer:

> **What is happening today, where is attention needed, and are we improving?**

**Say this while showing it:**

> This is the operations control room. Instead of looking only at how much
> waste was produced after the fact, the team can see the current situation,
> the emerging risks, and the actions that should happen next.

---

### 4.2 The live risk map

**What it is:** A campus map where every bin has a clear priority level.

**What judges see:**

- All monitored campus bins on one map.
- Green, amber, and red risk indicators.
- Building filters.
- A risk filter to focus on urgent locations.
- Details for a selected bin, including current fill level and recent history.

**What the colours mean:**

- **Green:** unlikely to overflow soon.
- **Amber:** should be watched.
- **Red:** likely to need collection within the planning window.

**Why it matters:** The map makes the system understandable immediately. A
supervisor can see the campus situation without reading a technical report.
It also helps the team focus on service quality rather than treating every
location as equally urgent.

**Say this:**

> The map changes the question from "Which bins exist?" to "Which bins need
> attention first?"

---

### 4.3 Waste forecasting

**What it is:** A view of how much waste each building is expected to produce.

**What it considers in everyday language:**

- What the building produced recently.
- Its normal weekly rhythm.
- Weekdays versus weekends.
- Typical recent activity.
- The uncertainty around the estimate.

**What judges see:**

- An expected amount of waste.
- A lower and upper range rather than false precision.
- A comparison with a simple previous-pattern estimate.

**Why it matters:** A forecast gives the team time to prepare. If a hostel,
mess, or event area is likely to generate more waste tomorrow, the team can
adjust collection planning before the problem appears.

**Say this:**

> We are not claiming that the future can be predicted perfectly. We show the
> expected level and the uncertainty, so the supervisor can plan with
> appropriate confidence.

**Credibility note:** On the current synthetic dataset, the forecast performs
better than the simple baseline in most buildings, but performance varies by
building. This is why the product shows the comparison instead of claiming
perfect prediction.

---

### 4.4 Overflow prediction

**What it is:** A warning system that estimates whether a bin will reach full
capacity within the next planning window.

**Why it is different from a simple fill-level display:**

A bin that is 70% full may be safe in a quiet academic building but urgent in a
busy mess before lunch. Binlytics looks at recent behaviour and context, not
just one number at one moment.

**What it enables:**

- Early action before overflow.
- Priority-based collection.
- Fewer unnecessary visits.
- Better attention to high-use locations.

**Say this:**

> A full bin tells us there is already a problem. Binlytics tries to warn us
> while there is still time to prevent that problem.

---

### 4.5 Smart collection routes

**What it is:** A route recommendation for the bins that actually need
attention.

**What the route takes into account:**

- Which bins are high priority.
- Where the depot is.
- How many vehicles are available.
- How much each vehicle can carry.
- How long the shift can last.
- How many stops a route can practically include.

**Why this is impressive to a non-technical audience:** It is not merely a
line drawn between map points. It is a practical collection plan that respects
real operating limits.

**What judges should notice:**

- The route has an order.
- Each route has a vehicle assignment.
- Stops have estimated arrival times.
- Distance and duration are visible.
- The plan can be compared with the fixed daily route.

**Say this:**

> The goal is not to send a vehicle everywhere. The goal is to send the right
> vehicle to the right priority locations without creating an impossible shift.

---

### 4.6 The planner and the checking step

**What it is:** Two complementary decision roles inside the system.

**The planner:** Creates a proposed collection plan from the current risk
  information.

**The checker:** Questions the plan before it reaches the supervisor. It looks
  for problems such as:

- A route taking too long.
- Too many stops.
- Too much payload for one vehicle.
- No usable route being created.

If a plan fails a constraint, the system can try again with a safer plan.

**Why it matters:** Good automation should not only produce an answer. It
should also challenge its own answer before asking a person to trust it.

**Say this:**

> One part of Binlytics proposes the route, and another part tries to find
> reasons the route should not be used. That gives the supervisor a safer,
> more explainable recommendation.

---

### 4.7 Human approval and the work-order inbox

**What it is:** The safety and accountability layer.

The system creates a proposed task, not an uncontrolled dispatch. A supervisor
can:

- Review the route.
- See the stops and distance.
- Preview the route on the map.
- Add a note.
- Approve the work.
- Reject the work.

After approval, the task becomes a real work order with a status, decision
maker, timestamp, and route details.

If the supervisor rejects the plan, no collection work order is dispatched.

**Why judges should care:** Waste operations affect staff, vehicles, public
spaces, and campus schedules. Human approval makes the system responsible,
auditable, and easier to adopt.

**Say this:**

> Binlytics does not remove the supervisor. It gives the supervisor a better
> recommendation and a clear final decision.

---

### 4.8 Live chat with the operations assistant

**What it is:** A natural-language way to ask the system for an operational
  action or explanation.

Example questions:

- "Which buildings need attention today?"
- "Plan tonight's collection."
- "Why was this route selected?"
- "What is the forecast for the hostels?"

The assistant shows its progress rather than hiding it. The supervisor can see
the plan being prepared, checked, sent for approval, and completed.

**Why it matters:** A busy operations team should not need to learn a complex
  software workflow for every question. Chat makes the data and actions
  accessible through ordinary language while preserving the approval step.

**Say this:**

> The assistant is not just answering a question in a chat bubble. It can
> coordinate the operational workflow, show what it is doing, and stop for
> human approval before action.

---

### 4.9 Rules and compliance assistant

**What it is:** A source-grounded assistant for waste-management questions.

Example question:

> Can food waste from the mess be composted on campus, and what guidance
> supports that decision?

The assistant searches the available rules and guidance, gives a concise
answer, and points to the supporting source. If the question is outside the
available evidence, it can say that it does not have enough information
instead of inventing a confident answer.

**Why it matters:** Compliance work is not only about getting an answer. It is
about being able to explain where the answer came from.

**Say this:**

> The assistant is designed to be useful without pretending to know
> everything. It gives evidence when it can and abstains when the evidence is
> insufficient.

---

### 4.10 Impact and comparison view

**What it is:** A simple comparison between the traditional fixed schedule
and the risk-triggered approach.

It answers:

- How far did vehicles travel?
- How many stops were made?
- How much overflow exposure occurred?
- Did forecasting improve planning confidence?

The purpose is not to display impressive numbers in isolation. The purpose is
to show the difference between two operating approaches using the same
simulated campus.

---

### 4.11 Extensibility for other assistants

Binlytics can expose the same approved capabilities to other assistant
interfaces, such as a campus helpdesk assistant or an external operations
assistant.

**Explain this without jargon:**

> We have designed the capabilities as reusable services. A future campus
> assistant can use the same bin data, forecasting, route planning, work-order
> and rules features instead of rebuilding them from scratch.

This means Binlytics can start as a dashboard and later become part of a
larger campus operations platform.

---

## 5. The end-to-end demo story

Use this sequence instead of explaining screens independently.

### Step 1: Start with the problem

Show the dashboard and say:

> A fixed schedule treats every bin equally. That is inefficient and still
> allows high-use locations to overflow between visits.

### Step 2: Show the campus situation

Open the risk map:

> Here, the campus is no longer just a list of bins. We can see which
> locations are safe, which need watching, and which are likely to overflow
> soon.

Select a red bin and show its recent readings:

> This gives the supervisor context before sending a vehicle.

### Step 3: Show the forecast

Open the forecast:

> The system also looks ahead. It estimates upcoming waste generation by
> building and shows uncertainty, so the team can prepare rather than react.

### Step 4: Ask for a collection plan

In chat, say:

> Plan tonight's collection for the high-risk bins.

Explain:

> The planner creates a route for the priority bins. The checking step verifies
> that the route fits the vehicle, stop, and shift constraints.

### Step 5: Show the human decision

When the approval request appears:

> The system has made a recommendation, but it has not dispatched anything.
> The supervisor can inspect the plan and approve or reject it.

Click Approve:

> Only now does the recommendation become a work order.

If showing rejection instead:

> If the supervisor rejects it, no work order is created. This is deliberate:
> efficiency must not come at the cost of accountability.

### Step 6: Ask a rules question

Open the rules assistant:

> The same platform can answer a waste-management question using cited
> guidance, so operations and compliance are connected in one place.

### Step 7: Finish with impact

Open the impact view:

> In our 30-day synthetic replay, the risk-triggered approach reduced
> unnecessary travel, reduced stops, and reduced the amount of time bins stayed
> overloaded. These are measured comparisons in the prototype, not promises
> about every future campus.

---

## 6. Impact metrics: what each number means

Impact metrics turn a technical demonstration into an operational story. Each
one answers a different judge question.

| Metric | What it measures | Why it matters |
|---|---|---|
| Distance per day | Vehicle travel under each collection approach | Indicates potential fuel, time, emissions, and vehicle-wear savings |
| Stops per day | How many collection visits are made | Shows how much unnecessary work is avoided |
| Overflow bin-hours | How long bins remain at or above capacity | Indicates sanitation and service-level improvement |
| Forecast WAPE | Forecast error; lower is better | Shows whether planning information is becoming more reliable |
| Route feasibility | Whether the plan fits vehicle and shift limits | Proves that efficiency is practical, not achieved by an impossible route |

### Current synthetic replay

The following values come from the documented 30-day synthetic replay:

- **Distance:** 2.62 km/day to 1.86 km/day, a 29% reduction.
- **Stops:** 40/day to 17.2/day, 57% fewer stops.
- **Overflow bin-hours:** 1,535 to 337, a 78% reduction.
- **Forecast error:** WAPE improves from 0.327 for the seasonal baseline to
  0.282 for the model.

### How to present these numbers honestly

Say:

> These results are from a controlled synthetic replay comparing a fixed
> schedule with risk-triggered collection. They show the direction and
> potential of the approach. A live pilot would measure actual fuel, labour,
> sanitation outcomes, and cost before making a production claim.

Do not say:

- "This will always save 29%."
- "Overflow is eliminated."
- "The system guarantees a payback period."
- "The model is perfect."

### Why the comparison is meaningful

Raw numbers do not show improvement by themselves. The value comes from
comparing two approaches on the same simulated campus:

- The **baseline** visits every bin on a fixed schedule.
- The **risk-triggered approach** prioritizes bins likely to need service and
  plans feasible routes.

That makes the impact understandable and testable.

---

## 7. Why this is more than a dashboard

Many products can display a number. Binlytics connects the complete decision
cycle:

1. **Sense:** understand current levels.
2. **Predict:** see what is likely to happen next.
3. **Prioritize:** identify where action matters most.
4. **Plan:** create a practical route.
5. **Challenge:** check whether the plan is safe and feasible.
6. **Approve:** keep a responsible person in control.
7. **Act:** create a trackable work order.
8. **Learn:** compare results and improve future decisions.

That closed loop is the main innovation to emphasize.

---

## 8. Benefits for each stakeholder

### Campus administrators

- A single view of waste performance.
- Evidence for sustainability reporting.
- Better visibility into service quality and resource use.

### Waste supervisors

- Earlier warnings.
- Fewer manual decisions.
- Explainable route recommendations.
- Clear approval and audit history.

### Collection staff

- Better organized routes.
- Fewer unnecessary stops.
- More predictable shift planning.

### Students and campus community

- Cleaner, less frequently overflowing shared spaces.
- Better support for segregation and recycling.
- A campus that uses resources responsibly.

### Sustainability teams

- Measurable baselines and improvement indicators.
- A path from synthetic pilot data to real sensor data.
- A foundation for future emissions and diversion reporting.

---

## 9. What is real in this prototype and what comes next

### Demonstrated in the prototype

- A complete campus waste operations workflow.
- Risk visualization for 40 bins across six buildings.
- Forecast and overflow-priority views.
- Constraint-aware route recommendations.
- Planner, checking, and approval workflow.
- Real human approval before work-order creation.
- Live progress shown in chat.
- Cited rules assistance.
- Impact comparison against a fixed schedule.

### Deliberately labelled as next-step work

- Connecting physical sensors on live bins.
- Measuring actual fuel, labour, and emissions savings.
- Validating forecast quality on each campus's own history.
- Integrating with existing campus work-order or fleet systems.
- Adding production notifications to collection crews.
- Running a supervised pilot and recalibrating thresholds.

This distinction strengthens the pitch. It shows that the team understands the
difference between a working product demonstration and a production
deployment.

---

## 10. Scale and rollout plan

### Phase 1: supervised pilot

- Select one campus zone.
- Connect a limited number of bins.
- Keep the existing fixed route as a safety fallback.
- Compare predictions with actual overflow and collection records.

### Phase 2: operational adoption

- Expand to hostels, messes, and high-traffic areas.
- Connect supervisor approval to existing work orders.
- Calibrate thresholds by building and time of day.

### Phase 3: campus-wide intelligence

- Add more buildings and vehicles.
- Track fuel, labour, emissions, and waste diversion.
- Provide sustainability reports and cross-campus comparisons.

The platform can begin small because the highest-value locations are usually
the busiest messes, hostels, event spaces, and shared facilities.

---

## 11. Frequently asked judge questions

### "Is this just a map?"

> No. The map is the easiest way to understand the situation. Behind it is a
> complete loop: forecast, overflow risk, route recommendation, checking,
> human approval, work order, and impact measurement.

### "Will the system replace sanitation workers?"

> No. It reduces avoidable travel and improves planning. People remain
> responsible for collection, judgement, and final approval.

### "What happens if the prediction is wrong?"

> The system shows uncertainty, uses current readings, keeps the supervisor in
> control, and applies route constraints. A live pilot would also compare
> predictions with actual outcomes and recalibrate the system.

### "Can it work without expensive smart bins?"

> The prototype uses generated data so the workflow can be demonstrated safely.
> In deployment, the same interface can receive fill or weight readings from
> ultrasonic or weight sensors. A phased rollout can start with the most
> important locations.

### "Where did the impact numbers come from?"

> They come from a documented 30-day synthetic replay comparing fixed daily
> collection with risk-triggered, constraint-aware collection. They are
> prototype evidence, not guaranteed production savings.

### "What makes this intelligent?"

> It does not only report what happened. It estimates what will happen next,
> recommends an action, checks that action, explains it, and waits for a human
> decision before dispatch.

### "What happens when the AI does not know?"

> The rules assistant is designed to cite available guidance and abstain when
> the evidence is insufficient. That is safer than presenting an unsupported
> answer with confidence.

### "Why is human approval necessary?"

> Because a route affects people, vehicles, and campus operations. Automation
> should accelerate decisions without removing accountability.

---

## 12. Strong closing

> Binlytics is not trying to make waste management complicated. It makes the
> right decision visible at the right time.
>
> Instead of collecting everything on a fixed schedule and reacting after
> overflow, a campus can anticipate demand, prioritize service, plan practical
> routes, and keep people in control.
>
> That is the path to a cleaner campus with smarter use of every trip, every
> worker, and every resource.

**Binlytics: Smarter data. Cleaner tomorrow.**
