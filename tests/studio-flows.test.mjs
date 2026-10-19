import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=new URL('../src/main/resources/web/',import.meta.url);
async function app(initial=null){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
 const dom=new JSDOM(await readFile(new URL('index.html',root),'utf8'),{url:'http://127.0.0.1:8765',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
 const w=dom.window,d=w.document;let now=1000,saved=initial,writes=0;const timers=new Map();let nextTimer=0;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w.performance,'now',{value:()=>now});
 w.setInterval=fn=>{timers.set(++nextTimer,fn);return nextTimer;};w.clearInterval=id=>timers.delete(id);
 w.fetch=async(path,opts)=>{if(path==='/api/project')return{ok:true,json:async()=>({sessions:[],active:null})};if(opts?.method==='PUT'){writes++;saved=JSON.parse(opts.body);}return{ok:true,json:async()=>saved};};
 for(const file of ['keyboards.js','typing.js','engine.js','curriculum.js','advanced.js','coaching.js','performance-coach.js','challenge.js','experience.js','studio.js','app.js'])w.eval(await readFile(new URL(file,root),'utf8'));
 const flush=()=>new Promise(r=>setTimeout(r,10));await flush();
 const click=sel=>{const el=d.querySelector(sel);assert.ok(el,'Missing '+sel);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));};
 const change=(id,value)=>{d.getElementById(id).value=value;d.getElementById(id).dispatchEvent(new w.Event('change'));};
 const input=value=>{d.getElementById('typing-capture').value=value;d.getElementById('typing-capture').dispatchEvent(new w.Event('input',{bubbles:true}));};
 const advance=ms=>{now+=ms;for(const f of [...timers.values()])f();};
 return {w,d,dom,errors,flush,click,change,input,advance,get saved(){return saved},get writes(){return writes}};
}
test('each timed UI option starts at first character, completes on deadline and persists only once',async t=>{
 for(const seconds of [15,30,60]){
  const a=await app();t.after(()=>a.dom.window.close());a.click('[data-duration="'+seconds+'"]');a.click('#wordtest-start');
  a.advance(100000);assert.equal(a.d.getElementById('live-time').textContent,seconds+'s');
  const first=a.d.querySelector('.prompt-word').textContent;
  a.input(first[0]);a.advance(seconds*1000-1);
  assert.equal(a.d.getElementById('trainer-finish').classList.contains('hidden'),true);
  a.advance(1);await a.flush();
  assert.equal(a.saved.history.length,1);assert.equal(a.saved.history[0].seconds,seconds);assert.equal(a.saved.history[0].profileId,'standard-us');
  assert.equal(a.saved.history[0].words[0].partial,true);assert.match(a.d.getElementById('finish-record').textContent,/BASELINE SET/);
  a.input('late');a.advance(1000);await a.flush();assert.equal(a.saved.history.length,1);assert.deepEqual(a.errors,[]);
 }
});
test('restart and exit discard unfinished tests; a late key cannot sneak into a hidden-tab timeout',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());a.click('#wordtest-start');a.input('x');a.advance(3000);a.click('#restart-training');a.advance(100000);
 assert.equal(a.d.getElementById('live-time').textContent,'30s');a.click('#exit-training');await a.flush();assert.equal(a.saved?.history?.length||0,0);
 a.click('#wordtest-start');a.input('x');a.advance(31000);await a.flush();assert.equal(a.saved.history[0].attempts,1);assert.equal(a.saved.history.length,1);
 assert.deepEqual(a.errors,[]);
});
test('wrong and corrected words produce useful review and a separate missed-word drill',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());a.click('[data-duration="15"]');a.click('#wordtest-start');
 const word=a.d.querySelector('.prompt-word').textContent;a.input('!');a.input('');
 for(let i=1;i<=word.length;i++){a.advance(40);a.input(word.slice(0,i));}a.input(word+' ');
 a.advance(15000);await a.flush();
 const r=a.saved.history[0];assert.equal(r.words[0].errors,1);assert.equal(r.words[0].correct,true);
 assert.match(a.d.getElementById('finish-word-table').textContent,new RegExp(word));
 a.click('#finish-retry-words');assert.match(a.d.getElementById('training-title').textContent,/missed words/);
 a.click('#exit-training');a.click('[data-view="insights"]');assert.match(a.d.getElementById('progress-records').textContent,/15s/);
 assert.deepEqual(a.errors,[]);
});
test('imports nested MoErgo JSON, shows 80 mapped keys and persists profile across reload',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());a.click('[data-view="keyboards"]');
 const mapping={keyboard:'glove80',title:'Arvin split',locale:'en-GB',layer_names:['Colemak','Symbols'],layers:Array.from({length:2},()=>Array.from({length:80},()=>({value:'&none'})))};
 mapping.layers[0][38]={value:'&mt',params:[{value:'LCTRL'},{value:'F'}]};mapping.layers[1][38]={value:'&kp',params:[{value:'GB_AT'}]};
 const file=a.d.getElementById('keyboard-import');Object.defineProperty(file,'files',{configurable:true,value:[{size:4000,text:async()=>JSON.stringify(mapping)}]});file.dispatchEvent(new a.w.Event('change'));await a.flush();
 assert.match(a.d.getElementById('keyboard-import-status').textContent,/Imported Arvin split/);
 assert.equal(a.d.querySelectorAll('#keyboard-map .glove-key').length,80);assert.match(a.d.querySelector('[data-glove-key="38"]').textContent,/f.*Ctrl/);
 a.click('[data-glove-key="38"]');assert.equal(a.d.getElementById('keyboard-practice').disabled,false);
 a.click('#keyboard-practice');assert.equal(a.d.querySelectorAll('#virtual-keyboard .glove-key').length,80);assert.match(a.d.getElementById('next-key-label').textContent,/LH C2R4/);
 a.click('#exit-training');a.change('keyboard-layer','1');await a.flush();assert.equal(a.saved.settings.keyboardLayer,1);
 const b=await app(a.saved);t.after(()=>b.dom.window.close());assert.equal(b.d.getElementById('wordtest-keyboard').value,a.saved.keyboards[0].id);
 assert.equal(b.d.getElementById('keyboard-layer').value,'1');assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
});
test('invalid layout import leaves the active profile and previous saved layout intact',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());a.change('keyboard-profile','glove80-default');await a.flush();
 const before=JSON.stringify(a.saved.keyboards),file=a.d.getElementById('keyboard-import');
 Object.defineProperty(file,'files',{value:[{size:40,text:async()=>'{"keyboard":"go60","layers":[]}'}]});file.dispatchEvent(new a.w.Event('change'));await a.flush();
 assert.match(a.d.getElementById('keyboard-import-status').textContent,/Import failed/);assert.equal(a.saved.settings.keyboardProfile,'glove80-default');assert.equal(JSON.stringify(a.saved.keyboards),before);
});
