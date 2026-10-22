/* Placar do Pregão — motor de vídeo.
   Cada dia tem uma identidade própria (paleta, fontes, capa, cenário 3D, cartão do aluno, transição).
   Depende de: days, curDay, roster, entry(), printSrc(), avatarSrc() definidos em app.js.
   Não guarda dados: só desenha. */
'use strict';
const DAYS=['seg','ter','qua','qui','sex','sab'], WEEK=['seg','ter','qua','qui','sex'];
const THEMES={
  seg:{tab:'SEG',label:'SEGUNDA-FEIRA',title:'DE SEGUNDA-FEIRA'},
  ter:{tab:'TER',label:'TERÇA-FEIRA',title:'DE TERÇA-FEIRA'},
  qua:{tab:'QUA',label:'QUARTA-FEIRA',title:'DE QUARTA-FEIRA'},
  qui:{tab:'QUI',label:'QUINTA-FEIRA',title:'DE QUINTA-FEIRA'},
  sex:{tab:'SEX',label:'SEXTA-FEIRA',title:'DE SEXTA-FEIRA'},
  sab:{tab:'SÁB',label:'SÁBADO',title:'DA SEMANA'}
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
const W=1080,H=1920, FW=920,FH=960, FXP=80,FYP=500, FCX=540,FCY=980, TR=.85, FPS=30;
const SAFE_T=250,SAFE_B=1500;
const $=id=>document.getElementById(id);
const cv=$('cv'), ctx=cv.getContext('2d');
const faceA=document.createElement('canvas'), faceB=document.createElement('canvas');
const fA=faceA.getContext('2d'), fB=faceB.getContext('2d');
let Q=1, VIG=null, LOGO=null, LOGOG=null, GRAIN=null;
function setRes(q){ Q=q; cv.width=Math.round(W*q); cv.height=Math.round(H*q); faceA.width=faceB.width=Math.round(FW*q); faceA.height=faceB.height=Math.round(FH*q);
  VIG=document.createElement('canvas'); VIG.width=cv.width; VIG.height=cv.height; const v=VIG.getContext('2d'); v.scale(q,q);
  const g=v.createRadialGradient(540,900,280,540,960,1180); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.88)'); v.fillStyle=g; v.fillRect(0,0,W,H); }
setRes(.5);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo=k=>1-Math.pow(1-k,3);
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const back=k=>{ const c1=1.4,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
const RND=k=>{ const x=Math.sin(k*127.1+311.7)*43758.5453; return x-Math.floor(x); };
let S=[], MODE='day', WK=null, SCENES=[], busy=false, loopId=0, exporting=false;

/* ---------- utilidades de desenho ---------- */
function ls(c,px){ if('letterSpacing' in c) c.letterSpacing=px+'px'; }
function rr(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); }
function txt(c,s,x,y,font,color,align='left',sp=0){ c.font=font; ls(c,sp); c.fillStyle=color; c.textAlign=align; c.textBaseline='middle'; c.fillText(s,x,y); ls(c,0); }
function fitF(c,s,maxW,mk,size,sp=0,min=12){ let z=size; c.font=mk(z); ls(c,sp); while(c.measureText(s).width>maxW&&z>min){z-=2;c.font=mk(z);} ls(c,0); return z; }
function ellip(c,s,maxW,font){ c.font=font; if(c.measureText(s).width<=maxW) return s; while(s.length>1&&c.measureText(s+'…').width>maxW) s=s.slice(0,-1); return s+'…'; }
function tw(c,s,font,sp=0){ c.font=font; ls(c,sp); const w=c.measureText(s).width; ls(c,0); return w; }
const iw=i=>i.naturalWidth||i.width, ih=i=>i.naturalHeight||i.height;
function cover(c,img,x,y,w,h){ const sc=Math.max(w/iw(img),h/ih(img)), dw=iw(img)*sc, dh=ih(img)*sc; c.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh); }
function coverFocus(c,img,x,y,w,h,p,fx,fy){
  const sc=Math.max(w/iw(img),h/ih(img)), dw=iw(img)*sc, dh=ih(img)*sc;
  const dx=x+(w-dw)/2, dy=y+(h-dh)/2, Px=dx+fx*dw, Py=dy+fy*dh, z=1+1.3*p;
  let tx=Px+(x+w/2-Px)*p, ty=Py+(y+h/2-Py)*p;
  tx=clamp(tx, x+w-(dx+dw-Px)*z, x-(dx-Px)*z); ty=clamp(ty, y+h-(dy+dh-Py)*z, y-(dy-Py)*z);
  c.save(); c.translate(tx,ty); c.scale(z,z); c.translate(-Px,-Py); c.drawImage(img,dx,dy,dw,dh); c.restore();
}
function hex(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function mix(a,b,k){ const A=hex(a),B=hex(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`; }
function rgba(h,a){ const [r,g,b]=hex(h); return `rgba(${r},${g},${b},${a})`; }
function silhouette(c,cx,cy,r){ c.fillStyle=SK.pal.panel; c.fillRect(cx-r,cy-r,2*r,2*r); c.fillStyle=SK.pal.line; c.beginPath(); c.arc(cx,cy-r*.18,r*.36,0,7); c.fill(); c.beginPath(); c.ellipse(cx,cy+r*.75,r*.68,r*.5,0,0,7); c.fill(); }
function shapePath(c,shape,cx,cy,r){ c.beginPath();
  if(shape==='square'){ if(c.roundRect) c.roundRect(cx-r,cy-r,2*r,2*r,r*.18); else c.rect(cx-r,cy-r,2*r,2*r); }
  else if(shape==='hex'){ for(let k=0;k<6;k++){ const a=Math.PI/6+k*Math.PI/3; const x=cx+Math.cos(a)*r*1.08, y=cy+Math.sin(a)*r*1.08; k?c.lineTo(x,y):c.moveTo(x,y); } c.closePath(); }
  else if(shape==='skew'){ const k=r*.28; c.moveTo(cx-r+k,cy-r); c.lineTo(cx+r+k,cy-r); c.lineTo(cx+r-k,cy+r); c.lineTo(cx-r-k,cy+r); c.closePath(); }
  else c.arc(cx,cy,r,0,7); }
function avatar(c,img,cx,cy,r,ring,rw,shape=SK.avatar){ c.save(); shapePath(c,shape,cx,cy,r); c.clip(); if(img){ const k=r*1.12; cover(c,img,cx-k,cy-k,2*k,2*k);} else silhouette(c,cx,cy,r); c.restore();
  if(rw){ shapePath(c,shape,cx,cy,r); c.strokeStyle=ring; c.lineWidth=rw; c.stroke(); } }
/* texto 3D extrudado */
function text3D(c,s,x,y,font,o={}){
  const face=o.face||SK.face3D, side=o.side||SK.side3D, depth=o.depth??14, ex=o.ex??.55, ey=o.ey??1;
  c.save(); c.translate(x,y); if(o.skew) c.transform(1,0,o.skew,1,0,0); if(o.sx!=null) c.scale(o.sx,1);
  c.font=font; ls(c,o.sp||0); c.textAlign=o.align||'center'; c.textBaseline='middle';
  if(o.glow){ c.shadowColor=o.glow; c.shadowBlur=o.glowR||40; }
  for(let i=depth;i>0;i--){ c.fillStyle=mix(side[0],side[1],i/depth); c.fillText(s,ex*i,ey*i); if(i===depth) c.shadowBlur=0; }
  const sz=parseInt(font.match(/(\d+)px/)[1]); const g=c.createLinearGradient(0,-sz*.45,0,sz*.45); g.addColorStop(0,face[0]); g.addColorStop(.55,face[1]); g.addColorStop(1,face[2]||face[1]); c.fillStyle=g; c.fillText(s,0,0);
  if(o.stroke!==false){ c.lineWidth=1.5; c.strokeStyle='rgba(255,255,255,.35)'; c.strokeText(s,0,0); } ls(c,0);
  c.restore();
}
function sweep(c,x,y,w,h,k,col='255,200,150',a=.5){ if(k<=0||k>=1) return; c.save(); c.globalCompositeOperation='lighter'; const cx=x+k*w; const g=c.createLinearGradient(cx-140,0,cx+140,0); g.addColorStop(0,`rgba(${col},0)`); g.addColorStop(.5,`rgba(${col},${a})`); g.addColorStop(1,`rgba(${col},0)`); c.fillStyle=g; c.fillRect(cx-140,y,280,h); c.restore(); }

/* ---------- imagens ---------- */
const cache=new Map();
function getImg(src,max){ if(!src) return Promise.resolve(null); const key=src+'|'+max; if(cache.has(key)) return cache.get(key);
  const p=(async()=>{ let bmp=null; try{ const r=await fetch(src); if(!r.ok) throw 0; bmp=await createImageBitmap(await r.blob()); }catch(e){ bmp=await new Promise(res=>{const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src;}); }
    if(!bmp) return null; const w0=iw(bmp),h0=ih(bmp), sc=Math.min(1,max/Math.max(w0,h0)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w0*sc)); c.height=Math.max(1,Math.round(h0*sc)); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height); return c; })();
  cache.set(key,p); return p; }
const LOGOS={};
async function loadLogo(){ if(!LOGO){ LOGO=await getImg('assets/logo.png',700); }
  if(!GRAIN){ GRAIN=document.createElement('canvas'); GRAIN.width=GRAIN.height=256; const g=GRAIN.getContext('2d'), id=g.createImageData(256,256); for(let i=0;i<id.data.length;i+=4){ const v=Math.random()*255; id.data[i]=id.data[i+1]=id.data[i+2]=v; id.data[i+3]=255; } g.putImageData(id,0,0); } }
function logoFor(col){ if(!LOGO) return null; if(LOGOS[col]) return LOGOS[col]; const c=document.createElement('canvas'); c.width=LOGO.width+120; c.height=LOGO.height+120; const g=c.getContext('2d');
  g.shadowColor=col; g.shadowBlur=40; g.drawImage(LOGO,60,60); g.shadowBlur=0; g.drawImage(LOGO,60,60); LOGOS[col]=c; return c; }
function drawLogo(c,cx,cy,w,a=1){ const L=logoFor(SK.pal.glow||SK.pal.accent); if(!L) return 0; const h=w*L.height/L.width; c.save(); c.globalAlpha*=a; c.drawImage(L,cx-w/2,cy-h/2,w,h); c.restore(); return h; }

/* ---------- melhoria automática do print ---------- */
function enhance(cv2){
  const c=cv2.getContext('2d'), w=cv2.width, h=cv2.height, id=c.getImageData(0,0,w,h), d=id.data, n=w*h;
  const hist=new Uint32Array(256); for(let i=0;i<d.length;i+=4) hist[(d[i]*77+d[i+1]*150+d[i+2]*29)>>8]++;
  let lo=0,hi=255,acc=0; const cut=n*.004; while(lo<254&&(acc+=hist[lo])<cut) lo++; acc=0; while(hi>1&&(acc+=hist[hi])<cut) hi--;
  if(hi-lo<40){lo=0;hi=255;} const sc=255/(hi-lo);
  for(let i=0;i<d.length;i+=4){ let r=(d[i]-lo)*sc,g=(d[i+1]-lo)*sc,b=(d[i+2]-lo)*sc; const l=.299*r+.587*g+.114*b; d[i]=l+(r-l)*1.12; d[i+1]=l+(g-l)*1.12; d[i+2]=l+(b-l)*1.12; }
  const src=new Uint8ClampedArray(d), tmp=new Uint8ClampedArray(d.length), bl=new Uint8ClampedArray(d.length);
  for(let y=0;y<h;y++){ const o=y*w*4; for(let x=0;x<w;x++){ const a=o+Math.max(0,x-1)*4, b=o+x*4, e=o+Math.min(w-1,x+1)*4; tmp[b]=(src[a]+src[b]+src[e])/3; tmp[b+1]=(src[a+1]+src[b+1]+src[e+1])/3; tmp[b+2]=(src[a+2]+src[b+2]+src[e+2])/3; } }
  for(let y=0;y<h;y++){ const ya=Math.max(0,y-1)*w*4, yb=y*w*4, ye=Math.min(h-1,y+1)*w*4; for(let x=0;x<w*4;x+=4){ bl[yb+x]=(tmp[ya+x]+tmp[yb+x]+tmp[ye+x])/3; bl[yb+x+1]=(tmp[ya+x+1]+tmp[yb+x+1]+tmp[ye+x+1])/3; bl[yb+x+2]=(tmp[ya+x+2]+tmp[yb+x+2]+tmp[ye+x+2])/3; } }
  for(let i=0;i<d.length;i+=4){ d[i]=src[i]+.65*(src[i]-bl[i]); d[i+1]=src[i+1]+.65*(src[i+1]-bl[i+1]); d[i+2]=src[i+2]+.65*(src[i+2]-bl[i+2]); }
  c.putImageData(id,0,0);
}

/* ---------- projeção 3D ---------- */
function P3(x,y,z,cam){ const cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw), cp=Math.cos(cam.pitch||0), sp=Math.sin(cam.pitch||0);
  const x1=x*cy-z*sy, z1=x*sy+z*cy, y1=y*cp-z1*sp, z2=y*sp+z1*cp, s=cam.F/(cam.F+z2+cam.dist); return [cam.cx+x1*s, cam.cy+y1*s, s, z2]; }
function rot3(p,ax,ay,az){ let [x,y,z]=p; let c=Math.cos(ax),s=Math.sin(ax); [y,z]=[y*c-z*s,y*s+z*c]; c=Math.cos(ay); s=Math.sin(ay); [x,z]=[x*c+z*s,-x*s+z*c]; c=Math.cos(az); s=Math.sin(az); [x,y]=[x*c-y*s,x*s+y*c]; return [x,y,z]; }
function wireCube(cx,cy,size,t,col,alpha,lw=3){ const V=[]; for(const x of [-1,1]) for(const y of [-1,1]) for(const z of [-1,1]) V.push(rot3([x*size,y*size,z*size],t*.5,t*.7,t*.2));
  const cam={yaw:0,pitch:0,dist:900,F:900,cx,cy}; const P=V.map(v=>P3(v[0],v[1],v[2],cam)); const E=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  ctx.save(); ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.globalAlpha=alpha; ctx.beginPath(); E.forEach(([a,b])=>{ ctx.moveTo(P[a][0],P[a][1]); ctx.lineTo(P[b][0],P[b][1]); }); ctx.stroke(); P.forEach(p=>{ ctx.fillStyle=col; ctx.fillRect(p[0]-4,p[1]-4,8,8); }); ctx.restore(); }

/* =====================================================================
   IDENTIDADES (uma por dia)
   ===================================================================== */
const mkF=(fam,w,it='')=>size=>`${it}${w} ${size}px ${fam}`;
const SKINS={};

/* ----- SEGUNDA · TERMINAL DE TRADING ----- */
SKINS.seg={ name:'terminal',
  pal:{ink:'#04080A',panel:'#0A151A',line:'#17333B',paper:'#E4F7F0',muted:'#6F9D94',accent:'#19F08B',accent2:'#FF6A13',on:'#021208',glow:'#19F08B'},
  fd:mkF("'JetBrains Mono', ui-monospace, monospace",800), fb:mkF("'JetBrains Mono', ui-monospace, monospace",500), fbb:mkF("'JetBrains Mono', ui-monospace, monospace",800),
  fonts:["800 40px 'JetBrains Mono'","500 40px 'JetBrains Mono'"], face3D:['#EFFFF8','#7CF5BE','#19C27A'], side3D:['#06311F','#010805'],
  avatar:'square', tick:'WIN ▲ 0,84%   WDO ▼ 0,21%   IBOV ▲ 1,12%   DI1F27 11,84   LUCRO DO DIA   TRADER SCHOOL   ', trans:'scan', hl:'> MAIOR_LUCRO_DO_DIA', caps:true, tag:'[ RES.DIA ]' };
/* ----- TERÇA · TRANSMISSÃO ESPORTIVA ----- */
SKINS.ter={ name:'broadcast',
  pal:{ink:'#0A0A10',panel:'#16161E',line:'#2B2B38',paper:'#FFFFFF',muted:'#A9A9BA',accent:'#FF2A3C',accent2:'#FF6A13',on:'#FFFFFF',glow:'#FF2A3C'},
  fd:mkF("Teko, 'Arial Narrow', sans-serif",700), fb:mkF("Teko, 'Arial Narrow', sans-serif",500), fbb:mkF("Teko, 'Arial Narrow', sans-serif",700),
  fonts:["700 40px Teko","500 40px Teko"], face3D:['#FFFFFF','#E9E9EF','#B8B8C6'], side3D:['#7A0010','#1A0003'],
  avatar:'circle', tick:'AO VIVO ● RODADA DA TERÇA ● RESULTADO DOS ALUNOS ● TRADER SCHOOL ● ', trans:'slash', hl:'P1 · DESTAQUE DO DIA', caps:true, tag:'AO VIVO' };
/* ----- QUARTA · LUXO DOURADO ----- */
SKINS.qua={ name:'gold',
  pal:{ink:'#0B0906',panel:'#16120C',line:'#3B3121',paper:'#F7EFDD',muted:'#B6A88B',accent:'#E0B95C',accent2:'#F8DE94',on:'#1A1306',glow:'#E0B95C'},
  fd:mkF("'Playfair Display', Georgia, serif",900), fi:mkF("'Playfair Display', Georgia, serif",700,'italic '), fb:mkF("Montserrat, 'Helvetica Neue', sans-serif",500), fbb:mkF("Montserrat, 'Helvetica Neue', sans-serif",700),
  fonts:["900 40px 'Playfair Display'","italic 700 40px 'Playfair Display'","500 40px Montserrat","700 40px Montserrat"], face3D:['#FFF4CF','#E9C46A','#A9792A'], side3D:['#5C3F10','#140C02'],
  avatar:'circle', tick:'◆ EDIÇÃO DE OURO   ◆ TRADER SCHOOL   ◆ MENTORIA WENDELL GUIMARÃES   ', trans:'iris', hl:'DESTAQUE DE OURO', caps:false, tag:'RESULTADO' };
/* ----- QUINTA · NEON SYNTHWAVE ----- */
SKINS.qui={ name:'neon',
  pal:{ink:'#07030F',panel:'#140A26',line:'#2E1B4D',paper:'#F5EEFF',muted:'#A898CC',accent:'#FF2BD6',accent2:'#22E6FF',on:'#0A0214',glow:'#FF2BD6'},
  fd:mkF("Orbitron, 'Arial Black', sans-serif",900), fb:mkF("'Barlow Condensed', 'Arial Narrow', sans-serif",600), fbb:mkF("Orbitron, 'Arial Black', sans-serif",700),
  fonts:["900 40px Orbitron","700 40px Orbitron","600 40px 'Barlow Condensed'"], face3D:['#FFFFFF','#FFB3F0','#FF2BD6'], side3D:['#3A0B5E','#07020F'],
  avatar:'hex', tick:'◢ NIGHT SESSION ◣ QUINTA-FEIRA ◢ RESULTADO DOS ALUNOS ◣ TRADER SCHOOL ', trans:'glitch', hl:'DESTAQUE DO DIA', caps:true, tag:'REC ●' };
/* ----- SEXTA · TRAILER DE CINEMA ----- */
SKINS.sex={ name:'cinema',
  pal:{ink:'#050505',panel:'#111213',line:'#2A2B2D',paper:'#F6F1E8',muted:'#9C978F',accent:'#FF7A1A',accent2:'#3CC8D8',on:'#0A0A0A',glow:'#FF8A2A'},
  fd:mkF("'Bebas Neue', Anton, Impact, sans-serif",400), fb:mkF("'Barlow Condensed', 'Arial Narrow', sans-serif",500), fbb:mkF("'Barlow Condensed', 'Arial Narrow', sans-serif",700),
  fonts:["400 40px 'Bebas Neue'","500 40px 'Barlow Condensed'","700 40px 'Barlow Condensed'"], face3D:['#FFFFFF','#E8E2D8','#9C958A'], side3D:['#3D2210','#050302'],
  avatar:'circle', noTicker:true, trans:'whip', hl:'A ESTRELA DA SEXTA', caps:true, tag:'CENA' };
/* ----- SÁBADO · GRANDE FINAL ----- */
SKINS.sab={ name:'finale',
  pal:{ink:'#07050A',panel:'#16111A',line:'#3A2C24',paper:'#FFF7E8',muted:'#BBAA92',accent:'#FFB23E',accent2:'#FF6A13',on:'#1A0F00',glow:'#FFB23E'},
  fd:mkF("Cinzel, 'Trajan Pro', Georgia, serif",900), fb:mkF("Montserrat, 'Helvetica Neue', sans-serif",500), fbb:mkF("Montserrat, 'Helvetica Neue', sans-serif",700),
  fonts:["900 40px Cinzel","700 40px Cinzel","500 40px Montserrat","700 40px Montserrat"], face3D:['#FFF6D8','#FFC75E','#C67A12'], side3D:['#5A2D04','#120700'],
  avatar:'circle', tick:'★ GRANDE FINAL DA SEMANA   ★ TRADER SCHOOL   ★ MENTORIA WENDELL GUIMARÃES   ', trans:'cube', hl:'DESTAQUE DA SEMANA', caps:true, tag:'FINAL' };
let SK=SKINS.seg;
function useSkin(d){ SK=SKINS[d]||SKINS.seg; }
const nm=s=>SK.caps?String(s).toUpperCase():String(s);

/* ---------- valor em destaque (cada dia tem o seu selo) ---------- */
function valueBadge(c,text,x,cy,size,scale=1,align='right'){
  const P=SK.pal, f=(SK.name==='terminal'?SK.fbb:SK.name==='gold'?SK.fbb:SK.fd)(size);
  const w=tw(c,text,f)+size*.7, h=size*1.3, left=align==='right'?x-w:align==='center'?x-w/2:x;
  c.save(); c.translate(left+w/2,cy); c.scale(scale,scale);
  if(SK.name==='terminal'){ c.fillStyle=rgba(P.accent,.12); c.fillRect(-w/2,-h/2,w,h); c.strokeStyle=P.accent; c.lineWidth=3; c.strokeRect(-w/2,-h/2,w,h); txt(c,text,0,2,f,P.accent,'center'); }
  else if(SK.name==='broadcast'){ c.transform(1,0,-.22,1,0,0); c.fillStyle=P.paper; c.fillRect(-w/2,-h/2,w,h); c.fillStyle=P.accent; c.fillRect(-w/2,-h/2,12,h); txt(c,text,4,size*.08,f,'#0A0A10','center'); }
  else if(SK.name==='gold'){ const g=c.createLinearGradient(-w/2,0,w/2,0); g.addColorStop(0,'#B88A2E'); g.addColorStop(.5,'#F8DE94'); g.addColorStop(1,'#B88A2E'); rr(c,-w/2,-h/2,w,h,h/2); c.fillStyle=g; c.fill(); txt(c,text,0,2,f,P.on,'center',1); }
  else if(SK.name==='neon'){ const g=c.createLinearGradient(-w/2,0,w/2,0); g.addColorStop(0,P.accent); g.addColorStop(1,'#7B2BFF'); c.shadowColor=P.accent; c.shadowBlur=30; rr(c,-w/2,-h/2,w,h,h/2); c.fillStyle=g; c.fill(); c.shadowBlur=0; txt(c,text,0,3,f,'#FFFFFF','center'); }
  else if(SK.name==='cinema'){ txt(c,text,0,0,f,P.accent,'center',2); c.fillStyle=P.accent; c.fillRect(-w/2+size*.2,h/2-6,w-size*.4,5); }
  else { const g=c.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,'#FFE3A3'); g.addColorStop(1,'#E08A12'); rr(c,-w/2,-h/2,w,h,14); c.fillStyle=g; c.fill(); txt(c,text,0,3,f,P.on,'center'); }
  c.restore(); return w; }

/* =====================================================================
   CENÁRIOS DE FUNDO
   ===================================================================== */
function bgTerminal(t,a){ const P=SK.pal; ctx.save(); ctx.font=`500 26px 'JetBrains Mono', monospace`; ctx.textAlign='center';
  for(let col=0;col<22;col++){ const x=26+col*49, sp=90+RND(col)*140, off=RND(col*3)*1920;
    for(let r=0;r<14;r++){ const y=((off+t*sp+r*34)%2100)-90; const head=r===13; ctx.globalAlpha=a*(head?.9:.08+.4*r/13); ctx.fillStyle=head?'#CFFFE8':P.accent; ctx.fillText(String(Math.floor(RND(col*31+r+Math.floor(t*6))*10)),x,y); } }
  ctx.restore(); ctx.save(); const cam={yaw:0,pitch:.5,dist:200,F:900,cx:540,cy:1450}; ctx.strokeStyle=P.accent; ctx.lineWidth=2;
  for(let i=-8;i<=8;i++){ const p0=P3(i*160,300,0,cam), p1=P3(i*160,300,3000,cam); ctx.globalAlpha=a*.16; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); }
  for(let j=0;j<10;j++){ const z=((j*300-t*260)%3000+3000)%3000, p0=P3(-1400,300,z,cam), p1=P3(1400,300,z,cam); ctx.globalAlpha=a*.14; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); } ctx.restore(); }
function bgTrack(t,a){ const P=SK.pal; ctx.save(); const cam={yaw:Math.sin(t*.4)*.12,pitch:.36,dist:240,F:900,cx:540,cy:1250};
  const road=[P3(-700,300,0,cam),P3(700,300,0,cam),P3(700,300,4000,cam),P3(-700,300,4000,cam)]; ctx.globalAlpha=a*.5; ctx.fillStyle='#101018'; ctx.beginPath(); road.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.fill();
  for(let j=0;j<16;j++){ const z=((j*260-t*900)%4160+4160)%4160; [-700,700].forEach((x,s)=>{ const p0=P3(x,300,z,cam), p1=P3(x,300,z+130,cam); ctx.globalAlpha=a*.85; ctx.strokeStyle=j%2?'#FFFFFF':P.accent; ctx.lineWidth=14*p0[2]; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); });
    const c0=P3(0,300,z,cam), c1=P3(0,300,z+90,cam); ctx.globalAlpha=a*.5; ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=8*c0[2]; ctx.beginPath(); ctx.moveTo(c0[0],c0[1]); ctx.lineTo(c1[0],c1[1]); ctx.stroke(); }
  ctx.globalCompositeOperation='lighter'; for(let k=0;k<14;k++){ const y=RND(k)*1920, x=((RND(k*5)*1600-t*(1400+RND(k*3)*900))%1700+1700)%1700-300; ctx.globalAlpha=a*.25; ctx.fillStyle=k%3?P.accent:'#FFFFFF'; ctx.save(); ctx.translate(x,y); ctx.transform(1,0,-.4,1,0,0); ctx.fillRect(0,0,260+RND(k)*300,4+RND(k*7)*6); ctx.restore(); } ctx.restore(); }
function bgGold(t,a){ const P=SK.pal; ctx.save();
  for(let k=0;k<26;k++){ const x=RND(k)*1080, y=((RND(k*9)*2000-t*(20+RND(k)*40))%2000+2000)%2000-40, r=6+RND(k*3)*22; const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,rgba(P.accent2,.55*a)); g.addColorStop(1,rgba(P.accent,0)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); }
  for(let k=0;k<7;k++){ const cx=120+((k*173+40)%860), cy=((RND(k*4)*1700+t*(30+k*6))%1900)+10, r=46+RND(k)*40, ang=t*(1.2+RND(k*2))+k;
    const wv=Math.abs(Math.cos(ang)); ctx.globalAlpha=a*.6; const g=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r); g.addColorStop(0,'#7A5416'); g.addColorStop(.5,Math.cos(ang)>0?'#FFE7A4':'#C99A3E'); g.addColorStop(1,'#6B4612');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(cx,cy,Math.max(3,r*wv),r,0,0,7); ctx.fill(); ctx.strokeStyle='rgba(255,236,180,.55)'; ctx.lineWidth=3; ctx.stroke();
    if(wv>.45){ ctx.fillStyle='rgba(90,60,10,.65)'; ctx.font=`900 ${Math.round(r*.9)}px 'Playfair Display', serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.save(); ctx.translate(cx,cy); ctx.scale(wv,1); ctx.fillText('$',0,4); ctx.restore(); } }
  ctx.restore(); }
