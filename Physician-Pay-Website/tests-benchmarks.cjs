const assert=require('node:assert/strict');require('./dist/data.js');require('./dist/model-data.js');const B=require('./dist/benchmarks.js'),E=require('./dist/engine.js');
let s={country:'CA',place:'BC',specialty:'Family medicine',benchmarkBasis:'auto'};
assert.equal(B.apply(s).value,267629.8);assert.equal(s.gross,267630);assert.equal(s.kind,'business');assert.equal(s.incomeMode,'benchmark');
s.specialty='Dermatology';B.apply(s);assert.equal(s.gross,337296);
s.place='AB';B.apply(s);assert.equal(s.gross,708932);
s.place='SK';B.apply(s);assert.equal(s.gross,'');assert.equal(B.get(s).value,null); // never retain Alberta pay under Saskatchewan
s={country:'US',place:'Oklahoma',specialty:'Family medicine',benchmarkBasis:'auto'};assert.equal(B.apply(s).value,330216);assert.equal(s.kind,'employee');assert.equal(B.get(s).quality,'national-group');assert.match(B.get(s).note,/not a measured Oklahoma median/);
s.place='California';assert.equal(B.apply(s).value,330216);assert.match(s.source,/not a measured California median/);
s.place='Oklahoma';s.benchmarkBasis='state';assert.equal(B.apply(s).value,361350);assert.equal(B.get(s).quality,'broad-state-wage');assert.match(B.get(s).note,/Includes trainees/);
s.specialty='Psychiatry';s.benchmarkBasis='auto';assert.equal(B.apply(s).value,271640);assert.match(B.get(s).note,/fallback/);
s.specialty='Dermatology';assert.equal(B.apply(s).value,null);assert.equal(s.gross,'');
s.specialty='Internal medicine';s.benchmarkBasis='national';assert.equal(B.apply(s).value,347750);
s.specialty='Pediatrics';assert.equal(B.apply(s).value,295248);
s.specialty='Obstetrics/gynecology';assert.equal(B.apply(s).value,406633);
s.specialty='Cardiology';assert.equal(B.apply(s).value,null); // do not silently substitute noninvasive cardiology for all cardiology
s.specialty='Cardiology — noninvasive';assert.equal(B.apply(s).value,615621);
const fake={...PAY_DATA,amga:[],us:[{state:'Oklahoma',code:'29-1213',median:'#'}]};assert.equal(B.get({...s,specialty:'Dermatology',benchmarkBasis:'state'},fake).value,null);
assert.equal(B.normalize('Pediatrics — general','CA'),'Pediatrics');assert.equal(B.normalize('Dermatology','US'),'Dermatology');
for(const country of ['CA','US'])for(const place of country==='CA'?Object.keys(PAY_DATA.provinces):Object.keys(PAY_DATA.rpp).filter(x=>x!=='United States'))for(const specialty of B.specialties(country)){
 const sample={country,place,specialty,benchmarkBasis:'auto'};const r=B.apply(sample);assert.ok(r.value===null||Number.isFinite(r.value)&&r.value>0);if(r.value===null)assert.equal(sample.gross,'');else assert.equal(sample.gross,Math.round(r.value));
}
console.log('PASS: automatic median selection, province/specialty refresh, named national/state scopes, aliases, missing/top-coded clearing, and all location/specialty choices.');
