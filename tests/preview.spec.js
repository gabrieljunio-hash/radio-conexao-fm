const { test, expect } = require("@playwright/test");

const API = "https://radio-conexao-api.bieljuniho.workers.dev";

test("Preview carrega o catálogo real da API e apresenta rádios cadastradas", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/?view=explorar");
  await expect(page.locator("#player")).toBeVisible();
  await expect(page.locator("#stations .station").first()).toBeVisible({ timeout: 20000 });
  await expect(page.locator("#stations")).toContainText(/./);
  await expect.poll(async () => page.locator('#stations a.station-detail-link').count(), { timeout: 20000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("Preview consegue consultar a API com CORS permitido", async ({ page, request }) => {
  const direct = await request.get(API + "/api/health");
  expect(direct.ok()).toBeTruthy();
  const health = await direct.json();
  expect(health.status).toBe("online");
  expect(health.database).toBe("connected");

  await page.goto("/");
  const cors = await page.evaluate(async () => {
    const response = await fetch("https://radio-conexao-api.bieljuniho.workers.dev/api/stations?limit=5");
    return { status: response.status, data: await response.json() };
  });
  expect(cors.status).toBe(200);
  expect(cors.data.stations.length).toBeGreaterThan(0);
  expect(cors.data.pagination.total).toBeGreaterThan(0);
});

test("Página individual abre uma estação real cadastrada na API", async ({ page, request }) => {
  const response = await request.get(API + "/api/stations?limit=1");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const station = data.stations[0];
  expect(station.slug).toBeTruthy();

  await page.goto("/radio.html?station=" + encodeURIComponent(station.slug));
  await expect(page.locator("#radioCard h1")).toHaveText(station.name, { timeout: 20000 });
  await expect(page.getByRole("button", { name: /adicionar aos favoritos/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /compartilhar rádio/i })).toBeVisible();
});

test("Preview responde corretamente em viewport mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#player")).toBeVisible();
  await expect(page.locator("body")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(dimensions.document, "Documento ultrapassa a largura do viewport: " + JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body, "Conteúdo do body ultrapassa a largura do viewport: " + JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test("Player envia eventos de audiência apenas para rádios do catálogo próprio", async ({ page }) => {
  let payload = null;
  await page.addInitScript(() => {
    localStorage.setItem("conexao-fm-data-saver", "0");
    HTMLMediaElement.prototype.play = function () {
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
  });
  // Use a deterministic station with a real stream URL. Some live D1 rows
  // only have an external player and cannot trigger the audio tracking event.
  await page.route(API + "/api/stations**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      stations: [{
        slug: "radio-teste",
        name: "Rádio Teste",
        stream_url: "https://stream.example.test/live",
        logo_url: "",
        city: "São Paulo",
        categories: ["pop"]
      }],
      pagination: { total: 1, limit: 100, offset: 0, has_more: false }
    })
  }));
  await page.route(API + "/api/events", async route => {
    const request = route.request();
    const origin = "https://feature-home-recent-popular.radio-conexao-fm.pages.dev";
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
      return;
    }
    payload = request.postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": origin },
      body: JSON.stringify({ ok: true, recorded: true })
    });
  });
  await page.goto("/?view=explorar");
  const playButton = page.locator('#stations [data-play="db-radio-teste"]');
  await expect(playButton).toBeVisible({ timeout: 20000 });
  await playButton.click();
  await expect.poll(() => payload).not.toBeNull();
  expect(payload.event_type).toBe("play");
  expect(payload.station_slug).toBe("radio-teste");
  expect(payload.session_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("Rádios estáticas Laser FM e Prata FM registram audiência", async ({ page }) => {
  const payloads = [];
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
  });
  await page.route(API + "/api/events", async route => {
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

test("Painel de audiência renderiza métricas e troca período", async ({ page }) => {
  const requests = [];
  await page.route(API + "/api/stats**", async route => {
    const url = new URL(route.request().url());
    requests.push(url.searchParams.get("period"));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        period: url.searchParams.get("period") || "7d",
        summary: { plays: 42, sessions: 17, stops: 8, heartbeats: 120 },
        top_stations: [{ slug: "radio-teste", name: "Rádio Teste", plays: 30, sessions: 12 }],
        daily: [{ day: "2026-10-31", plays: 42, sessions: 17 }]
      })
    });
  });
  await page.goto("/audiencia.html");
  await expect(page.getByRole("heading", { name: "Painel de audiência" })).toBeVisible();
  await expect(page.locator("#plays")).toHaveText("42");
  await expect(page.locator("#sessions")).toHaveText("17");
  await expect(page.locator("#ranking")).toContainText("Rádio Teste");
  await page.getByRole("button", { name: "30 dias" }).click();
  await expect.poll(() => requests).toContain("30d");
  await expect(page.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");
});

