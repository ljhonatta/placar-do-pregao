/* Placar do Pregão — motor de vídeo (estilo editorial / tipografia cinética).
   Cartões flutuando com sombra, canto de página dobrando, texto entrando palavra por palavra,
   etiquetas digitadas, caixa de seleção de editor, objetos entrando de desfoque, base 3D,
   sombras de persiana e de folhagem. Cada dia mistura preto, branco e laranja de um jeito.
   Depende de: days, curDay, roster, entry(), printSrc(), avatarSrc() definidos em app.js. Só desenha. */
'use strict';
const DAYS=['seg','ter','qua','qui','sex','sab'], WEEK=['seg','ter','qua','qui','sex'];
const THEMES={
  seg:{tab:'SEG',label:'SEGUNDA-FEIRA',word:'SEGUNDA'},
  ter:{tab:'TER',label:'TERÇA-FEIRA',word:'TERÇA'},
  qua:{tab:'QUA',label:'QUARTA-FEIRA',word:'QUARTA'},
  qui:{tab:'QUI',label:'QUINTA-FEIRA',word:'QUINTA'},
  sex:{tab:'SEX',label:'SEXTA-FEIRA',word:'SEXTA'},
  sab:{tab:'SÁB',label:'SÁBADO',word:'SEMANA'}
};
const HANDLE='@trader_wendellguimaraes';

