/* Placar do Pregão — motor de vídeo (estilo editorial / tipografia cinética).
   Fundo papel claro, cartões flutuando com sombra, texto entrando palavra por palavra,
   objeto herói 3D por dia, molduras de visor e transições de foco. Paleta: preto, branco e laranja.
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
let Q=1, LOGO=null, LOGOD=null, LOGOW=null, GRAIN=null;
function setRes(q){ Q=q; [cv,SA,SB].forEach(c=>{ c.width=Math.round(W*q); c.height=Math.round(H*q); }); }
setRes(.5);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo=k=>1-Math.pow(1-k,3);
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const back=k=>{ const c1=1.5,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
const RND=k=>{ const x=Math.sin(k*127.1+311.7)*43758.5453; return x-Math.floor(x); };
let S=[], MODE='day', WK=null, SCENES=[], busy=false, loopId=0, exporting=false;

/* ---------- paleta e tipografia ---------- */
const C={ink:'#0E0E10',ink2:'#2A2A2E',grey:'#6E6B67',accent:'#FF6A13',accentD:'#C94A00'};
const SERIF="'Playfair Display', Georgia, serif", SANS="Montserrat, 'Helvetica Neue', Arial, sans-serif";
const fSerif=s=>`italic 700 ${s}px ${SERIF}`, fSerifB=s=>`900 ${s}px ${SERIF}`, fBlack=s=>`900 ${s}px ${SANS}`, fBold=s=>`700 ${s}px ${SANS}`, fMed=s=>`500 ${s}px ${SANS}`;
const FONTS=["900 40px Montserrat","700 40px Montserrat","500 40px Montserrat","italic 700 40px 'Playfair Display'","900 40px 'Playfair Display'"];

/* identidade de cada dia: objeto herói, frases, transição, ângulo da luz */
const DAYCFG={
  seg:{hero:'emblem', trans:'focus', light:-.32, l1:'O resultado de', l3:'dos nossos alunos', quote:['Disciplina é a ponte','entre metas e conquistas.'], open:['Começando a semana,','Mais um no lucro,','Na sequência,','Firme no processo,']},
  ter:{hero:'money',  trans:'swipe', light:.28,  l1:'O resultado de', l3:'dos nossos alunos', quote:['Grandes resultados nascem','de decisões repetidas.'], open:['Terça de resultado,','Também no lucro,','Mais um,','Seguindo firme,']},
  qua:{hero:'coin',   trans:'flip',  light:-.22, l1:'O resultado de', l3:'dos nossos alunos', quote:['Quem planta com constância','colhe com abundância.'], open:['Meio da semana,','A turma não para,','Mais um no lucro,','Na sequência,']},
  qui:{hero:'book',   trans:'rise',  light:.36,  l1:'O resultado de', l3:'dos nossos alunos', quote:['O mercado premia','quem respeita o processo.'], open:['Quinta de lucro,','Consistência,','Mais um,','Firme no plano,']},
  sex:{hero:'news',   trans:'zoom',  light:-.4,  l1:'O resultado de', l3:'dos nossos alunos', quote:['Fechar bem a semana','é consequência, não sorte.'], open:['Fechando a semana,','Mais um no topo,','Na sequência,','Também no lucro,']},
  sab:{hero:'pendulum',trans:'focus',light:.3,   l1:'O resultado da', l3:'de toda a turma', quote:['Uma turma. Um propósito.','Um resultado.'], open:[]}
};
let D=DAYCFG.seg;

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
function shadowOn(c,blur=50,oy=26,a=.28){ c.shadowColor=`rgba(0,0,0,${a})`; c.shadowBlur=blur*Q; c.shadowOffsetY=oy*Q; c.shadowOffsetX=0; }
function shadowOff(c){ c.shadowColor='rgba(0,0,0,0)'; c.shadowBlur=0; c.shadowOffsetY=0; }
function silhouette(c,cx,cy,r){ c.fillStyle='#BDBAB5'; c.fillRect(cx-r,cy-r,2*r,2*r); c.fillStyle='#8F8B85'; c.beginPath(); c.arc(cx,cy-r*.18,r*.36,0,7); c.fill(); c.beginPath(); c.ellipse(cx,cy+r*.75,r*.68,r*.5,0,0,7); c.fill(); }
function avatar(c,img,cx,cy,r){ c.save(); c.beginPath(); c.arc(cx,cy,r,0,7); c.clip(); if(img){ const k=r*1.1; cover(c,img,cx-k,cy-k,2*k,2*k);} else silhouette(c,cx,cy,r); c.restore(); }
function dashRing(c,cx,cy,r,t,col=C.ink,lw=4,gap=.35){ c.save(); c.translate(cx,cy); c.rotate(t*.8); c.strokeStyle=col; c.lineWidth=lw; c.setLineDash([2,10]); c.beginPath(); c.arc(0,0,r,0,Math.PI*2*(1-gap)); c.stroke(); c.setLineDash([]); c.lineWidth=lw*1.6; c.beginPath(); c.arc(0,0,r+14,Math.PI*1.1,Math.PI*1.45); c.stroke(); c.restore(); }
function brackets(c,x,y,w,h,L=46,col=C.ink,lw=4,a=1){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.strokeStyle=col; c.lineWidth=lw; c.lineCap='square';
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([px,py,sx,sy])=>{ c.beginPath(); c.moveTo(px+sx*L,py); c.lineTo(px,py); c.lineTo(px,py+sy*L); c.stroke(); }); c.restore(); }
function plus(c,x,y,s,a=1,col=C.ink){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.strokeStyle=col; c.lineWidth=2; c.beginPath(); c.moveTo(x-s,y); c.lineTo(x+s,y); c.moveTo(x,y-s); c.lineTo(x,y+s); c.stroke(); c.restore(); }
function sparkle(c,x,y,s,a=1){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.fillStyle=C.ink; c.beginPath(); c.moveTo(x,y-s); c.quadraticCurveTo(x,y,x+s,y); c.quadraticCurveTo(x,y,x,y+s); c.quadraticCurveTo(x,y,x-s,y); c.quadraticCurveTo(x,y,x,y-s); c.fill(); c.restore(); }
function chevron(c,x,y,s,rot,a=1){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(x,y); c.rotate(rot); c.fillStyle=C.ink; c.beginPath(); c.moveTo(0,0); c.lineTo(s,s*.18); c.lineTo(s*.62,s*.32); c.lineTo(s*1.05,s*.95); c.lineTo(s*.9,s*1.08); c.lineTo(s*.42,s*.5); c.lineTo(s*.26,s*.9); c.closePath(); c.fill(); c.restore(); }
/* texto com volume (sombra suave embaixo, como na referência) */
function bigText(c,s,x,y,font,color,align='center',sp=0){ c.save(); c.font=font; ls(c,sp); c.textAlign=align; c.textBaseline='middle';
  c.fillStyle='rgba(0,0,0,.16)'; c.fillText(s,x+3,y+10); c.fillStyle=color===C.accent?C.accentD:'#000'; c.fillText(s,x+1.5,y+4); c.fillStyle=color; c.fillText(s,x,y); ls(c,0); c.restore(); }

