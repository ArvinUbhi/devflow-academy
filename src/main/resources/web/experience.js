(function(root) {
  'use strict';
  root.DevFlowExperience={create};
  function create(api) {
    const J=root.DevFlowJava,C=root.DevFlowChallenge,E=root.DevFlowEngine,P=root.DevFlowPractice;
    const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    let active=null, chapter='All', shareResult=null, dialogFocus=null;
    function showLearning(html) {
      $('training-overlay').classList.remove('hidden');
      document.querySelector('.app-shell')?.setAttribute('inert','');
      for(const id of ['trainer-typing','trainer-editor','trainer-finish'])$(id).classList.add('hidden');
      $('trainer-learning').classList.remove('hidden');
      $('trainer-learning').innerHTML=html;
      $('training-counter').textContent=active?.mode==='daily'?'DAILY FLOW · JAVA INSIGHT':active?.mode==='debug'?'DEBUG DOJO · FIX → UNDERSTAND':'JAVA PATH · LEARN → TYPE → RECALL → EXPLAIN';
      const heading=$('trainer-learning').querySelector?.('h1');
      if(heading){heading.id='learning-title';$('training-overlay').setAttribute('aria-labelledby','learning-title');heading.tabIndex=-1;heading.focus();}
    }
    function render() {
      const s=api.state(), today=C.daily(), p=C.progression(s), saved=s.daily.find(x=>x.key===today.key);
      $('home-daily-number').textContent='#'+today.number;
      $('home-challenge').textContent=saved?'See today’s score →':'Find today’s flow →';
      $('habit-strip').innerHTML=`<div><span class="habit-icon">◈</span><strong>${p.streak}</strong><span>day practice streak</span></div><div><span class="habit-icon">◆</span><strong>Level ${p.level}</strong><span>${p.xp} XP earned</span></div><div><span class="habit-icon">{ }</span><strong>${p.completed}/24</strong><span>Java patterns mastered</span></div><div><span class="habit-icon">↗</span><strong>${s.daily.length}</strong><span>daily flows completed</span></div>`;
      renderDaily(today,saved);
      renderJava();
      renderPractice();
    }
    function renderDaily(today,saved) {
      const s=api.state(),draft=s.dailyDraft?.key===today.key?s.dailyDraft:null;
      $('daily-number').textContent='#'+today.number+' · '+today.key+' UTC';
      $('daily-main').innerHTML=saved?resultCard(saved):`<span class="eyebrow">DAILY #${today.number} · JAVA 8</span><h2>A small challenge.<br>A satisfying finish.</h2><p class="section-intro">Today's concept: <strong>${esc(today.lesson.title)}</strong>. Three typing rounds, then one question to make the learning stick.</p><div class="daily-stages">${['Find your rhythm','Type real Java','Seal the pattern','Java insight'].map((x,i)=>`<div><span>${draft&&i<draft.segments.length?'✓':String(i+1).padStart(2,'0')}</span><strong>${x}</strong><small>${i<3?'TYPE':'THINK'}</small></div>`).join('')}</div><button class="primary-btn wide" data-flow="daily-start">${draft?'Continue your daily flow':'Start today’s challenge'} →</button><p class="quiet-copy">About 3–5 minutes · Timer starts on your first key · No paste</p><button class="text-link" data-flow="java-open" data-id="${today.lesson.id}">Learn this Java concept first ↗</button>`;
      const history=s.daily.slice(-14).reverse();
      $('daily-history').innerHTML=history.length?`<div class="table-scroll"><table class="list-table"><thead><tr><th>DAILY</th><th>POINTS</th><th>WPM</th><th>ACCURACY</th><th>JAVA</th><th></th></tr></thead><tbody>${history.map(x=>`<tr><td>#${x.number} <small>${esc(x.key)}</small></td><td>${x.points}/1000</td><td>${x.wpm}</td><td>${x.accuracy}%</td><td>${x.knowledge?'◆ Understood':'◇ Review'}</td><td><button class="text-link" data-flow="share" data-key="${x.key}">Share ↗</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="list-empty">Your first daily score starts the story. Ready when you are.</div>';
    }
    function resultCard(r) {
      return `<span class="eyebrow">DAILY #${r.number} · ${r.practice?'PRACTICE':'FIRST FINISH'}</span><h2>You found your flow.</h2><div class="score-points">${r.points}<span>/ 1000</span></div><div class="result-tiles" aria-label="Accuracy tiles by round">${r.segments.map(x=>`<div>${C.tiles(x)}</div>`).join('')}</div><div class="score-details"><span><strong>${r.wpm}</strong> WPM</span><span><strong>${r.accuracy}%</strong> accuracy</span><span><strong>${r.knowledge?'◆':'◇'}</strong> Java insight</span></div><div class="flow-actions"><button class="primary-btn" data-flow="share" data-key="${r.key}">Share my score ↗</button><button class="secondary-btn" data-flow="daily-start">Play again for practice</button></div><p class="quiet-copy">${r.practice?'Practice result. Your first finish remains saved.':'Your first finish is saved. Replays won’t change it.'} No code spoilers in your shared card.</p>`;
    }
    function renderJava() {
      const s=api.state(), done=J.lessons.filter(x=>s.java[x.id]?.mastered).length;
      const due=J.lessons.filter(x=>s.java[x.id]?.due&&Date.parse(s.java[x.id].due)<=Date.now());
      const next=due[0]||J.lessons.find(x=>!s.java[x.id]?.mastered)||J.lessons[0];
      $('java-progress').textContent=`${done} / 24 MASTERED`;
      $('java-recommend').innerHTML=`<div><span class="eyebrow">${due.length?'SPACED REVIEW · '+due.length+' READY':'YOUR NEXT SMALL WIN'}</span><h2>${esc(next.title)}</h2><p>${done?'Keep the patterns fresh. A short recall is better than starting from scratch.':'New to typing? Start with the home row, then learn your first Java pattern.'}</p></div><div class="flow-actions"><button class="primary-btn" data-flow="java-open" data-id="${next.id}">${due.length?'Review the pattern':'Start learning'} →</button>${done?'':'<button class="text-link" data-go="academy">Typing basics first ↗</button>'}</div>`;
      const chapters=['All',...new Set(J.lessons.map(x=>x.chapter))];
      $('java-filters').innerHTML=chapters.map(x=>`<button class="filter-btn ${chapter===x?'selected':''}" data-flow="chapter" data-chapter="${esc(x)}">${esc(x)}</button>`).join('');
      $('java-grid').innerHTML=J.lessons.filter(x=>chapter==='All'||x.chapter===chapter).map(l=>`<button class="java-card ${s.java[l.id]?.mastered?'is-mastered':''}" data-flow="java-open" data-id="${l.id}"><div class="java-card-top"><span class="java-number">${String(l.number).padStart(2,'0')}</span><span class="micro-label">${esc(l.chapter)}</span><span class="java-check">${s.java[l.id]?.mastered?'✓':'↗'}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.concept)}</p><div class="java-card-footer"><span>LEARN · TYPE · RECALL</span><span>~3 MIN</span></div></button>`).join('');
    }
    function keyName(key){return key===' '?'Space':key==='\n'?'Enter':key;}
    function renderPractice() {
      const s=api.state(),w=P.week(s),drill=P.weakDrill(s.weak),minutes=Math.floor(w.seconds/60),goal=s.settings.minutes;
      $('dojo-progress').textContent=w.solved.size+' / 12 CLEAN FIXES';
      $('quick-practice').innerHTML=`<div><span class="eyebrow">A QUICK WIN</span><h3>Two minutes. Better control.</h3><p>Today: ${minutes} / ${goal} minutes · Tune up ${drill.keys.map(k=>esc(keyName(k))).join(' · ')}</p></div><div class="flow-actions"><button class="primary-btn" data-flow="tune-up">Start a tune-up →</button><button class="text-link" data-go="practice">Try Debug Dojo ↗</button></div>`;
      $('tune-up').innerHTML=`<span class="eyebrow">YOUR KEYBOARD COACH</span><h2>A little more control.</h2><p class="section-intro">${esc(drill.guide)}</p><div class="key-picks">${Object.entries(s.weak).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([key,count])=>`<button class="key-pick" data-flow="tune-key" data-key="${esc(key)}"><kbd>${esc(keyName(key))}</kbd><small>${count} misses</small></button>`).join('')}</div><button class="primary-btn" data-flow="tune-up">Start two-minute tune-up →</button><p class="quiet-copy">Short untimed drills. Speed comes after accuracy.</p>`;
      $('practice-week').innerHTML=`<span class="eyebrow">YOUR LAST SEVEN DAYS · UTC</span><h2>${minutes} / ${goal} minutes today</h2><div class="progress-track" role="progressbar" aria-label="Daily practice goal" aria-valuenow="${Math.min(minutes,goal)}" aria-valuemin="0" aria-valuemax="${goal}"><div style="width:${Math.min(100,w.seconds/w.goal*100)}%"></div></div><div class="practice-days">${w.days.map(x=>`<div class="practice-day ${x.seconds?'practised':''}" title="${x.key}: ${Math.round(x.seconds/60)} minutes"><span>${new Date(x.key+'T12:00:00Z').toLocaleDateString(undefined,{weekday:'narrow',timeZone:'UTC'})}</span><strong>${x.seconds?'✓':'·'}</strong></div>`).join('')}</div><p class="quiet-copy">${w.seconds>=w.goal?'Daily goal met. Take a well-earned break.':'Completed exercises count toward your goal. A short session counts too.'}</p>`;
      $('debug-grid').innerHTML=P.fixes.map(x=>`<button class="java-card ${w.solved.has(x.id)?'is-mastered':''}" data-flow="debug-open" data-id="${x.id}"><div class="java-card-top"><span class="java-number">${String(x.number).padStart(2,'0')}</span><span class="micro-label">${esc(x.topic)}</span><span class="java-check">${w.solved.has(x.id)?'✓':'↗'}</span></div><h3>${esc(x.title)}</h3><p>${esc(x.symptom)}</p><div class="java-card-footer"><span>${w.solved.has(x.id)?'CLEAN FIX':'FIND · FIX · UNDERSTAND'}</span><span>~2 MIN</span></div></button>`).join('');
      $('milestones').innerHTML=w.badges.map(x=>`<div class="milestone ${x.earned?'earned':''}"><span aria-hidden="true">${x.earned?'◆':'◇'}</span><div><strong>${esc(x.name)} ${x.earned?'✓':''}</strong><p>${esc(x.detail)}</p></div></div>`).join('');
    }
    function tuneUp(key=null) {
      api.leave();active={mode:'tune'};const drill=P.weakDrill(api.state().weak,key);
      api.type({...drill,id:'tune-up',level:'TARGETED COACHING'},'drill');
    }
    function startDebug(id) {
      const fix=P.fixes.find(x=>x.id===id);if(!fix)return;
      api.leave();active={mode:'debug',fix,phase:'edit',assisted:false};
      api.edit({id:fix.id,language:'Java',title:fix.title,difficulty:'DEBUG DOJO',file:'Fix.java',instruction:fix.symptom+'\nExpected output: '+fix.output+'\nMake the smallest fix; spacing and indentation are flexible.',start:fix.start,expected:fix.expected,flexible:true});
      $('editor-description').textContent='Read the symptom, then type the fix. A clean fix uses no hints and passes on your first check.';
      $('editor-help').innerHTML='<button class="text-link" data-flow="debug-hint">Show a hint</button> · Ctrl/Cmd + Enter to check';
    }
    function startJava(id) {
      const lesson=J.lessons.find(x=>x.id===id);if(!lesson)return;
      api.leave();active={mode:'java',lesson,phase:'learn',assisted:false,typed:null};
      showLearning(`<div class="learning-steps"><span class="current">01 Learn</span><span>02 Type</span><span>03 Recall</span><span>04 Explain</span></div><p class="eyebrow">${esc(lesson.chapter)} · PATTERN ${lesson.number} / 24</p><h1>${esc(lesson.title)}<span class="violet">.</span></h1><p class="learning-concept">${esc(lesson.concept)}</p><div class="lesson-code"><div><span>Example.java</span><span>JAVA 8</span></div><pre><code>${highlight(lesson.code)}</code></pre></div><div class="learning-notes"><div><span class="eyebrow">THE IDEA TO KEEP</span><p>${esc(lesson.why)}</p></div><div><span class="eyebrow">TYPE WITH INTENT</span><p>${esc(lesson.tip)}</p></div></div><div class="shortcut-note"><span>INTELLIJ · ${esc(lesson.shortcut.name)}</span><kbd>${esc(lesson.shortcut.windows)}</kbd><small>WIN / LINUX</small><kbd>${esc(lesson.shortcut.mac)}</kbd><small>MAC</small></div><button class="primary-btn" data-flow="java-type">Got it. Let’s type →</button>`);
    }
    function highlight(code) {
      return esc(code).replace(/\b(public|private|class|interface|implements|int|double|long|boolean|void|return|if|else|for|while|new|try|catch|true|false|null)\b/g,'<span class="code-purple">$1</span>');
    }
    function startDaily() {
      api.leave();const s=api.state(),d=C.daily();
      const existing=s.dailyDraft?.key===d.key?s.dailyDraft:null;
      s.dailyDraft=existing||{key:d.key,number:d.number,segments:[],practice:s.daily.some(x=>x.key===d.key)};
      active={mode:'daily',daily:d,phase:'typing'};api.save();nextDaily();
    }
    function nextDaily() {
      const draft=api.state().dailyDraft;
      if(!draft||!active)return;
      if(draft.segments.length===3){
        if(typeof draft.knowledge==='boolean'){
          active.phase='answered';active.correct=draft.knowledge;explain(active.daily.lesson,draft.knowledge,true);
        }else{active.phase='knowledge';showQuestion(active.daily.lesson,true);}
        return;
      }
      const i=draft.segments.length,stage=active.daily.stages[i];
      api.type({...stage,id:`daily-${draft.key}-${stage.id}`,description:stage.description,dailyStage:i},'daily-flow');
      $('trainer-eyebrow').textContent=`DAILY #${draft.number} · ROUND ${i+1} OF 3${draft.practice?' · PRACTICE':''}`;
      $('training-counter').textContent=['● ○ ○','● ● ○','● ● ●'][i]+'  DAILY FLOW';
    }
    function showQuestion(lesson,daily=false) {
      showLearning(`<div class="learning-steps"><span>✓ ${daily?'Three typing rounds':'Learn'}</span><span class="current">${daily?'Java insight':'04 Explain'}</span></div><p class="eyebrow">MAKE THE IDEA STICK</p><h1>One last thought<span class="violet">.</span></h1><div class="lesson-code"><div><span>Read the code</span><span>JAVA 8</span></div><pre><code>${highlight(lesson.code)}</code></pre></div><h2>${esc(lesson.question.prompt)}</h2><div class="knowledge-options">${lesson.question.options.map((x,i)=>`<button class="knowledge-option" data-flow="answer" data-answer="${i}"><span>${i+1}</span>${esc(x)}</button>`).join('')}</div><p class="quiet-copy">First answer counts. You’ll see the explanation either way.</p>`);
    }
    function answer(index) {
      if(!active||active.phase!=='knowledge')return;
      const daily=active.mode==='daily',lesson=daily?active.daily.lesson:active.lesson;
      const correct=index===lesson.question.answer;
      active.phase='answered';active.correct=correct;
      if(daily){api.state().dailyDraft.knowledge=correct;api.save();}
      explain(lesson,correct,daily);
    }
    function explain(lesson,correct,daily) {
      showLearning(`<span class="eyebrow">${correct?'◆ IDEA UNDERSTOOD':'◇ A USEFUL THING TO LEARN'}</span><h1>${correct?'That’s the idea.':'Now you know.'}</h1><div class="answer-explanation"><h2>${esc(lesson.question.options[lesson.question.answer])}</h2><p>${esc(lesson.concept)}</p><p>${esc(lesson.why)}</p></div><button class="primary-btn" data-flow="finish-learning">${daily?'Reveal my daily score':'Finish this lesson'} →</button>`);
    }
    async function finishLearning() {
      if(!active||active.phase!=='answered')return;
      const s=api.state();
      if(active.mode==='daily') {
        const session=active;active.phase='finishing';
        const button=$('trainer-learning').querySelector('[data-flow="finish-learning"]');if(button){button.disabled=true;button.textContent='Saving your flow…';}
        await api.save();if(active!==session)return;
        const current=api.state(),d=current.dailyDraft;
        let r=current.daily.find(x=>x.key===session.daily.key),saved=true;
        if(d) {
          r={...C.score(d.segments,typeof d.knowledge==='boolean'?d.knowledge:session.correct),key:d.key,number:d.number,practice:d.practice};
          if(!d.practice&&!current.daily.some(x=>x.key===d.key))current.daily.push(r);
          current.dailyDraft=null;saved=await api.save();if(active!==session)return;
          if(!d.practice)r=api.state().daily.find(x=>x.key===d.key)||r;
        }
        if(!r){active.phase='answered';api.notify('Progress changed in another window. Reopen today’s daily.');return;}
        shareResult=r;active=null;
        api.result({eyebrow:`DAILY #${r.number} · ${r.practice?'PRACTICE':'FIRST FINISH'}`,title:`${r.points} / 1000. Flow found.`,description:`${r.knowledge?'You nailed the Java insight.':'A new Java idea to take into tomorrow.'} ${r.practice?'Your first result is unchanged.':saved?'Your daily score is saved.':'Saved in this browser. Use Retry save when the local server returns.'}`,stats:r,coaching:'The score rewards accuracy first, then pace and understanding. Come back tomorrow for a fresh challenge.',next:()=>api.go('daily'),nextLabel:'See my daily record →'});
        $('finish-share').classList.remove('hidden');
      } else {
        const lesson=active.lesson,previous=s.java[lesson.id]||{attempts:0},qualified=active.typed.accuracy>=94&&!active.assisted&&active.correct;
        const count=previous.attempts+1,days=qualified?Math.min(14,Math.pow(2,Math.min(count-1,4))):1;
        s.java[lesson.id]={mastered:!!previous.mastered||qualified,attempts:count,last:new Date().toISOString(),due:new Date(Date.now()+days*86400000).toISOString()};
        api.save();const next=J.lessons[lesson.number];
        showLearning(`<span class="eyebrow">${qualified?'PATTERN MASTERED ✓':'PATTERN PRACTISED'}</span><h1>${qualified?'You can type it. And explain it.':'Another useful repetition.'}</h1><p class="learning-concept">${qualified?'You typed with at least 94% accuracy, recalled the pattern without a hint, and understood the idea.':'Mastery needs 94% typing accuracy, an unassisted recall and a correct first explanation. Revisit this lesson to strengthen the pattern.'}</p><div class="score-details"><span><strong>${active.typed.wpm}</strong> typing WPM</span><span><strong>${active.typed.accuracy}%</strong> accuracy</span><span><strong>+${qualified&&!previous.mastered?80:30}</strong> XP</span></div><p class="section-intro">Ready for spaced review in ${days} day${days===1?'':'s'}.</p><div class="flow-actions">${next?`<button class="primary-btn" data-flow="java-open" data-id="${next.id}">Next: ${esc(next.title)} →</button>`:''}<button class="secondary-btn" data-go="java">Back to Java path</button></div>`);
        active.phase='done';
      }
      render();
    }
    function complete(t,result) {
      if(!active)return false;
      const s=api.state();
      if(active.mode==='debug'&&t.kind==='edit'&&t.item.id===active.fix.id) {
        const fix=active.fix,clean=!active.assisted&&result.errors===0;
        s.history.push({...result,kind:'debug',assisted:active.assisted});api.save();
        active.phase='done';
        showLearning(`<span class="eyebrow">${clean?'CLEAN FIX ✓':'BUG FIXED · KEEP LEARNING'}</span><h1>${esc(fix.title)}.</h1><div class="answer-explanation"><h2>Why this works</h2><p>${esc(fix.why)}</p><pre class="expected-output">${esc(fix.output)}</pre></div><p class="quiet-copy">${clean?'Solved without hints or failed checks. A useful pattern to remember.':'Hints and retries build understanding. Try again later for a clean fix.'} This exercise checks the taught code pattern; your code is not executed.</p><div class="flow-actions">${P.fixes[fix.number]?`<button class="primary-btn" data-flow="debug-open" data-id="${P.fixes[fix.number].id}">Next bug →</button>`:''}<button class="secondary-btn" data-go="practice">Back to practice studio</button><button class="text-link" data-flow="java-open" data-id="${fix.lesson}">Learn the concept ↗</button></div>`);render();return true;
      }
      if(active.mode==='daily'&&t.kind==='daily-flow') {
        const d=s.dailyDraft;if(!d)return false;
        if(d.segments.length!==t.item.dailyStage){api.notify('Another window advanced this daily. Continuing from the saved round.');nextDaily();return true;}
        d.segments.push({...result,characters:t.item.target.length,attempts:t.attempts});
        s.history.push({...result,kind:'daily',characters:t.item.target.length});api.save();
        api.finish({eyebrow:`ROUND ${d.segments.length} / 3 COMPLETE`,title:'Keep that rhythm.',description:active.daily.lesson.tip,stats:result,coaching:'Every correct character counts. The next round is ready when you are.',next:nextDaily,nextLabel:d.segments.length===3?'One Java insight →':'Next round →'});render();return true;
      }
      if(active.mode==='java'&&t.kind==='java-type') {
        active.typed=result;active.phase='recall';s.history.push(result);api.save();
        api.finish({eyebrow:'02 TYPE · COMPLETE',title:'Now make it yours.',description:'Recall a small Java pattern without the example in front of you.',stats:result,coaching:active.lesson.tip,next:()=>{
          api.edit({id:active.lesson.id,language:'Java',title:'Recall: '+active.lesson.title,difficulty:'ACTIVE RECALL',file:'Recall.java',instruction:active.lesson.recall.prompt,start:'',expected:active.lesson.recall.code});
          $('editor-help').innerHTML='Need a nudge? <button class="text-link" data-flow="hint">Show a hint</button> · Exact pattern expected; spacing matters.';
        },nextLabel:'Try it from memory →'});render();return true;
      }
      if(active.mode==='java'&&active.phase==='recall'&&t.kind==='edit'&&t.item.id===active.lesson.id) {
        s.history.push({...result,kind:'java-recall'});api.save();active.phase='knowledge';showQuestion(active.lesson);return true;
      }
      return false;
    }
    function cancel(){active=null;$('trainer-learning').classList.add('hidden');}
    function findResult(key) {return api.state().daily.find(x=>x.key===key)||(shareResult?.key===key?shareResult:null);}
    async function share(r) {
      if(!r)return;const text=C.share(r);
      if(navigator.share){try{await navigator.share({title:`DevFlow Daily #${r.number}`,text});return;}catch(e){if(e.name==='AbortError')return;}}
      if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);api.notify('Score copied. Challenge a friend.');return;}catch{}}
      dialogFocus=document.activeElement;$('share-text').value=text;$('share-dialog').classList.remove('hidden');$('share-text').focus();$('share-text').select?.();
    }
    function closeShare(){$('share-dialog').classList.add('hidden');dialogFocus?.focus();}
    function downloadCard(r) {
      if(!r)return;
      const tiles=r.segments.map((x,row)=>Array.from({length:5},(_,col)=>`<rect x="${66+col*48}" y="${145+row*46}" width="36" height="34" rx="7" fill="${col<Math.max(0,Math.min(5,Math.floor((x.accuracy-75)/5)))?'#92dfbd':x.accuracy>=85?'#e8c783':'#364052'}"/>`).join('')).join('');
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="480" viewBox="0 0 600 480"><rect width="600" height="480" rx="24" fill="#11141c"/><text x="60" y="66" fill="#f1efff" font-family="monospace" font-size="30" font-weight="bold">devflow.</text><text x="60" y="105" fill="#b4a3ff" font-family="sans-serif" font-size="16">DAILY #${r.number} · ${esc(r.key)} · JAVA</text>${tiles}<text x="60" y="342" fill="#ffffff" font-family="sans-serif" font-size="42" font-weight="bold">${r.points}<tspan fill="#939fb5" font-size="20"> / 1000</tspan></text><text x="60" y="382" fill="#d1d7e5" font-family="sans-serif" font-size="20">${r.wpm} WPM · ${r.accuracy}% accuracy</text><text x="60" y="432" fill="#939fb5" font-family="sans-serif" font-size="14">${r.practice?'Practice':'First finish'} · Local result · github.com/ArvinUbhi/devflow-academy</text></svg>`;
      const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));const link=document.createElement('a');link.href=url;link.download=`devflow-daily-${r.number}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
    }
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-flow]');if(!button)return;
      switch(button.dataset.flow) {
        case 'tune-up':tuneUp();break;
        case 'tune-key':tuneUp(button.dataset.key);break;
        case 'debug-open':startDebug(button.dataset.id);break;
        case 'debug-hint':if(active?.mode==='debug'&&active.phase==='edit'){active.assisted=true;$('editor-feedback').textContent=active.fix.hint;}break;
        case 'daily-start':startDaily();break;
        case 'java-open':startJava(button.dataset.id);break;
        case 'java-type':if(active?.mode==='java'){active.phase='typing';api.type({id:active.lesson.id,title:active.lesson.title,target:active.lesson.code,description:active.lesson.tip},'java-type');$('trainer-eyebrow').textContent='JAVA PATH · 02 TYPE';}break;
        case 'chapter':chapter=button.dataset.chapter;renderJava();break;
        case 'answer':answer(Number(button.dataset.answer));break;
        case 'finish-learning':finishLearning();break;
        case 'hint':if(active?.mode==='java'){active.assisted=true;$('editor-instruction').textContent=active.lesson.recall.prompt+'\nHint: '+active.lesson.recall.code;}break;
        case 'share':share(findResult(button.dataset.key));break;
      }
    });
    $('home-challenge').addEventListener('click',()=>{api.go('daily');if(!api.state().daily.some(x=>x.key===C.dayKey()))startDaily();});
    $('share-result').addEventListener('click',()=>share(shareResult));
    $('download-card').addEventListener('click',()=>downloadCard(shareResult));
    $('close-share').addEventListener('click',closeShare);
    document.addEventListener('keydown',event=>{
      if(!$('share-dialog').classList.contains('hidden')){
        if(event.key==='Escape'){event.preventDefault();closeShare();return;}
        if(event.key==='Tab'){event.preventDefault();(document.activeElement===$('share-text')?$('close-share'):$('share-text')).focus();}
      } else if(event.key==='Escape'&&active){api.leave();cancel();render();}
    });
    let lastDay=C.dayKey();
    setInterval(()=>{
      const n=new Date(),remaining=86400-(n.getUTCHours()*3600+n.getUTCMinutes()*60+n.getUTCSeconds());
      $('reset-clock').textContent=[Math.floor(remaining/3600),Math.floor(remaining%3600/60),remaining%60].map(x=>String(x).padStart(2,'0')).join(':');
      if(C.dayKey()!==lastDay){lastDay=C.dayKey();render();}
    },1000);
    return {render,complete,cancel,startJava,startDaily};
  }
})(window);
