/* Matter Lab v0.1 — graph-based molecular structure checker.
   Scope: educational covalent structures, not reaction simulation or
   predictive computational chemistry. No dependencies. */
(function(root) {
  'use strict';
  const ELEMENTS = Object.freeze({
    H:  {name:'هيدروجين', number:1,  max:1, tone:'hydrogen',  mass:1.008},
    C:  {name:'كربون',    number:6,  max:4, tone:'carbon',    mass:12.011},
    N:  {name:'نيتروجين', number:7,  max:3, tone:'nitrogen',  mass:14.007},
    O:  {name:'أكسجين',   number:8,  max:2, tone:'oxygen',    mass:15.999},
    Cl: {name:'كلور',     number:17, max:1, tone:'chlorine',  mass:35.45}
  });

  // Atom order is independent from chemical formula order. Edges: [atom A, atom B, bond order].
  function compound(id, name, formula, nodes, edges, overview, extra, group, caution='') {
    return {id,name,formula,nodes,edges,overview,extra,group,caution};
  }
  const MOLECULES = [
    compound('h2','الهيدروجين الجزيئي','H₂',['H','H'],[[0,1,1]],
      'غاز يتكون جزيئه من ذرتين من الهيدروجين. وهو أخف الغازات المعروفة.',
      'الغاز قابل للاشتعال، ويوجد بكثرة في النجوم. لا تجرّب إشعاله في الواقع.','ثنائيات الذرة'),
    compound('o2','الأكسجين الجزيئي','O₂',['O','O'],[[0,1,2]],
      'هذا أحد أشكال الأكسجين في الهواء، ويساعد على التنفس وعلى الاحتراق.',
      'يشكل نحو 21% من حجم الهواء الجاف قرب سطح الأرض. في الرسم نمثل الرابطة برابطة مزدوجة مبسطة.','ثنائيات الذرة'),
    compound('n2','النيتروجين الجزيئي','N₂',['N','N'],[[0,1,3]],
      'يتكون من ذرتين من النيتروجين بينهما رابطة ثلاثية قوية.',
      'يشكل نحو 78% من حجم الهواء الجاف قرب سطح الأرض، وهو أقل تفاعلية من مواد كثيرة أخرى.','ثنائيات الذرة'),
    compound('cl2','الكلور الجزيئي','Cl₂',['Cl','Cl'],[[0,1,1]],
      'جزيء مكوّن من ذرتين من الكلور. غازه سام ولا يصلح للتجريب المنزلي.',
      'الكلور عنصر، لكن شكله الجزيئي الشائع هو Cl₂. هذا المختبر افتراضي فقط.','ثنائيات الذرة','مادة سامة في الواقع.'),
    compound('hcl','كلوريد الهيدروجين','HCl',['H','Cl'],[[0,1,1]],
      'جزيء يتكون من هيدروجين وكلور مرتبطين برابطة تساهمية.',
      'عند ذوبانه في الماء يعطي محلول حمض الهيدروكلوريك. الغاز مهيّج وخطر.','مركبات بسيطة','غاز مهيّج وخطر.'),
    compound('water','الماء','H₂O',['O','H','H'],[[0,1,1],[0,2,1]],
      'أحسنت! هذا هو الماء: جزيء مكوّن من ذرة أكسجين وذرتين من الهيدروجين.',
      'الجزيء منحني الشكل، والماء ضروري للكائنات الحية. خصائصه تختلف تمامًا عن خصائص غازي الهيدروجين والأكسجين.','مركبات بسيطة'),
    compound('ozone','الأوزون','O₃',['O','O','O'],[[0,1,1],[1,2,2]],
      'الأوزون صورة من صور الأكسجين يتكون جزيئها من ثلاث ذرات أكسجين.',
      'يساعد الأوزون المرتفع في طبقة الستراتوسفير على امتصاص الأشعة فوق البنفسجية. أما قرب سطح الأرض فهو ملوّث ضار بالتنفس.','مركبات بسيطة',
      'الرسم برابطة مفردة وأخرى مزدوجة هو إحدى صيغ الرنين المبسطة؛ رابطتا الأوزون الحقيقيتان متكافئتان تقريبًا. كما أن رسم O₃ لا يعني تكونه تلقائيًا.'),
    compound('co2','ثاني أكسيد الكربون','CO₂',['C','O','O'],[[0,1,2],[0,2,2]],
      'غاز يتكون من ذرة كربون وذرتين من الأكسجين؛ جزيئه خطي تقريبًا.',
      'ينتج من التنفس والاحتراق، وتستخدمه النباتات في البناء الضوئي. ارتفاع تركيزه يسهم في الاحترار العالمي.','مركبات بسيطة'),
    compound('methane','الميثان','CH₄',['C','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],
      'أبسط الهيدروكربونات: ذرة كربون مرتبطة بأربع ذرات هيدروجين.',
      'هو المكوّن الأساسي للغاز الطبيعي، وجزيئه رباعي السطوح في الواقع. وهو غاز قابل للاشتعال.','كيمياء الكربون'),
    compound('ammonia','الأمونيا','NH₃',['N','H','H','H'],[[0,1,1],[0,2,1],[0,3,1]],
      'جزيء يتكون من ذرة نيتروجين مرتبطة بثلاث ذرات هيدروجين.',
      'للأمونيا دور في صناعة الأسمدة. شكل جزيئها هرمي ثلاثي، ورائحتها نفاذة وهي مهيّجة.','مركبات بسيطة','مادة مهيّجة في الواقع.'),
    compound('peroxide','فوق أكسيد الهيدروجين','H₂O₂',['H','O','O','H'],[[0,1,1],[1,2,1],[2,3,1]],
      'يُعرف أيضًا ببيروكسيد الهيدروجين. يحتوي الجزيء على رابطة بين ذرتي أكسجين.',
      'يمكن أن يتحلل إلى ماء وأكسجين. بعض محاليله المركزة خطرة، فلا تُجرَّب التفاعلات خارج المختبر الافتراضي.','مركبات بسيطة','المحاليل المركزة مؤذية.'),
    compound('formaldehyde','الميثانال','CH₂O',['C','O','H','H'],[[0,1,2],[0,2,1],[0,3,1]],
      'يُسمّى أيضًا الفورمالدهيد. يحتوي على رابطة مزدوجة بين الكربون والأكسجين.',
      'يستخدم في صناعات محددة، لكنه مادة سامة ومهيّجة. هذا وصف علمي لا دعوة لصنعه.','كيمياء الكربون','مادة سامة ومهيّجة.'),
    compound('ethane','الإيثان','C₂H₆',['C','C','H','H','H','H','H','H'],
      [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]],
      'يتكون من ذرتي كربون بينهما رابطة مفردة، وست ذرات هيدروجين.',
      'الإيثان من الهيدروكربونات المشبعة، ويوجد ضمن مكونات الغاز الطبيعي.','كيمياء الكربون'),
    compound('ethene','الإيثين','C₂H₄',['C','C','H','H','H','H'],
      [[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],
      'يحتوي جزيء الإيثين على رابطة مزدوجة بين ذرتي الكربون.',
      'يسمى أيضًا الإيثيلين. تستعمله الصناعة لإنتاج مواد منها البولي إيثيلين، وله دور في نضج الثمار.','كيمياء الكربون'),
    compound('ethyne','الإيثاين','C₂H₂',['C','C','H','H'],[[0,1,3],[0,2,1],[1,3,1]],
      'بين ذرتي الكربون رابطة ثلاثية؛ ويسمى المركب أيضًا الأسيتيلين.',
      'غاز سريع الاشتعال يستعمل في بعض عمليات اللحام الصناعية.','كيمياء الكربون'),
    compound('methanol','الميثانول','CH₄O',['C','O','H','H','H','H'],
      [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1]],
      'هو كحول بسيط يتكون من كربون وأكسجين وهيدروجين.',
      'الميثانول سام؛ حتى الكميات الصغيرة قد تسبب أضرارًا خطيرة. يُستخدم صناعيًا، ولا يجوز شربه.','كيمياء الكربون','الميثانول مادة سامة.'),
    compound('ethanol','الإيثانول','C₂H₆O',['C','C','O','H','H','H','H','H','H'],
      [[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[1,6,1],[1,7,1],[2,8,1]],
      'كحول يحتوي على مجموعـة O–H متصلة بسلسلة من ذرتي كربون.',
      'للإيثانول استخدامات صناعية وطبية. تركيبه يختلف عن ثنائي ميثيل الإيثر، رغم اشتراكهما في الصيغة نفسها.','كيمياء الكربون'),
    compound('dme','ثنائي ميثيل الإيثر','C₂H₆O',['C','O','C','H','H','H','H','H','H'],
      [[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1],[2,6,1],[2,7,1],[2,8,1]],
      'جزيء صيغته C₂H₆O، لكنه يختلف في البنية عن الإيثانول.',
      'هذه ظاهرة تسمى التماكب البنيوي: الصيغة نفسها لا تعني دائمًا المادة نفسها.','كيمياء الكربون')
  ];

  const simplify = atom => atom && (atom.symbol || atom.element);
  function counts(nodes) {
    const out={};
    nodes.forEach(s=>out[s]=(out[s]||0)+1);
    return out;
  }
  function sameCounts(a,b) {
    return Object.keys(a).length===Object.keys(b).length && Object.keys(a).every(k=>a[k]===b[k]);
  }
  function degrees(nodes, edges) {
    const out=Array.from({length:nodes.length},()=>[]);
    for (const [a,b,o] of edges) {out[a].push(o);out[b].push(o);}
    return out.map(d=>d.sort((a,b)=>a-b).join(','));
  }
  // Exact labeled graph isomorphism (not just formula matching). Works well for our <=9-atom catalog.
  function structureMatches(inputNodes, inputEdges, reference) {
    const refNodes=reference.nodes, refEdges=reference.edges;
    if(inputNodes.length!==refNodes.length || inputEdges.length!==refEdges.length) return false;
    if(!sameCounts(counts(inputNodes),counts(refNodes))) return false;
    const inDeg=degrees(inputNodes,inputEdges), refDeg=degrees(refNodes,refEdges);
    const inMatrix=Array.from({length:inputNodes.length},()=>Array(inputNodes.length).fill(0));
    const refMatrix=Array.from({length:refNodes.length},()=>Array(refNodes.length).fill(0));
    for(const [a,b,o] of inputEdges) {inMatrix[a][b]=o;inMatrix[b][a]=o;}
    for(const [a,b,o] of refEdges) {refMatrix[a][b]=o;refMatrix[b][a]=o;}
    const candidates=refNodes.map((s,j)=>inputNodes.map((v,i)=>v===s&&inDeg[i]===refDeg[j]?i:-1).filter(i=>i>=0));
    if(candidates.some(c=>c.length===0)) return false;
    const order=refNodes.map((_,i)=>i).sort((a,b)=>candidates[a].length-candidates[b].length);
    const mapping=Array(refNodes.length).fill(-1), used=new Set();
    function visit(k) {
      if(k===order.length) return true;
      const r=order[k];
      for(const i of candidates[r]) {
        if(used.has(i)) continue;
        let good=true;
        for(let t=0;t<k;t++) { const prev=order[t];if(refMatrix[r][prev]!==inMatrix[i][mapping[prev]]) {good=false;break;} }
        if(!good) continue;
        mapping[r]=i;used.add(i);
        if(visit(k+1)) return true;
        used.delete(i);mapping[r]=-1;
      }
      return false;
    }
    return visit(0);
  }
  function describeAtom(atom) {return (ELEMENTS[atom.symbol]||{}).name||atom.symbol;}
  function analyze(atoms,bonds) {
    if(!atoms.length) return {kind:'empty', title:'مختبرك مستعد',message:'اختر ذرات من لوحة العناصر، ثم المس ذرتين لربطهما.'};
    const byId=new Map(atoms.map((a,i)=>[a.id,i]));
    if(atoms.some(a=>!ELEMENTS[a.symbol])) return {kind:'invalid',title:'عنصر غير مدعوم',message:'هناك ذرة غير معروفة في هذا الإصدار.'};
    const seen=new Set(), edges=[];
    for(const bond of bonds) {
      const a=byId.get(bond.a), b=byId.get(bond.b);
      if(a===undefined||b===undefined||a===b||!([1,2,3].includes(bond.order)))
        return {kind:'invalid',title:'خطأ في الربط',message:'تحقق من صحة الروابط.'};
      const key=Math.min(a,b)+'-'+Math.max(a,b);
      if(seen.has(key)) return {kind:'invalid',title:'رابطة مكررة',message:'لا يمكن تكرار الرابطة نفسها بين ذرتين.'};
      seen.add(key);edges.push([a,b,bond.order]);
    }
    if(atoms.length===1) return {kind:'building',title:'بداية تجربة',message:'أضف ذرة أخرى، ثم اختر الذرتين لتكوين رابطة.'};
    const adj=Array.from({length:atoms.length},()=>[]);
    for(const [a,b] of edges){adj[a].push(b);adj[b].push(a);}
    const reached=new Set([0]);const queue=[0];
    while(queue.length) for(const v of adj[queue.shift()]) if(!reached.has(v)){reached.add(v);queue.push(v);}
    if(reached.size!==atoms.length) return {kind:'disconnected',title:'ذرات لم ترتبط بعد',message:'لديك مجموعات منفصلة. اربط الذرات التي تريد إدخالها في جزيء واحد، أو احذف الزائد منها.'};
    const nodes=atoms.map(simplify);
    const known=MOLECULES.find(m=>structureMatches(nodes,edges,m));
    if(known) return {kind:'found',title:'اكتشاف علمي!',message:known.overview,molecule:known};
    const valences=Array(atoms.length).fill(0);
    for(const [a,b,o] of edges){valences[a]+=o;valences[b]+=o;}
    const excess=atoms.find((a,i)=>valences[i]>ELEMENTS[a.symbol].max);
    if(excess) return {kind:'overbonded',title:'الروابط تحتاج مراجعة',message:`في النموذج المبسط الحالي، لا تتوافق هذه الروابط مع التكافؤ المعتاد لعنصر ${describeAtom(excess)}. جرّب تقليل رتبة رابطة أو تغيير التركيب. بعض الجزيئات الحقيقية تتطلب قواعد أكثر تقدمًا.`};
    const pending=atoms.filter((a,i)=>valences[i]<ELEMENTS[a.symbol].max);
    if(pending.length) return {kind:'building',title:'قد يكون الجزيء غير مكتمل',message:'جرّب إضافة ذرات أو تعديل الروابط. هذه إشارة وفق قاعدة التكافؤ المبسطة، وليست حكمًا نهائيًا على إمكان وجود المادة.'};
    return {kind:'unknown',title:'تركيب يستحق البحث',message:'لا يوجد هذا التركيب في موسوعة هذا الإصدار. هذا لا يعني أنه مستحيل؛ قواعد التكافؤ وحدها لا تكفي لإثبات استقرار الجزيئات.'};
  }

  // Report on what was *drawn*. It does not establish quantum stability, charge, or synthetic feasibility.
  function inspectStructure(atoms,bonds) {
    const result=analyze(atoms,bonds);
    const c={}; for(const a of atoms)c[a.symbol]=(c[a.symbol]||0)+1;
    const order=['C','H',...Object.keys(c).filter(x=>!['C','H'].includes(x)).sort()];
    const displayDigit=n=>String(n).replace(/[0-9]/g,d=>'₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
    const formula=order.filter(s=>c[s]).map(s=>s+(c[s]>1?displayDigit(c[s]):'')).join('');
    const byId=new Map(atoms.map(a=>[a.id,a]));
    const atomDetails=atoms.map((a,i)=>{
      const links=bonds.filter(b=>b.a===a.id||b.b===a.id);
      const used=links.reduce((sum,b)=>sum+b.order,0);
      const limit=ELEMENTS[a.symbol]?.max??null;
      // For curated molecules, some resonance contributors include unusual bond-order counts.
      const typical=limit===null?'غير مدعوم':result.kind==='found'?'بنية موثقة':used>limit?'يتجاوز التكافؤ المبسط':used<limit?'أقل من التكافؤ المبسط':'متوافق مع النمط المبسط';
      return {number:i+1,symbol:a.symbol,name:ELEMENTS[a.symbol]?.name||a.symbol,links:links.length,used,limit,typical};
    });
    const edgeCounts={single:0,double:0,triple:0};
    for(const b of bonds){if(b.order===1)edgeCounts.single++;else if(b.order===2)edgeCounts.double++;else if(b.order===3)edgeCounts.triple++;}
    const totalMass=atoms.reduce((v,a)=>v+(ELEMENTS[a.symbol]?.mass||0),0);
    const valenceElectrons={H:1,C:4,N:5,O:6,Cl:7};
    const totalValenceElectrons=atoms.reduce((v,a)=>v+(valenceElectrons[a.symbol]||0),0);
    return {result,formula,atomDetails,edgeCounts,totalMass,totalValenceElectrons,c,atomCount:atoms.length,bondCount:bonds.length,
      allAtomsKnown:atoms.every(a=>ELEMENTS[a.symbol]), allBondEndsKnown:bonds.every(b=>byId.has(b.a)&&byId.has(b.b))};
  }
  const api={ELEMENTS,MOLECULES,analyze,structureMatches,inspectStructure};
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.MatterLabEngine=api;
})(typeof window!=='undefined'?window:globalThis);
