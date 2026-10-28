/* 鴻大產業園區 環評承諾檢索 — 搜尋與畫面程式 */
const FN=Object.assign({pin:'環評承諾執行重點說明'},D.fn);
const ORDER=['pin','c8','r1','r2','r3'];
// ---- 正規化 ----
const VAR={'臺':'台','汙':'污','裏':'裡','証':'證','綫':'線','峯':'峰','着':'著'};
function norm(s){
  let o='';
  for(const ch of s){
    let c=ch.charCodeAt(0);
    if(c>=0xFF01&&c<=0xFF5E) o+=String.fromCharCode(c-0xFEE0);
    else if(c===0x3000||/\s/.test(ch)) continue;
    else o+=VAR[ch]||ch;
  }
  return o.toLowerCase();
}
function normKeep(ch){ // 1:1，用於標示
  let c=ch.charCodeAt(0);
  if(c>=0xFF01&&c<=0xFF5E) return String.fromCharCode(c-0xFEE0).toLowerCase();
  return (VAR[ch]||ch).toLowerCase();
}
const plain=h=>h.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'");
const SYN=D.syn.map(g=>g.map(norm));
// ---- 段落 ----
const S=[];
D.pin.forEach((p,i)=>{
  S.push({f:'pin',pg:'第'+p.n+'點',pi:1,sec:'',who:'',q:p.q||'',a:p.t+(p.ex?'\n'+p.ex:''),fix:'',tags:[],auto:0,red:/<b>/.test(p.ex||'')});
});
D.segs.forEach((x,k)=>S.push({id:k,f:x[0],pg:x[1],pi:x[2],sec:x[3],who:x[4],q:x[5],a:x[6],fix:x[7],tags:x[8],auto:x[9],red:!!x[10],ph:(D.phase&&D.phase[k])||''}));
// ---- 分類校正：載入（overrides.js 檔 > 瀏覽器暫存）----
const OVK='hongda-tag-overrides';
let OVR={};
try{OVR=JSON.parse(localStorage.getItem(OVK)||'{}')}catch(e){OVR={}}
if(typeof OV==='object'&&OV){OVR=Object.assign({},OV,OVR)}
S.forEach(s=>{s.tags0=s.tags.slice();s.ph0=s.ph;s.auto0=s.auto;const o=s.id!==undefined&&OVR[s.id];if(o){s.tags=o.tags.slice();if(o.ph!==undefined)s.ph=o.ph;s.fixd=1;s.auto=0}});
S.forEach((s,i)=>{
  s.i=i;
  s.n=norm(plain([s.sec,s.who,s.q,s.a,s.fix].join(' ')));
  s.bg=new Set(); for(let k=0;k<s.n.length-1;k++) s.bg.add(s.n.substr(k,2));
});
// ---- 篩選 UI ----
const PH=['施工期間','營運期間',''];const PHN=p=>p||'未區分';
const st={showAll:false,view:'list',cmpLim:{r1:20,r2:20,r3:20},node:{id:'all'},open:new Set(),tags:new Set(),onlyRed:false,onlyAuto:false,limit:40};
const $=id=>document.getElementById(id);
function cnt(pred){return S.filter(pred).length}
$('tags').innerHTML=D.tags.map((t,i)=>`<button type="button" class="tagbtn" data-t="${i}" aria-pressed="false"><span>${t}</span><span class="n">${cnt(s=>s.tags.includes(i))}</span></button>`).join('')+
  `<button type="button" class="tagbtn" data-t="-1" aria-pressed="false"><span>未分類</span><span class="n">${cnt(s=>!s.tags.length)}</span></button>`;
function refreshCounts(){
  document.querySelectorAll('#tags .tagbtn').forEach(b=>{const t=+b.dataset.t;b.querySelector('.n').textContent=cnt(s=>t<0?!s.tags.length:s.tags.includes(t))});
  $('nAuto').textContent=cnt(s=>s.auto&&s.f!=='c8');
  $('nFixd').textContent=Object.keys(OVR).length;
}
$('onlyAuto').addEventListener('change',e=>{st.onlyAuto=e.target.checked;run()});
$('tags').addEventListener('click',e=>{const b=e.target.closest('.tagbtn');if(!b)return;toggleTag(+b.dataset.t)});
function toggleTag(t){st.tags.has(t)?st.tags.delete(t):st.tags.add(t);
  document.querySelectorAll('#tags .tagbtn').forEach(b=>b.setAttribute('aria-pressed',st.tags.has(+b.dataset.t)));run()}
$('onlyRed').addEventListener('change',e=>{st.onlyRed=e.target.checked;run()});
$('toggleSide').addEventListener('click',e=>{const o=$('side').classList.toggle('open');e.target.setAttribute('aria-expanded',o)});
$('clearTags').addEventListener('click',()=>{st.tags.clear();document.querySelectorAll('#tags .tagbtn').forEach(b=>b.setAttribute('aria-pressed','false'));run()});
// ---- 置頂 ----
let pinUser=null,lastQ='';
let prog=false;$('pin').addEventListener('toggle',()=>{if(prog){prog=false;return}pinUser=$('pin').open});
function renderPin(terms,qchanged){
  const P=D.pin;
  const pinEl=$('pin');
  if(qchanged){pinUser=null}
  const want=true;
  $('pin').innerHTML=`<summary>鴻大產業園區環評承諾執行重點說明 <small>115.3.10<span id="pinhit"></span></small></summary><ol>`+
  P.map((p,i)=>`<li><span>${p.n}.</span><div>${p.t.replace(/^\d+\.\s*/,'')}${p.ex?`<div class="ex">${p.q?`<span class="lbl">審查意見</span>${p.q}<span class="lbl" style="margin-top:6px">答覆說明</span>`:''}${fmt(p.ex)}<br><button type="button" class="imgbtn" data-i="${i}">看原圖</button><div class="imgwrap" hidden></div></div>`:''}</div></li>`).join('')+`</ol>`;
  highlight($('pin'),terms);
  const h=$('pin').querySelectorAll('ol mark:not(.hl-doc)').length;
  $('pinhit').textContent=terms.length?(h?`　${h} 處符合`:'　無符合內容'):'';
  if(pinEl.open!==want){prog=true;pinEl.open=want}
}
$('pin').addEventListener('click',e=>{const b=e.target.closest('.imgbtn');if(!b)return;
  const w=b.nextElementSibling; if(!w.firstChild){w.innerHTML=`<img alt="原文件第${D.pin[+b.dataset.i].n}點截圖" src="${D.pin[+b.dataset.i].img}">`}
  w.hidden=!w.hidden; b.textContent=w.hidden?'看原圖':'收合原圖'});
