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
