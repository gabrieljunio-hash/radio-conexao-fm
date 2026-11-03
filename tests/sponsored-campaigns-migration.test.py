#!/usr/bin/env python3
"""Validate the sponsored-campaign D1 migration and its safety constraints."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
migration = ROOT / "api/migrations/0004_sponsored_campaigns.sql"
sql = migration.read_text(encoding="utf-8")

db = sqlite3.connect(":memory:")
db.executescript(sql)
db.executescript(sql)  # Migration must be safe to retry.

db.execute("""
INSERT INTO sponsored_campaigns
(advertiser_name, title, destination_url, placement, status, starts_at, ends_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", (
    "Comércio local", "Oferta de teste", "https://example.com/oferta",
    "home", "draft", "2026-11-01T00:00:00.000Z", "2026-12-01T00:00:00.000Z"
))
row = db.execute("""
SELECT status, placement, impressions, clicks
FROM sponsored_campaigns WHERE id = 1
""").fetchone()
assert row == ("draft", "home", 0, 0), row

for placement in ("invalid", ""):
    try:
        db.execute("""
        INSERT INTO sponsored_campaigns
        (advertiser_name, title, destination_url, placement, starts_at, ends_at)
        VALUES ('Loja', 'Oferta', 'https://example.com', ?, '2026-11-01', '2026-12-01')
        """, (placement,))
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError(f"Invalid placement accepted: {placement!r}")

try:
    db.execute("""
    INSERT INTO sponsored_campaigns
    (advertiser_name, title, destination_url, placement, starts_at, ends_at)
    VALUES ('Loja', 'Oferta', 'https://example.com', 'home', '2026-12-01', '2026-11-01')
    """)
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Campaign with end date before start date was accepted")

print("PASS: sponsored campaigns migration is repeatable")
print("PASS: draft defaults, placement and date constraints")