function fmt(h){return h.replace(/<b>/g,'<b class="r">').replace(/<mark>/g,'<mark class="hl-doc">')}
// ---- 搜尋 ----
function parse(q){
  const toks=q.trim().split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
  return toks.map(t=>{
    const vars=new Set([t]);const used=[];
    SYN.forEach((g,gi)=>g.forEach(m=>{ if(t.includes(m)){ g.forEach(o=>{ if(o!==m){vars.add(t.split(m).join(o))} }); used.push(D.syn[gi]); } }));
    const bg=[];for(let k=0;k<t.length-1;k++)bg.push(t.substr(k,2));
    return {t,vars:[...vars],bg:[...new Set(bg)],used};
  });
}
function scoreSeg(s,P){
  let matched=0,score=0,fuzzy=false,hl=[];
  for(const p of P){
    if(s.n.includes(p.t)){matched++;score+=10+Math.min(s.n.split(p.t).length-2,5);hl.push(p.t);continue}
    const v=p.vars.find(v=>v!==p.t&&s.n.includes(v));
    if(v){matched++;score+=7;hl.push(...p.vars.filter(x=>s.n.includes(x)));continue}
    if(p.bg.length>=2&&/[\u3400-\u9fff]/.test(p.t)){
      const hit=p.bg.filter(b=>s.bg.has(b));const cov=hit.length/p.bg.length;
      if(cov>=(p.bg.length>=4?0.5:0.6)){matched++;score+=4*cov;fuzzy=true;continue}
    }
  }
  return {matched,score:score+(s.red?1:0),fuzzy,hl};
}
let timer;
$('q').addEventListener('input',()=>{if(saved){saved=null;$('secbar').hidden=true}clearTimeout(timer);timer=setTimeout(()=>{st.limit=40;run()},150)});
$('clear').addEventListener('click',()=>{$('q').value='';st.limit=40;run();$('q').focus()});
document.addEventListener('keydown',e=>{
  if(e.key==='/'&&document.activeElement!==$('q')){e.preventDefault();$('q').focus()}
  if(e.key==='Escape'&&document.activeElement===$('q')){$('q').value='';run()}
});
$('more').addEventListener('click',()=>{st.limit+=40;run(true)});
function passFilter(s){
  if(st.onlyRed&&!s.red)return false;
  if(st.onlyAuto&&!(s.auto&&s.f!=='c8'))return false;
  if(st.tags.size){ if(!(s.tags.some(t=>st.tags.has(t))||(st.tags.has(-1)&&!s.tags.length)))return false }
  return true;
}
let last=[];let shownNum=0,raf;
function animNum(to){
  const el=$('num');const from=shownNum;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||from===to){shownNum=to;el.textContent=to;return}
  cancelAnimationFrame(raf);const t0=performance.now(),dur=450;
  const step=now=>{const p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);const v=Math.round(from+(to-from)*e);el.textContent=v;shownNum=v;if(p<1)raf=requestAnimationFrame(step)};
  raf=requestAnimationFrame(step);
}
function run(keep){
  if(!keep)cur=-1;
  const q=$('q').value; const P=parse(q);
  const used=[...new Set(P.flatMap(p=>p.used.map(g=>g.join('、'))))];
  $('hint').innerHTML=P.length?(used.length?'同義詞一併搜尋：'+used.map(u=>`<em>${u}</em>`).join(''):'') :'按 / 可快速跳到搜尋欄；支援近似字、同義詞、多關鍵字（空格分隔）；搜尋後按 Enter 或右下角 ▲▼ 可逐筆檢視';
  let list=S.filter(passFilter);
  let full=0;
  if(P.length){
    list=list.filter(s=>s.sec!=='目錄'); // 搜尋時不列目錄頁
    list=list.map(s=>Object.assign({s},scoreSeg(s.s||s,P))).map(r=>({s:r.s,...r}));
    list=list.filter(r=>r.matched>0).sort((a,b)=>b.matched-a.matched||b.score-a.score||ORDER.indexOf(a.s.f)-ORDER.indexOf(b.s.f)||a.s.i-b.s.i);
  } else list=list.map(s=>({s,matched:0,fuzzy:false,hl:[]}));
  renderTree(list,P.length>0);
  if(st.view!=='cmp') list=list.filter(r=>inNode(r.s,st.node));
  if(P.length) full=list.filter(r=>r.matched===P.length).length;
  last=list;
  const terms=[...new Set(list.slice(0,st.limit).flatMap(r=>r.hl))];
  const qc=q!==lastQ;lastQ=q;if(qc&&!keep&&window.scrollY>0){lock=Date.now()+300;window.scrollTo({top:0})}if(st.node.id==='pin'&&st.view!=='cmp')renderPin(P.length?P.flatMap(p=>p.vars):[],qc);
  showView();
  renderCrumb();
  if(st.view==='cmp'){runCmp(P,keep);return}
  const ovOn=SET.overview&&!P.length&&st.node.id==='all'&&!st.tags.size&&!st.onlyRed&&!st.onlyAuto&&!st.showAll;
  $('ovw').hidden=!ovOn;$('res').hidden=ovOn||st.node.id==='pin';
  if(ovOn){renderOverview();$('count').innerHTML='概況';$('sub').textContent='點選方塊進入；或按下方「列出全部段落」';last=[];$('res').innerHTML='';$('more').hidden=true;updPos();return}
  if(st.node.id==='pin'){ // 執行重點說明：以原排版呈現
    $('count').innerHTML=`執行重點說明`;$('sub').textContent=P.length?'':'115.3.10';last=[];$('res').innerHTML='';$('more').hidden=true;updPos();return}
  $('count').innerHTML=(P.length?'找到':'共')+`<span class="num" id="num">${shownNum}</span>段`;animNum(list.length);
  const nRed=list.filter(r=>r.s.red).length;
  $('sub').textContent=(P.length>1?`同時符合全部關鍵字 ${full} 段（排在前面）．`:'')+`含紅字 ${nRed} 段`;
  const shown=list.slice(0,st.limit);
  const res=$('res');
  if(!list.length){res.innerHTML=`<li class="empty">沒有符合的段落。可改用較短的關鍵字、減少關鍵字數量，或取消左側篩選條件。</li>`}
  else res.innerHTML=shown.map((r,k)=>{const base=keep?st.limit-40:0;r._anim=k>=base;r._k=k-base;return card(r)}).join('');
  shown.forEach((r,k)=>{const li=res.children[k];highlight(li,r.hl);markHidden(li);minimap(li);const n=li.querySelectorAll('.body mark:not(.hl-doc)').length;
    if(n){const sp=document.createElement('span');sp.className='hits';sp.textContent=`${n} 處符合`;li.querySelector('.meta').insertBefore(sp,li.querySelector('.chips'))}});
  const rest=list.length-shown.length;
  if(typeof updPos==='function'){if(keep&&cur>=0){const c=res.children[cur];c&&c.classList.add('cur')}updPos()}
  $('more').hidden=rest<=0; $('more').textContent=`顯示更多（尚有 ${rest} 段）`;
}
function secLinks(h){
  return h.replace(/第\s*(8\.\d+(?:\.\d+)?)\s*節/g,(m,n)=>{const t=D.tags.findIndex(x=>x.split(' ')[0]===n);
    return t<0?m:`<button type="button" class="seclink" data-t="${t}" title="檢視第八章 ${D.tags[t]}">${m}</button>`});
}
function card(r){
  const s=r.s;
  const chips=s.tags.map(t=>`<button type="button" class="chip${s.auto&&s.f!=='c8'?' auto':''}" data-t="${t}" title="篩選此分類">${D.tags[t]}</button>`).join('');
  const pg=s.f==='pin'?s.pg:(s.f==='c8'?'P.'+s.pg:s.pg);
  const href=encodeURIComponent(D.pdf[s.f])+'#page='+s.pi;
  const meta=`<div class="meta"><span class="file">${FN[s.f]}</span><a class="pg" href="${href}" target="_blank" rel="noopener" title="開啟原始 PDF 第 ${s.pi} 頁（PDF 須與網頁放在同一資料夾）">${pg}</a>${s.f!=='pin'?`<a class="pdfl" href="${href}" target="_blank" rel="noopener">開啟 PDF 第 ${s.pi} 頁</a>`:''}${s.who?`<span class="who">${s.who}</span>`:''}${r.fuzzy?'<span class="fz">近似</span>':''}${s.f==='c8'?`<span class="phs">${PHN(s.ph)}</span>`:''}${s.fixd?'<span class="fixd">已校正</span>':''}<span class="chips">${chips}</span>${s.f!=='pin'?`<button type="button" class="edt" data-i="${s.i}" aria-expanded="false">✎ 分類</button>`:''}</div><div class="editor" hidden></div>`;
  let body;
  if(s.q){body=`<div class="qa"><div><span class="lbl">${s.f==='pin'?'審查意見':'審查意見／會議結論'}</span>${fmt(s.q)}</div><div><span class="lbl">答覆說明</span>${fmt(s.a)}</div><div class="fx${s.fix?'':' fx-empty'}"><span class="lbl">修正處</span>${secLinks(fmt(s.fix))||'—'}</div></div>`}
  else body=(s.sec&&s.f==='c8'&&!s.tags.length?`<div class="sec">${s.sec}</div>`:'')+`<div class="para">${fmt(s.a)}</div>`;
  const len=plain(s.q+s.a).length;
  if(SET.redsum&&s.red&&s.f!=='pin'){
    const rs=[s.q,s.a].flatMap(x=>sentHtml(x).filter(t=>/<b>/.test(t)));
    if(rs.length) return `<li class="card${r._anim?' in':''} has-red" style="--d:${Math.min(r._k||0,12)*0.035}s">${meta}<div class="body rsum"><span class="lbl">承諾句（${rs.length} 句）</span>${rs.map(t=>`<p class="hs">${fmt(t)}</p>`).join('')}</div><div class="body rfull" hidden>${body}</div><button type="button" class="rtog">看全文（本段 ${len} 字）</button></li>`;
  }
  const long=len>700;
  return `<li class="card${r._anim?' in':''}${s.red?' has-red':''}" style="--d:${Math.min(r._k||0,12)*0.035}s">${meta}<div class="body${long?' clamp':''}">${body}</div>${long?`<button type="button" class="expand">展開全文（本段 ${len} 字）</button>`:''}</li>`;
}
$('res').addEventListener('click',e=>{const x=e.target.closest('.expand');if(x){const b=x.previousElementSibling;const c=b.classList.toggle('clamp');
    x.textContent=c?x.dataset.label:'收合';
    if(!c){const m=b.querySelector('mark:not(.hl-doc)');if(m&&x.dataset.jump==='1'){m.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});m.classList.add('flash')}}
    else x.closest('.card').scrollIntoView({block:'nearest'});
    return}
  const sl=e.target.closest('.seclink');if(sl){openSection(+sl.dataset.t);return}
  const rt=e.target.closest('.rtog');if(rt){const c=rt.closest('.card');const f=c.querySelector('.rfull'),sm=c.querySelector('.rsum');const op=f.hidden;f.hidden=!op;sm.hidden=op;
    if(!rt.dataset.l)rt.dataset.l=rt.textContent;rt.textContent=op?'回到承諾句':rt.dataset.l;if(op){const mk=f.querySelector('mark:not(.hl-doc)');mk&&mk.scrollIntoView({block:'center'});minimap(c)}else c.scrollIntoView({block:'nearest'});return}
  const ed=e.target.closest('.edt');if(ed){toggleEditor(ed);return}
  const sv=e.target.closest('.ed-save');if(sv){saveEditor(sv.closest('.card'));return}
  const rs=e.target.closest('.ed-reset');if(rs){resetEditor(rs.closest('.card'));return}
  const cc=e.target.closest('.ed-cancel');if(cc){const c=cc.closest('.card');c.querySelector('.editor').hidden=true;c.querySelector('.edt').setAttribute('aria-expanded','false');return}
  const c=e.target.closest('.chip');if(c){toggleTag(+c.dataset.t);window.scrollTo({top:0})}});