/* ---------- formatos ---------- */
const brl=v=>'R$ '+(Math.round((+v||0)*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const brlInput=v=>v?(Math.round(v*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'';
function parseBR(s){ s=String(s||'').replace(/[R$\s]/g,''); if(!s) return 0;
  if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.'); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,'');
  const v=parseFloat(s); return isFinite(v)?Math.max(0,v):0; }
const pad2=n=>String(n).padStart(2,'0');
const fmtDate=d=>pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear();
function parseDate(s){ const m=String(s||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m?new Date(+m[3],+m[2]-1,+m[1]):null; }
const shortDate=s=>{ const d=parseDate(s); return d?pad2(d.getDate())+'/'+pad2(d.getMonth()+1):''; };

/* ---------- palco ---------- */
const W=1080,H=1920,FPS=30,SAFE_T=250,SAFE_B=1500,TR=.8;
const $=id=>document.getElementById(id);
const cv=$('cv'), ctx=cv.getContext('2d');
const SA=document.createElement('canvas'), SB=document.createElement('canvas'), sA=SA.getContext('2d'), sB=SB.getContext('2d');
const BL=document.createElement('canvas'), bl=BL.getContext('2d');
let Q=1, LOGO=null, LOGOD=null, GRAIN=null, LEAF=null;
function setRes(q){ Q=q; [cv,SA,SB].forEach(c=>{ c.width=Math.round(W*q); c.height=Math.round(H*q); }); }
setRes(.5);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo=k=>1-Math.pow(1-k,3);
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const back=k=>{ const c1=1.5,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
const RND=k=>{ const x=Math.sin(k*127.1+311.7)*43758.5453; return x-Math.floor(x); };
let S=[], MODE='day', WK=null, SCENES=[], busy=false, loopId=0, exporting=false;

/* ---------- tipografia ---------- */
const SERIF="'Playfair Display', Georgia, serif", SANS="Montserrat, 'Helvetica Neue', Arial, sans-serif";
const fSerif=s=>`italic 700 ${s}px ${SERIF}`, fSerifB=s=>`900 ${s}px ${SERIF}`, fBlack=s=>`900 ${s}px ${SANS}`, fBold=s=>`700 ${s}px ${SANS}`, fMed=s=>`500 ${s}px ${SANS}`;
const FONTS=["900 40px Montserrat","700 40px Montserrat","500 40px Montserrat","italic 700 40px 'Playfair Display'","900 40px 'Playfair Display'"];

/* ---------- combinação de cores de cada dia (sempre preto, branco e laranja) ---------- */
const O='#FF6A13', OD='#C94A00', K='#0E0E10', WH='#FFFFFF';
const PALS={
  seg:{name:'branco e laranja', bg:['#F5F4F2','#CFCDC9'], dark:false, shade:'0,0,0', ink:K, ink2:'#2A2A2E', grey:'#6E6B67', accent:O, accentD:OD, depth:'#000',
       card:'#FAFAF9', cardInk:K, cardSub:'#6E6B67', cardAccent:O, plate:['#1C1C20','#0B0B0D'], plateSide:'#000', plateText:WH, plateSub:'#9A9792', plateAccent:O, solid:K, onSolid:WH, logoDark:true, disc:'#8A8782'},
  ter:{name:'preto e laranja', bg:['#26262B','#060607'], dark:true, shade:'255,255,255', ink:WH, ink2:'#E7E5E1', grey:'#9C9893', accent:O, accentD:'#5A2200', depth:'#000',
       card:'#18181C', cardInk:WH, cardSub:'#9C9893', cardAccent:O, plate:['#FF7A26','#E35500'], plateSide:'#9C3600', plateText:K, plateSub:'#4A1E04', plateAccent:WH, solid:O, onSolid:K, logoDark:false, disc:'#77736E'},
  qua:{name:'as três cores', bg:['#F5F4F2','#CFCDC9'], dark:false, shade:'0,0,0', ink:K, ink2:'#2A2A2E', grey:'#6E6B67', accent:O, accentD:OD, depth:'#000',
       card:'#121215', cardInk:WH, cardSub:'#A9A6A1', cardAccent:O, plate:['#FF7A26','#E35500'], plateSide:'#9C3600', plateText:K, plateSub:'#4A1E04', plateAccent:WH, solid:K, onSolid:WH, logoDark:true, disc:'#8A8782'},
  qui:{name:'laranja e preto', bg:['#26262B','#060607'], dark:true, shade:'255,255,255', ink:WH, ink2:'#E7E5E1', grey:'#9C9893', accent:O, accentD:'#5A2200', depth:'#000',
       card:O, cardInk:K, cardSub:'#4A1E04', cardAccent:WH, plate:['#FFFFFF','#E4E2DE'], plateSide:'#9A9792', plateText:K, plateSub:'#6E6B67', plateAccent:O, solid:O, onSolid:K, logoDark:false, disc:'#77736E'},
  sex:{name:'preto, branco e laranja', bg:['#26262B','#060607'], dark:true, shade:'255,255,255', ink:WH, ink2:'#E7E5E1', grey:'#9C9893', accent:O, accentD:'#5A2200', depth:'#000',
       card:'#FAFAF9', cardInk:K, cardSub:'#6E6B67', cardAccent:O, plate:['#FF7A26','#E35500'], plateSide:'#9C3600', plateText:K, plateSub:'#4A1E04', plateAccent:WH, solid:WH, onSolid:K, logoDark:false, disc:'#77736E'},
  sab:{name:'laranja com branco e preto', bg:['#FF8A3D','#C94400'], dark:false, shade:'0,0,0', ink:K, ink2:'#1E0C02', grey:'#3A1503', accent:WH, accentD:'#7A2C00', depth:'#5A2000',
       card:'#FAFAF9', cardInk:K, cardSub:'#6E6B67', cardAccent:O, plate:['#1C1C20','#0B0B0D'], plateSide:'#000', plateText:WH, plateSub:'#9A9792', plateAccent:O, solid:K, onSolid:WH, logoDark:false, disc:'#4A1E04'}
};
let P=PALS.seg;

/* ---------- identidade de cada dia: objeto de capa, frases, transição, luz ---------- */
const DAYCFG={
  seg:{motion:'lift', accent:'spark', cover:'toggle', hero:'emblem', trans:'focus', light:-.32, l1:'O resultado de', tag:'dos nossos alunos', quote:['Disciplina é a ponte','entre metas e conquistas.'], open:['Começando a semana,','Mais um no lucro,','Na sequência,','Firme no processo,']},
  ter:{motion:'slide3d', accent:'ellipse', cover:'cycle', hero:'money',  trans:'bars',  light:.28,  l1:'O resultado de', tag:'dos nossos alunos', quote:['Grandes resultados nascem','de decisões repetidas.'], open:['Terça de resultado,','Também no lucro,','Mais um,','Seguindo firme,']},
  qua:{motion:'flip3d', accent:'brackets', hero:'coin',   trans:'flip',  light:-.22, l1:'O resultado de', tag:'dos nossos alunos', quote:['Quem planta com constância','colhe com abundância.'], open:['Meio da semana,','A turma não para,','Mais um no lucro,','Na sequência,']},
  qui:{motion:'drop', accent:'hash', cover:'toggle', hero:'book',   trans:'square', light:.36,  l1:'O resultado de', tag:'dos nossos alunos', quote:['O mercado premia','quem respeita o processo.'], open:['Quinta de lucro,','Consistência,','Mais um,','Firme no plano,']},
  sex:{motion:'zoomin', accent:'glow', hero:'news',   trans:'shatter', light:-.4,  l1:'O resultado de', tag:'dos nossos alunos', quote:['Fechar bem a semana','é consequência, não sorte.'], open:['Fechando a semana,','Mais um no topo,','Na sequência,','Também no lucro,']},
  sab:{motion:'zoomin', accent:'glow', hero:'pendulum',trans:'zoom',light:.3,   l1:'O resultado da', tag:'de toda a turma', quote:['Uma turma. Um propósito.','Um resultado.'], open:[]}
};
let D=DAYCFG.seg;
function useDay(d){ D=DAYCFG[d]||DAYCFG.seg; P=PALS[d]||PALS.seg; }

/* ---------- utilidades ---------- */
function ls(c,px){ if('letterSpacing' in c) c.letterSpacing=px+'px'; }
function rr(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); }
function txt(c,s,x,y,font,color,align='left',sp=0){ c.font=font; ls(c,sp); c.fillStyle=color; c.textAlign=align; c.textBaseline='middle'; c.fillText(s,x,y); ls(c,0); }
function tw(c,s,font,sp=0){ c.font=font; ls(c,sp); const w=c.measureText(s).width; ls(c,0); return w; }
function fitF(c,s,maxW,mk,size,sp=0,min=14){ let z=size; while(tw(c,s,mk(z),sp)>maxW&&z>min) z-=2; return z; }
function ellip(c,s,maxW,font){ c.font=font; if(c.measureText(s).width<=maxW) return s; while(s.length>1&&c.measureText(s+'…').width>maxW) s=s.slice(0,-1); return s+'…'; }
const iw=i=>i.naturalWidth||i.width, ih=i=>i.naturalHeight||i.height;
function cover(c,img,x,y,w,h){ const sc=Math.max(w/iw(img),h/ih(img)), dw=iw(img)*sc, dh=ih(img)*sc; c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh); }
function coverFocus(c,img,x,y,w,h,p,fx,fy){
  const sc=Math.max(w/iw(img),h/ih(img)), dw=iw(img)*sc, dh=ih(img)*sc;
  const dx=x+(w-dw)/2, dy=y+(h-dh)/2, Px=dx+fx*dw, Py=dy+fy*dh, z=1+1.3*p;
  let tx=Px+(x+w/2-Px)*p, ty=Py+(y+h/2-Py)*p;
  tx=clamp(tx, x+w-(dx+dw-Px)*z, x-(dx-Px)*z); ty=clamp(ty, y+h-(dy+dh-Py)*z, y-(dy-Py)*z);
  c.save(); c.translate(tx,ty); c.scale(z,z); c.translate(-Px,-Py); c.drawImage(img,dx,dy,dw,dh); c.restore();
}
function shadowOn(c,blur=50,oy=26,a=.28){ c.shadowColor=`rgba(0,0,0,${P.dark?Math.min(.75,a*2):a})`; c.shadowBlur=blur*Q; c.shadowOffsetY=oy*Q; c.shadowOffsetX=0; }
function shadowOff(c){ c.shadowColor='rgba(0,0,0,0)'; c.shadowBlur=0; c.shadowOffsetY=0; }
function silhouette(c,cx,cy,r){ c.fillStyle='#BDBAB5'; c.fillRect(cx-r,cy-r,2*r,2*r); c.fillStyle='#8F8B85'; c.beginPath(); c.arc(cx,cy-r*.18,r*.36,0,7); c.fill(); c.beginPath(); c.ellipse(cx,cy+r*.75,r*.68,r*.5,0,0,7); c.fill(); }
function avatar(c,img,cx,cy,r){ c.save(); c.beginPath(); c.arc(cx,cy,r,0,7); c.clip(); if(img){ const k=r*1.1; cover(c,img,cx-k,cy-k,2*k,2*k);} else silhouette(c,cx,cy,r); c.restore(); }
function dashRing(c,cx,cy,r,t,col=P.ink,lw=4,gap=.35){ c.save(); c.translate(cx,cy); c.rotate(t*.8); c.strokeStyle=col; c.lineWidth=lw; c.setLineDash([2,10]); c.beginPath(); c.arc(0,0,r,0,Math.PI*2*(1-gap)); c.stroke(); c.setLineDash([]); c.lineWidth=lw*1.6; c.beginPath(); c.arc(0,0,r+14,Math.PI*1.1,Math.PI*1.45); c.stroke(); c.restore(); }
function brackets(c,x,y,w,h,L=46,col=P.ink,lw=4,a=1){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.strokeStyle=col; c.lineWidth=lw; c.lineCap='square';
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([px,py,sx,sy])=>{ c.beginPath(); c.moveTo(px+sx*L,py); c.lineTo(px,py); c.lineTo(px,py+sy*L); c.stroke(); }); c.restore(); }
function plus(c,x,y,s,a=1,col=P.ink){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.strokeStyle=col; c.lineWidth=2; c.beginPath(); c.moveTo(x-s,y); c.lineTo(x+s,y); c.moveTo(x,y-s); c.lineTo(x,y+s); c.stroke(); c.restore(); }
function sparkle(c,x,y,s,a=1,col=P.ink){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.fillStyle=col; c.beginPath(); c.moveTo(x,y-s); c.quadraticCurveTo(x,y,x+s,y); c.quadraticCurveTo(x,y,x,y+s); c.quadraticCurveTo(x,y,x-s,y); c.quadraticCurveTo(x,y,x,y-s); c.fill(); c.restore(); }
function chevron(c,x,y,s,rot,a=1,col=P.ink){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(x,y); c.rotate(rot); c.fillStyle=col; c.beginPath(); c.moveTo(0,0); c.lineTo(s,s*.18); c.lineTo(s*.62,s*.32); c.lineTo(s*1.05,s*.95); c.lineTo(s*.9,s*1.08); c.lineTo(s*.42,s*.5); c.lineTo(s*.26,s*.9); c.closePath(); c.fill(); c.restore(); }
/* texto com volume: camada de profundidade + sombra suave */
function bigText(c,s,x,y,font,color,align='center',sp=0){ c.save(); c.font=font; ls(c,sp); c.textAlign=align; c.textBaseline='middle';
  const dep=color===P.accent?P.accentD:color===O?OD:(color===WH||color==='#FFFFFF')?'#4A4844':P.depth;
  c.fillStyle='rgba(0,0,0,.18)'; c.fillText(s,x+3,y+10); c.fillStyle=dep; c.fillText(s,x+1.5,y+4); c.fillStyle=color; c.fillText(s,x,y); ls(c,0); c.restore(); }

/* ---------- entradas de texto ---------- */
/* mode: 'blur' (desfocado → nítido), 'rise' (letra por letra subindo), 'type' (digitando), 'ghost' (cinza-fantasma → cor) */
function reveal(c,s,x,y,font,color,t,t0,o={}){
  const dur=o.dur||.55, align=o.align||'center', mode=o.mode||'blur', p=seg(t,t0,t0+dur); if(p<=0) return;
  if(mode==='rise'){ c.font=font; const chars=[...s], ws=chars.map(ch=>c.measureText(ch).width), total=ws.reduce((a,b)=>a+b,0); let cx=align==='center'?x-total/2:align==='right'?x-total:x;
    chars.forEach((ch,k)=>{ const q=back(seg(t,t0+k*.04,t0+k*.04+.45)), qa=seg(t,t0+k*.04,t0+k*.04+.2); if(qa>0){ c.save(); c.globalAlpha*=qa; if(o.big) bigText(c,ch,cx,y+(1-q)*60,font,color,'left'); else txt(c,ch,cx,y+(1-q)*60,font,color,'left'); c.restore(); } cx+=ws[k]; }); return; }
  if(mode==='type'){ const n=Math.max(1,Math.floor([...s].length*p)); const sub=[...s].slice(0,n).join(''); if(o.big) bigText(c,sub,x,y,font,color,align); else txt(c,sub,x,y,font,color,align,o.sp||0); return; }
  if(mode==='ghost'){ const words=s.split(' '), sp=tw(c,' ',font), ws=words.map(w=>tw(c,w,font)), total=ws.reduce((a,b)=>a+b,0)+sp*(words.length-1); let cx=align==='center'?x-total/2:align==='right'?x-total:x;
    words.forEach((w,k)=>{ const a0=seg(t,t0+k*.12,t0+k*.12+.18), a1=eo(seg(t,t0+k*.12+.18,t0+k*.12+.55)); if(a0>0){ c.save(); c.globalAlpha*=a0*(1-a1)*.35; txt(c,w,cx,y,font,P.grey,'left'); c.restore(); c.save(); c.globalAlpha*=a1; txt(c,w,cx,y,font,color,'left'); c.restore(); } cx+=ws[k]+sp; }); return; }
  const e=eo(p); c.save(); const g=c.globalAlpha;
  if(e<1){ for(let k=1;k<=3;k++){ c.globalAlpha=g*.16*(1-e); txt(c,s,x+k*10*(1-e),y+(1-e)*24,font,color,align,o.sp||0); txt(c,s,x-k*10*(1-e),y+(1-e)*24,font,color,align,o.sp||0); } }
  c.globalAlpha=g*e; if(o.big) bigText(c,s,x,y+(1-e)*24,font,color,align,o.sp||0); else txt(c,s,x,y+(1-e)*24,font,color,align,o.sp||0); c.restore(); }
/* etiqueta: a caixa cresce e a palavra é digitada dentro (como "in disguise") */
function tagBox(c,s,x,y,font,t,t0,bg=P.solid,fg=P.onSolid,align='center'){ const p=seg(t,t0,t0+.3); if(p<=0) return; const w=tw(c,s,font,1)+36, h=parseInt(font.match(/(\d+)px/)[1])*1.45, left=align==='center'?x-w/2:align==='right'?x-w:x;
  c.save(); shadowOn(c,16,6,.2); c.fillStyle=bg; c.fillRect(left,y-h/2,w*eo(p),h); shadowOff(c); c.restore();
  const q=seg(t,t0+.25,t0+.75); if(q>0){ const n=Math.max(1,Math.floor([...s].length*q)); txt(c,[...s].slice(0,n).join(''),left+18,y+2,font,fg,'left',1); } }
/* caixa de seleção de editor (tracejada com alças) */
function selectBox(c,x,y,w,h,a,col=P.accent){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.strokeStyle=col; c.lineWidth=2.5; c.setLineDash([7,6]); c.strokeRect(x,y,w,h); c.setLineDash([]);
  c.fillStyle=WH; [[x,y],[x+w,y],[x,y+h],[x+w,y+h],[x+w/2,y],[x+w/2,y+h],[x,y+h/2],[x+w,y+h/2]].forEach(([px,py])=>{ c.fillRect(px-7,py-7,14,14); c.strokeRect(px-7,py-7,14,14); }); c.restore(); }

/* chave liga/desliga com cursor clicando (PREJUÍZO → LUCRO) */
function toggleSwitch(c,cx,cy,t,t0){ const a=eo(seg(t,t0,t0+.4)); if(a<=0) return; const w=520,h=96, on=eo(seg(t,t0+1.0,t0+1.3));
  c.save(); c.globalAlpha*=a; c.translate(cx,cy+(1-a)*30); shadowOn(c,30,14,.3); rr(c,-w/2,-h/2,w,h,h/2); c.fillStyle=P.dark?'#1C1C20':'#FFFFFF'; c.fill(); shadowOff(c); c.strokeStyle=P.dark?'rgba(255,255,255,.12)':'rgba(0,0,0,.08)'; c.lineWidth=2; c.stroke();
  const kx=-w/2+8+(w/2-8)*on; rr(c,kx,-h/2+8,w/2-8,h-16,(h-16)/2); c.fillStyle=on>.5?O:'#2A2A2E'; c.fill();
  txt(c,'PREJUÍZO',-w/4,2,fBlack(30),on>.5?(P.dark?'#77736E':'#9A9792'):WH,'center',2); txt(c,'LUCRO',w/4,2,fBlack(30),on>.5?WH:(P.dark?'#77736E':'#9A9792'),'center',2);
  const mx=w/4+30-(1-eo(seg(t,t0+.4,t0+.95)))*260, my=34+(1-eo(seg(t,t0+.4,t0+.95)))*120, press=1-.15*Math.sin(Math.PI*seg(t,t0+.95,t0+1.15)); c.save(); c.translate(mx,my); c.scale(press,press);
  c.fillStyle=WH; c.strokeStyle=K; c.lineWidth=3; c.beginPath(); c.moveTo(0,0); c.lineTo(0,46); c.lineTo(12,35); c.lineTo(22,56); c.lineTo(30,52); c.lineTo(20,32); c.lineTo(36,32); c.closePath(); c.fill(); c.stroke(); c.restore(); c.restore(); }
/* palavra trocando dentro da etiqueta */
function cycleTag(c,words,cx,cy,font,t,t0,step=.55){ const a=seg(t,t0,t0+.3); if(a<=0) return; const idx=Math.min(words.length-1,Math.floor((t-t0)/step)), s=words[idx], q=seg(t,t0+idx*step,t0+idx*step+.2);
  const w=tw(c,s,font,1)+44, h=parseInt(font.match(/(\d+)px/)[1])*1.45; c.save(); c.globalAlpha*=a; shadowOn(c,16,6,.2); rr(c,cx-w/2,cy-h/2,w,h,10); c.fillStyle=P.solid; c.fill(); shadowOff(c);
  c.beginPath(); c.rect(cx-w/2,cy-h/2,w,h); c.clip(); txt(c,s,cx,cy+2+(1-eo(q))*h,font,P.onSolid,'center',1); c.restore(); }
/* fotos orbitando num círculo pontilhado */
function orbit(c,imgs,cx,cy,r,t,a,fy=.62){ if(a<=0||!imgs.length) return; c.save(); c.globalAlpha*=a; c.strokeStyle=P.ink; c.globalAlpha*=.35; c.lineWidth=2; c.setLineDash([2,9]); c.beginPath(); c.ellipse(cx,cy,r,r*fy,0,0,7); c.stroke(); c.setLineDash([]); c.restore();
  imgs.slice(0,6).forEach((im,k)=>{ const an=t*.55+k/Math.min(6,imgs.length)*Math.PI*2, x=cx+Math.cos(an)*r, y=cy+Math.sin(an)*r*fy, s=.82+.18*Math.sin(an); c.save(); c.globalAlpha*=a; c.translate(x,y); c.scale(s,s); c.rotate(Math.sin(an)*.15); shadowOn(c,20,10,.3); rr(c,-46,-46,92,92,22); c.fillStyle=WH; c.fill(); shadowOff(c);
    c.save(); rr(c,-40,-40,80,80,18); c.clip(); if(im) cover(c,im,-40,-40,80,80); else silhouette(c,0,0,40); c.restore(); c.restore(); }); }
/* barra de progresso com marcador */
function slider(c,x1,x2,y,p,col,track){ c.save(); c.strokeStyle=track; c.lineWidth=4; c.lineCap='round'; c.beginPath(); c.moveTo(x1,y); c.lineTo(x2,y); c.stroke(); c.strokeStyle=col; c.beginPath(); c.moveTo(x1,y); c.lineTo(x1+(x2-x1)*p,y); c.stroke();
  c.fillStyle=col; shadowOn(c,10,3,.3); c.beginPath(); c.arc(x1+(x2-x1)*p,y,11,0,7); c.fill(); shadowOff(c); c.restore(); }
/* palavra grande que se espalha ao sair */
function scatterWord(c,s,x,y,font,color,k){ c.font=font; const chars=[...s], ws=chars.map(ch=>c.measureText(ch).width), total=ws.reduce((a,b)=>a+b,0); let cx=x-total/2;
  chars.forEach((ch,i)=>{ const dx=(RND(i*7)-.5)*700*k, dy=(RND(i*13)-.6)*600*k, rot=(RND(i*3)-.5)*2.4*k; c.save(); c.globalAlpha*=1-k; c.translate(cx+ws[i]/2+dx,y+dy); c.rotate(rot); bigText(c,ch,0,0,font,color,'center'); c.restore(); cx+=ws[i]; }); }
/* fotos grandes e desfocadas nos cantos (profundidade) */
function cornerDecor(c,t){ const list=(MODE==='week'?(WK?WK.rank:[]):S).filter(s=>s._at||s._ab); if(!list.length) return;
  [[-90,1470,420,0],[930,420,380,1]].forEach(([x,y,sz,k])=>{ const s=list[k%list.length], im=s._ab||s._at; if(!im) return; c.save(); c.globalAlpha=P.dark?.14:.18; c.translate(x+Math.sin(t*.4+k)*16,y+Math.cos(t*.3+k)*12); c.rotate(.2-k*.4); c.beginPath(); c.arc(0,0,sz/2,0,7); c.clip(); cover(c,im,-sz/2,-sz/2,sz,sz); c.restore(); }); }

/* ---------- imagens ---------- */
const cache=new Map();
function getImg(src,max){ if(!src) return Promise.resolve(null); const key=src+'|'+max; if(cache.has(key)) return cache.get(key);
  const p=(async()=>{ let bmp=null; try{ const r=await fetch(src); if(!r.ok) throw 0; bmp=await createImageBitmap(await r.blob()); }catch(e){ bmp=await new Promise(res=>{const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src;}); }
    if(!bmp) return null; const w0=iw(bmp),h0=ih(bmp), sc=Math.min(1,max/Math.max(w0,h0)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w0*sc)); c.height=Math.max(1,Math.round(h0*sc)); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height); return c; })();
  cache.set(key,p); return p; }
function tiny(img,f=14){ if(!img) return null; const c=document.createElement('canvas'); c.width=Math.max(4,Math.round(iw(img)/f)); c.height=Math.max(4,Math.round(ih(img)/f)); c.getContext('2d').drawImage(img,0,0,c.width,c.height); return c; }
function tinted(img,col){ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,c.width,c.height); return c; }
function makeLeaf(){ const w=420,h=520, c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.fillStyle='#000'; g.translate(60,500); g.rotate(-.7);
  g.lineWidth=6; g.strokeStyle='#000'; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(120,-260,330,-420); g.stroke();
  for(let k=1;k<15;k++){ const q=k/15, px=330*q*q*.9+q*30, py=-420*q+Math.sin(q*3)*20; for(const sd of [-1,1]){ g.save(); g.translate(px,py); g.rotate(sd*(1.1-q*.4)-.6); g.beginPath(); g.ellipse(0,-60*(1-q*.4),12*(1-q*.3),70*(1-q*.4),0,0,7); g.fill(); g.restore(); } }
  const s=document.createElement('canvas'); s.width=w/10; s.height=h/10; s.getContext('2d').drawImage(c,0,0,s.width,s.height); return s; }
