/* Placar do Pregão — legenda pronta do post, montada a partir dos resultados.
   Usa S (alunos do dia, destaque primeiro) e WK (semana) já preparados pelo motor. Só lê, nunca grava dados. */
'use strict';
const CAPTION_TAGS='#mercadofinanceiro #trader #rondonopolis #cuiaba #matogrosso';
const DAY_TXT={
  seg:{nome:'Segunda-feira', hooks:['Segunda-feira começou do jeito certo na Trader School 📈','A semana abriu no verde, turma 📈','Segunda-feira de resultado: quem tem método começa a semana na frente 📈'],
       msg:['Começar a semana com disciplina muda o resto dela. Não é sorte, é processo.','Enquanto muita gente reclama da segunda, a turma está construindo resultado com método.']},
  ter:{nome:'Terça-feira', hooks:['Terça-feira de resultado na Trader School 🔥','Terça no verde, turma 🔥','Segundo dia da semana e a constância continua 🔥'],
       msg:['Grandes resultados nascem de decisões repetidas todos os dias.','Consistência é fazer o simples bem feito, todo dia, sem pular etapa.']},
  qua:{nome:'Quarta-feira', hooks:['Meio da semana e a turma segue firme 💪','Quarta-feira de lucro na Trader School 💪','Quarta-feira: metade da semana, foco total 💪'],
       msg:['Quem planta com constância colhe com abundância.','Meio da semana é onde a disciplina separa quem começa de quem termina.']},
  qui:{nome:'Quinta-feira', hooks:['Quinta-feira de resultado na Trader School 📊','Quinta no verde, turma 📊','Mais uma quinta-feira de processo bem feito 📊'],
       msg:['O mercado premia quem respeita o processo.','Plano, gestão de risco e disciplina: é isso que sustenta o resultado.']},
  sex:{nome:'Sexta-feira', hooks:['Sexta-feira fechando a semana no verde 🏁','Sextou com resultado na Trader School 🏁','Fechamos a semana do jeito que começamos: com método 🏁'],
       msg:['Fechar bem a semana é consequência, não sorte.','Uma semana inteira de disciplina se vê no fechamento.']}
};
const CTA=['O mercado financeiro é uma porta aberta para quem quer aprender com método e acompanhamento de verdade.','Essa porta está aberta: o mercado financeiro não é para poucos, é para quem decide aprender do jeito certo.','Se você sempre quis entender o mercado financeiro, essa é a sua porta de entrada.'];
const BIO=['👉 Quer conhecer a mentoria do @trader_wendellguimaraes? O link do nosso site está na bio.','👉 Toca no link da bio e conheça a Trader School pelo nosso site.','👉 O caminho começa no link da bio: lá você conhece a mentoria e como entrar.'];
const DISC='Resultados individuais. Não representam promessa ou garantia de ganhos.';
const pickV=(arr,seed)=>arr[((seed%arr.length)+arr.length)%arr.length];
const handleOf=s=>s.handle&&s.handle.length>1?s.handle:'';
const who=s=>handleOf(s)?s.name+' ('+handleOf(s)+')':s.name;
function dayTotal(d){ if(!days[d]) return 0; let t=0; roster.forEach(r=>{ const e=days[d].entries[r.id]; if(e&&e.on&&e.value>0) t+=e.value; }); return t; }
function captionSeed(variant){ const dt=parseDate(days[curDay]&&days[curDay].date); return (dt?Math.floor(dt.getTime()/864e5):0)+variant; }

function buildCaption(variant=0){
  const seed=captionSeed(variant);
  if(curDay==='sab'){ if(!WK||!WK.rank.length) return '';
    const best=WK.dayTotals.indexOf(Math.max(...WK.dayTotals)), top=WK.rank.slice(0,3), daysOn=WK.dayTotals.filter(v=>v>0).length;
    const all=WK.rank.filter(s=>s.days.filter(Boolean).length===daysOn&&daysOn>1);
    const L=[];
    L.push(pickV(['Resumo da semana na Trader School 🏆','A semana fechou e o placar é da turma 🏆','Semana encerrada, resultado registrado 🏆'],seed));
    L.push('');
    L.push(`De ${WK.range}, ${WK.rank.length} alunos fecharam no positivo, em ${WK.ops} operações no lucro, somando ${brl(WK.total)}.`);
    L.push(`O dia mais forte foi ${DAY_TXT[WEEK[best]].nome.toLowerCase()}, com ${brl(WK.dayTotals[best])}.`);
    L.push('');
    L.push('🥇 '+who(top[0])+' · +'+brl(top[0].total)); if(top[1]) L.push('🥈 '+who(top[1])+' · +'+brl(top[1].total)); if(top[2]) L.push('🥉 '+who(top[2])+' · +'+brl(top[2].total));
    if(all.length) { L.push(''); L.push('Constância: '+all.map(s=>handleOf(s)||s.name).join(', ')+(all.length>1?' estiveram no verde em todos os dias operados.':' esteve no verde em todos os dias operados.')); }
    L.push(''); L.push('Uma turma, um propósito, um resultado. Isso é disciplina com estratégia.');
    L.push(''); L.push(pickV(CTA,seed)); L.push(pickV(BIO,seed+1));
    L.push(''); L.push(DISC); L.push(''); L.push(CAPTION_TAGS);
    return L.join('\n'); }
  if(!S.length) return '';
  const T=DAY_TXT[curDay]||DAY_TXT.seg, total=S.reduce((a,s)=>a+s.value,0), top=S[0], rest=S.slice(1);
  const k=WEEK.indexOf(curDay), prev=k>0?dayTotal(WEEK[k-1]):0, L=[];
  L.push(pickV(T.hooks,seed)); L.push('');
  L.push(S.length>1?`Hoje, ${T.nome.toLowerCase()}, ${S.length} alunos fecharam o dia no positivo, somando ${brl(total)}.`:`Hoje, ${T.nome.toLowerCase()}, mais um aluno fechou o dia no positivo.`);
  L.push(`🏆 Destaque do dia: ${who(top)} com +${brl(top.value)}. Parabéns!`);
  if(rest.length){ const tags=rest.map(s=>handleOf(s)||s.name); L.push('Também no verde: '+tags.join(', ')+'.'); }
  if(prev>0&&total>prev) L.push(`O resultado da turma veio ${Math.round((total/prev-1)*100)}% acima de ontem.`);
  else if(k>0&&days[WEEK[k-1]]){ const streak=S.filter(s=>{ const e=days[WEEK[k-1]].entries[s.id]; return e&&e.on&&e.value>0; }); if(streak.length>1) L.push(`${streak.length} alunos repetiram o verde de ontem: constância é o nome do jogo.`); }
  L.push(''); L.push(pickV(T.msg,seed));
  L.push(''); L.push(pickV(CTA,seed)); L.push(pickV(BIO,seed+1));
  L.push(''); L.push(DISC); L.push(''); L.push(CAPTION_TAGS);
  return L.join('\n'); }
