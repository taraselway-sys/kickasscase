/* Kickass Case Builder — filing deadlines for every kind of case.
   Pick the type of case and the date that starts the clock; the calculator applies the time limit.
   Statutes of limitation are counted under § 1-1-306, MCA; court-rule deadlines under M.R.Civ.P. 6(a)
   and the federal rules (weekend or holiday moves to the next business day). Loaded after family.js. */

// [key, group, name, amount, unit ('d','y'), date label, law, what starts the clock, where to file, what to know, counting ('stat','rule'), extra]
var LIM=[
 ['hrb','Discrimination','Montana Human Rights Bureau complaint',180,'d','The most recent act, or the day you discovered it','§ 49-2-501(4), MCA','The discriminatory act, or the day you discovered it.','Montana Human Rights Bureau (Department of Labor and Industry).','If you filed a grievance under a union contract or written policy, the 180 days can run from when it ends. If it is not over in 120 days, the limit becomes 300 days from the act.','stat'],
 ['eeoc','Federal deadlines (for reference only)','Federal EEOC charge (Title VII, ADA, age)',300,'d','The most recent discriminatory act','42 U.S.C. § 2000e-5(e)(1)','The discriminatory act.','EEOC, or the Montana Human Rights Bureau, which cross-files with the EEOC.','Montana has its own human rights agency, so you get 300 days instead of 180. Filing with the Bureau within its 180 days protects both.','rule'],
 ['hud','Federal deadlines (for reference only)','Federal fair housing complaint (HUD)',1,'y','The day the housing practice happened or ended','42 U.S.C. § 3610(a)(1)','The discriminatory housing practice, or the day it ended.','U.S. Department of Housing and Urban Development.','A Montana Human Rights Bureau housing complaint still has its own 180-day limit.','rule'],
 ['hrbobj','Discrimination','Objection to the Human Rights Commission after a Bureau dismissal',14,'d','The date of the Bureau’s notice of dismissal','§ 49-2-511, MCA','The notice of dismissal after the investigation.','Montana Human Rights Commission.','You can object to the Commission, or go to district court instead. Read your dismissal notice for the exact choices.','stat'],
 ['hrb511','Discrimination','District court suit after the Bureau dismisses your case',90,'d','The date of the final agency decision (the dismissal, or the Commission’s order)','§ 49-2-511, MCA','The final agency decision: the dismissal, or the Commission’s order affirming it.','Montana district court.','Miss this and the claim is barred. A petition for judicial review of a Commission order is due in 30 days instead.','stat'],
 ['hrb512','Discrimination','District court suit after a 12-month dismissal (no hearing yet)',90,'d','The date of the notice of dismissal','§ 49-2-512(3), MCA','The notice of dismissal issued when the case was not heard within 12 months.','Montana district court.','Miss this and the claim is barred.','stat'],
 ['rts','Federal deadlines (for reference only)','Federal lawsuit after an EEOC right-to-sue letter',90,'d','The day you received the right-to-sue letter','42 U.S.C. § 2000e-5(f)(1)','Receiving the EEOC’s notice of right to sue.','U.S. District Court for the District of Montana.','Write down the day the letter arrived. Courts often assume it arrived a few days after it was mailed.','rule'],
 ['wdea','Employment','Wrongful discharge (Montana Wrongful Discharge Act)',1,'y','The date you were fired','§ 39-2-911, MCA','The date of discharge.','Montana district court.','You must first use your employer’s written internal appeal, if they told you about it within 14 days. The deadline pauses while the appeal runs, for no more than 120 days. Serve the complaint within 6 months of filing.','stat'],
 ['wage','Employment','Unpaid wage claim',180,'d','The day the wages were due and not paid','§ 39-3-207, MCA','The default or delay in paying wages.','Montana Department of Labor and Industry, Wage and Hour Unit.','You can recover wages for the 2 years before you file, or 3 years for repeated violations.','stat'],
 ['epa','Federal deadlines (for reference only)','Federal Equal Pay Act lawsuit',2,'y','The date of the unequal paycheck','29 U.S.C. § 255(a)','Each unequal paycheck.','U.S. District Court for the District of Montana.','It is 3 years if the violation was willful. No EEOC charge is needed first.','rule','willful'],
 ['openmtg','Government','Open meeting violation: ask the court to void a decision',30,'d','The day you learned, or should have learned, of the decision','§ 2-3-213, MCA','The day you learned, or reasonably should have learned, of the decision.','Montana district court.','This is one of the shortest deadlines in Montana law. File as soon as you can.','stat'],
 ['records','Government','Public records denial',0,'none','The date of the denial','§ 2-6-1009, MCA','The denial of your request.','Montana district court.','The law sets no specific deadline to sue over a denied records request. Do not wait. Delay makes the records harder to get and the case harder to win.','stat'],
 ['mapa','Government','Court review of a state agency’s final decision',30,'d','The day the final written decision was served on you','§ 2-4-702, MCA','Service of the agency’s final written decision, or the decision on rehearing if you asked for one.','District court in the county where you live, or where the agency’s main office is.','Read the decision. Some agencies have their own appeal steps first.','stat'],
 ['k6','Civil claims','Breaking a written contract',6,'y','The date the contract was broken','§ 27-2-202(1), MCA','The breach of the written contract.','Justice court or small claims ($7,000 or less), or district court.','','stat'],
 ['k5','Civil claims','Breaking an oral contract, or an unpaid account',5,'y','The date the agreement was broken','§ 27-2-202(2), MCA','The breach.','Justice court or small claims ($7,000 or less), or district court.','','stat'],
 ['k3','Civil claims','Other obligation not in writing',3,'y','The date of the breach','§ 27-2-202(3), MCA','The breach.','Justice court or small claims ($7,000 or less), or district court.','','stat'],
 ['deposit','Civil claims','Security deposit a landlord kept',2,'y','The date the landlord denied it in writing, or 30 days after you moved out','§ 70-25-204 and § 27-2-211(1)(c), MCA','A written denial, or 30 days after the tenancy ended (10 days if nothing was owed).','Justice court or small claims ($7,000 or less).','The deposit law sets no time limit of its own. The 2-year limit for a liability created by statute most likely applies, so file well within it.','stat'],
 ['pi','Civil claims','Personal injury',3,'y','The date of the injury','§ 27-2-204(1), MCA','The injury, or when you discovered it if it was hidden.','District court, or justice court for $7,000 or less.','A claim against the state or a local government starts with a written claim. Against the state, the deadline pauses 120 days once the Department of Administration receives it. Section 2-9-301, MCA.','stat'],
 ['defame','Civil claims','Libel or slander (defamation)',2,'y','The date the statement was published or spoken','§ 27-2-204(3), MCA','The statement.','District court, or justice court for $7,000 or less.','The same 2 years covers assault, battery and false imprisonment.','stat'],
 ['prop','Civil claims','Damage to or taking of property',2,'y','The date of the damage or taking','§ 27-2-207, MCA','The damage or taking.','Justice court or small claims ($7,000 or less), or district court.','','stat'],
 ['fraud','Civil claims','Fraud or mistake',2,'y','The day you discovered the fraud','§ 27-2-203, MCA','Discovery of the facts that make up the fraud or mistake.','District court, or justice court for $7,000 or less.','','stat'],
 ['statute','Civil claims','A liability created by a statute',2,'y','The date of the violation','§ 27-2-211(1)(c), MCA','The violation.','The court named in that statute, or district court.','','stat'],
 ['s1983','Federal deadlines (for reference only)','Federal civil rights lawsuit (42 U.S.C. § 1983)',3,'y','The date of the violation','§ 27-2-204(1), MCA (borrowed by federal law)','The day you knew, or should have known, of the injury.','U.S. District Court for the District of Montana.','Federal courts borrow Montana’s 3-year personal injury limit for these cases.','stat'],
 ['ans','Court deadlines','Answer a district court complaint',21,'d','The day you were served','M.R.Civ.P. 12(a)','Being served with the summons and complaint.','The district court where the case was filed.','The State and its agencies get 42 days. If you miss it, the other side can ask for a default judgment.','rule'],
 ['ansj','Court deadlines','Answer a justice court complaint',20,'d','The day you were served','§ 25-31-406, MCA','Being served with the summons and complaint.','The justice court where the case was filed.','Eviction cases are much shorter. Follow the date on your summons.','stat'],
 ['appeal','Court deadlines','Appeal to the Montana Supreme Court',30,'d','The day the judgment was entered (or notice of entry was served)','M.R.App.P. 4(5)(a)','Entry of the judgment, or service of the notice of entry when one is required.','Clerk of the Montana Supreme Court.','It is 60 days when the State, a city, a county or another public body is a party.','rule','gov'],
 ['rule60','Court deadlines','Ask a court to undo a judgment for mistake, new evidence or fraud',1,'y','The date of the judgment','M.R.Civ.P. 60(c)(1)','Entry of the judgment.','The court that entered the judgment.','Other reasons must be raised within a reasonable time, which can be much shorter. Act fast.','rule'],
 ['divorce','Family','Divorce',0,'none','','§ 40-4-104, MCA','','Montana district court.','There is no deadline to file for divorce. One spouse must have lived in Montana, or been stationed here, for 90 days before filing.','stat'],
 ['parenting','Family','Parenting plan',0,'none','','§ 40-7-201, MCA','','Montana district court.','There is no deadline to file. Montana can usually decide only if it is the children’s home state: they lived here for the 6 months before filing, or since birth.','stat']
];
function limByKey(k){ for(var i=0;i<LIM.length;i++) if(LIM[i][0]===k) return LIM[i]; return LIM[0]; }

