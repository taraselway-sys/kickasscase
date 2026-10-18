var DB_KEY='psp_casefile_v1';
function blankD(){ return {deadline:{},events:[],exhibits:[],requests:[],witnesses:[],docs:[],complaint:{},draft:{},care:{},damages:{},mediation:{},checks:{}}; }
var D=blankD(), lsData=null;
try{var raw=localStorage.getItem(DB_KEY); if(raw){ lsData=JSON.parse(raw); D=Object.assign(D,lsData); }}catch(e){}

/* ---- storage ----
   IndexedDB is the main store: it holds far more than localStorage and is the store
   browsers keep for installed apps. localStorage keeps a second copy while it fits.
   Every save stamps meta.savedAt, and on start-up the newer of the two copies wins. */
var IDB=null, idbChain=Promise.resolve(true), lsOk=true;
function idbOpen(){
  return new Promise(function(res){
    try{
      if(!window.indexedDB) return res(null);
      var rq=indexedDB.open('kickasscase',1);
      rq.onupgradeneeded=function(){ try{ rq.result.createObjectStore('kv'); }catch(e){} };
      rq.onsuccess=function(){ res(rq.result); };
      rq.onerror=function(){ res(null); }; rq.onblocked=function(){ res(null); };
    }catch(e){ res(null); }
  });
}
function idbDo(mode, fn){
  return new Promise(function(res){
    if(!IDB) return res(null);
    try{
      var tx=IDB.transaction('kv',mode), st=tx.objectStore('kv'), out=null, rq=fn(st);
      if(rq) rq.onsuccess=function(){ out=rq.result; };
      tx.oncomplete=function(){ res(mode==='readonly'?out:true); };
      tx.onerror=tx.onabort=function(){ res(mode==='readonly'?null:false); };
    }catch(e){ res(mode==='readonly'?null:false); }
  });
}
function idbGet(){ return idbDo('readonly',function(st){ return st.get(DB_KEY); }); }
function idbPut(text){ return idbDo('readwrite',function(st){ return st.put(text,DB_KEY); }); }
function idbClear(){ return idbDo('readwrite',function(st){ return st.delete(DB_KEY); }); }
function save(){
  D.meta=D.meta||{}; D.meta.savedAt=new Date().toISOString();
  var text=JSON.stringify(D);
  try{ localStorage.setItem(DB_KEY, text); lsOk=true; }catch(e){ lsOk=false; }
  if(IDB){
    idbChain=idbChain.then(function(){ return idbPut(text); }).then(function(ok){
      if(!ok && !lsOk) saveFailed(); else if(noticeKind==='full') hideNotice();
      return ok||lsOk;
    });
  } else if(!lsOk){ saveFailed(); return false; }
  if(lsOk && noticeKind==='full') hideNotice();
  flash(); return true;
}
/* resolves once every pending save has reached IndexedDB */
function saved(){ return idbChain; }
var ft; function flash(){ var s=document.querySelectorAll('.saved');
  for(var i=0;i<s.length;i++) s[i].classList.add('on');
  clearTimeout(ft); ft=setTimeout(function(){ for(var i=0;i<s.length;i++) s[i].classList.remove('on'); },1400); }
function $(id){ return document.getElementById(id); }
function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

/* ---- view switching ---- */
function show(id){
  var vs=document.querySelectorAll('.view');
  for(var i=0;i<vs.length;i++) vs[i].classList.toggle('on', vs[i].id==='v-'+id);
  var bs=document.querySelectorAll('nav button');
  var inBar=false;
  for(var j=0;j<bs.length;j++){ var on=bs[j].dataset.go===id; bs[j].classList.toggle('on', on); if(on) inBar=true; }
  var mb=$('morebtn'); if(mb) mb.classList.toggle('on', !inBar);
  closeMenu(); closeMore();
  try{ window.scrollTo(0,0); }catch(e){ window.scrollTo(0,0); }
  if(id==='deadline') calcDeadline();
  if(id==='timeline') renderEvents();
  if(id==='exhibits') renderExhibits();
  if(id==='records') renderRequests();
  if(id==='witnesses') renderWitnesses();
  if(id==='docs') renderDocs();
  if(id==='checklist') renderChecks();
  if(id==='stage') renderStage();
  if(id==='care') renderCare();
  if(id==='damages') renderDamages();
  if(id==='mediation') renderMed();
}
function openMenu(){ $('drop').classList.add('on'); $('scrim').classList.add('on'); }
function closeMenu(){ $('drop').classList.remove('on'); $('scrim').classList.remove('on'); }
function openMore(){ $('moresheet').classList.add('on'); $('morescrim').classList.add('on'); }
function closeMore(){ $('moresheet').classList.remove('on'); $('morescrim').classList.remove('on'); }

/* ---- deadline ---- */
function calcDeadline(){
  var v=$('dl-date').value; D.deadline.last=v; 
  var box=$('dl-out');
  if(!v){ box.className='big'; box.innerHTML='<b>&mdash;</b><span>Enter the most recent act to see your deadline</span>'; return; }
  var d=new Date(v+'T00:00:00'); var due=new Date(d.getTime()+180*86400000);
  var today=new Date(); today.setHours(0,0,0,0);
  var left=Math.round((due-today)/86400000);
  var ds=due.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  var cls = left<0 ? 'big bad' : (left<=30 ? 'big warn' : 'big');
  var head = left<0 ? 'Past' : (left+(left===1?' day':' days'));
  var msg = left<0 ? ('Your 180 days ended on '+ds+'. Call the Bureau anyway &mdash; the clock can run from when you <i>discovered</i> the act, and extensions exist in limited circumstances.')
          : ('left to file &middot; your deadline is '+ds);
  box.className=cls;
  box.innerHTML='<b>'+head+'</b><span>'+msg+'</span>';
  save();
}
/* ---- chronology ---- */
/* ---- delivering files: iOS Safari ignores the download attribute, so open a tab instead ---- */
function isIOS(){ return /iP(hone|ad|od)/.test(navigator.userAgent) ||
  (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); }
function deliverHTML(html, filename){
  var w=null;
  try{ w=window.open('','_blank'); }catch(e){}
  if(w && w.document){
    w.document.open(); w.document.write(html); w.document.close();
    try{ w.document.title=filename.replace(/\.html$/,''); }catch(e){}
    return true;
  }
  // fall back to a download
  try{
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
    a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    return true;
  }catch(e){ return false; }
}
function deliverText(text, filename, label){
  if(isIOS()){ showTextFallback(text, label); return; }
  try{
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));
    a.download=filename; document.body.appendChild(a); a.click(); a.remove();
  }catch(e){ showTextFallback(text, label); }
}
function showTextFallback(text, label){
  var box=$('fallback');
  box.innerHTML='<div class="gboxh">'+esc(label)+'</div>'+
    '<p class="note">Your browser cannot download files directly. Select all the text below, copy it, and paste it '+
    'into a note or a spreadsheet.</p>'+
    '<textarea id="fb-text" style="min-height:220px"></textarea>'+
    '<div class="row"><button class="pri" onclick="copyOut(\'fb-text\')">Copy all</button>'+
    '<button class="sec" onclick="document.getElementById(\'fallback\').style.display=\'none\'">Close</button></div>';
  $('fb-text').value=text;
  box.style.display='block';
  box.scrollIntoView({block:'center'});
}

/* ---- exhibits ---- */
var pendingThumb=null;
function pickThumb(ev){
  var f=ev.target.files[0]; if(!f) return;
  if(!/^image\//.test(f.type)){ alert('That is not an image. A thumbnail is optional \u2014 you can leave it blank.'); ev.target.value=''; return; }
  var r=new FileReader();
  r.onload=function(){
    var img=new Image();
    img.onload=function(){
      var max=260, w=img.width, h=img.height;
      if(w>h){ if(w>max){ h=Math.round(h*max/w); w=max; } } else { if(h>max){ w=Math.round(w*max/h); h=max; } }
      var c=document.createElement('canvas'); c.width=w; c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      pendingThumb=c.toDataURL('image/jpeg',0.6);
      $('ex-thumbprev').innerHTML='<img src="'+pendingThumb+'" alt="preview"><button class="sec" style="padding:7px 11px;font-size:12.5px;margin-left:10px" onclick="clearThumb()">Remove</button>';
      if(!$('ex-file').value) $('ex-file').value=f.name;
    };
    img.src=r.result;
  };
  r.readAsDataURL(f);
}
function clearThumb(){ pendingThumb=null; $('ex-thumbprev').innerHTML=''; $('ex-img').value=''; }

/* the page's own styles as text, for printouts built in a separate frame or window */
function pageCSS(){
  var out=[];
  for(var i=0;i<document.styleSheets.length;i++){
    try{ var r=document.styleSheets[i].cssRules; for(var j=0;j<r.length;j++) out.push(r[j].cssText); }catch(e){}
  }
  return out.join('\n');
}
/* ---- printing: hidden iframe with a real size. A 0x0 iframe prints blank. ---- */
function printContent(html){
  var css=''; try{ css=pageCSS(); }catch(e){}
  var ifr=document.createElement('iframe');
  ifr.setAttribute('aria-hidden','true');
  ifr.style.cssText='position:fixed;left:-10000px;top:0;width:820px;height:1120px;border:0;background:#fff';
  document.body.appendChild(ifr);
  var done=false;
  var cleanup=function(){ if(done)return; done=true; try{ifr.remove();}catch(e){} };
  var go=function(){
    try{
      var w=ifr.contentWindow;
      w.onafterprint=function(){ setTimeout(cleanup,400); };
      w.focus(); w.print();
    }catch(e){ alert('Printing is blocked here. The document is on the page below \u2014 select the text and copy it instead.'); cleanup(); }
  };
  try{
    var d=ifr.contentWindow.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8">'+
      '<meta name="viewport" content="width=device-width,initial-scale=1">'+
      '<style>'+css+'</style></head><body class="printframe">'+html+'</body></html>');
    d.close();
    setTimeout(go, 320);
  }catch(e){ alert('Printing is blocked here. The document is on the page below.'); cleanup(); }
  setTimeout(cleanup, 60000);
}

