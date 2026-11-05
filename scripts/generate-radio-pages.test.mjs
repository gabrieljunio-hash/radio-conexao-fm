import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStationPage, buildSitemap, escapeHtml } from "./generate-radio-pages.mjs";

const station = {
  slug: "radio-teste",
  name: "Rádio <Teste> & Cia",
  description: "Música para todos.",
  city: "Campinas",
  state: "SP",
  country_code: "BR",
  categories: ["pop", "flashback"],
  logo_url: "https://example.com/logo.png",
  website_url: "https://example.com"
};

test("escapa conteúdo fornecido pelo catálogo", () => {
  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
});

test("gera página individual com SEO e conteúdo visível antes do JavaScript", () => {
  const html = buildStationPage(station);
  assert.match(html, /<title>Rádio &lt;Teste&gt; &amp; Cia ao vivo/);
  assert.match(html, /name="description"/);
  assert.match(html, /rel="canonical" href="https:\/\/radio-conexao-fm\.pages\.dev\/radio\/radio-teste\//);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /<h1>Rádio &lt;Teste&gt; &amp; Cia<\/h1>/);
  assert.match(html, /Campinas, SP/);
  assert.match(html, /Ouvir esta rádio/);
  assert.match(html, /https:\/\/example\.com\/logo\.png/);
});

test("rejeita slug inválido para impedir caminhos inseguros", () => {
  assert.throws(() => buildStationPage({ ...station, slug: "../fora" }), /Slug inválido/);
});

test("sitemap mantém páginas institucionais e adiciona URLs de rádios", () => {
  const current = '<?xml version="1.0"?><urlset><url><loc>https://radio-conexao-fm.pages.dev/</loc></url></urlset>';
  const xml = buildSitemap(current, [station]);
  assert.match(xml, /https:\/\/radio-conexao-fm\.pages\.dev\//);
  assert.match(xml, /https:\/\/radio-conexao-fm\.pages\.dev\/radio\/radio-teste\//);
});
