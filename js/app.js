/* Placar do Pregão — estado, painel, salvamento no aparelho, exportação e atualização do app. */
'use strict';
const APP_VERSION='3.4.1';
try{ document.getElementById('ver').textContent='v'+APP_VERSION; }catch(e){}

/* ---------- turma padrão ---------- */
const DEF_ROSTER=[
  ['Lucas','@lucas_rocha.giordani'],['Keko','@khetersson'],['Francyelle','@francyellelocatelli90'],['Herdilan',''],
  ['Enzo','@enzocalgaroto'],['Felipe Alves','@96__wolf'],['Gabriel Mota','@gabriel_mootaa'],['Wilker Arruda','@wilkerarruda88'],
  ['Breno Gomes','@breno.shwzz'],['Jhonatta','@traderjhonatta'],
  ['Rosianny','@rosiannyolc'],['Keyte','@keytytatielle'],['Divino','@divino.ferreiradesouza'],['Gilberto',''],['Robson','@robsonmartiins']
];
let roster=DEF_ROSTER.map(([name,handle],k)=>({id:'s'+k,name,handle,avatar:'assets/avatars/s'+k+'.jpg',avatarKey:null}));
let results={};           // { 'AAAA-MM-DD': { idAluno: {value,on,fx,fy,printKey} } }
let weekOffset=0;         // 0 = semana atual
let curDay='seg';
let days={};              // montado a partir da semana visível (usado pelo motor)

/* ---------- datas automáticas ---------- */
const iso=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
function todayInfo(){ const n=new Date(); n.setHours(12,0,0,0); const dow=n.getDay(); return {date:n,dow,key:iso(n)}; }
function mondayOf(offset){ const {date,dow}=todayInfo(); const m=new Date(date); m.setDate(date.getDate()-((dow+6)%7)+offset*7); return m; }
function todayTab(){ const {dow}=todayInfo(); return dow>=1&&dow<=5?DAYS[dow-1]:'sab'; }
function buildWeek(){
  const mon=mondayOf(weekOffset); days={};
  DAYS.forEach((d,k)=>{ const x=new Date(mon); x.setDate(mon.getDate()+k); const key=iso(x); if(d!=='sab'&&!results[key]) results[key]={}; days[d]={date:fmtDate(x),key,entries:d==='sab'?{}:results[key]}; });
}
function entry(day,id){ const ent=days[day].entries; return ent[id]||(ent[id]={value:0,on:false,fx:.8,fy:.66,printKey:null}); }

/* ---------- imagens (URLs a partir do aparelho) ---------- */
const urls=new Map();
async function urlFor(key){ if(!key) return null; if(urls.has(key)) return urls.get(key); const b=await Store.getImg(key); if(!b) return null; const u=URL.createObjectURL(b); urls.set(key,u); return u; }
const urlNow=key=>key?urls.get(key)||null:null;
const printSrc=(day,id,e)=>urlNow(e.printKey);
const avatarSrc=r=>r.avatarKey?urlNow(r.avatarKey):r.avatar;
async function preloadUrls(){ const keys=new Set(); roster.forEach(r=>r.avatarKey&&keys.add(r.avatarKey)); WEEK.forEach(d=>Object.values(days[d].entries).forEach(e=>e.printKey&&keys.add(e.printKey))); await Promise.all([...keys].map(urlFor)); }

/* ---------- salvamento ---------- */
let loaded=false, saveTimer=null;
function setSaved(m,warn){ $('saved').textContent=m; $('saved').classList.toggle('warn',!!warn); }
function save(){ if(!loaded) return; clearTimeout(saveTimer); setSaved('Salvando…'); saveTimer=setTimeout(doSave,500); }
function prunedResults(){ const out={}; for(const [k,v] of Object.entries(results)){ const ent={}; for(const [id,e] of Object.entries(v)) if(e.on||e.value>0||e.printKey) ent[id]=e; if(Object.keys(ent).length) out[k]=ent; } return out; }
async function doSave(){ try{ await Store.set('roster',roster); await Store.set('results',prunedResults()); await Store.set('ui',{v:1}); setSaved('Salvo ✓'); }catch(e){ setSaved('Não salvou: '+(e&&e.name||'erro'),true); } }
window.addEventListener('pagehide',()=>{ if(saveTimer){ clearTimeout(saveTimer); doSave(); } });
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden'&&saveTimer){ clearTimeout(saveTimer); doSave(); } });

