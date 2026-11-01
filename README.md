# Rádio Conexão FM

Site estático responsivo para descobrir e ouvir rádios online, sem APIs pagas, servidor próprio ou processo de build.

## Páginas
- `index.html`: início e player de rádio.
- `radios.html`: descoberta por gênero musical.
- `favoritos.html`: lista dos favoritos salvos neste navegador.
- `sobre.html`: informações sobre o projeto.
- `indicar.html`: formulário que prepara uma mensagem para enviar pelo WhatsApp.
- `privacidade.html`: explica o armazenamento local e o uso de serviços externos.

## Recursos
- Layout para celular e computador
- Busca no catálogo e categorias
- Favoritos salvos localmente no navegador
- Player com play/pause, parar, mute e volume
- Metadados SEO por página, `robots.txt`, `sitemap.xml` e Open Graph
- Política de privacidade atualizada para os recursos atuais
- Acessibilidade: foco de teclado visível e suporte a movimento reduzido
- Manifesto web para facilitar a instalação em dispositivos compatíveis
- Catálogo comunitário Radio Browser com carregamento dinâmico de estações verificadas quando disponíveis

## Publicar com GitHub Pages
1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/(root)** e salve.
4. Aguarde alguns minutos e abra o endereço exibido na tela do Pages.

## Catálogo de rádios online
A página inicial consulta o diretório comunitário Radio Browser para carregar estações brasileiras com streams listados como ativos. O diretório é gratuito e não exige chave de API, mas é um serviço de terceiros: pode ficar indisponível e algumas transmissões podem falhar, mudar de endereço ou bloquear reprodução no navegador.

## Adicionar transmissões próprias
No arquivo `index.html`, procure `const RADIO_STATIONS`. Em cada estação manual, troque `streamUrl:""` por um endereço direto de áudio autorizado pela emissora. Links para páginas comuns não funcionam como stream. Algumas estações bloqueiam reprodução externa; use HTTPS sempre que possível.

As estações demonstrativas iniciais ainda não têm áudio configurado; as estações reais são carregadas do diretório quando a página abre. Os favoritos ficam salvos localmente no navegador do dispositivo atual e não sincronizam automaticamente entre aparelhos. A página de favoritos usa `noindex` porque o conteúdo é pessoal e local ao dispositivo.

## Patrocinadores locais
A área de parceiros da página inicial fica oculta enquanto não houver patrocinadores ativos. Para cadastrar um parceiro, edite `data/sponsors.json` e adicione um item em `sponsors` com:
- `active`: `true` para exibir ou `false` para pausar.
- `name` e `description`: nome e texto curto.
- `destination_url`: destino HTTPS do parceiro.
- `image_url` (opcional): imagem HTTPS do parceiro.
- `image_alt` (opcional): texto alternativo da imagem.
- `starts_at` e `ends_at` (opcionais): datas ISO 8601 para início e fim da campanha.

O site exibe até quatro parceiros ativos, identifica o conteúdo como patrocinado e ignora destinos que não sejam HTTPS. A configuração inicial está vazia; nenhum anúncio é exibido automaticamente.