/* ---------- entrada de texto: desfoque, letra por letra ou digitando ---------- */
function reveal(c,s,x,y,font,color,t,t0,o={}){
  const dur=o.dur||.55, align=o.align||'center', mode=o.mode||'blur', p=seg(t,t0,t0+dur); if(p<=0) return;
  if(mode==='rise'){ c.font=font; const chars=[...s], ws=chars.map(ch=>c.measureText(ch).width), total=ws.reduce((a,b)=>a+b,0); let cx=align==='center'?x-total/2:align==='right'?x-total:x;
    chars.forEach((ch,k)=>{ const q=back(seg(t,t0+k*.04,t0+k*.04+.45)), qa=seg(t,t0+k*.04,t0+k*.04+.2); if(qa>0){ c.save(); c.globalAlpha*=qa; if(o.big) bigText(c,ch,cx,y+(1-q)*60,font,color,'left'); else txt(c,ch,cx,y+(1-q)*60,font,color,'left'); c.restore(); } cx+=ws[k]; }); return; }
  if(mode==='type'){ const n=Math.max(1,Math.floor([...s].length*p)); const sub=[...s].slice(0,n).join(''); if(o.big) bigText(c,sub,x,y,font,color,align); else txt(c,sub,x,y,font,color,align,o.sp||0); return; }
  const e=eo(p); c.save(); const g=c.globalAlpha;
  if(e<1){ for(let k=1;k<=3;k++){ c.globalAlpha=g*.16*(1-e); txt(c,s,x+k*10*(1-e),y+(1-e)*24,font,color,align,o.sp||0); txt(c,s,x-k*10*(1-e),y+(1-e)*24,font,color,align,o.sp||0); } }
  c.globalAlpha=g*e; if(o.big) bigText(c,s,x,y+(1-e)*24,font,color,align,o.sp||0); else txt(c,s,x,y+(1-e)*24,font,color,align,o.sp||0); c.restore(); }

/* ---------- imagens ---------- */
const cache=new Map();
function getImg(src,max){ if(!src) return Promise.resolve(null); const key=src+'|'+max; if(cache.has(key)) return cache.get(key);
  const p=(async()=>{ let bmp=null; try{ const r=await fetch(src); if(!r.ok) throw 0; bmp=await createImageBitmap(await r.blob()); }catch(e){ bmp=await new Promise(res=>{const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src;}); }
    if(!bmp) return null; const w0=iw(bmp),h0=ih(bmp), sc=Math.min(1,max/Math.max(w0,h0)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w0*sc)); c.height=Math.max(1,Math.round(h0*sc)); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height); return c; })();
  cache.set(key,p); return p; }
function tinted(img,col){ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0); g.globalCompositeOperation='source-in'; g.fillStyle=col; g.fillRect(0,0,c.width,c.height); return c; }
async function loadLogo(){ if(!LOGO){ LOGO=await getImg('assets/logo.png',700); if(LOGO){ LOGOD=tinted(LOGO,C.ink); LOGOW=LOGO; } }
  if(!GRAIN){ GRAIN=document.createElement('canvas'); GRAIN.width=GRAIN.height=256; const g=GRAIN.getContext('2d'), id=g.createImageData(256,256); for(let i=0;i<id.data.length;i+=4){ const v=Math.random()*255; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } g.putImageData(id,0,0); } }
function logo(c,cx,cy,w,dark=true,a=1){ const L=dark?LOGOD:LOGOW; if(!L||a<=0) return 0; const h=w*L.height/L.width; c.save(); c.globalAlpha*=a; c.drawImage(L,cx-w/2,cy-h/2,w,h); c.restore(); return h; }

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
   FUNDO: papel claro com luz de persiana
   ===================================================================== */
