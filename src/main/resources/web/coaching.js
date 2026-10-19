/* Offline and deterministic coaching, grounded in exercises actually completed. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DevFlowCoaching=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const isTyping=h=>h&&['wordtest','wordtest-focus'].includes(h.kind)&&
    Number.isFinite(h.wpm)&&Number.isFinite(h.accuracy);
  const average=(rows,key)=>rows.length?Math.round(rows.reduce((sum,row)=>sum+row[key],0)/rows.length*10)/10:null;
  const readableKey=k=>k===' '?'Space':k==='\n'?'Enter':k==='\t'?'Tab':k;
  function analyzeTyping(history=[],weak={},goalWpm=65){
    const runs=(Array.isArray(history)?history:[]).filter(isTyping);
    const recent=runs.slice(-5);
    const standard=runs.filter(r=>r.kind==='wordtest');
    const avgWpm=average(recent,'wpm'),avgAccuracy=average(recent,'accuracy');
    const bestWpm=standard.length?Math.max(...standard.map(r=>r.wpm)):null;
    const missed=Object.entries(weak||{}).filter(([key,count])=>key&&Number.isFinite(count)&&count>0)
      .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key,count])=>({key,label:readableKey(key),count}));
    const focusKeys=missed.map(x=>x.key);
    const rhythmRows=recent.filter(x=>Number.isFinite(x.rhythm));
    const rhythm=average(rhythmRows,'rhythm');
    if(!recent.length){
      return {count:0,avgWpm:null,avgAccuracy:null,bestWpm,focusKeys,missed,
        title:'Establish your typing baseline',
        advice:'Start with a 30-second random test to set your first baseline. Keep your eyes on the screen and use the correct fingers. Repeat it a few times before chasing a faster WPM.',
        next:'Take a normal test',action:'standard',
        evidence:'No completed random-word tests yet.'};
    }
    let title,advice,next,action='standard',evidence;
    if(avgAccuracy<96){
      title='Make accuracy automatic before chasing speed';
      advice='Your recent raw accuracy is below 96%. Slow down slightly, finish each word accurately, and avoid looking at the keyboard. Repeat at a controlled pace until mistakes decline.';
      next=focusKeys.length?'Practise your most-missed keys':'Repeat an accuracy-first test';
      action=focusKeys.length?'focus':'standard';
      evidence='Average across '+recent.length+' recent random-word tests: '+avgAccuracy+'% accuracy.';
    }else if(rhythm!==null&&rhythm<60){
      title='Smooth out uneven keystrokes';
      advice='Accuracy is strong, but the rhythm estimate varies. Try an even, relaxed pace over whole words instead of accelerating between corrections. Rhythm excludes very short and long key intervals.';
      next='Repeat a steady test';evidence='Estimated rhythm '+rhythm+'/100 across available tests.';
    }else if(avgWpm<Number(goalWpm||65)){
      title='Build pace without losing control';
      advice='Your recent accuracy is good. Increase pace in small steps while staying above 96% accuracy. Compare several tests, not one unusually fast result.';
      next='Try a new random test';evidence='Recent average '+avgWpm+' WPM versus your '+Number(goalWpm||65)+' WPM target.';
    }else{
      title='Maintain consistency at your current speed';
      advice='Your latest results meet your target while keeping accuracy high. Mix normal and focused tests and review the trend across days instead of treating a single high score as your new baseline.';
      next=focusKeys.length?'Target recurring missed keys':'Take another random test';
      action=focusKeys.length?'focus':'standard';
      evidence='Recent average '+avgWpm+' WPM and '+avgAccuracy+'% accuracy.';
    }
    return {count:runs.length,avgWpm,avgAccuracy,bestWpm,focusKeys,missed,title,advice,next,action,evidence};
  }
  function completedFeedback(result,analysis){
    if(!result)return 'Take your first typing test to receive coaching.';
    const accuracy=Number(result.accuracy)||0;
    const words=result.wordCount?result.wordCount+'-word ':'';
    const observed='In this '+words+'test: '+Number(result.wpm).toFixed(1)+' WPM, '+accuracy.toFixed(1)+'% accuracy.';
    if(accuracy<96)return observed+' Aim for at least 96% raw accuracy before trying to type faster. Each corrected wrong key still counts as a mistake.';
    if(Number.isFinite(result.rhythm)&&result.rhythm<60)return observed+' Your pace was uneven. Try relaxed, consistent keystrokes and finish words cleanly.';
    return observed+' Good accuracy. Review your average across five tests before increasing the speed target.';
  }
  return {analyzeTyping,completedFeedback,version:1};
});