import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=new URL('../src/main/resources/web/',import.meta.url);
async function app(initial=null,clipboard=true){
 const errors=[],virtual=new VirtualConsole();virtual.on('jsdomError',e=>{if(!e.message.includes('Not implemented: window.scrollTo'))errors.push(e);});
 const dom=new JSDOM(await readFile(new URL('index.html',root),'utf8'),{url:'http://127.0.0.1:8765',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:virtual});
 const w=dom.window;let saved=initial,copied=null,time=10000;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 Object.defineProperty(w.performance,'now',{value:()=>{time+=250;return time;}});
 w.fetch=async(path,opts)=>{
  if(path==='/api/project')return {ok:true,json:async()=>({active:null,sessions:[]})};
  if(opts?.method==='PUT'){saved=JSON.parse(opts.body);return{ok:true,json:async()=>({saved:true})};}
  return{ok:true,json:async()=>saved};
 };
 if(clipboard)Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async x=>{copied=x;}}});
 for(const file of ['engine.js','curriculum.js','advanced.js','coaching.js','performance-coach.js','challenge.js','experience.js','app.js'])w.eval(await readFile(new URL(file,root),'utf8'));
 await new Promise(r=>setTimeout(r,10));
 const click=sel=>{const el=w.document.querySelector(sel);assert.ok(el,`Missing ${sel}`);el.click();return el;};
 const finishTyping=()=>{
  const input=w.document.getElementById('typing-capture');const target=w.document.getElementById('typing-prompt').textContent;
  // Real input events, one character at a time. The virtual clock gives reproducible measured pace.
  for(const char of target){input.value+=char;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
 };
 const tick=()=>new Promise(r=>setTimeout(r,10));
 return {w,dom,errors,click,finishTyping,tick,get saved(){return saved},get copied(){return copied}};
}
test('daily runs three rounds, checks understanding, shares, locks the first score and resumes after reload',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());
 a.click('[data-view="daily"]');a.click('[data-flow="daily-start"]');
 a.finishTyping();a.click('#finish-next');await a.tick();
 assert.equal(a.saved.dailyDraft.segments.length,1);
 // Simulate quitting and reopening after one stage; should resume the second round.
 const b=await app(a.saved);t.after(()=>b.dom.window.close());
 b.click('[data-view="daily"]');b.click('[data-flow="daily-start"]');
 assert.match(b.w.document.getElementById('trainer-eyebrow').textContent,/ROUND 2 OF 3/);
 b.finishTyping();b.click('#finish-next');b.finishTyping();b.click('#finish-next');
 const daily=b.w.DevFlowChallenge.daily();
 b.click(`[data-answer="${daily.lesson.question.answer}"]`);b.click('[data-flow="finish-learning"]');await b.tick();
 assert.match(b.w.document.getElementById('finish-title').textContent,/1000/);
 assert.equal(b.saved.daily.length,1);assert.equal(b.saved.daily[0].knowledge,true);assert.equal(b.saved.dailyDraft,null);
 b.click('#share-result');await b.tick();assert.match(b.copied,/local result/);assert.doesNotMatch(b.copied,/System.out/);
 const original=JSON.stringify(b.saved.daily[0]);b.click('#finish-next');b.click('[data-flow="daily-start"]');
 for(let i=0;i<3;i++){b.finishTyping();b.click('#finish-next');}
 b.click(`[data-answer="${(daily.lesson.question.answer+1)%3}"]`);b.click('[data-flow="finish-learning"]');await b.tick();
 assert.equal(b.saved.daily.length,1);assert.equal(JSON.stringify(b.saved.daily[0]),original);
 assert.match(b.w.document.getElementById('finish-eyebrow').textContent,/PRACTICE/);
 assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
});
test('Java path teaches first, requires recall, explains mistakes and schedules review',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());
 a.click('[data-view="java"]');a.click('[data-flow="java-open"][data-id="java-1"]');
 assert.match(a.w.document.getElementById('trainer-learning').textContent,/semicolon/);
 a.click('[data-flow="java-type"]');a.finishTyping();a.click('#finish-next');
 assert.equal(a.w.document.getElementById('editor-input').value,'');
 const input=a.w.document.getElementById('editor-input');
 input.value='System.out.println("Ready");';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));a.click('#check-edit');
 a.click('[data-answer="0"]');a.click('[data-flow="finish-learning"]');await a.tick();
 assert.equal(a.saved.java['java-1'].mastered,true);assert.ok(Date.parse(a.saved.java['java-1'].due)>Date.now());
 // A hint helps learning, but cannot award unassisted mastery.
 a.click('[data-flow="java-open"][data-id="java-2"]');a.click('[data-flow="java-type"]');a.finishTyping();a.click('#finish-next');a.click('[data-flow="hint"]');
 input.value='int score = 10;';input.dispatchEvent(new a.w.Event('input',{bubbles:true}));a.click('#check-edit');a.click('[data-answer="1"]');a.click('[data-flow="finish-learning"]');await a.tick();
 assert.equal(a.saved.java['java-2'].mastered,false);await a.tick();assert.deepEqual(a.errors,[]);
});
test('sharing works without browser clipboard access and restores focus',async t=>{
 const a=await app(null,false);t.after(()=>a.dom.window.close());
 a.click('[data-view="daily"]');a.click('[data-flow="daily-start"]');
 for(let i=0;i<3;i++){a.finishTyping();a.click('#finish-next');}
 a.click('[data-answer="0"]');a.click('[data-flow="finish-learning"]');a.click('#share-result');
 assert.equal(a.w.document.getElementById('share-dialog').classList.contains('hidden'),false);
 assert.match(a.w.document.getElementById('share-text').value,/devflow/);
 a.click('#close-share');assert.equal(a.w.document.getElementById('share-dialog').classList.contains('hidden'),true);
 await a.tick();assert.deepEqual(a.errors,[]);
});
test('a daily Java first answer survives reload and cannot be changed',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());a.click('[data-flow="daily-start"]');
 for(let i=0;i<3;i++){a.finishTyping();a.click('#finish-next');}
 const answer=a.w.DevFlowChallenge.daily().lesson.question.answer;
 a.click(`[data-answer="${(answer+1)%3}"]`);await a.tick();
 assert.equal(a.saved.dailyDraft.knowledge,false);
 const b=await app(a.saved);t.after(()=>b.dom.window.close());b.click('[data-flow="daily-start"]');
 assert.equal(b.w.document.querySelectorAll('[data-answer]').length,0);
 b.click('[data-flow="finish-learning"]');await b.tick();
 assert.equal(b.saved.daily[0].knowledge,false);
});

