QUEM GANHA? COPA 2026 — STARTER

COMO USAR
1. Descompacte a pasta.
2. Abra o arquivo index.html no Google Chrome.
3. Use o app normalmente.

ARQUIVOS
- index.html: página principal.
- style.css: visual do app.
- app.js: funcionamento do app.
- dados-copa.js: dados da Copa, grupos, jogos e mata-mata.
- jogadores.js: reservado para organizar jogadores depois.

PASTAS
- fotos-jogadores: guarde aqui fotos dos jogadores se quiser organizar manualmente.
- fotos-pessoais: guarde aqui fotos dos dias de jogos.
- backups: guarde aqui arquivos exportados pelo app.

IMPORTANTE
O app salva dados no navegador usando localStorage.
Se você limpar os dados do navegador, pode perder as informações.
Use o botão de exportar backup quando começar a preencher muita coisa.


NOVIDADE V2
- Nova aba: Pesquisa / Chaveamento.
- Busca por seleção, grupo, fase ou estádio.
- Visualização do chaveamento-base dos 16 avos de final.


NOVIDADE V3
- A aba "Pesquisa / Chaveamento" foi substituída por "Mata-mata".
- 16 avos, oitavas, quartas, semifinais e finais ficam liberados desde o início.
- Primeiro aparece o cruzamento-base por posições.
- Conforme os grupos e placares forem preenchidos, os nomes reais das seleções substituem os placeholders.


CORREÇÃO V4
- 16 avos, oitavas, quartas, semifinais e finais agora ficam liberados desde o início.
- Não aparece mais cadeado nessas fases.
- Os cards mostram o cruzamento-base mesmo sem resultados.
- Conforme grupos e placares forem preenchidos, os placeholders são trocados pelos nomes das seleções.


FOTOS DOS ESTÁDIOS
- A pasta fotos-estadios foi adicionada ao app.
- O app agora procura automaticamente a foto correta pelo nome do estádio.
- Exemplo: jogos no Estádio Azteca usam fotos-estadios/Estadio-Azteca.JPG.
- Se algum estádio não bater pelo nome, o app usa uma imagem ilustrativa gerada.


API-FOOTBALL
- A aba "API" foi adicionada.
- Cole sua API key dentro do app, na aba API.
- A chave fica salva apenas no navegador/localStorage deste computador.
- Ela não é gravada no backup exportado.
- Use league=1 e season=2026 para Copa 2026.
- Botões disponíveis:
  1. Testar conexão
  2. Ver cobertura
  3. Baixar seleções/logos
  4. Baixar jogos/placares
  5. Atualizar jogadores de uma seleção
  6. Sincronizar escalações, gols, MVP e estatísticas de um jogo


RELATÓRIO FINAL / PDF
- A aba "Relatório PDF" foi adicionada.
- Ela monta uma página limpa para imprimir ou salvar como PDF pelo navegador.
- O relatório ignora áreas vazias.
- Inclui:
  1. tabelas dos grupos com dados preenchidos;
  2. jogos preenchidos com placar, gols, MVP e escalações;
  3. jogadores do Brasil;
  4. jogadores das seleções que chegarem às semifinais e final;
  5. diário de espectador;
  6. fotos pessoais dos jogos;
  7. fotos dos jogadores e logos/bandeiras das seleções quando disponíveis.
- Para gerar PDF: abra a aba "Relatório PDF" e clique em "Imprimir / Salvar PDF".


VERSÃO LIVRO DA COPA
- Removidos os botões "Preencher placares para brincar" e "Limpar tudo".
- Removido o botão de limpar fases do mata-mata.
- Removido o botão de resetar jogadores da interface principal.
- O foco agora é registrar a Copa real:
  1. placares reais;
  2. gols;
  3. MVP;
  4. escalações;
  5. jogadores;
  6. fotos;
  7. diário de espectador;
  8. livro final em PDF.
- Recomendação: exporte backup periodicamente durante a Copa.


CHAVEAMENTO NO LIVRO PDF
- O Livro PDF agora inclui, ao final, um diagrama completo do mata-mata.
- O diagrama mostra:
  1. 16 avos
  2. oitavas
  3. quartas
  4. semifinais
  5. final
  6. disputa de 3º lugar
- As chaves usam bandeiras das seleções.
- O campeão da final aparece destacado com o símbolo da taça: 🏆


MELHORIAS VISUAIS NO CHAVEAMENTO
- O diagrama do mata-mata ficou mais bonito visualmente.
- Foram adicionadas linhas de conexão entre as chaves.
- O campeão agora aparece com fundo dourado.
- A seção final ganhou uma imagem ilustrada da taça no topo.


VERSÃO VISUAL
- Adicionada tela inicial/capa "Minha Primeira Copa do Mundo".
- A tela inicial mostra:
  1. próximo jogo para registrar;
  2. progresso do livro;
  3. atalhos principais;
  4. últimos registros.
- Cards dos jogos redesenhados:
  1. foto do estádio em destaque;
  2. bandeiras grandes;
  3. placar central maior;
  4. status do registro;
  5. MVP em destaque quando preenchido.


VERSÃO DIÁRIO E CARDS MAIS ATRAENTES
- Os cards dos jogos agora mostram resumo visível quando preenchidos:
  1. MVP;
  2. nota do diário;
  3. foto adicionada;
  4. emoção do jogo;
  5. gols;
  6. jogador favorito;
  7. melhor momento.
- A Área pessoal virou "Meu Diário da Copa".
- Foram adicionados:
  1. emoção do jogo;
  2. jogador favorito do jogo;
  3. melhor momento;
  4. área "Meus favoritos da Copa".
