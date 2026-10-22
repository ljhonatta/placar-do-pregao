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
      for(let k=0;k<6;k++){ g.gain.setValueAtTime(k%2?.02:.14,t+k*.05); } g.gain.linearRampToValueAtTime(0.0001,t+.5); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t+.55); },
    /* ---- variações por dia ---- */
    airy(ac,out,t,nb){ noise(ac,pan(ac,out,(Math.random()-.5)*.6),nb,t,.45,'bandpass',900,5200,.9,.3,.18); },
    paper(ac,out,t,nb){ noise(ac,pan(ac,out,(Math.random()-.5)*.5),nb,t,.28,'highpass',2800,0,.6,.22,.05); noise(ac,out,nb,t+.04,.2,'bandpass',1400,700,1.2,.14,.04); },
    softpop(ac,out,t){ tone(ac,out,t,'sine',620,310,.08,.3,.004,.16); },
    typewriter(ac,out,t,nb){ for(let k=0;k<6;k++){ const tt=t+k*.08+Math.random()*.02; V.click(ac,out,tt,nb,.22); tone(ac,out,tt,'square',180+Math.random()*40,0,0,.04,.001,.03); } tone(ac,out,t+.52,'sine',2093,0,0,.14,.002,.5); },
    chime(ac,out,t){ [1318.5,1975.5].forEach((fq,k)=>tone(ac,out,t+k*.07,'sine',fq,0,0,.18,.003,1.1)); },
    thud(ac,out,t,nb){ tone(ac,out,t,'sine',95,48,.25,.7,.004,.4); noise(ac,out,nb,t,.15,'lowpass',600,150,.7,.25,.002); },
    bassWhoosh(ac,out,t,nb){ V.whoosh(ac,out,t,nb); tone(ac,out,t+.05,'sine',220,55,.5,.45,.15,.4); },
    sub(ac,out,t,nb){ tone(ac,out,t,'sine',75,45,.2,.7,.003,.3); V.click(ac,out,t,nb,.18); },
    tick(ac,out,t){ tone(ac,out,t,'square',2400,0,0,.08,.001,.02); },
    glitch(ac,out,t){ for(let k=0;k<9;k++){ const tt=t+k*.045+Math.random()*.015; tone(ac,out,tt,k%2?'square':'sawtooth',200+Math.random()*1800,0,0,.07,.001,.025); } },
    neon(ac,out,t){ V.buzz(ac,out,t); [523.3,784,1046.5].forEach((fq,k)=>tone(ac,out,t+.06+k*.06,'triangle',fq,0,0,.16,.004,.9)); },
    slam(ac,out,t,nb){ V.impact(ac,out,t+.15,nb); noise(ac,out,nb,t,.18,'bandpass',800,3000,1,.35,.12); },
    glass(ac,out,t){ tone(ac,out,t,'sine',2400+Math.random()*300,0,0,.16,.001,.35); tone(ac,out,t,'sine',3600,0,0,.07,.001,.25); },
    stamp(ac,out,t,nb){ noise(ac,out,nb,t,.12,'lowpass',1400,300,.8,.6,.001); tone(ac,out,t,'sine',130,60,.12,.6,.002,.2); V.click(ac,out,t,nb,.3); },
    flipcard(ac,out,t,nb){ noise(ac,out,nb,t,.12,'bandpass',2500,900,1.4,.3,.03); noise(ac,out,nb,t+.18,.1,'bandpass',1800,700,1.4,.22,.02); },
    pageflip(ac,out,t,nb){ for(let k=0;k<4;k++) noise(ac,out,nb,t+k*.04,.08,'bandpass',2200-k*300,0,1.5,.18,.01); },
    pin(ac,out,t,nb){ V.click(ac,out,t,nb,.25); tone(ac,out,t,'triangle',820,0,0,.18,.002,.12); },
    pencil(ac,out,t,nb){ for(let k=0;k<6;k++) noise(ac,out,nb,t+k*.07,.05,'bandpass',3200+Math.random()*1200,0,4,.12,.008); },
    penclick(ac,out,t,nb){ V.click(ac,out,t,nb,.28); V.click(ac,out,t+.06,nb,.2); },
    techWhoosh(ac,out,t,nb){ V.whoosh(ac,out,t,nb); tone(ac,out,t,'sine',300,1400,.45,.12,.05,.45); },
    zap(ac,out,t){ tone(ac,out,t,'sawtooth',2200,180,.16,.12,.002,.18); },
    uiBlip(ac,out,t){ tone(ac,out,t,'sine',1200,1700,.05,.22,.002,.09); },
    uiTap(ac,out,t){ tone(ac,out,t,'sine',2100,0,0,.14,.001,.04); },
    uiTicks(ac,out,t){ for(let k=0;k<6;k++) tone(ac,out,t+k*.07,'sine',1600+k*80,0,0,.08,.001,.03); },
    notify(ac,out,t){ tone(ac,out,t,'sine',880,0,0,.25,.003,.35); tone(ac,out,t+.12,'sine',1318.5,0,0,.25,.003,.6); },
    drop808(ac,out,t,nb){ tone(ac,out,t,'sine',68,42,.6,1,.003,1.1); V.click(ac,out,t,nb,.3); },
    drum(ac,out,t,nb){ tone(ac,out,t,'sine',120,45,.15,1,.002,.3); noise(ac,out,nb,t+.12,.18,'bandpass',1800,0,.8,.5,.001); },
    register(ac,out,t,nb){ noise(ac,out,nb,t,.08,'bandpass',3000,0,1,.35,.002); V.click(ac,out,t+.08,nb,.3); [2093,2637].forEach((fq,k)=>tone(ac,out,t+.12+k*.05,'sine',fq,0,0,.22,.002,1)); },
    drumroll(ac,out,t,nb){ let tt=t; for(let k=0;k<26;k++){ noise(ac,out,nb,tt,.05,'bandpass',1700,0,.9,.12+k*.012,.002); tt+=.06-k*.0012; } V.drum(ac,out,tt+.02,nb); },
    fanfare(ac,out,t){ [523.3,659.3,784,1046.5].forEach((fq,k)=>tone(ac,out,t+k*.09,'triangle',fq,0,0,.16,.004,k===3?1:.4)); }
  };
  /* kit de cada dia: o mesmo momento do vídeo ganha um som com a cara daquele dia */
  const KITS={
    seg:{whoosh:'airy',swish:'paper',pop:'softpop',type:'typewriter',cash:'chime',impact:'thud',boom:'thud',zoom:'airy',buzz:'softpop'},
    ter:{whoosh:'bassWhoosh',swish:'whoosh',pop:'sub',click:'tick',type:'glitch',cash:'neon',impact:'boom',zoom:'riser'},
    qua:{pop:'glass',impact:'stamp',shimmer:'glass',swish:'flipcard'},
    qui:{whoosh:'paper',swish:'pageflip',pop:'pin',type:'pencil',click:'penclick',cash:'chime',impact:'stamp'},
    sex:{whoosh:'techWhoosh',swish:'zap',pop:'uiBlip',click:'uiTap',type:'uiTicks',cash:'notify',impact:'drop808'},
    sab:{impact:'drum',cash:'register',riser:'drumroll',shimmer:'fanfare'}
  };
  let last={key:'',buf:null};
  async function render(cues,dur,kit){ const K=KITS[kit]||{}, key=(kit||'')+dur.toFixed(2)+'|'+cues.map(q=>q.k+q.t.toFixed(2)).join(','); if(last.key===key&&last.buf) return last.buf;
    const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OAC) return null;
    const ac=new OAC(2,Math.ceil((dur+.6)*SR),SR), comp=ac.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.2;
    const m=ac.createGain(); m.gain.value=.7; m.connect(comp); comp.connect(ac.destination); const nb=noiseBuf(ac,3);
    cues.forEach(q=>{ const f=V[K[q.k]||q.k]||V[q.k]; if(f&&q.t>=0&&q.t<=dur) try{ f(ac,m,Math.max(.001,q.t),nb); }catch(e){} });
    const buf=await ac.startRendering(); last={key,buf}; return buf; }
  return {render,SR};
})();
