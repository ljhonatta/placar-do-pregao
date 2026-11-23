/* Placar do Pregão — recursos premium:
   1) Abertura do pregão: manchete do dia + Ibovespa/dólar + Touro x Urso (o touro é o nosso logo)
   2) Painel de cotações: cada aluno vira um ativo (KEKO3 ▲ +R$ 5.784,00)
   3) Stories: imagens 1080×1920 prontas para salvar, só com o nosso logo, dentro da área segura
   Só lê os resultados; a manchete fica numa chave própria ('market'), sem mexer nos dados dos alunos. */
'use strict';
let MARKET={};
const pctParse=s=>{ const t=String(s==null?'':s).replace(/\s/g,'').replace('−','-').replace('%','').replace(',','.'); if(t===''||t==='-'||t==='+') return null; const v=parseFloat(t); return isFinite(v)?v:null; };
const pctFmt=v=>(v>0?'+':v<0?'−':'')+Math.abs(v).toFixed(2).replace('.',',')+'%';
function mkt(){ const d=days[curDay]&&days[curDay].date, m=(d&&MARKET[d])||{}; return {head:(m.head||'').trim(),ibov:pctParse(m.ibov),usd:pctParse(m.usd)}; }
const hasMkt=()=>{ const m=mkt(); return !!(m.head||m.ibov!=null||m.usd!=null); };
const boardOn=()=>!$('board')||$('board').checked;

/* ---------- fundo de terminal ---------- */
function terminalBg(c,t){ c.fillStyle='#070708'; c.fillRect(0,0,W,H); const g=c.createRadialGradient(540,1250,40,540,1250,900); g.addColorStop(0,'rgba(255,106,19,.16)'); g.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.save(); c.strokeStyle='rgba(255,255,255,.045)'; c.lineWidth=1; for(let x=0;x<=W;x+=60){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); } for(let y=0;y<=H;y+=60){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } c.restore(); logo(c,540,288,250,false,1); }
function tape(c,t,y,items){ c.save(); c.fillStyle='#111114'; c.fillRect(0,y-30,W,60); c.fillStyle=O; c.fillRect(0,y-30,W,2); c.fillRect(0,y+28,W,2);
  c.font=fBold(24); const parts=items.map(([s,up])=>({s,up,w:c.measureText(s).width+70})), tot=parts.reduce((a,p)=>a+p.w,0)||1; let x=-((t*120)%tot);
  for(let rep=0;rep<4&&x<W;rep++) for(const p of parts){ txt(c,p.s,x,y+1,fBold(24),p.up==null?'#C9C6C1':p.up?O:'#E7E5E1','left',2); x+=p.w; } c.restore(); }
function bearIcon(c,cx,cy,s,a){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(s,s); c.strokeStyle='#E7E5E1'; c.lineWidth=7; c.lineJoin='round'; c.lineCap='round';
  c.beginPath(); c.arc(-70,-78,34,0,7); c.stroke(); c.beginPath(); c.arc(70,-78,34,0,7); c.stroke();
  c.fillStyle='#070708'; c.beginPath(); c.ellipse(0,0,112,100,0,0,7); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0,38,48,36,0,0,7); c.stroke(); c.fillStyle='#E7E5E1'; c.beginPath(); c.ellipse(0,22,16,11,0,0,7); c.fill();
  c.beginPath(); c.arc(-38,-18,8,0,7); c.fill(); c.beginPath(); c.arc(38,-18,8,0,7); c.fill();
  c.beginPath(); c.moveTo(-16,58); c.quadraticCurveTo(0,48,16,58); c.stroke(); c.restore(); }
function candles(c,x0,y0,w,h,n,trend,p,seed){ const vals=[]; let v=trend<0?.82:trend>.8?.18:.4; for(let i=0;i<n;i++){ v+=trend*.026+(RND(seed+i)-.5)*.16; v=clamp(v,.06,.94); vals.push(v); }
  const cw=w/n, shown=Math.floor(n*p); for(let i=0;i<shown;i++){ const o=i?vals[i-1]:vals[0]-trend*.03, cl=vals[i], hi=Math.max(o,cl)+.04*RND(seed+i*3), lo=Math.min(o,cl)-.04*RND(seed+i*7), up=cl>=o, X=x0+i*cw+cw/2, Y=v2=>y0+h-v2*h;
    c.strokeStyle=up?O:'#BDBAB5'; c.lineWidth=2; c.beginPath(); c.moveTo(X,Y(hi)); c.lineTo(X,Y(lo)); c.stroke();
    const top=Y(Math.max(o,cl)), bh=Math.max(3,Math.abs(Y(o)-Y(cl))); if(up){ c.fillStyle=O; c.fillRect(X-cw*.32,top,cw*.64,bh); } else { c.fillStyle='#070708'; c.fillRect(X-cw*.32,top,cw*.64,bh); c.strokeRect(X-cw*.32,top,cw*.64,bh); } }
  return shown?{x:x0+(shown-.5)*cw,y:y0+h-vals[shown-1]*h}:null; }
