/* Kickass Case Builder — court filings outside the Human Rights Bureau.
   District court: public records, open meetings, discrimination after the Bureau, Wrongful Discharge Act.
   Justice court: small claims, with a demand letter.
   Loaded after features.js. Drafts are kept in D.court. */

/* Montana judicial districts, § 3-5-101, MCA */
var MT_DISTRICTS={1:['Lewis and Clark','Broadwater'],2:['Silver Bow'],3:['Deer Lodge','Granite','Powell'],4:['Missoula','Mineral'],
 5:['Beaverhead','Jefferson','Madison'],6:['Park','Sweet Grass'],7:['Dawson','McCone','Richland','Prairie','Wibaux'],8:['Cascade'],
 9:['Teton','Pondera','Toole','Glacier'],10:['Fergus','Judith Basin','Petroleum'],11:['Flathead'],12:['Liberty','Hill','Chouteau'],
 13:['Yellowstone'],14:['Meagher','Wheatland','Golden Valley','Musselshell'],15:['Roosevelt','Daniels','Sheridan'],
 16:['Custer','Carter','Fallon','Powder River','Garfield','Treasure','Rosebud'],17:['Phillips','Blaine','Valley'],18:['Gallatin'],
 19:['Lincoln'],20:['Lake','Sanders'],21:['Ravalli'],22:['Stillwater','Carbon','Big Horn']};
var ORD=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth','Thirteenth',
 'Fourteenth','Fifteenth','Sixteenth','Seventeenth','Eighteenth','Nineteenth','Twentieth','Twenty-First','Twenty-Second'];
function districtOf(county){ for(var k in MT_DISTRICTS) if(MT_DISTRICTS[k].indexOf(county)>-1) return +k; return 0; }
function allCounties(){ var a=[]; for(var k in MT_DISTRICTS) a=a.concat(MT_DISTRICTS[k]); return a.sort(); }

/* ---------- the five filings ---------- */
var CT_TYPES={
 records:{icon:'▤',name:'Public records',title:'COMPLAINT TO ENFORCE THE RIGHT TO KNOW',p:'Plaintiff',r:'Defendant',court:'district',
   blurb:'An agency denied your records request, or a state agency did not answer in time.'},
 meetings:{icon:'⌂',name:'Open meeting',title:'PETITION TO VOID A DECISION MADE IN VIOLATION OF THE OPEN MEETING LAW',p:'Petitioner',r:'Respondent',court:'district',
   blurb:'A public body decided something behind a closed door or without proper notice.'},
 hrb:{icon:'☑',name:'Discrimination, after the Bureau',title:'COMPLAINT UNDER THE MONTANA HUMAN RIGHTS ACT',p:'Plaintiff',r:'Defendant',court:'district',
   blurb:'The Bureau has dismissed your complaint and you are taking it to district court.'},
 wdea:{icon:'⚖',name:'Wrongful discharge',title:'COMPLAINT UNDER THE WRONGFUL DISCHARGE FROM EMPLOYMENT ACT',p:'Plaintiff',r:'Defendant',court:'district',
   blurb:'You were fired without good cause, in retaliation, or against the employer’s own written policy.'},
 small:{icon:'¤',name:'Small claims',title:'SMALL CLAIMS COMPLAINT — STATEMENT OF CLAIM',p:'Plaintiff',r:'Defendant',court:'small',
   blurb:'Someone owes you $7,000 or less, or specific property.'}
};

