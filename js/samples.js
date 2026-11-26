/* Placar do Pregão — efeitos sonoros reais (enviados pela marca): impactos nas transições, caixa registradora nos resultados
   e notificação nos destaques. Cada som entra com o pico exatamente no momento da imagem. */
'use strict';
const SAMP={def:{impacto1:{p:.12,g:.95},impacto2:{p:.42,g:.7},impacto3:{p:.14,g:.85},impacto4:{p:.16,g:.8},caixa:{p:.16,g:.95},notificacao:{p:.04,g:.55}},buf:{},ready:false,loading:null};
function loadSamples(){ if(SAMP.loading) return SAMP.loading;
  SAMP.loading=(async()=>{ await Promise.all(Object.keys(SAMP.def).map(async n=>{ try{ const r=await fetch('assets/sfx/'+n+'.mp3'); if(r.ok) SAMP.buf[n]=await decodeTrack(await r.blob()); }catch(e){} }));
    SAMP.ready=!!(SAMP.buf.caixa&&(SAMP.buf.impacto1||SAMP.buf.impacto3)); return SAMP.ready; })(); return SAMP.loading; }
/* corte da transição: a troca de cena acontece no meio do movimento (TR=.8 s, ease in-out) */
const HIT_TR=.36;
function samplePlan(cues,outroAt){ const out=[], imp=['impacto1','impacto3','impacto4','impacto2'].filter(n=>SAMP.buf[n]); let ki=0, lastCash=-9, lastNot=-9;
  const sorted=cues.slice().sort((a,b)=>a.t-b.t), busy=t=>out.some(o=>Math.abs(o.hit-t)<.5);
  sorted.forEach(q=>{ if(q.k==='trans'&&imp.length){ if(outroAt!=null&&Math.abs(q.t-outroAt)<.05) return; out.push({n:imp[ki++%imp.length],hit:q.t+HIT_TR}); } });
  sorted.forEach(q=>{ if(q.k==='cash'&&SAMP.buf.caixa&&q.t-lastCash>=1.2&&!(outroAt!=null&&q.t>=outroAt)){ lastCash=q.t; out.push({n:'caixa',hit:q.t}); } });
  sorted.forEach(q=>{ if(q.k==='pop'&&SAMP.buf.notificacao&&q.t-lastNot>=1.5&&!busy(q.t)&&!(outroAt!=null&&q.t>=outroAt)){ lastNot=q.t; out.push({n:'notificacao',hit:q.t}); } });
  return out.map(o=>Object.assign(o,{at:Math.max(0,o.hit-SAMP.def[o.n].p),g:SAMP.def[o.n].g})).sort((a,b)=>a.at-b.at); }
