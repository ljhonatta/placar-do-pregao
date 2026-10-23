# Placar do Pregão · Trader School

App instalável (PWA) que gera os vídeos de resultado dos alunos da mentoria Trader School: um formato por dia da semana (segunda a sexta) e o resultado semanal no sábado.

## Como usar
1. Abra o app. A aba do dia de hoje já vem selecionada com a data certa.
2. Marque quem operou, digite o valor com centavos (`1.274,50`), envie o print e toque no valor do "Res. do Dia" para marcar o zoom.
3. Toque em **Gerar vídeo** e depois em **Baixar vídeo** (no celular, **Salvar no celular / compartilhar**).
4. No sábado, a aba **SÁB** soma a semana inteira e gera o vídeo semanal.

## Instalar
- **Computador (Chrome/Edge):** botão **Instalar app** no topo, ou o ícone de instalar na barra de endereço.
- **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Instalar app**.

## Dados
Tudo fica salvo no próprio aparelho (IndexedDB). Para passar do computador para o celular, use **Backup e troca de aparelho**.

## Atualizações
O app busca a versão mais nova sempre que abre com internet. Ao publicar uma mudança grande, altere `VERSION` em `sw.js` para o app mostrar o aviso "Nova versão disponível".

## Estrutura
- `index.html`, `css/app.css`: interface
- `js/engine.js`: motor do vídeo (capas, cenários 3D, transições)
- `js/app.js`: painel, datas automáticas, salvamento, exportação, instalação
- `js/store.js`: armazenamento no aparelho
- `sw.js`, `manifest.webmanifest`: app instalável e offline
- `vendor/mp4-muxer.js`: geração do MP4 (MIT)

## Formato de cada dia (v4)
| Dia | Card do aluno | Trilha (no áudio .wav) |
|---|---|---|
| Segunda | Editorial recorte: foto P&B, print como folha com orelha, caixa de seleção no valor | 100 BPM · piano + pad, 808 leve |
| Terça | Cinema dark: luz laranja, nome em serifada com colchetes, ícones orbitando | 120 BPM · 808 pesado + braam |
| Quarta | Celular fly-through: câmera sai da tela, texto com aberração cromática, notificação do resultado | 110 BPM · pad tecnológico + arpejo |
| Quinta | Caderno do trader: bloco com alfinete, print com fita, valor circulado à mão | 100 BPM · boom bap com vinil e piano |
| Sexta | Plantão do Pregão: jornal caindo em 3D, carimbo do valor, cotação no rodapé | 120 BPM · phonk com cowbell |
| Sábado | Semana: pódio em pedestal, ranking, total | 96 BPM · épico com cordas e tímpano |

Cada cena dura um número inteiro de compassos da trilha do dia, então os cortes caem no tempo 1. A música abaixa sozinha sob os efeitos principais (moeda, impacto, carimbo).
