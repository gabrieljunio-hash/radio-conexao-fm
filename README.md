# Rádio Conexão FM

Site estático responsivo para descobrir e ouvir rádios online, sem APIs pagas, servidor próprio ou processo de build.

## Páginas
- `index.html`: início e player de rádio.
- `radios.html`: descoberta por gênero musical.
- `favoritos.html`: lista dos favoritos salvos neste navegador.
- `sobre.html`: informações sobre o projeto.
- `indicar.html`: formulário que prepara uma mensagem para enviar pelo WhatsApp.

## Recursos
- Layout para celular e computador
- Busca no catálogo e categorias
- Favoritos salvos localmente no navegador
- Player com play/pause, parar, mute e volume
- Metadados SEO por página, `robots.txt` e `sitemap.xml`
- Manifesto web para facilitar a instalação em dispositivos compatíveis
- Catálogo manual, sem serviços pagos

## Publicar com GitHub Pages
1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/(root)** e salve.
4. Aguarde alguns minutos e abra o endereço exibido na tela do Pages.

## Adicionar transmissões reais
No arquivo `index.html`, procure `const RADIO_STATIONS`. Em cada estação, troque `streamUrl:""` por um endereço direto de áudio autorizado pela emissora. Links para páginas comuns não funcionam como stream. Algumas estações bloqueiam reprodução externa; use HTTPS sempre que possível.

**Importante:** o catálogo atual é demonstrativo e ainda não tem streams configurados. Não há APIs pagas nem transmissões reais incluídas neste momento. Os favoritos ficam salvos localmente no navegador do dispositivo atual e não sincronizam automaticamente entre aparelhos.