function paper(c,t){
  const g=c.createRadialGradient(540,760,200,540,960,1300); g.addColorStop(0,'#F4F3F1'); g.addColorStop(1,'#C9C7C3'); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.save(); c.translate(540,960); c.rotate(D.light); c.translate(-900,-1400);
  for(let k=0;k<7;k++){ const x=k*300+((t*14)%300); const gr=c.createLinearGradient(x,0,x+170,0); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.5,'rgba(0,0,0,.075)'); gr.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gr; c.fillRect(x,0,170,2800); }
  c.restore();
  c.save(); c.globalAlpha=.07; c.strokeStyle=C.ink; c.lineWidth=1.5; c.beginPath(); c.arc(1040,560,520,Math.PI*.55,Math.PI*1.25); c.stroke(); c.beginPath(); c.arc(40,1380,460,-Math.PI*.4,Math.PI*.3); c.stroke(); c.restore();
}
function grain(c,t){ if(!GRAIN) return; c.save(); c.globalAlpha=.035; c.globalCompositeOperation='multiply'; const ox=-Math.floor(RND(Math.floor(t*12))*256), oy=-Math.floor(RND(Math.floor(t*12)+5)*256); for(let x=ox;x<W;x+=256) for(let y=oy;y<H;y+=256) c.drawImage(GRAIN,x,y); c.restore(); }
function topMark(c){ logo(c,540,300,150,true,.9); }

/* ---------- cartão flutuante e placa preta ---------- */
function floatCard(c,x,y,w,h,r=36,fill='#FAFAF9'){ c.save(); shadowOn(c,70,34,.30); rr(c,x,y,w,h,r); c.fillStyle=fill; c.fill(); shadowOff(c);
  const g=c.createLinearGradient(x,y,x,y+h); g.addColorStop(0,'rgba(255,255,255,.95)'); g.addColorStop(1,'rgba(0,0,0,.08)'); c.strokeStyle=g; c.lineWidth=3; c.stroke(); c.restore(); }
function blackPlate(c,x,y,w,h,r=28){ c.save(); shadowOn(c,50,24,.35); rr(c,x,y,w,h,r); const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#1C1C20'); g.addColorStop(1,'#0B0B0D'); c.fillStyle=g; c.fill(); shadowOff(c);
  c.strokeStyle='rgba(255,255,255,.14)'; c.lineWidth=2; c.stroke(); c.restore(); }

/* =====================================================================
   OBJETOS HERÓI (um por dia)
   ===================================================================== */
function heroEmblem(c,cx,cy,t,a){ const k=back(seg(t,.2,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(k,k);
  shadowOn(c,60,30,.35); c.fillStyle=C.ink; c.beginPath(); c.arc(0,0,190,0,7); c.fill(); shadowOff(c);
  logo(c,0,6,250,false); c.restore(); dashRing(c,cx,cy,236*k,t,C.ink,4,.3); }
function bundle(c,x,y,w,d,h){ // maço de notas isométrico com cinta laranja
  c.fillStyle='#E4DFD3'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+w,y-w*.5); c.lineTo(x+w+d,y-w*.5+d*.5); c.lineTo(x+d,y+d*.5); c.closePath(); c.fill();
  c.fillStyle='#CFC8B8'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+d,y+d*.5); c.lineTo(x+d,y+d*.5+h); c.lineTo(x,y+h); c.closePath(); c.fill();
  c.fillStyle='#ADA595'; c.beginPath(); c.moveTo(x+d,y+d*.5); c.lineTo(x+w+d,y-w*.5+d*.5); c.lineTo(x+w+d,y-w*.5+d*.5+h); c.lineTo(x+d,y+d*.5+h); c.closePath(); c.fill();
  c.strokeStyle='rgba(0,0,0,.1)'; c.lineWidth=1; for(let k=1;k<5;k++){ const yy=k*h/5; c.beginPath(); c.moveTo(x,y+yy); c.lineTo(x+d,y+d*.5+yy); c.lineTo(x+w+d,y-w*.5+d*.5+yy); c.stroke(); }
  const m=.45; c.fillStyle=C.accent; c.beginPath(); c.moveTo(x+w*m,y-w*m*.5); c.lineTo(x+w*m+d,y-w*m*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5); c.lineTo(x+w*(m+.14),y-w*(m+.14)*.5); c.closePath(); c.fill();
  c.fillStyle=C.accentD; c.beginPath(); c.moveTo(x+w*m+d,y-w*m*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5); c.lineTo(x+w*(m+.14)+d,y-w*(m+.14)*.5+d*.5+h); c.lineTo(x+w*m+d,y-w*m*.5+d*.5+h); c.closePath(); c.fill(); }
function heroMoney(c,cx,cy,t,a){ c.save(); c.globalAlpha*=a;
  c.save(); const sg=c.createRadialGradient(cx+40,cy+170,10,cx+40,cy+170,330); sg.addColorStop(0,'rgba(0,0,0,.28)'); sg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=sg; c.beginPath(); c.ellipse(cx+40,cy+170,330,90,0,0,7); c.fill(); c.restore();
  const pos=[[-130,60],[30,-20],[30,140],[190,60]];
  pos.forEach(([dx,dy],i)=>{ for(let l=0;l<4;l++){ const k=back(seg(t,.15+i*.08+l*.06,.6+i*.08+l*.06)); if(k<=0) continue; bundle(c,cx+dx-140,cy+dy-l*42-(1-k)*500,170,100,42); } });
  for(let k=0;k<7;k++){ const p=seg(t,.2+k*.18,1.7+k*.18); if(p<=0||p>=1) continue; const x=cx-380+RND(k)*760+Math.sin(p*6+k)*40, y=cy-440+p*640; c.save(); c.translate(x,y); c.rotate(p*5+k); c.scale(1,Math.abs(Math.cos(p*7+k))+.15); c.globalAlpha*=(1-p)*.9; c.fillStyle='#DDD7CA'; c.fillRect(-64,-30,128,60); c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=2; c.strokeRect(-54,-20,108,40); c.fillStyle=C.accent; c.beginPath(); c.arc(0,0,10,0,7); c.fill(); c.restore(); }
  c.restore(); }
