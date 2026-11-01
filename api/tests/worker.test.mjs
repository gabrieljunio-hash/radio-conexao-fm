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
          if (this.sql.includes("GROUP BY s.id")) {
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
    { DB, ADMIN_TOKEN: "long-test-secret" }
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
      headers: { Authorization: "Bearer long-test-secret", Origin: ORIGIN }
    }),
    { DB, ADMIN_TOKEN: "long-test-secret" }
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