function bgSynth(t,a){ const P=SK.pal; ctx.save(); const hz=1210;
  const sg=ctx.createLinearGradient(0,hz-520,0,hz); sg.addColorStop(0,'#FFD23F'); sg.addColorStop(.5,'#FF4FA8'); sg.addColorStop(1,'#8A2BFF'); ctx.globalAlpha=a*.85; ctx.fillStyle=sg; ctx.beginPath(); ctx.arc(540,hz,330,Math.PI,0); ctx.fill();
  ctx.fillStyle=P.ink; for(let k=0;k<8;k++){ const y=hz-40-k*36+((t*30)%36), h=4+k*1.6; ctx.fillRect(180,y,720,h); }
  ctx.globalAlpha=a; ctx.fillStyle=P.ink; ctx.fillRect(0,hz,1080,1920-hz);
  ctx.strokeStyle=P.accent; ctx.shadowColor=P.accent; ctx.shadowBlur=14; ctx.lineWidth=2.5; const cam={yaw:0,pitch:.22,dist:100,F:900,cx:540,cy:hz};
  ctx.globalAlpha=a*.85; ctx.beginPath(); for(let i=-12;i<=12;i++){ const p0=P3(i*170,140,10,cam), p1=P3(i*170,140,4000,cam); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); } ctx.stroke();
  ctx.beginPath(); for(let j=0;j<14;j++){ const z=((j*300-t*360)%4200+4200)%4200+10, p0=P3(-2400,140,z,cam), p1=P3(2400,140,z,cam); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); } ctx.stroke();
  ctx.strokeStyle=P.accent2; ctx.shadowColor=P.accent2; ctx.beginPath(); for(let x=0;x<=1080;x+=40){ const y=hz-40-Math.abs(Math.sin(x*.013+1.3))*120*(1-Math.abs(x-540)/700)-RND(Math.floor(x/40))*30; x?ctx.lineTo(x,y):ctx.moveTo(x,y); } ctx.stroke();
  ctx.restore(); }
