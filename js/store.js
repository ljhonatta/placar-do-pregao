/* Placar do Pregão — armazenamento no aparelho (IndexedDB).
   kv: dados (turma, resultados, preferências) · img: imagens (prints e fotos) como Blob. */
'use strict';
const Store=(()=>{
  let dbp=null;
  function open(){
    if(dbp) return dbp;
    dbp=new Promise((res,rej)=>{
      const r=indexedDB.open('placar-do-pregao',1);
      r.onupgradeneeded=()=>{ const db=r.result; if(!db.objectStoreNames.contains('kv')) db.createObjectStore('kv'); if(!db.objectStoreNames.contains('img')) db.createObjectStore('img'); };
      r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
    });
    return dbp;
  }
  async function tx(store,mode,fn){ const db=await open(); return new Promise((res,rej)=>{ const t=db.transaction(store,mode); const s=t.objectStore(store); let out; const r=fn(s); if(r) r.onsuccess=()=>{ out=r.result; }; t.oncomplete=()=>res(out); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error); }); }
  return {
    get:k=>tx('kv','readonly',s=>s.get(k)),
    set:(k,v)=>tx('kv','readwrite',s=>s.put(v,k)),
    getImg:k=>tx('img','readonly',s=>s.get(k)),
    putImg:(k,blob)=>tx('img','readwrite',s=>s.put(blob,k)),
    delImg:k=>tx('img','readwrite',s=>s.delete(k)),
    imgKeys:()=>tx('img','readonly',s=>s.getAllKeys()),
    available:()=>typeof indexedDB!=='undefined'
  };
})();
