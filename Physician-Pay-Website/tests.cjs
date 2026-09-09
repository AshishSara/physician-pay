const assert=require('node:assert/strict');
require('./dist/data.js');const E=require('./dist/engine.js'),D=globalThis.PAY_DATA;
const base={country:'US',place:'New York',cityTax:'nyc',kind:'employee',gross:500000,overhead:0,liability:0,reimbursement:0,licence:0,tail:0,health:0,federalOverride:'',stateOverride:'',payrollOverride:'',localOverride:'',priceArea:'New York-Newark-Jersey City, NY-NJ'};
const near=(a,b,tol=.02)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
let ny=E.calc(base);assert.equal(ny.valid,true);
// IRS single-filer standard-deduction calculation, checked independently.
near(ny.federal,139034.75);near(ny.payroll,176100*.062+500000*.0145+300000*.009+354.53);
// NY worksheet 8 and NYC schedule differ by sub-dollar table rounding.
near(ny.state,12356+(492000-215400)*.0685+568+1831,1);
near(ny.local,1813+(492000-50000)*.03876,1);
let ok=E.calc({...base,place:'Oklahoma',priceArea:'',cityTax:'none'});near(ok.state,23212.375);near(ok.cash,316884.675);
near(E.calc({...base,place:'California',cityTax:'none'}).state,38638.27+(494294-445771)*.113,1);
assert.equal(E.calc({...base,place:'Texas'}).state,0);
assert.equal(E.calc({...base,place:'Massachusetts'}).cash,null);
assert.equal(E.calc({...base,place:'Massachusetts',stateOverride:20000,localOverride:0}).cash,null);
assert.equal(E.calc({...base,place:'Massachusetts',stateOverride:20000,localOverride:0,payrollOverride:22000}).valid,true);
assert.equal(E.calc({...base,country:'CA',place:'QC'}).cash,null);
assert.equal(E.calc({...base,place:'Washington'}).cash,null);
assert.equal(E.calc({...base,kind:'business'}).cash,null); // NY business tax must be entered.
assert.equal(E.calc({...base,health:-100}).valid,false);
assert.equal(E.calc({...base,gross:''}).valid,false);
let ca=E.calc({...base,country:'CA',place:'AB',kind:'business',gross:708931.93,overhead:35});near(ca.profit,460805.7545);near(ca.payroll,8860.20);near(ca.agi,455301.6545);
let insured=E.calc({...base,liability:12000,reimbursement:10000,health:5000});near(ny.cash-insured.cash,7000);near(ny.federal,insured.federal);
let business=E.calc({...base,country:'CA',place:'AB',kind:'business',overhead:30,liability:10000,reimbursement:8000});near(business.practice,152000);
assert.equal(E.calc({...base,federalOverride:0}).federal,0);
for(const province of Object.keys(D.caTax))for(const income of [100000,300000,700000]){
 let r=E.calc({...base,country:'CA',place:province,gross:income});assert.ok(r.valid);near(r.gross-r.practice-r.personal-r.federal-r.state-r.local-r.payroll,r.cash);assert.ok(r.cash>=0&&r.cash<income);
}
assert.equal(D.ca.length,190);assert.equal(D.us.length,867);assert.equal(Object.keys(D.rpp).length,52);assert.ok(D.mbm.find(x=>x.name==='Toronto, Ontario'));assert.ok(D.mbm.find(x=>x.name==='Calgary, Alberta'));
near(E.power(base,ny).value,ny.cash/1.12563);
near(E.power({...base,place:'Oklahoma',priceArea:''},ok).value,ok.cash/(D.rpp.Oklahoma/100));
assert.ok(E.power({...base,place:'Oklahoma',priceArea:''},ok).value>E.power(base,ny).value);
console.log('PASS: tax reference cases, expense treatment, missing-input blocking, manual overrides, nine Canadian provinces, data coverage and price conversions.');
console.log(JSON.stringify({NYC:{cash:ny.cash,power:E.power(base,ny).value},Oklahoma:{cash:ok.cash,power:E.power({...base,place:'Oklahoma',priceArea:''},ok).value},AlbertaDerm:{cash:ca.cash}},null,2));