function wrapLines(c,s,font,maxW,maxL){ const words=s.split(/\s+/).filter(Boolean), L=[]; let cur=''; c.font=font;
  for(const w of words){ const tst=cur?cur+' '+w:w; if(c.measureText(tst).width<=maxW) cur=tst; else { if(cur) L.push(cur); cur=w; } } if(cur) L.push(cur);
  if(L.length>maxL){ L.length=maxL; L[maxL-1]=ellip(c,L[maxL-1]+'…',maxW,font); } return L; }

/* ---------- 1) Abertura do pregão (Touro x Urso) ---------- */
function sceneOpen(c,t){ const m=mkt(), down=m.ibov!=null?m.ibov<0:false, neutral=m.ibov==null; terminalBg(c,t);
  const items=[]; if(m.ibov!=null) items.push(['IBOV '+(m.ibov>=0?'▲ ':'▼ ')+pctFmt(m.ibov),m.ibov>=0]); if(m.usd!=null) items.push(['DÓLAR '+(m.usd>=0?'▲ ':'▼ ')+pctFmt(m.usd),m.usd>=0]); items.push(['TRADER SCHOOL ▲',true]); items.push(['PREGÃO ABERTO',null]);
  const ka=eo(seg(t,0,.4)); c.save(); c.globalAlpha*=ka; tape(c,t,410,items); c.restore();
  soft(c,'ABERTURA DO PREGÃO',540,494,fBold(28),O,t,.25,'type',{dur:.5,sp:8}); soft(c,THEMES[curDay].label.toLowerCase()+' · '+(days[curDay]?days[curDay].date:''),540,540,fMed(24),'#9C9893',t,.45,'ghost');
  let cy0=590; if(m.head){ const lines=wrapLines(c,m.head,fSerif(46),820,3), hh=70+lines.length*58, k=eo(seg(t,.4,.8)); if(k>0){ c.save(); c.globalAlpha*=k; c.translate(0,(1-k)*30); rr(c,90,cy0,900,hh,18); c.fillStyle='#141418'; c.fill(); c.fillStyle=O; c.fillRect(90,cy0,8,hh); txt(c,'MANCHETE DO DIA',130,cy0+36,fBold(18),'#9C9893','left',4); c.restore();
      lines.forEach((ln,j)=>soft(c,ln,130,cy0+90+j*58,fSerif(46),WH,t,.55+j*.22,'type',{dur:.4,align:'left'})); } cy0+=hh+30; }
  const chartTop=Math.max(cy0,640), chartH=Math.min(360,1180-chartTop), dp=eo(seg(t,1.0,2.6)), trend=neutral?.6:down?-1:1;
  c.save(); c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=1; for(let k=0;k<=4;k++){ const y=chartTop+chartH*k/4; c.beginPath(); c.moveTo(90,y); c.lineTo(990,y); c.stroke(); } c.restore();
  const tip=candles(c,90,chartTop,900,chartH,26,trend,dp,(days[curDay]?days[curDay].date.length:7)*13);
  if(tip&&dp<1){ c.fillStyle=O; c.beginPath(); c.arc(tip.x,tip.y,7,0,7); c.fill(); }
  if(m.ibov!=null){ const k=eo(seg(t,1.6,2.0))*(1-eo(seg(t,2.6,2.9))); if(k>0){ c.save(); c.globalAlpha*=k; const s='IBOV '+(down?'▼ ':'▲ ')+pctFmt(m.ibov); txt(c,s,540,chartTop+chartH+70,fBlack(fitF(c,s,800,fBlack,64)),down?'#E7E5E1':O,'center'); c.restore(); } }
  const ph=seg(t,2.7,3.1); if(ph>0){ c.save(); c.globalAlpha*=eo(ph)*.82; c.fillStyle='#070708'; c.fillRect(0,chartTop-20,W,chartH+130); c.restore(); }
  const midY=chartTop+chartH/2+20;
  if(down){ const ba=eo(seg(t,2.8,3.2))*(1-eo(seg(t,3.9,4.3))); bearIcon(c,540-(eo(seg(t,3.9,4.3)))*600,midY,1.15,ba);
    const qa=1-eo(seg(t,3.85,4.15)); if(qa>0){ c.save(); c.globalAlpha*=qa; soft(c,'Mercado em queda.',540,midY+190,fSerif(54),'#E7E5E1',t,3.0,'ghost'); c.restore(); } }
  const bull=eo(seg(t,down?3.9:2.9,down?4.4:3.4)); if(bull>0){ const z=.6+.4*back(seg(t,down?3.9:2.9,down?4.4:3.4)), sh=Math.sin(t*40)*Math.max(0,1-(t-(down?4.0:3.0))*4)*6;
    c.save(); c.globalAlpha*=bull; const g=c.createRadialGradient(540,midY,10,540,midY,360); g.addColorStop(0,'rgba(255,106,19,.45)'); g.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=g; c.fillRect(0,midY-380,W,760); c.restore();
    logo(c,540+sh,midY-10,420*z,false,bull); }
  const fin=down?'E a turma? Seguiu no verde.':neutral?'E a turma? Confere aí.':'Mercado em alta. A turma também.';
  soft(c,fin,540,Math.min(1440,midY+(down?250:260)),fBlack(fitF(c,fin,900,fBlack,56)),O,t,down?4.4:3.5,'rise',{big:true}); }