/* what to know before filing: plain points, each code section cited once */
var CT_BEFORE={
 records:[
  ['Who it reaches','Public bodies: state agencies, cities, towns, counties, school districts and special districts. Not private employers.'],
  ['When you can file','When the agency denies your request in writing, or when a state agency misses its response deadline. Under § 2-6-1006, MCA, a state agency must acknowledge a request within 5 business days. A local government must answer in a timely manner.'],
  ['The law behind it','Article II, Section 9 of the Montana Constitution, and § 2-6-1009, MCA, which lets you file in district court. The court may award costs to a person who wins.'],
  ['Before you file','Keep a copy of your request, the date you sent it, and every reply. Attach them as exhibits.']],
 meetings:[
  ['The deadline','30 days from when you learned of the decision, or reasonably should have learned of it. The court may then declare the decision void under § 2-3-213, MCA.'],
  ['What counts','A meeting closed without a lawful reason under § 2-3-203, MCA, an item acted on that was not on the agenda, or a decision made in a closed session.'],
  ['Public participation','If the problem was that the public had no chance to comment, § 2-3-114, MCA, lets you petition to set the decision aside, also within 30 days.'],
  ['Evidence','The agenda, the minutes, the recording, and any notice of the meeting. Download them the day you find them.']],
 hrb:[
  ['The deadline','90 days from the date the Bureau issues its notice of dismissal, or from the final agency decision if you objected to the Commission. Miss it and the claim is barred, under §§ 49-2-511 and 49-2-512, MCA.'],
  ['When you can ask','The Bureau must dismiss the complaint if 12 months pass after filing with no hearing. You can then file in district court.'],
  ['Where to file','In the judicial district where the discrimination happened.'],
  ['The claims','Use the same claims you named before the Bureau. The court can award the relief in § 49-2-506, MCA, and may award fees and costs.']],
 wdea:[
  ['The deadline','1 year from the date you were fired, under § 39-2-911, MCA. An employer’s internal appeal pauses the clock, but adds no more than 120 days.'],
  ['Internal appeal first','If the employer has written appeal procedures and told you about them within 14 days of firing you, use them first. If they take more than 90 days, you may file.'],
  ['When it does not apply','If the firing was discrimination, the Human Rights Act is the route instead. It also does not cover union contracts or written contracts for a set term.'],
  ['Serve within 6 months','You must serve the employer within 6 months of filing, or the court dismisses the case.'],
  ['What you can recover','Lost wages and benefits for up to 4 years, under § 39-2-905, MCA, less what you earned or could have earned since. Not emotional distress.']],
 small:[
  ['The limit','$7,000 or less, under § 25-35-502, MCA. A counterclaim is limited to $6,500. You may file no more than 10 claims a year.'],
  ['Where to file','Justice court, small claims division, in the county where the defendant lives or can be served. Each court has its own complaint form. Copy your statement onto it.'],
  ['No lawyers','A party may have an attorney only if every party has one.'],
  ['Send a demand first','A written demand for payment by a set date, sent by certified mail, is not required but is recommended. Bring proof you sent it.'],
  ['After you file','The hearing must be within 40 days. The defendant must get at least 5 days’ notice. An appeal to district court is due within 10 days of judgment.']]
};

/* the questions for each filing: [key, label, kind, placeholder] */
var CT_FIELDS={
 records:[['agency','Agency or public body','text','City of Hamilton'],['reqdate','Date you made the request','date'],
  ['reqwhat','What you asked for','area','All emails between X and Y from January 1 to March 31, 2026…'],
  ['response','What happened','select',['They denied it in writing','They gave some records and withheld the rest','They did not answer']],
  ['respdate','Date of their denial or last reply','date'],['reasons','The reasons they gave, if any','area','Privacy, litigation, no records exist…'],
  ['ask','What you want the court to order','area','Release the records in their native format with metadata, and explain anything withheld.']],
 meetings:[['body','Public body','text','Hamilton City Council'],['mtgdate','Date of the meeting','date'],['learned','Date you learned of the decision','date'],
  ['decision','The decision you want voided','area','Approved the contract with…'],
  ['how','How the law was broken','checks',['The meeting was closed without a lawful reason','It was not on the published agenda','There was no proper notice','The decision was made in a closed session','The public had no chance to comment']]],
 hrb:[['hrbno','Bureau case number','text','HRB 260000'],['filed','Date you filed with the Bureau','date'],['dismissed','Date of the notice of dismissal','date'],
  ['claims','Your claims','area','Sex discrimination, hostile work environment, retaliation'],['relief','What you want','area','Back pay, reinstatement, a policy change…']],
 wdea:[['employer','Employer','text','The company or agency that employed you'],['hired','Date you started','date'],['fired','Date you were fired','date'],
  ['job','Your job','text','Position or title'],['probation','Probation','select',['I had finished my probation','I was still on probation','There was no probation period']],
  ['grounds','Why it was wrongful','checks',['It was retaliation for refusing to break the law or for reporting a violation','There was no good cause','The employer broke its own written personnel policy','It was for lawful speech']],
  ['appeal','Internal appeal','select',['The employer had no appeal procedure','I used the appeal procedure','I was never told about an appeal procedure']],
  ['appealdates','Dates of the internal appeal, if any','text','Started June 3, 2026; decision July 1, 2026'],['wages','Your pay and benefits','text','$22.50 an hour, 40 hours a week, health insurance']],
 small:[['amount','Amount you are claiming','text','$1,850'],['forwhat','What it is for','area','Unpaid invoice for photography work delivered on…'],
  ['when','When it became owed','date'],['demand','Date you sent a demand letter, if you did','date'],['county2','County where the defendant lives or can be served','county']]
};
var CT_FACTS_HINT={records:'What you asked for, when, and what they did.',meetings:'What happened at the meeting, and how you know.',
  hrb:'What happened, in date order. One fact each.',wdea:'What happened up to the firing, in date order.',small:'Why they owe you, in date order.'};

