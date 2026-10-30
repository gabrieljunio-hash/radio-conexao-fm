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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405, origin);
    }

    if (!env.DB) {
      return json({ error: "database_binding_missing", message: "Configure o binding D1 com o nome DB." }, 500, origin);
    }

    try {
      if (url.pathname === "/api/health") {
        const result = await env.DB.prepare("SELECT 1 AS db_ok").first();
        return json({
          status: "online",
          database: result?.db_ok === 1 ? "connected" : "error",
        }, 200, origin);
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
