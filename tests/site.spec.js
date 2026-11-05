const { test, expect } = require("@playwright/test");

test("página inicial abre sem erros fatais de JavaScript", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Conexão FM/i);
  await expect(page.locator("#player")).toBeVisible();
  await expect(page.locator("#stations")).toBeAttached();
  expect(pageErrors).toEqual([]);
});

test("player permanece montado ao abrir páginas internas e trocar de seção", async ({ page }) => {
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/stats**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      period: "7d", summary: { plays: 0, sessions: 0, stops: 0, heartbeats: 0 },
      top_stations: [], daily: []
    }) })
  );
  await page.goto("/");
  await page.evaluate(() => { window.__persistentAudioNode = document.getElementById("audio"); });

  await page.locator('a[href="audiencia.html"]').first().click();
  await expect(page.locator("#persistentPageOverlay")).toBeVisible();
  await expect(page.frameLocator("#persistentPageFrame").locator("h1")).toHaveText("Painel de audiência");
  expect(await page.evaluate(() => window.__persistentAudioNode === document.getElementById("audio"))).toBeTruthy();

  await page.locator("#persistentPageClose").click();
  await expect(page.locator("#persistentPageOverlay")).toBeHidden();
  await page.locator('.sidebar .nav a[href="radios.html"]').click();
  await expect(page).toHaveURL(/radios\.html$/);
  await expect(page.locator("#player")).toBeVisible();
  expect(await page.evaluate(() => window.__persistentAudioNode === document.getElementById("audio"))).toBeTruthy();
});

test("detalhes da rádio usam o player fixo sem criar outro áudio", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/stations**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      stations: [{
        slug: "radio-teste", name: "Rádio Teste", stream_url: "https://stream.example.test/live",
        logo_url: "", website_url: "", city: "Campinas", state: "SP",
        description: "Estação de teste", categories: ["pop"]
      }],
      pagination: { total: 1, limit: 100, offset: 0, has_more: false }
    }) })
  );
  await page.goto("/index.html?view=explorar");
  await expect(page.locator('.station-detail-link[href*="radio-teste"]')).toBeVisible();
  await page.evaluate(() => { window.__persistentAudioNode = document.getElementById("audio"); });
  await page.locator('.station-detail-link[href*="radio-teste"]').click();
  const detail = page.frameLocator("#persistentPageFrame");
  await expect(detail.locator("#listen")).toBeVisible();
  await detail.locator("#listen").click();
  await expect(page.locator("#persistentPageOverlay")).toBeHidden();
  await expect(page.locator("#playerName")).toHaveText("Rádio Teste");
  expect(await page.evaluate(() => window.__persistentAudioNode === document.getElementById("audio"))).toBeTruthy();
});

test("páginas de explorar e favoritos mantêm a navegação", async ({ page }) => {
  await page.goto("/radios.html");
  await expect(page.locator("#exploreCategories")).toBeVisible();
  await expect(page.getByRole("link", { name: /Favoritos/i }).first()).toHaveAttribute("href", "favoritos.html");

  await page.goto("/favoritos.html");
  await expect(page).toHaveURL(/index\.html\?view=favoritos/);
  await expect(page.locator("#listTitle")).toContainText(/favoritas/i);
});

test("favoritos salvos continuam visíveis mesmo com economia de dados ligada", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("conexao-fm-favorites", JSON.stringify(["db-radio-teste"]));
    localStorage.setItem("conexao-fm-favorite-stations", JSON.stringify([{
      id: "db-radio-teste",
      name: "Rádio de Teste Automatizado",
      city: "São Paulo, SP",
      genre: "Pop",
      tagline: "Estação de teste",
      streamUrl: "https://stream.example.test/live",
      bitrate: 0,
      initials: "RTA"
    }]));
    localStorage.setItem("conexao-fm-data-saver", "1");
  });
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stations: [], pagination: { total: 0, limit: 100, offset: 0, has_more: false } }) })
  );
  await page.goto("/index.html?view=favoritos");
  await expect(page.locator("#stations")).toContainText("Rádio de Teste Automatizado");
  await expect(page.locator("#empty")).toBeHidden();
});

