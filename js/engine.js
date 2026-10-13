/* Placar do Pregão — motor de vídeo (capas, cenários 3D, transições e linha do tempo).
   Depende de: days, curDay, roster, entry(), printSrc(), avatarSrc() definidos em app.js. */
'use strict';
const DAYS=['seg','ter','qua','qui','sex','sab'], WEEK=['seg','ter','qua','qui','sex'];
const THEMES={
  seg:{tab:'SEG',label:'SEGUNDA-FEIRA',title:'DE SEGUNDA-FEIRA',enter:'letters',trans:'cube',bg:'candles'},
  ter:{tab:'TER',label:'TERÇA-FEIRA',title:'DE TERÇA-FEIRA',enter:'spin',trans:'flip',bg:'ring'},
  qua:{tab:'QUA',label:'QUARTA-FEIRA',title:'DE QUARTA-FEIRA',enter:'slide',trans:'tunnel',bg:'chart'},
  qui:{tab:'QUI',label:'QUINTA-FEIRA',title:'DE QUINTA-FEIRA',enter:'drop',trans:'stack',bg:'orbit'},
  sex:{tab:'SEX',label:'SEXTA-FEIRA',title:'DE SEXTA-FEIRA',enter:'depth',trans:'blinds',bg:'skyline'},
  sab:{tab:'SÁB',label:'SÁBADO',title:'DA SEMANA',enter:'depth',trans:'cube',bg:'podium'}
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
function defaultDate(day){ const d=new Date(); let dow=d.getDay(); const idx=DAYS.indexOf(day)+1; let diff=idx-dow; if(dow===0) diff=idx-7; const x=new Date(d); x.setDate(d.getDate()+diff); return fmtDate(x); }
const shortDate=s=>{ const d=parseDate(s); return d?pad2(d.getDate())+'/'+pad2(d.getMonth()+1):''; };

/* ---------- motor ---------- */
const C={ink:'#0A0A0B',panel:'#17161A',line:'#2E2B30',paper:'#F3EEE6',muted:'#A39C92',accent:'#FF6A13',stripe:'#1E1C21'};
const DISP="Anton, Impact, 'Arial Narrow', sans-serif", BODY="'Barlow Condensed', 'Arial Narrow', sans-serif";
const W=1080,H=1920, FW=920,FH=960, FXP=80,FYP=500, FCX=540,FCY=980, TR=.8, FPS=30;
const SAFE_T=250,SAFE_B=1500;
const $=id=>document.getElementById(id);
const cv=$('cv'), ctx=cv.getContext('2d');
const faceA=document.createElement('canvas'), faceB=document.createElement('canvas');
const fA=faceA.getContext('2d'), fB=faceB.getContext('2d');
let Q=1, VIG=null, LOGO=null, LOGOG=null;
function setRes(q){ Q=q; cv.width=Math.round(W*q); cv.height=Math.round(H*q); faceA.width=faceB.width=Math.round(FW*q); faceA.height=faceB.height=Math.round(FH*q);
  VIG=document.createElement('canvas'); VIG.width=cv.width; VIG.height=cv.height; const v=VIG.getContext('2d'); v.scale(q,q);
  const g=v.createRadialGradient(540,900,280,540,960,1180); g.addColorStop(0,'rgba(10,10,11,0)'); g.addColorStop(1,'rgba(10,10,11,.88)'); v.fillStyle=g; v.fillRect(0,0,W,H); }
setRes(.5);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seg=(t,a,b)=>clamp((t-a)/(b-a),0,1);
const eo=k=>1-Math.pow(1-k,3);
const eio=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
const back=k=>{ const c1=1.4,c3=c1+1; return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2); };
let S=[], MODE='day', WK=null, SCENES=[], downloads=null, db=null, assets=null, busy=false, loopId=0, exporting=false;

function ls(c,px){ if('letterSpacing' in c) c.letterSpacing=px+'px'; }
function rr(c,x,y,w,h,r){ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); }
function txt(c,s,x,y,font,color,align='left',sp=0){ c.font=font; ls(c,sp); c.fillStyle=color; c.textAlign=align; c.textBaseline='middle'; c.fillText(s,x,y); ls(c,0); }
function fit(c,s,maxW,weight,size,family,sp=0,min=10){ let z=size; c.font=`${weight} ${z}px ${family}`; ls(c,sp); while(c.measureText(s).width>maxW&&z>min){z-=2;c.font=`${weight} ${z}px ${family}`;} ls(c,0); return `${weight} ${z}px ${family}`; }
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
function stripes(c,x,y,w,h){ c.fillStyle=C.panel; c.fillRect(x,y,w,h); c.strokeStyle=C.stripe; c.lineWidth=32; c.beginPath(); for(let k=-h;k<w+h;k+=64){c.moveTo(x+k,y+h);c.lineTo(x+k+h,y);} c.stroke(); }
function silhouette(c,cx,cy,r){ c.fillStyle=C.panel; c.fillRect(cx-r,cy-r,2*r,2*r); c.fillStyle=C.line; c.beginPath(); c.arc(cx,cy-r*.18,r*.36,0,7); c.fill(); c.beginPath(); c.ellipse(cx,cy+r*.75,r*.68,r*.5,0,0,7); c.fill(); }
function circleImg(c,img,cx,cy,r){ c.save(); c.beginPath(); c.arc(cx,cy,r,0,7); c.clip(); if(img){ const k=r*1.06; cover(c,img,cx-k,cy-k,2*k,2*k);} else silhouette(c,cx,cy,r); c.restore(); }
function pill(c,text,xr,cy,size,scale=1,align='right'){ c.font=`400 ${size}px ${DISP}`; const w=c.measureText(text).width+size*.6, h=size*1.25; const x=align==='right'?xr-w:xr-w/2;
  c.save(); c.translate(x+w/2,cy); c.scale(scale,scale); rr(c,-w/2,-h/2,w,h,h*.22); c.fillStyle=C.accent; c.fill(); txt(c,text,0,size*.04,`400 ${size}px ${DISP}`,C.paper,'center'); c.restore(); return w; }