/* ---------- state ---------- */
var CT_CUR='', CT_MODE='filing';
function ctState(){ D.court=D.court||{drafts:{}}; D.court.drafts=D.court.drafts||{}; return D.court; }
function ctDraft(t){ var c=ctState(); c.me=c.me||{}; c.drafts[t]=c.drafts[t]||{f:{},facts:'',county:'',party:'',paddr:'',cause:'',verify:true,service:true,jury:false}; c.drafts[t].me=c.me; return c.drafts[t]; }
function ctPick(t){ CT_CUR=t; ctState().last=t; save(); renderCourt(); var w=$('ct-work'); if(w){ try{ w.scrollIntoView({block:'start'}); }catch(e){} } }
function ctSet(k,v){ var d=ctDraft(CT_CUR); if(k.indexOf('f.')===0) d.f[k.slice(2)]=v; else d[k]=v; save(); if(k==='county'||k==='f.dismissed'||k==='f.learned'||k==='f.fired'||k==='f.amount') renderCtStatus(); }
function ctToggle(key,opt){ var d=ctDraft(CT_CUR), a=d.f[key]=d.f[key]||[], i=a.indexOf(opt); if(i<0) a.push(opt); else a.splice(i,1); save(); }

/* ---------- deadlines for the dates page ---------- */
function courtDates(){
  var out=[], c=D.court&&D.court.drafts||{};
  if(c.meetings&&c.meetings.f.learned) out.push({key:'ct-oml',date:addDays(c.meetings.f.learned,30),label:'Open meeting petition: last day to file',
    detail:'30 days from when you learned of the decision ('+niceDate(c.meetings.f.learned)+').',kind:'urgent'});
  if(c.hrb&&c.hrb.f.dismissed) out.push({key:'ct-hrb',date:addDays(c.hrb.f.dismissed,90),label:'District court: last day to file after the Bureau',
    detail:'90 days from the notice of dismissal ('+niceDate(c.hrb.f.dismissed)+').',kind:'urgent'});
  if(c.wdea&&c.wdea.f.fired) out.push({key:'ct-wdea',date:(window.addYears?addYears(c.wdea.f.fired,1):addDays(c.wdea.f.fired,365)),label:'Wrongful discharge: last day to file',
    detail:'1 year from the firing ('+niceDate(c.wdea.f.fired)+'). An internal appeal can add up to 120 days.',kind:'file'});
  return out;
}

/* ---------- the page ---------- */
function ctInput(key,label,kind,ph,val){
  var id='ct-'+key.replace(/\W/g,'');
  if(kind==='area') return '<label class="fl" for="'+id+'">'+label+'</label><textarea id="'+id+'" placeholder="'+esc(ph||'')+'" oninput="ctSet(\'f.'+key+'\',this.value)">'+esc(val||'')+'</textarea>';
  if(kind==='date') return '<label class="fl" for="'+id+'">'+label+'</label><input type="date" id="'+id+'" value="'+esc(val||'')+'" onchange="ctSet(\'f.'+key+'\',this.value)">';
  if(kind==='select') return '<label class="fl" for="'+id+'">'+label+'</label><select id="'+id+'" onchange="ctSet(\'f.'+key+'\',this.value)">'+
    ['<option value="">Choose one</option>'].concat(ph.map(function(o){ return '<option'+(val===o?' selected':'')+'>'+esc(o)+'</option>'; })).join('')+'</select>';
  if(kind==='checks') return '<div class="fl">'+label+'</div>'+ph.map(function(o,i){ return '<label class="rbchk"><input type="checkbox"'+((val||[]).indexOf(o)>-1?' checked':'')+
    ' onchange="ctToggle(\''+key+'\','+i+')"><span>'+esc(o)+'</span></label>'; }).join('');
  if(kind==='county') return '<label class="fl" for="'+id+'">'+label+'</label><select id="'+id+'" onchange="ctSet(\'f.'+key+'\',this.value)"><option value="">Choose a county</option>'+
    allCounties().map(function(c){ return '<option'+(val===c?' selected':'')+'>'+c+'</option>'; }).join('')+'</select>';
  return '<label class="fl" for="'+id+'">'+label+'</label><input type="text" id="'+id+'" value="'+esc(val||'')+'" placeholder="'+esc(ph||'')+'" oninput="ctSet(\'f.'+key+'\',this.value)">';
}
/* checkbox answers are stored as the option text */
var _ctToggle=ctToggle;
ctToggle=function(key,i){ var spec=(CT_FIELDS[CT_CUR]||[]).filter(function(x){return x[0]===key;})[0]; _ctToggle(key,spec?spec[3][i]:i); };