function bgCinema(t,a){ const P=SK.pal; ctx.save(); ctx.globalCompositeOperation='lighter';
  [[P.accent,.6,300,1.0],[P.accent2,.35,1500,-.7],[P.accent,.25,900,.4]].forEach(([col,al,y,sp],k)=>{ const x=540+Math.sin(t*.35*sp+k*2)*380, g=ctx.createRadialGradient(x,y,0,x,y,620); g.addColorStop(0,rgba(col,al*.35*a)); g.addColorStop(1,rgba(col,0)); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); });
  for(let k=0;k<3;k++){ const y=380+k*560+Math.sin(t*.6+k)*40, x=540+Math.sin(t*.4+k*1.7)*300; const g=ctx.createLinearGradient(0,y,1080,y); g.addColorStop(0,'rgba(60,200,216,0)'); g.addColorStop(.5,`rgba(140,230,255,${.22*a})`); g.addColorStop(1,'rgba(60,200,216,0)'); ctx.fillStyle=g; ctx.fillRect(0,y-3,1080,6); const gl=ctx.createRadialGradient(x,y,0,x,y,70); gl.addColorStop(0,`rgba(255,240,220,${.4*a})`); gl.addColorStop(1,'rgba(255,240,220,0)'); ctx.fillStyle=gl; ctx.fillRect(x-70,y-70,140,140); }
  ctx.restore(); ctx.save(); for(let k=0;k<30;k++){ const x=RND(k*3+Math.floor(t*2))*1080, y=RND(k*7+Math.floor(t*2))*1920; ctx.globalAlpha=a*.25; ctx.fillStyle='#FFFFFF'; ctx.fillRect(x,y,2,2+RND(k)*5); } ctx.restore(); }
