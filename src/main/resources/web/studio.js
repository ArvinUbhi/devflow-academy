(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DevFlowStudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function create({state,save,startPractice,notify,onProfileChange}){
    const K=window.DevFlowKeyboards,T=window.DevFlowTyping,$=id=>document.getElementById(id);
    let layer=state().settings.keyboardLayer||0,selected=[],lastResult=null;
    const options=(items,current)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(id===current?'selected':'')+'>'+esc(name)+'</option>').join('');
    const card=(name,value,small='')=>'<div class="insight-stat"><span>'+esc(name)+'</span><strong>'+esc(value??'—')+'</strong><small>'+esc(small)+'</small></div>';
    function currentRows(){return T.filterHistory(state().history,{profile:K.active(state()).id,practice:true});}
    function profiles(){
      const ps=K.profiles(state()),active=K.active(state());
      for(const id of ['wordtest-keyboard','keyboard-profile'])$(id).innerHTML=options(ps.map(p=>[p.id,p.name]),active.id);
      const old=$('progress-profile').value||'all';
      $('progress-profile').innerHTML=options([['all','All keyboards'],...ps.map(p=>[p.id,p.name]),...state().history.filter(r=>r.profileId&&!ps.some(p=>p.id===r.profileId)).filter((r,i,a)=>a.findIndex(v=>v.profileId===r.profileId)===i).map(r=>[r.profileId,(r.profileName||r.profileId)+' (archived)']),['legacy','Earlier unlabelled sessions']],old);
    }
    function renderKeyboard(){
      const p=K.active(state());
      layer=Math.min(state().settings.keyboardLayer||0,(p.layers?.length||1)-1);
      $('keyboard-layer').innerHTML=options((p.layer_names||['QWERTY']).map((n,i)=>[String(i),i+' · '+n]),String(layer));
      $('keyboard-layer').disabled=p.type!=='glove80';
      $('keyboard-name').textContent=p.name;
      $('keyboard-meta').textContent=p.type==='glove80'?p.layers.length+' layers · 80 keys · '+p.locale:'Row-staggered keyboard · '+p.locale;
      const heat=Object.fromEntries(T.keyAnalysis(currentRows()).map(k=>[k.key,k]));
      $('keyboard-map').innerHTML=p.type==='glove80'?K.svg(p,{layer,heat,interactive:true,selected}):standardMap(p,heat);
      $('keyboard-warning').textContent=p.type==='glove80'?
        (p.unresolved?p.unresolved+' bindings need manual reference. ':'')+'The selected layer is used for typing guidance; transparent keys fall through to base. Custom behaviours and firmware layer state are not inferred.':
        'QWERTY guide for your selected OS layout. Select Glove80 or import its mapping when you switch keyboards.';
      $('keyboard-key-info').textContent=selected.length?selected.map(i=>{const g=K.geometry[i],b=K.resolve(p,layer,i);return g.pos+' · '+g.finger+' · '+b.raw;}).join(' / '):'Select keys on the Glove80 to inspect their binding and practise their tap characters.';
      $('keyboard-practice').disabled=p.type!=='glove80'||!selected.some(i=>K.resolve(p,layer,i).char);
      $('keyboard-profile-remove').classList.toggle('hidden',!(state().keyboards||[]).some(x=>x.id===p.id));
    }
    function standardMap(p,heat={}){
      const rows=['`1234567890-=','qwertyuiop[]\\',"asdfghjkl;'"+(p.locale==='en-GB'?'#':''),'zxcvbnm,./'];
      return '<div class="standard-preview">'+rows.map(row=>'<div class="kb-row">'+Array.from(row).map(c=>'<div class="keycap '+(heat[c]?.errors?'heat-key':'')+'" title="'+esc(heat[c]?heat[c].errors+'/'+heat[c].attempts+' missed · '+heat[c].rate+'%':'No measured attempts')+'">'+esc(c.toUpperCase())+'</div>').join('')+'</div>').join('')+'<div class="kb-row"><div class="keycap">Shift</div><div class="keycap space">SPACE</div><div class="keycap">Enter</div></div></div>';
    }
    function chart(rows,field='wpm',label='WPM over completed tests'){
      if(!rows.length)return '<div class="chart-empty">Your first test starts the story. No sample scores.</div>';
      const r=rows.slice(-40),max=field==='accuracy'?100:Math.max(40,...r.map(x=>x[field])),w=760,h=200,p=30;
      const x=i=>p+i*(w-2*p)/Math.max(1,r.length-1),y=n=>h-p-n/max*(h-2*p);
      const points=r.map((v,i)=>x(i)+','+y(v[field])).join(' ');
      return '<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'"><text class="chart-axis" x="0" y="28">'+Math.round(max)+'</text><text class="chart-axis" x="12" y="175">0</text><path d="M30,30 H730 M30,100 H730 M30,170 H730" class="chart-grid"/><polyline class="trend-line" points="'+points+'"/>'+r.map((v,i)=>'<circle cx="'+x(i)+'" cy="'+y(v[field])+'" r="4" class="trend-dot"><title>'+esc((v.date?new Date(v.date).toLocaleString():v.second+'s')+' · '+v[field]+(field==='accuracy'?'%':' WPM'))+'</title></circle>').join('')+'</svg>';
    }
    function wordTable(rows){
      const words=T.wordAnalysis(rows).filter(w=>w.errors||w.missed).slice(0,12);
      if(!words.length)return '<div class="list-empty">Missed and corrected words will appear here after a test.</div>';
      return '<table class="list-table"><thead><tr><th>WORD</th><th>MISTAKES</th><th>FAILED / FINISHED</th><th>AVG TIME</th></tr></thead><tbody>'+words.map(w=>'<tr><td><strong>'+esc(w.word)+'</strong></td><td>'+w.errors+'<small>'+w.backspaces+' deleted characters</small></td><td>'+w.missed+' / '+w.seen+'</td><td>'+(w.averageMs===null?'—':(w.averageMs/1000).toFixed(2)+'s')+'</td></tr>').join('')+'</tbody></table>';
    }
    function renderProgress(){
      const profile=$('progress-profile').value||'all',duration=$('progress-duration').value||'all',days=Number($('progress-period').value)||0;
      const rows=T.filterHistory(state().history,{profile,duration,days}),stats=T.summarize(rows);
      const keys=T.keyAnalysis(rows),weak=T.wordAnalysis(rows).filter(w=>w.errors||w.missed);
      $('progress-stats').innerHTML=card('TESTS COMPLETED',stats.count,'Normal random tests')+card('AVERAGE PACE',stats.wpm===null?'—':stats.wpm+' WPM','Weighted by time')+card('RAW ACCURACY',stats.accuracy===null?'—':stats.accuracy+'%','Corrected mistakes still count')+card('TIME INVESTED',stats.minutes+' min','Completed tests in this view');
      const cohorts=new Map();for(const r of rows){const key=T.cohort(r);if(!cohorts.has(key))cohorts.set(key,[]);cohorts.get(key).push(r);}
      const selectedCohort=$('progress-cohort').value;
      const label=r=>(r.profileName||'Earlier unlabelled')+(r.baseLayer?' · layer '+r.baseLayer:'')+' · '+(r.duration?r.duration+'s':(r.wordCount||'?')+' words')+(r.punctuation?' · punctuation':'')+(r.numbers?' · numbers':'');
      const entries=[...cohorts.entries()];
      $('progress-cohort').innerHTML=options(entries.map(([k,rs])=>[k,label(rs[0])]),cohorts.has(selectedCohort)?selectedCohort:entries[0]?.[0]);
      const comparable=cohorts.get($('progress-cohort').value)||[];
      $('progress-chart').innerHTML=chart(comparable);
      const recent=comparable.slice(-5),previous=comparable.slice(-10,-5),a=T.summarize(recent),b=T.summarize(previous);
      $('progress-trend-note').textContent=recent.length>=5&&previous.length>=5?'Last 5: '+a.wpm+' WPM · previous 5: '+b.wpm+' WPM · change '+(a.wpm>=b.wpm?'+':'')+(a.wpm-b.wpm).toFixed(1)+' WPM. Same keyboard, duration and options.':'Complete 10 tests with these settings to compare your latest five with the preceding five.';
      $('progress-accuracy-chart').innerHTML=chart(comparable,'accuracy','Raw accuracy over comparable tests');
      $('progress-records').innerHTML=entries.length?entries.map(([_,rs])=>card(label(rs[0]),T.summarize(rs).best+' WPM',rs.length+' tests')).join(''):'<p class="quiet-copy">Personal bests are separate for every keyboard, layout, duration and test option.</p>';
      $('progress-activity').innerHTML=T.activity(rows).map(d=>'<div class="activity-day level-'+Math.min(3,d.count)+'" title="'+d.date+' · '+d.count+' tests"><span>'+d.date.slice(-2)+'</span><b>'+d.count+'</b></div>').join('');
      $('progress-words').innerHTML=wordTable(rows);
      $('progress-practice-words').disabled=!weak.length;
      $('progress-keys').innerHTML=keys.length?keys.slice(0,10).map(k=>'<div class="key-rate"><kbd>'+esc(K.display(k.key))+'</kbd><div><strong>'+k.rate+'%</strong><small>'+k.errors+' misses / '+k.attempts+' attempts'+(k.attempts<20?' · small sample':'')+'</small></div><meter min="0" max="100" value="'+k.rate+'" aria-label="Error rate for '+esc(K.display(k.key))+'"></meter></div>').join(''):'<p class="quiet-copy">New tests measure attempts as well as misses, so common letters are treated fairly.</p>';
      $('progress-history').innerHTML=rows.length?'<table class="list-table"><thead><tr><th>WHEN</th><th>KEYBOARD / TEST</th><th>WPM / RAW</th><th>ACCURACY</th><th>CONSISTENCY</th></tr></thead><tbody>'+rows.slice(-30).reverse().map(r=>'<tr><td>'+esc(new Date(r.date).toLocaleString())+'</td><td>'+esc(label(r))+'</td><td>'+r.wpm+' / '+(r.rawWpm??'—')+'</td><td>'+r.accuracy+'%</td><td>'+(r.consistency??'—')+(r.consistency!=null?'%':'')+'</td></tr>').join('')+'</tbody></table>':'<div class="list-empty">No completed tests match these filters.</div>';
      $('progress-practice-words').onclick=()=>startPractice(T.practiceWords(rows),'wordtest-words','Practise your missed words');
      $('progress-export').onclick=()=>{
        const cols=['date','profileName','duration','wordCount','punctuation','numbers','wpm','rawWpm','accuracy','consistency','errors','backspaces'];
        const csv=[cols.join(','),...rows.map(r=>cols.map(k=>'"'+String(r[k]??'').replace(/"/g,'""').replace(/^[=+@-]/,"'$&")+'"').join(','))].join('\n');
        download(csv,'devflow-typing-results.csv','text/csv');
      };
    }
    function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    function result(r){
      lastResult=r;
      const area=$('finish-analysis');area.classList.remove('hidden');
      const prior=state().history.filter(x=>!(x.id===r.id&&x.date===r.date)&&x.kind==='wordtest'&&T.cohort(x)===T.cohort(r));
      const best=prior.length?Math.max(...prior.map(x=>x.wpm)):null;
      const pb=r.kind==='wordtest'&&(best===null||r.wpm>best);
      $('finish-record').textContent=(pb?(best===null?'BASELINE SET':'NEW PERSONAL BEST'):'SESSION SAVED')+' · '+r.profileName+' · '+(r.duration?r.duration+' seconds':r.wordCount+' words');
      $('finish-detail-stats').innerHTML=card('RAW PACE',r.rawWpm+' WPM','All attempted characters')+card('WORDS FINISHED',r.correctWords+' / '+r.completedWords,'Correct / completed')+card('CONSISTENCY',r.consistency===null?'—':r.consistency+'%','Steadiness of 1-second bursts')+card('DELETED CHARACTERS',r.backspaces,'Corrections stay in accuracy');
      $('finish-pace-chart').innerHTML=chart(r.samples||[]);
      $('finish-word-table').innerHTML=wordTable([r]);
      const pairs=Object.entries(r.confusions||{}).sort((a,b)=>b[1]-a[1]).slice(0,6);
      $('finish-confusions').textContent=pairs.length?'Expected → typed: '+pairs.map(([p,n])=>p.replaceAll(' ','␣')+' ('+n+')').join(' · '):'No wrong keystrokes recorded.';
      $('finish-word-review').innerHTML=(r.words||[]).slice(0,120).map(w=>'<span class="word-chip '+(w.partial?'partial':!w.correct?'wrong':w.errors?'corrected':'clean')+'" title="'+esc((w.partial?'Unfinished at timer':w.correct?'Correct at finish':'Incorrect at finish')+' · typed '+w.typed+' · '+w.errors+' raw mistakes')+'">'+esc(w.word)+(w.partial?'…':'')+'</span>').join('');
      $('finish-retry-words').disabled=!T.practiceWords([r],1).length;
    }
    function clearResult(){$('finish-analysis').classList.add('hidden');lastResult=null;}
    function render(){profiles();renderKeyboard();renderProgress();}
    function changeProfile(value){state().settings.keyboardProfile=value;state().settings.keyboardLayer=0;layer=0;selected=[];save();render();onProfileChange?.();notify('Using '+K.active(state()).name);}
    for(const id of ['wordtest-keyboard','keyboard-profile'])$(id).addEventListener('change',e=>changeProfile(e.target.value));
    $('keyboard-layer').addEventListener('change',e=>{layer=Number(e.target.value)||0;state().settings.keyboardLayer=layer;selected=[];save();renderKeyboard();});
    const toggleKey=ev=>{const el=ev.target.closest?.('[data-glove-key]');if(!el)return;const n=Number(el.dataset.gloveKey);selected=selected.includes(n)?selected.filter(x=>x!==n):[...selected,n];renderKeyboard();};
    $('keyboard-map').addEventListener('click',toggleKey);
    $('keyboard-map').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const id=e.target.dataset.gloveKey;toggleKey(e);$('keyboard-map').querySelector('[data-glove-key="'+id+'"]')?.focus();}});
    $('keyboard-practice').addEventListener('click',()=>{
      const p=K.active(state()),chars=selected.map(i=>K.resolve(p,layer,i).char).filter(c=>c&&/^[^\s]$/.test(c));
      if(!chars.length){notify('Select at least one letter, number or symbol to practise.');return;}
      const words=Array.from({length:25},()=>Array.from({length:3+Math.floor(Math.random()*3)},()=>chars[Math.floor(Math.random()*chars.length)]).join(''));
      startPractice(words,'wordtest-keys','Selected Glove80 keys');
    });
    $('keyboard-import').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        if(file.size>K.MAX_BYTES)throw Error('Choose a JSON layout smaller than 1 MB.');
        const profile=K.parse(await file.text()),existing=state().keyboards||[];
        if(existing.length>=8&&!existing.some(p=>p.id===profile.id))throw Error('You have eight saved layouts. Remove one before adding another.');
        state().keyboards=[...existing.filter(p=>p.id!==profile.id),profile];
        changeProfile(profile.id);$('keyboard-import-status').textContent='Imported '+profile.name+' · '+profile.layers.length+' layers. Mapping saved on this computer.';
      }catch(err){$('keyboard-import-status').textContent='Import failed: '+err.message;}
      e.target.value='';
    });
    $('keyboard-profile-remove').addEventListener('click',()=>{const id=K.active(state()).id;state().keyboards=state().keyboards.filter(p=>p.id!==id);changeProfile('glove80-default');notify('Layout removed. Historical scores are retained.');});
    for(const id of ['progress-profile','progress-duration','progress-period','progress-cohort'])$(id).addEventListener('change',renderProgress);
    $('finish-retry-words').addEventListener('click',()=>{if(lastResult)startPractice(T.practiceWords([lastResult]),'wordtest-words','Replay your missed words');});
    $('finish-copy-typing').addEventListener('click',async()=>{
      if(!lastResult)return;const r=lastResult,text='devflow. '+(r.duration?r.duration+'s':r.wordCount+' words')+' · '+r.wpm+' WPM · '+r.accuracy+'% accuracy\n'+r.profileName+' · '+(r.kind==='wordtest'?'random test':'focused practice')+' · '+(r.punctuation?'punctuation':'plain')+' · '+(r.numbers?'numbers':'letters')+'\nLocal, self-reported result. Created by Arvin Ubhi.';
      try{await navigator.clipboard.writeText(text);notify('Score copied — ready to share.');}catch{$('typing-share-fallback').classList.remove('hidden');$('typing-share-fallback').value=text;$('typing-share-fallback').focus();$('typing-share-fallback').select();}
    });
    return {render,renderProgress,renderKeyboard,result,clearResult,currentRows,standardMap};
  }
  return {create};
});