- O Livro PDF passa a incluir esses novos dados.


DIÁRIO COM 2 ESTILOS DE CARD
- Os cards do Diário dos jogos agora alternam entre dois layouts:
  1. bloco de anotações (linhas e margem);
  2. scrapbook/diário de memórias (mais leve e decorado).
- Isso deixa a página menos cansativa e com mais cara de diário pessoal.


ELENCOS COMPLETOS E BANDEIRAS
- O app não limita mais cada seleção a 11 jogadores.
- Cada seleção pode receber o elenco completo retornado pela API.
- A área Seleções separa jogadores por posição:
  1. Goleiros
  2. Defensores
  3. Meio-campistas
  4. Atacantes
  5. Outros
- A aba API ganhou:
  1. Baixar bandeiras
  2. Baixar todos os elencos
  3. Atualizar elenco completo de uma seleção
- A sincronização de escalação de um jogo não apaga mais o elenco completo; ela apenas mescla titulares e estatísticas.


VERSÃO COM IMPRESSÃO SIMPLES
- O app mantém as funções principais.
- O Livro PDF foi simplificado para servir como base limpa.
- Removido o excesso visual da impressão.
- Os jogos são separados por fase.
- As escalações saíram dos cards de jogos e ficam em seção própria.
- Escalações exibidas: Brasil e seleções que chegaram às quartas.
- A ideia é usar este PDF como base organizada para montar depois um livro scrapbook.


IMPRESSÃO: BRASIL E FINALISTAS
- A impressão simples agora limita a seção de escalações ao Brasil e às seleções finalistas.
- A seção de jogadores/imagens em destaque também fica limitada ao Brasil e aos finalistas.
- Isso deixa o PDF mais enxuto e evita páginas demais com elencos de seleções menos importantes para o livro.


CHAVEAMENTO HORIZONTAL
- O chaveamento final agora é exibido como pôster horizontal.
- A estrutura mostra 16 avos, oitavas, quartas e semifinais de cada lado.
- A final fica no centro, com campeão destacado.
- Na impressão, essa seção usa página em orientação paisagem.


GUIA DO SCRAPBOOK FINAL
- Adicionada a aba "Scrapbook Final".
- Essa área explica o que enviar depois da Copa para criar o livro scrapbook.
- Inclui estrutura recomendada de pastas:
  1. backup do app;
  2. PDF simples;
  3. fotos dos jogos;
  4. fotos pessoais;
  5. fotos dos jogadores;
  6. fotos dos estádios;
  7. observações do scrapbook.
- Inclui um campo editável com o estilo desejado do livro.
- O usuário pode baixar um TXT chamado observacoes-scrapbook-copa-2026.txt.


AJUSTES DE IMPRESSÃO
- Removida a página horizontal do chaveamento; o chaveamento agora está em formato simples e vertical/portrait.
- As imagens dos estádios foram mantidas nos cards dos jogos impressos.
- Jogos com diário recebem mais destaque.
- Jogos com diário + foto recebem destaque ainda maior, com foto mais ampla.
- Brasil e finalistas continuam sendo o foco para escalações e jogadores em destaque.


CORREÇÃO DE TRAVAMENTO AO PREENCHER
- Os campos de placar não atualizam mais o app a cada tecla digitada.
- Agora o placar é aplicado quando você termina de editar o campo.
- Isso evita renderizações repetidas e travamentos.
- Campos de texto do diário usam salvamento com pequeno atraso para ficar mais leve.
- Fotos continuam sendo salvas normalmente.


SALVAMENTO NO CELULAR
- Esta versão usa IndexedDB, que é mais adequado para celular e para guardar fotos/dados grandes.
- O app também mantém uma cópia leve no localStorage, sem imagens grandes, como fallback.
- Para usar no celular:
  1. Extraia o ZIP.
  2. Abra o arquivo index.html no Chrome.
  3. Use sempre o mesmo navegador para manter os dados.
  4. Use Exportar backup com frequência, principalmente depois de jogos importantes.
- Observação: se o celular abrir o HTML por um visualizador de arquivos que não permite armazenamento, os dados podem não persistir. O mais seguro é abrir pelo Chrome ou colocar o app em uma hospedagem gratuita como GitHub Pages/Netlify.


VERSÃO LOCAL PARA CELULAR / PWA
Objetivo:
- Salvar tudo somente no celular.
- Não usar Google Sheets.
- No final da Copa, exportar um backup JSON completo com placares, diário e fotos.

Como usar com mais segurança:
1. Abra esta pasta por um endereço http:// ou https://.
   Opções:
   - GitHub Pages / Netlify: hospeda só os arquivos do app; os dados ficam no celular.
   - Servidor local no PC/celular.
2. Abra no Chrome do celular.
3. Toque em "Adicionar à tela inicial" ou "Instalar app".
4. Use o atalho criado para preencher durante a Copa.
5. Clique em "Teste" para confirmar que o salvamento local funciona.
6. Depois de jogos importantes, clique em "Backup".
7. No final da Copa, envie o arquivo:
   backup-completo-copa-2026-diario-fotos.json

Atenção:
- Abrir index.html direto pelo gerenciador de arquivos do Android pode não salvar bem.
- Para PWA funcionar, o app precisa abrir por http://localhost ou https://.
- O app salva em IndexedDB, que fica no navegador do celular.
- Se limpar dados do Chrome, trocar de navegador ou desinstalar o app, os dados podem sumir.
- Por isso, exporte backup com frequência.

Fotos:
- Fotos entram no backup final.
- Fotos grandes deixam o arquivo pesado. Se possível, use fotos menores.
