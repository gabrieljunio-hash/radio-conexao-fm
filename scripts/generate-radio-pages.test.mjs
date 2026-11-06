import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStationPage, buildSitemap, escapeHtml, enrichStation, enrichStations } from "./generate-radio-pages.mjs";

const station = {
  slug: "radio-teste",
  name: "Rádio <Teste> & Cia",
  description: "Música para todos.",
  language: "Português",
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
  assert.match(html, /<style>[\s\S]*\.listen\{[\s\S]*<\/style>/);
  assert.match(html, /<h1>Rádio &lt;Teste&gt; &amp; Cia<\/h1>\s*<a class="listen" href="\/?station=db-radio-teste&amp;autoplay=1&amp;openPlayer=1">▶ Ouvir rádio<\/a>/);
  assert.match(html, /Campinas, SP/);
  assert.match(html, /Sobre a Rádio &lt;Teste&gt; &amp; Cia/);
  assert.match(html, /Informações da emissora/);
  assert.match(html, /Estilos musicais/);
  assert.match(html, /\/?\?station=db-radio-teste&amp;autoplay=1&amp;openPlayer=1/);
  assert.doesNotMatch(html, /radio\.html\?station=/);
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


test("página não inventa descrição quando o catálogo não possui uma", () => {
  const html = buildStationPage({ ...station, description: "", categories: [], language: "" });
  assert.doesNotMatch(html, /Sobre a Rádio/);
  assert.match(html, /Informações da emissora/);
  assert.match(html, /player da Conexão FM/);
});


test("busca descrição e dados no site oficial e em página interna Sobre", async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(String(url));
    const isAbout = String(url).endsWith("/sobre");
    const html = isAbout
      ? '<html><head><meta name="description" content="A Rádio Teste transmite jornalismo, música e informação regional desde sua fundação. Sua programação acompanha a comunidade local durante todo o dia."></head><body><script type="application/ld+json">{"@type":"RadioStation","name":"Rádio Teste","broadcastFrequency":"FM 98.7","foundingDate":"1985"}</script></body></html>'
      : '<html><head><title>Rádio Teste</title></head><body><a href="/sobre">Sobre a rádio</a></body></html>';
    return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  };
  const result = await enrichStation({ ...station, description: "", website_url: "https://radio.example/" }, fetchImpl);
  assert.match(result.enrichment.description, /jornalismo, música e informação regional/);
  assert.equal(result.enrichment.frequency, "FM 98.7");
  assert.equal(result.enrichment.founded, "1985");
  assert.equal(result.enrichment.source_url, "https://radio.example/sobre");
  assert.equal(requests.length, 2);
  const html = buildStationPage({ ...result, enrichment: result.enrichment });
  assert.match(html, /Informações consultadas em/);
  assert.match(html, /FM 98\.7/);
  assert.match(html, /Rádio Teste transmite jornalismo/);
});

test("usa o diretório Radio Browser para localizar o site oficial quando o cadastro não tem URL", async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(String(url));
    if (String(url).includes("byuuid")) {
      return new Response(JSON.stringify([{ homepage: "https://radio.example/" }]), {
        status: 200, headers: { "content-type": "application/json" }
      });
    }
    return new Response('<html><head><meta name="description" content="Emissora regional com programação de música, notícias e prestação de serviços para a comunidade."></head></html>', {
      status: 200, headers: { "content-type": "text/html" }
    });
  };
  const result = await enrichStation({ ...station, slug: "rb-12345678-1234-1234-1234-123456789abc", description: "", website_url: "" }, fetchImpl);
  assert.match(result.enrichment.description, /Emissora regional/);
  assert.equal(requests.length, 2);
});

test("não consulta rádios que já possuem descrição completa e localização", async () => {
  let calls = 0;
  const result = await enrichStation({
    ...station,
    description: "Uma descrição detalhada da emissora com programação, história, equipe, região e informações suficientes para apresentar o conteúdo ao público.",
    city: "Campinas", state: "SP"
  }, async () => { calls += 1; throw new Error("não deveria consultar"); });
  assert.equal(calls, 0);
  assert.equal(result.enrichment, null);
});

test("não aceita redirecionamento para outro domínio como fonte oficial", async () => {
  const result = await enrichStation({ ...station, description: "", website_url: "https://radio.example/" }, async () => ({
    ok: true,
    url: "https://outro-dominio.example/",
    headers: new Headers({ "content-type": "text/html" }),
    text: async () => '<html><head><meta name="description" content="Descrição falsa suficientemente longa para ser usada."></head></html>'
  }));
  assert.equal(result.enrichment, null);
});

test("enriquece várias rádios sem interromper o lote quando um site falha", async () => {
  const result = await enrichStations([
    { ...station, description: "", website_url: "https://ok.example/" },
    { ...station, slug: "radio-sem-site", description: "", website_url: "" }
  ], async url => {
    if (String(url).includes("ok.example")) {
      return new Response('<html><head><meta name="description" content="Rádio com programação regional, música e notícias para os ouvintes de toda a região."></head></html>', {
        status: 200, headers: { "content-type": "text/html" }
      });
    }
    throw new Error("site fora do ar");
  }, 2);
  assert.match(result[0].enrichment.description, /programação regional/);
  assert.equal(result[1].enrichment, null);
});


test("localiza o site oficial por nome e país quando a rádio não tem UUID nem site cadastrado", async () => {
  const requests = [];
  const fetchImpl = async url => {
    requests.push(String(url));
    if (String(url).includes("/byname/")) {
      return new Response(JSON.stringify([
        { name: station.name, countrycode: "BR", homepage: "https://radio.example/" },
        { name: "Outra Rádio", countrycode: "BR", homepage: "https://other.example/" }
      ]), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response('<html><head><meta name="description" content="Emissora com música, informação e programação local para a comunidade durante toda a semana."></head></html>', {
      status: 200, headers: { "content-type": "text/html" }
    });
  };
  const result = await enrichStation({ ...station, slug: "radio-sem-uuid", description: "", website_url: "" }, fetchImpl);
  assert.match(result.enrichment.description, /música, informação e programação local/);
  assert.match(requests[0], /byname/);
  assert.equal(requests.length, 2);
});

test("não escolhe um site quando o diretório retorna duas fontes possíveis para a mesma rádio", async () => {
  const result = await enrichStation({ ...station, slug: "radio-sem-uuid", description: "", website_url: "" }, async () =>
    new Response(JSON.stringify([
      { name: station.name, countrycode: "BR", homepage: "https://one.example/" },
      { name: station.name, countrycode: "BR", homepage: "https://two.example/" }
    ]), { status: 200, headers: { "content-type": "application/json" } })
  );
  assert.equal(result.enrichment, null);
});
