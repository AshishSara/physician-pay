const assert=require('node:assert/strict');
require('./dist/data.js');require('./dist/model-data.js');const E=require('./dist/engine.js'),D=PAY_DATA,M=MODEL_DATA;
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const a={country:'CA',place:'BC',priceArea:'Vancouver, British Columbia',kind:'net',gross:208000};
const b={country:'US',place:'Oklahoma',priceArea:'',kind:'net',gross:316000};
const ap=E.commonPower(a,E.calc(a)),bp=E.commonPower(b,E.calc(b));
near(ap.value,153900.57519648015);near(bp.value,359732.7049394943);near(bp.value/ap.value,2.337435740446289);
// Independent dimensional reconstruction: local cash / (CAD per I$ * local relative price).
near(ap.unit,1.240903*62842/(M.anchors.reduce((s,r)=>s+r.population*r.basket,0)/M.anchors.reduce((s,r)=>s+r.population,0)));
// An equivalence must reproduce identical spending power in either currency.
const matching={...a,gross:bp.value*ap.unit};near(E.commonPower(matching,E.calc(matching)).value,bp.value);
near((ap.value/bp.value)*(bp.value/ap.value),1);
// Every supported place works from known net, including locations without automatic taxes.
for(const place of Object.keys(D.rpp).filter(x=>x!=='United States')){
 const s={...b,place};assert.equal(E.calc(s).valid,true);assert.ok(E.commonPower(s,E.calc(s)).value>0);
}
for(const row of D.mbm){const s={...a,place:row.province,priceArea:row.name};assert.ok(E.commonPower(s,E.calc(s)).value>0);}
assert.equal(D.mbm.length,52);assert.ok(D.mbm.find(r=>r.name==='Montréal, Québec'));
for(const place of Object.keys(D.provinces))assert.ok(M.anchors.find(r=>r.province===place));
// National calibration cancels when comparing two Canadian places with the same reference.
const tor={...a,place:'ON',priceArea:'Toronto, Ontario'};
const ratio=(s,t)=>E.commonPower(s,E.calc(s)).value/E.commonPower(t,E.calc(t)).value;
near(ratio(a,tor),ratio({...a,referenceBasket:50000},{...tor,referenceBasket:50000}));
// Local price overrides replace the regional factor, but preserve national PPP.
near(E.localPrice({...a,priceOverride:100}).unit,D.ppp);
near(E.localPrice({...b,priceOverride:120,priceAdjustment:25}).unit,1.5);
assert.equal(E.localPrice({...a,priceOverride:0}),null);
assert.equal(E.localPrice({...a,priceAdjustment:-100}),null);
assert.equal(E.localPrice({...a,priceOverride:'invalid'}),null);
// Known take-home bypasses taxes/old hidden expenses; only explicitly additional costs are deducted.
near(E.calc({...a,health:99999,overhead:90,liability:12345}).cash,208000);
near(E.calc({...a,extraNetCosts:8000}).cash,200000);
assert.equal(E.calc({...a,extraNetCosts:208001}).valid,false);
assert.equal(E.calc({...a,gross:-1}).valid,false);
const base={country:'US',place:'Oklahoma',cityTax:'none',kind:'employee',gross:500000,overhead:0,liability:15000,reimbursement:0,licence:1500,tail:0,health:4440,healthPremium:1440,healthOutOfPocket:1000,disability:2000,professionalMode:'employer',federalOverride:'',stateOverride:'',payrollOverride:'',localOverride:''};
let emp=E.calc(base);near(emp.practice,0);near(emp.cash,312444.675);near(emp.personal,4440);
let own=E.calc({...base,professionalMode:'separate'});near(emp.cash-own.cash,16500);
assert.equal(E.calc({...base,healthPremium:-10}).valid,false);
// All-in overhead is not charged twice; separate professional costs reduce business taxable profit.
let business={...base,country:'CA',place:'BC',kind:'business',gross:500000,overhead:30,professionalMode:'included'};
let inc=E.calc(business),sep=E.calc({...business,professionalMode:'separate'});
near(inc.practice,150000);near(sep.practice,166500);assert.ok(sep.tax<inc.tax);assert.ok(sep.cash<inc.cash);
// Fee schedule reference examples across all four fee regions; no reimbursement silently inferred.
for(const [place,expected] of [['QC',327],['ON',4488],['BC',3384],['AB',3384],['SK',876],['NS',876]])near(E.cmpa({place,specialty:'Dermatology'}).fee,expected);
near(E.cmpa({place:'BC',specialty:'Orthopedic surgery'}).fee,20292);
// Guard finite accounting and power across mixed expense arrangements.
for(const country of ['CA','US'])for(const kind of ['employee','business'])for(const professionalMode of ['included','separate','employer']){
 const s={...base,country,place:country==='CA'?'BC':'Oklahoma',kind,professionalMode,overhead:30,priceArea:country==='CA'?a.priceArea:'',localOverride:0};const r=E.calc(s);assert.ok(r.valid);near(r.gross-r.practice-r.tax-r.payroll-r.personal,r.cash);assert.ok(Number.isFinite(E.commonPower(s,r).value));
}
console.log('PASS: cross-border dimensional consistency, all 51 U.S. and 52 Canadian cost areas, price calibration/overrides, known-net input, employer/included/separate expenses, fee references, and invalid-input protection.');
console.log(JSON.stringify({BC_power:ap.value,Oklahoma_power:bp.value,ratio:bp.value/ap.value,BC_matching_takehome:bp.value*ap.unit},null,2));
