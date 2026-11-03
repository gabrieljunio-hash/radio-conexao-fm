# API da Rádio Conexão FM

API inicial em Cloudflare Workers com D1. O arquivo de entrada é `src/index.js`.

## Requisito

No Worker `radio-conexao-api`, mantenha o binding D1 com o nome **DB** apontando para o banco **radio-conexao-db**.

## Wrangler e Cloudflare Workers Builds

A configuração do Worker fica em `api/wrangler.toml`; não existe configuração Wrangler na raiz do repositório.

Para executar os comandos a partir da raiz do repositório, informe o caminho completo:

```bash
npx wrangler dev --config api/wrangler.toml
npx wrangler preview --config api/wrangler.toml
npx wrangler deploy --config api/wrangler.toml
```

No painel **Workers & Pages → radio-conexao-api → Settings → Builds**, configure o diretório raiz como `api`. Assim, comandos executados dentro do diretório do Worker encontram `wrangler.toml` e `src/index.js` sem duplicar a configuração na raiz.

Se o diretório raiz precisar permanecer como a raiz do repositório, o comando de build/preview deve incluir explicitamente `--config api/wrangler.toml`. Não use apenas `wrangler preview`, pois isso faz o Wrangler procurar `./wrangler.toml` na raiz.

O CI valida a configuração e o bundle sem publicar o Worker usando:

```bash
npx wrangler deploy --dry-run --config api/wrangler.toml
```

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

## Painel administrativo

O painel de cadastro/importação está em `/admin.html`. Ele exige o secret `ADMIN_TOKEN` configurado no Worker; sem esse secret as rotas administrativas permanecem bloqueadas. Consulte [ADMIN_SETUP.md](./ADMIN_SETUP.md) para publicar a API e configurar o secret. Nunca grave o token no HTML, no Git ou no D1.
