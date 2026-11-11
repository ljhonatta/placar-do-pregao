/* Placar do Pregão v5 — padrão 3D único para os dois vídeos da semana:
   QUARTA: parcial (resultados de segunda, terça e quarta de cada aluno)
   SÁBADO: fechamento da semana com a turma inteira
   Palco escuro com chão em perspectiva, cartões 3D de verdade (rotação em Y com perspectiva),
   reflexo no chão, entradas suaves e uma transição padrão (empurrar em 3D). Só desenha; não grava dados. */
'use strict';
const P5=Object.assign({},PALS.ter,{bg:['#1A1A1F','#050506'],grey:'#9C9893',ink:WH,ink2:'#E7E5E1',solid:O,onSolid:K,logoDark:false,disc:'#77736E',accent:O,accentD:OD});
const D5={bpm:100,motion:'lift',accent:'none',trans:'push3d',light:0,l1:'',tag:'',quote:['Disciplina é a ponte','entre metas e conquistas.'],
  open:['Consistência,','Mais um no verde,','Firme no plano,','Processo bem feito,','Mais um,','Disciplina,','Método,']};
const PDAYS=['seg','ter','qua'];
let PZ=null;
const V5=()=>MODE==='parcial'||MODE==='week';
const parcialOn=()=>!$('parcial')||$('parcial').checked;
const sfxDay=()=>V5()?'v5':curDay;

/* ---------- dados da parcial (só leitura) ---------- */
function computeParcial(){ const dayTotals=[0,0,0], list=[]; let ops=0;
  roster.forEach(r=>{ const dd=PDAYS.map((d,k)=>{ const e=days[d]&&days[d].entries[r.id], on=!!(e&&e.on), v=on?(+e.value||0):0; if(on&&v>0){ dayTotals[k]+=v; ops++; }
      return {d,on,value:v,fx:e&&e.fx!=null?e.fx:.8,fy:e&&e.fy!=null?e.fy:.66,print:on?printSrc(d,r.id,e):null}; });
    if(dd.some(x=>x.on)) list.push({...r,avatar:avatarSrc(r),days:dd,total:dd.reduce((a,x)=>a+x.value,0)}); });
  list.sort((a,b)=>b.total-a.total);
  return {list,dayTotals,ops,total:dayTotals.reduce((a,b)=>a+b,0),dates:PDAYS.map(d=>shortDate(days[d].date)),range:shortDate(days.seg.date)+' a '+shortDate(days.qua.date)}; }
async function prepareParcial(){ PZ=computeParcial(); await Promise.all(PZ.list.map(async s=>{ s._a=await getImg(s.avatar,420); s._at=tiny(s._a,10); s._ab=tiny(s._a,24); s._ag=s._a;
  await Promise.all(s.days.map(async x=>{ x._p=x.on&&x.print?await getImg(x.print,1100):null; })); })); }

/* ---------- palco 3D ---------- */
function bg5(c,t){ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#17171B'); g.addColorStop(.56,'#0B0B0D'); g.addColorStop(1,'#040405'); c.fillStyle=g; c.fillRect(0,0,W,H);
  const r=c.createRadialGradient(540,1120,40,540,1120,780); r.addColorStop(0,'rgba(255,106,19,.22)'); r.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=r; c.fillRect(0,0,W,H);
  const hz=1090; c.save(); c.strokeStyle='rgba(255,255,255,.075)'; c.lineWidth=1.5;
  for(let k=-14;k<=14;k++){ c.beginPath(); c.moveTo(540+k*22,hz); c.lineTo(540+k*300,H+120); c.stroke(); }
  const off=(t*.22)%1; for(let k=0;k<16;k++){ const z=(k+off)/16, y=hz+(H-hz)*Math.pow(z,2.1); c.globalAlpha=.25+.75*z; c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } c.restore();
  const hg=c.createLinearGradient(0,hz-90,0,hz+40); hg.addColorStop(0,'rgba(255,106,19,0)'); hg.addColorStop(.7,'rgba(255,106,19,.10)'); hg.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=hg; c.fillRect(0,hz-90,W,130);
  const sx=((t*90)%1800)-360; const sg=c.createLinearGradient(sx,0,sx+360,0); sg.addColorStop(0,'rgba(255,255,255,0)'); sg.addColorStop(.5,'rgba(255,255,255,.025)'); sg.addColorStop(1,'rgba(255,255,255,0)'); c.save(); c.translate(540,960); c.rotate(-.35); c.translate(-540,-960); c.fillStyle=sg; c.fillRect(sx,-400,360,2800); c.restore(); }

