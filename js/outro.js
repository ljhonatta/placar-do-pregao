/* Placar do Pregão — encerramento da marca (logo Trader School, 2,5 s) no fim de todo vídeo.
   Quadros em assets/encerramento/ e som em assets/encerramento.mp3; a trilha termina no tempo 1 de um compasso e some sob ele. */
'use strict';
const OUTRO={n:75,fps:30,dur:2.5,imgs:[],buf:null,ready:false,loading:null};
const outroOn=()=>{ try{ return localStorage.getItem('placar:outro')!=='0'; }catch(e){ return true; } };
function loadOutro(){ if(OUTRO.loading) return OUTRO.loading;
  OUTRO.loading=(async()=>{ const ld=i=>new Promise(ok=>{ const im=new Image(); im.onload=()=>ok(im); im.onerror=()=>ok(null); im.src='assets/encerramento/f'+String(i+1).padStart(3,'0')+'.jpg'; });
    const imgs=await Promise.all(Array.from({length:OUTRO.n},(_,i)=>ld(i))); OUTRO.imgs=imgs; OUTRO.ready=imgs.filter(Boolean).length>OUTRO.n*.9;
    try{ const r=await fetch('assets/encerramento.mp3'); OUTRO.buf=await decodeTrack(await r.blob()); }catch(e){ OUTRO.buf=null; }
    return OUTRO.ready; })(); return OUTRO.loading; }
function outroFrame(u){ let i=Math.min(OUTRO.n-1,Math.max(0,Math.floor(u*OUTRO.fps))); while(i>0&&!OUTRO.imgs[i]) i--; return OUTRO.imgs[i]; }
function sceneOutro(c,u){ const im=outroFrame(u); c.fillStyle='#000'; c.fillRect(0,0,W,H); if(im) c.drawImage(im,0,0,W,H); }
function outroScene(){ const o=mkScene('outro',OUTRO.dur,sceneOutro,[]); o.dur=OUTRO.dur; o.base=OUTRO.dur; o.cues=[]; o.isOutro=true; return o; }
