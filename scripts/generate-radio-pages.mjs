import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://radio-conexao-fm.pages.dev";
const API = process.env.RADIO_API_URL || "https://radio-conexao-api.bieljuniho.workers.dev";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, "radio");

export function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeHttps(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function buildStationPage(station) {
  const slug = String(station.slug || "");
  if (!/^[a-z0-9-]{1,70}$/.test(slug)) throw new Error("Slug inválido: " + slug);

  const name = String(station.name || "Rádio online").trim();
  if (!name) throw new Error("Emissora sem nome: " + slug);
  const city = [station.city, station.state].filter(Boolean).join(", ");
  const country = station.country_code === "BR" ? "Brasil" : (station.country_code || "Rádio online");
  const location = [city, country].filter(Boolean).join(" · ");
  const categories = Array.isArray(station.categories) ? station.categories : [];
  const description = String(station.description || "").trim();
  const language = String(station.language || "").trim();
  const categoriesText = categories.map(value => String(value).replace(/-/g, " ")).join(", ");
  const metaParts = [`Ouça ${name} ao vivo na Conexão FM.`, location, categoriesText ? `Estilos: ${categoriesText}.` : "", description].filter(Boolean);
  const metaDescription = metaParts.join(" ").slice(0, 155);
  const canonical = `${SITE}/radio/${slug}/`;
  const logo = safeHttps(station.logo_url);
  const website = safeHttps(station.website_url);
  const title = `${name} ao vivo — Ouvir rádio online | Conexão FM`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RadioStation",
    "name": name,
    ...(description ? { "description": description } : {}),
    ...(categories.length ? { "genre": categories } : {}),
    ...(language ? { "inLanguage": language } : {}),
    "url": canonical,
    ...(logo ? { "image": logo } : {}),
    ...(city ? { "address": { "@type": "PostalAddress", "addressLocality": station.city || undefined, "addressRegion": station.state || undefined, "addressCountry": station.country_code || undefined } } : {}),
    "broadcastDisplayName": name,
    ...(website ? { "sameAs": [website] } : {})
  };
  const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  const tags = categories.map(category => `<li>${escapeHtml(category.replace(/-/g, " "))}</li>`).join("");
  const facts = [
    city ? ["Cidade", city] : null,
    station.state && !city ? ["Estado", station.state] : null,
    country ? ["País", country] : null,
    language ? ["Idioma", language] : null,
    categoriesText ? ["Estilos musicais", categoriesText] : null
  ].filter(Boolean);
  const factsMarkup = facts.length ? `<section class="details" aria-labelledby="details-title"><h2 id="details-title">Informações da emissora</h2><dl>${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl></section>` : "";
  const logoMarkup = logo
    ? `<img class="logo" src="${escapeHtml(logo)}" alt="Logotipo de ${escapeHtml(name)}" width="112" height="112">`
    : '<div class="logo-placeholder" aria-hidden="true">♫</div>';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#17213A">
<meta name="robots" content="index,follow">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="/assets/radio.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Conexão FM">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
${logo ? `<meta property="og:image" content="${escapeHtml(logo)}">` : ""}
<script type="application/ld+json">${json}</script>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f4ef;color:#17213a;font:16px/1.6 system-ui,-apple-system,sans-serif}.wrap{width:min(760px,calc(100% - 28px));margin:28px auto 70px}.back{display:inline-block;padding:10px 14px;border:1px solid #17213a26;border-radius:12px;background:#fff;color:#17213a;text-decoration:none;font-weight:700}.card{margin-top:20px;padding:clamp(22px,5vw,40px);border:1px solid #17213a20;border-radius:22px;background:#fff;box-shadow:0 12px 36px #17213a0c}.brand{color:#e66b55;font-size:13px;font-weight:800;letter-spacing:.05em}.logo{display:block;width:112px;height:112px;margin:22px 0 18px;object-fit:contain;border-radius:22px;background:#f1eee9}.logo-placeholder{display:grid;place-items:center;width:112px;height:112px;margin:22px 0 18px;border-radius:22px;background:#f1eee9;color:#e66b55;font-size:40px}h1{margin:0 0 8px;font-size:clamp(26px,6vw,38px);line-height:1.2;overflow-wrap:anywhere}.location{margin:0;color:#59657c}.description{margin:22px 0;color:#344057}.tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.tags li{padding:6px 11px;border-radius:999px;background:#f1eee9;font-size:13px}.details{margin-top:26px;padding-top:20px;border-top:1px solid #17213a18}.details h2,.about h2{font-size:19px;margin:0 0 12px}.details dl{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:0}.details dl div{padding:12px;border-radius:12px;background:#f5f4ef}.details dt{font-size:12px;color:#59657c}.details dd{margin:3px 0 0;font-weight:700;overflow-wrap:anywhere}.about{margin-top:24px}.about p{margin:0;color:#344057}.listen{display:inline-flex;align-items:center;justify-content:center;min-height:48px;margin-top:18px;padding:10px 18px;border-radius:12px;background:#17213a;color:#fff;text-decoration:none;font-weight:800}.website{display:block;margin-top:16px;color:#344057}.footer{margin-top:22px;text-align:center;color:#59657c;font-size:13px}.footer a{color:inherit}@media(max-width:520px){.wrap{margin-top:16px}.card{border-radius:17px}}
</style>
</head>
<body>
<main class="wrap">
<a class="back" href="/radios.html">← Explorar rádios</a>
<article class="card">
<div class="brand">CONEXÃO FM · A MÚSICA QUE CONECTA VOCÊ</div>
${logoMarkup}
<h1>${escapeHtml(name)}</h1>
<p class="location">${escapeHtml(location || "Rádio online")}</p>
${tags ? `<ul class="tags" aria-label="Estilos musicais">${tags}</ul>` : ""}
${description ? `<section class="about" aria-labelledby="about-title"><h2 id="about-title">Sobre a ${escapeHtml(name)}</h2><p class="description">${escapeHtml(description)}</p></section>` : `<p class="description">Esta página reúne os dados disponíveis no catálogo da Conexão FM para identificar a emissora e facilitar o acesso à transmissão online.</p>`}
${factsMarkup}
<a class="listen" href="/?station=${encodeURIComponent("db-" + slug)}&amp;autoplay=1">▶ Ouvir no player da Conexão FM</a>
${website ? `<a class="website" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Visitar o site da emissora ↗</a>` : ""}
</article>
<footer class="footer">Conexão FM — A música que conecta você · <a href="/privacidade.html">Privacidade</a> · <a href="/contato.html">Contato</a></footer>
</main>
</body>
</html>`;
}

export function buildSitemap(existingXml, stations) {
  const base = existingXml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const kept = base.filter(entry => !entry.includes("/radio/"));
  const stationUrls = stations.map(station =>
    `  <url><loc>${SITE}/radio/${station.slug}/</loc></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...kept, ...stationUrls].join("\n")}\n</urlset>\n`;
}

export async function fetchAllStations(fetchImpl = fetch) {
  const stations = [];
  let offset = 0;
  while (true) {
    const response = await fetchImpl(`${API}/api/stations?limit=100&offset=${offset}`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`API de rádios respondeu HTTP ${response.status}`);
    const data = await response.json();
    const batch = Array.isArray(data.stations) ? data.stations : [];
    stations.push(...batch);
    if (!data.pagination?.has_more || batch.length === 0) break;
    offset += batch.length;
    if (offset > 100000) throw new Error("Catálogo excedeu o limite de segurança");
  }
  const seen = new Set();
  return stations.filter(station => {
    if (!/^[a-z0-9-]{1,70}$/.test(String(station.slug || "")) || seen.has(station.slug)) return false;
    seen.add(station.slug);
    return station.is_active !== false;
  });
}

export async function generate() {
  const stations = await fetchAllStations();
  if (!stations.length) throw new Error("A API não retornou rádios; páginas existentes foram preservadas.");

  await mkdir(OUTPUT, { recursive: true });
  for (const entry of await readdir(OUTPUT, { withFileTypes: true })) {
    if (entry.isDirectory()) await rm(path.join(OUTPUT, entry.name), { recursive: true, force: true });
  }
  for (const station of stations) {
    const dir = path.join(OUTPUT, station.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), buildStationPage(station), "utf8");
  }

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const { readFile } = await import("node:fs/promises");
  const current = await readFile(sitemapPath, "utf8");
  await writeFile(sitemapPath, buildSitemap(current, stations), "utf8");
  return stations.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate().then(count => {
    console.log(`Páginas individuais geradas: ${count}`);
  }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
