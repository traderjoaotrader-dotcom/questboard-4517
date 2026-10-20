# A Guilda dos Quatro Caminhos — Design

Web responsivo de produtividade gamificada. Referências: fichas e registros medievais anexados. Visual de posto de serviços: pergaminho creme, bordas entintadas, tarjas de cor, selo circular, mercador. Sem imagens geradas nem animações pesadas.

## Tokens
- Papel #f3e7cb; papel claro #fbf4df; tinta #28251d; secundária #746b58; linha #bda77d.
- Verde escuro #142c27; cobre #a56739; vinho #743c34; ouro #b58b44.
- Categorias: programação #375777, francês #2f6250, livro #694766, memória #96672e.
- Display Georgia, corpo Trebuchet MS. Rótulos pequenos em caixa alta e títulos serifados. Escala de espaço 8px.
- Desktop: sidebar 246px e conteúdo fluido. Mobile: topo compacto e navegação inferior. Cartões como fichas com borda 1px, raio 6px e sombra leve. Textura CSS discreta.

## Telas
- Posto de Serviços: resumo, filtros, 95 fichas mensais com aceite/conclusão; Contratos Elite separados.
- Loja de Recompensas: catálogo, confirmação de resgate, criação/edição/exclusão de recompensas personalizadas, histórico.
- Perfil: nome editável, nível, XP, barra de progresso, moedas, quests concluídas, histórico mensal.

## Fluxos
- Abrir → lote do mês criado sem duplicação → aceitar quest → concluir → XP e cobres creditados uma vez.
- Escolher recompensa → confirmar → debitar somente se saldo suficiente → registrar compra.
- Confirmar manualmente contrato Elite → crédito uma vez no período aplicável.

## UX
- Loading e erro em operações, botões desabilitados enquanto salvam. Alto contraste, foco visível, responsividade. Sem autenticação; um perfil pessoal.