function hex(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function mix(a,b,k){ const A=hex(a),B=hex(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')})`; }
/* texto 3D extrudado: camadas de profundidade + face com degradê */
function text3D(c,s,x,y,size,o={}){
  const face=o.face||['#FFFFFF','#B9B1A6'], side=o.side||['#4A3426','#0C0806'], depth=o.depth??16, ex=o.ex??.55, ey=o.ey??1;
  c.save(); c.translate(x,y); if(o.skew) c.transform(1,0,o.skew,1,0,0); if(o.sx!=null) c.scale(o.sx,1);
  c.font=`400 ${size}px ${o.font||DISP}`; ls(c,o.sp||0); c.textAlign=o.align||'center'; c.textBaseline='middle';
  for(let i=depth;i>0;i--){ c.fillStyle=mix(side[0],side[1],i/depth); c.fillText(s,ex*i,ey*i); }
  const g=c.createLinearGradient(0,-size*.45,0,size*.45); g.addColorStop(0,face[0]); g.addColorStop(.55,face[1]); g.addColorStop(1,face[2]||face[1]); c.fillStyle=g; c.fillText(s,0,0);
  c.lineWidth=1.5; c.strokeStyle='rgba(255,255,255,.35)'; c.strokeText(s,0,0); ls(c,0);
  c.restore();
}

/* imagens */
const cache=new Map();
function getImg(src,max){ if(!src) return Promise.resolve(null); const key=src+'|'+max; if(cache.has(key)) return cache.get(key);
  const p=(async()=>{ let bmp=null; try{ const r=await fetch(src); if(!r.ok) throw 0; bmp=await createImageBitmap(await r.blob()); }catch(e){ bmp=await new Promise(res=>{const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src=src;}); }
    if(!bmp) return null; const w0=iw(bmp),h0=ih(bmp), sc=Math.min(1,max/Math.max(w0,h0)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w0*sc)); c.height=Math.max(1,Math.round(h0*sc)); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height); return c; })();
  cache.set(key,p); return p; }
async function loadLogo(){ if(LOGO) return; LOGO=await getImg('assets/logo.png',700); if(!LOGO) return;
  LOGOG=document.createElement('canvas'); LOGOG.width=LOGO.width+120; LOGOG.height=LOGO.height+120; const g=LOGOG.getContext('2d');
  g.shadowColor='rgba(255,106,19,.85)'; g.shadowBlur=40; g.drawImage(LOGO,60,60); g.shadowBlur=0; g.drawImage(LOGO,60,60); }

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

/* ---------- cenários 3D de fundo (um por dia) ---------- */
function P3(x,y,z,cam){ const cy=Math.cos(cam.yaw), sy=Math.sin(cam.yaw), cp=Math.cos(cam.pitch||0), sp=Math.sin(cam.pitch||0);
  const x1=x*cy-z*sy, z1=x*sy+z*cy, y1=y*cp-z1*sp, z2=y*sp+z1*cp, s=cam.F/(cam.F+z2+cam.dist); return [cam.cx+x1*s, cam.cy+y1*s, s, z2]; }
const RND=(k)=>{ const x=Math.sin(k*127.1+311.7)*43758.5453; return x-Math.floor(x); };
function bgCandles(t,a){ const cam={yaw:Math.sin(t*.35)*.22,pitch:.32,dist:420-60*Math.min(t,4),F:900,cx:540,cy:1180};
  const items=[]; for(let i=0;i<11;i++) for(let j=0;j<8;j++){ const x=(i-5)*210, z=j*320-200, h=(120+330*RND(i*9+j))*eo(seg(t,.05*j+.02*i,.9+.05*j)), up=RND(i*3+j*7)>.35; items.push({x,z,h,up}); }
  items.sort((p,q)=>q.z-p.z);
  for(const it of items){ const b=P3(it.x,300,it.z,cam), tp=P3(it.x,300-it.h,it.z,cam), w=56*b[2]; if(b[2]<=0) continue;
    ctx.globalAlpha=a*clamp(1.15-it.z/2600,.15,1)*.75; ctx.fillStyle=it.up?C.accent:'#8E1F0B';
    ctx.fillRect(b[0]-1.5*b[2],tp[1]-40*b[2],3*b[2],(b[1]-tp[1])+80*b[2]); ctx.fillRect(b[0]-w/2,tp[1],w,b[1]-tp[1]); }
  ctx.globalAlpha=1; }
const TICKS=['WIN ▲','+1.274,00','WDO','IBOV ▲ 2,4%','+5.784,00','DI1F27','LUCRO','+690,00','WIN ▼','+4.073,00','PREGÃO','+2.224,00','B3','+5.236,00','GAIN','TRADER'];
function bgRing(t,a){ ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
  [[-470,1,.42],[460,-1,.36]].forEach(([y,dir,sp])=>{ const items=TICKS.map((s,k)=>{ const ang=k/TICKS.length*Math.PI*2+t*sp*dir; const cam={yaw:0,pitch:.18,dist:300,F:950,cx:540,cy:960}; const p=P3(Math.sin(ang)*640,y,Math.cos(ang)*640,cam); return {s,p,f:Math.cos(ang)}; }).sort((m,n)=>n.p[3]-m.p[3]);
    for(const it of items){ const sz=58*it.p[2]; ctx.font=`400 ${sz}px ${DISP}`; ctx.globalAlpha=a*(it.f<0?.55:.22)*eo(seg(t,0,.8)); ctx.fillStyle=it.s.startsWith('+')?C.accent:C.paper; ctx.fillText(it.s,it.p[0],it.p[1]); } });
  ctx.restore(); }
function bgChart(t,a){ const cam={yaw:-.35+Math.sin(t*.4)*.12,pitch:.42,dist:260,F:900,cx:540,cy:1150};
  ctx.save(); ctx.strokeStyle=C.accent; ctx.lineWidth=2;
  for(let i=-6;i<=6;i++){ const p0=P3(i*260,300,-100,cam), p1=P3(i*260,300,3200,cam); ctx.globalAlpha=a*.13; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); }
  for(let j=0;j<12;j++){ const z=((j*280+t*220)%3300)-100, p0=P3(-1600,300,z,cam), p1=P3(1600,300,z,cam); ctx.globalAlpha=a*.12; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); }
  const N=60, rev=eo(seg(t,.1,2.4)); const pts=[]; for(let k=0;k<=N*rev;k++){ const z=3000-k*52, x=Math.sin(k*.35)*260+Math.sin(k*.11)*180, y=120-k*7-RND(k)*90; pts.push(P3(x,y,z,cam)); }
  if(pts.length>1){ ctx.lineJoin='round'; [[22,.18],[8,.5],[3,1]].forEach(([lw,al])=>{ ctx.globalAlpha=a*al; ctx.lineWidth=lw; ctx.beginPath(); pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.stroke(); });
    const e=pts[pts.length-1]; ctx.globalAlpha=a; ctx.fillStyle='#FFD2B0'; ctx.beginPath(); ctx.arc(e[0],e[1],9,0,7); ctx.fill(); }
  ctx.restore(); }
function bgOrbit(t,a){ ctx.save(); ctx.lineWidth=3;
  [[520,.95,.5,0],[650,1.15,-.38,1.2],[780,1.32,.3,2.4]].forEach(([r,pitch,sp,off],ri)=>{ const cam={yaw:t*sp+off,pitch,dist:500,F:1000,cx:540,cy:760};
    ctx.strokeStyle=C.accent; ctx.globalAlpha=a*.28; ctx.beginPath(); for(let k=0;k<=90;k++){ const an=k/90*Math.PI*2, p=P3(Math.cos(an)*r,0,Math.sin(an)*r,cam); k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]); } ctx.stroke();
    for(let d=0;d<3;d++){ const an=t*(1.1+ri*.3)+d*2.1, p=P3(Math.cos(an)*r,0,Math.sin(an)*r,cam); ctx.globalAlpha=a*.9; ctx.fillStyle=d?C.accent:'#FFD2B0'; ctx.beginPath(); ctx.arc(p[0],p[1],10*p[2],0,7); ctx.fill(); } });
  ctx.restore(); }
