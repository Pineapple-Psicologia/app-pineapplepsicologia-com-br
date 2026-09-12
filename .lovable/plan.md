# Otimizar a Casa 3D em celulares e tablets

## Objetivo
Manter a casa sofisticada e todas as interações compartilhadas, reduzindo travamentos durante movimentos simultâneos.

## Alterações
- Reduzir o custo gráfico automaticamente em telas móveis: resolução controlada, sombras simplificadas e menos detalhes geométricos invisíveis.
- Renderizar somente quando houver mudança ou interação, preservando a animação inicial e a resposta imediata ao toque.
- Reutilizar texturas, geometrias e materiais para evitar carregamentos e criações repetidas.
- Tornar o arraste local fluido sem redesenhar toda a interface a cada movimento.
- Diminuir e agrupar as atualizações enviadas entre psicóloga e paciente, mantendo a posição final exata.
- Remover atualizações visuais contínuas que não contribuem para a atividade.

## Validação
- Conferir abertura, câmera, zoom, rotação e arraste no computador, celular vertical e celular horizontal.
- Simular movimentos simultâneos e confirmar sincronização dos dois lados.
- Verificar tela visível, ausência de erros e compilação concluída.

## Detalhes técnicos
- React Three Fiber com renderização sob demanda e invalidação explícita.
- Qualidade adaptativa baseada em ponteiro/tela, com DPR máximo 1 em dispositivos móveis.
- Refs para movimento imediato no canvas e sincronização em frequência limitada.
- Sombras restritas à luz principal e objetos de maior impacto visual.
