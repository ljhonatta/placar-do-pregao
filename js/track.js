/* Placar do Pregão — "Minha trilha": a música padrão da marca, enviada uma vez e guardada só neste aparelho
   (não vai para o site público). O app detecta o andamento (BPM), o tempo 1 de cada compasso e os pontos de loop,
   e a linha do tempo dos vídeos passa a cortar exatamente nas batidas dessa música. */
'use strict';
let TRACK=null;            // {name, buf, bpm, first, loopStart, loopEnd, dur, impacts}
const TRACK_KEY='track:main';

async function decodeTrack(blob){ const ab=await blob.arrayBuffer(), AC=window.AudioContext||window.webkitAudioContext, ctx=new AC();
  try{ return await new Promise((res,rej)=>{ const p=ctx.decodeAudioData(ab,res,rej); if(p&&p.then) p.then(res,rej); }); } finally{ try{ ctx.close(); }catch(e){} } }

/* análise: envelope de ataques (10 ms) → andamento por autocorrelação → fase e tempo 1 por pente de batidas */
function analyzeTrack(buf){ const sr=buf.sampleRate, n=buf.length, ch=buf.numberOfChannels, hop=Math.round(sr/100), F=Math.floor(n/hop);
  const m=new Float32Array(n); for(let c=0;c<ch;c++){ const d=buf.getChannelData(c); for(let i=0;i<n;i++) m[i]+=d[i]/ch; }
  const hi=new Float32Array(F), lo=new Float32Array(F);
  for(let f=0;f<F;f++){ let sh=0, sl=0, acc=0; const o=f*hop; for(let i=1;i<hop;i++){ const d=m[o+i]-m[o+i-1]; sh+=d*d; acc=acc*.97+m[o+i]*.03; sl+=acc*acc; } hi[f]=Math.log(1e-9+sh); lo[f]=Math.log(1e-9+sl); }
  const flux=a=>{ const r=new Float32Array(F); for(let f=1;f<F;f++) r[f]=Math.max(0,a[f]-a[f-1]); const out=new Float32Array(F), w=25; let s=0; const q=[];
    for(let f=0;f<F;f++){ let sum=0,c=0; for(let k=Math.max(0,f-w);k<Math.min(F,f+w);k++){ sum+=r[k]; c++; } out[f]=Math.max(0,r[f]-sum/c); } return out; };
  const on=flux(hi), bass=flux(lo); for(let f=0;f<F;f++) on[f]+=bass[f]*.8;
  let best=-1, bl=60; for(let L=33;L<=86;L++){ let s=0; for(let f=0;f+L<F;f++) s+=on[f]*on[f+L]; const bpm=6000/L, w=Math.exp(-.5*Math.pow(Math.log2(bpm/100)/.9,2)); s*=w; if(s>best){ best=s; bl=L; } }
  let bs=-1, P=bl, phi=0; for(let p=bl-1.5;p<=bl+1.5;p+=.05){ for(let ph=0;ph<p;ph+=1){ let s=0; for(let k=0;;k++){ const i=Math.round(ph+k*p); if(i>=F) break; s+=on[i]+(on[i-1]||0)*.5+(on[i+1]||0)*.5; } if(s>bs){ bs=s; P=p; phi=ph; } } }
  { let s2=0; for(let f=0;f<F;f++) s2+=on[f]*on[f]; const sdv=Math.sqrt(s2/F)||1; for(let f=0;f<F;f++) on[f]/=sdv; }
  /* rastreio batida a batida (programação dinâmica): segue pequenas variações de andamento */
  const sc=new Float32Array(F), bk=new Int32Array(F).fill(-1), lo2=Math.round(P*.6), hi2=Math.round(P*1.5), alpha=120;
  for(let f=0;f<F;f++){ let bestv=0, bi=-1; for(let p=f-hi2;p<=f-lo2;p++){ if(p<0) continue; const r=Math.log((f-p)/P), v=sc[p]-alpha*r*r; if(bi<0||v>bestv){ bestv=v; bi=p; } } sc[f]=on[f]+(bi>=0?Math.max(0,bestv):0); bk[f]=bestv>0?bi:-1; }
  let end=F-1, mx=-1; for(let f=Math.max(0,F-hi2);f<F;f++) if(sc[f]>mx){ mx=sc[f]; end=f; } const bt=[]; for(let f=end;f>=0;f=bk[f]){ bt.unshift(f/100); if(bk[f]<0) break; }
  for(let k=0;k<bt.length;k++){ const c0=Math.round(bt[k]*100); let bi=c0, bv=-1; for(let f=Math.max(0,c0-12);f<=Math.min(F-1,c0+12);f++){ const w=on[f]*(1-Math.abs(f-c0)/30); if(w>bv){ bv=w; bi=f; } } bt[k]=bi/100; }
  const beatsAll=bt.length>8?bt:Array.from({length:Math.floor((F-phi)/P)},(_,k)=>(phi+k*P)/100);
  const beat=(beatsAll[beatsAll.length-1]-beatsAll[0])/(beatsAll.length-1), bpm=60/beat;
  const ds=[0,0,0,0]; beatsAll.forEach((b,k)=>{ const i=Math.round(b*100); ds[k%4]+=(bass[i]||0)+(on[i]||0)*.3; }); const j=ds.indexOf(Math.max(...ds));
  const beats=beatsAll.slice(j), first=beats[0], dur=n/sr, downs=beats.filter((b,k)=>k%4===0);
  const dStr=b=>{ const i=Math.round(b*100); let m=0; for(let f=i-3;f<=i+3;f++) m=Math.max(m,on[f]||0); return m; }, dMean=downs.reduce((a,b)=>a+dStr(b),0)/Math.max(1,downs.length);
  let loopStart=downs.find(b=>b>=7&&dStr(b)>=dMean*.7)||downs.find(b=>b>=4)||first, loopEnd=downs.filter(b=>b<=dur-1.5).pop()||downs[downs.length-1]; if(loopEnd-loopStart<4*beat*2){ loopStart=first; loopEnd=downs[downs.length-1]; }
  const mean=on.reduce((a,b)=>a+b,0)/F, sd=Math.sqrt(on.reduce((a,b)=>a+(b-mean)*(b-mean),0)/F), impacts=[]; for(let f=1;f<F-1;f++){ if(on[f]>mean+3*sd&&on[f]>=on[f-1]&&on[f]>=on[f+1]&&(!impacts.length||f/100-impacts[impacts.length-1]>.25)) impacts.push(f/100); }
  return {bpm,beat,first,loopStart,loopEnd,dur,impacts,beats:beats.map(b=>+b.toFixed(3))}; }