/* cartão 3D: o conteúdo é desenhado num quadro à parte e projetado com perspectiva (rotação em Y) */
const BUF5={};
function buf5(key,w,h){ let b=BUF5[key]; const pw=Math.max(2,Math.round(w*Q)), ph=Math.max(2,Math.round(h*Q)); if(!b){ b=document.createElement('canvas'); BUF5[key]=b; } if(b.width!==pw||b.height!==ph){ b.width=pw; b.height=ph; }
  const g=b.getContext('2d'); g.setTransform(Q,0,0,Q,0,0); g.clearRect(0,0,w,h); g.globalAlpha=1; return [b,g]; }
function persp(c,src,cx,cy,w,h,ry,f=1700,N=40){ const sw=src.width, sh=src.height, cs=Math.cos(ry), sn=Math.sin(ry); if(cs<=.02) return;
  if(Math.abs(ry)<.004){ c.drawImage(src,cx-w/2,cy-h/2,w,h); return; }
  for(let i=0;i<N;i++){ const a=i/N, b=(i+1)/N, x0=(a-.5)*w, x1=(b-.5)*w, s0=f/(f+x0*sn), s1=f/(f+x1*sn), X0=cx+x0*cs*s0, X1=cx+x1*cs*s1, hs=h*(s0+s1)/2;
    c.drawImage(src,a*sw,0,Math.max(1,(b-a)*sw),sh,Math.min(X0,X1),cy-hs/2,Math.abs(X1-X0)+.7,hs); } }
function card3D(c,key,w,h,cx,cy,ry,fn,o={}){ const sc=o.scale==null?1:o.scale, a=o.alpha==null?1:o.alpha; if(a<=0||sc<=.01) return; const [b,g]=buf5(key,w,h); fn(g,w,h);
  const W2=w*sc, H2=h*sc; c.save(); c.globalAlpha*=a;
  if(o.shadow!==false){ const fy=o.floorY||cy+H2/2+16; c.save(); c.translate(cx,fy); c.scale(1,.16); const sg=c.createRadialGradient(0,0,10,0,0,W2*.62); sg.addColorStop(0,'rgba(0,0,0,.75)'); sg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=sg; c.fillRect(-W2,-W2,2*W2,2*W2); c.restore(); }
  if(o.glow){ c.save(); c.globalAlpha*=o.glow; const gg=c.createRadialGradient(cx,cy,10,cx,cy,W2*.9); gg.addColorStop(0,'rgba(255,106,19,.35)'); gg.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=gg; c.fillRect(cx-W2,cy-W2,2*W2,2*W2); c.restore(); }
  persp(c,b,cx,cy,W2,H2,ry);
  if(o.reflect){ const by=cy+H2/2; c.save(); c.beginPath(); c.rect(0,by+4,W,H2*.38); c.clip(); c.globalAlpha*=.13; c.translate(0,2*by+8); c.scale(1,-1); persp(c,b,cx,cy,W2,H2,ry); c.restore(); }
  c.restore(); }
/* coluna 3D */
function col3D(c,x,base,w,h,hot){ if(h<=1) return; const dx=26, dy=16; box3D(c,x-w/2,base-h,w,h,dx,dy,hot?['#FF8A3D','#D14A00']:['#F4F2EF','#BDBAB5'],hot?'#FFB07A':'#FFFFFF',hot?'#8C3300':'#77736E'); }
function soft(c,s,x,y,font,col,t,t0,mode='rise',o={}){ reveal(c,s,x,y,font,col,t,t0,Object.assign({mode,dur:.5},o)); }