/* ---------- 2) Painel de cotações ---------- */
const deAcc=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z ]/g,'');
function tickers(list){ const used={}; return list.map(s=>{ const ws=deAcc(s.name).split(' ').filter(Boolean); let base=(ws[0]||'ALNO').slice(0,4); if(base.length<4) base=(base+(ws[1]||'XXXX')).slice(0,4); let code=base+'3', k=4; while(used[code]){ code=base+(k===4?'4':String(k+7)); k++; } used[code]=1; return code; }); }
function boardData(){ if(MODE==='parcial') return {list:PZ.list.map(s=>({name:s.name,value:s.total,_a:s._a})),sub:'Parcial · '+PZ.range,total:PZ.total,lbl:'TURMA SEG A QUA'};
  if(MODE==='week') return {list:WK.rank.map(s=>({name:s.name,value:s.total,_a:s._a})),sub:'Semana · '+WK.range,total:WK.total,lbl:'TURMA NA SEMANA'};
  return {list:S.map(s=>({name:s.name,value:s.value,_a:s._a})),sub:THEMES[curDay].label+' · '+(days[curDay]?days[curDay].date:''),total:S.reduce((a,s)=>a+s.value,0),lbl:'TURMA HOJE'}; }
function sceneBoard(c,t){ const B=boardData(), n=B.list.length, show=B.list.slice(0,10), codes=tickers(show), rh=Math.min(80,Math.max(56,660/Math.max(1,show.length))); terminalBg(c,t);
  soft(c,'PAINEL',540,420,fBold(26),O,t,.05,'type',{dur:.3,sp:10}); soft(c,'TRADER SCHOOL',540,484,fBlack(64),WH,t,.15,'rise',{big:true}); soft(c,B.sub,540,540,fMed(24),'#9C9893',t,.35,'ghost');
  const y0=590, ha=eo(seg(t,.3,.6)); c.save(); c.globalAlpha*=ha; txt(c,'ATIVO',110,y0,fBold(18),'#77736E','left',4); txt(c,'ALUNO',330,y0,fBold(18),'#77736E','left',4); txt(c,'RESULTADO',970,y0,fBold(18),'#77736E','right',4); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(90,y0+24,900,2); c.restore();
  show.forEach((s,k)=>{ const y=y0+40+k*rh+rh/2, f=seg(t,.5+k*.09,.8+k*.09); if(f<=0) return; const sy=Math.abs(Math.cos((1-eo(f))*Math.PI/2));
    c.save(); c.translate(0,y); c.scale(1,Math.max(.05,sy)); c.translate(0,-y); if(k%2===0){ c.fillStyle='rgba(255,255,255,.03)'; c.fillRect(90,y-rh/2,900,rh); }
    txt(c,codes[k],110,y,fBlack(Math.min(34,rh*.5)),O,'left',1); txt(c,ellip(c,s.name,330,fMed(Math.min(24,rh*.36))),330,y,fMed(Math.min(24,rh*.36)),'#C9C6C1','left');
    const v=s.value*eo(seg(t,.8+k*.09,1.4+k*.09)), vs='▲ +'+brl(v); txt(c,vs,970,y,fBlack(Math.min(32,rh*.46)),WH,'right'); c.restore(); });
  if(n>show.length) soft(c,'+'+(n-show.length)+(n-show.length>1?' alunos no verde':' aluno no verde'),540,y0+40+show.length*rh+30,fBold(22),'#9C9893',t,1.6,'ghost');
  const kb=eo(seg(t,1.8,2.2)); if(kb>0){ const by=Math.min(1400,y0+70+show.length*rh+(n>show.length?60:20)); c.save(); c.globalAlpha*=kb; rr(c,90,by,900,110,22); c.fillStyle=O; c.fill(); txt(c,B.lbl+' ▲',130,by+56,fBold(24),K,'left',4); const tv='+'+brl(B.total*eo(seg(t,1.8,2.6))); txt(c,tv,950,by+56,fBlack(fitF(c,'+'+brl(B.total),470,fBlack,46)),K,'right'); c.restore(); } }