function bgSkyline(t,a){ ctx.save();
  for(let row=0;row<3;row++){ const base=1500-row*60, sc=1-row*.22; ctx.globalAlpha=a*(.55-row*.15);
    for(let i=0;i<26;i++){ const w=34*sc, x=i*44+(row*17)%44-10, h=(150+380*RND(i*5+row*31))*sc*eo(seg(t,.03*i,.9+.03*i)); ctx.fillStyle=row?'#3A1606':(RND(i+row)>.3?C.accent:'#8E1F0B'); ctx.fillRect(x,base-h,w,h); } }
  ctx.globalCompositeOperation='lighter';
  [[-.5,.9],[.6,-1.1]].forEach(([ph,sp])=>{ const ang=Math.sin(t*sp+ph)*.55, x0=540+ph*500, y0=1560; ctx.save(); ctx.translate(x0,y0); ctx.rotate(ang);
    const g=ctx.createLinearGradient(0,0,0,-1500); g.addColorStop(0,`rgba(255,150,70,${.32*a})`); g.addColorStop(1,'rgba(255,150,70,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(14,0); ctx.lineTo(260,-1500); ctx.lineTo(-260,-1500); ctx.closePath(); ctx.fill(); ctx.restore(); });
  ctx.restore(); }
function bgPodium(t,a){ ctx.save(); ctx.translate(540,820); ctx.rotate(t*.12); ctx.globalCompositeOperation='lighter';
  for(let k=0;k<18;k++){ ctx.rotate(Math.PI/9); ctx.globalAlpha=a*.09; ctx.fillStyle=C.accent; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-90,-1400); ctx.lineTo(90,-1400); ctx.closePath(); ctx.fill(); }
  ctx.restore(); ctx.save();
  for(let k=0;k<50;k++){ const x=RND(k)*1080+Math.sin(t*1.3+k)*30, y=((RND(k*7)*2200+t*(160+RND(k*3)*140))%2200)-140, s=6+RND(k*5)*10; ctx.globalAlpha=a*.7; ctx.fillStyle=k%3?C.accent:'#FFD2B0'; ctx.save(); ctx.translate(x,y); ctx.rotate(t*3+k); ctx.fillRect(-s/2,-s/4,s,s/2); ctx.restore(); }
  ctx.restore(); }
const BGS={candles:bgCandles,ring:bgRing,chart:bgChart,orbit:bgOrbit,skyline:bgSkyline,podium:bgPodium};

/* ---------- fundo geral e áreas decorativas ---------- */
function background(t){
  ctx.fillStyle=C.ink; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.strokeStyle=C.accent;
  const floor=(hy,ey)=>{ for(let k=-10;k<=10;k++){ ctx.globalAlpha=.09; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(540,hy); ctx.lineTo(540+k*140,ey); ctx.stroke(); }
    for(let j=0;j<9;j++){ const z=((j+t*.9)%9)/9, y=hy+(ey-hy)*Math.pow(z,2.2); ctx.globalAlpha=.04+.18*z; ctx.lineWidth=1+2*z; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); } };
  floor(1500,1920); floor(245,0); ctx.restore();
}
function particles(t){ ctx.save(); ctx.fillStyle=C.accent; for(let k=0;k<36;k++){ const s=.4+RND(k)*.9, y=((RND(k*3)*1920-t*60*s)%1920+1920)%1920, x=RND(k*7)*1080+Math.sin(t*s+k)*18; ctx.globalAlpha=.12+.1*Math.sin(t*2+k); ctx.beginPath(); ctx.arc(x,y,2+k%3,0,7); ctx.fill(); } ctx.restore(); }
const TICK='▲ TRADER SCHOOL     ▲ MENTORIA WENDELL GUIMARÃES     ▲ RESULTADO DOS ALUNOS     ';
function ticker(t,y,dir){ ctx.save(); ctx.fillStyle='rgba(23,22,26,.9)'; ctx.fillRect(0,y-30,W,60); ctx.fillStyle=C.line; ctx.fillRect(0,y-30,W,2); ctx.fillRect(0,y+28,W,2);
  ctx.font=`700 30px ${BODY}`; ls(ctx,6); const w=ctx.measureText(TICK).width; let x=-(((t*90*dir)%w)+w)%w; ctx.fillStyle=C.muted; ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.globalAlpha=.75; for(;x<W;x+=w) ctx.fillText(TICK,x,y+1); ls(ctx,0); ctx.restore(); }
function header(cnt,bump){
  const th=THEMES[curDay]; ctx.fillStyle=C.paper; ctx.fillRect(FXP,262,FW,5);
  const left=MODE==='week'?('SEMANA '+(WK?WK.range:'')):(th.label+' · '+days[curDay].date);
  txt(ctx,left,FXP,298,fit(ctx,left,560,700,34,BODY,4),C.accent,'left',4);
  txt(ctx,MODE==='week'?'RESULTADO DA SEMANA':'RESULTADO DOS ALUNOS',FXP+FW,298,`700 34px ${BODY}`,C.paper,'right',4);
  rr(ctx,FXP,336,FW,134,30); ctx.fillStyle='rgba(23,22,26,.92)'; ctx.fill(); ctx.strokeStyle=C.line; ctx.lineWidth=2; ctx.stroke();
  txt(ctx,MODE==='week'?'TOTAL DA SEMANA':'TURMA HOJE',FXP+36,404,`700 34px ${BODY}`,C.muted,'left',4);
  ctx.save(); ctx.translate(FXP+FW-36,408); ctx.scale(bump,bump); txt(ctx,brl(cnt),0,0,fit(ctx,brl(cnt),560,400,88,DISP),C.accent,'right'); ctx.restore();
}
function dots(filled){
  const list=MODE==='week'?(WK?WK.rank:[]):S, n=list.length; if(!n) return; const g=14; let d=64; if(n*d+(n-1)*g>900) d=Math.max(26,(900-(n-1)*g)/n);
  let x=540-(n*d+(n-1)*g)/2+d/2; const y=1560;
  for(let k=0;k<n;k++,x+=d+g){ const r=d/2-3;
    if(k<filled){ circleImg(ctx,list[k]._a,x,y,r); ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.strokeStyle=C.accent; ctx.lineWidth=4; ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.setLineDash([8,7]); ctx.strokeStyle=C.line; ctx.lineWidth=4; ctx.stroke(); ctx.setLineDash([]); } }
}

/* ---------- capa 3D do dia ---------- */
const T_COVER=4.2;
function calendarIcon(x,y,s){ ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.strokeStyle=C.paper; ctx.lineWidth=7; ctx.lineJoin='round';
  rr(ctx,-80,-62,150,126,14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-80,-30); ctx.lineTo(70,-30); ctx.stroke();
  for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(-50+k*34,-76); ctx.lineTo(-50+k*34,-50); ctx.stroke(); }
  ctx.fillStyle=C.paper; for(let r=0;r<2;r++) for(let k=0;k<4;k++) if(!(r===1&&k===3)) ctx.fillRect(-64+k*32,-14+r*34,22,22);
  ctx.beginPath(); ctx.arc(62,42,34,0,7); ctx.fill(); txt(ctx,'$',62,44,`700 46px ${BODY}`,C.ink,'center'); ctx.restore(); }