async function loadLogo(){ if(!LOGO){ LOGO=await getImg('assets/logo.png',700); if(LOGO) LOGOD=tinted(LOGO,K); }
  if(!GRAIN){ GRAIN=document.createElement('canvas'); GRAIN.width=GRAIN.height=256; const g=GRAIN.getContext('2d'), id=g.createImageData(256,256); for(let i=0;i<id.data.length;i+=4){ const v=Math.random()*255; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } g.putImageData(id,0,0); }
  if(!LEAF) LEAF=makeLeaf(); }
/* dark=true desenha o logo preto; 'auto' segue o fundo do dia */
function logo(c,cx,cy,w,dark='auto',a=1){ const useDark=dark==='auto'?P.logoDark:dark; const L=useDark?LOGOD:LOGO; if(!L||a<=0) return 0; const h=w*L.height/L.width; c.save(); c.globalAlpha*=a; c.drawImage(L,cx-w/2,cy-h/2,w,h); c.restore(); return h; }

/* ---------- melhoria automática do print ---------- */
function enhance(cv2){
  const c=cv2.getContext('2d'), w=cv2.width, h=cv2.height, id=c.getImageData(0,0,w,h), d=id.data, n=w*h;
  const hist=new Uint32Array(256); for(let i=0;i<d.length;i+=4) hist[(d[i]*77+d[i+1]*150+d[i+2]*29)>>8]++;
  let lo=0,hi=255,acc=0; const cut=n*.004; while(lo<254&&(acc+=hist[lo])<cut) lo++; acc=0; while(hi>1&&(acc+=hist[hi])<cut) hi--;
  if(hi-lo<40){lo=0;hi=255;} const sc=255/(hi-lo);
  for(let i=0;i<d.length;i+=4){ let r=(d[i]-lo)*sc,g=(d[i+1]-lo)*sc,b=(d[i+2]-lo)*sc; const l=.299*r+.587*g+.114*b; d[i]=l+(r-l)*1.12; d[i+1]=l+(g-l)*1.12; d[i+2]=l+(b-l)*1.12; }
  const src=new Uint8ClampedArray(d), tmp=new Uint8ClampedArray(d.length), blr=new Uint8ClampedArray(d.length);
  for(let y=0;y<h;y++){ const o=y*w*4; for(let x=0;x<w;x++){ const a=o+Math.max(0,x-1)*4, b=o+x*4, e=o+Math.min(w-1,x+1)*4; tmp[b]=(src[a]+src[b]+src[e])/3; tmp[b+1]=(src[a+1]+src[b+1]+src[e+1])/3; tmp[b+2]=(src[a+2]+src[b+2]+src[e+2])/3; } }
  for(let y=0;y<h;y++){ const ya=Math.max(0,y-1)*w*4, yb=y*w*4, ye=Math.min(h-1,y+1)*w*4; for(let x=0;x<w*4;x+=4){ blr[yb+x]=(tmp[ya+x]+tmp[yb+x]+tmp[ye+x])/3; blr[yb+x+1]=(tmp[ya+x+1]+tmp[yb+x+1]+tmp[ye+x+1])/3; blr[yb+x+2]=(tmp[ya+x+2]+tmp[yb+x+2]+tmp[ye+x+2])/3; } }
  for(let i=0;i<d.length;i+=4){ d[i]=src[i]+.65*(src[i]-blr[i]); d[i+1]=src[i+1]+.65*(src[i+1]-blr[i+1]); d[i+2]=src[i+2]+.65*(src[i+2]-blr[i+2]); }
  c.putImageData(id,0,0);
}