test('random-word test supports fresh prompts, blur focus and Caps Lock warning',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());
 a.click('[data-view="wordtest"]');
 const d=a.w.document;
 const preview=d.getElementById('wordtest-preview');
 const original=preview.textContent;
 assert.equal(original.split(' ').length,50);
 a.click('#wordtest-refresh');
 assert.notEqual(preview.textContent,original);
 a.click('#wordtest-start');
 const typing=d.getElementById('typing-capture');
 assert.equal(d.getElementById('training-title').textContent,'Random words');
 a.click('#blur-toggle');
 assert.equal(d.getElementById('blur-toggle').getAttribute('aria-pressed'),'true');
 const target=d.getElementById('typing-prompt').textContent;
 const firstSpace=target.indexOf(' ');
 for(const ch of target.slice(0,firstSpace+1)){typing.value+=ch;typing.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
 assert.ok(d.querySelector('.prompt-blurred'));
 const capsOn=new a.w.KeyboardEvent('keydown',{key:'a'});
 Object.defineProperty(capsOn,'getModifierState',{value:()=>true});
 typing.dispatchEvent(capsOn);
 assert.equal(d.getElementById('caps-lock-warning').classList.contains('hidden'),false);
 const capsOff=new a.w.KeyboardEvent('keyup',{key:'a'});
 Object.defineProperty(capsOff,'getModifierState',{value:()=>false});
 typing.dispatchEvent(capsOff);
 assert.equal(d.getElementById('caps-lock-warning').classList.contains('hidden'),true);
 for(const ch of target.slice(firstSpace+1)){typing.value+=ch;typing.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
 await a.tick();
 assert.equal(a.saved.history.at(-1).kind,'wordtest');
 assert.equal(a.saved.settings.blurCompleted,true);
 assert.deepEqual(a.errors,[]);
});
test('advanced Java lessons appear before foundation refreshers and support fresh scenarios',async t=>{
 const a=await app();t.after(()=>a.dom.window.close());
 a.click('[data-view="java"]');
 const grid=a.w.document.getElementById('advanced-grid');
 assert.match(grid.textContent,/Strategy/);
 assert.match(grid.textContent,/Allocation-aware/);
 a.click('[data-flow="java-open"][data-id="java-34"]');
 const snippet=a.w.document.getElementById('trainer-learning').textContent;
 assert.match(snippet,/ring buffer/i);
 assert.match(snippet,/prealloc|memory ordering|backpressure/i);
 assert.deepEqual(a.errors,[]);
});
