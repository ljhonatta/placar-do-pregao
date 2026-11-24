/* Placar do Pregão — Informativo do Radar Trader.
   Puxa as notícias e as cotações que o Radar Trader coleta 3x por dia (mesmo site do GitHub, sem chave nenhuma)
   e abre o Reels com as manchetes do dia → "E mesmo assim… nossos alunos não param de faturar." → resultados.
   Tudo fica guardado junto com a abertura do dia (MARKET[data].news), então entra no backup normal. */
'use strict';
const RADAR_BASE=()=>new URL('../radar-trader/data/',location.href).href;
const IMP={alto:0,medio:1,médio:1,baixo:2};
const LOWCAT=/comportamento|educa|carreira|motiva|lifestyle|imóve|imove|senior|saúde|saude/i;
async function fetchRadar(){ const get=async f=>{ const r=await fetch(RADAR_BASE()+f+'?t='+Date.now(),{cache:'no-store'}); if(!r.ok) throw new Error('Radar respondeu '+r.status); return r.json(); };
  const [list,meta]=await Promise.all([get('noticias.json'),get('meta.json').catch(()=>null)]); return {list:Array.isArray(list)?list:[],meta}; }
/* notícias para o dia escolhido; no sábado (ou se o dia não tiver nada) usa a semana */
function radarPick(list,key,span){ const week=span>0, d0=new Date(key+'T12:00:00'), from=new Date(d0); from.setDate(d0.getDate()-span); const fk=iso(from);
  let pool=list.filter(n=>n&&n.titulo&&n.data&&n.data>=fk&&n.data<=key);
  if(!pool.length){ const ks=[...new Set(list.map(n=>n.data).filter(Boolean))].sort().reverse(); const last=ks.find(k=>k<=key)||ks[0]; pool=list.filter(n=>n.data===last); }
  const score=n=>(IMP[(n.impacto||'').toLowerCase()]??1)*10+(LOWCAT.test(n.categoria||'')?25:0)+(week?0:Math.min(9,(+n.ordem||0)/10));
  return pool.slice().sort((a,b)=>score(a)-score(b)||String(b.data).localeCompare(String(a.data))).slice(0,10)
    .map(n=>({id:n.id||n.titulo,t:String(n.titulo).trim(),cat:String(n.categoria||'Mercado').trim(),imp:(n.impacto||'').toLowerCase(),data:n.data})); }
/* faixa de cotações do Radar (só usa se a coleta for do mesmo dia) */
function radarTape(meta,key){ const p=meta&&meta.placar; if(!p||!Array.isArray(p.itens)) return null; if(p.data&&p.data!==key) return null;
  const want=['IBOV','USD','BRENT','BTC','SPX','OURO','SELIC']; return p.itens.filter(i=>want.includes(i.k)).sort((a,b)=>want.indexOf(a.k)-want.indexOf(b.k))
    .map(i=>{ const v=String(i.var||''), up=/^\+/.test(v)?true:/^[-−]/.test(v)?false:null; return [(i.k==='USD'?'DÓLAR':i.k==='BRENT'?'PETRÓLEO':i.k)+' '+i.v+(v?' '+(up?'▲ ':up===false?'▼ ':'')+v.replace(/^[+-−]/,''):''),up]; }); }
function radarPct(meta,key,k){ const p=meta&&meta.placar; if(!p||p.data!==key) return ''; const it=(p.itens||[]).find(i=>i.k===k); return it&&it.var?String(it.var).replace('+',''):''; }

/* ---------- estado do dia ---------- */
function newsOf(){ const d=days[curDay]&&days[curDay].date, m=(d&&MARKET[d])||{}; return {list:Array.isArray(m.news)?m.news.filter(n=>n&&n.t):[],tape:m.tape||null}; }
const newsOn=()=>(!$('newsOn')||$('newsOn').checked)&&newsOf().list.length>0;

