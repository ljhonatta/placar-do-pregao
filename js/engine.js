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
const FONTS=["400 40px Anton","900 40px Montserrat","700 40px Montserrat","500 40px Montserrat","italic 700 40px 'Playfair Display'","900 40px 'Playfair Display'"];

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
  seg:{bpm:100, motion:'lift', accent:'spark', cover:'toggle', hero:'emblem', trans:'focus', light:-.32, l1:'O resultado de', tag:'dos nossos alunos', quote:['Disciplina é a ponte','entre metas e conquistas.'], open:['Começando a semana,','Mais um no lucro,','Na sequência,','Firme no processo,']},
  ter:{bpm:120, motion:'slide3d', accent:'ellipse', cover:'cycle', hero:'money',  trans:'bars',  light:.28,  l1:'O resultado de', tag:'dos nossos alunos', quote:['Grandes resultados nascem','de decisões repetidas.'], open:['Terça de resultado,','Também no lucro,','Mais um,','Seguindo firme,']},
  qua:{bpm:110, motion:'flip3d', accent:'brackets', hero:'coin',   trans:'flip',  light:-.22, l1:'O resultado de', tag:'dos nossos alunos', quote:['Quem planta com constância','colhe com abundância.'], open:['Meio da semana,','A turma não para,','Mais um no lucro,','Na sequência,']},
  qui:{bpm:100, motion:'drop', accent:'hash', cover:'toggle', hero:'book',   trans:'square', light:.36,  l1:'O resultado de', tag:'dos nossos alunos', quote:['O mercado premia','quem respeita o processo.'], open:['Quinta de lucro,','Consistência,','Mais um,','Firme no plano,']},
  sex:{bpm:120, motion:'zoomin', accent:'glow', hero:'news',   trans:'pageturn', light:-.4,  l1:'O resultado de', tag:'dos nossos alunos', quote:['Fechar bem a semana','é consequência, não sorte.'], open:['Fechando a semana,','Mais um no topo,','Na sequência,','Também no lucro,']},
  sab:{bpm:96, motion:'zoomin', accent:'glow', hero:'pendulum',trans:'zoom',light:.3,   l1:'O resultado da', tag:'de toda a turma', quote:['Uma turma. Um propósito.','Um resultado.'], open:[]}
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
function topMark(c){ logo(c,540,300,200,'auto',.95); }

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

/* =====================================================================
   CAPAS — uma composição diferente por dia (inspiradas nas referências)
   seg: estátua editorial (fotos + base 3D)      ter: lente olho-de-peixe com texto correndo + neon
   qua: manchete + muro + lupa revelando         qui: folha de caderno com círculo à mão
   sex: celular 3D girando com o print           sáb: documento no anel tracejado
   ===================================================================== */
const fAnton=s=>`400 ${s}px Anton, Impact, 'Arial Narrow', sans-serif`;
function datePill(c,t,t0,y,bg,fg){ const k=eo(seg(t,t0,t0+.4)); if(k<=0) return; c.save(); c.globalAlpha*=k; pill(c,dateLabel(),540,y+(1-k)*20,fBlack(30),bg,fg,6); c.restore(); }
function lensRim(c,lx,ly,R){ c.save(); c.lineWidth=14; c.strokeStyle=K; c.beginPath(); c.arc(lx,ly,R+5,0,7); c.stroke(); c.lineWidth=5; c.strokeStyle=O; c.beginPath(); c.arc(lx,ly,R+5,0,7); c.stroke();
  c.translate(lx,ly); c.rotate(Math.PI/4); shadowOn(c,20,10,.4); rr(c,R+8,-13,34,26,6); c.fillStyle='#2A2A2E'; c.fill(); rr(c,R+38,-19,R*.95,38,19); c.fillStyle=O; c.fill(); shadowOff(c); c.fillStyle='rgba(255,255,255,.25)'; rr(c,R+46,-14,R*.8,9,4); c.fill(); c.restore(); }
function glowText(c,s,x,y,font,col,core,amt){ c.save(); c.shadowColor=col; c.shadowBlur=70*amt*Q; txt(c,s,x,y,font,col,'center'); c.shadowBlur=24*amt*Q; txt(c,s,x,y,font,col,'center'); c.shadowBlur=0; c.globalAlpha*=.55*amt; txt(c,s,x,y,font,core,'center'); c.restore(); }

/* SEGUNDA — fotos entrando do desfoque sobre uma base 3D com o nome do dia */
function coverSeg(c,t){
  reveal(c,'O resultado de',540,410,fSerif(52),P.ink2,t,.1,{mode:'ghost'});
  reveal(c,'segunda-feira',540,486,fSerif(88),O,t,.4,{mode:'rise'});
  const pics=S.length?S:[{}], pick=k=>(pics[k]||pics[0])._a||null;
  [[290,812,200,250,-.08,.8,1],[790,800,200,250,.08,.95,2],[540,850,290,370,0,.65,0]].forEach(([x,y,w,h,r,t0,idx])=>{ const a=eo(seg(t,t0,t0+.6)); if(a<=0) return;
    c.save(); c.translate(0,(1-a)*70+Math.sin(t*1.2+idx)*5); photoFrame(c,pick(idx),x,y,w,h,r*(.4+.6*a)+(1-a)*.2*(idx?1:-1),a); c.restore(); });
  const ks=eo(seg(t,1.1,1.6)); if(ks>0){ c.save(); c.globalAlpha*=ks; c.translate(0,(1-ks)*120); slab(c,140,1072,800,165); c.restore(); }
  reveal(c,'SEGUNDA',540,1156,fBlack(fitF(c,'SEGUNDA',700,fBlack,128)),P.plateText,t,1.4,{mode:'rise'});
  datePill(c,t,2.0,1320,O,WH); reveal(c,HANDLE,540,1408,fMed(30),P.grey,t,2.3,{mode:'type',dur:.7});
  sparkle(c,890,560,22,eo(seg(t,1,1.4))); plus(c,170,600,14,eo(seg(t,1.2,1.6))); plus(c,920,1000,14,eo(seg(t,1.3,1.7)));
}

/* TERÇA — lente olho-de-peixe com o texto correndo, que fecha e vira neon */
let FX=null, fxc=null;
function coverTer(c,t){ const cy=800, LW=1000, LH=600, open=eo(seg(t,.15,.7))*(1-eio(seg(t,2.45,2.85)));
  reveal(c,'O resultado de',540,412,fSerif(52),P.ink2,t,.1,{mode:'ghost'});
  if(open>.01){ const sw=Math.max(8,Math.round(LW*Q)), sh=Math.max(8,Math.round(LH*Q)); if(!FX){ FX=document.createElement('canvas'); fxc=FX.getContext('2d'); } if(FX.width!==sw||FX.height!==sh){ FX.width=sw; FX.height=sh; }
    fxc.setTransform(Q,0,0,Q,0,0); const g=fxc.createRadialGradient(LW/2,LH/2,40,LW/2,LH/2,LW*.6); g.addColorStop(0,'#F6F5F3'); g.addColorStop(.65,'#CFCDC9'); g.addColorStop(1,'#6F6C67'); fxc.fillStyle=g; fxc.fillRect(0,0,LW,LH);
    [['TERÇA',K,-1],['NO LUCRO',O,1],['TERÇA',K,-1]].forEach(([w,col,dir],r)=>{ fxc.font=fBlack(190); fxc.textBaseline='middle'; fxc.textAlign='left'; fxc.fillStyle=col; const unit=fxc.measureText(w+'   ').width, off=(((t*300+r*200)*dir)%unit+unit)%unit; for(let x=off-2*unit;x<LW+unit;x+=unit) fxc.fillText(w,x,LH/2+(r-1)*185+12); });
    c.save(); c.beginPath(); c.ellipse(540,cy,LW/2,LH/2*open,0,0,7); c.clip(); c.fillStyle='#55524E'; c.fillRect(40,cy-LH/2,LW,LH);
    const N=72; for(let i=0;i<N;i++){ const u0=i/N, u1=(i+1)/N, xm=(u0+u1)-1, sy=.58+.42*Math.cos(xm*Math.PI/2), d0=540+Math.sin((u0*2-1)*Math.PI/2)*LW/2, d1=540+Math.sin((u1*2-1)*Math.PI/2)*LW/2, dh=LH*sy*open;
      c.drawImage(FX,u0*sw,0,Math.max(1,(u1-u0)*sw),sh,d0,cy-dh/2,d1-d0+.8,dh); }
    const vg=c.createRadialGradient(540,cy,LW*.3,540,cy,LW*.55); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=vg; c.fillRect(40,cy-LH/2,LW,LH); c.restore();
    c.save(); c.globalAlpha*=open; c.strokeStyle=O; c.lineWidth=6; c.shadowColor=O; c.shadowBlur=40*Q; c.beginPath(); c.ellipse(540,cy,LW/2,LH/2*open,0,.12*Math.PI,.88*Math.PI); c.stroke(); c.restore(); }
  const g2=eo(seg(t,2.6,3.1)); if(g2>0){ const fl=1-.35*Math.max(0,Math.sin(t*31))*(1-seg(t,3.1,3.5)), fz=fitF(c,'TERÇA',880,fBlack,230);
    c.save(); c.globalAlpha*=g2; c.translate(540,800); c.scale(.85+.15*g2,.85+.15*g2); glowText(c,'TERÇA',0,0,fBlack(fz),O,'#FFE2CC',fl); c.restore();
    reveal(c,'no lucro',540,960,fSerif(84),WH,t,2.95,{mode:'blur'}); }
  datePill(c,t,1.2,1250,O,K); reveal(c,HANDLE,540,1345,fMed(30),P.grey,t,1.5,{mode:'type',dur:.7});
}

