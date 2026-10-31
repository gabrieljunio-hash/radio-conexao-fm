const { test, expect } = require("@playwright/test");

const API = "https://radio-conexao-api.bieljuniho.workers.dev";

test("Preview carrega o catálogo real da API e apresenta rádios cadastradas", async ({ page }) => {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
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
  const diagnostics = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll("body *")].map(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return { tag: el.tagName, id: el.id, className: typeof el.className === "string" ? el.className : "", right: Math.round(rect.right), left: Math.round(rect.left), width: Math.round(rect.width), overflowX: style.overflowX };
    }).filter(el => el.right > width + 1 || el.left < -1).sort((a,b) => b.right-a.right).slice(0,15);
  });
  expect(diagnostics, "Elementos que causam rolagem horizontal: " + JSON.stringify(diagnostics)).toEqual([]);
});
