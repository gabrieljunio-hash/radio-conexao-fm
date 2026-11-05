import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ORIGIN = "https://feature-platform-expansion-2.radio-conexao-fm.pages.dev";
const SESSION = "123e4567-e89b-42d3-a456-426614174000";

function mockDb({ recentHeartbeat = null } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          calls.push({ type: "first", sql, values: this.values });
          if (sql.includes("SELECT id FROM stations")) return { id: 24 };
          if (sql.includes("SELECT id FROM audience_stations")) return { id: 42 };
          if (sql.includes("SELECT id FROM audience_events")) return null;
          if (sql.includes("SELECT id FROM play_events")) return recentHeartbeat;
          if (sql.includes("SELECT 1 AS db_ok")) return { db_ok: 1 };
          return null;
        },
        async run() {
          calls.push({ type: "run", sql, values: this.values });
          return { success: true };
        },
        async all() { return { results: [] }; }
      };
      return statement;
    }
  };
}

async function postEvent(DB, payload) {
  return worker.fetch(new Request("https://api.example.com/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify(payload)
  }), { DB });
}

test("POST /api/events rejects invalid event types without writing", async () => {
  const DB = mockDb();
  const response = await postEvent(DB, {
    event_type: "impression",
    station_slug: "radio-teste",
    session_id: SESSION
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_event_type");
  assert.equal(DB.calls.length, 0);
});

test("POST /api/events records a valid catalog play without personal data", async () => {
  const DB = mockDb();
  const response = await postEvent(DB, {
    event_type: "play",
    station_slug: "radio-teste",
    session_id: SESSION
  });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.deepEqual(await response.json(), { ok: true, recorded: true });
  const insert = DB.calls.find(call => call.type === "run");
  assert.match(insert.sql, /INSERT INTO play_events/);
  assert.deepEqual(insert.values, [24, "play", SESSION]);
  assert.equal(insert.values.length, 3);
});

test("POST /api/events records Radio Browser stations outside the public catalog", async () => {
  const DB = mockDb();
  const response = await postEvent(DB, {
    event_type: "play",
    station_slug: "rb-570cc99a-9159-4d91-9a8f-96ddb5b30797",
    station_name: "Rádio Mix",
    station_logo: "https://example.test/logo.png",
    session_id: SESSION
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, recorded: true });
  const register = DB.calls.find(call => call.type === "run" && call.sql.includes("INSERT INTO audience_stations"));
  assert.deepEqual(register.values, ["rb-570cc99a-9159-4d91-9a8f-96ddb5b30797", "Rádio Mix", "https://example.test/logo.png"]);
  const insert = DB.calls.find(call => call.type === "run" && call.sql.includes("INSERT INTO audience_events"));
  assert.deepEqual(insert.values, [42, "play", SESSION]);
});

test("POST /api/events rejects external stations without a valid identity and name", async () => {
  const DB = mockDb();
  const response = await postEvent(DB, {
    event_type: "play",
    station_slug: "rb-",
    station_name: "",
    session_id: SESSION
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_station_slug");
});

test("POST /api/events rejects unknown stations", async () => {
  const DB = mockDb();
  DB.prepare = sql => ({
    bind() { return this; },
    async first() { return null; }
  });
  const response = await postEvent(DB, {
    event_type: "play",
    station_slug: "nao-existe",
    session_id: SESSION
  });
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "station_not_found");
});

test("POST /api/events deduplicates repeated heartbeats", async () => {
  const DB = mockDb({ recentHeartbeat: { id: 99 } });
  const response = await postEvent(DB, {
    event_type: "heartbeat",
    station_slug: "radio-teste",
    session_id: SESSION
  });
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, recorded: false });
  assert.equal(DB.calls.some(call => call.type === "run"), false);
});

test("API health route remains available", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/health"),
    { DB: mockDb() }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "online", database: "connected" });
});


test("GET /api/stats returns aggregated metrics for the selected period", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async first() {
          calls.push({ type: "first", sql: this.sql, values: this.values });
          return { plays: 12, sessions: 5, stops: 3, heartbeats: 24 };
        },
        async all() {
          calls.push({ type: "all", sql: this.sql, values: this.values });
          if (this.sql.includes("GROUP BY slug, name, logo_url")) {
            return { results: [{ slug: "radio-teste", name: "Rádio Teste", logo_url: null, plays: 8, sessions: 4 }] };
          }
          return { results: [{ day: "2026-10-31", plays: 8, sessions: 4 }] };
        }
      };
    }
  };
  const response = await worker.fetch(
    new Request("https://api.example.com/api/stats?period=30d", { headers: { Origin: ORIGIN } }),
    { DB }
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  const data = await response.json();
  assert.equal(data.period, "30d");
  assert.deepEqual(data.summary, { plays: 12, sessions: 5, stops: 3, heartbeats: 24 });
  assert.equal(data.top_stations[0].slug, "radio-teste");
  assert.equal(data.daily[0].plays, 8);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(call => call.values[0] === "-30 days"));
  assert.ok(calls.some(call => call.sql.includes("audience_events")), "stats must aggregate external radio events");
});