/* QUARTA — manchete, muro e a lupa revelando o que está escondido */
function coverQua(c,t){ const fz=fitF(c,'QUARTA',900,fAnton,250), hw=tw(c,'QUARTA',fAnton(fz));
  reveal(c,'QUARTA',540,505,fAnton(fz),O,t,.1,{mode:'rise',big:true});
  const ul=eo(seg(t,.7,1.1)); if(ul>0){ c.fillStyle=K; c.fillRect(540-hw/2,618,hw*ul,9); }
  const kb=eo(seg(t,.45,1.0)); if(kb>0){ c.save(); c.translate(-(1-kb)*1150,0); shadowOn(c,30,14,.25); for(let r=0;r<5;r++){ const y=700+r*64, off=r%2?-74:0; for(let x=off-20;x<1100;x+=148){ rr(c,x,y,140,56,5); c.fillStyle=r%2?'#3C3C41':'#56565C'; c.fill(); } } shadowOff(c); c.restore(); }
  const kl=eo(seg(t,1.05,2.0)); if(kl>0){ const R=185, lx=540+(1-kl)*560+Math.sin(t*2)*5*kl, ly=858+(1-kl)*60+Math.cos(t*1.7)*4*kl;
    c.save(); shadowOn(c,40,22,.45); c.beginPath(); c.arc(lx,ly,R+12,0,7); c.fillStyle='#111'; c.fill(); shadowOff(c); c.restore();
    c.save(); c.beginPath(); c.arc(lx,ly,R,0,7); c.clip(); c.fillStyle='#FBFAF8'; c.fillRect(lx-R,ly-R,2*R,2*R);
    txt(c,'dia de',540,800,fSerif(58),K,'center'); txt(c,'LUCRO',540,890,fBlack(96),K,'center'); brackets(c,540-170,742,340,206,26,O,4,1);
    const g=c.createLinearGradient(lx-R,ly-R,lx+R*.2,ly+R*.2); g.addColorStop(0,'rgba(255,255,255,.4)'); g.addColorStop(.4,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(lx-R,ly-R,2*R,2*R); c.restore();
    lensRim(c,lx,ly,R); }
  [[935,650,.16,1.9],[150,1075,-.12,2.05]].forEach(([x,y,r,t0])=>{ const e=back(seg(t,t0,t0+.45)); if(e<=0) return; c.save(); c.translate(x,y); c.rotate(r); c.scale(e,e); txt(c,'#',0,0,fAnton(130),K,'center'); c.restore(); });
  reveal(c,'O resultado dos nossos alunos',540,1185,fSerif(48),P.ink2,t,2.1,{mode:'ghost'});
  if(t>2.4){ const k=eo(seg(t,2.4,2.8)); c.save(); c.globalAlpha*=k; txt(c,dateLabel(),540,1275+(1-k)*20,fBlack(40),O,'center',8); c.restore(); }
  reveal(c,HANDLE,540,1360,fMed(30),P.grey,t,2.6,{mode:'type',dur:.7});
}

/* QUINTA — folha de caderno, frase digitada e "LUCRO" circulado à mão */
function coverQui(c,t){
  reveal(c,'O resultado de',540,420,fSerif(46),P.ink2,t,.1,{mode:'ghost'});
  const kp=back(seg(t,.15,.85)); if(kp>0){ const w=680,h=580; c.save(); c.translate(540,790+(1-kp)*900); c.rotate(-.035+(1-kp)*.3);
    shadowOn(c,60,30,.55); c.beginPath(); c.moveTo(-w/2,-h/2); c.lineTo(w/2,-h/2); c.lineTo(w/2,h/2-12); for(let k=0;k<=24;k++) c.lineTo(w/2-k*w/24,h/2-12+(k%2?12:-2)+RND(k)*6); c.closePath(); c.fillStyle='#F7F5F0'; c.fill(); shadowOff(c);
    c.strokeStyle='rgba(40,70,140,.16)'; c.lineWidth=2; for(let y=-h/2+110;y<h/2-30;y+=50){ c.beginPath(); c.moveTo(-w/2+20,y); c.lineTo(w/2-20,y); c.stroke(); }
    c.strokeStyle='rgba(255,106,19,.55)'; c.beginPath(); c.moveTo(-w/2+78,-h/2+70); c.lineTo(-w/2+78,h/2-20); c.stroke();
    for(let k=0;k<10;k++){ c.fillStyle='#0E0E10'; c.beginPath(); c.arc(-w/2+60+k*62,-h/2+32,11,0,7); c.fill(); }
    c.save(); shadowOn(c,12,6,.4); c.fillStyle=O; c.beginPath(); c.arc(w/2-70,-h/2+30,20,0,7); c.fill(); shadowOff(c); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.arc(w/2-76,-h/2+24,6,0,7); c.fill(); c.restore();
    reveal(c,'e se a quinta for de',20,-112,fSerif(54),K,t,.85,{mode:'type',dur:.6});
    reveal(c,'LUCRO',20,30,fAnton(178),K,t,1.45,{mode:'blur'});
    const e=eo(seg(t,1.85,2.45)); if(e>0){ c.strokeStyle=O; c.lineWidth=8; c.lineCap='round'; c.beginPath(); for(let q=0;q<=e;q+=.01){ const an=-2.5+q*Math.PI*2.2, x=20+Math.cos(an)*235*(1+.035*Math.sin(q*11)), y=30+Math.sin(an)*100; if(q===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); }
    reveal(c,'e foi.',220,190,fSerif(60),O,t,2.5,{mode:'type',dur:.35});
    c.restore(); }
  reveal(c,'QUINTA',540,1212,fAnton(fitF(c,'QUINTA',820,fAnton,168)),WH,t,2.2,{mode:'rise',big:true});
  if(t>2.6){ const k=eo(seg(t,2.6,3.0)); c.save(); c.globalAlpha*=k; txt(c,dateLabel(),540,1352+(1-k)*20,fBlack(36),O,'center',8); c.restore(); }
  reveal(c,HANDLE,540,1422,fMed(28),P.grey,t,2.8,{mode:'type',dur:.6});
}

/* SEXTA — celular 3D girando e pousando com o print do destaque */
function phone3D(c,cx,cy,w,h,ang,tilt,sc,img,s,t){ const cs=Math.cos(ang), sx=Math.max(.025,Math.abs(cs));
  c.save(); c.translate(cx,cy); c.rotate(tilt); c.scale(sc,sc); c.transform(sx,Math.sin(ang)*.14,0,1,0,0);
  shadowOn(c,80,46,.7); rr(c,-w/2,-h/2,w,h,56); c.fillStyle='#1B1B20'; c.fill(); shadowOff(c);
  const eg=c.createLinearGradient(-w/2,0,w/2,0); eg.addColorStop(0,'#77777F'); eg.addColorStop(.5,'#2A2A30'); eg.addColorStop(1,'#77777F'); c.strokeStyle=eg; c.lineWidth=7; c.stroke();
  if(cs>0){ rr(c,-w/2+14,-h/2+14,w-28,h-28,44); c.save(); c.clip(); c.fillStyle='#050506'; c.fillRect(-w/2,-h/2,w,h);
      if(typeof img==='function') img(c,w-28,h-28); else if(img&&s) coverFocus(c,img,-w/2+14,-h/2+14,w-28,h-28,.35,s.fx,s.fy); else logo(c,0,0,w*.6,false,.9);
      const gp=seg(t,2.1,2.8); if(gp>0&&gp<1){ c.globalCompositeOperation='lighter'; const gx=-w+gp*w*2, g=c.createLinearGradient(gx-80,0,gx+80,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(-w/2,-h/2,w,h); }
      c.restore(); rr(c,-52,-h/2+26,104,28,14); c.fillStyle='#000'; c.fill(); }
  else { const bg=c.createLinearGradient(-w/2,-h/2,w/2,h/2); bg.addColorStop(0,'#2C2C33'); bg.addColorStop(1,'#111114'); rr(c,-w/2+6,-h/2+6,w-12,h-12,50); c.fillStyle=bg; c.fill(); logo(c,0,40,w*.48,false,.85); rr(c,-w/2+26,-h/2+26,118,118,32); c.fillStyle='#0B0B0D'; c.fill(); c.fillStyle='#2E2E36'; c.beginPath(); c.arc(-w/2+62,-h/2+62,22,0,7); c.fill(); c.beginPath(); c.arc(-w/2+108,-h/2+108,22,0,7); c.fill(); }
  c.restore(); }
function coverSex(c,t){ const k=eo(seg(t,.1,1.5)), up=eio(seg(t,1.7,2.3)), ang=(1-k)*Math.PI*2.25, sc=(.42+.58*k)*(1-.2*up), cy=830-80*up+Math.sin(t*1.4)*6*k;
  const gl=c.createRadialGradient(540,cy+300*sc,10,540,cy+300*sc,420); gl.addColorStop(0,`rgba(255,106,19,${.45*k})`); gl.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=gl; c.fillRect(100,cy-200,880,900);
  dashRing(c,540,cy,410*sc,t*.6,'rgba(255,255,255,.25)',3,.4);
  phone3D(c,540,cy,330,660,ang,-.06*k+(1-k)*.3,sc,S[0]&&S[0]._p,S[0],t);
  const g=eo(seg(t,2.0,2.5)); if(g>0){ const fz=fitF(c,'SEXTOU',860,fBlack,170), fl=.75+.25*Math.sin(t*6); c.save(); c.globalAlpha*=g; c.translate(540,1120+(1-g)*40); glowText(c,'SEXTOU',0,0,fBlack(fz),O,'#FFE2CC',fl); c.restore(); }
  reveal(c,'fechando no lucro',540,1222,fSerif(62),WH,t,2.35,{mode:'blur'});
  datePill(c,t,2.6,1310,WH,K); reveal(c,HANDLE,540,1395,fMed(30),P.grey,t,2.8,{mode:'type',dur:.6});
}

/* SÁBADO — documento do resultado dentro de um anel tracejado girando */
function coverSab(c,t){ const cy=805, kr=eo(seg(t,.3,1.2));
  reveal(c,'Quer ver o',540,415,fSerif(56),WH,t,.1,{mode:'type',dur:.5});
  if(kr>0){ c.save(); c.translate(540,cy); c.rotate(t*.35); c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=4; c.setLineDash([24,16]); c.beginPath(); c.arc(0,0,300,0,Math.PI*2*kr); c.stroke(); c.setLineDash([]);
    c.rotate(-t*.7); c.lineWidth=2; c.strokeStyle='rgba(255,255,255,.4)'; c.beginPath(); c.arc(0,0,342,0,Math.PI*2*kr); c.stroke(); c.fillStyle=WH; c.beginPath(); c.arc(342*Math.cos(Math.PI*2*kr),342*Math.sin(Math.PI*2*kr),8,0,7); c.fill(); c.restore(); }
  const kd=back(seg(t,.6,1.3)); if(kd>0){ const w=330,h=420; c.save(); c.translate(540,cy+(1-kd)*80); c.rotate(-.05*Math.min(1,kd)+(1-Math.min(1,kd))*.4); c.scale(kd,kd);
    shadowOn(c,50,30,.4); c.fillStyle=WH; c.fillRect(-w/2,-h/2,w,h); shadowOff(c);
    c.fillStyle='#E9E6E1'; c.beginPath(); c.moveTo(w/2-56,-h/2); c.lineTo(w/2,-h/2+56); c.lineTo(w/2-56,-h/2+56); c.closePath(); c.fill();
    logo(c,0,-h/2+72,120,true); txt(c,'RESULTADO',0,-2,fAnton(80),O,'center'); txt(c,'da semana',0,68,fSerif(46),K,'center');
    c.fillStyle='rgba(0,0,0,.12)'; [[230,118],[190,144],[210,170]].forEach(([lw,y])=>c.fillRect(-lw/2,y,lw,9));
    rr(c,-34,-h/2-14,68,26,8); c.fillStyle='#2A2A2E'; c.fill(); c.restore(); }
  sparkle(c,860,520,22,eo(seg(t,1.1,1.5)),WH); sparkle(c,210,1080,16,eo(seg(t,1.3,1.7)),WH); plus(c,190,560,14,eo(seg(t,1.2,1.6)),WH);
  reveal(c,'SEMANA',540,1218,fAnton(fitF(c,'SEMANA',820,fAnton,160)),K,t,1.6,{mode:'rise',big:true});
  datePill(c,t,2.2,1356,K,WH); reveal(c,HANDLE,540,1425,fMed(28),P.grey,t,2.5,{mode:'type',dur:.6});
}
const COVERS={seg:coverSeg,ter:coverTer,qua:coverQua,qui:coverQui,sex:coverSex,sab:coverSab};
function sceneCover(c,t){ (COVERS[curDay]||coverSeg)(c,t); }

/* ---------- efeitos sonoros: marcações de tempo de cada cena ---------- */
const COVER_CUES={
  seg:[[.1,'swish'],[.4,'whoosh'],[.65,'pop'],[.8,'pop'],[.95,'pop'],[1.1,'impact'],[1.45,'swish'],[2.0,'click'],[2.3,'type']],
  ter:[[.1,'swish'],[.15,'whoosh'],[.4,'drone'],[1.2,'click'],[1.5,'type'],[2.45,'whoosh'],[2.6,'impact'],[2.65,'buzz'],[2.95,'swish']],
  qua:[[.1,'whoosh'],[.45,'swish'],[.7,'click'],[1.05,'whoosh'],[1.9,'pop'],[2.05,'pop'],[2.1,'shimmer'],[2.6,'type']],
  qui:[[.15,'whoosh'],[.85,'type'],[1.45,'impact'],[1.85,'scribble'],[2.2,'swish'],[2.5,'type'],[2.8,'type']],
  sex:[[.1,'riser'],[1.35,'impact'],[1.7,'whoosh'],[2.0,'buzz'],[2.1,'shimmer'],[2.6,'click'],[2.8,'type']],
  sab:[[.1,'type'],[.3,'swish'],[.6,'pop'],[1.6,'impact'],[2.2,'click'],[2.5,'type']]
};
const TRANS_SFX={focus:'softWhoosh',bars:'silkSwipe',flip:'silkSwipe',square:'paperSlide',pageturn:'pageTurn',zoom:'softWhoosh'};
const ACCENT_SFX={spark:'shimmer',ellipse:'scribble',brackets:'pop',hash:'pop',glow:'shimmer'};
function cueList(){ useDay(curDay); const out=[]; let st=0;
  SCENES.forEach((sc,k)=>{ if(k>0) out.push({t:st,k:'trans'}); (sc.cues||[]).forEach(([u,kk])=>{ if(u<sc.dur) out.push({t:st+u,k:kk}); }); st+=sc.dur; });
  return out; }

/* destaque do dia */
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
/* =====================================================================
   CARD DO ALUNO — um formato por dia (u já vem normalizado para 4,8 s)
   seg: editorial recorte · ter: cinema dark · qua: celular fly-through
   qui: caderno do trader · sex: plantão do pregão (jornal)
   ===================================================================== */
function grayOf(img){ if(!img) return null; try{ const c=document.createElement('canvas'); c.width=iw(img); c.height=ih(img); const g=c.getContext('2d'); g.drawImage(img,0,0); const id=g.getImageData(0,0,c.width,c.height), d=id.data;
  for(let i=0;i<d.length;i+=4){ let l=.299*d[i]+.587*d[i+1]+.114*d[i+2]; l=clamp((l-128)*1.18+128,0,255); d[i]=d[i+1]=d[i+2]=l; } g.putImageData(id,0,0); return c; }catch(e){ return img; } }
const kickerFor=i=>i===0?'O destaque do dia,':(D.open[(i-1)%D.open.length]||'Mais um,');
const zoomP=u=>eo(seg(u,1.0,2.0))-eo(seg(u,3.8,4.4));
const valNow=(s,u)=>s.value*eo(seg(u,1.0,2.0));
/* kicker com a última palavra em destaque (itálico colorido) */
function kicker(c,s,x,y,size,col,keyCol,u,t0,align='center'){ const words=s.split(' '), font=fSerif(size), sp=tw(c,' ',font), ws=words.map(w=>tw(c,w,font)), total=ws.reduce((a,b)=>a+b,0)+sp*(words.length-1); let cx=align==='center'?x-total/2:align==='right'?x-total:x;
  words.forEach((w,k)=>{ const p=eo(seg(u,t0+k*.1,t0+k*.1+.35)); if(p>0){ c.save(); c.globalAlpha*=p; txt(c,w,cx,y+(1-p)*18,font,k===words.length-1?keyCol:col,'left'); c.restore(); } cx+=ws[k]+sp; }); }
/* print do aluno com zoom no ponto marcado, brilho e lupa */
function drawPrint(c,s,px,py,pw,ph,u,r=18,lens=true){ const zp=zoomP(u), fin=seg(u,.35,.95);
  c.save(); rr(c,px,py,pw,ph,r); c.fillStyle='#1A1A1D'; c.fill(); c.clip();
  if(s._p){ coverFocus(c,s._p,px,py,pw,ph,zp,s.fx,s.fy); if(fin<1&&s._pt){ c.globalAlpha=1-eo(fin); cover(c,s._pt,px-20,py-20,pw+40,ph+40); c.globalAlpha=1; } }
  else { const g=c.createLinearGradient(px,py,px+pw,py+ph); g.addColorStop(0,'#26262B'); g.addColorStop(1,'#111114'); c.fillStyle=g; c.fillRect(px,py,pw,ph); c.strokeStyle='rgba(255,106,19,.5)'; c.lineWidth=3; c.setLineDash([10,8]); c.strokeRect(px+16,py+16,pw-32,ph-32); c.setLineDash([]); txt(c,'PRINT DO ALUNO',px+pw/2,py+ph/2,fBold(Math.min(34,pw/12)),'#8A8782','center',4); }
  const sh=seg(u,2.2,2.9); if(sh>0&&sh<1){ c.globalCompositeOperation='lighter'; c.translate(px-300+sh*(pw+600),py+ph/2); c.rotate(-.35); const g=c.createLinearGradient(-110,0,110,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.25)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(-110,-ph,220,ph*2); }
  c.restore(); if(lens&&s._p) magnifier(c,s,px,py,pw,ph,zp,u); }
/* resultado: valor com contador, TURMA HOJE, 01/08 e barra — estilos: slab, glass, paper */
function drawResult(c,s,i,u,run,style='slab',y=1222,acc=true){ const kp=eo(seg(u,.6,1.1)); if(kp<=0) return null; c.save(); c.translate(0,(1-kp)*80); c.globalAlpha*=kp;
  const x=90,w=900,h=200; let ink=P.plateText, sub=P.plateSub, ac=P.plateAccent;
  if(style==='slab') slab(c,x,y,w,h);
  else if(style==='glass'){ c.save(); shadowOn(c,50,24,.5); rr(c,x,y,w,h,26); c.fillStyle='rgba(22,22,26,.92)'; c.fill(); shadowOff(c); c.strokeStyle=O; c.lineWidth=2.5; c.stroke(); c.restore(); ink=WH; sub='#8E8A85'; ac=O; }
  else if(style==='paper'){ c.save(); shadowOn(c,40,20,.45); c.beginPath(); c.moveTo(x,y+6); for(let k=0;k<=30;k++) c.lineTo(x+k*w/30,y+(k%2?0:8)+RND(k+50)*5); c.lineTo(x+w,y+h); for(let k=30;k>=0;k--) c.lineTo(x+k*w/30,y+h-(k%2?0:8)-RND(k+80)*5); c.closePath(); c.fillStyle='#F4F1EA'; c.fill(); shadowOff(c); c.restore(); ink=K; sub='#6E6B67'; ac=O; }
  txt(c,'RESULTADO DO DIA',x+50,y+52,fBold(23),sub,'left',6);
  const vNow=valNow(s,u), vs='+'+brl(vNow), pop=1+.12*Math.sin(Math.PI*seg(u,2.0,2.35)), vf=fBlack(fitF(c,'+'+brl(s.value),500,fBlack,84)), vw=tw(c,'+R$ '+brl(s.value).slice(3),vf);
  c.save(); c.translate(x+50,y+128); c.scale(pop,pop); txt(c,'+R$',0,0,vf,ac,'left'); txt(c,brl(vNow).slice(3),tw(c,'+R$ ',vf),0,vf,ink,'left'); c.restore();
  if(acc) valueAccent(c,x+50,y+128,vw,u);
  const rv=brl(run(u)); txt(c,'TURMA HOJE',x+w-50,y+64,fBold(21),sub,'right',5); txt(c,rv,x+w-50,y+112,fBlack(fitF(c,rv,320,fBlack,38)),ink,'right'); txt(c,pad2(i+1)+' / '+pad2(S.length),x+w-50,y+166,fBold(21),ac,'right',4);
  slider(c,x+50,x+690,y+170,(i+eo(seg(u,.8,2)))/S.length,ac,style==='paper'?'#CFCBC4':sub);
  c.restore(); return {vx:x+50,vy:y+128,vw}; }
function handleTag(c,s,x,y,u,t0,bg,fg,align='left',size=26){ if(s.handle&&s.handle.length>1) tagBox(c,s.handle,x,y,fMed(size),u,t0,bg,fg,align); }

/* SEGUNDA — editorial recorte: foto P&B inclinada + print como folha com orelha + caixa de seleção no valor */
function cardSeg(c,i,u,run){ const s=S[i], m=i%2?-1:1, fl=Math.sin(u*1.3)*4;
  kicker(c,kickerFor(i),540,420,46,P.ink2,O,u,.05);
  const nm=s.name.toUpperCase(); reveal(c,nm,540,500,fBlack(fitF(c,nm,900,fBlack,96)),P.ink,u,.3,{mode:'rise',big:true});
  handleTag(c,s,540,566,u,.6,K,WH,'center',24);
  const pa=eo(seg(u,.35,.9)), phx=540-250*m, phy=860+fl;
  if(pa>0){ c.save(); c.globalAlpha*=pa; c.translate(phx-(1-pa)*120*m,phy); c.rotate(-.05*m); c.save(); c.shadowColor='rgba(0,0,0,.38)'; c.shadowBlur=60*Q; c.shadowOffsetX=34*m*Q; c.shadowOffsetY=40*Q; c.fillStyle=WH; c.fillRect(-190,-235,380,470); c.restore();
    c.save(); c.beginPath(); c.rect(-178,-223,356,446); c.clip(); if(s._ag) cover(c,s._ag,-178-60,-223-60,356+120,446+120); else silhouette(c,0,0,178); c.restore(); c.restore(); }
  const ka=eo(seg(u,.55,1.05)), qx=540+170*m, qy=885-fl*.6, qw=520, qh=470;
  if(ka>0){ c.save(); c.globalAlpha*=ka; c.translate(qx+(1-ka)*200*m,qy+(1-ka)*60); c.rotate(.035*m); shadowOn(c,50,26,.32); c.fillStyle='#FBFAF8'; c.fillRect(-qw/2,-qh/2,qw,qh); shadowOff(c);
    drawPrint(c,s,-qw/2+18,-qh/2+18,qw-36,qh-36,u,8); pageCurl(c,-qw/2,-qh/2,60*eo(seg(u,.7,1.1)),'#FBFAF8'); c.restore(); }
  const r=drawResult(c,s,i,u,run,'slab',1222,false);
  if(r){ const a=eo(seg(u,2.05,2.4))*(1-seg(u,4.0,4.4)); selectBox(c,r.vx-18,r.vy-50,r.vw*1.04+36,100,a,O); }
}

/* TERÇA — cinema dark: luz laranja vazando, nome gigante em serifada com colchetes, avatar com ícones orbitando */
function marketIcon(c,k,x,y,s){ c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle=O; c.strokeStyle=O; c.lineWidth=4; c.lineCap='round';
  if(k===0){ c.fillRect(-6,-20,12,30); c.beginPath(); c.moveTo(0,-30); c.lineTo(0,22); c.stroke(); }
  else if(k===1){ c.beginPath(); c.moveTo(-18,14); c.lineTo(-4,0); c.lineTo(4,8); c.lineTo(18,-10); c.stroke(); c.beginPath(); c.moveTo(18,-10); c.lineTo(8,-10); c.moveTo(18,-10); c.lineTo(18,0); c.stroke(); }
  else { txt(c,'R$',0,2,fBlack(26),O,'center'); } c.restore(); }
function cardTer(c,i,u,run){ const s=S[i], m=i%2?-1:1;
  const lk=c.createRadialGradient(m>0?-60:1140,820,40,m>0?-60:1140,820,760); lk.addColorStop(0,`rgba(255,106,19,${.42+.06*Math.sin(u*5)})`); lk.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=lk; c.fillRect(0,250,W,1250);
  const pop=1.06-.06*eo(seg(u,0,.25));
  c.save(); c.translate(540,860); c.scale(pop,pop); c.translate(-540,-860);
  txt(c,kickerFor(i).toUpperCase(),540,410,fBold(24),'rgba(255,255,255,.85)','center',6);
  const nm=s.name, nf=fSerif(fitF(c,nm,840,fSerif,138)), nw=tw(c,nm,nf); reveal(c,nm,540,505,nf,O,u,.05,{mode:'blur'});
  const be=eo(seg(u,.25,.7)), inf=(1-be)*140; brackets(c,540-nw/2-36-inf,438-inf*.6,nw+72+2*inf,130+inf*1.2,38,WH,4,be);
  handleTag(c,s,540,600,u,.55,O,K,'center',24);
  const ka=eo(seg(u,.15,.7)), pw=640, ph=410, px=540-pw/2, py=650;
  if(ka>0){ c.save(); c.globalAlpha*=ka; c.translate(540,py+ph/2+(1-ka)*50); c.transform(1,-.045*m,0,1,0,0); c.rotate(.012*m+Math.sin(u*1.1)*.006); c.translate(-540,-(py+ph/2)); shadowOn(c,70,40,.7); rr(c,px-10,py-10,pw+20,ph+20,22); c.fillStyle='#202024'; c.fill(); shadowOff(c);
    drawPrint(c,s,px,py,pw,ph,u,16,false); c.restore(); if(s._p) magnifier(c,s,px,py,pw,ph,zoomP(u),u); }
  c.restore();
  const av=back(seg(u,.55,1.0)); if(av>0){ const ax=540, ay=1118; c.save(); c.translate(ax,ay); c.scale(av,av); c.save(); c.shadowColor=O; c.shadowBlur=40*Q; c.fillStyle=O; c.beginPath(); c.arc(0,0,82,0,7); c.fill(); c.restore(); c.restore(); avatar(c,s._a,ax,ay,76*av);
    dashRing(c,ax,ay,104*av,u,'rgba(255,255,255,.6)',3,.3);
    for(let k=0;k<3;k++){ const an=u*.9+k*Math.PI*2/3, ox=ax+Math.cos(an)*175*av, oy=ay+Math.sin(an)*44*av; c.save(); c.globalAlpha*=av; c.fillStyle='rgba(20,20,24,.92)'; c.beginPath(); c.arc(ox,oy,24,0,7); c.fill(); c.strokeStyle='rgba(255,106,19,.6)'; c.lineWidth=2; c.stroke(); marketIcon(c,k,ox,oy,.62); c.restore(); } }
  drawResult(c,s,i,u,run,'glass',1236);
  const fl=1-seg(u,0,.16); if(fl>0){ c.save(); c.globalAlpha=fl*.8; c.fillStyle=WH; c.fillRect(0,0,W,H); c.restore(); }
}

/* QUARTA — celular fly-through: a câmera sai de dentro da tela, texto com aberração cromática, notificação do resultado */
function chromaText(c,s,x,y,font,col,p,align='center'){ if(p<=0) return; const d=(1-p)*46; c.save(); c.globalAlpha*=Math.min(1,p*1.4);
  if(d>1){ c.globalAlpha*=.55; txt(c,s,x-d,y,font,'#FF2D2D',align); txt(c,s,x+d,y,font,'#1FB6FF',align); txt(c,s,x+d*.5,y+2,font,O,align); c.globalAlpha/=.55; }
  txt(c,s,x+(1-p)*-60,y,font,col,align); c.restore(); }
function cardQua(c,i,u,run){ const s=S[i], m=i%2?-1:1, fly=eio(seg(u,0,.9)), sc=3.4-2.4*fly, cy=872+Math.sin(u*1.3)*4*fly;
  chromaText(c,kickerFor(i),540,412,fSerif(42),P.ink2,eo(seg(u,.35,.8)));
  const nm=s.name.toUpperCase(); chromaText(c,nm,540,486,fBlack(fitF(c,nm,880,fBlack,84)),P.ink,eo(seg(u,.5,.95)));
  const gl=c.createRadialGradient(540,cy+330,10,540,cy+330,460); gl.addColorStop(0,`rgba(255,106,19,${.35*fly})`); gl.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=gl; c.fillRect(60,cy-100,960,800);
  const scr=(cc,w,h)=>{ if(s._p) coverFocus(cc,s._p,-w/2,-h/2,w,h,zoomP(u),s.fx,s.fy); else { cc.fillStyle='#16161A'; cc.fillRect(-w/2,-h/2,w,h); txt(cc,'PRINT DO ALUNO',0,0,fBold(22),'#8A8782','center',3); } };
  if(fly<1){ for(let k=2;k>=1;k--){ c.save(); c.globalAlpha*=.18*(1-fly); phone3D(c,540+k*24*(1-fly)*m,cy,340,680,0,-.02*m,sc*(1+k*.04),scr,s,u); c.restore(); } }
  phone3D(c,540,cy,340,680,(1-fly)*.25*m,-.02*m*fly,sc,scr,s,u);
  const W2=(340-28)*sc, H2=(680-28)*sc; if(fly>=1&&s._p) magnifier(c,s,540-W2/2,cy-H2/2,W2,H2,zoomP(u),u);
  const ba=back(seg(u,.75,1.15)); if(ba>0){ const bx=540+(340*sc/2-4)*m, by=cy-680*sc/2+120; c.save(); c.translate(bx,by); c.scale(ba,ba); c.save(); shadowOn(c,20,10,.4); c.fillStyle=O; c.beginPath(); c.arc(0,0,58,0,7); c.fill(); shadowOff(c); c.restore(); c.restore(); avatar(c,s._a,bx,by,52*ba); }
  const na=eo(seg(u,1.75,2.1))*(1-eo(seg(u,3.3,3.7))); if(na>0){ const ny=600-(1-na)*160+eo(seg(u,3.3,3.7))*500; c.save(); c.globalAlpha*=Math.min(1,na*1.4); shadowOn(c,40,18,.35); rr(c,150,ny-62,780,124,30); c.fillStyle='rgba(255,255,255,.97)'; c.fill(); shadowOff(c);
    rr(c,176,ny-38,76,76,18); c.fillStyle=K; c.fill(); logo(c,214,ny,62,false); txt(c,'TRADER SCHOOL · agora',276,ny-22,fBold(19),'#6E6B67','left',2);
    const v='+'+brl(s.value)+' · Resultado do dia'; txt(c,v,276,ny+18,fBlack(fitF(c,v,620,fBlack,30)),K,'left'); handleTag(c,s,904,ny-22,u,1.8,'#EFEDEA','#3A3A3E','right',17); c.restore(); }
  drawResult(c,s,i,u,run,'slab',1236);
}

/* QUINTA — caderno do trader: bloco preso com alfinete, nome com risco laranja, print com fita, polaroid com clipe */
function techSketch(c,u,a){ if(a<=0) return; c.save(); c.globalAlpha*=a*.16; c.strokeStyle=WH; c.lineWidth=1.2;
  for(let x=60;x<1040;x+=90){ c.beginPath(); c.moveTo(x,400); c.lineTo(x,1200); c.stroke(); } for(let y=420;y<1200;y+=90){ c.beginPath(); c.moveTo(40,y); c.lineTo(1040,y); c.stroke(); }
  c.lineWidth=2; c.beginPath(); c.arc(930,520,70,0,Math.PI*2*eo(a)); c.stroke(); c.beginPath(); c.moveTo(80,1160); c.lineTo(420,1160); c.moveTo(80,1150); c.lineTo(80,1170); c.moveTo(420,1150); c.lineTo(420,1170); c.stroke(); txt(c,'x2  x4',960,1190,fMed(22),WH,'right'); c.restore(); }
function tape(c,x,y,r,w=120){ c.save(); c.translate(x,y); c.rotate(r); c.fillStyle='rgba(255,226,180,.78)'; c.fillRect(-w/2,-16,w,32); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(-w/2,-16,w,6); c.restore(); }
function cardQui(c,i,u,run){ const s=S[i], m=i%2?-1:1;
  techSketch(c,u,eo(seg(u,0,.6)));
  const pa=back(seg(u,0,.6)); if(pa>0){ const w=760,h=318, x0=540-w/2, y0=392; c.save(); c.translate(540,y0+h/2-(1-pa)*500); c.rotate(-.02*m+(1-Math.min(1,pa))*.2); c.translate(-540,-(y0+h/2));
    shadowOn(c,50,26,.55); c.fillStyle='#F7F5F0'; c.fillRect(x0,y0,w,h); shadowOff(c);
    c.strokeStyle='rgba(40,70,140,.15)'; c.lineWidth=2; for(let y=y0+80;y<y0+h-14;y+=44){ c.beginPath(); c.moveTo(x0+16,y); c.lineTo(x0+w-16,y); c.stroke(); }
    for(let k=0;k<12;k++){ c.fillStyle='#0E0E10'; c.beginPath(); c.arc(x0+36+k*63,y0+24,9,0,7); c.fill(); }
    const pinA=back(seg(u,.2,.45)); if(pinA>0){ c.save(); c.translate(x0+w-50,y0+26); c.scale(pinA,pinA); shadowOn(c,10,6,.4); c.fillStyle=O; c.beginPath(); c.arc(0,0,18,0,7); c.fill(); shadowOff(c); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.arc(-5,-5,5,0,7); c.fill(); c.restore(); }
    reveal(c,kickerFor(i),x0+50,y0+92,fSerif(40),'#3A3A3E',u,.3,{mode:'type',dur:.45,align:'left'});
    const nm=s.name.toUpperCase(), nf=fAnton(fitF(c,nm,w-100,fAnton,118)), nw=tw(c,nm,nf), sk=eo(seg(u,.45,.85));
    if(sk>0){ c.fillStyle=O; c.fillRect(x0+44,y0+196,(nw+16)*sk,20); }
    reveal(c,nm,x0+50,y0+188,nf,K,u,.45,{mode:'rise',align:'left'});
    if(s.handle&&s.handle.length>1) reveal(c,s.handle,x0+50,y0+276,fMed(26),'#6E6B67',u,.75,{mode:'type',dur:.4,align:'left'});
    c.restore(); }
  const ka=back(seg(u,.55,1.0)), pw=580, ph=390, cx=540-120*m, cy=930;
  if(ka>0){ c.save(); c.translate(cx,cy+(1-ka)*300); c.rotate(.04*m*Math.min(1,ka)+(1-Math.min(1,ka))*.3); shadowOn(c,50,26,.55); c.fillStyle='#F7F5F0'; c.fillRect(-pw/2-12,-ph/2-12,pw+24,ph+24); shadowOff(c);
    drawPrint(c,s,-pw/2,-ph/2,pw,ph,u,4,false); tape(c,-pw/2+20,-ph/2-4,-.6); tape(c,pw/2-20,-ph/2-4,.6); c.restore();
    if(s._p&&ka>=1){ c.save(); c.translate(cx,cy); c.rotate(.04*m); magnifier(c,s,-pw/2,-ph/2,pw,ph,zoomP(u),u); c.restore(); } }
  const pp=back(seg(u,.75,1.15)); if(pp>0){ const px=540+330*m, py=980; c.save(); c.translate(px,py-(1-pp)*120); c.rotate(-.08*m); photoFrame(c,s._a,0,0,170,200,0); c.fillStyle='#9A9792'; rr(c,-16,-128,32,58,10); c.fill(); c.strokeStyle='#5E5B57'; c.lineWidth=4; rr(c,-10,-122,20,46,8); c.stroke(); c.restore(); }
  const r=drawResult(c,s,i,u,run,'paper',1236,false);
  if(r){ const e=eo(seg(u,2.05,2.6))*(1-seg(u,4.0,4.4)); if(e>0){ c.save(); c.strokeStyle=O; c.lineWidth=7; c.lineCap='round'; c.beginPath(); const cxv=r.vx+r.vw/2, cyv=r.vy-2;
    for(let q=0;q<=Math.min(1,e*1.05);q+=.008){ const an=-2.4+q*Math.PI*2.25, rx=(r.vw/2+40)*(1+.05*Math.sin(q*13)), ry=56*(1+.06*Math.cos(q*9)); const x=cxv+Math.cos(an)*rx, y=cyv+Math.sin(an)*ry; if(q===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); c.restore(); } }
}

/* SEXTA — plantão do pregão: página de jornal caindo em 3D, foto P&B, print com lupa, carimbo do valor */
function cardSex(c,i,u,run){ const s=S[i], m=i%2?-1:1, x0=96, y0=396, w=888, h=1030;
  const fa=back(seg(u,0,.6)), sy=Math.min(1.02,.25+.75*Math.min(1,fa));
  c.save(); c.translate(540,y0+h/2-(1-Math.min(1,fa))*900); c.transform(1,0,(1-Math.min(1,fa))*.25*m,sy,0,0); c.rotate((1-Math.min(1,fa))*.25*m-.012*m); c.translate(-540,-(y0+h/2));
  shadowOn(c,80,44,.6); c.fillStyle='#F3F0E9'; c.fillRect(x0,y0,w,h); shadowOff(c);
  txt(c,'PLANTÃO DO PREGÃO',540,y0+62,fSerifB(fitF(c,'PLANTÃO DO PREGÃO',w-80,fSerifB,64)),K,'center',1);
  c.fillStyle=K; c.fillRect(x0+30,y0+104,w-60,4); c.fillRect(x0+30,y0+112,w-60,1.5);
  txt(c,'TRADER SCHOOL · '+(days[curDay]?days[curDay].date:'')+' · EDIÇÃO '+pad2(i+1)+'/'+pad2(S.length),540,y0+138,fBold(18),'#6E6B67','center',3);
  reveal(c,kickerFor(i),540,y0+188,fSerif(38),'#4A4844',u,.5,{mode:'ghost'});
  const nm=s.name.toUpperCase(); reveal(c,nm,540,y0+258,fSerifB(fitF(c,nm,w-80,fSerifB,92)),K,u,.6,{mode:'rise'});
  if(s.handle&&s.handle.length>1) txt(c,s.handle,540,y0+314,fMed(22),'#6E6B67','center',1);
  const top=y0+342, ph=360, aw=320, pw=w-60-aw-20, ax=m>0?x0+30:x0+w-30-aw, px=m>0?ax+aw+20:x0+30;
  c.save(); c.beginPath(); c.rect(ax,top,aw,ph); c.clip(); if(s._ag) cover(c,s._ag,ax-50,top-50,aw+100,ph+100); else silhouette(c,ax+aw/2,top+ph/2,aw/2); c.restore(); c.strokeStyle=K; c.lineWidth=2; c.strokeRect(ax,top,aw,ph);
  drawPrint(c,s,px,top,pw,ph,u,0,false); c.strokeRect(px,top,pw,ph);
  c.fillStyle='rgba(0,0,0,.16)'; for(let col=0;col<3;col++) for(let l=0;l<6;l++){ const cw=(w-100)/3; c.fillRect(x0+30+col*(cw+20),top+ph+28+l*20,cw-(l===5?60:0),8); }
  const fy=y0+h-190; c.fillStyle=K; c.fillRect(x0,fy,w,190);
  c.restore();
  if(fa>=1&&s._p) magnifier(c,s,px,top,pw,ph,zoomP(u),u);
  /* rodapé de cotação: resultado do dia + turma hoje + 01/08 */
  if(fa>.95){ const fy=y0+h-190; txt(c,'RESULTADO DO DIA',x0+40,fy+40,fBold(20),'#9A9792','left',5); const vNow=valNow(s,u), vf=fBlack(fitF(c,'+'+brl(s.value),470,fBlack,70)); txt(c,'+R$',x0+40,fy+108,vf,O,'left'); txt(c,brl(vNow).slice(3),x0+40+tw(c,'+R$ ',vf),fy+108,vf,WH,'left');
    const rv=brl(run(u)); txt(c,'TURMA HOJE ▲',x0+w-40,fy+46,fBold(20),'#9A9792','right',4); txt(c,rv,x0+w-40,fy+96,fBlack(fitF(c,rv,320,fBlack,38)),O,'right'); txt(c,pad2(i+1)+' / '+pad2(S.length),x0+w-40,fy+146,fBold(20),WH,'right',4);
    slider(c,x0+40,x0+600,fy+160,(i+eo(seg(u,.8,2)))/S.length,O,'#4A4A50'); }
  /* carimbo */
  const st=seg(u,2.0,2.2); if(st>0){ const z=1+1.2*(1-eo(st)), sh=st<1?0:Math.sin(u*60)*Math.max(0,1-(u-2.2)*6)*4, sx=540, syy=top+ph/2+40;
    c.save(); c.translate(sx+sh,syy); c.rotate(-.13); c.scale(z,z); c.globalAlpha*=Math.min(1,st*2)*(1-seg(u,4.1,4.4)); const v='+'+brl(s.value), vf=fBlack(fitF(c,v,520,fBlack,74)), bw=Math.max(tw(c,v,vf),tw(c,'RESULTADO DO DIA',fBold(24),6))+70;
    c.strokeStyle=O; c.lineWidth=8; rr(c,-bw/2,-80,bw,160,14); c.stroke(); c.lineWidth=2.5; rr(c,-bw/2+12,-68,bw-24,136,10); c.stroke(); c.fillStyle='rgba(243,240,233,.82)'; rr(c,-bw/2+14,-66,bw-28,132,9); c.fill();
    txt(c,v,0,-12,vf,O,'center'); txt(c,'RESULTADO DO DIA',0,46,fBold(24),O,'center',6); c.restore(); }
}
const CARDS={seg:cardSeg,ter:cardTer,qua:cardQua,qui:cardQui,sex:cardSex};
function sceneStudent(c,i,u,run){ (CARDS[curDay]||cardSeg)(c,i,u,run); }
const STUDENT_CUES={
  seg:[[.05,'swish'],[.3,'type'],[.4,'click'],[.6,'swish'],[1.0,'zoom'],[1.45,'whoosh'],[2.0,'cash'],[2.08,'pop']],
  ter:[[0,'impact'],[.25,'whoosh'],[.55,'pop'],[.7,'buzz'],[1.0,'zoom'],[1.45,'whoosh'],[2.0,'cash'],[2.08,'scribble']],
  qua:[[0,'whoosh'],[.4,'swish'],[.75,'pop'],[1.0,'zoom'],[1.45,'swish'],[1.8,'pop'],[2.0,'cash']],
  qui:[[0,'whoosh'],[.22,'pop'],[.35,'type'],[.55,'swish'],[.8,'pop'],[1.0,'zoom'],[1.45,'whoosh'],[2.0,'cash'],[2.1,'scribble']],
  sex:[[0,'whoosh'],[.5,'impact'],[.7,'type'],[1.0,'zoom'],[1.45,'swish'],[2.0,'stamp'],[2.05,'cash']]
};

/* sábado */
function box3D(c,x,y,w,h,dx,dy,front,top,side){ c.fillStyle=side; c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w+dx,y+h-dy); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  c.fillStyle=top; c.beginPath(); c.moveTo(x,y); c.lineTo(x+dx,y-dy); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w,y); c.closePath(); c.fill();
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,front[0]); g.addColorStop(1,front[1]); c.fillStyle=g; c.fillRect(x,y,w,h); }
/* =====================================================================
   DESTAQUE DO DIA — segue a linguagem da capa de cada dia
   ===================================================================== */
let FX2=null, fx2=null;
function fisheye(c,cx,cy,LW,LH,open,rows,t,speed=300){ if(open<=.01) return; const sw=Math.max(8,Math.round(LW*Q)), sh=Math.max(8,Math.round(LH*Q));
  if(!FX2){ FX2=document.createElement('canvas'); fx2=FX2.getContext('2d'); } if(FX2.width!==sw||FX2.height!==sh){ FX2.width=sw; FX2.height=sh; }
  fx2.setTransform(Q,0,0,Q,0,0); const g=fx2.createRadialGradient(LW/2,LH/2,40,LW/2,LH/2,LW*.6); g.addColorStop(0,'#F6F5F3'); g.addColorStop(.65,'#CFCDC9'); g.addColorStop(1,'#6F6C67'); fx2.fillStyle=g; fx2.fillRect(0,0,LW,LH);
  const rh=LH/rows.length; rows.forEach(([w,col,dir],r)=>{ const fz=Math.min(190,rh*.95); fx2.font=fBlack(fz); fx2.textBaseline='middle'; fx2.textAlign='left'; fx2.fillStyle=col; const unit=fx2.measureText(w+'   ').width, off=(((t*speed+r*200)*dir)%unit+unit)%unit; for(let x=off-2*unit;x<LW+unit;x+=unit) fx2.fillText(w,x,rh*(r+.5)+fz*.06); });
  c.save(); c.beginPath(); c.ellipse(cx,cy,LW/2,LH/2*open,0,0,7); c.clip(); c.fillStyle='#55524E'; c.fillRect(cx-LW/2,cy-LH/2,LW,LH);
  const N=72; for(let i=0;i<N;i++){ const u0=i/N, u1=(i+1)/N, xm=(u0+u1)-1, sy=.58+.42*Math.cos(xm*Math.PI/2), d0=cx+Math.sin((u0*2-1)*Math.PI/2)*LW/2, d1=cx+Math.sin((u1*2-1)*Math.PI/2)*LW/2, dh=LH*sy*open;
    c.drawImage(FX2,u0*sw,0,Math.max(1,(u1-u0)*sw),sh,d0,cy-dh/2,d1-d0+.8,dh); }
  const vg=c.createRadialGradient(cx,cy,LW*.3,cx,cy,LW*.55); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=vg; c.fillRect(cx-LW/2,cy-LH/2,LW,LH); c.restore();
  c.save(); c.globalAlpha*=open; c.strokeStyle=O; c.lineWidth=6; c.shadowColor=O; c.shadowBlur=40*Q; c.beginPath(); c.ellipse(cx,cy,LW/2,LH/2*open,0,.12*Math.PI,.88*Math.PI); c.stroke(); c.restore(); }
function hlValue(c,s,t,t0,y,bg,fg){ const v='+'+brl(s.value); tagBox(c,v,540,y,fBlack(fitF(c,v,760,fBlack,62)),t,t0,bg,fg); }
function hlQuote(c,t,y,col){ reveal(c,D.quote[0],540,y,fSerif(34),col,t,2.3,{mode:'ghost'}); reveal(c,D.quote[1],540,y+44,fSerif(34),col,t,2.5,{mode:'ghost'}); }

/* SEGUNDA — retrato em moldura sobre a base 3D com o nome */
function hlSeg(c,t){ const s=S[0];
  reveal(c,'O destaque',540,430,fSerif(52),P.ink2,t,.1,{mode:'ghost'}); reveal(c,'do dia',540,502,fSerif(84),O,t,.35,{mode:'rise'});
  const a=eo(seg(t,.45,1.05)); if(a>0){ c.save(); c.translate(0,(1-a)*90+Math.sin(t*1.3)*5); if(a<1&&s._at) photoFrame(c,s._at,540,800,330,400,(1-a)*.25,1-a); photoFrame(c,s._a,540,800,330,400,-.03+(1-a)*.25,a); c.restore(); }
  sparkle(c,800,600,24,eo(seg(t,1,1.4))); plus(c,250,660,14,eo(seg(t,1.1,1.5))); sparkle(c,260,960,14,eo(seg(t,1.2,1.6)));
  const ks=eo(seg(t,1.0,1.45)); if(ks>0){ c.save(); c.globalAlpha*=ks; c.translate(0,(1-ks)*120); slab(c,130,1062,820,150); c.restore(); }
  const nm=s.name.toUpperCase(); reveal(c,nm,540,1138,fBlack(fitF(c,nm,720,fBlack,104)),P.plateText,t,1.25,{mode:'rise'});
  hlValue(c,s,t,1.9,1292,O,WH); hlQuote(c,t,1380,P.grey); }

/* TERÇA — lente com "PARABÉNS" correndo, foto com anel neon e nome aceso */
function hlTer(c,t){ const s=S[0], cy=780, open=eo(seg(t,.1,.6));
  reveal(c,'O destaque do dia',540,428,fSerif(50),P.ink2,t,.05,{mode:'ghost'});
  fisheye(c,540,cy,1000,540,open,[['PARABÉNS',K,-1],[s.name.toUpperCase(),O,1],['PARABÉNS',K,-1]],t,260);
  const k=back(seg(t,.5,1.1)); if(k>0){ const fl=.8+.2*Math.sin(t*7); c.save(); c.translate(540,cy); c.scale(k,k); c.save(); c.shadowColor=O; c.shadowBlur=60*Q*fl; c.fillStyle=O; c.beginPath(); c.arc(0,0,178,0,7); c.fill(); c.restore(); c.fillStyle=K; c.beginPath(); c.arc(0,0,170,0,7); c.fill(); c.restore();
    avatar(c,s._a,540,cy,162*k); }
  const g=eo(seg(t,1.2,1.7)); if(g>0){ const nm=s.name.toUpperCase(), fz=fitF(c,nm,860,fBlack,118); c.save(); c.globalAlpha*=g; c.translate(540,1150); c.scale(.85+.15*g,.85+.15*g); glowText(c,nm,0,0,fBlack(fz),O,'#FFE2CC',.85+.15*Math.sin(t*9)); c.restore(); }
  hlValue(c,s,t,1.9,1282,O,K); hlQuote(c,t,1374,P.grey); }

/* QUARTA — manchete "DESTAQUE", muro e a lupa revelando a foto */
function hlQua(c,t){ const s=S[0], fz=fitF(c,'DESTAQUE',900,fAnton,210), hw=tw(c,'DESTAQUE',fAnton(fz));
  reveal(c,'DESTAQUE',540,505,fAnton(fz),O,t,.05,{mode:'rise',big:true});
  const ul=eo(seg(t,.6,1.0)); if(ul>0){ c.fillStyle=K; c.fillRect(540-hw/2,612,hw*ul,9); }
  const kb=eo(seg(t,.35,.9)); if(kb>0){ c.save(); c.translate((1-kb)*1150,0); shadowOn(c,30,14,.25); for(let r=0;r<5;r++){ const y=690+r*64, off=r%2?-74:0; for(let x=off-20;x<1100;x+=148){ rr(c,x,y,140,56,5); c.fillStyle=r%2?'#3C3C41':'#56565C'; c.fill(); } } shadowOff(c); c.restore(); }
  const kl=eo(seg(t,.9,1.8)); if(kl>0){ const R=180, lx=540-(1-kl)*560+Math.sin(t*2)*4*kl, ly=850+(1-kl)*50+Math.cos(t*1.7)*3*kl;
    c.save(); shadowOn(c,40,22,.45); c.beginPath(); c.arc(lx,ly,R+12,0,7); c.fillStyle='#111'; c.fill(); shadowOff(c); c.restore();
    c.save(); c.beginPath(); c.arc(lx,ly,R,0,7); c.clip(); c.fillStyle='#FBFAF8'; c.fillRect(lx-R,ly-R,2*R,2*R); if(s._a) cover(c,s._a,540-170,850-170,340,340); else silhouette(c,540,850,170);
      const g=c.createLinearGradient(lx-R,ly-R,lx+R*.2,ly+R*.2); g.addColorStop(0,'rgba(255,255,255,.4)'); g.addColorStop(.4,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(lx-R,ly-R,2*R,2*R); c.restore();
    lensRim(c,lx,ly,R); }
  [[935,640,.16,1.7],[150,1050,-.12,1.85]].forEach(([x,y,r,t0])=>{ const e=back(seg(t,t0,t0+.45)); if(e<=0) return; c.save(); c.translate(x,y); c.rotate(r); c.scale(e,e); txt(c,'#',0,0,fAnton(120),K,'center'); c.restore(); });
  reveal(c,'Parabéns,',430,1098,fSerif(50),P.ink2,t,1.3,{mode:'ghost'});
  const nm=s.name.toUpperCase(); reveal(c,nm,540,1190,fAnton(fitF(c,nm,820,fAnton,120)),K,t,1.5,{mode:'rise',big:true});
  hlValue(c,s,t,1.95,1305,K,WH); hlQuote(c,t,1392,P.grey); }

/* QUINTA — folha de caderno: foto presa com fita, nome circulado e valor */
function hlQui(c,t){ const s=S[0];
  reveal(c,'O destaque do dia',540,428,fSerif(46),P.ink2,t,.05,{mode:'ghost'});
  const kp=back(seg(t,.1,.8)); if(kp>0){ const w=680,h=640; c.save(); c.translate(540,800+(1-kp)*900); c.rotate(.03-(1-kp)*.3);
    shadowOn(c,60,30,.55); c.beginPath(); c.moveTo(-w/2,-h/2); c.lineTo(w/2,-h/2); c.lineTo(w/2,h/2-12); for(let k=0;k<=24;k++) c.lineTo(w/2-k*w/24,h/2-12+(k%2?12:-2)+RND(k+5)*6); c.closePath(); c.fillStyle='#F7F5F0'; c.fill(); shadowOff(c);
    c.strokeStyle='rgba(40,70,140,.16)'; c.lineWidth=2; for(let y=-h/2+100;y<h/2-30;y+=50){ c.beginPath(); c.moveTo(-w/2+20,y); c.lineTo(w/2-20,y); c.stroke(); }
    c.strokeStyle='rgba(255,106,19,.55)'; c.beginPath(); c.moveTo(-w/2+78,-h/2+64); c.lineTo(-w/2+78,h/2-20); c.stroke();
    for(let k=0;k<10;k++){ c.fillStyle='#0E0E10'; c.beginPath(); c.arc(-w/2+60+k*62,-h/2+30,11,0,7); c.fill(); }
    reveal(c,'hoje o destaque é',20,-232,fSerif(50),K,t,.7,{mode:'type',dur:.5});
    const pa=back(seg(t,1.0,1.45)); if(pa>0){ c.save(); c.translate(0,-50); c.scale(pa,pa); photoFrame(c,s._a,0,0,230,250,-.05); c.fillStyle='rgba(255,220,170,.75)'; c.save(); c.rotate(-.5); c.fillRect(-60,-158,120,30); c.restore(); c.save(); c.rotate(.45); c.fillRect(-60,-156,120,30); c.restore(); c.restore(); }
    const nm=s.name.toUpperCase(), fz=fitF(c,nm,520,fAnton,110), nw=tw(c,nm,fAnton(fz)); reveal(c,nm,20,148,fAnton(fz),K,t,1.5,{mode:'blur'});
    const e=eo(seg(t,1.85,2.4)); if(e>0){ c.strokeStyle=O; c.lineWidth=8; c.lineCap='round'; c.beginPath(); for(let q=0;q<=e;q+=.01){ const an=-2.5+q*Math.PI*2.2, x=20+Math.cos(an)*(nw/2+50)*(1+.035*Math.sin(q*11)), y=150+Math.sin(an)*72; if(q===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); }
    reveal(c,'parabéns!',200,262,fSerif(54),O,t,2.45,{mode:'type',dur:.35});
    c.restore(); }
  hlValue(c,s,t,2.0,1236,O,K); hlQuote(c,t,1338,P.grey); }

/* SEXTA — celular 3D com o perfil do destaque e "PARABÉNS" em neon */
function profileScreen(s,t){ return (c,w,h)=>{ const g=c.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,'#17171B'); g.addColorStop(1,'#0A0A0C'); c.fillStyle=g; c.fillRect(-w/2,-h/2,w,h);
  txt(c,'9:41',-w/2+30,-h/2+22,fBold(15),WH,'left'); c.fillStyle=O; c.fillRect(-w/2,-h/2+48,w,4);
  c.save(); c.shadowColor=O; c.shadowBlur=20*Q; c.strokeStyle=O; c.lineWidth=6; c.beginPath(); c.arc(0,-150,82,0,7); c.stroke(); c.restore(); avatar(c,s._a,0,-150,74);
  txt(c,ellip(c,s.name.toUpperCase(),w-40,fBlack(32)),0,-42,fBlack(32),WH,'center'); txt(c,ellip(c,s.handle||'',w-40,fMed(17)),0,-8,fMed(17),'#9A9792','center');
  c.fillStyle='rgba(255,255,255,.1)'; c.fillRect(-w/2+24,20,w-48,2); txt(c,'RESULTADO DO DIA',0,48,fBold(14),'#9A9792','center',3);
  const v='+'+brl(s.value*eo(seg(t,1.3,2.2))); txt(c,v,0,90,fBlack(fitF(c,v,w-40,fBlack,40)),O,'center');
  c.save(); c.strokeStyle=O; c.lineWidth=4; c.lineJoin='round'; c.beginPath(); const pts=[0,.1,.05,.25,.2,.42,.38,.6,.55,.82,1], e=eo(seg(t,1.4,2.4)); pts.forEach((p,k)=>{ const x=-w/2+30+(w-60)*k/(pts.length-1), y=230-p*90; if(k/(pts.length-1)<=e){ if(k===0) c.moveTo(x,y); else c.lineTo(x,y); } }); c.stroke(); c.restore();
  rr(c,-90,128,180,34,17); c.fillStyle=O; c.fill(); txt(c,'DESTAQUE DO DIA',0,146,fBold(13),K,'center',2); }; }
function hlSex(c,t){ const s=S[0], k=eo(seg(t,.05,1.25)), ang=(1-k)*Math.PI*2.25, sc=.45+.5*k, cy=770+Math.sin(t*1.4)*5*k;
  const gl=c.createRadialGradient(540,cy+290*sc,10,540,cy+290*sc,420); gl.addColorStop(0,`rgba(255,106,19,${.45*k})`); gl.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=gl; c.fillRect(100,cy-200,880,900);
  dashRing(c,540,cy,400*sc,t*.6,'rgba(255,255,255,.25)',3,.4);
  phone3D(c,540,cy,330,660,ang,-.05*k+(1-k)*.3,sc,profileScreen(s,t),s,t);
  const g=eo(seg(t,1.6,2.1)); if(g>0){ const fz=fitF(c,'PARABÉNS',860,fBlack,140); c.save(); c.globalAlpha*=g; c.translate(540,1170+(1-g)*40); glowText(c,'PARABÉNS',0,0,fBlack(fz),O,'#FFE2CC',.75+.25*Math.sin(t*6)); c.restore(); }
  hlValue(c,s,t,2.0,1284,WH,K); hlQuote(c,t,1372,P.grey); }
const HLS={seg:hlSeg,ter:hlTer,qua:hlQua,qui:hlQui,sex:hlSex};
function sceneHL(c,t){ (HLS[curDay]||hlSeg)(c,t); }
const HL_CUES={
  seg:[[.1,'swish'],[.35,'whoosh'],[.5,'pop'],[1.0,'impact'],[1.3,'type'],[1.9,'cash'],[2.2,'type']],
  ter:[[.05,'drone'],[.1,'whoosh'],[.5,'impact'],[.6,'buzz'],[1.2,'buzz'],[1.9,'cash'],[2.2,'type']],
  qua:[[.05,'whoosh'],[.35,'swish'],[.6,'click'],[.9,'whoosh'],[1.5,'impact'],[1.7,'pop'],[1.85,'pop'],[1.95,'cash']],
  qui:[[.1,'whoosh'],[.7,'type'],[1.0,'pop'],[1.5,'impact'],[1.85,'scribble'],[2.0,'cash'],[2.45,'type']],
  sex:[[.05,'riser'],[1.25,'impact'],[1.4,'click'],[1.6,'buzz'],[1.7,'shimmer'],[2.0,'cash']]
};

/* =====================================================================
   SÁBADO — cenas da semana na mesma linha das capas
   ===================================================================== */
function weekTitle(c,o,a,b){ reveal(c,a,540,432,fSerif(50),WH,o,.05,{mode:'type',dur:.4}); reveal(c,b,540,550,fAnton(fitF(c,b,880,fAnton,124)),K,o,.25,{mode:'rise',big:true}); }
function sceneBars(c,o){ weekTitle(c,o,'A semana','EM NÚMEROS');
  const max=Math.max(1,...WK.dayTotals);
  WK.dayTotals.forEach((v,k)=>{ const y=665+k*120, a=eo(seg(o,.5+k*.15,1.25+k*.15)), best=v===max&&v>0, bw=Math.max(26,560*v/max)*a;
    c.save(); c.globalAlpha*=seg(o,.5+k*.15,.7+k*.15); c.translate((1-a)*-80,0); txt(c,THEMES[WEEK[k]].tab,120,y-6,fAnton(68),K,'left'); txt(c,WK.dates[k]||'',122,y+40,fBold(20),'rgba(30,12,2,.7)','left',2); c.restore();
    if(a>0){ c.save(); shadowOn(c,24,12,.3); rr(c,270,y-38,bw,76,16); c.fillStyle=best?WH:K; c.fill(); shadowOff(c); c.restore();
      const vs=v?brl(v*a):'—', vf=fBlack(fitF(c,vs,520,fBlack,32)), vw=tw(c,vs,vf); if(bw>vw+40) txt(c,vs,270+bw-18,y+2,vf,best?O:WH,'right'); else txt(c,vs,270+bw+16,y+2,vf,K,'left');
      if(best&&a>.95) sparkle(c,270+bw+26,y-46,16,back(seg(o,1.6,2.0)),WH); } });
  const kt=back(seg(o,2.0,2.5)); if(kt>0){ c.save(); c.translate(540,1296+(1-kt)*60); c.scale(.9+.1*Math.min(1,kt),.9+.1*Math.min(1,kt)); shadowOn(c,40,22,.35); rr(c,-390,-58,780,116,22); c.fillStyle=WH; c.fill(); shadowOff(c);
    txt(c,'TOTAL DA SEMANA',-350,2,fBold(22),'#6E6B67','left',4); const tv=brl(WK.total*eo(seg(o,2.1,3.2))); txt(c,tv,350,2,fBlack(fitF(c,brl(WK.total),420,fBlack,52)),O,'right'); c.restore(); }
  reveal(c,WK.ops+' operações no lucro · '+WK.rank.length+' alunos',540,1408,fSerif(34),WH,o,2.6,{mode:'ghost'}); }
function trophy(c,cx,cy,s,a){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(s,s); const g=c.createLinearGradient(-60,-80,60,60); g.addColorStop(0,'#FFFFFF'); g.addColorStop(.5,'#F2F0EC'); g.addColorStop(1,'#B8B4AE'); c.fillStyle=g;
  shadowOn(c,20,10,.3); c.beginPath(); c.moveTo(-60,-80); c.lineTo(60,-80); c.quadraticCurveTo(60,10,0,24); c.quadraticCurveTo(-60,10,-60,-80); c.fill(); shadowOff(c);
  c.lineWidth=10; c.strokeStyle=g; c.beginPath(); c.arc(-62,-48,26,Math.PI*.5,Math.PI*1.5); c.stroke(); c.beginPath(); c.arc(62,-48,26,-Math.PI*.5,Math.PI*.5); c.stroke();
  c.fillStyle=K; c.fillRect(-10,22,20,34); c.fillRect(-44,56,88,18); c.restore(); }
function scenePodium(c,o){
  const gk=eo(seg(o,.2,.9)); if(gk>0){ c.save(); c.globalAlpha*=.16*gk; c.translate(540,860); c.scale(.8+.2*gk,.8+.2*gk); txt(c,'TOP 3',0,0,fAnton(330),WH,'center'); c.restore(); }
  weekTitle(c,o,'O pódio','DA SEMANA');
  const base=1395, spots=[[1,90,260,170,1],[2,730,260,120,2],[0,400,280,240,0]];
  spots.forEach(([idx,x,w,hh,order])=>{ const s=WK.rank[idx]; if(!s) return; const t0=.5+[.35,0,.7][idx], a=eo(seg(o,t0,t0+.6)), h=hh*a, top=base-h;
    c.save(); shadowOn(c,40,24,.3); box3D(c,x,top,w,h,26,18,idx===0?['#FFFFFF','#E4E2DE']:['#2A2A2E','#0E0E10'],idx===0?'#FFFFFF':'#4A4A50',idx===0?'#B8B4AE':'#000'); shadowOff(c); c.restore();
    if(a>.3){ c.save(); c.globalAlpha*=seg(o,t0+.2,t0+.5); const fc=idx===0?K:WH; txt(c,ellip(c,s.name.toUpperCase(),w-20,fBlack(28)),x+w/2,top+38,fBlack(28),fc,'center'); txt(c,'+'+brl(s.total),x+w/2,top+74,fBlack(fitF(c,'+'+brl(s.total),w-24,fBlack,24)),O,'center'); c.restore(); }
    const d=back(seg(o,t0+.45,t0+1.05)); if(d>0){ const pw=idx===0?200:160, ph=idx===0?236:190, py=top-ph/2-14-(1-d)*700; c.save(); c.translate(x+w/2,py); c.rotate((idx===1?.06:idx===2?-.06:0)+(1-d)*.4); photoFrame(c,s._a,0,0,pw,ph,0);
      c.fillStyle=O; c.beginPath(); c.arc(pw/2-6,-ph/2+6,30,0,7); c.fill(); txt(c,String(idx+1),pw/2-6,-ph/2+8,fAnton(38),WH,'center'); c.restore(); }
    if(idx===0){ trophy(c,x+w/2,top-236-14-110,.75,back(seg(o,2.1,2.5))); sparkle(c,x+w+40,top-300,20,eo(seg(o,2.2,2.6)),WH); sparkle(c,x-40,top-200,14,eo(seg(o,2.3,2.7)),WH); } }); }
function sceneRank(c,o,page){ weekTitle(c,o,'O ranking','DA SEMANA');
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const a=back(seg(o,.4+j*.12,1.0+j*.12)), y=600+j*136, sd=j%2?1:-1;
    c.save(); c.globalAlpha*=seg(o,.4+j*.12,.6+j*.12); c.translate(540+(1-a)*700*sd,y+59); c.rotate((1-a)*.15*sd); c.translate(-540,-(y+59)); floatCard(c,90,y,900,118,24);
    txt(c,String(start+j+1),150,y+62,fAnton(70),O,'center'); avatar(c,s._a,262,y+59,42);
    const v='+'+brl(s.total), vw=tw(c,v,fBlack(34)); txt(c,v,950,y+46,fBlack(34),P.cardInk,'right');
    txt(c,ellip(c,s.name.toUpperCase(),950-vw-40-322,fBlack(34)),322,y+46,fBlack(34),P.cardInk,'left');
    s.days.forEach((on,k)=>{ rr(c,322+k*44,y+76,36,24,7); c.fillStyle=on?K:'#DDDAD5'; c.fill(); txt(c,THEMES[WEEK[k]].tab[0],340+k*44,y+89,fBold(15),on?WH:'#9A9792','center'); });
    c.restore(); }); }

