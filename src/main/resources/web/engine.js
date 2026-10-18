/* Shared browser/Node scoring logic. No dependencies; deterministic and testable. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DevFlowEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round1 = n => Math.round(n * 10) / 10;
  const correctPrefix = (text, target) => {
    let i = 0;
    while (i < text.length && text[i] === target[i]) i++;
    return i;
  };
  const accuracy = (attempts, errors) => attempts <= 0 ? 100 : round1(100 * clamp((attempts - errors) / attempts, 0, 1));
  const wpm = (correctCharacters, seconds) => seconds <= 0 ? 0 : round1((correctCharacters / 5) * (60 / seconds));
  const rhythm = intervals => {
    const use = intervals.filter(x => x >= 35 && x <= 2400);
    if (use.length < 6) return 50;
    const avg = use.reduce((a,b)=>a+b,0)/use.length;
    const cv = Math.sqrt(use.reduce((a,b)=>a+(b-avg)**2,0)/use.length)/avg;
    return round1(clamp(100 - cv * 95, 0, 100));
  };
  function segmentHandicap({ wpm: speed, accuracy: acc, rhythm: smoothness }) {
    // 50% pace, 40% accuracy, 10% rhythm; 0 is best, 54 is worst.
    const speedPenalty = 27 * clamp((55 - speed) / 55, 0, 1);
    const accuracyPenalty = 21.6 * clamp((100 - acc) / 20, 0, 1);
    const rhythmPenalty = 5.4 * clamp((100 - smoothness) / 100, 0, 1);
    return round1(clamp(speedPenalty + accuracyPenalty + rhythmPenalty, 0, 54));
  }
  function roundScore(segments) {
    if (!Array.isArray(segments) || segments.length !== 3) throw new Error('A round requires three benchmark segments');
    return round1(segments.reduce((sum, s) => sum + segmentHandicap(s), 0) / 3);
  }
  function handicapIndex(rounds) {
    if (!Array.isArray(rounds) || rounds.length === 0) return null;
    const latest = rounds.slice(-8).map(r => Number(r.score)).filter(n => Number.isFinite(n)).sort((a,b)=>a-b);
    if (!latest.length) return null;
    return round1(latest.slice(0, 3).reduce((a,b)=>a+b,0)/Math.min(3, latest.length));
  }
  function tier(h) {
    if (h === null) return 'UNRATED';
    if (h <= 6) return 'ELITE · KEYBOARD ATHLETE';
    if (h <= 15) return 'ADVANCED · FLUENT DEVELOPER';
    if (h <= 27) return 'IMPROVING · CAPABLE CODER';
    if (h <= 40) return 'APPRENTICE · BUILDING RHYTHM';
    return 'BEGINNER · FINDING YOUR FLOW';
  }
  function defaultState() {
    return {version:2, settings:{name:'Developer',language:'Java',layout:'QWERTY',minutes:15,goalWpm:65,showKeyboard:true,blurCompleted:false}, mastered:{},history:[],rounds:[],weak:{},java:{},daily:[],dailyDraft:null};
  }
  function sanitizeState(input) {
    const base = defaultState();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
    if (input.settings && typeof input.settings === 'object') {
      const x = input.settings;
      base.settings.name = String(x.name || 'Developer').slice(0,30);
      base.settings.language = ['Java','Python','JavaScript','C#','SQL'].includes(x.language) ? x.language : 'Java';
      base.settings.layout = ['QWERTY','UK-QWERTY'].includes(x.layout) ? x.layout : 'QWERTY';
      base.settings.minutes = clamp(Number(x.minutes)||15,5,60);
      base.settings.goalWpm = clamp(Number(x.goalWpm)||65,20,180);
      base.settings.showKeyboard = x.showKeyboard !== false;
      base.settings.blurCompleted = x.blurCompleted === true;
    }
    if (input.mastered && typeof input.mastered === 'object' && !Array.isArray(input.mastered)) base.mastered = Object.fromEntries(Object.entries(input.mastered).filter(([k,v])=>/^lesson-\d{1,2}$/.test(k) && v === true));
    if (Array.isArray(input.history)) base.history = input.history.filter(x => x && typeof x === 'object' && typeof x.date === 'string' && Number.isFinite(Date.parse(x.date)) && Number.isFinite(x.wpm) && Number.isFinite(x.accuracy)).slice(-10000);
    if (Array.isArray(input.rounds)) base.rounds = input.rounds.filter(x => x && typeof x === 'object' && Number.isFinite(x.score) && typeof x.date === 'string').slice(-1000);
    if (input.weak && typeof input.weak === 'object' && !Array.isArray(input.weak)) base.weak = Object.fromEntries(Object.entries(input.weak).filter(([k,v])=>k.length===1 && Number.isFinite(v) && v>=0).slice(0,100));
    if(input.java && typeof input.java==='object' && !Array.isArray(input.java)) {
      for(const [id,value] of Object.entries(input.java)) {
        if(!/^java-([1-9]|[12]\d|3\d|4[0-4])$/.test(id)||!value||typeof value!=='object')continue;
        base.java[id]={mastered:value.mastered===true,attempts:clamp(Number(value.attempts)||0,0,100000),due:typeof value.due==='string'&&Number.isFinite(Date.parse(value.due))?value.due:null,last:typeof value.last==='string'?value.last.slice(0,30):null};
      }
    }
    const validSegment=x=>x&&typeof x==='object'&&['seconds','characters','attempts','errors','accuracy','wpm'].every(k=>Number.isFinite(x[k])&&x[k]>=0)&&x.accuracy<=100&&x.errors<=x.attempts;
    const validDaily=x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.key)&&Number.isFinite(Date.parse(x.key))&&Number.isFinite(x.number)&&Number.isFinite(x.points)&&x.points>=0&&x.points<=1000&&Number.isFinite(x.wpm)&&Number.isFinite(x.accuracy)&&x.accuracy>=0&&x.accuracy<=100&&Array.isArray(x.segments)&&x.segments.length===3&&x.segments.every(validSegment);
    if(Array.isArray(input.daily)) {
      const seen=new Set();
      base.daily=input.daily.filter(x=>{if(!validDaily(x)||seen.has(x.key))return false;seen.add(x.key);return true;}).slice(-1000).map(x=>({...x,practice:false}));
    }
    const d=input.dailyDraft;
    if(d&&/^\d{4}-\d{2}-\d{2}$/.test(d.key)&&Number.isFinite(Date.parse(d.key))&&Number.isFinite(d.number)&&Array.isArray(d.segments)&&d.segments.length<=3&&d.segments.every(validSegment)) {
      base.dailyDraft={key:d.key,number:d.number,segments:d.segments,practice:d.practice===true};
      if(typeof d.knowledge==='boolean')base.dailyDraft.knowledge=d.knowledge;
    }
    return base;
  }
  return {clamp,round1,correctPrefix,accuracy,wpm,rhythm,segmentHandicap,roundScore,handicapIndex,tier,defaultState,sanitizeState};
});
