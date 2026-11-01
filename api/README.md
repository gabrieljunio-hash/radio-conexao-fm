# API da Rádio Conexão FM

API inicial em Cloudflare Workers com D1. O arquivo de entrada é `src/index.js`.

## Requisito

No Worker `radio-conexao-api`, mantenha o binding D1 com o nome **DB** apontando para o banco **radio-conexao-db**.

## Publicação pelo painel Cloudflare

1. Abra Workers & Pages e selecione `radio-conexao-api`.
2. Abra **Edit code**.
3. Substitua o código atual pelo conteúdo completo de `api/src/index.js`.
4. Salve e faça Deploy.

A publicação não altera o site Pages nem a branch `main`. Não remova o binding DB.

## Rotas públicas

- `GET /api/health` — verifica a conexão com D1.
- `GET /api/stats?period=7d|30d` — retorna métricas agregadas de audiência, sessões estimadas, ranking e série diária.
- `GET /api/categories` — lista categorias e quantidade de rádios associadas.
- `GET /api/stations` — lista rádios ativas.
- `POST /api/events` — registra eventos agregados de reprodução para rádios do catálogo próprio. Recebe `event_type` (`play`, `stop` ou `heartbeat`), `station_slug` e `session_id` UUID v4.
- Filtros de rádios: `q`, `category`, `state`, `city`, `limit` (máximo 100) e `offset`.

Exemplos:

```
https://SEU-WORKER.workers.dev/api/health
https://SEU-WORKER.workers.dev/api/categories
https://SEU-WORKER.workers.dev/api/stations?limit=20
```

## Observações

- As rotas de catálogo são somente leitura; `POST /api/events` é a única rota de gravação pública.
- A rota de audiência não aceita dados pessoais e não grava endereço IP na tabela `play_events`.
- O painel público `audiencia.html` exibe somente métricas agregadas; não expõe IDs de sessão.
- Sessões estimadas são contagens de identificadores temporários, não pessoas únicas.
- A API de estatísticas limita a consulta aos últimos 7 ou 30 dias.
- O painel pode mostrar zeros até que existam reproduções registradas.
- CORS permite o domínio Pages atual e o domínio GitHub Pages antigo.