test("GET /api/stats defaults to 7 days and never returns session identifiers", async () => {
  const DB = {
    prepare(sql) {
      return {
        sql, values: [],
        bind(...values) { this.values = values; return this; },
        async first() { return { plays: 0, sessions: 0, stops: 0, heartbeats: 0 }; },
        async all() { return { results: [] }; }
      };
    }
  };
  const response = await worker.fetch(new Request("https://api.example.com/api/stats?period=invalid"), { DB });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.period, "7d");
  assert.equal(JSON.stringify(data).includes(SESSION), false);
});


test("admin API rejects requests without a valid bearer token", async () => {
  const DB = mockDb();
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/summary"),
    { DB, ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
  assert.equal(DB.calls.length, 0);
});

test("admin API reports missing secret instead of exposing management routes", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/summary"),
    { DB: mockDb() }
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "admin_not_configured");
});

test("admin API summary requires the bearer token and disables caching", async () => {
  const DB = mockDb();
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/summary", {
      headers: { Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop", Origin: ORIGIN }
    }),
    { DB, ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.ok(DB.calls.length >= 4);
});

test("admin preflight allows Authorization header", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/summary", {
      method: "OPTIONS",
      headers: { Origin: ORIGIN, "Access-Control-Request-Headers": "authorization,content-type" }
    }),
    { DB: mockDb() }
  );
  assert.equal(response.status, 204);
  assert.match(response.headers.get("Access-Control-Allow-Headers"), /Authorization/i);
});


test("admin stream tester blocks localhost and private network targets", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/test-stream", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop", "Content-Type": "application/json" },
      body: JSON.stringify({ stream_url: "http://127.0.0.1:8080/live" })
    }),
    { DB: mockDb(), ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_stream_url");
});

test("manual station creation cannot bypass the server-side audio test", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503, headers: { "Content-Type": "text/plain" } });
  try {
    const response = await worker.fetch(
      new Request("https://api.example.com/api/admin/stations", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Rádio Teste", stream_url: "https://stream.example.test/live" })
      }),
      { DB: mockDb(), ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
    );
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error, "stream_test_failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("public promotions only query the requested placement", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) { this.values = values; return this; },
        async all() { calls.push({ sql, values: this.values }); return { results: [{ id: 7, title: "Patrocinador teste" }] }; }
      };
    }
  };
  const response = await worker.fetch(
    new Request("https://api.example.com/api/promotions?placement=home", { headers: { Origin: ORIGIN } }),
    { DB }
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).campaigns, [{ id: 7, title: "Patrocinador teste" }]);
  assert.deepEqual(calls[0].values, ["home"]);
  assert.match(calls[0].sql, /status = 'active'/);
  assert.match(calls[0].sql, /datetime\(ends_at\) > datetime\('now'\)/);
});

test("public promotions reject unknown placements", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/promotions?placement=unknown"),
    { DB: mockDb() }
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_placement");
});

test("promotion event endpoint accepts only impressions and clicks", async () => {
  const DB = { calls: [], prepare(sql) {
    return { values: [], bind(...values) { this.values = values; return this; },
      async run() { DB.calls.push({ sql, values: this.values }); return { meta: { changes: 1 } }; } };
  }};
  const response = await worker.fetch(
    new Request("https://api.example.com/api/promotions/7/event", {
      method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN, "CF-Connecting-IP": "203.0.113.11" },
      body: JSON.stringify({ event_type: "click" })
    }), { DB, PROMOTION_LIMITER: { async limit() { return { success: true }; } } }
  );
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, recorded: true });
  assert.match(DB.calls[0].sql, /clicks = clicks \+ 1/);
  assert.deepEqual(DB.calls[0].values, [7]);
});

test("admin campaign creation is protected and always starts as draft", async () => {
  const DB = { calls: [], prepare(sql) {
    return { values: [], bind(...values) { this.values = values; return this; },
      async run() { DB.calls.push({ sql, values: this.values }); return { meta: { last_row_id: 11 } }; } };
  }};
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop", Origin: ORIGIN },
      body: JSON.stringify({
        advertiser_name: "Comércio local", title: "Oferta da semana",
        description: "Promoção especial", destination_url: "https://example.com/oferta",
        placement: "home", starts_at: "2026-11-01T00:00:00Z", ends_at: "2026-12-01T00:00:00Z"
      })
    }), { DB, ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, id: 11, status: "draft" });
  assert.match(DB.calls[0].sql, /'draft'/);
  assert.equal(DB.calls[0].values[0], "Comércio local");
});

test("admin campaign creation requires HTTPS destination links", async () => {
  const DB = mockDb();
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop" },
      body: JSON.stringify({
        advertiser_name: "Loja", title: "Oferta", destination_url: "http://example.com/oferta",
        starts_at: "2026-11-01T00:00:00Z", ends_at: "2026-12-01T00:00:00Z"
      })
    }), { DB, ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_campaign_fields");
  assert.equal(DB.calls.length, 0);
});

