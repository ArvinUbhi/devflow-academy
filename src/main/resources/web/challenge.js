/* Daily prompts and scoring are versioned and identical across timezones and machines. */
(function(root, factory) {
  const api = typeof module === 'object' && module.exports ? factory(require('./curriculum.js')) : factory(root.DevFlowJava);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DevFlowChallenge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(J) {
  'use strict';
  const DAY=86400000, EPOCH=Date.UTC(2026,9,1);
  const dayKey = (date=new Date()) => new Date(date).toISOString().slice(0,10);
  const ordinal = date => Math.floor((Date.parse(dayKey(date)+'T00:00:00Z')-EPOCH)/DAY);
  function daily(date=new Date()) {
    const n=ordinal(date), index=((n%J.lessons.length)+J.lessons.length)%J.lessons.length;
    const lesson=J.lessons[index], value=10+(((n%90)+90)%90);
    return {version:1, key:dayKey(date), number:n+1, lesson, stages:[
      {id:'syntax', title:'Find your rhythm', target:`int score = ${value};\nboolean ready = score >= 10;`, description:'A short warm-up. Exact case, symbols and spacing count.'},
      {id:'code', title:lesson.title, target:lesson.code, description:lesson.concept},
      {id:'pattern', title:'Seal the pattern', target:lesson.recall.code, description:lesson.recall.prompt}
    ]};
  }
  function score(segments, correctKnowledge) {
    if (!Array.isArray(segments)||segments.length!==3) throw new Error('Complete three stages');
    const seconds=segments.reduce((s,x)=>s+Math.max(.2,Number(x.seconds)||0),0);
    const characters=segments.reduce((s,x)=>s+(Number(x.characters)||0),0);
    const attempts=segments.reduce((s,x)=>s+(Number(x.attempts)||0),0);
    const errors=segments.reduce((s,x)=>s+(Number(x.errors)||0),0);
    const accuracy=Math.round(1000*Math.max(0,1-errors/Math.max(1,attempts)))/10;
    const wpm=Math.round(characters/5*60/seconds*10)/10;
    // 60% accuracy, 30% pace (capped at 100 WPM), 10% first-answer knowledge.
    const points=Math.round(600*accuracy/100+300*Math.min(wpm,100)/100+(correctKnowledge?100:0));
    return {points,wpm,accuracy,seconds:Math.round(seconds),knowledge:!!correctKnowledge,segments};
  }
  function tiles(segment) {
    const acc=Math.max(0,Math.min(100,Number(segment.accuracy)||0));
    const greens=Math.max(0,Math.min(5,Math.floor((acc-75)/5)));
    return '🟩'.repeat(greens)+(acc>=85?'🟨':'⬛').repeat(5-greens);
  }
  function share(result) {
    return `devflow. Daily #${result.number}\n${result.key} · Java\n${result.segments.map(tiles).join('\n')}\n${result.points}/1000 · ${result.wpm} WPM · ${result.accuracy}% accuracy\n${result.knowledge?'◆':'◇'} Java insight · ${result.practice?'Practice':'First finish'} · local result\nCan you find your flow?\nhttps://github.com/ArvinUbhi/devflow-academy`;
  }
  function streak(results, date=new Date()) {
    const days=new Set(results.filter(x=>!x.practice).map(x=>x.key));
    let stamp=Date.parse(dayKey(date)+'T00:00:00Z');
    if(!days.has(dayKey(stamp)))stamp-=DAY;
    let count=0;
    while(days.has(dayKey(stamp))){count++;stamp-=DAY;}
    return count;
  }
  function progression(state, date=new Date()) {
    const dates=new Set(state.history.map(x=>dayKey(x.date)));
    const completed=Object.values(state.java||{}).filter(x=>x.mastered).length;
    const xp=state.history.length*15+completed*50+(state.daily||[]).length*40;
    return {xp,level:Math.floor(xp/250)+1,within:xp%250,completed,streak:streak([...dates].map(key=>({key})),date)};
  }
  function changedInput(previous, next, target) {
    let start=0;
    while(start<previous.length&&start<next.length&&previous[start]===next[start])start++;
    let oldEnd=previous.length,newEnd=next.length;
    while(oldEnd>start&&newEnd>start&&previous[oldEnd-1]===next[newEnd-1]){oldEnd--;newEnd--;}
    const inserted=next.slice(start,newEnd);
    return [...inserted].map((character,i)=>({character,expected:target[start+i],error:character!==target[start+i]}));
  }
  function keyboardKey(character,layout='QWERTY') {
    const uk=layout==='UK-QWERTY';
    const shifted={'!':'1','@':uk?"'":'2','"':uk?'2':"'",'$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','{':'[','}':']',':':';','~':uk?'#':'`','<':',','>':'.','?':'/','|':String.fromCharCode(92)};
    if(uk){shifted['£']='3';shifted['¬']='`';}else shifted['#']='3';
    if(character===' ')return {key:'SPACE',shift:false};
    if(character==='\n')return {key:'ENTER',shift:false};
    if(Object.hasOwn(shifted,character))return {key:shifted[character],shift:true};
    return {key:character.toUpperCase(),shift:/^[A-Z]$/.test(character)};
  }
  return {daily,dayKey,score,share,streak,progression,changedInput,tiles,keyboardKey};
});
