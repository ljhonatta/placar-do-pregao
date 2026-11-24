/* Placar do Pregão — leitura automática do valor no print (OCR roda no próprio aparelho, sem enviar a imagem para fora).
   Ao anexar o print: procura a linha "Res. do Dia" (ou "Res. Aberto", se o dia estiver zerado), lê o valor e marca o zoom nele.
   Ao tocar no print: lê o número que está no ponto tocado. */
'use strict';
let OCRW=null, OCRBUSY=Promise.resolve();
const OCRBASE=()=>new URL('vendor/ocr/',location.href).href;
function loadScript(src){ return new Promise((ok,err)=>{ if(window.Tesseract) return ok(); const s=document.createElement('script'); s.src=src; s.onload=()=>ok(); s.onerror=err; document.head.appendChild(s); }); }
async function ocrWorker(){ if(OCRW) return OCRW; await loadScript(OCRBASE()+'tesseract.min.js');
  OCRW=await Tesseract.createWorker('eng',1,{workerPath:OCRBASE()+'worker.min.js',corePath:OCRBASE(),langPath:OCRBASE()+'lang',gzip:true,workerBlobURL:false,logger:m=>{ try{ if(OCRLOG&&m&&m.status&&/load|initializ/i.test(m.status)) OCRLOG('Preparando o leitor de print… '+Math.round((m.progress||0)*100)+'%'); }catch(e){} }}); return OCRW; }
let OCRLOG=null;
/* prepara o recorte: tons de cinza, texto escuro sobre fundo claro, contraste esticado, ampliado */
function ocrCanvas(src,sx,sy,sw,sh,scale){ const c=document.createElement('canvas'); c.width=Math.max(8,Math.round(sw*scale)); c.height=Math.max(8,Math.round(sh*scale)); const g=c.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(src,sx,sy,sw,sh,0,0,c.width,c.height);
  const id=g.getImageData(0,0,c.width,c.height), d=id.data; let sum=0; const L=new Float32Array(d.length/4); for(let i=0,j=0;i<d.length;i+=4,j++){ const l=Math.max(d[i],d[i+1],d[i+2])*.6+(.299*d[i]+.587*d[i+1]+.114*d[i+2])*.4; L[j]=l; sum+=l; }
  const dark=sum/L.length<128; let lo=255,hi=0; for(let j=0;j<L.length;j++){ let l=dark?255-L[j]:L[j]; L[j]=l; if(l<lo) lo=l; if(l>hi) hi=l; } const k=255/Math.max(1,hi-lo);
  for(let i=0,j=0;i<d.length;i+=4,j++){ const v=Math.max(0,Math.min(255,(L[j]-lo)*k)); d[i]=d[i+1]=d[i+2]=v; d[i+3]=255; } g.putImageData(id,0,0); return c; }
const MONEY=/-?\s*(?:R\s?\$\s?)?\d{1,3}(?:[.\s]?\d{3})*,\s?\d{2}/g;
function moneyIn(s){ const t=String(s||'').replace(/[Oo]/g,'0').replace(/[lI|]/g,'1').replace(/S(?=\d)/g,'5'); const out=[]; let m; MONEY.lastIndex=0; while((m=MONEY.exec(t))){ const raw=m[0].replace(/R\s?\$/,'').replace(/\s/g,''); const v=parseFloat(raw.replace(/\./g,'').replace(',','.')); if(isFinite(v)) out.push({v,raw,i:m.index}); } return out; }
const imgW=i=>i.naturalWidth||i.width, imgH=i=>i.naturalHeight||i.height;
function run(fn){ const p=OCRBUSY.then(fn,fn); OCRBUSY=p.catch(()=>{}); return p; }

/* lê o print inteiro e acha "Res. do Dia" (o OCR às vezes lê "Res-doDa", "Res.do Dia"…) */
const RE_DIA=/(r[e3]s(ult\w{0,4})?|lucr[o0]|p\s?\/?\s?l|ganh\w{0,2})\W{0,4}(d[o0]\W{0,3})?d[il1]?[a4]\b/i, RE_AB=/r[e3]s(ult\w{0,4})?\W{0,4}ab[e3]?rt/i;
function ocrPass(data,cv){ const lines=(data.lines||[]).map(l=>({text:l.text.replace(/\s+/g,' '),words:l.words||[],bbox:l.bbox}));
  const rows=[]; (data.words||[]).forEach(wd=>{ const cy=(wd.bbox.y0+wd.bbox.y1)/2, h=wd.bbox.y1-wd.bbox.y0; let r=rows.find(r=>Math.abs(r.cy-cy)<Math.max(8,h*.6)); if(!r){ r={cy,ws:[]}; rows.push(r); } r.ws.push(wd); });
  rows.forEach(r=>{ r.ws.sort((a,b)=>a.bbox.x0-b.bbox.x0); lines.push({text:r.ws.map(w=>w.text).join(' '),words:r.ws,bbox:r.ws[0].bbox}); });
  const where=(ln,m)=>{ const key=m.raw.replace(/[^\d]/g,'').slice(0,4); const wd=ln.words.find(w=>w.text.replace(/[^\d]/g,'').includes(key))||ln.words.filter(w=>/\d/.test(w.text)).pop(); const bb=wd?wd.bbox:ln.bbox; return {fx:((bb.x0+bb.x1)/2)/cv.width,fy:((bb.y0+bb.y1)/2)/cv.height}; };
  const pick=re=>{ for(const ln of lines){ if(!re.test(ln.text)) continue; const ms=moneyIn(ln.text.slice(ln.text.search(re))); if(!ms.length) continue; const m=ms[0]; return Object.assign({value:Math.abs(m.v),neg:m.v<0},where(ln,m)); } return null; };
  const dia=pick(RE_DIA), ab=pick(RE_AB);
  if(dia&&dia.value>0) return Object.assign(dia,{src:'Res. do Dia'}); if(ab&&ab.value>0) return Object.assign(ab,{src:'Res. Aberto'});
  /* sem rótulo legível: o único valor com "R$" acima de zero (o painel tem Res. Aberto/Médio/Total zerados) */
  const cands=[]; lines.forEach(ln=>moneyIn(ln.text).forEach(m=>{ if(/R\s?\$/.test(ln.text)&&m.v>0&&m.v<100000) cands.push(Object.assign({value:m.v,neg:false},where(ln,m))); }));
  const uniq=[...new Map(cands.map(c=>[c.value,c])).values()]; if(uniq.length===1) return Object.assign(uniq[0],{src:'valor do painel'});
  return dia?Object.assign(dia,{src:'Res. do Dia'}):null; }
