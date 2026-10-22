/* Placar do Pregão — efeitos sonoros sintetizados (nenhum arquivo de áudio, nada de direitos autorais).
   SFX.render(cues, dur) devolve um AudioBuffer estéreo com todos os efeitos nos tempos certos. */
'use strict';
const SFX=(()=>{
  const SR=48000;
  function noiseBuf(ac,sec){ const b=ac.createBuffer(1,Math.ceil(sec*ac.sampleRate),ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  function env(g,t,a,peak,d){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+d); }
  function pan(ac,out,v){ if(!ac.createStereoPanner) return out; const p=ac.createStereoPanner(); p.pan.value=v; p.connect(out); return p; }
  function noise(ac,out,nb,t,dur,type,f0,f1,q,peak,att){ const s=ac.createBufferSource(); s.buffer=nb; const f=ac.createBiquadFilter(); f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); if(f1) f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const g=ac.createGain(); env(g,t,att,peak,dur); s.connect(f).connect(g).connect(out); s.start(t,Math.random()*2,dur+att+.1); }
  function tone(ac,out,t,type,f0,f1,fd,peak,att,dec){ const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+fd); const g=ac.createGain(); env(g,t,att,peak,dec); o.connect(g).connect(out); o.start(t); o.stop(t+att+dec+.05); }
  const V={
    whoosh(ac,out,t,nb){ const o=pan(ac,out,(Math.random()-.5)*.6), s=ac.createBufferSource(); s.buffer=nb; const f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.3;
      f.frequency.setValueAtTime(280,t); f.frequency.exponentialRampToValueAtTime(2600,t+.22); f.frequency.exponentialRampToValueAtTime(450,t+.55);
      const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.6,t+.2); g.gain.exponentialRampToValueAtTime(0.0001,t+.6); s.connect(f).connect(g).connect(o); s.start(t,Math.random()*2,.7); },
    swish(ac,out,t,nb){ noise(ac,pan(ac,out,(Math.random()-.5)*.8),nb,t,.2,'bandpass',1400,6500,1.6,.32,.06); },
    pop(ac,out,t){ tone(ac,out,t,'sine',900+Math.random()*120,200,.09,.42,.003,.13); },
    click(ac,out,t,nb,v=.32){ noise(ac,out,nb,t,.025,'highpass',2600,0,.7,v,.001); },
    type(ac,out,t,nb){ for(let k=0;k<7;k++) V.click(ac,out,t+k*.07+Math.random()*.02,nb,.12+Math.random()*.1); },
    cash(ac,out,t,nb){ V.click(ac,out,t,nb,.3); [1568,2093,2637,3136].forEach((fq,k)=>tone(ac,out,t+.03+k*.045,k>1?'triangle':'sine',fq,0,0,.16,.003,.9)); },
    impact(ac,out,t,nb){ tone(ac,out,t,'sine',150,38,.45,.95,.004,.75); noise(ac,out,nb,t,.3,'lowpass',1200,200,.7,.45,.002); },
    boom(ac,out,t,nb){ V.whoosh(ac,out,t-.25,nb); tone(ac,out,t,'sine',110,30,.8,1,.005,1.1); noise(ac,out,nb,t,.5,'lowpass',900,120,.7,.5,.003); },
    riser(ac,out,t,nb){ const s=ac.createBufferSource(); s.buffer=nb; const f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=2; f.frequency.setValueAtTime(250,t); f.frequency.exponentialRampToValueAtTime(5500,t+1.1);
      const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(.45,t+1.1); g.gain.linearRampToValueAtTime(0,t+1.18); s.connect(f).connect(g).connect(out); s.start(t,0,1.25); },
    shimmer(ac,out,t){ [2637,3136,3951,4699,5274].forEach((fq,k)=>tone(ac,pan(ac,out,k%2?.3:-.3),t+k*.035,'sine',fq,0,0,.07,.002,.6)); },
    shatter(ac,out,t,nb){ noise(ac,out,nb,t,.55,'highpass',1800,0,.7,.55,.002); for(let k=0;k<12;k++) V.click(ac,pan(ac,out,(Math.random()-.5)*1.4),t+Math.random()*.35,nb,.1+Math.random()*.2); tone(ac,out,t,'sine',90,40,.3,.6,.003,.4); },
    scribble(ac,out,t,nb){ for(let k=0;k<7;k++) noise(ac,out,nb,t+k*.075,.06,'bandpass',1700+Math.random()*900,0,3,.22,.01); },
    zoom(ac,out,t,nb){ noise(ac,out,nb,t,.5,'bandpass',600,3800,2.2,.22,.25); },
    drone(ac,out,t){ [55,82.5].forEach(fq=>{ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=fq; const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=380; const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.12,t+.6); g.gain.linearRampToValueAtTime(.12,t+1.6); g.gain.linearRampToValueAtTime(0.0001,t+2.1); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t+2.2); }); },
    buzz(ac,out,t){ const o=ac.createOscillator(); o.type='square'; o.frequency.value=120; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900; f.Q.value=2; const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t);
      for(let k=0;k<6;k++){ g.gain.setValueAtTime(k%2?.02:.14,t+k*.05); } g.gain.linearRampToValueAtTime(0.0001,t+.5); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t+.55); }
  };
  let last={key:'',buf:null};
  async function render(cues,dur){ const key=dur.toFixed(2)+'|'+cues.map(q=>q.k+q.t.toFixed(2)).join(','); if(last.key===key&&last.buf) return last.buf;
    const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OAC) return null;
    const ac=new OAC(2,Math.ceil((dur+.6)*SR),SR), comp=ac.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.2;
    const m=ac.createGain(); m.gain.value=.7; m.connect(comp); comp.connect(ac.destination); const nb=noiseBuf(ac,3);
    cues.forEach(q=>{ const f=V[q.k]; if(f&&q.t>=0&&q.t<=dur) try{ f(ac,m,Math.max(.001,q.t),nb); }catch(e){} });
    const buf=await ac.startRendering(); last={key,buf}; return buf; }
  return {render,SR};
})();