/* ---- tap diagnostic: reports what actually happens, step by step ---- */
var TAPS=0;
function tapDiag(){
  TAPS++;
  var box=$('tapcheck'); if(!box) return;
  var lines=['TAP REGISTERED ('+TAPS+')'];
  try{ lines.push('printComplaintForm: '+(typeof printComplaintForm)); }catch(e){ lines.push('printComplaintForm: ERROR'); }
  try{ lines.push('output area found: '+(!!document.getElementById('cp-print'))); }catch(e){}
  try{ lines.push('window.print: '+(typeof window.print)); }catch(e){}
  box.innerHTML=lines.join('<br>');
  box.style.display='block';
  setTimeout(function(){
    var d=document.getElementById('cp-print');
    if(d){ var r=d.getBoundingClientRect();
      box.innerHTML = lines.join('<br>') + '<br>form built: ' + (d.innerHTML.length>100) +
        '<br>form height: ' + Math.round(r.height) + 'px' +
        '<br>display: ' + getComputedStyle(d).display;
    }
  }, 600);
}

/* ---- the complaint, laid into the Bureau's charge form ---- */
var GROUNDS=['Race','Color','National origin','Religion / creed','Sex','Pregnancy / maternity','Age',
 'Physical or mental disability','Marital status','Political belief (government)','Vaccination status','Retaliation'];
function printComplaintForm(){
  try{ _printComplaintForm(); }
  catch(err){
    alert('The charge form could not be built.\n\n'+(err&&err.message?err.message:err)+
          '\n\nThe plain text version is on the page below instead.');
    try{ buildComplaint(); }catch(e){}
  }
}
function _printComplaintForm(asHtml){
  // read what is on screen right now, not what was last saved
  var f={}, ids=['cp-name','cp-addr','cp-phone','cp-email','cp-resp','cp-respaddr','cp-respphone',
    'cp-area','cp-grounds','cp-first','cp-last','cp-facts','cp-want'];
  for(var k=0;k<ids.length;k++){
    var el=$(ids[k]);
    f[ids[k]] = el ? el.value.trim() : ((D.complaint||{})[ids[k]]||'');
  }
  D.complaint=f; try{ save(); }catch(e){}
  if(!f['cp-name'] && !f['cp-resp'] && !f['cp-grounds'] && !D.events.length){
    if(!asHtml){ alert('Fill in at least your name or the respondent first, then try again.'); return; } }
  // build the plain text first, so there is always a readable version on the page
  try{ buildComplaint(); }catch(e){}
  var picked=(f['cp-grounds']||'').toLowerCase();
  var gh='', any=false;
  for(var i=0;i<GROUNDS.length;i++){
    var g=GROUNDS[i], key=g.split(' ')[0].toLowerCase().replace('/','');
    var on = picked.indexOf(key)!==-1 || (key==='religion'&&picked.indexOf('creed')!==-1) ||
             (key==='physical'&&picked.indexOf('disab')!==-1) || (key==='political'&&picked.indexOf('polit')!==-1) ||
             (key==='pregnancy'&&picked.indexOf('matern')!==-1);
    if(on){ any=true; gh+='<div class="fchk"><span class="bx on">\u2715</span>'+esc(g)+'</div>'; }
  }
  // anything typed that is not on the standard list still appears
  if(!any){
    gh = f['cp-grounds'] ? '<div class="fchk"><span class="bx on">\u2715</span>'+esc(f['cp-grounds'])+'</div>'
       : '<div class="cval"><span class="blank">[name every ground that applies]</span></div>';
  }
  // the particulars: lettered paragraphs, A. B. C., the way the Bureau sets them out
  var paras=[];
  if(f['cp-facts']){
    var raw=f['cp-facts'].replace(/\r/g,'').split(/\n\s*\n|\n(?=\s*[A-Za-z0-9]{1,2}[.)]\s)/);
    for(var q=0;q<raw.length;q++){ var t=raw[q].replace(/\s*\n\s*/g,' ').trim();
      if(t) paras.push(t.replace(/^\s*[A-Za-z0-9]{1,2}[.)]\s+/,'')); }
  } else if(D.events.length){
    paras=D.events.map(function(e){ return 'On '+niceDate(e.d)+', '+e.w+(e.who?' Present: '+e.who+'.':''); });
  }
  paras=withClaims(paras);
  var letters=function(n){ var s=''; n++; while(n>0){ var m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26);} return s; };
  var body = paras.length ? '<ol class="hp">'+paras.map(function(p,i){
      return '<li><span class="hl">'+letters(i)+'.</span><span class="ht">'+esc(p)+'</span></li>'; }).join('')+'</ol>'
    : '<div class="hblank">[Lettered paragraphs &mdash; one fact each, in date order]</div>';
  var v=function(x,ph){ return x? esc(x) : '<span class="hblank">'+ph+'</span>'; };
  var lines=function(x){ return esc(x).replace(/,\s*([^,]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)\s*$/,'<br>$1'); };
  // the opening sentence of the particulars, worded as the Bureau words it
  var gr=(f['cp-grounds']||'').trim(), grl=gr.toLowerCase();
  var ret=/retaliat/.test(grl);
  var other=gr.replace(/,?\s*(and\s+)?retaliation/ig,'').replace(/^\s*,|,\s*$/g,'').trim();
  var how = other && ret ? 'discriminated against on the basis of '+esc(other)+' and retaliated against for engaging in protected activity'
          : ret ? 'retaliated against for engaging in protected activity'
          : other ? 'discriminated against on the basis of '+esc(other)
          : 'discriminated against on the basis of <span class="hblank">[ground]</span>';
  var area=f['cp-area']||'employment';
  var gov=/government/i.test(area) || /\b(city|county|state|district|department|school|town|board)\b/i.test(f['cp-resp']||'');
  var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var nice=function(x){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(x||''); return m? MON[+m[2]-1]+' '+(+m[3])+', '+m[1] : (x||''); };
  var basis = gh.replace(/class="fchk"/g,'class="hchk"').replace(/<span class="bx on">\u2715<\/span>/g,'<span class="hbx">\u2612</span>');
  var html =
  '<div class="hrbform">'+
   '<table class="hgrid">'+
    '<tr><td class="hc1 htitle">CHARGE OF DISCRIMINATION</td>'+
        '<td class="hc2"><div class="hnum">CHARGE NUMBER</div><div class="hval">HRB#</div></td></tr>'+
    '<tr><td colspan="2" class="hfiled">FILED BEFORE: MONTANA DEPARTMENT OF LABOR &amp; INDUSTRY, HUMAN RIGHTS BUREAU</td></tr>'+
    '<tr><td class="hc1"><div class="hlab">CHARGING PARTY\u2019S NAME &amp; ADDRESS</div>'+
        '<div class="hval">'+v(f['cp-name'],'[your full name]')+'<br>'+(f['cp-addr']?lines(f['cp-addr']):'<span class="hblank">[mailing address]</span>')+'</div></td>'+
        '<td class="hc2"><div class="hlab">TELEPHONE/EMAIL</div><div class="hval">'+v(f['cp-phone'],'[telephone]')+(f['cp-email']?'<br>'+esc(f['cp-email']):'')+'</div></td></tr>'+
    '<tr><td class="hc1"><div class="hlab">RESPONDENT\u2019S NAME &amp; ADDRESS</div>'+
        '<div class="hval">'+v(f['cp-resp'],'[legal name of the entity]')+'<br>'+(f['cp-respaddr']?lines(f['cp-respaddr']):'<span class="hblank">[address]</span>')+'</div></td>'+
        '<td class="hc2"><div class="hlab">TELEPHONE</div><div class="hval">'+(f['cp-respphone']?esc(f['cp-respphone']):'')+'</div></td></tr>'+
   '</table>'+
   '<table class="hgrid hbasis"><tr>'+
    '<td class="hb1"><div class="hlab">BASIS OF DISCRIMINATION</div><div class="hval">'+basis+'</div></td>'+
    '<td class="hb2"><div class="hlab">DATE OF DISCRIMINATION</div>'+
      '<div class="hval">Earliest: '+esc(nice(f['cp-first']))+'</div>'+
      '<div class="hval" style="margin-top:8pt">Latest: '+esc(nice(f['cp-last']))+'</div></td>'+
   '</tr></table>'+
   '<div class="hbody">'+
   '<div class="hsec">PARTICULARS OF THE CHARGE</div>'+
   '<p class="hintro">I believe I have been '+how+' in the area of '+esc(area)+
     ' in violation of the Montana Human Rights Act (MHRA)'+(gov?', and the Governmental Code of Fair Practices (GCFP),':',')+
     ' for the following reasons:</p>'+
   body+
   '<div class="hsec hver">VERIFICATION</div>'+
   '<ul class="hvl">'+
    '<li>I hereby file this charge with the above-cited agency.</li>'+
    '<li>I agree to inform the agency if I change my address or telephone number and I agree to cooperate fully in the processing of my charge in accordance with its procedures.</li>'+
    '<li>I swear or affirm that I have read the above charge and I declare under penalty of perjury that the foregoing is true and correct.</li>'+
   '</ul>'+
   '<div class="hsig"><span>Signature: <span class="hline"></span></span><span>Date: <span class="hline short"></span></span></div>'+
   '</div><div class="hrev">Revised 8/2020</div>'+
  '</div>';
  if(asHtml) return html;
  $('cp-print').innerHTML=
    '<div class="pvbar noprint">'+
      '<button class="pri" onclick="reprint(\'cp-print\')">Print again</button>'+
      '<button class="sec" onclick="closePrint(\'cp-print\')">Close</button></div>'+
    '<div class="pvhint noprint">This is a replica of the Bureau\u2019s charge form with your details in it. '+
    'Check every box before you sign \u2014 you are signing under penalty of perjury. '+
    'The Bureau\u2019s limit for a self-drafted complaint is two pages.</div>'+
    html;
  showPrintView('cp-print');
}

