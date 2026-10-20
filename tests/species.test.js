'use strict';
const assert=require('node:assert/strict');
const {MOLECULES,SPECIES,CATALOG,analyze,inspectElectrons,inspectStructure}=require('../src/engine.js');
function specimen(symbols,edges,annotations={}){
 const atoms=symbols.map((symbol,i)=>({id:'s'+i,symbol,...(annotations[i]||{})}));
 const bonds=edges.map(([a,b,order])=>({a:'s'+a,b:'s'+b,order}));
 return {atoms,bonds};
}
let passed=0;
function equal(a,b,msg){assert.equal(a,b,msg);passed++;}
const hydroxide=specimen(['O','H'],[[0,1,1]],{
 0:{formalCharge:-1,unpairedElectrons:0},1:{formalCharge:0,unpairedElectrons:0}});
const hydroxyRadical=specimen(['H','O'],[[0,1,1]],{
 0:{formalCharge:0,unpairedElectrons:0},1:{formalCharge:0,unpairedElectrons:1}});
const ammonium=specimen(['N','H','H','H','H'],[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],{
 0:{formalCharge:1,unpairedElectrons:0},1:{formalCharge:0,unpairedElectrons:0},2:{formalCharge:0,unpairedElectrons:0},3:{formalCharge:0,unpairedElectrons:0},4:{formalCharge:0,unpairedElectrons:0}});
for(const [sample,id,formula,electrons,charge,radicals] of [
 [hydroxide,'hydroxide','OH⁻',8,-1,0],
 [hydroxyRadical,'hydroxyl-radical','OH·',7,0,1],
 [ammonium,'ammonium-ion','NH₄⁺',8,1,0]
]){
 const r=analyze(sample.atoms,sample.bonds);
 equal(r.kind,'found','must be recognized: '+id);
 equal(r.molecule.id,id,'accurate identity '+id);
 equal(inspectStructure(sample.atoms,sample.bonds).formula,formula,'canonical formula '+id);
 const e=inspectElectrons(sample.atoms,sample.bonds);
 equal(e.totalElectrons,electrons,'valence electrons '+id);
 equal(e.netCharge,charge,'net charge '+id);
 equal(e.totalRadicals,radicals,'unpaired electrons '+id);
}
equal(MOLECULES.length,18,'original molecule inventory unchanged');
equal(SPECIES.length,3,'three new species');
equal(CATALOG.length,21,'combined 21 discovery entries');
const swapped=specimen(['H','O'],[[0,1,1]],{0:{formalCharge:0,unpairedElectrons:0},1:{formalCharge:-1,unpairedElectrons:0}});
equal(analyze(swapped.atoms,swapped.bonds).molecule?.id,'hydroxide','atom order independent');
const neutral=specimen(['O','H'],[[0,1,1]]);
equal(inspectStructure(neutral.atoms,neutral.bonds).effectiveValenceElectrons,null,'no assumed total charge');
equal(analyze(neutral.atoms,neutral.bonds).kind,'building','neutral unspecified OH should not be falsely identified');
const partly=specimen(['O','H'],[[0,1,1]],{0:{formalCharge:-1,unpairedElectrons:0}});
equal(analyze(partly.atoms,partly.bonds).kind,'electron-incomplete','incomplete input cannot identify hydroxide');
const incorrect=specimen(['O','H'],[[0,1,1]],{0:{formalCharge:0,unpairedElectrons:0},1:{formalCharge:0,unpairedElectrons:0}});
equal(analyze(incorrect.atoms,incorrect.bonds).kind,'electronic-inconsistent','neutral O-H closed shell invalid');
const wrongRad=specimen(['O','H'],[[0,1,1]],{0:{formalCharge:0,unpairedElectrons:1},1:{formalCharge:-1,unpairedElectrons:0}});
equal(analyze(wrongRad.atoms,wrongRad.bonds).kind,'electronic-inconsistent','invalid radical cannot obtain label');
const impossibleValence=specimen(['H','H'],[[0,1,2]]);
equal(analyze(impossibleValence.atoms,impossibleValence.bonds).kind,'overbonded','legacy valence check preserved');
const neutralWater=specimen(['O','H','H'],[[0,1,1],[0,2,1]]);
equal(analyze(neutralWater.atoms,neutralWater.bonds).molecule?.id,'water','no regressions in old neutral structures');
const chargedWater=specimen(['O','H','H'],[[0,1,1],[0,2,1]],{
 0:{formalCharge:1,unpairedElectrons:1},1:{formalCharge:0,unpairedElectrons:0},2:{formalCharge:0,unpairedElectrons:0}});
equal(analyze(chargedWater.atoms,chargedWater.bonds).kind,'electronic-variant','charged water radical not assigned neutral water identity');
equal(inspectStructure(chargedWater.atoms,chargedWater.bonds).formula,'H₂O⁺·','charged radical formula');
const ionNotCurated=specimen(['N','H','H','H'],[[0,1,1],[0,2,1],[0,3,1]],{
 0:{formalCharge:1,unpairedElectrons:1},1:{formalCharge:0,unpairedElectrons:0},2:{formalCharge:0,unpairedElectrons:0},3:{formalCharge:0,unpairedElectrons:0}});
equal(analyze(ionNotCurated.atoms,ionNotCurated.bonds).kind,'electronic-inconsistent','nitrogen unsound electronic assignment flagged');
console.log('PASS: '+passed+' ion/radical identity and valence regression assertions');