function chevrons(x,y,t){ for(let k=0;k<5;k++){ const ph=Math.sin(t*5-k*.9), s=1+.08*Math.max(0,ph); ctx.save(); ctx.translate(x+(k-2)*84,y); ctx.scale(s,s);
  ctx.fillStyle=mix('#FF7A1F','#4A2410',k/4); ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-50,-46); ctx.lineTo(4,-46); ctx.lineTo(50,0); ctx.lineTo(4,46); ctx.lineTo(-50,46); ctx.lineTo(-4,0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
function drawCover(t){
  const th=THEMES[curDay], week=MODE==='week';
  const out=seg(t,T_COVER-.6,T_COVER), zs=1+1.6*eio(out);
  ctx.save(); ctx.translate(540,880); ctx.scale(zs,zs); ctx.translate(-540,-880); ctx.globalAlpha=1-out;
  // logo
  if(LOGOG){ const a=eo(seg(t,.0,.7)), s=(1.6-.6*a)*(1+.015*Math.sin(t*2)); const lw=460*s, lh=lw*LOGOG.height/LOGOG.width; ctx.save(); ctx.globalAlpha*=a; ctx.drawImage(LOGOG,540-lw/2,470-lh/2,lw,lh); ctx.restore(); }
  // RESULTADO em 3D, entrada própria de cada dia
  const k=eo(seg(t,.35,1.15)), yaw=Math.sin(t*.9)*.35; const ex=.55+yaw, sizeR=186;
  ctx.save(); ctx.globalAlpha*=seg(t,.35,.6);
  if(th.enter==='letters'){ const word='RESULTADO'; ctx.font=`400 ${sizeR}px ${DISP}`; const wTot=ctx.measureText(word).width; let x=540-wTot/2;
    for(let i=0;i<word.length;i++){ const ch=word[i], cw=ctx.measureText(ch).width, kk=back(seg(t,.35+i*.06,.85+i*.06)); ctx.save(); ctx.globalAlpha*=seg(t,.35+i*.06,.5+i*.06); text3D(ctx,ch,x+cw/2,770+(1-kk)*160,sizeR,{ex,depth:18}); ctx.restore(); x+=cw; } }
  else if(th.enter==='spin'){ text3D(ctx,'RESULTADO',540,770,sizeR,{ex:ex+ (1-k)*2,depth:18,sx:Math.max(.05,Math.cos((1-k)*Math.PI/2))}); }
  else if(th.enter==='slide'){ const xo=(1-k)*900; text3D(ctx,'RESULTADO',540+xo,770,sizeR,{ex:ex+(1-k)*3,depth:18,skew:-(1-k)*.4}); if(k<1){ ctx.save(); ctx.globalAlpha*=(1-k)*.6; ctx.fillStyle=C.accent; for(let j=0;j<6;j++) ctx.fillRect(540+xo+260+j*40,700+j*26,300*(1-k),5); ctx.restore(); } }
  else if(th.enter==='drop'){ const kb=back(seg(t,.35,1.1)); text3D(ctx,'RESULTADO',540,770-(1-kb)*700,sizeR,{ex,depth:18}); }
  else { const s=1+1.6*(1-k); ctx.save(); ctx.translate(540,770); ctx.scale(s,s); text3D(ctx,'RESULTADO',0,0,sizeR,{ex,depth:18}); ctx.restore(); }
  ctx.restore();
  // brilho passando
  const f=seg(t,1.3,2.0); if(f>0&&f<1){ ctx.save(); ctx.globalCompositeOperation='lighter'; const x=80+f*920; const g=ctx.createLinearGradient(x-120,0,x+120,0); g.addColorStop(0,'rgba(255,150,80,0)'); g.addColorStop(.5,'rgba(255,200,150,.5)'); g.addColorStop(1,'rgba(255,150,80,0)'); ctx.fillStyle=g; ctx.fillRect(x-120,670,240,200); ctx.restore(); }
  // DE XXX-FEIRA / DA SEMANA em laranja itálico 3D
  const k2=eo(seg(t,.75,1.35)); ctx.save(); ctx.globalAlpha*=k2;
  const sub=th.title; const fsz=parseInt(fit(ctx,sub,900,400,128,DISP).split(' ')[1]);
  text3D(ctx,sub,540+(1-k2)*-120,915,fsz,{face:['#FFC08A','#FF7A1F','#E04E00'],side:['#5A1C00','#140600'],depth:12,ex:.4+yaw*.6,skew:-.2});
  ctx.restore();
  // pincelada
  const k3=eo(seg(t,1.0,1.6)); if(k3>0){ ctx.save(); ctx.globalAlpha*=k3; const x0=170, x1=170+760*k3; const g=ctx.createLinearGradient(x0,0,x1,0); g.addColorStop(0,'rgba(255,106,19,0)'); g.addColorStop(.2,'#FF6A13'); g.addColorStop(1,'#FFB27A'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x0,1000); ctx.quadraticCurveTo((x0+x1)/2,968,x1,982); ctx.quadraticCurveTo((x0+x1)/2,982,x0,1006); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // data
  const k4=eo(seg(t,1.2,1.7)); ctx.save(); ctx.globalAlpha*=k4; const dl=week?(WK?WK.range:''):days[curDay].date; ctx.font=`700 40px ${BODY}`; ls(ctx,5); const dw=ctx.measureText(dl).width+70; ls(ctx,0);
  ctx.translate(540,1075); ctx.scale(.7+.3*k4,.7+.3*k4); rr(ctx,-dw/2,-34,dw,68,34); ctx.fillStyle='rgba(23,22,26,.85)'; ctx.fill(); ctx.strokeStyle=C.accent; ctx.lineWidth=3; ctx.stroke(); txt(ctx,dl,0,2,`700 40px ${BODY}`,C.paper,'center',5); ctx.restore();
  // operações
  const k5=eo(seg(t,1.45,2.0)); ctx.save(); ctx.globalAlpha*=k5; ctx.translate(-(1-k5)*60,0);
  calendarIcon(330,1205,.78); txt(ctx,week?'TODOS OS ALUNOS':'OPERAÇÕES DOS',650,1170,`700 54px ${BODY}`,C.paper,'center',2); txt(ctx,week?'DE SEGUNDA A SEXTA':'NOSSOS ALUNOS',650,1232,`700 54px ${BODY}`,C.paper,'center',2);
  ctx.fillStyle=C.accent; ctx.fillRect(480,1278,340*k5,5); ctx.restore();
  ctx.save(); ctx.globalAlpha*=eo(seg(t,1.7,2.2)); chevrons(540,1345,t); ctx.restore();
  ctx.save(); ctx.globalAlpha*=eo(seg(t,1.9,2.4)); txt(ctx,HANDLE,540,1428,`600 40px ${BODY}`,C.accent,'center',1); ctx.restore();
  ctx.restore();
}

/* ---------- faces (cartões do palco) ---------- */
function faceStudent(c,i,u){
  const s=S[i]; c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  const zp=eo(seg(u,.9,1.9))-eo(seg(u,3.5,4.1));
  c.save(); rr(c,0,0,FW,760,34); c.clip();
  if(s._p) coverFocus(c,s._p,0,0,FW,760,zp,s.fx,s.fy); else { stripes(c,0,0,FW,760); txt(c,'PRINT DO ALUNO AQUI',FW/2,380,`700 44px ${BODY}`,C.muted,'center',6); }
  if(zp>.02){ c.save(); c.globalAlpha=zp; c.strokeStyle=C.accent; c.lineWidth=7; c.lineCap='round';
    const bw=540*(1.25-.25*zp), bh=210*(1.25-.25*zp), x0=FW/2-bw/2, y0=380-bh/2, L=54;
    [[x0,y0,1,1],[x0+bw,y0,-1,1],[x0,y0+bh,1,-1],[x0+bw,y0+bh,-1,-1]].forEach(([x,y,sx,sy])=>{c.beginPath();c.moveTo(x+sx*L,y);c.lineTo(x,y);c.lineTo(x,y+sy*L);c.stroke();}); c.restore(); }
  const sh=seg(u,2.1,2.8); if(sh>0&&sh<1){ c.save(); c.globalCompositeOperation='lighter'; c.translate(-500+sh*1900,380); c.rotate(-.35); const g=c.createLinearGradient(-120,0,120,0); g.addColorStop(0,'rgba(255,140,60,0)'); g.addColorStop(.5,'rgba(255,170,110,.38)'); g.addColorStop(1,'rgba(255,140,60,0)'); c.fillStyle=g; c.fillRect(-120,-700,240,1400); c.restore(); }
  if(s._p){ const tg=i===0?'★ DESTAQUE DO DIA':'PRINT REAL'; c.font=`700 30px ${BODY}`; ls(c,4); const tw=c.measureText(tg).width; ls(c,0); rr(c,24,24,tw+40,54,13); c.fillStyle=i===0?C.accent:'rgba(10,10,11,.88)'; c.fill(); txt(c,tg,44,52,`700 30px ${BODY}`,i===0?C.ink:C.paper,'left',4); }
  c.restore();
  rr(c,4,4,FW-8,752,32); c.strokeStyle=C.accent; c.lineWidth=8; c.stroke();
  rr(c,0,790,FW,160,28); c.fillStyle=C.panel; c.fill(); c.strokeStyle=C.line; c.lineWidth=2; c.stroke();
  circleImg(c,s._a,90,870,58); c.beginPath(); c.arc(90,870,58,0,7); c.strokeStyle=C.accent; c.lineWidth=6; c.stroke();
  const pop=1+.14*Math.sin(Math.PI*seg(u,1.9,2.25)), vt='+'+brl(s.value);
  const pw=pill(c,vt,FW-56,870,58,pop);
  const maxN=FW-56-pw-22-170, hasH=s.handle&&s.handle.length>1, nf=fit(c,s.name.toUpperCase(),maxN,400,56,DISP,0,36);
  txt(c,ellip(c,s.name.toUpperCase(),maxN,nf),170,hasH?846:872,nf,C.paper,'left');
  if(hasH){ const hf=`600 32px ${BODY}`; txt(c,ellip(c,s.handle,maxN,hf),172,902,hf,C.accent,'left'); }
}
function faceHL(c,h){
  const s=S[0]; c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'★  DESTAQUE DO DIA  ★',FW/2,40,`700 44px ${BODY}`,C.accent,'center',10);
  const cx=FW/2, cy=300, r=185*(.7+.3*eo(seg(h,0,.8)));
  c.save(); c.translate(cx,cy); c.rotate(h*.4); c.strokeStyle=C.accent; c.lineCap='round';
  for(let k=0;k<28;k++){ c.globalAlpha=(k%2?.2:.5)*seg(h,.2,.8); c.lineWidth=k%2?4:8; const a=k*Math.PI/14, r1=r+30, r2=r+(k%2?70:115); c.beginPath(); c.moveTo(Math.cos(a)*r1,Math.sin(a)*r1); c.lineTo(Math.cos(a)*r2,Math.sin(a)*r2); c.stroke(); }
  c.restore();
  const flip=Math.cos((1-eo(seg(h,0,1.1)))*Math.PI*2);
  c.save(); c.translate(cx,cy); c.scale(Math.max(.02,Math.abs(flip)),1); circleImg(c,s._a,0,0,r); c.beginPath(); c.arc(0,0,r,0,7); c.strokeStyle=C.accent; c.lineWidth=12; c.stroke(); c.restore();
  const k2=eo(seg(h,.6,1.2)), off=(1-k2)*50; c.save(); c.globalAlpha=k2;
  text3D(c,'PARABÉNS,',FW/2,585+off,96,{depth:10});
  const nm=s.name.toUpperCase()+'!'; const fs=parseInt(fit(c,nm,840,400,128,DISP).split(' ')[1]); text3D(c,nm,FW/2,700+off,fs,{face:['#FFC08A','#FF7A1F','#E04E00'],side:['#5A1C00','#140600'],depth:12});
  pill(c,'+'+brl(s.value),FW/2,832+off,72,1+.06*Math.sin(Math.PI*seg(h,1.3,1.7)),'center');
  txt(c,'Maior resultado da turma hoje',FW/2,932+off,`600 38px ${BODY}`,C.muted,'center',2);
  c.restore();
}
function brand(c,y){ if(LOGOG){ const lw=300, lh=lw*LOGOG.height/LOGOG.width; c.drawImage(LOGOG,FW/2-lw/2,y,lw,lh); return lh; } return 0; }
function mosaic(c,list,o,y0,hmax,getImg){ const m=Math.min(list.length,12), cols=m<=4?m:(m<=6?3:4), rows=Math.ceil(m/cols), gap=14;
  const cell=Math.min((FW-(cols-1)*gap)/cols,(hmax-(rows-1)*gap)/rows), gridH=rows*cell+(rows-1)*gap; const yy0=y0+(hmax-gridH)/2;
  for(let k=0;k<m;k++){ const r=Math.floor(k/cols), inRow=Math.min(cols,m-r*cols), cc=k%cols, rowW=inRow*cell+(inRow-1)*gap;
    const x=(FW-rowW)/2+cc*(cell+gap), y=yy0+r*(cell+gap), s=list[k], a=eo(seg(o,.6+k*.06,1.1+k*.06)); if(a<=0) continue;
    c.save(); c.globalAlpha=a; c.translate(x+cell/2,y+cell/2); c.scale(.4+.6*a,.4+.6*a); c.translate(-cell/2,-cell/2);
    c.save(); rr(c,0,0,cell,cell,18); c.clip(); const im=getImg(s); if(im&&s.fx!=null) coverFocus(c,im,0,0,cell,cell,.55,s.fx,s.fy); else if(im) cover(c,im,0,0,cell,cell); else stripes(c,0,0,cell,cell); c.restore();
    rr(c,0,0,cell,cell,18); c.strokeStyle=k===0?C.accent:C.line; c.lineWidth=k===0?6:3; c.stroke(); c.restore(); } }
function faceOut(c,o){
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  mosaic(c,S,o,10,440,s=>s._p);
  const total=S.reduce((a,s)=>a+s.value,0), k3=eo(seg(o,1.0,1.6));
  c.save(); c.globalAlpha=k3;
  txt(c,'TOTAL DA TURMA HOJE',FW/2,500,`700 42px ${BODY}`,C.muted,'center',6);
  const p=1+.05*Math.abs(Math.sin(seg(o,1.6,3.6)*2*Math.PI)), tv=brl(total*eo(seg(o,1.0,2.0)));
  c.save(); c.translate(FW/2,605); c.scale(p,p); text3D(c,tv,0,0,parseInt(fit(c,brl(total),860,400,140,DISP).split(' ')[1]),{face:['#FFC08A','#FF7A1F','#E04E00'],side:['#5A1C00','#140600'],depth:12}); c.restore();
  c.restore();
  c.save(); c.globalAlpha=eo(seg(o,1.6,2.2)); const lh=brand(c,690); txt(c,HANDLE,FW/2,700+lh+10,`600 36px ${BODY}`,C.accent,'center',1); c.restore();
}
/* sábado */
function box3D(c,x,y,w,h,dx,dy,front,top,side){ c.fillStyle=side; c.beginPath(); c.moveTo(x+w,y); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w+dx,y+h-dy); c.lineTo(x+w,y+h); c.closePath(); c.fill();
  c.fillStyle=top; c.beginPath(); c.moveTo(x,y); c.lineTo(x+dx,y-dy); c.lineTo(x+w+dx,y-dy); c.lineTo(x+w,y); c.closePath(); c.fill();
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,front[0]); g.addColorStop(1,front[1]); c.fillStyle=g; c.fillRect(x,y,w,h); }
function faceBars(c,o){
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'RESULTADO POR DIA',FW/2,40,`700 44px ${BODY}`,C.accent,'center',10);
  const max=Math.max(1,...WK.dayTotals), slot=FW/5, bw=112, base=740;
  WK.dayTotals.forEach((v,k)=>{ const a=eo(seg(o,.5+k*.18,1.5+k*.18)), h=Math.max(8,520*v/max)*a, x=k*slot+slot/2-bw/2-10;
    box3D(c,x,base-h,bw,h,26,18,v?['#FF8A3D','#7A2400']:['#3A3530','#1E1C21'],v?'#FFB27A':'#4A4540',v?'#8E2F05':'#2A2724');
    c.save(); c.globalAlpha=a; txt(c,v?brl(v):'—',x+bw/2+10,base-h-50,fit(c,v?brl(v):'—',slot-8,700,32,BODY),C.paper,'center'); c.restore();
    txt(c,THEMES[WEEK[k]].tab,x+bw/2+10,base+42,`400 44px ${DISP}`,v?C.paper:C.muted,'center'); txt(c,WK.dates[k]||'',x+bw/2+10,base+86,`600 28px ${BODY}`,C.muted,'center'); });
  c.save(); c.globalAlpha=eo(seg(o,1.8,2.4)); txt(c,WK.ops+' OPERAÇÕES NO VERDE · '+WK.rank.length+' ALUNOS',FW/2,920,`700 36px ${BODY}`,C.accent,'center',4); c.restore();
}
function facePodium(c,o){
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'PÓDIO DA SEMANA',FW/2,40,`700 44px ${BODY}`,C.accent,'center',10);
  const spots=[[0,330,260,300],[1,40,260,210],[2,620,260,150]], base=930;
  spots.forEach(([idx,x,w,hh],j)=>{ const s=WK.rank[idx]; if(!s) return; const a=eo(seg(o,.4+j*.25,1.2+j*.25)), h=hh*a;
    box3D(c,x,base-h,w,h,28,20,idx===0?['#FF8A3D','#7A2400']:['#3A3530','#17161A'],idx===0?'#FFB27A':'#4A4540',idx===0?'#8E2F05':'#252226');
    c.save(); c.globalAlpha=a; txt(c,String(idx+1),x+w/2,base-h/2+6,`400 ${idx===0?140:110}px ${DISP}`,idx===0?'#3A1200':C.muted,'center');
    const r=idx===0?92:74, cy=base-h-r-150; circleImg(c,s._a,x+w/2,cy,r); c.beginPath(); c.arc(x+w/2,cy,r,0,7); c.strokeStyle=idx===0?C.accent:C.paper; c.lineWidth=idx===0?9:5; c.stroke();
    txt(c,ellip(c,s.name.toUpperCase(),w+20,`400 46px ${DISP}`),x+w/2,cy+r+42,`400 46px ${DISP}`,C.paper,'center');
    txt(c,'+'+brl(s.total),x+w/2,cy+r+90,fit(c,'+'+brl(s.total),w+30,400,40,DISP),C.accent,'center'); c.restore(); });
}
function faceRank(c,o,page){
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  txt(c,'RANKING DA SEMANA',FW/2,40,`700 44px ${BODY}`,C.accent,'center',10);
  const start=3+page*6, rows=WK.rank.slice(start,start+6);
  rows.forEach((s,j)=>{ const a=eo(seg(o,.3+j*.12,.9+j*.12)), y=110+j*138, xo=(1-a)*500;
    c.save(); c.globalAlpha=a; c.translate(xo,0);
    rr(c,0,y,FW,120,24); c.fillStyle=C.panel; c.fill(); c.strokeStyle=C.line; c.lineWidth=2; c.stroke();
    txt(c,(start+j+1)+'º',30,y+62,`400 56px ${DISP}`,C.accent,'left');
    circleImg(c,s._a,160,y+60,44); c.beginPath(); c.arc(160,y+60,44,0,7); c.strokeStyle=C.accent; c.lineWidth=4; c.stroke();
    const pw=pill(c,'+'+brl(s.total),FW-24,y+60,44);
    txt(c,ellip(c,s.name.toUpperCase(),FW-24-pw-24-222,`400 46px ${DISP}`),222,y+44,`400 46px ${DISP}`,C.paper,'left');
    s.days.forEach((on,k)=>{ rr(c,222+k*48,y+78,40,26,8); c.fillStyle=on?C.accent:C.line; c.fill(); txt(c,THEMES[WEEK[k]].tab[0],242+k*48,y+92,`700 18px ${BODY}`,on?C.ink:C.muted,'center'); });
    c.restore(); });
}
function faceWeekOut(c,o){
  c.setTransform(Q,0,0,Q,0,0); c.clearRect(0,0,FW,FH);
  c.save(); c.globalAlpha=eo(seg(o,.5,1.1)); brand(c,0); c.restore();
  const k=eo(seg(o,.8,1.4)); c.save(); c.globalAlpha=k;
  txt(c,'TOTAL DA SEMANA',FW/2,330,`700 46px ${BODY}`,C.muted,'center',8);
  const p=1+.05*Math.abs(Math.sin(seg(o,1.6,3.6)*2*Math.PI)), tv=brl(WK.total*eo(seg(o,.8,2.0)));
  c.save(); c.translate(FW/2,460); c.scale(p,p); text3D(c,tv,0,0,parseInt(fit(c,brl(WK.total),880,400,170,DISP).split(' ')[1]),{face:['#FFC08A','#FF7A1F','#E04E00'],side:['#5A1C00','#140600'],depth:14}); c.restore();
  txt(c,WK.rank.length+' ALUNOS · '+WK.ops+' OPERAÇÕES NO VERDE',FW/2,600,`700 38px ${BODY}`,C.paper,'center',4);
  txt(c,'PARABÉNS, TURMA!',FW/2,700,`400 72px ${DISP}`,C.accent,'center');
  txt(c,HANDLE,FW/2,800,`600 38px ${BODY}`,C.accent,'center',1);
  c.restore();
}