function heroCoin(c,cx,cy,t,a){ const k=eo(seg(t,.1,.8)); if(k<=0) return; c.save(); c.globalAlpha*=a*k; const ang=t*1.6, wv=Math.cos(ang), r=200, ww=Math.max(6,r*Math.abs(wv));
  shadowOn(c,50,40,.3); c.fillStyle='#8E8A84'; c.beginPath(); c.ellipse(cx+Math.sin(ang)*14,cy,ww,r,0,0,7); c.fill(); shadowOff(c);
  const g=c.createLinearGradient(cx-ww,cy-r,cx+ww,cy+r); g.addColorStop(0,'#F7F6F4'); g.addColorStop(.45,'#BDB9B2'); g.addColorStop(1,'#6E6A64'); c.fillStyle=g; c.beginPath(); c.ellipse(cx,cy,ww,r,0,0,7); c.fill();
  c.strokeStyle='rgba(60,58,55,.7)'; c.lineWidth=5; c.beginPath(); c.ellipse(cx,cy,ww*.86,r*.86,0,0,7); c.stroke();
  c.save(); c.translate(cx,cy); c.scale(Math.max(.04,Math.abs(wv)),1); if(wv>0) logo(c,0,0,250,true,.85); else txt(c,'R$',0,4,fSerifB(150),'rgba(40,38,35,.8)','center'); c.restore();
  c.restore(); dashRing(c,cx,cy,250,t*.6,C.accent,3,.45); }
