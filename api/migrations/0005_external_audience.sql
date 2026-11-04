-- Audiencia de radios externas ao catalogo principal (Radio Browser e busca).
-- Mantem as radios externas fora do catalogo publico, mas permite contabilizar execucoes reais.
CREATE TABLE IF NOT EXISTS audience_stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audience_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'stop', 'heartbeat')),
  session_id TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES audience_stations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audience_events_station_date
  ON audience_events (station_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_audience_events_type_date
  ON audience_events (event_type, occurred_at);
