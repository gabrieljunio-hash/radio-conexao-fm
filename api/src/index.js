/**
 * Rádio Conexão FM — API pública inicial
 * Cloudflare Worker + D1 (binding obrigatório: DB)
 *
 * Rotas:
 *   GET /api/health
 *   GET /api/categories
 *   GET /api/stations?q=&category=&state=&city=&limit=&offset=
 */

const ALLOWED_ORIGINS = new Set([
  "https://radio-conexao-fm.pages.dev",
  "https://gabrieljunio-hash.github.io",
]);

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  // Cloudflare Pages preview deployments for this project use unique subdomains.
  return /^https:\/\/[a-z0-9-]+\.radio-conexao-fm\.pages\.dev$/i.test(origin);
}

function corsHeaders(origin) {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : "https://radio-conexao-fm.pages.dev";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? "public, max-age=60, s-maxage=120" : "no-store",
      ...corsHeaders(origin),
    },
  });
}

function getPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, max);
}



function adminJson(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(origin),
    },
  });
}

function safePublicUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return null;
    if (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return null;
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return null;
  }
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function makeSlug(value) {
  return String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 70) || "radio";
}

async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}

async function testPublicStream(streamUrl) {
  try {
    const response = await fetch(streamUrl, {
      method: "GET",
      headers: { Range: "bytes=0-1", "User-Agent": "RadioConexaoFM/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000)
    });
    const contentType = response.headers.get("content-type") || "";
    try { await response.body?.cancel(); } catch {}
    return {
      ok: (response.status === 200 || response.status === 206) && !/text\/html|application\/json/i.test(contentType),
      status: response.status,
      content_type: contentType,
      final_url: response.url
    };
  } catch (error) {
    return { ok: false, error: "stream_unreachable", message: String(error?.name || "NetworkError") };
  }
}

async function handleAdmin(request, env, url, origin) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 32) return adminJson({ error: "admin_not_configured", message: "Configure um secret ADMIN_TOKEN com pelo menos 32 caracteres no Worker." }, 503, origin);
  const authorization = request.headers.get("Authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!constantTimeEqual(supplied, env.ADMIN_TOKEN)) {
    return adminJson({ error: "unauthorized" }, 401, origin);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/summary") {
    const [stations, active, categories, verified] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS total FROM stations").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM stations WHERE is_active = 1").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM categories").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM stations WHERE is_verified = 1").first()
    ]);
    return adminJson({
      stations: Number(stations?.total || 0),
      active: Number(active?.total || 0),
      categories: Number(categories?.total || 0),
      verified: Number(verified?.total || 0)
    }, 200, origin);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/stations") {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 100);
    const offset = Math.min(Math.max(Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0), 100000);
    const where = q ? "WHERE s.name LIKE ? OR s.city LIKE ? OR s.slug LIKE ?" : "";
    const term = "%" + q.replace(/[\\%_]/g, character => "\\" + character) + "%";
    const statement = env.DB.prepare(`SELECT s.id, s.slug, s.name, s.stream_url, s.logo_url, s.country_code, s.state, s.city, s.is_active, s.is_verified, GROUP_CONCAT(c.name) AS category_names
      FROM stations s LEFT JOIN station_categories sc ON sc.station_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id ${where}
      GROUP BY s.id ORDER BY s.name COLLATE NOCASE LIMIT ? OFFSET ?`);
    const result = q
      ? await statement.bind(term, term, term, limit, offset).all()
      : await statement.bind(limit, offset).all();
    return adminJson({ stations: result.results || [], limit, offset }, 200, origin);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/discover") {
    const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1), 100);
    const startOffset = Math.min(Math.max(Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0), 5000);
    const name = (url.searchParams.get("name") || "").trim().slice(0, 80);
    const country = (url.searchParams.get("country") || "BR").trim().toUpperCase().slice(0, 2);
    const tag = (url.searchParams.get("tag") || "").trim().slice(0, 50);
    const stations = [];
    const seenUrls = new Set();
    const seenSlugs = new Set();
    let checked = 0;
    let duplicates = 0;
    let offset = startOffset;
    let pages = 0;
    let lastPageSize = 0;

    // Skip already registered stations automatically, scanning up to five
    // directory pages per request to keep each Worker request bounded.
    while (stations.length < limit && offset <= 5000 && pages < 5) {
      const params = new URLSearchParams({
        hidebroken: "true", order: "clickcount", reverse: "true",
        limit: "100", offset: String(offset)
      });
      if (name) params.set("name", name);
      if (country) params.set("countrycode", country);
      if (tag) params.set("tag", tag);

      const response = await fetch("https://all.api.radio-browser.info/json/stations/search?" + params.toString(), {
        headers: { "User-Agent": "RadioConexaoFM/1.0 (catalog importer)", "Accept": "application/json" },
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) return adminJson({ error: "directory_unavailable", status: response.status, checked, duplicates, next_offset: offset }, 502, origin);

      const data = await response.json();
      const directoryItems = Array.isArray(data) ? data : [];
      lastPageSize = directoryItems.length;
      pages += 1;
      checked += directoryItems.length;

      const normalized = directoryItems.filter(item =>
        item && Number(item.lastcheckok) === 1 && item.stationuuid && item.name && safePublicUrl(item.url_resolved || item.url)
      ).map(item => ({
        stationuuid: String(item.stationuuid),
        name: String(item.name).trim().slice(0, 120),
        stream_url: safePublicUrl(item.url_resolved || item.url),
        website_url: safePublicUrl(item.homepage),
        logo_url: safePublicUrl(item.favicon),
        country_code: String(item.countrycode || country || "BR").slice(0, 2).toUpperCase(),
        state: String(item.state || "").slice(0, 80),
        city: String(item.city || "").slice(0, 100),
        language: String(item.language || "pt").split(",")[0].slice(0, 20),
        tags: String(item.tags || "").split(",").map(tagValue => tagValue.trim().toLowerCase()).filter(Boolean).slice(0, 12),
        bitrate: Number(item.bitrate || 0),
        codec: String(item.codec || "").slice(0, 20),
        directory_checked: true
      }));

      const urls = [...new Set(normalized.map(item => item.stream_url.toLowerCase()))];
      const slugs = [...new Set(normalized.map(item => "rb-" + item.stationuuid.toLowerCase().replace(/[^a-f0-9-]/g, "").slice(0, 40)))];
      const existingUrls = new Set();
      const existingSlugs = new Set();

      if (urls.length) {
        const placeholders = urls.map(() => "?").join(",");
        const result = await env.DB.prepare(`SELECT lower(stream_url) AS stream_url FROM stations WHERE lower(stream_url) IN (${placeholders})`).bind(...urls).all();
        for (const row of result.results || []) existingUrls.add(String(row.stream_url).toLowerCase());
      }
      if (slugs.length) {
        const placeholders = slugs.map(() => "?").join(",");
        const result = await env.DB.prepare(`SELECT slug FROM stations WHERE slug IN (${placeholders})`).bind(...slugs).all();
        for (const row of result.results || []) existingSlugs.add(String(row.slug));
      }

      for (const item of normalized) {
        const slug = "rb-" + item.stationuuid.toLowerCase().replace(/[^a-f0-9-]/g, "").slice(0, 40);
        const stream = item.stream_url.toLowerCase();
        if (existingUrls.has(stream) || existingSlugs.has(slug) || seenUrls.has(stream) || seenSlugs.has(slug)) {
          duplicates += 1;
          continue;
        }
        seenUrls.add(stream);
        seenSlugs.add(slug);
        stations.push(item);
      }

      offset += 100;
      if (stations.length >= limit || directoryItems.length < 100) break;
    }

    const hasMore = lastPageSize === 100 && offset <= 5000;
    return adminJson({
      stations,
      count: stations.length,
      duplicates,
      checked,
      pages_scanned: pages,
      next_offset: offset,
      has_more: hasMore,
      exhausted: !hasMore,
      source: "Radio Browser"
    }, 200, origin);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/test-stream") {
    const body = await readJson(request);
    const streamUrl = safePublicUrl(body?.stream_url);
    if (!streamUrl) return adminJson({ error: "invalid_stream_url" }, 400, origin);
    const result = await testPublicStream(streamUrl);
    return adminJson(result, 200, origin);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/stations") {
    const body = await readJson(request);
    const name = String(body?.name || "").trim().slice(0, 120);
    const streamUrl = safePublicUrl(body?.stream_url);
    if (name.length < 2 || !streamUrl) return adminJson({ error: "name_and_valid_stream_required" }, 400, origin);
    const streamTest = await testPublicStream(streamUrl);
    if (!streamTest.ok) return adminJson({ error: "stream_test_failed", test: streamTest }, 422, origin);
    const duplicate = await env.DB.prepare("SELECT id FROM stations WHERE lower(stream_url) = lower(?) LIMIT 1").bind(streamUrl).first();
    if (duplicate) return adminJson({ error: "duplicate_stream", station_id: duplicate.id }, 409, origin);
    const slug = makeSlug(name) + "-" + crypto.randomUUID().slice(0, 8);
    const websiteUrl = body?.website_url ? safePublicUrl(body.website_url) : null;
    const logoUrl = body?.logo_url ? safePublicUrl(body.logo_url) : null;
    await env.DB.prepare(
      "INSERT INTO stations (slug, name, stream_url, website_url, logo_url, country_code, state, city, language, description, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)"
    ).bind(slug, name, streamUrl, websiteUrl, logoUrl,
      String(body?.country_code || "BR").slice(0, 2).toUpperCase(),
      String(body?.state || "").slice(0, 80), String(body?.city || "").slice(0, 100),
      String(body?.language || "pt-BR").slice(0, 20), String(body?.description || "").slice(0, 500)
    ).run();
    const created = await env.DB.prepare("SELECT id, slug FROM stations WHERE slug = ?").bind(slug).first();
    const categorySlugs = Array.isArray(body?.category_slugs) ? [...new Set(body.category_slugs.map(value => String(value).slice(0, 80)))] : [];
    if (created && categorySlugs.length) {
      const placeholders = categorySlugs.map(() => "?").join(",");
      const cats = await env.DB.prepare("SELECT id FROM categories WHERE slug IN (" + placeholders + ")").bind(...categorySlugs).all();
      if (cats.results?.length) await env.DB.batch(cats.results.map(cat =>
        env.DB.prepare("INSERT OR IGNORE INTO station_categories (station_id, category_id) VALUES (?, ?)").bind(created.id, cat.id)
      ));
    }
    return adminJson({ ok: true, id: created?.id, slug }, 201, origin);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/import/radio-browser") {
    const body = await readJson(request);
    const input = Array.isArray(body?.stations) ? body.stations.slice(0, 100) : [];
    if (!input.length) return adminJson({ error: "no_stations_selected" }, 400, origin);
    const clean = input.map(item => ({
      slug: "rb-" + String(item?.stationuuid || "").toLowerCase().replace(/[^a-f0-9-]/g, "").slice(0, 40),
      name: String(item?.name || "").trim().slice(0, 120),
      stream_url: safePublicUrl(item?.stream_url),
      website_url: item?.website_url ? safePublicUrl(item.website_url) : null,
      logo_url: item?.logo_url ? safePublicUrl(item.logo_url) : null,
      country_code: String(item?.country_code || "BR").slice(0, 2).toUpperCase(),
      state: String(item?.state || "").slice(0, 80),
      city: String(item?.city || "").slice(0, 100),
      language: String(item?.language || "pt").slice(0, 20),
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 12).map(value => String(value).toLowerCase().slice(0, 50)) : []
    })).filter(item => item.slug.length > 8 && item.name.length >= 2 && item.stream_url);
    if (!clean.length) return adminJson({ error: "no_valid_stations" }, 400, origin);
    const placeholders = clean.map(() => "?").join(",");
    const existing = await env.DB.prepare("SELECT lower(stream_url) AS stream_url FROM stations WHERE lower(stream_url) IN (" + placeholders + ")")
      .bind(...clean.map(item => item.stream_url.toLowerCase())).all();
    const existingSlugs = await env.DB.prepare("SELECT slug FROM stations WHERE slug IN (" + clean.map(() => "?").join(",") + ")")
      .bind(...clean.map(item => item.slug)).all();
    const existingUrls = new Set((existing.results || []).map(item => item.stream_url));
    const slugSet = new Set((existingSlugs.results || []).map(item => item.slug));
    const fresh = clean.filter(item => !existingUrls.has(item.stream_url.toLowerCase()) && !slugSet.has(item.slug));
    if (!fresh.length) return adminJson({ ok: true, imported: 0, duplicates: clean.length, message: "Todas as rádios já estavam cadastradas." }, 200, origin);
    // D1 allows at most 100 bound parameters per SQL statement.
    // Each station uses 10 values, so insert at most 10 stations per statement.
    for (let offset = 0; offset < fresh.length; offset += 10) {
      const chunk = fresh.slice(offset, offset + 10);
      const values = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)").join(",");
      const bindings = chunk.flatMap(item => [item.slug, item.name, item.stream_url, item.website_url, item.logo_url, item.country_code, item.state, item.city, item.language, item.tags.join(", ")]);
      await env.DB.prepare("INSERT OR IGNORE INTO stations (slug, name, stream_url, website_url, logo_url, country_code, state, city, language, description, is_active, is_verified) VALUES " + values).bind(...bindings).run();
    }
    const slugs = fresh.map(item => item.slug);
    const insertedRows = [];
    for (let offset = 0; offset < slugs.length; offset += 100) {
      const chunk = slugs.slice(offset, offset + 100);
      const slugPlaceholders = chunk.map(() => "?").join(",");
      const result = await env.DB.prepare("SELECT id, slug FROM stations WHERE slug IN (" + slugPlaceholders + ")").bind(...chunk).all();
      insertedRows.push(...(result.results || []));
    }
    const inserted = { results: insertedRows };
    const categoryRows = await env.DB.prepare("SELECT id, slug FROM categories").all();
    const categoryIds = new Map((categoryRows.results || []).map(item => [item.slug, item.id]));
    const links = [];
    for (const item of fresh) {
      const station = (inserted.results || []).find(row => row.slug === item.slug);
      if (!station) continue;
      const mapped = new Set();
      for (const tagValue of item.tags) {
        const normalized = makeSlug(tagValue);
        if (categoryIds.has(normalized)) mapped.add(categoryIds.get(normalized));
      }
      for (const categoryId of mapped) {
        links.push(env.DB.prepare("INSERT OR IGNORE INTO station_categories (station_id, category_id) VALUES (?, ?)").bind(station.id, categoryId));
      }
    }
    if (links.length) await env.DB.batch(links);
    return adminJson({ ok: true, imported: inserted.results?.length || 0, duplicates: clean.length - (inserted.results?.length || 0), category_links: links.length }, 201, origin);
  }

  const statusMatch = url.pathname.match(/^\/api\/admin\/stations\/(\d+)\/status$/);
  if (request.method === "POST" && statusMatch) {
    const body = await readJson(request);
    if (typeof body?.is_active !== "boolean") return adminJson({ error: "is_active_boolean_required" }, 400, origin);
    const result = await env.DB.prepare("UPDATE stations SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(body.is_active ? 1 : 0, Number(statusMatch[1])).run();
    return adminJson({ ok: true, changes: result.meta?.changes || 0 }, 200, origin);
  }

  if (request.method === "GET" && url.pathname === "/api/admin/promotions") {
    const result = await env.DB.prepare(
      "SELECT id, advertiser_name, title, description, image_url, destination_url, placement, status, starts_at, ends_at, impressions, clicks, created_at FROM sponsored_campaigns ORDER BY created_at DESC LIMIT 100"
    ).all();
    return adminJson({ campaigns: result.results || [] }, 200, origin);
  }

  if (request.method === "POST" && url.pathname === "/api/admin/promotions") {
    const body = await readJson(request);
    const advertiser = String(body?.advertiser_name || "").trim().slice(0, 100);
    const title = String(body?.title || "").trim().slice(0, 100);
    const description = String(body?.description || "").trim().slice(0, 240);
    const imageUrl = body?.image_url ? safePublicUrl(body.image_url) : null;
    const destinationUrl = safePublicUrl(body?.destination_url);
    const placement = String(body?.placement || "home");
    const startsAt = new Date(body?.starts_at || "");
    const endsAt = new Date(body?.ends_at || "");
    if (advertiser.length < 2 || title.length < 3 || !destinationUrl || !destinationUrl.startsWith("https://") ||
        placement !== "home" ||
        !Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) ||
        endsAt <= startsAt || (body?.image_url && !imageUrl)) {
      return adminJson({ error: "invalid_campaign_fields" }, 400, origin);
    }
    const result = await env.DB.prepare(
      "INSERT INTO sponsored_campaigns (advertiser_name, title, description, image_url, destination_url, placement, status, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?)"
    ).bind(advertiser, title, description, imageUrl, destinationUrl, placement, startsAt.toISOString(), endsAt.toISOString()).run();
    return adminJson({ ok: true, id: result.meta?.last_row_id || null, status: "draft" }, 201, origin);
  }

  const promotionStatusMatch = url.pathname.match(/^\/api\/admin\/promotions\/(\d+)\/status$/);
  if (request.method === "POST" && promotionStatusMatch) {
    const body = await readJson(request);
    const status = String(body?.status || "");
    if (!["draft", "active", "paused"].includes(status)) {
      return adminJson({ error: "invalid_campaign_status" }, 400, origin);
    }
    const result = await env.DB.prepare(
      "UPDATE sponsored_campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(status, Number(promotionStatusMatch[1])).run();
    return adminJson({ ok: true, changes: result.meta?.changes || 0 }, 200, origin);
  }

  return adminJson({ error: "not_found" }, 404, origin);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!env.DB) {
      return json({ error: "database_binding_missing", message: "Configure o binding D1 com o nome DB." }, 500, origin);
    }

    if (url.pathname.startsWith("/api/admin/")) {
      try {
        return await handleAdmin(request, env, url, origin);
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return adminJson({ error: "admin_operation_failed", message: detail.slice(0, 500) }, 500, origin);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/events") {
      if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
        return json({ error: "content_type_must_be_json" }, 415, origin);
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400, origin);
      }

      const eventType = String(payload?.event_type || "");
      const stationSlug = String(payload?.station_slug || "").trim();
      const sessionId = String(payload?.session_id || "").trim();
      if (!["play", "stop", "heartbeat"].includes(eventType)) {
        return json({ error: "invalid_event_type" }, 400, origin);
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stationSlug) || stationSlug.length > 100) {
        return json({ error: "invalid_station_slug" }, 400, origin);
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
        return json({ error: "invalid_session_id" }, 400, origin);
      }

      const station = await env.DB.prepare(
        "SELECT id FROM stations WHERE slug = ? AND is_active = 1"
      ).bind(stationSlug).first();
      if (!station) return json({ error: "station_not_found" }, 404, origin);

      if (eventType === "heartbeat") {
        const recent = await env.DB.prepare(
          "SELECT id FROM play_events WHERE station_id = ? AND session_id = ? AND event_type = 'heartbeat' AND occurred_at >= datetime('now', '-50 seconds') LIMIT 1"
        ).bind(station.id, sessionId).first();
        if (recent) return json({ ok: true, recorded: false }, 202, origin);
      }

      await env.DB.prepare(
        "INSERT INTO play_events (station_id, event_type, session_id) VALUES (?, ?, ?)"
      ).bind(station.id, eventType, sessionId).run();

      return json({ ok: true, recorded: true }, 201, origin);
    }

    const promotionEventMatch = url.pathname.match(/^\/api\/promotions\/(\d+)\/event$/);
    if (request.method === "POST" && promotionEventMatch) {
      if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
        return json({ error: "content_type_must_be_json" }, 415, origin);
      }
      const body = await readJson(request);
      const eventType = String(body?.event_type || "");
      if (!["impression", "click"].includes(eventType)) {
        return json({ error: "invalid_promotion_event" }, 400, origin);
      }
      // Cloudflare Rate Limiting binding: limits event submissions per source IP.
      // The IP is used only as an ephemeral rate-limit key and is not written to D1.
      if (env.PROMOTION_LIMITER) {
        const sourceIp = request.headers.get("CF-Connecting-IP");
        if (!sourceIp) return json({ error: "rate_limit_identity_unavailable" }, 503, origin);
        let rate;
        try {
          rate = await env.PROMOTION_LIMITER.limit({ key: sourceIp });
        } catch {
          return json({ error: "rate_limit_unavailable" }, 503, origin);
        }
        if (!rate?.success) {
          return new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429,
            headers: { "Content-Type": "application/json; charset=utf-8", "Retry-After": "60", ...corsHeaders(origin) },
          });
        }
      }
      const column = eventType === "click" ? "clicks" : "impressions";
      const result = await env.DB.prepare(
        "UPDATE sponsored_campaigns SET " + column + " = " + column + " + 1 WHERE id = ? AND status = 'active' AND datetime(starts_at) <= datetime('now') AND datetime(ends_at) > datetime('now')"
      ).bind(Number(promotionEventMatch[1])).run();
      return json({ ok: true, recorded: (result.meta?.changes || 0) > 0 }, 202, origin);
    }

    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405, origin);
    }

    try {
      if (url.pathname === "/api/health") {
        const result = await env.DB.prepare("SELECT 1 AS db_ok").first();
        return json({
          status: "online",
          database: result?.db_ok === 1 ? "connected" : "error",
        }, 200, origin);
      }

      if (url.pathname === "/api/stats") {
        const period = url.searchParams.get("period") === "30d" ? "30d" : "7d";
        const modifier = period === "30d" ? "-30 days" : "-7 days";
        const since = "datetime('now', ?)";
        const [summary, top, daily] = await Promise.all([
          env.DB.prepare(
            `SELECT
               SUM(CASE WHEN event_type = 'play' THEN 1 ELSE 0 END) AS plays,
               COUNT(DISTINCT CASE WHEN event_type = 'play' THEN session_id END) AS sessions,
               SUM(CASE WHEN event_type = 'stop' THEN 1 ELSE 0 END) AS stops,
               SUM(CASE WHEN event_type = 'heartbeat' THEN 1 ELSE 0 END) AS heartbeats
             FROM play_events WHERE occurred_at >= ${since}`
          ).bind(modifier).first(),
          env.DB.prepare(
            `SELECT s.slug, s.name, s.logo_url,
                    SUM(CASE WHEN e.event_type = 'play' THEN 1 ELSE 0 END) AS plays,
                    COUNT(DISTINCT CASE WHEN e.event_type = 'play' THEN e.session_id END) AS sessions
             FROM play_events e
             JOIN stations s ON s.id = e.station_id
             WHERE e.occurred_at >= ${since} AND s.is_active = 1
             GROUP BY s.id, s.slug, s.name, s.logo_url
             HAVING SUM(CASE WHEN e.event_type = 'play' THEN 1 ELSE 0 END) > 0
             ORDER BY plays DESC, sessions DESC, s.name COLLATE NOCASE
             LIMIT 10`
          ).bind(modifier).all(),
          env.DB.prepare(
            `SELECT date(occurred_at) AS day,
                    SUM(CASE WHEN event_type = 'play' THEN 1 ELSE 0 END) AS plays,
                    COUNT(DISTINCT CASE WHEN event_type = 'play' THEN session_id END) AS sessions
             FROM play_events
             WHERE occurred_at >= ${since}
             GROUP BY date(occurred_at)
             ORDER BY day ASC`
          ).bind(modifier).all()
        ]);

        return json({
          period,
          summary: {
            plays: Number(summary?.plays || 0),
            sessions: Number(summary?.sessions || 0),
            stops: Number(summary?.stops || 0),
            heartbeats: Number(summary?.heartbeats || 0)
          },
          top_stations: top.results || [],
          daily: daily.results || []
        }, 200, origin);
      }

      if (url.pathname === "/api/promotions" && request.method === "GET") {
        const placement = String(url.searchParams.get("placement") || "home");
        if (placement !== "home") {
          return json({ error: "invalid_placement" }, 400, origin);
        }
        const result = await env.DB.prepare(
          "SELECT id, title, description, image_url, destination_url, advertiser_name, placement FROM sponsored_campaigns WHERE status = 'active' AND placement = ? AND datetime(starts_at) <= datetime('now') AND datetime(ends_at) > datetime('now') ORDER BY id DESC LIMIT 5"
        ).bind(placement).all();
        return new Response(JSON.stringify({ campaigns: result.results || [] }), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            ...corsHeaders(origin),
          },
        });
      }



      if (url.pathname === "/api/categories") {
        const { results } = await env.DB.prepare(
          `SELECT c.id, c.slug, c.name, COUNT(DISTINCT sc.station_id) AS station_count
           FROM categories c
           LEFT JOIN station_categories sc ON sc.category_id = c.id
           GROUP BY c.id, c.slug, c.name
           ORDER BY c.name COLLATE NOCASE`
        ).all();

        return json({ categories: results || [] }, 200, origin);
      }

      if (url.pathname === "/api/stations") {
        const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
        const category = (url.searchParams.get("category") || "").trim().slice(0, 80);
        const state = (url.searchParams.get("state") || "").trim().slice(0, 80);
        const city = (url.searchParams.get("city") || "").trim().slice(0, 100);
        const limit = getPositiveInt(url.searchParams.get("limit"), 30, 100) || 30;
        const offset = getPositiveInt(url.searchParams.get("offset"), 0, 100000);

        const conditions = ["s.is_active = 1"];
        const bindings = [];

        if (q) {
          conditions.push("(s.name LIKE ? OR s.city LIKE ? OR s.state LIKE ?)");
          const term = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
          bindings.push(term, term, term);
        }
        if (state) {
          conditions.push("s.state = ?");
          bindings.push(state);
        }
        if (city) {
          conditions.push("s.city = ?");
          bindings.push(city);
        }
        if (category) {
          conditions.push(`EXISTS (
            SELECT 1 FROM station_categories filter_sc
            JOIN categories filter_c ON filter_c.id = filter_sc.category_id
            WHERE filter_sc.station_id = s.id AND filter_c.slug = ?
          )`);
          bindings.push(category);
        }

        const where = conditions.join(" AND ");
        const countQuery = env.DB.prepare(
          `SELECT COUNT(*) AS total FROM stations s WHERE ${where}`
        );
        const listQuery = env.DB.prepare(
          `SELECT s.id, s.slug, s.name, s.stream_url, s.website_url, s.logo_url,
                  s.country_code, s.state, s.city, s.language, s.description,
                  GROUP_CONCAT(c.slug) AS category_slugs
           FROM stations s
           LEFT JOIN station_categories sc ON sc.station_id = s.id
           LEFT JOIN categories c ON c.id = sc.category_id
           WHERE ${where}
           GROUP BY s.id
           ORDER BY s.name COLLATE NOCASE
           LIMIT ? OFFSET ?`
        );

        const [countResult, listResult] = await Promise.all([
          countQuery.bind(...bindings).first(),
          listQuery.bind(...bindings, limit, offset).all(),
        ]);

        const stations = (listResult.results || []).map((station) => {
          const { category_slugs, ...rest } = station;
          return { ...rest, categories: category_slugs ? category_slugs.split(",") : [] };
        });

        return json({
          stations,
          pagination: {
            total: countResult?.total || 0,
            limit,
            offset,
            has_more: offset + stations.length < (countResult?.total || 0),
          },
        }, 200, origin);
      }

      return json({ error: "not_found" }, 404, origin);
    } catch (error) {
      return json({
        error: "internal_error",
        message: "Não foi possível concluir a consulta.",
      }, 500, origin);
    }
  },
};