/* =====================================================================
   TELA FINAL "TOTAL DA TURMA" — um formato por dia, no padrão do card do dia
   o = tempo normalizado (base 5,0 s; sábado 6,0 s) · OUTB = 1 batida em tempo normalizado
   ===================================================================== */
let OUTB=.5;
const outCE=()=>4*OUTB;                                   // o contador termina no tempo 1 do 2º compasso
const outTotal=()=>S.reduce((a,s)=>a+s.value,0);
const outCount=(o,tot)=>tot*eo(seg(o,outCE()-1.2*OUTB*2,outCE()));
function outHandle(c,o,y,col){ reveal(c,HANDLE,540,y,fMed(28),col,o,outCE()+.2,{mode:'type',dur:.6}); }
function gridOf(n,x,y,w,h,aspect=.8){ const cols=Math.max(1,Math.ceil(Math.sqrt(n*w/h*aspect))), rows=Math.ceil(n/cols), cw=w/cols, ch=h/rows; return {cols,rows,cw,ch,cell:k=>({x:x+(k%cols)*cw+cw/2+(Math.floor(k/cols)===rows-1?(cols-(n-(rows-1)*cols))*cw/2:0),y:y+Math.floor(k/cols)*ch+ch/2})}; }

/* SEGUNDA — prints espalhados na mesa que se organizam em grade; total com caixa de seleção */
function outSeg(c,o){ const n=S.length, tot=outTotal(), G=gridOf(n,90,390,900,520,.9), tw0=Math.min(G.cw,G.ch*1.25)*.86, th0=tw0*.78;
  S.forEach((s,k)=>{ const a=eo(seg(o,.1+k*.05,.6+k*.05)); if(a<=0) return; const g=eio(seg(o,.8+k*.04,1.6+k*.04)), cell=G.cell(k), sx=120+RND(k*3+1)*840, sy=420+RND(k*5+2)*640, sr=(RND(k*7)-.5)*.7;
    const x=sx+(cell.x-sx)*g, y=sy+(cell.y-sy)*g, r=sr*(1-g)+(RND(k)-.5)*.04, sc=(1.25-.25*g)*(.85+.15*a);
    c.save(); c.globalAlpha*=a; c.translate(x,y+Math.sin(o*1.2+k)*3); c.rotate(r); c.scale(sc,sc); shadowOn(c,30,16,.3); c.fillStyle='#FBFAF8'; c.fillRect(-tw0/2-8,-th0/2-8,tw0+16,th0+16); shadowOff(c);
    c.save(); c.beginPath(); c.rect(-tw0/2,-th0/2,tw0,th0); c.clip(); if(s._p) coverFocus(c,s._p,-tw0/2,-th0/2,tw0,th0,.45,s.fx,s.fy); else if(s._ag) cover(c,s._ag,-tw0/2,-th0/2,tw0,th0); else silhouette(c,0,0,tw0/2); c.restore(); c.restore(); });
  kicker(c,'Total da turma hoje',540,990,50,P.ink2,O,o,1.3);
  const v=brl(outCount(o,tot)), vf=fBlack(fitF(c,brl(tot),880,fBlack,118)), vw=tw(c,brl(tot),vf);
  if(o>outCE()-2.4*OUTB){ c.save(); c.globalAlpha*=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.6*OUTB)); bigText(c,v,540,1102,vf,P.ink,'center'); c.restore(); }
  selectBox(c,540-vw/2-26,1102-70,vw+52,140,eo(seg(o,outCE(),outCE()+.35)),O);
  logo(c,540,1262,160,'auto',eo(seg(o,outCE()+.1,outCE()+.5))); outHandle(c,o,1372,P.grey); }

