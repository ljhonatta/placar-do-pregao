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

## v5 · Postagem na quarta e no sábado
- **Quarta (aba QUA):** vídeo parcial com segunda, terça e quarta de cada aluno: capa com os 3 dias, destaque da parcial, um card por aluno com os 3 prints em 3D e o total, e o total da turma por dia. Dá para desligar em "Na aba QUA, gerar o vídeo parcial" e voltar ao vídeo só da quarta.
- **Sábado (aba SÁB):** fechamento da semana com a turma inteira: capa com os 5 dias, colunas 3D por dia, pódio, ranking completo e total.
- Padrão visual único em 3D (palco escuro, chão em perspectiva, cartões girando com reflexo), transição padrão de empurrar em 3D e sons leves.
- Os lançamentos continuam sendo feitos dia a dia, como antes.

## v5.1 · Abertura do pregão, painel de cotações e stories
- **Abertura do pregão (opcional):** em cada dia, preencha a manchete e a variação do Ibovespa/dólar. O Reels abre com a fita de cotações, a manchete, o gráfico de velas e o Touro x Urso (urso quando o Ibovespa caiu; o touro é o logo da Trader School virando o jogo). Fica salvo numa chave própria (`market`), entra no backup e não mexe nos resultados.
- **Painel de cotações:** antes do final, cada aluno aparece como ativo (KEKO3 ▲ +R$ 5.784,00) com o total da turma. Pode desligar no painel.
- **Stories:** botão "Gerar stories" cria imagens 1080×1920 só com o nosso logo e dentro da área segura: a turma do dia + um story por aluno com o print. Na quarta entra também a parcial (seg a qua); no sábado, o fechamento da semana.

## v5.2 · Minha trilha (música padrão da marca)
- Em "Áudio", toque em **Enviar música** e escolha a trilha padrão (MP3/M4A/WAV). Ela fica salva **só neste aparelho** (e no backup), nunca no site público.
- O app detecta a batida batida a batida (o andamento pode variar), acha o tempo 1 de cada compasso e um trecho de loop num ponto forte da música.
- Com **Minha trilha + efeitos** ou **Só minha trilha**, cada cena do vídeo começa e termina numa batida real da música, e o .wav já sai com a trilha alinhada (no CapCut, coloque no segundo zero).

## v5.3 · Leitura automática do print e imagens premium
- **Valor automático:** ao anexar o print, o app lê o "Res. do Dia" (ou o "Res. Aberto", se o dia estiver zerado), preenche o valor e marca o zoom em cima dele. Tocando em outro número do print, ele lê esse número. A leitura roda no próprio aparelho (Tesseract.js em `vendor/ocr`, licença Apache-2.0); a imagem não sai do celular.
- **Imagens premium (OpenAI):** com a chave da API colada no app (fica só no aparelho), gera o touro, o urso e o fundo de pregão em preto e laranja. Elas entram na abertura do pregão, no painel de cotações, nas capas 3D e no fundo dos stories.


## v5.3.2
- Remover aluno agora pede confirmação.
- Lista "Alunos removidos": resultados de quem saiu da turma ficam guardados e dá para restaurar com um toque.
- Restauração automática do Marcos Biroh Biroh (removido sem querer), com os resultados salvos.

## v5.4.0
- Leitura do print reforçada para o celular: com a chave da OpenAI salva no app, a IA lê primeiro (cerca de 1 s); sem chave ou se a IA falhar, o leitor do aparelho assume.
- Tempo limite em cada etapa: o leitor não fica mais travado em silêncio.
- A mensagem da leitura aparece na própria linha do aluno, embaixo do print, com progresso e o motivo de qualquer falha.

## v5.5.0
- O vídeo sai num MP4 só, com a trilha e os efeitos sincronizados. Quando o navegador não grava o som direto (iPhone), o app junta vídeo e áudio no próprio aparelho com o ffmpeg.wasm (baixado uma vez, ~10 MB).
- Trilha padrão da Trader School embutida (assets/trilha-padrao.mp3), ativa por padrão em todos os aparelhos.
- Informativo do Radar Trader: puxa as notícias e cotações do radar-trader, escolhe até 3 manchetes e abre o Reels com "E mesmo assim… nossos alunos não param de faturar."

## v5.6.0
- Nova trilha padrão (60 s, ~91 BPM), substituindo a anterior; o modo padrão passa a ser "Só minha trilha" (sem os efeitos sintéticos).
- Os cortes caem na batida e a última cena termina no tempo 1 de um compasso; a trilha some sob o encerramento.
- Encerramento da marca (logo Trader School, 2,5 s, com o som original) no fim de todos os vídeos, com transição suave. Pode ser desligado.

## v5.7.0
- Efeitos sonoros reais da marca (assets/sfx): impactos (4, alternando) no corte de cada transição, caixa registradora quando o resultado aparece e notificação nos destaques. Cada som entra com o pico no momento da imagem.
- Padrão volta a ser "Minha trilha + efeitos", agora com esses sons no lugar dos sintéticos.
