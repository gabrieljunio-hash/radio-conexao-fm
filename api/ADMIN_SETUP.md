# Configuração do painel administrativo

O painel estático fica em `/admin.html`. As operações administrativas são executadas pelo Worker da API e protegidas por um token secreto. O token nunca deve ser colocado no HTML, no GitHub ou enviado por mensagem.

## 1. Atualizar o Worker

1. Abra o [Worker radio-conexao-api no Cloudflare](https://dash.cloudflare.com/?to=/:account/workers/services/view/radio-conexao-api).
2. Abra **Edit code**.
3. Substitua o código pelo conteúdo de [api/src/index.js](https://github.com/gabrieljunio-hash/radio-conexao-fm/blob/fix/d1-import-small-batches/api/src/index.js).
4. Salve e faça Deploy. Preserve o binding D1 chamado `DB`, apontando para `radio-conexao-db`.

## 2. Criar o token secreto

1. Gere uma senha aleatória com pelo menos 32 caracteres (recomendado: 64 caracteres hexadecimais).
2. No Worker, abra **Settings → Variables and Secrets → Add**.
3. Nome: `ADMIN_TOKEN`.
4. Tipo: **Secret** (não Text). Cole o token e salve.
5. Não coloque o token no repositório nem o envie em conversas.

## 3. Acessar

Abra [Painel administrativo](https://radio-conexao-fm.pages.dev/admin.html) e informe o token. Ele fica apenas na sessão atual do navegador e é apagado ao sair/encerrar a sessão.

## Recursos

- Resumo de rádios ativas, cadastradas, verificadas e categorias.
- Busca no diretório público Radio Browser por país, estilo e nome.
- Importação em lote de até 100 rádios por operação, ignorando URLs e identificadores já cadastrados.
- Teste individual de transmissão antes da importação.
- Cadastro manual com teste obrigatório da URL de áudio.
- Busca no catálogo e ativação/desativação de emissoras.
- A importação marca as rádios como não verificadas editorialmente (`is_verified=0`). O status do Radio Browser não garante reprodução em todos os aparelhos.

## Rotas protegidas

Todas exigem `Authorization: Bearer <ADMIN_TOKEN>`:

- `GET /api/admin/summary`
- `GET /api/admin/stations?q=&limit=&offset=`
- `GET /api/admin/discover?country=BR&tag=&name=&limit=50`
- `POST /api/admin/test-stream`
- `POST /api/admin/stations`
- `POST /api/admin/import/radio-browser`
- `POST /api/admin/stations/:id/status`

O Worker não armazena o token no D1. Respostas administrativas usam `Cache-Control: no-store`.
