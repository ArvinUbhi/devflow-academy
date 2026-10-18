import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const require=createRequire(import.meta.url);
const A=require('../src/main/resources/web/advanced.js');
const C=require('../src/main/resources/web/challenge.js');
const E=require('../src/main/resources/web/engine.js');

test('advanced curriculum covers patterns, concurrency and low-latency topics',()=>{
 assert.equal(A.lessons.length,20);
 assert.ok(A.lessons.some(l=>l.chapter==='Design patterns'));
 assert.ok(A.lessons.some(l=>l.chapter==='Concurrency'));
 assert.ok(A.lessons.some(l=>l.chapter==='Low latency / GC'));
 for(const l of A.lessons){
  assert.ok(l.question.answer>=0&&l.question.answer<l.question.options.length);
  assert.match(l.code,/System\.out\.println/);
  assert.ok(l.recall.code.length>0);
 }
});
test('offline scenario generator reproduces seeded content and creates different code',()=>{
 const lesson=A.lessons[0];
 assert.deepEqual(A.variant(lesson,123),A.variant(lesson,123));
 assert.notEqual(A.variant(lesson,123).code,A.variant(lesson,124).code);
 assert.notEqual(A.variant(lesson,123).output,A.variant(lesson,124).output);
 const a=A.generateWords(50,{numbers:true,punctuation:true},456);
 assert.equal(a,A.generateWords(50,{numbers:true,punctuation:true},456));
 assert.notEqual(a,A.generateWords(50,{numbers:true,punctuation:true},457));
 assert.equal(a.split(' ').length,50);
 assert.match(a,/[0-9]/);assert.match(a,/[.,]/);
 assert.equal(A.generateWords(25,{},987).split(' ').length,25);
});
test('old daily challenges remain identical; new dates have shared reproducible advanced challenges',()=>{
 const old=C.daily('2026-10-18T13:00:00Z');
 const next=C.daily('2026-10-19T13:00:00Z');
 assert.equal(old.version,1);
 assert.equal(next.version,2);
 assert.equal(next.lesson.advanced,true);
 assert.deepEqual(next,C.daily('2026-10-19T13:00:00+00:00'));
 assert.notDeepEqual(next.stages,C.daily('2026-10-20T13:00:00Z').stages);
 const state=E.sanitizeState({java:{'java-25':{mastered:true,attempts:2},'java-44':{mastered:false,attempts:3}}});
 assert.equal(state.java['java-25'].mastered,true);
 assert.equal(state.java['java-44'].attempts,3);
});
test('every advanced scenario variant compiles and produces the expected Java 8 output',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'devflow-advanced-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const samples=A.lessons.flatMap(l=>[0,1234567,987654321].map(seed=>A.variant(l,seed)));
 const paths=[];
 for(let i=0;i<samples.length;i++){
  const l=samples[i],name='Advanced'+i;
  const path=join(dir,name+'.java');paths.push(path);
  await writeFile(path,'import java.util.*;\nimport java.util.concurrent.*;\nimport java.util.function.*;\npublic class '+name+' { public static void main(String[] args) throws Exception {\n'+l.code+'\n}}');
 }
 execFileSync('java',['com.sun.tools.javac.Main','--release','8','-d',dir,...paths],{timeout:90000});
 for(let i=0;i<samples.length;i++){
  const actual=execFileSync('java',['-cp',dir,'Advanced'+i],{encoding:'utf8',timeout:10000}).replace(/\r\n/g,'\n').trimEnd();
  assert.equal(actual,samples[i].output,samples[i].title+' seed '+i);
 }
});
