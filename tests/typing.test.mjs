import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),T=require('../src/main/resources/web/typing.js');
const type=(s,value,at)=>{for(let i=1;i<=value.length;i++)s.input(value.slice(0,i),at+i*10);};

test('15/30/60-second deadlines start at first input, include idle time and reject late keys',()=>{
 for(const seconds of [15,30,60]){
  const s=new T.Session({words:['cat','dog','hello'],seconds});
  assert.equal(s.elapsed(999999),0);assert.equal(s.remaining(999999),seconds);
  s.input('c',1000);s.input('ca',1100);s.input('cat',1200);s.input('cat ',1300);
  s.input('d',1400);s.input('do',1000+seconds*1000); // Exactly at deadline is too late.
  assert.equal(s.finished,true);assert.equal(s.result.seconds,seconds);assert.equal(s.result.attempts,5);
  assert.equal(s.result.correct,5);assert.equal(s.result.wpm,Math.round(60/seconds*10)/10);
  assert.equal(s.result.words.at(-1).partial,true);assert.equal(s.result.words.at(-1).typed,'d');
  s.input('ignored',999999);assert.equal(s.result.attempts,5);
 }
});
test('incorrect words do not shift the next target; corrections remain in raw accuracy',()=>{
 const s=new T.Session({words:['cat','dog','done'],wordCount:3});
 s.input('c',0);s.input('cx',100);s.input('c',200);s.input('ca',300);s.input('cat ',400);
 s.input('dg ',700);s.input('done',1000);
 assert.equal(s.finished,true);assert.equal(s.result.words[0].correct,true);assert.equal(s.result.words[0].errors,1);
 assert.equal(s.result.words[0].backspaces,1);assert.equal(s.result.words[1].correct,false);
 assert.equal(s.result.words[2].correct,true);assert.equal(s.result.correct,8); // cat + space + done
 assert.equal(s.result.keyMistakes.a,1);assert.ok(s.result.accuracy<100);
 assert.equal(T.wordAnalysis([s.result]).find(w=>w.word==='cat').missed,0);
});
test('word cut short by the deadline is not a failed word; full word at deadline earns credit',()=>{
 const s=new T.Session({words:['hello','world'],seconds:15});type(s,'hello',100);s.finish(15110);
 assert.equal(s.result.words[0].partial,true);assert.equal(s.result.correct,5);
 const word=T.wordAnalysis([s.result])[0];assert.equal(word.seen,0);assert.equal(word.missed,0);
});
test('input deletion and mid-word replacements count edits once without erasing errors',()=>{
 const s=new T.Session({words:['hello','done'],wordCount:2});type(s,'hxllo',0);s.input('hello',100);s.input('hello ',120);
 assert.equal(s.rows[0].errors,1);assert.equal(s.backspaces,1);assert.equal(s.attempts,7);
 assert.deepEqual(s.confusions,{'e→x':1});
});
test('comparable records separate keyboard, layer, duration, count, numbers and punctuation',()=>{
 const r={profileId:'glove',baseLayer:0,testMode:'time',duration:30,kind:'wordtest'};
 for(const change of [{profileId:'standard'},{baseLayer:1},{duration:60},{numbers:true},{punctuation:true},{testMode:'words',duration:0,wordCount:50}])assert.notEqual(T.cohort(r),T.cohort({...r,...change}));
 const rows=[{...r,date:'2026-10-18',wpm:60,seconds:30,attempts:150,errors:3,accuracy:98},{...r,kind:'wordtest-words',date:'2026-10-18',wpm:200,seconds:10,accuracy:100}];
 assert.equal(T.filterHistory(rows).length,1);assert.equal(T.summarize(T.filterHistory(rows)).best,60);
});
test('word and key diagnostics use exposure, not just frequency of mistakes',()=>{
 const rows=[{keyAttempts:{e:100,z:4},keyMistakes:{e:5,z:2},words:[{word:'test',typed:'tes',errors:2,correct:false,ms:800,backspaces:1},{word:'test',typed:'test',errors:0,correct:true,ms:600}]}];
 assert.equal(T.keyAnalysis(rows)[0].key,'z');assert.equal(T.keyAnalysis(rows)[0].rate,50);
 const w=T.wordAnalysis(rows)[0];assert.equal(w.rate,50);assert.equal(w.averageMs,700);
 assert.deepEqual(T.practiceWords(rows,3),['test','test','test']);
 assert.equal(T.activity([{date:'2026-10-18T12:00:00'}],new Date('2026-10-18T13:00:00'),28).at(-1).count,1);
});