test("Painel de audiência usa dados reais da API e mantém o gráfico correto nos dois períodos", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });

  const sevenDayResponse = page.waitForResponse(response =>
    response.url().includes("/api/stats?period=7d") && response.status() === 200
  );
  await page.goto("/audiencia.html");
  const sevenDay = await sevenDayResponse;
  const sevenDayData = await sevenDay.json();

  expect(sevenDayData.period).toBe("7d");
  expect(sevenDayData.summary).toMatchObject({
    plays: expect.any(Number),
    sessions: expect.any(Number),
    stops: expect.any(Number),
    heartbeats: expect.any(Number)
  });
  expect(Array.isArray(sevenDayData.daily)).toBeTruthy();
  expect(Array.isArray(sevenDayData.top_stations)).toBeTruthy();
  await expect(page.locator("#plays")).not.toHaveText("—");
  await expect(page.locator("#chart .bar-wrap")).toHaveCount(7);

  const thirtyDayResponse = page.waitForResponse(response =>
    response.url().includes("/api/stats?period=30d") && response.status() === 200
  );
  await page.getByRole("button", { name: "30 dias" }).click();
  const thirtyDay = await thirtyDayResponse;
  const thirtyDayData = await thirtyDay.json();

  expect(thirtyDayData.period).toBe("30d");
  await expect(page.locator("#chart .bar-wrap")).toHaveCount(30);
  await expect(page.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(dimensions.document, "Painel ultrapassa o viewport: " + JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body, "Conteúdo ultrapassa o viewport: " + JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(errors).toEqual([]);
});


test("divulgação patrocinada aparece identificada e contabiliza impressão e clique", async ({ page }) => {
  const events = [];
  await page.route(API + "/api/promotions?placement=home", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ campaigns: [{
      id: 23, advertiser_name: "Comércio de teste", title: "Oferta patrocinada",
      description: "Condição especial", image_url: "", destination_url: "https://example.com/oferta",
      placement: "home"
    }] })
  }));
  await page.route(API + "/api/promotions/23/event", async route => {
    events.push(route.request().postDataJSON().event_type);
    await route.fulfill({
      status: 202, contentType: "application/json",
      body: JSON.stringify({ ok: true, recorded: true })
    });
  });
  await page.goto("/");
  const section = page.locator("#sponsoredSection");
  await expect(section).toBeVisible();
  const card = page.locator('.sponsored-card[data-promo-id="23"]');
  await expect(card).toContainText("Patrocinado");
  await expect(card).toContainText("Oferta patrocinada");
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => events.filter(type => type === "impression").length).toBe(1);
  const popup = page.waitForEvent("popup");
  await card.click();
  await popup;
  await expect.poll(() => events.filter(type => type === "click").length).toBe(1);
});

test("se não houver campanha ativa, a área de patrocínio permanece oculta", async ({ page }) => {
  await page.route(API + "/api/promotions?placement=home", route => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ campaigns: [] })
  }));
  await page.goto("/");
  await expect(page.locator("#sponsoredSection")).toBeHidden();
});