/* Montana legal holidays, § 1-1-216, MCA. Sunday is a holiday; Saturday is not. */
function nthDow(y,m,dow,n){ var d=new Date(y,m,1); var off=(dow-d.getDay()+7)%7; return new Date(y,m,1+off+7*(n-1)); }
function lastDow(y,m,dow){ var d=new Date(y,m+1,0); return new Date(y,m,d.getDate()-((d.getDay()-dow+7)%7)); }
function iso(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
function mtHolidays(y){
  var fixed=[[0,1,'New Year’s Day'],[6,4,'Independence Day'],[10,11,'Veterans Day'],[11,25,'Christmas']], h={};
  fixed.forEach(function(f){ var d=new Date(y,f[0],f[1]); if(d.getDay()===6) d=new Date(y,f[0],f[1]-1); else if(d.getDay()===0) d=new Date(y,f[0],f[1]+1); h[iso(d)]=f[2]; });
  h[iso(nthDow(y,0,1,3))]='Martin Luther King Jr. Day'; h[iso(nthDow(y,1,1,3))]='Lincoln’s and Washington’s Birthdays';
  h[iso(lastDow(y,4,1))]='Memorial Day'; h[iso(nthDow(y,8,1,1))]='Labor Day'; h[iso(nthDow(y,9,1,2))]='Columbus Day';
  h[iso(nthDow(y,10,4,4))]='Thanksgiving';
  if(y%2===0){ var m=nthDow(y,10,1,1); h[iso(new Date(y,10,m.getDate()+1))]='State general election day'; }
  return h;
}
function holidayName(s){ var d=new Date(s+'T12:00:00'), h=mtHolidays(d.getFullYear()); return h[s]||''; }
function addYears(s,n){ var d=new Date(s+'T12:00:00'), m=d.getMonth(); d.setFullYear(d.getFullYear()+n); if(d.getMonth()!==m) d.setDate(0); return iso(d); }
/* compute the deadline: returns {raw, due, note} */
function limCompute(L,date,opts){
  if(L[4]==='none'||!date) return null;
  var amt=L[3]; if(L[11]==='willful'&&opts.willful) amt=3; if(L[11]==='gov'&&opts.gov) amt=60;
  var raw= L[4]==='y'? addYears(date,amt) : addDays(date,amt), due=raw, note='';
  var dow=new Date(raw+'T12:00:00').getDay(), hol=holidayName(raw);
  if(L[10]==='rule'){
    var moved=false; while(true){ var dw=new Date(due+'T12:00:00').getDay(); if(dw===0||dw===6||holidayName(due)){ due=addDays(due,1); moved=true; } else break; }
    if(moved) note='The last day falls on '+(hol||(dow===6?'a Saturday':'a Sunday'))+', so under the court rules it moves to the next business day. Federal holidays can differ from Montana’s, so do not count on the extra days.';
  } else {
    if(dow===0||hol){ var nx=raw; while(new Date(nx+'T12:00:00').getDay()===0||holidayName(nx)) nx=addDays(nx,1);
      var bf=addDays(raw,-1); while([0,6].indexOf(new Date(bf+'T12:00:00').getDay())>-1||holidayName(bf)) bf=addDays(bf,-1);
      note='The last day falls on '+(hol||'a Sunday')+'. Under § 1-1-306, MCA, the deadline moves to '+niceDate(nx)+', but do not count on the extra day. File by '+niceDate(bf)+' to be safe.'; }
    else if(dow===6){ var fri=addDays(raw,-1); note='The last day is a Saturday. Most offices are closed, so file by Friday, '+niceDate(fri)+'.'; }
  }
  return {raw:raw,due:due,note:note,amt:amt};
}
function limAmount(L,amt){ return amt+' '+(L[4]==='y'?(amt===1?'year':'years'):(amt===1?'day':'days')); }

function initLimits(){
  var card=$('dl-date')&&$('dl-date').closest('.card'); if(!card) return;
  var groups=[], gm={}; var FED='Federal deadlines (for reference only)'; LIM.forEach(function(L){ if(!gm[L[1]]){ gm[L[1]]=[]; if(L[1]!==FED) groups.push(L[1]); } gm[L[1]].push(L); }); groups.push(FED);
  var sel='<label class="fl" for="dl-type">Type of case</label><select id="dl-type" onchange="limType()">'+groups.map(function(g){
    return '<optgroup label="'+esc(g)+'">'+gm[g].map(function(L){ return '<option value="'+L[0]+'">'+esc(L[2])+'</option>'; }).join('')+'</optgroup>'; }).join('')+'</select>'+
    '<div id="dl-opts"></div>';
  var lab=card.querySelector('label[for="dl-date"]');
  lab.insertAdjacentHTML('beforebegin',sel);
  lab.id='dl-datelab';
  $('dl-out').insertAdjacentHTML('afterend','<div id="dl-law" class="limlaw"></div>');
  card.querySelectorAll('p.note').forEach(function(p){ p.classList.add('dl-hrbonly'); });
  var sub=document.querySelector('#v-deadline .sub2'); if(sub){ sub.setAttribute('data-hrb',sub.innerHTML); }
  D.deadline=D.deadline||{};
  $('dl-type').value=D.deadline.type||'hrb';
  limType(true);
}
function limType(first){
  var k=$('dl-type').value, L=limByKey(k), s=D.deadline;
  if(!first){ s.type=k; }
  var date= k==='hrb' ? (s.last||'') : ((s.dates||{})[k]||'');
  $('dl-date').value=date;
  $('dl-datelab').textContent=L[5]||'Date';
  $('dl-date').parentNode && ($('dl-date').style.display= L[4]==='none'?'none':'');
  $('dl-datelab').style.display= L[4]==='none'?'none':'';
  var o=''; if(L[11]==='willful') o='<label class="rbchk"><input type="checkbox" id="dl-willful"'+(s.willful?' checked':'')+' onchange="calcDeadline()"><span>The violation was willful</span></label>';
  if(L[11]==='gov') o='<label class="rbchk"><input type="checkbox" id="dl-gov"'+(s.gov?' checked':'')+' onchange="calcDeadline()"><span>The State, a city, a county or another public body is a party</span></label>';
  $('dl-opts').innerHTML=o;
  document.querySelectorAll('.dl-hrbonly').forEach(function(p){ p.style.display= k==='hrb'?'':'none'; });
  var sub=document.querySelector('#v-deadline .sub2');
  if(sub) sub.innerHTML= k==='hrb'? sub.getAttribute('data-hrb') : esc(L[2])+': '+(L[4]==='none'?'no deadline to file.':limAmount(L,L[3])+' from '+L[7].charAt(0).toLowerCase()+L[7].slice(1).replace(/\.$/,'')+'.');
  calcDeadline(true);
  if(!first) save();
}
window.calcDeadline=function(quiet){
  var tsel=$('dl-type'); if(!tsel) return;
  var k=tsel.value, L=limByKey(k), s=D.deadline, v=$('dl-date').value, box=$('dl-out');
  s.dates=s.dates||{};
  if(k==='hrb') s.last=v; else if(v) s.dates[k]=v; else delete s.dates[k];
  if($('dl-willful')) s.willful=$('dl-willful').checked; if($('dl-gov')) s.gov=$('dl-gov').checked;
  var law=(L[1].indexOf('Federal')===0?'<p class="limnote">This is a federal deadline, shown for reference. This app prepares Montana state filings only. If you may have a federal claim, talk to a lawyer.</p>':'')+'<p><b>The law:</b> '+esc(L[6])+'</p>'+(L[7]?'<p><b>The clock starts:</b> '+esc(L[7])+'</p>':'')+'<p><b>Where to file:</b> '+esc(L[8])+'</p>'+(L[9]?'<p><b>Know this:</b> '+esc(L[9])+'</p>':'');
  if(L[4]==='none'){ box.className='big'; box.innerHTML='<b>No deadline</b><span>'+esc(L[2])+' has no filing deadline in Montana law.</span>'; $('dl-law').innerHTML=law; if(!quiet) save(); return; }
  if(!v){ box.className='big'; box.innerHTML='<b>&mdash;</b><span>Enter the date to see your deadline</span>'; $('dl-law').innerHTML=law; if(!quiet) save(); return; }
  var r=limCompute(L,v,{willful:s.willful,gov:s.gov}), left=daysBetween(todayISO(),r.due);
  var cls= left<0?'big bad':(left<=30?'big warn':'big'), head= left<0?'Past':(left+(left===1?' day':' days'));
  var msg= left<0? 'The '+limAmount(L,r.amt)+' ended on '+esc(niceDate(r.due))+'. Talk to a lawyer or the agency anyway. Some deadlines run from when you discovered the problem, and some can be paused.'
    : 'left to file &middot; your deadline is '+esc(niceDate(r.due));
  box.className=cls; box.innerHTML='<b>'+head+'</b><span>'+msg+'</span>';
  $('dl-law').innerHTML=(r.note?'<p class="limnote">'+esc(r.note)+'</p>':'')+law+'<p class="note">Deadlines can change with new laws or special facts in your case. Check the statute, and ask a lawyer or the agency if you are close.</p>';
  if(!quiet) save();
};
/* the chosen non-Bureau deadline also shows on Your deadlines and Home */
function limCurrent(){
  var s=D.deadline||{}, k=s.type||'hrb'; if(k==='hrb') return null;
  var L=limByKey(k), v=(s.dates||{})[k]; if(!v||L[4]==='none') return null;
  var r=limCompute(L,v,{willful:s.willful,gov:s.gov}); return {L:L,date:r.due,from:v};
}
(function(){
  if(typeof allDates!=='function') return;
  var _ad=allDates;
  window.allDates=function(){ var out=_ad(), c=limCurrent();
    if(c){ out.push({key:'lim',date:c.date,label:'Last day: '+c.L[2],detail:limAmount(c.L,limCompute(c.L,c.from,{willful:D.deadline.willful,gov:D.deadline.gov}).amt)+' from '+niceDate(c.from)+' · '+c.L[6],kind:'file'});
      out.sort(function(a,b){ return a.date<b.date?-1:a.date>b.date?1:0; }); }
    return out; };
})();