/* ---------- transições (uma por dia) ---------- */
let shade=0;
function stripsY(img,phi,cx,cy,r,F,Z0,NS,extraZ=0){ const cs=Math.cos(phi), sn=Math.sin(phi), sw=FW/NS; shade=(1-Math.abs(cs))*.7; ctx.fillStyle=`rgba(10,10,11,${shade.toFixed(3)})`;
  for(let k=0;k<NS;k++){ const x0=-FW/2+k*sw, x1=x0+sw;
    const z0=-x0*sn-r*cs, z1=-x1*sn-r*cs, s0=F/(Z0+z0+extraZ), s1=F/(Z0+z1+extraZ);
    const X0=cx+(x0*cs-r*sn)*s0, X1=cx+(x1*cs-r*sn)*s1; if(X1-X0<.4) continue;
    const sa=(s0+s1)/2, dy=cy-FH/2*sa, dh=FH*sa; ctx.drawImage(img,k*sw*Q,0,sw*Q,FH*Q,X0,dy,X1-X0+.8,dh); if(shade>.01) ctx.fillRect(X0,dy,X1-X0+.8,dh); } }
function stripsX(img,th,cx,cy,F,NS,scale=1){ const cs=Math.cos(th), sn=Math.sin(th), sh=FH/NS; const sd=(1-cs)*.75;
  for(let k=0;k<NS;k++){ const y0=-FH/2+k*sh, y1=y0+sh, s0=F/(F-y0*sn), s1=F/(F-y1*sn); const Y0=cy+y0*cs*s0*scale, Y1=cy+y1*cs*s1*scale; if(Y1-Y0<.4) continue;
    const sa=(s0+s1)/2*scale, w=FW*sa; ctx.drawImage(img,0,k*sh*Q,FW*Q,sh*Q,cx-w/2,Y0,w,Y1-Y0+.8); if(sd>.01){ ctx.fillStyle=`rgba(10,10,11,${sd.toFixed(3)})`; ctx.fillRect(cx-w/2,Y0,w,Y1-Y0+.8); } } }
