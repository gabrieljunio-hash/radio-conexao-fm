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


test("área de patrocinadores permanece oculta quando não há parceiros ativos", async ({ page }) => {
  await page.route("**/data/sponsors.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sponsors: [] })
  }));
  await page.goto("/");
  await expect(page.locator("#sponsorSection")).toBeHidden();
});

test("área de patrocinadores exibe somente parceiros ativos com destino HTTPS", async ({ page }) => {
  await page.route("**/data/sponsors.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ sponsors: [
      { active: true, name: "Comércio Parceiro", description: "Apoia a música local.", destination_url: "https://example.com", starts_at: "2026-01-01T00:00:00Z" },
      { active: true, name: "Destino inseguro", description: "Não deve aparecer.", destination_url: "javascript:alert(1)" },
      { active: false, name: "Patrocínio pausado", description: "Não deve aparecer.", destination_url: "https://example.org" },
      { active: true, name: "Sem destino", description: "Não deve aparecer.", destination_url: "" }
    ] })
  }));
  await page.goto("/");
  await expect(page.locator("#sponsorSection")).toBeVisible();
  await expect(page.locator("#sponsorCards .sponsor-card")).toHaveCount(1);
  await expect(page.locator("#sponsorCards")).toContainText("Comércio Parceiro");
  await expect(page.locator("#sponsorCards")).not.toContainText("Destino inseguro");
  await expect(page.locator("#sponsorCards a")).toHaveAttribute("rel", "sponsored noopener noreferrer");
  await expect(page.locator("#sponsorCards a")).toHaveAttribute("href", "https://example.com/");
});


test("página comercial apresenta contato de WhatsApp correto", async ({ page }) => {
  await page.goto("/anuncie.html");
  await expect(page.getByRole("heading", { name: "Conecte sua marca a novos ouvintes." })).toBeVisible();
  await expect(page.getByRole("link", { name: /Conversar pelo WhatsApp/ })).toHaveAttribute("href", "https://wa.me/551996547439?text=Ol%C3%A1%21%20Tenho%20interesse%20em%20anunciar%20na%20Conex%C3%A3o%20FM.");
});