/* ---------- arquivos ---------- */
async function toCanvas(file,max){ const bmp=await createImageBitmap(file); const sc=Math.min(1,max/Math.max(bmp.width,bmp.height)); const c=document.createElement('canvas'); c.width=Math.round(bmp.width*sc); c.height=Math.round(bmp.height*sc); c.getContext('2d').drawImage(bmp,0,0,c.width,c.height); if(bmp.close) bmp.close(); return c; }
const toBlob=c=>new Promise(r=>c.toBlob(r,'image/jpeg',.9));
const newKey=p=>p+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
async function takePrint(r,file){
  const day=curDay, e=entry(day,r.id);
  let c; try{ status('Melhorando o print…'); c=await toCanvas(file,1800); await sleep(10); enhance(c); }catch(err){ status('Não consegui abrir essa imagem. Tente um print em JPG ou PNG.',true); return; }
  const blob=await toBlob(c), key=newKey('p'); await Store.putImg(key,blob); urls.set(key,URL.createObjectURL(blob));
  const old=e.printKey; e.printKey=key; e.on=true; e.fx=.8; e.fy=.66; if(old) Store.delImg(old).catch(()=>{});
  save(); renderList(); status('Agora toque no valor do Res. do Dia no print de '+r.name+'.',true);
  const row=document.querySelector(`[data-id="${r.id}"] .fbox`); if(row) row.scrollIntoView({block:'center',behavior:'smooth'});
}
async function takeAvatar(r,file){ let c; try{ c=await toCanvas(file,520); }catch(err){ status('Não consegui abrir essa foto.',true); return; }
  const blob=await toBlob(c), key=newKey('a'); await Store.putImg(key,blob); urls.set(key,URL.createObjectURL(blob)); const old=r.avatarKey; r.avatarKey=key; if(old) Store.delImg(old).catch(()=>{});
  save(); renderList(); preview(); }

/* ---------- prévia ---------- */
function status(m,warn){ $('status').textContent=m; $('status').classList.toggle('warn',!!warn); }
let AC=null, ASRC=null;
const sfxOn=()=>!!($('sfx')&&$('sfx').checked);
function stopSound(){ try{ if(ASRC) ASRC.stop(); }catch(e){} ASRC=null; }
function runTimeline(startAt=0,sound=false){ const id=++loopId, D=dur(); let t0=null; stopSound();
  if(sound&&AC&&sfxOn()&&(typeof SFX!=='undefined')){ const tStart=performance.now(); SFX.render(cueList(),D).then(buf=>{ if(!buf||id!==loopId) return; const off=startAt+(performance.now()-tStart)/1000; if(off>=D) return; ASRC=AC.createBufferSource(); ASRC.buffer=buf; ASRC.connect(AC.destination); ASRC.start(0,off); }).catch(()=>{}); }
  (function f(now){ if(id!==loopId) return; if(t0===null) t0=now-startAt*1000; const t=(now-t0)/1000; draw(Math.min(t,D)); $('prog').style.width=(D?Math.min(100,t/D*100):0)+'%'; if(t<D) requestAnimationFrame(f); })(performance.now()); }
let prevReq=0;
async function preview(focusId,sound=false){ if(busy) return; const req=++prevReq; await prepare(); if(req!==prevReq) return;
  if(!SCENES.length){ loopId++; draw(0); status(MODE==='week'?'Ainda não há resultados lançados nesta semana.':'Marque pelo menos um aluno em "Operou hoje".',true); return; }
  if(MODE==='week') status('Semana '+WK.range+' · '+WK.rank.length+' alunos · '+Math.round(dur())+' s de vídeo');
  else status(THEMES[curDay].label+' · Destaque: '+S[0].name+' · '+S.length+(S.length>1?' alunos':' aluno')+' · '+Math.round(dur())+' s de vídeo');
  let start=0; if(typeof focusId==='string'){ const idx=S.findIndex(s=>s.id===focusId); if(idx>=0) start=sceneStart(idx+2); }
  runTimeline(start,sound); }