test("Rádios estáticas Laser FM e Prata FM registram audiência", async ({ page }) => {
  const payloads = [];
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
  });
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/events", async route => {
    const request = route.request();
    const headers = {
      "Access-Control-Allow-Origin": new URL(page.url()).origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    payloads.push(request.postDataJSON());
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers,
      body: JSON.stringify({ ok: true, recorded: true })
    });
  });

  await page.goto("/");
  await page.locator("#search").fill("Laser FM");
  const laser = page.locator('#stations [data-play="laser-fm-campinas"]');
  await expect(laser).toBeVisible();
  await laser.click();
  await expect.poll(() => payloads.some(p =>
    p.event_type === "play" &&
    p.station_slug === "rb-legacy-laser-fm-campinas" &&
    p.station_name === "Laser FM Campinas 93.3"
  )).toBeTruthy();

  await page.locator("#search").fill("Prata FM");
  const prata = page.locator('#stations [data-play="prata-fm"]');
  await expect(prata).toBeVisible();
  await prata.click();
  await expect.poll(() => payloads.some(p =>
    p.event_type === "play" &&
    p.station_slug === "rb-legacy-prata-fm" &&
    p.station_name === "Rádio Prata FM 104.9"
  )).toBeTruthy();
});

test("página individual informa quando a estação não existe", async ({ page }) => {
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stations: [], pagination: { total: 0, limit: 100, offset: 0, has_more: false } }) })
  );
  await page.goto("/radio.html?station=estacao-inexistente");
  await expect(page.locator("body")).toContainText(/não encontramos essa rádio|não cadastrada no catálogo|indisponível/i);
});


test("página de contato oferece um canal funcional de atendimento", async ({ page }) => {
  await page.goto("/contato.html");
  await expect(page).toHaveTitle(/Contato.*Conexão FM/i);
  await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute("href", /^https:\/\/wa\.me\//);
});

test("política de privacidade informa sobre Google AdSense e controle de anúncios", async ({ page }) => {
  await page.goto("/privacidade.html");
  await expect(page.locator("body")).toContainText(/Google AdSense/i);
  await expect(page.getByRole("link", { name: /Configurações de anúncios do Google/i })).toHaveAttribute("href", "https://adssettings.google.com/");
});

test("sitemap XML contém contato e não possui escape de newline literal", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();
  expect(xml).toContain("<urlset");
  expect(xml).toContain("https://radio-conexao-fm.pages.dev/contato.html");
  expect(xml).toContain("</urlset>");
  expect(xml).not.toContain("\\n</urlset>");
});


test("catálogo não exibe estações demonstrativas ou sem opção real de escuta", async ({ page }) => {
  await page.route("**/data/radio-status.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      stations: [
        { id: "rb-radio-real", name: "Rádio Real de Teste", city: "São Paulo, SP", genre: "Pop", streamUrl: "https://stream.example.test/live", favicon: "", ok: true, bitrate: 128 },
        { id: "rb-radio-sem-audio", name: "Rádio sem áudio", city: "Brasil", genre: "Pop", streamUrl: "", favicon: "", ok: true }
      ]
    })
  }));
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stations: [], pagination: { total: 0, limit: 100, offset: 0, has_more: false } }) })
  );
  await page.goto("/index.html?view=explorar");
  await expect(page.locator("#stations")).toContainText("Rádio Real de Teste");
  await expect(page.locator("#stations")).not.toContainText("Rádio sem áudio");
  await expect(page.locator("#stations")).not.toContainText("Sertanejo Raiz");
  await expect(page.locator("#stations")).not.toContainText("Flashback Hits");
  await expect(page.locator("#stations .station")).toHaveCount(3);
});

test("favoritos antigos sem link de áudio não aparecem como estações reproduzíveis", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("conexao-fm-favorites", JSON.stringify(["sertanejo", "db-radio-real"]));
    localStorage.setItem("conexao-fm-favorite-stations", JSON.stringify([
      { id: "sertanejo", name: "Sertanejo Raiz", city: "Brasil", genre: "Sertanejo", streamUrl: "" },
      { id: "db-radio-real", name: "Rádio Real Salva", city: "São Paulo, SP", genre: "Pop", streamUrl: "https://stream.example.test/live" }
    ]));
  });
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stations: [], pagination: { total: 0, limit: 100, offset: 0, has_more: false } }) })
  );
  await page.goto("/index.html?view=favoritos");
  await expect(page.locator("#stations")).toContainText("Rádio Real Salva");
  await expect(page.locator("#stations")).not.toContainText("Sertanejo Raiz");
  await expect(page.locator("#stations .station")).toHaveCount(1);
});


