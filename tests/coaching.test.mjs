import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const Coaching=require('../src/main/resources/web/coaching.js');
const Performance=require('../src/main/resources/web/performance-coach.js');
const Advanced=require('../src/main/resources/web/advanced.js');
const Engine=require('../src/main/resources/web/engine.js');
const row=(wpm,accuracy,kind='wordtest',rhythm=83)=>({date:'2026-10-18',kind,wpm,accuracy,rhythm});

test('new users see baseline instructions, not invented measurements',()=>{
 const result=Coaching.analyzeTyping([],{},65);
 assert.equal(result.count,0);assert.equal(result.avgWpm,null);
 assert.match(result.advice,/first|baseline|50-word/i);
 assert.match(result.evidence,/No completed/);
});
test('typing coach prioritises raw accuracy and recommends a focused test when missed keys exist',()=>{
 const rows=[row(67,91),row(69,94),row(72,93),row(35,100,'java-type')];
 const result=Coaching.analyzeTyping(rows,{a:9,r:2},70);
 assert.equal(result.count,3);
 assert.equal(result.avgAccuracy,92.7);
 assert.equal(result.bestWpm,72);
 assert.equal(result.action,'focus');
 assert.equal(result.focusKeys[0],'a');
 assert.match(result.evidence,/3 recent/);
 assert.match(result.advice,/96%/);
});
test('focused drills never inflate normal typing records',()=>{
 const rows=[row(57,99),row(101,99,'wordtest-focus')];
 const result=Coaching.analyzeTyping(rows,{},65);
 assert.equal(result.bestWpm,57);
 assert.equal(result.count,2);
 assert.equal(result.avgWpm,79);
});
test('completion feedback is factual and distinguishes high and low accuracy',()=>{
 const slow={wpm:50,accuracy:91,wordCount:50,rhythm:88};
 const good={wpm:65,accuracy:99,wordCount:50,rhythm:90};
 assert.match(Coaching.completedFeedback(slow),/91\.0%/);
 assert.match(Coaching.completedFeedback(slow),/96%/);
 assert.match(Coaching.completedFeedback(good),/Good accuracy/);
});
test('weak-key generation emphasises observed keys while retaining random words',()=>{
 const focus=Advanced.generateWords(100,{focusKeys:['z'],numbers:false},23456).split(' ');
 const normal=Advanced.generateWords(100,{},23456).split(' ');
 assert.equal(focus.length,100);
 assert.equal(focus.join(' '),Advanced.generateWords(100,{focusKeys:['z']},23456));
 assert.ok(focus.filter(word=>word.includes('z')).length>=55);
 assert.notDeepEqual(focus,normal);
});
test('performance investigations provide evidence, pitfalls and answer explanations',()=>{
 assert.equal(Performance.cases.length,6);
 for(const lesson of Performance.cases){
  assert.equal(Performance.byId(lesson.id),lesson);
  assert.ok(lesson.steps.length>=3);
  assert.ok(lesson.command.length>20);
  assert.ok(lesson.trap.length>35);
  assert.ok(lesson.tip.length>20);
  assert.ok(lesson.answer>=0&&lesson.answer<lesson.options.length);
  assert.ok(lesson.explanation.length>40);
 }
 assert.equal(Performance.byId('not-there'),null);
});
test('v2 history survives and performance quiz attempts are safely migrated',()=>{
 const out=Engine.sanitizeState({version:2,history:[row(50,97)],performance:{
  benchmark:{attempts:2,correct:true,last:'2026-10-17T10:00:00Z'},
  unknown:{attempts:200,correct:true}
 }});
 assert.equal(out.history.length,1);
 assert.equal(out.performance.benchmark.attempts,2);
 assert.equal(out.performance.benchmark.correct,true);
 assert.equal(out.performance.unknown,undefined);
});
test('a real JMH Maven lab is available but separate from the core runtime',async()=>{
 const pom=await readFile(new URL('../perf-lab/pom.xml',import.meta.url),'utf8');
 const example=await readFile(new URL('../perf-lab/src/main/java/com/devflow/bench/AllocationBenchmark.java',import.meta.url),'utf8');
 const readme=await readFile(new URL('../perf-lab/README.md',import.meta.url),'utf8');
 assert.match(pom,/jmh-generator-annprocess/);
 assert.match(pom,/org\.openjdk\.jmh\.Main/);
 assert.match(example,/@Benchmark/);
 assert.match(example,/@Fork\(2\)/);
 assert.match(example,/primitiveReduction/);
 assert.match(example,/boxedIntermediateList/);
 assert.match(readme,/gc\.alloc\.rate\.norm/);
 assert.match(readme,/jcmd <PID> JFR\.start/);
});