/* =====================================================================
   FUNDO: luz de persiana, folhagem e curvas
   ===================================================================== */
function paper(c,t){
  const g=c.createRadialGradient(540,760,200,540,960,1300); g.addColorStop(0,P.bg[0]); g.addColorStop(1,P.bg[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.save(); c.translate(540,960); c.rotate(D.light); c.translate(-900,-1400);
  for(let k=0;k<7;k++){ const x=k*300+((t*14)%300); const gr=c.createLinearGradient(x,0,x+170,0); gr.addColorStop(0,`rgba(${P.shade},0)`); gr.addColorStop(.5,`rgba(${P.shade},${P.dark?.05:.075})`); gr.addColorStop(1,`rgba(${P.shade},0)`); c.fillStyle=gr; c.fillRect(x,0,170,2800); }
  c.restore();
  if(LEAF&&!P.dark){ c.save(); c.globalAlpha=.10; const sw=Math.sin(t*.7)*.04; c.translate(-40,140); c.rotate(sw); c.drawImage(LEAF,0,0,560,700); c.restore(); c.save(); c.globalAlpha=.08; c.translate(1120,1500); c.rotate(Math.PI+.4-sw); c.drawImage(LEAF,0,0,520,650); c.restore(); }
  c.save(); c.globalAlpha=P.dark?.10:.08; c.strokeStyle=P.ink; c.lineWidth=40; c.lineCap='round'; c.beginPath(); c.moveTo(-100,1520); c.quadraticCurveTo(540,1300+Math.sin(t*.5)*30,1180,1560); c.stroke(); c.restore();
  c.save(); c.globalAlpha=.08; c.strokeStyle=P.ink; c.lineWidth=1.5; c.beginPath(); c.arc(1040,560,520,Math.PI*.55,Math.PI*1.25); c.stroke(); c.beginPath(); c.arc(40,1380,460,-Math.PI*.4,Math.PI*.3); c.stroke(); c.restore();
}
function grain(c,t){ if(!GRAIN) return; c.save(); c.globalAlpha=P.dark?.05:.035; c.globalCompositeOperation=P.dark?'screen':'multiply'; const ox=-Math.floor(RND(Math.floor(t*12))*256), oy=-Math.floor(RND(Math.floor(t*12)+5)*256); for(let x=ox;x<W;x+=256) for(let y=oy;y<H;y+=256) c.drawImage(GRAIN,x,y); c.restore(); }
function topMark(c){ logo(c,540,300,150,'auto',.9); }

/* ---------- cartão flutuante (com canto dobrando) e base 3D ---------- */
function floatCard(c,x,y,w,h,r=36,fill=P.card,curl=0){ c.save(); shadowOn(c,70,34,.30); rr(c,x,y,w,h,r); c.fillStyle=fill; c.fill(); shadowOff(c);
  const g=c.createLinearGradient(x,y,x,y+h); g.addColorStop(0,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(0,0,0,.12)'); c.strokeStyle=g; c.lineWidth=3; c.stroke(); c.restore();
  if(curl>0) pageCurl(c,x,y,curl,fill); }
function pageCurl(c,x,y,s,fill){ // orelha de página no canto superior esquerdo
  c.save(); c.fillStyle=P.bg[0]; c.beginPath(); c.moveTo(x-2,y-2); c.lineTo(x+s+4,y-2); c.lineTo(x-2,y+s+4); c.closePath(); c.fill();
  shadowOn(c,24,10,.35); const g=c.createLinearGradient(x+s,y,x+s*.55,y+s*.55); g.addColorStop(0,'#BDBAB5'); g.addColorStop(.6,P.dark?'#3A3A40':'#EDEBE7'); g.addColorStop(1,'#FFFFFF');
  c.fillStyle=g; c.beginPath(); c.moveTo(x+s,y); c.lineTo(x,y+s); c.quadraticCurveTo(x+s*.35,y+s*.35,x+s*.72,y+s*.72); c.closePath(); c.fill(); shadowOff(c); c.restore(); }
function slab(c,x,y,w,h,r=28,dep=26){ // base 3D com profundidade
  c.save(); shadowOn(c,50,30,.35); rr(c,x,y+dep,w,h,r); c.fillStyle=P.plateSide; c.fill(); shadowOff(c);
  rr(c,x,y,w,h,r); const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,P.plate[0]); g.addColorStop(1,P.plate[1]); c.fillStyle=g; c.fill();
  const hl=c.createLinearGradient(0,y,0,y+30); hl.addColorStop(0,'rgba(255,255,255,.28)'); hl.addColorStop(1,'rgba(255,255,255,0)'); c.strokeStyle=hl; c.lineWidth=3; c.stroke(); c.restore(); }
/* foto flutuante inclinada (como as fotos laterais da referência) */
function photoFrame(c,img,cx,cy,w,h,rot,a=1,blur=0){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.rotate(rot); shadowOn(c,30,16,.35); c.fillStyle=WH; c.fillRect(-w/2-8,-h/2-8,w+16,h+16); shadowOff(c);
  if(img){ c.save(); c.beginPath(); c.rect(-w/2,-h/2,w,h); c.clip(); cover(c,img,-w/2,-h/2,w,h); c.restore(); } else silhouette(c,0,0,w/2); c.restore(); }

/* =====================================================================
   OBJETOS DE CAPA (um por dia)
   ===================================================================== */
function heroEmblem(c,cx,cy,t,a){ const k=back(seg(t,.2,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(k,k);
  shadowOn(c,60,30,.35); c.fillStyle=P.solid; c.beginPath(); c.arc(0,0,190,0,7); c.fill(); shadowOff(c);
  logo(c,0,6,250,P.onSolid===K); c.restore(); dashRing(c,cx,cy,236*k,t,P.ink,4,.3); }
function bundle(c,x,y,w,d,h){
  c.fillStyle='#E4DFD3'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+w,y-w*.5); c.lineTo(x+w+d,y-w*.5+d*.5); c.lineTo(x+d,y+d*.5); c.closePath(); c.fill();
  c.fillStyle='#CFC8B8'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+d,y+d*.5); c.lineTo(x+d,y+d*.5+h); c.lineTo(x,y+h); c.closePath(); c.fill();
  c.fillStyle='#ADA595'; c.beginPath(); c.moveTo(x+d,y+d*.5); c.lineTo(x+w+d,y-w*.5+d*.5); c.lineTo(x+w+d,y-w*.5+d*.5+h); c.lineTo(x+d,y+d*.5+h); c.closePath(); c.fill();
  c.strokeStyle='rgba(0,0,0,.1)'; c.lineWidth=1; for(let k=1;k<5;k++){ const yy=k*h/5; c.beginPath(); c.moveTo(x,y+yy); c.lineTo(x+d,y+d*.5+yy); c.lineTo(x+w+d,y-w*.5+d*.5+yy); c.stroke(); }
  const m=.45; c.fillStyle=O; c.beginPath(); c.moveTo(x+w*m,y-w*m*.5); c.lineTo(x+w*m+d,y-w*m*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5); c.lineTo(x+w*(m+.14),y-w*(m+.14)*.5); c.closePath(); c.fill();
  c.fillStyle=OD; c.beginPath(); c.moveTo(x+w*m+d,y-w*m*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5+h); c.lineTo(x+w*m+d,y-w*m*.5+d*.5+h); c.closePath(); c.fill(); }
function heroMoney(c,cx,cy,t,a){ c.save(); c.globalAlpha*=a;
  c.save(); const sg=c.createRadialGradient(cx+40,cy+170,10,cx+40,cy+170,330); sg.addColorStop(0,'rgba(0,0,0,.35)'); sg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=sg; c.beginPath(); c.ellipse(cx+40,cy+170,330,90,0,0,7); c.fill(); c.restore();
  [[-130,60],[30,-20],[30,140],[190,60]].forEach(([dx,dy],i)=>{ for(let l=0;l<4;l++){ const k=back(seg(t,.15+i*.08+l*.06,.6+i*.08+l*.06)); if(k<=0) continue; bundle(c,cx+dx-140,cy+dy-l*42-(1-k)*500,170,100,42); } });
  for(let k=0;k<7;k++){ const p=seg(t,.2+k*.18,1.7+k*.18); if(p<=0||p>=1) continue; const x=cx-380+RND(k)*760+Math.sin(p*6+k)*40, y=cy-440+p*640; c.save(); c.translate(x,y); c.rotate(p*5+k); c.scale(1,Math.abs(Math.cos(p*7+k))+.15); c.globalAlpha*=(1-p)*.9; c.fillStyle='#DDD7CA'; c.fillRect(-64,-30,128,60); c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=2; c.strokeRect(-54,-20,108,40); c.fillStyle=O; c.beginPath(); c.arc(0,0,10,0,7); c.fill(); c.restore(); }
  c.restore(); }
function heroCoin(c,cx,cy,t,a){ const k=eo(seg(t,.1,.8)); if(k<=0) return; c.save(); c.globalAlpha*=a*k; const ang=t*1.6, wv=Math.cos(ang), r=200, ww=Math.max(6,r*Math.abs(wv));
  shadowOn(c,50,40,.3); c.fillStyle='#8E8A84'; c.beginPath(); c.ellipse(cx+Math.sin(ang)*14,cy,ww,r,0,0,7); c.fill(); shadowOff(c);
  const g=c.createLinearGradient(cx-ww,cy-r,cx+ww,cy+r); g.addColorStop(0,'#F7F6F4'); g.addColorStop(.45,'#BDB9B2'); g.addColorStop(1,'#6E6A64'); c.fillStyle=g; c.beginPath(); c.ellipse(cx,cy,ww,r,0,0,7); c.fill();
  c.strokeStyle='rgba(60,58,55,.7)'; c.lineWidth=5; c.beginPath(); c.ellipse(cx,cy,ww*.86,r*.86,0,0,7); c.stroke();
  c.save(); c.translate(cx,cy); c.scale(Math.max(.04,Math.abs(wv)),1); if(wv>0) logo(c,0,0,250,true,.85); else txt(c,'R$',0,4,fSerifB(150),'rgba(40,38,35,.8)','center'); c.restore();
  c.restore(); dashRing(c,cx,cy,250,t*.6,O,3,.45); }
function heroBook(c,cx,cy,t,a){ const k=back(seg(t,.1,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a;
  c.save(); c.globalAlpha*=.35; c.fillStyle=P.ink; for(let i=-7;i<=7;i++) for(let j=-6;j<=6;j++) if((i+j)%2===0) c.fillRect(cx+i*34-2,cy+j*34-2,3,3); c.restore();
  const w=290,h=390,dep=44; c.translate(cx,cy+(1-k)*300); c.rotate(-.12+Math.sin(t*.6)*.05); const sx=.82+.18*Math.cos(t*.9);
  shadowOn(c,60,40,.35); c.fillStyle='#ECE8DF'; c.fillRect(-w/2*sx,-h/2+10,w*sx+dep,h-14); shadowOff(c);
  c.fillStyle='#F7F4ED'; c.fillRect(w/2*sx,-h/2+10,dep,h-14); c.strokeStyle='rgba(0,0,0,.14)'; c.lineWidth=1; for(let l=1;l<9;l++){ const x=w/2*sx+l*dep/9; c.beginPath(); c.moveTo(x,-h/2+12); c.lineTo(x,h/2-6); c.stroke(); }
  const cov=P.solid===O?[O,OD]:['#2C2C30','#0B0B0D'], g=c.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0,cov[0]); g.addColorStop(1,cov[1]); c.fillStyle=g; rr(c,-w/2*sx,-h/2,w*sx,h,10); c.fill();
  const fg=P.solid===O?K:WH, ac=P.solid===O?WH:O;
  c.save(); c.scale(sx,1); c.strokeStyle=ac; c.lineWidth=3; c.strokeRect(-w/2+20,-h/2+20,w-40,h-40); logo(c,0,-50,180,fg===K); txt(c,'DIÁRIO',0,88,fBlack(38),fg,'center',6); txt(c,'DO TRADER',0,130,fBold(20),ac,'center',6); c.restore();
  c.restore(); }
function heroNews(c,cx,cy,t,a){ const k=back(seg(t,.1,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy+(1-k)*700); c.rotate(-.06+(1-k)*.5+Math.sin(t*.7)*.01);
  const w=580,h=530; shadowOn(c,60,36,.35); c.fillStyle='#F5F2EC'; c.fillRect(-w/2,-h/2,w,h); shadowOff(c);
  txt(c,'ÚLTIMAS NOTÍCIAS',0,-h/2+48,fSerifB(46),K,'center',1); c.fillStyle=K; c.fillRect(-w/2+24,-h/2+82,w-48,3); c.fillRect(-w/2+24,-h/2+90,w-48,1);
  txt(c,'TRADER SCHOOL · '+(days[curDay]?days[curDay].date:''),0,-h/2+110,fBold(15),'#6E6B67','center',3);
  const top=S[0]; c.save(); c.beginPath(); c.rect(-w/2+24,-h/2+130,300,250); c.clip(); if(top&&top._p) coverFocus(c,top._p,-w/2+24,-h/2+130,300,250,.55,top.fx,top.fy); else { c.fillStyle='#CFCBC4'; c.fillRect(-w/2+24,-h/2+130,300,250); } c.restore();
  c.fillStyle='rgba(0,0,0,.16)'; for(let l=0;l<11;l++) c.fillRect(-w/2+344,-h/2+134+l*22,210-(l%3)*30,8);
  txt(c,'A TURMA FECHOU',-w/2+24,h/2-106,fBlack(36),K,'left'); txt(c,'A SEXTA NO LUCRO',-w/2+24,h/2-64,fBlack(36),O,'left');
  c.fillStyle='rgba(0,0,0,.16)'; for(let l=0;l<2;l++) c.fillRect(-w/2+24,h/2-34+l*16,w-48-(l*140),7);
  c.restore(); }
function heroPendulum(c,cx,cy,t,a){ c.save(); c.globalAlpha*=a; const ox=880, oy=-120, L=900, ang=.12+Math.sin(t*1.6)*.22*(1-seg(t,3,5)*.6), px=ox-Math.sin(ang)*L, py=oy+Math.cos(ang)*L;
  c.strokeStyle=P.solid; c.lineWidth=16; c.lineCap='round'; c.beginPath(); c.moveTo(ox,oy); c.lineTo(px,py); c.stroke();
  c.save(); c.translate(px,py); c.rotate(ang); shadowOn(c,50,30,.35); rr(c,-110,-110,220,220,44); c.fillStyle=P.solid; c.fill(); shadowOff(c); logo(c,0,0,170,P.onSolid===K); c.restore(); c.restore(); }
const HEROES={emblem:heroEmblem,money:heroMoney,coin:heroCoin,book:heroBook,news:heroNews,pendulum:heroPendulum};

/* =====================================================================
   CENAS
   ===================================================================== */
function dateLabel(){ return MODE==='week'?(WK?WK.range:''):(days[curDay]?days[curDay].date:''); }
function pill(c,s,cx,cy,font,bg=P.solid,fg=P.onSolid,sp=4){ const w=tw(c,s,font,sp)+70, h=parseInt(font.match(/(\d+)px/)[1])*1.9; c.save(); shadowOn(c,26,12,.25); rr(c,cx-w/2,cy-h/2,w,h,h/2); c.fillStyle=bg; c.fill(); shadowOff(c); c.restore(); txt(c,s,cx,cy+2,font,fg,'center',sp); }
function corners(c,k){ chevron(c,110,380,120,0,k); chevron(c,970,1440,120,Math.PI,k); }

/* capa */
function sceneCover(c,t){
  const th=THEMES[curDay];
  reveal(c,D.l1,540,430,fSerif(58),P.ink2,t,.15,{mode:'ghost'});
  HEROES[D.hero](c,540,D.hero==='pendulum'?640:740,t,1);
  const word=th.word, fz=fitF(c,word,900,fBlack,190), out=seg(t,(MODE==='week'?5.4:4.6)-.75,(MODE==='week'?5.4:4.6)-.05);
  if(out>0) scatterWord(c,word,540,1085,fBlack(fz),P.ink,eo(out)); else reveal(c,word,540,1085,fBlack(fz),P.ink,t,.9,{mode:'rise',big:true});
  if(D.cover==='toggle') toggleSwitch(c,540,1205,t,1.3);
  else if(D.cover==='cycle') cycleTag(c,['sem sorte','com disciplina',D.tag],540,1198,fSerif(52),t,1.4);
  else tagBox(c,D.tag,540,1198,fSerif(52),t,1.45);
  if(t>1.9){ const k=eo(seg(t,1.9,2.4)); c.save(); c.globalAlpha*=k; txt(c,dateLabel(),540,1300+(1-k)*20,fBlack(40),P.accent,'center',8); c.restore(); }
  reveal(c,HANDLE,540,1390,fMed(30),P.grey,t,2.3,{mode:'type',dur:.7});
  corners(c,eo(seg(t,.3,.8)));
  sparkle(c,880,470,22,eo(seg(t,1,1.4))); sparkle(c,200,1180,16,eo(seg(t,1.3,1.7))); plus(c,940,980,14,eo(seg(t,1.2,1.6))); plus(c,150,860,14,eo(seg(t,1.4,1.8)));
}
/* destaque do dia */
function sceneHL(c,t){ const s=S[0], CY=790;
  reveal(c,'O destaque',540,402,fSerif(58),P.ink2,t,.1,{mode:'ghost'});
  reveal(c,'DO DIA',540,476,fBlack(80),P.ink,t,.35,{mode:'rise',big:true});
  orbit(c,S.slice(1).map(s=>s._a),540,CY,330,t,eo(seg(t,.9,1.5)),.5);
  const k=back(seg(t,.3,1.0)); if(k>0){ c.save(); c.translate(540,CY); c.scale(k,k); shadowOn(c,60,30,.35); c.fillStyle=P.solid; c.beginPath(); c.arc(0,0,192,0,7); c.fill(); shadowOff(c);
    const bk=seg(t,.3,.9); if(s._a){ c.save(); c.beginPath(); c.arc(0,0,180,0,7); c.clip(); if(bk<1&&s._at){ c.globalAlpha*=1-bk; cover(c,s._at,-198,-198,396,396); c.globalAlpha=bk; } cover(c,s._a,-198,-198,396,396); c.restore(); } else avatar(c,null,0,0,180); c.restore(); dashRing(c,540,CY,224*k,t,O,5,.3); }
  sparkle(c,850,600,22,eo(seg(t,.9,1.3))); plus(c,220,640,14,eo(seg(t,1,1.4))); plus(c,870,960,14,eo(seg(t,1.1,1.5)));
  reveal(c,'Parabéns,',540,1072,fSerif(62),P.ink2,t,1.0,{mode:'ghost'});
  const nm=s.name.toUpperCase(), nf=fBlack(fitF(c,nm,860,fBlack,112)), nw=tw(c,nm,nf);
  reveal(c,nm,540,1160,nf,P.ink,t,1.25,{mode:'rise',big:true});
  selectBox(c,540-nw/2-22,1104,nw+44,112,eo(seg(t,1.6,1.9))*(1-seg(t,3.2,3.6)),P.accent);
  tagBox(c,'+'+brl(s.value),540,1280,fBlack(fitF(c,'+'+brl(s.value),760,fBlack,62)),t,1.9,P.solid===WH?O:P.solid,P.solid===WH?K:P.onSolid);
  reveal(c,D.quote[0],540,1376,fSerif(34),P.grey,t,2.3,{mode:'ghost'}); reveal(c,D.quote[1],540,1420,fSerif(34),P.grey,t,2.5,{mode:'ghost'});
}
/* entrada do cartão: cada dia com um movimento */
function cardIn(c,u,i,cy,k,tilt){ const m=D.motion, sd=i%2?1:-1;
  if(m==='slide3d'){ const q=eo(seg(u,0,.7)); c.translate(540+(1-q)*760*sd,cy); c.transform(.7+.3*q,(1-q)*-.22*sd,0,1,0,0); c.translate(-540,-cy); return; }
  if(m==='flip3d'){ const q=back(seg(u,0,.75)), sx=Math.max(.03,Math.min(1.04,q)); c.translate(540,cy); c.transform(sx,(1-Math.min(1,q))*.16*sd,0,1,0,0); c.translate(-540,-cy); return; }
  if(m==='drop'){ const q=back(seg(u,0,.7)); c.translate(540,cy-(1-q)*1000); c.rotate((1-q)*.3*sd); c.translate(-540,-cy); return; }
  if(m==='zoomin'){ const q=eo(seg(u,0,.6)), z=1.45-.45*q; c.translate(540,cy); c.scale(z,z); c.rotate((1-q)*.05*sd); c.translate(-540,-cy); return; }
  c.translate(540,cy+(1-k)*140); c.rotate(tilt); c.translate(-540,-cy); }
/* lupa: entra pelo canto, para sobre o "Res. do Dia" e amplia o valor */
function magnifier(c,s,px,py,pw,ph,zp,u){ const a=eo(seg(u,1.45,2.05))*(1-eo(seg(u,3.7,4.2))); if(a<=0) return;
  const R=Math.min(200,pw*.27), tx=px+pw/2, ty=py+ph/2, lx=tx+(1-a)*(pw*.7)+Math.sin(u*2.2)*6*a, ly=ty+(1-a)*(ph*.75)+Math.cos(u*1.8)*5*a, mag=1.3;
  c.save(); c.globalAlpha*=Math.min(1,a*1.6);
  c.save(); shadowOn(c,40,22,.45); c.beginPath(); c.arc(lx,ly,R+12,0,7); c.fillStyle='#111'; c.fill(); shadowOff(c); c.restore();
  c.save(); c.beginPath(); c.arc(lx,ly,R,0,7); c.clip(); c.fillStyle='#fff'; c.fillRect(lx-R,ly-R,2*R,2*R);
  c.translate(lx,ly); c.scale(mag,mag); c.translate(-lx,-ly); coverFocus(c,s._p,px,py,pw,ph,Math.max(zp,.001),s.fx,s.fy); c.restore();
  c.save(); c.beginPath(); c.arc(lx,ly,R,0,7); c.clip(); const g=c.createLinearGradient(lx-R,ly-R,lx+R*.2,ly+R*.2); g.addColorStop(0,'rgba(255,255,255,.35)'); g.addColorStop(.35,'rgba(255,255,255,.06)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(lx-R,ly-R,2*R,2*R); c.restore();
  c.lineWidth=14; c.strokeStyle=K; c.beginPath(); c.arc(lx,ly,R+5,0,7); c.stroke(); c.lineWidth=5; c.strokeStyle=O; c.beginPath(); c.arc(lx,ly,R+5,0,7); c.stroke();
  c.save(); c.translate(lx,ly); c.rotate(Math.PI/4); shadowOn(c,20,10,.4); rr(c,R+8,-13,34,26,6); c.fillStyle='#2A2A2E'; c.fill(); rr(c,R+38,-19,R*.95,38,19); c.fillStyle=O; c.fill(); shadowOff(c); c.fillStyle='rgba(255,255,255,.25)'; rr(c,R+46,-14,R*.8,9,4); c.fill(); c.restore();
  c.restore(); }
/* destaque do valor na placa (um estilo por dia) */
function valueAccent(c,x,y,w,u){ const ac=D.accent, p=seg(u,2.05,2.75); if(p<=0) return; const col=P.plateAccent, out=1-seg(u,4.0,4.4); if(out<=0) return;
  c.save(); c.globalAlpha*=out;
  if(ac==='ellipse'){ c.strokeStyle=col; c.lineWidth=5; c.lineCap='round'; c.beginPath(); const e=eo(p); for(let q=0;q<=e;q+=.01){ const an=-2.6+q*Math.PI*2.15, ex=x+w/2+Math.cos(an)*(w/2+34)*(1+.03*Math.sin(q*9)), ey=y-2+Math.sin(an)*54; if(q===0) c.moveTo(ex,ey); else c.lineTo(ex,ey); } c.stroke(); }
  else if(ac==='brackets'){ const e=back(p); brackets(c,x-24,y-52,w+48,104,30*e,col,5,Math.min(1,e)); }
  else if(ac==='hash'){ [[x+w-14,y-60,.2],[x+w+24,y-46,-.15]].forEach(([hx,hy,r],k)=>{ const e=back(seg(u,2.05+k*.12,2.5+k*.12)); if(e<=0) return; c.save(); c.translate(hx,hy); c.rotate(r); c.scale(e,e); txt(c,'#',0,0,fBlack(36),col,'center'); c.restore(); }); }
  else if(ac==='spark'){ sparkle(c,x+w+34,y-34,22*back(p),1,col); sparkle(c,x+w+70,y+6,13*back(seg(u,2.2,2.8)),1,col); }
  c.restore(); }
/* aluno */
function sceneStudent(c,i,u,run){ const s=S[i];
  const k=eo(seg(u,0,.6)), tilt=(1-k)*.06*(i%2?1:-1), x=120,y=360,w=840,h=800;
  c.save(); cardIn(c,u,i,y+h/2,k,tilt); c.globalAlpha*=seg(u,0,.25);
  floatCard(c,x,y,w,h,36,P.card,70*eo(seg(u,.3,.8)));
  const open=i===0?'O destaque do dia,':(D.open[(i-1)%D.open.length]||'Mais um,');
  reveal(c,open,x+70,y+78,fSerif(42),P.cardSub,u,.25,{mode:'ghost',align:'left'});
  const nm=s.name.toUpperCase(); reveal(c,nm,x+66,y+152,fBlack(fitF(c,nm,w-300,fBlack,82)),P.cardInk,u,.4,{mode:'rise',align:'left',big:true});
  if(s.handle&&s.handle.length>1) tagBox(c,s.handle,x+66,y+216,fMed(26),u,.75,P.cardAccent,P.cardAccent===WH?K:WH,'left');
  const px=x+40,py=y+262,pw=w-80,ph=h-302, zp=eo(seg(u,1.0,2.0))-eo(seg(u,3.8,4.4)), fin=seg(u,.35,.95);
  c.save(); shadowOn(c,40,20,.3); rr(c,px,py,pw,ph,22); c.fillStyle='#1A1A1D'; c.fill(); shadowOff(c); c.clip();
  if(s._p){ coverFocus(c,s._p,px,py,pw,ph,zp,s.fx,s.fy); if(fin<1&&s._pt){ c.globalAlpha=1-eo(fin); cover(c,s._pt,px-20,py-20,pw+40,ph+40); c.globalAlpha=1; } } else txt(c,'PRINT DO ALUNO',px+pw/2,py+ph/2,fBold(36),'#888','center',4);
  const sh=seg(u,2.2,2.9); if(sh>0&&sh<1){ c.globalCompositeOperation='lighter'; c.translate(px-300+sh*(pw+600),py+ph/2); c.rotate(-.35); const g=c.createLinearGradient(-110,0,110,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.25)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(-110,-ph,220,ph*2); }
  c.restore();
  if(s._p) magnifier(c,s,px,py,pw,ph,zp,u);
  brackets(c,px-18,py-18,pw+36,ph+36,40,P.cardInk,3,eo(seg(u,.6,1.0)));
  c.restore();
  /* foto do aluno flutuando, ligada ao nome por uma linha curva */
  const ka=back(seg(u,.5,1.1)); if(ka>0){ const fx=860, fy=y+120; c.save(); c.globalAlpha*=seg(u,.5,.8); c.strokeStyle=P.cardSub; c.lineWidth=2; c.setLineDash([4,6]); c.beginPath(); c.moveTo(x+w-310,y+150); c.quadraticCurveTo(fx-120,fy-90,fx-70,fy-30); c.stroke(); c.setLineDash([]); c.restore();
    c.save(); c.translate(fx,fy); c.scale(ka,ka); photoFrame(c,s._a,0,0,140,160,.08*(i%2?-1:1)); c.restore(); }
  const kp=eo(seg(u,.6,1.1)); c.save(); c.translate(0,(1-kp)*80); c.globalAlpha*=kp;
  slab(c,90,1210,900,210);
  txt(c,'RESULTADO DO DIA',140,1262,fBold(24),P.plateSub,'left',6);
  const pop=1+.12*Math.sin(Math.PI*seg(u,2.0,2.35)), vf=fBlack(fitF(c,'+'+brl(s.value),500,fBlack,86));
  const vw=tw(c,'+R$ '+brl(s.value).slice(3),vf), ga=D.accent==='glow'?Math.sin(Math.PI*seg(u,2.0,3.2)):0;
  c.save(); c.translate(140,1340); c.scale(pop,pop); if(ga>0){ c.shadowColor=P.plateAccent; c.shadowBlur=40*ga*Q; } txt(c,'+R$',0,0,vf,P.plateAccent,'left'); txt(c,brl(s.value).slice(3),tw(c,'+R$ ',vf),0,vf,P.plateText,'left'); c.restore();
  valueAccent(c,140,1340,vw,u);
  const rv=brl(run(u)); txt(c,'TURMA HOJE',940,1275,fBold(22),P.plateSub,'right',5); txt(c,rv,940,1325,fBlack(fitF(c,rv,330,fBlack,40)),P.plateText,'right'); txt(c,pad2(i+1)+' / '+pad2(S.length),940,1381,fBold(22),P.plateAccent,'right',4);
  slider(c,140,780,1384,(i+eo(seg(u,.8,2)))/S.length,P.plateAccent,P.plateSub);
  c.restore();
}
/* encerramento do dia */
function sceneOut(c,o){ const total=S.reduce((a,s)=>a+s.value,0), n=Math.min(S.length,5);
  for(let k=n-1;k>=0;k--){ const s=S[k], a=back(seg(o,.2+k*.12,.8+k*.12)); if(a<=0) continue; const ang=(k-(n-1)/2)*.16, dx=(k-(n-1)/2)*120, w=300, h=380;
    c.save(); c.translate(540+dx,700+Math.abs(k-(n-1)/2)*24+(1-a)*400); c.rotate(ang*a); shadowOn(c,40,22,.3); rr(c,-w/2,-h/2,w,h,20); c.fillStyle=P.card; c.fill(); shadowOff(c);
    c.save(); rr(c,-w/2+14,-h/2+14,w-28,h-90,12); c.clip(); if(s._p) coverFocus(c,s._p,-w/2+14,-h/2+14,w-28,h-90,.5,s.fx,s.fy); else { c.fillStyle='#CFCBC4'; c.fillRect(-w/2,-h/2,w,h); } c.restore();
    txt(c,ellip(c,s.name.toUpperCase(),w-40,fBlack(24)),0,h/2-42,fBlack(24),P.cardInk,'center'); c.restore(); }
  reveal(c,'Total da turma hoje',540,1040,fSerif(52),P.ink2,o,1.0,{mode:'ghost'});
  const k=eo(seg(o,1.2,1.6)); if(k>0){ c.save(); c.globalAlpha*=k; bigText(c,brl(total*eo(seg(o,1.2,2.2))),540,1150,fBlack(fitF(c,brl(total),900,fBlack,128)),P.accent,'center'); c.restore(); }
  const kl=eo(seg(o,1.9,2.4)); logo(c,540,1300,230,'auto',kl); reveal(c,HANDLE,540,1410,fMed(30),P.grey,o,2.2,{mode:'type',dur:.6});
  sparkle(c,900,980,20,kl); plus(c,170,1180,14,kl);
}
/* sábado */
function box3D(c,x,y,w,h,dx,dy,front,top,side){ c.fillStyle=side; c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w+dx,y+h-dy); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  c.fillStyle=top; c.beginPath(); c.moveTo(x,y); c.lineTo(x+dx,y-dy); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w,y); c.closePath(); c.fill();
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,front[0]); g.addColorStop(1,front[1]); c.fillStyle=g; c.fillRect(x,y,w,h); }
function sceneBars(c,o){ reveal(c,'A semana',540,420,fSerif(60),P.ink2,o,.1,{mode:'ghost'}); reveal(c,'EM NÚMEROS',540,500,fBlack(84),P.ink,o,.3,{mode:'rise',big:true});
  floatCard(c,90,580,900,780,36,P.card,70*eo(seg(o,.3,.8)));
  const max=Math.max(1,...WK.dayTotals), slot=820/5, bw=100, base=1190;
  WK.dayTotals.forEach((v,k)=>{ const a=eo(seg(o,.6+k*.16,1.5+k*.16)), h=Math.max(8,440*v/max)*a, x=130+k*slot+slot/2-bw/2-10, best=v===max&&v>0;
    c.save(); shadowOn(c,24,14,.2); box3D(c,x,base-h,bw,h,22,14,best?['#FF8A3D','#C94A00']:['#2A2A2E','#0E0E10'],best?'#FFB27A':'#4A4A50','#000'); shadowOff(c); c.restore();
    c.save(); c.globalAlpha*=a; txt(c,v?brl(v):'—',x+bw/2+10,base-h-44,fBlack(fitF(c,v?brl(v):'—',slot-6,fBlack,24)),best?O:K,'center'); c.restore();
    txt(c,THEMES[WEEK[k]].tab,x+bw/2+10,base+46,fBlack(32),K,'center'); txt(c,WK.dates[k]||'',x+bw/2+10,base+84,fMed(22),'#6E6B67','center'); });
  reveal(c,WK.ops+' operações no lucro · '+WK.rank.length+' alunos',540,1300,fSerif(34),'#6E6B67',o,1.8,{mode:'ghost'});
  pill(c,'TOTAL '+brl(WK.total*eo(seg(o,.6,2.4))),540,1435,fBlack(34)); }
function trophy(c,cx,cy,s,a){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(s,s); const g=c.createLinearGradient(-60,-80,60,60); g.addColorStop(0,'#FFFFFF'); g.addColorStop(.5,'#F2F0EC'); g.addColorStop(1,'#B8B4AE'); c.fillStyle=g;
  shadowOn(c,20,10,.3); c.beginPath(); c.moveTo(-60,-80); c.lineTo(60,-80); c.quadraticCurveTo(60,10,0,24); c.quadraticCurveTo(-60,10,-60,-80); c.fill(); shadowOff(c);
  c.lineWidth=10; c.strokeStyle=g; c.beginPath(); c.arc(-62,-48,26,Math.PI*.5,Math.PI*1.5); c.stroke(); c.beginPath(); c.arc(62,-48,26,-Math.PI*.5,Math.PI*.5); c.stroke();
  c.fillStyle=K; c.fillRect(-10,22,20,34); c.fillRect(-44,56,88,18); c.restore(); }
function scenePodium(c,o){ reveal(c,'O pódio',540,420,fSerif(60),P.ink2,o,.1,{mode:'ghost'}); reveal(c,'DA SEMANA',540,500,fBlack(84),P.ink,o,.3,{mode:'rise',big:true});
  const spots=[[0,410,260,330],[1,110,260,230],[2,710,260,170]], base=1380;
  spots.forEach(([idx,x,w,hh],j)=>{ const s=WK.rank[idx]; if(!s) return; const a=eo(seg(o,.5+(2-j)*.35,1.3+(2-j)*.35)), h=hh*a;
    c.save(); shadowOn(c,40,24,.3); box3D(c,x,base-h,w,h,26,18,idx===0?['#FFFFFF','#E4E2DE']:['#2A2A2E','#0E0E10'],idx===0?'#FFFFFF':'#4A4A50',idx===0?'#B8B4AE':'#000'); shadowOff(c); c.restore();
    c.save(); c.globalAlpha*=a; txt(c,String(idx+1),x+w/2,base-h/2+6,fBlack(idx===0?130:96),idx===0?O:'#8A8A90','center');
    const r=idx===0?96:76, cy=base-h-r-150; c.save(); shadowOn(c,30,14,.3); c.fillStyle=WH; c.beginPath(); c.arc(x+w/2,cy,r+8,0,7); c.fill(); shadowOff(c); c.restore(); avatar(c,s._a,x+w/2,cy,r); dashRing(c,x+w/2,cy,r+26,o,idx===0?WH:K,3,.35);
    if(idx===0) trophy(c,x+w/2,cy-r-90,.8,seg(o,1.9,2.3));
    txt(c,ellip(c,s.name.toUpperCase(),w+20,fBlack(36)),x+w/2,cy+r+44,fBlack(36),P.ink,'center');
    tagBox(c,'+'+brl(s.total),x+w/2,cy+r+92,fBlack(fitF(c,'+'+brl(s.total),w-10,fBlack,28)),o,1.2+(2-j)*.35,K,WH); c.restore(); }); }
function sceneRank(c,o,page){ reveal(c,'O ranking',540,420,fSerif(60),P.ink2,o,.1,{mode:'ghost'}); reveal(c,'DA SEMANA',540,500,fBlack(84),P.ink,o,.3,{mode:'rise',big:true});
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const a=eo(seg(o,.4+j*.12,1.0+j*.12)), y=590+j*140, xo=(1-a)*600;
    c.save(); c.globalAlpha*=a; c.translate(xo,0); floatCard(c,90,y,900,118,24);
    txt(c,(start+j+1)+'º',130,y+60,fBlack(46),O,'left'); avatar(c,s._a,262,y+59,42);
    const v='+'+brl(s.total), vw=tw(c,v,fBlack(34)); txt(c,v,950,y+46,fBlack(34),P.cardInk,'right');
    txt(c,ellip(c,s.name.toUpperCase(),950-vw-40-322,fBlack(34)),322,y+46,fBlack(34),P.cardInk,'left');
    s.days.forEach((on,k)=>{ rr(c,322+k*44,y+76,36,24,7); c.fillStyle=on?K:'#DDDAD5'; c.fill(); txt(c,THEMES[WEEK[k]].tab[0],340+k*44,y+89,fBold(15),on?WH:'#9A9792','center'); });
    c.restore(); }); }
