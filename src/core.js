/* TW3 domain model. Pure functions; no DOM, network, or runtime dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TW3Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '1.0.0';
  const PALETTE = ['#69c8c0', '#a99be5', '#edb767', '#80b9e9', '#94c783', '#d3a2ce'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = (prefix = 'n') => prefix + '-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
  const label = node => node?.title || (node?.named ? node.name : node?.archetype) || 'Untitled';
  const nodes = s => [...s.characters, ...s.events];
  const getNode = (s, id) => nodes(s).find(n => n.id === id);
  const isEvent = (s, id) => s.events.some(e => e.id === id);
  const eventLinks = s => s.connections.filter(l => isEvent(s, l.from) && isEvent(s, l.to));
  const sortedEvents = s => [...s.events].sort((a, b) => a.begin - b.begin || a.end - b.end || a.id.localeCompare(b.id));
  const branches = s => sortedEvents(s).map(event => ({event, choices: eventLinks(s).filter(l => l.from === event.id && l.kind === 'dynamic')})).filter(b => b.choices.length);
  const color = (s, link) => {
    if (link.kind === 'static') return '#d55e57';
    const ordered = s.connections.filter(l => l.kind === 'dynamic').sort((a, b) => {
      const time = l => getNode(s, l.from)?.begin ?? s.events.find(e => e.id === getNode(s, l.from)?.entrance?.eventId)?.begin ?? getNode(s, l.to)?.begin ?? 0;
      return time(a) - time(b) || a.id.localeCompare(b.id);
    });
    return PALETTE[Math.max(0, ordered.findIndex(l => l.id === link.id)) % PALETTE.length];
  };
  function blank(title = 'Untitled story', medium = 'game', unit = 'beat') {
    const first = {id:uid('e'), title:'The beginning', description:'Where the story starts.', role:'beginning', behavior:'static', begin:0, end:1, x:160, y:260};
    const last = {id:uid('e'), title:'The ending', description:'Where the story concludes.', role:'ending', behavior:'static', begin:10, end:11, x:660, y:260};
    return {format:'tw3', version:1, id:uid('story'), title, medium, unit, description:'', characters:[], events:[first,last], connections:[{id:uid('l'),from:first.id,to:last.id,kind:'static',label:'The story unfolds'}], updatedAt:new Date().toISOString()};
  }
  function preview(s, selections = {}, enabled = false, time = Infinity) {
    const active = new Set();
    if (!enabled || s.medium !== 'game') s.events.forEach(e => active.add(e.id));
    else {
      s.events.filter(e => e.behavior === 'static' || e.role === 'beginning').forEach(e => active.add(e.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const l of eventLinks(s)) {
          const open = l.kind === 'static' || selections[l.from] === l.id;
          if (active.has(l.from) && open && !active.has(l.to)) { active.add(l.to); changed = true; }
        }
      }
    }
    const selectedActive = id => eventLinks(s).some(l => l.id === id && active.has(l.from) && selections[l.from] === l.id);
    const connectionActive = l => {
      const endpoints = [l.from,l.to].filter(id => isEvent(s,id));
      if (!endpoints.every(id => active.has(id))) return false;
      if (!enabled || l.kind === 'static') return true;
      if (isEvent(s,l.from) && isEvent(s,l.to)) return selections[l.from] === l.id;
      return !l.choiceId || selectedActive(l.choiceId);
    };
    const characters = {};
    s.characters.forEach(c => {
      const enter = s.events.find(e=>e.id===c.entrance.eventId);
      const exit = s.events.find(e=>e.id===c.exit?.eventId);
      const associated = s.connections.filter(l=>(l.from===c.id && isEvent(s,l.to)) || (l.to===c.id && isEvent(s,l.from)));
      const present = !!enter && active.has(enter.id) && associated.some(connectionActive);
      const triggered = enabled ? c.dynamicTraits.filter(t => {
        const e = s.events.find(x=>x.id===t.eventId);
        return e && active.has(e.id) && e.begin <= time && (!t.choiceId || selectedActive(t.choiceId));
      }).sort((a,b)=>(s.events.find(e=>e.id===a.eventId)?.begin||0)-(s.events.find(e=>e.id===b.eventId)?.begin||0)) : [];
      const exits = triggered.filter(t=>t.effect==='exit').map(t=>s.events.find(e=>e.id===t.eventId)?.end).filter(Number.isFinite);
      const end = Math.min(exit && active.has(exit.id) ? exit.end : Infinity, ...exits);
      const state = {};
      triggered.filter(t=>t.effect!=='exit').forEach(t=>state[t.key]=t.value);
      characters[c.id] = {present, begin:enter?.begin??0, end, traits:state, triggered, status: !present?'Absent on this route':time<(enter?.begin??0)?'Not yet encountered':time>=end?'Exited the story':'In the story'};
    });
    return {active, characters, connectionActive};
  }
  function validate(s) {
    const issues = [];
    const add = (level,message,nodeId) => issues.push({level,message,nodeId});
    if (!s.title.trim()) add('error','The story needs a title.');
    if (!s.unit.trim()) add('error','Choose a timeline unit.');
    if (s.characters.length > 500 || s.events.length > 500 || s.connections.length > 3000) add('error','This project exceeds the supported size limits.');
    const starts=s.events.filter(e=>e.role==='beginning');
    const ends=s.events.filter(e=>e.role==='ending');
    if (starts.length!==1) add('error','A story needs exactly one beginning.');
    if (!ends.length) add('error','A story needs at least one ending.');
    if (s.medium==='game' && ends.length>1 && ends.some(e=>e.behavior==='static')) add('error','Alternate endings must all be dynamic. Change the existing ending to dynamic before adding another.');
    if (s.medium!=='game' && ends.length!==1) add('error','A linear story needs exactly one ending.');
    const all = nodes(s), ids=new Set(all.map(n=>n.id));
    if(ids.size!==all.length) add('error','Node identifiers must be unique.');
    const links=eventLinks(s);
    s.events.forEach(e=>{
      if (!e.title.trim()) add('error','Every event needs a title.',e.id);
      if(!Number.isFinite(e.begin)||!Number.isFinite(e.end)||e.begin<0||e.end<e.begin) add('error',`${label(e)} has an invalid time range.`,e.id);
      if(e.role==='beginning' && e.behavior!=='static') add('error','The beginning must be static.',e.id);
      if(s.medium!=='game' && e.behavior==='dynamic') add('error','Linear stories cannot have dynamic events.',e.id);
      if(e.role==='ending' && links.some(l=>l.from===e.id)) add('error',`${label(e)} is an ending with outgoing event connections.`,e.id);
      if(e.role==='beginning' && links.some(l=>l.to===e.id)) add('error','The beginning cannot have incoming event connections.',e.id);
      if(e.behavior==='dynamic' && !links.some(l=>l.to===e.id)) add('warning',`${label(e)} has no incoming route.`,e.id);
      if(starts[0] && e.begin<starts[0].begin) add('error',`${label(e)} starts before the beginning.`,e.id);
    });
    s.connections.forEach(l=>{
      if(!ids.has(l.from)||!ids.has(l.to)) add('error','A connection points to a missing item.');
      if(l.from===l.to) add('error','An item cannot connect to itself.',l.from);
      if(l.kind==='dynamic' && s.medium!=='game') add('error','Linear stories cannot have dynamic connections.',l.from);
      if(l.kind==='dynamic' && !l.label.trim()) add('error','Dynamic connections need a choice or condition label.',l.from);
      if(l.choiceId && !links.some(x=>x.id===l.choiceId && x.kind==='dynamic')) add('error','A connection references a missing choice.',l.from);
      if(isEvent(s,l.from)&&isEvent(s,l.to)) {
        const a=getNode(s,l.from),b=getNode(s,l.to);
        if(b.begin<a.begin) add('warning',`${label(a)} connects backward in time to ${label(b)}.`,a.id);
        if(l.kind==='dynamic' && b.behavior==='static') add('warning',`${label(b)} is static and will occur regardless of this choice.`,b.id);
      }
    });
    s.characters.forEach(c=>{
      if(c.staticTraits.length>100 || c.dynamicTraits.length>100) add('error',`${label(c)} exceeds the 100 traits per type limit.`,c.id);
      if(!c.justification.trim()) add('error',`${label(c)} needs a justification.`,c.id);
      if(!c.narrative.trim()) add('error',`${label(c)} needs one narrative description.`,c.id);
      if(c.named && !c.name.trim()) add('error','A named character needs a proper name.',c.id);
      if(!c.named && c.importance==='major') add('error','Unnamed characters must be minor.',c.id);
      if(!c.staticTraits.length || c.staticTraits.some(t=>!t.trim())) add('error',`${label(c)} needs at least one static trait.`,c.id);
      const ent=s.events.find(e=>e.id===c.entrance.eventId),ex=s.events.find(e=>e.id===c.exit?.eventId);
      if(!ent || !c.entrance.why.trim() || !c.entrance.how.trim()) add('error',`${label(c)} needs an entrance event, why, and how.`,c.id);
      if(c.exit && (!ex || !c.exit.why.trim() || !c.exit.how.trim())) add('error',`${label(c)} has an incomplete exit.`,c.id);
      if(ex && ent && ex.end<ent.begin) add('error',`${label(c)} exits before entering.`,c.id);
      const linked=s.connections.filter(l=>(l.from===c.id && isEvent(s,l.to))||(l.to===c.id && isEvent(s,l.from)));
      if(!linked.length) add('error',`${label(c)} must connect to at least one event.`,c.id);
      if(ent && !linked.some(l=>l.from===ent.id||l.to===ent.id)) add('error',`${label(c)} needs a connection to their entrance event.`,c.id);
      linked.forEach(l=>{const e=getNode(s,l.from===c.id?l.to:l.from); if(ent && (e.end<ent.begin || (ex && e.begin>ex.end))) add('warning',`${label(c)} connects to ${label(e)} outside their lifetime.`,c.id);});
      if(s.medium!=='game' && c.dynamicTraits.length) add('error','Linear stories cannot have dynamic traits.',c.id);
      c.dynamicTraits.forEach(t=>{
        const event=s.events.find(e=>e.id===t.eventId);
        if(!event || !t.key.trim() || !t.value.trim()) add('error',`${label(c)} has an incomplete dynamic trait.`,c.id);
        if(t.choiceId && !links.some(l=>l.id===t.choiceId && l.kind==='dynamic')) add('error',`${label(c)} has a trait tied to a missing choice.`,c.id);
        const choice=links.find(l=>l.id===t.choiceId), choiceEvent=choice&&getNode(s,choice.from);
        if(event && ent && event.begin<ent.begin) add('warning',`${label(c)} has a trait that starts before their entrance.`,c.id);
        if(event && choiceEvent && event.begin<choiceEvent.begin) add('error',`${label(c)} has a trait that starts before its required choice.`,c.id);
      });
    });
    if(starts.length===1) {
      const reachable=new Set([starts[0].id]); let change=true;
      while(change) {change=false; links.forEach(l=>{if(reachable.has(l.from)&&!reachable.has(l.to)){reachable.add(l.to);change=true;}});}
      s.events.filter(e=>!reachable.has(e.id)).forEach(e=>add('warning',`${label(e)} is disconnected from the beginning.`,e.id));
      const canEnd=new Set(ends.map(e=>e.id));change=true;
      while(change) {change=false;links.forEach(l=>{if(canEnd.has(l.to)&&!canEnd.has(l.from)){canEnd.add(l.from);change=true;}});}
      s.events.filter(e=>!canEnd.has(e.id)).forEach(e=>add('warning',`${label(e)} has no route to an ending.`,e.id));
      const visited=new Set(),stack=new Set();
      function visit(id) {if(stack.has(id))return true;if(visited.has(id))return false;visited.add(id);stack.add(id);for(const l of links.filter(l=>l.from===id))if(visit(l.to))return true;stack.delete(id);return false;}
      if(s.events.some(e=>visit(e.id))) add('warning','The event graph contains a loop. Check that its chronology is intentional.');
    }
    return issues;
  }
  function parseProject(text) {
    if(typeof text!=='string'||text.length>40*1024*1024) throw new Error('Project must be a JSON file smaller than 40 MB.');
    let s;try{s=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}
    const fail=m=>{throw new Error('Invalid TW3 project: '+m);};
    if(!s||s.format!=='tw3'||s.version!==1) fail('unsupported format or version.');
    const str=(v,name,max=20000)=>{if(typeof v!=='string'||v.length>max)fail(name+' must be text of an allowed length.');return v;};
    const num=(v,name)=>{if(typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e7)fail(name+' must be a finite number.');return v;};
    const en=(v,allowed,name)=>{if(!allowed.includes(v))fail('invalid '+name+'.');return v;};
    const arr=(v,name,max=1000)=>{if(!Array.isArray(v)||v.length>max)fail(name+' must be an array within limits.');return v;};
    const moment=v=>({eventId:str(v?.eventId,'event id',100),why:str(v?.why,'entrance/exit reason'),how:str(v?.how,'entrance/exit method')});
    const base=n=>({id:str(n?.id,'id',100),x:num(n?.x,'x'),y:num(n?.y,'y')});
    const out={format:'tw3',version:1,id:str(s.id,'story id',100),title:str(s.title,'title',200),description:str(s.description??'','description'),unit:str(s.unit??'beat','unit',40),medium:en(s.medium,['game','novel','film','tv'],'medium'),updatedAt:str(s.updatedAt??'','updated date',100)};
    out.events=arr(s.events,'events',500).map(e=>({...base(e),title:str(e.title,'event title',200),description:str(e.description,'event description'),role:en(e.role,['beginning','event','ending'],'event role'),behavior:en(e.behavior,['static','dynamic'],'event behavior'),begin:num(e.begin,'begin'),end:num(e.end,'end')}));
    out.characters=arr(s.characters,'characters',500).map(c=>{
      if(typeof c.named!=='boolean')fail('named must be boolean.');
      const portrait=str(c.portrait??'','portrait',1500000);
      if(portrait&&!/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(portrait))fail('portrait must be an embedded PNG, JPEG, or WebP.');
      return {...base(c),named:c.named,name:str(c.name,'name',200),archetype:str(c.archetype??'','archetype',200),importance:en(c.importance,['major','minor'],'importance'),justification:str(c.justification,'justification'),narrative:str(c.narrative,'narrative'),personality:str(c.personality??'','personality'),staticTraits:arr(c.staticTraits,'static traits',100).map(t=>str(t,'trait',2000)),dynamicTraits:arr(c.dynamicTraits??[],'dynamic traits',100).map(t=>({id:str(t.id,'trait id',100),key:str(t.key,'trait key',100),value:str(t.value,'trait value',2000),eventId:str(t.eventId,'trigger event id',100),choiceId:str(t.choiceId??'','choice id',100),effect:en(t.effect??'trait',['trait','exit'],'trait effect'),importance:en(t.importance??'normal',['low','normal','high'],'trait importance')})),entrance:moment(c.entrance),exit:c.exit?moment(c.exit):null,portrait};
    });
    out.connections=arr(s.connections,'connections',3000).map(l=>({id:str(l.id,'connection id',100),from:str(l.from,'source',100),to:str(l.to,'target',100),kind:en(l.kind,['static','dynamic'],'connection kind'),label:str(l.label??'','connection label',500),choiceId:str(l.choiceId??'','choice id',100)}));
    const allIds=[...nodes(out),...out.connections].map(n=>n.id);
    if(new Set(allIds).size!==allIds.length || allIds.some(id=>!id||!/^[-a-zA-Z0-9_]+$/.test(id)))fail('identifiers must be unique and use letters, digits, dashes, or underscores.');
    const errors=validate(out).filter(i=>i.level==='error');
    if(errors.length)fail(errors.slice(0,6).map(i=>i.message).join(' '));
    return out;
  }
  function sample() {
    const s={format:'tw3',version:1,id:'story-bellwether',title:'The Bellwether Archive',medium:'game',unit:'beat',description:'A missing archivist. A city that edits its own history. Three lives caught between the truth and the stories that keep them safe.',updatedAt:new Date().toISOString(),events:[
      {id:'e-start',title:'A letter after midnight',description:'An unsigned letter summons Mara to the shuttered municipal archive. Someone has erased an entire district from the maps.',role:'beginning',behavior:'static',begin:0,end:2,x:120,y:390},
      {id:'e-choice',title:'The price of the truth',description:'Ivo offers the original ledger. The player must decide whether to expose it or protect the people named inside.',role:'event',behavior:'static',begin:5,end:7,x:465,y:390},
      {id:'e-reveal',title:'Open the archive',description:'The ledger is broadcast across the city. Ivo becomes a witness, and the erased district returns to public memory.',role:'ending',behavior:'dynamic',begin:12,end:15,x:840,y:290},
      {id:'e-protect',title:'Burn the ledger',description:'The names remain a secret. The keeper helps Mara disappear, but the official history survives.',role:'ending',behavior:'dynamic',begin:12,end:15,x:840,y:580}
    ],characters:[
      {id:'c-mara',named:true,name:'Mara Voss',archetype:'The investigator',importance:'major',justification:'Mara gives the player a personal reason to recover the erased district: her family once lived there.',narrative:'A former cartographer following the empty spaces in the city’s official history.',personality:'Patient with strangers. Merciless with a contradiction.',staticTraits:['Former municipal cartographer','Her family lived in the erased district','Keeps a hand-drawn map'],dynamicTraits:[{id:'t-mara',key:'Reputation',value:'Public whistleblower',eventId:'e-reveal',choiceId:'l-reveal',effect:'trait',importance:'high'},{id:'t-mara2',key:'Reputation',value:'An unrecorded life',eventId:'e-protect',choiceId:'l-protect',effect:'trait',importance:'high'}],entrance:{eventId:'e-start',why:'Her past is hidden in the missing records.',how:'Arrives with the unsigned letter and an old city map.'},exit:null,portrait:'',x:110,y:80},
      {id:'c-ivo',named:true,name:'Ivo Senn',archetype:'The reluctant witness',importance:'major',justification:'Ivo turns an abstract conspiracy into a choice with a human cost.',narrative:'The last archivist who remembers what the city chose to forget.',personality:'Precise, guarded, and quietly afraid.',staticTraits:['Worked in the archive for twenty years','Knows who ordered the erasure'],dynamicTraits:[{id:'t-ivo',key:'Allegiance',value:'Testifies alongside Mara',eventId:'e-reveal',choiceId:'l-reveal',effect:'trait',importance:'high'},{id:'t-ivo2',key:'Fate',value:'Leaves the city for good',eventId:'e-protect',choiceId:'l-protect',effect:'exit',importance:'high'}],entrance:{eventId:'e-choice',why:'He holds the only surviving copy of the ledger.',how:'Steps from the stacks and offers a bargain.'},exit:null,portrait:'',x:445,y:65},
      {id:'c-keeper',named:false,name:'',archetype:'The night keeper',importance:'minor',justification:'Provides access to the archive and a possible escape route without distracting from the central conflict.',narrative:'An anonymous caretaker who knows every locked door in the archive.',personality:'Pragmatic. Notices more than they say.',staticTraits:['Has the archive keys','Works only after dark'],dynamicTraits:[],entrance:{eventId:'e-start',why:'Someone must admit Mara to the building.',how:'Unlocks a side door without asking her name.'},exit:null,portrait:'',x:1110,y:70}
    ],connections:[
      {id:'l-open',from:'e-start',to:'e-choice',kind:'static',label:'Follow the missing records'},
      {id:'l-reveal',from:'e-choice',to:'e-reveal',kind:'dynamic',label:'Expose the ledger'},
      {id:'l-protect',from:'e-choice',to:'e-protect',kind:'dynamic',label:'Protect the names'},
      {id:'l-mara',from:'c-mara',to:'e-start',kind:'static',label:'Receives the letter'},
      {id:'l-mara2',from:'c-mara',to:'e-choice',kind:'static',label:'Makes the choice'},
      {id:'l-ivo',from:'c-ivo',to:'e-choice',kind:'static',label:'Offers the ledger'},
      {id:'l-keeper',from:'c-keeper',to:'e-start',kind:'static',label:'Opens the door'},
      {id:'l-bond',from:'c-mara',to:'c-ivo',kind:'static',label:'An uneasy alliance'},
      {id:'l-escape',from:'c-keeper',to:'e-protect',kind:'dynamic',label:'Helps Mara disappear',choiceId:'l-protect'}
    ]}; return s;
  }
  return {VERSION,PALETTE,clone,uid,label,nodes,getNode,isEvent,eventLinks,sortedEvents,branches,color,blank,preview,validate,parseProject,sample};
});