test("guia de rádio online oferece orientações práticas e navegação funcional", async ({ page }) => {
  await page.goto("/guia-radio-online.html");
  await expect(page).toHaveTitle(/Guia para ouvir rádio online/i);
  await expect(page.locator("h1")).toContainText(/Como ouvir/i);
  await expect(page.locator("#internet")).toContainText("128 kbps");
  await expect(page.locator("#problemas")).toContainText(/O que fazer quando a rádio não toca/i);
  await expect(page.getByRole("link", { name: /Encontrar uma rádio/i })).toHaveAttribute("href", "radios.html");
});


test("painel administrativo carrega bloqueado e não é indexável", async ({ page }) => {
  await page.goto("/admin.html");
  await expect(page).toHaveTitle(/Administração.*Conexão FM/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  await expect(page.getByRole("heading", { name: "Acesso protegido" })).toBeVisible();
  await expect(page.getByLabel("Token de acesso")).toHaveAttribute("type", "password");
  await expect(page.locator("#dashboard")).toBeHidden();
  await expect(page.locator("#promotion-form")).toBeAttached();
  await expect(page.locator("#promotion-form")).toBeHidden();
});


test("início mostra somente histórico real e ranking por reproduções", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("conexao-fm-recent", JSON.stringify(["db-radio-a"]));
  });
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/stations**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      stations: [
        { slug: "radio-a", name: "Rádio A", stream_url: "https://stream.example.test/a", city: "São Paulo", categories: ["pop"] },
        { slug: "radio-b", name: "Rádio B", stream_url: "https://stream.example.test/b", city: "Campinas", categories: ["rock"] }
      ],
      pagination: { total: 2, limit: 100, offset: 0, has_more: false }
    }) })
  );
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/stats**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      top_stations: [
        { slug: "radio-b", name: "Rádio B", plays: 12, sessions: 8 },
        { slug: "radio-a", name: "Rádio A", plays: 7, sessions: 5 }
      ]
    }) })
  );
  await page.goto("/");
  await expect(page.locator("#recentSection")).toBeVisible();
  await expect(page.locator("#recentStations .recent-station")).toHaveCount(1);
  await expect(page.locator("#recentStations")).toContainText("Rádio A");
  await expect(page.locator("#recentStations")).not.toContainText("Rádio B");
  await expect(page.locator("#popularSection")).toBeVisible();
  await expect(page.locator("#popularStations .popular-station")).toHaveCount(2);
  await expect(page.locator("#popularStations .popular-info").first()).toContainText("Rádio B");
});


test("todas as páginas públicas do sitemap respondem e possuem SEO básico", async ({ page, request }) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  expect(sitemapResponse.headers()["content-type"]).toMatch(/xml/i);

  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(urls.length).toBeGreaterThan(0);
  expect(new Set(urls).size).toBe(urls.length);

  for (const url of urls) {
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://radio-conexao-fm.pages.dev");
    const path = parsed.pathname === "/" ? "/" : parsed.pathname;
    const response = await page.goto(path);
    expect(response && response.status(), `HTTP status for ${path}`).toBe(200);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/i);
  }
});

test("rota antiga de explorar redireciona para a visualização correta e não entra no sitemap", async ({ page, request }) => {
  await page.goto("/radios.html");
  await expect(page).toHaveURL(/index\.html\?view=explorar/);
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBe("https://radio-conexao-fm.pages.dev/");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("https://radio-conexao-fm.pages.dev/radios.html");
});


test("ads.txt declara corretamente o vendedor AdSense do site", async ({ request }) => {
  const response = await request.get("/ads.txt");
  expect(response.status()).toBe(200);
  const body = (await response.text()).trim();
  expect(body).toBe("google.com, pub-9719336050584861, DIRECT, f08c47fec0942fa0");
});