function heroBook(c,cx,cy,t,a){ const k=back(seg(t,.1,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a;
  c.save(); c.globalAlpha*=.35; c.fillStyle=C.ink; for(let i=-7;i<=7;i++) for(let j=-6;j<=6;j++) if((i+j)%2===0) c.fillRect(cx+i*34-2,cy+j*34-2,3,3); c.restore();
  const w=290,h=390,dep=44; c.translate(cx,cy+(1-k)*300); c.rotate(-.12+Math.sin(t*.6)*.05); const sx=.82+.18*Math.cos(t*.9);
  shadowOn(c,60,40,.35); c.fillStyle='#ECE8DF'; c.fillRect(-w/2*sx,-h/2+10,w*sx+dep,h-14); shadowOff(c);
  c.fillStyle='#F7F4ED'; c.fillRect(w/2*sx,-h/2+10,dep,h-14); c.strokeStyle='rgba(0,0,0,.14)'; c.lineWidth=1; for(let l=1;l<9;l++){ const x=w/2*sx+l*dep/9; c.beginPath(); c.moveTo(x,-h/2+12); c.lineTo(x,h/2-6); c.stroke(); }
  const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0,'#2C2C30'); g.addColorStop(1,'#0B0B0D'); c.fillStyle=g; rr(c,-w/2*sx,-h/2,w*sx,h,10); c.fill();
  c.save(); c.scale(sx,1); c.strokeStyle=C.accent; c.lineWidth=3; c.strokeRect(-w/2+20,-h/2+20,w-40,h-40); logo(c,0,-50,180,false); txt(c,'DIÁRIO',0,88,fBlack(38),'#FFFFFF','center',6); txt(c,'DO TRADER',0,130,fBold(20),C.accent,'center',6); c.restore();
  c.restore(); }
function heroNews(c,cx,cy,t,a){ const k=back(seg(t,.1,.9)); if(k<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy+(1-k)*700); c.rotate(-.06+(1-k)*.5+Math.sin(t*.7)*.01);
  const w=580,h=530; shadowOn(c,60,36,.35); c.fillStyle='#F5F2EC'; c.fillRect(-w/2,-h/2,w,h); shadowOff(c);
  txt(c,'ÚLTIMAS NOTÍCIAS',0,-h/2+48,fSerifB(46),C.ink,'center',1); c.fillStyle=C.ink; c.fillRect(-w/2+24,-h/2+82,w-48,3); c.fillRect(-w/2+24,-h/2+90,w-48,1);
  txt(c,'TRADER SCHOOL · '+(days[curDay]?days[curDay].date:''),0,-h/2+110,fBold(15),C.grey,'center',3);
  const top=S[0]; c.save(); c.beginPath(); c.rect(-w/2+24,-h/2+130,300,250); c.clip(); if(top&&top._p) coverFocus(c,top._p,-w/2+24,-h/2+130,300,250,.55,top.fx,top.fy); else { c.fillStyle='#CFCBC4'; c.fillRect(-w/2+24,-h/2+130,300,250); } c.restore();
  c.fillStyle='rgba(0,0,0,.16)'; for(let l=0;l<11;l++) c.fillRect(-w/2+344,-h/2+134+l*22,210-(l%3)*30,8);
  txt(c,'A TURMA FECHOU',-w/2+24,h/2-106,fBlack(36),C.ink,'left'); txt(c,'A SEXTA NO LUCRO',-w/2+24,h/2-64,fBlack(36),C.accent,'left');
  c.fillStyle='rgba(0,0,0,.16)'; for(let l=0;l<2;l++) c.fillRect(-w/2+24,h/2-34+l*16,w-48-(l*140),7);
  c.restore(); }
function heroPendulum(c,cx,cy,t,a){ c.save(); c.globalAlpha*=a; const ox=880, oy=-120, L=900, ang=.12+Math.sin(t*1.6)*.22*(1-seg(t,3,5)*.6), px=ox-Math.sin(ang)*L, py=oy+Math.cos(ang)*L;
  c.strokeStyle=C.ink; c.lineWidth=16; c.lineCap='round'; c.beginPath(); c.moveTo(ox,oy); c.lineTo(px,py); c.stroke();
  c.save(); c.translate(px,py); c.rotate(ang); shadowOn(c,50,30,.35); rr(c,-110,-110,220,220,44); c.fillStyle=C.ink; c.fill(); shadowOff(c); logo(c,0,0,170,false); c.restore(); c.restore(); }
const HEROES={emblem:heroEmblem,money:heroMoney,coin:heroCoin,book:heroBook,news:heroNews,pendulum:heroPendulum};

/* =====================================================================
   CENAS
   ===================================================================== */
function dateLabel(){ return MODE==='week'?(WK?WK.range:''):(days[curDay]?days[curDay].date:''); }
function pill(c,s,cx,cy,font,bg=C.ink,fg='#FFFFFF',sp=4){ const w=tw(c,s,font,sp)+70, h=parseInt(font.match(/(\d+)px/)[1])*1.9; c.save(); shadowOn(c,26,12,.25); rr(c,cx-w/2,cy-h/2,w,h,h/2); c.fillStyle=bg; c.fill(); shadowOff(c); c.restore(); txt(c,s,cx,cy+2,font,fg,'center',sp); }

/* capa */
function sceneCover(c,t){
  const th=THEMES[curDay];
  reveal(c,D.l1,540,430,fSerif(58),C.ink2,t,.15,{mode:'blur'});
  HEROES[D.hero](c,540,D.hero==='pendulum'?640:740,t,1);
  const word=th.word, fz=fitF(c,word,900,fBlack,190);
  reveal(c,word,540,1085,fBlack(fz),C.ink,t,.9,{mode:'rise',big:true});
  reveal(c,D.l3,540,1200,fSerif(64),C.accent,t,1.45,{mode:'blur'});
  if(t>1.8){ const k=eo(seg(t,1.8,2.3)); c.save(); c.globalAlpha*=k; pill(c,dateLabel(),540,1300+(1-k)*20,fBold(34)); c.restore(); }
  reveal(c,HANDLE,540,1400,fMed(30),C.grey,t,2.2,{mode:'type',dur:.7});
  chevron(c,110,380,120,0,eo(seg(t,.3,.8))); chevron(c,970,1440,120,Math.PI,eo(seg(t,.4,.9)));
  sparkle(c,880,470,22,eo(seg(t,1,1.4))); sparkle(c,200,1180,16,eo(seg(t,1.3,1.7))); plus(c,940,980,14,eo(seg(t,1.2,1.6))); plus(c,150,860,14,eo(seg(t,1.4,1.8)));
}
/* destaque do dia */
function sceneHL(c,t){ const s=S[0];
  reveal(c,'O destaque',540,410,fSerif(60),C.ink2,t,.1,{mode:'blur'});
  reveal(c,'DO DIA',540,490,fBlack(86),C.ink,t,.35,{mode:'rise',big:true});
  const k=back(seg(t,.3,1.0)); if(k>0){ c.save(); c.translate(540,770); c.scale(k,k); shadowOn(c,60,30,.35); c.fillStyle=C.ink; c.beginPath(); c.arc(0,0,214,0,7); c.fill(); shadowOff(c); avatar(c,s._a,0,0,200); c.restore(); dashRing(c,540,770,262*k,t,C.accent,5,.3); }
  sparkle(c,840,560,24,eo(seg(t,.9,1.3))); plus(c,240,610,16,eo(seg(t,1,1.4))); plus(c,860,960,16,eo(seg(t,1.1,1.5)));
  reveal(c,'Parabéns,',540,1060,fSerif(64),C.ink2,t,1.0,{mode:'blur'});
  const nm=s.name.toUpperCase(); reveal(c,nm,540,1150,fBlack(fitF(c,nm,900,fBlack,120)),C.ink,t,1.25,{mode:'rise',big:true});
  const v='+'+brl(s.value); reveal(c,v,540,1262,fBlack(fitF(c,v,880,fBlack,96)),C.accent,t,1.7,{mode:'blur',big:true});
  reveal(c,D.quote[0],540,1362,fSerif(36),C.grey,t,2.2,{mode:'blur'}); reveal(c,D.quote[1],540,1410,fSerif(36),C.grey,t,2.4,{mode:'blur'});
}
/* aluno */
function sceneStudent(c,i,u,run){ const s=S[i];
  const k=eo(seg(u,0,.6)), tilt=(1-k)*.06*(i%2?1:-1), x=120,y=360,w=840,h=820;
  c.save(); c.translate(540,y+h/2+(1-k)*140); c.rotate(tilt); c.translate(-540,-(y+h/2)); c.globalAlpha*=seg(u,0,.25);
  floatCard(c,x,y,w,h);
  const open=i===0?'O destaque do dia,':(D.open[(i-1)%D.open.length]||'Mais um,');
  reveal(c,open,x+60,y+74,fSerif(42),C.grey,u,.25,{mode:'blur',align:'left'});
  const nm=s.name.toUpperCase(); reveal(c,nm,x+58,y+150,fBlack(fitF(c,nm,w-280,fBlack,82)),C.ink,u,.4,{mode:'rise',align:'left',big:true});
  if(s.handle&&s.handle.length>1) reveal(c,s.handle,x+62,y+214,fMed(28),C.accent,u,.7,{mode:'type',align:'left',dur:.5});
  const px=x+40,py=y+262,pw=w-80,ph=h-302, zp=eo(seg(u,1.0,2.0))-eo(seg(u,3.8,4.4));
  c.save(); shadowOn(c,40,20,.3); rr(c,px,py,pw,ph,22); c.fillStyle='#1A1A1D'; c.fill(); shadowOff(c); c.clip();
  if(s._p) coverFocus(c,s._p,px,py,pw,ph,zp,s.fx,s.fy); else txt(c,'PRINT DO ALUNO',px+pw/2,py+ph/2,fBold(36),'#888','center',4);
  const sh=seg(u,2.2,2.9); if(sh>0&&sh<1){ c.globalCompositeOperation='lighter'; c.translate(px-300+sh*(pw+600),py+ph/2); c.rotate(-.35); const g=c.createLinearGradient(-110,0,110,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.25)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(-110,-ph,220,ph*2); }
  c.restore();
  if(zp>.02){ const bw=pw*.62, bh=ph*.3; brackets(c,px+pw/2-bw/2,py+ph/2-bh/2,bw,bh,44,C.accent,6,zp); }
  brackets(c,px-18,py-18,pw+36,ph+36,40,C.ink,3,eo(seg(u,.6,1.0)));
  c.restore();
  const ka=back(seg(u,.5,1.1)); if(ka>0){ c.save(); c.translate(870,y+110); c.scale(ka,ka); shadowOn(c,30,14,.3); c.fillStyle='#FFFFFF'; c.beginPath(); c.arc(0,0,82,0,7); c.fill(); shadowOff(c); avatar(c,s._a,0,0,74); c.restore(); dashRing(c,870,y+110,104*ka,u,C.ink,3,.35); }
  chevron(c,95,340,100,0,k); chevron(c,985,1190,100,Math.PI,k);
  const kp=eo(seg(u,.6,1.1)); c.save(); c.translate(0,(1-kp)*80); c.globalAlpha*=kp;
  blackPlate(c,90,1225,900,215);
  txt(c,'RESULTADO DO DIA',140,1277,fBold(24),'#9A9792','left',6);
  const pop=1+.12*Math.sin(Math.PI*seg(u,2.0,2.35)), vf=fBlack(fitF(c,'+'+brl(s.value),500,fBlack,86));
  c.save(); c.translate(140,1355); c.scale(pop,pop); txt(c,'+R$',0,0,vf,C.accent,'left'); txt(c,brl(s.value).slice(3),tw(c,'+R$ ',vf),0,vf,'#FFFFFF','left'); c.restore();
  const rv=brl(run(u)); txt(c,'TURMA HOJE',940,1290,fBold(22),'#9A9792','right',5); txt(c,rv,940,1340,fBlack(fitF(c,rv,330,fBlack,40)),'#FFFFFF','right'); txt(c,pad2(i+1)+' / '+pad2(S.length),940,1396,fBold(22),C.accent,'right',4);
  c.restore();
}
/* encerramento do dia */
function sceneOut(c,o){ const total=S.reduce((a,s)=>a+s.value,0), n=Math.min(S.length,5);
  for(let k=n-1;k>=0;k--){ const s=S[k], a=back(seg(o,.2+k*.12,.8+k*.12)); if(a<=0) continue; const ang=(k-(n-1)/2)*.16, dx=(k-(n-1)/2)*120, w=300, h=380;
    c.save(); c.translate(540+dx,700+Math.abs(k-(n-1)/2)*24+(1-a)*400); c.rotate(ang*a); shadowOn(c,40,22,.3); rr(c,-w/2,-h/2,w,h,20); c.fillStyle='#FAFAF9'; c.fill(); shadowOff(c);
    c.save(); rr(c,-w/2+14,-h/2+14,w-28,h-90,12); c.clip(); if(s._p) coverFocus(c,s._p,-w/2+14,-h/2+14,w-28,h-90,.5,s.fx,s.fy); else { c.fillStyle='#CFCBC4'; c.fillRect(-w/2,-h/2,w,h); } c.restore();
    txt(c,ellip(c,s.name.toUpperCase(),w-40,fBlack(24)),0,h/2-42,fBlack(24),C.ink,'center'); c.restore(); }
  reveal(c,'Total da turma hoje',540,1040,fSerif(52),C.ink2,o,1.0,{mode:'blur'});
  const k=eo(seg(o,1.2,1.6)); if(k>0){ c.save(); c.globalAlpha*=k; bigText(c,brl(total*eo(seg(o,1.2,2.2))),540,1150,fBlack(fitF(c,brl(total),900,fBlack,128)),C.accent,'center'); c.restore(); }
  const kl=eo(seg(o,1.9,2.4)); logo(c,540,1300,230,true,kl); reveal(c,HANDLE,540,1410,fMed(30),C.grey,o,2.2,{mode:'type',dur:.6});
  sparkle(c,900,980,20,kl); plus(c,170,1180,14,kl);
}
/* sábado */
function box3D(c,x,y,w,h,dx,dy,front,top,side){ c.fillStyle=side; c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w+dx,y+h-dy); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  c.fillStyle=top; c.beginPath(); c.moveTo(x,y); c.lineTo(x+dx,y-dy); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w,y); c.closePath(); c.fill();
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,front[0]); g.addColorStop(1,front[1]); c.fillStyle=g; c.fillRect(x,y,w,h); }
function sceneBars(c,o){ reveal(c,'A semana',540,420,fSerif(60),C.ink2,o,.1,{mode:'blur'}); reveal(c,'EM NÚMEROS',540,500,fBlack(84),C.ink,o,.3,{mode:'rise',big:true});
  floatCard(c,90,580,900,780);
  const max=Math.max(1,...WK.dayTotals), slot=820/5, bw=100, base=1190;
  WK.dayTotals.forEach((v,k)=>{ const a=eo(seg(o,.6+k*.16,1.5+k*.16)), h=Math.max(8,440*v/max)*a, x=130+k*slot+slot/2-bw/2-10, best=v===max&&v>0;
    c.save(); shadowOn(c,24,14,.2); box3D(c,x,base-h,bw,h,22,14,best?['#FF8A3D','#C94A00']:['#2A2A2E','#0E0E10'],best?'#FFB27A':'#4A4A50','#000'); shadowOff(c); c.restore();
    c.save(); c.globalAlpha*=a; txt(c,v?brl(v):'—',x+bw/2+10,base-h-44,fBlack(fitF(c,v?brl(v):'—',slot-6,fBlack,24)),best?C.accent:C.ink,'center'); c.restore();
    txt(c,THEMES[WEEK[k]].tab,x+bw/2+10,base+46,fBlack(32),C.ink,'center'); txt(c,WK.dates[k]||'',x+bw/2+10,base+84,fMed(22),C.grey,'center'); });
  reveal(c,WK.ops+' operações no lucro · '+WK.rank.length+' alunos',540,1300,fSerif(34),C.grey,o,1.8,{mode:'blur'});
  pill(c,'TOTAL '+brl(WK.total*eo(seg(o,.6,2.4))),540,1430,fBlack(34)); }
