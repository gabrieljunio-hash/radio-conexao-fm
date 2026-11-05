# Preparação para Google AdSense

Este projeto está hospedado no Cloudflare Pages. O formato estático do site é compatível tecnicamente com a instalação do código do AdSense; a aprovação do domínio e da conta é decisão do Google.

**Estado atual:** nenhuma tag do AdSense, bloco de anúncio ou arquivo `ads.txt` ativo foi publicado. Não inserir identificadores fictícios nem exibir anúncios antes da aprovação.

## 1. Antes de solicitar a análise

- [ ] Criar uma conta no Google AdSense com os dados reais do responsável.
- [ ] Cadastrar o endereço do site que será monetizado. Se o projeto ainda estiver usando `radio-conexao-fm.pages.dev`, informar esse endereço; se depois migrar para domínio próprio, adicionar/verificar o novo domínio no AdSense.
- [ ] Conferir se as páginas públicas estão acessíveis, navegação funciona e o conteúdo é original e útil.
- [ ] Manter no site páginas de contato, sobre e política de privacidade atualizadas.
- [ ] Aguardar o resultado da análise do Google. Hospedar no Cloudflare não garante aprovação.

## 2. Dados necessários para a integração

Quando a conta estiver criada, guardar estes dados:

- **Publisher ID:** formato `ca-pub-XXXXXXXXXXXXXXXX` (fornecido pelo Google).
- **Linha ads.txt:** fornecida na seção Sites/ads.txt do AdSense; normalmente contém o publisher ID e o identificador de autorização do Google.
- **IDs dos blocos de anúncio:** gerados no AdSense para cada formato/posição que será usado.

Não compartilhar senha nem códigos de acesso da conta. O Publisher ID e os IDs dos blocos não são senhas, mas devem ser copiados exatamente da conta.

## 3. Instalação após a verificação

O AdSense oferece um código de verificação. Ele pode ser instalado no `<head>` das páginas ou por outro método apresentado no painel. O código real deve ser copiado diretamente da conta; não usar um ID de exemplo.

Depois que o Google aprovar o site e os anúncios forem configurados:

1. Inserir o script oficial do AdSense com o Publisher ID real nas páginas escolhidas.
2. Inserir somente os blocos de anúncio cujos IDs foram criados no painel.
3. Publicar o arquivo `ads.txt` na raiz pública do site, por exemplo `https://SEU-DOMINIO/ads.txt`, com a linha exata fornecida pelo Google.
4. Confirmar que `ads.txt` responde com HTTP 200 e que o conteúdo pode ser lido publicamente.
5. Testar no Preview e depois publicar em produção com revisão explícita.

**Modelo de referência — não publicar como está:**

```html
<script async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-SEU_ID_REAL"
  crossorigin="anonymous"></script>
```

O exemplo acima é apenas para reconhecer a estrutura. Ele não funciona com o texto `SEU_ID_REAL` e não deve ser adicionado ao site até existir um Publisher ID válido.

## 4. Privacidade e experiência do ouvinte

Antes de ativar anúncios, atualizar a política de privacidade para explicar o uso de cookies/tecnologias de publicidade do Google, personalização de anúncios e opções de controle aplicáveis. Verificar também os requisitos de consentimento e privacidade do Google para as regiões atendidas e as obrigações legais aplicáveis no Brasil.

Os anúncios devem ficar fora dos controles do player e não podem interromper a reprodução. A página deve identificar claramente os espaços publicitários e manter boa experiência em telas pequenas.

## 5. Checklist final de publicação

- [ ] Conta e site aprovados pelo Google.
- [ ] Publisher ID e IDs dos blocos conferidos.
- [ ] Política de privacidade revisada.
- [ ] `ads.txt` publicado na raiz e validado com HTTP 200.
- [ ] Anúncios testados em Preview, sem sobrepor o player ou navegação.
- [ ] Testes automatizados aprovados.
- [ ] Publicação em produção autorizada pelo responsável.

## Diferença entre Google Ads e AdSense

- **Google AdSense:** monetiza o site exibindo anúncios de terceiros; é o produto relevante para este projeto.
- **Google Ads:** é a plataforma usada por anunciantes para pagar campanhas. Criar uma campanha no Google Ads não gera receita para o site.
