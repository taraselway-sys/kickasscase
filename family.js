/* Kickass Case Builder — family court.
   Parenting plan: follows the Montana Supreme Court form MP-300, section by section.
   Divorce decree: follows MP-703 (with minor children) and MP-713 (no minor children),
   with the Property Distribution that goes with it following MP-500, sections 1 to 10.
   Drafts are kept in D.family. Loaded after court.js. */

var FAM_PACKET={
  pp:[
    ['Complete packet for a parenting plan (PDF)','https://courts.mt.gov/forms/ParentPlan/parentingplan-packet.pdf'],
    ['All parenting plan forms, one at a time','https://courts.mt.gov/forms/ParentPlan/pp'],
    ['The packet on MontanaLawHelp.org','https://www.montanalawhelp.org/resource/district-court-complete-packet-parenting-plan'],
    ['How to file a parenting plan in Montana','https://courts.mt.gov/external/forms/dissolution/pp.docx'],
    ['MP-114 Petition for a parenting plan','https://courts.mt.gov/external/forms/dissolution/MP-114.docx'],
    ['MP-203 Response to a parenting plan petition','https://courts.mt.gov/external/forms/dissolution/MP-203.docx'],
    ['MP-300 Proposed Parenting Plan','https://courts.mt.gov/external/forms/dissolution/MP-300.doc'],
    ['MP-300 instructional cheat sheet','https://courts.mt.gov/external/forms/dissolution/MP300cheatsheet.pdf'],
    ['MP-300-G Description of existing medical coverage','https://courts.mt.gov/external/forms/dissolution/MP-300-G.docx'],
    ['MP-414 Summons','https://courts.mt.gov/forms/ParentPlan/MP-414.pdf'],
    ['MP-721 Request for hearing on a parenting plan','https://courts.mt.gov/external/forms/dissolution/MP-721.docx'],
    ['MP-722 Order granting a hearing on a parenting plan','https://courts.mt.gov/external/forms/dissolution/MP-722.docx'],
    ['MP-734 Findings and order for a parenting plan','https://courts.mt.gov/forms/ParentPlan/MP-734.docx'],
    ['MP-904 Notice of intent to move','https://courts.mt.gov/forms/ParentPlan/MP-904-Notice-of-Intent-to-Move.docx'],
    ['MP-320 Joint parenting plan (filing together)','https://courts.mt.gov/forms/Dissolution-docs/MP-320-Joint-Parenting-Plan-8.10.2026.pdf'],
    ['Montana Child Support Guidelines','https://dphhs.mt.gov/cssd/services/guidelines'],
    ['Child support guidelines tables','https://dphhs.mt.gov/assets/cssd/PolicyManual/cs404-2.pdf'],
    ['Online child support calculator (MontanaLawHelp says it is not working right now)','https://www.montanalawhelp.org/resource/montana-online-child-support-calculator']
  ],
  dd:[
    ['Complete packet: divorce with children (PDF)','https://courts.mt.gov/external/forms/dissolution/dissolution-child-packet.pdf'],
    ['All forms: divorce with children','https://courts.mt.gov/forms/dissolution/kid'],
    ['All forms: divorce without children','https://courts.mt.gov/forms/dissolution/nokid'],
    ['All forms: joint divorce with children','https://courts.mt.gov/forms/dissolution/jointkid'],
    ['All forms: joint divorce without children','https://courts.mt.gov/forms/dissolution/jointnokid'],
    ['MP-113 Petition (with children)','https://courts.mt.gov/external/forms/dissolution/MP-113.pdf'],
    ['MP-112 Petition (without children)','https://courts.mt.gov/external/forms/dissolution/MP-112.docx'],
    ['MP-400 Summons and economic restraining order','https://courts.mt.gov/forms/dissolution/MP-400-Summons-and-AERO-09-15-2021.docx'],
    ['MP-500 Property Distribution','https://courts.mt.gov/external/forms/dissolution/MP-500.docx'],
    ['MP-500 instructional cheat sheet','https://courts.mt.gov/external/forms/dissolution/MP500cheatsheet.pdf'],
    ['MP-510 Disclosure of income and expenses','https://courts.mt.gov/external/forms/dissolution/MP-510.docx'],
    ['MP-702 Request for hearing (with children)','https://courts.mt.gov/external/forms/dissolution/MP-702.docx'],
    ['MP-701 Request for hearing (without children)','https://courts.mt.gov/external/forms/dissolution/MP-701.docx'],
    ['MP-703 Decree (with minor children)','https://courts.mt.gov/external/forms/dissolution/MP-703.docx'],
    ['MP-713 Decree (no minor children)','https://courts.mt.gov/external/forms/dissolution/MP-713.docx'],
    ['MP-713 instructional cheat sheet','https://courts.mt.gov/external/forms/dissolution/MP713cheatsheet.pdf'],
    ['MP-704 Notice of entry of decree','https://courts.mt.gov/external/forms/dissolution/MP-704.docx'],
    ['MP-721 Joint decree with children (PDF)','https://courts.mt.gov/forms/Dissolution-docs/MP-721-Joint-Decree-Dissow-Kids-7.16.2026.pdf'],
    ['MP-722 Joint decree without children (PDF)','https://courts.mt.gov/forms/Dissolution-docs/MP-722-Joint-Decree-Disso-No-Kids-7.16.2026.pdf'],
    ['Affidavit for entry of decree without a hearing','https://courts.mt.gov/external/forms/dissolution/affidavitforentrydecreewithouthearing.pdf']
  ]
};

/* ---------- state ---------- */
function famState(){
  D.family=D.family||{};
  var f=D.family;
  f.pp=f.pp||{}; f.dd=f.dd||{}; f.pd=f.pd||{};
  if(!Array.isArray(f.pp.kids)||!f.pp.kids.length) f.pp.kids=[{}];
  f.pp.hol=f.pp.hol||{};
  return f;
}
function fs(p){ return famState()[p]; }
function famP(p){ return p==='pd'?'dd':p; }               // the property distribution uses the decree's parties
function famV(p,k){ var v=fs(p)[k]; return v==null?'':v; }
function fSet(p,k,v,re){ fs(p)[k]=v; save(); if(k==='county') famCourtName(p); if(re) famRe(p); }
function famRe(p){ var y=window.scrollY||0; if(famP(p)==='pp') renderParenting(); else renderDecree(); try{ window.scrollTo(0,y); }catch(e){} }
function famJ(p){ return fs(famP(p)).filing==='joint'; }
function famL(p,x){ var j=famJ(p); return x==='1'?(j?'Co-Petitioner 1':'Petitioner'):(j?'Co-Petitioner 2':'Respondent'); }
function famPos(p,x){ return famL(p,x)+'’s'; }
function famN(p,x){ var s=fs(famP(p)), mine=(s.me||'1')===x; return (mine?s.myname:s.other)||''; }
function famA(p,x){ var s=fs(famP(p)), mine=(s.me||'1')===x; return (mine?s.myaddr:s.otheraddr)||''; }
function famWho(p,v){ return v==='1'||v==='2'? famL(p,v) : v==='B'? 'Both parents' : v==='E'? 'either party during their respective parenting time' : ''; }
function fb(v){ v=String(v==null?'':v).trim(); return v||'__________'; }   // a blank line on the form
function fbs(v){ return String(v==null?'':v).trim().replace(/\s*\n\s*/g,' ').replace(/[.\s]+$/,''); }


/* the court's complete packet: print all of it, not only the form this page fills in */
var FAM_PACKS={
  pp:[['Parenting plan packet','https://courts.mt.gov/forms/ParentPlan/parentingplan-packet.pdf','']],
  dd:[['Divorce with children','https://courts.mt.gov/external/forms/dissolution/dissolution-child-packet.pdf','sep-yes'],
      ['Divorce without children','https://courts.mt.gov/external/forms/dissolution/disnokids-packet.pdf','sep-no'],
      ['Joint divorce with children','https://courts.mt.gov/forms/Dissolution-docs/Joint-Dissolution-of-Marriage-With-Children-8.21.20261.pdf','joint-yes'],
      ['Joint divorce without children','https://courts.mt.gov/forms/Dissolution-docs/Joint-Dissolution-of-Marriage-Without-Children-8.21.20261.pdf','joint-no']]
};
function famPacket(kind){
  var s=fs(kind), mine=(s.filing||'sep')+'-'+(s.kids||'');
  var list=FAM_PACKS[kind];
  return '<div class="card fampack"><div class="fpk">Start here</div><h3>Print the court\u2019s complete packet first</h3>'+
    '<p><b>You will need the whole packet, not only the form this page fills in.</b> '+(kind==='pp'?
      'A parenting case also needs the petition, the summons, proof of service, child support financial affidavits and the other forms in the packet.':
      'A divorce also needs the petition, the summons, proof of service, financial disclosures and the other forms in the packet.')+
    ' Print it before you start, read the instructions in it, and fill in every form it lists.</p>'+
    '<div class="fpbtns">'+list.map(function(x){ var on=!x[2]||x[2]===mine;
      return '<a class="fpbtn'+(on?' on':'')+'" href="'+x[1]+'" target="_blank" rel="noopener"><span class="fpi">\u2193</span><span class="fpt">'+esc(x[0])+'<small>'+(list.length>1&&on&&x[2]?'Your case \u00b7 ':'')+'Complete packet \u00b7 PDF</small></span></a>'; }).join('')+'</div>'+
    (kind==='dd'?'<p class="note" style="margin:8px 0 0">Not sure which one? Answer the two questions below and your packet is marked.</p>':'')+'</div>';
}
function famPacketReminder(kind){
  return '<div class="note fpremind">This is one form from the court\u2019s packet. File it with the rest of the packet. <a href="'+(kind==='pp'?FAM_PACKS.pp[0][1]:'https://courts.mt.gov/forms/dissolution/kid')+'" target="_blank" rel="noopener">'+(kind==='pp'?'Get the complete packet':'See all the divorce packets')+'</a>.</div>';
}

