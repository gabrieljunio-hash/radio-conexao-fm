PRAGMA foreign_keys = ON;

-- Catalogo principal de emissoras.
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  website_url TEXT,
  logo_url TEXT,
  country_code TEXT NOT NULL DEFAULT 'BR',
  state TEXT,
  city TEXT,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  is_verified INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stations_active_name
  ON stations (is_active, name);
CREATE INDEX IF NOT EXISTS idx_stations_location
  ON stations (country_code, state, city);

-- Categorias (sertanejo, notícias, gospel, pop etc.).
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS station_categories (
  station_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (station_id, category_id),
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_station_categories_category
  ON station_categories (category_id, station_id);

-- Identidade externa: nao armazenar senhas neste banco.
-- auth_subject deve ser o identificador fornecido pelo provedor de autenticacao.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth_provider TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'listener'
    CHECK (role IN ('listener', 'editor', 'admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (auth_provider, auth_subject)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, station_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorites_station
  ON favorites (station_id);

-- Eventos agregaveis de audiencia. Nao guardar IP ou dados pessoais aqui.
CREATE TABLE IF NOT EXISTS play_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('play', 'stop', 'heartbeat')),
  session_id TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_play_events_station_date
  ON play_events (station_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_play_events_type_date
  ON play_events (event_type, occurred_at);

-- Sugestoes de novas emissoras enviadas pelos visitantes.
CREATE TABLE IF NOT EXISTS station_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_name TEXT NOT NULL,
  stream_url TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_status_date
  ON station_submissions (status, created_at);

-- Categorias iniciais para o catalogo.
INSERT OR IGNORE INTO categories (slug, name) VALUES
  ('sertanejo', 'Sertanejo'),
  ('gospel', 'Gospel'),
  ('noticias', 'Notícias'),
  ('esportes', 'Esportes'),
  ('pop', 'Pop'),
  ('rock', 'Rock'),
  ('flashback', 'Flashback'),
  ('adulto-contemporaneo', 'Adulto contemporâneo'),
  ('popular', 'Popular'),
  ('regional', 'Regional');