/* ---------- conteúdo dos cartões ---------- */
function tileDay(lbl,date,sub){ return (g,w,h)=>{ rr(g,0,0,w,h,26); g.fillStyle='#FAFAF9'; g.fill(); g.save(); rr(g,0,0,w,h,26); g.clip(); g.fillStyle=O; g.fillRect(0,0,w,14); g.restore();
  txt(g,lbl,w/2,h*.44,fAnton(fitF(g,lbl,w-30,fAnton,Math.round(w*.5))),K,'center'); txt(g,date,w/2,h*.72,fBold(Math.round(w*.12)),'#6E6B67','center',2); if(sub) txt(g,sub,w/2,h*.86,fBlack(fitF(g,sub,w-24,fBlack,Math.round(w*.1))),O,'center'); }; }
function panelDay(s,j,u,i){ const x=s.days[j]; return (g,w,h)=>{ rr(g,0,0,w,h,22); g.fillStyle='#FAFAF9'; g.fill(); g.save(); rr(g,0,0,w,h,22); g.clip();
    g.fillStyle=K; g.fillRect(0,0,w,70); txt(g,THEMES[x.d].tab,20,38,fAnton(42),WH,'left'); txt(g,PZ.dates[j],w-18,38,fBold(18),'#9C9893','right',2);
    const py=78, ph=h-78-92; if(x._p){ coverFocus(g,x._p,10,py,w-20,ph,.55,x.fx,x.fy); }
    else { g.fillStyle='#1B1B1F'; g.fillRect(10,py,w-20,ph); txt(g,x.on?'SEM PRINT':'NÃO OPEROU',w/2,py+ph/2,fBold(20),'#8A8782','center',3); }
    g.restore(); g.strokeStyle='rgba(0,0,0,.08)'; g.lineWidth=2; rr(g,1,1,w-2,h-2,22); g.stroke();
    const t0=.95+j*.4, v=x.value*eo(seg(u,t0,t0+.45));
    if(x.on&&x.value>0){ const vf=fBlack(fitF(g,'+'+brl(x.value),w-30,fBlack,34)); txt(g,'+'+brl(v),w/2,h-44,vf,K,'center'); g.fillStyle=O; g.fillRect(w/2-30,h-16,60,5); }
    else txt(g,'—',w/2,h-44,fBlack(34),'#B8B4AE','center'); }; }

/* ---------- QUARTA: parcial (segunda a quarta) ---------- */
function coverP(c,t){ soft(c,'PARCIAL DA SEMANA',540,420,fBold(30),O,t,.05,'type',{dur:.5,sp:8});
  [[0,290,-.42,1],[2,790,.42,1],[1,540,0,1.12]].forEach(([j,x,ry,sc])=>{ const k=eo(seg(t,.25+j*.15,1.0+j*.15)), fl=Math.sin(t*1.2+j)*5*k;
    card3D(c,'cp'+j,230,300,x,800+(1-k)*140+fl,ry+(1-k)*1.45*(j===2?1:-1),tileDay(THEMES[PDAYS[j]].tab,PZ.dates[j],PZ.dayTotals[j]>0?'+'+brl(PZ.dayTotals[j]):''),{scale:sc*(.82+.18*k),alpha:k,reflect:true}); });
  soft(c,'Resultado dos alunos',540,1150,fSerif(64),WH,t,1.1,'rise');
  soft(c,'de segunda a quarta',540,1226,fSerif(46),O,t,1.35,'ghost');
  const kp=eo(seg(t,1.6,2.0)); if(kp>0){ c.save(); c.globalAlpha*=kp; pill(c,PZ.range,540,1316+(1-kp)*16,fBold(28),O,K,4); c.restore(); }
  soft(c,HANDLE,540,1404,fMed(28),'#9C9893',t,1.9,'type',{dur:.6}); }