const TRACK_DEFAULT='assets/trilha-padrao.mp3';
/* trilha do aparelho, se houver; senão a trilha padrão da Trader School que já vem no app */
async function loadTrackFromStore(){ try{ const blob=await Store.getImg(TRACK_KEY);
    if(blob){ const meta=await Store.get('trackMeta')||{}; const buf=await decodeTrack(blob); const an=meta.bpm&&meta.beats?meta:analyzeTrack(buf); TRACK=Object.assign({name:meta.name||'minha trilha',buf},an); return TRACK; } }catch(e){}
  try{ const r=await fetch(TRACK_DEFAULT); if(!r.ok) throw 0; const buf=await decodeTrack(await r.blob()); TRACK=Object.assign({name:'Trilha padrão Trader School',buf,isDefault:true},analyzeTrack(buf)); return TRACK; }catch(e){ TRACK=null; return null; } }
async function setTrack(file){ const buf=await decodeTrack(file); const an=analyzeTrack(buf); await Store.putImg(TRACK_KEY,file); const meta=Object.assign({name:file.name||'minha trilha'},an); await Store.set('trackMeta',meta); TRACK=Object.assign({buf},meta); return TRACK; }
async function clearTrack(){ try{ await Store.delImg(TRACK_KEY); await Store.set('trackMeta',null); }catch(e){} TRACK=null; await loadTrackFromStore(); }

/* toca a trilha no contexto de áudio: começa no tempo 1 e, se o vídeo for mais longo, volta para o trecho de loop no tempo 1 de um compasso */
function scheduleTrack(ac,out,T,dur){ if(!T||!T.buf) return; const X=.012; let t=0, from=T.first;
  while(t<dur+.5){ const len=Math.min(T.loopEnd-from,dur+.6-t); if(len<=.05) break; const s=ac.createBufferSource(); s.buffer=T.buf; const g=ac.createGain();
    g.gain.setValueAtTime(t>0?0:1,t); if(t>0) g.gain.linearRampToValueAtTime(1,t+X); g.gain.setValueAtTime(1,t+Math.max(X,len-X)); g.gain.linearRampToValueAtTime(0,t+len+X);
    s.connect(g).connect(out); s.start(t,from,len+X*2); t+=len; from=T.loopStart; } }

/* batidas no tempo do vídeo (0 = tempo 1 da música), já contando os loops */
function videoBeats(T,dur){ const out=[], seg1=T.beats.filter(b=>b>=T.first-1e-3&&b<T.loopEnd-1e-3).map(b=>b-T.first), loop=T.beats.filter(b=>b>=T.loopStart-1e-3&&b<T.loopEnd-1e-3).map(b=>b-T.loopStart), L=T.loopEnd-T.loopStart;
  out.push(...seg1); let base=T.loopEnd-T.first; while(base<dur&&loop.length){ out.push(...loop.map(b=>b+base)); base+=L; } return out; }
