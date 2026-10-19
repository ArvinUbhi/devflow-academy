/* Glove80 positions follow MoErgo's published ZMK position numbering, not DOM key codes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DevFlowKeyboards=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_BYTES=1024*1024;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const aliases={KP_ENTER:'\n',KP_DOT:'.',KP_PLUS:'+',KP_MINUS:'-',KP_EQUAL:'=',KP_DIVIDE:'/',KP_MULTIPLY:'*',KP_NUM:'Num',SPACE:' ',SPC:' ',RET:'\n',ENTER:'\n',RETURN:'\n',TAB:'\t',BSPC:'Backspace',BACKSPACE:'Backspace',ESC:'Esc',ESCAPE:'Esc',LSHFT:'Shift',LSHIFT:'Shift',LSFT:'Shift',RSHFT:'Shift',RSHIFT:'Shift',RSFT:'Shift',LCTRL:'Ctrl',LCTL:'Ctrl',RCTRL:'Ctrl',RCTL:'Ctrl',LALT:'Alt',RALT:'Alt',LGUI:'GUI',RGUI:'GUI',CAPS:'Caps',CAPSLOCK:'Caps',DEL:'Del',DELETE:'Del',INS:'Ins',LEFT:'←',RIGHT:'→',UP:'↑',DOWN:'↓',PG_UP:'PgUp',PG_DN:'PgDn',HOME:'Home',END:'End',EQUAL:'=',PLUS:'+',MINUS:'-',UNDERSCORE:'_',UNDER:'_',LBKT:'[',LEFT_BRACKET:'[',RBKT:']',RIGHT_BRACKET:']',LBRC:'{',LEFT_BRACE:'{',RBRC:'}',RIGHT_BRACE:'}',LPAR:'(',LEFT_PARENTHESIS:'(',RPAR:')',RIGHT_PARENTHESIS:')',BSLH:'\\',BACKSLASH:'\\',PIPE:'|',FSLH:'/',SLASH:'/',QMARK:'?',QUESTION:'?',SEMI:';',SEMICOLON:';',COLON:':',SQT:"'",SINGLE_QUOTE:"'",DQT:'"',DOUBLE_QUOTES:'"',GRAVE:'`',TILDE:'~',COMMA:',',DOT:'.',PERIOD:'.',LT:'<',GT:'>',EXCL:'!',EXCLAMATION:'!',AT:'@',HASH:'#',POUND:'£',DLLR:'$',DOLLAR:'$',PRCNT:'%',PERCENT:'%',CARET:'^',AMP:'&',AMPERSAND:'&',ASTRK:'*',ASTERISK:'*',NON_US_BACKSLASH:'\\',NUHS:'#',NUBS:'\\'};
  const shiftUS={'1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+','[':'{',']':'}','\\':'|',';':':',"'":'"',',':'<','.':'>','/':'?','`':'~'};
  const shiftGB={...shiftUS,'2':'"','3':'£',"'":'@','#':'~','`':'¬'};
  const display=c=>({' ':'Space','\n':'Enter','\t':'Tab'}[c]||c);
  function token(value,depth=0){
    if(depth>8)throw Error('A binding is nested too deeply.');
    if(typeof value==='number'&&Number.isFinite(value))return String(value);
    if(typeof value==='string'){if(value.length>180)throw Error('A binding is too long.');return value.trim();}
    if(!value||typeof value!=='object'||Array.isArray(value)||!['string','number'].includes(typeof value.value))throw Error('Unrecognised binding: expected value/params objects.');
    const name=token(value.value,depth+1),params=value.params||[];
    if(!Array.isArray(params)||params.length>4)throw Error('Invalid binding parameters.');
    const args=params.map(p=>token(p,depth+1));
    return !args.length?name:name==='Custom'?args.join(' '):name.startsWith('&')?name+' '+args.join(' '):name+'('+args.join(',')+')';
  }
  function keyCode(code,locale='en-US'){
    const shift=locale==='en-GB'?shiftGB:shiftUS;
    const modified=/^(LS|RS)\((.+)\)$/.exec(code);
    if(modified){const inner=keyCode(modified[2],locale);return inner.char?{char:shift[inner.char]||inner.char.toUpperCase(),shifted:true}:{};}
    // Ctrl/Alt/GUI chords, unknown macros and non-English locales are never guessed.
    if(!['en-US','en-GB'].includes(locale))return {};
    const gb=code.startsWith('GB_');if(gb)code=code.slice(3);
    if(/^[A-Z]$/.test(code))return {char:code.toLowerCase()};
    if(/^(N|NUMBER_|KP_N)\d$/.test(code))return {char:code.slice(-1)};
    let value=aliases[code];
    if(!gb&&locale==='en-GB'){
      if(['BSLH','BACKSLASH'].includes(code))value='#';
      if(code==='AT')value='"';if(code==='HASH')value='£';if(['DQT','DOUBLE_QUOTES'].includes(code))value='@';if(code==='TILDE')value='¬';if(code==='PIPE')value='~';
    }
    if(value!==undefined)return value.length===1?{char:value}:{label:value};
    if(/^F([1-9]|1\d|2[0-4])$/.test(code))return {label:code};
    return {};
  }
  function binding(raw,locale='en-US'){
    const parts=raw.split(/\s+/),type=parts[0];
    if(type==='&trans')return {label:'▽',transparent:true,raw};
    if(type==='&none')return {label:'—',raw};
    if(['&mo','&to','&tog','&sl'].includes(type))return {label:type.slice(1).toUpperCase(),hold:parts[1],raw};
    if(['&kp','&mt','&lt'].includes(type)){
      const tap=parts[type==='&kp'?1:2],key=keyCode(tap||'',locale);
      const hold=type==='&mt'?display(keyCode(parts[1],locale).label||parts[1]):type==='&lt'?'L'+parts[1]:'';
      return {label:display(key.char||key.label||tap||'?'),...key,hold,raw,unknown:!key.char&&!key.label};
    }
    return {label:type.replace(/^&/,'').slice(0,12)||'?',raw,unknown:true};
  }
  const geometry=[];
  function finger(col){return col<=2?'Index':col===3?'Middle':col===4?'Ring':'Pinky';}
  function key(index,hand,pos,x,y,col){geometry.push({index,hand,pos:hand+' '+pos,x,y,finger:col?finger(col):'Thumb'});}
  // Main columns: C1 is innermost, C6 outermost. C1 has no R1 or R6.
  const starts=[0,10,22,34,46,64];
  for(let row=1;row<=6;row++){
    const count=row===1||row===6?5:6,offset=starts[row-1];
    for(let j=0;j<count;j++){
      const cLeft=6-j,cRight=row===1||row===6?j+2:j+1;
      const y=c=>row-1+({1:.6,2:.15,3:0,4:.17,5:.55,6:.6}[c]);
      key(offset+j,'LH','C'+cLeft+'R'+row,6-cLeft,y(cLeft),cLeft);
      const rightStart=row===5?58:row===6?75:offset+count;
      key(rightStart+j,'RH','C'+cRight+'R'+row,12+cRight-1,y(cRight),cRight);
    }
  }
  for(let j=0;j<3;j++){
    key(52+j,'LH','T'+(j+1),6+j*.96,4.6+j*.36);
    key(69+j,'LH','T'+(j+4),6+j*.96,5.65+j*.36);
    key(57-j,'RH','T'+(j+1),11-j*.96,4.6+j*.36);
    key(74-j,'RH','T'+(j+4),11-j*.96,5.65+j*.36);
  }
  geometry.sort((a,b)=>a.index-b.index);
  function fingerprint(value){let a=2166136261,b=5381;for(const c of JSON.stringify(value)){a=Math.imul(a^c.charCodeAt(0),16777619);b=Math.imul(b,33)^c.charCodeAt(0);}return(a>>>0).toString(16)+(b>>>0).toString(16);}
  function parse(input){
    const text=typeof input==='string'?input:JSON.stringify(input);
    if(text.length>MAX_BYTES)throw Error('Choose a JSON layout smaller than 1 MB.');
    let x;try{x=JSON.parse(text);}catch{throw Error('This is not valid JSON. Export JSON from MoErgo, not the .uf2 firmware file.');}
    if(!x||typeof x!=='object'||(x.keyboard&&String(x.keyboard).toLowerCase()!=='glove80'))throw Error('Choose a Glove80 layout export.');
    if(!Array.isArray(x.layers)||!x.layers.length||x.layers.length>32)throw Error('Expected 1–32 layers from the MoErgo JSON export.');
    const layers=x.layers.map((layer,i)=>{if(!Array.isArray(layer)||layer.length!==80)throw Error('Layer '+(i+1)+' must contain exactly 80 Glove80 bindings.');return layer.map(v=>token(v));});
    const names=layers.map((_,i)=>String(x.layer_names?.[i]||'Layer '+i).slice(0,48));
    const locale=typeof x.locale==='string'?x.locale.slice(0,24):'en-US';
    const title=String(x.title||x.name||'My Glove80').slice(0,60);
    const id='glove80-'+fingerprint({layers,names,locale});
    const unresolved=layers.flat().filter(r=>binding(r,locale).unknown).length;
    return {id,type:'glove80',name:title,locale,layers,layer_names:names,unresolved};
  }
  function sanitizeProfiles(value){
    if(!Array.isArray(value))return [];
    const result=[];for(const x of value.slice(0,8)){try{const p=parse({keyboard:'glove80',title:x.name,locale:x.locale,layers:x.layers,layer_names:x.layer_names});if(!result.some(r=>r.id===p.id))result.push(p);}catch{}}
    return result;
  }
  function resolve(profile,layer,index){
    const b=binding(profile.layers[layer]?.[index]||'&none',profile.locale);
    // Preview assumes selected layer over base; there is no inferred firmware layer stack.
    return b.transparent&&layer>0?{...binding(profile.layers[0][index],profile.locale),inherited:true}:b;
  }
  function locate(profile,char,base=0){
    const layers=[base,...profile.layers.map((_,i)=>i).filter(i=>i!==base)];
    for(const layer of layers)for(const g of geometry){const b=resolve(profile,layer,g.index);if(b.char===char)return {...g,layer,b,shift:false};}
    const shift=profile.locale==='en-GB'?shiftGB:shiftUS;
    for(const layer of layers)for(const g of geometry){const b=resolve(profile,layer,g.index);if(b.char&&((/^[a-z]$/.test(b.char)&&b.char.toUpperCase()===char)||shift[b.char]===char))return {...g,layer,b,shift:true};}
    return null;
  }
  function svg(profile,{layer=0,next='',heat={},interactive=false,selected=[]}={}){
    const found=next?locate(profile,next,layer):null;
    const keys=geometry.map(g=>{
      const b=resolve(profile,layer,g.index),active=found?.layer===layer&&found.index===g.index;
      const hot=b.char&&heat[b.char],chosen=selected.includes(g.index);
      const label=b.label.length>7?b.label.slice(0,6)+'…':b.label;
      const title=g.pos+' · '+(g.hand==='LH'?'Left':'Right')+' '+g.finger+' · '+b.raw+(b.inherited?' · inherited from base':'')+(hot?' · '+hot.errors+'/'+hot.attempts+' missed ('+hot.rate+'%)':'');
      return '<g transform="translate('+(g.x*49+12)+','+(g.y*48+10)+')" class="glove-key '+(active?'is-next ':'')+(chosen?'is-selected ':'')+(b.unknown?'is-unknown ':'')+(hot?.errors?'has-errors':'')+'" '+(interactive?'role="button" tabindex="0" aria-pressed="'+chosen+'" data-glove-key="'+g.index+'"':'')+' aria-label="'+esc(title)+'"><title>'+esc(title)+'</title><rect width="44" height="43" rx="7"/><text x="22" y="19" text-anchor="middle">'+esc(label)+'</text><text class="key-sub" x="22" y="33" text-anchor="middle">'+esc(b.hold||g.pos.slice(3))+'</text></g>';
    }).join('');
    return '<svg class="glove-map" viewBox="0 0 900 390" '+(interactive?'role="group"':'role="img"')+' aria-label="Glove80 '+esc(profile.layer_names[layer])+' mapping, 80 keys"><text class="hand-label" x="140" y="382">LEFT HAND</text><text class="hand-label" x="645" y="382">RIGHT HAND</text>'+keys+'</svg>';
  }
  const DEFAULT_LAYERS = [["&kp F1", "&kp F2", "&kp F3", "&kp F4", "&kp F5", "&kp F6", "&kp F7", "&kp F8", "&kp F9", "&kp F10", "&kp EQUAL", "&kp N1", "&kp N2", "&kp N3", "&kp N4", "&kp N5", "&kp N6", "&kp N7", "&kp N8", "&kp N9", "&kp N0", "&kp MINUS", "&kp TAB", "&kp Q", "&kp W", "&kp E", "&kp R", "&kp T", "&kp Y", "&kp U", "&kp I", "&kp O", "&kp P", "&kp BSLH", "&kp ESC", "&kp A", "&kp S", "&kp D", "&kp F", "&kp G", "&kp H", "&kp J", "&kp K", "&kp L", "&kp SEMI", "&kp SQT", "&kp GRAVE", "&kp Z", "&kp X", "&kp C", "&kp V", "&kp B", "&kp LSHFT", "&kp LCTRL", "&layer_td", "&kp LGUI", "&kp RCTRL", "&kp RSHFT", "&kp N", "&kp M", "&kp COMMA", "&kp DOT", "&kp FSLH", "&kp PG_UP", "&magic MAGIC 0", "&kp HOME", "&kp END", "&kp LEFT", "&kp RIGHT", "&kp BSPC", "&kp DEL", "&kp LALT", "&kp RALT", "&kp RET", "&kp SPACE", "&kp UP", "&kp DOWN", "&kp LBKT", "&kp RBKT", "&kp PG_DN"], ["&kp C_BRI_DN", "&kp C_BRI_UP", "&kp C_PREV", "&kp C_NEXT", "&kp C_PP", "&kp C_MUTE", "&kp C_VOL_DN", "&kp C_VOL_UP", "&none", "&kp PAUSE_BREAK", "&trans", "&none", "&none", "&none", "&none", "&kp HOME", "&kp LPAR", "&kp KP_NUM", "&kp KP_EQUAL", "&kp KP_DIVIDE", "&kp KP_MULTIPLY", "&kp PSCRN", "&trans", "&none", "&none", "&kp UP", "&none", "&kp END", "&kp RPAR", "&kp KP_N7", "&kp KP_N8", "&kp KP_N9", "&kp KP_MINUS", "&kp SLCK", "&trans", "&none", "&kp LEFT", "&kp DOWN", "&kp RIGHT", "&kp PG_UP", "&kp PRCNT", "&kp KP_N4", "&kp KP_N5", "&kp KP_N6", "&kp KP_PLUS", "&none", "&trans", "&kp K_CMENU", "&none", "&kp F11", "&kp F12", "&kp PG_DN", "&trans", "&trans", "&to DEFAULT", "&trans", "&trans", "&trans", "&kp COMMA", "&kp KP_N1", "&kp KP_N2", "&kp KP_N3", "&kp KP_ENTER", "&trans", "&trans", "&kp CAPS", "&kp INS", "&kp F11", "&kp F12", "&trans", "&trans", "&trans", "&trans", "&trans", "&trans", "&kp KP_N0", "&kp KP_N0", "&kp KP_DOT", "&kp KP_ENTER", "&trans"], ["&bt BT_CLR", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&bt BT_CLR_ALL", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&rgb_ug RGB_SPI", "&rgb_ug RGB_SAI", "&rgb_ug RGB_HUI", "&rgb_ug RGB_BRI", "&rgb_ug RGB_TOG", "&none", "&none", "&none", "&none", "&none", "&none", "&bootloader", "&rgb_ug RGB_SPD", "&rgb_ug RGB_SAD", "&rgb_ug RGB_HUD", "&rgb_ug RGB_BRD", "&rgb_ug RGB_EFF", "&none", "&none", "&none", "&none", "&none", "&bootloader", "&sys_reset", "&none", "&none", "&none", "&none", "&none", "&bt_2", "&bt_3", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&sys_reset", "&none", "&none", "&none", "&none", "&none", "&bt_0", "&bt_1", "&out OUT_USB", "&none", "&none", "&none", "&none", "&none", "&none", "&none", "&to FACTORY_TEST"], ["&kp N0", "&kp N6", "&kp N2", "&kp N8", "&kp N4", "&kp N4", "&kp N8", "&kp N2", "&kp N6", "&kp N0", "&kp N1", "&kp N7", "&kp N3", "&kp N9", "&kp N5", "&kp N0", "&kp N0", "&kp N5", "&kp N9", "&kp N3", "&kp N7", "&kp N1", "&kp N2", "&kp N8", "&kp N4", "&kp N0", "&kp N6", "&kp N1", "&kp N1", "&kp N6", "&kp N0", "&kp N4", "&kp N8", "&kp N2", "&kp N3", "&kp N9", "&kp N5", "&kp N1", "&kp N7", "&kp N2", "&kp N2", "&kp N7", "&kp N1", "&kp N5", "&kp N9", "&kp N3", "&kp N4", "&kp N0", "&kp N6", "&kp N2", "&kp N8", "&kp N3", "&kp N4", "&kp N5", "&kp N6", "&kp N6", "&kp N5", "&kp N4", "&kp N3", "&kp N8", "&kp N2", "&kp N6", "&kp N0", "&kp N4", "&kp N5", "&kp N1", "&kp N7", "&kp N3", "&kp N9", "&kp N7", "&kp N8", "&kp N9", "&kp N9", "&kp N8", "&kp N7", "&kp N9", "&kp N3", "&kp N7", "&kp N1", "&kp N5"]];
  function defaultProfile(){return {id:'glove80-default',name:'Glove80 · Factory US',type:'glove80',locale:'en-US',layer_names:['Base','Lower','Magic','Factory'],layers:DEFAULT_LAYERS};}
  function profiles(state){return [{id:'standard-us',name:'Standard · US QWERTY',type:'standard',locale:'en-US'},{id:'standard-uk',name:'Standard · UK QWERTY',type:'standard',locale:'en-GB'},defaultProfile(),...(state.keyboards||[])];}
  function active(state){return profiles(state).find(p=>p.id===state.settings.keyboardProfile)||profiles(state)[0];}
  return {MAX_BYTES,geometry,parse,token,binding,keyCode,resolve,locate,svg,display,profiles,active,defaultProfile,sanitizeProfiles};
});
