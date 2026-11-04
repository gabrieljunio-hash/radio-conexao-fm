#!/usr/bin/env python3
"""Validate the external-audience D1 migration and its constraints."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
migration = ROOT / "api/migrations/0005_external_audience.sql"
sql = migration.read_text(encoding="utf-8")

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
db.executescript(sql)
db.executescript(sql)  # Migration must be safe to retry.

db.execute(
    "INSERT INTO audience_stations (station_key, name, logo_url) VALUES (?, ?, ?)",
    ("rb-radio-mix", "Rádio Mix", "https://example.com/logo.png"),
)
station_id = db.execute(
    "SELECT id FROM audience_stations WHERE station_key = ?",
    ("rb-radio-mix",),
).fetchone()[0]
db.execute(
    "INSERT INTO audience_events (station_id, event_type, session_id) VALUES (?, ?, ?)",
    (station_id, "play", "123e4567-e89b-42d3-a456-426614174000"),
)

row = db.execute(
    "SELECT event_type, session_id FROM audience_events WHERE station_id = ?",
    (station_id,),
).fetchone()
assert row == ("play", "123e4567-e89b-42d3-a456-426614174000"), row

for event_type in ("invalid", ""):
    try:
        db.execute(
            "INSERT INTO audience_events (station_id, event_type) VALUES (?, ?)",
            (station_id, event_type),
        )
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError(f"Invalid audience event type accepted: {event_type!r}")

try:
    db.execute(
        "INSERT INTO audience_events (station_id, event_type) VALUES (?, ?)",
        (99999, "play"),
    )
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Audience event with missing station was accepted")

try:
    db.execute(
        "INSERT INTO audience_stations (station_key, name) VALUES (?, ?)",
        ("rb-radio-mix", "Duplicate"),
    )
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Duplicate external station key was accepted")

indexes = {
    row[0] for row in db.execute(
        "SELECT name FROM sqlite_master WHERE type = 'index'"
    ).fetchall()
}
assert "idx_audience_events_station_date" in indexes, indexes
assert "idx_audience_events_type_date" in indexes, indexes

db.execute("DELETE FROM audience_stations WHERE id = ?", (station_id,))
remaining = db.execute(
    "SELECT COUNT(*) FROM audience_events WHERE station_id = ?",
    (station_id,),
).fetchone()[0]
assert remaining == 0, f"Expected cascading event deletion, found {remaining}"

print("PASS: external audience migration is repeatable")
print("PASS: event types, unique station keys, foreign keys and indexes")
