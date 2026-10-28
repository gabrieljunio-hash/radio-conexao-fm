# Rádio Conexão FM

Site estático responsivo para descobrir e ouvir rádios online, sem APIs pagas, servidor próprio ou processo de build.

## Recursos
- Layout para celular e computador
- Busca por nome, cidade e gênero
- Categorias de música
- Favoritos salvos localmente no navegador
- Player com play/pause, parar, mute e volume
- Catálogo manual, sem serviços pagos

## Publicar com GitHub Pages
1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/(root)** e salve.
4. Aguarde alguns minutos e abra o endereço exibido na tela do Pages.

## Adicionar transmissões reais
No arquivo `index.html`, procure `const RADIO_STATIONS`. Em cada estação, troque `streamUrl:""` por um endereço direto de áudio autorizado pela emissora. Links para páginas comuns não funcionam como stream. Algumas estações bloqueiam reprodução externa; use HTTPS sempre que possível.

O catálogo inicial é demonstrativo e ainda não tem streams configurados. Favoritos ficam salvos localmente no navegador do dispositivo atual.
