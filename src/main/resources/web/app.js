(() => {
'use strict';
const E = window.DevFlowEngine;
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formatDate = iso => new Date(iso).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const nowISO = () => new Date().toISOString();
const round = E.round1;
const titleFor = name => ({dashboard:'Overview',academy:'Typing academy',lab:'Code lab',editor:'Editor gym',handicap:'Typing handicap',insights:'Insights',projects:'Projects',settings:'Settings'})[name];

const LESSONS = [
 {title:'Meet your home row',focus:'A S D F · J K L ;',level:'FOUNDATION',time:'3 min',guide:'Place your index fingers on F and J (the raised bumps). Keep wrists neutral. Always return your fingers home. Type slowly with the correct fingers.',target:'asdf jkl; asdf jkl; fj fj dk dk sl sl a; a; f j d k s l'},
 {title:'Left hand control',focus:'A S D F',level:'FOUNDATION',time:'4 min',guide:'Your left pinky presses A, ring finger S, middle D, and index F. Stay relaxed and return to the home row after each key.',target:'asdf fdsa asdf fdsa sass dads flags salad flask adds falls'},
 {title:'Right hand control',focus:'J K L ;',level:'FOUNDATION',time:'4 min',guide:'Right index on J, middle on K, ring on L and pinky on semicolon. Use your thumb to press Space.',target:'jkl; ;lkj jkl; ;lkj jill skill kill ilk silk all;'},
 {title:'Both hands together',focus:'FULL HOME ROW',level:'FOUNDATION',time:'5 min',guide:'Alternate between hands without looking down. Feel the raised keys on F and J when you need to reset.',target:'all fall sad flask ask dad glad salad shall dash flash'},
 {title:'Top row reaches',focus:'Q W E R T · Y U I O P',level:'CONTROL',time:'5 min',guide:'Reach up from the home row with the matching finger. Try not to lift your entire hand. Return to your resting position.',target:'type quiet write power your quite reply tower wire typo pair'},
 {title:'Bottom row reaches',focus:'Z X C V B · N M',level:'CONTROL',time:'5 min',guide:'Move your fingers downward briefly and return to home row. Use the index fingers to cover the centre keys.',target:'zoom mix cabin zinc move brave voice number curve'},
 {title:'Full alphabet fluency',focus:'A–Z',level:'CONTROL',time:'5 min',guide:'Now connect all three rows. Maintain relaxed shoulders and avoid chasing speed while your movements are still new.',target:'the quick brown fox jumps over the lazy dog. five brave developers solve complex problems every day.'},
 {title:'Shift and capital letters',focus:'SHIFT · CAMELCASE',level:'CONTROL',time:'5 min',guide:'Use the opposite-hand Shift when capitalising. For example, left Shift for J and right Shift for A.',target:'Java Python React TypeScript DevFlow NewProject getUserName'},
 {title:'Numbers and comparisons',focus:'0–9 · = · > · <',level:'SYNTAX',time:'5 min',guide:'Learn the number row in small groups. Keep your eyes on the screen, not the symbols printed on the keyboard.',target:'01234 56789 10 20 30 42 100 x = 10; x > 5; x < 20;'},
 {title:'Brackets and parentheses',focus:'( ) [ ] { }',level:'SYNTAX',time:'5 min',guide:'Practise typing complete balanced pairs. Brackets and braces are high-frequency movements in real code.',target:'() () [] [] {} {} if (ready) { return [1, 2, 3]; }'},
 {title:'Quotes and operators',focus:'" \u0027 + - * / !',level:'SYNTAX',time:'6 min',guide:'Code is rich in punctuation. Build accuracy with pairs of quotes and compound operators before worrying about pace.',target:'"hello" \'world\' x + y; a - b; a * b; x / 2; x != 0;'},
 {title:'Whitespace and indentation',focus:'SPACE · ENTER · TAB',level:'SYNTAX',time:'6 min',guide:'Press Enter confidently and practise consistent indentation. In lessons and code drills, Tab inserts four spaces.',target:'function greet(name) {\n    return "Hello, " + name;\n}\n'},
 {title:'Developer identifiers',focus:'camelCase · snake_case',level:'DEVELOPER',time:'6 min',guide:'Use rhythm to group related words. Your aim is to type identifiers fluidly without looking at every letter.',target:'getUserName fetchAccountBalance update_order_status isValidEmail calculateTotalPrice'},
 {title:'Java patterns',focus:'JAVA · SEMICOLONS',level:'DEVELOPER',time:'6 min',guide:'Practise common Java constructs and case changes. Accuracy on parentheses, dots and semicolons is especially useful.',target:'public static void main(String[] args) {\n    System.out.println("Hello, DevFlow!");\n}\n'},
 {title:'Python patterns',focus:'PYTHON · INDENTATION',level:'DEVELOPER',time:'6 min',guide:'Python relies on precise whitespace. Focus on colons, parentheses and indentation while retaining control.',target:'def average(values):\n    total = sum(values)\n    return total / len(values)\n'},
 {title:'Flow under pressure',focus:'MIXED DEVELOPMENT TEXT',level:'MASTER',time:'7 min',guide:'Your final academy challenge mixes prose, punctuation, symbols and code. Stay relaxed, keep accuracy high, then speed up.',target:'Fix the bug, write the test, then commit the change.\nconst isReady = (status) => status === "active";\n'}
].map((x,i)=>({...x,id:'lesson-'+(i+1)}));

const LABS = [
 ['Java','Print a message','BEGINNER','System.out.println("Hello, DevFlow!");'],
 ['Java','Declare a method','BEGINNER','public int add(int a, int b) {\n    return a + b;\n}'],
 ['Java','Loop through items','INTERMEDIATE','for (String item : items) {\n    System.out.println(item.toUpperCase());\n}'],
 ['Java','Stream filter','ADVANCED','List<String> names = users.stream()\n    .filter(user -> user.isActive())\n    .map(User::getName)\n    .collect(Collectors.toList());'],
 ['Python','Hello world','BEGINNER','name = "Developer"\nprint(f"Hello, {name}!")'],
 ['Python','List comprehension','BEGINNER','squares = [n ** 2 for n in range(10)]'],
 ['Python','Build a function','INTERMEDIATE','def is_even(number: int) -> bool:\n    return number % 2 == 0'],
 ['Python','Handle exceptions','ADVANCED','try:\n    result = int(user_input)\nexcept ValueError as error:\n    print(f"Invalid number: {error}")'],
 ['JavaScript','Arrow function','BEGINNER','const double = (number) => number * 2;'],
 ['JavaScript','Destructure a value','BEGINNER','const { name, role } = developer;\nconsole.log(name, role);'],
 ['JavaScript','Async operation','INTERMEDIATE','async function loadUser(id) {\n    const response = await fetch(`/users/${id}`);\n    return response.json();\n}'],
 ['JavaScript','Array pipeline','ADVANCED','const total = orders\n    .filter(order => order.paid)\n    .reduce((sum, order) => sum + order.amount, 0);'],
 ['C#','Write to console','BEGINNER','Console.WriteLine("Hello, DevFlow!");'],
 ['C#','Create a property','BEGINNER','public string Name { get; set; } = string.Empty;'],
 ['C#','LINQ filter','INTERMEDIATE','var activeUsers = users\n    .Where(user => user.IsActive)\n    .Select(user => user.Name)\n    .ToList();'],
 ['C#','Async method','ADVANCED','public async Task<User> GetUserAsync(int id)\n{\n    return await repository.FindAsync(id);\n}'],
 ['SQL','Select rows','BEGINNER','SELECT id, name, email\nFROM users\nWHERE active = 1;'],
 ['SQL','Sort and limit','BEGINNER','SELECT product_name, price\nFROM products\nORDER BY price DESC\nLIMIT 10;'],
 ['SQL','Join two tables','INTERMEDIATE','SELECT u.name, o.total\nFROM users AS u\nJOIN orders AS o ON o.user_id = u.id\nWHERE o.total > 100;'],
 ['SQL','Aggregate by group','ADVANCED','SELECT department, COUNT(*) AS people\nFROM employees\nGROUP BY department\nHAVING COUNT(*) >= 3;']
].map(([language,title,difficulty,target],i)=>({id:'lab-'+(i+1),language,title,difficulty,target}));

const EDITS = [
 {language:'Java',title:'Fix a comparison',difficulty:'BEGINNER',file:'Main.java',instruction:'The condition must check equality. Replace the assignment with a comparison using ==.',start:'if (count = 10) {\n    System.out.println("Ten");\n}',expected:'if (count == 10) {\n    System.out.println("Ten");\n}'},
 {language:'Python',title:'Repair indentation',difficulty:'BEGINNER',file:'main.py',instruction:'Indent the return statement using four spaces so it belongs to the function.',start:'def square(n):\nreturn n * n',expected:'def square(n):\n    return n * n'},
 {language:'JavaScript',title:'Correct a strict comparison',difficulty:'BEGINNER',file:'app.js',instruction:'Change == to === without changing anything else.',start:'const isReady = status == "ready";',expected:'const isReady = status === "ready";'},
 {language:'SQL',title:'Make the filter specific',difficulty:'BEGINNER',file:'query.sql',instruction:'Change the condition to only return users with active = 1.',start:'SELECT * FROM users\nWHERE active = 0;',expected:'SELECT * FROM users\nWHERE active = 1;'},
 {language:'C#',title:'Fix a missing semicolon',difficulty:'BEGINNER',file:'Program.cs',instruction:'Add the missing semicolon after the console statement.',start:'Console.WriteLine("Ready")',expected:'Console.WriteLine("Ready");'},
 {language:'Java',title:'Rename a variable',difficulty:'INTERMEDIATE',file:'Counter.java',instruction:'Rename both occurrences of tmp to total (leave everything else untouched).',start:'int tmp = 5;\nSystem.out.println(tmp);',expected:'int total = 5;\nSystem.out.println(total);'},
 {language:'Python',title:'Use snake_case',difficulty:'INTERMEDIATE',file:'profile.py',instruction:'Rename userName to user_name in both places.',start:'userName = "Ada"\nprint(userName)',expected:'user_name = "Ada"\nprint(user_name)'},
 {language:'JavaScript',title:'Change to const',difficulty:'INTERMEDIATE',file:'main.js',instruction:'The variable is not reassigned. Replace let with const.',start:'let maxRetries = 3;\nconsole.log(maxRetries);',expected:'const maxRetries = 3;\nconsole.log(maxRetries);'}
].map((x,i)=>({...x,id:'edit-'+(i+1)}));
const BENCHMARKS = [
 {id:'benchmark-prose',title:'Natural language',description:'A steady benchmark of natural language. Keep your eyes on the screen and fingers on the home row.',target:'Write clear code, make small changes, and test your assumptions. Great developers build reliable habits one step at a time.'},
 {id:'benchmark-symbols',title:'Symbols & syntax',description:'Accurate brackets, comparisons and operators. Remember that correct keys matter more than speed.',target:'() [] {} == === != <= >= => -> && || += -= "text" \'value\' ; :'},
 {id:'benchmark-code',title:'Real code',description:'Finish with a realistic multi-line programming sample. Use Enter and Tab for indentation.',target:'public int sum(int[] values) {\n    int result = 0;\n    for (int value : values) {\n        result += value;\n    }\n    return result;\n}\n'}
];
const LANGUAGES = ['All','Java','Python','JavaScript','C#','SQL'];
let state = E.defaultState();
let currentView = 'dashboard';
let filter = 'All';
let training = null;
let pendingSave = Promise.resolve();
let toastTimer = null;
let liveTicker = null;
let dailyPlan = null;
let projectInfo = {active:null,sessions:[]};
function projectTags() { const a=projectInfo.active;return a && a.repo ? {sessionId:a.id,projectId:a.repo.id,project:a.repo.name} : {}; }
async function refreshProject(){try{const res=await fetch('/api/project');if(res.ok)projectInfo=await res.json();}catch{}renderProjects();}

async function loadState() {
  try {
    const response = await fetch('/api/state');
    if (!response.ok) throw new Error('Unable to access local progress');
    state = E.sanitizeState(await response.json());
  } catch (e) {
    try { state = E.sanitizeState(JSON.parse(localStorage.getItem('devflow-fallback'))); }
    catch { state = E.defaultState(); }
    toast('Offline storage fallback in use; progress will stay in this browser');
  }
  await refreshProject();
  renderAll();
}
function saveState() {
  state = E.sanitizeState(state);
  const payload = JSON.stringify(state);
  pendingSave = pendingSave.catch(()=>{}).then(async () => {
    try {
      const res = await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:payload});
      if (!res.ok) throw new Error('Unable to save');
      localStorage.setItem('devflow-fallback',payload);
    } catch (error) {
      localStorage.setItem('devflow-fallback',payload);
      toast('Saved to this browser only — Java server unavailable');
    }
  });
  return pendingSave;
}
function toast(message) {
  $('toast').textContent=message;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);
}
function go(view) {
  if (training) leaveTraining();
  if (!titleFor(view)) return;
  currentView=view;
  $$('.view').forEach(node=>node.classList.toggle('active-view',node.id==='view-'+view));
  $$('.nav-item').forEach(node=>node.classList.toggle('active',node.dataset.view===view));
  $('page-crumb').textContent=titleFor(view);
  $('sidebar').classList.remove('open');
  if (view==='insights') renderInsights();
  if (view==='handicap') renderHandicap();
  if (view==='projects') refreshProject();
  window.scrollTo({top:0,behavior:'instant'});
}
function dataStats() {
  const history=state.history;
  const recent=history.slice(-20);
  const code=history.filter(x=>x.kind==='code');
  return {speed:code.length?Math.max(...code.map(x=>x.wpm)):null, accuracy:recent.length?round(recent.reduce((a,x)=>a+x.accuracy,0)/recent.length):null, count:history.length, minutes:Math.round(history.reduce((a,x)=>a+Number(x.seconds||0),0)/60), index:E.handicapIndex(state.rounds)};
}
function topWeak(n=5){return Object.entries(state.weak).sort((a,b)=>b[1]-a[1]).slice(0,n);}
function nextLesson(){return LESSONS.find(l=>!state.mastered[l.id]) || LESSONS[LESSONS.length-1];}
function personalizedText(){const keys=topWeak(3);return keys.length?`Focus: ${keys.map(([k])=>k===' '?'Space':k==='\n'?'Enter':k).join(' · ')} — your most frequently mistyped keys.`:'A balanced workout built to teach you proper technique before speed.';}
function barChart(el,values,{big=false}={}){
  if(!values.length){el.innerHTML='<div class="chart-empty">Complete a session to unlock your chart</div>';return;}
  const max=Math.max(40,...values.map(x=>x.wpm));
  el.innerHTML=values.map((x,i)=>`<div class="chart-bar" style="height:${Math.max(5,(x.wpm/max)*91)}%" ${big?`data-score="${round(x.wpm)}"`:''} title="${round(x.wpm)} WPM"><span>${big?esc(new Date(x.date).toLocaleDateString(undefined,{day:'numeric',month:'short'})):i+1}</span></div>`).join('');
}
function renderDashboard(){
 const ds=dataStats();
 $('current-date').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
 $('today-pill').textContent=new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
 $('topbar-username').textContent=state.settings.name;
 $('avatar-initial').textContent=state.settings.name[0].toUpperCase();
 $('hero-handicap').textContent=ds.index===null?'—':ds.index.toFixed(1);
 $('hero-status').textContent=ds.index===null?'NOT YET RATED':E.tier(ds.index).split(' · ')[0];
 $('hero-subtitle').textContent=ds.index===null?'Take your first assessment':E.tier(ds.index).split(' · ')[1];
 $('hero-rounds').textContent=`${state.rounds.length} official round${state.rounds.length===1?'':'s'}`;
 $('stat-wpm').textContent=ds.speed===null?'—':round(ds.speed);
 $('stat-accuracy').textContent=ds.accuracy===null?'—':round(ds.accuracy);
 $('goal-tag').textContent=`~${state.settings.minutes} MIN`;
 $('daily-technique').textContent=nextLesson().title;
 $('daily-weakness').textContent=topWeak(3).length?`Target ${topWeak(3).map(([k])=>k===' '?'Space':k==='\n'?'Enter':k).join(' / ')}`:'Accuracy before acceleration';
 $('daily-code').textContent=`${state.settings.language} · Code transcription`;
 $('personalized-tip').textContent=personalizedText();
 const mastered=LESSONS.filter(x=>state.mastered[x.id]).length;
 $('mastered-count').textContent=`${mastered} / ${LESSONS.length}`;
 $('lesson-progress-bar').style.width=100*mastered/LESSONS.length+'%';
 barChart($('mini-chart'),state.history.slice(-7));
 $('progress-headline').textContent=ds.count?`${ds.count} completed session${ds.count!==1?'s':''}`:'Your journey starts here';
 $('progress-description').textContent=ds.count?`${ds.minutes} minutes of focused training so far.`:'Complete a practice session to establish your baseline.';
}
function renderAcademy(){
 let mastered=LESSONS.filter(x=>state.mastered[x.id]).length;
 $('academy-progress').textContent=`${mastered} / ${LESSONS.length} MASTERED`;
 $('lesson-grid').innerHTML=LESSONS.map((l,i)=>`<button class="lesson-card ${state.mastered[l.id]?'lesson-done':''}" data-lesson="${l.id}"><div class="lesson-number">${state.mastered[l.id]?'✓':String(i+1).padStart(2,'0')}</div><div class="lesson-details"><strong>${esc(l.title)}</strong><p>${esc(l.guide)}</p><div class="lesson-footer"><span class="micro-label">${esc(l.level)} · ${l.time} · ${esc(l.focus)}</span><span class="${state.mastered[l.id]?'lesson-complete':'lesson-arrow'}">${state.mastered[l.id]?'MASTERED ✓':'↗'}</span></div></div></button>`).join('');
}
function renderLab(){
 $('language-filters').innerHTML=LANGUAGES.map(l=>`<button class="filter-btn ${filter===l?'selected':''}" data-filter="${esc(l)}">${esc(l)}</button>`).join('');
 const list=LABS.filter(l=>filter==='All'||l.language===filter);
 $('lab-grid').innerHTML=list.map(l=>`<button class="lab-card" data-lab="${l.id}"><div class="lab-card-head"><span class="language-pill">${esc(l.language)}</span><span class="difficulty">${l.difficulty}</span></div><h3>${esc(l.title)}</h3><p>Type this code with proper spacing and punctuation.</p><div class="lab-code">${esc(l.target.split('\n').slice(0,3).join('\n'))}</div><div class="lab-footer"><span>${l.target.length} CHARACTERS</span><span>Start workout ↗</span></div></button>`).join('');
}
function renderEditor(){
 $('editor-grid').innerHTML=EDITS.map(l=>`<button class="lab-card" data-edit="${l.id}"><div class="lab-card-head"><span class="language-pill">${esc(l.language)}</span><span class="difficulty">${l.difficulty}</span></div><h3>${esc(l.title)}</h3><p>${esc(l.instruction)}</p><div class="lab-code">${esc(l.start)}</div><div class="lab-footer"><span>${esc(l.file)}</span><span>Open editor ↗</span></div></button>`).join('');
}
function renderHandicap(){
 const index=E.handicapIndex(state.rounds);
 $('handicap-primary').textContent=index===null?'—':index.toFixed(1);
 $('handicap-tier').textContent=E.tier(index);
 $('handicap-note').textContent=index===null?'Complete three benchmark segments to establish your first provisional handicap.':state.rounds.length<3?'Provisional index — play three full rounds for a more reliable baseline.':'Based on the best three scores in your last eight rounds.';
 $('handicap-position').style.width=index===null?'0%':(100-index/54*100)+'%';
 $('handicap-round-count').textContent=`${state.rounds.length} ROUND${state.rounds.length!==1?'S':''}`;
 $('rounds-history').innerHTML=state.rounds.length?`<table class="list-table"><thead><tr><th>DATE</th><th>ROUND SCORE</th><th>CLASSIFICATION</th></tr></thead><tbody>${state.rounds.slice().reverse().map(r=>`<tr><td>${esc(formatDate(r.date))}</td><td>${Number(r.score).toFixed(1)}</td><td>${esc(E.tier(r.score))}</td></tr>`).join('')}</tbody></table>`:'<div class="list-empty">Your first benchmark is ready whenever you are.</div>';
}
function renderInsights(){
 const ds=dataStats(); const latest=state.history.filter(x=>x.kind!=='edit').slice(-12);
 const cards=[['COMPLETED SESSIONS',ds.count,'Sessions recorded'],['PRACTICE TIME',ds.minutes+'m','Minutes on keyboard'],['AVERAGE ACCURACY',ds.accuracy===null?'—':ds.accuracy+'%','Recent 20 sessions'],['CURRENT HANDICAP',ds.index===null?'—':ds.index.toFixed(1),'Lower is better']];
 $('insight-stats').innerHTML=cards.map(x=>`<div class="insight-stat"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
 barChart($('speed-chart'),latest,{big:true});
 let weak=topWeak();
 $('weak-keys').innerHTML=weak.length?weak.map(([k,count])=>`<div class="weak-row"><div class="weak-key">${esc(k===' '?'␣':k==='\n'?'↵':k)}</div><div class="weak-meter"><div style="width:${Math.min(100,count/Math.max(1,weak[0][1])*100)}%"></div></div><span>${count} misses</span></div>`).join(''):'<div class="list-empty">Your mistyped keys will appear here as you practise.</div>';
 $('session-history').innerHTML=latest.length?`<table class="list-table"><thead><tr><th>DATE</th><th>EXERCISE</th><th>WPM</th><th>ACCURACY</th><th>TIME</th></tr></thead><tbody>${latest.slice().reverse().map(h=>`<tr><td>${esc(formatDate(h.date))}</td><td>${esc(h.title||h.kind)}</td><td>${round(h.wpm)}</td><td>${round(h.accuracy)}%</td><td>${Math.round(h.seconds)}s</td></tr>`).join('')}</tbody></table>`:'<div class="list-empty">No sessions yet. Take your first lesson to start tracking progress.</div>';
}
function trendGraph(el, entries, field, label){
 const values=entries.filter(x=>Number.isFinite(x[field])).slice(-30);
 if(!values.length){el.innerHTML='<div class="chart-empty">Complete a repo-linked session to see your trend</div>';return;}
 const ceiling=field==='accuracy'?100:Math.max(60,...values.map(x=>x[field]));
 const w=700,h=170,p=20;
 const points=values.map((item,i)=>{
   const x=p+(values.length===1?0.5:i/(values.length-1))*(w-2*p);
   const y=h-p-(item[field]/ceiling)*(h-2*p);
   return [x,y];
 });
 const line=points.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
 const dots=points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#c1b4ff"><title>${round(values[i][field])}${field==='accuracy'?'%':' WPM'} · ${esc(new Date(values[i].endedAt||values[i].startedAt).toLocaleDateString())}</title></circle>`).join('');
 el.innerHTML=`<svg role="img" aria-label="${esc(label)} over completed repo sessions" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M${p},${h-p} H${w-p}" fill="none" stroke="#394155" stroke-width="2"/><polyline points="${line}" fill="none" stroke="#b8a8ff" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>${dots}</svg>`;
}
function renderProjects(){
 const active=projectInfo.active, past=Array.isArray(projectInfo.sessions)?projectInfo.sessions:[];
 const box=$('project-active'), stat=$('project-summary'), table=$('project-sessions');if(!box||!stat||!table)return;
 const recent=active?state.history.filter(h=>h.sessionId===active.id):[];
 const tracked=recent.filter(h=>Number.isFinite(h.wpm)&&Number.isFinite(h.accuracy));
 const avg=k=>tracked.length?round(tracked.reduce((sum,h)=>sum+h[k],0)/tracked.length):'—';
 box.innerHTML=active?`<span class="eyebrow">ACTIVE REPO SESSION</span><h2>${esc(active.repo.name)}</h2><p class="section-intro">${esc(active.repo.path)}</p><p>Started ${esc(new Date(active.startedAt).toLocaleString())}</p>`:'<span class="eyebrow">NO ACTIVE REPO SESSION</span><h2>Connect a Git repository</h2><p class="section-intro">Use the command line to link a repository and start tracking DevFlow browser exercises for that project.</p>';
 stat.innerHTML=[['COMPLETED DRILLS',tracked.length],['AVERAGE WPM',avg('wpm')],['ACCURACY',avg('accuracy')==='—'?'—':avg('accuracy')+'%']].map(([a,b])=>`<div class="insight-stat"><span>${a}</span><strong>${b}</strong></div>`).join('');
 table.innerHTML=past.length?`<table class="list-table"><thead><tr><th>DATE</th><th>REPOSITORY</th><th>DRILLS</th><th>WPM</th><th>ACCURACY</th></tr></thead><tbody>${past.slice(-30).reverse().map(x=>`<tr><td>${esc(formatDate(x.endedAt||x.startedAt))}</td><td>${esc(x.repo?.name||'Unknown')}</td><td>${Number(x.drills)||0}</td><td>${x.wpm===null?'—':Number(x.wpm).toFixed(1)}</td><td>${x.accuracy===null?'—':Number(x.accuracy).toFixed(1)+'%'}</td></tr>`).join('')}</tbody></table>`:'<div class="list-empty">No completed repository sessions yet. Run <code>devflow start</code>, finish some drills, and run <code>devflow stop</code>.</div>';
 trendGraph($('project-wpm-chart'),past,'wpm','Average WPM');trendGraph($('project-accuracy-chart'),past,'accuracy','Average accuracy');
 const history=state.history.filter(x=>x.projectId);$('project-drills').innerHTML=history.length?`<table class="list-table"><thead><tr><th>DATE</th><th>REPOSITORY</th><th>EXERCISE</th><th>WPM</th><th>ACCURACY</th></tr></thead><tbody>${history.slice(-25).reverse().map(x=>`<tr><td>${esc(formatDate(x.date))}</td><td>${esc(x.project||'Repo')}</td><td>${esc(x.title||x.kind)}</td><td>${Number(x.wpm).toFixed(1)}</td><td>${Number(x.accuracy).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`:'<div class="list-empty">Repo-linked drills appear here automatically.</div>';
}
function renderSettings(){
 $('setting-name').value=state.settings.name;
 $('setting-language').value=state.settings.language;
 $('setting-layout').value=state.settings.layout;
 $('setting-minutes').value=state.settings.minutes;
 $('setting-wpm').value=state.settings.goalWpm;
 $('setting-keyboard').checked=state.settings.showKeyboard;
}
function renderAll(){renderDashboard();renderAcademy();renderLab();renderEditor();renderHandicap();renderInsights();renderSettings();renderProjects();}

function weakTarget() {
 const focus = topWeak(3).map(([k])=>k.toLowerCase());
 const words = ['accuracy','array','access','return','string','class','function','parameter','object','index','value','variable','console','boolean','execute','exception','null','query','commit','debug','test','method','build','async','await','logic','typing','flow','keyboard','developer','syntax'];
 const relevant = words.filter(w=>focus.some(k=>w.includes(k)));
 const list = relevant.length >= 3 ? relevant : words.slice(0,14);
 return Array.from({length:4},()=>list.join(' ')).join('\n');
}
function startDaily() {
 const starter=nextLesson();
 const nextCode=LABS.find(l=>l.language===state.settings.language)||LABS[0];
 const warmup={...starter,target:[starter.target,starter.target,starter.target].join('\n')};
 const weak={id:'daily-weak',title:'Focused accuracy workout',level:'COACHING',guide:personalizedText()+' Keep a steady rhythm; repeat familiar movements without looking down.',target:weakTarget()};
 const code={...nextCode,target:[nextCode.target,nextCode.target].join('\n')};
 dailyPlan={index:0,steps:[{item:warmup,kind:'lesson'},{item:weak,kind:'drill'},{item:code,kind:'code'}]};
 playDaily(0);
}
function playDaily(index){
 if(!dailyPlan)return;
 dailyPlan.index=index;
 const part=dailyPlan.steps[index];
 runTyping(part.item,part.kind,null,true);
}
function runTyping(item, kind, assessmentIndex=null, fromDaily=false) {
 if(!fromDaily) dailyPlan=null;
 leaveTraining(fromDaily);
 training={item,kind,assessmentIndex,dailyIndex:fromDaily&&dailyPlan?dailyPlan.index:null,text:'',errors:0,attempts:0,start:null,intervals:[],lastKeyTime:null,intervalTimer:null};
 $('training-overlay').classList.remove('hidden');
 $('trainer-typing').classList.remove('hidden'); $('trainer-editor').classList.add('hidden'); $('trainer-finish').classList.add('hidden');
 $('trainer-eyebrow').textContent=kind==='lesson'?'ACADEMY · '+item.level:kind==='drill'?'TARGETED COACHING':kind==='code'?item.language.toUpperCase()+' · '+item.difficulty:'OFFICIAL BENCHMARK · SEGMENT '+(assessmentIndex+1)+' / 3';
 $('training-counter').textContent=kind==='assessment'?'HANDICAP ROUND · '+(assessmentIndex+1)+'/3':kind==='lesson'?'FOCUSED PRACTICE':kind==='drill'?'WEAK SPOT WORKOUT':'DEVELOPER CODE LAB';
 $('training-title').textContent=item.title;
 $('training-description').textContent=kind==='lesson'||kind==='drill'?item.guide:kind==='code'?'Reproduce the code exactly. Maintain case, indentation, whitespace and punctuation.':item.description;
 $('typing-label').textContent=kind==='assessment'?'OFFICIAL ASSESSMENT · NO PASTING':'TYPE THE TEXT BELOW';
 $('typing-capture').value='';
 $('keyboard-wrap').classList.toggle('hidden',!state.settings.showKeyboard);
 $('typing-card').classList.remove('hidden');
 updateTypingDisplay();
 window.scrollTo(0,0);
 setTimeout(()=>$('typing-capture').focus(),80);
}
function runEditor(item){
 leaveTraining();
 training={item,kind:'edit',start:null,keystrokes:0,errors:0};
 $('training-overlay').classList.remove('hidden'); $('trainer-typing').classList.add('hidden');$('trainer-editor').classList.remove('hidden');$('trainer-finish').classList.add('hidden');
 $('training-counter').textContent='EDITOR GYM · '+item.language.toUpperCase();
 $('editor-eyebrow').textContent=item.language.toUpperCase()+' · '+item.difficulty;
 $('editor-title').textContent=item.title;
 $('editor-description').textContent='Use your editor navigation, selection and typing skills to make the requested change.';
 $('editor-instruction').textContent=item.instruction;
 $('editor-filename').textContent=item.file;
 $('editor-input').value=item.start;
 $('editor-feedback').textContent='Keyboard tip: Home/End and Ctrl/Cmd + arrows can make edits faster.';
 window.scrollTo(0,0);
 setTimeout(()=>$('editor-input').focus(),80);
}
function startAssessment(index=0,results=[]){
 const item=BENCHMARKS[index];
 runTyping(item,'assessment',index);
 training.assessmentResults=results;
}
function leaveTraining(preserveDaily=false){
 if(!preserveDaily)dailyPlan=null;
 if (liveTicker) {clearInterval(liveTicker);liveTicker=null;}
 training=null;
 $('training-overlay').classList.add('hidden');
}
function computeLive(){
 if (!training||training.kind==='edit') return null;
 const correct=Array.from(training.text).reduce((n,ch,i)=>n+(ch===training.item.target[i]?1:0),0);
 const seconds=training.start?Math.max(.2,(performance.now()-training.start)/1000):0;
 return {wpm:E.wpm(correct,seconds),accuracy:E.accuracy(training.attempts,training.errors),rhythm:E.rhythm(training.intervals),seconds,errors:training.errors,correct};
}
function keyFinger(char){
 const map={q:'LEFT PINKY',a:'LEFT PINKY',z:'LEFT PINKY',w:'LEFT RING',s:'LEFT RING',x:'LEFT RING',e:'LEFT MIDDLE',d:'LEFT MIDDLE',c:'LEFT MIDDLE',r:'LEFT INDEX',t:'LEFT INDEX',f:'LEFT INDEX',g:'LEFT INDEX',v:'LEFT INDEX',b:'LEFT INDEX',y:'RIGHT INDEX',u:'RIGHT INDEX',h:'RIGHT INDEX',j:'RIGHT INDEX',n:'RIGHT INDEX',m:'RIGHT INDEX',i:'RIGHT MIDDLE',k:'RIGHT MIDDLE',',':'RIGHT MIDDLE',o:'RIGHT RING',l:'RIGHT RING','.':'RIGHT RING',p:'RIGHT PINKY',';':'RIGHT PINKY','/':'RIGHT PINKY',' ':'THUMB','\n':'RIGHT PINKY'};
 return map[char.toLowerCase()]||'CHECK SYMBOL POSITION';
}
function keyName(char){
 if(char===' ')return 'SPACE';if(char==='\n')return 'ENTER';if(char==='\t')return 'TAB';return char.toUpperCase();
}
function renderKeyboard(next){
 const rows=['QWERTYUIOP','ASDFGHJKL;','ZXCVBNM,./'];
 const extra=next===' ' ? 'SPACE' : next==='\n' ? 'ENTER' : next.toUpperCase();
 let keys=rows.map((r,i)=>`<div class="kb-row">${Array.from(r).map(x=>`<div class="keycap ${i===1?'home':''} ${x===extra?'active':''}">${esc(x)}</div>`).join('')}</div>`).join('');
 keys+=`<div class="kb-row"><div class="keycap space ${extra==='SPACE'?'active':''}">SPACE</div><div class="keycap ${extra==='ENTER'?'active':''}">↵</div></div>`;
 $('virtual-keyboard').innerHTML=keys;
 $('next-key-label').textContent='NEXT · '+keyName(next||'')+' · '+keyFinger(next||' ');
}
function updateTypingDisplay(){
 if(!training||training.kind==='edit')return;
 const item=training.item,typed=training.text;
 const chars=Array.from(item.target);
 const html=chars.map((char,i)=>{
  const cl=i<typed.length?(typed[i]===char?'prompt-correct':'prompt-wrong'):i===typed.length?'prompt-current':'prompt-upcoming';
  return `<span class="${cl}">${esc(char)}</span>`;
 }).join('');
 $('typing-prompt').innerHTML=html;
 $('typing-progress').textContent=`${Math.min(100,Math.floor((typed.length/item.target.length)*100))}%`;
 const stats=computeLive();
 $('live-wpm').textContent=round(stats.wpm);
 $('live-accuracy').textContent=round(stats.accuracy);
 $('live-time').textContent=`${Math.floor(stats.seconds/60)}:${String(Math.floor(stats.seconds%60)).padStart(2,'0')}`;
 $('live-errors').textContent=stats.errors;
 $('trainer-coach').textContent=typed.length&&typed[typed.length-1]!==item.target[typed.length-1]?'✦ Look at the highlighted key, correct it, then continue.':'✦ Smooth, accurate typing beats rushing.';
 if (state.settings.showKeyboard)renderKeyboard(item.target[typed.length]||'');
}
function captureInput(value){
 if(!training||training.kind==='edit')return;
 const t=training;
 if(value.length>t.item.target.length){$('typing-capture').value=t.text;return;}
 if(!t.start&&value.length){t.start=performance.now();liveTicker=setInterval(updateTypingDisplay,500);}
 if(value.length>t.text.length){
   const instant=performance.now();
   for(let i=t.text.length;i<value.length;i++){
     t.attempts++;
     const expected=t.item.target[i];
     if(value[i]!==expected){t.errors++;state.weak[expected]=(state.weak[expected]||0)+1;}
     if(t.lastKeyTime!==null)t.intervals.push(instant-t.lastKeyTime);
     t.lastKeyTime=instant;
   }
 }
 t.text=value;
 updateTypingDisplay();
 if(t.text===t.item.target)finishTyping();
}
function finishTyping(){
 const t=training;if(!t)return;
 const stats=computeLive();
 if(liveTicker){clearInterval(liveTicker);liveTicker=null;}
 const result={date:nowISO(),id:t.item.id,kind:t.kind,title:t.item.title,wpm:stats.wpm,accuracy:stats.accuracy,rhythm:stats.rhythm,errors:stats.errors,seconds:round(stats.seconds),...projectTags()};
 if(t.kind==='lesson'){
   if(stats.accuracy>=94)state.mastered[t.item.id]=true;
   state.history.push(result);
   saveState();
   const nextIdx=LESSONS.findIndex(l=>l.id===t.item.id)+1;
   showFinish({eyebrow:stats.accuracy>=94?'LESSON MASTERED':'LESSON COMPLETED',title:stats.accuracy>=94?'Another skill unlocked.':'Good work — sharpen your accuracy.',description:stats.accuracy>=94?'Your technique is getting more reliable.':'Reach 94% accuracy or better to mark this lesson mastered.',stats:result,coaching:coachFeedback(result),next:nextIdx<LESSONS.length?()=>runTyping(LESSONS[nextIdx],'lesson'):()=>go('lab'),nextLabel:nextIdx<LESSONS.length?'Next lesson →':'Explore code lab →'});
 } else if(t.kind==='drill'){
   state.history.push(result);saveState();
   showFinish({eyebrow:'FOCUSED WORKOUT COMPLETE',title:'Accuracy takes repetition.',description:'You worked on the keys your training history identifies as difficult.',stats:result,coaching:coachFeedback(result),next:()=>go('dashboard'),nextLabel:'Back to dashboard →'});
 } else if(t.kind==='code'){
   state.history.push(result);saveState();
   const next=LABS[(LABS.findIndex(l=>l.id===t.item.id)+1)%LABS.length];
   showFinish({eyebrow:'CODE WORKOUT COMPLETE',title:'You stayed in flow.',description:'You completed a realistic coding drill.',stats:result,coaching:coachFeedback(result),next:()=>runTyping(next,'code'),nextLabel:'Next code drill →'});
 } else if(t.kind==='assessment'){
   const results=[...(t.assessmentResults||[]),result];
   if(t.assessmentIndex<2){
     showFinish({eyebrow:`SEGMENT ${t.assessmentIndex+1} COMPLETE`,title:'Keep the round going.',description:`${3-results.length} segment${3-results.length===1?'':'s'} remaining until your handicap is calculated.`,stats:result,coaching:coachFeedback(result),next:()=>startAssessment(t.assessmentIndex+1,results),nextLabel:'Next segment →'});
   } else {
     const score=E.roundScore(results);
     state.rounds.push({date:nowISO(),score,...projectTags(),segments:results.map(x=>({wpm:x.wpm,accuracy:x.accuracy,rhythm:x.rhythm}))});
     state.history.push(...results);
     saveState();
     showFinish({eyebrow:'OFFICIAL ROUND COMPLETE',title:`Round score: ${score.toFixed(1)}`,description:'Lower is better. Your handicap index averages the best three of your eight latest rounds.',stats:result,coaching:`Current handicap: ${E.handicapIndex(state.rounds).toFixed(1)} · ${E.tier(E.handicapIndex(state.rounds))}`,next:()=>go('handicap'),nextLabel:'View your handicap →'});
   }
 }
 if(dailyPlan && t.dailyIndex!==null){
   const i=t.dailyIndex;
   if(i+1<dailyPlan.steps.length){
     training.finishNext=()=>playDaily(i+1);
     $('finish-next').textContent='Continue · '+dailyPlan.steps[i+1].item.title+' →';
   }else{
     training.finishNext=()=>{leaveTraining();go('dashboard');toast('Daily workout complete — great consistency!');};
     $('finish-next').textContent='Finish daily workout ✓';
   }
 }
 renderAll();
}
function coachFeedback(s){
 if(s.accuracy<94)return `Focus on accuracy next time. ${s.errors} correction${s.errors!==1?'s':''} were needed — slow down until the movements feel natural.`;
 if(s.rhythm<55)return 'Your accuracy is strong. Try an even rhythm rather than sudden bursts of speed.';
 if(s.wpm<state.settings.goalWpm)return `Great control. Build pace gradually toward your ${state.settings.goalWpm} WPM target.`;
 return 'Great combination of speed and accuracy. Keep practising to retain this performance.';
}
function showFinish({eyebrow,title,description,stats,coaching,next,nextLabel}){
 if(!training)return;
 training.finishNext=next;
 $('trainer-typing').classList.add('hidden');$('trainer-editor').classList.add('hidden');$('trainer-finish').classList.remove('hidden');
 $('finish-eyebrow').textContent=eyebrow;$('finish-title').textContent=title;$('finish-description').textContent=description;
 $('finish-stats').innerHTML=[['EFFECTIVE WPM',round(stats.wpm)],['ACCURACY',round(stats.accuracy)+'%'],['TOTAL TIME',Math.round(stats.seconds)+'s']].map(([label,value])=>`<div class="finish-stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
 $('finish-coaching').textContent='✦ COACH NOTES · '+coaching;
 $('finish-next').textContent=nextLabel;
 window.scrollTo(0,0);
}
function checkEditor(){
 if(!training||training.kind!=='edit')return;
 const t=training, actual=$('editor-input').value.replace(/\r\n/g,'\n').trimEnd(),expected=t.item.expected.trimEnd();
 if(actual!==expected){
   const linesA=actual.split('\n'),linesB=expected.split('\n');
   const line=linesA.findIndex((l,i)=>l!==linesB[i]);
   $('editor-feedback').textContent=`Not quite yet. Check line ${line+1}, and review the task instruction carefully.`;
   $('editor-feedback').style.color='#f4a7ad';
   t.errors++;
   return;
 }
 const seconds=Math.max(.2,(performance.now()-(t.start||performance.now()))/1000);
 const edits=t.keystrokes||1;
 const stats={date:nowISO(),id:t.item.id,kind:'edit',title:t.item.title,wpm:E.wpm(edits,seconds),accuracy:E.accuracy(edits+t.errors,t.errors),rhythm:0,errors:t.errors,seconds:round(seconds),...projectTags()};
 state.history.push(stats);saveState();renderAll();
 const next=EDITS[(EDITS.findIndex(e=>e.id===t.item.id)+1)%EDITS.length];
 showFinish({eyebrow:'EDITOR CHALLENGE SOLVED',title:'Bug fixed. Nicely done.',description:'You completed the edit with your keyboard.',stats,coaching:'Try finishing the next edit with fewer keystrokes and more keyboard navigation. Editor speeds are not included in official handicap ratings.',next:()=>runEditor(next),nextLabel:'Next editor task →'});
}
function setupActions(){
 document.addEventListener('click',ev=>{
  const nav=ev.target.closest('[data-view]');if(nav){go(nav.dataset.view);return;}
  const goto=ev.target.closest('[data-go]');if(goto){go(goto.dataset.go);return;}
  const action=ev.target.closest('[data-action]');if(action&&action.dataset.action==='assessment'){startAssessment();return;}
  const lesson=ev.target.closest('[data-lesson]');if(lesson){const l=LESSONS.find(x=>x.id===lesson.dataset.lesson);if(l)runTyping(l,'lesson');return;}
  const lab=ev.target.closest('[data-lab]');if(lab){const l=LABS.find(x=>x.id===lab.dataset.lab);if(l)runTyping(l,'code');return;}
  const edit=ev.target.closest('[data-edit]');if(edit){const l=EDITS.find(x=>x.id===edit.dataset.edit);if(l)runEditor(l);return;}
  const filt=ev.target.closest('[data-filter]');if(filt){filter=filt.dataset.filter;renderLab();}
 });
 $('menu-toggle').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
 $('start-daily').addEventListener('click',startDaily);
 $('side-practice').addEventListener('click',startDaily);
 $('exit-training').addEventListener('click',()=>{leaveTraining();renderAll();});
 $('finish-exit').addEventListener('click',()=>{leaveTraining();go('dashboard');renderAll();});
 $('finish-next').addEventListener('click',()=>{if(training&&training.finishNext)training.finishNext();});
 $('restart-training').addEventListener('click',()=>{if(training)runTyping(training.item,training.kind,training.assessmentIndex,training.dailyIndex!==null);});
 $('typing-card').addEventListener('click',()=>$('typing-capture').focus());
 $('typing-card').addEventListener('keydown',e=>{if(e.target===e.currentTarget&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('typing-capture').focus();}});
 $('typing-capture').addEventListener('paste',e=>{e.preventDefault();toast('Paste is disabled — train the movements, not your clipboard.');});
 $('typing-capture').addEventListener('drop',e=>e.preventDefault());
 $('typing-capture').addEventListener('input',e=>captureInput(e.target.value));
 $('typing-capture').addEventListener('keydown',e=>{
  if(e.key==='Tab'){
    e.preventDefault();const t=training;if(t&&t.kind!=='edit'){
      const inp=$('typing-capture');inp.value=inp.value.slice(0,inp.selectionStart)+'    '+inp.value.slice(inp.selectionEnd);captureInput(inp.value);
    }
  }
 });
 $('editor-input').addEventListener('paste',e=>{e.preventDefault();toast('Paste is disabled — use your keyboard to edit.');});
 $('editor-input').addEventListener('drop',e=>e.preventDefault());
 $('editor-input').addEventListener('input',()=>{if(training&&training.kind==='edit'){if(!training.start)training.start=performance.now();training.keystrokes++;$('editor-feedback').style.color='';}});
 $('editor-input').addEventListener('keydown',e=>{
   if(e.key==='Tab'){e.preventDefault();const node=e.target,start=node.selectionStart,end=node.selectionEnd;node.value=node.value.slice(0,start)+'    '+node.value.slice(end);node.selectionStart=node.selectionEnd=start+4;node.dispatchEvent(new Event('input',{bubbles:true}));}
 });
 $('check-edit').addEventListener('click',checkEditor);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&training){leaveTraining();renderAll();}});
 $('preferences-form').addEventListener('submit',async e=>{
   e.preventDefault();
   state.settings={name:$('setting-name').value.trim()||'Developer',language:$('setting-language').value,layout:$('setting-layout').value,minutes:Number($('setting-minutes').value),goalWpm:Number($('setting-wpm').value),showKeyboard:$('setting-keyboard').checked};
   await saveState();renderAll();$('settings-feedback').textContent='Settings saved successfully.';toast('Preferences updated');
 });
 $('export-btn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download='devflow-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1200);
 });
 $('import-file').addEventListener('change',async e=>{
  const file=e.target.files&&e.target.files[0];if(!file)return;
  try{const imported=JSON.parse(await file.text());if(!imported||imported.version!==1||!Array.isArray(imported.history))throw Error('Unsupported progress file');state=E.sanitizeState(imported);await saveState();await refreshProject();renderAll();toast('Progress imported successfully');}
  catch(err){toast('Import failed: '+err.message);}
  e.target.value='';
 });
 $('reset-btn').addEventListener('click',async()=>{
  if(!confirm('Delete all DevFlow progress saved on this device? This cannot be undone.'))return;
  state=E.defaultState();await saveState();renderAll();toast('Progress reset');
 });
}
setupActions();
loadState();
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