/* ---------- exportação ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function aacOK(){ if(!window.AudioEncoder||!window.AudioData) return false; try{ return !!(await AudioEncoder.isConfigSupported({codec:'mp4a.40.2',sampleRate:48000,numberOfChannels:2,bitrate:160000})).supported; }catch(e){ return false; } }
function realtimeAudioMime(){ if(!window.MediaRecorder||!cv.captureStream||!MediaRecorder.isTypeSupported) return ''; return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m))||''; }
async function audioTrack(D){ if(!sfxOn()||!(typeof SFX!=='undefined')||!window.AudioEncoder||!window.AudioData) return null;
  for(const [codec,mux] of [['mp4a.40.2','aac']]){ const cfg={codec,sampleRate:48000,numberOfChannels:2,bitrate:160000}; try{ const r=await AudioEncoder.isConfigSupported(cfg); if(r.supported){ const buf=await SFX.render(cueList(),D); return buf?{cfg,mux,buf}:null; } }catch(e){} }
  return null; }
async function encodeMP4(D,onProg,withAudio=true){
  const cands=[['avc1.640028','avc'],['avc1.4d0028','avc'],['avc1.42e028','avc'],['avc1.640033','avc'],['vp09.00.40.08','vp9']];
  let codec=null, vmux='avc'; for(const [c,m] of cands){ try{ const r=await VideoEncoder.isConfigSupported({codec:c,width:W,height:H,bitrate:12e6,framerate:FPS}); if(r.supported){codec=c;vmux=m;break;} }catch(e){} }
  if(!codec) throw new Error('codec');
  const au=withAudio?await audioTrack(D):null;
  const muxer=new Mp4Muxer.Muxer({target:new Mp4Muxer.ArrayBufferTarget(),video:{codec:vmux,width:W,height:H,frameRate:FPS},audio:au?{codec:au.mux,numberOfChannels:2,sampleRate:48000}:undefined,fastStart:'in-memory',firstTimestampBehavior:'offset'});
  let err=null; const enc=new VideoEncoder({output:(ch,meta)=>muxer.addVideoChunk(ch,meta),error:e=>{err=e;}});
  enc.configure(vmux==='avc'?{codec,width:W,height:H,bitrate:12e6,framerate:FPS,avc:{format:'avc'}}:{codec,width:W,height:H,bitrate:12e6,framerate:FPS});
  const N=Math.ceil(D*FPS)+FPS/2;
  for(let f=0;f<N;f++){ if(err) throw err; draw(Math.min(f/FPS,D));
    const vf=new VideoFrame(cv,{timestamp:Math.round(f*1e6/FPS),duration:Math.round(1e6/FPS)}); enc.encode(vf,{keyFrame:f%(FPS*2)===0}); vf.close();
    while(enc.encodeQueueSize>6) await sleep(4);
    if(f%10===0){ onProg(f/N); await sleep(0); } }
  await enc.flush(); if(err) throw err; enc.close();
  if(au){ const aenc=new AudioEncoder({output:(ch,meta)=>muxer.addAudioChunk(ch,meta),error:e=>{err=e;}}); aenc.configure(au.cfg);
    const L=au.buf.getChannelData(0), Rr=au.buf.getChannelData(1), total=Math.min(au.buf.length,Math.round(N/FPS*48000)), CH=4800;
    for(let i=0;i<total;i+=CH){ if(err) throw err; const n=Math.min(CH,total-i), data=new Float32Array(n*2); data.set(L.subarray(i,i+n),0); data.set(Rr.subarray(i,i+n),n);
      const ad=new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:n,numberOfChannels:2,timestamp:Math.round(i*1e6/48000),data}); aenc.encode(ad); ad.close(); if(aenc.encodeQueueSize>20) await sleep(2); }
    await aenc.flush(); if(err) throw err; aenc.close(); }
  muxer.finalize(); lastAudio=!!au;
  return new Blob([muxer.target.buffer],{type:'video/mp4'});
}
async function recordRealtime(D,onProg){
  const stream=cv.captureStream(FPS); let rsrc=null; lastAudio=false;
  if(sfxOn()&&(typeof SFX!=='undefined')){ try{ const buf=await SFX.render(cueList(),D); AC=AC||new (window.AudioContext||window.webkitAudioContext)(); await AC.resume(); const dest=AC.createMediaStreamDestination(); rsrc=AC.createBufferSource(); rsrc.buffer=buf; rsrc.connect(dest); stream.addTrack(dest.stream.getAudioTracks()[0]); lastAudio=true; }catch(e){ rsrc=null; } }
  const mimes=rsrc?['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm']:['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm'], mime=mimes.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
  const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:10e6}:{videoBitsPerSecond:10e6}); const ch=[]; rec.ondataavailable=e=>{if(e.data?.size)ch.push(e.data)}; const stop=new Promise(r=>rec.onstop=r);
  draw(0); rec.start(250); if(rsrc) try{ rsrc.start(); }catch(e){} const t0=performance.now(); await new Promise(res=>{ (function f(now){ const t=(now-t0)/1000; draw(Math.min(t,D)); onProg(t/D); if(t<D+.3) requestAnimationFrame(f); else res(); })(t0); });
  rec.stop(); await stop; return {blob:new Blob(ch,{type:mime||'video/webm'}),ext:(mime.includes('mp4')?'mp4':'webm')};
}
let lastVideo=null, lastAudio=false;
const LOCK=['rec','play','add','clearDay','prevWeek','nextWeek'];
async function record(){
  if(busy) return; $('ready').hidden=true;
  if(sfxOn()){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); AC.resume(); }catch(e){} } // libera o áudio no toque (iPhone exige)
  await prepare();
  if(!SCENES.length){ status(MODE==='week'?'Ainda não há resultados na semana.':'Marque pelo menos um aluno.',true); return; }
  if(MODE==='day'){ const miss=S.filter(s=>!s.print).map(s=>s.name); if(miss.length){ status('Falta o print de: '+miss.join(', ')+'.',true); return; } }
  busy=true; exporting=true; loopId++; setRes(1); LOCK.forEach(b=>$(b).disabled=true); document.querySelectorAll('.tabs button').forEach(b=>b.disabled=true);
  const D=dur(), prog=p=>{ $('prog').style.width=Math.round(p*100)+'%'; status('Gerando vídeo… '+Math.round(p*100)+'% · deixe esta tela aberta'); };
  try{
    let blob=null, ext='mp4';
    const fast=window.VideoEncoder&&window.VideoFrame&&window.Mp4Muxer, wantSound=sfxOn()&&(typeof SFX!=='undefined'), aac=wantSound&&await aacOK();
    // com som: MP4 rápido quando o navegador grava AAC; senão grava em tempo real (o próprio navegador junta vídeo + som)
    if(fast&&(!wantSound||aac)){ try{ blob=await encodeMP4(D,prog,wantSound); }catch(e){ blob=null; } }
    if(!blob&&wantSound&&realtimeAudioMime()){ status('Gravando com som em tempo real… leva o tempo do vídeo, deixe esta tela aberta.'); try{ const r=await recordRealtime(D,prog); if(r.blob.size>1000){ blob=r.blob; ext=r.ext; } }catch(e){ blob=null; } }
    if(!blob&&fast){ try{ blob=await encodeMP4(D,prog,false); }catch(e){ blob=null; } }
    if(!blob){ if(!window.MediaRecorder||!cv.captureStream) throw new Error('none'); status('Gravando em tempo real… deixe esta tela aberta.'); const r=await recordRealtime(D,prog); blob=r.blob; ext=r.ext; }
    const name=`resultado-${MODE==='week'?'semana':THEMES[curDay].label.toLowerCase().replace('ç','c')}-${days[curDay].date.replace(/\//g,'-')}.${ext}`;
    lastVideo={blob,name}; $('readyName').textContent='Vídeo pronto: '+name+' ('+(blob.size/1048576).toFixed(1)+' MB · '+(lastAudio?'com efeitos sonoros':'sem som')+')';
    const file=new File([blob],name,{type:blob.type}); $('share').hidden=!(navigator.canShare&&navigator.canShare({files:[file]}));
    $('ready').hidden=false; status(lastAudio||!sfxOn()?'Vídeo pronto. Toque em baixar.':'Vídeo pronto, mas este navegador não deixou gravar o som. Tente pelo Chrome atualizado.',!lastAudio&&sfxOn()); $('ready').scrollIntoView({block:'nearest',behavior:'smooth'});
  }catch(e){ status('Este navegador não conseguiu gerar o vídeo. Use o Chrome ou o Safari atualizado.',true); }
  finally{ busy=false; exporting=false; setRes(.5); draw(dur()); LOCK.forEach(b=>$(b).disabled=false); document.querySelectorAll('.tabs button').forEach(b=>b.disabled=false); $('prog').style.width='100%'; }
}
function downloadBlob(blob,name){ const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),60000); }
$('dl').onclick=()=>{ if(lastVideo){ downloadBlob(lastVideo.blob,lastVideo.name); status('Download iniciado: '+lastVideo.name); } };
$('share').onclick=async()=>{ if(!lastVideo) return; try{ await navigator.share({files:[new File([lastVideo.blob],lastVideo.name,{type:lastVideo.blob.type})],title:'Resultado dos alunos'}); }catch(e){ if(e&&e.name!=='AbortError') status('Não deu pra compartilhar. Use "Baixar vídeo".',true); } };

/* ---------- painel ---------- */
function renderWeekNav(){ const mon=mondayOf(weekOffset), fri=new Date(mon); fri.setDate(mon.getDate()+4);
  $('weekLabel').textContent=(weekOffset===0?'Esta semana · ':weekOffset===-1?'Semana passada · ':'')+pad2(mon.getDate())+'/'+pad2(mon.getMonth()+1)+' a '+pad2(fri.getDate())+'/'+pad2(fri.getMonth()+1);
  $('thisWeek').hidden=weekOffset===0; $('nextWeek').disabled=weekOffset>=0; }