function bgStage(t,a){ const P=SK.pal; ctx.save(); ctx.globalCompositeOperation='lighter';
  [[-.35,.7,140],[.3,-.6,940],[0,.9,540]].forEach(([ph,sp,x0],k)=>{ const ang=Math.sin(t*sp+ph*4)*.42; ctx.save(); ctx.translate(x0,-40); ctx.rotate(ang); const g=ctx.createLinearGradient(0,0,0,1900); g.addColorStop(0,`rgba(255,220,150,${.32*a})`); g.addColorStop(1,'rgba(255,200,120,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(18,0); ctx.lineTo(300,1900); ctx.lineTo(-300,1900); ctx.closePath(); ctx.fill(); ctx.restore(); });
  ctx.restore(); ctx.save(); for(let k=0;k<60;k++){ const x=RND(k)*1080+Math.sin(t*1.3+k)*30, y=((RND(k*7)*2200+t*(140+RND(k*3)*160))%2200)-140, s=7+RND(k*5)*10; ctx.globalAlpha=a*.75; ctx.fillStyle=k%3===0?'#FFFFFF':k%3===1?P.accent:P.accent2; ctx.save(); ctx.translate(x,y); ctx.rotate(t*3+k); ctx.scale(1,Math.abs(Math.cos(t*4+k))); ctx.fillRect(-s/2,-s/4,s,s/2); ctx.restore(); } ctx.restore(); }
const BG={terminal:bgTerminal,broadcast:bgTrack,gold:bgGold,neon:bgSynth,cinema:bgCinema,finale:bgStage};

/* ---------- moldura geral, letreiros e cabeçalho ---------- */
function background(t){ ctx.fillStyle=SK.pal.ink; ctx.fillRect(0,0,W,H); }
function ticker(t,y,dir){ if(SK.noTicker) return; const P=SK.pal; ctx.save();
  if(SK.name==='broadcast'){ ctx.fillStyle=P.accent; ctx.fillRect(0,y-30,W,60); ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,y+26,W,4); }
  else if(SK.name==='gold'){ ctx.fillStyle=rgba(P.accent,.08); ctx.fillRect(0,y-30,W,60); ctx.fillStyle=P.accent; ctx.fillRect(0,y-30,W,1.5); ctx.fillRect(0,y+28,W,1.5); }
  else if(SK.name==='neon'){ ctx.fillStyle='rgba(20,10,38,.85)'; ctx.fillRect(0,y-30,W,60); ctx.shadowColor=P.accent2; ctx.shadowBlur=12; ctx.fillStyle=P.accent2; ctx.fillRect(0,y-30,W,2); ctx.fillRect(0,y+28,W,2); ctx.shadowBlur=0; }
  else { ctx.fillStyle=rgba(P.panel,.92); ctx.fillRect(0,y-30,W,60); ctx.fillStyle=P.line; ctx.fillRect(0,y-30,W,2); ctx.fillRect(0,y+28,W,2); }
  const f=SK.fbb(SK.name==='broadcast'?40:SK.name==='terminal'?24:26), sp=SK.name==='terminal'?2:5; const w=tw(ctx,SK.tick,f,sp); let x=-(((t*90*dir)%w)+w)%w;
  ctx.font=f; ls(ctx,sp); ctx.fillStyle=SK.name==='broadcast'?'#FFFFFF':SK.name==='neon'?P.accent2:SK.name==='terminal'?P.accent:P.accent; ctx.globalAlpha=SK.name==='broadcast'?1:.85; ctx.textBaseline='middle'; ctx.textAlign='left';
  for(;x<W;x+=w) ctx.fillText(SK.tick,x,y+(SK.name==='broadcast'?4:1)); ls(ctx,0); ctx.restore(); }
function header(cnt,bump){
  const P=SK.pal, th=THEMES[curDay];
  const left=MODE==='week'?('SEMANA '+(WK?WK.range:'')):(th.label+' · '+days[curDay].date);
  const right=MODE==='week'?'GRANDE FINAL':'RESULTADO DOS ALUNOS';
  const sf=SK.fbb, lab=MODE==='week'?'TOTAL DA SEMANA':'TURMA HOJE';
  if(SK.name==='broadcast'){
    ctx.save(); ctx.transform(1,0,-.2,1,0,0); ctx.fillStyle=P.accent; ctx.fillRect(FXP+60,262,330,58); ctx.fillStyle='#FFFFFF'; ctx.fillRect(FXP+390,262,FW-330,58); ctx.restore();
    txt(ctx,'AO VIVO',FXP+70,295,sf(44),'#FFFFFF','left',3); txt(ctx,left,FXP+FW,295,sf(40),'#0A0A10','right',2);
    ctx.save(); ctx.transform(1,0,-.2,1,0,0); ctx.fillStyle=rgba(P.panel,.95); ctx.fillRect(FXP+90,336,FW,134); ctx.fillStyle=P.accent; ctx.fillRect(FXP+90,336,14,134); ctx.restore();
    txt(ctx,lab,FXP+60,404,sf(46),P.muted,'left',3);
    ctx.save(); ctx.translate(FXP+FW-10,410); ctx.scale(bump,bump); txt(ctx,brl(cnt),0,0,SK.fd(fitF(ctx,brl(cnt),540,SK.fd,120)),'#FFFFFF','right'); ctx.restore(); return; }
  if(SK.name==='terminal'){
    ctx.fillStyle=rgba(P.panel,.95); ctx.fillRect(FXP,262,FW,208); ctx.strokeStyle=P.accent; ctx.lineWidth=2; ctx.strokeRect(FXP,262,FW,208);
    ctx.fillStyle=rgba(P.accent,.14); ctx.fillRect(FXP,262,FW,50); txt(ctx,'$ placar --dia '+left.toLowerCase(),FXP+20,288,SK.fb(24),P.accent,'left');
    txt(ctx,'● LIVE',FXP+FW-20,288,SK.fbb(24),(Math.floor(performance.now()/500)%2||exporting)?P.accent:P.muted,'right');
    txt(ctx,lab.replace(' ','_'),FXP+20,392,SK.fb(28),P.muted,'left'); ctx.save(); ctx.translate(FXP+FW-24,392); ctx.scale(bump,bump); txt(ctx,'+'+brl(cnt),0,0,SK.fbb(fitF(ctx,'+'+brl(cnt),560,SK.fbb,76)),P.accent,'right'); ctx.restore(); return; }
  if(SK.name==='gold'){
    ctx.strokeStyle=P.accent; ctx.lineWidth=1.5; ctx.strokeRect(FXP,262,FW,208); ctx.strokeRect(FXP+8,270,FW-16,192);
    txt(ctx,left,540,300,SK.fbb(24),P.accent,'center',8); ctx.fillStyle=P.accent; ctx.fillRect(440,322,200,1.5);
    txt(ctx,lab==='TURMA HOJE'?'Turma hoje':'Total da semana',540,354,SK.fi(32),P.muted,'center');
    ctx.save(); ctx.translate(540,408); ctx.scale(bump,bump); const g=ctx.createLinearGradient(0,-40,0,40); g.addColorStop(0,'#FFF2C4'); g.addColorStop(1,'#C9963A'); txt(ctx,brl(cnt),0,0,SK.fd(fitF(ctx,brl(cnt),800,SK.fd,62)),g,'center'); ctx.restore(); return; }
  if(SK.name==='neon'){
    rr(ctx,FXP,262,FW,208,30); ctx.fillStyle='rgba(20,10,38,.75)'; ctx.fill(); ctx.save(); ctx.shadowColor=P.accent2; ctx.shadowBlur=24; ctx.strokeStyle=P.accent2; ctx.lineWidth=3; ctx.stroke(); ctx.restore();
    txt(ctx,left,FXP+34,310,SK.fbb(24),P.accent2,'left',4); txt(ctx,lab,FXP+34,410,SK.fbb(26),P.muted,'left',4);
    ctx.save(); ctx.translate(FXP+FW-34,400); ctx.scale(bump,bump); ctx.shadowColor=P.accent; ctx.shadowBlur=26; txt(ctx,brl(cnt),0,0,SK.fd(fitF(ctx,brl(cnt),520,SK.fd,64)),'#FFFFFF','right'); ctx.restore(); return; }
  if(SK.name==='cinema'){
    txt(ctx,left,540,292,SK.fbb(30),P.muted,'center',10);
    txt(ctx,lab,540,346,SK.fbb(26),P.accent2,'center',12);
    ctx.save(); ctx.translate(540,420); ctx.scale(bump,bump); txt(ctx,brl(cnt),0,0,SK.fd(fitF(ctx,brl(cnt),900,SK.fd,110)),P.paper,'center',3); ctx.restore();
    ctx.fillStyle=P.accent; ctx.fillRect(390,474,300,3); return; }
  /* final */
  txt(ctx,left,540,292,SK.fbb(26),P.accent,'center',8);
  rr(ctx,FXP,322,FW,148,18); ctx.fillStyle=rgba(P.panel,.9); ctx.fill(); ctx.strokeStyle=P.accent; ctx.lineWidth=2; ctx.stroke();
  txt(ctx,lab,FXP+34,396,SK.fbb(28),P.muted,'left',4);
  ctx.save(); ctx.translate(FXP+FW-34,400); ctx.scale(bump,bump); const g=ctx.createLinearGradient(0,-40,0,40); g.addColorStop(0,'#FFF0C8'); g.addColorStop(1,'#E8901A'); txt(ctx,brl(cnt),0,0,SK.fd(fitF(ctx,brl(cnt),540,SK.fd,72)),g,'right'); ctx.restore();
}
function dots(filled){
  const list=MODE==='week'?(WK?WK.rank:[]):S, n=list.length; if(!n) return; const g=14; let d=64; if(n*d+(n-1)*g>900) d=Math.max(26,(900-(n-1)*g)/n);
  let x=540-(n*d+(n-1)*g)/2+d/2; const y=1560;
  for(let k=0;k<n;k++,x+=d+g){ const r=d/2-3;
    if(k<filled) avatar(ctx,list[k]._a,x,y,r,SK.pal.accent,4);
    else { shapePath(ctx,SK.avatar,x,y,r); ctx.setLineDash([8,7]); ctx.strokeStyle=SK.pal.line; ctx.lineWidth=4; ctx.stroke(); ctx.setLineDash([]); } }
}
function overlay(t){ const P=SK.pal;
  if(SK.name==='terminal'){ ctx.save(); ctx.fillStyle='rgba(0,0,0,.16)'; for(let y=0;y<H;y+=6) ctx.fillRect(0,y,W,2); ctx.restore(); }
  if(SK.name==='cinema'){ ctx.save(); if(GRAIN){ ctx.globalAlpha=.06; ctx.globalCompositeOperation='overlay'; const ox=-Math.floor(RND(Math.floor(t*24))*256), oy=-Math.floor(RND(Math.floor(t*24)+9)*256); for(let x=ox;x<W;x+=256) for(let y=oy;y<H;y+=256) ctx.drawImage(GRAIN,x,y); }
    ctx.restore(); ctx.fillStyle='#000'; ctx.fillRect(0,0,W,236); ctx.fillRect(0,1690,W,230); ctx.fillStyle=rgba(P.accent,.6); ctx.fillRect(0,236,W,1); ctx.fillRect(0,1689,W,1); }
}

/* =====================================================================
   CAPAS (uma por dia)
   ===================================================================== */
function coverExit(t,T,fn){ const out=seg(t,T-.6,T), zs=1+1.6*eio(out); ctx.save(); ctx.translate(540,880); ctx.scale(zs,zs); ctx.translate(-540,-880); ctx.globalAlpha=1-out; fn(); ctx.restore(); }
function dateLabel(){ return MODE==='week'?(WK?WK.range:''):days[curDay].date; }

function coverTerminal(t,T){ const P=SK.pal; coverExit(t,T,()=>{
  wireCube(540,860,230,t,P.accent,.22*seg(t,0,.6),2);
  drawLogo(ctx,540,430,300,eo(seg(t,.0,.6)));
  const lines=['> trader_school --resultado','> carregando operações do dia… OK','> conectando ao pregão… OK'];
  lines.forEach((l,k)=>{ const p=seg(t,.15+k*.28,.5+k*.28); if(p<=0) return; const s=l.slice(0,Math.floor(l.length*p)); txt(ctx,s,120,600+k*44,SK.fb(28),k?P.muted:P.accent,'left'); });
  const word='RESULTADO', p=seg(t,1.0,1.75), n=Math.floor(word.length*p); const f=SK.fd(132), ww=tw(ctx,word,f); const sx=540-ww/2;
  if(n>0){ ctx.save(); ctx.shadowColor=P.accent; ctx.shadowBlur=36; text3D(ctx,word.slice(0,n),sx,830,f,{align:'left',depth:10,ex:.5,stroke:false}); ctx.restore(); }
  if(t>1&&(Math.floor(t*3)%2===0||p<1)){ const cx=sx+tw(ctx,word.slice(0,n),f)+12; ctx.fillStyle=P.accent; ctx.fillRect(cx,770,40,110); }
  const k2=eo(seg(t,1.8,2.3)); ctx.save(); ctx.globalAlpha*=k2; const sub='[ '+THEMES[curDay].label+' ]'; txt(ctx,sub,540,960,SK.fbb(fitF(ctx,sub,900,SK.fbb,64)),P.accent2,'center',2); ctx.restore();
  const k3=eo(seg(t,2.1,2.6)); ctx.save(); ctx.globalAlpha*=k3; ctx.strokeStyle=P.line; ctx.lineWidth=2; ctx.strokeRect(160,1040,760,250);
  [['DATA',dateLabel()],['ATIVOS','WIN · WDO'],['STATUS','OPERAÇÕES DOS ALUNOS']].forEach(([a,b],k)=>{ txt(ctx,a,200,1090+k*76,SK.fb(30),P.muted,'left'); txt(ctx,b,880,1090+k*76,SK.fbb(34),k===2?P.accent:P.paper,'right'); }); ctx.restore();
  ctx.save(); ctx.globalAlpha*=eo(seg(t,2.4,2.9)); txt(ctx,HANDLE,540,1380,SK.fb(30),P.accent,'center'); ctx.restore(); }); }

function coverBroadcast(t,T){ const P=SK.pal; coverExit(t,T,()=>{
  const k=eo(seg(t,0,.7)); ctx.save(); ctx.transform(1,0,-.35,1,0,0);
  [[P.accent,620,240,0],['#FFFFFF',760,40,.08],['#1A1A24',880,120,.16]].forEach(([col,y,h,d])=>{ const kk=eo(seg(t,d,.6+d)); ctx.fillStyle=col; ctx.fillRect(1500-1900*kk,y,1400,h); }); ctx.restore();
  ctx.save(); ctx.globalAlpha=.10*k; txt(ctx,'0'+(DAYS.indexOf(curDay)+1),540,860,SK.fd(720),'#FFFFFF','center'); ctx.restore();
  drawLogo(ctx,540,430,300,eo(seg(t,.2,.8)));
  const kr=back(seg(t,.45,1.15)); ctx.save(); ctx.globalAlpha*=seg(t,.45,.6); text3D(ctx,'RESULTADO',540-(1-kr)*900+40,740,SK.fd(fitF(ctx,'RESULTADO',820,SK.fd,230)),{skew:-.22,depth:16,ex:.9,face:['#FFFFFF','#F2F2F6','#C4C4D2']}); ctx.restore();
  const k2=eo(seg(t,.9,1.4)); ctx.save(); ctx.globalAlpha*=k2; ctx.translate((1-k2)*700,0); ctx.transform(1,0,-.22,1,0,0); ctx.fillStyle='#0A0A10'; const sub=THEMES[curDay].title; const fz=fitF(ctx,sub,760,SK.fd,120); const sw=tw(ctx,sub,SK.fd(fz))+80; ctx.fillRect(540-sw/2+180,850,sw,120); ctx.restore();
  ctx.save(); ctx.globalAlpha*=k2; ctx.translate((1-k2)*700,0); txt(ctx,sub,540+20,916,SK.fd(fitF(ctx,sub,760,SK.fd,120)),'#FFFFFF','center',2); ctx.restore();
  const k3=eo(seg(t,1.4,1.9)); ctx.save(); ctx.globalAlpha*=k3; ctx.transform(1,0,-.22,1,0,0); ctx.fillStyle=P.accent; ctx.fillRect(560,1040,380,74); ctx.fillStyle='#FFFFFF'; ctx.fillRect(940,1040,240,74); ctx.restore();
  ctx.save(); ctx.globalAlpha*=k3; txt(ctx,'RODADA '+pad2(DAYS.indexOf(curDay)+1),360,1080,SK.fd(56),'#FFFFFF','center',3); txt(ctx,dateLabel(),720,1080,SK.fd(56),'#0A0A10','center',2); ctx.restore();
  ctx.save(); ctx.globalAlpha*=eo(seg(t,1.7,2.2)); txt(ctx,'OPERAÇÕES DOS NOSSOS ALUNOS',540,1200,SK.fd(62),'#FFFFFF','center',4); txt(ctx,HANDLE,540,1280,SK.fb(42),P.accent,'center',2); ctx.restore();
  sweep(ctx,0,640,1080,220,seg(t,1.2,1.9),'255,255,255',.45); }); }

function coverGold(t,T){ const P=SK.pal; coverExit(t,T,()=>{
  const fr=eo(seg(t,0,1.2)); ctx.save(); ctx.strokeStyle=P.accent; ctx.lineWidth=2; const per=(fr)*1; ctx.setLineDash([3000*per,3000]); ctx.strokeRect(110,300,860,1150); ctx.setLineDash([2400*per,2400]); ctx.strokeRect(126,316,828,1118); ctx.setLineDash([]);
  [[110,300],[970,300],[110,1450],[970,1450]].forEach(([x,y])=>{ ctx.save(); ctx.globalAlpha*=fr; ctx.translate(x,y); ctx.rotate(Math.PI/4); ctx.fillStyle=P.accent; ctx.fillRect(-10,-10,20,20); ctx.restore(); }); ctx.restore();
  const ca=t*1.4, wv=Math.cos(ca); ctx.save(); ctx.globalAlpha*=.9*eo(seg(t,.2,.9)); const r=150; const g=ctx.createLinearGradient(540-r,330,540+r,630); g.addColorStop(0,'#8A611C'); g.addColorStop(.5,wv>0?'#FFEDB5':'#D6A74B'); g.addColorStop(1,'#7A5314');
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(540,480,Math.max(4,r*Math.abs(wv)),r,0,0,7); ctx.fill(); ctx.strokeStyle='#FFF1C4'; ctx.lineWidth=4; ctx.stroke(); ctx.restore();
  if(Math.abs(wv)>.35){ ctx.save(); ctx.translate(540,480); ctx.scale(Math.abs(wv),1); ctx.globalAlpha*=.95; drawLogo(ctx,0,0,250); ctx.restore(); }
  const k=eo(seg(t,.6,1.4)); ctx.save(); ctx.globalAlpha*=k; text3D(ctx,'Resultado',540,800+(1-k)*40,SK.fd(170),{depth:12,ex:.4,sp:1}); ctx.restore();
  const k2=eo(seg(t,1.0,1.7)); ctx.save(); ctx.globalAlpha*=k2; const sub=THEMES[curDay].title.toLowerCase(); const g2=ctx.createLinearGradient(0,880,0,960); g2.addColorStop(0,'#FFF0C4'); g2.addColorStop(1,'#D9A845'); txt(ctx,sub,540,935,SK.fi(fitF(ctx,sub,820,SK.fi,104)),g2,'center'); ctx.restore();
  const k3=eo(seg(t,1.4,2.0)); ctx.save(); ctx.globalAlpha*=k3; ctx.fillStyle=P.accent; ctx.fillRect(540-220*k3,1030,180*k3,1.5); ctx.fillRect(580,1030,180*k3,1.5); ctx.translate(540,1030); ctx.rotate(Math.PI/4); ctx.fillRect(-8,-8,16,16); ctx.restore();
  ctx.save(); ctx.globalAlpha*=k3; txt(ctx,dateLabel(),540,1110,SK.fbb(40),P.paper,'center',14); txt(ctx,'OPERAÇÕES DOS NOSSOS ALUNOS',540,1190,SK.fb(28),P.muted,'center',10); txt(ctx,HANDLE,540,1330,SK.fi(36),P.accent,'center'); ctx.restore();
  sweep(ctx,0,700,1080,280,seg(t,1.6,2.5),'255,230,160',.5); }); }

function coverNeon(t,T){ const P=SK.pal; coverExit(t,T,()=>{
  drawLogo(ctx,540,420,300,eo(seg(t,0,.6)));
  const flick=t<1.4?(RND(Math.floor(t*22))>.35?1:.15):1; const on=seg(t,.3,.5)*flick;
  ctx.save(); ctx.globalAlpha*=on; const f=SK.fd(fitF(ctx,'RESULTADO',940,SK.fd,150));
  [[P.accent2,-6,0],[P.accent,6,0]].forEach(([col,dx])=>{ ctx.save(); ctx.globalAlpha*=.55; ctx.globalCompositeOperation='lighter'; txt(ctx,'RESULTADO',540+dx*Math.max(0,1-t),780,f,col,'center'); ctx.restore(); });
  ctx.shadowColor=P.accent; ctx.shadowBlur=50; ctx.lineWidth=6; ctx.strokeStyle=P.accent; ctx.font=f; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.strokeText('RESULTADO',540,780); ctx.shadowBlur=18; ctx.fillStyle='#FFE6FA'; ctx.fillText('RESULTADO',540,780); ctx.restore();
  const on2=seg(t,.9,1.1)*(t<1.8?(RND(Math.floor(t*18)+7)>.3?1:.2):1); ctx.save(); ctx.globalAlpha*=on2; const sub=THEMES[curDay].title; const f2=SK.fd(fitF(ctx,sub,900,SK.fd,74)); ctx.shadowColor=P.accent2; ctx.shadowBlur=36; ctx.strokeStyle=P.accent2; ctx.lineWidth=4; ctx.font=f2; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.strokeText(sub,540,905); ctx.shadowBlur=14; ctx.fillStyle='#E8FDFF'; ctx.fillText(sub,540,905); ctx.restore();
  const k3=eo(seg(t,1.5,2.0)); ctx.save(); ctx.globalAlpha*=k3; const dl=dateLabel(); const dw=tw(ctx,dl,SK.fbb(40),6)+80; rr(ctx,540-dw/2,1000,dw,76,38); ctx.fillStyle='rgba(20,10,38,.85)'; ctx.fill(); ctx.shadowColor=P.accent; ctx.shadowBlur=20; ctx.strokeStyle=P.accent; ctx.lineWidth=3; ctx.stroke(); ctx.shadowBlur=0; txt(ctx,dl,540,1040,SK.fbb(40),'#FFFFFF','center',6); ctx.restore();
  ctx.save(); ctx.globalAlpha*=eo(seg(t,1.8,2.3)); txt(ctx,'OPERAÇÕES DOS NOSSOS ALUNOS',540,1150,SK.fbb(30),P.paper,'center',6); txt(ctx,HANDLE,540,1215,SK.fb(38),P.accent2,'center',2); ctx.restore(); }); }

function coverCinema(t,T){ const P=SK.pal; coverExit(t,T,()=>{
  const a1=seg(t,0,.35)*(1-seg(t,.9,1.15)); ctx.save(); ctx.globalAlpha*=a1; txt(ctx,'TRADER SCHOOL APRESENTA',540,900,SK.fbb(40),P.muted,'center',16); ctx.restore();
  const k=seg(t,1.0,T), push=1+.08*k; ctx.save(); ctx.translate(540,800); ctx.scale(push,push); ctx.translate(-540,-800);
  ctx.save(); ctx.globalAlpha*=eo(seg(t,1.0,1.5)); drawLogo(ctx,540,470,280); ctx.restore();
  const k1=eo(seg(t,1.1,1.8)); ctx.save(); ctx.globalAlpha*=k1; ls(ctx,0); const f=SK.fd(fitF(ctx,'RESULTADO',900,SK.fd,300,20)); text3D(ctx,'RESULTADO',540,780,f,{depth:10,ex:.3,sp:4+(1-k1)*30,face:['#FFFFFF','#E9E3D9','#8E877C']}); ctx.restore();
  const fl=seg(t,1.4,2.3); if(fl>0&&fl<1){ ctx.save(); ctx.globalCompositeOperation='lighter'; const x=-100+fl*1280; const g=ctx.createLinearGradient(0,780,1080,780); g.addColorStop(0,'rgba(60,200,216,0)'); g.addColorStop(clamp(x/1080,0.01,.99),`rgba(180,240,255,${.7*Math.sin(fl*Math.PI)})`); g.addColorStop(1,'rgba(60,200,216,0)'); ctx.fillStyle=g; ctx.fillRect(0,776,1080,8); const gl=ctx.createRadialGradient(x,780,0,x,780,160); gl.addColorStop(0,`rgba(255,245,230,${.8*Math.sin(fl*Math.PI)})`); gl.addColorStop(1,'rgba(255,200,150,0)'); ctx.fillStyle=gl; ctx.fillRect(x-160,620,320,320); ctx.restore(); }
  const k2=eo(seg(t,1.7,2.3)); ctx.save(); ctx.globalAlpha*=k2; const sub=THEMES[curDay].title; txt(ctx,sub,540,950,SK.fd(fitF(ctx,sub,900,SK.fd,110)),P.accent,'center',10); ctx.restore();
  ctx.restore();
  const k3=eo(seg(t,2.2,2.8)); ctx.save(); ctx.globalAlpha*=k3; txt(ctx,'EM CARTAZ · '+dateLabel(),540,1090,SK.fbb(36),P.paper,'center',12);
  ctx.fillStyle=P.line; ctx.fillRect(240,1150,600,1); txt(ctx,'UMA PRODUÇÃO TRADER SCHOOL · MENTORIA WENDELL GUIMARÃES',540,1200,SK.fb(fitF(ctx,'UMA PRODUÇÃO TRADER SCHOOL · MENTORIA WENDELL GUIMARÃES',820,SK.fb,26,3)),P.muted,'center',3);
  txt(ctx,'ESTRELANDO OS ALUNOS DA SEMANA · '+HANDLE.toUpperCase(),540,1240,SK.fb(fitF(ctx,'ESTRELANDO OS ALUNOS DA SEMANA · '+HANDLE.toUpperCase(),820,SK.fb,24,3)),P.muted,'center',3); ctx.restore(); }); }

function coverFinale(t,T){ const P=SK.pal;
  /* contagem de película 3-2-1 */
  if(t<2.1){ const n=3-Math.floor(t/.7), u=(t%.7)/.7; ctx.save(); ctx.fillStyle='#C9BFAE'; ctx.globalAlpha=.08; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,247,232,.55)'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(540,900,300,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(540,900,250,0,7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(540,900); ctx.arc(540,900,300,-Math.PI/2,-Math.PI/2+u*Math.PI*2); ctx.closePath(); ctx.fillStyle='rgba(255,178,62,.28)'; ctx.fill();
    ctx.fillStyle='rgba(255,247,232,.6)'; ctx.fillRect(140,898,800,4); ctx.fillRect(538,500,4,800);
    txt(ctx,String(n),540,910,SK.fd(360),P.paper,'center'); ctx.restore(); return; }
  const t2=t-2.1; coverExit(t,T,()=>{
    if(t2<.25){ ctx.save(); ctx.globalAlpha=1-t2/.25; ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,0,W,H); ctx.restore(); }
    drawLogo(ctx,540,440,320,eo(seg(t2,0,.6)));
    const k=eo(seg(t2,.15,.9)); ctx.save(); ctx.globalAlpha*=k; const s=1+.8*(1-k); ctx.translate(540,760); ctx.scale(s,s); text3D(ctx,'RESULTADO',0,0,SK.fd(fitF(ctx,'RESULTADO',940,SK.fd,150)),{depth:16,ex:.6,glow:'rgba(255,178,62,.6)',glowR:50}); ctx.restore();
    const k2=eo(seg(t2,.6,1.2)); ctx.save(); ctx.globalAlpha*=k2; txt(ctx,'DA SEMANA',540,900,SK.fd(110),P.accent,'center',12); ctx.restore();
    const k3=eo(seg(t2,1.0,1.5)); ctx.save(); ctx.globalAlpha*=k3; const dl=WK?WK.range:''; const dw=tw(ctx,dl,SK.fbb(38),6)+80; rr(ctx,540-dw/2,990,dw,72,36); ctx.fillStyle='rgba(22,17,26,.9)'; ctx.fill(); ctx.strokeStyle=P.accent; ctx.lineWidth=3; ctx.stroke(); txt(ctx,dl,540,1027,SK.fbb(38),P.paper,'center',6);
    txt(ctx,'TODOS OS ALUNOS · SEGUNDA A SEXTA',540,1140,SK.fbb(30),P.muted,'center',6); txt(ctx,HANDLE,540,1210,SK.fb(36),P.accent,'center',2); ctx.restore();
    sweep(ctx,0,660,1080,200,seg(t2,.9,1.7),'255,230,170',.55); }); }