function isHidden(m,body){
  return (m.getBoundingClientRect().top-body.getBoundingClientRect().top)>body.clientHeight-40;
}
function markHidden(li){
  const b=li.querySelector('.body.clamp');const x=li.querySelector('.expand');if(!b||!x)return;
  const ms=[...b.querySelectorAll('mark:not(.hl-doc)')];
  const vis=ms.filter(m=>!isHidden(m,b)).length;
  let lab=x.textContent;
  x.dataset.jump=(ms.length&&!vis)?'1':'0';
  if(ms.length&&!vis) lab=`符合處在下方，展開並跳到第一處（本段 ${plain(li.querySelector('.body').innerHTML).length} 字）`;
  else if(ms.length>vis) lab=x.textContent+`，另有 ${ms.length-vis} 處符合在下方`;
  x.textContent=lab;x.dataset.label=lab;
}
// ---- 分類校正：編輯 ----
function toggleEditor(btn){
  const c=btn.closest('.card'),box=c.querySelector('.editor'),s=S[+btn.dataset.i];
  if(!box.hidden){box.hidden=true;btn.setAttribute('aria-expanded','false');return}
  c.dataset.i=s.i;
  box.innerHTML=`<div class="ed-title">校正分類（可複選）</div><div class="ed-grid">`+
    D.tags.map((t,i)=>`<label><input type="checkbox" value="${i}"${s.tags.includes(i)?' checked':''}> ${t}</label>`).join('')+`</div>`+
    (s.f==='c8'?`<div class="ed-title">階段</div><div class="ed-grid ed-ph">`+PH.map(p=>`<label><input type="radio" name="ph${s.i}" value="${p}"${s.ph===p?' checked':''}> ${PHN(p)}</label>`).join('')+`</div>`:'')+
    `<div class="ed-act"><button type="button" class="ed-save">儲存</button><button type="button" class="ed-cancel">取消</button>${s.fixd?'<button type="button" class="ed-reset">還原為原始分類</button>':''}<span class="ed-orig">原始分類：${s.tags0.map(t=>D.tags[t]).join('、')||'未分類'}${s.f==='c8'?'；階段：'+PHN(s.ph0):''}</span></div>`;
  box.hidden=false;btn.setAttribute('aria-expanded','true');
}
function persist(){try{localStorage.setItem(OVK,JSON.stringify(OVR))}catch(e){}refreshCounts()}
function saveEditor(c){
  const s=S[+c.dataset.i],box=c.querySelector('.editor');
  const tags=[...box.querySelectorAll('.ed-grid:not(.ed-ph) input:checked')].map(i=>+i.value).sort((a,b)=>a-b);
  const r=box.querySelector('.ed-ph input:checked');const ph=r?r.value:s.ph;
  const same=tags.join()===s.tags0.join()&&ph===s.ph0;
  if(same){delete OVR[s.id];s.tags=s.tags0.slice();s.ph=s.ph0;s.fixd=0;s.auto=s.auto0}
  else{OVR[s.id]=s.f==='c8'?{tags,ph}:{tags};s.tags=tags;s.ph=ph;s.fixd=1;s.auto=0}
  persist();rerenderCard(c,s);flashMsg(same?'與原始分類相同，未列入校正':'已儲存（尚未匯出）');
}
function resetEditor(c){const s=S[+c.dataset.i];delete OVR[s.id];s.tags=s.tags0.slice();s.ph=s.ph0;s.fixd=0;s.auto=s.auto0;persist();rerenderCard(c,s);flashMsg('已還原為原始分類')}
function rerenderCard(c,s){
  const r=last.find(x=>x.s===s)||{s,hl:[]};
  const tmp=document.createElement('div');tmp.innerHTML=card(Object.assign({},r,{_anim:false}));
  const nc=tmp.firstElementChild;if(c.classList.contains('cur'))nc.classList.add('cur');
  c.replaceWith(nc);highlight(nc,r.hl||[]);markHidden(nc);
}
function flashMsg(t){const m=$('toast');m.textContent=t;m.hidden=false;clearTimeout(flashMsg.t);flashMsg.t=setTimeout(()=>m.hidden=true,2200)}
// 匯出設定檔
$('exportOv').addEventListener('click',()=>{
  const n=Object.keys(OVR).length;if(!n){flashMsg('目前沒有校正紀錄');return}
  const lines=Object.entries(OVR).map(([id,o])=>{const s=S.find(x=>x.id===+id);
    return `  /* ${FN[s.f]} ${s.pg}${s.who?' '+s.who:''}｜原：${s.tags0.map(t=>D.tags[t]).join('、')||'未分類'}${s.f==='c8'?'／'+PHN(s.ph0):''} → 新：${o.tags.map(t=>D.tags[t]).join('、')||'未分類'}${o.ph!==undefined?'／'+PHN(o.ph):''} */\n  "${id}":${JSON.stringify(o)}`});
  const txt=`/* 鴻大產業園區 環評承諾檢索 — 分類校正設定檔\n   匯出時間：${new Date().toLocaleString('zh-TW')}　共 ${n} 段\n   放在網頁同一資料夾即自動套用 */\nconst OV={\n${lines.join(',\n')}\n};\n`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));a.download='overrides.js';document.body.appendChild(a);a.click();a.remove();
  flashMsg(`已匯出 overrides.js（${n} 段）`);
});
$('clearOv').addEventListener('click',()=>{
  if(!Object.keys(OVR).length){flashMsg('目前沒有校正紀錄');return}
  if(!confirm('確定清除此瀏覽器內的全部校正紀錄？（已匯出的 overrides.js 不受影響）'))return;
  OVR={};S.forEach(s=>{s.tags=s.tags0.slice();s.ph=s.ph0;s.fixd=0;s.auto=s.auto0});persist();run();flashMsg('已清除校正紀錄');
});
// ---- 第八章節檢視 ----
let saved=null;
function openSection(t){
  if(!saved) saved={view:st.view,q:$('q').value,node:st.node,open:new Set(st.open),tags:new Set(st.tags),onlyRed:st.onlyRed,y:window.scrollY};
  st.view='list';$('q').value='';st.node={id:'c8:'+t,f:'c8',t};st.open.add('c8');st.tags=new Set();st.onlyRed=false;st.limit=200;
  syncUI();run();
  $('secbar').hidden=false;$('secname').textContent=D.tags[t];
  window.scrollTo({top:0});
}
function closeSection(){
  if(!saved)return;
  st.view=saved.view||'list';$('q').value=saved.q;st.node=saved.node;st.open=saved.open;st.tags=saved.tags;st.onlyRed=saved.onlyRed;st.limit=40;
  const y=saved.y;saved=null;$('secbar').hidden=true;syncUI();run();
  requestAnimationFrame(()=>window.scrollTo({top:y}));
}
function syncUI(){
  document.querySelectorAll('#tags .tagbtn').forEach(b=>b.setAttribute('aria-pressed',st.tags.has(+b.dataset.t)));
  $('onlyRed').checked=st.onlyRed;
}
$('secback').addEventListener('click',closeSection);
// ---- 標示 ----
function highlight(root,terms){
  terms=[...new Set(terms.filter(t=>t&&t.length))].sort((a,b)=>b.length-a.length);
  if(!terms.length)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode.closest('.lbl,.meta,button,summary small')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes=[];let n;while(n=walker.nextNode())nodes.push(n);
  // 以區塊為單位串接
  const map=[];let str='';
  nodes.forEach((nd,ni)=>{const t=nd.nodeValue;for(let k=0;k<t.length;k++){const ch=t[k];if(/\s/.test(ch)||ch==='\u3000')continue;str+=normKeep(ch);map.push([ni,k])}});
  const marks=new Array(str.length).fill(false);
  for(const t of terms){let p=0;while((p=str.indexOf(t,p))>=0){for(let k=p;k<p+t.length;k++)marks[k]=true;p+=t.length}}
  // 依節點彙整區段
  const per=new Map();
  let k=0;
  while(k<str.length){
    if(!marks[k]){k++;continue}
    let j=k;while(j+1<str.length&&marks[j+1]&&map[j+1][0]===map[k][0])j++;
    const ni=map[k][0];if(!per.has(ni))per.set(ni,[]);per.get(ni).push([map[k][1],map[j][1]+1]);k=j+1;
  }
  per.forEach((rs,ni)=>{
    const nd=nodes[ni];
    rs.sort((a,b)=>b[0]-a[0]).forEach(([a,b])=>{
      const mid=nd.splitText(a);mid.splitText(b-a);
      const m=document.createElement('mark');mid.parentNode.replaceChild(m,mid);m.appendChild(mid);
    });
  });
}