/* TERÇA — avatares orbitando o valor; total em serifada itálica laranja com colchetes */
function outTer(c,o){ const n=S.length, tot=outTotal(), cy=820, rx=430, ry=n>8?235:215, ka=eo(seg(o,.2,.9));
  const lk=c.createRadialGradient(540,cy,40,540,cy,700); lk.addColorStop(0,`rgba(255,106,19,${.28*ka})`); lk.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=lk; c.fillRect(0,250,W,1250);
  kicker(c,'Total da turma hoje',540,430,50,WH,O,o,.1);
  c.save(); c.globalAlpha*=ka*.5; c.strokeStyle=WH; c.lineWidth=2; c.setLineDash([3,10]); c.beginPath(); c.ellipse(540,cy,rx,ry,0,0,7); c.stroke(); c.setLineDash([]); c.restore();
  const ar=n>10?34:n>6?40:48, pos=S.map((s,k)=>{ const an=o*.45+k/n*Math.PI*2; return {s,x:540+Math.cos(an)*rx,y:cy+Math.sin(an)*ry,z:Math.sin(an)}; });
  const drawAv=p=>{ const sc=(.8+.2*(p.z+1)/2)*ka; c.save(); c.globalAlpha*=ka; c.fillStyle=O; c.beginPath(); c.arc(p.x,p.y,(ar+4)*sc,0,7); c.fill(); c.restore(); avatar(c,p.s._a,p.x,p.y,ar*sc); };
  pos.filter(p=>p.z<0).forEach(drawAv);
  const v=brl(outCount(o,tot)), vf=fSerif(fitF(c,brl(tot),820,fSerif,140)), vw=tw(c,brl(tot),vf), va=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.6*OUTB));
  if(va>0){ c.save(); c.globalAlpha*=va; c.shadowColor=O; c.shadowBlur=30*Q; txt(c,v,540,cy,vf,O,'center'); c.restore(); }
  const be=eo(seg(o,outCE(),outCE()+.4)), inf=(1-be)*140; brackets(c,540-vw/2-40-inf,cy-90-inf*.6,vw+80+2*inf,180+inf*1.2,40,WH,4,be);
  pos.filter(p=>p.z>=0).forEach(drawAv);
  logo(c,540,1232,170,'auto',eo(seg(o,outCE()+.1,outCE()+.5))); outHandle(c,o,1350,P.grey); }