function hlP(c,t){ const s=PZ.list[0];
  soft(c,'O destaque',540,412,fSerif(54),'#E7E5E1',t,.05,'ghost');
  soft(c,'SEG · TER · QUA',540,478,fBold(26),O,t,.25,'type',{dur:.4,sp:6});
  const k=eo(seg(t,.25,1.1)), ry=(1-k)*1.35+Math.sin(t*.9)*.05*k;
  card3D(c,'hl',600,740,540,900+(1-k)*80,ry,(g,w,h)=>{ rr(g,0,0,w,h,36); g.fillStyle='#FAFAF9'; g.fill(); g.save(); rr(g,0,0,w,h,36); g.clip(); g.fillStyle=O; g.fillRect(0,0,w,12); g.restore();
    g.fillStyle=O; g.beginPath(); g.arc(w/2,170,128,0,7); g.fill(); avatar(g,s._a,w/2,170,120);
    const nm=s.name.toUpperCase(); txt(g,nm,w/2,340,fBlack(fitF(g,nm,w-60,fBlack,62)),K,'center'); if(s.handle&&s.handle.length>1) txt(g,s.handle,w/2,390,fMed(24),'#6E6B67','center');
    g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(50,425,w-100,2);
    s.days.forEach((x,j)=>{ const y=470+j*58, v=x.value*eo(seg(t,1.0+j*.25,1.45+j*.25)); txt(g,THEMES[x.d].label,60,y,fBold(22),'#6E6B67','left',2); txt(g,x.on&&x.value>0?'+'+brl(v):'—',w-60,y,fBlack(30),x.on&&x.value>0?K:'#B8B4AE','right'); });
    rr(g,40,h-112,w-80,80,20); g.fillStyle=O; g.fill(); txt(g,'TOTAL',70,h-72,fBold(22),K,'left',4); const tv='+'+brl(s.total*eo(seg(t,1.2,2.2))); txt(g,tv,w-70,h-72,fBlack(fitF(g,'+'+brl(s.total),w-240,fBlack,42)),K,'right'); },
    {scale:.9+.1*k,alpha:Math.min(1,k*1.5),glow:.7*k});
  sparkle(c,880,560,22,eo(seg(t,1.1,1.5)),O); sparkle(c,200,1180,14,eo(seg(t,1.3,1.7)),WH); plus(c,180,620,14,eo(seg(t,1.2,1.6)),WH);
  soft(c,'Parabéns!',540,1346,fSerif(60),WH,t,2.2,'rise'); }
function studentP(c,i,u,run){ const s=PZ.list[i], n=PZ.list.length;
  soft(c,i===0?'O destaque,':D5.open[(i-1)%D5.open.length],540,410,fSerif(42),O,u,.05,'ghost');
  const nm=s.name.toUpperCase(); soft(c,nm,540,482,fBlack(fitF(c,nm,900,fBlack,84)),WH,u,.15,'rise',{big:true});
  if(s.handle&&s.handle.length>1) tagBox(c,s.handle,540,548,fMed(24),u,.4,O,K);
  [[0,205,.5],[2,875,-.5],[1,540,0]].forEach(([j,x,ry])=>{ const k=eo(seg(u,.3+j*.15,1.0+j*.15)), f=Math.sin(Math.PI*seg(u,.95+j*.4,1.45+j*.4)), fl=Math.sin(u*1.3+j)*4*k;
    card3D(c,'sp'+j,290,440,x,850+(1-k)*120+fl,ry+(1-k)*1.4*(j===2?1:-1),panelDay(s,j,u,i),{scale:(j===1?1.06:.94)*(.82+.18*k)+.05*f,alpha:k,glow:f*.9}); });
  const kp=eo(seg(u,.6,1.1)); if(kp<=0) return; c.save(); c.globalAlpha*=kp; c.translate(0,(1-kp)*70);
  const x=90,y=1166,w=900,h=200; c.save(); shadowOn(c,50,24,.5); rr(c,x,y,w,h,26); c.fillStyle='rgba(22,22,26,.94)'; c.fill(); shadowOff(c); c.strokeStyle=O; c.lineWidth=2.5; c.stroke(); c.restore();
  txt(c,'TOTAL SEG A QUA',x+50,y+50,fBold(22),'#9C9893','left',5); const pop=1+.1*Math.sin(Math.PI*seg(u,2.6,2.9)), tv=s.total*eo(seg(u,2.0,2.6)), vf=fBlack(fitF(c,'+'+brl(s.total),500,fBlack,80));
  c.save(); c.translate(x+50,y+126); c.scale(pop,pop); txt(c,'+R$',0,0,vf,O,'left'); txt(c,brl(tv).slice(3),tw(c,'+R$ ',vf),0,vf,WH,'left'); c.restore();
  const rv=brl(run(u)); txt(c,'TURMA (SEG A QUA)',x+w-50,y+60,fBold(19),'#9C9893','right',4); txt(c,rv,x+w-50,y+108,fBlack(fitF(c,rv,320,fBlack,36)),WH,'right'); txt(c,pad2(i+1)+' / '+pad2(n),x+w-50,y+160,fBold(21),O,'right',4);
  slider(c,x+50,x+690,y+170,(i+eo(seg(u,.8,2.6)))/n,O,'#4A4A50'); c.restore(); }