function trophy(c,cx,cy,s,a){ if(a<=0) return; c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(s,s); const g=c.createLinearGradient(-60,-80,60,60); g.addColorStop(0,'#FFB27A'); g.addColorStop(.5,'#FF6A13'); g.addColorStop(1,'#B04000'); c.fillStyle=g;
  c.beginPath(); c.moveTo(-60,-80); c.lineTo(60,-80); c.quadraticCurveTo(60,10,0,24); c.quadraticCurveTo(-60,10,-60,-80); c.fill();
  c.lineWidth=10; c.strokeStyle=g; c.beginPath(); c.arc(-62,-48,26,Math.PI*.5,Math.PI*1.5); c.stroke(); c.beginPath(); c.arc(62,-48,26,-Math.PI*.5,Math.PI*.5); c.stroke();
  c.fillStyle=C.ink; c.fillRect(-10,22,20,34); c.fillRect(-44,56,88,18); c.restore(); }
function scenePodium(c,o){ reveal(c,'O pódio',540,420,fSerif(60),C.ink2,o,.1,{mode:'blur'}); reveal(c,'DA SEMANA',540,500,fBlack(84),C.ink,o,.3,{mode:'rise',big:true});
  const spots=[[0,410,260,330],[1,110,260,230],[2,710,260,170]], base=1380;
  spots.forEach(([idx,x,w,hh],j)=>{ const s=WK.rank[idx]; if(!s) return; const a=eo(seg(o,.5+(2-j)*.35,1.3+(2-j)*.35)), h=hh*a;
    c.save(); shadowOn(c,40,24,.3); box3D(c,x,base-h,w,h,26,18,idx===0?['#FF8A3D','#C94A00']:['#2A2A2E','#0E0E10'],idx===0?'#FFB27A':'#4A4A50','#000'); shadowOff(c); c.restore();
    c.save(); c.globalAlpha*=a; txt(c,String(idx+1),x+w/2,base-h/2+6,fBlack(idx===0?130:96),idx===0?'#FFFFFF':'#8A8A90','center');
    const r=idx===0?96:76, cy=base-h-r-150; c.save(); shadowOn(c,30,14,.3); c.fillStyle='#FFF'; c.beginPath(); c.arc(x+w/2,cy,r+8,0,7); c.fill(); shadowOff(c); c.restore(); avatar(c,s._a,x+w/2,cy,r); dashRing(c,x+w/2,cy,r+26,o,idx===0?C.accent:C.ink,3,.35);
    if(idx===0) trophy(c,x+w/2,cy-r-90,.8,seg(o,1.9,2.3));
    txt(c,ellip(c,s.name.toUpperCase(),w+20,fBlack(36)),x+w/2,cy+r+44,fBlack(36),C.ink,'center');
    txt(c,'+'+brl(s.total),x+w/2,cy+r+90,fBlack(fitF(c,'+'+brl(s.total),w+30,fBlack,32)),C.accent,'center'); c.restore(); }); }
