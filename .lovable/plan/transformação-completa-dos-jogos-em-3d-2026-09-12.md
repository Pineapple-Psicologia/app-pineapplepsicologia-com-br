# Transformação completa dos jogos em 3D

## Objetivo
Converter os 13 jogos disponíveis em experiências 3D completas, mantendo as regras terapêuticas, a participação simultânea entre psicóloga e paciente, a geração de PDF e a adaptação para celular, tablet e computador.

## Direção visual
- Criar dioramas 3D coloridos, acolhedores e lúdicos, coerentes com a identidade atual do app.
- Usar objetos, profundidade, iluminação, animações e câmera próprias para cada atividade, sem aplicar o mesmo cenário genérico a todos.
- Manter textos, campos de escrita e instruções sobre a cena 3D quando isso melhorar leitura e acessibilidade.
- Evitar efeitos pesados; priorizar toque preciso e movimento suave em aparelhos móveis.

## Etapas
1. **Base compartilhada**
   - Criar a estrutura comum de cena, iluminação, câmera, carregamento e alternativa visual para aparelhos sem suporte 3D.
   - Preservar os controles e o estado conjunto existentes; o 3D será a camada visual e interativa, sem alterar os protocolos das salas.

2. **Primeiro grupo — criação e reconhecimento emocional**
   - Quadro Livre: transformar a área de desenho em um painel 3D dentro de um ateliê, mantendo pincéis, textos, adesivos e modelos.
   - Termômetro: substituir colunas planas por termômetros 3D individuais, com líquido animado e interação por toque.
   - Detetive de Pensamentos: apresentar as etapas como uma mesa investigativa 3D, com cartões e evidências manipuláveis.

3. **Segundo grupo — investigação e narrativa**
   - Mapa de Investigação: ativar e aprimorar o tabuleiro 3D já existente.
   - Aventura Investigativa: transformar cada ambiente em cena 3D com profundidade e pistas clicáveis.
   - Entre Lentes: criar uma cena 3D cuja aparência muda conforme a lente escolhida.

4. **Terceiro grupo — habilidades terapêuticas**
   - Ciclo Cognitivo: representar o ciclo com quatro estações 3D conectadas.
   - Ancoragem 5-4-3-2-1: criar um ambiente 3D calmo que muda a cada sentido.
   - Folhas no Rio: construir rio, pedras e folhas navegáveis em 3D.
   - Bússola de Valores: criar uma bússola 3D interativa com os valores posicionados ao redor.

5. **Quarto grupo — construção e expressão**
   - Minha Casa: transformar a casa em diorama 3D e manter personagens, objetos, bilhetes e emoções manipuláveis.
   - Missão Autocontrole: criar uma jornada 3D pelas etapas P.A.R.A. e pelos desafios.
   - História em Espiral: criar mesa de cartas 3D, viradas animadas e uma espiral 3D ampla como modelo visual.

6. **Validação final**
   - Conferir cada interação com mouse e toque, inclusive retrato e paisagem.
   - Testar sincronização entre duas pessoas, abertura de instruções e download de PDF.
   - Verificar desempenho, legibilidade, ausência de telas vazias e funcionamento em aparelhos com menor capacidade.

## Detalhes técnicos
- React Three Fiber e Drei, já instalados no projeto.
- Uma cena por jogo, carregada somente quando necessária, com limite de resolução e poucos efeitos.
- Formulários e textos continuarão em elementos acessíveis sobre a cena 3D; objetos visuais e interações espaciais irão para o ambiente 3D.
- Modelos reconhecíveis serão usados quando necessários; elementos abstratos poderão ser construídos de forma procedural.
- A entrega seguirá a ordem atual da lista, com validação visual e funcional ao concluir cada grupo.
