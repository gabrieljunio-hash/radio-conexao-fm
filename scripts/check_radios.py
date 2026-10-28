#!/usr/bin/env python3
"""Check radio streams and update the shared JSON consumed by the GitHub Pages site."""
import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUS_PATH = ROOT / "data" / "radio-status.json"
API_URLS = [
    "https://de1.api.radio-browser.info/json/stations/search?countrycode=BR&hidebroken=true&is_https=true&order=clickcount&reverse=true&limit=100",
    "https://fr1.api.radio-browser.info/json/stations/search?countrycode=BR&hidebroken=true&is_https=true&order=clickcount&reverse=true&limit=100",
    "https://nl1.api.radio-browser.info/json/stations/search?countrycode=BR&hidebroken=true&is_https=true&order=votes&reverse=true&limit=100",
]
USER_AGENT = "ConexaoFM-RadioHealth/1.0 (GitHub Actions)"
TIMEOUT = 8


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def test_stream(url):
    """Check that an HTTPS stream responds and returns stream-like bytes, not an HTML error page."""
    if not isinstance(url, str) or not url.startswith("https://"):
        return False, "https-required", None
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "*/*",
            "Range": "bytes=0-4095",
            "Icy-MetaData": "0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
            status = getattr(response, "status", 200)
            content_type = response.headers.get("Content-Type", "").lower()
            sample = response.read(4096)
            if status not in (200, 206):
                return False, "http-" + str(status), status
            if not sample:
                return False, "empty-response", status
            if "text/html" in content_type or sample.lstrip().lower().startswith((b"<!doctype html", b"<html")):
                return False, "html-response", status
            return True, "stream-reachable", status
    except urllib.error.HTTPError as exc:
        return False, "http-" + str(exc.code), exc.code
    except Exception as exc:
        return False, exc.__class__.__name__.lower(), None


def main():
    try:
        previous = json.loads(STATUS_PATH.read_text(encoding="utf-8"))
    except Exception:
        previous = {"stations": []}
    old_by_id = {item.get("id"): item for item in previous.get("stations", []) if item.get("id")}

    stations = None
    for api_url in API_URLS:
        try:
            result = fetch_json(api_url)
            if isinstance(result, list) and result:
                stations = result
                break
        except Exception as exc:
            print("Directory failed:", api_url.split("/")[2], exc.__class__.__name__)
    if not stations:
        raise SystemExit("Could not fetch the radio directory; preserving previous JSON rather than marking every station down.")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    result = []
    seen = set()
    for station in stations:
        name = str(station.get("name") or "").strip()
        uuid = str(station.get("stationuuid") or "").strip()
        url = str(station.get("url_resolved") or station.get("url") or "").strip()
        if not name or not uuid or not url.startswith("https://") or uuid in seen:
            continue
        if int(station.get("lastcheckok") or 0) != 1 or int(station.get("hls") or 0) == 1:
            continue
        codec = str(station.get("codec") or "").upper()
        if codec and codec not in {"MP3", "AAC", "AAC+", "AACPLUS", "MPEG"}:
            continue
        if int(station.get("bitrate") or 0) > 320:
            continue
        seen.add(uuid)
        station_id = "rb-" + uuid
        old = old_by_id.get(station_id, {})
        ok, reason, http_status = test_stream(url)
        successes = int(old.get("successes") or 0)
        failures = int(old.get("failures") or 0)
        if ok:
            successes += 1
        else:
            failures += 1
        tags = str(station.get("tags") or "").lower()
        combined = tags + " " + name.lower()
        genre = "Pop"
        if any(word in combined for word in ("sertanej", "country", "caipira", "forro", "forró", "brega")):
            genre = "Sertanejo"
        elif any(word in combined for word in ("flashback", "oldies", "80s", "90s", "classic", "nostalgia", "disco")):
            genre = "Flashback"
        elif any(word in combined for word in ("news", "noticia", "notícia", "jornal", "talk", "information")):
            genre = "Notícias"
        elif any(word in combined for word in ("gospel", "christian", "evangel")):
            genre = "Gospel"
        elif any(word in combined for word in ("rock", "metal", "alternative")):
            genre = "Pop"
        initials = "".join(word[0] for word in name.split()[:3]).upper()[:5]
        city = ", ".join(filter(None, [station.get("state"), station.get("country")])) or "Brasil"
        result.append({
            "id": station_id,
            "stationuuid": uuid,
            "name": name,
            "city": city,
            "genre": genre,
            "tagline": ", ".join(filter(None, tags.split(",")[:2])) or "Rádio online",
            "streamUrl": url,
            "initials": initials,
            "codec": codec,
            "bitrate": int(station.get("bitrate") or 0),
            "ok": ok,
            "reason": reason,
            "httpStatus": http_status,
            "successes": successes,
            "failures": failures,
            "checkedAt": now,
            "lastSuccess": now if ok else old.get("lastSuccess"),
            "clickcount": int(station.get("clickcount") or 0),
            "source": "Radio Browser",
        })
        # Be polite to radio hosts and keep the workflow run bounded.
        time.sleep(0.15)

    result.sort(key=lambda s: (0 if s["ok"] else 1, -s["successes"] if s["ok"] else s["failures"], -s["clickcount"], s["name"].casefold()))
    payload = {
        "schemaVersion": 1,
        "updatedAt": now,
        "checkIntervalMinutes": 30,
        "source": "Radio Browser",
        "checkMethod": "HTTPS request + response bytes (not a full audio decode)",
        "total": len(result),
        "working": sum(1 for s in result if s["ok"]),
        "failed": sum(1 for s in result if not s["ok"]),
        "stations": result,
        "note": "Automatically generated. A reachable stream can still fail in some browsers; status is a periodic snapshot.",
    }
    STATUS_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Updated", STATUS_PATH, "total=", len(result), "working=", payload["working"], "failed=", payload["failed"])


if __name__ == "__main__":
    main()