function renderTabs(){ const T=$('tabs'); T.innerHTML=''; const tk=todayInfo().key;
  DAYS.forEach(d=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-pressed',d===curDay); if(days[d].key===tk) b.classList.add('today');
    const has=d!=='sab'&&Object.values(days[d].entries).some(e=>e.on);
    b.innerHTML=`${THEMES[d].tab}<small>${days[d].key===tk?'HOJE':shortDate(days[d].date)}</small>${has?'<i class="dot"></i>':''}`;
    b.onclick=()=>{ if(busy) return; curDay=d; renderAll(); preview(); }; T.appendChild(b); }); }
function renderAll(){ renderWeekNav(); renderTabs(); const wk=curDay==='sab'; $('dayPanel').hidden=wk; $('weekPanel').hidden=!wk;
  $('panelTitle').textContent=wk?'Resultado da semana':(THEMES[curDay].label.charAt(0)+THEMES[curDay].label.slice(1).toLowerCase()+' · '+days[curDay].date);
  if(wk) renderWeek(); else renderList(); }
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderWeek(){ const w=computeWeek(); $('weekTotal').textContent=brl(w.total);
  let h='<table><thead><tr><th>Aluno</th>'+WEEK.map((d,k)=>`<th>${THEMES[d].tab}<br>${w.dates[k]}</th>`).join('')+'<th>Semana</th></tr></thead><tbody>';
  w.rank.forEach(s=>{ h+=`<tr><td>${esc(s.name)}</td>`+WEEK.map(d=>{ const e=days[d].entries[s.id]; return `<td>${e&&e.on&&e.value>0?brlInput(e.value):'—'}</td>`; }).join('')+`<td>${brlInput(s.total)}</td></tr>`; });
  h+='</tbody><tfoot><tr><td>Total</td>'+w.dayTotals.map(v=>`<td>${v?brlInput(v):'—'}</td>`).join('')+`<td>${brlInput(w.total)}</td></tr></tfoot></table>`;
  $('weekTable').innerHTML=w.rank.length?h:'<p class="note">Nenhum resultado lançado de segunda a sexta desta semana.</p>'; }
