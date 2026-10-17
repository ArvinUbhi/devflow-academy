import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../src/main/resources/web/engine.js');
test('effective WPM and accuracy use correct characters and attempts', () => {
  assert.equal(E.wpm(50, 60), 10);
  assert.equal(E.accuracy(100, 4), 96);
  assert.equal(E.accuracy(0, 0), 100);
  assert.equal(E.correctPrefix('hellp', 'hello'), 4);
});
test('handicap falls when speed, accuracy, and rhythm improve', () => {
  const beginner = E.segmentHandicap({wpm:15, accuracy:80, rhythm:30});
  const advanced = E.segmentHandicap({wpm:75, accuracy:99, rhythm:95});
  assert.ok(beginner > advanced);
  assert.ok(beginner <= 54);
  assert.ok(advanced >= 0);
});
test('official round requires exactly three comparable segments', () => {
  assert.throws(() => E.roundScore([]), /three/);
  const segment = {wpm:55,accuracy:100,rhythm:100};
  assert.equal(E.roundScore([segment,segment,segment]), 0);
});
test('index uses best three of the eight most recent rounds', () => {
  const rounds = [1,2,3,4,5,6,7,8,9,10].map(score=>({score}));
  assert.equal(E.handicapIndex(rounds), 4); // last eight = 3..10, best = 3,4,5
  assert.equal(E.handicapIndex([]), null);
});
test('state import sanitizes settings and history', () => {
  const s=E.sanitizeState({settings:{name:'x'.repeat(500), language:'FORTRAN',minutes:200,goalWpm:500,showKeyboard:false},
    mastered:{'lesson-1':true,'oops':true}, history:[null,{date:'2026-01-01',wpm:20,accuracy:98}],rounds:[],weak:{a:3,'unsafe-key':4}});
  assert.equal(s.settings.name.length,30);
  assert.equal(s.settings.language,'Java');
  assert.equal(s.settings.minutes,60);
  assert.equal(s.settings.goalWpm,180);
  assert.equal(s.settings.showKeyboard,false);
  assert.deepEqual(s.mastered,{'lesson-1':true});
  assert.equal(s.history.length,1);
  assert.deepEqual(s.weak,{a:3});
});
