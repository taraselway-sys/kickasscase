/* Kickass Case Builder — family court: a proposed parenting plan, and a proposed decree of dissolution.
   Two pages of their own. Montana district court. Drafts are kept in D.family. Loaded after court.js. */

function famState(){ D.family=D.family||{}; D.family.pp=D.family.pp||{kids:[{}],hol:{}}; D.family.dd=D.family.dd||{prop:[{}],debt:[{}]}; return D.family; }
function famSet(page,k,v){ famState()[page][k]=v; save(); if(k==='county') famCourtName(page); }

/* ---------- shared pieces ---------- */
function famInput(page,key,label,kind,opts,ph){
  var v=famState()[page][key]||'', id='fm-'+page+'-'+key;
  var on="famSet('"+page+"','"+key+"',this.";
  if(kind==='area') return '<label class="fl" for="'+id+'">'+label+'</label><textarea id="'+id+'" placeholder="'+esc(ph||'')+'" oninput="'+on+'value)">'+esc(v)+'</textarea>';
  if(kind==='date') return '<label class="fl" for="'+id+'">'+label+'</label><input type="date" id="'+id+'" value="'+esc(v)+'" onchange="'+on+'value)">';
  if(kind==='select') return '<label class="fl" for="'+id+'">'+label+'</label><select id="'+id+'" onchange="'+on+'value)"><option value="">Choose one</option>'+
    opts.map(function(o){ return '<option'+(v===o?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select>';
  if(kind==='check') return '<label class="rbchk"><input type="checkbox" id="'+id+'"'+(v?' checked':'')+' onchange="'+on+'checked)"><span>'+label+'</span></label>';
  if(kind==='county') return '<label class="fl" for="'+id+'">'+label+'</label><select id="'+id+'" onchange="'+on+'value)"><option value="">Choose a county</option>'+
    allCounties().map(function(c){ return '<option'+(v===c?' selected':'')+'>'+c+'</option>'; }).join('')+'</select><div class="note" id="fm-'+page+'-court"></div>';
  return '<label class="fl" for="'+id+'">'+label+'</label><input type="text" id="'+id+'" value="'+esc(v)+'" placeholder="'+esc(ph||'')+'" oninput="'+on+'value)">';
}
function famCourt(c){ var n=districtOf(c); return 'MONTANA '+(n?ORD[n].toUpperCase():'[NUMBER]')+' JUDICIAL DISTRICT COURT, '+(c?c.toUpperCase():'[COUNTY]')+' COUNTY'; }
function famCourtName(page){ var el=$('fm-'+page+'-court'), c=famState()[page].county; if(el) el.textContent=c?famCourt(c):''; }
function famBefore(points){
  return '<details class="learn ctbefore" open><summary>Before you file</summary><div class="lb">'+points.map(function(x){
    return '<p class="gterm"><b>'+esc(x[0])+'.</b> '+esc(x[1])+'</p>'; }).join('')+'</div></details>';
}
function famParty(s){ return [s.myname||'[Your name]',s.myaddr||'[Mailing address]',s.myphone||'[Telephone]',s.myemail||''].filter(Boolean).join('\n')+'\nSelf-Represented '+(s.role||'Petitioner'); }
function famCaption(s,matter){
  var me=(s.myname||'[YOUR NAME]').toUpperCase(), them=(s.other||'[OTHER PARENT]').toUpperCase(), mine=s.role||'Petitioner', theirs=mine==='Petitioner'?'Respondent':'Petitioner';
  var p=mine==='Petitioner'?[me,them]:[them,me];
  return matter+'\n\n'+p[0]+',\n          Petitioner,\nand\n'+p[1]+',\n          Respondent.';
}
function famNum(sections){ var out=[], n=0; sections.forEach(function(s){ out.push(s[0]); s[1].forEach(function(p){ if(/^[A-Z]\. /.test(p)||p.indexOf('|')===0){ out.push(p.replace(/^\|/,'')); } else { n++; out.push(n+'. '+p); } }); }); return out; }
function famYou(page){
  return '<div class="card"><h3 style="margin-top:0">You and the other parent</h3>'+
    famInput(page,'myname','Your full name','text')+famInput(page,'myaddr','Your mailing address','text')+famInput(page,'myphone','Your telephone','text')+famInput(page,'myemail','Your email','text')+
    famInput(page,'role','You are the','select',['Petitioner','Respondent'])+
    famInput(page,'other',page==='pp'?'The other parent\u2019s full name':'Your spouse\u2019s full name','text')+
    famInput(page,'county','County where the case is filed','county')+
    famInput(page,'cause','Cause number, if the case is already open','text','')+'</div>';
}
function famOutput(page,label){
  return '<div class="row"><button class="pri" onclick="famBuild(\''+page+'\')">Build the '+label+'</button></div>'+
    '<div id="fm-'+page+'-outwrap" class="card" style="display:none"><label class="fl" for="fm-'+page+'-out">Your '+label+' \u2014 check every line before you sign it</label>'+
    '<textarea id="fm-'+page+'-out" style="min-height:300px"></textarea><div class="row"><button class="pri" onclick="famPrint(\''+page+'\')">Print or save as PDF</button>'+
    '<button class="sec" onclick="copyOut(\'fm-'+page+'-out\')">Copy the text</button></div></div><div id="fm-'+page+'-print" class="printout" style="display:none"></div>';
}
/* pleading layout: party block, court title, caption box, numbered body */
function famPrint(page){
  var txt=($('fm-'+page+'-out').value||'').trim(); if(!txt){ alert('Build it first.'); return; }
  var b=txt.split(/\n\s*\n/), head=b.slice(0,4), body=b.slice(4), tgt='fm-'+page+'-print';
  var cap=esc(head[2]||'').replace(/\n\s{4,}/g,'<br>&emsp;&emsp;&emsp;').replace(/\n/g,'<br>');
  var html='<div class="plparty">'+esc(head[0]||'').replace(/\n/g,'<br>')+'</div><div class="plcourt">'+esc(head[1]||'')+'</div>'+
    '<table class="plcap"><tr><td class="plcl">'+cap+'</td><td class="plcr">'+esc(head[3]||'').replace(/\n/g,'<br>')+'</td></tr></table>'+
    body.map(function(x){ var first=x.split('\n')[0];
      if(/^[A-Z][A-Z ,\u2019'\-&]+$/.test(first) && first.length<70){ var L=x.split('\n'); return '<h4 class="plh">'+esc(L[0])+'</h4>'+(L.length>1?'<p class="plp">'+esc(L.slice(1).join('\n')).replace(/\n/g,'<br>')+'</p>':''); }
      if(/^(DATED|Petitioner\u2019s signature|______)/.test(x)) return '<div class="plsig">'+esc(x).replace(/\n/g,'<br>')+'</div>';
      return '<p class="plp">'+esc(x).replace(/\n/g,'<br>')+'</p>'; }).join('');
  $(tgt).innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\''+tgt+'\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\''+tgt+'\')">Close</button></div>'+
    '<div class="pvhint noprint">Laid out to the district court rules. Choose Save as PDF in the print window to keep a copy.</div><div class="pleading">'+html+'</div>';
  showPrintView(tgt);
}
function famBuild(page){
  var s=famState()[page];
  if(!s.county){ alert('Choose the county where the case is filed.'); return; }
  if(!s.myname||!s.other){ alert('Enter both full names.'); return; }
  $('fm-'+page+'-out').value= page==='pp'? ppText() : ddText();
  $('fm-'+page+'-outwrap').style.display='block';
  try{ $('fm-'+page+'-outwrap').scrollIntoView({block:'start'}); }catch(e){}
}

/* ================= parenting plan ================= */
var PP_SCHED=['Week on, week off','2-2-3 (alternating two days, two days, three days)','Every other weekend with Parent B, plus one weeknight','Every other weekend with Parent A, plus one weeknight','Something else (describe below)'];
var PP_HOL=['Thanksgiving','Christmas Eve','Christmas Day','New Year\u2019s','Easter','Spring break','Mother\u2019s Day','Father\u2019s Day','Fourth of July','Halloween','The child\u2019s birthday'];
var PP_HOLOPT=['Alternate every year','Always with Parent A','Always with Parent B','Split the day','Follow the regular schedule'];
var PP_DEC=['Joint: both parents decide together','Parent A decides after talking with Parent B','Parent B decides after talking with Parent A'];
function ppKids(){
  var s=famState().pp;
  return s.kids.map(function(k,i){
    return '<div class="kidrow"><input type="text" placeholder="Child\u2019s full name" value="'+esc(k.n||'')+'" oninput="ppKid('+i+',\'n\',this.value)">'+
      '<input type="date" aria-label="Date of birth" value="'+esc(k.b||'')+'" onchange="ppKid('+i+',\'b\',this.value)">'+
      (s.kids.length>1?'<button type="button" class="ilink del" onclick="ppKidDel('+i+')">remove</button>':'')+'</div>';
  }).join('')+'<button type="button" class="sec" onclick="ppKidAdd()">Add a child</button>';
}
function ppKid(i,k,v){ famState().pp.kids[i][k]=v; save(); }
function ppKidAdd(){ famState().pp.kids.push({}); save(); $('pp-kids').innerHTML=ppKids(); }
function ppKidDel(i){ famState().pp.kids.splice(i,1); save(); $('pp-kids').innerHTML=ppKids(); }
function ppHol(h,v){ famState().pp.hol[h]=v; save(); }
function renderParenting(){
  var box=$('pp-work'); if(!box) return; var s=famState().pp, c=D.complaint||{};
  if(!s.myname && c['cp-name']) s.myname=c['cp-name'];
  var h=famBefore([
    ['Who can file','Either parent, or both together. The child must usually have lived in Montana for 6 months first.'],
    ['What the court decides by','The child\u2019s best interests. The court presumes frequent, continuing contact with both parents is best, unless that would harm the child. Section 40-4-212, MCA lists what it weighs.'],
    ['What a plan covers','Where the child lives and when, holidays, who makes major decisions, money for the child, and how you settle disagreements. Section 40-4-234, MCA sets out what a plan can include.'],
    ['After you file','The other parent has 21 days after being served to answer. The court often orders mediation, unless there has been abuse. Tell the court if there has.'],
    ['Child support','Support is set by the state guidelines. Each parent files a Child Support Guidelines Financial Affidavit with pay stubs. The state\u2019s online calculator helps.'],
    ['Use the court\u2019s forms','Montana\u2019s self-help forms and MontanaLawHelp.org have the official parenting plan forms. This page drafts your plan so you can copy it onto them, or file it as your proposed plan if your clerk accepts a typed one.']]);
  h+=famYou('pp');
  h+='<div class="card"><h3 style="margin-top:0">The children</h3><div id="pp-kids">'+ppKids()+'</div>'+
    '<p class="note" style="margin-top:10px">In the plan, Parent A is you and Parent B is the other parent.</p></div>';
  h+='<div class="card"><h3 style="margin-top:0">The regular schedule</h3>'+famInput('pp','sched','Where the children live during the school year','select',PP_SCHED)+
    famInput('pp','schedx','Details: days, times, and when the week starts','area',null,'Exchanges happen Fridays at 5:00 p.m. The week starts Friday.')+
    famInput('pp','summer','Summer, if different','area',null,'Each parent has two uninterrupted weeks, with 30 days\u2019 notice.')+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">Holidays</h3><p class="note">Holidays come before the regular schedule. \u201cAlternate every year\u201d means Parent A has the holiday in even years and Parent B in odd years.</p>'+
    '<table class="holtab">'+PP_HOL.map(function(x){ var v=s.hol[x]||'';
      return '<tr><td>'+esc(x)+'</td><td><select aria-label="'+esc(x)+'" onchange="ppHol(\''+x.replace(/'/g,"\\'")+'\',this.value)"><option value="">Choose</option>'+
        PP_HOLOPT.map(function(o){ return '<option'+(v===o?' selected':'')+'>'+o+'</option>'; }).join('')+'</select></td></tr>'; }).join('')+'</table></div>';
  h+='<div class="card"><h3 style="margin-top:0">Major decisions</h3>'+famInput('pp','decEdu','School and education','select',PP_DEC)+
    famInput('pp','decHealth','Health care, except emergencies','select',PP_DEC)+famInput('pp','decRel','Religious upbringing','select',PP_DEC)+
    '<p class="note">Each parent makes day-to-day decisions while the children are with them, and either parent can act in an emergency.</p></div>';
  h+='<div class="card"><h3 style="margin-top:0">Exchanges and contact</h3>'+famInput('pp','xloc','Where exchanges happen','text','The school, or the front of each parent\u2019s home')+
    famInput('pp','xwho','Who drives','select',['The parent starting their time picks up','The parent ending their time drops off','Each parent drives one way'])+
    famInput('pp','calls','Calls and video with the other parent','area',null,'The children may call either parent at any reasonable time. The other parent may call each evening between 6:00 and 7:30 p.m.')+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">Money for the children</h3>'+famInput('pp','csAmt','Child support per month, from the guidelines worksheet','text','$')+
    famInput('pp','csPayer','Paid by','select',['Parent A','Parent B','Neither: support is not ordered at this time'])+
    famInput('pp','ins','Health insurance for the children is carried by','select',['Parent A','Parent B','Both parents'])+
    famInput('pp','uncov','Uncovered medical, dental and vision costs are split','select',['50/50','In proportion to income, as in the guidelines','Paid by Parent A','Paid by Parent B'])+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">Disagreements and changes</h3>'+famInput('pp','mediate','Before going back to court, the parents will try mediation','check')+
    famInput('pp','safety','There has been abuse or violence, so mediation is not safe','check')+
    famInput('pp','extra','Anything else the parents agree on','area',null,'Neither parent will speak badly of the other in front of the children.')+'</div>';
  h+=famOutput('pp','parenting plan');
  box.innerHTML=h; famCourtName('pp');
}
function ppWho(v){ return String(v||'').replace(/Parent A/g,'Parent A ('+(famState().pp.myname||'Parent A').split(' ')[0]+')').replace(/Parent B/g,'Parent B ('+(famState().pp.other||'Parent B').split(' ')[0]+')'); }
function ppText(){
  var s=famState().pp, kids=s.kids.filter(function(k){ return k.n; });
  var kn=kids.length? kids.map(function(k){ return k.n+(k.b?', born '+niceDate(k.b):''); }) : ['[child\u2019s name], born [date]'];
  var A=s.myname||'Parent A', B=s.other||'Parent B';
  var out=[famParty(s), famCourt(s.county), famCaption(s,'IN RE THE PARENTING OF:\n'+kids.map(function(k){return k.n.toUpperCase();}).join(',\n')+(kids.length?',':'[CHILD]')+'\nMinor child'+(kids.length===1?'':'ren')+','), 'Cause No. '+(s.cause||'__________')+'\nPROPOSED FINAL PARENTING PLAN'];
  var sec=[];
  sec.push(['THE PARENTS AND CHILDREN',['This parenting plan is proposed under \u00a7 40-4-234, MCA, and is in the best interests of the child'+(kids.length===1?'':'ren')+'.',
    'Parent A is '+A+'. Parent B is '+B+'.','The child'+(kids.length===1?' is':'ren are')+': '+kn.join('; ')+'.']]);
  var rs=[]; if(s.sched) rs.push('During the school year, the children live with the parents on this schedule: '+ppWho(s.sched).replace(/ \(describe below\)/,'')+'.');
  if(s.schedx) rs.push(s.schedx.replace(/\s*\n\s*/g,' ')); if(s.summer) rs.push('Summer: '+s.summer.replace(/\s*\n\s*/g,' '));
  sec.push(['RESIDENTIAL SCHEDULE',rs.length?rs:['[The regular schedule.]']]);
  var hl=PP_HOL.filter(function(x){ return s.hol[x]; }).map(function(x){ var v=s.hol[x];
    var t= v==='Alternate every year'? 'Parent A in even-numbered years and Parent B in odd-numbered years' : v==='Split the day'? 'split, with the exchange at 2:00 p.m. unless the parents agree otherwise' : v==='Follow the regular schedule'? 'follows the regular schedule' : v.replace('Always with ','with ');
    return x+': '+t+'.'; });
  sec.push(['HOLIDAYS',['Holidays take priority over the regular schedule.'].concat(hl.length?hl.map(function(x,i){return '|'+String.fromCharCode(65+i)+'. '+x;}):['[Holiday schedule.]'])]);
  var dec=function(lbl,v){ return lbl+': '+(v? (v.indexOf('Joint')===0?'the parents decide together':ppWho(v.split(' decides')[0])+' decides after talking with the other parent') : '[who decides]')+'.'; };
  sec.push(['DECISION-MAKING',[dec('School and education',s.decEdu),dec('Health care, except emergencies',s.decHealth),dec('Religious upbringing',s.decRel),
    'Each parent makes day-to-day decisions while the children are with that parent. Either parent may make emergency decisions affecting the children\u2019s health or safety and will tell the other parent as soon as possible.']]);
  var ex=[]; if(s.xloc) ex.push('Exchanges happen at '+s.xloc.replace(/\.$/,'')+'.'); if(s.xwho) ex.push(s.xwho+'.'); if(s.calls) ex.push(s.calls.replace(/\s*\n\s*/g,' '));
  ex.push('A parent who plans to move in a way that significantly affects the other parent\u2019s time will give written notice at least 30 days before the move, as \u00a7 40-4-217, MCA requires.');
  sec.push(['EXCHANGES, COMMUNICATION AND RELOCATION',ex]);
  var m=[]; if(s.csPayer) m.push(s.csPayer.indexOf('Neither')===0? 'Child support is not ordered at this time.' : ppWho(s.csPayer)+' pays child support of '+(s.csAmt?money(s.csAmt):'[amount]')+' a month, as calculated under the Montana Child Support Guidelines.');
  if(s.ins) m.push(ppWho(s.ins)+' carr'+(s.ins==='Both parents'?'y':'ies')+' health insurance for the children.'); if(s.uncov) m.push('Uncovered medical, dental and vision costs are '+(s.uncov.indexOf('Paid by')===0?'paid by '+ppWho(s.uncov.replace('Paid by ','')):'split '+s.uncov.replace('In proportion','in proportion'))+'.');
  sec.push(['FINANCIAL SUPPORT',m.length?m:['[Child support and health insurance.]']]);
  var dr=[]; if(s.safety) dr.push('Because of past abuse or violence, the parents will not be required to mediate. Disputes go to the Court.');
  else if(s.mediate) dr.push('Before asking the Court to change or enforce this plan, the parents will try in good faith to resolve the disagreement through mediation, except in an emergency.');
  dr.push('If one parent does not follow this plan, the other parent still must. A parent who does not follow it may be held in contempt.');
  if(s.extra) dr.push(s.extra.replace(/\s*\n\s*/g,' '));
  sec.push(['DISPUTES AND CHANGES',dr]);
  out=out.concat(famNum(sec));
  out.push('DATED this ____ day of ______________, 20___.\n\n______________________________\n'+A+'\nParent A, Self-Represented '+(s.role||'Petitioner'));
  out.push('______________________________\n'+B+'\nParent B, if agreed');
  return out.join('\n\n');
}

/* ================= decree of dissolution ================= */
function money(v){ var n=parseFloat(String(v).replace(/[^0-9.]/g,'')); return isNaN(n)? v : '$'+n.toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}); }
function ddRows(kind){
  var s=famState().dd, list=s[kind];
  return list.map(function(r,i){
    return '<div class="proprow"><input type="text" placeholder="'+(kind==='prop'?'Item, such as the 2019 Subaru Outback':'Debt, such as the Visa card ending 4417')+'" value="'+esc(r.w||'')+'" oninput="ddRow(\''+kind+'\','+i+',\'w\',this.value)">'+
      '<input type="text" inputmode="decimal" placeholder="Value $" value="'+esc(r.v||'')+'" oninput="ddRow(\''+kind+'\','+i+',\'v\',this.value)">'+
      '<select onchange="ddRow(\''+kind+'\','+i+',\'to\',this.value)"><option value="">'+(kind==='prop'?'Goes to':'Paid by')+'</option>'+
      ['Petitioner','Respondent','Sold, proceeds split equally'].filter(function(o){ return kind==='prop'||o.indexOf('Sold')<0; }).map(function(o){ return '<option'+(r.to===o?' selected':'')+'>'+o+'</option>'; }).join('')+'</select>'+
      (list.length>1?'<button type="button" class="ilink del" onclick="ddRowDel(\''+kind+'\','+i+')">remove</button>':'')+'</div>';
  }).join('')+'<button type="button" class="sec" onclick="ddRowAdd(\''+kind+'\')">Add a row</button>';
}
function ddRow(kind,i,k,v){ famState().dd[kind][i][k]=v; save(); }
function ddRowAdd(kind){ famState().dd[kind].push({}); save(); $('dd-'+kind).innerHTML=ddRows(kind); }
function ddRowDel(kind,i){ famState().dd[kind].splice(i,1); save(); $('dd-'+kind).innerHTML=ddRows(kind); }
function renderDecree(){
  var box=$('dd-work'); if(!box) return; var s=famState().dd, c=D.complaint||{};
  if(!s.myname && c['cp-name']) s.myname=c['cp-name'];
  var h=famBefore([
    ['Who can file','One spouse must have lived in Montana for 90 days before filing. File in the county where either spouse lives.'],
    ['What the court must find','That the marriage is irretrievably broken: either you have lived apart for more than 180 days, or there is serious marital discord. Section 40-4-104, MCA.'],
    ['Children','If you have children, the decree must include a final parenting plan and child support. Draft the plan on the Parenting plan page.'],
    ['After you file','Your spouse has 21 days after being served to answer. Each spouse must exchange a financial disclosure of assets, debts, income and expenses within 60 days of service.'],
    ['If you agree on everything','You can file together on a joint petition, which is usually faster.'],
    ['Use the court\u2019s forms','Montana publishes official decree forms, with and without children. This page drafts the decree so you can copy it onto them, or file it as your proposed decree if your clerk accepts a typed one.']]);
  h+=famYou('dd');
  h+='<div class="card"><h3 style="margin-top:0">The marriage</h3>'+famInput('dd','married','Date of marriage','date')+famInput('dd','where','Where you married','text','Hamilton, Montana')+
    famInput('dd','sep','Date you separated','date')+famInput('dd','grounds','Why the marriage is over','select',['We have lived apart for more than 180 days','There is serious marital discord'])+
    famInput('dd','resident','One of us has lived in Montana for at least 90 days','check')+
    famInput('dd','kids','We have minor children together','check')+famInput('dd','preg','The wife is not pregnant','check')+'</div>';
  h+='<div class="card"><h3 style="margin-top:0">Property</h3><p class="note">Home, vehicles, bank accounts, retirement accounts, furniture. Who keeps each one.</p><div id="dd-prop">'+ddRows('prop')+'</div></div>';
  h+='<div class="card"><h3 style="margin-top:0">Debts</h3><p class="note">Mortgage, car loans, credit cards, medical bills. Who pays each one.</p><div id="dd-debt">'+ddRows('debt')+'</div></div>';
  h+='<div class="card"><h3 style="margin-top:0">Support and names</h3>'+famInput('dd','maint','Maintenance (spousal support)','select',['Neither spouse pays maintenance','Petitioner pays maintenance to Respondent','Respondent pays maintenance to Petitioner'])+
    famInput('dd','maintAmt','Amount and how long, if any','text','$500 a month for 24 months')+
    famInput('dd','nameWho','Restore a former name for','select',['Petitioner','Respondent'])+famInput('dd','name','The former name to restore, if any','text','Jane Ann Smith')+
    famInput('dd','taxes','Taxes for this year','select',['Each spouse files separately','We file jointly for this year and split any refund or balance equally'])+
    famInput('dd','extra','Anything else','area',null,'Each spouse keeps the personal belongings now in their possession.')+'</div>';
  h+=famOutput('dd','decree');
  box.innerHTML=h; famCourtName('dd');
}
function ddText(){
  var s=famState().dd, P=s.role==='Respondent'?s.other:s.myname, R=s.role==='Respondent'?s.myname:s.other;
  P=P||'[Petitioner]'; R=R||'[Respondent]';
  var out=[famParty(s), famCourt(s.county), famCaption(s,'IN RE THE MARRIAGE OF:'), 'Cause No. '+(s.cause||'__________')+'\nFINDINGS OF FACT, CONCLUSIONS OF LAW, AND DECREE OF DISSOLUTION'];
  var who=function(t){ return t==='Petitioner'?P:(t==='Respondent'?R:t); };
  var F=[];
  F.push('Petitioner is '+P+'. Respondent is '+R+'.');
  F.push(s.resident? 'At the time this action was filed, at least one party had been domiciled in Montana for 90 days or more.' : '[Residency: at least one party domiciled in Montana for 90 days before filing.]');
  if(s.married) F.push('The parties were married on '+niceDate(s.married)+(s.where?', in '+s.where.replace(/\.$/,''):'')+'.');
  if(s.sep) F.push('The parties separated on '+niceDate(s.sep)+'.');
  F.push('The marriage is irretrievably broken'+(s.grounds==='We have lived apart for more than 180 days'?': the parties have lived separate and apart for more than 180 days before this proceeding began.':s.grounds?': there is serious marital discord that adversely affects the attitude of one or both parties toward the marriage.':'.'));
  F.push(s.kids? 'The parties have minor children together. A final parenting plan and child support order are entered with this decree and made part of it.' : 'The parties have no minor children together, and none are expected.');
  var sec=[['FINDINGS OF FACT',F]];
  sec.push(['CONCLUSIONS OF LAW',['This Court has jurisdiction over the parties and the subject matter.','The requirements of \u00a7 40-4-104, MCA, are met, and the marriage should be dissolved.']]);
  var D2=['The marriage of '+P+' and '+R+' is dissolved.'];
  var props=s.prop.filter(function(r){ return r.w; }), debts=s.debt.filter(function(r){ return r.w; });
  if(props.length){ D2.push('The marital property is divided as follows:'); props.forEach(function(r,i){ D2.push('|'+String.fromCharCode(65+i)+'. '+r.w+(r.v?' (value '+money(r.v)+')':'')+': '+(r.to? (r.to.indexOf('Sold')===0?'to be sold, with the net proceeds divided equally':'to '+who(r.to)) : '[who keeps it]')+'.'); }); }
  if(debts.length){ D2.push('The marital debts are divided as follows. Each party will hold the other harmless on the debts assigned to them:'); debts.forEach(function(r,i){ D2.push('|'+String.fromCharCode(65+i)+'. '+r.w+(r.v?' (balance '+money(r.v)+')':'')+': paid by '+(r.to?who(r.to):'[who pays]')+'.'); }); }
  if(s.maint) D2.push(s.maint.indexOf('Neither')===0? 'Neither party is awarded maintenance.' : who(s.maint.split(' pays')[0])+' pays maintenance to '+who(s.maint.split(' to ')[1])+(s.maintAmt?': '+s.maintAmt.replace(/\.$/,''):'')+'.');
  if(s.name) D2.push((s.nameWho?who(s.nameWho):'[Petitioner or Respondent]')+'\u2019s former name, '+s.name.replace(/\.$/,'')+', is restored.');
  if(s.taxes) D2.push(s.taxes==='Each spouse files separately'?'Each party files separate tax returns for this year.':'The parties file jointly for this year and divide any refund or balance equally.');
  if(s.extra) D2.push(s.extra.replace(/\s*\n\s*/g,' '));
  D2.push('Each party will sign any document needed to carry out this decree.');
  sec.push(['DECREE',D2]);
  out=out.concat(famNum(sec));
  out.push('DATED this ____ day of ______________, 20___.\n\n______________________________\nDistrict Court Judge');
  out.push('Submitted by:\n\n______________________________\n'+(s.myname||'[Your name]')+'\nSelf-Represented '+(s.role||'Petitioner'));
  return out.join('\n\n');
}

/* ---------- start-up ---------- */
function initFamily(){
  addView('parenting','Parenting plan','Draft a proposed parenting plan for Montana district court: schedule, holidays, decisions and support.','<div id="pp-work" class="ctool"></div>');
  addView('decree','Divorce decree','Draft a proposed decree of dissolution for Montana district court: findings, property, debts and support.','<div id="dd-work" class="ctool"></div>');
  // their own section in the menu, after Asking and arguing
  var drop=$('drop'), grps=drop.querySelectorAll('.dgrp'), support=null;
  for(var i=0;i<grps.length;i++) if(grps[i].textContent.trim()==='Support') support=grps[i];
  var g=document.createElement('div'); g.className='dgrp'; g.textContent='Family court';
  var b1=document.createElement('button'); b1.className='dlink'; b1.textContent='Parenting plan'; b1.setAttribute('onclick',"show('parenting')");
  var b2=document.createElement('button'); b2.className='dlink'; b2.textContent='Divorce decree'; b2.setAttribute('onclick',"show('decree')");
  if(support){ drop.insertBefore(g,support); drop.insertBefore(b1,support); drop.insertBefore(b2,support); }
  var ms=$('moresheet'), close=ms.querySelector('.moreclose'), care=null, ml=ms.querySelectorAll('.morelink');
  for(var j=0;j<ml.length;j++) if((ml[j].getAttribute('onclick')||'').indexOf("show('ai')")>-1) care=ml[j];
  [['parenting','\u2661','Parenting plan'],['decree','\u29c9','Divorce decree']].forEach(function(x){ var m=document.createElement('button'); m.className='morelink';
    m.setAttribute('onclick',"show('"+x[0]+"')"); m.innerHTML='<span class="mi">'+x[1]+'</span>'+x[2]; ms.insertBefore(m, care||close); });
  var _sh=window.show; window.show=function(id){ _sh(id); if(id==='parenting') renderParenting(); if(id==='decree') renderDecree(); };
  renderParenting(); renderDecree();
}