function outP(c,o){ const tot=PZ.total, dt=PZ.dayTotals, mx=Math.max(1,...dt), best=dt.indexOf(Math.max(...dt));
  soft(c,'Parcial da turma',540,414,fSerif(54),'#E7E5E1',o,.05,'ghost');
  soft(c,'SEGUNDA A QUARTA',540,478,fBold(26),O,o,.2,'type',{dur:.5,sp:8});
  if(o>outCE()-2.4*OUTB){ c.save(); c.globalAlpha*=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.8*OUTB)); const z=1+.08*Math.sin(Math.PI*seg(o,outCE(),outCE()+.3)); c.translate(540,585); c.scale(z,z); bigText(c,brl(tot*eo(seg(o,outCE()-2.4*OUTB,outCE()))),0,0,fBlack(fitF(c,brl(tot),900,fBlack,112)),WH,'center'); c.restore(); }
  dt.forEach((v,j)=>{ const x=300+j*240, g=eo(seg(o,.5+j*.15,1.3+j*.15)), h=Math.max(10,330*v/mx)*g; col3D(c,x,1060,150,h,j===best&&v>0);
    if(g>.3){ c.save(); c.globalAlpha*=seg(o,.8+j*.15,1.2+j*.15); txt(c,v>0?brl(v*g):'—',x+13,1060-h-50,fBlack(fitF(c,brl(v),220,fBlack,28)),j===best&&v>0?O:WH,'center'); c.restore(); }
    txt(c,THEMES[PDAYS[j]].tab,x,1110,fAnton(46),WH,'center'); txt(c,PZ.dates[j],x,1152,fBold(20),'#9C9893','center',2); });
  soft(c,PZ.list.length+(PZ.list.length>1?' alunos no verde':' aluno no verde'),540,1232,fBold(26),O,o,1.4,'type',{dur:.5,sp:3});
  soft(c,'Sábado tem o fechamento da semana.',540,1300,fSerif(40),'#E7E5E1',o,outCE()+.1,'ghost');
  soft(c,HANDLE,540,1384,fMed(28),'#9C9893',o,outCE()+.3,'type',{dur:.6}); }

