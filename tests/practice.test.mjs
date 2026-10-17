import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.url),P=require('../src/main/resources/web/practice.js'),E=require('../src/main/resources/web/engine.js'),J=require('../src/main/resources/web/curriculum.js');
test('all 12 taught bug fixes compile as Java 8 and produce the promised behaviour',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'devflow-fixes-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 assert.equal(P.fixes.length,12);const files=[];
 for(const fix of P.fixes){
  assert.ok(J.lessons.some(x=>x.id===fix.lesson));
  assert.equal(P.matchesFix(fix.start,fix.expected),false,fix.title+' must require a real fix');
  assert.equal(P.matchesFix(fix.expected.replaceAll('\n','\n  '),fix.expected),true);
  const file=join(dir,`Fix${fix.number}.java`);files.push(file);
  await writeFile(file,`import java.util.*; public class Fix${fix.number} { public static void main(String[] args) {\n${fix.expected}\n}}`);
 }
 execFileSync('java',['com.sun.tools.javac.Main','--release','8','-d',dir,...files],{timeout:60000});
 for(const fix of P.fixes){
  assert.equal(execFileSync('java',['-cp',dir,`Fix${fix.number}`],{encoding:'utf8',timeout:10000}).replace(/\r\n/g,'\n').trimEnd(),fix.output,fix.title);
  assert.equal((await readFile(join(dir,`Fix${fix.number}.class`))).readUInt16BE(6),52);
 }
 assert.equal(P.matchesFix('String text = "a b";','String text="ab";'),false,'whitespace inside a string is meaningful');
 assert.equal(P.matchesFix('i + + j;','i++j;'),false,'operators stay distinct');
});
test('adaptive drills actually exercise difficult symbols, spaces, Enter and UK keys',()=>{
 for(const key of ['{',';',')',' ','\n','£','A']){
  const drill=P.weakDrill({[key]:20,z:1});assert.ok(drill.keys.includes(key));assert.ok(drill.target.includes(key));assert.ok(drill.target.length<500);
 }
 assert.deepEqual(P.weakDrill({a:10,b:20},'a').keys,['a']);
});
test('practice goals and milestones count completed work and clean fixes only',()=>{
 const s=E.defaultState();s.history=[{date:'2026-10-17T01:00:00Z',seconds:90,kind:'debug',id:'debug-1',errors:1},{date:'2026-10-17T02:00:00Z',seconds:30,kind:'debug',id:'debug-2',errors:0,assisted:true}];
 let result=P.week(s,new Date('2026-10-17T23:00:00Z'));assert.equal(result.seconds,120);assert.equal(result.solved.size,0);assert.equal(result.days.length,7);
 s.history.push({date:'2026-10-16T12:00:00Z',seconds:30,kind:'debug',id:'debug-3',errors:0});
 result=P.week(s,new Date('2026-10-17T23:00:00Z'));assert.equal(result.solved.size,1);assert.equal(result.badges.find(x=>x.name==='Bug hunter').earned,true);
});