/* ---------- cena ---------- */
function sceneNews(c,t){ const N=newsOf(), list=N.list.slice(0,3), turn=4.4, k2=eo(seg(t,turn,turn+.7));
  terminalBg(c,t,[[AIIMG.bear||AIIMG.bg,.38*(1-k2)],[AIIMG.bull||AIIMG.bg,.5*k2]]);
  const items=(N.tape&&N.tape.length?N.tape:[]).concat([['RADAR DO MERCADO',null],['TRADER SCHOOL ▲',true]]);
  c.save(); c.globalAlpha*=eo(seg(t,0,.4)); tape(c,t,410,items); c.restore();
  const sub=MODE==='week'?'a semana no mercado':MODE==='parcial'?'o mercado nesta semana':THEMES[curDay].label.toLowerCase()+' · '+(days[curDay]?days[curDay].date:'');
  /* fase 1: as manchetes */
  const fade=1-k2*.85; c.save(); c.globalAlpha*=fade; c.translate(0,-k2*60);
  soft(c,'RADAR DO MERCADO',540,494,fBold(28),O,t,.2,'type',{dur:.5,sp:8}); soft(c,sub,540,540,fMed(24),'#9C9893',t,.4,'ghost');
  let mx=3, LL=list.map(n=>wrapLines(c,n.t,fSerif(50),810,3)); if(LL.reduce((a,L)=>a+104+L.length*62+30,0)>880){ mx=2; LL=list.map(n=>wrapLines(c,n.t,fSerif(50),810,2)); }
  let y=600; list.forEach((n,k)=>{ const L=LL[k], h=104+L.length*62, f=seg(t,.55+k*.6,1.05+k*.6); if(f<=0){ y+=h+30; return; }
    const e=eo(f); c.save(); c.globalAlpha*=e; c.translate((1-e)*90,0); const sx=.92+.08*e; c.translate(90,y); c.scale(sx,1); c.translate(-90,-y);
    rr(c,90,y,900,h,18); c.fillStyle='rgba(20,20,24,.94)'; c.fill(); c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=1.5; c.stroke(); c.fillStyle=O; c.fillRect(90,y,8,h);
    txt(c,(String(n.cat||'Mercado').toUpperCase()).slice(0,28),130,y+40,fBold(21),O,'left',4); if(n.imp==='alto') txt(c,'● IMPACTO ALTO',960,y+40,fBold(19),'#C9C6C1','right',3);
    L.forEach((ln,j)=>txt(c,ln,130,y+102+j*62,fSerif(50),WH,'left')); c.restore(); y+=h+30; });
  c.restore();
  /* fase 2: a virada */
  if(t>turn){ c.save(); c.globalAlpha*=k2*.78; c.fillStyle='#070708'; c.fillRect(0,440,W,H-440); c.restore();
    const g=c.createRadialGradient(540,1080,10,540,1080,520); g.addColorStop(0,'rgba(255,106,19,'+(.34*k2)+')'); g.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=g; c.fillRect(0,640,W,900);
    soft(c,'E mesmo assim…',540,880,fSerif(64),'#C9C6C1',t,turn+.25,'ghost');
    soft(c,'NOSSOS ALUNOS',540,1010,fBlack(fitF(c,'NOSSOS ALUNOS',900,fBlack,104)),WH,t,turn+.85,'rise',{big:true});
    const p2='NÃO PARAM DE FATURAR.'; soft(c,p2,540,1130,fBlack(fitF(c,p2,920,fBlack,84)),O,t,turn+1.15,'rise',{big:true});
    soft(c,'Confere os resultados ▼',540,1250,fMed(28),'#9C9893',t,turn+1.8,'ghost'); } }
function newsScene(){ const n=Math.min(3,newsOf().list.length), cues=[[.05,'swish'],[.2,'type']];
  for(let k=0;k<n;k++) cues.push([.55+k*.6,'whoosh']); cues.push([4.4,'swish'],[5.25,'impact'],[5.55,'pop'],[5.6,'cash']);
  return mkScene('cover',7.4,sceneNews,cues); }
