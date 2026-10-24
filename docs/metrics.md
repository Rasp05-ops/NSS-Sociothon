# Metric definitions (owner: A). Fill the numbers from scripts/simulate_impact.py; never quote numbers you did not measure.
- Baseline: every bin collected daily at 06:00 on one fixed route (simulator default).
- Ours: collect only bins with P(overflow in next 12h) >= 0.7, routed by OR-Tools.
- km saved % = (baseline_km - ours_km) / baseline_km * 100 (per day, averaged over 30 days)
- Trips saved = baseline stops - our stops
- Overflow bin-hours = count of bin-hours with fill_pct >= 100 (lower is better)
- Forecast WAPE = sum|y - yhat| / sum|y| on a time-based holdout; compare to seasonal-naive (lag 7)
- Segregation % = correctly segregated items / audited items (simulated unless VLM audit is built)
- Cost per bin: sensor (ESP32 + ultrasonic) ~ INR 500-800 (verify quotes) + cloud/free-tier cost ~ 0
| metric | baseline | ours | delta |
|---|---|---|---|
| km/day | TODO | TODO | TODO |
| stops/day | TODO | TODO | TODO |
| overflow bin-hours (30d) | TODO | TODO | TODO |
| forecast WAPE | TODO (naive) | TODO | TODO |