/* ---------- SÁBADO: semana completa, turma inteira ---------- */
function coverW(c,t){ soft(c,'FECHAMENTO DA SEMANA',540,420,fBold(30),O,t,.05,'type',{dur:.5,sp:8});
  [0,4,1,3,2].forEach(j=>{ const x=540+(j-2)*200, ry=(j-2)*.3, k=eo(seg(t,.25+j*.12,.95+j*.12)), fl=Math.sin(t*1.2+j)*4*k, v=WK.dayTotals[j];
    card3D(c,'cw'+j,180,250,x,800+(1-k)*140+fl,ry+(1-k)*1.4*(j<2?-1:1),tileDay(THEMES[WEEK[j]].tab,WK.dates[j]||'',v>0?'+'+brl(v):''),{scale:(j===2?1.1:.95)*(.82+.18*k),alpha:k,reflect:true}); });
  soft(c,'Resultado da turma',540,1150,fSerif(64),WH,t,1.1,'rise');
  soft(c,'turma completa, de segunda a sexta',540,1226,fSerif(42),O,t,1.35,'ghost');
  const kp=eo(seg(t,1.6,2.0)); if(kp>0){ c.save(); c.globalAlpha*=kp; pill(c,WK.range,540,1316+(1-kp)*16,fBold(28),O,K,4); c.restore(); }
  soft(c,HANDLE,540,1404,fMed(28),'#9C9893',t,1.9,'type',{dur:.6}); }
function barsW(c,o){ const dt=WK.dayTotals, mx=Math.max(1,...dt), best=dt.indexOf(Math.max(...dt));
  soft(c,'A semana',540,414,fSerif(54),'#E7E5E1',o,.05,'ghost'); soft(c,'EM NÚMEROS',540,486,fBlack(64),WH,o,.2,'rise',{big:true});
  dt.forEach((v,j)=>{ const x=190+j*175, g=eo(seg(o,.5+j*.15,1.3+j*.15)), h=Math.max(10,430*v/mx)*g; col3D(c,x,1080,120,h,j===best&&v>0);
    if(g>.3){ c.save(); c.globalAlpha*=seg(o,.8+j*.15,1.2+j*.15); const s=v>0?brl(v*g).replace('R$ ',''):'—'; txt(c,s,x+13,1080-h-44,fBlack(fitF(c,brl(v).replace('R$ ',''),165,fBlack,26)),j===best&&v>0?O:WH,'center'); c.restore(); }
    txt(c,THEMES[WEEK[j]].tab,x,1128,fAnton(44),WH,'center'); txt(c,WK.dates[j]||'',x,1168,fBold(19),'#9C9893','center',2); });
  if(dt[best]>0) tagBox(c,'Melhor dia: '+THEMES[WEEK[best]].label.toLowerCase()+' · '+brl(dt[best]),540,1262,fBold(28),o,1.8,O,K);
  soft(c,WK.ops+' operações no lucro · '+WK.rank.length+' alunos',540,1350,fSerif(36),'#E7E5E1',o,2.2,'ghost'); }
function podiumW(c,o){ soft(c,'O pódio',540,414,fSerif(54),'#E7E5E1',o,.05,'ghost'); soft(c,'DA SEMANA',540,486,fBlack(64),WH,o,.2,'rise',{big:true});
  const base=1250, spots=[[1,230,240,190],[2,850,240,140],[0,540,280,260]];
  spots.forEach(([idx,cx,w,hh])=>{ const s=WK.rank[idx]; if(!s) return; const t0=.5+[.35,0,.7][idx], a=eo(seg(o,t0,t0+.6)), h=hh*a, top=base-h;
    c.save(); shadowOn(c,40,24,.4); box3D(c,cx-w/2,top,w,h,26,16,idx===0?['#FF8A3D','#D14A00']:['#F4F2EF','#BDBAB5'],idx===0?'#FFB07A':'#FFFFFF',idx===0?'#8C3300':'#77736E'); shadowOff(c); c.restore();
    if(h>60) txt(c,String(idx+1),cx,top+Math.min(h/2,90),fAnton(Math.min(96,h*.6)),idx===0?K:'#2A2A2E','center');
    const d=eo(seg(o,t0+.4,t0+1.0)); if(d>0){ const cw=idx===0?220:190, ch=idx===0?280:240, sc=.85+.15*d;
      card3D(c,'pw'+idx,cw,ch,cx,top-ch*sc/2-14,(1-d)*1.3*(idx===2?1:-1)+(idx===1?.18:idx===2?-.18:0),(g,w2,h2)=>{ rr(g,0,0,w2,h2,22); g.fillStyle='#FAFAF9'; g.fill(); g.save(); rr(g,0,0,w2,h2,22); g.clip(); if(s._a) cover(g,s._a,0,0,w2,h2-74); else silhouette(g,w2/2,(h2-74)/2,w2/2); g.restore();
        txt(g,ellip(g,s.name.toUpperCase(),w2-20,fBlack(20)),w2/2,h2-50,fBlack(20),K,'center'); txt(g,'+'+brl(s.total),w2/2,h2-22,fBlack(fitF(g,'+'+brl(s.total),w2-20,fBlack,20)),O,'center'); },{scale:sc,alpha:d,floorY:top-4,glow:idx===0?d*.8:0}); } });
  trophy(c,540,640,.55,eo(seg(o,2.0,2.4))); sparkle(c,760,600,18,eo(seg(o,2.1,2.5)),O); sparkle(c,320,680,12,eo(seg(o,2.2,2.6)),WH); }