/* ---------- encaixe na linha do tempo do Reels ---------- */
function proScenes(sc){ if(!sc.length) return sc;
  if(hasMkt()){ const m=mkt(), down=m.ibov!=null&&m.ibov<0; sc.unshift(mkScene('cover',5.6,sceneOpen,[[.05,'swish'],[.3,'type'],[.6,'type'],[1.0,'whoosh'],[1.7,'pop']].concat(down?[[2.85,'impact'],[3.9,'whoosh'],[4.0,'impact'],[4.4,'cash']]:[[2.9,'impact'],[3.5,'cash']]))); }
  if(boardOn()){ const B=boardData(), n=Math.min(10,B.list.length); sc.splice(sc.length-1,0,mkScene('rank',5.0,sceneBoard,[[.05,'type'],[.15,'swish']].concat(Array.from({length:n},(_,k)=>[.5+k*.09,'click'])).concat([[1.8,'pop'],[2.6,'cash']]))); }
  return sc; }

/* ---------- 3) Stories (imagens) ---------- */
const STORY_SAFE={top:250,bottom:1600};
function storyBg(g){ g.fillStyle='#0A0A0B'; g.fillRect(0,0,1080,1920); const r=g.createRadialGradient(540,1500,40,540,1500,900); r.addColorStop(0,'rgba(255,106,19,.20)'); r.addColorStop(1,'rgba(255,106,19,0)'); g.fillStyle=r; g.fillRect(0,0,1080,1920);
  g.save(); g.strokeStyle='rgba(255,255,255,.035)'; g.lineWidth=1; for(let x=0;x<=1080;x+=60){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,1920); g.stroke(); } for(let y=0;y<=1920;y+=60){ g.beginPath(); g.moveTo(0,y); g.lineTo(1080,y); g.stroke(); } g.restore(); }
function storyFoot(g,txtLine){ g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(140,1560,800,2); txt(g,txtLine,540,1592,fMed(20),'#77736E','center'); }
function newStory(){ const c=document.createElement('canvas'); c.width=1080; c.height=1920; const g=c.getContext('2d'); storyBg(g); logo(g,540,355,280,false); return [c,g]; }
const DISC_S='Resultados individuais. Não representam promessa ou garantia de ganhos.';
function storyList(title,sub,rows,totLbl,total){ const [c,g]=newStory();
  txt(g,title,540,560,fBold(30),O,'center',8); txt(g,sub,540,632,fSerif(60),WH,'center');
  const n=rows.length, top=720, avail=1400-top-20, rh=Math.min(92,Math.max(48,avail/Math.max(1,n))), shown=rows.slice(0,Math.floor(avail/rh));
  shown.forEach((s,k)=>{ const y=top+k*rh+rh/2, ar=Math.min(34,rh*.38); if(k%2===0){ g.fillStyle='rgba(255,255,255,.035)'; rr(g,110,y-rh/2+3,860,rh-6,14); g.fill(); }
    g.fillStyle=O; g.beginPath(); g.arc(170,y,ar+3,0,7); g.fill(); avatar(g,s._a,170,y,ar);
    const v='+'+brl(s.value), vf=fBlack(Math.min(34,rh*.42)), vw=tw(g,v,vf); txt(g,v,950,y,vf,O,'right'); txt(g,ellip(g,s.name.toUpperCase(),950-vw-40-220,fBlack(Math.min(30,rh*.38))),220,y,fBlack(Math.min(30,rh*.38)),WH,'left'); });
  if(rows.length>shown.length) txt(g,'+'+(rows.length-shown.length)+' alunos no verde',540,top+shown.length*rh+26,fBold(22),'#9C9893','center');
  rr(g,110,1420,860,112,24); g.fillStyle=O; g.fill(); txt(g,totLbl,150,1477,fBold(24),K,'left',4); txt(g,'+'+brl(total),930,1477,fBlack(fitF(g,'+'+brl(total),460,fBlack,48)),K,'right');
  storyFoot(g,DISC_S); return c; }