function sceneWeekOut(c,o){ heroMoney(c,540,640,o,1);
  reveal(c,'Total da semana',540,1000,fSerif(56),P.ink2,o,.9,{mode:'ghost'});
  const k=eo(seg(o,1.1,1.5)); if(k>0){ c.save(); c.globalAlpha*=k; bigText(c,brl(WK.total*eo(seg(o,1.1,2.4))),540,1110,fBlack(fitF(c,brl(WK.total),920,fBlack,130)),P.accent,'center'); c.restore(); }
  reveal(c,'PARABÉNS, TURMA!',540,1225,fBlack(70),P.ink,o,1.9,{mode:'rise',big:true});
  tagBox(c,WK.rank.length+' alunos · '+WK.ops+' operações no lucro',540,1312,fSerif(34),o,2.3,K,WH);
  logo(c,540,1410,170,'auto',eo(seg(o,2.6,3.1))); }

/* =====================================================================
   TRANSIÇÕES (uma por dia)
   ===================================================================== */
function blurDraw(src,amt,x=0,y=0,s=1,a=1){ // desfoque barato: reduz e amplia (funciona em todos os navegadores)
  let img=src; if(amt>.02){ const f=1+amt*14, w=Math.max(8,Math.round(src.width/f)), h=Math.max(8,Math.round(src.height/f)); BL.width=w; BL.height=h; bl.clearRect(0,0,w,h); bl.drawImage(src,0,0,w,h); img=BL; }
  ctx.save(); ctx.globalAlpha*=a; ctx.translate(540+x,960+y); ctx.scale(s,s); ctx.translate(-540,-960); ctx.imageSmoothingEnabled=true; ctx.drawImage(img,0,0,W,H); ctx.restore(); }