function sceneRank(c,o,page){ reveal(c,'O ranking',540,420,fSerif(60),C.ink2,o,.1,{mode:'blur'}); reveal(c,'DA SEMANA',540,500,fBlack(84),C.ink,o,.3,{mode:'rise',big:true});
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const a=eo(seg(o,.4+j*.12,1.0+j*.12)), y=590+j*140, xo=(1-a)*600;
    c.save(); c.globalAlpha*=a; c.translate(xo,0); floatCard(c,90,y,900,118,24);
    txt(c,(start+j+1)+'º',130,y+60,fBlack(46),C.accent,'left'); avatar(c,s._a,262,y+59,42);
    const v='+'+brl(s.total), vw=tw(c,v,fBlack(34)); txt(c,v,950,y+46,fBlack(34),C.ink,'right');
    txt(c,ellip(c,s.name.toUpperCase(),950-vw-40-322,fBlack(34)),322,y+46,fBlack(34),C.ink,'left');
    s.days.forEach((on,k)=>{ rr(c,322+k*44,y+76,36,24,7); c.fillStyle=on?C.ink:'#DDDAD5'; c.fill(); txt(c,THEMES[WEEK[k]].tab[0],340+k*44,y+89,fBold(15),on?'#FFFFFF':'#9A9792','center'); });
    c.restore(); }); }