test("página Anuncie é pública, indexável e possui contato comercial", async ({ page }) => {
  await page.goto("/anuncie.html");
  await expect(page).toHaveTitle(/Anuncie na Conexão FM/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://radio-conexao-fm.pages.dev/anuncie.html");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  await expect(page.getByRole("link", { name: /Solicitar informações pelo WhatsApp/i })).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await expect(page.locator("body")).toContainText("Patrocinado");
});

test("página Anuncie está incluída no sitemap e acessível pelo início", async ({ page, request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://radio-conexao-fm.pages.dev/anuncie.html");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Anuncie" })).toHaveAttribute("href", "anuncie.html");
});


test("explorar combina país, idioma e gênero, mostra bandeira e carrega mais resultados", async ({ page }) => {
  const stationRequests = [];
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/catalog/filters", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({
      countries: [{ code: "BR", station_count: 10 }],
      languages: [{ code: "pt-BR", station_count: 10 }],
      regions: [], cities: [],
      categories: [{ slug: "rock", name: "Rock", station_count: 4 }]
    })
  }));
  await page.route("https://de1.api.radio-browser.info/json/countries**", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify([
      { iso_3166_1: "US", name: "United States", stationcount: 1000 },
      { iso_3166_1: "BR", name: "Brazil", stationcount: 500 }
    ])
  }));
  await page.route("https://de1.api.radio-browser.info/json/languages**", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify([
      { iso_639: "en", name: "english", stationcount: 1000 },
      { iso_639: "pt", name: "portuguese", stationcount: 500 }
    ])
  }));
  await page.route("https://de1.api.radio-browser.info/json/stations/search**", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify([{
      stationuuid: "radio-us-test", name: "New York Rock Radio",
      url_resolved: "https://stream.example.test/us-rock", countrycode: "US",
      country: "United States", language: "english", state: "New York",
      tags: "rock", favicon: "", lastcheckok: 1, bitrate: 128
    }])
  }));
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/api/stations**", route => {
    const url = new URL(route.request().url());
    stationRequests.push(url);
    const offset = Number(url.searchParams.get("offset") || 0);
    const filtered = url.searchParams.get("country_code") === "US";
    route.fulfill({
      status: 200, contentType: "application/json", body: JSON.stringify({
        stations: filtered && offset === 0 ? Array.from({ length: 24 }, (_, index) => ({
          slug: index === 0 ? "radio-rock-us" : "radio-rock-us-" + index,
          name: index === 0 ? "Rock USA FM" : "Rock USA FM " + index,
          stream_url: "https://stream.example.test/db-us-" + index, logo_url: "",
          country_code: "US", state: "New York", city: index === 0 ? "New York" : "Albany",
          language: "en-US", description: "Rock", is_verified: index === 0 ? 1 : 0,
          categories: ["rock"]
        })) : offset === 24 ? [{
          slug: "radio-rock-us-2", name: "Rock USA FM 2",
          stream_url: "https://stream.example.test/db-us-2", logo_url: "",
          country_code: "US", state: "New York", city: "Buffalo",
          language: "en-US", description: "Rock", is_verified: 0,
          categories: ["rock"]
        }] : [],
        pagination: { total: filtered ? 25 : 0, limit: 24, offset, has_more: filtered && offset === 0 }
      })
    });
  });
  await page.goto("/index.html?view=explorar");
  await expect(page.locator("#countryFilter option[value='US']")).toHaveText(/United States/);
  await page.locator("#countryFilter").selectOption("US");
  await page.locator("#languageFilter").selectOption("en");
  await page.locator("#genreFilter").selectOption("rock");
  await expect.poll(() => stationRequests.some(url =>
    url.searchParams.get("country_code") === "US" &&
    url.searchParams.get("language") === "en" &&
    url.searchParams.get("category") === "rock"
  )).toBeTruthy();
  await expect(page.locator("#stations")).toContainText("Rock USA FM");
  await expect(page.locator(".catalog-country").first()).toContainText("United States");
  await expect(page.locator("#loadMoreCatalog")).toBeVisible();
  await page.locator("#loadMoreCatalog").click();
  await expect.poll(() => stationRequests.some(url => url.searchParams.get("offset") === "24")).toBeTruthy();
  await expect(page.locator("#stations")).toContainText("Rock USA FM 2");
});


test("rádios sem logotipo exibem arte neutra em vez de capa vazia", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("conexao-fm-data-saver", "0"));
  await page.route("**/api/stations**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      stations: [{
        id: "sem-logo", slug: "sem-logo", name: "Rádio Sem Logo",
        stream_url: "https://stream.example.test/live", logo_url: "",
        city: "Campinas", state: "SP", country_code: "BR",
        language: "Portuguese", categories: ["pop"], is_verified: 1
      }],
      pagination: { total: 1, limit: 100, offset: 0, has_more: false }
    })
  }));
  await page.goto("/index.html?view=explorar");
  const station = page.locator(".station").filter({ hasText: "Rádio Sem Logo" });
  await expect(station).toBeVisible();
  await expect(station.locator(".cover-fallback")).toBeVisible();
  await expect(station.locator(".station-logo")).toHaveCount(0);
});
