/* Placar do Pregão — service worker.
   Funciona offline e se atualiza: o código do app é buscado na rede primeiro (cai no cache sem internet);
   fontes, fotos e ícones vêm do cache. Ao publicar uma versão nova, mude VERSION. */
const VERSION='placar-v4.1.0';
const CORE=['./','index.html','css/app.css','js/store.js','js/engine.js','js/sfx.js','js/caption.js','js/app.js','vendor/mp4-muxer.js','manifest.webmanifest',
  'assets/logo.png','assets/fonts/anton-400.woff2','assets/fonts/barlow-condensed-500.woff2','assets/fonts/barlow-condensed-600.woff2','assets/fonts/barlow-condensed-700.woff2','assets/fonts/jetbrains-mono-500.woff2','assets/fonts/jetbrains-mono-800.woff2','assets/fonts/teko-500.woff2','assets/fonts/teko-700.woff2','assets/fonts/playfair-900.woff2','assets/fonts/playfair-700-italic.woff2','assets/fonts/montserrat-500.woff2','assets/fonts/montserrat-700.woff2','assets/fonts/montserrat-900.woff2','assets/fonts/orbitron-700.woff2','assets/fonts/orbitron-900.woff2','assets/fonts/bebas-neue-400.woff2','assets/fonts/cinzel-700.woff2','assets/fonts/cinzel-900.woff2',
  'icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/favicon-64.png',
  ...Array.from({length:15},(_,k)=>'assets/avatars/s'+k+'.jpg')];

self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'}))))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('message',e=>{ if(e.data==='skipWaiting') self.skipWaiting(); });

const STATIC=/\/(assets|icons)\//;
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return; const url=new URL(req.url); if(url.origin!==location.origin) return;
  if(STATIC.test(url.pathname)){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{ if(res.ok){ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); } return res; })));
    return;
  }
  e.respondWith(fetch(req,{cache:'no-cache'}).then(res=>{ if(res.ok){ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); } return res; })
    .catch(()=>caches.match(req).then(hit=>hit||(req.mode==='navigate'?caches.match('index.html'):Response.error()))));
});