function renderCourt(){
  var box=$('ct-list'); if(!box) return;
  var cur=CT_CUR||ctState().last||'';
  CT_CUR=cur;
  box.innerHTML='<div class="ctpick">'+Object.keys(CT_TYPES).map(function(k){ var t=CT_TYPES[k];
    return '<button type="button" class="tool'+(k===cur?' on':'')+'" onclick="ctPick(\''+k+'\')"><span class="ticon">'+t.icon+'</span><span class="ttext"><b>'+esc(t.name)+'</b><span>'+esc(t.blurb)+'</span></span></button>'; }).join('')+'</div>';
  var w=$('ct-work'); if(!w) return;
  if(!cur){ w.innerHTML=''; return; }
  var T=CT_TYPES[cur], d=ctDraft(cur), c=D.complaint||{};
  var me=d.me; ['name','addr','phone','email'].forEach(function(k){ if(!me[k] && c['cp-'+k]) me[k]=c['cp-'+k]; });
  var h='';
  h+='<div id="ct-status-list"></div>';
  h+='<details class="learn ctbefore" open><summary>Before you file</summary><div class="lb">'+CT_BEFORE[cur].map(function(x){
     return '<p class="gterm"><b>'+esc(x[0])+'.</b> '+esc(x[1])+'</p>'; }).join('')+'</div></details>';
  h+='<div class="card"><h3 style="margin-top:0">You</h3>'+
    ['name','addr','phone','email'].map(function(k){ var L={name:'Full name',addr:'Mailing address',phone:'Telephone',email:'Email'}[k];
      return '<label class="fl" for="ct-me-'+k+'">'+L+'</label><input type="text" id="ct-me-'+k+'" value="'+esc(me[k]||'')+'" oninput="ctDraft(CT_CUR).me.'+k+'=this.value;save()">'; }).join('')+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">The court and the other side</h3>';
  if(T.court==='district') h+='<label class="fl" for="ct-county">County where you are filing</label><select id="ct-county" onchange="ctSet(\'county\',this.value)"><option value="">Choose a county</option>'+
    allCounties().map(function(x){ return '<option'+(d.county===x?' selected':'')+'>'+x+'</option>'; }).join('')+'</select><div id="ct-courtname" class="note"></div>';
  h+='<label class="fl" for="ct-party">'+T.r+' &mdash; the correct legal name</label><input type="text" id="ct-party" value="'+esc(d.party)+'" oninput="ctSet(\'party\',this.value)" placeholder="City of Hamilton, a Montana municipality">'+
    '<label class="fl" for="ct-paddr">'+T.r+'&rsquo;s address</label><input type="text" id="ct-paddr" value="'+esc(d.paddr)+'" oninput="ctSet(\'paddr\',this.value)">'+
    (T.court==='district'?'<label class="fl" for="ct-cause">Cause number, if you already have one</label><input type="text" id="ct-cause" value="'+esc(d.cause)+'" oninput="ctSet(\'cause\',this.value)" placeholder="Left blank for the clerk on a new filing">':'')+
    '</div>';
  h+='<div class="card"><h3 style="margin-top:0">The details</h3>'+CT_FIELDS[cur].map(function(x){ return ctInput(x[0],x[1],x[2],x[3],d.f[x[0]]); }).join('')+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">What happened</h3><p class="note">'+CT_FACTS_HINT[cur]+' Leave a blank line between facts. Each one becomes a numbered paragraph.</p>'+
    '<textarea id="ct-facts" style="min-height:160px" oninput="ctSet(\'facts\',this.value)">'+esc(d.facts)+'</textarea>'+
    (D.events.length?'<div class="row"><button class="sec" onclick="ctPullChron()">Add facts from my chronology</button></div>':'')+'</div>';
  if(T.court==='district') h+='<div class="card"><h3 style="margin-top:0">Include</h3>'+
    '<label class="rbchk"><input type="checkbox"'+(d.verify?' checked':'')+' onchange="ctSet(\'verify\',this.checked)"><span>A declaration that the facts are true, signed under penalty of perjury</span></label>'+
    '<label class="rbchk"><input type="checkbox"'+(d.service?' checked':'')+' onchange="ctSet(\'service\',this.checked)"><span>A certificate of service, for papers you send to the other side after the first filing</span></label>'+
    ((cur==='hrb'||cur==='wdea')?'<label class="rbchk"><input type="checkbox"'+(d.jury?' checked':'')+' onchange="ctSet(\'jury\',this.checked)"><span>A demand for a jury trial</span></label>':'')+'</div>';
  h+='<div class="row"><button class="pri" onclick="ctBuild()">Build the filing</button>'+
    (cur==='small'?'<button class="sec" onclick="ctDemand()">Write a demand letter</button>':'')+'</div>'+
    '<div id="ct-outwrap" class="card" style="display:none"><label class="fl" for="ct-out">Your filing &mdash; check every line before you sign it</label>'+
    '<textarea id="ct-out" style="min-height:300px"></textarea><div class="row"><button class="pri" onclick="ctPrint()">Print or save as PDF</button>'+
    '<button class="sec" onclick="copyOut(\'ct-out\')">Copy the text</button></div></div><div id="ct-print" class="printout" style="display:none"></div>';
  w.innerHTML=h;
  renderCtStatus();
}
function renderCtStatus(){
  var cur=CT_CUR, d=ctDraft(cur), box=$('ct-status-list'); if(!box) return;
  var cn=$('ct-courtname'); if(cn) cn.textContent= d.county? courtTitle(cur,d) : '';
  var msg='', cls='';
  var due=null, label='';
  if(cur==='meetings'&&d.f.learned){ due=addDays(d.f.learned,30); label='Last day to file'; }
  if(cur==='hrb'&&d.f.dismissed){ due=addDays(d.f.dismissed,90); label='Last day to file'; }
  if(cur==='wdea'&&d.f.fired){ due=(window.addYears?addYears(d.f.fired,1):addDays(d.f.fired,365)); label='Last day to file, before any appeal time'; }
  if(due){ var left=daysBetween(todayISO(),due); cls=left<0?'bad':(left<=14?'warn':'');
    msg='<b>'+(left<0?'Passed':dayWord(left)+' left')+'</b><span>'+label+': '+esc(niceDate(due))+'</span>'; }
  if(cur==='small'&&d.f.amount){ var n=parseFloat(String(d.f.amount).replace(/[^0-9.]/g,''));
    if(n>7000){ cls='bad'; msg='<b>Over $7,000</b><span>Small claims cannot hear it. Use justice court or district court instead, or ask the clerk.</span>'; } }
  box.innerHTML= msg? '<div class="big '+cls+'">'+msg+'</div>' : '';
}
function ctPullChron(){
  var t=$('ct-facts'), add=D.events.map(function(e){ return 'On '+niceDate(e.d)+', '+e.w.replace(/\.$/,'')+'.'; }).join('\n\n');
  t.value=(t.value.trim()?t.value.trim()+'\n\n':'')+add; ctSet('facts',t.value);
}

