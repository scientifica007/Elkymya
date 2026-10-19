/* Electron bookkeeping in simple Lewis drawings; not quantum chemistry. */
(function(root){
'use strict';
const VE=Object.freeze({H:1,C:4,N:5,O:6,Cl:7});
function inspectElectrons(atoms,bonds){
 const byId=new Map(atoms.map((a,i)=>[a.id,i]));
 const bondOrders=atoms.map(()=>0);
 for(const b of bonds){const x=byId.get(b.a),y=byId.get(b.b);if(x===undefined||y===undefined||!Number.isInteger(b.order)||b.order<1||b.order>3)continue;bondOrders[x]+=b.order;bondOrders[y]+=b.order;}
 const entries=atoms.map((a,i)=>{
  const charge=a.formalCharge,radicals=a.unpairedElectrons;
  const chargeSet=Number.isInteger(charge),radicalsSet=Number.isInteger(radicals);
  const provided=chargeSet||radicalsSet;
  const out={id:a.id,symbol:a.symbol,used:bondOrders[i],provided,charge:chargeSet?charge:null,radicals:radicalsSet?radicals:null,lonePairs:null,shell:null,state:provided?'incomplete':'unassigned',reason:''};
  if(!provided)return out;
  if(!chargeSet||!radicalsSet){out.reason='حدد الشحنة الشكلية وعدد الإلكترونات غير المزدوجة معًا.';return out;}
  if(!Object.hasOwn(VE,a.symbol)||charge < -2||charge>2||radicals<0||radicals>2){out.state='invalid';out.reason='القيم خارج نطاق النموذج التعليمي.';return out;}
  const nonbonding=VE[a.symbol]-charge-bondOrders[i]-radicals;
  if(nonbonding<0||nonbonding%2!==0){out.state='invalid';out.reason='لا يمكن توزيع الإلكترونات المتبقية إلى أزواج حرة وفق القيم المختارة.';return out;}
  out.lonePairs=nonbonding/2;
  out.shell=2*bondOrders[i]+nonbonding+radicals;
  const maxShell=a.symbol==='H'?2:(a.symbol==='Cl'?Number.POSITIVE_INFINITY:8);
  if(out.shell>maxShell){out.state='invalid';out.reason='يتجاوز غلاف التكافؤ الحدود التي يمثلها هذا النموذج لهذا العنصر.';return out;}
  out.state='consistent';out.reason='العد الإلكتروني متسق في رسم لويس المبسط؛ لا يثبت الاستقرار.';return out;
 });
 const assigned=entries.filter(x=>x.provided).length;
 const invalid=entries.some(x=>x.state==='invalid');
 const partial=entries.some(x=>x.state==='incomplete');
 const complete=atoms.length>0&&assigned===atoms.length&&!invalid&&!partial;
 const netCharge=complete?entries.reduce((s,a)=>s+a.charge,0):null;
 const totalRadicals=complete?entries.reduce((s,a)=>s+a.radicals,0):null;
 const totalValence=atoms.reduce((s,a)=>s+(VE[a.symbol]||0),0);
 // Charge is not known unless every atom has a consistent explicit state.
 return {entries,assigned,complete,invalid,partial,netCharge,totalRadicals,totalValence,
    totalElectrons:complete?totalValence-netCharge:null,
    status:invalid?'inconsistent':complete?'specified':assigned?'partial':'unassigned'};
}
const api={inspectElectrons,VALENCE_ELECTRONS:VE};
if(typeof module==='object'&&module.exports)module.exports=api;
root.MatterLabElectrons=api;
})(typeof window!=='undefined'?window:globalThis);
