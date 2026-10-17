import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';

const root = new URL('..', import.meta.url);
async function openPort(){const s=createServer();await new Promise(resolve=>s.listen(0,'127.0.0.1',resolve));const p=s.address().port;await new Promise(resolve=>s.close(resolve));return p;}
function command(args,env,cwd){const result=spawnSync(process.execPath,['scripts/cli.cjs',...args],{cwd,env,encoding:'utf8',timeout:17000});assert.equal(result.status,0,`command failed: ${args.join(' ')}: ${result.stderr} ${result.stdout}`);return result.stdout.trim();}

test('CLI links Git repo, starts background Java, persists metrics, stops and shows history',async t=>{
 const home=await mkdtemp(join(tmpdir(),'devflow-cli-'));
 const repo=join(home,'test-project');await mkdir(repo);
 const git=spawnSync('git',['init',repo],{encoding:'utf8'});assert.equal(git.status,0);
 const port=await openPort();const env={...process.env,DEVFLOW_HOME:join(home,'store'),DEVFLOW_PORT:String(port)};
 t.after(async()=>{
  const active=await readFile(join(home,'store','active-session.json'),'utf8').catch(()=>null);
  if(active){try{process.kill(JSON.parse(active).pid,'SIGTERM')}catch{}}
  await rm(home,{recursive:true,force:true});
 });
 const linked=command(['init','--repo',repo],env,root.pathname);assert.match(linked,/Linked repository/);
 const started=command(['start','--no-browser'],env,root.pathname);assert.match(started,/Repo session started/);
 const active=JSON.parse(await readFile(join(home,'store','active-session.json'),'utf8'));
 assert.equal(active.repo.name,'test-project');
 const response=await fetch(`http://127.0.0.1:${port}/api/project`);
 assert.equal(response.status,200);assert.equal((await response.json()).active.id,active.id);
 await writeFile(join(home,'store','progress.json'),JSON.stringify({version:1,history:[
  {sessionId:active.id,project:'test-project',wpm:49.5,accuracy:97,seconds:32},
  {sessionId:active.id,project:'test-project',wpm:51.5,accuracy:99,seconds:29},
  {sessionId:'other',wpm:100,accuracy:10,seconds:10}
 ]}));
 const status=JSON.parse(command(['status','--json'],env,root.pathname));
 assert.equal(status.drills,2);assert.equal(status.wpm,50.5);assert.equal(status.accuracy,98);assert.equal(status.seconds,61);
 const stopped=command(['stop'],env,root.pathname);assert.match(stopped,/Session stopped/);
 const sessions=JSON.parse(command(['history','--json'],env,root.pathname));assert.equal(sessions.length,1);assert.equal(sessions[0].drills,2);assert.equal(sessions[0].repo.name,'test-project');
 assert.equal(JSON.parse(command(['status','--json'],env,root.pathname)).active,false);
});
