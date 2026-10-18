import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const E = require('../src/main/resources/web/engine.js');

test('UI initialises and a three-part daily training session advances', async () => {
  const html = await readFile(new URL('../src/main/resources/web/index.html',import.meta.url),'utf8');
  const code = await readFile(new URL('../src/main/resources/web/app.js',import.meta.url),'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  const nodes=new Map();
  const docListeners={};
  const node=id=>{
    if(!ids.has(id))return null;
    if(!nodes.has(id)){
      const classes=new Set(id==='training-overlay'?['hidden']:[]);
      nodes.set(id,{
        id,value:'',textContent:'',innerHTML:'',style:{},dataset:{},checked:true,
        classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,force)=>{if(force===undefined? !classes.has(x):force)classes.add(x);else classes.delete(x);}},
        listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(name,value){this[name]=value;},focus(){},blur(){},
        closest(){return null;},querySelectorAll(){return [];}
      });
    }
    return nodes.get(id);
  };
  let saved=null;
  const context={
    window:{DevFlowEngine:E,DevFlowJava:require('../src/main/resources/web/curriculum.js'),DevFlowAdvanced:require('../src/main/resources/web/advanced.js'),DevFlowChallenge:require('../src/main/resources/web/challenge.js'),scrollTo(){}},
    document:{getElementById:node,querySelector(){return null;},querySelectorAll(){return [];},addEventListener(type,fn){(docListeners[type]??=[]).push(fn);}},
    fetch:async(path,opts)=>path==='/api/state'&&(!opts||opts.method!=='PUT')?{ok:true,json:async()=>null}:{ok:true,json:async()=>({saved:true})},
    localStorage:{setItem(k,v){saved=v},getItem(){return saved}},
    navigator:{serviceWorker:{register:async()=>{}}},
    performance:{now:()=>150000},
    setInterval:()=>1,clearInterval(){},setTimeout:()=>1,clearTimeout(){},
    confirm:()=>true,console,Date,Math,Number,Array,Object,String,JSON,URL,Blob,Event
  };
  vm.runInNewContext(await readFile(new URL('../src/main/resources/web/experience.js',import.meta.url),'utf8'),context,{filename:'experience.js'});
  vm.runInNewContext(code,context,{filename:'app.js'});
  await new Promise(resolve=>setTimeout(resolve,5));
  assert.match(node('lesson-grid').innerHTML,/Meet your home row/);
  assert.match(node('lab-grid').innerHTML,/Java/);
  assert.match(node('editor-grid').innerHTML,/Fix a comparison/);
  node('start-daily').listeners.click();
  assert.equal(node('training-overlay').classList.contains('hidden'),false);
  assert.equal(node('trainer-typing').classList.contains('hidden'),false);
  assert.match(node('training-title').textContent,/home row/i);
  const keystrokeEvent={target:node('typing-capture')};
  // Space and Enter must not be prevented by the parent focus handler.
  for (const key of ['Enter',' ']){
    let prevented=false;
    node('typing-card').listeners.keydown({key,target:node('typing-capture'),currentTarget:node('typing-card'),preventDefault(){prevented=true;}});
    assert.equal(prevented,false,`${key} should reach the textarea`);
  }
  // Finish each part by delivering the exact prompt into the input (simulating a completed transcription).
  for(let step=0;step<3;step++){
    const rendered=node('typing-prompt').innerHTML;
    const target=[...rendered.matchAll(/<span class="[^"]+">([\s\S]*?)<\/span>/g)].map(m=>m[1].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'" )).join('');
    assert.ok(target.length>30);
    node('typing-capture').value=target;
    node('typing-capture').listeners.input({target:node('typing-capture')});
    assert.equal(node('trainer-finish').classList.contains('hidden'),false);
    node('finish-next').listeners.click();
  }
  assert.equal(node('training-overlay').classList.contains('hidden'),true);
  assert.match(node('mastered-count').textContent,/1 \/ 16/);
});