/* ---- blank incident sheet: printed, filled in by hand, then photographed into the evidence folder ---- */
function printIncidentSheet(){
  var line='<div class="jrule"></div>';
  function box(lab, lines, hint){
    return '<div class="isec"><div class="ilab">'+lab+
      (hint?'<span class="ihint">'+hint+'</span>':'')+'</div>'+
      new Array(lines+1).join(line)+'</div>';
  }
  function fields(arr){
    return '<div class="irow">'+arr.map(function(f){
      return '<div class="ifield"><div class="ilab">'+f+'</div><div class="jrule"></div></div>';}).join('')+'</div>';
  }
  var html='<div class="pvdoc jpage">'+
   '<div class="ihead"><h1>Incident record</h1>'+
   '<div class="ino">Sheet no. ________</div></div>'+
   '<p class="pvsub">Fill this in by hand on the day. Date it. Keep the paper.</p>'+

   fields(['Date of the incident','Time','Date I am writing this'])+
   fields(['Where it happened','Who else was present'])+

   box('What happened, in my own words',12,
       'Facts first. What was said or done, by whom, in what order. Keep feelings in their own paragraph at the end.')+

   box('Exact words, if I can recall them',3,'Put quotation marks only around words you are sure of.')+

   '<div class="isec"><div class="ilab">Witnesses<span class="ihint">Who saw or heard it, and how to reach them</span></div>'+
   '<table class="igrid"><thead><tr><th>Name</th><th>What they saw or heard</th><th>Contact</th><th>Spoken to?</th></tr></thead>'+
   '<tbody>'+new Array(5).join('<tr><td></td><td></td><td></td><td></td></tr>')+'</tbody></table></div>'+

   '<div class="isec"><div class="ilab">Evidence that may exist<span class="ihint">What record would have been created by this? Tick what to go and find</span></div>'+
   '<div class="ichecks">'+
   ['Email or text about it','Minutes or agenda','Schedule, roster or sign-in sheet',
    'Security or body camera footage','Photographs or screenshots','Audio or voicemail',
    'Training or personnel record','A report someone else filed','Social media post',
    'A document I was shown but not given'].map(function(x){
      return '<div class="ichk"><span class="ibox"></span>'+x+'</div>';}).join('')+
   '</div>'+
   '<div class="ilab" style="margin-top:10px">Who holds it, and how I ask for it</div>'+line+line+'</div>'+

   box('What I did about it',3,'Reported to whom, when, in writing or verbally. What they said back.')+
   box('How this affected me',3,'Work, sleep, health, money. Written now, not reconstructed later.')+

   '<div class="isign"><div>Signed ' + new Array(32).join('&nbsp;') + '_______________________</div>'+
   '<div>Date ' + new Array(36).join('&nbsp;') + '_______________________</div></div>'+
   '<div class="jfoot">Written by hand on the day, signed and dated. Photograph it into your evidence folder '+
   'and keep the paper original.</div></div>';

  $('ev-sheet').innerHTML='<div class="pvbar noprint">'+
    '<button class="pri" onclick="reprint(\'ev-sheet\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'ev-sheet\')">Close</button></div>'+html;
  showPrintView('ev-sheet');
}

/* ---- blank witness statement: printed, handwritten, signed, scanned back in ---- */
function printWitnessForm(){
  var line='<div class="jrule"></div>';
  function box(lab, lines, hint){
    return '<div class="isec"><div class="ilab">'+lab+(hint?'<span class="ihint">'+hint+'</span>':'')+'</div>'+
      new Array(lines+1).join(line)+'</div>';
  }
  function fields(arr){
    return '<div class="irow">'+arr.map(function(f){
      return '<div class="ifield"><div class="ilab">'+f+'</div><div class="jrule"></div></div>';}).join('')+'</div>';
  }
  var html='<div class="pvdoc jpage">'+
   '<div class="ihead"><h1>Witness statement</h1><div class="ino">Page ____ of ____</div></div>'+
   '<p class="pvsub">To be completed in the witness\u2019s own handwriting, in their own words.</p>'+
   fields(['Full name','Date of this statement'])+
   fields(['Telephone','Email'])+
   box('My relationship to the people involved',2,
       'Job title, how long, and how you know the person this statement concerns.')+
   box('What I personally saw or heard',14,
       'Only what you witnessed yourself. If you are repeating something another person told you, say so and name them. Give dates, or your honest best estimate \u2014 \u201con or about\u201d is fine.')+
   box('Exact words, where I am certain of them',3,'Use quotation marks only around words you are sure of.')+
   box('Documents or recordings I am aware of',2,
       'Anything you know exists: an email, a message, a photograph, a roster, a recording.')+
   '<div class="isec"><div class="ilab">Declaration</div>'+
   '<div class="idecl">I have written this statement myself, in my own words. '+
   'The facts set out above are true to the best of my knowledge and belief. '+
   'I understand it may be provided to the Montana Human Rights Bureau as part of its investigation.</div></div>'+
   '<div class="isignblock">'+
   '<div class="isigrow"><div class="isigl">Signature</div><div class="isigline"></div></div>'+
   '<div class="isigrow"><div class="isigl">Print name</div><div class="isigline"></div></div>'+
   '<div class="isigrow"><div class="isigl">Date</div><div class="isigline short"></div></div>'+
   '</div>'+
   '<div class="jfoot">Written and signed by hand, then scanned or photographed into the evidence file. '+
   'Keep the paper original.</div></div>';
  $('wt-form').innerHTML='<div class="pvbar noprint">'+
    '<button class="pri" onclick="reprint(\'wt-form\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'wt-form\')">Close</button></div>'+html;
  showPrintView('wt-form');
}

