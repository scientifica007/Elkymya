(function(){
'use strict';
const {ELEMENTS,MOLECULES,CATALOG,analyze,inspectStructure}=window.MatterLabEngine;
const STORAGE_KEY='matter-lab-discoveries-v1';
const $=selector=>document.querySelector(selector);
const el=(tag, className, text)=>{const n=document.createElement(tag); if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let atoms=[],bonds=[],selected=null,order=1,nextId=1,history=[],lastFoundId=null;
let discovered=loadDiscoveries(),toastTimer;
const MAX_ATOMS=16;

const ELEMENT_FACTS={
 H:{group:'المجموعة 1 · الدورة 1',configuration:'1s¹',character:'أخف العناصر الكيميائية، ويوجد عادةً في صورة غاز H₂.',usual:'رابطة تساهمية مفردة واحدة في أغلب الجزيئات المحايدة البسيطة.',patterns:['H—H في الهيدروجين الجزيئي','H—O في الماء','H—C في الميثان'],note:'للهيدروجين حالات أيونية وروابط خاصة لا يمثلها هذا النموذج البسيط.'},
 C:{group:'المجموعة 14 · الدورة 2',configuration:'1s² 2s² 2p²',character:'عنصر أساسي في الكيمياء العضوية، ويستطيع تكوين سلاسل وحلقات وتراكيب كثيرة.',usual:'أربع وحدات من رتبة الرابطة في أمثلة شائعة: أربع مفردة، أو اثنتان مزدوجتان، أو رابطة ثلاثية مع مفردة.',patterns:['أربع روابط مفردة في CH₄','رابطتان مزدوجتان في CO₂','ثلاثية مع مفردة في C₂H₂'],note:'لا تكفي قاعدة الأربع روابط لإثبات استقرار أي تركيب كربوني؛ توجد أيونات وجذور حرة.'},
 N:{group:'المجموعة 15 · الدورة 2',configuration:'1s² 2s² 2p³',character:'عنصر موجود بكثرة في الهواء داخل جزيئات N₂، ويدخل في البروتينات والأحماض النووية.',usual:'ثلاث روابط تساهمية في أمثلة محايدة شائعة، وقد يظهر بأربع روابط مع شحنة موجبة كما في NH₄⁺.',patterns:['ثلاث روابط مفردة في NH₃','رابطة ثلاثية في N₂','روابط مزدوجة في مركبات أخرى'],note:'نوع الرابطة وحالة الشحنة يعتمدان على الجزيء كله، وليس على اسم العنصر وحده.'},
 O:{group:'المجموعة 16 · الدورة 2',configuration:'1s² 2s² 2p⁴',character:'عنصر مهم للتنفس والاحتراق، ويوجد في الهواء غالبًا على هيئة O₂.',usual:'رابطتان مفردتان أو رابطة مزدوجة واحدة في أمثلة محايدة شائعة.',patterns:['رابطتان مفردتان في H₂O','رابطة مزدوجة في O₂ أو CO₂','في O₃ توجد بنية رنين وشحنات شكلية'],note:'الأوزون لا تفسره قاعدة رابطتين لكل أكسجين وحدها؛ توجد روابط متكافئة تقريبًا وتوزّع إلكتروني غير ممثل بالكامل هنا.'},
 Cl:{group:'المجموعة 17 · الدورة 3',configuration:'[Ne] 3s² 3p⁵',character:'عنصر من الهالوجينات. غازه Cl₂ سام، ويدخل الكلور في مواد عديدة.',usual:'رابطة تساهمية مفردة واحدة غالبًا في الجزيئات البسيطة مثل HCl وCl₂.',patterns:['Cl—H في HCl','Cl—Cl في Cl₂','يظهر في أيون الكلوريد Cl⁻ دون رابطة تساهمية'],note:'قد تظهر للكلور حالات أكسدة وروابط مختلفة في مركبات أكثر تعقيدًا. لا تخلط عدد الأكسدة بعدد الروابط.'}
};
// Nature and industrial preparation are independent properties, never exclusive categories.
// Curated educational notes only; missing statements are not evidence of non-existence.
/* Evidence-curated subset: missing metadata is unknown, not proof of absence. */
const EVIDENCE={
 water:{natural:{note:'يوجد الماء في البحار والأنهار والأمطار والكائنات الحية.',url:'https://pubchem.ncbi.nlm.nih.gov/compound/Water',source:'PubChem — Water (CID 962)'}},
 ozone:{natural:{note:'يوجد الأوزون طبيعيًا في الغلاف الجوي، بما في ذلك الستراتوسفير.',url:'https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics',source:'US EPA — Ozone Basics'},
 industrial:{note:'يمكن تحضير الأوزون صناعيًا واستخدامه في معالجة المياه.',url:'https://pubchem.ncbi.nlm.nih.gov/compound/Ozone',source:'PubChem — Ozone (CID 24823)'}}
};
let promptedFor=new Set(),promptSymbol=null;
function infoPrompt(symbol){
 if(promptedFor.has(symbol))return;
 promptedFor.add(symbol);promptSymbol=symbol;
 $('#prompt-title').textContent='أضفت '+ELEMENTS[symbol].name+' إلى المختبر.';
 $('#atom-info-prompt').hidden=false;
}
function showElementFacts(symbol){
 const info=ELEMENTS[symbol],fact=ELEMENT_FACTS[symbol];if(!info||!fact)return;
 $('#atom-info-prompt').hidden=true;
 $('#element-details-title').textContent=info.name+' — '+symbol;
 $('#element-details-content').innerHTML=`<div class="info-hero"><span class="big-symbol" dir="ltr">${symbol}</span><div><strong>${htmlEscape(info.name)}</strong><p>العدد الذري: ${info.number} · الكتلة الذرية التقريبية: ${info.mass} u · ${htmlEscape(fact.group)}</p></div></div>
 <div class="analysis-grid"><div class="analysis-tile"><strong>التوزيع الإلكتروني</strong><span dir="ltr">${htmlEscape(fact.configuration)}</span></div><div class="analysis-tile"><strong>ماذا نعرف عنه؟</strong>${htmlEscape(fact.character)}</div></div>
 <h3 class="analysis-section-title">كيف يرتبط عادةً؟</h3><p class="analysis-small">${htmlEscape(fact.usual)}</p>
 <div>${fact.patterns.map(x=>`<span class="analysis-inline-tag">${htmlEscape(x)}</span>`).join('')}</div>
 <div class="analysis-note">${htmlEscape(fact.note)}</div><p class="analysis-small">هذه أمثلة تعليمية للروابط التساهمية. القاعدة المبسطة ليست حدًا مطلقًا، ولا تثبت وحدها وجود مادة أو استقرارها.</p>`;
 showModal('element-details');
}
function showElectronEditor(){
 const a=atoms.find(x=>x.id===selected);if(!a)return;
 $('#electron-target').textContent='ذرة '+ELEMENTS[a.symbol].name+' — '+a.symbol;
 $('#electron-charge').value=Number.isInteger(a.formalCharge)?String(a.formalCharge):'';
 $('#electron-radicals').value=Number.isInteger(a.unpairedElectrons)?String(a.unpairedElectrons):'';
 $('#electron-feedback').textContent='اترك القيم فارغة إذا لم ترغب بتوصيف إلكتروني.';
 showModal('electrons-editor');
}
function saveElectronEditor(){
 const a=atoms.find(x=>x.id===selected);if(!a)return;
 const ch=$('#electron-charge').value,ra=$('#electron-radicals').value;
 if((ch==='')!==(ra==='')){$('#electron-feedback').textContent='حدد كلا الحقلين أو اتركهما فارغين.';return;}
 pushUndo();
 if(ch===''){delete a.formalCharge;delete a.unpairedElectrons;}
 else{a.formalCharge=Number(ch);a.unpairedElectrons=Number(ra);}
 closeModal('electrons-editor');render();
}
function showStructureReport(){
 const info=inspectStructure(atoms,bonds),out=$('#structure-report-content'),res=info.result;
 if(!atoms.length){out.innerHTML='<div class="analysis-note">لم تضف أي ذرات بعد. أضف ذرتين على الأقل وجرّب ربطهما.</div>';showModal('structure-report');return;}
 const known=res.kind==='found';
 const species=known&&res.molecule.group==='أيونات وجذور';
 let verdict='',type='',occ='';
 if(known){
  verdict=`<div class="analysis-note analysis-ok"><strong>بنية موثقة: ${htmlEscape(res.molecule.name)}</strong><div>${htmlEscape(res.molecule.overview)}</div><div>${htmlEscape(res.molecule.extra)}</div></div>`;
  if(species){
   occ=`<div class="analysis-note analysis-ok"><strong>مصدر علمي موثق</strong><p><a class="analysis-link" href="${htmlEscape(res.molecule.source.url)}" target="_blank" rel="noopener noreferrer">${htmlEscape(res.molecule.source.label)}</a></p>توثيق الهوية الكيميائية لا يعني ثبات النوع في جميع الظروف.</div>`;
  } else {
   const source=EVIDENCE[res.molecule.id]||{};
   const cell=item=>item?htmlEscape(item.note)+'<p class="analysis-small"><a class="analysis-link" href="'+htmlEscape(item.url)+'" target="_blank" rel="noopener noreferrer">المصدر: '+htmlEscape(item.source)+'</a></p>':'لم تُراجع هذه المعلومة بعد؛ غياب التوثيق هنا ليس دليلًا على عدم الوجود.';
   occ=`<h3 class="analysis-section-title">الوجود الطبيعي والتحضير الصناعي (بحسب السجلات الموثقة)</h3><div class="analysis-grid"><div class="analysis-tile"><strong>في الطبيعة</strong>${cell(source.natural)}</div><div class="analysis-tile"><strong>صناعيًا</strong>${cell(source.industrial)}</div></div>`;
  }
 }else if(res.kind==='electronic-variant'){
  verdict=`<div class="analysis-note"><strong>البنية تشبه ${htmlEscape(res.molecule.name)} لكنها إلكترونيًا ليست مؤكدة النوع نفسه.</strong><div>${htmlEscape(res.message)}</div></div>`;

 }else if(res.kind==='overbonded'){
  verdict=`<div class="analysis-note"><strong>تعارض مع قاعدة التكافؤ التعليمية</strong><div>${htmlEscape(res.message)}</div>هذا لا يثبت الاستحالة النظرية؛ فالشحنات والحالات الإلكترونية والجذور غير ممثلة هنا.</div>`;
 }else if(res.kind==='building'||res.kind==='disconnected'){
  verdict=`<div class="analysis-note"><strong>تركيب يحتاج إلى استكمال أو تفسير</strong><div>${htmlEscape(res.message)}</div>قد يلزم إضافة ذرات أو تغيير الروابط، أو توضيح الشحنة والإلكترونات غير المزدوجة.</div>`;
 }else{
  verdict=`<div class="analysis-note"><strong>الحالة العلمية غير محسومة بهذا المحرك</strong><div>${htmlEscape(res.message)}</div>عدم وجود تركيب في موسوعتنا لا يسمح بالحكم بأنه ممكن نظريًا، أو مستحيل نظريًا، أو موجود طبيعيًا أو صناعيًا.</div>`;
 }
 type=known?'<strong>'+(species?'نوع كيميائي موثق مع تحديد الشحنة والإلكترونات':'مطابقة بنيوية لبنية موثقة في الموسوعة')+'</strong>':'<strong>الصيغة لا تثبت وجود نوع كيميائي مستقر</strong>';
 const atomRows=info.atomDetails.map(a=>`<tr><td>${a.number}</td><td dir="ltr">${htmlEscape(a.symbol)}</td><td>${a.links}</td><td>${a.used}</td><td>${a.limit===null?'—':a.limit}</td><td>${htmlEscape(a.typical)}</td></tr>`).join('');
 const c={};for(const a of atoms)c[a.symbol]=(c[a.symbol]||0)+1;
 const matches=MOLECULES.filter(m=>{const t={};m.nodes.forEach(s=>t[s]=(t[s]||0)+1);return Object.keys(t).length===Object.keys(c).length && Object.entries(c).every(([k,v])=>t[k]===v)});
 const same=(!known&&matches.length)?`<div class="analysis-note">وجدنا جزيئات معروفة لها <strong>عدد الذرات نفسه</strong> في موسوعتنا، لكن ذلك لا يعني تطابق بنيتها مع رسمك: ${matches.map(m=>htmlEscape(m.name)).join('، ')}.</div>`:'';
 const electronNote=info.electronic.complete
 ?`<div class="analysis-note"><strong>حساب إلكترونات التكافؤ:</strong> مجموع إلكترونات ذراتك قبل تعديل الشحنة = ${info.totalValenceElectrons}. مجموع الشحنات = ${info.electronic.netCharge}. إذن المجموع الفعلي = <strong>${info.effectiveValenceElectrons} إلكترونًا</strong>. ${info.effectiveValenceElectrons%2?'هذا العدد فردي؛ لا يمكن أن تكون الإلكترونات جميعها مزدوجة.':'العدد زوجي؛ لا يكفي وحده لإثبات الاستقرار أو تحديد الحالة المغناطيسية.'}</div>`
 :`<div class="analysis-note"><strong>إلكترونات التكافؤ الأساسية:</strong> ${info.totalValenceElectrons}. الشحنات غير مكتملة أو لم تُدخل؛ لذلك لا نعرف العدد الفعلي لإلكترونات هذا النوع، ولا نجزم بزوجيته.</div>`;
 const e=info.electronic;
 const eMessage=e.complete?'إدخالاتك متسقة حسابيًا؛ مجموع الشحنات الشكلية: '+e.netCharge+'، وإلكترونات التكافؤ الفعلية: '+e.totalElectrons+'، والإلكترونات غير المزدوجة المسجلة: '+e.totalRadicals+'.':e.invalid?'بعض الإدخالات لا تسمح بتوزيع إلكترونات متسق في هذا النموذج؛ راجع الذرات المحددة.':e.assigned?'لم تصف جميع الذرات إلكترونيًا؛ لا يمكن حساب الشحنة الإجمالية بعد.':'لم تحدد أي شحنات شكلية أو إلكترونات منفردة؛ التحليل بنيوي فقط.';
 const electronicRows=e.entries.map((a,i)=>`<tr><td>${i+1}</td><td dir="ltr">${htmlEscape(a.symbol)}</td><td>${a.charge===null?'—':a.charge}</td><td>${a.radicals===null?'—':a.radicals}</td><td>${a.lonePairs===null?'—':a.lonePairs}</td><td>${htmlEscape(a.reason||'غير محدد')}</td></tr>`).join('');
 const electronicPanel=`<h3 class="analysis-section-title">الشحنات والإلكترونات (نموذج لويس)</h3><div class="analysis-note">${htmlEscape(eMessage)} هذا فحص حسابي وليس دليلًا على استقرار المادة.</div><div style="overflow-x:auto"><table class="analysis-table"><thead><tr><th>ذرة</th><th>رمز</th><th>الشحنة الشكلية</th><th>منفردة</th><th>أزواج حرة</th><th>التفسير</th></tr></thead><tbody>${electronicRows}</tbody></table></div>`;
 const caution=known&&res.molecule.caution?`<div class="analysis-note">${htmlEscape(res.molecule.caution)}</div>`:'';
 out.innerHTML=`<div class="analysis-summary"><span class="analysis-small">الصيغة المحسوبة بعدّ الذرات</span><span class="formula">${htmlEscape(info.formula)}</span><div class="analysis-small">${type}</div></div>
 <div class="analysis-grid"><div class="analysis-tile"><strong>عدد الذرات</strong>${info.atomCount} ذرة · مجموع الكتل الذرية ${info.totalMass.toFixed(3)} u تقريبًا</div><div class="analysis-tile"><strong>عدد الروابط المرسومة</strong>${info.bondCount} رابطة (مفردة: ${info.edgeCounts.single}، مزدوجة: ${info.edgeCounts.double}، ثلاثية: ${info.edgeCounts.triple})</div></div>
 ${verdict}${electronNote}${same}${occ}${electronicPanel}<h3 class="analysis-section-title">فحص كل ذرة</h3>
 <div style="overflow-x:auto"><table class="analysis-table"><thead><tr><th>رقم</th><th>عنصر</th><th>وصلات</th><th>مجموع رتبها</th><th>المعتاد</th><th>الملاحظة</th></tr></thead><tbody>${atomRows}</tbody></table></div>
 ${caution}<div class="analysis-note">حدود التحليل: يمثل الشحنات الشكلية والجذور بطريقة مبسطة، لكنه لا يحسب الرنين الكامل، ولا يقدّر الاستقرار بالطاقة الكمّية أو إمكانية التصنيع. إن وصف «غير موجود في الفهرس» ليس حكمًا باستحالة وجوده.</div>
 <p class="analysis-small">للتوسع: <a class="analysis-link" href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">PubChem</a> وقاموس <a class="analysis-link" href="https://goldbook.iupac.org/" target="_blank" rel="noopener noreferrer">IUPAC</a> (تحتاج المواقع الخارجية إلى اتصال بالإنترنت).</p>`;
 showModal('structure-report');
}

function loadDiscoveries(){try{const arr=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');return new Set(Array.isArray(arr)?arr.filter(id=>CATALOG.some(m=>m.id===id)):[]);}catch{return new Set();}}
function saveDiscoveries(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify([...discovered]));}catch{/* private mode */}}
function pushUndo(){history.push(JSON.stringify({atoms,bonds})); if(history.length>60)history.shift();}
function undo(){if(!history.length)return;const state=JSON.parse(history.pop());atoms=state.atoms;bonds=state.bonds;selected=null;render();}
function clearWorkspace(){if(!atoms.length)return;pushUndo();atoms=[];bonds=[];selected=null;render();}
function addAtom(symbol){if(atoms.length>=MAX_ATOMS){showToast('بلغت حد المساحة','يمكنك وضع 16 ذرة في التجربة الواحدة.');return;}
 pushUndo();const k=atoms.length,theta=k*2.399963229728653,ring=.08+Math.sqrt(k)*.065;
 const x=Math.max(.12,Math.min(.88,.5+Math.cos(theta)*ring));const y=Math.max(.16,Math.min(.82,.47+Math.sin(theta)*ring));
 atoms.push({id:'atom-'+nextId++,symbol,x,y});selected=null;render();infoPrompt(symbol);}
function deleteSelected(){if(!selected)return;pushUndo();bonds=bonds.filter(b=>b.a!==selected&&b.b!==selected);atoms=atoms.filter(a=>a.id!==selected);selected=null;render();}
function setBondOrder(newOrder){order=newOrder;document.querySelectorAll('.bond-tool').forEach(b=>{const current=b.dataset.order===String(order);b.classList.toggle('current',current);b.setAttribute('aria-pressed',String(current));}); updateHint();}
function tapAtom(id){if(selected===null){selected=id;renderStage();updateHint();return;}
 if(selected===id){selected=null;renderStage();updateHint();return;}
 const pair=[selected,id],existing=bonds.find(b=>(b.a===pair[0]&&b.b===pair[1])||(b.a===pair[1]&&b.b===pair[0]));
 pushUndo();
 if(order===0){if(existing)bonds=bonds.filter(b=>b!==existing);else {history.pop();showToast('لا توجد رابطة','اختر ذرتين بينهما رابطة لحذفها.');}}
 else if(existing)existing.order=order;
 else bonds.push({a:pair[0],b:pair[1],order});
 selected=null;render();}
function iconSvg(kind){if(kind==='book')return '<svg class="svgicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5h-3a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h3z"/></svg>';return '';}
function createPalette(){const palette=$('#palette');for(const [symbol,info] of Object.entries(ELEMENTS)){
 const wrap=el('div','element-card');
 const tile=el('button','element-tile '+info.tone);tile.type='button';tile.title='إضافة '+info.name;tile.setAttribute('aria-label','إضافة ذرة '+info.name);
 tile.innerHTML=`<span class="atomic-number">${info.number}</span><span class="symbol" dir="ltr">${symbol}</span><span class="name">${info.name}</span>`;
 tile.addEventListener('click',()=>addAtom(symbol));
 const detail=el('button','element-info-trigger','ⓘ معلومات');detail.type='button';detail.setAttribute('aria-label','معرفة خصائص عنصر '+info.name);detail.addEventListener('click',()=>showElementFacts(symbol));
 wrap.append(tile,detail);palette.append(wrap);
 }}
function renderStage(){const field=$('#stage'),layer=$('#atoms-layer');layer.innerHTML='';
 $('#empty-state').hidden=atoms.length>0;
 for(const atom of atoms){const btn=el('button','stage-atom '+ELEMENTS[atom.symbol].tone+(selected===atom.id?' selected':''),atom.symbol);btn.type='button';btn.dataset.atomId=atom.id;btn.title=ELEMENTS[atom.symbol].name+' — اسحب لتحريكه، أو المس لربطه';btn.setAttribute('aria-label','ذرة '+ELEMENTS[atom.symbol].name);btn.style.left=(atom.x*100)+'%';btn.style.top=(atom.y*100)+'%';
 if(Number.isInteger(atom.formalCharge)&&Number.isInteger(atom.unpairedElectrons)){const mark=el('span','atom-state-mark',(atom.formalCharge>0?'+'+atom.formalCharge:atom.formalCharge)+ (atom.unpairedElectrons?' •'+atom.unpairedElectrons:''));btn.append(mark);}
 btn.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();let dragging=false;const sx=e.clientX,sy=e.clientY,originX=atom.x,originY=atom.y;let snapshotTaken=false;
 btn.setPointerCapture(e.pointerId);
 const move=evt=>{if(!dragging&&Math.hypot(evt.clientX-sx,evt.clientY-sy)>7)dragging=true;if(!dragging)return;
 if(!snapshotTaken){pushUndo();snapshotTaken=true;}
 const r=field.getBoundingClientRect();atom.x=Math.max(.09,Math.min(.91,originX+(evt.clientX-sx)/r.width));atom.y=Math.max(.12,Math.min(.88,originY+(evt.clientY-sy)/r.height));
 btn.style.left=(atom.x*100)+'%';btn.style.top=(atom.y*100)+'%';drawBonds();};
 const end=evt=>{btn.removeEventListener('pointermove',move);btn.removeEventListener('pointerup',end);btn.removeEventListener('pointercancel',cancel);if(!dragging)tapAtom(atom.id);else render();};
 const cancel=()=>{btn.removeEventListener('pointermove',move);btn.removeEventListener('pointerup',end);btn.removeEventListener('pointercancel',cancel);if(dragging)render();};
 btn.addEventListener('pointermove',move);btn.addEventListener('pointerup',end);btn.addEventListener('pointercancel',cancel);
 });
 // Keyboard-only users can select atoms without pointer interactions.
 btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapAtom(atom.id);}});
 layer.append(btn);
 }
 drawBonds();}