test("admin campaign creation rejects unsafe URLs and invalid dates", async () => {
  const DB = mockDb();
  const response = await worker.fetch(
    new Request("https://api.example.com/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret-0123456789-abcdefghijklmnop" },
      body: JSON.stringify({
        advertiser_name: "Loja", title: "Oferta", destination_url: "javascript:alert(1)",
        starts_at: "2026-12-01T00:00:00Z", ends_at: "2026-11-01T00:00:00Z"
      })
    }), { DB, ADMIN_TOKEN: "test-secret-0123456789-abcdefghijklmnop" }
  );
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "invalid_campaign_fields");
  assert.equal(DB.calls.length, 0);
});


test("promotion events are rate limited per source IP before touching D1", async () => {
  let dbTouched = false;
  const DB = { prepare() { dbTouched = true; throw new Error("D1 must not be called"); } };
  const response = await worker.fetch(
    new Request("https://api.example.com/api/promotions/7/event", {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.10" },
      body: JSON.stringify({ event_type: "impression" })
    }),
    { DB, PROMOTION_LIMITER: { async limit({ key }) { assert.equal(key, "203.0.113.10"); return { success: false }; } } }
  );
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.equal((await response.json()).error, "rate_limited");
  assert.equal(dbTouched, false);
});

test("promotion events fail closed when the rate limiter cannot identify the source", async () => {
  const response = await worker.fetch(
    new Request("https://api.example.com/api/promotions/7/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "impression" })
    }),
    { DB: mockDb(), PROMOTION_LIMITER: { async limit() { return { success: true }; } } }
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "rate_limit_identity_unavailable");
});


test("GET /api/stations combines country, language, region, city, genre and verification filters", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        sql, values: [],
        bind(...values) { this.values = values; return this; },
        async first() { calls.push({ type: "first", sql: this.sql, values: this.values }); return { total: 1 }; },
        async all() {
          calls.push({ type: "all", sql: this.sql, values: this.values });
          return { results: [{
            id: 9, slug: "jazz-ny", name: "Jazz New York",
            stream_url: "https://stream.example.test/live", country_code: "US",
            state: "NY", city: "New York", language: "en",
            is_verified: 1, category_slugs: "jazz-blues,rock"
          }] };
        }
      };
    }
  };
  const response = await worker.fetch(new Request(
    "https://api.example.com/api/stations?q=jazz&country_code=US&language=EN&region=NY&city=New%20York&category=rock&verification=verified&limit=10&offset=20"
  ), { DB });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.stations[0].country_code, "US");
  assert.equal(data.stations[0].is_verified, true);
  assert.deepEqual(data.stations[0].categories, ["jazz-blues", "rock"]);
  assert.deepEqual(data.pagination, { total: 1, limit: 10, offset: 20, has_more: false });
  const list = calls.find(call => call.type === "all");
  for (const fragment of [
    "s.country_code = ?", "lower(s.language) LIKE ?", "lower(s.state) = lower(?)",
    "lower(s.city) = lower(?)", "filter_c.slug = ?", "s.is_verified = 1",
    "s.is_verified DESC"
  ]) assert.ok(list.sql.includes(fragment), "missing SQL filter: " + fragment);
  assert.deepEqual(list.values, ["%jazz%", "%jazz%", "%jazz%", "%jazz%", "%jazz%", "US", "en%", "NY", "New York", "rock", 10, 20]);
});

test("GET /api/stations supports pending verification filter and preserves pagination", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        sql, values: [],
        bind(...values) { this.values = values; return this; },
        async first() { calls.push({ type: "first", sql: this.sql, values: this.values }); return { total: 2 }; },
        async all() { calls.push({ type: "all", sql: this.sql, values: this.values }); return { results: [] }; }
      };
    }
  };
  const response = await worker.fetch(new Request("https://api.example.com/api/stations?verification=pending&limit=1&offset=1"), { DB });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.pagination.has_more, false);
  assert.match(calls.find(call => call.type === "all").sql, /s\.is_verified = 0/);
});

test("GET /api/catalog/filters returns available country, language, region, city and genre facets", async () => {
  const calls = [];
  const DB = {
    prepare(sql) {
      return {
        async all() {
          calls.push(sql);
          return { results: [] };
        }
      };
    }
  };
  const response = await worker.fetch(new Request("https://api.example.com/api/catalog/filters"), { DB });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data, { countries: [], languages: [], regions: [], cities: [], categories: [] });
  assert.equal(calls.length, 5);
  assert.ok(calls.some(sql => sql.includes("GROUP BY country_code")));
  assert.ok(calls.some(sql => sql.includes("GROUP BY language")));
  assert.ok(calls.some(sql => sql.includes("GROUP BY country_code, state")));
  assert.ok(calls.some(sql => sql.includes("GROUP BY country_code, state, city")));
  assert.ok(calls.some(sql => sql.includes("GROUP BY c.id, c.slug, c.name")));
});
