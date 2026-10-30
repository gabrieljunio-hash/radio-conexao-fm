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
- `GET /api/categories` — lista categorias e quantidade de rádios associadas.
- `GET /api/stations` — lista rádios ativas.
- Filtros de rádios: `q`, `category`, `state`, `city`, `limit` (máximo 100) e `offset`.

Exemplos:

```
https://SEU-WORKER.workers.dev/api/health
https://SEU-WORKER.workers.dev/api/categories
https://SEU-WORKER.workers.dev/api/stations?limit=20
```

## Observações

- Nesta primeira versão, as rotas são somente leitura.
- A API não grava eventos de audiência nem permite cadastro/edição de rádios ainda.
- O banco está inicialmente sem emissoras cadastradas; por isso `/api/stations` deve retornar uma lista vazia.
- CORS permite o domínio Pages atual e o domínio GitHub Pages antigo.