function rankW(c,u,page){ soft(c,'A turma',540,414,fSerif(54),'#E7E5E1',u,.05,'ghost'); soft(c,'COMPLETA',540,486,fBlack(64),WH,u,.2,'rise',{big:true});
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const k=eo(seg(u,.4+j*.12,1.0+j*.12)), y=600+j*128, sd=j%2?1:-1;
    card3D(c,'rw'+j,900,108,540,y+54,(1-k)*1.3*sd,(g,w,h)=>{ rr(g,0,0,w,h,22); g.fillStyle='#FAFAF9'; g.fill(); txt(g,String(start+j+1)+'º',60,h/2+2,fBlack(38),O,'center');
      g.fillStyle=O; g.beginPath(); g.arc(160,h/2,40,0,7); g.fill(); avatar(g,s._a,160,h/2,37);
      const v='+'+brl(s.total), vw=tw(g,v,fBlack(30)); txt(g,v,w-30,h/2-10,fBlack(30),K,'right'); txt(g,ellip(g,s.name.toUpperCase(),w-vw-280,fBlack(28)),220,h/2-10,fBlack(28),K,'left');
      s.days.forEach((on,q)=>{ rr(g,220+q*44,h/2+18,36,22,6); g.fillStyle=on?O:'#DDDAD5'; g.fill(); txt(g,THEMES[WEEK[q]].tab[0],238+q*44,h/2+30,fBold(14),on?K:'#9A9792','center'); }); },{scale:.9+.1*k,alpha:k,shadow:false}); }); }
function outW(c,o){ const R=WK.rank, n=Math.min(R.length,15), tot=WK.total;
  soft(c,'Total da semana',540,414,fSerif(54),'#E7E5E1',o,.05,'ghost');
  if(o>outCE()-2.4*OUTB){ c.save(); c.globalAlpha*=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.8*OUTB)); const z=1+.08*Math.sin(Math.PI*seg(o,outCE(),outCE()+.3)); c.translate(540,530); c.scale(z,z); bigText(c,brl(tot*eo(seg(o,outCE()-2.4*OUTB,outCE()))),0,0,fBlack(fitF(c,brl(tot),900,fBlack,116)),WH,'center'); c.restore(); }
  const cols=Math.min(5,n), rows=Math.ceil(n/5), r=n>10?44:50, sp=170;
  R.slice(0,n).forEach((s,k)=>{ const row=Math.floor(k/5), inRow=Math.min(5,n-row*5), x=540+(k%5-(inRow-1)/2)*sp, y=700+row*135+(rows<3?60:0), a=back(seg(o,.4+k*.07,.8+k*.07)); if(a<=0) return;
    c.save(); c.translate(x,y); c.scale(a,a); c.save(); c.shadowColor='rgba(255,106,19,.6)'; c.shadowBlur=24*Q; c.fillStyle=O; c.beginPath(); c.arc(0,0,r+5,0,7); c.fill(); c.restore(); c.restore(); avatar(c,s._a,x,y,r*a);
    if(a>.9) txt(c,ellip(c,s.name.split(' ')[0].toUpperCase(),sp-16,fBold(16)),x,y+r+20,fBold(16),'#C9C6C1','center',1); });
  soft(c,'PARABÉNS, TURMA!',540,1130,fBlack(fitF(c,'PARABÉNS, TURMA!',880,fBlack,76)),O,o,outCE()+.05,'rise',{big:true});
  soft(c,WK.rank.length+' alunos · '+WK.ops+' operações no lucro',540,1216,fSerif(38),'#E7E5E1',o,outCE()+.3,'ghost');
  soft(c,'Quer fazer parte? O link está na bio.',540,1290,fBold(28),O,o,outCE()+.5,'type',{dur:.6});
  soft(c,HANDLE,540,1370,fMed(28),'#9C9893',o,outCE()+.7,'type',{dur:.6}); }