function drawBonds(){const svg=$('#bonds-svg'),area=$('#stage'),r=area.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.textContent='';
 const ns='http://www.w3.org/2000/svg';for(const bond of bonds){const a=atoms.find(x=>x.id===bond.a),b=atoms.find(x=>x.id===bond.b);if(!a||!b)continue;
 const x1=a.x*r.width,y1=a.y*r.height,x2=b.x*r.width,y2=b.y*r.height,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,ox=-dy/len*5.2,oy=dx/len*5.2;
 const offsets=bond.order===1?[0]:bond.order===2?[-1,1]:[-1,0,1];
 for(const off of offsets){const line=document.createElementNS(ns,'line');line.setAttribute('x1',x1+ox*off);line.setAttribute('y1',y1+oy*off);line.setAttribute('x2',x2+ox*off);line.setAttribute('y2',y2+oy*off);line.setAttribute('stroke','#6b8595');line.setAttribute('stroke-linecap','round');line.setAttribute('stroke-width','5.5');svg.append(line);}
 }}
function updateHint(){let str='أضف ذرات من لوحة العناصر لبدء الاكتشاف.';
 if(atoms.length){if(selected){const atom=atoms.find(a=>a.id===selected);str=`اختر ذرة ثانية ${order===0?'لحذف الرابطة':'لرسم رابطة '+['','مفردة','مزدوجة','ثلاثية'][order]} مع ${ELEMENTS[atom.symbol].name}.`;}else str='المس ذرتين لربطهما، أو اسحب ذرة لتحريكها.';}
 $('#stage-hint').textContent=str;$('#atom-count').textContent=atoms.length;$('#bond-count').textContent=bonds.length;$('#delete-atom').disabled=!selected;$('#selected-info').disabled=!selected;$('#edit-electrons').disabled=!selected;$('#analyze-now').disabled=!atoms.length;$('#undo').disabled=!history.length;}
