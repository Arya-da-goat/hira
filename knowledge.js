/* Kira local knowledge/memory store. No network access. */
(() => {
  const DB='kira-local-knowledge-v9'; let dbPromise;
  const open=()=>{if(dbPromise)return dbPromise;dbPromise=new Promise(resolve=>{if(!indexedDB)return resolve(null);const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('facts'))r.result.createObjectStore('facts');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)});return dbPromise};
  async function rememberFact(key,value,source='user'){const db=await open();if(!db)return false;await new Promise(res=>{const t=db.transaction('facts','readwrite').objectStore('facts').put({key:String(key),value:String(value),source,time:Date.now()},String(key).toLowerCase());t.onsuccess=t.onerror=()=>res()});return true}
  async function recallFacts(query,limit=8){const db=await open();if(!db)return[];const q=String(query).toLowerCase();const out=[];await new Promise(res=>{const r=db.transaction('facts','readonly').objectStore('facts').openCursor();r.onsuccess=()=>{const c=r.result;if(!c)return res();const v=c.value;if((v.key+' '+v.value).toLowerCase().includes(q))out.push(v);c.continue()}});return out.slice(-limit)}
  async function clear(){const db=await open();if(!db)return;await new Promise(res=>{const t=db.transaction('facts','readwrite').objectStore('facts').clear();t.onsuccess=t.onerror=()=>res()})}
  async function diagnostics(){return {mode:'offline',aiApis:false,remoteAI:false,networkAI:false,database:'IndexedDB',version:'v9'}}
  window.KiraKnowledge={rememberFact,recallFacts,clear,diagnostics,stats:diagnostics,retrieve:async()=>({context:'',sources:[],offline:true})};
})();