/* QUARTA — celular com a tela de resumo rolando, notificação "Turma hoje" e total com glow */
function outQua(c,o){ const n=S.length, tot=outTotal(), fly=eio(seg(o,0,.8)), sc=2.1-1.1*fly, cy=790+Math.sin(o*1.3)*4*fly;
  const gl=c.createRadialGradient(540,cy+300,10,540,cy+300,460); gl.addColorStop(0,`rgba(255,106,19,${.32*fly})`); gl.addColorStop(1,'rgba(255,106,19,0)'); c.fillStyle=gl; c.fillRect(60,cy-100,960,800);
  const scr=(cc,w,h)=>{ const g=cc.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,'#17171B'); g.addColorStop(1,'#0A0A0C'); cc.fillStyle=g; cc.fillRect(-w/2,-h/2,w,h);
    logo(cc,0,-h/2+52,90,false); txt(cc,'RESUMO DO DIA',0,-h/2+108,fBold(16),O,'center',4); cc.fillStyle='rgba(255,255,255,.1)'; cc.fillRect(-w/2+20,-h/2+128,w-40,2);
    const rowH=58, top=-h/2+150, viewH=h-150-24, listH=n*rowH, scroll=Math.max(0,listH-viewH)*eio(seg(o,.9,outCE()));
    cc.save(); cc.beginPath(); cc.rect(-w/2,top,w,viewH); cc.clip();
    S.forEach((s,k)=>{ const y=top+k*rowH+rowH/2-scroll, a=eo(seg(o,.5+k*.06,.8+k*.06)); if(a<=0) return; cc.save(); cc.globalAlpha*=a; cc.translate((1-a)*40,0); avatar(cc,s._a,-w/2+42,y,20); txt(cc,ellip(cc,s.name.toUpperCase(),w-200,fBlack(17)),-w/2+72,y,fBlack(17),WH,'left'); txt(cc,'+'+brl(s.value),w/2-20,y,fBold(16),O,'right'); cc.restore(); });
    cc.restore(); };
  phone3D(c,540,cy,340,680,(1-fly)*.25,0,sc,scr,S[0],o);
  const na=eo(seg(o,outCE()-3*OUTB,outCE()-2.4*OUTB)); if(na>0){ const ny=470+(1-na)*-140; c.save(); c.globalAlpha*=na; shadowOn(c,40,18,.35); rr(c,150,ny-58,780,116,28); c.fillStyle='rgba(255,255,255,.97)'; c.fill(); shadowOff(c);
    rr(c,174,ny-36,72,72,18); c.fillStyle=K; c.fill(); logo(c,210,ny,58,false); txt(c,'TRADER SCHOOL · agora',266,ny-20,fBold(18),'#6E6B67','left',2); const v='Turma hoje: +'+brl(tot); txt(c,v,266,ny+18,fBlack(fitF(c,v,640,fBlack,30)),K,'left'); c.restore(); }
  reveal(c,'Total da turma hoje',540,1200,fSerif(44),P.ink2,o,outCE()-2.6*OUTB,{mode:'ghost'});
  const va=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.6*OUTB)); if(va>0){ const v=brl(outCount(o,tot)), vf=fBlack(fitF(c,brl(tot),880,fBlack,96)); c.save(); c.globalAlpha*=va; c.shadowColor=O; c.shadowBlur=36*Q*(.7+.3*Math.sin(o*5)); txt(c,v,540,1292,vf,P.ink,'center'); c.restore(); }
  outHandle(c,o,1392,P.grey); }