/* ---- print any reading page as it stands ---- */
function printPage(id){
  var v=$('v-'+id); if(!v) return;
  var h=v.querySelector('h2'); var sub=v.querySelector('.sub2');
  var clone=v.cloneNode(true);
  // open every collapsed section, and drop anything interactive
  clone.querySelectorAll('details').forEach(function(d){ d.setAttribute('open',''); });
  clone.querySelectorAll('h2, .sub2, button, input, textarea, select, .printout, .saved, .row, .srchwrap, .dash, .picon, .pzone')
       .forEach(function(e){ e.remove(); });
  // labels that belonged to the fields just removed, and worksheet cards left with nothing to read
  clone.querySelectorAll('label.fl, label[for]').forEach(function(e){ e.remove(); });
  clone.querySelectorAll('.card').forEach(function(c){
    var t=c.cloneNode(true); t.querySelectorAll('h3,h4').forEach(function(x){ x.remove(); });
    if((t.textContent||'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean).length<4) c.remove(); });
  clone.querySelectorAll('a.dl, a.lawlink').forEach(function(a){
    var href=a.getAttribute('href')||'';
    var span=document.createElement('p'); span.className='pvlink';
    span.innerHTML='<b>'+a.textContent.replace(/\s*\u2197\s*$/,'').trim()+'</b>'+
      (href.indexOf('http')===0? '<br><span>'+href+'</span>' : '');
    a.parentNode.replaceChild(span,a);
  });
  var title=h? h.textContent.trim() : 'Page';
  var subtitle=sub? sub.textContent.trim() : '';
  var body=clone.innerHTML;
  var html='<div class="pvdoc readpage"><h1>'+esc(title)+'</h1>'+
    (subtitle?'<p class="pvsub">'+esc(subtitle)+'</p>':'')+
    '<div class="rp">'+body+'</div>'+
    '<div class="jfoot">Kickass Case Builder \u00b7 kickasscase.netlify.app \u00b7 printed '+pdate()+'</div></div>';
  var tgt='pp-'+id;
  var holder=$(tgt);
  if(!holder){ holder=document.createElement('div'); holder.id=tgt; holder.className='printout';
    holder.style.display='none'; v.appendChild(holder); }
  holder.innerHTML='<div class="pvbar noprint">'+
    '<button class="pri" onclick="reprint(\''+tgt+'\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\''+tgt+'\')">Close</button></div>'+html;
  showPrintView(tgt);
}

/* ---- shared printable document renderer ---- */
function renderPrint(title, subtitle, head, rows, note, target){
  if(!target || !$(target)) return;
  $(target).innerHTML=
    '<div class="pvbar noprint">'+
      '<button class="pri" onclick="reprint(\''+target+'\')">Print again</button>'+
      '<button class="sec" onclick="closePrint(\''+target+'\')">Close</button>'+
    '</div>'+
    '<div class="pvhint noprint">On a phone you can also use the browser\u2019s Share button and choose Print, '+
    'or Save to Files.</div>'+
    '<div class="pvdoc"><h1>'+esc(title)+'</h1>'+
    '<p class="pvsub">'+esc(subtitle)+'</p>'+
    (note?'<p class="pvnote">'+note+'</p>':'')+
    '<table><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  showPrintView(target);
}
function pdate(){ return new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}); }
function plural(n,w){ return n+' '+w+(n===1?'':'s'); }

/* ---- chronology ---- */
function printChronology(){
  if(!D.events.length){ alert('Nothing in the chronology yet.'); return; }
  var rows='';
  for(var i=0;i<D.events.length;i++){ var e=D.events[i];
    rows+='<tr><td class="n">'+(i+1)+'</td>'+
      '<td class="dcell">'+esc(e.d)+'</td>'+
      '<td><div class="wt">'+esc(e.w)+'</div>'+
      (e.who?'<div class="pv"><b>Present:</b> '+esc(e.who)+'</div>':'')+chronRefs(e)+'</td>'+
      '<td class="loc">'+esc(e.doc||'')+'</td></tr>';
  }
  renderPrint('Chronology', plural(D.events.length,'entry').replace('entrys','entries')+' \u00b7 prepared '+pdate(),
    '<th></th><th>Date</th><th>What happened</th><th>Document</th>', rows, null, 'ev-print');
}
function exportChronologyCSV(){
  if(!D.events.length){ alert('Nothing in the chronology yet.'); return; }
  function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  var out='No,Date,What happened,Who was present,Document,Tags,Exhibits,Witnesses\n';
  for(var i=0;i<D.events.length;i++){ var e=D.events[i];
    out+=[i+1,q(e.d),q(e.w),q(e.who||''),q(e.doc||''),q(eventTags(e).join('; ')),
      q(linkedExhibits(e).map(function(x){return 'Exhibit '+x.n;}).join('; ')),
      q(linkedWitnesses(e).map(function(x){return x.n;}).join('; '))].join(',')+'\n'; }
  deliverText(out,'chronology-'+new Date().toISOString().slice(0,10)+'.csv','Chronology');
}

/* ---- witnesses ---- */
function printWitnesses(){
  if(!D.witnesses.length){ alert('No witnesses yet.'); return; }
  var rows='';
  for(var i=0;i<D.witnesses.length;i++){ var w=D.witnesses[i];
    rows+='<tr><td class="n">'+(i+1)+'</td>'+
      '<td><div class="wt">'+esc(w.n)+'</div>'+
      (w.r?'<div class="pv">'+esc(w.r)+'</div>':'')+
      (w.c?'<div class="pv">'+esc(w.c)+'</div>':'')+'</td>'+
      '<td>'+esc(w.k||'')+(w.o?'<div class="pv">'+esc(w.o)+'</div>':'')+'</td>'+
      '<td class="loc">'+esc(w.s||'')+'</td></tr>';
  }
  renderPrint('Witness list', plural(D.witnesses.length,'witness').replace('witnesss','witnesses')+' \u00b7 prepared '+pdate(),
    '<th></th><th>Witness</th><th>What they can speak to</th><th>Status</th>', rows,
    '<b>Keep this private.</b> Do not file or share it unless you have to.', 'wt-print');
}

/* ---- correspondence ---- */
function printDocs(){
  if(!D.docs.length){ alert('Nothing filed yet.'); return; }
  var rows='', today=new Date().toISOString().slice(0,10);
  for(var i=0;i<D.docs.length;i++){ var e=D.docs[i];
    rows+='<tr><td class="n">'+(i+1)+'</td>'+
      '<td class="dcell">'+esc(e.d||'')+'<div class="pv">'+esc(e.k||'')+'</div></td>'+
      '<td><div class="wt">'+esc(e.w)+'</div>'+
      (e.f?'<div class="pv"><b>From or to:</b> '+esc(e.f)+'</div>':'')+
      (e.a?'<div class="pv"><b>Action:</b> '+esc(e.a)+'</div>':'')+'</td>'+
      '<td class="loc">'+(e.due?'<b>Due '+esc(e.due)+(e.due<today?' \u2014 passed':'')+'</b>':'')+
      (e.l?'<div>'+esc(e.l)+'</div>':'')+'</td></tr>';
  }
  renderPrint('Correspondence and filings', plural(D.docs.length,'item')+' \u00b7 prepared '+pdate(),
    '<th></th><th>Date</th><th>Document</th><th>Deadline and location</th>', rows, null, 'dc-print');
}

/* ---- export the index ---- */
function exportIndexHTML(){
  if(!D.exhibits.length){ alert('No exhibits to export yet.'); return; }
  var rows='';
  for(var i=0;i<D.exhibits.length;i++){ var e=D.exhibits[i];
    rows+='<tr><td class="n">'+(i+1)+'</td><td class="th">'+(e.t?'<img src="'+e.t+'">':'')+'</td>'+
      '<td><div class="dt">'+esc(e.d||'')+'</div><div class="wt">'+esc(e.w)+'</div>'+
      (e.p?'<div class="pv"><b>Proves:</b> '+esc(e.p)+'</div>':'')+'</td>'+
      '<td class="loc">'+(e.f?'<div><b>'+esc(e.f)+'</b></div>':'')+(e.l?'<div>'+esc(e.l)+'</div>':'')+'</td></tr>';
  }
  renderPrint('Exhibit index', plural(D.exhibits.length,'exhibit')+' \u00b7 prepared '+pdate(),
    '<th></th><th>Thumbnail</th><th>Exhibit and what it proves</th><th>File and location</th>', rows, null, 'ex-print');
}
function showPrintView(target){
  var pv=$(target);
  if(!pv){ alert('Could not find the output area ('+target+'). Please reload the page.'); return; }
  pv.style.display='block';
  try{ pv.scrollIntoView(); }catch(e){}
  printInPlace(target);
}
/* Print the printout where it sits. window.print() must run inside the tap itself:
   phones (Safari especially) ignore a print request that arrives later, from a timer. */
function clearPrintMarks(){
  var m=document.querySelectorAll('.pchain,.ptarget');
  for(var i=0;i<m.length;i++){ m[i].classList.remove('pchain'); m[i].classList.remove('ptarget'); }
  document.body.removeAttribute('data-printing');
}
function printInPlace(target){
  var pv=$(target); if(!pv) return;
  printToken++;
  clearPrintMarks();
  pv.style.display='block';
  pv.classList.add('ptarget');
  var n=pv;
  while(n.parentElement && n.parentElement!==document.documentElement){ n=n.parentElement; n.classList.add('pchain'); }
  document.body.setAttribute('data-printing', target);
  try{ window.print(); }
  catch(e){ alert('This browser would not open the print window. The document is on the page \u2014 use the browser\u2019s Share or menu button and choose Print.'); }
}
var printToken=0;
window.addEventListener('afterprint', function(){ var t=printToken; setTimeout(function(){ if(t===printToken) clearPrintMarks(); }, 300); });
function reprint(target){
  var pv=$(target); if(!pv) return;
  printInPlace(target);
}
function closePrint(target){
  var pv=$(target);
  if(!pv) return;
  pv.style.display='none';
  pv.innerHTML='';
  clearPrintMarks();
}

/* ---- export the index ---- */
function exportIndexCSV(){
  if(!D.exhibits.length){ alert('No exhibits to export yet.'); return; }
  function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  var out='No,Date,Exhibit,What it proves,File name,Where stored\n';
  for(var i=0;i<D.exhibits.length;i++){ var e=D.exhibits[i];
    out+=[i+1,q(e.d||''),q(e.w),q(e.p||''),q(e.f||''),q(e.l||'')].join(',')+'\n'; }
  deliverText(out, 'exhibit-index-'+new Date().toISOString().slice(0,10)+'.csv', 'Exhibit index');
}
/* ---- witnesses ---- */
function exportWitnesses(){
  if(!D.witnesses.length){ alert('No witnesses to export yet.'); return; }
  function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  var out='Name,Relationship,Can speak to,Contact,Status,Notes\n';
  for(var i=0;i<D.witnesses.length;i++){ var w=D.witnesses[i];
    out+=[q(w.n),q(w.r||''),q(w.k||''),q(w.c||''),q(w.s||''),q(w.o||'')].join(',')+'\n'; }
  deliverText(out, 'witness-list-'+new Date().toISOString().slice(0,10)+'.csv', 'Witness list');
}

/* ---- correspondence ---- */
function exportDocs(){
  if(!D.docs.length){ alert('Nothing to export yet.'); return; }
  function q(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  var out='Date,Kind,Document,From,Action needed,Due,Where stored\n';
  for(var i=0;i<D.docs.length;i++){ var e=D.docs[i];
    out+=[q(e.d||''),q(e.k||''),q(e.w),q(e.f||''),q(e.a||''),q(e.due||''),q(e.l||'')].join(',')+'\n'; }
  deliverText(out, 'case-correspondence-'+new Date().toISOString().slice(0,10)+'.csv', 'Correspondence and filings');
}

/* ---- records requests ---- */
function buildRequest(){
  var to=$('rq-to').value.trim(), what=$('rq-what').value.trim();
  var from=$('rq-from').value, until=$('rq-until').value, who=$('rq-people').value.trim();
  var me=$('rq-me').value.trim();
  if(!to||!what){ alert('Who it goes to and what you want are both needed.'); return; }
  var today=new Date().toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  var MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var nd=function(x){ var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(x||''); return m? MONTHS[+m[2]-1]+' '+(+m[3])+', '+m[1] : x; };
  var range = (from||until) ? ('\n\nDate range: '+(from?nd(from):'the earliest records held')+' to '+(until?nd(until):'the present')+'.') : '';
  var people = who ? ('\n\nPlease include records held by or about: '+who+'. This request covers official accounts and, where the content concerns public business, personal accounts and devices.') : '';
  var t = to+'\n\n'+today+'\n\nRE: Request for public records\n\n'+
  'Under Article II, Section 9 of the Montana Constitution and the public records provisions beginning at \u00a7 2-6-1001, MCA, I request copies of the following:\n\n'+
  what+range+people+'\n\n'+
  'Please provide records in their native electronic format with metadata intact where possible, rather than printed and rescanned.\n\n'+
  'If any part of this request is denied or withheld, please state in writing which statute or rule you rely on and identify what is being withheld.\n\n'+
  'Please confirm receipt and provide an estimate of any fee before beginning work. If a fee waiver is available, please treat this as a request for one.\n\n'+
  'Sincerely,\n\n'+(me||'[your name]');
  $('rq-out').value=t; $('rq-outwrap').style.display='block';
  D.requests.push({to:to,what:what,date:today}); save(); renderRequests();
  printRequest();
}
/* the request as a printable letter, built from whatever is in the box now (so edits carry over) */
function printRequest(){
  var t=($('rq-out').value||'').replace(/\r/g,'').trim();
  if(!t){ alert('Generate the letter first.'); return; }
  var paras=t.split(/\n\s*\n/), html='';
  for(var i=0;i<paras.length;i++){
    var p=paras[i].trim(); if(!p) continue;
    var e=esc(p).replace(/\n/g,'<br>');
    if(i===0){
      // an address typed on one line becomes an address block; "Hamilton, MT 59840" stays together
      var parts=p.indexOf('\n')===-1 ? p.split(/\s*,\s*/) : [p];
      if(parts.length>2 && /^[A-Z]{2}\s*\d{5}/.test(parts[parts.length-1])){ var st=parts.pop(); parts[parts.length-1]+=', '+st; }
      html+='<div class="lt-to">'+parts.map(function(x){return esc(x).replace(/\n/g,'<br>');}).join('<br>')+'</div>';
    }
    else if(i===1 && p.length<40) html+='<div class="lt-date">'+e+'</div>';
    else if(/^RE:/i.test(p)) html+='<div class="lt-re">'+e+'</div>';
    else if(/^Sincerely,?$/i.test(p)) html+='<div class="lt-close">'+e+'</div><div class="lt-sigline"></div>';
    else html+='<p>'+e+'</p>';
  }
  $('rq-print').innerHTML=
    '<div class="pvbar noprint">'+
      '<button class="pri" onclick="reprint(\'rq-print\')">Print again</button>'+
      '<button class="sec" onclick="closePrint(\'rq-print\')">Close</button></div>'+
    '<div class="pvhint noprint">Your request as a letter. Print it, sign it, and keep a copy with the date you sent it.</div>'+
    '<div class="letter">'+html+'</div>';
  showPrintView('rq-print');
}
function renderRequests(){
  var h=''; if(!D.requests.length) h='<div class="empty">No requests logged yet. The date you asked matters as much as what you asked for.</div>';
  for(var i=D.requests.length-1;i>=0;i--){ var r=D.requests[i];
    h+='<div class="item"><span class="x" onclick="delRequest('+i+')">remove</span>'+
       '<div class="d">'+esc(r.date)+'</div><div class="t">'+esc(r.to)+'</div>'+
       '<div class="m">'+esc(r.what).slice(0,150)+'</div></div>';
  }
  $('rq-list').innerHTML=h;
}
function delRequest(i){ if(confirm('Remove from the log?')){ D.requests.splice(i,1); save(); renderRequests(); } }
function copyOut(id){ var t=$(id); t.select(); try{document.execCommand('copy'); alert('Copied.');}catch(e){ alert('Select the text and copy it.'); } }
/* ---- complaint ---- */
function buildComplaint(){
  var f={}; ['cp-name','cp-addr','cp-phone','cp-email','cp-resp','cp-respaddr','cp-respphone',
           'cp-area','cp-grounds','cp-first','cp-last','cp-facts','cp-want'].forEach(function(k){ f[k]=$(k).value.trim(); });
  D.complaint=f; save();
  var body=D.events.length&&!f['cp-facts'] ? D.events.map(function(e,i){
      return String.fromCharCode(65+i)+'. On '+niceDate(e.d)+', '+e.w+(e.who?' Present: '+e.who+'.':''); }).join('\n\n') : f['cp-facts'];
  body=withClaimsText(body);
  var t='CHARGE OF DISCRIMINATION\nFiled before: Montana Department of Labor & Industry, Human Rights Bureau\n\n'+
  'CHARGING PARTY\n'+f['cp-name']+'\n'+f['cp-addr']+'\n'+f['cp-phone']+(f['cp-email']?' \u00b7 '+f['cp-email']:'')+'\n\n'+
  'RESPONDENT\n'+f['cp-resp']+'\n'+f['cp-respaddr']+'\n'+f['cp-respphone']+'\n\n'+
  'BASIS OF DISCRIMINATION\n'+(f['cp-grounds']||'[name every ground that applies]')+'\n\n'+
  'DATE OF DISCRIMINATION\nEarliest: '+(f['cp-first']||'[date]')+'\nLatest: '+(f['cp-last']||'[date]')+'\n\n'+
  'PARTICULARS OF THE CHARGE\n'+
  'I believe I have been discriminated against on the basis of '+(f['cp-grounds']||'[ground]')+
  ' in the area of '+(f['cp-area']||'[employment]')+', in violation of the Montana Human Rights Act, for the following reasons:\n\n'+
  (body||'[lettered paragraphs \u2014 one fact each, in date order]')+'\n\n'+
  (f['cp-want']?'REQUESTED RELIEF\n'+f['cp-want']+'\n\n':'')+
  'VERIFICATION\n\u2022 I hereby file this charge with the above-cited agency.\n'+
  '\u2022 I agree to inform the agency if I change my address or telephone number and I agree to cooperate fully in the processing of my charge in accordance with its procedures.\n'+
  '\u2022 I swear or affirm that I have read the above charge and I declare under penalty of perjury that the foregoing is true and correct.\n\n'+
  'Signature: ______________________________   Date: ____________';
  $('cp-out').value=t; $('cp-outwrap').style.display='block';
  var words=t.split(/\s+/).length;
  $('cp-len').textContent = words+' words \u2014 the Bureau\u2019s limit for a self-drafted complaint is 2 pages, so aim well under 900.';
}
/* ---- damages worksheet ---- */
var DMG=[['wages','Lost wages','Pay you did not receive. Hours, shifts, overtime, a job you had to leave.'],
 ['benefits','Lost benefits','Insurance, pension contributions, leave accrual, training you paid for or lost.'],
 ['costs','Costs you incurred','Records fees, postage, mileage, time off work, anything you paid because of this.'],
 ['future','Future loss','Earnings you will not get: a promotion denied, a career path closed, time to re-qualify.'],
 ['emotional','Emotional distress','Its own category, and a real one. Sleep, health, the cost of counseling.'],
 ['other','Anything else','Property damage, a professional reputation, costs nobody else would think of.']];
function renderDamages(){
  D.damages=D.damages||{};
  var h='', total=0;
  for(var i=0;i<DMG.length;i++){
    var k=DMG[i][0], v=D.damages[k]||{};
    var amt=parseFloat(v.amt)||0; total+=amt;
    h+='<div class="dmg"><div class="dmgh">'+DMG[i][1]+'</div>'+
       '<div class="dmgn">'+DMG[i][2]+'</div>'+
       '<label class="fl" for="dm-'+k+'">Amount</label>'+
       '<input type="text" inputmode="decimal" id="dm-'+k+'" value="'+esc(v.amt||'')+'" placeholder="0" '+
       'oninput="setDamage(\''+k+'\',\'amt\',this.value)">'+
       '<label class="fl" for="dw-'+k+'">How you worked it out</label>'+
       '<textarea id="dw-'+k+'" rows="2" placeholder="Show the arithmetic. &quot;14 shifts at 8 hours, $22/hr&quot; beats a round number." '+
       'oninput="setDamage(\''+k+'\',\'why\',this.value)">'+esc(v.why||'')+'</textarea></div>';
  }
  $('dmg-list').innerHTML=h;
  $('dmg-total').textContent = total? ('$'+total.toLocaleString(undefined,{maximumFractionDigits:0})) : '\u2014';
}
function setDamage(k,f,v){ D.damages=D.damages||{}; D.damages[k]=D.damages[k]||{}; D.damages[k][f]=v; save();
  if(f==='amt'){ var t=0; for(var x in D.damages) t+=parseFloat(D.damages[x].amt)||0;
    $('dmg-total').textContent = t? ('$'+t.toLocaleString(undefined,{maximumFractionDigits:0})) : '\u2014'; } }
function printDamages(){
  D.damages=D.damages||{};
  var rows='', total=0;
  for(var i=0;i<DMG.length;i++){ var k=DMG[i][0], v=D.damages[k]||{};
    if(!v.amt && !v.why) continue;
    var amt=parseFloat(v.amt)||0; total+=amt;
    rows+='<tr><td class="n">'+(i+1)+'</td><td><div class="wt">'+esc(DMG[i][1])+'</div>'+
      (v.why?'<div class="pv">'+esc(v.why)+'</div>':'')+'</td>'+
      '<td class="loc"><b>'+(amt?('$'+amt.toLocaleString(undefined,{maximumFractionDigits:0})):'')+'</b></td></tr>';
  }
  if(!rows){ alert('Fill in at least one figure first.'); return; }
  rows+='<tr><td class="n"></td><td><div class="wt">TOTAL</div></td>'+
        '<td class="loc"><b>$'+total.toLocaleString(undefined,{maximumFractionDigits:0})+'</b></td></tr>';
  renderPrint('Statement of damages','prepared '+pdate(),
    '<th></th><th>Category and how it was worked out</th><th>Amount</th>', rows,
    '<b>Every figure here should trace to something you can produce.</b>', 'dmg-print');
}

/* ---- mediation worksheet ---- */
var MED=[['number','Your number','What you are asking for, and the figure you arrived at from the damages worksheet.'],
 ['floor','Your walk-away','The number below which you would rather keep going. Decide it now, not in the room.'],
 ['nonmoney','What you want that is not money','A policy change, training, a reference, reinstatement, a correction to a record.'],
 ['never','What you will not trade at any price','Mine was the policy and the test. Know yours before you sit down.'],
 ['insurer','Who insures them','Risk pool or carrier. For a public body this is usually in budgets and board minutes.'],
 ['authority','Who has settlement authority','Ask the mediator before the session whether the person present can actually settle, and up to what.'],
 ['approval','Does a vote have to approve it','Many public settlements need a council or board vote, sometimes in open session.'],
 ['confid','What they will ask you to give up','Confidentiality, a release, non-disparagement, agreeing not to reapply. Each is worth something.']];
function renderMed(){
  D.mediation=D.mediation||{};
  var h='';
  for(var i=0;i<MED.length;i++){ var k=MED[i][0];
    h+='<div class="dmg"><div class="dmgh">'+MED[i][1]+'</div><div class="dmgn">'+MED[i][2]+'</div>'+
       '<textarea id="md-'+k+'" rows="2" oninput="setMed(\''+k+'\',this.value)">'+esc(D.mediation[k]||'')+'</textarea></div>';
  }
  $('med-list').innerHTML=h;
}
function setMed(k,v){ D.mediation=D.mediation||{}; D.mediation[k]=v; save(); }
function printMed(){
  D.mediation=D.mediation||{};
  var rows='';
  for(var i=0;i<MED.length;i++){ var k=MED[i][0], v=D.mediation[k];
    rows+='<tr><td class="n">'+(i+1)+'</td><td><div class="wt">'+esc(MED[i][1])+'</div>'+
      '<div class="pv">'+(v?esc(v):'<i style="color:#999">\u2014</i>')+'</div></td></tr>';
  }
  renderPrint('Mediation preparation','prepared '+pdate(), '<th></th><th></th>', rows,
    '<b>Keep this to yourself.</b> It is your preparation, not a document for anyone else.', 'med-print');
}

/* ---- looking after yourself ---- */
var MOODS=['heavy','flat','steady','lighter','strong'];
function todayKey(){ return new Date().toISOString().slice(0,10); }
function cget(){ D.care=D.care||{}; var k=todayKey(); D.care[k]=D.care[k]||{}; return D.care[k]; }
function setMood(m){ cget().mood=m; save(); renderCare(); }
function setCareField(f,v){ cget()[f]=v; save(); }
function renderCare(){
  var c=cget(), k=todayKey();
  var mh=MOODS.map(function(m){
    return '<button class="feel'+(c.mood===m?' on':'')+'" onclick="setMood(\''+m+'\')">'+m+'</button>';}).join('');
  $('care-mood').innerHTML=mh;
  ['space','well','body','who'].forEach(function(f){ var el=$('care-'+f); if(el) el.value=c[f]||''; });
  // the pattern over the last fortnight
  var days=[], lab=[];
  for(var i=13;i>=0;i--){
    var d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    var e=(D.care||{})[d]||{};
    days.push(e.mood? MOODS.indexOf(e.mood)+1 : 0);
    lab.push(d.slice(8));
  }
  var any=days.some(function(x){return x>0;});
  var bars=days.map(function(v,i){
    var h=v? (v*16+8) : 4;
    return '<div class="ctick"><div class="cbar'+(v?'':' none')+'" style="height:'+h+'px"></div>'+
           '<div class="cday">'+lab[i]+'</div></div>';}).join('');
  $('care-trend').innerHTML = any
    ? '<div class="ctrend">'+bars+'</div><p class="note" style="margin:8px 0 0">Fourteen days. '+
      'If a run of them comes back heavy, that pattern is worth telling someone you trust rather than only noting here.</p>'
    : '<p class="note" style="margin:0">Mark how a day felt and a fortnight of them will appear here.</p>';
  var w=(c.free||'').trim();
  if($('care-count')) $('care-count').textContent = w? (w.split(/\s+/).length+' words today') : '';
}
function printCarePage(){
  var today=new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  var line='<div class="jrule"></div>';
  var html='<div class="pvdoc jpage">'+
    '<h1>Journal</h1><p class="pvsub">'+today+'</p>'+
    '<div class="jsec"><div class="jlab">How the day felt</div>'+
      '<div class="jmoods">'+MOODS.map(function(m){return '<span class="jm">\u25cb '+m+'</span>';}).join('')+'</div></div>'+
    ['What took up space today','One thing that went well',
     'Something my body did for me today','Who I talked to, or wanted to'].map(function(p){
      return '<div class="jsec"><div class="jlab">'+p+'</div>'+line+line+'</div>';}).join('')+
    '<div class="jsec"><div class="jlab">Anything else</div>'+
      new Array(13).join(line)+'</div>'+
    '<div class="jfoot">Written by hand, dated, at the time. That is what makes it worth something later.</div></div>';
  $('care-print').innerHTML='<div class="pvbar noprint">'+
    '<button class="pri" onclick="reprint(\'care-print\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'care-print\')">Close</button></div>'+html;
  showPrintView('care-print');
}

/* ---- where am I ---- */
var STAGES=[
 ['intake','Intake','You call the Bureau and an investigator takes your account by phone. They draft a complaint for you to sign, or you draft your own.','Name every claim explicitly. Read the draft before you sign it.'],
 ['filed','Complaint filed','The clock stopped. Your complaint must be filed within 180 days of the most recent act.','Keep the filed copy and the date. Log it in Correspondence.'],
 ['notice','Respondent notified','Usually within 10 days. By statute the Bureau cannot investigate until they are on notice.','Nothing to do but wait. Use the time to finish your chronology.'],
 ['position','Position statement','The respondent files their account and their defense. The Bureau sends it to you.','Read it three times. Then write your rebuttal.'],
 ['rebuttal','Your rebuttal','You answer their defense, point by point, with documents attached.','Ask the deadline in writing the day it arrives.'],
 ['assigned','Assigned to an investigator','Within 45 days of filing the case is assigned.','Ask who your investigator is and how they prefer to be contacted.'],
 ['investigation','Investigation','Witness interviews, document requests, comparative information. Sometimes a fact-finding conference or a site visit.','By law this must finish within 180 days of filing \u2014 120 for housing. Up to 45 days may be added if both sides discuss resolution.'],
 ['finding','Final Investigative Report','A finding of reasonable cause or no reasonable cause, on the balance of the evidence.','Read it against your own chronology and exhibit list, line by line.'],
 ['conciliation','Conciliation','If reasonable cause is found, the Bureau tries to resolve it between the parties.','Have your damages worked out before this starts.'],
 ['hearing','Contested case hearing','If conciliation fails, the case goes to the Hearings Bureau and a hearing examiner.','This is where damages can actually be awarded. The Bureau itself cannot award them.'],
 ['appeal','Appeal to the Commission','Either side may appeal within 14 days of a decision. The Commission hears it within 120 days.','14 days runs from the date on the letter, not the day you got it.']];
function setStage(k){ D.stage=k; save(); renderStage(); }
function renderStage(){
  var cur=D.stage||'', idx=-1;
  for(var i=0;i<STAGES.length;i++) if(STAGES[i][0]===cur) idx=i;
  var h='';
  for(var i=0;i<STAGES.length;i++){
    var st=STAGES[i], done=idx>-1&&i<idx, here=i===idx;
    h+='<button class="stage'+(here?' here':'')+(done?' done':'')+'" onclick="setStage(\''+st[0]+'\')">'+
       '<span class="sdot">'+(done?'\u2713':(here?'\u25cf':(i+1)))+'</span>'+
       '<span class="sbody"><span class="sname">'+st[1]+'</span>'+
       (here?'<span class="sdesc">'+st[2]+'</span><span class="snext"><b>Now:</b> '+st[3]+'</span>':'')+
       '</span></button>';
  }
  $('stage-list').innerHTML=h;
  $('stage-now').innerHTML = idx>-1
    ? '<b>'+STAGES[idx][1]+'</b><span>step '+(idx+1)+' of '+STAGES.length+'</span>'
    : '<b>\u2014</b><span>tap the stage you are at</span>';
}

/* ---- checklist ---- */
var CHECKS=[
 ['Work out your deadline','Find the most recent discriminatory act, or the day you discovered it. Count 180 days forward.'],
 ['Write the chronology','Every date, what happened, who was present, what document exists.'],
 ['Name the respondent correctly','The legal entity \u2014 not the informal name of the department or office.'],
 ['Identify your comparator','Who was treated better in a comparable situation, and what shows the difference.'],
 ['Gather what you already hold','Emails, texts, photographs, minutes, handbooks, your own notes.'],
 ['Send one records request','In writing. Dated. Ask for more than you think you need.'],
 ['Start the journal','Today\u2019s date at the top. Keep it factual and keep it going.'],
 ['Check their website','Agendas, minutes, recordings, budgets, policy manuals. Free, and nobody is told you looked.'],
 ['Back it up in three places','Cloud, your own computer, and something physical kept elsewhere. Never only on a work device.'],
 ['Write your account before you call','Then send it in writing as well as saying it aloud.'],
 ['Read the draft before you sign it','Line by line against your own account.'],
 ['Tell a few people everything','Not everyone. People who will hear the whole thing without needing you to perform being fine.'],
 ['Keep one thing that is not the case','Something you did before this and will do after. Protect it. It is proof you are a person, not a complaint.'],
 ['Set it down on purpose','Decide there are hours you do not touch it. The file will wait. It is remarkably good at waiting.'],
 ['Line up support','A counselor, a doctor, a friend who checks in. Carrying this alone is a load nobody should carry alone.']
];
function renderChecks(){
  var h='';
  for(var i=0;i<CHECKS.length;i++){
    var on=!!D.checks[i];
    h+='<label class="chk'+(on?' done':'')+'"><input type="checkbox" '+(on?'checked':'')+' onchange="toggleCheck('+i+',this.checked)">'+
       '<span><b>'+CHECKS[i][0]+'</b><span>'+CHECKS[i][1]+'</span></span></label>';
  }
  $('ck-list').innerHTML=h;
  var n=0; for(var k in D.checks) if(D.checks[k]) n++;
  $('ck-count').textContent=n+' of '+CHECKS.length;
}
function toggleCheck(i,v){ D.checks[i]=v; save(); renderChecks(); }
/* ---- export / import / reset ---- */
function markBackedUp(){ D.meta=D.meta||{}; D.meta.lastBackup=new Date().toISOString(); save(); if(noticeKind==='backup') hideNotice(); if(window.renderHome) renderHome(); }
function backupName(locked){ return 'my-case-file-'+new Date().toISOString().slice(0,10)+(locked?'-protected':'')+'.json'; }
function exportAll(){
  D.meta=D.meta||{};
  if(!canEncrypt()){ shareOrDeliver(JSON.stringify(D,null,2), backupName(false), 'Case file backup'); return; }
  dlgOpen('<h3>Back up your work</h3>'+
    '<p>Your backup holds your witness list and everything else you have entered. A passphrase locks it, so anyone who finds the file cannot read it.</p>'+
    '<label class="dlab" for="bp1">Passphrase</label><input type="password" id="bp1" autocomplete="new-password">'+
    '<label class="dlab" for="bp2">Type it again</label><input type="password" id="bp2" autocomplete="new-password">'+
    '<p class="note">Write it down somewhere safe. If you lose it, the backup cannot be opened, and nobody can recover it for you.</p>'+
    '<div id="dlgerr" class="dlgerr"></div>'+
    '<div class="row"><button class="pri" id="bpgo">Back up with a passphrase</button>'+
    '<button class="sec" id="bpplain">Back up without one</button>'+
    '<button class="sec" onclick="dlgClose()">Cancel</button></div>');
  $('bpplain').onclick=function(){ dlgClose(); shareOrDeliver(JSON.stringify(D,null,2), backupName(false), 'Case file backup'); };
  $('bpgo').onclick=function(){
    var p1=$('bp1').value, p2=$('bp2').value;
    if(p1.length<8){ dlgErr('Use at least 8 characters.'); return; }
    if(p1!==p2){ dlgErr('The two passphrases do not match.'); return; }
    dlgErr(''); this.disabled=true; this.textContent='Locking…';
    encryptText(JSON.stringify(D), p1).then(function(text){
      // sharing needs a fresh tap, so the file is handed over from a second button
      dlgOpen('<h3>Your locked backup is ready</h3><p>Save it to your Google Drive case folder, or email it to yourself.</p>'+
        '<div class="row"><button class="pri" id="bpsave">Save the backup</button><button class="sec" onclick="dlgClose()">Done</button></div>');
      $('bpsave').onclick=function(){ shareOrDeliver(text, backupName(true), 'Case file backup (protected)'); dlgClose(); };
    }).catch(function(){ dlgErr('The backup could not be locked on this browser. You can back up without a passphrase instead.'); });
  };
}
function askOpenPass(obj){
  if(!canEncrypt()){ alert('This backup is protected with a passphrase, and this browser cannot open protected backups. Open the Case Builder from its web address in Safari or Chrome and try again.'); return; }
  dlgOpen('<h3>This backup is protected</h3><p>Enter the passphrase you chose when you made it.</p>'+
    '<label class="dlab" for="op1">Passphrase</label><input type="password" id="op1" autocomplete="current-password">'+
    '<div id="dlgerr" class="dlgerr"></div>'+
    '<div class="row"><button class="pri" id="opgo">Open the backup</button><button class="sec" onclick="dlgClose()">Cancel</button></div>');
  var go=function(){
    var b=$('opgo'); b.disabled=true; b.textContent='Opening…'; dlgErr('');
    decryptText(obj, $('op1').value).then(function(text){ dlgClose(); loadBackup(JSON.parse(text)); })
      .catch(function(){ b.disabled=false; b.textContent='Open the backup'; dlgErr('That passphrase does not open this backup.'); });
  };
  $('opgo').onclick=go;
  $('op1').addEventListener('keydown',function(e){ if(e.key==='Enter') go(); });
}
/* ---- notices: storage full, backup reminder ---- */
var noticeKind='';
function showNotice(kind, html){ var n=$(kind==='backup'&&$('bnotice')?'bnotice':'notice'); noticeKind=kind; n.className='on'+(kind==='full'?' warn':''); n.innerHTML=html; }
function hideNotice(){ ['notice','bnotice'].forEach(function(id){ var n=$(id); if(n){ n.className=''; n.innerHTML=''; } }); noticeKind=''; }
function saveFailed(){
  showNotice('full','<p><b>Your last change could not be saved.</b> The storage this browser gives the Case Builder is full. '+
    'Export a backup now so nothing is lost, then remove some evidence thumbnails to free space.</p>'+
    '<div class="row"><button class="pri" onclick="exportAll()">Export a backup</button>'+
    '<button class="sec" onclick="show(\'exhibits\')">Go to evidence</button></div>');
}
function hasWork(){
  return D.events.length||D.exhibits.length||D.requests.length||D.witnesses.length||D.docs.length||
    Object.keys(D.complaint||{}).some(function(k){return D.complaint[k];});
}
function checkBackup(){
  if(!hasWork() || noticeKind) return;
  var lb=D.meta&&D.meta.lastBackup, days=lb?Math.floor((Date.now()-Date.parse(lb))/864e5):null;
  if(lb && days<7) return;
  showNotice('backup','<p><b>'+(lb?'It has been '+days+' days since your last backup.':'You have not backed up your work yet.')+'</b> '+
    'Everything you enter is stored only on this device. Export a backup and keep it somewhere safe, such as your email or cloud storage.</p>'+
    '<div class="row"><button class="pri" onclick="exportAll()">Back up now</button>'+
    '<button class="sec" onclick="hideNotice()">Remind me later</button></div>');
}

/* ---- search the whole app ---- */
var SIDX=null;
function buildIndex(){
  SIDX=[];
  var vs=document.querySelectorAll('section.view');
  for(var i=0;i<vs.length;i++){
    var v=vs[i], vid=v.id.replace('v-',''), h2=v.querySelector('h2'), page=h2?h2.textContent.trim():vid;
    var els=v.querySelectorAll('h3,h4,summary,p,li,td,blockquote,.gterm,.ilab');
    for(var j=0;j<els.length;j++){
      var e=els[j];
      if(e.closest('.printout,.srchwrap,#notice,#bnotice,#iostip,[id$="-list"],[id$="-out"],.pvbar')) continue;
      if(e.querySelector('p,li,h3,h4')) continue;
      var t=textOf(e).replace(/\s+/g,' ').replace(/\s+([,.;:!?’])/g,'$1').trim();
      if(t.length<3) continue;
      var sec='', d=e.closest('details');
      if(d){ var su=d.querySelector('summary'); if(su) sec=su.textContent.trim(); }
      else { var c=e.closest('.card'); var hh=c?c.querySelector('h3'):null; if(hh) sec=hh.textContent.trim(); }
      var head=/^(H3|H4|SUMMARY)$/.test(e.tagName);
      SIDX.push({v:vid,page:page,sec:head?'':sec,t:t,el:e,head:head});
    }
  }
}
var INLINE={B:1,I:1,EM:1,STRONG:1,A:1,MARK:1,SUP:1,SUB:1,CODE:1,U:1,SMALL:1,ABBR:1};
function textOf(n){
  if(n.nodeType===3) return n.nodeValue;
  if(n.nodeType!==1) return '';
  var s=''; for(var c=n.firstChild;c;c=c.nextSibling) s+=textOf(c);
  return INLINE[n.tagName]? s : ' '+s+' ';
}
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function searchApp(q){
  if(!SIDX) buildIndex();
  var terms=q.toLowerCase().split(/\s+/).filter(function(x){return x.length>1;});
  if(!terms.length) return [];
  var out=[], ql=q.toLowerCase().trim();
  for(var i=0;i<SIDX.length;i++){
    var r=SIDX[i], tl=r.t.toLowerCase(), ok=true, score=0;
    for(var k=0;k<terms.length;k++){ if(tl.indexOf(terms[k])===-1){ ok=false; break; } }
    if(!ok) continue;
    score=(r.head?30:0)+(tl.indexOf(ql)!==-1?20:0)+(r.page.toLowerCase().indexOf(terms[0])!==-1?5:0)-Math.min(r.t.length,600)/120;
    out.push({r:r,s:score});
  }
  out.sort(function(a,b){return b.s-a.s;});
  // one result per block of text, at most two per section
  var seen={}, res=[];
  for(var m=0;m<out.length;m++){ var key=out[m].r.v+'|'+(out[m].r.sec||out[m].r.t); seen[key]=(seen[key]||0)+1; if(seen[key]<=2) res.push(out[m].r); }
  return res;
}
function snip(t,terms){
  var tl=t.toLowerCase(), p=-1;
  for(var k=0;k<terms.length;k++){ var x=tl.indexOf(terms[k]); if(x!==-1&&(p===-1||x<p)) p=x; }
  var a=Math.max(0,p-60), b=Math.min(t.length,(p<0?0:p)+140), s=(a>0?'\u2026':'')+t.slice(a,b)+(b<t.length?'\u2026':'');
  s=esc(s);
  for(var k2=0;k2<terms.length;k2++){ s=s.replace(new RegExp('('+escRe(esc(terms[k2]))+')','gi'),'<mark>$1</mark>'); }
  return s;
}
var SRES={};
function runSearch(inp){
  var box=inp.parentNode.querySelector('.srchres'), q=inp.value.trim();
  if(q.length<2){ box.className='srchres'; box.innerHTML=''; return; }
  var terms=q.toLowerCase().split(/\s+/).filter(function(x){return x.length>1;});
  var res=searchApp(q), id=inp.id||(inp.id='sq'+Math.random().toString(36).slice(2,8));
  SRES[id]=res;
  if(!res.length){ box.innerHTML='<div class="none">Nothing found for \u201c'+esc(q)+'\u201d. Try fewer or different words.</div>'; box.className='srchres on'; return; }
  var html='', n=Math.min(res.length,12);
  for(var i=0;i<n;i++){ var r=res[i];
    html+='<button type="button" onclick="goHit(\''+id+'\','+i+')"><span class="sp">'+esc(r.page)+'</span>'+
      (r.head?'<span class="st">'+snip(r.t,terms)+'</span>':(r.sec?'<span class="st">'+esc(r.sec)+'</span>':'')+'<span class="sx">'+snip(r.t,terms)+'</span>')+'</button>';
  }
  if(res.length>n) html+='<div class="more">'+(res.length-n)+' more \u2014 add another word to narrow it down.</div>';
  box.innerHTML=html; box.className='srchres on';
}
function goHit(id,i){
  var r=(SRES[id]||[])[i]; if(!r) return;
  var inp=$(id); if(inp){ inp.value=''; var b=inp.parentNode.querySelector('.srchres'); b.className='srchres'; b.innerHTML=''; inp.blur(); }
  show(r.v);
  var e=r.el, d=e.closest('details');
  while(d){ d.open=true; d=d.parentElement?d.parentElement.closest('details'):null; }
  setTimeout(function(){
    try{ e.scrollIntoView({block:'center'}); }catch(x){ e.scrollIntoView(); }
    e.classList.remove('hit'); void e.offsetWidth; e.classList.add('hit');
  },80);
}
function searchBox(ph){
  var w=document.createElement('div'); w.className='srchwrap noprint';
  w.innerHTML='<input type="search" placeholder="'+ph+'" aria-label="Search the Case Builder" autocomplete="off" enterkeyhint="search">'+
    '<div class="srchres" role="listbox"></div>';
  var inp=w.querySelector('input'), t=null;
  inp.addEventListener('input',function(){ clearTimeout(t); t=setTimeout(function(){ runSearch(inp); },120); });
  inp.addEventListener('keydown',function(ev){
    if(ev.key==='Escape'){ inp.value=''; runSearch(inp); }
    if(ev.key==='Enter'){ ev.preventDefault(); runSearch(inp); var f=w.querySelector('.srchres button'); if(f) f.click(); }
  });
  return w;
}
function addSearch(){
  var drop=$('drop');
  if(drop){ var lab=drop.firstElementChild; drop.insertBefore(searchBox('Search everything'), lab?lab.nextSibling:drop.firstChild); }
  var vs=document.querySelectorAll('section.view');
  for(var i=0;i<vs.length;i++){
    var v=vs[i]; if(v.id!=='v-learn') continue;
    var anchor=v.querySelector('.sub2')||v.querySelector('h2'); if(!anchor) continue;
    anchor.parentNode.insertBefore(searchBox('Search the guide and the whole Case Builder'), anchor.nextSibling);
  }
}
function iosTip(){
  var standalone=window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if(isIOS() && !standalone){ var t=$('iostip'); if(t) t.className='on'; }
}
function keepStorage(){
  try{ if(navigator.storage && navigator.storage.persist){ navigator.storage.persisted().then(function(p){ if(!p) navigator.storage.persist(); }); } }catch(e){}
}
function looksLikeCase(o){
  return o && typeof o==='object' && !Array.isArray(o) &&
    ['events','exhibits','witnesses','docs','requests','complaint'].some(function(k){ return k in o; });
}
function loadBackup(obj){
  if(!looksLikeCase(obj)){ alert('That file is not a Case Builder backup.'); return; }
  if(hasWork() && !confirm('Restoring replaces the work on this device with the work in the backup. Continue?')) return;
  D=Object.assign(blankD(),obj); save();
  saved().then(function(){ alert('Your backup is restored.'); location.reload(); });
}
function importAll(ev){
  var f=ev.target.files[0]; ev.target.value=''; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    var obj; try{ obj=JSON.parse(r.result); }catch(e){ alert('That file could not be read.'); return; }
    if(obj && obj.format===ENC_FORMAT){ askOpenPass(obj); return; }
    loadBackup(obj);
  };
  r.readAsText(f);
}
function resetAll(){
  if(!confirm('Delete everything stored on this device? This cannot be undone.')) return;
  if(!confirm('Really delete? Export first if you want a copy.')) return;
  D=blankD();
  try{localStorage.removeItem(DB_KEY);}catch(e){}
  saved().then(idbClear).then(function(){ location.reload(); });
}

/* ---- passphrase-protected backups: AES-GCM, key from PBKDF2-SHA-256 ---- */
var ENC_FORMAT='kickasscase-encrypted-backup', ENC_ITER=310000;
function canEncrypt(){ try{ return !!(window.crypto && crypto.subtle && window.TextEncoder); }catch(e){ return false; } }
function b64(buf){ var s='', b=new Uint8Array(buf); for(var i=0;i<b.length;i++) s+=String.fromCharCode(b[i]); return btoa(s); }
function unb64(s){ var t=atob(s), b=new Uint8Array(t.length); for(var i=0;i<t.length;i++) b[i]=t.charCodeAt(i); return b; }
function deriveKey(pass, salt, iter){
  return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function(base){
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:iter,hash:'SHA-256'}, base,
      {name:'AES-GCM',length:256}, false, ['encrypt','decrypt']);
  });
}
function encryptText(text, pass){
  var salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  return deriveKey(pass, salt, ENC_ITER).then(function(key){
    return crypto.subtle.encrypt({name:'AES-GCM',iv:iv}, key, new TextEncoder().encode(text));
  }).then(function(ct){
    return JSON.stringify({format:ENC_FORMAT, version:1, cipher:'AES-GCM', kdf:'PBKDF2-SHA-256',
      iterations:ENC_ITER, salt:b64(salt), iv:b64(iv), data:b64(ct)});
  });
}
function decryptText(obj, pass){
  return deriveKey(pass, unb64(obj.salt), obj.iterations||ENC_ITER).then(function(key){
    return crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(obj.iv)}, key, unb64(obj.data));
  }).then(function(pt){ return new TextDecoder().decode(pt); });
}

