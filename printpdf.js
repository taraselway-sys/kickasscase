/* An iPhone app opened from a home-screen icon cannot open the print window,
   so there every print button makes a PDF and hands it to the share sheet, which has Print. */
(function(){
  function homeScreen(){
    if(window.__forcePdfPrint) return true;
    try{
      var ios=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
      var standalone=window.navigator.standalone===true||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches);
      return ios&&standalone;
    }catch(e){ return false; }
  }
  var loaded={};
  function loadScript(src){
    if(loaded[src]) return loaded[src];
    loaded[src]=new Promise(function(res,rej){
      var s=document.createElement('script'); s.src=src; s.async=true;
      s.onload=function(){ res(); }; s.onerror=function(){ delete loaded[src]; rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }
  function libs(){
    return loadScript('vendor/printpdf/html2canvas.min.js?v=1.4.1').then(function(){
      return loadScript('vendor/printpdf/jspdf.umd.min.js?v=2.5.1'); });
  }
  function status(t){
    dlgOpen('<h3>Making your PDF…</h3><p id="pdfstat">'+esc(t)+'</p>');
  }
  var W=816, PAD=96, PAGE_H=864; // letter at 96 px per inch; set per printout below
  /* The app's styles as a printer sees them: print rules switched on, screen-only rules switched off. */
  function printCSS(){
    var out=[];
    function walk(rules){
      for(var j=0;j<rules.length;j++){ var r=rules[j];
        if(r.type===4){ // @media
          var keep=[], items=r.media;
          for(var k=0;k<items.length;k++){ var m=items[k];
            if(/\bprint\b/.test(m)) keep.push(m.replace(/\bprint\b/,'all'));
            else if(/\bscreen\b/.test(m)) continue;
            else keep.push(m); }
          if(!keep.length) continue;
          var inner=[]; for(var q=0;q<r.cssRules.length;q++) inner.push(r.cssRules[q].cssText);
          out.push('@media '+keep.join(', ')+'{'+inner.join('\n')+'}');
        } else if(r.type===6){ continue; } // @page
        else out.push(r.cssText);
      }
    }
    for(var i=0;i<document.styleSheets.length;i++){ try{ walk(document.styleSheets[i].cssRules); }catch(e){} }
    return out.join('\n');
  }
  function buildFrame(pv){
    var ifr=document.createElement('iframe');
    ifr.setAttribute('aria-hidden','true');
    ifr.style.cssText='position:fixed;left:-20000px;top:0;width:'+W+'px;height:1200px;border:0;background:#fff';
    document.body.appendChild(ifr);
    var css=''; try{ css=printCSS(); }catch(e){ try{ css=pageCSS(); }catch(x){} }
    var d=ifr.contentWindow.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><style>'+css+
      '\nhtml,body{background:#fff !important}body.printframe{margin:0 !important;padding:'+PAD+'px !important;width:'+W+'px;box-sizing:border-box}'+
      '\n.noprint,.pvbar,.pvhint{display:none !important}.printout{display:block !important}</style></head>'+
      '<body class="printframe">'+pv.innerHTML+'</body></html>');
    d.close();
    return ifr;
  }
  function breakPoints(doc){
    var out=[], forced=[], avoid=[], els=doc.body.querySelectorAll('*');
    for(var i=0;i<els.length;i++){ var el=els[i], r=el.getBoundingClientRect(); if(r.height<=0) continue;
      var cs=doc.defaultView.getComputedStyle(el);
      if(cs.breakBefore==='page'||cs.pageBreakBefore==='always') forced.push(Math.round(r.top));
      if(cs.breakAfter==='page'||cs.pageBreakAfter==='always') forced.push(Math.round(r.bottom));
      if((cs.breakInside==='avoid'||cs.pageBreakInside==='avoid') && r.height<PAGE_H*0.9 && !/^(TR|TABLE)$/.test(el.tagName)) avoid.push([Math.round(r.top),Math.round(r.bottom)]);
      if(/^(TR|P|LI|H1|H2|H3|H4|TABLE|IMG|FIGURE)$/.test(el.tagName)||/\b(isec|irow|ichk|pv|wt|card|hbody|jrule)\b/.test(el.className||'')||(el.parentElement&&/\b(rp|pvdoc)\b/.test(el.parentElement.className||'')))
        out.push(Math.round(r.bottom));
    }
    return {soft:out.sort(function(a,b){ return a-b; }), forced:forced.sort(function(a,b){ return a-b; }), avoid:avoid};
  }
  function slices(doc){
    var end=doc.body.scrollHeight-PAD, bp=breakPoints(doc), out=[], start=PAD;
    while(start<end-2){
      var limit=Math.min(start+PAGE_H,end), cut=limit, f;
      for(f=0;f<bp.forced.length;f++){ if(bp.forced[f]>start+20 && bp.forced[f]<limit){ cut=bp.forced[f]; break; } }
      if(cut===limit && limit<end){ for(var i=bp.soft.length-1;i>=0;i--){ if(bp.soft[i]<=limit && bp.soft[i]>start+PAGE_H*0.45){ cut=bp.soft[i]; break; } } }
      if(cut<end){ for(var v=0;v<bp.avoid.length;v++){ var av=bp.avoid[v]; if(av[0]<cut && av[1]>cut && av[0]>start+PAGE_H*0.3) cut=av[0]; } }
      out.push([start,cut]); start=cut;
    }
    return out;
  }
  function fileName(pv){
    if(pv.querySelector('.hrbform') && !pv.querySelector('.packet')) return 'Charge of discrimination.pdf';
    if(pv.querySelector('.packet')) return 'Case packet.pdf';
    var h=pv.querySelector('h1'); var t=(h?h.textContent:'Printout').replace(/[^\w\- ]+/g,'').replace(/\s+/g,' ').trim()||'Printout';
    return t+'.pdf';
  }
  function makePdf(target){
    var pv=$(target); if(!pv) return;
    var name=fileName(pv), ifr=null;
    var narrow=!!pv.querySelector('.hrbform') && !pv.querySelector('.packet'); PAD=narrow?48:96; PAGE_H=1056-2*PAD;
    status('Getting ready.');
    libs().then(function(){
      ifr=buildFrame(pv);
      var doc=ifr.contentWindow.document;
      return new Promise(function(r){ setTimeout(r,250); }).then(function(){
        return (doc.fonts&&doc.fonts.ready)? doc.fonts.ready : null;
      }).then(function(){
        ifr.style.height=doc.body.scrollHeight+'px';
        var parts=slices(doc), jsPDF=window.jspdf.jsPDF;
        var pdf=new jsPDF({unit:'pt',format:'letter',orientation:'portrait'});
        var k=612/W, i=0;
        function next(){
          if(i>=parts.length) return pdf;
          var s=parts[i], h=s[1]-s[0];
          var st=$('pdfstat'); if(st) st.textContent='Page '+(i+1)+' of '+parts.length+'.';
          return html2canvas(doc.body,{scale:2,x:0,y:s[0],width:W,height:h,windowWidth:W,windowHeight:doc.body.scrollHeight,
              scrollX:0,scrollY:0,backgroundColor:'#ffffff',logging:false}).then(function(c){
            if(i>0) pdf.addPage('letter','portrait');
            pdf.addImage(c.toDataURL('image/jpeg',0.92),'JPEG',0,PAD*k,612,h*k);
            if(!narrow){ pdf.setFontSize(9); pdf.setTextColor(90);
            pdf.text('Page '+(i+1)+' of '+parts.length,306,760,{align:'center'}); }
            c.width=c.height=0; i++; return next();
          });
        }
        return next();
      });
    }).then(function(pdf){
      if(ifr) ifr.remove();
      var blob=pdf.output('blob');
      var file=null; try{ file=new File([blob],name,{type:'application/pdf'}); }catch(e){}
      var canShare=!!(file&&navigator.canShare&&navigator.canShare({files:[file]}));
      var url=URL.createObjectURL(blob);
      dlgOpen('<h3>Your PDF is ready</h3><p>Tap the button, then choose <b>Print</b>. You can also save it to Files or send it.</p>'+
        '<div class="row"><button class="pri" id="pdfgo">Print or share the PDF</button><button class="sec" id="pdfclose">Close</button></div>');
      $('pdfclose').onclick=function(){ dlgClose(); setTimeout(function(){ URL.revokeObjectURL(url); },60000); };
      $('pdfgo').onclick=function(){
        if(canShare){ navigator.share({files:[file],title:name.replace(/\.pdf$/,'')}).catch(function(){}); return; }
        var a=document.createElement('a'); a.href=url; a.download=name; a.target='_blank'; a.rel='noopener';
        document.body.appendChild(a); a.click(); a.remove();
      };
      window.__lastPdf={name:name,size:blob.size,pages:pdf.getNumberOfPages(),url:url,blob:blob};
    }).catch(function(){
      if(ifr) ifr.remove();
      dlgOpen('<h3>The PDF could not be made</h3><p>Open this page in Safari instead of from the home-screen icon. Printing works there.</p>'+
        '<div class="row"><button class="sec" onclick="dlgClose()">Close</button></div>');
    });
  }
  var _pip=window.printInPlace;
  window.printInPlace=function(target){
    if(homeScreen()){ var pv=$(target); if(pv) pv.style.display='block'; makePdf(target); return; }
    return _pip.apply(this,arguments);
  };
})();