function renderResult(){const result=analyze(atoms,bonds);const found=result.kind==='found';const panel=$('#result-display');panel.className='result-display'+(found?' found':result.kind==='overbonded'||result.kind==='invalid'?' problem':result.kind==='unknown'?' unknown':'');
 const visual=$('#result-visual');visual.className='result-visual'+(found?'':' placeholder');visual.textContent=found?result.molecule.formula:(result.kind==='overbonded'?'!':result.kind==='unknown'?'?':result.kind==='empty'?'+':'···');
 $('#result-title').textContent=found?result.molecule.name:result.title;
 $('#result-message').textContent=result.message;
 $('#status-label').textContent=found?'اكتشاف صحيح':result.kind==='empty'?'في انتظار التجربة':result.kind==='unknown'?'يحتاج تحققًا':result.kind==='overbonded'?'راجع الروابط':'قيد التركيب';
 const extra=$('#extra-knowledge'),toggle=$('#toggle-extra'),warning=$('#warning');extra.hidden=true;toggle.hidden=!found;toggle.textContent='اقرأ المزيد عن هذا الجزيء ▾';warning.hidden=!found||!result.molecule.caution;
 if(found){extra.textContent=result.molecule.extra;warning.textContent=result.molecule.caution;}
 if(found&&result.molecule.id!==lastFoundId){const m=result.molecule;const isNew=!discovered.has(m.id);if(isNew){discovered.add(m.id);saveDiscoveries();showToast('اكتشاف جديد: '+m.name,'أحسنت! أُضيف إلى موسوعة اكتشافاتك.');}
 lastFoundId=m.id;
 }else if(!found){lastFoundId=null;}
 $('#result-below').textContent=found?'اكتشفت نوعًا كيميائيًا موثقًا. نجاح الرسم لا يعني حدوث تفاعل كيميائي تلقائيًا.':'هذا النموذج يفحص بنى جزيئية محددة؛ لا يحاكي التفاعلات أو شروط تكوين المواد بعد.';
 updateProgress();}
