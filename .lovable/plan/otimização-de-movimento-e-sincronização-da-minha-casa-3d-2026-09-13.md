# Otimização de movimento e sincronização da Minha Casa 3D

## Objetivo
Deixar a entrada e a circulação suaves em celulares e tablets mais fracos, mantendo psicóloga e criança sincronizadas sem saltos visuais.

## Implementação
- Instrumentar temporariamente a cena para medir FPS, tempo por quadro, objetos visíveis, triângulos e draw calls em movimento e parada.
- Substituir as verificações repetidas de paredes por colisores retangulares pré-calculados, com resolução por eixo, margem do jogador e passos limitados para evitar atravessar paredes em travamentos.
- Atualizar câmera e marcador somente quando posição, direção ou destino realmente mudarem; pausar quadros contínuos quando a cena estiver parada.
- Enviar atualizações de câmera em frequência adaptativa e somente quando a mudança superar um limite.
- Quantizar posição, direção e destino antes do envio, transmitir apenas os campos alterados e manter um pacote final ao parar.
- Reconstruir o estado remoto no receptor e interpolar posição e direção por tempo, evitando teletransporte e oscilações entre os aparelhos.
- Reduzir trabalho visual automaticamente quando FPS, draw calls ou triângulos ultrapassarem o orçamento de aparelhos fracos.

## Diagnóstico e validação
- Registrar uma amostra curta e controlada das métricas, sem manter um painel técnico visível para crianças.
- Comparar repouso, entrada, caminhada e giro em computador e viewport de celular.
- Confirmar colisões nas paredes e portas, clique/arraste, highlight remoto e troca de jardim.
- Verificar ausência de erros, perda de imagem e excesso de mensagens durante movimento simultâneo.

## Detalhes técnicos
- Meta: 30 FPS mínimo em aparelhos fracos e 45–60 FPS nos demais.
- Orçamento: menos de 100 draw calls e 100 mil triângulos quando possível.
- Sincronização: pacotes pequenos em baixa frequência, quantização e interpolação independente da taxa de quadros.
- Sem motor físico adicional: colisão cinemática 2D é suficiente e mais leve para esta casa.