function renderList(){
  const L=$('list'); L.innerHTML=''; const day=curDay;
  roster.forEach((r,i)=>{ const e=entry(day,r.id), ps=printSrc(day,r.id,e), av=avatarSrc(r);
    const row=document.createElement('div'); row.className='row'+(e.on?' on':''); row.dataset.id=r.id;
    row.innerHTML=`<div class="head"><img class="thumb" alt="" ${av?'':'hidden'}><div class="id"><input type="text" class="nm-in" aria-label="Nome do aluno" autocomplete="off"><input type="text" class="hd-in" aria-label="Instagram" placeholder="@instagram" autocomplete="off" autocapitalize="off"></div><label class="chk"><input type="checkbox" class="on-in" ${e.on?'checked':''}> Operou hoje</label></div>
      <div class="field"><label for="v-${r.id}">Resultado do dia (R$)</label><input type="text" class="val-in" inputmode="decimal" id="v-${r.id}" placeholder="0,00" autocomplete="off"></div>
      <div class="files"><label class="btn${ps?'':' need'}">${ps?'✓ Trocar print':'Enviar print'}<input type="file" accept="image/*" class="fp" hidden></label><label class="btn">${r.avatarKey||r.avatar?'Trocar foto':'Enviar foto'}<input type="file" accept="image/*" class="fa" hidden></label><button type="button" class="rm">Remover da turma</button></div>
      ${ps?`<div class="focus"><span class="flab">Toque no valor do <b>Res. do Dia</b> pra marcar o zoom</span><div class="fbox"><img alt="Print de ${esc(r.name)}: toque no resultado"><span class="mark" style="left:${e.fx*100}%;top:${e.fy*100}%"></span></div></div>`:''}`;
    L.appendChild(row);
    const q=s=>row.querySelector(s);
    if(av) q('.thumb').src=av; if(ps) q('.fbox img').src=ps;
    q('.nm-in').value=r.name; q('.hd-in').value=r.handle; q('.val-in').value=brlInput(e.value);
    q('.nm-in').addEventListener('input',ev=>{ r.name=ev.target.value; save(); });
    q('.hd-in').addEventListener('input',ev=>{ r.handle=ev.target.value; save(); });
    q('.val-in').addEventListener('input',ev=>{ e.value=parseBR(ev.target.value); if(e.value>0&&!e.on){ e.on=true; q('.on-in').checked=true; row.classList.add('on'); renderTabs(); } save(); });
    q('.val-in').addEventListener('change',ev=>{ ev.target.value=brlInput(e.value); preview(); });
    q('.on-in').addEventListener('change',ev=>{ e.on=ev.target.checked; row.classList.toggle('on',e.on); save(); renderTabs(); preview(); });
    if(ps) q('.fbox img').addEventListener('click',ev=>{ const b=ev.currentTarget.getBoundingClientRect(); e.fx=clamp((ev.clientX-b.left)/b.width,0,1); e.fy=clamp((ev.clientY-b.top)/b.height,0,1); const m=q('.mark'); m.style.left=e.fx*100+'%'; m.style.top=e.fy*100+'%'; save(); status('Zoom marcado no print de '+r.name+'.'); preview(r.id); });
    q('.fp').addEventListener('change',ev=>{ const f=ev.target.files[0]; ev.target.value=''; if(f) takePrint(r,f); });
    q('.fa').addEventListener('change',ev=>{ const f=ev.target.files[0]; ev.target.value=''; if(f) takeAvatar(r,f); });
    let armed=0; q('.rm').addEventListener('click',ev=>{ if(Date.now()-armed>3500){ armed=Date.now(); ev.target.textContent='Toque de novo pra remover'; return; } roster.splice(roster.indexOf(r),1); save(); renderList(); preview(); });
  });
}
let armedClear=0;
$('clearDay').onclick=()=>{ if(Date.now()-armedClear>4000){ armedClear=Date.now(); $('clearDay').textContent='Toque de novo pra confirmar'; setTimeout(()=>{ if(Date.now()-armedClear>=3900) $('clearDay').textContent='Limpar este dia'; },4000); return; }
  armedClear=0; $('clearDay').textContent='Limpar este dia'; const ent=days[curDay].entries; Object.values(ent).forEach(e=>{ if(e.printKey) Store.delImg(e.printKey).catch(()=>{}); }); Object.keys(ent).forEach(k=>delete ent[k]); save(); renderAll(); preview(); };