// ---- 上下逐筆檢視 ----
var cur=-1, lock=0;
const cards=()=>[...document.querySelectorAll('#res .card')];
function hdr(){return document.querySelector('.top').offsetHeight}
function goto(i){
  if(st.view==='cmp')return;
  const total=last.length; if(!total)return;
  i=Math.max(0,Math.min(total-1,i));
  if(i>=st.limit){st.limit=Math.ceil((i+1)/40)*40;run(true)}
  const cs=cards(); const c=cs[i]; if(!c)return;
  cs.forEach(x=>x.classList.remove('cur')); c.classList.add('cur');
  cur=i; lock=Date.now()+900;
  const y=c.getBoundingClientRect().top+window.scrollY-hdr()-12;
  window.scrollTo({top:y,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  updPos();
}
function updPos(){
  const total=last.length; const nav=$('nav');
  nav.hidden=!total||st.view==='cmp';
  $('pos').textContent=total?`${cur<0?'–':cur+1} / ${total}`:'';
  $('prev').disabled=cur<=0; $('next').disabled=cur>=total-1;
}
$('prev').addEventListener('click',()=>goto(cur-1));
$('next').addEventListener('click',()=>goto(cur+1));
document.addEventListener('keydown',e=>{
  const typing=document.activeElement===$('q');
  if(typing&&e.key==='Enter'){e.preventDefault();$('q').blur();goto(0);return}
  if(!$('setPanel').hidden||typing||e.altKey||e.ctrlKey||e.metaKey||document.activeElement.closest&&document.activeElement.closest('#tree'))return;
  if(e.key==='ArrowDown'){e.preventDefault();goto(cur+1)}
  if(e.key==='ArrowUp'){e.preventDefault();goto(cur-1)}
});
// 手動捲動時，計數跟著目前畫面上的卡片
let st2;
window.addEventListener('scroll',()=>{clearTimeout(st2);st2=setTimeout(()=>{
  if(Date.now()<lock)return;
  const cs=cards(); if(!cs.length)return; const lim=hdr()+40;
  let k=cs.findIndex(c=>c.getBoundingClientRect().bottom>lim);
  if(k<0)k=cs.length-1;
  if(k!==cur){cs.forEach(x=>x.classList.remove('cur'));cur=k;cs[k].classList.add('cur');updPos()}
},120)},{passive:true});

// ---- 歷次回覆演變對照 ----
const RV=['r1','r2','r3'];
function showView(){
  const c=st.view==='cmp';
  const pinv=!c&&st.node.id==='pin';
  $('cmp').hidden=!c; $('res').hidden=c||pinv; $('pin').hidden=!pinv;
  document.querySelectorAll('.vtab').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===st.view));
  $('side').classList.toggle('cmpmode',c);
  if(c){$('more').hidden=true;$('nav').hidden=true}
}
function cmpPass(s){ // 對照模式：固定三次審查回覆；若目錄選了章節，只看該章節
  if(st.node.t!==undefined&&!inNode(s,{t:st.node.t}))return false;
  if(st.onlyRed&&!s.red)return false;
  if(st.onlyAuto&&!(s.auto&&s.f!=='c8'))return false;
  if(st.tags.size){ if(!(s.tags.some(t=>st.tags.has(t))||(st.tags.has(-1)&&!s.tags.length)))return false }
  return true;
}
function runCmp(P,keep){
  if(!keep)st.cmpLim={r1:20,r2:20,r3:20};
  const box=$('cmp');
  if(!P.length){
    $('count').innerHTML='歷次回覆對照';$('sub').textContent='';
    box.innerHTML='<div class="empty">請在上方輸入關鍵字，三次審查意見回覆的符合段落會左中右並排，方便比較同一議題的回覆變化。</div>';
    last=[];return;
  }
  const col={r1:[],r2:[],r3:[]};
  S.forEach(s=>{if(!RV.includes(s.f)||!cmpPass(s))return;const r=scoreSeg(s,P);if(r.matched>0)col[s.f].push(Object.assign({s},r))});
  RV.forEach(f=>col[f].sort((a,b)=>b.matched-a.matched||b.score-a.score||a.s.i-b.s.i));
  const tot=RV.reduce((n,f)=>n+col[f].length,0);
  $('count').innerHTML=`找到<span class="num" id="num">${shownNum}</span>段`;animNum(tot);
  $('sub').textContent='三次審查回覆並排；第八章與執行重點說明不列入此檢視。是否為同一議題請依內容判斷。';
  last=[];
  if(!st.cmpCol)st.cmpCol='r1';
  box.innerHTML=`<div class="cmptabs" role="tablist">`+RV.map(f=>`<button type="button" role="tab" data-cc="${f}" aria-pressed="${st.cmpCol===f}">第${f[1]}次 ${col[f].length}</button>`).join('')+`</div>`+RV.map(f=>{
    const L=col[f],show=L.slice(0,st.cmpLim[f]),rest=L.length-show.length;
    return `<section class="ccol${st.cmpCol===f?' on':''}" data-f="${f}"><h3>${FN[f]}<span>${L.length} 段</span></h3>`+
      (L.length?show.map(cmpCard).join(''):'<p class="cempty">無符合段落</p>')+
      (rest>0?`<button type="button" class="cmore" data-f="${f}">顯示更多（尚有 ${rest} 段）</button>`:'')+`</section>`;
  }).join('');
  RV.forEach(f=>{const cards=box.querySelectorAll(`.ccol[data-f="${f}"] .ccard`);
    col[f].slice(0,st.cmpLim[f]).forEach((r,k)=>{const el=cards[k];highlight(el,r.hl);markHidden(el)})});
}
function sentHtml(h){ // 依句號切句並保持紅字標記完整
  const out=[];let open=false;
  h.split(/(?<=。)/).forEach(p=>{let t=(open?'<b>':'')+p;const o=(t.match(/<b>/g)||[]).length,c=(t.match(/<\/b>/g)||[]).length;open=o>c;if(open)t+='</b>';out.push(t)});
  return out;
}
function hitSents(h,terms,max){
  if(!terms.length)return [];
  const ss=sentHtml(h);const res=[];
  ss.forEach((x,i)=>{const n=norm(plain(x));if(terms.some(t=>n.includes(t)))res.push(i)});
  return res.slice(0,max).map(i=>({i,h:ss[i]}));
}
function cmpCard(r){
  const s=r.s,href=encodeURIComponent(D.pdf[s.f])+'#page='+s.pi;
  const len=plain(s.q+s.a).length;
  const terms=[...new Set(r.hl||[])];
  const hs=hitSents(s.a,terms,4), total=hitSents(s.a,terms,999).length;
  const qblk=s.q?`<div class="cq"><span class="lbl">審查意見</span>${fmt(s.q)}</div>`:'';
  const full=`${qblk}<div class="ca"><span class="lbl">答覆說明</span>${fmt(s.a)}</div>${s.fix?`<div class="cf"><span class="lbl">修正處</span>${secLinks(fmt(s.fix))}</div>`:''}`;
  let body;
  if(hs.length&&len>260){
    body=`<div class="body csum">${qblk}<div class="ca"><span class="lbl">答覆說明中的符合句（${total} 句${total>hs.length?'，顯示前 '+hs.length+' 句':''}）</span>${hs.map(x=>`<p class="hs">…${fmt(x.h)}</p>`).join('')}</div></div><div class="body cfull" hidden>${full}</div><button type="button" class="ctog">看全文（本段 ${len} 字）</button>`;
  } else {
    const long=len>260;
    body=`<div class="body${long?' clamp':''}">${full}</div>${long?`<button type="button" class="expand">展開全文（本段 ${len} 字）</button>`:''}`;
  }
  return `<article class="ccard${s.red?' has-red':''}"><div class="meta"><a class="pg" href="${href}" target="_blank" rel="noopener" title="開啟原始 PDF 第 ${s.pi} 頁">${s.pg}</a>${s.who?`<span class="who">${s.who}</span>`:''}${r.fuzzy?'<span class="fz">近似</span>':''}</div>${body}</article>`;
}
$('cmp').addEventListener('click',e=>{
  const tg=e.target.closest('.ctog');if(tg){const a=tg.closest('.ccard');const f=a.querySelector('.cfull'),sm=a.querySelector('.csum');const op=f.hidden;f.hidden=!op;sm.hidden=op;if(!tg.dataset.l)tg.dataset.l=tg.textContent;tg.textContent=op?'回到符合句':tg.dataset.l;if(op){const mk=f.querySelector('mark:not(.hl-doc)');mk&&mk.scrollIntoView({block:'center'})}else a.scrollIntoView({block:'nearest'});return}
  const cc=e.target.closest('[data-cc]');if(cc){setCmpCol(cc.dataset.cc);return}
  const m=e.target.closest('.cmore');if(m){st.cmpLim[m.dataset.f]+=20;const y=window.scrollY;run(true);window.scrollTo({top:y});return}
  const x=e.target.closest('.expand');if(x){const b=x.previousElementSibling;const c=b.classList.toggle('clamp');x.textContent=c?x.dataset.label:'收合';
    if(!c){const mk=b.querySelector('mark:not(.hl-doc)');if(mk&&x.dataset.jump==='1')mk.scrollIntoView({block:'center'})}return}
  const sl=e.target.closest('.seclink');if(sl){openSection(+sl.dataset.t);return}
});
document.querySelectorAll('.vtab').forEach(b=>b.addEventListener('click',()=>{st.view=b.dataset.v;cur=-1;run();window.scrollTo({top:0})}));
function setHdr(){document.documentElement.style.setProperty('--hdr',(document.querySelector('.top').offsetHeight)+'px')}
setHdr();window.addEventListener('resize',setHdr);