function transition(p){ const e=eio(p);
  if(D.trans==='focus'){ blurDraw(SA,e,0,0,1+.08*e,1-e); blurDraw(SB,1-e,0,0,.94+.06*e,e); return; }
  if(D.trans==='bars'){ const cl=p<.5?eo(p*2):1-eo((p-.5)*2); blurDraw(p<.5?SA:SB,cl*.5,0,0,1,1); ctx.save(); ctx.fillStyle=P.solid===O?K:'#141416'; shadowOn(ctx,40,0,.4);
    ctx.fillRect(-20,330,620*cl,1150); ctx.fillRect(1100-620*cl,330,620*cl,1150); shadowOff(ctx); ctx.fillStyle=O; ctx.fillRect(600*cl-6,330,6,1150); ctx.fillRect(1080-600*cl,330,6,1150); ctx.restore(); return; }
  if(D.trans==='swipe'){ ctx.save(); ctx.translate(540-1250*e,960); ctx.rotate(-.12*e); ctx.translate(-540,-960); ctx.drawImage(SA,0,0,W,H); ctx.restore(); ctx.save(); ctx.translate(540+1250*(1-e),960); ctx.rotate(.12*(1-e)); ctx.translate(-540,-960); ctx.drawImage(SB,0,0,W,H); ctx.restore(); return; }
  if(D.trans==='flip'){ const img=e<.5?SA:SB, sx=Math.abs(Math.cos(e*Math.PI)); ctx.save(); ctx.translate(540,960); ctx.scale(Math.max(.02,sx),1-.06*Math.sin(e*Math.PI)); ctx.translate(-540,-960); ctx.drawImage(img,0,0,W,H); ctx.restore(); return; }
  if(D.trans==='square'){ const g=p<.5?eio(p*2):1-eio((p-.5)*2), sz=40+g*2400; blurDraw(p<.5?SA:SB,0,0,0,1,1); ctx.save(); ctx.translate(540,960); ctx.rotate((1-g)*.6*(p<.5?1:-1)); shadowOn(ctx,60,30,.4); rr(ctx,-sz/2,-sz/2,sz,sz,Math.max(20,60*(1-g))); ctx.fillStyle=P.dark?O:K; ctx.fill(); shadowOff(ctx); ctx.restore(); return; }
  if(D.trans==='shatter'){ blurDraw(SB,(1-e)*.6,0,0,.92+.08*e,clamp(p*1.6,0,1)); const n=6,m=10, cw=W/n, ch=H/m;
    for(let i=0;i<n;i++) for(let j=0;j<m;j++) for(let h=0;h<2;h++){ const id=i*31+j*7+h, dx=(i+.5-n/2)/n, dy=(j+.5-m/2)/m, f=eo(p), vx=(dx*1600+(RND(id)-.5)*500)*f, vy=(dy*1500+(RND(id+3)-.5)*500)*f+f*f*400, rot=(RND(id+9)-.5)*3*f;
      const x0=i*cw, y0=j*ch, pts=h?[[x0,y0],[x0+cw,y0],[x0+cw,y0+ch]]:[[x0,y0],[x0+cw,y0+ch],[x0,y0+ch]], cx=(pts[0][0]+pts[1][0]+pts[2][0])/3, cy=(pts[0][1]+pts[1][1]+pts[2][1])/3;
      ctx.save(); ctx.globalAlpha=1-seg(p,.55,1); ctx.translate(cx+vx,cy+vy); ctx.rotate(rot); ctx.translate(-cx,-cy); ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[1][0],pts[1][1]); ctx.lineTo(pts[2][0],pts[2][1]); ctx.closePath(); ctx.clip(); ctx.drawImage(SA,0,0,W,H);
      ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); }
    const fl=Math.max(0,1-p*6); if(fl>0){ ctx.save(); ctx.globalAlpha=fl*.7; ctx.fillStyle=WH; ctx.fillRect(0,0,W,H); ctx.restore(); } return; }
  if(D.trans==='zoom'){ blurDraw(SA,e*.7,0,0,1+.7*e,1-e); blurDraw(SB,(1-e)*.7,0,0,.7+.3*e,e); const fl=Math.max(0,1-Math.abs(p-.5)*5); if(fl>0){ ctx.save(); ctx.globalAlpha=fl*.85; ctx.fillStyle=WH; ctx.fillRect(0,0,W,H); ctx.restore(); } return; }
}

