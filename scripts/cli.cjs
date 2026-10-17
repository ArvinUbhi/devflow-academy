#!/usr/bin/env node
'use strict';
// DevFlow CLI. Repo association is explicit; no system-wide keyboard monitoring.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawn, spawnSync} = require('node:child_process');
const dataDir = process.env.DEVFLOW_HOME || path.join(os.homedir(), '.devflow');
const configFile = path.join(dataDir, 'project.json');
const activeFile = path.join(dataDir, 'active-session.json');
const sessionsFile = path.join(dataDir, 'repo-sessions.json');
const progressFile = path.join(dataDir, 'progress.json');
const jar = path.join(__dirname, '..', 'devflow.jar');
const port = Number(process.env.DEVFLOW_PORT || '8765');
const origin = `http://127.0.0.1:${port}`;
const read = (file, fallback=null) => {try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}};
function save(file,obj){fs.mkdirSync(dataDir,{recursive:true});const tmp=file+'.'+process.pid+'.tmp';fs.writeFileSync(tmp,JSON.stringify(obj,null,2)+'\n',{mode:0o600});fs.renameSync(tmp,file)}
const args = process.argv.slice(2);
let cmd = args[0] || 'serve';
function option(name){const i=args.indexOf('--'+name);const x=args.find(a=>a.startsWith('--'+name+'='));return x ? x.slice(name.length+3) : i>=0 ? args[i+1] : null}
function fail(message){console.error('DevFlow: '+message);process.exitCode=1}
function repoPath(){const source = option('repo') || (read(configFile)||{}).path || process.cwd(); const absolute=path.resolve(source);const git=spawnSync('git',['-C',absolute,'rev-parse','--show-toplevel'],{encoding:'utf8'});if(git.status!==0)throw Error('Not a Git repository: '+absolute+' (run git init, or pass --repo /path/to/repo)');return fs.realpathSync(git.stdout.trim())}
function repoMeta(p){const r=spawnSync('git',['-C',p,'remote','get-url','origin'],{encoding:'utf8'});return {path:p,name:path.basename(p),id:crypto.createHash('sha256').update(p).digest('hex').slice(0,12),remote:r.status===0?r.stdout.trim():null}}
function metrics(items){const arr=items.filter(x=>Number.isFinite(x.wpm)&&Number.isFinite(x.accuracy));const sum=arr.reduce((a,x)=>a+(Number(x.seconds)||0),0);return {drills:arr.length,wpm:arr.length?Math.round(arr.reduce((a,x)=>a+x.wpm,0)/arr.length*10)/10:null,accuracy:arr.length?Math.round(arr.reduce((a,x)=>a+x.accuracy,0)/arr.length*10)/10:null,seconds:Math.round(sum)}}
function summarize(session){const items=(read(progressFile,{history:[]}).history||[]).filter(h=>h.sessionId===session.id);return metrics(items)}
function running(pid){if(!Number.isInteger(pid)||pid<=0)return false;try{process.kill(pid,0);return true}catch{return false}}
async function online(){try{const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),1000);const r=await fetch(origin+'/api/health',{signal:ac.signal});clearTimeout(timer);const j=await r.json();return r.ok&&j.app==='DevFlow'}catch{return false}}
function usage(){console.log(`DevFlow · Developer typing academy

Commands:
  devflow                        Run the browser academy (Ctrl+C to stop)
  devflow init [--repo PATH]     Link a local Git repository
  devflow start [--repo PATH]    Start a repo-associated background session
  devflow status [--json]       Show active repo and typing stats
  devflow stop                  Stop session, save summary and shut down server
  devflow history [--json]      Show local repo session history
  devflow serve                 Run normal Java app in foreground

Run anywhere after: npm install -g github:ArvinUbhi/devflow-academy
Or: npx --yes github:ArvinUbhi/devflow-academy <command>

Important: WPM/accuracy measure completed DevFlow browser drills, not keystrokes in other editors.`)}
function openBrowser(){if(args.includes('--no-browser'))return;const platform=process.platform;let c,aa;if(platform==='win32'){c='cmd';aa=['/c','start','""',origin]}else if(platform==='darwin'){c='open';aa=[origin]}else{c='xdg-open';aa=[origin]};const p=spawn(c,aa,{stdio:'ignore',detached:true});p.on('error',()=>{});p.unref()}
function serve(){const child=spawn('java',['-jar',jar,...args.slice(cmd==='serve'?1:cmd==='help'?1:0)],{stdio:'inherit'});child.on('error',e=>fail('Java 8+ is required: '+e.message));child.on('exit',c=>{process.exitCode=c||0});process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'))}
async function main(){
if(['help','--help','-h'].includes(cmd)){usage();return}
if(cmd==='serve'){serve();return}
if(cmd==='init'){const meta=repoMeta(repoPath());save(configFile,meta);console.log('Linked repository: '+meta.path);console.log('Remote: '+(meta.remote||'(none)'));console.log('Next: devflow start');return}
if(cmd==='start'){
 const existing=read(activeFile);if(existing&&running(existing.pid)){fail('A session is already active for '+existing.repo.name+'. Run devflow status or devflow stop first.');return}
 const meta=repoMeta(repoPath());save(configFile,meta);
 if(await online()){fail('Port '+port+' already serves a DevFlow instance; stop it before starting a tracked session.');return}
 const log=fs.openSync(path.join(dataDir,'server.log'),'a');const child=spawn('java',['-jar',jar,'--port='+port,'--no-browser'],{detached:true,stdio:['ignore',log,log],env:{...process.env,DEVFLOW_HOME:dataDir}});fs.closeSync(log);
 if(!child.pid){fail('Could not start Java. Verify Java 8+ is on PATH.');return}
 child.unref();let ready=false;for(let i=0;i<35;i++){await new Promise(resolve=>setTimeout(resolve,180));if(await online()){ready=true;break}if(!running(child.pid))break}
 if(!ready){fail('Java server failed to start; see '+path.join(dataDir,'server.log'));return}
 const session={id:crypto.randomUUID(),repo:meta,startedAt:new Date().toISOString(),pid:child.pid,port};save(activeFile,session);
 console.log('Repo session started: '+meta.name+' ('+meta.path+')');console.log('Tracking completed DevFlow browser drills at '+origin);console.log('Use devflow status to see metrics, devflow stop to save and finish.');openBrowser();return
}
if(cmd==='status'){
 const active=read(activeFile);const data=active?{active:true,repo:active.repo,startedAt:active.startedAt,serverRunning:running(active.pid),...summarize(active)}:{active:false,linkedRepo:read(configFile)};
 if(args.includes('--json'))console.log(JSON.stringify(data));else if(!active)console.log('No active session. Linked repo: '+(data.linkedRepo?.path||'none')+'\nRun devflow start');else console.log(`Repo: ${active.repo.name}\nStarted: ${active.startedAt}\nServer: ${data.serverRunning?'running':'not running'}\nCompleted drills: ${data.drills}\nWPM: ${data.wpm??'—'}\nAccuracy: ${data.accuracy===null?'—':data.accuracy+'%'}\nTime: ${data.seconds}s`);return
}
if(cmd==='stop'){
 const active=read(activeFile);if(!active){fail('No active session to stop');return}
 const summary={...active,endedAt:new Date().toISOString(),...summarize(active)};delete summary.pid;
 const history=read(sessionsFile,[]);history.push(summary);save(sessionsFile,history.slice(-1000));fs.unlinkSync(activeFile);
 if(running(active.pid)){try{process.kill(active.pid,'SIGTERM')}catch{}}
 console.log(`Saved: ${active.repo.name} · ${summary.drills} drills · ${summary.wpm??'—'} WPM · ${summary.accuracy===null?'—':summary.accuracy+'%'}\nSession stopped.`);return
}
if(cmd==='history'){
 const sessions=read(sessionsFile,[]);if(args.includes('--json')){console.log(JSON.stringify(sessions));return}
 if(!sessions.length){console.log('No completed repo sessions yet.');return}
 for(const s of sessions.slice(-25).reverse())console.log(`${s.startedAt.slice(0,16)}  ${s.repo?.name||'Repo'}  ${s.drills} drills  ${s.wpm??'—'} WPM  ${s.accuracy===null?'—':s.accuracy+'%'}  ${Math.round(s.seconds/60)} min`);return
}
fail('Unknown command: '+cmd);usage()
}
main().catch(e=>fail(e.message));
