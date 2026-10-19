import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),K=require('../src/main/resources/web/keyboards.js'),E=require('../src/main/resources/web/engine.js');
const exported=()=>({keyboard:'glove80',title:'My split',locale:'en-US',layer_names:['Base','Symbols'],layers:[Array.from({length:80},()=>({value:'&none'})),Array.from({length:80},()=>({value:'&trans'}))]});

test('all 80 physical keys use official MoErgo positions, including mirrored thumb clusters',()=>{
 assert.equal(K.geometry.length,80);assert.deepEqual(K.geometry.map(k=>k.index),Array.from({length:80},(_,i)=>i));
 for(const [index,pos] of [[4,'LH C2R1'],[15,'LH C1R2'],[51,'LH C1R5'],[52,'LH T1'],[57,'RH T1'],[68,'LH C2R6'],[71,'LH T6'],[72,'RH T6']])assert.equal(K.geometry[index].pos,pos);
 assert.equal(K.locate(K.defaultProfile(),' ').index,74);
 assert.equal(K.locate(K.defaultProfile(),'f').pos,'LH C2R4');
 assert.equal(K.locate(K.defaultProfile(),'J').shift,true);
});
test('imports MoErgo nested value/params export with numeric layers and shift wrappers',()=>{
 const x=exported();x.layers[0][35]={value:'&mt',params:[{value:'LCTRL'},{value:'A'}]};
 x.layers[0][54]={value:'&lt',params:[{value:1},{value:'SPACE'}]};
 x.layers[1][22]={value:'&kp',params:[{value:'LS',params:[{value:'N1'}]}]};
 x.layers[1][55]={value:'&tog',params:[{value:1}]};
 const p=K.parse(x);assert.equal(K.resolve(p,0,35).char,'a');assert.equal(K.resolve(p,0,35).hold,'Ctrl');
 assert.equal(K.resolve(p,0,54).char,' ');assert.equal(K.resolve(p,1,35).char,'a');
 assert.equal(K.locate(p,'!').layer,1);assert.equal(K.resolve(p,1,55).hold,'1');
 assert.equal(K.parse({...x,title:'Renamed'}).id,p.id);
 assert.equal(K.sanitizeProfiles([p,p]).length,1);
});
test('unknown custom behaviours stay reference-only and malicious labels are escaped',()=>{
 const x=exported();x.layers[0][1]={value:'Custom',params:[{value:'&home_macro A'}]};
 x.layers[0][2]={value:'Custom',params:[{value:'<script>alert(1)</script>'}]};
 const p=K.parse(x);assert.equal(p.unresolved,2);assert.equal(K.locate(p,'a'),null);
 assert.doesNotMatch(K.svg(p),/<script>/);assert.match(K.svg(p),/&lt;script&gt;/);
});
test('rejects malformed, other-keyboard, oversized, deep and wrong-count exports',()=>{
 assert.throws(()=>K.parse('not json'),/JSON/);
 assert.throws(()=>K.parse({...exported(),keyboard:'go60'}),/Glove80/);
 assert.throws(()=>K.parse({...exported(),layers:[[]]}),/80/);
 assert.throws(()=>K.parse(' '.repeat(K.MAX_BYTES+1)),/1 MB/);
 let node={value:'A'};for(let i=0;i<15;i++)node={value:'LS',params:[node]};const x=exported();x.layers[0][0]=node;
 assert.throws(()=>K.parse(x),/deep/);
});
test('UK and US output are distinct; unsupported locale output is not guessed',()=>{
 assert.equal(K.keyCode('LS(N2)','en-US').char,'@');assert.equal(K.keyCode('LS(N2)','en-GB').char,'"');
 assert.equal(K.keyCode('BSLH','en-GB').char,'#');assert.equal(K.keyCode('GB_BSLH','en-GB').char,'\\');
 assert.equal(K.keyCode('LC(A)','en-US').char,undefined);assert.equal(K.keyCode('A','de-DE').char,undefined);
});
test('profiles and detailed typing results survive state export/import; old histories remain unassigned',()=>{
 const p=K.parse(exported());
 const s=E.sanitizeState({settings:{keyboardProfile:p.id,keyboardLayer:1},keyboards:[p],history:[{date:'2026-10-18',wpm:50,accuracy:98,words:[{word:'cat',typed:'cat',correct:true,errors:1,ms:400}]}]});
 assert.equal(s.settings.keyboardProfile,p.id);assert.equal(s.settings.keyboardLayer,1);assert.equal(s.keyboards[0].layers[0].length,80);
 assert.equal(s.history[0].words[0].errors,1);assert.equal(s.history[0].profileId,undefined);
 assert.deepEqual(E.sanitizeState(JSON.parse(JSON.stringify(s))),s);
});