/* =====================================================================
   LINHA DO TEMPO
   ===================================================================== */
function buildScenes(){
  if(MODE==='week'){ if(!WK||!WK.rank.length) return [];
    const sc=[{dur:5.4,render:sceneCover},{dur:5.0,render:sceneBars},{dur:5.6,render:scenePodium}];
    for(let p=0;3+p*6<WK.rank.length;p++) sc.push({dur:4.4,render:(c,u)=>sceneRank(c,u,p)});
    sc.push({dur:6.0,render:sceneWeekOut}); return sc; }
  if(!S.length) return [];
  const sc=[{dur:4.6,render:sceneCover},{dur:4.0,render:sceneHL}];
  let prev=0; S.forEach((s,i)=>{ const p0=prev; const run=u=>p0+s.value*eo(seg(u,1.0,2.0)); sc.push({dur:4.8,render:(c,u)=>sceneStudent(c,i,u,run)}); prev+=s.value; });
  sc.push({dur:5.0,render:sceneOut}); return sc;
}
const dur=()=>SCENES.reduce((a,s)=>a+s.dur,0);
function sceneStart(k){ let t=0; for(let i=0;i<k;i++) t+=SCENES[i].dur; return t; }
function renderTo(c,sc,u){ c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,W,H); c.globalAlpha=1; sc.render(c,u); }
function draw(t){
  useDay(curDay); ctx.setTransform(Q,0,0,Q,0,0); ctx.globalAlpha=1;
  paper(ctx,t); topMark(ctx);
  if(!SCENES.length){ txt(ctx,MODE==='week'?'Sem resultados na semana':'Marque quem operou hoje',540,960,fSerif(54),P.grey,'center'); grain(ctx,t); return guides(); }
  let k=0, st=0; while(k<SCENES.length-1&&t>=st+SCENES[k].dur){ st+=SCENES[k].dur; k++; } const sc=SCENES[k], local=Math.min(t-st,sc.dur);
  if(k>0&&local<TR){ const pv=SCENES[k-1]; renderTo(sA,pv,pv.dur); renderTo(sB,sc,local); ctx.setTransform(Q,0,0,Q,0,0); transition(local/TR); }
  else { ctx.save(); sc.render(ctx,local); ctx.restore(); }
  ctx.setTransform(Q,0,0,Q,0,0); ctx.globalAlpha=1;
  txt(ctx,'Resultados individuais. Não representam promessa ou garantia de ganhos.',540,1484,fMed(20),P.disc,'center');
  grain(ctx,t); guides();
}
function guides(){ if(exporting||!$('guides')||!$('guides').checked) return; ctx.save(); ctx.fillStyle='rgba(255,40,40,.28)'; ctx.fillRect(0,0,W,SAFE_T-30); ctx.fillRect(0,SAFE_B+20,W,H-SAFE_B-20); ctx.fillRect(W-130,1050,130,SAFE_B-1030);
  txt(ctx,'ÁREA COBERTA PELO REELS',540,110,fBold(32),'#fff','center',4); txt(ctx,'ÁREA COBERTA PELO REELS',540,1760,fBold(32),'#fff','center',4); ctx.restore(); }