function storyStudent(s,dayLbl,date){ const [c,g]=newStory();
  g.fillStyle=O; g.beginPath(); g.arc(540,540,82,0,7); g.fill(); avatar(g,s._a,540,540,76);
  const nm=s.name.toUpperCase(); txt(g,nm,540,682,fBlack(fitF(g,nm,880,fBlack,66)),WH,'center'); if(s.handle&&s.handle.length>1) txt(g,s.handle,540,738,fMed(28),O,'center');
  const bx=100,by=790,bw=880,bh=560; g.save(); rr(g,bx,by,bw,bh,28); g.fillStyle='#16161A'; g.fill(); g.clip();
  if(s._p){ const sc=Math.min((bw-24)/iw(s._p),(bh-24)/ih(s._p)), w=iw(s._p)*sc, h=ih(s._p)*sc; g.drawImage(s._p,bx+(bw-w)/2,by+(bh-h)/2,w,h); } else txt(g,'PRINT DO ALUNO',540,by+bh/2,fBold(26),'#77736E','center',4);
  g.restore(); g.strokeStyle='rgba(255,106,19,.6)'; g.lineWidth=3; rr(g,bx,by,bw,bh,28); g.stroke();
  const v='+'+brl(s.value); rr(g,140,1395,800,120,30); g.fillStyle=O; g.fill(); txt(g,v,540,1457,fBlack(fitF(g,v,720,fBlack,70)),K,'center');
  txt(g,'Resultado do dia · '+dayLbl.toLowerCase()+' · '+date,540,1548-8,fBold(22),'#9C9893','center',2);
  storyFoot(g,DISC_S); return c; }
async function makeStories(){ await Promise.all(FONTS.map(f=>document.fonts.load(f).catch(()=>{}))); await loadLogo(); const out=[], dt=(days[curDay]&&days[curDay].date)||'', tag=dt.replace(/\//g,'-');
  const toBlob=cv=>new Promise(r=>cv.toBlob(r,'image/png'));
  if(curDay==='sab'){ const w=computeWeek(); await Promise.all(w.rank.map(async s=>{ s._a=await getImg(s.avatar,420); }));
    if(w.rank.length) out.push({name:`stories-semana-${tag}.png`,cv:storyList('FECHAMENTO DA SEMANA',w.range,w.rank.map(s=>({name:s.name,value:s.total,_a:s._a})),'TOTAL DA SEMANA',w.total)}); }
  else { const list=roster.map(r=>{ const e=days[curDay].entries[r.id]; return e&&e.on&&e.value>0?{...r,value:e.value,avatar:avatarSrc(r),print:printSrc(curDay,r.id,e)}:null; }).filter(Boolean).sort((a,b)=>b.value-a.value);
    await Promise.all(list.map(async s=>{ s._a=await getImg(s.avatar,420); s._p=s.print?await getImg(s.print,1400):null; }));
    if(list.length) out.push({name:`stories-${curDay}-${tag}-turma.png`,cv:storyList('RESULTADOS DO DIA',THEMES[curDay].label,list,'TURMA HOJE',list.reduce((a,s)=>a+s.value,0))});
    list.forEach((s,k)=>out.push({name:`stories-${curDay}-${tag}-${pad2(k+1)}-${deAcc(s.name).split(' ')[0].toLowerCase()||'aluno'}.png`,cv:storyStudent(s,THEMES[curDay].label,dt)}));
    if(curDay==='qua'&&parcialOn()){ const pz=computeParcial(); await Promise.all(pz.list.map(async s=>{ s._a=await getImg(s.avatar,420); })); if(pz.list.length) out.splice(1,0,{name:`stories-parcial-seg-a-qua-${tag}.png`,cv:storyList('PARCIAL DA SEMANA',pz.range,pz.list.map(s=>({name:s.name,value:s.total,_a:s._a})),'TURMA SEG A QUA',pz.total)}); } }
  for(const o of out){ o.blob=await toBlob(o.cv); o.url=URL.createObjectURL(o.blob); delete o.cv; } return out; }
