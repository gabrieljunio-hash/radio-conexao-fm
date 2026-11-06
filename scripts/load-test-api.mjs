const API_BASE = process.env.API_BASE || "https://radio-conexao-api.bieljuniho.workers.dev";
const ORIGIN = "https://radio-conexao-fm.pages.dev";
const TIMEOUT_MS = 15000;
const STAGES = [10, 25, 50, 100];
const ENDPOINTS = [
  { name: "stations", path: "/api/stations?limit=24&offset=0", valid: data => Array.isArray(data?.stations) && !!data?.pagination },
  { name: "catalog_filters", path: "/api/catalog/filters", valid: data => Array.isArray(data?.countries) && Array.isArray(data?.categories) },
  { name: "stats_7d", path: "/api/stats?period=7d", valid: data => data?.period === "7d" && !!data?.summary && Array.isArray(data?.top_stations) && Array.isArray(data?.daily) },
  { name: "promotions_home", path: "/api/promotions?placement=home", valid: data => Array.isArray(data?.campaigns) }
];

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
};

async function requestOne(endpoint) {
  const start = performance.now();
  try {
    const response = await fetch(API_BASE.replace(/\/$/, "") + endpoint.path, {
      headers: { Accept: "application/json", Origin: ORIGIN },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    const valid = response.ok && endpoint.valid(data);
    return {
      ok: valid,
      status: response.status,
      ms: performance.now() - start,
      cache: response.headers.get("cf-cache-status") || "n/a",
      error: valid ? "" : (data?.error || "Resposta inesperada da API")
    };
  } catch (error) {
    return { ok: false, status: 0, ms: performance.now() - start, cache: "n/a", error: error?.name || "network_error" };
  }
}

async function runStage(endpoint, concurrency) {
  const started = performance.now();
  const results = await Promise.all(Array.from({ length: concurrency }, () => requestOne(endpoint)));
  const elapsed = performance.now() - started;
  const latencies = results.map(item => item.ms);
  const failures = results.filter(item => !item.ok);
  const summary = {
    endpoint: endpoint.name,
    concurrent_requests: concurrency,
    successful: results.length - failures.length,
    failed: failures.length,
    elapsed_ms: Math.round(elapsed),
    requests_per_second: Number((results.length / (elapsed / 1000)).toFixed(1)),
    latency_ms: {
      p50: Math.round(percentile(latencies, 0.50)),
      p95: Math.round(percentile(latencies, 0.95)),
      p99: Math.round(percentile(latencies, 0.99)),
      max: Math.round(Math.max(...latencies))
    },
    http_statuses: Object.fromEntries([...new Set(results.map(item => item.status))].sort((a,b)=>a-b).map(status=>[String(status),results.filter(item=>item.status===status).length])),
    cloudflare_cache: Object.fromEntries([...new Set(results.map(item=>item.cache))].map(cache=>[cache,results.filter(item=>item.cache===cache).length])),
    sample_errors: failures.slice(0, 5).map(item => item.error)
  };
  console.log(JSON.stringify(summary));
  return summary;
}

console.log("Teste de leitura: endpoints de catálogo, filtros, audiência e anúncios. Nenhum dado será gravado e nenhuma rádio será reproduzida.");
for (const endpoint of ENDPOINTS) {
  const warmup = await requestOne(endpoint);
  if (!warmup.ok) {
    console.error("Warm-up falhou; teste interrompido:", endpoint.name, warmup);
    process.exit(1);
  }
  console.log(JSON.stringify({ endpoint: endpoint.name, warmup_ms: Math.round(warmup.ms), status: warmup.status }));
  for (const concurrency of STAGES) {
    const result = await runStage(endpoint, concurrency);
    const errorRate = result.failed / result.concurrent_requests;
    if (errorRate > 0.01 || result.latency_ms.p95 > 6000) {
      console.error(`Interrompido em ${endpoint.name}, ${concurrency} simultâneas: limite de segurança atingido.`);
      process.exit(1);
    }
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
}
console.log("Teste concluído: 4 endpoints, até 100 requisições simultâneas por endpoint.");