/* QUINTA — bloco de notas: nomes e valores escritos linha a linha, traço de soma e total circulado */
function outQui(c,o){ const n=S.length, tot=outTotal(), w=760, x0=540-w/2, y0=390, rowH=Math.min(50,Math.max(30,470/n)), h=150+n*rowH+170;
  techSketch(c,o,eo(seg(o,0,.6)));
  const pa=back(seg(o,0,.6)); if(pa<=0) return; c.save(); c.translate(540,y0+h/2-(1-pa)*500); c.rotate(-.015+(1-Math.min(1,pa))*.2); c.translate(-540,-(y0+h/2));
  shadowOn(c,50,26,.55); c.fillStyle='#F7F5F0'; c.fillRect(x0,y0,w,h); shadowOff(c);
  c.strokeStyle='rgba(40,70,140,.14)'; c.lineWidth=2; for(let y=y0+70;y<y0+h-10;y+=rowH){ c.beginPath(); c.moveTo(x0+16,y); c.lineTo(x0+w-16,y); c.stroke(); }
  c.strokeStyle='rgba(255,106,19,.5)'; c.beginPath(); c.moveTo(x0+70,y0+56); c.lineTo(x0+70,y0+h-12); c.stroke();
  for(let k=0;k<12;k++){ c.fillStyle='#0E0E10'; c.beginPath(); c.arc(x0+36+k*63,y0+22,9,0,7); c.fill(); }
  c.save(); shadowOn(c,10,6,.4); c.fillStyle=O; c.beginPath(); c.arc(x0+w-50,y0+24,18,0,7); c.fill(); shadowOff(c); c.restore();
  kicker(c,'Total da turma hoje',540,y0+90,42,'#3A3A3E',O,o,.3);
  const step=Math.min(.18,(outCE()-1.4*OUTB*2-.7)/Math.max(1,n)), fz=Math.min(30,rowH*.62);
  S.forEach((s,k)=>{ const y=y0+140+k*rowH+rowH/2-4, t0=.7+k*step; reveal(c,ellip(c,s.name,w-330,fBold(fz)),x0+92,y,fBold(fz),'#26262B',o,t0,{mode:'type',dur:Math.max(.12,step*.8),align:'left'}); reveal(c,'+'+brl(s.value),x0+w-40,y,fBlack(fz),O,o,t0+step*.5,{mode:'blur',dur:.25,align:'right'}); });
  const ly=y0+140+n*rowH+14, le=eo(seg(o,.7+n*step,.7+n*step+.3)); if(le>0){ c.strokeStyle='#26262B'; c.lineWidth=4; c.beginPath(); c.moveTo(x0+w-40-360*le,ly); c.lineTo(x0+w-40,ly); c.stroke(); txt(c,'+',x0+w-420,ly-26,fBlack(30),'#26262B','center'); }
  const v=brl(outCount(o,tot)), vf=fAnton(fitF(c,brl(tot),560,fAnton,96)), vw=tw(c,brl(tot),vf), vy=ly+80;
  if(o>outCE()-2.4*OUTB){ c.save(); c.globalAlpha*=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.8*OUTB)); txt(c,v,x0+w-40,vy,vf,K,'right'); c.restore(); }
  const e=eo(seg(o,outCE(),outCE()+.5)); if(e>0){ c.strokeStyle=O; c.lineWidth=7; c.lineCap='round'; c.beginPath(); const cx=x0+w-40-vw/2, cyy=vy; for(let q=0;q<=e;q+=.008){ const an=-2.4+q*Math.PI*2.25, x=cx+Math.cos(an)*(vw/2+34)*(1+.05*Math.sin(q*13)), y=cyy+Math.sin(an)*62*(1+.06*Math.cos(q*9)); if(q===0) c.moveTo(x,y); else c.lineTo(x,y); } c.stroke(); }
  c.restore();
  const by=Math.min(1440,y0+h+70); logo(c,540,by-30,130,'auto',eo(seg(o,outCE()+.1,outCE()+.5))); if(by+40<1470) outHandle(c,o,by+40,P.grey); }

