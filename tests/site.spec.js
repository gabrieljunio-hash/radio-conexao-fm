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

test("página individual informa quando a estação não existe", async ({ page }) => {
  await page.route("https://radio-conexao-api.bieljuniho.workers.dev/**", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stations: [], pagination: { total: 0, limit: 100, offset: 0, has_more: false } }) })
  );
  await page.goto("/radio.html?station=estacao-inexistente");
  await expect(page.locator("body")).toContainText(/não encontramos essa rádio|não cadastrada no catálogo|indisponível/i);
});

test("player envia heartbeat após 60 segundos e mantém a mesma sessão", async ({ page }) => {
  const API = "https://radio-conexao-api.bieljuniho.workers.dev";
  const events = [];
  await page.clock.install();
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
  });
  await page.route(API + "/**", async route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/stations") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        stations: [{ id: 24, slug: "radio-teste", name: "Rádio Teste", stream_url: "https://stream.example.test/live", website_url: null, logo_url: null, country_code: "BR", state: "SP", city: "São Paulo", language: "pt", description: "Estação de teste", categories: ["pop"] }],
        pagination: { total: 1, limit: 100, offset: 0, has_more: false }
      }) });
    }
    if (url.pathname === "/api/categories") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ categories: [] }) });
    }
    if (url.pathname === "/api/events") {
      events.push(route.request().postDataJSON());
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, recorded: true }) });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
  await page.goto("/?view=explorar");
  const playButton = page.locator('#stations [data-play^="db-"]').first();
  await expect(playButton).toBeVisible();
  await playButton.click();
  await expect.poll(() => events.some(event => event.event_type === "play")).toBeTruthy();
  await page.clock.fastForward(60000);
  await expect.poll(() => events.some(event => event.event_type === "heartbeat")).toBeTruthy();
  const play = events.find(event => event.event_type === "play");
  const heartbeat = events.find(event => event.event_type === "heartbeat");
  expect(heartbeat.station_slug).toBe(play.station_slug);
  expect(heartbeat.session_id).toBe(play.session_id);
});