function sceneWeekOut(c,o){ heroMoney(c,540,640,o,1);
  reveal(c,'Total da semana',540,1000,fSerif(56),C.ink2,o,.9,{mode:'blur'});
  const k=eo(seg(o,1.1,1.5)); if(k>0){ c.save(); c.globalAlpha*=k; bigText(c,brl(WK.total*eo(seg(o,1.1,2.4))),540,1110,fBlack(fitF(c,brl(WK.total),920,fBlack,130)),C.accent,'center'); c.restore(); }
  reveal(c,'PARABÉNS, TURMA!',540,1225,fBlack(70),C.ink,o,1.9,{mode:'rise',big:true});
  reveal(c,WK.rank.length+' alunos · '+WK.ops+' operações no lucro',540,1310,fSerif(36),C.grey,o,2.3,{mode:'blur'});
  logo(c,540,1400,170,true,eo(seg(o,2.5,3))); }

/* =====================================================================
   TRANSIÇÕES (uma por dia)
   ===================================================================== */
function blurDraw(src,amt,x=0,y=0,s=1,a=1){ // desfoque barato: reduz e amplia (funciona em todos os navegadores)
  let img=src; if(amt>.02){ const f=1+amt*14, w=Math.max(8,Math.round(src.width/f)), h=Math.max(8,Math.round(src.height/f)); BL.width=w; BL.height=h; bl.clearRect(0,0,w,h); bl.drawImage(src,0,0,w,h); img=BL; }
  ctx.save(); ctx.globalAlpha*=a; ctx.translate(540+x,960+y); ctx.scale(s,s); ctx.translate(-540,-960); ctx.imageSmoothingEnabled=true; ctx.drawImage(img,0,0,W,H); ctx.restore(); }
function transition(p){ const e=eio(p);
  if(D.trans==='focus'){ blurDraw(SA,e,0,0,1+.08*e,1-e); blurDraw(SB,1-e,0,0,.94+.06*e,e); return; }
  if(D.trans==='swipe'){ ctx.save(); ctx.translate(540-1250*e,960); ctx.rotate(-.12*e); ctx.translate(-540,-960); ctx.drawImage(SA,0,0,W,H); ctx.restore(); ctx.save(); ctx.translate(540+1250*(1-e),960); ctx.rotate(.12*(1-e)); ctx.translate(-540,-960); ctx.drawImage(SB,0,0,W,H); ctx.restore(); return; }
  if(D.trans==='flip'){ const img=e<.5?SA:SB, sx=Math.abs(Math.cos(e*Math.PI)); ctx.save(); ctx.translate(540,960); ctx.scale(Math.max(.02,sx),1-.06*Math.sin(e*Math.PI)); ctx.translate(-540,-960); ctx.drawImage(img,0,0,W,H); ctx.restore(); return; }
  if(D.trans==='rise'){ blurDraw(SA,e*.6,0,-500*e,1-.1*e,1-e); const kb=back(clamp(p*1.1,0,1)); blurDraw(SB,(1-p)*.5,0,700*(1-kb),1,clamp(p*2,0,1)); return; }
  if(D.trans==='zoom'){ blurDraw(SA,e*.7,0,0,1+.7*e,1-e); blurDraw(SB,(1-e)*.7,0,0,.7+.3*e,e); const fl=Math.max(0,1-Math.abs(p-.5)*5); if(fl>0){ ctx.save(); ctx.globalAlpha=fl*.85; ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,W,H); ctx.restore(); } return; }
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
  D=DAYCFG[curDay]||DAYCFG.seg; ctx.setTransform(Q,0,0,Q,0,0); ctx.globalAlpha=1;
  paper(ctx,t); topMark(ctx);
  if(!SCENES.length){ txt(ctx,MODE==='week'?'Sem resultados na semana':'Marque quem operou hoje',540,960,fSerif(54),C.grey,'center'); grain(ctx,t); return guides(); }
  let k=0, st=0; while(k<SCENES.length-1&&t>=st+SCENES[k].dur){ st+=SCENES[k].dur; k++; } const sc=SCENES[k], local=Math.min(t-st,sc.dur);
  if(k>0&&local<TR){ const pv=SCENES[k-1]; renderTo(sA,pv,pv.dur); renderTo(sB,sc,local); ctx.setTransform(Q,0,0,Q,0,0); transition(local/TR); }
  else { ctx.save(); sc.render(ctx,local); ctx.restore(); }
  ctx.setTransform(Q,0,0,Q,0,0); ctx.globalAlpha=1;
  txt(ctx,'Resultados individuais. Não representam promessa ou garantia de ganhos.',540,1484,fMed(20),'#8A8782','center');
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
  D=DAYCFG[curDay]||DAYCFG.seg;
  await Promise.all(FONTS.map(f=>document.fonts.load(f).catch(()=>{})));
  await loadLogo();
  MODE=curDay==='sab'?'week':'day';
  if(MODE==='week'){ WK=computeWeek(); await Promise.all(WK.rank.map(async s=>{ s._a=await getImg(avatarSrc(s),420); })); S=[]; }
  else { const list=roster.map(r=>{ const e=entry(curDay,r.id); return {...r,value:e.value,on:e.on,fx:e.fx,fy:e.fy,print:printSrc(curDay,r.id,e),avatar:avatarSrc(r)}; }).filter(s=>s.on);
    if(list.length){ let top=0; list.forEach((s,k)=>{ if(s.value>list[top].value) top=k; }); S=[list[top],...list.filter((_,k)=>k!==top)]; } else S=[];
    await Promise.all(S.map(async s=>{ s._p=await getImg(s.print,1500); s._a=await getImg(s.avatar,420); })); }
  SCENES=buildScenes();
}