/* ---- a small dialog ---- */
function dlgOpen(html){
  var s=$('dlgscrim'); if(!s){ s=document.createElement('div'); s.id='dlgscrim'; document.body.appendChild(s); }
  s.innerHTML='<div id="dlg" role="dialog" aria-modal="true">'+html+'</div>'; s.className='on';
  var f=s.querySelector('input'); if(f) setTimeout(function(){ f.focus(); },50);
  return s.firstChild;
}
function dlgClose(){ var s=$('dlgscrim'); if(s){ s.className=''; s.innerHTML=''; } }
function dlgErr(t){ var e=$('dlgerr'); if(e){ e.textContent=t; e.style.display=t?'block':'none'; } }

function shareOrDeliver(text, name, label){
  try{
    if(window.File && navigator.canShare){
      var file=new File([text],name,{type:'application/json'});
      if(navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:label}).then(markBackedUp).catch(function(){});
        return;
      }
    }
  }catch(e){}
  deliverText(text, name, label); markBackedUp();
}
/* ---- autosave every form field ---- */
var SAVE_IDS=['cp-name','cp-addr','cp-phone','cp-email','cp-resp','cp-respaddr','cp-respphone',
 'cp-area','cp-grounds','cp-first','cp-last','cp-facts','cp-want',
 'rq-to','rq-what','rq-people','rq-from','rq-until','rq-me'];