$('add').onclick=()=>{ const r={id:'u'+Date.now().toString(36),name:'Novo aluno',handle:'@',avatar:null,avatarKey:null}; roster.push(r); save(); renderList(); const el=document.querySelector(`[data-id="${r.id}"] .nm-in`); if(el){ el.focus(); el.select(); } };
$('prevWeek').onclick=async()=>{ weekOffset--; await changeWeek(); };
$('nextWeek').onclick=async()=>{ if(weekOffset<0){ weekOffset++; await changeWeek(); } };
$('thisWeek').onclick=async()=>{ weekOffset=0; curDay=todayTab(); await changeWeek(); };
async function changeWeek(){ buildWeek(); await preloadUrls(); renderAll(); preview(); }
$('play').onclick=()=>{ if(sfxOn()){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); AC.resume(); }catch(e){} } preview(undefined,true); }; $('rec').onclick=record; $('guides').onchange=()=>{ if(!busy) preview(); };
try{ if(localStorage.getItem('placar:tickers')==='0') $('tickers').checked=false; }catch(e){}
try{ if(localStorage.getItem('placar:sfx')==='0') $('sfx').checked=false; }catch(e){}
$('sfx').onchange=()=>{ try{ localStorage.setItem('placar:sfx',$('sfx').checked?'1':'0'); }catch(e){} if(!$('sfx').checked) stopSound(); };
$('tickers').onchange=()=>{ try{ localStorage.setItem('placar:tickers',$('tickers').checked?'1':'0'); }catch(e){} if(!busy) preview(); };

