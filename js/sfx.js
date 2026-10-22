/* Placar do Pregão — banco de efeitos sonoros sintetizados (sem arquivos de terceiros, sem direitos autorais).
   Estilo das referências: grave de impacto, whoosh invertido entrando na batida, riser, glitch,
   clique de câmera, brilho com eco. Tudo passa por um reverb (sala) e um compressor final.
   SFX.render(cues, dur, dia) → AudioBuffer estéreo · SFX.wav(buffer) → Blob .wav */
'use strict';
const SFX=(()=>{
  const SR=48000;
  function noiseBuf(ac,sec){ const b=ac.createBuffer(1,Math.ceil(sec*ac.sampleRate),ac.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; return b; }
  function impulse(ac,sec,decay){ const n=Math.ceil(sec*ac.sampleRate), b=ac.createBuffer(2,n,ac.sampleRate); for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); } return b; }
  function curve(k){ const n=1024, c=new Float32Array(n); for(let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }

  /* primitivas */
  function N(X,out,t,dur,type,f0,f1,q,peak,att,nb){ const {ac}=X; const s=ac.createBufferSource(); s.buffer=nb||X.nb; const f=ac.createBiquadFilter(); f.type=type; f.Q.value=q; f.frequency.setValueAtTime(f0,t); if(f1) f.frequency.exponentialRampToValueAtTime(f1,t+att+dur);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+att); g.gain.exponentialRampToValueAtTime(0.0001,t+att+dur); s.connect(f).connect(g).connect(out); s.start(t,Math.random()*2,att+dur+.05); return g; }
  function T(X,out,t,type,f0,f1,fd,peak,att,dec,drive){ const {ac}=X; const o=ac.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+fd);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(peak,t+att); g.gain.exponentialRampToValueAtTime(0.0001,t+att+dec);
    let n=o; if(drive){ const w=ac.createWaveShaper(); w.curve=curve(drive); o.connect(w); n=w; } n.connect(g).connect(out); o.start(t); o.stop(t+att+dec+.05); return o; }
  const rnd=(a,b)=>a+Math.random()*(b-a);

  /* vozes: (X, t) — X.o(wet, pan) cria uma saída com envio para o reverb */
  const V={
    whoosh(X,t){ const {ac}=X, out=X.o(.25,0), p=ac.createStereoPanner?ac.createStereoPanner():null; const tgt=p||out; if(p){ p.pan.setValueAtTime(-.7,t); p.pan.linearRampToValueAtTime(.7,t+.55); p.connect(out); }
      const s=ac.createBufferSource(); s.buffer=X.nb; const f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.1; f.frequency.setValueAtTime(320,t); f.frequency.exponentialRampToValueAtTime(2800,t+.25); f.frequency.exponentialRampToValueAtTime(500,t+.6);
      const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.7,t+.24); g.gain.exponentialRampToValueAtTime(0.0001,t+.62); s.connect(f).connect(g).connect(tgt); s.start(t,Math.random()*2,.7); },
    revWhoosh(X,t){ const {ac}=X, out=X.o(.35,0), t0=Math.max(.001,t-.65), s=ac.createBufferSource(); s.buffer=X.nb; const f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.4; f.frequency.setValueAtTime(250,t0); f.frequency.exponentialRampToValueAtTime(4200,t);
      const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(.75,t); g.gain.linearRampToValueAtTime(0,t+.05); s.connect(f).connect(g).connect(out); s.start(t0,Math.random()*2,t-t0+.1);
      T(X,out,t0,'sine',180,900,t-t0,.12,t-t0,.04); },
    swish(X,t){ N(X,X.o(.15,rnd(-.5,.5)),t,.16,'bandpass',1500,7000,1.4,.42,.05); },
    hit(X,t){ const out=X.o(.4,0); T(X,out,t,'sine',62,36,1.1,.95,.003,1.2,2.5); T(X,out,t,'sine',170,55,.12,.7,.002,.18); N(X,out,t,.4,'lowpass',2600,180,.7,.5,.002); N(X,out,t,.02,'highpass',3000,0,.7,.35,.001); },
    softHit(X,t){ const out=X.o(.3,0); T(X,out,t,'sine',90,48,.3,.6,.004,.45); N(X,out,t,.18,'lowpass',1400,200,.7,.25,.002); },
    boom(X,t){ V.revWhoosh(X,t); V.hit(X,t); },
    braam(X,t){ const {ac}=X, out=X.o(.45,0), f=ac.createBiquadFilter(); f.type='lowpass'; f.Q.value=3; f.frequency.setValueAtTime(220,t); f.frequency.exponentialRampToValueAtTime(1400,t+.25); f.frequency.exponentialRampToValueAtTime(300,t+1.4);
      const w=ac.createWaveShaper(); w.curve=curve(3); const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.35,t+.04); g.gain.exponentialRampToValueAtTime(0.0001,t+1.6); f.connect(w).connect(g).connect(out);
      [55,55.6,82.4,110.3].forEach(fq=>{ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=fq; o.connect(f); o.start(t); o.stop(t+1.7); }); V.hit(X,t); },
    drop808(X,t){ const out=X.o(.12,0); T(X,out,t,'sine',115,38,.9,1,.003,1.6,3); N(X,out,t,.02,'highpass',2500,0,.7,.3,.001); },
    riser(X,t){ const {ac}=X, out=X.o(.4,0), d=1.2, s=ac.createBufferSource(); s.buffer=X.nb; const f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=2; f.frequency.setValueAtTime(260,t); f.frequency.exponentialRampToValueAtTime(6500,t+d);
      const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(.5,t+d); g.gain.linearRampToValueAtTime(0,t+d+.05); s.connect(f).connect(g).connect(out); s.start(t,0,d+.1);
      const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(880,t+d); const lf=ac.createBiquadFilter(); lf.type='lowpass'; lf.frequency.setValueAtTime(400,t); lf.frequency.exponentialRampToValueAtTime(3000,t+d);
      const og=ac.createGain(); og.gain.setValueAtTime(0.0001,t); og.gain.exponentialRampToValueAtTime(.12,t+d); og.gain.linearRampToValueAtTime(0,t+d+.05); o.connect(lf).connect(og).connect(out); o.start(t); o.stop(t+d+.1); },
    glitch(X,t){ const out=X.o(.08,0); let tt=t; for(let k=0;k<10;k++){ const len=rnd(.018,.04), f=rnd(150,2400); if(Math.random()<.5) T(X,out,tt,Math.random()<.5?'square':'sawtooth',f,0,0,.11,.001,len); else N(X,out,tt,len,'bandpass',rnd(800,5000),0,3,.3,.001); if(Math.random()<.35){ tt+=len*.9; T(X,out,tt,'square',f,0,0,.09,.001,len); } tt+=len+rnd(0,.02); } },
    shutter(X,t){ const out=X.o(.15,0); N(X,out,t,.03,'highpass',3500,0,.7,.55,.001); N(X,out,t+.045,.05,'bandpass',2200,0,1,.4,.001); T(X,out,t,'square',140,0,0,.08,.001,.03); },
    keys(X,t,n=7){ const out=X.o(.08,rnd(-.2,.2)); for(let k=0;k<n;k++){ const tt=t+k*rnd(.055,.085); N(X,out,tt,.014,'bandpass',rnd(2400,3800),0,1.2,.28,.001); T(X,out,tt,'sine',rnd(150,210),0,0,.1,.001,.035); } },
    typewriter(X,t){ V.keys(X,t,6); T(X,X.o(.4,.2),t+.5,'sine',2093,0,0,.16,.002,.7); T(X,X.o(.4,.2),t+.5,'sine',4186,0,0,.05,.002,.4); },
    pop(X,t){ const out=X.o(.15,rnd(-.3,.3)); T(X,out,t,'sine',280,950,.035,.5,.002,.1); },
    tick(X,t){ T(X,X.o(.1,0),t,'sine',2300,0,0,.16,.001,.02); },
    blip(X,t){ T(X,X.o(.2,rnd(-.3,.3)),t,'sine',880,1500,.06,.28,.002,.1); },
    uiTicks(X,t){ for(let k=0;k<6;k++) T(X,X.o(.1,0),t+k*.07,'sine',1500+k*90,0,0,.11,.001,.03); },
    sparkle(X,t){ [1568,1760,2093,2349,2637,3136,3520,4186].forEach((fq,k)=>T(X,X.o(.6,k%2?.4:-.4),t+k*.03,'sine',fq,0,0,.07,.002,.5)); },
    shimmer(X,t){ [2637,3136,3951,4699,5274].forEach((fq,k)=>T(X,X.o(.6,k%2?.3:-.3),t+k*.035,'sine',fq,0,0,.08,.002,.7)); },
    glass(X,t){ const out=X.o(.5,rnd(-.2,.2)), f=rnd(2300,2700); T(X,out,t,'sine',f,0,0,.2,.001,.5); T(X,out,t,'sine',f*1.51,0,0,.08,.001,.35); },
    stamp(X,t){ const out=X.o(.2,0); N(X,out,t,.12,'lowpass',1500,280,.8,.65,.001); T(X,out,t,'sine',140,58,.14,.7,.002,.22,2); N(X,out,t,.02,'highpass',2500,0,.7,.3,.001); },
    paper(X,t){ const out=X.o(.12,rnd(-.3,.3)); for(let k=0;k<7;k++) N(X,out,t+rnd(0,.32),rnd(.02,.06),'highpass',rnd(1800,4000),0,.7,rnd(.12,.3),.002); N(X,out,t,.35,'bandpass',1200,600,1,.12,.08); },
    pageflip(X,t){ const out=X.o(.12,0); for(let k=0;k<4;k++) N(X,out,t+k*.045,.07,'bandpass',2400-k*320,0,1.4,.24,.008); },
    pencil(X,t){ const out=X.o(.06,0); for(let k=0;k<7;k++) N(X,out,t+k*.068,.05,'bandpass',rnd(3000,4600),0,5,.22,.008); },
    pin(X,t){ const out=X.o(.15,0); N(X,out,t,.015,'highpass',3000,0,.7,.35,.001); T(X,out,t,'triangle',820,0,0,.2,.002,.14); },
    penclick(X,t){ const out=X.o(.1,0); N(X,out,t,.012,'highpass',2800,0,.7,.35,.001); N(X,out,t+.07,.012,'highpass',2400,0,.7,.25,.001); },
    scribble(X,t){ const out=X.o(.06,0); for(let k=0;k<8;k++) N(X,out,t+k*.07,.06,'bandpass',rnd(1600,2600),0,3,.26,.01); },
    zoom(X,t){ const out=X.o(.3,0); N(X,out,t,.5,'bandpass',600,4200,2.2,.3,.28); T(X,out,t,'sine',300,1200,.6,.06,.3,.3); },
    techWhoosh(X,t){ V.whoosh(X,t); T(X,X.o(.3,0),t,'sine',260,1500,.5,.1,.08,.45); },
    zap(X,t){ T(X,X.o(.2,rnd(-.4,.4)),t,'sawtooth',2400,160,.17,.14,.002,.2); },
    cash(X,t){ const out=X.o(.35,.1); N(X,out,t,.02,'highpass',3000,0,.7,.3,.001); [2093,2637,3136].forEach((fq,k)=>{ T(X,out,t+.03+k*.04,'sine',fq,0,0,.16,.002,.9); T(X,out,t+.03+k*.04,'sine',fq*2.01,0,0,.04,.002,.4); }); },
    notify(X,t){ const out=X.o(.3,0); [[880,0],[1318.5,.12]].forEach(([fq,d])=>{ T(X,out,t+d,'sine',fq,0,0,.26,.003,.5); T(X,out,t+d,'sine',fq*3,0,0,.05,.002,.15); }); },
    neonCash(X,t){ V.buzz(X,t); [523.3,784,1046.5].forEach((fq,k)=>T(X,X.o(.45,0),t+.08+k*.07,'triangle',fq,0,0,.17,.004,1)); },
    buzz(X,t){ const {ac}=X, out=X.o(.1,0), o=ac.createOscillator(); o.type='square'; o.frequency.value=120; const f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=950; f.Q.value=2; const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t);
      for(let k=0;k<7;k++) g.gain.setValueAtTime(k%2?.02:.13,t+k*.045); g.gain.linearRampToValueAtTime(0.0001,t+.5); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t+.55); },
    drone(X,t){ const {ac}=X, out=X.o(.4,0); [55,82.5,110.4].forEach(fq=>{ const o=ac.createOscillator(); o.type='sawtooth'; o.frequency.value=fq; const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=320; const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(.08,t+.7); g.gain.linearRampToValueAtTime(.08,t+1.8); g.gain.linearRampToValueAtTime(0.0001,t+2.4); o.connect(f).connect(g).connect(out); o.start(t); o.stop(t+2.5); }); },
    tapeStop(X,t){ const out=X.o(.15,0); T(X,out,t,'sawtooth',420,35,.45,.14,.002,.5); N(X,out,t,.45,'lowpass',4000,120,.7,.2,.002); },
    shatter(X,t){ const out=X.o(.35,0); N(X,out,t,.6,'highpass',1800,0,.7,.55,.002); for(let k=0;k<16;k++) T(X,X.o(.4,rnd(-.8,.8)),t+rnd(0,.4),'sine',rnd(3000,7500),0,0,rnd(.03,.08),.001,rnd(.05,.25)); V.hit(X,t); },
    flip(X,t){ const out=X.o(.15,0); N(X,out,t,.1,'bandpass',2600,900,1.4,.35,.02); N(X,out,t+.2,.1,'bandpass',1900,700,1.4,.25,.02); },
    drum(X,t){ const out=X.o(.3,0); T(X,out,t,'sine',125,45,.15,1,.002,.32,2); N(X,out,t+.13,.2,'bandpass',1900,0,.8,.55,.001); },
    drumroll(X,t){ const out=X.o(.3,0); let tt=t; for(let k=0;k<26;k++){ N(X,out,tt,.05,'bandpass',1800,0,.9,.1+k*.013,.002); tt+=.06-k*.0012; } V.drum(X,tt+.02); },
    register(X,t){ const out=X.o(.3,0); N(X,out,t,.08,'bandpass',3200,0,1,.38,.002); N(X,out,t+.08,.015,'highpass',3000,0,.7,.3,.001); [2093,2637].forEach((fq,k)=>T(X,out,t+.12+k*.05,'sine',fq,0,0,.24,.002,1.1)); },
    fanfare(X,t){ [523.3,659.3,784,1046.5].forEach((fq,k)=>{ T(X,X.o(.5,0),t+k*.09,'triangle',fq,0,0,.16,.004,k===3?1.2:.4); T(X,X.o(.5,0),t+k*.09,'sawtooth',fq,0,0,.03,.004,k===3?1:.3); }); }
  };

  /* kit de cada dia: o mesmo momento do vídeo ganha um som com a cara daquele dia */
  const KITS={
    seg:{trans:'revWhoosh', whoosh:'whoosh', swish:'swish', pop:'pop', click:'shutter', type:'typewriter', cash:'cash', impact:'softHit', boom:'boom', shimmer:'sparkle', zoom:'zoom', riser:'riser', buzz:'pop', scribble:'pencil', drone:'riser'},
    ter:{trans:'boom', whoosh:'revWhoosh', swish:'whoosh', pop:'drop808', click:'tick', type:'glitch', cash:'neonCash', impact:'braam', boom:'boom', shimmer:'shimmer', zoom:'riser', riser:'riser', buzz:'buzz', drone:'drone', scribble:'glitch'},
    qua:{trans:'flip', whoosh:'whoosh', swish:'swish', pop:'glass', click:'shutter', type:'keys', cash:'cash', impact:'stamp', boom:'boom', shimmer:'sparkle', zoom:'zoom', riser:'riser', buzz:'glass', scribble:'pencil'},
    qui:{trans:'revWhoosh', whoosh:'paper', swish:'pageflip', pop:'pin', click:'penclick', type:'pencil', cash:'cash', impact:'stamp', boom:'boom', shimmer:'sparkle', zoom:'zoom', riser:'riser', scribble:'scribble', buzz:'pin'},
    sex:{trans:'shatter', whoosh:'techWhoosh', swish:'zap', pop:'blip', click:'tick', type:'uiTicks', cash:'notify', impact:'drop808', boom:'boom', shimmer:'sparkle', zoom:'zoom', riser:'riser', buzz:'buzz', scribble:'glitch'},
    sab:{trans:'boom', whoosh:'whoosh', swish:'swish', pop:'pop', click:'shutter', type:'typewriter', cash:'register', impact:'drum', boom:'boom', shimmer:'fanfare', zoom:'zoom', riser:'drumroll', buzz:'pop', scribble:'pencil'}
  };

  let last={key:'',buf:null};
  async function render(cues,dur,day){ const K=KITS[day]||KITS.seg, key=(day||'')+dur.toFixed(2)+'|'+cues.map(q=>q.k+q.t.toFixed(2)).join(','); if(last.key===key&&last.buf) return last.buf;
    const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OAC) return null;
    const ac=new OAC(2,Math.ceil((dur+.5)*SR),SR);
    const comp=ac.createDynamicsCompressor(); comp.threshold.value=-18; comp.knee.value=8; comp.ratio.value=5; comp.attack.value=.003; comp.release.value=.18;
    const lim=ac.createDynamicsCompressor(); lim.threshold.value=-2; lim.knee.value=0; lim.ratio.value=20; lim.attack.value=.001; lim.release.value=.05;
    const master=ac.createGain(); master.gain.value=.8; master.connect(comp); comp.connect(lim); lim.connect(ac.destination);
    const rev=ac.createConvolver(); rev.buffer=impulse(ac,2.2,3); const rg=ac.createGain(); rg.gain.value=.55; rev.connect(rg).connect(master);
    const X={ac,nb:noiseBuf(ac,3),o:(wet=.2,p=0)=>{ const g=ac.createGain(); let n=g; if(p&&ac.createStereoPanner){ const pn=ac.createStereoPanner(); pn.pan.value=p; g.connect(pn); n=pn; } n.connect(master); if(wet>0){ const w=ac.createGain(); w.gain.value=wet; n.connect(w); w.connect(rev); } return g; }};
    cues.forEach(q=>{ const name=K[q.k]||q.k, f=V[name]; if(f&&q.t>=0&&q.t<=dur) try{ f(X,Math.max(.002,q.t)); }catch(e){} });
    const buf=await ac.startRendering(); last={key,buf}; return buf; }

  /* WAV 16 bits estéreo 48 kHz — abre no CapCut, no celular e no computador */
  function wav(buf){ const n=buf.length, ch=2, L=buf.getChannelData(0), R=buf.numberOfChannels>1?buf.getChannelData(1):L, ab=new ArrayBuffer(44+n*ch*2), v=new DataView(ab);
    const w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
    w(0,'RIFF'); v.setUint32(4,36+n*ch*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,ch,true); v.setUint32(24,SR,true); v.setUint32(28,SR*ch*2,true); v.setUint16(32,ch*2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*ch*2,true);
    let o=44; for(let i=0;i<n;i++){ const a=Math.max(-1,Math.min(1,L[i])), b=Math.max(-1,Math.min(1,R[i])); v.setInt16(o,a<0?a*0x8000:a*0x7FFF,true); v.setInt16(o+2,b<0?b*0x8000:b*0x7FFF,true); o+=4; }
    return new Blob([ab],{type:'audio/wav'}); }
  return {render,wav,SR};
})();