const COVERS={terminal:coverTerminal,broadcast:coverBroadcast,gold:coverGold,neon:coverNeon,cinema:coverCinema,finale:coverFinale};
const coverDur=()=>SK.name==='finale'?6.2:4.4;

/* =====================================================================
   CARTÃO DO ALUNO (um formato por dia)
   ===================================================================== */
function printBody(c,s,x,y,w,h,zp,u){
  if(s._p) coverFocus(c,s._p,x,y,w,h,zp,s.fx,s.fy); else { c.fillStyle=SK.pal.panel; c.fillRect(x,y,w,h); txt(c,'PRINT DO ALUNO AQUI',x+w/2,y+h/2,SK.fbb(40),SK.pal.muted,'center',4); }
  if(zp>.02){ c.save(); c.globalAlpha=zp; c.strokeStyle=SK.pal.accent; c.lineWidth=7; c.lineCap='round'; const bw=w*.6*(1.25-.25*zp), bh=h*.27*(1.25-.25*zp), x0=x+w/2-bw/2, y0=y+h/2-bh/2, L=50;
    [[x0,y0,1,1],[x0+bw,y0,-1,1],[x0,y0+bh,1,-1],[x0+bw,y0+bh,-1,-1]].forEach(([px,py,sx,sy])=>{c.beginPath();c.moveTo(px+sx*L,py);c.lineTo(px,py);c.lineTo(px,py+sy*L);c.stroke();}); c.restore(); }
  const sh=seg(u,2.1,2.8); if(sh>0&&sh<1){ c.save(); c.globalCompositeOperation='lighter'; c.translate(x-500+sh*(w+1000),y+h/2); c.rotate(-.35); const g=c.createLinearGradient(-120,0,120,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.28)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(-120,-h,240,h*2); c.restore(); } }
const zoomP=u=>eo(seg(u,.9,1.9))-eo(seg(u,3.5,4.1));
const popP=u=>1+.14*Math.sin(Math.PI*seg(u,1.9,2.25));
const enterP=u=>eo(seg(u,.1,.6));

