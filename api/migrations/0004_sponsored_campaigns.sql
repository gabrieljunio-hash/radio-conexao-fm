-- Campanhas de patrocinadores locais e promocao paga, sem dados pessoais.
CREATE TABLE IF NOT EXISTS sponsored_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  destination_url TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'home'
    CHECK (placement = 'home'),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused')),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (datetime(ends_at) > datetime(starts_at))
);

CREATE INDEX IF NOT EXISTS idx_sponsored_campaigns_active
  ON sponsored_campaigns (status, placement, starts_at, ends_at);
