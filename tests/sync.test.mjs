import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),S=require('../src/main/resources/web/sync.js'),E=require('../src/main/resources/web/engine.js');
const clone=x=>JSON.parse(JSON.stringify(x));
const event=id=>({eventId:id,date:'2026-10-17T10:00:00Z',wpm:40,accuracy:97,seconds:20,id:'java-1'});
function server(){
 let state=E.defaultState(),revision=0,offline=false,gate=null;
 return {get state(){return state},set state(x){state=x;revision++},set offline(x){offline=x},set gate(x){gate=x},fetch:async(url,opts)=>{
   if(offline)throw Error('offline');
   if(opts?.method==='PUT'){
     if(gate){const wait=gate;gate=null;await wait;}
     if(opts.headers['If-Match']!==String(revision))return {ok:false,status:412};
     state=JSON.parse(opts.body);revision++;
   }
   const result=clone(state),tag=String(revision);
   return {ok:true,status:200,json:async()=>result,headers:{get:()=>tag}};
 }};
}
function client(remote,cache=new Map()){
 let state=E.defaultState(),status,reset=false;
 const api=S.create({get:()=>state,set:x=>state=x,fetch:remote.fetch,storage:{getItem:k=>cache.get(k),setItem:(k,v)=>cache.set(k,v)},status:x=>status=x,reset:()=>reset=true});
 return {api,cache,get state(){return state},get status(){return status},get reset(){return reset}};
}
test('two windows merge completed drills, weak-key increments and independent settings without losing data',async()=>{
 const remote=server(),a=client(remote),b=client(remote);await Promise.all([a.api.load(),b.api.load()]);
 a.state.history.push(event('a'));a.state.weak[';']=3;a.state.settings.name='Ada';a.state.java['java-1']={mastered:true,attempts:1,last:'2026-10-17T10:00:00Z',due:'2026-10-18T10:00:00Z'};
 b.state.history.push(event('b'));b.state.weak[';']=2;b.state.settings.goalWpm=80;b.state.java['java-1']={mastered:false,attempts:1,last:'2026-10-17T11:00:00Z',due:'2026-10-18T11:00:00Z'};
 await Promise.all([a.api.save(),b.api.save()]);
 assert.deepEqual(remote.state.history.map(x=>x.eventId).sort(),['a','b']);assert.equal(remote.state.weak[';'],5);assert.equal(remote.state.settings.name,'Ada');assert.equal(remote.state.settings.goalWpm,80);assert.equal(remote.state.java['java-1'].attempts,2);assert.equal(remote.state.java['java-1'].mastered,true);
 await a.api.refresh();await b.api.refresh();assert.equal(remote.state.weak[';'],5);assert.equal(remote.state.java['java-1'].attempts,2,'refresh must not count attempts twice');
});
test('edits made during a save survive and are persisted by the next queued save',async()=>{
 const remote=server(),a=client(remote);await a.api.load();let release;remote.gate=new Promise(r=>release=r);
 a.state.history.push(event('a'));a.state.weak.a=1;const first=a.api.save();await new Promise(r=>setTimeout(r,0));
 a.state.history.push(event('b'));a.state.weak.a++;const second=a.api.save();release();await Promise.all([first,second]);
 assert.equal(remote.state.history.length,2);assert.equal(remote.state.weak.a,2);
});
test('offline work recovers after reopening and merges with newer server progress',async()=>{
 const remote=server(),a=client(remote);await a.api.load();remote.offline=true;a.state.history.push(event('offline'));a.state.weak.x=2;assert.equal(await a.api.save(),false);assert.equal(a.status,'offline');
 remote.offline=false;const newer=E.defaultState();newer.history.push(event('other-window'));newer.weak.x=3;remote.state=newer;
 const reopened=client(remote,a.cache);await reopened.api.load();assert.equal(remote.state.history.length,2);assert.equal(remote.state.weak.x,5);assert.equal(reopened.status,'saved');
});
test('a reset is not undone by stale windows, and a reset conflict does not erase newer work',async()=>{
 const remote=server(),a=client(remote),b=client(remote);await Promise.all([a.api.load(),b.api.load()]);
 const reset=E.defaultState();reset.generation='new-reset';await a.api.save({replace:true,replacement:reset});
 b.state.history.push(event('stale'));await b.api.save();assert.equal(remote.state.history.length,0);assert.equal(b.reset,true);
 const c=client(remote);await c.api.load();a.state.history.push(event('new-work'));await a.api.save();
 const next=E.defaultState();next.generation='another-reset';assert.equal(await c.api.save({replace:true,replacement:next}),false);assert.equal(remote.state.history.length,1);assert.equal(c.status,'conflict');
});
test('unavailable browser storage does not prevent disk saves',async()=>{
 const remote=server();let state=E.defaultState();const api=S.create({get:()=>state,set:x=>state=x,fetch:remote.fetch,storage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}});
 await api.load();state.history.push(event('no-storage'));assert.equal(await api.save(),true);assert.equal(remote.state.history.length,1);
});

test('two daily finishes preserve the first accepted score and first saved answer',async()=>{
 const C=require('../src/main/resources/web/challenge.js'),remote=server(),a=client(remote),b=client(remote);
 await Promise.all([a.api.load(),b.api.load()]);
 const segments=Array.from({length:3},()=>({seconds:30,characters:60,attempts:60,errors:0,accuracy:100,wpm:24}));
 a.state.dailyDraft={key:'2026-10-17',number:17,segments,practice:false,knowledge:false};await a.api.save();
 b.state.dailyDraft={key:'2026-10-17',number:17,segments,practice:false,knowledge:true};await b.api.save();assert.equal(b.state.dailyDraft.knowledge,false);
 const first={...C.score(segments,false),key:'2026-10-17',number:17,practice:false};a.state.daily.push(first);a.state.dailyDraft=null;await a.api.save();
 b.state.daily.push({...C.score(segments,true),key:'2026-10-17',number:17,practice:false});b.state.dailyDraft=null;await b.api.save();
 assert.deepEqual(remote.state.daily,[first]);assert.equal(remote.state.dailyDraft,null);
});