/* ---------- preparar dados do vídeo ---------- */
function computeWeek(){
  const sab=parseDate(days.sab.date); const dayTotals=[], dates=[], incl=[]; let ops=0;
  const per={}; roster.forEach(r=>per[r.id]={...r,total:0,days:[false,false,false,false,false]});
  WEEK.forEach((d,k)=>{ const dd=parseDate(days[d].date); const ok=!sab||!dd||((sab-dd)/864e5>=0&&(sab-dd)/864e5<=6); incl.push(ok); dates.push(shortDate(days[d].date)); let tot=0;
    if(ok) roster.forEach(r=>{ const e=days[d].entries[r.id]; if(e&&e.on&&e.value>0){ per[r.id].total+=e.value; per[r.id].days[k]=true; tot+=e.value; ops++; } });
    dayTotals.push(tot); });
  const rank=Object.values(per).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const first=WEEK.find((d,k)=>incl[k]&&dayTotals[k]>0)||'seg', last=[...WEEK].reverse().find((d,k)=>incl[4-k]&&dayTotals[4-k]>0)||'sex';
  return {dayTotals,dates,incl,ops,rank,total:dayTotals.reduce((a,b)=>a+b,0),range:shortDate(days[first].date)+' a '+shortDate(days[last].date)};
}
async function prepare(){
  useDay(curDay);
  await Promise.all(FONTS.map(f=>document.fonts.load(f).catch(()=>{})));
  await loadLogo();
  MODE=curDay==='sab'?'week':'day';
  if(MODE==='week'){ WK=computeWeek(); await Promise.all(WK.rank.map(async s=>{ s._a=await getImg(avatarSrc(s),420); s._ab=tiny(s._a,24); })); S=[]; }
  else { const list=roster.map(r=>{ const e=entry(curDay,r.id); return {...r,value:e.value,on:e.on,fx:e.fx,fy:e.fy,print:printSrc(curDay,r.id,e),avatar:avatarSrc(r)}; }).filter(s=>s.on);
    if(list.length){ let top=0; list.forEach((s,k)=>{ if(s.value>list[top].value) top=k; }); S=[list[top],...list.filter((_,k)=>k!==top)]; } else S=[];
    await Promise.all(S.map(async s=>{ s._p=await getImg(s.print,1500); s._a=await getImg(s.avatar,420); s._pt=tiny(s._p,16); s._at=tiny(s._a,10); s._ab=tiny(s._a,24); })); }
  SCENES=buildScenes();
}