/* ---------- linha do tempo ---------- */
function buildParcial(){ if(!PZ||!PZ.list.length) return [];
  const sc=[mkScene('cover',4.8,coverP,[[.05,'type'],[.25,'whoosh'],[.4,'whoosh'],[.55,'whoosh'],[1.1,'swish'],[1.6,'pop'],[1.9,'type']]),
    mkScene('hl',4.8,hlP,[[.25,'whoosh'],[1.0,'pop'],[1.25,'pop'],[1.5,'pop'],[2.2,'cash'],[2.3,'swish']])];
  let prev=0; PZ.list.forEach((s,i)=>{ const p0=prev; const run=u=>p0+s.total*eo(seg(u,2.0,2.6)); sc.push(mkScene('student',4.8,(c,u)=>studentP(c,i,u,run),[[.15,'swish'],[.3,'whoosh'],[.45,'whoosh'],[.6,'whoosh'],[.95,'pop'],[1.35,'pop'],[1.75,'pop'],[2.6,'cash']])); prev+=s.total; });
  sc.push(outScene('out',5.0,outP,[[.05,'type'],[.5,'swish'],[.65,'swish'],[.8,'swish'],[1.4,'type']])); return sc; }
function buildWeek5(){ if(!WK||!WK.rank.length) return [];
  const sc=[mkScene('cover',5.0,coverW,[[.05,'type']].concat([0,1,2,3,4].map(j=>[.25+j*.12,'whoosh'])).concat([[1.1,'swish'],[1.6,'pop'],[1.9,'type']])),
    mkScene('bars',5.0,barsW,[[.05,'type']].concat([0,1,2,3,4].map(j=>[.5+j*.15,'swish'])).concat([[1.8,'pop'],[2.0,'cash']])),
    mkScene('podium',5.6,podiumW,[[.05,'type'],[.5,'impact'],[.85,'impact'],[1.2,'impact'],[.95,'whoosh'],[1.3,'whoosh'],[1.65,'whoosh'],[2.0,'riser'],[2.2,'cash']])];
  for(let p=0;3+p*6<WK.rank.length;p++) sc.push(mkScene('rank',4.4,(c,u)=>rankW(c,u,p),[[.05,'type']].concat([0,1,2,3,4,5].map(j=>[.4+j*.12,'swish']))));
  sc.push(outScene('weekout',6.0,outW,[[.05,'type']].concat([0,1,2,3,4,5].map(k=>[.4+k*.07,'pop'])))); return sc; }

/* transição padrão: empurrar em 3D (a cena sai girando para a esquerda, a próxima entra pela direita) */
function trans5(p){ const e=eio(p);
  ctx.save(); ctx.globalAlpha=Math.max(0,1-e*1.1); persp(ctx,SA,540-430*e,960,W*(1-.14*e),H*(1-.14*e),-.65*e,2600,28); ctx.restore();
  ctx.save(); ctx.globalAlpha=Math.min(1,.15+e*1.1); persp(ctx,SB,540+430*(1-e),960,W*(.86+.14*e),H*(.86+.14*e),.65*(1-e),2600,28); ctx.restore(); }
