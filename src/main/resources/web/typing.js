/* Dependency-free typing measurements. A timer is a deadline, never a tick counter. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DevFlowTyping=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const round=n=>Math.round(n*10)/10;
  const add=(map,key,n=1)=>{if(key)map[key]=(map[key]||0)+n;};
  const merge=(a,b)=>{for(const [key,n] of Object.entries(b||{}))add(a,key,n);return a;};
  const prefix=(a,b)=>{let i=0;while(i<a.length&&a[i]===b[i])i++;return i;};
  class Session {
    constructor({words,seconds=0,wordCount=0}){
      this.words=[...words];this.duration=[15,30,60].includes(seconds)?seconds:0;
      this.limit=this.duration?0:wordCount||words.length;
      this.started=null;this.finished=false;this.index=0;this.current='';this.rows=[];
      this.attempts=0;this.errors=0;this.backspaces=0;this.keyAttempts={};this.keyMistakes={};this.confusions={};
      this.wordStart=null;this.wordErrors=0;this.wordBackspaces=0;this.samples=[];this.lastSample=0;this.lastAttempts=0;
    }
    elapsed(now){return this.started===null?0:Math.min(this.duration||Infinity,Math.max(0,(now-this.started)/1000));}
    remaining(now){return this.duration?Math.max(0,this.duration-this.elapsed(now)):0;}
    expired(now){return this.started!==null&&this.duration>0&&now>=this.started+this.duration*1000;}
    record(char,expected){
      this.attempts++;add(this.keyAttempts,expected||char);
      if(char!==expected){this.errors++;this.wordErrors++;add(this.keyMistakes,expected||char);add(this.confusions,(expected||'∅')+'→'+char);}
    }
    input(value,now){
      if(this.finished)return;
      if(this.expired(now)){this.finish(now);return;}
      if(this.started===null&&value){this.started=now;this.wordStart=now;}
      // Input contains the current word only. Completed words are immutable; Backspace fixes the current word.
      const old=this.current;let start=prefix(old,value),endOld=old.length,endNew=value.length;
      while(endOld>start&&endNew>start&&old[endOld-1]===value[endNew-1]){endOld--;endNew--;}
      const removed=endOld-start;this.backspaces+=removed;this.wordBackspaces+=removed;
      const inserted=value.slice(start,endNew),target=this.words[this.index]||'';
      for(let j=0;j<inserted.length;j++){
        const char=inserted[j];if(char===' ')continue;
        this.record(char,target[start+j]);
      }
      const boundary=value.indexOf(' ');
      if(boundary>=0){
        this.current=value.slice(0,boundary);
        // Early/extra characters make the word wrong, including an empty skipped word.
        this.record(' ',this.current===target?' ':target[this.current.length]||'∅');
        this.commit(now);
      }else this.current=value;
      if(!this.duration&&this.index===this.limit-1&&this.current===this.words[this.index])this.commit(now,false);
      if(!this.duration&&this.index>=this.limit)this.finish(now);
    }
    commit(now,space=true){
      const word=this.words[this.index]||'';
      this.rows.push({word,typed:this.current,errors:this.wordErrors,backspaces:this.wordBackspaces,ms:Math.max(0,Math.round(now-this.wordStart)),correct:this.current===word,partial:false,space});
      this.index++;this.current='';this.wordErrors=0;this.wordBackspaces=0;this.wordStart=now;
    }
    sample(now){
      const seconds=this.elapsed(now);
      if(seconds-this.lastSample<1&&!this.expired(now))return;
      if(seconds<=this.lastSample)return;
      this.samples.push({second:round(seconds),wpm:this.measure(now).wpm,raw:round((this.attempts-this.lastAttempts)/5*60/(seconds-this.lastSample))});
      this.lastSample=seconds;this.lastAttempts=this.attempts;
    }
    measure(now){
      const seconds=this.elapsed(now);
      const correct=this.rows.reduce((sum,r)=>sum+(r.correct?r.word.length+(r.space?1:0):0),0)+prefix(this.current,this.words[this.index]||'');
      const speeds=this.samples.map(s=>s.raw),mean=speeds.reduce((s,n)=>s+n,0)/(speeds.length||1);
      const consistency=speeds.length<3||!mean?null:round(Math.max(0,100*(1-Math.sqrt(speeds.reduce((s,n)=>s+(n-mean)**2,0)/speeds.length)/mean)));
      return {seconds:round(seconds),wpm:seconds>0?round(correct/5*60/seconds):0,rawWpm:seconds>0?round(this.attempts/5*60/seconds):0,accuracy:this.attempts?round(100*(this.attempts-this.errors)/this.attempts):100,errors:this.errors,attempts:this.attempts,backspaces:this.backspaces,correct,consistency,correctWords:this.rows.filter(r=>r.correct).length,completedWords:this.rows.length};
    }
    finish(now){
      if(this.finished)return;
      this.sample(now);this.result=this.measure(now);this.finished=true;
      // A word cut short by the deadline is not marked as a failed word.
      const partial=this.current?{word:this.words[this.index],typed:this.current,errors:this.wordErrors,backspaces:this.wordBackspaces,ms:Math.round(Math.max(0,(this.started+this.result.seconds*1000)-this.wordStart)),correct:false,partial:true,space:false}:null;
      this.result={...this.result,words:partial?[...this.rows,partial]:[...this.rows],keyAttempts:{...this.keyAttempts},keyMistakes:{...this.keyMistakes},confusions:{...this.confusions},samples:[...this.samples]};
    }
  }
  const isTyping=r=>r&&['wordtest','wordtest-focus','wordtest-words','wordtest-keys'].includes(r.kind);
  function cohort(r){return [r.profileId||'legacy',r.baseLayer||0,r.testMode||'words',r.duration||r.wordCount||'unknown',r.punctuation?'punct':'plain',r.numbers?'numbers':'letters'].join('|');}
  function filterHistory(history,{profile='all',duration='all',days=0,now=Date.now(),practice=false}={}){
    return history.filter(r=>isTyping(r)&&(practice||r.kind==='wordtest')&&(profile==='all'||(r.profileId||'legacy')===profile)&&(duration==='all'||Number(r.duration)===Number(duration))&&(!days||Date.parse(r.date)>=now-days*86400000)).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  }
  function summarize(rows){
    const totalSeconds=rows.reduce((s,r)=>s+(r.seconds||0),0),attempts=rows.reduce((s,r)=>s+(r.attempts||0),0);
    const accuracy=attempts?round(100*(1-rows.reduce((s,r)=>s+(r.errors||0),0)/attempts)):rows.length?round(rows.reduce((s,r)=>s+r.accuracy,0)/rows.length):null;
    return {count:rows.length,wpm:totalSeconds?round(rows.reduce((s,r)=>s+r.wpm*(r.seconds||0),0)/totalSeconds):null,accuracy,minutes:round(totalSeconds/60),best:rows.length?Math.max(...rows.map(r=>r.wpm)):null};
  }
  function wordAnalysis(rows){
    const map=new Map();
    for(const r of rows)for(const w of r.words||[]){
      if(typeof w.word!=='string'||w.word.length>80)continue;
      const a=map.get(w.word)||{word:w.word,seen:0,missed:0,errors:0,backspaces:0,ms:0,completed:0,example:''};
      if(!w.partial){a.seen++;a.completed++;a.ms+=w.ms||0;if(!w.correct)a.missed++;}
      a.errors+=w.errors||0;a.backspaces+=w.backspaces||0;
      if(w.errors||!w.partial&&!w.correct)a.example=w.typed;
      map.set(w.word,a);
    }
    return [...map.values()].map(w=>({...w,rate:w.seen?round(w.missed/w.seen*100):null,averageMs:w.completed?Math.round(w.ms/w.completed):null})).sort((a,b)=>(b.errors+b.missed*2)-(a.errors+a.missed*2)||b.seen-a.seen);
  }
  function keyAnalysis(rows){
    const attempts={},mistakes={};for(const r of rows){merge(attempts,r.keyAttempts);merge(mistakes,r.keyMistakes);}
    return Object.entries(attempts).map(([key,count])=>({key,attempts:count,errors:mistakes[key]||0,rate:round((mistakes[key]||0)/count*100)})).sort((a,b)=>b.rate-a.rate||b.errors-a.errors);
  }
  function activity(rows,now=new Date(),days=28){
    const key=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
    const counts=new Map();for(const r of rows){const k=key(new Date(r.date));counts.set(k,(counts.get(k)||0)+1);}
    return Array.from({length:days},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()-(days-1-i));const date=key(d);return{date,count:counts.get(date)||0};});
  }
  function practiceWords(rows,count=25){
    const weak=wordAnalysis(rows).filter(w=>w.errors||w.missed).slice(0,20).map(w=>w.word);
    if(!weak.length)return [];
    const list=[];for(let i=0;i<count;i++){let next=weak[Math.floor(Math.random()*weak.length)];if(weak.length>1&&next===list[i-1])next=weak[(weak.indexOf(next)+1)%weak.length];list.push(next);}return list;
  }
  return {Session,cohort,filterHistory,summarize,wordAnalysis,keyAnalysis,activity,practiceWords,isTyping};
});