function render(){renderStage();updateHint();renderResult();}
function updateProgress(){const count=discovered.size;$('#discoveries-count').textContent=count;$('#total-count').textContent=CATALOG.length;$('#progress-count').textContent=count+' / '+CATALOG.length;$('#progress-bar').style.width=(100*count/CATALOG.length)+'%';}
function showToast(title,desc){const toast=$('#toast');$('#toast-title').textContent=title;$('#toast-desc').textContent=desc;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),3300);}
function showModal(which){const modal=$('#'+which);modal.classList.add('open');modal.setAttribute('aria-hidden','false');if(which==='encyclopedia')renderEncyclopedia();modal.querySelector('.close').focus();}
function closeModal(which){const modal=$('#'+which);modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}
function renderEncyclopedia(){const container=$('#discovery-list');container.textContent='';for(const m of CATALOG){const known=discovered.has(m.id);const b=el('button','discovery-tile'+(known?'':' locked'));b.type='button';b.innerHTML=known?`<strong>${htmlEscape(m.formula)}</strong><span>${htmlEscape(m.name)}</span>`:'<strong>؟</strong><span>لم يُكتشف بعد</span>';
 b.disabled=!known;if(known)b.addEventListener('click',()=>{$('#discovery-info').hidden=false;$('#discovery-info').innerHTML=`<strong>${htmlEscape(m.name)} — ${htmlEscape(m.formula)}</strong><span>${htmlEscape(m.overview)} ${htmlEscape(m.extra)}</span>${m.caution?`<div class="caution">${htmlEscape(m.caution)}</div>`:''}`;});container.append(b);}
 $('#discovery-info').hidden=true;}