function edgeGlow(x,a){ if(a<=.02) return; ctx.save(); ctx.globalCompositeOperation='lighter'; const g=ctx.createLinearGradient(x-40,0,x+40,0); g.addColorStop(0,'rgba(255,106,19,0)'); g.addColorStop(.5,`rgba(255,150,80,${.8*a})`); g.addColorStop(1,'rgba(255,106,19,0)'); ctx.fillStyle=g; ctx.fillRect(x-40,FCY-FH*.6,80,FH*1.2); ctx.restore(); }
function transition(style,A,B,p){
  const NS=Q<1?36:64, F=2.4*FW;
  if(style==='cube'){ const th=eio(p)*Math.PI/2, r=FW/2, Z0=F+r; stripsY(A,th,FCX,FCY,r,F,Z0,NS); stripsY(B,th-Math.PI/2,FCX,FCY,r,F,Z0,NS);
    const ex=FCX+(r*Math.cos(th)-r*Math.sin(th))*F/(Z0+(-r*Math.sin(th)-r*Math.cos(th))); edgeGlow(ex,Math.sin(th*2)); }
  else if(style==='flip'){ const e=eio(p), dz=Math.sin(p*Math.PI)*500; if(e<.5) stripsY(A,e*Math.PI,FCX,FCY,0,F,F,NS,dz); else stripsY(B,(e-1)*Math.PI,FCX,FCY,0,F,F,NS,dz); }
  else if(style==='tunnel'){ const e=eio(p); ctx.save(); ctx.globalAlpha=1-e; const sa=1+1.5*e; ctx.translate(FCX,FCY); ctx.scale(sa,sa); ctx.drawImage(A,-FW/2,-FH/2,FW,FH); ctx.restore();
    ctx.save(); ctx.globalAlpha=e; const sb=.4+.6*e; ctx.translate(FCX,FCY); ctx.scale(sb,sb); ctx.drawImage(B,-FW/2,-FH/2,FW,FH); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=C.accent; const al=Math.sin(p*Math.PI); for(let k=0;k<28;k++){ const an=k/28*Math.PI*2+RND(k), r0=120+RND(k*3)*200+e*400, r1=r0+180+e*500; ctx.globalAlpha=al*.45; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(FCX+Math.cos(an)*r0,FCY+Math.sin(an)*r0); ctx.lineTo(FCX+Math.cos(an)*r1,FCY+Math.sin(an)*r1); ctx.stroke(); } ctx.restore(); }
  else if(style==='stack'){ const e=eio(p); ctx.save(); ctx.globalAlpha=1-e*.9; stripsX(A,e*1.0,FCX,FCY+e*260,F,NS,1-.2*e); ctx.restore();
    const kb=back(clamp(p*1.15,0,1)); stripsX(B,-(1-kb)*.9,FCX,FCY-(1-kb)*1100,F,NS,1); }
  else if(style==='blinds'){ const N=10, sw=FW/N, x0=FCX-FW/2, y0=FCY-FH/2;
    for(let j=0;j<N;j++){ const q=eio(clamp((p-j*.045)/(1-9*.045),0,1)), ang=q*Math.PI, cs=Math.cos(ang), img=ang<Math.PI/2?A:B, w=Math.abs(cs)*sw, bulge=1+.06*Math.sin(ang), cx=x0+j*sw+sw/2;
      if(w<.5) continue; ctx.drawImage(img,j*sw*Q,0,sw*Q,FH*Q,cx-w/2,FCY-FH/2*bulge,w,FH*bulge);
      const sd=Math.sin(ang)*.6; if(sd>.01){ ctx.fillStyle=`rgba(10,10,11,${sd.toFixed(3)})`; ctx.fillRect(cx-w/2,FCY-FH/2*bulge,w,FH*bulge); }
      if(ang>.1&&ang<3) { ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=Math.sin(ang)*.5; ctx.fillStyle=C.accent; ctx.fillRect(cx-w/2-1,FCY-FH/2*bulge,2,FH*bulge); ctx.restore(); } } }
}