/* ---------- virada do dia automática ---------- */
let lastToday=todayInfo().key;
async function checkDayChange(){ const k=todayInfo().key; if(k===lastToday||busy) return; const wasOnToday=weekOffset===0&&days[curDay]&&days[curDay].key===lastToday; lastToday=k;
  if(weekOffset===0){ if(wasOnToday) curDay=todayTab(); await changeWeek(); } }
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') checkDayChange(); });
window.addEventListener('focus',checkDayChange); setInterval(checkDayChange,60000);

/* ---------- backup ---------- */
const blobToData=b=>new Promise(r=>{ const fr=new FileReader(); fr.onload=()=>r(fr.result); fr.readAsDataURL(b); });
$('backup').onclick=async()=>{ status('Montando backup…'); const keys=await Store.imgKeys(); const imgs={}; for(const k of keys){ const b=await Store.getImg(k); if(b) imgs[k]=await blobToData(b); }
  const data={app:'placar-do-pregao',version:1,savedAt:new Date().toISOString(),roster,results:prunedResults(),imgs};
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'}), name='placar-backup-'+todayInfo().key+'.json';
  const file=new File([blob],name,{type:'application/json'});
  if(navigator.canShare&&navigator.canShare({files:[file]})&&/iPhone|iPad|Android/i.test(navigator.userAgent)){ try{ await navigator.share({files:[file]}); status('Backup pronto.'); return; }catch(e){} }
  downloadBlob(blob,name); status('Backup salvo: '+name); };
$('restore').onchange=async ev=>{ const f=ev.target.files[0]; ev.target.value=''; if(!f) return;
  try{ const data=JSON.parse(await f.text()); if(data.app!=='placar-do-pregao') throw 0;
    for(const [k,d] of Object.entries(data.imgs||{})){ const b=await (await fetch(d)).blob(); await Store.putImg(k,b); }
    roster=data.roster; results=data.results||{}; urls.clear(); await doSave(); buildWeek(); await preloadUrls(); renderAll(); preview(); status('Backup restaurado.'); }
  catch(e){ status('Esse arquivo não é um backup do Placar.',true); } };

/* ---------- instalar e atualizar ---------- */
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferredPrompt=e; $('installBtn').hidden=false; });
$('installBtn').onclick=async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice.catch(()=>{}); deferredPrompt=null; $('installBtn').hidden=true; };
window.addEventListener('appinstalled',()=>{ $('installBtn').hidden=true; });
function toast(msg,btn){ $('toastMsg').textContent=msg; $('toastBtn').hidden=!btn; $('toast').hidden=false; if(btn) $('toastBtn').onclick=btn; else setTimeout(()=>{ $('toast').hidden=true; },3500); }
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  let refreshing=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(refreshing) return; refreshing=true; location.reload(); });
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>{
    const offer=w=>toast('Nova versão do Placar disponível.',()=>{ $('toast').hidden=true; if(saveTimer){ clearTimeout(saveTimer); doSave(); } w.postMessage('skipWaiting'); });
    if(reg.waiting&&navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound',()=>{ const w=reg.installing; if(!w) return; w.addEventListener('statechange',()=>{ if(w.state==='installed'&&navigator.serviceWorker.controller) offer(w); }); });
    const check=()=>reg.update().catch(()=>{}); document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') check(); }); setInterval(check,30*60000);
  }).catch(()=>{});
}

/* ---------- início ---------- */
(async()=>{
  curDay=todayTab(); buildWeek(); renderAll();
  try{
    const [r,res]=await Promise.all([Store.get('roster'),Store.get('results')]);
    if(Array.isArray(r)&&r.length) roster=r;
    if(res&&typeof res==='object') results=res;
    if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
    setSaved('Salvo neste aparelho ✓');
  }catch(e){ setSaved('Sem salvamento neste modo',true); }
  loaded=true; buildWeek(); await preloadUrls(); renderAll(); preview();
})();
