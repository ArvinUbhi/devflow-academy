// Browser rendering and keyboard-event smoke test. Run after building devflow.jar.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const home=await mkdtemp(join(tmpdir(),'devflow-browser-'));
const child=spawn('java',[`-Duser.home=${home}`,'-jar','devflow.jar','--port=0','--no-browser'],{stdio:['ignore','pipe','pipe']});
let browser;
try{
 const url=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Server did not start')),15000);child.stdout.on('data',chunk=>{out+=chunk;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.goto(url);await page.locator('#wordtest-keyboard option').first().waitFor({state:'attached'});
 await page.locator('[data-view="wordtest"]').click();
 await mkdir('build/screenshots',{recursive:true});
 const capture=name=>page.screenshot({path:'build/screenshots/'+name+'.png',fullPage:true,animations:'disabled'});
 await capture('typing-test');
 await page.locator('[data-duration="15"]').click();await page.locator('#wordtest-start').click();
 await page.locator('#typing-capture').focus();
 const first=(await page.locator('.prompt-word').first().textContent()).trim();
 await page.keyboard.type(first[0]==='x'?'z':'x');await page.keyboard.press('Backspace');
 await page.keyboard.type(first+' ');await page.clock.fastForward(15000);
 await page.locator('#finish-analysis:not(.hidden)').waitFor();
 await page.waitForFunction(async()=>((await(await fetch('/api/state')).json())?.history||[]).length===1);
 assert.match(await page.locator('#finish-record').textContent(),/BASELINE SET/);
 assert.equal(await page.locator('#finish-word-review .corrected').count(),1);
 assert.equal(await page.locator('#finish-retry-words').isEnabled(),true);
 await capture('results');
 await page.locator('#finish-next').scrollIntoViewIfNeeded();await capture('results-detail');
 await page.locator('#finish-exit').click();await page.locator('[data-view="keyboards"]').click();
 await page.locator('#keyboard-profile').selectOption('glove80-default');
 assert.equal(await page.locator('#keyboard-map .glove-key').count(),80);
 await page.locator('[data-glove-key="38"]').click();
 assert.equal(await page.locator('#keyboard-practice').isEnabled(),true);
 await capture('glove80');
 const layout={keyboard:'glove80',title:'Browser test layout',locale:'en-US',layer_names:['Base'],layers:[Array.from({length:80},()=>({value:'&none'}))]};
 layout.layers[0][38]={value:'&kp',params:[{value:'A'}]};
 await page.locator('#keyboard-import').setInputFiles({name:'moergo.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(layout))});
 await page.locator('#keyboard-import-status').filter({hasText:'Imported Browser test layout'}).waitFor();
 await page.reload();await page.locator('#wordtest-keyboard').waitFor({state:'attached'});
 await page.locator('[data-view="keyboards"]').click();assert.match(await page.locator('#keyboard-name').textContent(),/Browser test layout/);
 // Seed clearly synthetic chart data in this isolated temporary test home, then verify layout overflow.
 await page.evaluate(async()=>{const s=await(await fetch('/api/state')).json();s.history=Array.from({length:12},(_,i)=>({...s.history[0],id:'browser-'+i,date:new Date(Date.now()-(11-i)*86400000).toISOString(),wpm:40+i,accuracy:96+i/4,profileId:'standard-us',profileName:'Standard · US QWERTY',duration:15,testMode:'time',kind:'wordtest'}));await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(s)});});
 await page.reload();await page.locator('[data-view="insights"]').click();
 await page.locator('#progress-chart svg').waitFor();
 await capture('progress');
 for(const width of [390,760]){
  await page.setViewportSize({width,height:900});await capture('progress-'+width);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,'Page overflows at '+width);
  if(width===390){
   assert.ok(await page.locator('#sidebar').evaluate(el=>el.getBoundingClientRect().right<=1),'Mobile menu must start off screen');
   await page.locator('#menu-toggle').click();await page.locator('#sidebar.open').waitFor();
   await page.locator('#menu-toggle').click();await page.locator('#sidebar:not(.open)').waitFor();
  }
 }
 assert.deepEqual(errors,[]);console.log('Browser smoke passed: timed test, results, 80-key map, JSON import/reload, progress charts, narrow widths.');
}finally{if(browser)await browser.close();child.kill('SIGTERM');await rm(home,{recursive:true,force:true});}
