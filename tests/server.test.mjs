import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

async function launch(home) {
 const child=spawn('java',[`-Duser.home=${home}`,'-jar','devflow.jar','--port=0','--no-browser'],{cwd:new URL('..',import.meta.url),stdio:['ignore','pipe','pipe']});
 let output='';
 const port=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('Server start timed out: '+output)),10000);
  child.stdout.on('data',chunk=>{output+=chunk.toString();const match=output.match(/127\.0\.0\.1:(\d+)/);if(match){clearTimeout(timer);resolve(Number(match[1]));}});
  child.on('error',reject);
  child.on('exit',code=>reject(Error('Server exited with '+code+': '+output)));
 });
 return {child,url:`http://127.0.0.1:${port}`};
}
test('standalone jar serves UI, health and persists state safely',async t=>{
 const home=await mkdtemp(join(tmpdir(),'devflow-test-'));
 const {child,url}=await launch(home);
 t.after(async()=>{child.kill('SIGTERM');await rm(home,{recursive:true,force:true});});
 const health=await fetch(url+'/api/health'); assert.equal(health.status,200);const healthInfo=await health.json();assert.equal(healthInfo.ok,true);assert.equal(healthInfo.version,'2.1.0');
 for(const file of ['app.js','engine.js','curriculum.js','advanced.js','coaching.js','performance-coach.js','challenge.js','experience.js','styles.css']){
  const served=await fetch(url+'/'+file);assert.equal(served.status,200,file);
  assert.equal(await served.text(),await readFile(new URL('../src/main/resources/web/'+file,import.meta.url),'utf8'),'bundled resource must match source: '+file);
 }
 const ui=await fetch(url+'/');assert.equal(ui.status,200);assert.match(await ui.text(),/Developer Typing Academy/);
 const engine=await fetch(url+'/engine.js');assert.equal(engine.status,200);assert.match(await engine.text(),/segmentHandicap/);
 assert.equal((await (await fetch(url+'/api/state')).text()),'null');
 const state={version:1,settings:{name:'Test'},history:[]};
 const saved=await fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
 assert.equal(saved.status,200);
 assert.deepEqual(await (await fetch(url+'/api/state')).json(),state);
 assert.deepEqual(JSON.parse(await readFile(join(home,'.devflow','progress.json'),'utf8')),state);
 const invalid=await fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'text/plain'},body:'hi'});assert.equal(invalid.status,415);
 const outside=await fetch(url+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json','Origin':'https://evil.example'},body:'{}'});assert.equal(outside.status,403);
 const missing=await fetch(url+'/../../secret');assert.equal(missing.status,404);
});
