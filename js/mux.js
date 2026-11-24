/* Placar do Pregão — junta o vídeo e o áudio (trilha + efeitos) num MP4 só, no próprio aparelho.
   Usado quando o navegador não grava o som direto no vídeo (ex.: iPhone). Baixa o ffmpeg uma vez (~10 MB) e fica guardado. */
'use strict';
let FFI=null;
const FFBASE=()=>new URL('vendor/ffmpeg/',location.href).href;
function ffScript(src){ return new Promise((ok,err)=>{ if(window.FFmpegWASM) return ok(); const s=document.createElement('script'); s.src=src; s.onload=()=>ok(); s.onerror=()=>err(new Error('não carregou o ffmpeg')); document.head.appendChild(s); }); }
async function gunzipBlob(res){ const ab=new Uint8Array(await res.arrayBuffer()); if(!(ab[0]===0x1f&&ab[1]===0x8b)) return new Blob([ab],{type:'application/wasm'});
  if(!window.DecompressionStream) throw new Error('navegador sem descompressão'); const st=new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip')); return new Blob([await new Response(st).arrayBuffer()],{type:'application/wasm'}); }
async function ffLoad(log){ if(FFI) return FFI;
  log&&log('Preparando o montador de vídeo com som (só na primeira vez)…'); await ffScript(FFBASE()+'ffmpeg.js');
  const r=await fetch(FFBASE()+'ffmpeg-core.wasm.gz'); if(!r.ok) throw new Error('HTTP '+r.status); const wasm=await gunzipBlob(r), wurl=URL.createObjectURL(wasm);
  const ff=new FFmpegWASM.FFmpeg(); await ff.load({coreURL:FFBASE()+'ffmpeg-core.js',wasmURL:wurl}); FFI=ff; return ff; }
function withTO(p,ms,msg){ let t; return Promise.race([p,new Promise((_,rej)=>{ t=setTimeout(()=>rej(new Error(msg)),ms); })]).finally(()=>clearTimeout(t)); }
/* vídeo (mp4/webm, com ou sem som) + wav → mp4 H.264 + AAC */
async function muxAV(video,wav,log){ const ff=await withTO(ffLoad(log),180000,'o montador demorou demais para carregar');
  const vin='v.'+(/webm/.test(video.type)?'webm':'mp4');
  await ff.writeFile(vin,new Uint8Array(await video.arrayBuffer())); await ff.writeFile('a.wav',new Uint8Array(await wav.arrayBuffer()));
  log&&log('Juntando a música e os efeitos ao vídeo…');
  const code=await withTO(ff.exec(['-i',vin,'-i','a.wav','-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-shortest','-movflags','+faststart','out.mp4']),180000,'a montagem demorou demais');
  let out=null; try{ out=await ff.readFile('out.mp4'); }catch(e){}
  for(const f of [vin,'a.wav','out.mp4']) try{ await ff.deleteFile(f); }catch(e){}
  if(code!==0||!out||out.length<1000) throw new Error('a montagem falhou ('+code+')');
  return new Blob([out],{type:'video/mp4'}); }
