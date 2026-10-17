import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,cp,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import {once} from 'node:events';
const root=new URL('..',import.meta.url);
async function port(){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const value=server.address().port;await new Promise(r=>server.close(r));return value;}
function child(args,options){
 // Windows cannot deliver POSIX SIGTERM to Node; a test-only IPC wrapper asks
 // the real launcher to run its normal shutdown handler before the test exits.
 let command=args,stdio=['ignore','pipe','pipe'];
 if(process.platform==='win32'){
  const cwd=options.cwd instanceof URL?fileURLToPath(options.cwd):options.cwd;
  const file=resolve(cwd,args[0]);
  command=['-e',`process.on('message',m=>{if(m==='stop')process.emit('SIGTERM')});process.channel.unref();process.argv=${JSON.stringify([process.execPath,file,...args.slice(1)])};require(${JSON.stringify(file)});`];
  stdio.push('ipc');
 }
 const p=spawn(process.execPath,command,{...options,stdio});let output='';p.stdout.on('data',x=>output+=x);p.stderr.on('data',x=>output+=x);p.finished=once(p,'exit');p.output=()=>output;
 p.stop=()=>{if(p.exitCode!==null)return;if(process.platform==='win32')p.send('stop');else p.kill('SIGTERM');};return p;
}
async function waitFor(p,match){for(let i=0;i<200;i++){if(match.test(p.output()))return;if(p.exitCode!==null)break;await new Promise(r=>setTimeout(r,50));}throw Error('Launcher did not become ready: '+p.output());}
test('downloaded folder launches offline with one command, opens UI after readiness, and reuses the server',async t=>{
 const home=await mkdtemp(join(tmpdir(),'devflow-launch-')),folder=join(home,'download with spaces');await mkdir(folder);
 for(const file of ['start.cjs','package.json','devflow.jar','scripts/launcher.cjs']){const destination=join(folder,file);await mkdir(join(destination,'..'),{recursive:true});await cp(new URL(file,root),destination);}
 const store=join(home,'progress'),p=await port(),env={...process.env,DEVFLOW_HOME:store,DEVFLOW_PORT:String(p)};
 // Linux smoke test excludes Git/npm from PATH and supplies a browser-opener stand-in.
 const marker=join(home,'opened.txt');
 if(process.platform==='linux'){
  const bin=join(home,'bin');await mkdir(bin);
  const java=execFileSync('sh',['-c','command -v java'],{encoding:'utf8'}).trim();await symlink(java,join(bin,'java'));
  await writeFile(join(bin,'xdg-open'),`#!${process.execPath}\nconst fs=require('node:fs');fetch(process.argv[2]+'/api/health').then(r=>{if(!r.ok)process.exit(1);fs.appendFileSync(process.env.DEVFLOW_TEST_MARKER,process.argv[2]+'\\n');});\n`,{mode:0o755});
  env.PATH=bin;env.DEVFLOW_TEST_MARKER=marker;
 }
 const noBrowser=process.platform==='linux'?[]:['--no-browser'];
 const first=child([join(folder,'start.cjs'),...noBrowser],{cwd:home,env});
 t.after(async()=>{first.stop();const [code]=await first.finished;assert.equal(code,0,first.output());await rm(home,{recursive:true,force:true});});
 await waitFor(first,/DevFlow is ready/);
 assert.equal((await (await fetch(`http://127.0.0.1:${p}/api/health`)).json()).version,'2.1.0');
 const second=child([join(folder,'start.cjs'),'--no-browser'],{cwd:home,env});const [code]=await second.finished;
 assert.equal(code,0,second.output());assert.match(second.output(),/already running/);assert.equal(first.exitCode,null);
 if(process.platform==='linux'){
  for(let i=0;i<100;i++){if(await readFile(marker,'utf8').catch(()=>''))break;await new Promise(r=>setTimeout(r,30));}
  assert.equal(await readFile(marker,'utf8'),`http://127.0.0.1:${p}\n`,'browser opened once, after health check');
 }
});
test('invalid arguments and busy explicit ports produce clear failures',async()=>{
 const bad=child(['start.cjs','--port=70000'],{cwd:root});assert.equal((await bad.finished)[0],1);assert.match(bad.output(),/Port must be between/);
 const server=createServer(socket=>socket.destroy());await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{const busy=child(['start.cjs','--port='+server.address().port,'--no-browser'],{cwd:root});assert.equal((await busy.finished)[0],1);assert.match(busy.output(),/port is busy/i);}finally{await new Promise(r=>server.close(r));}
});
test('missing Java reports the requirement without an unhandled child-process error',async t=>{
 const home=await mkdtemp(join(tmpdir(),'devflow-no-java-'));t.after(()=>rm(home,{recursive:true,force:true}));
 const p=await port(),proc=child(['start.cjs','--no-browser','--port='+p],{cwd:root,env:{...process.env,PATH:home}});
 assert.equal((await proc.finished)[0],1);assert.match(proc.output(),/Java 8\+ must be on PATH/);assert.doesNotMatch(proc.output(),/Unhandled/);
});