var autoT;
function autosave(){
  clearTimeout(autoT);
  autoT=setTimeout(function(){
    D.complaint=D.complaint||{}; D.draft=D.draft||{};
    for(var i=0;i<SAVE_IDS.length;i++){
      var el=$(SAVE_IDS[i]); if(!el) continue;
      if(SAVE_IDS[i].indexOf('cp-')===0) D.complaint[SAVE_IDS[i]]=el.value;
      else D.draft[SAVE_IDS[i]]=el.value;
    }
    save();
  }, 400);
}
function wireAutosave(){
  for(var i=0;i<SAVE_IDS.length;i++){
    var el=$(SAVE_IDS[i]); if(!el) continue;
    el.addEventListener('input', autosave);
    el.addEventListener('change', autosave);
  }
}

/* ---- restore saved values ---- */
function restore(){
  if(D.deadline.last) $('dl-date').value=D.deadline.last;
  if(window.limType && $('dl-type')){ try{ limType(true); }catch(e){} }
  for(var k in (D.complaint||{})){ if($(k)) $(k).value=D.complaint[k]; }
  for(var k2 in (D.draft||{})){ if($(k2)) $(k2).value=D.draft[k2]; }
  wireAutosave();
  renderEvents(); renderExhibits(); renderRequests(); renderWitnesses(); renderDocs(); renderChecks(); renderStage(); renderCare(); renderDamages(); renderMed(); calcDeadline();
}