function cardTerminal(c,s,i,u){ const P=SK.pal;
  rr(c,0,0,FW,800,14); c.fillStyle=P.panel; c.fill(); c.strokeStyle=P.accent; c.lineWidth=3; c.stroke();
  c.fillStyle=rgba(P.accent,.12); c.fillRect(2,2,FW-4,52); ['#FF5F57','#FEBC2E','#28C840'].forEach((col,k)=>{ c.fillStyle=col; c.beginPath(); c.arc(32+k*30,28,9,0,7); c.fill(); });
  txt(c,`aluno_${pad2(i+1)}.log — ${i===0?'TOP 1 DO DIA':'resultado do dia'}`,FW/2,28,SK.fb(24),P.muted,'center');
  c.save(); rr(c,14,64,FW-28,722,6); c.clip(); printBody(c,s,14,64,FW-28,722,zoomP(u),u); c.fillStyle='rgba(0,0,0,.12)'; for(let y=64;y<786;y+=5) c.fillRect(14,y,FW-28,2); c.restore();
  const k=enterP(u); c.save(); c.globalAlpha=k;
  c.fillStyle=P.panel; c.fillRect(0,812,FW,140); c.strokeStyle=P.line; c.lineWidth=2; c.strokeRect(0,812,FW,140);
  avatar(c,s._a,82,882,56,P.accent,4,'square');
  const vt='+'+brl(s.value); const vf=SK.fbb(fitF(c,vt,430,SK.fbb,54)); c.save(); c.translate(FW-24,862); c.scale(popP(u),popP(u)); txt(c,vt,0,0,vf,P.accent,'right'); c.restore();
  if(Math.floor(u*3)%2===0) { c.fillStyle=P.accent; c.fillRect(FW-24+6,840,22,46); }
  const maxN=FW-24-tw(c,vt,vf)-180-30; txt(c,'> '+ellip(c,nm(s.name),maxN,SK.fbb(44)),164,862,SK.fbb(44),P.paper,'left');
  txt(c,(s.handle&&s.handle.length>1?s.handle:'aluno trader school')+'  ·  status: GAIN',168,918,SK.fb(24),P.muted,'left'); c.restore(); }

function cardBroadcast(c,s,i,u){ const P=SK.pal, k=enterP(u);
  const poly=(cc)=>{ cc.beginPath(); cc.moveTo(60,0); cc.lineTo(FW,0); cc.lineTo(FW-60,760); cc.lineTo(0,760); cc.closePath(); };
  c.save(); poly(c); c.clip(); printBody(c,s,0,0,FW,760,zoomP(u),u); c.restore();
  poly(c); c.strokeStyle=P.accent; c.lineWidth=8; c.stroke();
  c.save(); c.transform(1,0,-.22,1,0,0); c.fillStyle=P.accent; c.fillRect(70,22,150,70); c.restore(); txt(c,'P'+(i+1),130,60,SK.fd(64),'#FFFFFF','center',2);
  c.save(); c.transform(1,0,-.22,1,0,0); c.fillStyle='#FFFFFF'; c.fillRect(FW-120,22,110,48); c.restore(); txt(c,'AO VIVO',FW-60,48,SK.fd(34),P.accent,'center',2);
  const x0=-(1-k)*FW;
  c.save(); c.translate(x0,0); c.transform(1,0,-.22,1,0,0);
  c.fillStyle=P.accent; c.fillRect(220,790,160,160); c.fillStyle='rgba(22,22,30,.96)'; c.fillRect(380,790,FW-230,160); c.fillStyle='#FFFFFF'; c.fillRect(380,942,FW-230,8); c.restore();
  c.save(); c.translate(x0,0);
  txt(c,String(i+1),110,878,SK.fd(150),'#FFFFFF','center'); avatar(c,s._a,262,870,58,'#FFFFFF',5,'circle');
  const vt='+'+brl(s.value); c.save(); const vw=tw(c,vt,SK.fd(78))+40; c.restore();
  const pw=valueBadge(c,vt,FW-10,870,62,popP(u));
  const maxN=FW-10-pw-24-350; c.save(); c.transform(1,0,-.18,1,0,0); txt(c,ellip(c,nm(s.name),maxN,SK.fd(80)),350+150,s.handle&&s.handle.length>1?852:874,SK.fd(80),'#FFFFFF','left',2);
  if(s.handle&&s.handle.length>1) txt(c,ellip(c,s.handle,maxN,SK.fb(36)),356+170,910,SK.fb(36),P.accent,'left',1); c.restore(); c.restore(); }

function cardGold(c,s,i,u){ const P=SK.pal, k=enterP(u);
  c.fillStyle=P.panel; c.fillRect(0,0,FW,780); c.strokeStyle=P.accent; c.lineWidth=1.5; c.strokeRect(1,1,FW-2,778); c.strokeRect(14,14,FW-28,752);
  [[14,14],[FW-14,14],[14,766],[FW-14,766]].forEach(([x,y])=>{ c.save(); c.translate(x,y); c.rotate(Math.PI/4); c.fillStyle=P.accent; c.fillRect(-9,-9,18,18); c.restore(); });
  c.save(); c.beginPath(); c.rect(30,30,FW-60,720); c.clip(); printBody(c,s,30,30,FW-60,720,zoomP(u),u);
  const vg=c.createRadialGradient(FW/2,390,250,FW/2,390,620); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(30,20,5,.55)'); c.fillStyle=vg; c.fillRect(30,30,FW-60,720); c.restore();
  if(i===0){ c.fillStyle=P.ink; c.fillRect(FW/2-150,4,300,40); txt(c,'◆ DESTAQUE DE OURO ◆',FW/2,24,SK.fbb(22),P.accent,'center',4); }
  c.save(); c.globalAlpha=k; c.translate(0,(1-k)*30);
  avatar(c,s._a,74,874,62,P.accent,3,'circle'); c.beginPath(); c.arc(74,874,72,0,7); c.strokeStyle=rgba(P.accent,.5); c.lineWidth=1.5; c.stroke();
  const pw=valueBadge(c,'+'+brl(s.value),FW-6,874,46,popP(u));
  const maxN=FW-6-pw-30-170; txt(c,ellip(c,s.name,maxN,SK.fd(64)),170,s.handle&&s.handle.length>1?852:874,SK.fd(64),P.paper,'left');
  if(s.handle&&s.handle.length>1) txt(c,ellip(c,s.handle.toUpperCase(),maxN,SK.fb(22)),172,912,SK.fb(22),P.accent,'left',5);
  c.fillStyle=P.accent; c.fillRect(170,948,240*k,1.5); c.restore(); }

function cardNeon(c,s,i,u){ const P=SK.pal, k=enterP(u), gl=.6+.4*Math.sin(u*6);
  c.save(); rr(c,14,14,FW-28,746,30); c.clip(); printBody(c,s,14,14,FW-28,746,zoomP(u),u); c.restore();
  if(u<.6){ const g=1-u/.6; c.save(); c.globalCompositeOperation='lighter'; c.globalAlpha=.35*g; c.fillStyle=P.accent; c.fillRect(14+20*g,14,FW-28,746); c.fillStyle=P.accent2; c.fillRect(14-20*g,14,FW-28,746); c.restore(); }
  const gr=c.createLinearGradient(0,0,FW,760); gr.addColorStop(0,P.accent); gr.addColorStop(1,P.accent2);
  c.save(); c.shadowColor=P.accent; c.shadowBlur=30*gl; rr(c,8,8,FW-16,758,34); c.strokeStyle=gr; c.lineWidth=6; c.stroke(); c.restore();
  if(i===0){ rr(c,FW/2-150,-2,300,46,23); c.fillStyle=P.ink; c.fill(); c.strokeStyle=P.accent; c.lineWidth=3; c.stroke(); txt(c,'★ DESTAQUE',FW/2,22,SK.fbb(24),'#FFFFFF','center',4); }
  c.save(); c.globalAlpha=k; c.translate((1-k)*-80,0);
  rr(c,0,794,FW,156,30); c.fillStyle='rgba(30,14,56,.9)'; c.fill(); c.strokeStyle=rgba(P.accent2,.8); c.lineWidth=2; c.stroke();
  avatar(c,s._a,84,872,58,P.accent2,4,'hex');
  const pw=valueBadge(c,'+'+brl(s.value),FW-22,872,44,popP(u));
  const maxN=FW-22-pw-24-170; txt(c,ellip(c,nm(s.name),maxN,SK.fd(44)),170,s.handle&&s.handle.length>1?848:872,SK.fd(fitF(c,nm(s.name),maxN,SK.fd,44,0,28)),'#FFFFFF','left',1);
  if(s.handle&&s.handle.length>1) txt(c,ellip(c,s.handle,maxN,SK.fb(32)),172,906,SK.fb(32),P.accent2,'left',1); c.restore(); }

function cardCinema(c,s,i,u){ const P=SK.pal, k=enterP(u);
  c.fillStyle='#0C0C0D'; c.fillRect(0,0,FW,800);
  for(let y=-((u*40)%60);y<800;y+=60){ [16,FW-46].forEach(x=>{ rr(c,x,y+14,30,34,6); c.fillStyle='#2B2B2E'; c.fill(); }); }
  txt(c,'35MM',31,400,SK.fbb(18),P.accent,'center'); txt(c,'TS',FW-31,400,SK.fbb(18),P.accent,'center');
  c.save(); c.beginPath(); c.rect(70,20,FW-140,760); c.clip(); printBody(c,s,70,20,FW-140,760,zoomP(u),u);
  if(GRAIN){ c.globalAlpha=.08; c.globalCompositeOperation='overlay'; for(let x=70;x<FW-70;x+=256) for(let y=20;y<780;y+=256) c.drawImage(GRAIN,x,y); } c.restore();
  txt(c,'CENA '+pad2(i+1)+(i===0?' · A ESTRELA DA SEXTA':''),92,52,SK.fd(40),'#FFFFFF','left',4);
  c.save(); c.globalAlpha=k; c.translate((1-k)*-60,0);
  const g=c.createLinearGradient(0,820,FW,820); g.addColorStop(0,rgba(P.accent,.95)); g.addColorStop(.55,rgba(P.accent,.15)); g.addColorStop(1,rgba(P.accent,0)); c.fillStyle=g; c.fillRect(0,820,FW*k,6);
  avatar(c,s._a,64,894,56,P.accent,3,'circle');
  const pw=valueBadge(c,'+'+brl(s.value),FW,880,84,popP(u));
  const maxN=FW-pw-20-140; txt(c,ellip(c,nm(s.name),maxN,SK.fd(92)),140,s.handle&&s.handle.length>1?876:894,SK.fd(fitF(c,nm(s.name),maxN,SK.fd,92,0,56)),P.paper,'left',3);
  if(s.handle&&s.handle.length>1) txt(c,ellip(c,s.handle.toUpperCase(),maxN,SK.fbb(26)),142,932,SK.fbb(26),P.accent2,'left',5);
  c.restore(); sweep(c,0,830,FW,120,seg(u,.5,1.3),'255,200,140',.45); }
const CARDS={terminal:cardTerminal,broadcast:cardBroadcast,gold:cardGold,neon:cardNeon,cinema:cardCinema,finale:cardGold};
function faceStudent(c,i,u){ const s=S[i]; c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH); CARDS[SK.name](c,s,i,u); }

/* ---------- destaque do dia ---------- */
function faceHL(c,h){
  const s=S[0], P=SK.pal; c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,SK.hl,FW/2,40,SK.fbb(SK.name==='broadcast'?56:SK.name==='cinema'?44:30),P.accent,'center',SK.name==='terminal'?1:8);
  const cx=FW/2, cy=300, r=185*(.7+.3*eo(seg(h,0,.8)));
  c.save(); c.translate(cx,cy); c.rotate(h*.4); c.strokeStyle=P.accent; c.lineCap='round';
  if(SK.name==='terminal'){ c.restore(); c.save(); c.strokeStyle=P.accent; c.lineWidth=2; c.globalAlpha=seg(h,.2,.8); for(let k=0;k<3;k++){ const rr2=r+30+k*26+((h*60)%26); c.strokeRect(cx-rr2,cy-rr2,rr2*2,rr2*2); } }
  else if(SK.name==='neon'){ c.shadowColor=P.accent2; c.shadowBlur=20; for(let k=0;k<3;k++){ c.globalAlpha=seg(h,.2,.8)*(.6-k*.15); c.lineWidth=4; shapePath(c,'hex',0,0,r+40+k*34); c.stroke(); } }
  else for(let k=0;k<28;k++){ c.globalAlpha=(k%2?.2:.5)*seg(h,.2,.8); c.lineWidth=k%2?4:8; const a=k*Math.PI/14, r1=r+30, r2=r+(k%2?70:115); c.beginPath(); c.moveTo(Math.cos(a)*r1,Math.sin(a)*r1); c.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); c.stroke(); }
  c.restore();
  const flip=Math.cos((1-eo(seg(h,0,1.1)))*Math.PI*2);
  c.save(); c.translate(cx,cy); c.scale(Math.max(.02,Math.abs(flip)),1); avatar(c,s._a,0,0,r,P.accent,12); c.restore();
  const k2=eo(seg(h,.6,1.2)), off=(1-k2)*50; c.save(); c.globalAlpha=k2;
  const pf=SK.name==='gold'?SK.fi:SK.fd; text3D(c,SK.name==='gold'?'Parabéns,':'PARABÉNS,',FW/2,585+off,pf(fitF(c,'PARABÉNS,',800,pf,96)),{depth:10});
  const name=(SK.name==='gold'?s.name:nm(s.name))+'!'; text3D(c,name,FW/2,700+off,SK.fd(fitF(c,name,840,SK.fd,SK.name==='cinema'?150:120)),{face:[P.paper,P.accent2,P.accent],depth:12,skew:SK.name==='broadcast'?-.2:0});
  valueBadge(c,'+'+brl(s.value),FW/2,832+off,64,1+.06*Math.sin(Math.PI*seg(h,1.3,1.7)),'center');
  txt(c,SK.name==='terminal'?'// maior resultado da turma hoje':'Maior resultado da turma hoje',FW/2,932+off,SK.fb(34),P.muted,'center',2);
  c.restore(); }