/* ---------- building the document ---------- */
function courtTitle(t,d){
  if(CT_TYPES[t].court==='small'){ var c=d.f.county2||d.county; return 'IN THE JUSTICE COURT OF '+(c?c.toUpperCase():'[COUNTY]')+' COUNTY, STATE OF MONTANA — SMALL CLAIMS DIVISION'; }
  var n=districtOf(d.county);
  return 'MONTANA '+(n?ORD[n].toUpperCase():'[NUMBER]')+' JUDICIAL DISTRICT COURT, '+(d.county?d.county.toUpperCase():'[COUNTY]')+' COUNTY';
}
function ctParas(text){ return String(text||'').replace(/\r/g,'').split(/\n\s*\n/).map(function(p){ return p.replace(/\s*\n\s*/g,' ').trim(); }).filter(Boolean); }
function ctBody(t,d){
  var f=d.f, me=d.me, P=CT_TYPES[t].p, R=CT_TYPES[t].r, party=d.party? d.party.split(',')[0].trim() : '['+R.toLowerCase()+']', county=d.county||f.county2||'[county]';
  var S=[];   // [heading, [paragraphs]]
  var facts=ctParas(d.facts);
  if(t==='records'){
    S.push(['PARTIES',[ (me.name||'[Your name]')+' is a person who requested public records from '+party+'.',
      party+' is a public agency subject to Article II, Section 9 of the Montana Constitution.']]);
    S.push(['JURISDICTION AND VENUE',['This Court has jurisdiction under Article II, Section 9 of the Montana Constitution and § 2-6-1009, MCA.',
      'Venue is proper in '+county+' County because '+party+' is located there and holds the records.']]);
    var fx=[];
    if(f.reqdate) fx.push('On '+niceDate(f.reqdate)+', '+P+' asked '+party+' in writing for the following records: '+(f.reqwhat||'[records requested]')+'.');
    if(f.response==='They denied it in writing') fx.push((f.respdate?'On '+niceDate(f.respdate)+', ':'')+party+' denied the request in writing.'+(f.reasons?' The reasons given were: '+f.reasons+'.':''));
    if(f.response==='They gave some records and withheld the rest') fx.push((f.respdate?'On '+niceDate(f.respdate)+', ':'')+party+' produced some records and withheld the rest.'+(f.reasons?' The reasons given were: '+f.reasons+'.':''));
    if(f.response==='They did not answer') fx.push(party+' did not respond to the request'+(f.respdate?' as of '+niceDate(f.respdate):'')+'.');
    S.push(['FACTS',fx.concat(facts)]);
    S.push(['CLAIM',['The records requested are documents of a public body. No individual privacy interest clearly exceeds the merits of public disclosure for the records withheld.',
      P+' has been denied the right to examine public documents guaranteed by Article II, Section 9 of the Montana Constitution.']]);
    S.push(['RELIEF REQUESTED',[P+' asks the Court to:',
      'A. Declare that the records are public documents that '+P+' has the right to examine;',
      'B. Order '+party+' to provide the records'+(f.ask?': '+f.ask.replace(/\.$/,''):' in their native electronic format with metadata intact')+';',
      'C. Award '+P+' costs under § 2-6-1009, MCA; and','D. Grant any other relief the Court finds just.']]);
  }
  if(t==='meetings'){
    var how=f.how||[];
    S.push(['PARTIES',[(me.name||'[Your name]')+' is a member of the public.',party+' is a public body subject to the open meeting law, Title 2, Chapter 3, Part 2, MCA.']]);
    S.push(['JURISDICTION AND VENUE',['This Court has jurisdiction under § 2-3-213, MCA'+(how.indexOf('The public had no chance to comment')>-1?', and § 2-3-114, MCA':'')+'.',
      'Venue is proper in '+county+' County because the meeting took place there.']]);
    var fx2=[];
    if(f.mtgdate) fx2.push('On '+niceDate(f.mtgdate)+', '+party+' held a meeting.');
    if(f.decision) fx2.push('At or after that meeting, '+party+' made this decision: '+f.decision.replace(/\.$/,'')+'.');
    how.forEach(function(h){ fx2.push(h+'.'); });
    if(f.learned) fx2.push(P+' learned of the decision on '+niceDate(f.learned)+'. This petition is filed within 30 days of that date.');
    S.push(['FACTS',fx2.concat(facts)]);
    S.push(['CLAIM',['The decision was made in violation of § 2-3-203, MCA, and may be declared void under § 2-3-213, MCA.']]);
    S.push(['RELIEF REQUESTED',[P+' asks the Court to:','A. Declare the decision void;','B. Award '+P+' costs under § 2-3-221, MCA; and','C. Grant any other relief the Court finds just.']]);
  }
  if(t==='hrb'){
    S.push(['PARTIES',[(me.name||'[Your name]')+' filed a complaint with the Montana Human Rights Bureau'+(f.hrbno?', Case No. '+f.hrbno:'')+(f.filed?', on '+niceDate(f.filed):'')+'.',
      party+' is the respondent named in that complaint.']]);
    S.push(['JURISDICTION AND VENUE',['The Department of Labor and Industry issued its notice of dismissal'+(f.dismissed?' on '+niceDate(f.dismissed):'')+'. This action is filed within the 90 days allowed by §§ 49-2-511 and 49-2-512, MCA.',
      'Venue is proper in this district because the discrimination occurred in '+county+' County.']]);
    S.push(['FACTS',facts.length?facts:['[What happened, in date order.]']]);
    S.push(['CLAIMS',[(f.claims||'[Name every claim]')+', in violation of the Montana Human Rights Act, Title 49, Chapter 2, MCA.']]);
    S.push(['RELIEF REQUESTED',[P+' asks the Court to:','A. '+(f.relief?f.relief.replace(/\.$/,''):'Award the relief available under § 49-2-506, MCA')+';','B. Award '+P+' costs; and','C. Grant any other relief the Court finds just.']]);
  }
  if(t==='wdea'){
    var g=f.grounds||[], map={'It was retaliation for refusing to break the law or for reporting a violation':'(1)(a)','There was no good cause':'(1)(b)',
      'The employer broke its own written personnel policy':'(1)(c)','It was for lawful speech':'(1)(d)'};
    S.push(['PARTIES',[(me.name||'[Your name]')+' was employed by '+party+(f.job?' as '+f.job:'')+(f.hired?' from '+niceDate(f.hired):'')+(f.fired?' until '+niceDate(f.fired):'')+'.',
      party+' was '+P+'’s employer.']]);
    S.push(['JURISDICTION AND VENUE',['This Court has jurisdiction under the Wrongful Discharge from Employment Act, Title 39, Chapter 2, Part 9, MCA.',
      'This action is filed within one year of the discharge, as § 39-2-911, MCA, requires.'+(f.appeal==='I used the appeal procedure'?' The time spent in the employer’s internal appeal'+(f.appealdates?' ('+f.appealdates+')':'')+' is not counted.':''),
      'Venue is proper in '+county+' County because '+P+' worked there.']]);
    var fx3=[]; if(f.fired) fx3.push('On '+niceDate(f.fired)+', '+party+' discharged '+P+'.');
    if(f.probation==='I had finished my probation') fx3.push(P+' had completed the employer’s probationary period.');
    if(f.appeal==='I was never told about an appeal procedure') fx3.push(party+' did not notify '+P+' of any internal appeal procedure within 14 days of the discharge.');
    if(f.wages) fx3.push('At the time of discharge, '+P+'’s pay and benefits were: '+f.wages.replace(/\.$/,'')+'.');
    S.push(['FACTS',fx3.concat(facts)]);
    S.push(['CLAIM',[ g.length? 'The discharge was wrongful under § 39-2-904'+g.map(function(x){return map[x];}).join(', ')+', MCA: '+g.map(function(x){return x.charAt(0).toLowerCase()+x.slice(1);}).join('; ')+'.'
      : 'The discharge was wrongful under § 39-2-904, MCA. [Say which part.]']]);
    S.push(['RELIEF REQUESTED',[P+' asks the Court to:','A. Award lost wages and fringe benefits under § 39-2-905, MCA, with interest;','B. Award '+P+' costs; and','C. Grant any other relief the Court finds just.']]);
  }
  if(t==='small'){
    S.push(['CLAIM',[party+' owes '+(me.name||'[Your name]')+' '+(f.amount||'[amount]')+(f.forwhat?' for '+f.forwhat.replace(/\.$/,''):'')+'.',
      (f.when?'The amount became due on '+niceDate(f.when)+'. ':'')+(f.demand?'A written demand for payment was sent on '+niceDate(f.demand)+'. ':'')+'It has not been paid.']]);
    S.push(['FACTS',facts.length?facts:['[Why they owe you, in date order.]']]);
    S.push(['RELIEF REQUESTED',[(me.name||'[Your name]')+' asks for judgment of '+(f.amount||'[amount]')+', plus court costs.']]);
  }
  return S;
}
function ctText(){
  var t=CT_CUR, d=ctDraft(t), T=CT_TYPES[t], me=d.me, out=[];
  out.push([me.name||'[Your name]',me.addr||'[Mailing address]',me.phone||'[Telephone]',me.email||''].filter(Boolean).join('\n')+'\nSelf-Represented '+T.p);
  out.push(courtTitle(t,d));
  out.push((me.name||'[Your name]').toUpperCase()+',\n          '+T.p+',\nv.\n'+(d.party||'['+T.r.toUpperCase()+']').toUpperCase()+',\n          '+T.r+'.');
  out.push((T.court==='district'?'Cause No. '+(d.cause||'__________')+'\n':'')+T.title);
  var n=0;
  ctBody(t,d).forEach(function(s){ out.push(s[0]); s[1].forEach(function(p){ if(/^[A-D]\. /.test(p)||/asks (the Court|for judgment)/.test(p)&&s[0]==='RELIEF REQUESTED'&&!/^\d/.test(p)) out.push(p); else { n++; out.push(n+'. '+p); } }); });
  if(d.jury&&(t==='hrb'||t==='wdea')) out.push('DEMAND FOR JURY TRIAL\n'+T.p+' demands a trial by jury on all issues so triable.');
  if(T.court==='district'&&d.verify) out.push('DECLARATION\nI declare under penalty of perjury under the laws of the State of Montana that the facts stated above are true and correct.');
  out.push('DATED this ____ day of ______________, 20___.\n\n______________________________\n'+(me.name||'[Your name]')+'\nSelf-Represented '+T.p);
  if(T.court==='district'&&d.service) out.push('CERTIFICATE OF SERVICE\nI certify that on ______________, 20___, I served a true copy of this document on '+(d.party||'['+T.r+']')+' at '+(d.paddr||'[address]')+' by [mail / email / hand delivery].\n\n______________________________\n'+(me.name||'[Your name]'));
  return out.join('\n\n');
}
function ctBuild(){
  var d=ctDraft(CT_CUR);
  if(CT_TYPES[CT_CUR].court==='district' && !d.county){ alert('Choose the county where you are filing.'); return; }
  if(!d.party){ alert('Enter the correct legal name of the '+CT_TYPES[CT_CUR].r.toLowerCase()+'.'); return; }
  CT_MODE='filing'; $('ct-out').value=ctText(); $('ct-outwrap').style.display='block';
  try{ $('ct-outwrap').scrollIntoView({block:'start'}); }catch(e){}
}
/* pleading layout for print: party block, court title, caption box, numbered body */
function ctPrint(){
  var t=CT_CUR, d=ctDraft(t), T=CT_TYPES[t], me=d.me;
  var txt=($('ct-out').value||'').trim(); if(!txt){ alert('Build the filing first.'); return; }
  var blocks=txt.split(/\n\s*\n/), html='';
  if(CT_MODE==='letter'){
    $('ct-print').innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\'ct-print\')">Print again</button>'+
      '<button class="sec" onclick="closePrint(\'ct-print\')">Close</button></div><div class="letter">'+
      blocks.map(function(b){ return '<p>'+esc(b).replace(/\n/g,'<br>')+'</p>'; }).join('')+'</div>';
    showPrintView('ct-print'); return;
  }
  // the first four blocks are the header; the rest is the body as edited
  var head=blocks.slice(0,4), body=blocks.slice(4);
  html+='<div class="plparty">'+esc(head[0]||'').replace(/\n/g,'<br>')+'</div>';
  html+='<div class="plcourt">'+esc(head[1]||'')+'</div>';
  html+='<table class="plcap"><tr><td class="plcl">'+esc(head[2]||'').replace(/\n\s{4,}/g,'<br>&emsp;&emsp;&emsp;').replace(/\n/g,'<br>')+'</td><td class="plcr">'+esc(head[3]||'').replace(/\n/g,'<br>')+'</td></tr></table>';
  html+=body.map(function(b){
    var e=esc(b).replace(/\n/g,'<br>');
    if(/^[A-Z][A-Z ,’'\-]+$/.test(b.split('\n')[0]) && b.split('\n')[0].length<60){
      var lines=b.split('\n'); return '<h4 class="plh">'+esc(lines[0])+'</h4>'+(lines.length>1?'<p class="plp">'+esc(lines.slice(1).join('\n')).replace(/\n/g,'<br>')+'</p>':'');
    }
    if(/^DATED this/.test(b)) return '<div class="plsig">'+e+'</div>';
    return '<p class="plp">'+e+'</p>';
  }).join('');
  $('ct-print').innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\'ct-print\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\'ct-print\')">Close</button></div>'+
    '<div class="pvhint noprint">Laid out to the district court rules: letter-size paper, one side, 1.5 spacing, and the top right of the first page left clear for the clerk. Choose Save as PDF in the print window to keep a copy.</div>'+
    '<div class="pleading">'+html+'</div>';
  showPrintView('ct-print');
}
function ctDemand(){
  var d=ctDraft('small'), me=d.me, f=d.f;
  var due=addDays(todayISO(),14);
  var t=[me.name||'[Your name]',me.addr||'[Your address]',me.phone||'',me.email||''].filter(Boolean).join('\n')+'\n\n'+pdate()+'\n\n'+
    (d.party||'[Name]')+'\n'+(d.paddr||'[Address]')+'\n\nRE: Demand for payment of '+(f.amount||'[amount]')+'\n\n'+
    'You owe me '+(f.amount||'[amount]')+(f.forwhat?' for '+f.forwhat.replace(/\.$/,''):'')+'.'+(f.when?' It was due on '+niceDate(f.when)+'.':'')+'\n\n'+
    'Please pay the full amount by '+niceDate(due)+'. If it is not paid by then, I will file a claim in small claims court.\n\n'+
    'Sincerely,\n\n'+(me.name||'[Your name]');
  CT_MODE='letter'; $('ct-out').value=t; $('ct-outwrap').style.display='block';
  try{ $('ct-outwrap').scrollIntoView({block:'start'}); }catch(e){}
}

/* ---------- start-up ---------- */
function initCourt(){
  addView('court','Court filings','Draft filings for district court and small claims, outside the Human Rights Bureau.',
    '<div class="card ctool"><h3 style="margin-top:0">What are you filing?</h3><div id="ct-list"></div></div><div id="ct-work"></div>');
  addMenuLink('records','court','Court filings','▧');
  var _all=allDates; window.allDates=function(){ var a=_all().concat(courtDates()); a.sort(function(x,y){ return x.date<y.date?-1:(x.date>y.date?1:0); }); return a; };
  var _sh=window.show; window.show=function(id){ _sh(id); if(id==='court') renderCourt(); };
  renderCourt();
}