function bindEvents(){for(const t of document.querySelectorAll('.bond-tool'))t.addEventListener('click',()=>setBondOrder(Number(t.dataset.order)));
 $('#prompt-show').addEventListener('click',()=>{if(promptSymbol)showElementFacts(promptSymbol);});
 $('#prompt-dismiss').addEventListener('click',()=>{$('#atom-info-prompt').hidden=true;});
 $('#selected-info').addEventListener('click',()=>{const a=atoms.find(x=>x.id===selected);if(a)showElementFacts(a.symbol);});
 $('#edit-electrons').addEventListener('click',showElectronEditor);
 $('#electron-save').addEventListener('click',saveElectronEditor);
 $('#electron-clear').addEventListener('click',()=>{$('#electron-charge').value='';$('#electron-radicals').value='';saveElectronEditor();});
 $('#analyze-now').addEventListener('click',showStructureReport);
 $('#undo').addEventListener('click',undo);$('#reset-stage').addEventListener('click',clearWorkspace);$('#delete-atom').addEventListener('click',deleteSelected);
 $('#toggle-extra').addEventListener('click',()=>{const n=$('#extra-knowledge');n.hidden=!n.hidden;$('#toggle-extra').textContent=n.hidden?'اقرأ المزيد عن هذا الجزيء ▾':'إخفاء التفاصيل ▴';});
 $('#open-book').addEventListener('click',()=>showModal('encyclopedia'));$('#open-help').addEventListener('click',()=>showModal('help'));
 document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',()=>closeModal(b.closest('.overlay').id)));
 document.querySelectorAll('.overlay').forEach(d=>d.addEventListener('mousedown',e=>{if(e.target===d)closeModal(d.id);}));
 $('#reset-discoveries').addEventListener('click',()=>{if(!window.confirm('هل تريد مسح دفتر اكتشافاتك بالكامل وإفراغ مساحة التركيب؟ لا يمكن التراجع عن مسح الاكتشافات.'))return;discovered.clear();saveDiscoveries();atoms=[];bonds=[];selected=null;history=[];lastFoundId=null;renderEncyclopedia();render();});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.overlay.open').forEach(d=>closeModal(d.id));if(selected){selected=null;renderStage();updateHint();}};
 if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();} else if((e.key==='Delete'||e.key==='Backspace')&&selected){e.preventDefault();deleteSelected();}
 else if(['1','2','3'].includes(e.key))setBondOrder(Number(e.key));});
 window.addEventListener('resize',drawBonds);
}
createPalette();bindEvents();setBondOrder(1);render();
})();