/* ---------- encerramento do dia ---------- */
function mosaic(c,list,o,y0,hmax,getImg){ const m=Math.min(list.length,12), cols=m<=4?m:(m<=6?3:4), rows=Math.ceil(m/cols), gap=14;
  const cell=Math.min((FW-(cols-1)*gap)/cols,(hmax-(rows-1)*gap)/rows), gridH=rows*cell+(rows-1)*gap; const yy0=y0+(hmax-gridH)/2;
  for(let k=0;k<m;k++){ const r=Math.floor(k/cols), inRow=Math.min(cols,m-r*cols), cc=k%cols, rowW=inRow*cell+(inRow-1)*gap;
    const x=(FW-rowW)/2+cc*(cell+gap), y=yy0+r*(cell+gap), s=list[k], a=eo(seg(o,.6+k*.06,1.1+k*.06)); if(a<=0) continue;
    c.save(); c.globalAlpha=a; c.translate(x+cell/2,y+cell/2); c.rotate((1-a)*(k%2?.3:-.3)); c.scale(.4+.6*a,.4+.6*a); c.translate(-cell/2,-cell/2);
    c.save(); rr(c,0,0,cell,cell,SK.name==='terminal'?4:18); c.clip(); const im=getImg(s); if(im&&s.fx!=null) coverFocus(c,im,0,0,cell,cell,.55,s.fx,s.fy); else if(im) cover(c,im,0,0,cell,cell); else { c.fillStyle=SK.pal.panel; c.fillRect(0,0,cell,cell); } c.restore();
    rr(c,0,0,cell,cell,SK.name==='terminal'?4:18); c.strokeStyle=k===0?SK.pal.accent:SK.pal.line; c.lineWidth=k===0?6:3; c.stroke(); c.restore(); } }
function brand(c,y){ const L=logoFor(SK.pal.glow||SK.pal.accent); if(L){ const lw=300, lh=lw*L.height/L.width; c.drawImage(L,FW/2-lw/2,y,lw,lh); return lh; } return 0; }
function faceOut(c,o){
  const P=SK.pal; c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  mosaic(c,S,o,10,440,s=>s._p);
  const total=S.reduce((a,s)=>a+s.value,0), k3=eo(seg(o,1.0,1.6));
  c.save(); c.globalAlpha=k3;
  txt(c,SK.name==='terminal'?'> TOTAL_DA_TURMA':'TOTAL DA TURMA HOJE',FW/2,500,SK.fbb(36),P.muted,'center',6);
  const p=1+.05*Math.abs(Math.sin(seg(o,1.6,3.6)*2*Math.PI)), tv=brl(total*eo(seg(o,1.0,2.0)));
  c.save(); c.translate(FW/2,605); c.scale(p,p); text3D(c,tv,0,0,SK.fd(fitF(c,brl(total),860,SK.fd,SK.name==='cinema'?170:120)),{face:[P.paper,P.accent2,P.accent],depth:12,skew:SK.name==='broadcast'?-.18:0}); c.restore();
  c.restore();
  c.save(); c.globalAlpha=eo(seg(o,1.6,2.2)); const lh=brand(c,690); txt(c,HANDLE,FW/2,700+lh+10,SK.fb(34),P.accent,'center',1); c.restore();
}

/* ---------- sábado ---------- */
function box3D(c,x,y,w,h,dx,dy,front,top,side){ c.fillStyle=side; c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w+dx,y+h-dy); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  c.fillStyle=top; c.beginPath(); c.moveTo(x,y); c.lineTo(x+dx,y-dy); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w,y); c.closePath(); c.fill();
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,front[0]); g.addColorStop(1,front[1]); c.fillStyle=g; c.fillRect(x,y,w,h); }
function faceBars(c,o){ const P=SK.pal;
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'RESULTADO POR DIA',FW/2,40,SK.fd(44),P.accent,'center',8);
  const max=Math.max(1,...WK.dayTotals), slot=FW/5, bw=112, base=740;
  WK.dayTotals.forEach((v,k)=>{ const a=eo(seg(o,.5+k*.18,1.5+k*.18)), h=Math.max(8,520*v/max)*a, x=k*slot+slot/2-bw/2-10, best=v===max&&v>0;
    if(best&&a>.9){ c.save(); c.globalCompositeOperation='lighter'; const g=c.createLinearGradient(0,base-h-160,0,base); g.addColorStop(0,'rgba(255,200,120,0)'); g.addColorStop(1,'rgba(255,200,120,.25)'); c.fillStyle=g; c.fillRect(x-30,base-h-160,bw+86,h+160); c.restore(); }
    box3D(c,x,base-h,bw,h,26,18,v?['#FFD27A','#8A4A06']:['#3A3530','#1E1C21'],v?'#FFF0C0':'#4A4540',v?'#A35A08':'#2A2724');
    c.save(); c.globalAlpha=a; txt(c,v?brl(v):'—',x+bw/2+10,base-h-50,SK.fbb(fitF(c,v?brl(v):'—',slot-8,SK.fbb,28)),best?P.accent:P.paper,'center'); c.restore();
    txt(c,THEMES[WEEK[k]].tab,x+bw/2+10,base+42,SK.fd(40),v?P.paper:P.muted,'center'); txt(c,WK.dates[k]||'',x+bw/2+10,base+86,SK.fb(26),P.muted,'center'); });
  c.save(); c.globalAlpha=eo(seg(o,1.8,2.4)); txt(c,WK.ops+' OPERAÇÕES NO VERDE · '+WK.rank.length+' ALUNOS',FW/2,920,SK.fbb(30),P.accent,'center',4); c.restore(); }
function trophy(c,cx,cy,s,a){ c.save(); c.globalAlpha*=a; c.translate(cx,cy); c.scale(s,s); const g=c.createLinearGradient(-60,-80,60,60); g.addColorStop(0,'#FFF1C2'); g.addColorStop(.5,'#FFB23E'); g.addColorStop(1,'#9A5A06'); c.fillStyle=g;
  c.beginPath(); c.moveTo(-60,-80); c.lineTo(60,-80); c.quadraticCurveTo(60,10,0,24); c.quadraticCurveTo(-60,10,-60,-80); c.fill();
  c.lineWidth=10; c.strokeStyle=g; c.beginPath(); c.arc(-62,-48,26,Math.PI*.5,Math.PI*1.5); c.stroke(); c.beginPath(); c.arc(62,-48,26,-Math.PI*.5,Math.PI*.5); c.stroke();
  c.fillRect(-10,22,20,34); c.fillRect(-44,56,88,18); c.restore(); }
function facePodium(c,o){ const P=SK.pal;
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'PÓDIO DA SEMANA',FW/2,40,SK.fd(44),P.accent,'center',8);
  const spots=[[0,330,260,300],[1,40,260,210],[2,620,260,150]], base=930;
  spots.forEach(([idx,x,w,hh],j)=>{ const s=WK.rank[idx]; if(!s) return; const a=eo(seg(o,.4+(2-j)*.35,1.2+(2-j)*.35)), h=hh*a;
    if(idx===0&&a>.5){ c.save(); c.globalCompositeOperation='lighter'; const g=c.createLinearGradient(0,0,0,base); g.addColorStop(0,'rgba(255,220,150,.0)'); g.addColorStop(1,`rgba(255,220,150,${.28*a})`); c.fillStyle=g; c.beginPath(); c.moveTo(x+w/2-20,0); c.lineTo(x+w/2+20,0); c.lineTo(x+w+60,base); c.lineTo(x-60,base); c.closePath(); c.fill(); c.restore(); }
    box3D(c,x,base-h,w,h,28,20,idx===0?['#FFD27A','#8A4A06']:['#3A3530','#17161A'],idx===0?'#FFF0C0':'#4A4540',idx===0?'#A35A08':'#252226');
    c.save(); c.globalAlpha=a; txt(c,String(idx+1),x+w/2,base-h/2+6,SK.fd(idx===0?130:100),idx===0?'#5A2D04':P.muted,'center');
    const r=idx===0?92:74, cy=base-h-r-150; avatar(c,s._a,x+w/2,cy,r,idx===0?P.accent:P.paper,idx===0?9:5);
    if(idx===0) trophy(c,x+w/2,cy-r-70,.75,seg(o,1.6,2.0));
    txt(c,ellip(c,nm(s.name),w+20,SK.fd(40)),x+w/2,cy+r+42,SK.fd(40),P.paper,'center');
    txt(c,'+'+brl(s.total),x+w/2,cy+r+90,SK.fbb(fitF(c,'+'+brl(s.total),w+30,SK.fbb,34)),P.accent,'center'); c.restore(); });
}
function faceRank(c,o,page){ const P=SK.pal;
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'RANKING DA SEMANA',FW/2,40,SK.fd(44),P.accent,'center',8);
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const a=eo(seg(o,.3+j*.12,.9+j*.12)), y=110+j*138, xo=(1-a)*500;
    c.save(); c.globalAlpha=a; c.translate(xo,0);
    rr(c,0,y,FW,120,24); c.fillStyle=P.panel; c.fill(); c.strokeStyle=P.line; c.lineWidth=2; c.stroke();
    txt(c,(start+j+1)+'º',30,y+62,SK.fd(50),P.accent,'left');
    avatar(c,s._a,160,y+60,44,P.accent,4);
    const pw=valueBadge(c,'+'+brl(s.total),FW-24,y+60,38);
    txt(c,ellip(c,nm(s.name),FW-24-pw-24-222,SK.fd(40)),222,y+44,SK.fd(40),P.paper,'left');
    s.days.forEach((on,k)=>{ rr(c,222+k*48,y+78,40,26,8); c.fillStyle=on?P.accent:P.line; c.fill(); txt(c,THEMES[WEEK[k]].tab[0],242+k*48,y+92,SK.fbb(16),on?P.on:P.muted,'center'); });
    c.restore(); });
}
function fireworks(c,o,cx,cy){ for(let b=0;b<3;b++){ const t0=1.6+b*.7, u=seg(o,t0,t0+1.4); if(u<=0||u>=1) continue; const bx=cx+(b-1)*300, by=cy-120+b%2*80;
    for(let k=0;k<26;k++){ const a=k/26*Math.PI*2, r=eo(u)*(160+RND(k+b*9)*60); c.globalAlpha=(1-u); c.fillStyle=k%2?'#FFE3A3':'#FF8A2A'; c.beginPath(); c.arc(bx+Math.cos(a)*r,by+Math.sin(a)*r+u*u*60,5,0,7); c.fill(); } } c.globalAlpha=1; }
function faceWeekOut(c,o){ const P=SK.pal;
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  c.save(); fireworks(c,o,FW/2,260); c.restore();
  c.save(); c.globalAlpha=eo(seg(o,.5,1.1)); brand(c,0); c.restore();
  const k=eo(seg(o,.8,1.4)); c.save(); c.globalAlpha=k;
  txt(c,'TOTAL DA SEMANA',FW/2,330,SK.fbb(42),P.muted,'center',10);
  const p=1+.05*Math.abs(Math.sin(seg(o,1.6,3.6)*2*Math.PI)), tv=brl(WK.total*eo(seg(o,.8,2.0)));
  c.save(); c.translate(FW/2,460); c.scale(p,p); text3D(c,tv,0,0,SK.fd(fitF(c,brl(WK.total),880,SK.fd,130)),{depth:16,glow:'rgba(255,178,62,.55)',glowR:40}); c.restore();
  txt(c,WK.rank.length+' ALUNOS · '+WK.ops+' OPERAÇÕES NO VERDE',FW/2,600,SK.fbb(34),P.paper,'center',4);
  txt(c,'PARABÉNS, TURMA!',FW/2,700,SK.fd(76),P.accent,'center',4);
  txt(c,HANDLE,FW/2,800,SK.fb(36),P.accent,'center',1);
  c.restore(); }

