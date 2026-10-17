/* Optimistic persistence: merge only changes since this window's last saved state. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.DevFlowSync = factory(root.DevFlowEngine);
})(typeof globalThis !== 'undefined' ? globalThis : this, function(E) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
  const identity = record => record.eventId || JSON.stringify(record);
  function additions(base, local, remote) {
    const known = new Set(base.map(identity)), seen = new Set(remote.map(identity));
    return [...remote, ...local.filter(x => !known.has(identity(x)) && !seen.has(identity(x)))].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  }
  function merge(base, local, remote) {
    base=E.sanitizeState(base);local=E.sanitizeState(local);remote=E.sanitizeState(remote);
    if(remote.generation!==base.generation)return copy(remote);
    if(local.generation!==base.generation)return copy(local);
    const out=copy(remote);
    for(const key of Object.keys(local.settings))if(!equal(local.settings[key],base.settings[key]))out.settings[key]=local.settings[key];
    out.history=additions(base.history,local.history,remote.history);
    out.rounds=additions(base.rounds,local.rounds,remote.rounds);
    out.mastered={...remote.mastered,...local.mastered};
    for(const [key,value] of Object.entries(local.weak))out.weak[key]=(remote.weak[key]||0)+Math.max(0,value-(base.weak[key]||0));
    for(const [id,value] of Object.entries(local.java)) {
      const previous=base.java[id]||{attempts:0},other=remote.java[id];
      if(equal(value,previous))continue;
      const latest=!other||String(value.last)>String(other.last)?value:other;
      out.java[id]={...latest,mastered:value.mastered||other?.mastered||false,attempts:(other?.attempts||0)+Math.max(0,value.attempts-previous.attempts)};
    }
    // The first server-accepted daily score is immutable, even across windows.
    const days=new Set(remote.daily.map(x=>x.key));
    out.daily=[...remote.daily,...local.daily.filter(x=>!days.has(x.key))].sort((a,b)=>a.key.localeCompare(b.key));
    const a=local.dailyDraft,b=remote.dailyDraft;
    if(equal(b,base.dailyDraft))out.dailyDraft=copy(a);
    else if(!equal(a,base.dailyDraft)&&a) {
      if(!b||a.key>b.key)out.dailyDraft=copy(a);
      else if(a.key===b.key) {
        out.dailyDraft=copy(a.segments.length>b.segments.length?a:b);
        if(typeof b.knowledge==='boolean')out.dailyDraft.knowledge=b.knowledge;
        else if(typeof a.knowledge==='boolean')out.dailyDraft.knowledge=a.knowledge;
      }
    }
    if(out.dailyDraft&&!out.dailyDraft.practice&&out.daily.some(x=>x.key===out.dailyDraft.key))out.dailyDraft=null;
    return E.sanitizeState(out);
  }
  function create({get,set,fetch,storage,status=()=>{},updated=()=>{},reset=()=>{}}) {
    let base=E.defaultState(),etag=null,queue=Promise.resolve();
    const cached=key=>{try{return JSON.parse(storage.getItem(key));}catch{return null;}};
    function backup(pending) {
      try {
        storage.setItem('devflow-fallback',JSON.stringify(get()));
        storage.setItem('devflow-pending',JSON.stringify({base,state:get(),pending}));
      } catch { /* Disk persistence still works when browser storage is disabled. */ }
    }
    async function read() {
      const response=await fetch('/api/state');
      if(!response.ok)throw Error('Progress unavailable');
      return {state:E.sanitizeState(await response.json()),etag:response.headers?.get('ETag')||null};
    }
    async function load() {
      const pending=cached('devflow-pending');
      try {
        const remote=await read();base=remote.state;etag=remote.etag;
        set(pending?.pending?merge(pending.base,pending.state,base):copy(base));
        if(pending?.pending)await save();else {backup(false);status('saved');}
      } catch {
        base=E.sanitizeState(pending?.base);set(E.sanitizeState(pending?.state||cached('devflow-fallback')));status('offline');
      }
    }
    function save({replace=false,replacement=null}={}) {
      backup(true);status('saving');
      queue=queue.catch(()=>{}).then(async()=>{
        if(replacement)set(E.sanitizeState(replacement));
        const snapshot=E.sanitizeState(get()),ancestor=copy(base);
        let candidate=copy(snapshot),remote=copy(base);
        try {
          for(let attempt=0;attempt<6;attempt++) {
            if(!etag) {
              const fresh=await read();remote=fresh.state;etag=fresh.etag;
              if(replace&&!equal(remote,ancestor)){base=remote;set(copy(remote));backup(false);status('conflict');updated();return false;}
              candidate=replace?copy(snapshot):merge(ancestor,snapshot,remote);
            }
            if(remote.generation!==ancestor.generation&&!replace) {
              base=remote;set(copy(remote));backup(false);status('saved');reset();updated();return true;
            }
            const response=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json',...(etag?{'If-Match':etag}:{})},body:JSON.stringify(candidate)});
            if(response.status===412) {
              const fresh=await read();remote=fresh.state;etag=fresh.etag;
              if(replace) {base=remote;set(copy(remote));backup(false);status('conflict');updated();return false;}
              candidate=merge(ancestor,snapshot,remote);continue;
            }
            if(!response.ok)throw Error('Save unavailable');
            etag=response.headers?.get('ETag')||null;base=copy(candidate);
            set(merge(snapshot,get(),candidate));backup(!equal(get(),base));status('saved');updated();return true;
          }
          throw Error('Progress is busy');
        } catch {backup(true);status('offline');return false;}
      });
      return queue;
    }
    function refresh() {return save();}
    return {load,save,refresh};
  }
  return {merge,create};
});
