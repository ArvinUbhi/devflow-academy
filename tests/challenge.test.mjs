import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const C=require('../src/main/resources/web/challenge.js');
const E=require('../src/main/resources/web/engine.js');
const segment={wpm:60,accuracy:98,seconds:20,characters:100,attempts:100,errors:2};
test('daily identity uses UTC, never local timezone or difficulty settings',()=>{
 const a=C.daily('2026-10-17T00:05:00+01:00');
 const b=C.daily('2026-10-16T23:05:00Z');
 assert.deepEqual(a,b);assert.equal(a.number,16);assert.equal(a.key,'2026-10-16');
 assert.notDeepEqual(C.daily('2026-10-17').stages,a.stages);
 assert.ok(C.daily('2025-01-01').lesson);
});
test('daily aggregate weights time and attempts, caps points and rewards understanding',()=>{
 const s=C.score([segment,segment,segment],true);
 assert.equal(s.wpm,60);assert.equal(s.accuracy,98);assert.equal(s.points,868);
 assert.equal(C.score([segment,segment,segment],false).points,768);
 const mixed=C.score([segment,{...segment,seconds:100},segment],true);
 assert.equal(mixed.wpm,25.7);
 const fast={...segment,seconds:.01,errors:0};
 assert.ok(C.score([fast,fast,fast],true).points<=1000);
 assert.throws(()=>C.score([],false),/three/);
});
test('share cards contain scores and avoid revealing code or answers',()=>{
 const r={...C.score([segment,segment,segment],true),key:'2026-10-17',number:17};
 const card=C.share(r);
 assert.match(card,/Daily #17/);assert.match(card,/local result/);assert.match(card,/868\/1000/);
 assert.equal(card.split('\n').filter(x=>x.startsWith('🟩')).length,3);
 assert.doesNotMatch(card,/System.out|println|Optional|int score/);
});
test('practice streak tolerates today not yet played, but not a missed day',()=>{
 const results=['2026-10-14','2026-10-15','2026-10-16'].map(key=>({key}));
 assert.equal(C.streak(results,'2026-10-17'),3);
 assert.equal(C.streak(results,'2026-10-18'),0);
 assert.equal(C.streak([...results,{key:'2026-10-17',practice:true}],'2026-10-17'),3);
});
test('input metrics count corrected replacements without charging unchanged suffixes',()=>{
 assert.deepEqual(C.changedInput('hellp','hello','hello'),[{character:'o',expected:'o',error:false}]);
 assert.equal(C.changedInput('hello','hell','hello').length,0);
 assert.deepEqual(C.changedInput('heXlo','hello','hello'),[{character:'l',expected:'l',error:false}]);
 assert.equal(C.changedInput('a','b','a')[0].error,true);
});
test('v1 migration retains history; v2 import retains one daily score and safe learning state',()=>{
 const daily={...C.score([segment,segment,segment],true),key:'2026-10-17',number:17};
 const s=E.sanitizeState({version:1,history:[{date:'2026-10-17',wpm:60,accuracy:98}],daily:[daily,daily,{...daily,key:'bad'}],java:{'java-1':{mastered:true,attempts:1},bad:{mastered:true}},dailyDraft:{key:'2026-10-18',number:18,segments:[segment]}});
 assert.equal(s.version,2);assert.equal(s.history.length,1);assert.equal(s.daily.length,1);assert.equal(s.dailyDraft.segments.length,1);
 assert.deepEqual(Object.keys(s.java),['java-1']);
});
test('symbol guidance respects UK and US keyboard layouts',()=>{
 assert.deepEqual(C.keyboardKey('"','UK-QWERTY'),{key:'2',shift:true});
 assert.deepEqual(C.keyboardKey('"','QWERTY'),{key:"'",shift:true});
 assert.deepEqual(C.keyboardKey('@','UK-QWERTY'),{key:"'",shift:true});
 assert.deepEqual(C.keyboardKey('@','QWERTY'),{key:'2',shift:true});
 assert.deepEqual(C.keyboardKey('{'),{key:'[',shift:true});
 assert.deepEqual(C.keyboardKey('A'),{key:'A',shift:true});
});