// ---- 文件目錄樹 ----
const TREE=[{id:'all',label:'全部文件'},{id:'pin',f:'pin',label:'執行重點說明'}].concat(['c8','r1','r2','r3'].map(f=>({id:f,f,label:FN[f]})));
function inNode(s,n){
  if(!n||n.id==='all')return true;
  if(n.f&&s.f!==n.f)return false;
  if(n.t!==undefined){ if(n.t===-1){ if(s.tags.length)return false } else if(!s.tags.includes(n.t))return false }
  if(n.p!==undefined&&s.ph!==n.p)return false;
  return true;
}
function treeChildren(f,list){
  const L=list.filter(r=>r.s.f===f);
  const kids=[];
  D.tags.forEach((t,i)=>{const c=L.filter(r=>r.s.tags.includes(i));kids.push({id:f+':'+i,f,t:i,label:t,n:c.length,base:S.filter(s=>s.f===f&&s.tags.includes(i)).length,
    sub:f==='c8'?PH.map(p=>({id:f+':'+i+':'+p,f,t:i,p,label:PHN(p),n:c.filter(r=>r.s.ph===p).length,base:S.filter(s=>s.f===f&&s.tags.includes(i)&&s.ph===p).length})).filter(x=>x.base):null})});
  const u=L.filter(r=>!r.s.tags.length);
  kids.push({id:f+':-1',f,t:-1,label:f==='c8'?'其他（章首、目錄）':'未分類',n:u.length,base:S.filter(s=>s.f===f&&!s.tags.length).length});
  return kids.filter(k=>k.base);
}
function renderTree(list,searching){
  const cntIn=n=>list.filter(r=>inNode(r.s,n)).length;
  const item=(n,lv,hasKids,num)=>{
    const sel=st.node.id===n.id, op=st.open.has(n.id);
    return `<div class="tn lv${lv}${sel?' sel':''}${searching&&!num?' zero':''}" data-id="${n.id}" role="treeitem" aria-selected="${sel}"${hasKids?` aria-expanded="${op}"`:''} tabindex="${sel?0:-1}">`+
      `<span class="tw">${hasKids?(op?'▾':'▸'):''}</span><span class="tl">${n.label}</span><span class="n">${num}</span></div>`;
  };
  let h='';
  TREE.forEach(n=>{
    const num=cntIn(n);
    if(n.id==='all'||n.id==='pin'){h+=item(n,0,false,num);return}
    h+=item(n,0,true,num);
    if(st.open.has(n.id)){
      treeChildren(n.f,list).forEach(k=>{
        if(searching&&!k.n&&st.node.id!==k.id)return; // 搜尋時隱藏 0 筆的子節點
        const sub=(k.sub||[]).filter(x=>!searching||x.n||st.node.id===x.id);
        const hk=!!sub.length;
        h+=item(k,1,hk,k.n);
        if(hk&&st.open.has(k.id)) sub.forEach(x=>h+=item(x,2,false,x.n));
      });
    }
  });
  $('tree').innerHTML=h;
  NODES={};TREE.forEach(n=>{NODES[n.id]=n;if(n.f&&n.id!=='pin')treeChildren(n.f,[]).forEach(k=>{NODES[k.id]=k;(k.sub||[]).forEach(x=>NODES[x.id]=x)})});
}
var NODES={};
$('tree').addEventListener('click',e=>{
  const el=e.target.closest('.tn');if(!el)return;
  const id=el.dataset.id,n=NODES[id];if(!n)return;
  const hasKids=el.hasAttribute('aria-expanded');
  if(e.target.closest('.tw')&&hasKids){st.open.has(id)?st.open.delete(id):st.open.add(id);run(true);return}
  if(st.node.id===id&&hasKids){st.open.has(id)?st.open.delete(id):st.open.add(id)}
  else{st.node={id,f:n.f,t:n.t,p:n.p};if(hasKids)st.open.add(id)}
  st.showAll=false;
  if(saved){saved=null;$('secbar').hidden=true}
  st.limit=40;cur=-1;run();window.scrollTo({top:0});
  if(isM()){setMTab(st.view==='cmp'?'cmp':'search')}
});
$('tree').addEventListener('keydown',e=>{
  const items=[...document.querySelectorAll('#tree .tn')];const i=items.indexOf(document.activeElement);if(i<0)return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();const j=Math.max(0,Math.min(items.length-1,i+(e.key==='ArrowDown'?1:-1)));items.forEach(x=>x.tabIndex=-1);items[j].tabIndex=0;items[j].focus()}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();items[i].click();setTimeout(()=>{const s=document.querySelector('#tree .tn.sel');s&&s.focus()},0)}
});
function renderCrumb(){
  const n=st.node;const parts=[];
  if(n.id==='all')parts.push('全部文件');
  else{parts.push(n.f==='pin'?'執行重點說明':FN[n.f]);if(n.t!==undefined)parts.push(n.t===-1?(n.f==='c8'?'其他（章首、目錄）':'未分類'):D.tags[n.t]);if(n.p!==undefined)parts.push(PHN(n.p))}
  $('crumb').innerHTML=parts.map((p,i)=>`<span${i===parts.length-1?' class="last"':''}>${p}</span>`).join('<i>›</i>');
}