/* =====================================================================
   TRANSIÇÕES (uma por dia)
   ===================================================================== */
function stripsY(img,phi,cx,cy,r,F,Z0,NS){ const cs=Math.cos(phi), sn=Math.sin(phi), sw=FW/NS; const shade=(1-Math.abs(cs))*.7; ctx.fillStyle=`rgba(0,0,0,${shade.toFixed(3)})`;
  for(let k=0;k<NS;k++){ const x0=-FW/2+k*sw, x1=x0+sw; const z0=-x0*sn-r*cs, z1=-x1*sn-r*cs, s0=F/(Z0+z0), s1=F/(Z0+z1);
    const X0=cx+(x0*cs-r*sn)*s0, X1=cx+(x1*cs-r*sn)*s1; if(X1-X0<.4) continue; const sa=(s0+s1)/2, dy=cy-FH/2*sa, dh=FH*sa;
    ctx.drawImage(img,k*sw*Q,0,sw*Q,FH*Q,X0,dy,X1-X0+.8,dh); if(shade>.01) ctx.fillRect(X0,dy,X1-X0+.8,dh); } }
function drawFace(img,x=FXP,y=FYP,s=1,a=1){ ctx.save(); ctx.globalAlpha*=a; ctx.translate(x+FW/2,y+FH/2); ctx.scale(s,s); ctx.drawImage(img,-FW/2,-FH/2,FW,FH); ctx.restore(); }
function transition(A,B,p){ const P=SK.pal, e=eio(p);
  if(SK.trans==='cube'){ const NS=Q<1?36:64, F=2.4*FW, th=e*Math.PI/2, r=FW/2, Z0=F+r; stripsY(A,th,FCX,FCY,r,F,Z0,NS); stripsY(B,th-Math.PI/2,FCX,FCY,r,F,Z0,NS);
    const ex=FCX+(r*Math.cos(th)-r*Math.sin(th))*F/(Z0+(-r*Math.sin(th)-r*Math.cos(th))), gl=Math.sin(th*2); if(gl>.02){ ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(ex-40,0,ex+40,0); g.addColorStop(0,rgba(P.accent,0)); g.addColorStop(.5,rgba(P.accent2,.8*gl)); g.addColorStop(1,rgba(P.accent,0)); ctx.fillStyle=g; ctx.fillRect(ex-40,FCY-FH*.6,80,FH*1.2); ctx.restore(); } return; }
  if(SK.trans==='scan'){ const ly=FYP+FH*e; drawFace(A); ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,ly); ctx.clip(); drawFace(B); ctx.restore();
    for(let k=0;k<8;k++){ const yy=ly-60+RND(k+Math.floor(p*30))*120, hh=6+RND(k*3)*18, dx=(RND(k*7+Math.floor(p*40))-.5)*80; ctx.drawImage(B,0,Math.max(0,(yy-FYP))*Q,FW*Q,hh*Q,FXP+dx,yy,FW,hh); }
    ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(0,ly-40,0,ly+40); g.addColorStop(0,rgba(P.accent,0)); g.addColorStop(.5,rgba(P.accent,.95)); g.addColorStop(1,rgba(P.accent,0)); ctx.fillStyle=g; ctx.fillRect(0,ly-40,W,80); ctx.restore(); return; }
  if(SK.trans==='slash'){ drawFace(A,FXP-e*120,FYP); const xe=-400+e*2000; const poly=(off)=>{ ctx.beginPath(); ctx.moveTo(-400,0); ctx.lineTo(xe+off,0); ctx.lineTo(xe+off-700,H); ctx.lineTo(-400,H); ctx.closePath(); };
    ctx.save(); poly(0); ctx.clip(); drawFace(B,FXP+(1-e)*120,FYP); ctx.restore();
    [[P.accent,0,40],['#FFFFFF',40,16],[P.accent,70,10]].forEach(([col,off,w])=>{ ctx.save(); ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(xe+off,0); ctx.lineTo(xe+off+w,0); ctx.lineTo(xe+off+w-700,H); ctx.lineTo(xe+off-700,H); ctx.closePath(); ctx.fill(); ctx.restore(); }); return; }
  if(SK.trans==='iris'){ drawFace(A,FXP,FYP,1-.06*e,1-.4*e); const R=e*1150; ctx.save(); ctx.beginPath(); ctx.arc(FCX,FCY,R,0,7); ctx.clip(); drawFace(B,FXP,FYP,1.08-.08*e); ctx.restore();
    ctx.save(); ctx.strokeStyle=P.accent2; ctx.lineWidth=6; ctx.shadowColor=P.accent; ctx.shadowBlur=30; ctx.globalAlpha=Math.sin(p*Math.PI); ctx.beginPath(); ctx.arc(FCX,FCY,R,0,7); ctx.stroke(); ctx.lineWidth=2; ctx.beginPath(); ctx.arc(FCX,FCY,R+18,0,7); ctx.stroke(); ctx.restore(); return; }
  if(SK.trans==='glitch'){ const img=p<.5?A:B, I=Math.sin(p*Math.PI); drawFace(img);
    for(let k=0;k<14;k++){ const yy=RND(k+Math.floor(p*24))*FH, hh=10+RND(k*5+Math.floor(p*24))*70, dx=(RND(k*11+Math.floor(p*30))-.5)*260*I; ctx.drawImage(img,0,yy*Q,FW*Q,Math.min(hh,FH-yy)*Q,FXP+dx,FYP+yy,FW,Math.min(hh,FH-yy)); }
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.35*I; ctx.fillStyle=P.accent; ctx.fillRect(FXP+18*I,FYP,FW,FH); ctx.fillStyle=P.accent2; ctx.fillRect(FXP-18*I,FYP,FW,FH); ctx.restore(); return; }
  if(SK.trans==='whip'){ const off=e*1400; for(let k=4;k>=0;k--){ drawFace(A,FXP-off-k*60*Math.sin(p*Math.PI),FYP,1,k?.18:1); drawFace(B,FXP+1400-off+k*60*Math.sin(p*Math.PI),FYP,1,k?.18:1); }
    const fl=Math.max(0,1-Math.abs(p-.5)*5); if(fl>0){ ctx.save(); ctx.globalAlpha=fl*.9; ctx.fillStyle='#FFF4E6'; ctx.fillRect(0,0,W,H); ctx.restore(); } return; }
}

/* =====================================================================
   LINHA DO TEMPO
   ===================================================================== */
const T_HL=3.4, PER=4.6, T_OUT=4.6;
function buildScenes(){
  if(MODE==='week'){ if(!WK||!WK.rank.length) return [];
    const sc=[{kind:'cover',dur:coverDur()},{kind:'face',dur:4.6,render:faceBars,cnt:u=>[WK.total*eo(seg(u,.8,2.6)),1],filled:u=>Math.round(WK.rank.length*seg(u,.8,2.6))}];
    sc.push({kind:'face',dur:5.2,render:facePodium,cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    for(let p=0;3+p*6<WK.rank.length;p++) sc.push({kind:'face',dur:3.8,render:(c,u)=>faceRank(c,u,p),cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    sc.push({kind:'face',dur:5.4,render:faceWeekOut,cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    return sc; }
  if(!S.length) return [];
  const sc=[{kind:'cover',dur:coverDur()},{kind:'face',dur:T_HL,render:faceHL,cnt:()=>[0,1],filled:()=>0}];
  let prev=0; S.forEach((s,i)=>{ const p0=prev; sc.push({kind:'face',dur:PER,render:(c,u)=>faceStudent(c,i,u),cnt:u=>[p0+s.value*eo(seg(u,1.0,2.0)),1+.08*Math.sin(Math.PI*seg(u,1.0,1.35))],filled:u=>i+(u>=1?1:0)}); prev+=s.value; });
  const total=prev; sc.push({kind:'face',dur:T_OUT,render:faceOut,cnt:()=>[total,1],filled:()=>S.length});
  return sc;
}
const dur=()=>SCENES.reduce((a,s)=>a+s.dur,0);
function sceneStart(k){ let t=0; for(let i=0;i<k;i++) t+=SCENES[i].dur; return t; }
function draw(t){
  ctx.setTransform(Q,0,0,Q,0,0); useSkin(curDay);
  background(t);
  if(!SCENES.length){ BG[SK.name](t,.4); ctx.drawImage(VIG,0,0,W,H); ticker(t,150,1); ticker(t,1660,-1); header(0,1); txt(ctx,MODE==='week'?'Sem resultados na semana':'Marque quem operou hoje',540,980,SK.fd(56),SK.pal.muted,'center'); overlay(t); return guides(); }
  let k=0, st=0; while(k<SCENES.length-1&&t>=st+SCENES[k].dur){ st+=SCENES[k].dur; k++; } const sc=SCENES[k], local=Math.min(t-st,sc.dur);
  BG[SK.name](t,sc.kind==='cover'?1:.3); ctx.drawImage(VIG,0,0,W,H); ticker(t,150,1); ticker(t,1660,-1);
  if(sc.kind==='cover'){ COVERS[SK.name](local,sc.dur); }
  else { const [cnt,bump]=sc.cnt(local); header(cnt,bump);
    const prev=SCENES[k-1];
    if(prev&&prev.kind==='face'&&local<TR){ prev.render(fA,prev.dur); sc.render(fB,local); transition(faceA,faceB,local/TR); }
    else { sc.render(fA,local);
      if(prev&&prev.kind==='cover'&&local<.7){ const a=eo(local/.7); drawFace(faceA,FXP,FYP,.35+.65*a,a); }
      else drawFace(faceA); }
    dots(sc.filled(local)); }
  txt(ctx,'Resultados individuais. Não representam promessa ou garantia de ganhos.',540,1482,SK.fb(22),SK.pal.muted,'center');
  overlay(t); guides();
}
function guides(){ if(exporting||!$('guides')||!$('guides').checked) return; ctx.save(); ctx.fillStyle='rgba(255,40,40,.28)'; ctx.fillRect(0,0,W,SAFE_T-30); ctx.fillRect(0,SAFE_B+20,W,H-SAFE_B-20); ctx.fillRect(W-130,1050,130,SAFE_B-1030);
  txt(ctx,'ÁREA COBERTA PELO REELS',540,110,"700 34px 'Barlow Condensed'",'#fff','center',4); txt(ctx,'ÁREA COBERTA PELO REELS',540,1760,"700 34px 'Barlow Condensed'",'#fff','center',4); ctx.restore(); }

/* ---------- preparar dados do vídeo ---------- */
function computeWeek(){
  const sab=parseDate(days.sab.date); const dayTotals=[], dates=[], incl=[]; let ops=0;
  const per={}; roster.forEach(r=>per[r.id]={...r,total:0,days:[false,false,false,false,false]});
  WEEK.forEach((d,k)=>{ const dd=parseDate(days[d].date); const ok=!sab||!dd||((sab-dd)/864e5>=0&&(sab-dd)/864e5<=6); incl.push(ok); dates.push(shortDate(days[d].date)); let tot=0;
    if(ok) roster.forEach(r=>{ const e=days[d].entries[r.id]; if(e&&e.on&&e.value>0){ per[r.id].total+=e.value; per[r.id].days[k]=true; tot+=e.value; ops++; } });
    dayTotals.push(tot); });
  const rank=Object.values(per).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const first=WEEK.find((d,k)=>incl[k]&&dayTotals[k]>0)||'seg', last=[...WEEK].reverse().find((d,k)=>incl[4-k]&&dayTotals[4-k]>0)||'sex';
  return {dayTotals,dates,incl,ops,rank,total:dayTotals.reduce((a,b)=>a+b,0),range:shortDate(days[first].date)+' A '+shortDate(days[last].date)};
}
async function prepare(){
  useSkin(curDay);
  await Promise.all([...SK.fonts,"400 100px Anton","700 40px 'Barlow Condensed'","500 40px 'Barlow Condensed'"].map(f=>document.fonts.load(f).catch(()=>{})));
  await loadLogo();
  MODE=curDay==='sab'?'week':'day';
  if(MODE==='week'){ WK=computeWeek(); await Promise.all(WK.rank.map(async s=>{ s._a=await getImg(avatarSrc(s),420); })); S=[]; }
  else { const list=roster.map(r=>{ const e=entry(curDay,r.id); return {...r,value:e.value,on:e.on,fx:e.fx,fy:e.fy,print:printSrc(curDay,r.id,e),avatar:avatarSrc(r)}; }).filter(s=>s.on);
    if(list.length){ let top=0; list.forEach((s,k)=>{ if(s.value>list[top].value) top=k; }); S=[list[top],...list.filter((_,k)=>k!==top)]; } else S=[];
    await Promise.all(S.map(async s=>{ s._p=await getImg(s.print,1500); s._a=await getImg(s.avatar,420); })); }
  SCENES=buildScenes();
}
