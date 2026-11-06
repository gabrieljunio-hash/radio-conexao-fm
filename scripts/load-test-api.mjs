const API_BASE = process.env.API_BASE || "https://radio-conexao-api.bieljuniho.workers.dev";
const ORIGIN = "https://radio-conexao-fm.pages.dev";
const ENDPOINT = API_BASE.replace(/\/$/, "") + "/api/stations?limit=24&offset=0";
const STAGES = [10, 25, 50, 100, 250, 500, 1000];
const TIMEOUT_MS = 15000;

const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
};

async function requestOne() {
  const start = performance.now();
  try {
    const response = await fetch(ENDPOINT, {
      headers: { Accept: "application/json", Origin: ORIGIN },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
    const raw = await response.text();
    let data = null;
    try { data = JSON.parse(raw); } catch {}
    const valid = response.ok && Array.isArray(data?.stations) && !!data?.pagination;
    return {
      ok: valid,
      status: response.status,
      ms: performance.now() - start,
      cache: response.headers.get("cf-cache-status") || "n/a",
      error: valid ? "" : "Resposta inesperada da API"
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      ms: performance.now() - start,
      cache: "n/a",
      error: error?.name || "network_error"
    };
  }
}

async function runStage(concurrency) {
  const started = performance.now();
  const results = await Promise.all(Array.from({ length: concurrency }, requestOne));
  const elapsed = performance.now() - started;
  const latencies = results.map(item => item.ms);
  const failures = results.filter(item => !item.ok);
  const statusCounts = Object.fromEntries(
    [...new Set(results.map(item => item.status))].sort((a, b) => a - b)
      .map(status => [String(status), results.filter(item => item.status === status).length])
  );
  const cacheCounts = Object.fromEntries(
    [...new Set(results.map(item => item.cache))]
      .map(cache => [cache, results.filter(item => item.cache === cache).length])
  );
  const summary = {
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
    http_statuses: statusCounts,
    cloudflare_cache: cacheCounts,
    sample_errors: failures.slice(0, 5).map(item => item.error)
  };
  console.log(JSON.stringify(summary));
  return summary;
}

const warmup = await requestOne();
if (!warmup.ok) {
  console.error("Warm-up falhou; teste interrompido:", warmup);
  process.exit(1);
}
console.log("Warm-up OK. Teste somente leitura; nenhuma rádio será reproduzida e nenhum dado será gravado.");

for (const concurrency of STAGES) {
  const result = await runStage(concurrency);
  const errorRate = result.failed / result.concurrent_requests;
  if (errorRate > 0.01 || result.latency_ms.p95 > 6000) {
    console.error(`Interrompido após ${concurrency} conexões: limite de segurança atingido.`);
    process.exit(1);
  }
  await new Promise(resolve => setTimeout(resolve, 1500));
}
console.log("Teste concluído até 1000 requisições simultâneas.");
