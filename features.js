/* Kickass Case Builder — case records, links, timeline, deadlines, claims, rebuttal and case packet.
   Loaded after app.js. Everything here reads and writes the same D object and calls save(). */

/* ================= shared helpers ================= */
function uid(){ return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4); }
function ensureIds(){
  var changed=false;
  ['events','exhibits','witnesses','docs','requests'].forEach(function(k){
    (D[k]||[]).forEach(function(x){ if(!x.id){ x.id=uid(); changed=true; } });
  });
  return changed;
}
function byId(list,id){ for(var i=0;i<list.length;i++) if(list[i].id===id) return list[i]; return null; }
function idxOf(list,id){ for(var i=0;i<list.length;i++) if(list[i].id===id) return i; return -1; }
function exNum(id){ return idxOf(D.exhibits,id)+1; }
function short(t,n){ t=String(t||''); n=n||60; return t.length>n? t.slice(0,n-1).trim()+'\u2026' : t; }
var MONTHS_F=['January','February','March','April','May','June','July','August','September','October','November','December'];
function niceDate(x){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(x||''); return m? MONTHS_F[+m[2]-1]+' '+(+m[3])+', '+m[1] : (x||''); }
function addDays(iso,n){ var d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function todayISO(){ var d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
function daysBetween(a,b){ return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5); }
function dayWord(n){ return n+(n===1?' day':' days'); }
function chipBtn(label,on,click,extra){
  return '<button type="button" class="chip'+(on?' on':'')+(extra?' '+extra:'')+'" onclick="'+click+'">'+label+'</button>';
}
function flashEl(el){ if(!el) return; try{ el.scrollIntoView({block:'center'}); }catch(e){ el.scrollIntoView(); }
  el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
function goItem(view,id){ show(view); setTimeout(function(){ flashEl(document.querySelector('[data-id="'+id+'"]')); },80); }

/* ================= claims and tags ================= */
var CLAIMS=[
 ['disparate','Disparate treatment','You were treated worse than someone comparable, because of a protected ground.'],
 ['hostile','Hostile work environment','Conduct severe or pervasive enough to change the conditions of your work.'],
 ['retaliation','Retaliation','Something adverse happened because you complained, testified or opposed discrimination.'],
 ['constructive','Constructive discharge','You resigned because the conditions were intolerable.'],
 ['accommodate','Failure to accommodate','A disability or religious accommodation was refused or ignored.'],
 ['impact','Disparate impact','A rule or test applied to everyone screens out one group at a much higher rate.'],
 ['services','Denial of services or benefits','For claims against a government body.']];
function claimName(k){ for(var i=0;i<CLAIMS.length;i++) if(CLAIMS[i][0]===k) return CLAIMS[i][1]; return k; }
function eventTags(e){ var t=(e.tags||[]).map(claimName); if(e.pa) t.unshift('Protected activity'); return t; }
function linkedExhibits(e){ return (e.ex||[]).map(function(id){ var x=byId(D.exhibits,id); return x? {n:exNum(id),w:x.w,id:id}:null; }).filter(Boolean); }
function linkedWitnesses(e){ return (e.wt||[]).map(function(id){ var x=byId(D.witnesses,id); return x? {n:x.n,id:id}:null; }).filter(Boolean); }
/* chronology refs for the printed chronology */
function chronRefs(e){
  var t=eventTags(e), ex=linkedExhibits(e), wt=linkedWitnesses(e), h='';
  if(t.length) h+='<div class="pv"><b>Tagged:</b> '+esc(t.join(', '))+'</div>';
  if(ex.length) h+='<div class="pv"><b>Exhibits:</b> '+ex.map(function(x){return 'Exhibit '+x.n;}).join(', ')+'</div>';
  if(wt.length) h+='<div class="pv"><b>Witnesses:</b> '+esc(wt.map(function(x){return x.n;}).join(', '))+'</div>';
  return h;
}

/* ================= list editing (shared) ================= */
var EDITING={};   // list name -> id being edited
var LISTS={
  events:{btn:'addEvent()', add:'Add to chronology', fields:{d:'ev-date',w:'ev-what',who:'ev-who',doc:'ev-doc'}},
  exhibits:{btn:'addExhibit()', add:'Add exhibit', fields:{d:'ex-date',w:'ex-what',p:'ex-proves',l:'ex-where',f:'ex-file'}},
  witnesses:{btn:'addWitness()', add:'Add witness', fields:{n:'wt-name',r:'wt-rel',k:'wt-knows',c:'wt-contact',s:'wt-status',o:'wt-notes'}},
  docs:{btn:'addDoc()', add:'File it', fields:{d:'dc-date',w:'dc-what',f:'dc-from',k:'dc-kind',a:'dc-action',due:'dc-due',l:'dc-where'}}
};
function addBtn(list){ return document.querySelector('[onclick="'+LISTS[list].btn+'"]'); }
function setEditMode(list,id){
  EDITING[list]=id||null;
  var b=addBtn(list); if(!b) return;
  b.textContent= id? 'Save changes' : LISTS[list].add;
  var c=b.parentNode.querySelector('.cancelEdit');
  if(id && !c){ c=document.createElement('button'); c.type='button'; c.className='sec cancelEdit'; c.textContent='Cancel';
    c.onclick=function(){ cancelEdit(list); }; b.parentNode.insertBefore(c,b.nextSibling); }
  if(!id && c) c.remove();
}
function readForm(list){ var o={}, F=LISTS[list].fields; for(var k in F){ var el=$(F[k]); o[k]=el? (el.tagName==='SELECT'? el.value : el.value.trim()) : ''; } return o; }
function clearForm(list){ var F=LISTS[list].fields; for(var k in F){ var el=$(F[k]); if(el && el.tagName!=='SELECT') el.value=''; } }
function editItem(list,id){
  var x=byId(D[list],id); if(!x) return;
  var F=LISTS[list].fields; for(var k in F){ var el=$(F[k]); if(el) el.value=x[k]||(el.tagName==='SELECT'?el.options[0].value:''); }
  if(list==='events'){ FORM_EV={ex:(x.ex||[]).slice(),wt:(x.wt||[]).slice(),tags:(x.tags||[]).slice(),pa:!!x.pa}; renderEvLinks(); }
  if(list==='exhibits'){ pendingThumb=x.t||null; $('ex-thumbprev').innerHTML= x.t? '<img src="'+x.t+'" alt="preview"><button class="sec" style="padding:7px 11px;font-size:12.5px;margin-left:10px" onclick="clearThumb()">Remove</button>':''; }
  setEditMode(list,id);
  var first=$(F[Object.keys(F)[0]]); if(first){ try{ first.scrollIntoView({block:'center'}); }catch(e){} first.focus(); }
}
function cancelEdit(list){
  clearForm(list); setEditMode(list,null);
  if(list==='events'){ FORM_EV=blankEvLinks(); renderEvLinks(); }
  if(list==='exhibits') clearThumb();
}
function removeItem(list,id,msg,render){
  if(!confirm(msg)) return;
  var i=idxOf(D[list],id); if(i<0) return;
  D[list].splice(i,1);
  // drop links that pointed at it
  if(list==='exhibits'||list==='witnesses'){ var key=list==='exhibits'?'ex':'wt';
    D.events.forEach(function(e){ if(e[key]) e[key]=e[key].filter(function(z){return z!==id;}); });
    if(list==='exhibits' && D.rebuttal) (D.rebuttal.points||[]).forEach(function(p){ if(p.ex) p.ex=p.ex.filter(function(z){return z!==id;}); });
  }
  if(EDITING[list]===id) cancelEdit(list);
  save(); render(); refreshAll();
}
function itemTools(list,id,msg,render,extra){
  return '<span class="itools">'+(extra||'')+
    '<button type="button" class="ilink" onclick="editItem(\''+list+'\',\''+id+'\')">edit</button>'+
    '<button type="button" class="ilink del" onclick="removeItem(\''+list+'\',\''+id+'\',\''+msg+'\','+render+')">remove</button></span>';
}
function refreshAll(){ try{ renderEvents(); renderExhibits(); renderWitnesses(); renderDocs(); renderHome(); }catch(e){} }

/* ================= chronology ================= */
function blankEvLinks(){ return {ex:[],wt:[],tags:[],pa:false}; }
var FORM_EV=blankEvLinks(), TL_MODE='list', TL_FILTER='';
function toggleEvLink(kind,val){
  if(kind==='pa'){ FORM_EV.pa=!FORM_EV.pa; }
  else { var a=FORM_EV[kind], i=a.indexOf(val); if(i<0) a.push(val); else a.splice(i,1); }
  renderEvLinks();
}
function renderEvLinks(){
  var box=$('evlinks-list'); if(!box) return;
  var h='<div class="lgroup"><div class="lhead">What kind of event is this?</div>'+
    chipBtn('Protected activity \u2014 I complained, reported or testified',FORM_EV.pa,"toggleEvLink('pa')",'pa');
  CLAIMS.forEach(function(c){ h+=chipBtn(c[1],FORM_EV.tags.indexOf(c[0])>-1,"toggleEvLink('tags','"+c[0]+"')"); });
  h+='</div><div class="lgroup"><div class="lhead">Exhibits that show it</div>';
  if(!D.exhibits.length) h+='<div class="lnone">Exhibits you log on the Evidence page appear here to link.</div>';
  D.exhibits.forEach(function(x,i){ h+=chipBtn('Exhibit '+(i+1)+': '+esc(short(x.w,40)),FORM_EV.ex.indexOf(x.id)>-1,"toggleEvLink('ex','"+x.id+"')"); });
  h+='</div><div class="lgroup"><div class="lhead">Witnesses who can speak to it</div>';
  if(!D.witnesses.length) h+='<div class="lnone">People on your witness list appear here to link.</div>';
  D.witnesses.forEach(function(w){ h+=chipBtn(esc(short(w.n,34)),FORM_EV.wt.indexOf(w.id)>-1,"toggleEvLink('wt','"+w.id+"')"); });
  h+='</div>';
  box.innerHTML=h;
}
function addEvent(){
  var o=readForm('events');
  if(!o.d||!o.w){ alert('A date and what happened are both needed.'); return; }
  o.ex=FORM_EV.ex.slice(); o.wt=FORM_EV.wt.slice(); o.tags=FORM_EV.tags.slice(); o.pa=FORM_EV.pa;
  var id=EDITING.events;
  if(id){ var x=byId(D.events,id); if(x){ Object.assign(x,o); } }
  else { o.id=uid(); D.events.push(o); id=o.id; }
  D.events.sort(function(a,b){return a.d<b.d?-1:(a.d>b.d?1:0);});
  clearForm('events'); setEditMode('events',null); FORM_EV=blankEvLinks(); renderEvLinks();
  save(); renderEvents(); renderExhibits(); renderWitnesses(); renderHomeDates();
  setTimeout(function(){ flashEl(document.querySelector('#ev-list [data-id="'+id+'"]')); },60);
}
function evChips(e){
  var h='';
  if(e.pa) h+='<span class="tag pa">Protected activity</span>';
  (e.tags||[]).forEach(function(t){ h+='<span class="tag">'+esc(claimName(t))+'</span>'; });
  linkedExhibits(e).forEach(function(x){ h+='<button type="button" class="lchip" onclick="goItem(\'exhibits\',\''+x.id+'\')">Exhibit '+x.n+'</button>'; });
  linkedWitnesses(e).forEach(function(x){ h+='<button type="button" class="lchip w" onclick="goItem(\'witnesses\',\''+x.id+'\')">'+esc(short(x.n,30))+'</button>'; });
  return h? '<div class="chips">'+h+'</div>' : '';
}
/* the most recent protected activity before a date */
function lastProtectedBefore(d){
  var best=null; D.events.forEach(function(e){ if(e.pa && e.d<d && (!best||e.d>best.d)) best=e; }); return best;
}
function tlMatches(e){
  if(!TL_FILTER) return true;
  if(TL_FILTER==='pa') return !!e.pa;
  return (e.tags||[]).indexOf(TL_FILTER)>-1;
}
function renderEvents(){
  var bar=$('evbar-list');
  if(bar){
    var used={}; D.events.forEach(function(e){ (e.tags||[]).forEach(function(t){ used[t]=1; }); if(e.pa) used.pa=1; });
    var h='<div class="seg">'+chipBtn('List',TL_MODE==='list',"setTl('list')")+chipBtn('Timeline',TL_MODE==='tl',"setTl('tl')")+'</div>';
    var keys=Object.keys(used);
    if(keys.length){
      h+='<div class="filt"><span class="lhead">Show</span>'+chipBtn('Everything',!TL_FILTER,"setTlFilter('')");
      if(used.pa) h+=chipBtn('Protected activity',TL_FILTER==='pa',"setTlFilter('pa')",'pa');
      CLAIMS.forEach(function(c){ if(used[c[0]]) h+=chipBtn(c[1],TL_FILTER===c[0],"setTlFilter('"+c[0]+"')"); });
      h+='</div>';
    }
    bar.innerHTML= D.events.length? h : '';
  }
  var list=D.events.filter(tlMatches), h2='';
  if(!D.events.length) h2='<div class="empty">Nothing yet. Add the first entry above &mdash; it does not have to be the earliest, they sort themselves.</div>';
  else if(!list.length) h2='<div class="empty">No entries carry that tag yet.</div>';
  else if(TL_MODE==='tl') h2=timelineHTML(list);
  else list.forEach(function(e){
    h2+='<div class="item'+(e.pa?' paitem':'')+'" data-id="'+e.id+'">'+itemTools('events',e.id,'Remove this entry?','renderEvents')+
       '<div class="d">'+esc(niceDate(e.d))+'</div><div class="t">'+esc(e.w)+'</div>'+
       (e.who?'<div class="m">Present: '+esc(e.who)+'</div>':'')+
       (e.doc?'<div class="m">Document: '+esc(e.doc)+'</div>':'')+evChips(e)+'</div>';
  });
  $('ev-list').innerHTML=h2; $('ev-count').textContent=D.events.length;
  renderEvLinks();
}
function setTl(m){ TL_MODE=m; renderEvents(); }
function setTlFilter(f){ TL_FILTER=f; renderEvents(); }
function timelineHTML(list){
  var h='<div class="tl">', prev=null;
  list.forEach(function(e){
    if(prev){ var g=daysBetween(prev.d,e.d); h+='<div class="tlgap">'+(g===0?'same day':dayWord(g)+' later')+'</div>'; }
    var pa=lastProtectedBefore(e.d), after='';
    if(pa && !e.pa) after='<div class="tlafter">'+dayWord(daysBetween(pa.d,e.d))+' after your protected activity on '+esc(niceDate(pa.d))+'</div>';
    h+='<div class="tlnode'+(e.pa?' pa':'')+'" data-id="'+e.id+'"><span class="tldot"></span><div class="tlbody">'+
      '<div class="d">'+esc(niceDate(e.d))+'</div><div class="t">'+esc(e.w)+'</div>'+after+evChips(e)+
      '<div class="tltools"><button type="button" class="ilink" onclick="editItem(\'events\',\''+e.id+'\')">edit</button></div></div></div>';
    prev=e;
  });
  return h+'</div>';
}

/* ================= evidence ================= */
function addExhibit(){
  var o=readForm('exhibits'); if(!o.w){ alert('Say what the exhibit is.'); return; }
  o.t=pendingThumb||'';
  var id=EDITING.exhibits, x;
  if(id){ x=byId(D.exhibits,id); if(x) Object.assign(x,o); }
  else { o.id=uid(); D.exhibits.push(o); x=o; id=o.id; }
  clearForm('exhibits'); clearThumb(); setEditMode('exhibits',null);
  if(!save()){ if(x && x.t){ x.t=''; if(save()) alert('Storage on this device is full, so the thumbnail could not be kept. The exhibit was saved without it.'); } }
  renderExhibits(); renderEvents();
  setTimeout(function(){ flashEl(document.querySelector('#ex-list [data-id="'+id+'"]')); },60);
}
function moveExhibit(id,dir){
  var i=idxOf(D.exhibits,id), j=i+dir; if(i<0||j<0||j>=D.exhibits.length) return;
  var t=D.exhibits[i]; D.exhibits[i]=D.exhibits[j]; D.exhibits[j]=t;
  save(); renderExhibits(); renderEvents();
  setTimeout(function(){ var el=document.querySelector('#ex-list [data-id="'+id+'"]'); if(el) el.classList.add('moved'); },20);
}
function usedIn(id,key){ return D.events.filter(function(e){ return (e[key]||[]).indexOf(id)>-1; }); }
function backlinks(id,key){
  var ev=usedIn(id,key); if(!ev.length) return '';
  return '<div class="chips">'+ev.map(function(e){
    return '<button type="button" class="lchip c" onclick="goItem(\'timeline\',\''+e.id+'\')">'+esc(niceDate(e.d))+': '+esc(short(e.w,34))+'</button>'; }).join('')+'</div>';
}
function renderExhibits(){
  var h=''; if(!D.exhibits.length) h='<div class="empty">No exhibits yet.</div>';
  D.exhibits.forEach(function(e,i){
    var mv='<button type="button" class="ilink" title="Move up" aria-label="Move up" onclick="moveExhibit(\''+e.id+'\',-1)"'+(i===0?' disabled':'')+'>\u2191</button>'+
           '<button type="button" class="ilink" title="Move down" aria-label="Move down" onclick="moveExhibit(\''+e.id+'\',1)"'+(i===D.exhibits.length-1?' disabled':'')+'>\u2193</button>';
    h+='<div class="item" data-id="'+e.id+'">'+itemTools('exhibits',e.id,'Remove this exhibit?','renderExhibits',mv)+
       (e.t?'<img class="exthumb" src="'+e.t+'" alt="">':'')+
       '<div class="d">Exhibit '+(i+1)+(e.d?' \u00b7 '+esc(niceDate(e.d)):'')+'</div><div class="t">'+esc(e.w)+'</div>'+
       (e.f?'<div class="m"><b>File:</b> '+esc(e.f)+'</div>':'')+
       (e.p?'<div class="m"><b>Proves:</b> '+esc(e.p)+'</div>':'')+
       (e.l?'<div class="m"><b>Stored:</b> '+esc(e.l)+'</div>':'')+backlinks(e.id,'ex')+'</div>';
  });
  $('ex-list').innerHTML=h; $('ex-count').textContent=D.exhibits.length;
}

/* ================= witnesses ================= */
function addWitness(){
  var o=readForm('witnesses'); if(!o.n){ alert('A name is needed.'); return; }
  var id=EDITING.witnesses;
  if(id){ var x=byId(D.witnesses,id); if(x) Object.assign(x,o); }
  else { o.id=uid(); D.witnesses.push(o); id=o.id; }
  clearForm('witnesses'); setEditMode('witnesses',null);
  save(); renderWitnesses(); renderEvents();
  setTimeout(function(){ flashEl(document.querySelector('#wt-list [data-id="'+id+'"]')); },60);
}
function renderWitnesses(){
  var h=''; if(!D.witnesses.length) h='<div class="empty">No witnesses yet. Anyone who saw something, heard something, or holds a document counts.</div>';
  D.witnesses.forEach(function(w){
    h+='<div class="item" data-id="'+w.id+'">'+itemTools('witnesses',w.id,'Remove this witness?','renderWitnesses')+
       '<div class="d">'+esc(w.s||'Not approached')+'</div><div class="t">'+esc(w.n)+'</div>'+
       (w.r?'<div class="m"><b>Relationship:</b> '+esc(w.r)+'</div>':'')+
       (w.k?'<div class="m"><b>Can speak to:</b> '+esc(w.k)+'</div>':'')+
       (w.c?'<div class="m"><b>Contact:</b> '+esc(w.c)+'</div>':'')+
       (w.o?'<div class="m">'+esc(w.o)+'</div>':'')+backlinks(w.id,'wt')+'</div>';
  });
  $('wt-list').innerHTML=h; $('wt-count').textContent=D.witnesses.length;
}

/* ================= correspondence ================= */
function addDoc(){
  var o=readForm('docs'); if(!o.w){ alert('Say what the document is.'); return; }
  var id=EDITING.docs;
  if(id){ var x=byId(D.docs,id); if(x) Object.assign(x,o); }
  else { o.id=uid(); D.docs.push(o); id=o.id; }
  D.docs.sort(function(a,b){ return (a.d||'9999')<(b.d||'9999')?-1:1; });
  clearForm('docs'); setEditMode('docs',null);
  save(); renderDocs(); renderHomeDates();
  setTimeout(function(){ flashEl(document.querySelector('#dc-list [data-id="'+id+'"]')); },60);
}
function renderDocs(){
  var h=''; if(!D.docs.length) h='<div class="empty">Nothing filed yet. Every letter, decision and notice goes here.</div>';
  var today=todayISO(), open=0;
  D.docs.forEach(function(e){
    var late=e.due && e.due<today; if(e.due && !late) open++;
    h+='<div class="item" data-id="'+e.id+'">'+itemTools('docs',e.id,'Remove this document?','renderDocs')+
       '<div class="d">'+esc(e.d?niceDate(e.d):'no date')+' \u00b7 '+esc(e.k||'')+'</div>'+
       '<div class="t">'+esc(e.w)+'</div>'+
       (e.f?'<div class="m"><b>From:</b> '+esc(e.f)+'</div>':'')+
       (e.a?'<div class="m"><b>Action:</b> '+esc(e.a)+'</div>':'')+
       (e.due?'<div class="m'+(late?' overdue':'')+'"><b>Due:</b> '+esc(niceDate(e.due))+(late?' \u2014 passed':'')+
         ' <button type="button" class="ilink" onclick="icsOne(\'doc\',\''+e.id+'\')">add to calendar</button></div>':'')+
       (e.l?'<div class="m"><b>Stored:</b> '+esc(e.l)+'</div>':'')+'</div>';
  });
  $('dc-list').innerHTML=h; $('dc-count').textContent=D.docs.length; $('dc-open').textContent=open;
}

/* ================= deadlines ================= */
function allDates(){
  D.dates=D.dates||{};
  var out=[], last=D.deadline&&D.deadline.last;
  if(last) out.push({key:'file',date:addDays(last,180),label:'Last day to file with the Human Rights Bureau',
    detail:'180 days from the most recent act you entered ('+niceDate(last)+').',kind:'file'});
  D.events.forEach(function(e){
    if((e.tags||[]).indexOf('retaliation')>-1) out.push({key:'ret-'+e.id,date:addDays(e.d,180),
      label:'180 days from a retaliatory act',detail:niceDate(e.d)+': '+short(e.w,80),kind:'file'});
  });
  if(D.dates.filed){
    var n=D.dates.housing?120:180;
    out.push({key:'inv',date:addDays(D.dates.filed,n),label:'The Bureau\u2019s investigation should be finished',
      detail:n+' days from filing on '+niceDate(D.dates.filed)+'. Up to 45 days may be added if both sides discuss resolution.',kind:'bureau'});
  }
  if(D.dates.dismiss){
    out.push({key:'obj',date:addDays(D.dates.dismiss,14),label:'Objection to the Human Rights Commission',
      detail:'Must be received by 5:00 p.m. 14 days from the date on the letter ('+niceDate(D.dates.dismiss)+'). Not postmarked: received.',kind:'urgent'});
    out.push({key:'brief',date:addDays(D.dates.dismiss,21),label:'Opening brief to the Commission',
      detail:'21 calendar days from the decision to dismiss. Confirm the exact date with the Commission.',kind:'urgent'});
  }
  D.docs.forEach(function(e){ if(e.due) out.push({key:'doc-'+e.id,date:e.due,label:e.a||('Due: '+e.w),detail:e.w+(e.f?' \u00b7 '+e.f:''),kind:'doc'}); });
  out.sort(function(a,b){ return a.date<b.date?-1:(a.date>b.date?1:0); });
  return out;
}
function dateRow(x,today){
  var left=daysBetween(today,x.date), cls=left<0?'past':(left<=14?'soon':'');
  var when= left<0? 'passed' : (left===0?'today':(left===1?'tomorrow':dayWord(left)+' left'));
  return '<div class="drow '+cls+' k-'+x.kind+'"><div class="dwhen"><b>'+esc(niceDate(x.date))+'</b><span>'+when+'</span></div>'+
    '<div class="dwhat"><div class="t">'+esc(x.label)+'</div><div class="m">'+esc(x.detail)+'</div>'+
    (left>=0?'<button type="button" class="ilink" onclick="icsOne(\'key\',\''+x.key+'\')">add to calendar</button>':'')+'</div></div>';
}
function renderDates(){
  if(!$('dates-list')) return;
  D.dates=D.dates||{};
  $('dt-filed').value=D.dates.filed||''; $('dt-housing').checked=!!D.dates.housing; $('dt-dismiss').value=D.dates.dismiss||'';
  var today=todayISO(), all=allDates(), up=all.filter(function(x){return x.date>=today;}), past=all.filter(function(x){return x.date<today;});
  var h='';
  if(!all.length) h='<div class="empty">No dates yet. Enter the most recent act on the Deadline calculator, add deadlines to letters in Correspondence, or fill in the dates above.</div>';
  else {
    h+= up.length? up.map(function(x){return dateRow(x,today);}).join('') : '<div class="empty">Nothing ahead.</div>';
    if(past.length) h+='<details class="pastd"><summary>'+plural(past.length,'date')+' already passed</summary>'+past.map(function(x){return dateRow(x,today);}).join('')+'</details>';
  }
  $('dates-list').innerHTML=h;
  $('dt-all').style.display=up.length?'':'none';
}
function setDateField(k,v){ D.dates=D.dates||{}; D.dates[k]=v; save(); renderDates(); renderHomeDates(); }
function renderHomeDates(){
  var box=$('homedates-list'); if(!box) return;
  var today=todayISO(), up=allDates().filter(function(x){return x.date>=today;}).slice(0,3);
  if(!up.length){ box.innerHTML=''; box.style.display='none'; return; }
  box.style.display='';
  box.innerHTML='<div class="card hdates"><h3 style="margin-top:0">Coming up</h3>'+up.map(function(x){return dateRow(x,today);}).join('')+
    '<div class="row"><button class="sec" onclick="show(\'dates\')">All your deadlines</button></div></div>';
}
/* calendar files */
function icsEsc(t){ return String(t||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/([,;])/g,'\\$1'); }
function icsEvent(x){
  var d=x.date.replace(/-/g,''), d2=addDays(x.date,1).replace(/-/g,''), stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  return ['BEGIN:VEVENT','UID:'+x.key+'-'+d+'@kickasscase.netlify.app','DTSTAMP:'+stamp,
    'DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+d2,'SUMMARY:'+icsEsc(x.label),'DESCRIPTION:'+icsEsc(x.detail),
    'BEGIN:VALARM','TRIGGER:-P7D','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(x.label+' in 7 days'),'END:VALARM',
    'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY','DESCRIPTION:'+icsEsc(x.label+' tomorrow'),'END:VALARM','END:VEVENT'].join('\r\n');
}
function deliverICS(items,name){
  if(!items.length){ alert('There is no upcoming date to add.'); return; }
  var text=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Kickass Case Builder//EN','CALSCALE:GREGORIAN'].concat(items.map(icsEvent)).concat(['END:VCALENDAR']).join('\r\n');
  var blob=new Blob([text],{type:'text/calendar'}), url=URL.createObjectURL(blob);
  if(isIOS()){ location.href=url; return; }   // Safari opens it straight into Calendar
  var a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
}
function icsOne(type,key){
  var all=allDates(), x=null;
  for(var i=0;i<all.length;i++){ if((type==='doc'&&all[i].key==='doc-'+key)||(type==='key'&&all[i].key===key)) x=all[i]; }
  if(x) deliverICS([x],'case-deadline-'+x.date+'.ics');
}
function icsAll(){ var t=todayISO(); deliverICS(allDates().filter(function(x){return x.date>=t;}),'case-deadlines.ics'); }

/* ================= claim wizard and length meter ================= */
function claimsState(){ D.claims=D.claims||{grounds:[],claims:[],area:'',why:'',comp:'',cont:false}; return D.claims; }
function toggleCW(kind,val){
  var c=claimsState();
  if(kind==='cont') c.cont=!c.cont;
  else { var a=c[kind], i=a.indexOf(val); if(i<0) a.push(val); else a.splice(i,1); }
  save(); renderClaimWizard();
}
function setCW(k,v){ claimsState()[k]=v; save(); }
function suggestedClaims(){
  var s={}; D.events.forEach(function(e){ (e.tags||[]).forEach(function(t){ s[t]=1; }); });
  return Object.keys(s);
}
function renderClaimWizard(){
  var box=$('cw-list'); if(!box) return;
  var c=claimsState(), sug=suggestedClaims(), h='';
  h+='<div class="cwstep"><div class="cwq"><span class="n">1</span><div>Why were you treated this way? Pick every protected ground that applies.</div></div>';
  GROUNDS.forEach(function(g){ h+=chipBtn(esc(g),c.grounds.indexOf(g)>-1,"toggleCW('grounds','"+g.replace(/'/g,"\\'")+"')"); });
  if(!c.grounds.length) h+='<p class="note cwwarn">If none of these is in it, the Bureau cannot take the case, however badly you were treated. Call the Bureau and ask anyway.</p>';
  h+='</div><div class="cwstep"><div class="cwq"><span class="n">2</span><div>Where did it happen?</div></div>';
  ['employment','housing','education','public accommodations','credit, finance or insurance','governmental services'].forEach(function(a){
    h+=chipBtn(esc(a),c.area===a,"setCW('area','"+a+"');renderClaimWizard()"); });
  h+='</div><div class="cwstep"><div class="cwq"><span class="n">3</span><div>What shows it happened <i>because of</i> that ground?</div></div>'+
    '<label class="fl" for="cw-comp">Someone outside your group, in a similar position, who was treated better</label>'+
    '<input type="text" id="cw-comp" value="'+esc(c.comp)+'" oninput="setCW(\'comp\',this.value)" placeholder="Who, and how they were treated">'+
    '<label class="fl" for="cw-why">Anything else: timing, words used, a pattern</label>'+
    '<textarea id="cw-why" oninput="setCW(\'why\',this.value)" placeholder="For your own notes. This is not added to the complaint.">'+esc(c.why)+'</textarea></div>';
  h+='<div class="cwstep"><div class="cwq"><span class="n">4</span><div>Name every claim. Only what you name gets investigated.</div></div>';
  CLAIMS.forEach(function(k){
    var on=c.claims.indexOf(k[0])>-1, hint=sug.indexOf(k[0])>-1&&!on;
    h+='<button type="button" class="cwclaim'+(on?' on':'')+'" onclick="toggleCW(\'claims\',\''+k[0]+'\')"><b>'+k[1]+'</b><span>'+k[2]+'</span>'+
      (hint?'<em>Your chronology has entries tagged with this</em>':'')+'</button>';
  });
  h+=chipBtn('It is still happening (continuing violation)',c.cont,"toggleCW('cont')")+'</div>';
  h+='<div class="row"><button class="pri" onclick="applyClaims()">Put these into the complaint</button></div>';
  box.innerHTML=h;
}
function applyClaims(){
  var c=claimsState();
  if(!c.grounds.length){ alert('Pick at least one protected ground first.'); return; }
  var g=c.grounds.slice(); if(c.claims.indexOf('retaliation')>-1 && g.indexOf('Retaliation')<0) g.push('Retaliation');
  $('cp-grounds').value=g.join(', ');
  if(c.area) $('cp-area').value=c.area;
  autosave(); updateMeter();
  var f=$('cp-grounds'); try{ f.scrollIntoView({block:'center'}); }catch(e){} flashEl(f);
}
function claimsSentence(){
  var c=D.claims; if(!c || !c.claims || !c.claims.length) return '';
  var names=c.claims.map(function(k){ return claimName(k).toLowerCase(); });
  var list=names.length>1? names.slice(0,-1).join(', ')+' and '+names[names.length-1] : names[0];
  return 'This charge includes claims of '+list+'.'+(c.cont?' The conduct is ongoing and is a continuing violation.':'');
}
function withClaims(paras){ var s=claimsSentence(); return s? paras.concat([s]) : paras; }
function withClaimsText(body){
  var s=claimsSentence(); if(!s) return body;
  var n=(body||'').split(/\n\s*\n/).filter(function(x){return x.trim();}).length;
  var L=n<26? String.fromCharCode(65+n) : 'Z';
  return (body?body+'\n\n':'')+L+'. '+s;
}
function particularsWords(){
  var f=$('cp-facts'), t=f&&f.value.trim();
  if(!t) t=D.events.map(function(e){ return 'On '+niceDate(e.d)+', '+e.w+(e.who?' Present: '+e.who+'.':''); }).join(' ');
  t+=' '+claimsSentence();
  return t.split(/\s+/).filter(Boolean).length;
}
function updateMeter(){
  var m=$('cpmeter-list'); if(!m) return;
  var w=particularsWords(), lim=900, pct=Math.min(100,Math.round(w/lim*100));
  var cls=w>lim?'over':(w>650?'near':''), msg= w>lim? 'Over the 2-page limit. Move detail into your chronology and attach it.'
    : (w>650? 'Close to the 2-page limit.' : 'Fits within the 2 pages.');
  m.innerHTML='<div class="meter '+cls+'"><div class="mbar"><span style="width:'+pct+'%"></span></div>'+
    '<div class="mtext"><b>'+w+' words</b> in the particulars \u00b7 '+msg+'</div></div>';
}

/* ================= rebuttal workspace ================= */
var RB_STATUS=[['','Not marked yet'],['admit','They admit this'],['deny','They deny this'],['reframe','They reframe it'],['unsure','Not sure yet']];
function rbState(){ D.rebuttal=D.rebuttal||{date:'',text:'',points:[],answered:{}}; return D.rebuttal; }
function rbSplit(){
  var r=rbState(), t=($('rb-text').value||'').replace(/\r/g,'').trim();
  if(!t){ alert('Paste their position statement into the box first.'); return; }
  if(r.points.length && !confirm('This replaces the points you have already worked through. Continue?')) return;
  r.text=t;
  r.points=t.split(/\n\s*\n/).map(function(p){ return p.replace(/\s*\n\s*/g,' ').trim(); })
    .filter(function(p){ return p.split(/\s+/).length>=4; })
    .map(function(p){ return {id:uid(),t:p,s:'',a:'',ex:[]}; });
  save(); renderRebuttal();
}
function rbSet(id,k,v){ var p=byId(rbState().points,id); if(!p) return; p[k]=v; save(); if(k==='s') renderRebuttal(); }
function rbToggleEx(id,ex){ var p=byId(rbState().points,id); if(!p) return; p.ex=p.ex||[];
  var i=p.ex.indexOf(ex); if(i<0) p.ex.push(ex); else p.ex.splice(i,1); save(); renderRebuttal(); }
function rbToggleAns(k){ var r=rbState(); r.answered[k]=!r.answered[k]; save(); renderRebuttal(); }
function ansKey(t,i){ return 'p'+i+'_'+String(t).slice(0,24).replace(/[^a-z0-9]/gi,''); }
function complaintParas(){
  var f=(D.complaint&&D.complaint['cp-facts'])||'';
  if(f.trim()) return f.replace(/\r/g,'').split(/\n\s*\n/).map(function(x){ return x.replace(/\s*\n\s*/g,' ').replace(/^\s*[A-Za-z0-9]{1,2}[.)]\s+/,'').trim(); }).filter(Boolean);
  return D.events.map(function(e){ return 'On '+niceDate(e.d)+', '+e.w; });
}
function renderRebuttal(){
  var box=$('rb-list'); if(!box) return;
  var r=rbState(), h='';
  $('rb-date').value=r.date||'';
  if(!$('rb-text').value && r.text) $('rb-text').value=r.text;
  var counts={}; r.points.forEach(function(p){ counts[p.s||'']=(counts[p.s||'']||0)+1; });
  if(r.points.length){
    h+='<div class="rbsum">'+plural(r.points.length,'point')+' \u00b7 '+(counts.admit||0)+' admitted \u00b7 '+(counts.deny||0)+' denied \u00b7 '+
      (counts.reframe||0)+' reframed \u00b7 '+(counts['']||0)+' not marked</div>';
    r.points.forEach(function(p,i){
      var opts=RB_STATUS.map(function(s){ return '<option value="'+s[0]+'"'+(p.s===s[0]?' selected':'')+'>'+s[1]+'</option>'; }).join('');
      h+='<div class="rbpt s-'+(p.s||'none')+'" data-id="'+p.id+'"><div class="d">Their point '+(i+1)+'</div>'+
        '<blockquote>'+esc(p.t)+'</blockquote>'+
        '<label class="fl" for="rbs-'+p.id+'">What are they doing here?</label><select id="rbs-'+p.id+'" onchange="rbSet(\''+p.id+'\',\'s\',this.value)">'+opts+'</select>'+
        (p.s==='admit'? '<p class="note">Admitted. It is now established. You do not need to argue it.</p>' :
        '<label class="fl" for="rba-'+p.id+'">Your answer, in your words</label>'+
        '<textarea id="rba-'+p.id+'" oninput="rbSet(\''+p.id+'\',\'a\',this.value)" placeholder="Dates, documents, who was there. Correct facts, not adjectives.">'+esc(p.a)+'</textarea>'+
        '<div class="lhead">Exhibits that answer it</div>'+
        (D.exhibits.length? D.exhibits.map(function(x,k){ return chipBtn('Exhibit '+(k+1)+': '+esc(short(x.w,34)),(p.ex||[]).indexOf(x.id)>-1,"rbToggleEx('"+p.id+"','"+x.id+"')"); }).join('')
          : '<div class="lnone">Log exhibits on the Evidence page to link them here.</div>'))+'</div>';
    });
  }
  var cps=complaintParas();
  h+='<div class="card rbmiss"><h3 style="margin-top:0">What did they not answer?</h3>'+
    '<p class="note">Go through your own complaint. Tick each part their statement deals with. Whatever is left unticked is silence, and you name it in your rebuttal.</p>';
  if(!cps.length) h+='<div class="lnone">Your complaint particulars or chronology appear here once you have entered them.</div>';
  cps.forEach(function(t,i){ var k=ansKey(t,i);
    h+='<label class="rbchk"><input type="checkbox"'+(r.answered[k]?' checked':'')+' onchange="rbToggleAns(\''+k+'\')"><span><b>'+String.fromCharCode(65+Math.min(i,25))+'.</b> '+esc(short(t,180))+'</span></label>'; });
  h+='</div>';
  box.innerHTML=h;
}
function rbDraft(){
  var r=rbState();
  if(!r.points.length){ alert('Paste their statement and split it into points first.'); return; }
  var exl=function(ids){ return (ids||[]).map(function(id){ var x=byId(D.exhibits,id); return x? 'Exhibit '+exNum(id)+' ('+x.w+')' : null; }).filter(Boolean); };
  var out=['RE: Rebuttal to the respondent\u2019s position statement'+(r.date?' dated '+niceDate(r.date):''),'',
    '[One short paragraph: what you are responding to.]',''];
  var adm=r.points.filter(function(p){return p.s==='admit';});
  if(adm.length){ out.push('WHAT THE RESPONDENT ADMITS',''); adm.forEach(function(p){ out.push('\u2022 '+p.t); }); out.push(''); }
  out.push('POINT BY POINT','');
  r.points.forEach(function(p,i){ if(p.s==='admit') return;
    out.push('Point '+(i+1)+'. The respondent states: \u201c'+p.t+'\u201d');
    out.push(p.a? p.a : '[Your answer.]');
    var ex=exl(p.ex); if(ex.length) out.push('See '+ex.join('; ')+'.');
    out.push('');
  });
  var cps=complaintParas(), miss=[];
  cps.forEach(function(t,i){ var k=ansKey(t,i); if(!r.answered[k]) miss.push(String.fromCharCode(65+Math.min(i,25))+'. '+t); });
  if(miss.length){ out.push('WHAT THE POSITION STATEMENT DOES NOT ADDRESS',''); miss.forEach(function(m){ out.push('\u2022 The position statement does not address paragraph '+m); }); out.push(''); }
  out.push('[One short closing paragraph: what the documents show.]');
  $('rb-out').value=out.join('\n'); $('rb-outwrap').style.display='block';
  try{ $('rb-outwrap').scrollIntoView({block:'start'}); }catch(e){}
}
function rbPrint(){
  var t=($('rb-out').value||'').trim(); if(!t){ alert('Build the draft first.'); return; }
  var html=t.split(/\n\s*\n/).map(function(p){ return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>'; }).join('');
  $('rb-print').innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\'rb-print\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'rb-print\')">Close</button></div><div class="letter">'+html+'</div>';
  showPrintView('rb-print');
}

/* ================= case packet ================= */
var PK=[['cover','Cover page',true],['complaint','Complaint draft',true],['chron','Chronology',true],['index','Exhibit index',true],
  ['thumbs','Thumbnails in the exhibit index',false],['docs','Correspondence log',true],['dates','Deadlines',true],
  ['witnesses','Witness list (keep private unless you must share it)',false]];
function pkState(){ D.packet=D.packet||{}; PK.forEach(function(p){ if(!(p[0] in D.packet)) D.packet[p[0]]=p[2]; }); return D.packet; }
function renderPacket(){
  var box=$('pk-list'); if(!box) return; var s=pkState();
  box.innerHTML=PK.map(function(p){ return '<label class="rbchk"><input type="checkbox"'+(s[p[0]]?' checked':'')+
    ' onchange="pkState()[\''+p[0]+'\']=this.checked;save()"><span>'+p[1]+'</span></label>'; }).join('');
}
function tbl(head,rows){ return '<table><thead><tr>'+head.map(function(h){return '<th>'+h+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>'; }
function buildPacket(){
  var s=pkState(), c=D.complaint||{}, parts=[], toc=[];
  var sec=function(title,body){ toc.push(title); parts.push('<section class="pksec"><h2>'+(toc.length)+'. '+esc(title)+'</h2>'+body+'</section>'); };
  if(s.complaint){
    try{ buildComplaint(); }catch(e){}
    var t=($('cp-out')&&$('cp-out').value)||'';
    sec('Complaint draft', t? '<pre class="pkpre">'+esc(t)+'</pre>' : '<p>No complaint drafted yet.</p>');
  }
  if(s.chron){
    var rows=D.events.map(function(e,i){ return '<tr><td class="n">'+(i+1)+'</td><td class="dcell">'+esc(niceDate(e.d))+'</td><td><div class="wt">'+esc(e.w)+'</div>'+
      (e.who?'<div class="pv"><b>Present:</b> '+esc(e.who)+'</div>':'')+chronRefs(e)+'</td><td class="loc">'+esc(e.doc||'')+'</td></tr>'; }).join('');
    sec('Chronology', D.events.length? tbl(['','Date','What happened','Document'],rows) : '<p>No entries yet.</p>');
  }
  if(s.index){
    var rows2=D.exhibits.map(function(e,i){ return '<tr><td class="n">'+(i+1)+'</td>'+(s.thumbs?'<td class="th">'+(e.t?'<img src="'+e.t+'">':'')+'</td>':'')+
      '<td><div class="dt">'+esc(e.d?niceDate(e.d):'')+'</div><div class="wt">Exhibit '+(i+1)+': '+esc(e.w)+'</div>'+(e.p?'<div class="pv"><b>Proves:</b> '+esc(e.p)+'</div>':'')+'</td>'+
      '<td class="loc">'+(e.f?'<div><b>'+esc(e.f)+'</b></div>':'')+(e.l?'<div>'+esc(e.l)+'</div>':'')+'</td></tr>'; }).join('');
    sec('Exhibit index', D.exhibits.length? tbl(s.thumbs?['','Thumbnail','Exhibit','File and location']:['','Exhibit','File and location'],rows2) : '<p>No exhibits yet.</p>');
  }
  if(s.docs){
    var rows3=D.docs.map(function(e,i){ return '<tr><td class="n">'+(i+1)+'</td><td class="dcell">'+esc(e.d?niceDate(e.d):'')+'</td><td><div class="wt">'+esc(e.w)+'</div><div class="pv">'+esc(e.k||'')+(e.f?' \u00b7 '+esc(e.f):'')+'</div>'+
      (e.a?'<div class="pv"><b>Action:</b> '+esc(e.a)+'</div>':'')+(e.due?'<div class="pv"><b>Due:</b> '+esc(niceDate(e.due))+'</div>':'')+'</td><td class="loc">'+esc(e.l||'')+'</td></tr>'; }).join('');
    sec('Correspondence and filings', D.docs.length? tbl(['','Date','Document','Stored'],rows3) : '<p>Nothing logged yet.</p>');
  }
  if(s.dates){
    var rows4=allDates().map(function(x){ return '<tr><td class="dcell">'+esc(niceDate(x.date))+'</td><td><div class="wt">'+esc(x.label)+'</div><div class="pv">'+esc(x.detail)+'</div></td></tr>'; }).join('');
    sec('Deadlines', rows4? tbl(['Date','What'],rows4) : '<p>No dates yet.</p>');
  }
  if(s.witnesses){
    var rows5=D.witnesses.map(function(w,i){ return '<tr><td class="n">'+(i+1)+'</td><td><div class="wt">'+esc(w.n)+'</div>'+(w.r?'<div class="pv">'+esc(w.r)+'</div>':'')+(w.k?'<div class="pv"><b>Can speak to:</b> '+esc(w.k)+'</div>':'')+'</td><td class="loc">'+esc(w.s||'')+'</td></tr>'; }).join('');
    sec('Witness list', D.witnesses.length? tbl(['','Witness','Status'],rows5) : '<p>No witnesses listed.</p>');
  }
  if(!parts.length && !s.cover){ alert('Pick at least one part to include.'); return; }
  var cover='';
  if(s.cover){
    cover='<section class="pkcover"><h1>Case file</h1>'+
      (c['cp-name']?'<p class="pkline"><b>Charging party:</b> '+esc(c['cp-name'])+'</p>':'')+
      (c['cp-resp']?'<p class="pkline"><b>Respondent:</b> '+esc(c['cp-resp'])+'</p>':'')+
      (c['cp-grounds']?'<p class="pkline"><b>Basis:</b> '+esc(c['cp-grounds'])+'</p>':'')+
      '<p class="pkline"><b>Prepared:</b> '+pdate()+'</p>'+
      (toc.length?'<h3>Contents</h3><ol>'+toc.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ol>':'')+'</section>';
  }
  $('pk-print').innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\'pk-print\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'pk-print\')">Close</button></div>'+
    '<div class="pvhint noprint">To make a PDF, choose Save as PDF in the print window. On a phone, use Share, then Print, then pinch out on the preview to save it.</div>'+
    '<div class="pvdoc packet">'+cover+parts.join('')+'</div>';
  showPrintView('pk-print');
}


/* ================= home dashboard ================= */
var HOME_TOOLS=[
 ['Build your case file',[['timeline','☰'],['exhibits','▣'],['witnesses','✎'],['docs','✉'],['records','▤'],['dates','⧗'],['packet','⎘']]],
 ['Court filings, outside the Bureau',[['ct:records'],['ct:meetings'],['ct:wdea'],['ct:small'],['ct:hrb']]],
 ['A discrimination complaint with the Human Rights Bureau',[['complaint','☑'],['deadline','◷'],['stage','◴'],['rebuttal','⇄'],['damages','¤'],['mediation','⚖'],['nocause','⚠']]],
 ['Support',[['ai','⌘'],['care','❦'],['checklist','✓'],['howto','ⓘ']]]];
function viewInfo(v){
  var sec=$('v-'+v); if(!sec) return {t:v,d:''};
  var h=sec.querySelector('h2'), sb=sec.querySelector('.sub2');
  var d=sb? sb.cloneNode(true) : null;
  if(d){ d.querySelectorAll('[id]').forEach(function(x){ x.remove(); }); }
  var txt=d? d.textContent.replace(/\s+/g,' ').trim() : '';
  var first=(txt.match(/^.*?[.!?](\s|$)/)||[txt])[0].trim();
  return {t:h?h.textContent.trim():v, d:first};
}
function buildHome(){
  var home=$('v-home'); if(!home) return;
  var logo=home.querySelector('.homelogo'), tip=$('iostip');
  var dash=document.createElement('div'); dash.id='dash-list'; dash.className='dash';
  dash.innerHTML='<div class="hero"><div class="herotop"></div><div id="nextstep-list"></div></div>'+
    '<div id="install-list"></div>'+
    '<div class="dsec"><div class="dhead"><h3>What you can do here</h3></div><div class="scope">'+
      '<button type="button" class="scopecard" onclick="show(\'timeline\')"><span class="ticon">☰</span><b>Build a case file</b><span>A dated chronology, an evidence index, witnesses, letters and deadlines. Useful for any dispute.</span></button>'+
      '<button type="button" class="scopecard" onclick="show(\'court\')"><span class="ticon">▧</span><b>Go to court</b><span>Public records, open meetings, wrongful discharge and small claims.</span></button>'+
      '<button type="button" class="scopecard" onclick="show(\'complaint\')"><span class="ticon">☑</span><b>File with the Human Rights Bureau</b><span>A discrimination complaint, from intake to mediation.</span></button>'+
    '</div></div>'+
    '<div class="dsec"><div class="dhead"><h3>Your case at a glance</h3></div><div id="glance-list"></div></div>'+
    '<div id="homedates-list"></div>'+
    '<div class="dsec"><div class="dhead"><h3>Your tools</h3></div><div id="tools-list"></div></div>'+
    '<div id="savedwork-list"></div>'+
    '<div class="dhead startread"><h3>Start here</h3></div>';
  var after=tip||logo; after.parentNode.insertBefore(dash, after.nextSibling);
  if(tip && logo && tip.previousElementSibling===logo){ /* keep the tip above the dashboard */ }
  if(logo) dash.querySelector('.herotop').appendChild(logo);
  // tools never change, so draw them once
  $('tools-list').innerHTML=HOME_TOOLS.map(function(g){
    return '<div class="tgroup"><div class="lhead">'+g[0]+'</div><div class="tgrid">'+g[1].map(function(t){
      if(t[0].indexOf('ct:')===0){ var k=t[0].slice(3), C=window.CT_TYPES&&CT_TYPES[k]; if(!C) return '';
        return '<button type="button" class="tool" onclick="show(\'court\');ctPick(\''+k+'\')"><span class="ticon">'+C.icon+'</span><span class="ttext"><b>'+esc(C.name)+'</b><span>'+esc(C.blurb)+'</span></span></button>'; }
      var i=viewInfo(t[0]);
      return '<button type="button" class="tool" onclick="show(\''+t[0]+'\')"><span class="ticon">'+t[1]+'</span><span class="ttext"><b>'+esc(i.t)+'</b><span>'+esc(i.d)+'</span></span></button>';
    }).join('')+'</div></div>';
  }).join('');
}
function nextStep(){
  var c=D.claims||{}, lb=D.meta&&D.meta.lastBackup, days=lb?Math.floor((Date.now()-Date.parse(lb))/864e5):null;
  if(!(D.deadline&&D.deadline.last)) return ['deadline','Work out your filing deadline','180 days from the most recent act. It is the single most common reason a good claim is lost.','Open the deadline calculator'];
  if(!D.events.length) return ['timeline','Start your chronology','Every date, one line each. This becomes your complaint.','Add your first entry'];
  if(!(c.claims&&c.claims.length)) return ['complaint','Work out what you are claiming','Only what you name gets investigated. Four questions on the Complaint page.','Answer the four questions'];
  if(!D.exhibits.length) return ['exhibits','Log your first exhibit','Your files live in Google Drive. The index here is what makes them usable.','Open your evidence'];
  if(!D.stage) return ['stage','Mark where you are in the process','Tap the stage you are at to see what happens there and what to do now.','Where am I?'];
  if(hasWork() && (days===null||days>=7)) return ['backup',(lb?'It has been '+dayWord(days)+' since your last backup':'Back up your work'),'Everything you enter is stored only on this device. Keep a copy somewhere safe.','Back up now'];
  return ['packet','Your case file is taking shape','Put the complaint, chronology, exhibit index and deadlines into one printable packet.','Build the case packet'];
}
function renderHome(){
  if(!$('dash-list')) return;
  var n=nextStep();
  $('nextstep-list').innerHTML='<div class="next"><div class="nk">Your next step</div><div class="nt">'+esc(n[1])+'</div><div class="nd">'+esc(n[2])+'</div>'+
    '<button class="pri" onclick="'+(n[0]==='backup'?'exportAll()':"show('"+n[0]+"')")+'">'+esc(n[3])+' →</button></div>';
  // at a glance
  var last=D.deadline&&D.deadline.last, left=null, due='';
  if(last){ due=addDays(last,180); left=daysBetween(todayISO(),due); }
  var dl= last? (left<0? '<b class="bad">Passed</b><span>180 days ended '+esc(niceDate(due))+'</span>'
      : '<b class="'+(left<=30?'warn':'')+'">'+left+'</b><span>days left to file with the Bureau · '+esc(niceDate(due))+'</span>')
      : '<b class="mut">—</b><span>Set your deadline</span>';
  var tile=function(view,inner,cls){ return '<button type="button" class="gtile'+(cls?' '+cls:'')+'" onclick="show(\''+view+'\')">'+inner+'</button>'; };
  var cnt=function(n,w,empty){ return n? '<b>'+n+'</b><span>'+w+'</span>' : '<b class="mut">0</b><span>'+empty+'</span>'; };
  var idx=-1; for(var i=0;i<STAGES.length;i++) if(STAGES[i][0]===D.stage) idx=i;
  var pct= idx<0?0:Math.round((idx+1)/STAGES.length*100);
  $('glance-list').innerHTML='<div class="gtiles">'+
    tile('deadline',dl,'big1')+
    tile('timeline',cnt(D.events.length,D.events.length===1?'chronology entry':'chronology entries','Add your first entry'))+
    tile('exhibits',cnt(D.exhibits.length,D.exhibits.length===1?'exhibit':'exhibits','Log your evidence'))+
    tile('witnesses',cnt(D.witnesses.length,D.witnesses.length===1?'witness':'witnesses','List who saw it'))+'</div>'+
    '<button type="button" class="gstage" onclick="show(\'stage\')"><div class="gsl"><span>Where you are</span><b>'+
      (idx<0?'Tap to mark your stage':esc(STAGES[idx][1])+' · step '+(idx+1)+' of '+STAGES.length)+'</b></div>'+
      '<div class="gbar"><span style="width:'+pct+'%"></span></div></button>';
  // saved work
  var lb=D.meta&&D.meta.lastBackup, bd=lb?Math.floor((Date.now()-Date.parse(lb))/864e5):null;
  $('savedwork-list').innerHTML='<div class="saved-strip"><div class="sw-t"><b>Your saved work</b><span>'+
    (lb? 'Last backup '+(bd===0?'today':dayWord(bd)+' ago') : 'Not backed up yet')+' · stored only on this device</span></div>'+
    '<div class="sw-b"><button class="pri" onclick="exportAll()">Back up</button><button class="sec" onclick="document.getElementById(\'imp\').click()">Restore</button></div></div>';
  renderHomeDates(); renderInstall();
}


/* ================= install on a phone ================= */
var INSTALL_EVT=null;
window.addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); INSTALL_EVT=e; renderInstall(); });
window.addEventListener('appinstalled',function(){ INSTALL_EVT=null; try{ localStorage.setItem('kc_installed','1'); }catch(e){} renderInstall(); });
function isInstalled(){
  try{ if(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches)) return true; }catch(e){}
  return false;
}
function renderInstall(){
  var box=$('install-list'); if(!box) return;
  if(isInstalled() || !/^https?:$/.test(location.protocol)){ box.innerHTML=''; return; }
  var ios=isIOS();
  box.innerHTML='<div class="installcard"><span class="ticon">📱</span><div class="it"><b>Put it on your phone</b>'+
    '<span>Add the Case Builder to your Home Screen. It opens like an app, works without a connection'+
    (ios?', and Safari stops clearing your saved work.':'.')+'</span></div>'+
    '<button class="pri" onclick="installApp()">Install the app</button></div>';
  var tip=$('iostip'); if(tip) tip.className='';   // this card replaces the older tip
}
function shareIcon(){ return '<svg class="shico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H5v10h14V10h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'; }
function installApp(){
  if(INSTALL_EVT){
    var e=INSTALL_EVT; INSTALL_EVT=null; e.prompt();
    (e.userChoice||Promise.resolve()).then(function(){ renderInstall(); });
    return;
  }
  var ios=isIOS(), html;
  if(ios){
    html='<h3>Add it to your Home Screen</h3><ol class="isteps">'+
      '<li>Tap the <b>Share</b> button '+shareIcon()+'. In Safari it is at the bottom of the screen, or at the top on an iPad.</li>'+
      '<li>Scroll down and tap <b>Add to Home Screen</b>.</li>'+
      '<li>Tap <b>Add</b>. The Case Builder appears on your Home Screen with its own icon.</li></ol>'+
      '<p class="note">Open it from the Home Screen from now on. The Home Screen app keeps its own saved work, apart from Safari. If you have already entered work in Safari, back it up there first, then restore it in the app.</p>';
  } else if(/Android/i.test(navigator.userAgent)){
    html='<h3>Add it to your Home Screen</h3><ol class="isteps">'+
      '<li>Open this page in <b>Chrome</b>.</li><li>Tap the <b>⋮</b> menu at the top right.</li>'+
      '<li>Tap <b>Install app</b> or <b>Add to Home screen</b>, then <b>Install</b>.</li></ol>';
  } else {
    html='<h3>Install it on this computer</h3><ol class="isteps">'+
      '<li>In <b>Chrome</b> or <b>Edge</b>, click the install icon at the right of the address bar, then <b>Install</b>.</li>'+
      '<li>In <b>Safari</b> on a Mac, choose <b>File</b>, then <b>Add to Dock</b>.</li></ol>'+
      '<p class="note">On a phone, open kickasscase.netlify.app and tap Install the app there.</p>';
  }
  dlgOpen(html+'<div class="row"><button class="pri" onclick="dlgClose()">Done</button></div>');
}

/* ================= search your own entries ================= */
function dataHits(q){
  var terms=q.toLowerCase().split(/\s+/).filter(function(x){return x.length>1;}); if(!terms.length) return [];
  var out=[], hit=function(view,page,sec,text,id){
    var tl=text.toLowerCase(); for(var k=0;k<terms.length;k++) if(tl.indexOf(terms[k])<0) return;
    out.push({v:view,page:page,sec:sec,t:text,head:false,dataId:id});
  };
  D.events.forEach(function(e){ hit('timeline','Your chronology',niceDate(e.d),[e.w,e.who,e.doc,eventTags(e).join(' ')].filter(Boolean).join(' \u00b7 '),e.id); });
  D.exhibits.forEach(function(e,i){ hit('exhibits','Your evidence','Exhibit '+(i+1),[e.w,e.p,e.f,e.l].filter(Boolean).join(' \u00b7 '),e.id); });
  D.witnesses.forEach(function(w){ hit('witnesses','Your witnesses',w.s||'',[w.n,w.r,w.k,w.o].filter(Boolean).join(' \u00b7 '),w.id); });
  D.docs.forEach(function(e){ hit('docs','Your correspondence',e.d?niceDate(e.d):'',[e.w,e.f,e.a,e.k].filter(Boolean).join(' \u00b7 '),e.id); });
  (D.rebuttal&&D.rebuttal.points||[]).forEach(function(p,i){ hit('rebuttal','Your rebuttal','Their point '+(i+1),[p.t,p.a].filter(Boolean).join(' \u00b7 '),p.id); });
  return out;
}

/* ================= page furniture added at start-up ================= */
function injectAfter(ref,html){ var t=document.createElement('div'); t.innerHTML=html; var n=t.firstElementChild; ref.parentNode.insertBefore(n,ref.nextSibling); return n; }
function addView(id,title,sub,body){
  var s=document.createElement('section'); s.className='view'; s.id='v-'+id;
  s.innerHTML='<h2>'+title+'</h2><p class="sub2">'+sub+'</p>'+body;
  var terms=$('v-terms'); terms.parentNode.insertBefore(s,terms);
}
function addMenuLink(afterView,view,label,icon,moreAfter){
  var after=function(root,sel,v){ var bs=root.querySelectorAll(sel), r=null;
    for(var i=0;i<bs.length;i++){ if((bs[i].getAttribute('onclick')||'').indexOf("show('"+v+"')")>-1) r=bs[i]; } return r; };
  var drop=$('drop'), ref=after(drop,'.dlink',afterView);
  var b=document.createElement('button'); b.className='dlink'; b.textContent=label; b.setAttribute('onclick',"show('"+view+"')");
  if(ref) ref.parentNode.insertBefore(b,ref.nextSibling);
  var ms=$('moresheet'), close=ms.querySelector('.moreclose'), mref=after(ms,'.morelink',moreAfter||afterView);
  var m=document.createElement('button'); m.className='morelink'; m.setAttribute('onclick',"show('"+view+"')");
  m.innerHTML='<span class="mi">'+icon+'</span>'+label;
  if(mref) mref.parentNode.insertBefore(m,mref.nextSibling); else ms.insertBefore(m,close);
}
function buildFurniture(){
  // chronology: links and tags under the form, view switch above the list
  var doc=$('ev-doc'); if(doc) injectAfter(doc,'<div id="evlinks-list" class="evlinks"></div>');
  var evl=$('ev-list'); if(evl){ var bar=document.createElement('div'); bar.id='evbar-list'; bar.className='evbar'; evl.parentNode.insertBefore(bar,evl); }
  // complaint: say plainly this page is the Bureau route, and point to the others
  var cth=document.querySelector('#v-complaint .toolhead');
  if(cth){ var sn=document.createElement('div'); sn.className='card ctool scopenote';
    sn.innerHTML='<p class="snl"><b>This page is for a discrimination complaint to the Montana Human Rights Bureau.</b></p>'+
      '<p>The Bureau handles unfair treatment because of a protected ground, such as sex, race, age, disability or religion, and retaliation for complaining about it.</p>'+
      '<p class="snq">Something else? Court filings drafts these:</p><div class="snlinks">'+
      [['records','Public records'],['meetings','Open meeting'],['wdea','Wrongful discharge'],['small','Small claims']].map(function(x){
        return '<button type="button" class="lchip" onclick="show(\'court\');ctPick(\''+x[0]+'\')">'+x[1]+' \u2192</button>'; }).join('')+'</div>';
    cth.parentNode.insertBefore(sn,cth); }
  // complaint: claim wizard before the form, length meter under the particulars
  var tool=document.querySelector('#v-complaint .toolhead');
  if(tool) injectAfter(tool,'<div class="card cw"><h3 style="margin-top:0">Work out what you are claiming</h3>'+
    '<p class="note">Four questions. Your answers fill in the grounds and the area below, and add one closing paragraph that names each claim.</p><div id="cw-list"></div></div>');
  var facts=$('cp-facts'); if(facts){ injectAfter(facts,'<div id="cpmeter-list"></div>'); facts.addEventListener('input',updateMeter); }
  // rebuttal workspace, after the opening card
  var rbFirst=document.querySelector('#v-rebuttal .card');
  if(rbFirst) injectAfter(rbFirst,'<div class="card rbw"><h3 style="margin-top:0">Work through their position statement</h3>'+
    '<p class="note">Paste their statement. It is split into points so you can mark each one, answer it, and attach exhibits. Nothing leaves this device.</p>'+
    '<label class="fl" for="rb-date">Date of their position statement</label><input type="date" id="rb-date" onchange="rbState().date=this.value;save()">'+
    '<label class="fl" for="rb-text">Their statement</label><textarea id="rb-text" style="min-height:140px" placeholder="Paste the whole position statement here."></textarea>'+
    '<div class="row"><button class="pri" onclick="rbSplit()">Split into points</button></div>'+
    '<div id="rb-list"></div>'+
    '<div class="row"><button class="pri" onclick="rbDraft()">Build my rebuttal draft</button></div>'+
    '<div id="rb-outwrap" style="display:none"><label class="fl" for="rb-out">Your draft &mdash; rewrite it in your own words</label>'+
    '<textarea id="rb-out" style="min-height:260px"></textarea><div class="row"><button class="sec" onclick="copyOut(\'rb-out\')">Copy</button>'+
    '<button class="sec" onclick="rbPrint()">Print</button></div></div><div id="rb-print" class="printout" style="display:none"></div></div>');
  // deadlines view
  addView('dates','Your deadlines','Every date in your case, in one place, with a reminder a week before and a day before when you add it to your calendar.',
    '<div class="card"><label class="fl" for="dt-filed">Date your complaint was filed</label><input type="date" id="dt-filed" onchange="setDateField(\'filed\',this.value)">'+
    '<label class="rbchk"><input type="checkbox" id="dt-housing" onchange="setDateField(\'housing\',this.checked)"><span>This is a housing case (the investigation runs 120 days, not 180)</span></label>'+
    '<label class="fl" for="dt-dismiss">Date on a dismissal letter, if you got one</label><input type="date" id="dt-dismiss" onchange="setDateField(\'dismiss\',this.value)">'+
    '<p class="note">Your filing deadline comes from the Deadline calculator. Every chronology entry tagged Retaliation gets its own 180 days. Due dates from Correspondence appear here too.</p></div>'+
    '<div id="dates-list"></div><div class="row" id="dt-all"><button class="pri" onclick="icsAll()">Add all upcoming dates to my calendar</button></div>');
  // case packet view
  addView('packet','Case packet','Everything in one printable file, numbered, with a contents page.',
    '<div class="card"><h3 style="margin-top:0">What to include</h3><div id="pk-list"></div>'+
    '<div class="row"><button class="pri" onclick="buildPacket()">Build the case packet</button></div></div>'+
    '<div id="pk-print" class="printout" style="display:none"></div>');
  buildHome();
  addMenuLink('deadline','dates','Your deadlines','\u29d7','docs');
  addMenuLink('court','packet','Case packet','\u2398');
}


/* ================= page layout: tools first, reading folded below =================
   Rearranges each page without changing a word: the page title gets a header,
   the working tools come first, and reading cards fold into expandable panels. */
var PAGE_ICONS={deadline:'◷',timeline:'☰',exhibits:'▣',witnesses:'✎',docs:'✉',records:'▤',complaint:'☑',
  stage:'◴',rebuttal:'⇄',damages:'¤',mediation:'⚖',nocause:'⚠',ai:'⌘',care:'❦',checklist:'✓',
  howto:'ⓘ',court:'▧',dates:'⧗',packet:'⎘',terms:'©',learn:'§'};
function wordsIn(el){ return (el.textContent||'').trim().split(/\s+/).filter(Boolean).length; }
function cardToPanel(card){
  var h=card.querySelector(':scope > h3, :scope > h4'), title='';
  if(h){ title=h.textContent.trim(); h.remove(); }
  else { var b=card.querySelector('b,strong'); var bt=b? b.textContent.trim() : '';
    title= bt && bt.length<=90 ? bt : 'Read this first'; }
  var d=document.createElement('details'); d.className='learn fromcard';
  var su=document.createElement('summary'); su.textContent=title; d.appendChild(su);
  var lb=document.createElement('div'); lb.className='lb';
  while(card.firstChild) lb.appendChild(card.firstChild);
  d.appendChild(lb); return d;
}
function layoutPage(v){
  var id=v.id.slice(2), h2=v.querySelector(':scope > h2'), sub=v.querySelector(':scope > p.sub2');
  if(!h2 || v.dataset.laid) return; v.dataset.laid='1';
  var head=document.createElement('div'); head.className='phead';
  head.innerHTML='<span class="picon" aria-hidden="true">'+(PAGE_ICONS[id]||'◆')+'</span><div class="ptext"></div>';
  v.insertBefore(head,h2); head.querySelector('.ptext').appendChild(h2); if(sub) head.querySelector('.ptext').appendChild(sub);
  if(id==='learn') return;   // the full guide is already a list of sections
  var kids=[].slice.call(v.children).filter(function(c){ return c!==head; });
  var primary=[], secondary=[], intro=[], read=[], foot=[], last=null;
  kids.forEach(function(c){
    var isList=/(-list|-print|-sheet|-form)$/.test(c.id||'') || c.classList.contains('printout') || c.classList.contains('stages') ||
               c.classList.contains('toolhead') || c.classList.contains('evbar') || c.classList.contains('srchwrap') || c.id==='dt-all' || c.id==='cp-outwrap' || c.id==='rq-outwrap';
    if(c.classList.contains('pagefoot')){ foot.push(c); return; }
    if(c.classList.contains('printout') && last){ last.push(c); return; }   // a printout stays with the tool that makes it
    if(isList || c.tagName==='H3' || c.classList.contains('cw') || c.classList.contains('rbw') || c.classList.contains('ctool') || c.querySelector('input,textarea,select')){ primary.push(c); last=primary; return; }
    if(c.tagName==='DETAILS'){ read.push(c); last=null; return; }
    if(c.classList.contains('card')){
      var w=wordsIn(c), hasPri=!!c.querySelector('button.pri'), hasBtn=!!c.querySelector('button');
      if(hasPri && w<=60){ primary.push(c); last=primary; return; }
      if(hasPri){ secondary.push(c); last=secondary; return; }
      if(hasBtn && w<=60){ primary.push(c); last=primary; return; }
      if(!c.querySelector(':scope > h3, :scope > h4') && w<=60){ intro.push(c); last=null; return; }
      read.push(cardToPanel(c)); c.remove(); last=null; return;
    }
    primary.push(c); last=primary;
  });
  // a page made only of reading keeps its first card open
  if(!primary.length && !secondary.length && read.length && read[0].classList.contains('fromcard')) read[0].open=true;
  var frag=document.createDocumentFragment();
  intro.forEach(function(c){ c.classList.add('pintro'); frag.appendChild(c); });
  primary.forEach(function(c){ frag.appendChild(c); });
  if(secondary.length){ var sh=document.createElement('div'); sh.className='dhead pzone'; sh.innerHTML='<h3>Printable sheets</h3>';
    if(secondary.some(function(c){ return !/print/i.test(c.textContent); })) sh.innerHTML='<h3>More tools</h3>';
    frag.appendChild(sh); secondary.forEach(function(c){ frag.appendChild(c); }); }
  if(read.length){ var rh=document.createElement('div'); rh.className='dhead pzone';
    rh.innerHTML='<h3>'+(primary.length||secondary.length?'Learn more':'Read')+'</h3>'; frag.appendChild(rh);
    var acc=document.createElement('div'); acc.className='accordion'; read.forEach(function(c){ acc.appendChild(c); }); frag.appendChild(acc); }
  foot.forEach(function(c){ frag.appendChild(c); });
  v.appendChild(frag);
}
function layoutAllPages(){ document.querySelectorAll('section.view').forEach(function(v){ if(v.id!=='v-home') layoutPage(v); }); }

/* ================= start-up ================= */
function initFeatures(){
  if(ensureIds()) save();
  window.iosTip=function(){ renderInstall(); };   // the install card replaces the older tip
  if(window.initCourt) initCourt();
  buildFurniture();
  layoutAllPages();
  // show() also refreshes the new pages
  var _show=show;
  window.show=function(id){ _show(id);
    if(id==='dates') renderDates();
    if(id==='complaint'){ renderClaimWizard(); updateMeter(); }
    if(id==='rebuttal') renderRebuttal();
    if(id==='packet') renderPacket();
    if(id==='home') renderHome();
  };
  // search: your own entries first, then the guide
  var _search=searchApp;
  window.searchApp=function(q){ return dataHits(q).concat(_search(q)); };
  var _go=goHit;
  window.goHit=function(id,i){
    var r=(SRES[id]||[])[i]; if(!r||!r.dataId) return _go(id,i);
    var inp=$(id); if(inp){ inp.value=''; var b=inp.parentNode.querySelector('.srchres'); b.className='srchres'; b.innerHTML=''; inp.blur(); }
    goItem(r.v,r.dataId);
  };
  // a restored backup or a deleted record can leave the edit forms pointing nowhere
  var _calc=calcDeadline; window.calcDeadline=function(){ _calc(); renderHomeDates(); };
  renderClaimWizard(); updateMeter(); renderRebuttal(); renderPacket(); renderDates(); renderHome();
}