/* SEXTA — nova página de jornal: manchete com o total, miniaturas P&B dos alunos e carimbo */
function outSex(c,o){ const n=S.length, tot=outTotal(), x0=96, y0=396, w=888, h=1030, fa=eio(seg(o,0,.7)), fl=Math.min(1,fa);
  c.save(); c.translate(540,y0+h/2-(1-fl)*700); c.transform(1,0,(1-fl)*.12,.4+.6*fl,0,0); c.rotate((1-fl)*.12-.01); c.translate(-540,-(y0+h/2)); c.globalAlpha*=Math.min(1,fa*2);
  shadowOn(c,80,44,.6); c.fillStyle='#F3F0E9'; c.fillRect(x0,y0,w,h); shadowOff(c);
  txt(c,'PLANTÃO DO PREGÃO',540,y0+62,fSerifB(fitF(c,'PLANTÃO DO PREGÃO',w-80,fSerifB,64)),K,'center',1); c.fillStyle=K; c.fillRect(x0+30,y0+104,w-60,4); c.fillRect(x0+30,y0+112,w-60,1.5);
  txt(c,'TRADER SCHOOL · '+(days[curDay]?days[curDay].date:'')+' · EDIÇÃO DE FECHAMENTO',540,y0+138,fBold(18),'#6E6B67','center',3);
  const hl='TURMA FECHA O DIA COM +'+brl(tot), hf=fSerifB(fitF(c,hl,w-70,fSerifB,64)); reveal(c,hl,540,y0+212,hf,K,o,.6,{mode:'rise'});
  reveal(c,n+(n>1?' alunos no verde hoje':' aluno no verde hoje'),540,y0+272,fSerif(36),'#4A4844',o,.9,{mode:'ghost'});
  const G=gridOf(n,x0+30,y0+310,w-60,430,.85), tw0=Math.min(G.cw,G.ch*.95)-14, th0=Math.min(G.ch-34,tw0*1.1);
  S.forEach((s,k)=>{ const a=eo(seg(o,.8+k*.05,1.1+k*.05)); if(a<=0) return; const cl=G.cell(k); c.save(); c.globalAlpha*=a; c.beginPath(); c.rect(cl.x-tw0/2,cl.y-th0/2-10,tw0,th0); c.clip(); if(s._ag) cover(c,s._ag,cl.x-tw0/2-tw0*.12,cl.y-th0/2-10-th0*.12,tw0*1.24,th0*1.24); else silhouette(c,cl.x,cl.y-10,tw0/2); c.restore();
    c.save(); c.globalAlpha*=a; c.strokeStyle=K; c.lineWidth=1.5; c.strokeRect(cl.x-tw0/2,cl.y-th0/2-10,tw0,th0); txt(c,ellip(c,s.name.toUpperCase(),tw0,fBold(15)),cl.x,cl.y+th0/2+4,fBold(15),K,'center',1); c.restore(); });
  c.fillStyle='rgba(0,0,0,.16)'; for(let col=0;col<3;col++) for(let l=0;l<5;l++){ const cw=(w-100)/3; c.fillRect(x0+30+col*(cw+20),y0+770+l*20,cw-(l===4?60:0),8); }
  const fy=y0+h-140; c.fillStyle=K; c.fillRect(x0,fy,w,140); logo(c,x0+110,fy+70,150,false); txt(c,HANDLE,x0+w-36,fy+56,fMed(24),'#C9C6C1','right'); txt(c,'Resultados individuais',x0+w-36,fy+92,fMed(18),'#77736E','right');
  c.restore();
  const st=seg(o,outCE(),outCE()+.2); if(st>0){ const z=1+.6*(1-eo(st)), sx=540, sy=y0+530; c.save(); c.translate(sx,sy); c.rotate(-.12); c.scale(z,z); c.globalAlpha*=Math.min(1,st*2);
    const v='+'+brl(outCount(o,tot)), vf=fBlack(fitF(c,'+'+brl(tot),560,fBlack,80)), bw=Math.max(tw(c,'+'+brl(tot),vf),tw(c,'TOTAL DA TURMA HOJE',fBold(24),6))+80;
    c.strokeStyle=O; c.lineWidth=8; rr(c,-bw/2,-84,bw,168,14); c.stroke(); c.lineWidth=2.5; rr(c,-bw/2+12,-72,bw-24,144,10); c.stroke(); c.fillStyle='rgba(243,240,233,.86)'; rr(c,-bw/2+14,-70,bw-28,140,9); c.fill();
    txt(c,v,0,-14,vf,O,'center'); txt(c,'TOTAL DA TURMA HOJE',0,48,fBold(24),O,'center',6); c.restore(); }
  /* contador visível antes do carimbo */
  if(st<=0&&o>outCE()-2.4*OUTB){ const a=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.8*OUTB)); c.save(); c.globalAlpha*=a; txt(c,'+'+brl(outCount(o,tot)),540,y0+530,fBlack(fitF(c,'+'+brl(tot),560,fBlack,80)),O,'center'); c.restore(); }
}