/* ---------- linha do tempo ---------- */
const T_HL=3.4, PER=4.6, T_OUT=4.6;
function buildScenes(){
  if(MODE==='week'){ if(!WK||!WK.rank.length) return [];
    const sc=[{kind:'cover',dur:T_COVER},{kind:'face',dur:4.6,render:faceBars,cnt:u=>[WK.total*eo(seg(u,.8,2.6)),1],filled:u=>Math.round(WK.rank.length*seg(u,.8,2.6))}];
    sc.push({kind:'face',dur:4.6,render:facePodium,cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    for(let p=0;3+p*6<WK.rank.length;p++) sc.push({kind:'face',dur:3.8,render:(c,u)=>faceRank(c,u,p),cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    sc.push({kind:'face',dur:4.6,render:faceWeekOut,cnt:()=>[WK.total,1],filled:()=>WK.rank.length});
    return sc; }
  if(!S.length) return [];
  const sc=[{kind:'cover',dur:T_COVER},{kind:'face',dur:T_HL,render:faceHL,cnt:()=>[0,1],filled:()=>0}];
  let prev=0; S.forEach((s,i)=>{ const p0=prev; sc.push({kind:'face',dur:PER,render:(c,u)=>faceStudent(c,i,u),cnt:u=>[p0+s.value*eo(seg(u,1.0,2.0)),1+.08*Math.sin(Math.PI*seg(u,1.0,1.35))],filled:u=>i+(u>=1?1:0)}); prev+=s.value; });
  const total=prev; sc.push({kind:'face',dur:T_OUT,render:faceOut,cnt:()=>[total,1],filled:()=>S.length});
  return sc;
}
const dur=()=>SCENES.reduce((a,s)=>a+s.dur,0);
function sceneStart(k){ let t=0; for(let i=0;i<k;i++) t+=SCENES[i].dur; return t; }
function draw(t){
  ctx.setTransform(Q,0,0,Q,0,0);
  background(t); const th=THEMES[curDay];
  if(!SCENES.length){ particles(t); ticker(t,150,1); ticker(t,1660,-1); header(0,1); txt(ctx,MODE==='week'?'Sem resultados na semana':'Marque quem operou hoje',540,980,`400 64px ${DISP}`,C.muted,'center'); return guides(); }
  let k=0, st=0; while(k<SCENES.length-1&&t>=st+SCENES[k].dur){ st+=SCENES[k].dur; k++; } const sc=SCENES[k], local=Math.min(t-st,sc.dur);
  BGS[th.bg](t,sc.kind==='cover'?1:.28); ctx.drawImage(VIG,0,0,W,H); particles(t); ticker(t,150,1); ticker(t,1660,-1);
  if(sc.kind==='cover'){ drawCover(local); }
  else { const [cnt,bump]=sc.cnt(local); header(cnt,bump);
    const prev=SCENES[k-1];
    if(prev&&prev.kind==='face'&&local<TR){ prev.render(fA,prev.dur); sc.render(fB,local); transition(th.trans,faceA,faceB,local/TR); }
    else { sc.render(fA,local);
      if(prev&&prev.kind==='cover'&&local<.7){ const a=eo(local/.7), s=.35+.65*a; ctx.save(); ctx.globalAlpha=a; ctx.translate(FCX,FCY); ctx.scale(s,s); ctx.drawImage(faceA,-FW/2,-FH/2,FW,FH); ctx.restore(); }
      else ctx.drawImage(faceA,FXP,FYP,FW,FH); }
    dots(sc.filled(local)); }
  txt(ctx,'Resultados individuais. Não representam promessa ou garantia de ganhos.',540,1482,`500 25px ${BODY}`,C.muted,'center');
  guides();
}
function guides(){ if(exporting||!$('guides').checked) return; ctx.save(); ctx.fillStyle='rgba(255,40,40,.28)'; ctx.fillRect(0,0,W,SAFE_T-30); ctx.fillRect(0,SAFE_B+20,W,H-SAFE_B-20); ctx.fillRect(W-130,1050,130,SAFE_B-1030);
  txt(ctx,'ÁREA COBERTA PELO REELS',540,110,`700 34px ${BODY}`,'#fff','center',4); txt(ctx,'ÁREA COBERTA PELO REELS',540,1760,`700 34px ${BODY}`,'#fff','center',4); ctx.restore(); }

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
  await Promise.all(['400 100px Anton','700 40px "Barlow Condensed"','600 40px "Barlow Condensed"','500 28px "Barlow Condensed"'].map(f=>document.fonts.load(f).catch(()=>{})));
  await loadLogo();
  MODE=curDay==='sab'?'week':'day';
  if(MODE==='week'){ WK=computeWeek(); await Promise.all(WK.rank.map(async s=>{ s._a=await getImg(avatarSrc(s),420); })); S=[]; }
  else { const list=roster.map(r=>{ const e=entry(curDay,r.id); return {...r,value:e.value,on:e.on,fx:e.fx,fy:e.fy,print:printSrc(curDay,r.id,e),avatar:avatarSrc(r)}; }).filter(s=>s.on);
    if(list.length){ let top=0; list.forEach((s,k)=>{ if(s.value>list[top].value) top=k; }); S=[list[top],...list.filter((_,k)=>k!==top)]; } else S=[];
    await Promise.all(S.map(async s=>{ s._p=await getImg(s.print,1500); s._a=await getImg(s.avatar,420); })); }
  SCENES=buildScenes();
}