/* ---------- inputs ---------- */
function famId(p,k){ return 'fm-'+p+'-'+k; }
function fT(p,k,label,ph){ var id=famId(p,k); return '<label class="fl" for="'+id+'">'+label+'</label><input type="text" id="'+id+'" value="'+esc(famV(p,k))+'" placeholder="'+esc(ph||'')+'" oninput="fSet(\''+p+'\',\''+k+'\',this.value)">'; }
function fA(p,k,label,ph){ var id=famId(p,k); return '<label class="fl" for="'+id+'">'+label+'</label><textarea id="'+id+'" placeholder="'+esc(ph||'')+'" oninput="fSet(\''+p+'\',\''+k+'\',this.value)">'+esc(famV(p,k))+'</textarea>'; }
function fD(p,k,label){ var id=famId(p,k); return '<label class="fl" for="'+id+'">'+label+'</label><input type="date" id="'+id+'" value="'+esc(famV(p,k))+'" onchange="fSet(\''+p+'\',\''+k+'\',this.value)">'; }
function famOpts(opts){ return opts.map(function(o){ return typeof o==='string'?[o,o]:o; }); }
function fS(p,k,label,opts,re){ var id=famId(p,k), v=famV(p,k);
  return '<label class="fl" for="'+id+'">'+label+'</label><select id="'+id+'" onchange="fSet(\''+p+'\',\''+k+'\',this.value'+(re?',1':'')+')"><option value="">Choose one</option>'+
    famOpts(opts).map(function(o){ return '<option value="'+esc(o[0])+'"'+(v===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select>'; }
function fR(p,k,label,opts){ var v=famV(p,k), nm=famId(p,k);
  return '<fieldset class="fopt"><legend>'+label+'</legend>'+famOpts(opts).map(function(o,i){
    return '<label class="rbchk"><input type="radio" name="'+nm+'" id="'+nm+'-'+i+'" value="'+esc(o[0])+'"'+(v===o[0]?' checked':'')+' onchange="fSet(\''+p+'\',\''+k+'\',this.value,1)"><span>'+esc(o[1])+'</span></label>'; }).join('')+'</fieldset>'; }
function fC(p,k,label,re){ var id=famId(p,k);
  return '<label class="rbchk"><input type="checkbox" id="'+id+'"'+(fs(p)[k]?' checked':'')+' onchange="fSet(\''+p+'\',\''+k+'\',this.checked'+(re?',1':'')+')"><span>'+esc(label)+'</span></label>'; }
function famParties(p,extra){ var o=[['1',famL(p,'1')+(famN(p,'1')?' ('+famN(p,'1')+')':'')],['2',famL(p,'2')+(famN(p,'2')?' ('+famN(p,'2')+')':'')]]; return o.concat(extra||[]); }
function fPS(p,k,label,extra,re){ return fS(p,k,label,famParties(p,extra),re); }
function fSub(html){ return '<div class="fsub">'+html+'</div>'; }
function fNote(t){ return '<p class="note">'+t+'</p>'; }
function famCard(title,inner,form){ return '<div class="card famsec"><h3 style="margin-top:0">'+title+'</h3>'+(form?'<div class="famform">'+form+'</div>':'')+inner+'</div>'; }

/* rows of a table on the form (children, vehicles, accounts, debts) */
function fRows(p,k,fields,addLabel){
  var s=fs(p); if(!Array.isArray(s[k])||!s[k].length) s[k]=[{}];
  return '<div class="famrows">'+s[k].map(function(r,i){
    return '<div class="famrow">'+fields.map(function(f){ var v=r[f[0]]||'', on='fRow(\''+p+'\',\''+k+'\','+i+',\''+f[0]+'\',this.value)';
      if(f[2]) return '<label class="fl">'+f[1]+'<select onchange="'+on+'"><option value="">Choose</option>'+famOpts(f[2]==='party'?famParties(p,[['O','Other']]):f[2]).map(function(o){
        return '<option value="'+esc(o[0])+'"'+(v===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select></label>';
      return '<label class="fl">'+f[1]+'<input type="text" value="'+esc(v)+'" placeholder="'+esc(f[3]||'')+'" oninput="'+on+'"></label>'; }).join('')+
      (s[k].length>1?'<button type="button" class="ilink del" onclick="fRowDel(\''+p+'\',\''+k+'\','+i+')">remove</button>':'')+'</div>';
  }).join('')+'<button type="button" class="sec" onclick="fRowAdd(\''+p+'\',\''+k+'\')">'+addLabel+'</button></div>';
}
function fRow(p,k,i,f,v){ fs(p)[k][i][f]=v; save(); }
function fRowAdd(p,k){ fs(p)[k].push({}); save(); famRe(p); }
function fRowDel(p,k,i){ fs(p)[k].splice(i,1); save(); famRe(p); }
function famFilled(p,k){ return (fs(p)[k]||[]).filter(function(r){ return Object.keys(r).some(function(x){ return String(r[x]||'').trim(); }); }); }

/* ---------- shared page pieces ---------- */
function famCourt(c){ var n=districtOf(c); return 'MONTANA '+(n?ORD[n].toUpperCase():'__________')+' JUDICIAL DISTRICT COURT, '+(c?c.toUpperCase():'__________')+' COUNTY'; }
function famCourtName(p){ var el=$('fm-'+famP(p)+'-court'), c=fs(famP(p)).county; if(el) el.textContent=c?famCourt(c):''; }
function famWarn(kind){
  return '<div class="card famwarn" role="note"><h3>Read this first: talk to a lawyer</h3>'+
    '<p><b>'+(kind==='pp'?'Parenting plans':'Divorces')+' and '+(kind==='pp'?'divorces':'parenting plans')+' are the cases most likely to need an attorney.</b> They decide where your children live, who pays support, and who keeps the home, the retirement accounts and the debts. Mistakes can follow you for years and are hard to undo.</p>'+
    '<p><b>We strongly recommend that a Montana attorney review your documents before you sign or file them.</b> Even one meeting to look over your papers can catch problems.</p>'+
    '<p>This page helps you fill in the court’s own form. It is not legal advice, and it does not replace a lawyer.</p>'+
    '<div class="famhelp"><b>Free and low-cost help in Montana</b>'+
    '<a href="https://www.mtlsa.org/apply-for-services/" target="_blank" rel="noopener">Montana Legal Services Association: apply for free legal help</a>'+
    '<span>MLSA HelpLine: <a href="tel:18006666899">1-800-666-6899</a> (Tuesday to Thursday, 9 a.m. to 1 p.m.)</span>'+
    '<a href="https://www.montanalawhelp.org/" target="_blank" rel="noopener">MontanaLawHelp.org: free forms, guides and help finding a lawyer</a>'+
    '<a href="https://www.montanalawhelp.org/organizations/montana-lawyer-referral-and-information-service-lris" target="_blank" rel="noopener">State Bar of Montana Lawyer Referral and Information Service</a>'+
    '<a href="https://courts.mt.gov/selfhelp/" target="_blank" rel="noopener">Court Self-Help Law Centers: free help with court forms</a></div>'+
    (kind==='pp'||kind==='dd'?'<p class="note" style="margin-top:10px">If you are afraid of the other parent or your spouse, tell your lawyer and the court. Mediation is not required when there is reason to suspect domestic violence.</p>':'')+'</div>';
}
function famForms(kind,lead){
  return '<details class="learn famforms" open><summary>The official court forms</summary><div class="lb"><p>'+lead+'</p><ul class="famlinks">'+
    FAM_PACKET[kind].map(function(x){ return '<li><a href="'+x[1]+'" target="_blank" rel="noopener">'+esc(x[0])+'</a></li>'; }).join('')+'</ul></div></details>';
}
function famBefore(points){
  return '<details class="learn ctbefore"><summary>Before you file</summary><div class="lb">'+points.map(function(x){
    return '<p class="gterm"><b>'+esc(x[0])+'.</b> '+esc(x[1])+'</p>'; }).join('')+'</div></details>';
}
function famYou(p){
  var s=fs(p), j=s.filing==='joint';
  var h=fR(p,'filing','How is the case filed?',[['sep','One person files and the other responds'],['joint','We are filing together (a joint petition)']])+
    fR(p,'me','You are the',[['1',j?'Co-Petitioner 1':'Petitioner (the person who filed)'],['2',j?'Co-Petitioner 2':'Respondent (the person who was served)']])+
    fT(p,'myname','Your full name')+fT(p,'myaddr','Your mailing address, city, state and ZIP')+fT(p,'myphone','Your phone number')+fT(p,'myemail','Your email (optional)')+
    fT(p,'other',p==='pp'?'The other parent’s full name':'Your spouse’s full name')+
    (p==='pp'?fT(p,'otheraddr','The other parent’s mailing address, city, state and ZIP'):'')+
    '<label class="fl" for="'+famId(p,'county')+'">County where the case is filed</label><select id="'+famId(p,'county')+'" onchange="fSet(\''+p+'\',\'county\',this.value)"><option value="">Choose a county</option>'+
    allCounties().map(function(c){ return '<option'+(s.county===c?' selected':'')+'>'+c+'</option>'; }).join('')+'</select><div class="note" id="fm-'+p+'-court"></div>'+
    fT(p,'cause','Case number, if the case is already open');
  return famCard('The parties and the court',h,'The top of the form');
}
function famParty(p){
  var s=fs(famP(p)), me=s.me||'1';
  return [s.myname||'__________ (Name)',s.myaddr||'__________ (Mailing Address, City, State Zip Code)',s.myphone||'__________ (Phone Number)',s.myemail||''].filter(Boolean).join('\n')+'\n'+famL(p,me)+'\nAppearing without a lawyer';
}
function famCaption(p,matter){
  return matter+'\n'+fb(famN(p,'1')).toUpperCase()+',\n          '+famL(p,'1')+',\nand\n'+fb(famN(p,'2')).toUpperCase()+',\n          '+famL(p,'2')+'.';
}
function famOutput(doc,label){
  return '<div class="row"><button class="pri" onclick="famBuild(\''+doc+'\')">Build the '+label+'</button></div>'+
    '<div id="fm-'+doc+'-outwrap" class="card" style="display:none"><label class="fl" for="fm-'+doc+'-out">Your '+label+' — check every line, and have a lawyer review it, before you sign it</label>'+
    '<textarea id="fm-'+doc+'-out" style="min-height:320px"></textarea><div class="row"><button class="pri" onclick="famPrint(\''+doc+'\')">Print or save as PDF</button>'+
    '<button class="sec" onclick="copyOut(\'fm-'+doc+'-out\')">Copy the text</button></div></div><div id="fm-'+doc+'-print" class="printout" style="display:none"></div>';
}
var FAM_HEAD=/^(\d+\. )?[A-Z][A-Z0-9 ,’'\-&()\/.]+$/;
function famPrint(doc){
  var txt=($('fm-'+doc+'-out').value||'').trim(); if(!txt){ alert('Build it first.'); return; }
  var b=txt.split(/\n\s*\n/), n=/^MONTANA /.test(b[0])?3:4, head=b.slice(0,n), body=b.slice(n), tgt='fm-'+doc+'-print';
  if(n===3) head.unshift('');
  var cap=esc(head[2]||'').replace(/\n\s{4,}/g,'<br>&emsp;&emsp;&emsp;').replace(/\n/g,'<br>');
  var html=(head[0]?'<div class="plparty">'+esc(head[0]).replace(/\n/g,'<br>')+'</div>':'')+'<div class="plcourt">'+esc(head[1]||'')+'</div>'+
    '<table class="plcap"><tr><td class="plcl">'+cap+'</td><td class="plcr">'+esc(head[3]||'').replace(/\n/g,'<br>')+'</td></tr></table>'+
    body.map(function(x){ var L=x.split('\n'), first=L[0];
      if(FAM_HEAD.test(first) && first.length<90 && /[A-Z]{3}/.test(first)) return '<h4 class="plh">'+esc(first)+'</h4>'+(L.length>1?'<p class="plp">'+esc(L.slice(1).join('\n')).replace(/\n/g,'<br>')+'</p>':'');
      if(/^(DATED|Dated|______)/.test(x)) return '<div class="plsig">'+esc(x).replace(/\n/g,'<br>')+'</div>';
      return '<p class="plp">'+esc(x).replace(/\n/g,'<br>')+'</p>'; }).join('');
  $(tgt).innerHTML='<div class="pvbar noprint"><button class="pri" onclick="reprint(\''+tgt+'\')">Print again</button>'+
    '<button class="sec" onclick="closePrint(\''+tgt+'\')">Close</button></div>'+
    '<div class="pvhint noprint">Laid out in the order of the official form. Choose Save as PDF in the print window to keep a copy.</div><div class="pleading">'+html+'</div>';
  showPrintView(tgt);
}
function famBuild(doc){
  var p=famP(doc), s=fs(p);
  if(!s.county){ alert('Choose the county where the case is filed.'); return; }
  if(!s.myname||!s.other){ alert('Enter both full names at the top of the page.'); return; }
  $('fm-'+doc+'-out').value= doc==='pp'? ppText() : doc==='dd'? ddText() : pdText();
  $('fm-'+doc+'-outwrap').style.display='block';
  try{ $('fm-'+doc+'-outwrap').scrollIntoView({block:'start'}); }catch(e){}
}
function famSign(p,x){
  return 'I declare under penalty of perjury and under the laws of the state of Montana that the information in this document is true and correct. I understand that it is a crime to give false information in this document.\n\n'+
    'DATED this ____ day of ______________, 20___.\n\n______________________________\n'+(famN(p,x)||'Print Name')+'\n'+famL(p,x);
}
function famJudge(order){ return 'ORDER BY THE COURT\n'+order+'\n\nDATED this ____ day of ______________, 20___.\n\n______________________________\nDISTRICT COURT JUDGE / STANDING MASTER'; }

/* ================= parenting plan: MP-300 ================= */
var PP_HOLS=[['thanks','Thanksgiving','Wed. 5:30 p.m. - Sun. 7:00 p.m.'],['win1','First Half of Winter Vacation (includes Christmas)','5:30 p.m. day school lets out to noon of half-way mark'],
  ['win2','Second Half of Winter Vacation (includes New Years)','Noon of half-way mark to 7:00 p.m. of last day of break'],['easter','Easter Weekend','Fri. 5:30 p.m. - Sun. 7:00 p.m.'],
  ['memorial','Memorial Day Weekend','Fri. 5:30 p.m. - Mon. 7:00 p.m.'],['labor','Labor Day Weekend','Fri. 5:30 p.m. - Mon. 7:00 p.m.'],
  ['july4','Fourth of July',''],['halloween','Halloween',''],['mother','Mother’s Day Weekend','Fri. 5:30 p.m. - Sun. 7:00 p.m.'],
  ['father','Father’s Day Weekend','Fri. 5:30 p.m. - Sun. 7:00 p.m.'],['bday1','',''],['bday2','','']];
function ppHolName(h){ return h[0]==='bday1'? famPos('pp','1')+' Birthday' : h[0]==='bday2'? famPos('pp','2')+' Birthday' : h[1]; }
function ppHolOpts(){ var a=famL('pp','1'), b=famL('pp','2');
  return [['1e',a+': every year'],['2e',b+': every year'],['1o',a+': odd years, '+b+': even years'],['1v',a+': even years, '+b+': odd years']]; }
function ppHolSet(k,v){ fs('pp').hol[k]=v; save(); }
function ppHolTimes(k,v){ fs('pp').hol[k+'_t']=v; save(); }

function renderParenting(){
  var box=$('pp-work'); if(!box) return; var s=fs('pp'), c=D.complaint||{}, P='pp';
  if(!s.myname && c['cp-name']) s.myname=c['cp-name'];
  if(!s.filing) s.filing='sep'; if(!s.me) s.me='1';
  var L1=famL(P,'1'), L2=famL(P,'2');
  var h=famPacket('pp')+famWarn('pp');
  h+=famForms('pp','This page follows the court’s Proposed Parenting Plan, form MP-300, section by section, in the same order and with the same choices. Use it to fill in the official form, or print the draft and compare it line by line. The complete packet has every form you need to start a parenting case, and instructions.');
  h+=famBefore([
    ['Who can file','Either parent, or both together. Montana can usually decide only if Montana is the children’s home state: they lived here for the 6 months before the case was filed, or since birth if they are younger. Section 40-7-201, MCA.'],
    ['What the court decides by','The children’s best interests. The court weighs the factors in § 40-4-212, MCA, including frequent and continuing contact with both parents, unless a hearing shows that contact would harm the children.'],
    ['What a plan must cover','Section 40-4-234, MCA lists what a final parenting plan includes: where the children live and when, holidays and vacations, decision-making, and how you settle disagreements.'],
    ['After you file','The other parent has 21 days after being served to file a response. The court may order mediation, but not when there is reason to suspect domestic violence or abuse, unless both parents agree to it in writing.'],
    ['Child support','Support is set by the Montana Child Support Guidelines. The forms call the state agency the Child Support Enforcement Division (CSED). It is now named the Child Support Services Division (CSSD).'],
    ['Children’s privacy','The form uses each child’s initials, not their full name.']]);
  h+=famYou(P);
  h+=famCard('About this plan',
    fR(P,'ctype','This parenting plan is part of',[['parenting','A parenting case (In re the Parenting of)'],['marriage','A divorce (In re the Marriage of)']])+
    fS(P,'whose','Whose plan is it?',[['1',famPos(P,'1')],['2',famPos(P,'2')],['agreed','Agreed'],['court','Court Ordered']])+
    fS(P,'status','Proposed or amended?',['Proposed','Amended']),'The title box on page 1');
  h+=famCard('1. Identification of the Parties',fNote('Filled in from the names and addresses above: a. '+L1+', b. '+L2+'.'));
  h+=famCard('2. Identification of the Child(ren)',fNote('This parenting plan applies to the following minor child(ren) of the parties. Use initials only.')+
    fRows(P,'kids',[['i','Child’s initials','','A.B.'],['age','Age','','7'],['yr','Year of birth','','2019'],['st','State of residence for last 6 months','','Montana']],'Add a child'));
  h+=famCard('3. Objectives of the Parenting Plan',fNote('These six objectives are printed on the form and go into your plan as written: protect the children’s best interests, provide for their physical care, maintain their emotional stability and minimize their exposure to parental conflict, provide for their changing needs, set out each parent’s authority and responsibilities, and help the parents avoid expensive future court battles.'));

  // 4 residential schedules
  var r='';
  r+=fR(P,'pre','a. Pre-School Schedule (choose one). Pre-school age means children who are not old enough to start kindergarten.',[['all','All child(ren) are school age.'],['school','There are pre-school age child(ren), but the school schedule in 4(b) applies to all of them.'],['mostly','Before school age, the child(ren) live mostly with one parent, except set days and times'],['desc','Describe the pre-school schedule']]);
  if(s.pre==='mostly') r+=fSub(fPS(P,'preWho','They live mostly with')+fA(P,'preTxt','Days and times the other parent has parenting time','Every other weekend from Friday 5:30 p.m. to Sunday 7:00 p.m., and Wednesdays from 3:00 p.m. to 7:00 p.m.'));
  if(s.pre==='desc') r+=fSub(fA(P,'preTxt','What day and time the child(ren) will be with each parent before they are old enough to start school'));
  r+=fR(P,'sch','b. School Schedule (choose one). Applies to child(ren) old enough to be in school.',[['mostly','When they start school, the child(ren) live mostly with one parent, except set days and times'],['desc','Describe the schedule']]);
  if(s.sch==='mostly') r+=fSub(fPS(P,'schWho','They live mostly with')+fA(P,'schTxt','Days and times the other parent has parenting time'));
  if(s.sch==='desc') r+=fSub(fA(P,'schTxt','The schedule for the minor child(ren)','Week on, week off, with exchanges Fridays at 5:30 p.m.'));
  r+=fR(P,'holMode','c. Holiday and Special Occasion Schedule',[['none','No holiday schedule applies. The school or pre-school schedule is followed.'],['chart','Use the holiday chart on the form'],['custom','Write our own holiday schedule']]);
  if(s.holMode==='custom') r+=fSub(fA(P,'holTxt','The schedule for holidays and special occasions is'));
  if(s.holMode==='chart') r+=fSub(fNote('Choose who has each holiday, and odd or even-numbered years. The times printed on the form are shown under each holiday.')+'<table class="holtab">'+PP_HOLS.map(function(x){ var v=s.hol[x[0]]||'';
      return '<tr><td>'+esc(ppHolName(x))+(x[2]?'<div class="note">('+esc(x[2])+')</div>':'')+
        ((x[0]==='july4'||x[0]==='halloween')?'<input type="text" aria-label="Times for '+esc(x[1])+'" placeholder="Times" value="'+esc(s.hol[x[0]+'_t']||'')+'" oninput="ppHolTimes(\''+x[0]+'\',this.value)">':'')+'</td>'+
        '<td><select aria-label="'+esc(ppHolName(x))+'" onchange="ppHolSet(\''+x[0]+'\',this.value)"><option value="">Not listed</option>'+
        ppHolOpts().map(function(o){ return '<option value="'+o[0]+'"'+(v===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select></td></tr>'; }).join('')+'</table>');
  r+=fA(P,'winTxt','d. Winter Vacation: the time the child(ren) will spend with each parent over winter vacation, if not listed in the table above');
  r+=fR(P,'sum','e. Summer Vacation (choose one)',[['none','No summer schedule applies. The school or pre-school schedule is followed.'],['mostly','The child(ren) live with one parent during summer, except set days and times'],['desc','Describe the summer schedule']]);
  if(s.sum==='mostly') r+=fSub(fPS(P,'sumWho','During summer vacations they live with')+fA(P,'sumTxt','Days and times with the other parent'));
  if(s.sum==='desc') r+=fSub(fA(P,'sumTxt','The time the child(ren) will spend with each parent over summer vacation'));
  r+=fR(P,'spr','f. Spring Break (choose one)',[['none','No spring break schedule applies. The school or pre-school schedule is followed.'],['mostly','The child(ren) live with one parent during spring break, except set days and times'],['desc','Describe the spring break schedule']]);
  if(s.spr==='mostly') r+=fSub(fPS(P,'sprWho','During spring break they live with')+fA(P,'sprTxt','Days and times with the other parent'));
  if(s.spr==='desc') r+=fSub(fA(P,'sprTxt','The time the child(ren) will spend with each parent over spring break'));
  r+=fA(P,'othVac','g. Other Vacations with Parents: the time the child(ren) will spend with each parent for any other vacations');
  r+=fR(P,'pri','h. Priorities. School attendance always comes first. If two schedules overlap, the parents will',[['order','Follow the schedules in a ranked order'],['other','Something else']]);
  if(s.pri==='order') r+=fSub(fNote('1 is most important, 4 is least important.')+fS(P,'priHol','Holidays and Special Occasions',['1','2','3','4'])+fS(P,'priBrk','Winter / Summer / Spring Break',['1','2','3','4'])+fS(P,'priVac','Other Vacations with Parents',['1','2','3','4'])+fS(P,'priPre','Pre-School Schedule',['1','2','3','4']));
  if(s.pri==='other') r+=fSub(fA(P,'priTxt','How the parents will decide'));
  r+=fR(P,'sup','i. Supervised and Limited Visitation (choose one)',[['no','The residential schedules above are not limited or restricted.'],['yes','One parent’s parenting time is supervised or limited']]);
  if(s.sup==='yes') r+=fSub(fPS(P,'supWho','Whose parenting time is supervised or limited')+
    fA(P,'supWhy','(i) The behavior that parent has shown that is not in the child(ren)’s best interests')+
    fA(P,'supCond','(ii) The conditions on that parent’s parenting time')+fT(P,'supHow','How often and for how long')+fT(P,'supWhere','Where')+fT(P,'supBy','Supervised by whom')+
    fNote('(iii) The form says the supervision conditions take priority over the rest of the schedule.')+
    '<p class="fl">(iv) Programs that parent must complete before less restricted visitation is considered (check all that apply)</p>'+
    fC(P,'prAlc','Alcohol / drug evaluation')+fC(P,'prSub','Substance abuse treatment')+fC(P,'prPsy','Psychological evaluation')+fC(P,'prAng','Anger management counseling')+fC(P,'prPar','Parenting classes')+
    fT(P,'prOth','Other program')+fT(P,'supMonths','Months of supervised and limited visitation before a change is considered','6'));
  r+=fA(P,'resOther','j. Other. You can write your own plan here instead of, or in addition to, 4(a) through 4(i)');
  h+=famCard('4. Residential Schedules for the Child(ren)',r);

  h+=famCard('5. Benefit Programs and Dependents for Taxes',
    fR(P,'ben','Benefit programs: some state and federal programs require one parent to be named custodian. This does not change parenting rights.',[['cust','Name one parent as custodian'],['other','Something else']])+
    (s.ben==='cust'?fSub(fPS(P,'benWho','Designated custodian')):'')+(s.ben==='other'?fSub(fA(P,'benTxt','Specify')):'')+
    fS(P,'tax1',famL(P,'1')+' claims all of the children as dependents',[['every','every tax year'],['odd','in odd-numbered tax years'],['even','in even-numbered tax years']])+
    fS(P,'tax2',famL(P,'2')+' claims all of the children as dependents',[['every','every tax year'],['odd','in odd-numbered tax years'],['even','in even-numbered tax years']])+
    fA(P,'taxOther','Other tax arrangement (specify)'));
  h+=famCard('6. Transportation (choose all that apply)',
    fC(P,'trHow','How the child(ren) will get from one parent to the other',1)+(s.trHow?fSub(fA(P,'trHowTxt','Describe')):'')+
    fC(P,'trPlace','Unless both parents agree, a set place to drop off and pick up',1)+(s.trPlace?fSub(fT(P,'trPlaceTxt','The place')):'')+
    fC(P,'trCost','How any transportation cost will be paid',1)+(s.trCost?fSub(fA(P,'trCostTxt','Describe')):'')+
    fC(P,'trLate','Parenting time is canceled if a parent is late to pick up',1)+(s.trLate?fSub(fT(P,'trLateMin','Minutes late','30')):''));
  h+=famCard('7. Passport (choose all that apply)',
    fC(P,'psNone','Our children don’t have a passport',1)+(s.psNone?fSub(fPS(P,'psApply','Who may apply for a passport (the other parent shall cooperate)')):'')+
    fC(P,'psHave','If our children have a passport, it belongs to them, and one parent keeps it',1)+(s.psHave?fSub(fPS(P,'psCust','Custodian of the passport')):'')+
    fT(P,'psOther','Other (specify)'));
  h+=famCard('8. Travel with the Child(ren) (choose all that apply)',
    fPS(P,'tvFree','May travel freely in Montana with the children, in keeping with the parenting schedule',[['B','Both parents']])+
    fC(P,'tvNotify','Both parents must notify the other parent when traveling out of Montana with the child(ren) and provide an itinerary')+
    fT(P,'tvOther','Other (specify)'));
  h+=famCard('9. Telephone Contact (choose one)',
    fR(P,'tel','While the child(ren) are with one parent, the other parent may speak with them',[['reas','at reasonable times'],['set','only at set times']])+
    (s.tel==='set'?fSub(fT(P,'telTxt','The times','Daily between 6:00 p.m. and 7:30 p.m.')):''));
  h+=famCard('10. Co-Parenting Guidelines (choose all that apply)',
    fC(P,'cgPromote','Each parent promotes a healthy relationship with the other parent and does not speak negatively about them')+
    fC(P,'cgNotice','Notice before missing or rescheduling parenting time',1)+(s.cgNotice?fSub(fT(P,'cgDays','Days of notice','2')):'')+
    fC(P,'cgClothes','Each parent sends the child(ren)’s clothing, and it is returned with the child(ren)')+
    fC(P,'cgSeparate','Each parent keeps separate clothes at their own home, including cold-weather gear')+
    fC(P,'cgSpecial','A parent planning a special activity checks on and returns any special clothing or equipment')+
    fC(P,'cgActs','Each parent makes sure the child(ren) attend regularly scheduled activities during their time')+
    fC(P,'cgExpose','Neither parent will let the child(ren) be exposed to certain things',1)+
    (s.cgExpose?fSub(fC(P,'exAlc','Persons abusing alcohol or using illegal drugs within 24 hours of contact with the child(ren), including the parent')+fC(P,'exSmoke','Smoking environment')+
      fC(P,'exProf','Use of profane language')+fC(P,'exRemove','Removal of the child(ren) from Montana, except as authorized by the Court or agreed by both parents')+fT(P,'exOth1','Other')+fT(P,'exOth2','Other')):'')+
    fC(P,'cgRel','Relationships with relatives and family friends on both sides will be protected and encouraged'));
  var dm=fNote('Printed on the form: both parents may make emergency decisions, and each parent makes day-to-day decisions while the children are with them.')+
    fR(P,'dm','Major decisions',[['joint','We make some or all major decisions together'],['sole','One parent is the sole decision maker']]);
  if(s.dm==='joint') dm+=fSub(
    fC(P,'dEdu','Education together',1)+(s.dEdu?fPS(P,'dEduTie','If we cannot agree on education, the decision is made by'):'')+
    fC(P,'dHea','Non-emergency health care together',1)+(s.dHea?fPS(P,'dHeaTie','If we cannot agree on health care, the decision is made by'):'')+
    fC(P,'dSpi','Spiritual development together',1)+(s.dSpi?fPS(P,'dSpiTie','If we cannot agree on spiritual development, the decision is made by',[['E','Either party during their own parenting time']]):'')+
    fC(P,'dExt','Extra-curricular activities together',1)+(s.dExt?fPS(P,'dExtTie','If we cannot agree on extra-curricular activities, the decision is made by',[['E','Either party during their own parenting time']]):''));
  if(s.dm==='sole') dm+=fSub(fPS(P,'soleWho','Sole decision maker')+fC(P,'soEdu','Education')+fC(P,'soHea','Non-emergency health care')+fC(P,'soSpi','Spiritual development')+fC(P,'soExt','Extra-curricular activities')+
    fA(P,'soleWhy','This is in our children’s best interest because'));
  dm+=fT(P,'dmOther','Other (specify)')+'<p class="fl">Both parents must consent before a child may (check all that apply)</p>'+fC(P,'coTat','Get a tattoo')+fC(P,'coPie','Pierce any body part')+fC(P,'coMar','Marry')+fC(P,'coEnl','Enlist in the armed services')+fT(P,'coOth','Other');
  h+=famCard('11. Decision Making',dm);
  h+=famCard('12. Access to Information',fNote('Printed on the form: both parents have access to all records about the children (§ 40-4-225, MCA), and the form says both will give each other and the Court written notice of changes to addresses, phone numbers, employers and health insurance. Section 40-4-204(6)(a), MCA requires those updates to be filed with the Court.')+
    fC(P,'conf','One parent’s personal information should stay confidential',1)+(s.conf?fSub(fPS(P,'confWho','Whose information')+fA(P,'confWhy','Because')):''));
  h+=famCard('13. Residential Changes',fNote('Printed on the form, from § 40-4-217, MCA: a parent who plans to move must give written notice. If the move will significantly affect the children’s contact with the other parent, the moving parent files a motion and a proposed revised schedule, served at least 30 days before the move. The other parent has 21 days to respond, or the new schedule may be ordered without more hearings. Nothing to fill in. Form MP-904 is the notice.'));
  h+=famCard('14. Review of Parenting Plan (choose one)',fR(P,'rev','The parents will review and amend this plan',[['times','at set times'],['change','only if there is a change in the children’s circumstances']])+(s.rev==='times'?fSub(fT(P,'revTxt','When','Before each child starts kindergarten and again before middle school')):''));
  h+=famCard('15. Dispute Resolution (choose one)',fR(P,'dr','When we disagree about this plan',[['steps','Informal discussion first, then a professional mediator if possible, then a motion to the court'],['dv','Mediation is not appropriate because there is reason to suspect domestic violence']])+
    (s.dr==='steps'?fSub(fT(P,'medName','Our first choice of mediator (optional)')+fT(P,'medPct1',famL(P,'1')+' pays this percent of the mediator’s cost','50')+fT(P,'medPct2',famL(P,'2')+' pays this percent','50')):''));

  // 16 child support
  var cs=fR(P,'cs','Child support (choose one)',[['amount','a. We know the amount'],['calc','b. Child support still needs to be calculated']]);
  if(s.cs==='amount') cs+=fSub(fPS(P,'csPayer','Who pays')+fT(P,'csAmt','Amount per child per month','$')+
    fR(P,'csBasis','Because',[['csed','It matches the attached final CSED order signed by the Administrative Law Judge'],['calc','It matches a child support calculation'],['diff','It does not match a calculation, but it is in the children’s best interest']])+
    (s.csBasis==='calc'?fPS(P,'csBy','Calculation prepared by',[['court','The Court'],['other','Someone else']]):'')+
    (s.csBasis==='diff'?fS(P,'csBy','The calculation it differs from was prepared by',[['csed','Child Support Enforcement Division'],['1',famL(P,'1')],['2',famL(P,'2')],['court','The Court'],['other','Someone else']])+fA(P,'csWhy','Why this amount is in the children’s best interest'):'')+
    ((s.csBasis==='calc'||s.csBasis==='diff')&&s.csBy==='other'?fT(P,'csByOther','Who prepared it'):'')+fNote('Attach a copy of the CSED order or the calculation.'));
  if(s.cs==='calc') cs+=fSub(fR(P,'csCalc','How it will be calculated',[['open','CSED has already opened a case'],['will','One parent will open a CSED case within 30 days of signing this plan'],['other','Other']])+
    (s.csCalc==='open'?fT(P,'csCase','CSED case number')+fPS(P,'csFiler','Who will file the CSED order with the request for a hearing'):'')+
    (s.csCalc==='will'?fPS(P,'csOpener','Who will open the CSED case')+fNote('The form warns that some courts do not allow this option.'):'')+(s.csCalc==='other'?fA(P,'csCalcTxt','Describe'):''));
  cs+=fR(P,'csPay','c. Child Support Payments (choose one)',[['csed','Paid to CSED on or before the first of every month'],['iw','Paid by immediate income withholding'],['direct','Paid directly to the other parent'],['clerk','Paid to the Clerk of District Court on or before the first of each month']]);
  if(s.csPay&&s.csPay!=='iw') cs+=fSub(fPS(P,'csPayWho','Who makes the payments')+(s.csPay==='direct'?fT(P,'csDay','Day of each month','1st')+fC(P,'csExempt','The order is exempt from immediate income withholding',1)+(s.csExempt?fA(P,'csExemptWhy','Because'):''):'')+
    (s.csPay==='csed'?fNote('The form says payments must go through CSED if a party receives TANF or Family Medicaid, or there is an active CSED case. Section 40-5-909, MCA.'):''));
  if(s.csPay==='iw') cs+=fSub(fPS(P,'csIwWho','Whose income is subject to immediate income withholding'));
  cs+=fR(P,'csEnd','d. Child Support Termination (choose one)',[['std','When each child turns 18 or graduates from high school, whichever is later, but no later than age 19'],['dis','Support continues for a child who is disabled past the age of majority']]);
  if(s.csEnd==='dis') cs+=fSub(fPS(P,'csDisWho','Who agrees to keep paying')+fT(P,'csDisKid','The child’s initials')+fT(P,'csDisUntil','Paid until (month and year)'));
  h+=famCard('16. Child Support',cs);
  h+=famCard('17. Medical Support (choose one)',fR(P,'med','Medical support order',[['incl','It is included in the attached Child Support Order'],['sep','It is separate, and I am attaching it'],['adopt','There is no medical support order, and the court should adopt the attached one (form MP-300-G)']])+
    fNote('The form then lists both parents’ insurance responsibilities and the notice about civil penalties under § 40-5-821, MCA. Those are printed in your plan as written.'));
  h+=famCard('18. Other Provisions',fA(P,'other18','Anything else','Neither parent will discuss this case with the children.'));
  h+=famCard('19. Request for Parenting Plan be Ordered by the Court',fS(P,'req','Who asks the Court to adopt this plan',famParties(P,[['B','Both']]))+
    fNote('Your plan ends with the form’s warning about contempt, both parents’ signature lines under penalty of perjury, and the Order by the Court for the judge.'));
  h+=famPacketReminder('pp')+famOutput('pp','parenting plan');
  box.innerHTML=h; famCourtName(P);
}

function ppText(){
  var P='pp', s=fs(P), L=function(x){ return famL(P,x); };
  var kids=famFilled(P,'kids');
  var title=(s.whose==='agreed'?'AGREED ':s.whose==='court'?'COURT ORDERED ':s.whose?famPos(P,s.whose).toUpperCase()+' ':'')+(s.status==='Amended'?'AMENDED':'PROPOSED')+' PARENTING PLAN';
  var matter= s.ctype==='marriage'? 'IN RE THE MARRIAGE OF:' : 'IN RE THE PARENTING OF:\n'+(kids.length?kids.map(function(k){ return fb(k.i); }).join(', '):'__________')+',';
  var out=[famParty(P), famCourt(s.county), famCaption(P,matter), 'Case No. '+fb(s.cause)+'\n'+title];
  var sec=function(t,lines){ out.push(t+'\n'+lines.filter(function(x){ return x!==null&&x!==''; }).join('\n')); };
  var txt=function(v){ return fb(fbs(v)); };
  sec('1. IDENTIFICATION OF THE PARTIES',['a. '+famPos(P,'1')+' Name: '+fb(famN(P,'1'))+'\nAddress: '+fb(famA(P,'1')),'b. '+famPos(P,'2')+' Name: '+fb(famN(P,'2'))+'\nAddress: '+fb(famA(P,'2'))]);
  sec('2. IDENTIFICATION OF THE CHILD(REN)',['This parenting plan applies to the following minor child(ren) of the parties:'].concat(
    (kids.length?kids:[{}]).map(function(k){ return 'Child’s Initials: '+fb(k.i)+'   Age: '+fb(k.age)+'   Year of Birth: '+fb(k.yr)+'   State of residence for last 6 months: '+fb(k.st); })));
  sec('3. OBJECTIVES OF THE PARENTING PLAN',['a. To protect the best interest(s) of the minor child(ren);','b. To provide for the physical care of the minor child(ren);',
    'c. To maintain the child(ren)’s emotional stability and minimize the child(ren)’s exposure to parental conflict;','d. To provide for the minor child(ren)’s changing needs as they grow and mature;',
    'e. To set forth the authority and responsibilities of each parent with respect to the minor child(ren);','f. To help the parents avoid expensive future court battles over the minor child(ren).']);
  var r=[];
  r.push('a. Pre-School Schedule: '+({all:'All child(ren) are school age.',school:'There are pre-school age child(ren), but the school schedule in paragraph 4(b) applies to all children regardless of their age(s).',
    mostly:'Before they are old enough to start school, the child(ren) will live mostly with the '+fb(L(s.preWho)&&s.preWho?L(s.preWho):'')+', except for the following days and times when the other parent will have parenting time with the child(ren): '+txt(s.preTxt)+'.',
    desc:'The schedule on what day and time the child(ren) will be with each parent before they are old enough to start school: '+txt(s.preTxt)+'.'}[s.pre]||'__________'));
  r.push('b. School Schedule: '+({mostly:'When they start school, the child(ren) will live mostly with the '+fb(s.schWho?L(s.schWho):'')+', except for the following days and times when the other parent will have parenting time with the child(ren): '+txt(s.schTxt)+'.',
    desc:'The schedule for the minor child(ren): '+txt(s.schTxt)+'.'}[s.sch]||'__________'));
  var hol='c. Holiday and Special Occasion Schedule: ';
  if(s.holMode==='none') hol+='No holiday and special occasion schedule applies. The school schedule in paragraph 4(b) or pre-school schedule in paragraph 4(a) will be followed by both parents.';
  else if(s.holMode==='custom') hol+='The schedule for holidays and special occasions is: '+txt(s.holTxt)+'.';
  else if(s.holMode==='chart'){ hol+='(Odd or even-numbered years as specified)';
    PP_HOLS.forEach(function(x){ var v=s.hol[x[0]]; if(!v) return; var a=L('1'), b=L('2');
      var w= v==='1e'? a+': every year' : v==='2e'? b+': every year' : v==='1o'? a+': odd-numbered years; '+b+': even-numbered years' : a+': even-numbered years; '+b+': odd-numbered years';
      var t= x[2]? ' ('+x[2]+')' : (x[0]==='july4'||x[0]==='halloween')? ' (Times: '+fb(s.hol[x[0]+'_t'])+')' : '';
      hol+='\n     '+ppHolName(x)+t+' — '+w+'.'; }); }
  else hol+='__________';
  r.push(hol);
  r.push('d. Winter Vacation: '+(fbs(s.winTxt)?fbs(s.winTxt)+'.':'As set out in the holiday and special occasion schedule above.'));
  var brk=function(k,name,season){ var m=s[k];
    if(m==='none') return 'No '+name+' schedule applies. The school schedule in paragraph 4(b) or pre-school schedule in paragraph 4(a) will be followed by both parents.';
    if(m==='mostly') return 'The child(ren) will live with the '+fb(s[k+'Who']?L(s[k+'Who']):'')+' during '+season+', except for these days and times when the child(ren) will spend time with the other parent: '+txt(s[k+'Txt'])+'.';
    if(m==='desc') return 'The time the child(ren) will spend with each parent over '+season+': '+txt(s[k+'Txt'])+'.';
    return '__________'; };
  r.push('e. Summer Vacation: '+brk('sum','summer vacation','summer vacations'));
  r.push('f. Spring Break: '+brk('spr','Spring Break','Spring Break'));
  r.push('g. Other Vacations with Parents: '+(fbs(s.othVac)?fbs(s.othVac)+'.':'None.'));
  var pr='h. Priorities under the Residential Schedule: School attendance takes priority over the holiday and special occasion schedule. The child(ren) must attend school and then follow the holiday and special occasion schedule. If the schedules in this Parenting Plan say the child(ren) are with both parents at the same time for a time other than school, to figure out where the child(ren) should be, the parents will ';
  if(s.pri==='order') pr+='follow the schedules in this order (1 is most important, 4 is least important): '+fb(s.priHol)+' Holidays and Special Occasions; '+fb(s.priBrk)+' Winter/Summer/Spring Break; '+fb(s.priVac)+' Other Vacations with Parents; '+fb(s.priPre)+' Pre-School Schedule.';
  else if(s.pri==='other') pr+='do the following: '+txt(s.priTxt)+'.'; else pr+='__________.';
  r.push(pr);
  if(s.sup==='yes'){ var sw=s.supWho, so=sw==='1'?'2':sw==='2'?'1':'';
    var progs=[s.prAlc&&'Alcohol / drug evaluation',s.prSub&&'Substance abuse treatment',s.prPsy&&'Psychological evaluation',s.prAng&&'Anger management counseling',s.prPar&&'Parenting classes',fbs(s.prOth)].filter(Boolean);
    r.push('i. Supervised and Limited Visitation:\n     (i) The '+fb(sw?famPos(P,sw):'')+' parenting time shall be supervised or limited because that parent has exhibited the following behavior which is not in the best interest(s) of the minor child(ren): '+txt(s.supWhy)+'.'+
      '\n     (ii) It is in the best interest(s) of the minor child(ren) that the '+fb(sw?famPos(P,sw):'')+' parenting time be subject to the following conditions: '+txt(s.supCond)+'.'+
      '\n     How Often/For How Long: '+txt(s.supHow)+'\n     Where: '+txt(s.supWhere)+'\n     Supervised by Whom: '+txt(s.supBy)+
      '\n     (iii) The supervised and limited visitation conditions shall take priority over any other terms of the residential schedule above.'+
      (progs.length?'\n     (iv) If the '+fb(sw?L(sw):'')+' has completed the following and has followed through with any and all recommendations by the evaluator, treatment counselor, and/or other professional recommendations, the '+fb(so?L(so):'')+' agrees to consider a modification to allow less restricted visitation after '+fb(s.supMonths)+' months of supervised and limited visitation: '+progs.join('; ')+'.':''));
  } else r.push('i. Supervised and Limited Visitation: '+(s.sup==='no'?'The residential schedules listed above are not limited or restricted.':'__________'));
  if(fbs(s.resOther)) r.push('j. Other: '+fbs(s.resOther)+'.');
  sec('4. RESIDENTIAL SCHEDULES FOR THE CHILD(REN)',r);
  var b5=[];
  b5.push('a. Benefit Programs: '+(s.ben==='cust'?'For the purposes of state and federal benefit programs that require a designation of custodian the '+fb(s.benWho?L(s.benWho):'')+' is designated custodian.':s.ben==='other'?txt(s.benTxt)+'.':'__________'));
  var tx=function(x){ var v=s['tax'+x]; return v? L(x)+' will claim all of our children as dependents on their income tax '+(v==='every'?'every tax year':v==='odd'?'in odd-numbered tax years':'in even-numbered tax years')+'.' : ''; };
  b5.push('b. Taxes: '+[tx('1'),tx('2'),fbs(s.taxOther)?fbs(s.taxOther)+'.':''].filter(Boolean).join(' ')+(s.tax1||s.tax2||fbs(s.taxOther)?' ':'__________ ')+'Each parent will fill out the necessary tax forms to claim our children as dependents for income tax purposes. This arrangement will begin in the tax year our parenting plan is signed by the court.');
  sec('5. BENEFIT PROGRAMS AND DEPENDENTS FOR TAXES',b5);
  var t6=[]; if(s.trHow) t6.push('This is how the child(ren) will get from one parent to the other: '+txt(s.trHowTxt)+'.');
  if(s.trPlace) t6.push('Unless both parents agree, the parents will meet to drop off and pick up the child(ren) at this place: '+txt(s.trPlaceTxt)+'.');
  if(s.trCost) t6.push('If there is a cost to get the child(ren) from one parent to the other, this is how the cost will be paid: '+txt(s.trCostTxt)+'.');
  if(s.trLate) t6.push('If a parent is more than '+fb(s.trLateMin)+' minutes late to pick up the child(ren), the parenting time will be canceled.');
  sec('6. TRANSPORTATION',t6.length?t6:['__________']);
  var t7=[]; if(s.psNone) t7.push('Our children don’t have a passport.'+(s.psApply?' The '+L(s.psApply)+' may apply for a passport for any of our children. The other parent shall cooperate by consenting to the issuance of this passport.':''));
  if(s.psHave) t7.push('If our children have a passport, it belongs to them. But the '+fb(s.psCust?L(s.psCust):'')+' will be the custodian of the passport.');
  if(fbs(s.psOther)) t7.push(fbs(s.psOther)+'.');
  sec('7. PASSPORT',t7.length?t7:['__________']);
  var t8=[]; if(s.tvFree) t8.push((s.tvFree==='B'?'Both parents':'The '+L(s.tvFree))+' may travel freely in the State of Montana with our children. This travel must be in keeping with our parenting time schedule.');
  if(s.tvNotify) t8.push('Both parents must notify the other parent when they are traveling out of the State of Montana with the child(ren) and provide an itinerary.');
  if(fbs(s.tvOther)) t8.push(fbs(s.tvOther)+'.');
  sec('8. TRAVEL WITH THE CHILD(REN)',t8.length?t8:['__________']);
  sec('9. TELEPHONE CONTACT',[s.tel==='reas'?'While the child(ren) are with one parent, the other parent may speak with the child(ren) at reasonable times.':s.tel==='set'?'While the child(ren) are with one parent, the other parent may only speak with the child(ren) at the following times: '+txt(s.telTxt)+'.':'__________']);
  var g=[];
  if(s.cgPromote) g.push('Each parent shall promote a healthy, beneficial relationship between the child(ren) and the other parent and shall not demean or speak out negatively in any manner that would damage the relationship between either parent and the child(ren).');
  if(s.cgNotice) g.push('Each parent will notify the other parent at least '+fb(s.cgDays)+' days in advance if the parent needs to miss or reschedule parenting time. The missed time will be rescheduled if both parents agree. Both parents are expected to be reasonable in rescheduling parenting time.');
  if(s.cgClothes) g.push('Each parent will supply the appropriate child(ren)’s clothing with them for their scheduled time with the other parent. These clothes are to be considered the child(ren)’s clothes and will be returned with the child(ren).');
  if(s.cgSeparate) g.push('Each parent will provide separate clothes for the child(ren) at their own residence, unless mutually agreed to by both parents. In the cold months of the year, both parents are required to have adequate boots, gloves, hats, and jackets for the child(ren), unless mutually agreed to by both parents.');
  if(s.cgSpecial) g.push('If a parent plans a special activity that requires clothing and/or equipment that would normally not be with the child(ren), it is that parent’s responsibility to check to see if the child(ren) have such clothing and/or equipment with the other parent, to ask that the clothing and/or equipment travels with the child(ren), and to ensure that the clothing and/or equipment is returned with the child(ren).');
  if(s.cgActs) g.push('Each parent will be responsible for ensuring that the child(ren) attend regularly scheduled activities, including but not limited to sports and extra-curricular activities, while the child(ren) are with that parent.');
  if(s.cgExpose){ var ex=[s.exAlc&&'Persons abusing alcohol or using illegal drugs within 24 hours of contact with the child(ren). This includes the abuse of alcohol or the use of illegal drugs by the parent.',s.exSmoke&&'Smoking environment.',s.exProf&&'Use of profane language.',
      s.exRemove&&'Removal of the child(ren) from Montana, except as authorized by the Court or mutually agreed to by both parents.',fbs(s.exOth1)&&fbs(s.exOth1)+'.',fbs(s.exOth2)&&fbs(s.exOth2)+'.'].filter(Boolean);
    g.push('Neither parent will permit the child(ren) to be subjected to:'+ex.map(function(x){ return '\n     • '+x; }).join('')); }
  if(s.cgRel) g.push('Relationships between the child(ren) and relatives and family friends on both sides of the family will be protected and encouraged. The parents will have their child(ren) maintain ties with both the maternal and paternal relatives.');
  sec('10. CO-PARENTING GUIDELINES',g.length?g.map(function(x,i){ return String.fromCharCode(97+i)+'. '+x; }):['__________']);
  var d=['Both parents have the right to make emergency decisions affecting the health or safety of our children. We have the right to make decisions about the day-to-day care and control of our children while they are with us.'];
  var tie=function(v){ return v==='E'? 'either party during their respective parenting time' : v? 'the '+L(v) : '__________'; };
  if(s.dm==='joint'){
    if(s.dEdu) d.push('We will make major decisions about our children’s education together. If we cannot agree, the decision will be made by '+tie(s.dEduTie)+'.');
    if(s.dHea) d.push('We will make major decisions about our children’s non-emergency health care together. If we cannot agree, the decision will be made by '+tie(s.dHeaTie)+'.');
    if(s.dSpi) d.push('We will make major decisions about our children’s spiritual development together. If we cannot agree, the decision will be made by '+tie(s.dSpiTie)+'.');
    if(s.dExt) d.push('We will make major decisions about our children’s extra-curricular activities together. If we cannot agree, the decision will be made by '+tie(s.dExtTie)+'.');
  } else if(s.dm==='sole'){ var ar=[s.soEdu&&'education',s.soHea&&'non-emergency health care',s.soSpi&&'spiritual development',s.soExt&&'extra-curricular activities'].filter(Boolean);
    d.push('The '+fb(s.soleWho?L(s.soleWho):'')+' will be the sole decision maker about major decisions for our children’s lives, including '+(ar.length?ar.join(', '):'__________')+'. This is in our children’s best interest because: '+txt(s.soleWhy)+'.'); }
  if(fbs(s.dmOther)) d.push('Other: '+fbs(s.dmOther)+'.');
  var co=[s.coTat&&'Get a tattoo',s.coPie&&'Pierce any body part',s.coMar&&'Marry',s.coEnl&&'Enlist in the armed services',fbs(s.coOth)].filter(Boolean);
  if(co.length) d.push('The consent of both parents shall be required before any minor child(ren) shall be permitted to: '+co.join('; ')+'.');
  d.push('Emergency Decisions: Regardless of the allocation of decision making in this parenting plan, each parent shall be authorized to make emergency decisions affecting the health or safety of the child(ren).');
  sec('11. DECISION MAKING',d);
  sec('12. ACCESS TO INFORMATION',['As required by M.C.A. § 40-4-225, both parents shall have access to all information relating to their child(ren) including, but not limited to, school records, law enforcement, counseling records, medical and dental records.',
    'As required by M.C.A. § 40-4-204(6)(a), both parents shall update each other and the Court with written notice of changes to the following information:\n     (i) Residential and mailing addresses;\n     (ii) Telephone number;\n     (iii) Social Security number;\n     (iv) Driver’s license number;\n     (v) Name, address, and phone number of employers;\n     (vi) Health insurance coverage for the child(ren);\n     (vii) Health insurance available through either parent’s employer which could cover the minor child(ren).',
    s.conf?'It is appropriate that the personal information of the '+fb(s.confWho?L(s.confWho):'')+' shall remain confidential and shall not be provided to the other parent because: '+txt(s.confWhy)+'.':'']);
  sec('13. RESIDENTIAL CHANGES',['If either parent’s change of residence will significantly affect the children’s contact with the other parent, the parties shall follow the procedure outlined by §40-4-217, MCA, specifically:',
    'a. A parent who intends to change residence shall provide written notice to the other parent.',
    'b. If a parent’s change in residence will significantly affect the children’s contact with the other parent, the parent who intends to change residence shall file a motion for amendment of the residential schedule and a proposed revised residential schedule with the court that adopted the residential schedule or the court to which jurisdiction or venue over the children has been transferred. The motion must be served personally or by certified mail on the other parent and served pursuant to the Montana Rules of Civil Procedure on the parent’s attorney of record, if the parent has an attorney of record, not less than 30 days before the proposed change in residence.',
    'c. The notice pursuant to this subsection 13b is not sufficient unless it contains the following statement: “The relocation of the children may be permitted and the proposed revised residential schedule may be ordered by the court without further proceedings unless within 21 days you file a response and alternate revised residential schedule with the court and serve your response on the person proposing the move and all other persons entitled by the court order to residential time or visitation with the children.”',
    'd. The parent who receives service of a motion to amend the parenting plan pursuant to this section has 21 days after service of the motion to file a response. If the parent receiving notice objects to the proposed revised residential schedule, the responding parent shall include an alternate proposed revised residential schedule with the response. The response must be served as provided for by the Montana Rules of Civil Procedure on the parent proposing to change residence or on the parent’s attorney of record if the parent has an attorney of record.',
    'e. If a parent is properly served with a motion to amend the parenting plan pursuant to this section, failure to file a response within the 21-day period constitutes acceptance of the proposed revised residential schedule.',
    'f. A person entitled to file an objection to the proposed relocation of the children may file the objection regardless of whether the person has received proper notice.']);
  sec('14. REVIEW OF PARENTING PLAN',['As children grow and develop, what the children need from each parent changes. What is appropriate for a child at one age is not appropriate at another. It is in the best interest of the child(ren) for the parents to '+
    (s.rev==='times'?'review and amend this parenting plan at the following time(s): '+txt(s.revTxt)+'.':s.rev==='change'?'review and amend this parenting plan only if there is a change in the circumstances of the child(ren).':'__________.')]);
  var d15=['We will review this parenting plan with each other when there is a significant change of circumstance. When we disagree about this parenting plan, we will act in the best interest of our children.'];
  if(s.dr==='steps') d15.push('We will:\n     Step 1: Try to resolve our issues through informal discussion;\n     Step 2: If possible, we will take our issues to a professional mediator.'+
    (fbs(s.medName)?' We agree our first-choice of mediator will be '+fbs(s.medName)+'.':'')+(fbs(s.medPct1)||fbs(s.medPct2)?' We agree that the '+L('1')+' will pay '+fb(fbs(s.medPct1))+'% and the '+L('2')+' will pay '+fb(fbs(s.medPct2))+'% of the cost of the mediator.':'')+
    '\n     Step 3: If we are unable to resolve our issues, we will file a formal motion and ask the court to decide.');
  else if(s.dr==='dv') d15.push('Mediation is not appropriate because there is reason to suspect domestic violence and we will ask the judge to decide our issues through a formal motion.');
  else d15.push('__________');
  sec('15. DISPUTE RESOLUTION',d15);
  var c16=[], who=function(v){ return v? 'the '+L(v) : '__________'; };
  if(s.cs==='amount'){ var basis= s.csBasis==='csed'? 'This amount is consistent with the attached final Child Support Enforcement Division Order signed by the Administrative Law Judge.' :
      s.csBasis==='calc'? 'This amount is consistent with the attached child support calculation prepared by '+(s.csBy==='court'?'the Court':s.csBy==='other'?fb(fbs(s.csByOther)):who(s.csBy))+'.' :
      s.csBasis==='diff'? 'This amount is not consistent with the child support amount prepared by '+(s.csBy==='csed'?'the Child Support Enforcement Division':s.csBy==='court'?'the Court':s.csBy==='other'?fb(fbs(s.csByOther)):who(s.csBy))+'; however, this amount is in the best interest of our child because: '+txt(s.csWhy)+'.' : '__________';
    c16.push('a. Child Support Amount: '+(s.csPayer?'The '+L(s.csPayer):'__________')+' must pay '+(fbs(s.csAmt)?money(s.csAmt):'$__________')+' per child per month in child support to the other parent because: '+basis); }
  else if(s.cs==='calc'){ c16.push('b. Child Support Needs to Be Calculated: '+(s.csCalc==='open'?'Child Support Enforcement Division, CSED, has opened a case and the case number is '+fb(s.csCase)+'. The '+fb(s.csFiler?L(s.csFiler):'')+' will file the CSED Order along with the Request for a Hearing on the Dissolution/Parenting Plan proceeding.':
      s.csCalc==='will'?'The '+fb(s.csOpener?L(s.csOpener):'')+' will open a case with CSED within 30 days of signing this Parenting Plan. The Court will order the parties to comply with opening a CSED case and submitting the necessary documents for CSED to determine child support.':s.csCalc==='other'?txt(s.csCalcTxt)+'.':'__________')); }
  else c16.push('__________');
  var pw=s.csPayWho?'the '+L(s.csPayWho):'__________', po=s.csPayWho==='1'?L('2'):s.csPayWho==='2'?L('1'):'other parent';
  c16.push('c. Child Support Payments: '+({csed:'On or before the first of every month, '+pw+' must make payments to Child Support Enforcement Division. Payments must be made to CSED if a party is receiving Title IV-A Benefits (TANF, Family Medicaid), or Title IV-D benefit (if there is an active case with CSED). We can find this law at § 40-5-909, M.C.A.',
    iw:'The '+fb(s.csIwWho?famPos(P,s.csIwWho):'')+' income is subject to immediate income withholding. We can find this law beginning at §40-5-315, M.C.A.',
    direct:'On or before the '+fb(s.csDay)+' day of each month, '+pw+' must make payments directly to the '+po+'.'+(s.csExempt?' The child support order is exempt from immediate income withholding because: '+txt(s.csExemptWhy)+'.':''),
    clerk:'On or before the first of each month, '+pw+' must make payments to the Clerk of District Court.'}[s.csPay]||'__________'));
  c16.push('d. Child Support Termination: Child support payments must continue until: '+(s.csEnd==='std'?'each child turns 18 or graduates from high school, whichever occurs later but no later than when the child turns 19.':
    s.csEnd==='dis'?'The '+fb(s.csDisWho?L(s.csDisWho):'')+' agrees to continue to pay child support for '+fb(s.csDisKid)+' (initials of child) who is disabled past the age of majority because the child will continue to be financially dependent on the '+fb(s.csDisWho==='1'?L('2'):s.csDisWho==='2'?L('1'):'')+'. Child support will be paid until: '+fb(s.csDisUntil)+'.':'__________'));
  sec('16. CHILD SUPPORT',c16);
  sec('17. MEDICAL SUPPORT',[{incl:'The medical support order is included in the attached Child Support Order.',sep:'The medical support order is separate, and I am attaching it.',adopt:'The minor children need their medical and dental expenses to be covered. There is no medical support order and the court should adopt the attached medical support order.'}[s.med]||'__________',
    'Our responsibilities:\n     • We will fill out, sign, and deliver all necessary documents to the insurance company to make sure our children are continuously covered under the plan.\n     • We will timely submit claims to the insurance company for processing.\n     • We will give each other insurance cards or other methods for access to coverage.\n     • If the insurance company reimburses a parent who didn’t pay the bill, that parent will immediately pay the parent who did pay the bill.\n     • If one of us is responsible for paying medical costs and expenses and we don’t pay, the court may enter a judgment against us for unpaid support. The Court may hold that parent in contempt for non-payment of support.\n     • If we are responsible for paying the insurance premium and we don’t, the other parent, the Department of Public Health and Human Services, or other responsible party, may pay the premium. The court may enter a judgment against the nonpaying parent for unpaid support. The Court may hold that parent in contempt for non-payment.',
    'NOTICE: The court may impose civil penalties for intentionally violating the medical support order. You can find this law at §40-5-821, M.C.A.']);
  sec('18. OTHER PROVISIONS',[fbs(s.other18)?fbs(s.other18)+'.':'None.']);
  sec('19. REQUEST FOR PARENTING PLAN BE ORDERED BY THE COURT',[(s.req==='B'?'The '+L('1')+' and the '+L('2')+' request':s.req?'The '+L(s.req)+' requests':'__________ request(s)')+' the Court adopt this Parenting Plan as the final and enforceable Parenting Plan.',
    'WARNING: One parent’s failure to comply with a provision of the parenting plan will not affect the other parent’s obligation to comply with the parenting plan. Violation of any provision of this order with actual knowledge of its terms is punishable by contempt of court and may be a criminal offense under M.C.A. §§ 45-5-631 or 45-7-309. Violation of the Final Parenting Plan may subject a violator to arrest and a fine up to $500 or imprisonment in the county jail.']);
  out.push(famSign(P,'1')); out.push(famSign(P,'2'));
  out.push(famJudge('IT IS ORDERED, ADJUDGED, AND DECREED that the Parenting Plan set forth above is adopted and approved as an Order of this Court.'));
  return out.join('\n\n');
}

/* ================= decree: MP-703 / MP-713, property: MP-500 ================= */
function money(v){ var n=parseFloat(String(v).replace(/[^0-9.]/g,'')); return isNaN(n)? String(v) : '$'+n.toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2}); }
function ddCopySupport(){
  var a=fs('pp'), b=fs('dd');
  if(!a.cs){ alert('Fill in section 16 of the Parenting plan first.'); return; }
  b.csMode= a.cs==='amount'?'amount':(a.csCalc==='open'?'none':'');
  ['csPayer','csAmt','csBasis','csBy','csByOther','csWhy','csCase','csFiler','csPay','csPayWho','csDay','csExempt','csExemptWhy','csIwWho','csEnd'].forEach(function(k){ if(a[k]!=null) b[k]=a[k]; });
  if(a.csPay==='iw'){ b.csPay=''; b.iw='yes'; } if(a.csExempt){ b.iw='exempt'; b.iwWhy=a.csExemptWhy; }
  if(a.med) b.med=a.med;
  save(); renderDecree();
}
function renderDecree(){
  var box=$('dd-work'); if(!box) return; var s=fs('dd'), q=fs('pd'), c=D.complaint||{}, P='dd';
  if(!s.myname && c['cp-name']) s.myname=c['cp-name'];
  if(!s.filing) s.filing='sep'; if(!s.me) s.me='1';
  var kids=s.kids==='yes', joint=s.filing==='joint', L1=famL(P,'1'), L2=famL(P,'2');
  var h=famPacket('dd')+famWarn('dd');
  h+=famForms('dd','This page follows the court’s decree forms in the same order and with the same choices: MP-703 when you have minor children together, and MP-713 when you do not. The Property Distribution at the bottom follows form MP-500, sections 1 to 10. If you file together, the joint packets use MP-721 or MP-722, which cover the same findings. The complete packets list every form you need, in order, with instructions.');
  h+=famBefore([
    ['Who can file','One spouse must have lived in Montana, or been stationed here in the military, for 90 days before filing. Section 40-4-104, MCA.'],
    ['What the court must find','That the marriage is irretrievably broken: you have lived apart for more than 180 days, or there is serious marital discord that hurts how one or both of you feel about the marriage. Section 40-4-104, MCA.'],
    ['Children','With minor children, the decree adopts a final parenting plan and sets child support. Draft the plan on the Parenting plan page.'],
    ['After you file','Your spouse has 21 days after being served to file a response. Both spouses must exchange financial disclosures of assets, debts, income and expenses. Sections 40-4-252 to 40-4-254, MCA.'],
    ['The economic restraining order','When a divorce is filed, the summons includes an automatic economic restraining order. It keeps both spouses from hiding, selling or giving away property while the case is open. It binds the petitioner on filing and the respondent once served. Section 40-4-126, MCA. The decree ends it.'],
    ['Privacy','For bank accounts, list only the last four digits.']]);
  h+=famYou(P);
  h+=famCard('Which decree form',fR(P,'kids','Do you have minor children together?',[['yes','Yes: Dissolution Decree With Minor Children (MP-703)'],['no','No: Final Dissolution Decree, No Minor Children (MP-713)']])+
    fNote('The judge signs the decree. You fill it in and turn it in, usually with your request for a hearing.'),'The title box');
  var a=fD(P,'filed','1. Procedural History: date the Petition for Dissolution was filed')+fNote('Filed by: '+(joint?'the Co-Petitioners jointly':'the Petitioner')+'.');
  if(!joint) a+=fD(P,'served','2. Nature of the Case: date the Respondent was served with the Petition and Summons')+fR(P,'ans','Did the Respondent take part?',[['yes','The Respondent filed an answer or otherwise participated'],['no','The Respondent did not answer, and default was entered']])+(s.ans==='no'?fSub(fD(P,'defDate','Date default was entered')):'');
  else a+=fNote('2. Nature of the Case: '+(kids?'We filed a joint Petition.':'The Parties filed a joint Petition.'));
  h+=famCard('Procedural history',a);
  if(kids){
    h+=famCard('Parenting plan',fR(P,'ppHist','What happened with the parenting plan',(joint?[['joint','The Co-Petitioners filed a Proposed Parenting Plan with the Petition and nothing has changed']]:[['unchanged','The Petitioner filed and served a Proposed Parenting Plan with the Petition and nothing has changed']]).concat([['amended','Circumstances changed, and an Amended Parenting Plan was filed'],['other','Other']]))+
      (s.ppHist==='amended'?fSub(fPS(P,'ppAmWho','Who filed the Amended Parenting Plan',[['B','Both parties']])):'')+(s.ppHist==='other'?fSub(fT(P,'ppHistTxt','Describe')):''));
    var cs='<div class="row"><button type="button" class="sec" onclick="ddCopySupport()">Use the child support answers from my Parenting plan</button></div>'+
      fR(P,'csMode','Child Support Amount',[['amount','The amount is known'],['none','No one has calculated child support yet, but CSED has opened a case']]);
    if(s.csMode==='amount') cs+=fSub(fPS(P,'csPayer','Who pays')+fT(P,'csAmt','Amount per child per month','$')+fT(P,'csTotal','Total monthly obligation','$')+fD(P,'csStart','Starting date')+
      fR(P,'csBasis','Because',[['csed','It matches the attached final CSED order (marked MP-300-D)'],['calc','It matches a child support calculation (marked MP-300-E)'],['diff','It differs from a calculation, but is in the child’s best interest']])+
      ((s.csBasis==='calc'||s.csBasis==='diff')?fS(P,'csBy','Calculation prepared by',(s.csBasis==='diff'?[['csed','Child Support Enforcement Division']]:[]).concat([['1',L1],['2',L2],['court','The Court'],['other','Someone else']])):'')+
      ((s.csBasis==='calc'||s.csBasis==='diff')&&s.csBy==='other'?fT(P,'csByOther','Who prepared it'):'')+(s.csBasis==='diff'?fA(P,'csWhy','Why this amount is in the child’s best interest'):'')+
      fNote('The form says to write MP-300-D or MP-300-E in the upper right corner of the order or calculation and clip it to the decree.'));
    if(s.csMode==='none') cs+=fSub(fT(P,'csCase','CSED case number')+fPS(P,'csFiler','Who will file the CSED Child Support Order with the Request for a Hearing'));
    cs+=fR(P,'csPay','Child Support Payments',[['csed','To CSED on or before the first of every month'],['direct','Directly to the other parent'],['clerk','To the Clerk of District Court on or before the first of each month']]);
    if(s.csPay) cs+=fSub(fPS(P,'csPayWho','Who makes the payments')+(s.csPay==='direct'?fT(P,'csDay','Day of each month','1st'):''));
    cs+=fR(P,'iw','Immediate Income Withholding',[['yes','The paying parent’s income is subject to immediate income withholding'],['exempt','The order is exempt from immediate income withholding']]);
    if(s.iw==='yes') cs+=fSub(fPS(P,'csIwWho','Whose income'));
    if(s.iw==='exempt') cs+=fSub(fA(P,'iwWhy','Because'));
    cs+=fR(P,'csEnd','Child Support Termination',[['std','When the child turns 18 or graduates from high school, whichever is later, but no later than 19'],['agree','A parent agrees to pay longer']]);
    if(s.csEnd==='agree') cs+=fSub(fPS(P,'csAgWho','Who agrees')+fT(P,'csAgUntil','Until')+fA(P,'csAgWhy','Because'));
    cs+=fR(P,'med','Medical Support',[['incl','CSED or another agency set a medical support order, included in the attached Child Support Order'],['sep','CSED or another agency set a separate medical support order, attached (marked MP-300-F)'],['adopt','There is no medical support order; the court should adopt the attached one (form MP-300-G)']]);
    h+=famCard('Child support calculation',cs);
  }
  var pdo= kids? [['unchanged','The Petitioner filed and served the Property Distribution with the Petition and nothing has changed'],['amended','Circumstances changed, and an Amended Property Distribution was filed'],['other','Other']] :
    [['served','The Petitioner filed and served the Petition and the Property Distribution'],['filed','One party filed a Property Distribution and sent a copy to the other party'],['agreed','The parties agreed on a Property Distribution and submitted it to the Court'],['other','Other']];
  h+=famCard(kids?'Proposed property distribution':'Property distribution',fR(P,'pdHist','What happened with the property distribution',pdo)+
    (s.pdHist==='amended'?fSub(fPS(P,'pdAmWho','Who filed the Amended Property Distribution',[['B','Each party']])):'')+(s.pdHist==='filed'?fSub(fPS(P,'pdFiledWho','Who filed it')):'')+(s.pdHist==='other'?fSub(fT(P,'pdHistTxt','Describe')):''));
  var hr=kids? [['default','Default hearing'],['uncontested','Uncontested hearing: the parties agreed to all issues'],['affidavit','Affidavit to waive hearing, uncontested: the parties agreed to all issues'],['contested','Contested hearing']] :
    [['default','Default hearing'],['uncontested','Uncontested hearing: the parties agreed to all issues'],['contested','Contested hearing'],['none','No hearing: the parties filed Affidavits for Entry of a Decree without a Hearing']];
  var ap=[['self','Appeared in person without a lawyer'],['lawyer','Appeared with a lawyer'],['failed','Failed to appear']].concat(kids?[]:[['na','Not applicable: affidavits filed']]);
  h+=famCard('Hearing and appearances',fR(P,'hear','Hearing',hr)+(s.hear&&s.hear!=='none'?fSub(fD(P,'hearDate','Hearing date, if you know it')):'')+
    (kids&&s.hear==='contested'?fSub('<p class="fl">The parties disagree on</p>'+fC(P,'hcPet','Some issues in the petition for dissolution')+fC(P,'hcPP','Some issues with the parenting plan')+fC(P,'hcProp','Some issues with the property distribution')):'')+
    fS(P,'ap1','Appearance: '+L1,ap,1)+(s.ap1==='lawyer'?fT(P,'ap1Law','Lawyer’s name'):'')+fS(P,'ap2','Appearance: '+L2,ap,1)+(s.ap2==='lawyer'?fT(P,'ap2Law','Lawyer’s name'):'')+
    fNote('If you do not know yet, leave these blank. The form will show a blank line for the judge.'));
  var f=fNote('Printed on the form: one spouse was domiciled or stationed in Montana for 90 days before the case was filed, and venue is proper in this county.')+
    fR(P,'mar','Marriage',[['lic','Married with a marriage license'],['cl','Married at common law'],['decl','Filed a declaration of marriage']]);
  if(s.mar) f+=fSub(fD(P,'marDate',s.mar==='cl'?'Common-law marriage as of':s.mar==='decl'?'Date the declaration was filed':'Date of marriage')+(s.mar!=='cl'?fT(P,'marCounty',s.mar==='decl'?'County where it was filed':'County where the license was filed','Ravalli')+fT(P,'marState','State','Montana'):''));
  f+=fR(P,'brk','Irretrievable breakdown',[['apart','The parties lived separate and apart for more than 180 days before the case was filed'],['discord','There is serious marital discord, with no reasonable prospect of reconciliation']].concat(kids?[['both','Both']]:[]));
  if(kids) f+=fC(P,'concil','The Montana Conciliation Law (§ 40-3-101, MCA) does not apply in this case');
  else f+=fNote('Printed on the form: there are no minor children of the marriage, and neither party is pregnant with a child of the marriage.');
  if(kids) f+=fR(P,'jur','Jurisdiction over the children (choose the most accurate)',[['home','The children lived in Montana for at least 6 consecutive months before the case was filed, or since birth'],['was','Montana was the children’s home state within 6 months of filing, and one parent still lives here'],['sig','The children and one parent have a significant connection with Montana'],['emerg','The children are in Montana and were abandoned, are with a caretaker relative, or need emergency protection'],['none','No other state has jurisdiction, or the other state declined']]);
  if(kids) f+=fNote('Printed on the form: the parties are in compliance with the financial disclosure requirements, §§ 40-4-252 through 254, MCA.');
  else f+=fR(P,'disc','Declaration of disclosure',[['comply','The parties are in compliance with the financial disclosure requirements'],['default','In a default, the Petitioner has provided disclosure and waives further disclosure from the Respondent'],['prelim','The preliminary disclosure should serve as the final disclosure']]);
  var plans=function(word){ return [['1',famPos(P,'1')+' Proposed '+word],['2',famPos(P,'2')+' Proposed '+word],['agreed','The Agreed Proposed '+word],['court','The Court’s '+word]]; };
  if(kids) f+=fS(P,'ppAdopt','Parenting plan the court finds in the children’s best interests',plans('Parenting Plan'))+fC(P,'ppMod','as modified');
  f+=fS(P,'pdAdopt','Property distribution the court finds equitable',plans(kids?'Property Disbursement':'Property Distribution'))+fC(P,'pdMod','as modified');
  f+=fR(P,'maintF','Spousal maintenance',[['notreq','Not requested by either party'],['nec','Necessary: the requesting party lacks property for reasonable needs and cannot be self-supporting, or is the custodian of a child who needs them home'],['denied','Denied']]);
  if(s.maintF==='denied') f+=fSub(fA(P,'maintWhy','Because'));
  f+=fA(P,'addF','Additional findings (optional)');
  h+=famCard('Findings of fact and conclusions of law',f);
  var dc=fNote('Printed on the form: '+(kids?'':'the Court has jurisdiction; ')+'the marriage is dissolved, and the Automatic Economic Restraining Order is dissolved.');
  if(kids) dc+=fT(P,'ppEx','Exhibit letter for the Parenting Plan','A')+fT(P,'pdEx','Exhibit letter for the Property Distribution','B')+fD(P,'doneBy','All actions (titles, deeds, documents) completed no later than');
  else dc+=fT(P,'doneDays','Days to complete all actions (titles, deeds, documents)','30');
  dc+=fR(P,'n1','Name: '+L1,[['remain','Remains the same'],['restore','Is restored to a former name']])+(s.n1==='restore'?fSub(fT(P,'n1Name','First, middle and last name')):'')+
    fR(P,'n2','Name: '+L2,[['remain','Remains the same'],['restore','Is restored to a former name']])+(s.n2==='restore'?fSub(fT(P,'n2Name','First, middle and last name')):'');
  dc+=fR(P,'maint','Spousal maintenance ordered',[['none','No spousal maintenance is awarded'],['pay','One party pays maintenance']]);
  if(s.maint==='pay') dc+=fSub(fPS(P,'mPayer','Who pays')+fT(P,'mAmt','Amount per month','$')+(kids?'':fD(P,'mStart','Starting date'))+fD(P,'mEnd','Date of last payment')+fT(P,'mDay','Day of each month it is paid','1st'));
  dc+=fA(P,'otherDec','Other provisions (optional)');
  h+=famCard('Decree of dissolution of marriage',dc);
  h+=famPacketReminder('dd')+famOutput('dd','decree');

  // ---------- property distribution, MP-500 ----------
  var PD='pd', pty='party';
  var g='<h2 class="famh2">Property Distribution (MP-500)</h2>'+fNote('The Property Distribution is filed with your petition and attached to the decree. It lists everything you and your spouse own and owe, and who gets what. You must list everything you know about. Write “unknown” for anything you do not know.');
  g+=famCard('The title box',fS(PD,'whose','Whose property distribution is it?',[['1',famPos(P,'1')],['2',famPos(P,'2')],['agreed','Agreed'],['court','Court Ordered']])+fS(PD,'status','Proposed or amended?',['Proposed','Amended'])+
    fC(PD,'served','This Proposed Property Distribution, with form MP-510 Disclosure of Income and Expenses, has been served on my spouse'));
  var none=function(k,yesLabel,noLabel){ return fR(PD,k,'Choose one',[['no',noLabel],['yes',yesLabel]]); };
  var s1=none('re','We own real property (land and buildings)','Neither of us owns any real property');
  if(q.re==='yes'){ s1+=fRows(PD,'reRows',[['addr','Address','','123 Main St, Hamilton, MT'],['legal','Legal description','','Lot 4, Block 2, ...'],['val','Value','','$'],['deed','Name on deed'],['debt','Secured debt on it?',[['yes','Yes (list it in section 8)'],['no','No']]],['to','Distributed to',pty],['toO','If other, to whom']],'Add a property');
    s1+=fR(PD,'home','What happens to the home',[['keep','One party keeps it and refinances by a set date, or it is sold'],['sell','It is listed for sale within 30 days of the decree'],['kids','One party lives there until 90 days after the youngest child turns 18 or graduates, then it is sold'],['other','Other']]);
    if(q.home==='keep'||q.home==='sell'||q.home==='kids') s1+=fSub((q.home!=='sell'?fPS(PD,'homeWho',q.home==='keep'?'Who keeps the home':'Who has exclusive possession'):'')+(q.home==='keep'?fD(PD,'refiBy','Refinanced no later than'):'')+
      fT(PD,'sale1','Net sale proceeds to '+L1+' (%)','50')+fT(PD,'sale2','Net sale proceeds to '+L2+' (%)','50')+fT(PD,'cost1','Home costs until sold paid by '+L1+' (%)','50')+fT(PD,'cost2','Home costs until sold paid by '+L2+' (%)','50')+
      (q.home!=='kids'?fPS(PD,'liveIn','Who may live in the home until it sells'):''));
    if(q.home==='other') s1+=fSub(fA(PD,'homeTxt','Describe'));
  }
  g+=famCard('1. Real Property',s1);
  var s2=none('veh','We have vehicles','Neither of us has any vehicles');
  if(q.veh==='yes') s2+=fRows(PD,'vehRows',[['ymm','Year / make / model','','2019 Subaru Outback'],['vin','VIN'],['val','Value','','$'],['title','Name on title'],['loan','Outstanding loan?',[['yes','Yes (list it in section 8)'],['no','No']]],['to','Distributed to',pty],['toO','If other, to whom']],'Add a vehicle');
  g+=famCard('2. Vehicles',fNote('Trailers and mobile or manufactured homes count as vehicles unless the Department of Justice has recognized them as an improvement to the land.')+s2);
  var pctRows=function(k,lab,ph){ return fRows(PD,k,[['desc',lab,'',ph],['val','Value','','$'],['asof','As of','','10/01/2026'],['p1','% to '+L1,'','100'],['p2','% to '+L2,'','0'],['oth','Other']],'Add a row'); };
  var s3=none('bank','We have bank accounts, certificates of deposit, or cash','Neither of us has any');
  if(q.bank==='yes') s3+=pctRows('bankRows','Bank and last four digits only','First Interstate checking ...4417');
  g+=famCard('3. Bank Accounts, Certificates of Deposit, and Cash',s3);
  var s4=none('ret','We have some of these','Neither of us has any');
  if(q.ret==='yes') s4+=pctRows('retRows','Description','401(k) through employer');
  g+=famCard('4. Pensions/Retirement Accounts; Life Insurance; Stocks, Bonds, Secured Notes, Health Savings Accounts, and Mutual Funds',s4);
  g+=famCard('5. Personal Property',fNote('Appliances, pets, furniture, jewelry, art, guns and the like.')+fRows(PD,'perRows',[['desc','Description','','Living room furniture'],['val','Value','','$'],['pos','Current possession',pty],['to','Distributed to',pty],['toO','If other, to whom']],'Add an item'));
  var s6=none('bus','We have business interests','Neither of us has any business interests');
  if(q.bus==='yes') s6+=pctRows('busRows','Description','Ranch equipment, tools, livestock');
  g+=famCard('6. Business Interests (including equipment, tools, livestock, etc.)',s6);
  var s7=none('oth','We have other assets','Neither of us has any other assets');
  if(q.oth==='yes') s7+=pctRows('othRows','Description','');
  g+=famCard('7. Other Assets',s7);
  var s8=none('debt','We have debts','Neither of us has any debts');
  if(q.debt==='yes') s8+=fRows(PD,'debtRows',[['cat','Type',PD_DEBT],['desc','Description'],['cred','Creditor'],['amt','Payment amount','','$'],['bal','Balance','','$'],['asof','Balance as of','','10/01/2026'],['names','Name or names on the debt now'],['p1','% to '+L1,'','100'],['p2','% to '+L2,'','0']],'Add a debt');
  g+=famCard('8. Disclosure of Debts',s8);
  g+=famCard('9. Additional Assets or Debts',fR(PD,'more','Choose one',[['all','All of our assets and debts are listed on this form'],['more','More are listed on attached pages, or on forms MP-500-A to MP-500-D']]));
  g+=famCard('10. Other',fA(PD,'other10','Anything else (optional)'));
  g+=famPacketReminder('dd')+famOutput('pd','property distribution');
  box.innerHTML=h+g; famCourtName(P);
}
var PD_DEBT=[['home','Home / real property loan'],['veh','Vehicle loan'],['util','Past due utility bill'],['card','Credit card'],['student','Student loan'],['med','Past due medical bill'],['other','Other liability']];

function ddText(){
  var P='dd', s=fs(P), kids=s.kids==='yes', joint=s.filing==='joint', L=function(x){ return famL(P,x); }, txt=function(v){ return fb(fbs(v)); };
  var nd=function(d){ return d? niceDate(d) : '__________'; };
  var title= kids? 'DISSOLUTION DECREE\nWITH MINOR CHILDREN\nFindings of Fact and Conclusions of Law' : 'FINDINGS OF FACT AND CONCLUSIONS OF LAW AND\nFINAL DISSOLUTION DECREE\nNo Minor Children';
  var out=[famCourt(s.county), famCaption(P,'IN RE THE MARRIAGE OF:'), 'Case No. '+fb(s.cause)+'\n'+title];
  var n=0, para=function(head,body){ n++; out.push(n+'. '+head+'\n'+body.filter(Boolean).join('\n')); };
  if(!kids) out.push('The Court enters the following:\nFINDINGS OF FACT AND CONCLUSIONS OF LAW');
  para('PROCEDURAL HISTORY',['On '+nd(s.filed)+', the Petition for Dissolution was filed by '+(joint?'the Co-Petitioners jointly':'the Petitioner')+'.']);
  var nat;
  if(joint) nat=kids?'We filed a joint Petition.':'The Parties filed a joint Petition.';
  else nat='On '+nd(s.served)+', Respondent was served with the Petition and Summons. '+(s.ans==='yes'?'Respondent filed an answer or otherwise participated in this case.':s.ans==='no'?(kids?'Respondent did not file an answer or otherwise participate in this case. On '+nd(s.defDate)+', default was entered.':'Respondent did not file an answer or otherwise participate in this case. Default was entered on '+nd(s.defDate)+'.'):'__________');
  para('NATURE OF THE CASE',[nat]);
  if(kids){
    para('PARENTING PLAN',[{joint:'Co-Petitioners filed a Proposed Parenting Plan along with the Petition and nothing has changed.',unchanged:'Petitioner filed and served Respondent a Proposed Parenting Plan along with the Petition and nothing has changed.',
      amended:'Circumstances have changed. '+(s.ppAmWho==='B'?'Both parties':s.ppAmWho?L(s.ppAmWho):'__________')+' filed an Amended Parenting Plan and sent a copy to the other party.',other:'Other: '+txt(s.ppHistTxt)+'.'}[s.ppHist]||'__________']);
    var c=[], who=function(v){ return v? L(v) : '__________'; }, by=function(){ return s.csBy==='csed'?'the Child Support Enforcement Division':s.csBy==='court'?'the Court':s.csBy==='other'?fb(fbs(s.csByOther)):s.csBy?L(s.csBy):'__________'; };
    if(s.csMode==='amount') c.push('a. Child Support Amount: '+who(s.csPayer)+' must pay '+(fbs(s.csAmt)?money(s.csAmt):'$__________')+' per child per month for a total monthly obligation of '+(fbs(s.csTotal)?money(s.csTotal):'$__________')+' in child support to the other parent commencing on '+nd(s.csStart)+' because: '+
      ({csed:'This amount is consistent with the attached final Child Support Enforcement Division Order signed by the Administrative Law Judge.',calc:'This amount is consistent with the child support calculation prepared by '+by()+'.',
        diff:'This amount is not consistent with the child support amount prepared by '+by()+'; however, this amount is in the best interest of our child because: '+txt(s.csWhy)+'.'}[s.csBasis]||'__________'));
    else if(s.csMode==='none') c.push('a. Child Support Amount: No one has calculated child support at this time. But, Child Support Enforcement Division has opened a case. The CSED case number is '+fb(s.csCase)+'. '+who(s.csFiler)+' will file the CSED Child Support Order along with the Request for a Hearing on the Dissolution.');
    else c.push('a. Child Support Amount: __________');
    var pw=who(s.csPayWho), po=s.csPayWho==='1'?L('2'):s.csPayWho==='2'?L('1'):'__________';
    c.push('b. Child Support Payments: '+({csed:'On or before the first of every month, '+pw+' must make payments to Child Support Enforcement Division. Payments must be made to CSED if a party is receiving Title IV-A Benefits (TANF, Family Medicaid), or Title IV-D benefit (if there is an active case with CSED). We can find this law at §40-5-909, M.C.A.',
      direct:'On or before the '+fb(s.csDay)+' day of each month, '+pw+' must make payments directly to '+po+'.',clerk:'On or before the first of each month, '+pw+' must make payments to the Clerk of District Court.'}[s.csPay]||'__________'));
    c.push('c. Immediate Income Withholding: '+(s.iw==='yes'?fb(s.csIwWho?famPos(P,s.csIwWho):'')+' income is subject to immediate income withholding. We can find this law beginning at §40-5-315, M.C.A.':s.iw==='exempt'?'The child support order is exempt from immediate income withholding because: '+txt(s.iwWhy)+'.':'__________'));
    c.push('d. Child Support Termination: Child support payments must continue until: '+(s.csEnd==='std'?'the child turns 18 or graduates from high school, whichever occurs later but no later than when the child turns 19.':s.csEnd==='agree'?who(s.csAgWho)+' agrees to continue to pay child support until: '+txt(s.csAgUntil)+' because '+txt(s.csAgWhy)+'.':'__________'));
    c.push('e. Medical Support: '+({incl:'The Montana Child Support Enforcement Division or another appropriate agency or court established a medical support order. The medical support order is included in the attached Child Support Order.',
      sep:'The Montana Child Support Enforcement Division or another appropriate agency or court established a medical support order. The medical support order is separate and is attached.',
      adopt:'The minor children need their medical and dental expenses to be covered. There is no medical support order and the court should adopt the attached medical support order.'}[s.med]||'__________'));
    para('CHILD SUPPORT CALCULATION',c);
  }
  var okPd=kids?['unchanged','amended','other']:['served','filed','agreed','other'];
  var pdh=okPd.indexOf(s.pdHist)<0?'__________':{unchanged:'Petitioner filed and served Respondent the Property Distribution along with the Petition and nothing has changed.',served:'Petitioner filed and served Respondent with the Petition and the Property Distribution.',
    amended:'Circumstances have changed. '+(s.pdAmWho==='B'?'Each party':s.pdAmWho?L(s.pdAmWho):'__________')+' has filed an Amended Property Distribution and sent a copy to the other party.',
    filed:(s.pdFiledWho?L(s.pdFiledWho):'__________')+' has filed a Property Distribution and sent a copy to the other party.',agreed:'The parties have agreed upon a Property Distribution and submitted it to the Court for final approval.',other:'Other: '+txt(s.pdHistTxt)+'.'}[s.pdHist];
  para(kids?'PROPOSED PROPERTY DISTRIBUTION':'PROPERTY DISTRIBUTION',[pdh]);
  var hn={default:'Default hearing.',uncontested:'Uncontested hearing. The parties agreed to all issues in this case.',affidavit:'Affidavit to waive hearing, uncontested hearing. The parties agreed to all issues in this case.',contested:'Contested hearing.'};
  if((kids&&s.hear==='none')||(!kids&&s.hear==='affidavit')) s.hear='';
  if(!kids&&s.brk==='both') s.brk='';
  var hb= s.hear==='none'? 'No hearing. The parties have filed joint or individual Affidavits for Entry of a Decree of Dissolution of Marriage without a Hearing.' :
    'On '+nd(s.hearDate)+' the Court held a: '+(hn[s.hear]||'__________');
  if(kids&&s.hear==='contested'){ var iss=[s.hcPet&&'some issues in the petition for dissolution',s.hcPP&&'some issues with the parenting plan',s.hcProp&&'some issues with the property distribution'].filter(Boolean); if(iss.length) hb+=' The parties disagree on the following: '+iss.join('; ')+'.'; }
  para('HEARING',[hb]);
  var apx=function(x){ var v=s['ap'+x]; return L(x)+': '+(v==='self'?'appeared in person without a lawyer':v==='lawyer'?'appeared with a lawyer, '+txt(s['ap'+x+'Law']):v==='failed'?'failed to appear':v==='na'?'Not applicable. The parties filed joint or individual Affidavits for Entry of a Decree of Dissolution of Marriage without a Hearing':'__________')+'.'; };
  para('APPEARANCES',[apx('1'),apx('2')]);
  if(kids) out.push('FINDINGS OF FACT AND CONCLUSIONS OF LAW\nThe court considered the evidence at the hearing and all pleadings, and finds:');
  para('JURISDICTION OVER THE PARTIES',[kids?'For 90 days before this case was filed, either the husband or wife was domiciled or was stationed in Montana.':'90 days before this case was filed either husband or wife was domiciled or was stationed in Montana.']);
  para('VENUE',['Venue is proper in this county.']);
  para('MARRIAGE',[{lic:'The parties were married on '+nd(s.marDate)+'. The marriage license was filed in '+fb(s.marCounty)+' County, State of '+fb(s.marState)+'.',
    cl:'The parties were married at common law as of '+nd(s.marDate)+'. The parties assumed a marital relationship by mutual consent and agreement. The parties confirmed their marriage by living together and by public knowledge.',
    decl:'The parties filed a declaration of marriage on '+nd(s.marDate)+' in '+fb(s.marCounty)+' County, State of '+fb(s.marState)+'.'}[s.mar]||'__________']);
  var apart=kids?'The parties lived separate and apart for more than 180 days before this case was filed.':'The parties lived separate and apart for more than 180 days before this case was filed.';
  var disc='There is serious marital discord that adversely affects the attitude of one or both of the parties toward the marriage and there is no reasonable prospect of reconciliation.';
  if(kids) para('IRRETRIEVABLE BREAKDOWN',['The marriage of the parties is irretrievably broken.',(s.brk==='apart'||s.brk==='both')?apart:'',(s.brk==='discord'||s.brk==='both')?disc:'',s.concil?'The Montana Conciliation Law (beginning at §40-3-101, M.C.A.) does not apply in this case.':'',s.brk?'':'__________']);
  else { para('IRRETRIEVABLE BREAKDOWN',['The marriage of the parties is irretrievably broken in that: '+(s.brk==='apart'?apart:s.brk==='discord'?disc:'__________')]);
    para('NO MINOR CHILDREN',['There were no children born of the marriage or there are no minor children at this time. Neither party is pregnant with a child of the marriage.']); }
  if(kids){
    para('JURISDICTION OVER THE CHILDREN',[{home:'The child(ren) lived in Montana for at least 6 consecutive months immediately before this case was filed. If a child(ren) is less than six months old, the child(ren) lived in Montana since birth.',
      was:'Montana was the home state of the child(ren) within six months of this case being filed, and one parent continues to reside in Montana.',sig:'The child(ren) and one parent have significant connection with Montana and substantial evidence about them is in Montana.',
      emerg:'The child(ren) are physically present in Montana and have been abandoned, the child(ren) are with a caretaker relative who was given custody, or an emergency exists requiring the child(ren)’s protection.',
      none:'No other state has jurisdiction over the child(ren) or the other state has declined jurisdiction over the children.'}[s.jur]||'__________']);
    para('FINANCIAL DISCLOSURE OF ASSETS AND LIABILITIES',['The Court finds that the parties are in compliance with financial disclosure requirements §§ 40-4-252 through 254, M.C.A.']);
  } else para('DECLARATION OF DISCLOSURE',[{comply:'The parties are in compliance with the financial disclosure requirements §§ 40-4-252 through 254, M.C.A.',default:'(In the event of default), Petitioner has provided financial disclosure and waives any further disclosure from Respondent.',prelim:'The parties have made preliminary disclosure and ask that the preliminary disclosure serve as the final disclosure.'}[s.disc]||'__________']);
  var plan=function(v,word,mod){ var t= v==='1'||v==='2'? famPos(P,v)+' Proposed '+word : v==='agreed'? 'The Agreed Proposed '+word : v==='court'? 'The Court’s '+word : '__________'; return t+(mod&&v!=='court'?', as modified':''); };
  if(kids){
    para('PARENTING PLAN',['The court finds the following parenting plan to be in the best interests of the child: '+plan(s.ppAdopt,'Parenting Plan',s.ppMod)+'.']);
    para('PROPERTY DISTRIBUTION',['The court finds the following property disbursement is an equitable apportionment between the parties of the marital property, assets, and liabilities: '+plan(s.pdAdopt,'Property Disbursement',s.pdMod)+'.']);
  }
  para('SPOUSAL MAINTENANCE',[{notreq:'Spousal maintenance was not requested by either party.',
    nec:kids?'The court finds that spousal maintenance is necessary because the requesting party lacks sufficient property to provide for the spouse’s reasonable needs; and is unable to be self-supporting through appropriate employment or is the custodian of a child whose condition or circumstances make it appropriate that the custodian not be required to seek employment outside the home.':'Spousal maintenance is necessary because the requesting party lacks sufficient property to provide his/her reasonable needs; and is unable to be self-supporting through appropriate employment or is the custodian of a child whose condition or circumstances make it appropriate that the custodian not be required to seek employment outside the home.',
    denied:(kids?'The court denies spousal maintenance because: ':'Spousal maintenance is denied because: ')+txt(s.maintWhy)+'.'}[s.maintF]||'__________']);
  var req=[s.n1==='restore'&&L('1'),s.n2==='restore'&&L('2')].filter(Boolean);
  if(kids){ if(req.length) para('PREVIOUS NAMES',[req.join(' and ')+' requested to have their previous name restored.']); }
  else para('PREVIOUS NAMES',[req.length? req.join(' and ')+(req.length>1?' request':' requests')+' restoration of a previous name.' : 'Neither party requests restoration of a previous name at this time.']);
  if(fbs(s.addF)) para('ADDITIONAL FINDINGS',['The Court makes additional findings of fact as follows: '+fbs(s.addF)+'.']);
  if(kids) out.push('DECREE OF DISSOLUTION OF MARRIAGE\nFrom the above Findings of Fact and Conclusions of Law, the Court orders the following:');
  else out.push('From the above Findings of Fact and Conclusions of Law, the Court orders the following:\nDECREE OF DISSOLUTION OF MARRIAGE');
  var dn=0, dp=function(t){ dn++; out.push(dn+'. '+t); };
  var nm=function(x){ var m=s['n'+x]; return (kids?famPos(P,x):famPos(P,x))+' name will '+(m==='restore'?'be restored to: '+txt(s['n'+x+'Name']):m==='remain'?'remain '+fb(famN(P,x)):'remain / be restored to: __________')+'.'; };
  var mt=function(){ if(s.maint==='none') return 'Spousal Maintenance: No spousal maintenance is awarded in this case.'; if(s.maint!=='pay') return 'Spousal Maintenance: __________';
    var to=s.mPayer==='1'?L('2'):s.mPayer==='2'?L('1'):'__________';
    return kids? 'Spousal Maintenance: The Court orders '+(s.mPayer?L(s.mPayer):'__________')+' to pay '+(fbs(s.mAmt)?money(s.mAmt):'$__________')+' per month until '+nd(s.mEnd)+' (date of last payment) in spousal support. The payment must be made on the '+fb(s.mDay)+' of each month directly to '+to+'.' :
      'Spousal Maintenance: '+(s.mPayer?L(s.mPayer):'__________')+' shall pay '+(fbs(s.mAmt)?money(s.mAmt):'$__________')+' per month commencing on '+nd(s.mStart)+' until '+nd(s.mEnd)+' (date of last payment) in spousal support. The payment must be made on the '+fb(s.mDay)+' of each month directly to '+to+'.'; };
  if(kids){
    dp('The Court dissolves the marriage between '+(joint?'Co-Petitioner 1 and Co-Petitioner 2':'Petitioner and Respondent')+'.');
    dp('The court dissolves the Automatic Economic Restraining Order issued in this matter under M.C.A. § 40-4-126.');
    dp('The Court has signed and adopts the Parenting Plan identified as Exhibit '+fb(s.ppEx)+'. The Court orders the parties to follow this Parenting Plan.');
    dp('The Court has signed and adopts the Property Distribution identified as Exhibit '+fb(s.pdEx)+'. The Court orders the parties to follow this Property Distribution.');
    dp('Each party is ordered to take any action necessary to carry out the terms and conditions of this decree including the signing or transfer of titles, deeds, or other documents. All necessary actions must be completed no later than: '+nd(s.doneBy)+'.');
  } else {
    dp('The Court has jurisdiction over the parties and this cause of action.');
    dp('The Court dissolves the marriage between the parties.');
    dp('If applicable, the Court dissolves the Automatic Economic Restraining Order issued in this matter under M.C.A. § 40-4-126.');
    dp('The following property distribution is a fair and equitable apportionment between the parties of the marital property, assets, and liabilities and is not unconscionable: '+plan(s.pdAdopt,'Property Distribution',s.pdMod)+'.');
    dp('The Court has signed and adopts and incorporates by reference the approved Property Distribution. The Court orders the parties to follow the Property Distribution.');
    dp('Each party is ordered to take any action necessary to carry out the terms and conditions of this Decree including the signing and transfer of titles, deeds, or other documents within '+fb(s.doneDays)+' days from the date of this Decree or as more specifically provided in the Property Distribution.');
  }
  dp(nm('1')); dp(nm('2')); dp(mt());
  dp('Other Provisions: '+(fbs(s.otherDec)?fbs(s.otherDec)+'.':'None.'));
  out.push('DATED this ____ day of ______________, 20___.\n\n______________________________\n'+(kids?'DISTRICT COURT JUDGE':'DISTRICT COURT JUDGE / STANDING MASTER'));
  return out.join('\n\n');
}

function pdText(){
  var P='pd', q=fs(P), s=fs('dd'), L=function(x){ return famL(P,x); }, txt=function(v){ return fb(fbs(v)); };
  var title=(q.whose==='agreed'?'AGREED ':q.whose==='court'?'COURT ORDERED ':q.whose?famPos(P,q.whose).toUpperCase()+' ':'')+(q.status==='Amended'?'AMENDED':'PROPOSED')+' PROPERTY DISTRIBUTION';
  var out=[famParty(P), famCourt(s.county), famCaption(P,'IN RE THE MARRIAGE OF:'), 'Case No. '+fb(s.cause)+'\n'+title];
  out.push('Warning: Montana law, §40-4-252, M.C.A. requires the full disclosure of all assets, debts, income, and expenses. I understand that I am required to tell my spouse about all of the assets, debts, income and expenses that I know about. My spouse is required to do the same for me.'+
    (q.served?'\nThis Proposed Property Distribution along with Form MP-510 Disclosure of Income and Expenses has been served on my spouse.':'')+
    '\nIf I don’t tell my spouse about something, the court may give me a penalty. The court gets to decide what the penalty will be. I am giving all of the information I know about the assets and debts listed on this form and writing “unknown” in the spaces for the information I don’t know.');
  var to=function(r){ return r.to==='O'? txt(r.toO) : r.to? L(r.to) : '__________'; };
  var pct=function(r){ var a=[]; if(fbs(r.p1)) a.push(fbs(r.p1).replace(/%$/,'')+'% '+L('1')); if(fbs(r.p2)) a.push(fbs(r.p2).replace(/%$/,'')+'% '+L('2')); if(fbs(r.oth)) a.push('Other: '+fbs(r.oth)); return a.length?a.join('; '):'__________'; };
  var m=function(v){ return fbs(v)? money(v) : '__________'; };
  var sec=function(t,lines){ out.push(t+'\n'+lines.filter(Boolean).join('\n')); };
  var s1=[];
  if(q.re==='no') s1.push('I do not own any real property and my spouse does not own any real property.');
  else if(q.re==='yes'){ s1.push('I am listing the real property that my spouse and I own, regardless of whether we own it separately or together. The distribution of any debt(s) associated with the real property(ies) described below is listed in Section 8 dealing with debt distribution. I/we request distribution as follows:');
    famFilled(P,'reRows').forEach(function(r,i){ s1.push('     '+String.fromCharCode(65+i)+'. Address: '+txt(r.addr)+'. Legal Description: '+txt(r.legal)+'. Value: '+m(r.val)+'. Name on Deed: '+txt(r.deed)+'. Secured debt on the property: '+(r.debt==='yes'?'Yes (see Section 8)':r.debt==='no'?'No':'__________')+'. Distributed to: '+to(r)+'.'); });
    var hw=q.homeWho?L(q.homeWho):'__________', sp=fb(fbs(q.sale1))+'% to '+L('1')+' and '+fb(fbs(q.sale2))+'% to '+L('2'), cp=L('1')+' responsible to pay '+fb(fbs(q.cost1))+'% and '+L('2')+' responsible to pay '+fb(fbs(q.cost2))+'%', li=(q.liveIn?L(q.liveIn):'__________')+' shall be entitled to live in the home pending the sale of the home.';
    if(q.home==='keep') s1.push(hw+' shall receive the home as their separate property and shall be responsible for all costs associated with the home so long as the home is refinanced no later than '+(q.refiBy?niceDate(q.refiBy):'__________')+'. If the home is not refinanced by that date, for any reason, the parties agree that the home will be sold and the net proceeds divided '+sp+'. The home will be listed for sale no more than 30 days after the refinance date. In the event the home is listed for sale and until the home is sold, the parties shall be responsible to pay all costs of the home including but not limited to the mortgage payment, taxes, insurance, maintenance and upkeep with '+cp+'. '+li);
    if(q.home==='sell') s1.push('The home will be listed for sale no later than 30 days after the date the Decree of Dissolution is ordered by this court and the net proceeds divided '+sp+'. Until the home is sold, the parties shall be responsible to pay all costs of the home including but not limited to the mortgage payment, taxes, insurance, maintenance and upkeep with '+cp+'. '+li);
    if(q.home==='kids') s1.push(hw+' shall have exclusive possession of the home until 90 days after the youngest child reaches the age of 18 or graduates from high school, whichever is later. The home must be listed for sale no later than 90 days after the youngest child turns 18 or graduates from high school whichever is later. The net proceeds of the sale will be divided '+sp+'. The parties shall be responsible to pay all costs of the home including but not limited to the mortgage payment, taxes, insurance, maintenance and upkeep with '+cp+' until the home is sold.');
    if(q.home==='other') s1.push('Other: '+txt(q.homeTxt)+'.');
    if(q.home) s1.push('Note: “Net proceeds” as used in this paragraph includes any escrow refund.');
  } else s1.push('__________');
  sec('1. REAL PROPERTY',s1);
  var list=function(k,none,intro,row){ if(q[k]==='no') return [none]; if(q[k]!=='yes') return ['__________']; var rows=famFilled(P,k+'Rows'); return [intro].concat(rows.length?rows.map(function(r,i){ return '     '+String.fromCharCode(65+i)+'. '+row(r); }):['     __________']); };
  sec('2. VEHICLES',list('veh','Neither my spouse or I have any vehicles.','My spouse and I have the following vehicles. The distribution of any debt(s) associated with the vehicle(s) described below is listed in Section 8 dealing with debt distribution. I/we request distribution as follows:',
    function(r){ return 'Year/Make/Model: '+txt(r.ymm)+'. VIN#: '+txt(r.vin)+'. Value: '+m(r.val)+'. Name on Title: '+txt(r.title)+'. Outstanding loan: '+(r.loan==='yes'?'Yes (see Section 8)':r.loan==='no'?'No':'__________')+'. Distributed to: '+to(r)+'.'; }));
  var prow=function(r){ return txt(r.desc)+'. Value: '+m(r.val)+(fbs(r.asof)?' as of '+fbs(r.asof):'')+'. Distributed: '+pct(r)+'.'; };
  sec('3. BANK ACCOUNTS, CERTIFICATES OF DEPOSIT, AND CASH',list('bank','Neither my spouse or I have any bank accounts, certificates of deposit, or cash.','I am listing the bank accounts and cash that my spouse and I own, regardless of whether we own them separately or together. I request distribution of the bank accounts and cash as follows:',prow));
  sec('4. PENSIONS/RETIREMENT ACCOUNTS; LIFE INSURANCE; STOCKS, BONDS, SECURED NOTES, HEALTH SAVINGS ACCOUNTS, AND MUTUAL FUNDS',list('ret','Neither my spouse or I have any pensions/retirement accounts, life insurance, stocks, bonds, secured notes, health savings accounts, or mutual funds.','My spouse and I have the following pensions/retirement accounts, life insurance, stocks, bonds, secured notes, health savings accounts, or mutual funds and request distribution as follows:',prow));
  var per=famFilled(P,'perRows');
  sec('5. PERSONAL PROPERTY',['I request the following distribution of our personal property (including appliances, pets, furniture, jewelry, art, guns, etc.):'].concat(per.length?per.map(function(r,i){ return '     '+String.fromCharCode(65+i)+'. '+txt(r.desc)+'. Value: '+m(r.val)+'. Current Possession: '+(r.pos==='O'?'Other':r.pos?L(r.pos):'__________')+'. Distributed to: '+to(r)+'.'; }):['     __________']));
  sec('6. BUSINESS INTERESTS',list('bus','Neither my spouse nor I have any business interests.','My spouse and I have the following business interests and request distribution as follows:',prow));
  sec('7. OTHER ASSETS',list('oth','Neither my spouse nor I have any other assets.','My spouse and I have the following assets and request distribution as follows:',prow));
  var d8;
  if(q.debt==='no') d8=['Neither my spouse nor I have any debts.'];
  else if(q.debt==='yes'){ d8=['My spouse and I have the following debts and request distribution as follows:']; var rows=famFilled(P,'debtRows');
    PD_DEBT.forEach(function(c){ var rs=rows.filter(function(r){ return r.cat===c[0]; }); if(!rs.length) return; d8.push('     '+c[1]+':');
      rs.forEach(function(r){ d8.push('          '+txt(r.desc)+'. Creditor: '+txt(r.cred)+'. Amount: '+m(r.amt)+'. Balance: '+m(r.bal)+(fbs(r.asof)?' as of '+fbs(r.asof):'')+'. Name(s) on debt now: '+txt(r.names)+'. Distribute to: '+pct(r)+'.'); }); });
    var un=rows.filter(function(r){ return !r.cat; }); un.forEach(function(r){ d8.push('     '+txt(r.desc)+'. Creditor: '+txt(r.cred)+'. Amount: '+m(r.amt)+'. Balance: '+m(r.bal)+'. Name(s) on debt now: '+txt(r.names)+'. Distribute to: '+pct(r)+'.'); });
  } else d8=['__________'];
  sec('8. DISCLOSURE OF DEBTS',d8);
  sec('9. ADDITIONAL ASSETS OR DEBTS',[q.more==='all'?'All of our assets and debts are listed on this form.':q.more==='more'?'We have additional assets or debts that do not fit on this form. The additional assets or debts are listed on additional pages attached to this form, or on optional attachment forms MP-500-A, MP-500-B, MP-500-C, or MP-500-D which are attached to this form.':'__________']);
  sec('10. OTHER',[fbs(q.other10)?fbs(q.other10)+'.':'None.']);
  out.push(famSign(P,s.me||'1'));
  if(famJ(P)) out.push(famSign(P,(s.me||'1')==='1'?'2':'1'));
  out.push(famJudge('The Court found this property distribution to be equitable.\nThe Court orders the parties to follow the terms of this property distribution.'));
  return out.join('\n\n');
}

/* ---------- start-up ---------- */
function initFamily(){
  addView('parenting','Parenting plan','Fill in Montana’s official Proposed Parenting Plan, form MP-300, section by section.','<div id="pp-work" class="ctool"></div>');
  addView('decree','Divorce decree','Fill in Montana’s official decree forms, MP-703 and MP-713, and the Property Distribution, MP-500.','<div id="dd-work" class="ctool"></div>');
  var drop=$('drop'), grps=drop.querySelectorAll('.dgrp'), support=null;
  for(var i=0;i<grps.length;i++) if(grps[i].textContent.trim()==='Support') support=grps[i];
  var g=document.createElement('div'); g.className='dgrp'; g.textContent='Family court';
  var b1=document.createElement('button'); b1.className='dlink'; b1.textContent='Parenting plan'; b1.setAttribute('onclick',"show('parenting')");
  var b2=document.createElement('button'); b2.className='dlink'; b2.textContent='Divorce decree'; b2.setAttribute('onclick',"show('decree')");
  if(support){ drop.insertBefore(g,support); drop.insertBefore(b1,support); drop.insertBefore(b2,support); }
  var ms=$('moresheet'), close=ms.querySelector('.moreclose'), care=null, ml=ms.querySelectorAll('.morelink');
  for(var j=0;j<ml.length;j++) if((ml[j].getAttribute('onclick')||'').indexOf("show('ai')")>-1) care=ml[j];
  [['parenting','♡','Parenting plan'],['decree','⧉','Divorce decree']].forEach(function(x){ var m=document.createElement('button'); m.className='morelink';
    m.setAttribute('onclick',"show('"+x[0]+"')"); m.innerHTML='<span class="mi">'+x[1]+'</span>'+x[2]; ms.insertBefore(m, care||close); });
  var _sh=window.show; window.show=function(id){ _sh(id); if(id==='parenting') renderParenting(); if(id==='decree') renderDecree(); };
  renderParenting(); renderDecree();
}
