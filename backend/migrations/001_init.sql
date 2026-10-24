-- OWNER: A. SQLite for the 12h build (swap to Postgres later only if time remains). UTC timestamps, ISO-8601 text.
CREATE TABLE IF NOT EXISTS bins (
  bin_id TEXT PRIMARY KEY, building_id TEXT NOT NULL, lat REAL NOT NULL, lon REAL NOT NULL,
  capacity_l INTEGER NOT NULL, category TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS readings (
  ts TEXT NOT NULL, bin_id TEXT NOT NULL REFERENCES bins(bin_id), fill_pct REAL NOT NULL, weight_kg REAL NOT NULL,
  PRIMARY KEY (bin_id, ts));
CREATE INDEX IF NOT EXISTS idx_readings_ts ON readings(ts);
CREATE TABLE IF NOT EXISTS collections (
  ts TEXT NOT NULL, bin_id TEXT NOT NULL REFERENCES bins(bin_id), source TEXT NOT NULL DEFAULT 'baseline_fixed',
  PRIMARY KEY (bin_id, ts));
CREATE TABLE IF NOT EXISTS work_orders (
  work_order_id TEXT PRIMARY KEY, route_id TEXT NOT NULL, status TEXT NOT NULL, created_ts TEXT NOT NULL,
  decided_by TEXT, notes TEXT, route_json TEXT);
CREATE TABLE IF NOT EXISTS segregation_audits (
  ts TEXT NOT NULL, building_id TEXT NOT NULL, correct_pct REAL NOT NULL, source TEXT NOT NULL DEFAULT 'sim');
CREATE TABLE IF NOT EXISTS agent_trace (
  trace_id TEXT NOT NULL, ts TEXT NOT NULL, agent TEXT NOT NULL, type TEXT NOT NULL, payload_json TEXT NOT NULL);