/* SÁBADO — pódio da semana em pedestal, demais em fila, total da semana e logo em pêndulo */
function outSab(c,o){ const R=WK.rank, n=R.length, tot=WK.total;
  if(o<2.2){ c.save(); c.globalAlpha*=1-seg(o,1.6,2.2); const ang=.5*Math.cos(o*2.6)*(1-seg(o,0,2.2)*.4), ox=540, oy=220, L=420, px=ox+Math.sin(ang)*L, py=oy+Math.cos(ang)*L;
    c.strokeStyle=K; c.lineWidth=12; c.lineCap='round'; c.beginPath(); c.moveTo(ox,oy); c.lineTo(px,py); c.stroke(); c.save(); c.translate(px,py); c.rotate(-ang); shadowOn(c,50,30,.35); rr(c,-95,-95,190,190,40); c.fillStyle=K; c.fill(); shadowOff(c); logo(c,0,0,150,false); c.restore(); c.restore(); }
  const base=1000, spots=[[1,96,260,140],[2,724,260,100],[0,400,280,190]];
  spots.forEach(([idx,x,w,hh])=>{ const s=R[idx]; if(!s) return; const t0=.9+[.3,0,.6][idx], a=eo(seg(o,t0,t0+.5)), h=hh*a, top=base-h;
    c.save(); shadowOn(c,40,24,.3); box3D(c,x,top,w,h,24,16,idx===0?['#FFFFFF','#E4E2DE']:['#2A2A2E','#0E0E10'],idx===0?'#FFFFFF':'#4A4A50',idx===0?'#B8B4AE':'#000'); shadowOff(c); c.restore();
    if(a>.4){ c.save(); c.globalAlpha*=seg(o,t0+.2,t0+.5); const fc=idx===0?K:WH; txt(c,ellip(c,s.name.toUpperCase(),w-20,fBlack(26)),x+w/2,top+34,fBlack(26),fc,'center'); if(h>80) txt(c,'+'+brl(s.total),x+w/2,top+68,fBlack(fitF(c,'+'+brl(s.total),w-24,fBlack,22)),O,'center'); c.restore(); }
    const d=back(seg(o,t0+.35,t0+.85)); if(d>0){ const pw=idx===0?170:140, ph=idx===0?200:165; c.save(); c.translate(x+w/2,top-ph/2-12-(1-d)*500); c.rotate(idx===1?.05:idx===2?-.05:0); photoFrame(c,s._a,0,0,pw,ph,0); c.fillStyle=O; c.beginPath(); c.arc(pw/2-4,-ph/2+4,26,0,7); c.fill(); txt(c,String(idx+1),pw/2-4,-ph/2+6,fAnton(32),WH,'center'); c.restore(); } });
  const rest=R.slice(3,15), rn=rest.length; if(rn){ const sp=Math.min(80,880/rn); rest.forEach((s,k)=>{ const a=back(seg(o,1.8+k*.05,2.1+k*.05)); if(a<=0) return; const x=540+(k-(rn-1)/2)*sp; c.save(); c.translate(x,1078); c.scale(a,a); c.fillStyle=WH; c.beginPath(); c.arc(0,0,Math.min(34,sp*.42)+4,0,7); c.fill(); c.restore(); avatar(c,s._a,x,1078,Math.min(34,sp*.42)*a); }); }
  kicker(c,'Total da semana',540,1172,50,WH,K,o,outCE()-2.6*OUTB);
  if(o>outCE()-2.4*OUTB){ c.save(); c.globalAlpha*=eo(seg(o,outCE()-2.4*OUTB,outCE()-1.8*OUTB)); const z=1+.08*Math.sin(Math.PI*seg(o,outCE(),outCE()+.3)); c.translate(540,1270); c.scale(z,z); bigText(c,brl(tot*eo(seg(o,outCE()-2.4*OUTB,outCE()))),0,0,fBlack(fitF(c,brl(tot),900,fBlack,112)),WH,'center'); c.restore(); }
  reveal(c,'PARABÉNS, TURMA!',540,1366,fAnton(fitF(c,'PARABÉNS, TURMA!',700,fAnton,64)),K,o,outCE()+.1,{mode:'rise'});
  outHandle(c,o,1436,P.grey); }
const OUTS={seg:outSeg,ter:outTer,qua:outQua,qui:outQui,sex:outSex,sab:outSab};
function sceneOut(c,o){ (OUTS[curDay]||outSeg)(c,o); }
function sceneWeekOut(c,o){ outSab(c,o); }
const OUT_CUES={
  seg:[[.1,'swish'],[.45,'swish'],[.85,'pop'],[1.3,'type']], ter:[[.1,'whoosh'],[.4,'pop']], qua:[[.05,'whoosh'],[.6,'pop']],
  qui:[[.05,'whoosh'],[.3,'type'],[.8,'type']], sex:[[.05,'swish'],[.6,'type']], sab:[[.1,'whoosh'],[.9,'impact'],[1.2,'impact'],[1.5,'impact'],[1.9,'pop']]
};

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
  if(D.trans==='pageturn'){ /* virada de página de jornal: o card dobra a partir do canto inferior direito e revela o próximo */
    const e=eio(seg(p,0,.75)), A=.86, B=.5, maxF=A*W+B*H, d=e*maxF*1.04, f=(x,y)=>A*(W-x)+B*(H-y);
    const rect=[[0,0],[W,0],[W,H],[0,H]], clip=(keep)=>{ const out=[]; for(let i=0;i<4;i++){ const P1=rect[i], P2=rect[(i+1)%4], f1=f(...P1)-d, f2=f(...P2)-d, in1=keep(f1), in2=keep(f2); if(in1) out.push(P1); if(in1!==in2){ const k=f1/(f1-f2); out.push([P1[0]+(P2[0]-P1[0])*k,P1[1]+(P2[1]-P1[1])*k]); } } return out; };
    const path=(pts)=>{ ctx.beginPath(); pts.forEach(([x,y],k)=>k?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath(); };
    const refl=([x,y])=>{ const k=2*(d-f(x,y)); return [x-A*k,y-B*k]; };
    ctx.drawImage(SB,0,0,W,H);
    const keep=clip(v=>v>=0), flap=clip(v=>v<0).map(refl);
    /* sombra do vinco sobre a página de baixo */
    if(e>0&&e<1){ const fx=W-d*A, fy=H-d*B, gx=fx+(-A)*0, g=ctx.createLinearGradient(W-(d-0)*A,H-(d-0)*B,W-(d+120)*A,H-(d+120)*B); g.addColorStop(0,'rgba(0,0,0,.45)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.save(); path(clip(v=>v>=0)); ctx.clip(); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.restore(); }
    if(keep.length>2){ ctx.save(); path(keep); ctx.clip(); ctx.drawImage(SA,0,0,W,H); ctx.restore(); }
    if(flap.length>2&&e<1){ ctx.save(); shadowOn(ctx,50,0,.35); path(flap); ctx.fillStyle='#E4E1DB'; ctx.fill(); shadowOff(ctx); ctx.clip();
      const g=ctx.createLinearGradient(W-d*A,H-d*B,W-(d-260)*A,H-(d-260)*B); g.addColorStop(0,'rgba(0,0,0,.22)'); g.addColorStop(.25,'rgba(255,255,255,.35)'); g.addColorStop(1,'rgba(0,0,0,.08)'); ctx.fillStyle=g; ctx.fillRect(-W,-H,3*W,3*H);
      ctx.globalAlpha=.07; ctx.fillStyle=K; for(let l=0;l<26;l++) ctx.fillRect(-W,l*80-H,3*W,10); ctx.restore();
      /* micro desfoque na borda: linha clara no vinco */
      ctx.save(); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=3; const kp=clip(v=>v>=0); if(kp.length>1){ ctx.beginPath(); const pts=kp.filter(([x,y])=>Math.abs(f(x,y)-d)<1); if(pts.length===2){ ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.stroke(); } } ctx.restore(); }
    return; }
  if(D.trans==='zoom'){ blurDraw(SA,e*.7,0,0,1+.7*e,1-e); blurDraw(SB,(1-e)*.7,0,0,.7+.3*e,e); const fl=Math.max(0,1-Math.abs(p-.5)*5); if(fl>0){ ctx.save(); ctx.globalAlpha=fl*.85; ctx.fillStyle=WH; ctx.fillRect(0,0,W,H); ctx.restore(); } return; }
}

/* =====================================================================
   LINHA DO TEMPO
   ===================================================================== */
/* cada cena dura um número inteiro de compassos da trilha do dia (cortes caem no tempo 1);
   a animação recebe o tempo normalizado para a duração de base, então nada fica corrido nem arrastado */
function beatDur(base){ const bpm=D.bpm||100, beats=Math.max(8,Math.round(base*bpm/60/4)*4); return beats*60/bpm; }
function mkScene(kind,base,fn,cues){ const d=beatDur(base), k=base/d; return {kind,dur:d,render:(c,u)=>fn(c,u*k),cues:(cues||[]).map(([t,n])=>[t/k,n])}; }
/* final: o contador termina no tempo 1 do 2º compasso; softRiser antes e chime no valor */
function outScene(kind,base,fn,cues){ const d=beatDur(base); OUTB=(60/(D.bpm||100))*base/d; const ce=4*OUTB, sk=base/d; return mkScene(kind,base,fn,(cues||[]).concat([[ce-.95*sk,'riser'],[ce,'cash'],[ce+.02,'impact']])); }
function buildScenes(){
  if(MODE==='week'){ if(!WK||!WK.rank.length) return [];
    const sc=[mkScene('cover',5.4,sceneCover,COVER_CUES.sab),
      mkScene('bars',5.0,sceneBars,[[.05,'type'],[.25,'impact']].concat([0,1,2,3,4].map(k=>[.5+k*.15,'swish'])).concat([[1.7,'shimmer'],[2.0,'pop'],[2.15,'cash'],[2.6,'type']])),
      mkScene('podium',5.6,scenePodium,[[.05,'type'],[.2,'whoosh'],[.5,'impact'],[.95,'whoosh'],[.85,'impact'],[1.3,'whoosh'],[1.2,'impact'],[1.65,'whoosh'],[2.1,'riser'],[2.15,'shimmer'],[2.3,'cash']])];
    for(let p=0;3+p*6<WK.rank.length;p++) sc.push(mkScene('rank',4.4,(c,u)=>sceneRank(c,u,p),[[.05,'type'],[.25,'impact']].concat([0,1,2,3,4,5].map(j=>[.4+j*.12,'swish']))));
    sc.push(outScene('weekout',6.0,sceneWeekOut,OUT_CUES.sab)); return sc; }
  if(!S.length) return [];
  const sc=[mkScene('cover',4.6,sceneCover,COVER_CUES[curDay]||[]),mkScene('hl',4.0,sceneHL,HL_CUES[curDay]||HL_CUES.seg)];
  let prev=0; S.forEach((s,i)=>{ const p0=prev; const run=u=>p0+s.value*eo(seg(u,1.0,2.0)); sc.push(mkScene('student',4.8,(c,u)=>sceneStudent(c,i,u,run),STUDENT_CUES[curDay]||STUDENT_CUES.seg)); prev+=s.value; });
  sc.push(outScene('out',5.0,sceneOut,OUT_CUES[curDay]||OUT_CUES.seg)); return sc;
}
function musicPlan(){ useDay(curDay); let t=0; return {bpm:D.bpm||100,sections:SCENES.map(sc=>{ const o={t0:t,t1:t+sc.dur,kind:sc.kind}; t+=sc.dur; return o; })}; }
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
    await Promise.all(S.map(async s=>{ s._p=await getImg(s.print,1500); s._a=await getImg(s.avatar,420); s._pt=tiny(s._p,16); s._at=tiny(s._a,10); s._ab=tiny(s._a,24); s._ag=grayOf(s._a); })); }
  SCENES=buildScenes();
}