function ocrAuto(img){ return run(async()=>{ const W0=imgW(img), H0=imgH(img), sc=Math.min(2,2200/Math.max(W0,H0)), cv=ocrCanvas(img,0,0,W0,H0,sc), w=await ocrWorker();
  for(const psm of ['6','11']){ await w.setParameters({tessedit_pageseg_mode:psm,tessedit_char_whitelist:''}); const {data}=await w.recognize(cv); const r=ocrPass(data,cv); if(r&&r.value>0) return r; }
  return null; }); }

/* lê o número no ponto tocado (fx, fy de 0 a 1) */
function ocrAt(img,fx,fy){ return run(async()=>{ const W0=imgW(img), H0=imgH(img), bh=Math.max(24,H0*.06), x0=Math.max(0,fx*W0-W0*.30), x1=Math.min(W0,fx*W0+W0*.34), y0=Math.max(0,fy*H0-bh/2), sh=Math.min(H0-y0,bh);
  const sc=Math.max(1,Math.min(5,70/sh)), cv=ocrCanvas(img,x0,y0,x1-x0,sh,sc), w=await ocrWorker(); await w.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789R$.,- '});
  const {data}=await w.recognize(cv), ms=moneyIn(data.text); if(!ms.length) return null; const tx=(fx*W0-x0)/(x1-x0), n=data.text.length||1; ms.sort((a,b)=>Math.abs(a.i/n-tx)-Math.abs(b.i/n-tx)); const m=ms[0]; return {value:Math.abs(m.v),neg:m.v<0,src:'toque'}; }); }

/* leitura com IA (OpenAI), quando há chave salva neste aparelho: lê qualquer layout de print */
function imgToJpeg(img,max=1400){ const w=imgW(img), h=imgH(img), s=Math.min(1,max/Math.max(w,h)), c=document.createElement('canvas'); c.width=Math.round(w*s); c.height=Math.round(h*s); c.getContext('2d').drawImage(img,0,0,c.width,c.height); return c.toDataURL('image/jpeg',.88); }
async function aiRead(img,key){ const prompt='Este é um print de uma plataforma de trading (por exemplo o Profit). Encontre o valor do "Res. do Dia" (resultado do dia). Se ele estiver zerado ou não existir, use o "Res. Aberto". Responda somente em JSON: {"valor": número com ponto como separador decimal (ex.: 2375.00), "campo": "Res. do Dia" ou "Res. Aberto" ou "outro", "x": posição horizontal do número de 0 a 1, "y": posição vertical do número de 0 a 1}. Se não achar, responda {"valor": null}.';
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',temperature:0,response_format:{type:'json_object'},messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:imgToJpeg(img),detail:'high'}}]}]})});
  const j=await r.json().catch(()=>({})); if(!r.ok) throw Object.assign(new Error((j.error&&j.error.message)||('HTTP '+r.status)),{status:r.status});
  let d={}; try{ d=JSON.parse(j.choices[0].message.content); }catch(e){} const v=typeof d.valor==='string'?parseFloat(d.valor.replace(/\./g,'').replace(',','.')):d.valor;
  if(!(v>0)) return null; const ok=x=>typeof x==='number'&&x>=0&&x<=1; return {value:Math.abs(v),fx:ok(d.x)?d.x:null,fy:ok(d.y)?d.y:null,src:(d.campo&&d.campo!=='outro'?d.campo:'print')+' (IA)'}; }
/* leitura completa: primeiro no aparelho; se não achar (ou o leitor não carregar) e houver chave, usa a IA */
async function readPrint(img,log){ OCRLOG=log||null; let r=null, err=null;
  try{ r=await ocrAuto(img); }catch(e){ err=e; }
  if(!(r&&r.value>0)){ let key=''; try{ key=localStorage.getItem('placar:openai')||''; }catch(e){}
    if(key){ log&&log('Lendo o print com IA…'); try{ r=await aiRead(img,key); }catch(e){ err=e; } } }
  OCRLOG=null; if(r&&r.value>0) return r; if(err) throw err; return null; }