// ---- 主題色 ----
const ACCENTS=['blue','green','gold','pink','cyber','coral','lavender','glacier','charcoal','jadegold'];
function setAccent(a){
  if(!ACCENTS.includes(a))a='blue';
  const d=document.documentElement;
  ACCENTS.forEach(x=>d.classList.remove('accent-'+x));d.classList.add('accent-'+a);
  try{localStorage.setItem('accent',a)}catch(e){}
  document.querySelectorAll('.acc').forEach(b=>b.setAttribute('aria-checked',b.dataset.ac===a));
}
document.querySelectorAll('.acc').forEach(b=>b.addEventListener('click',()=>setAccent(b.dataset.ac)));
setAccent((()=>{try{return localStorage.getItem('accent')}catch(e){return null}})()||'blue');
// ---- 字型 ----
const SAMPLE='鴻大產業園區環評承諾 PM2.5 130 CMD';
function renderFonts(){
  const cur=document.documentElement.dataset.font||'kai';
  $('fontList').innerHTML=FONTS.map(f=>`<button type="button" class="fopt" role="radio" aria-checked="${f.id===cur}" data-font="${f.id}"><span class="fs" style='font-family:${f.stack}'>${SAMPLE}</span><span class="fn">${f.name}<small>${f.note}${f.gf?'・網路字型':''}</small></span></button>`).join('');
}
let fontPreviewed=false;
function previewFonts(){ // 只下載範例字所需的字（檔案極小），選定後才下載完整字型
  if(fontPreviewed)return;fontPreviewed=true;
  FONTS.filter(f=>f.gf).forEach(f=>{const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+f.gf.split(':')[0]+'&display=swap&text='+encodeURIComponent(SAMPLE);document.head.appendChild(l)});
}
function setFont(id){
  id=applyFont(id);try{localStorage.setItem('font',id)}catch(e){}
  document.querySelectorAll('.fopt').forEach(b=>b.setAttribute('aria-checked',b.dataset.font===id));
  setHdr();
}
renderFonts();
$('fontList').addEventListener('click',e=>{const b=e.target.closest('.fopt');if(b)setFont(b.dataset.font)});
document.querySelector('#mtabs button[data-m="set"]').addEventListener('click',previewFonts);
// ---- 深淺模式 ----
const mqDark=matchMedia('(prefers-color-scheme: dark)');
function applyMode(){document.documentElement.classList.toggle('mode-dark',SET.mode==='dark'||(SET.mode==='auto'&&mqDark.matches))}
mqDark.addEventListener&&mqDark.addEventListener('change',()=>{if(SET.mode==='auto')applyMode()});
// ---- 概況 ----
function renderOverview(){
  const rc=f=>S.filter(s=>(!f||f(s))&&s.red).length, nc=f=>S.filter(f).length;
  const tile=(id,nm,n,r)=>`<button type="button" class="ov-t" data-id="${id}"><span class="nm">${nm}</span><span class="v">${n}<small>段</small></span><span class="rd">紅字 ${r} 段</span></button>`;
  let h=`<h3>各文件</h3><div class="ov-grid">`+TREE.filter(n=>n.id!=='all').map(n=>tile(n.id,n.label,nc(s=>s.f===n.f),rc(s=>s.f===n.f))).join('')+`</div>`;
  h+=`<h3>第八章各節</h3><div class="ov-grid">`+D.tags.map((t,i)=>{const f=s=>s.f==='c8'&&s.tags.includes(i);const n=nc(f);return n?tile('c8:'+i,t,n,rc(f)):''}).join('')+`</div>`;
  h+=`<h3>第八章各階段</h3><div class="ov-grid">`+PH.map(p=>{const f=s=>s.f==='c8'&&s.ph===p;return `<button type="button" class="ov-t" data-ph="${p}"><span class="nm">${PHN(p)}</span><span class="v">${nc(f)}<small>段</small></span><span class="rd">紅字 ${rc(f)} 段</span></button>`}).join('')+`</div>`;
  h+=`<button type="button" class="ov-all" id="ovAll">列出全部 ${S.length} 段</button>`;
  $('ovw').innerHTML=h;
}
$('ovw').addEventListener('click',e=>{
  if(e.target.closest('#ovAll')){st.showAll=true;run();return}
  const t=e.target.closest('.ov-t');if(!t)return;
  if(t.dataset.ph!==undefined){const p=t.dataset.ph;st.node={id:'c8:ph:'+p,f:'c8',p};st.open.add('c8');}
  else{const n=NODES[t.dataset.id]||TREE.find(x=>x.id===t.dataset.id);st.node={id:t.dataset.id,f:n.f,t:n.t,p:n.p};if(n.f&&t.dataset.id.indexOf(':')<0)st.open.add(t.dataset.id);else st.open.add(n.f)}
  st.limit=40;cur=-1;run();window.scrollTo({top:0});
});
// ---- 符合處小地圖 ----
function minimap(li){
  li.querySelectorAll('.mm').forEach(x=>x.remove());
  if(!SET.minimap)return;
  const b=[...li.querySelectorAll('.body')].find(x=>!x.hidden);if(!b)return;
  const ms=[...b.querySelectorAll('mark:not(.hl-doc)')];if(!ms.length)return;
  const H=b.scrollHeight;if(H<420)return;
  const bt=b.getBoundingClientRect().top;
  const mm=document.createElement('div');mm.className='mm';mm.style.top=b.offsetTop+'px';mm.style.height=b.clientHeight+'px';
  const vis=b.clientHeight;
  ms.forEach((m,k)=>{const y=(m.getBoundingClientRect().top-bt)/H;const i=document.createElement('i');i.style.top=(y*100)+'%';i.title='跳到第 '+(k+1)+' 處';i.dataset.k=k;mm.appendChild(i)});
  mm.addEventListener('click',e=>{const i=e.target.closest('i');if(!i)return;e.stopPropagation();
    if(b.classList.contains('clamp')){b.classList.remove('clamp');const x=li.querySelector('.expand');if(x)x.textContent='收合';mm.style.height=b.clientHeight+'px'}
    ms[+i.dataset.k].scrollIntoView({block:'center'});ms[+i.dataset.k].classList.add('flash')});
  li.appendChild(mm);
}
// ---- 回到頂端 ----
window.addEventListener('scroll',()=>{$('totop').hidden=!SET.totop||window.scrollY<600},{passive:true});
$('totop').addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
// ---- 設定 ----
const SETK='hongda-settings';
const SDEF={mode:'light',density:'cozy',side:'show',redsum:false,slimhead:true,twocol:true,overview:true,minimap:true,totop:true,printlist:true,marquee:true};
let SET=Object.assign({},SDEF);
try{Object.assign(SET,JSON.parse(localStorage.getItem(SETK)||'{}'))}catch(e){}
if(!JSON.stringify(SET).includes('"mode"')||!SET.mode){try{SET.mode=localStorage.getItem('hongda-theme')==='dark'?'dark':'light'}catch(e){SET.mode='light'}}
function applySet(rerun){
  applyMode();
  const B=document.body.classList;
  B.toggle('s-compact',SET.density==='compact');B.toggle('s-sidehide',SET.side==='hide');
  ['redsum','slimhead','twocol','minimap','printlist'].forEach(k=>B.toggle('s-'+k,!!SET[k]));
  B.toggle('s-nomarquee',!SET.marquee);
  document.querySelectorAll('#setPanel input[data-key]').forEach(i=>i.checked=!!SET[i.dataset.key]);
  document.querySelectorAll('#setPanel .seg').forEach(g=>g.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',SET[g.dataset.key]===b.dataset.v)));
  $('totop').hidden=!SET.totop||window.scrollY<600;
  try{localStorage.setItem(SETK,JSON.stringify(SET))}catch(e){}
  if(rerun)run(true);
}
// 設定頁：同網頁內切換，返回時保留搜尋結果與捲動位置
let setY=0;
function openSettings(){
  if(!$('setPanel').hidden)return;
  setY=window.scrollY;previewFonts();
  $('setPanel').hidden=false;document.body.classList.add('setview');window.scrollTo({top:0});
  $('setClose').focus({preventScroll:true});
}
function closeSettings(restore=true){
  if($('setPanel').hidden)return;
  $('setPanel').hidden=true;document.body.classList.remove('setview');
  setHdr();
  if(restore)requestAnimationFrame(()=>window.scrollTo({top:setY}));
}
$('setBtn').addEventListener('click',()=>{isM()?setMTab('set'):openSettings()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('setPanel').hidden){e.preventDefault();isM()?setMTab(mPrev):closeSettings();$('setBtn').focus()}});
$('setPanel').addEventListener('change',e=>{const k=e.target.dataset.key;if(!k)return;SET[k]=e.target.checked;applySet(true)});
$('setPanel').addEventListener('click',e=>{const b=e.target.closest('.seg button');if(!b)return;SET[b.closest('.seg').dataset.key]=b.dataset.v;applySet(true)});
$('setReset').addEventListener('click',()=>{SET=Object.assign({},SDEF);applySet(true);setAccent('blue');setFont('kai');flashMsg('已還原預設設定')});
$('sideBtn').addEventListener('click',()=>{SET.side=SET.side==='hide'?'show':'hide';applySet(false)});
applySet(false);
// ---- 手機版 ----
const isM=()=>matchMedia('(max-width:900px)').matches;
function setCmpCol(f){
  st.cmpCol=f;
  document.querySelectorAll('#cmp [data-cc]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cc===f));
  document.querySelectorAll('#cmp .ccol').forEach(c=>c.classList.toggle('on',c.dataset.f===f));
  // 切換後重新計算被隱藏欄位的「符合處在下方」提示
  document.querySelectorAll(`#cmp .ccol[data-f="${f}"] .ccard`).forEach(el=>markHidden(el));
}
let mPrev='search';
function setMTab(m){
  document.querySelectorAll('#mtabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m));
  document.body.classList.toggle('m-nav',m==='nav');
  if(m==='set'){openSettings();return}
  closeSettings(false);
  if(m==='search'||m==='cmp'){mPrev=m;const v=m==='cmp'?'cmp':'list';if(st.view!==v){st.view=v;cur=-1;run()}window.scrollTo({top:0})}
  if(m==='nav')window.scrollTo({top:0});
}
document.querySelectorAll('#mtabs button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setMTab(b.dataset.m)}));
$('setClose').addEventListener('click',e=>{e.stopPropagation();if(isM()){setMTab(mPrev);requestAnimationFrame(()=>window.scrollTo({top:setY}))}else closeSettings()});
// 對照頁左右滑動切換第1～3次
let tx0=null,ty0=null;
$('cmp').addEventListener('touchstart',e=>{const t=e.touches[0];tx0=t.clientX;ty0=t.clientY},{passive:true});
$('cmp').addEventListener('touchend',e=>{if(tx0===null)return;const t=e.changedTouches[0];const dx=t.clientX-tx0,dy=t.clientY-ty0;tx0=null;
  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){const i=RV.indexOf(st.cmpCol||'r1');const j=Math.max(0,Math.min(2,i+(dx<0?1:-1)));if(j!==i){setCmpCol(RV[j]);window.scrollTo({top:0})}}},{passive:true});
// 電腦版切換檢視時，同步手機分頁狀態
document.querySelectorAll('.vtab').forEach(b=>b.addEventListener('click',()=>{mPrev=b.dataset.v==='cmp'?'cmp':'search';document.querySelectorAll('#mtabs button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.m===mPrev))}));
// ---- 資料管理：GitHub 上傳頁 ----
/* 預設網址寫在網站檔案中，上傳 GitHub 後任何裝置都有；在欄位修改後存於該瀏覽器 */
const GITHUB_UPLOAD_URL='https://github.com/albert-bot-ship/Industrial-Park/upload/main';   // ← 實際網址填在這裡，例如 'https://github.com/帳號/repo名稱/upload/main'
const GHK='hongda-github-url';
function ghGet(){try{return localStorage.getItem(GHK)||GITHUB_UPLOAD_URL}catch(e){return GITHUB_UPLOAD_URL}}
function ghMsg(t,err){const m=$('ghMsg');m.textContent=t;m.classList.toggle('err',!!err)}
function ghLoad(){$('ghUrl').value=ghGet();ghMsg('')}
$('ghUrl').addEventListener('blur',()=>{
  const v=$('ghUrl').value.trim();
  if(v===ghGet())return;
  if(v===''){try{localStorage.removeItem(GHK)}catch(e){}$('ghUrl').value=GITHUB_UPLOAD_URL;ghMsg(GITHUB_UPLOAD_URL?'已恢復為預設網址':'已清除');return}
  if(!/^https:\/\//i.test(v)){ghMsg('網址必須以 https:// 開頭，未儲存',true);return}
  try{localStorage.setItem(GHK,v)}catch(e){}
  ghMsg('已儲存');
});
$('ghGo').addEventListener('click',()=>{
  const v=ghGet();
  if(!v){alert('請先填寫 GitHub 上傳頁網址');$('ghUrl').scrollIntoView({block:'center'});$('ghUrl').focus();return}
  window.open(v,'_blank','noopener');
});
$('setBtn').addEventListener('click',ghLoad);
document.querySelector('#mtabs button[data-m="set"]').addEventListener('click',ghLoad);
ghLoad();
// ---- 啟動 ----
refreshCounts();
run();