/* ---- start-up: open IndexedDB, take the newest copy of the work, then draw the app ---- */
var booted=false;
function boot(){ if(booted) return; booted=true;
  if(!window.initFeatures || !window.renderEvents){
    // a script did not arrive (a dropped connection, or an old copy): say so instead of failing quietly
    var n=document.getElementById('notice');
    if(n){ n.className='on warn'; n.innerHTML='<p><b>Part of the Case Builder did not load.</b> Your saved work is safe. Check your connection and reload the page.</p><div class="row"><button class="pri" onclick="location.reload()">Reload</button></div>'; }
    return;
  }
  initFeatures(); addSearch(); show('home'); restore(); iosTip(); keepStorage(); checkBackup(); registerSW(); }
function registerSW(){
  try{ if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function(){}); }catch(e){}
}
/* Start only after every script on the page has loaded (features.js comes after this file).
   The database can answer before a slow download finishes, so waiting here matters. */
function whenPageReady(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
whenPageReady(function(){
  setTimeout(boot, 3000); // never leave the page blank if IndexedDB hangs
  idbOpen().then(function(db){
    IDB=db; return db ? idbGet() : null;
  }).then(function(rec){
    if(booted) return;
    var fromIdb=null; try{ fromIdb=rec?JSON.parse(rec):null; }catch(e){}
    var ta=fromIdb&&fromIdb.meta&&fromIdb.meta.savedAt||'', tb=lsData&&lsData.meta&&lsData.meta.savedAt||'';
    if(fromIdb && (!lsData || ta>=tb)) D=Object.assign(blankD(), fromIdb);
    else if(IDB && lsData) idbChain=idbPut(JSON.stringify(D)); // first run: copy existing work into IndexedDB
  }).catch(function(){}).then(boot);
});
