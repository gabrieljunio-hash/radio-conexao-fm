# Regras obrigatórias para implementar novas funcionalidades

Estas regras devem ser consultadas antes de qualquer alteração no Rádio Conexão FM. O objetivo é impedir que uma melhoria quebre recursos já existentes.

## 1. Entender antes de alterar
- Identificar como a funcionalidade atual funciona e quais arquivos, telas, eventos, APIs e dados ela utiliza.
- Verificar se já existe uma função ou componente que resolve parte do problema; reutilizar em vez de duplicar.
- Registrar quais áreas podem ser afetadas: player, navegação, catálogo, busca, favoritos, histórico, anúncios, analytics, SEO, painel administrativo e layout mobile.
- Não reescrever arquivos ou fluxos inteiros quando uma alteração pequena e isolada resolver.

## 2. Proteger o que já funciona
- Não alterar o comportamento do player persistente, reprodução em segundo plano ou recuperação após interrupções ao trabalhar em áreas sem relação com áudio.
- Não mudar rotas, histórico do navegador ou navegação inferior sem testar voltar/avançar e links diretos.
- Não modificar contratos da API, tabelas D1, nomes de campos ou identificadores sem verificar todos os consumidores.
- Não apagar dados, configurações, eventos ou compatibilidade existentes para simplificar uma implementação.
- Não trocar imagens, ícones, textos ou elementos visuais fora do escopo solicitado.

## 3. Isolar código e estilos
- Preferir classes específicas da funcionalidade; evitar seletores globais que atinjam componentes diferentes.
- Não reutilizar uma classe genérica com significado ou aparência diferente em outra tela.
- Ao alterar CSS, conferir cascata, especificidade, media queries e estilos adicionados anteriormente no arquivo.
- Ao alterar JavaScript, preservar os eventos existentes e evitar listeners duplicados ou efeitos colaterais globais.
- Manter estados de carregamento, erro e sucesso separados; toda requisição deve encerrar o estado de carregamento mesmo quando falhar.

## 4. Dados e desempenho
- Tratar respostas vazias, lentas, inválidas e erros de rede sem travar a interface.
- Evitar chamadas repetidas, consultas desnecessárias e renderizações completas quando uma atualização local basta.
- Preservar cache e economia de dados, salvo quando a tarefa exigir mudança explícita.
- Reservar espaço para conteúdo assíncrono para evitar saltos de layout.
- Nunca mostrar um fallback por cima de uma imagem válida; se a imagem falhar, o fallback deve voltar a aparecer.

## 5. Acessibilidade e celular
- Testar primeiro em largura de celular e também em desktop.
- Manter botões com área de toque adequada, rótulos acessíveis e foco visível.
- Respeitar a preferência por movimento reduzido.
- Garantir que textos longos, imagens ausentes e listas vazias não quebrem o layout.

## 6. Processo obrigatório de cada implementação
1. Definir o objetivo e os critérios de aceite em linguagem simples.
2. Inspecionar os arquivos e fluxos envolvidos antes de editar.
3. Listar as funcionalidades que podem sofrer impacto.
4. Criar uma branch própria; não desenvolver diretamente na main.
5. Fazer a menor alteração segura possível.
6. Revisar o diff para remover mudanças acidentais e conferir se o escopo foi respeitado.
7. Executar verificações de sintaxe, testes automatizados e testes de navegador disponíveis.
8. Fazer regressão das áreas relacionadas e das áreas críticas: abrir/fechar telas, navegação voltar/avançar, busca, favoritos, player e responsividade.
9. Só integrar na main quando as verificações obrigatórias passarem. Se algum teste não puder ser executado, registrar isso e não declarar sucesso.
10. Após integrar, confirmar o deploy e verificar a versão publicada. Se houver falha, reverter ou corrigir sem acumular mudanças não validadas.

## 7. Checklist para fechar cada tarefa
- [ ] O objetivo solicitado foi atendido sem mudanças fora do escopo.
- [ ] O player continua tocando ao navegar entre telas.
- [ ] Voltar/avançar do navegador continua funcionando.
- [ ] Busca, catálogo, favoritos e histórico continuam funcionando.
- [ ] Imagens e fallbacks aparecem corretamente, sem ícones sobrepostos.
- [ ] Estados de carregamento e erro terminam corretamente.
- [ ] Layout mobile e desktop conferidos.
- [ ] Testes automatizados e de navegador passaram.
- [ ] Diff revisado e documentação atualizada quando necessário.
- [ ] Deploy confirmado após a integração.

**Regra final:** nenhuma funcionalidade nova pode ser considerada concluída apenas porque a tela parece correta. Ela precisa funcionar e não pode quebrar os fluxos que já existiam.
