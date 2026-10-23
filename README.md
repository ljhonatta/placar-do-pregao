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

## Formato de cada dia (v4.1)
| Dia | Card do aluno | Final (total da turma) | Transição | Kit de som | Trilha |
|---|---|---|---|---|---|
| Segunda | Editorial recorte | Prints na mesa que viram grade + caixa de seleção | Foco/desfoque | softWhoosh, softPop, chime | 100 BPM · piano |
| Terça | Cinema dark | Avatares orbitando o valor com colchetes | Barras | airSwell, softThump, chime grave | 120 BPM · 808 |
| Quarta | Celular fly-through | Tela de resumo no celular + notificação | Giro (flip) | silkSwipe, softTick, chime | 110 BPM · arpejo |
| Quinta | Caderno do trader | Soma escrita no bloco e total circulado | Quadrado | paperSlide, softTick, chime | 100 BPM · boom bap |
| Sexta | Plantão do Pregão | Nova página de jornal com carimbo do total | Virada de página | pageTurn, softWhoosh, chime | 120 BPM · phonk |
| Sábado | Semana (pódio, ranking) | Pódio em pedestal, demais em fila, logo em pêndulo | Zoom | softWhoosh, softThump, chime, softRiser | 96 BPM · cordas |

Áudio: escolha no painel entre **Música + efeitos**, **Só efeitos** ou **Sem som** (vale para a prévia e para o .wav). Cada cena dura um número inteiro de compassos, então os cortes caem no tempo 1, e a música abaixa sozinha sob os efeitos principais.
