#!/usr/bin/env python3
"""Validate all ten corrected D1 import batches twice against an isolated SQLite fixture."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
BATCH_DIR = ROOT / "api/import-batches"
BATCHES = sorted(BATCH_DIR.glob("*.sql"))
assert len(BATCHES) == 10, f"Expected 10 SQL batches, found {len(BATCHES)}"

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript("""
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stream_url TEXT,
  website_url TEXT,
  logo_url TEXT,
  country_code TEXT,
  state TEXT,
  city TEXT,
  language TEXT,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_verified INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE station_categories (
  station_id INTEGER NOT NULL REFERENCES stations(id),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  UNIQUE(station_id, category_id)
);
""")

base_categories = [
    ("sertanejo", "Sertanejo"), ("noticias", "Notícias"),
    ("gospel", "Gospel"), ("pop", "Pop"), ("rock", "Rock"),
    ("flashback", "Flashback"), ("esportes", "Esportes"),
    ("adulto-contemporaneo", "Adulto contemporâneo"),
    ("popular", "Popular"), ("regional", "Regional"),
]
db.executemany("INSERT INTO categories (slug, name) VALUES (?, ?)", base_categories)
db.executemany(
    "INSERT INTO stations (slug, name, stream_url) VALUES (?, ?, ?)",
    [(f"seed-{i:02d}", f"Seed station {i}", f"https://example.com/{i}") for i in range(1, 25)],
)

def run_batches():
    for batch in BATCHES:
        try:
            db.executescript(batch.read_text(encoding="utf-8"))
        except sqlite3.Error as exc:
            raise RuntimeError(f"Failed SQL batch {batch.name}: {exc}") from exc

def counts():
    return (
        db.execute("SELECT COUNT(*) FROM stations").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM stations WHERE slug LIKE 'rb-%'").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM categories").fetchone()[0],
        db.execute("SELECT COUNT(*) FROM station_categories").fetchone()[0],
    )

run_batches()
first = counts()
assert first == (165, 141, 17, 140), f"Unexpected first-run totals: {first}"

# Re-running every batch must not duplicate stations, categories or links.
run_batches()
second = counts()
assert second == first, f"Import batches are not idempotent: first={first}, second={second}"

orphans = db.execute("""
SELECT COUNT(*) FROM station_categories sc
LEFT JOIN stations s ON s.id = sc.station_id
LEFT JOIN categories c ON c.id = sc.category_id
WHERE s.id IS NULL OR c.id IS NULL
""").fetchone()[0]
assert orphans == 0, f"Found {orphans} orphan category associations"

print("PASS: all 10 D1 batches executed twice")
print(f"Stations: {first[0]} total ({first[1]} imported)")
print(f"Categories: {first[2]} total")
print(f"Station/category links: {first[3]}")
print("PASS: idempotency and foreign-key associations")
