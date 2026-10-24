# Metric definitions (owner: A). Measured from scripts/simulate_impact.py
- Baseline: every bin collected daily at 06:00 on one fixed route (simulator default).
- Ours: collect only bins with P(overflow in next 12h) >= 0.7, routed by OR-Tools.
- km saved % = (baseline_km - ours_km) / baseline_km * 100 (per day, averaged over 30 days)
- Trips saved = baseline stops - our stops
- Overflow bin-hours = count of bin-hours with fill_pct >= 100 (lower is better)
- Forecast WAPE = sum|y - yhat| / sum|y| on a time-based holdout; compare to seasonal-naive (lag 7)
- Segregation % = correctly segregated items / audited items (simulated unless VLM audit is built)
- Cost per bin: sensor (ESP32 + ultrasonic) ~ INR 500-800 + cloud/free-tier cost ~ 0

| metric | baseline | ours | delta |
|---|---|---|---|
| km/day | 2.62 km | 1.86 km | -29.0% |
| stops/day | 40 stops | 17.2 stops | -57.0% |
| overflow bin-hours (30d) | 1535 | 337 | -78.0% |
| forecast WAPE | 0.327 (seasonal-naive) | 0.282 (LightGBM) | -13.8% error |
