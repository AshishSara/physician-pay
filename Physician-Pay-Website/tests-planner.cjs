const assert=require('node:assert/strict');require('./dist/data.js');require('./dist/model-data.js');require('./dist/layers-data.js');const E=require('./dist/engine.js'),P=require('./dist/planner.js');
const near=(a,b,t=1e-5)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const s={country:'US',place:'Oklahoma',kind:'employee',gross:500000,overhead:0,liability:0,reimbursement:0,licence:0,tail:0,health:4440,professionalMode:'employer',federalOverride:'',stateOverride:'',payrollOverride:'',localOverride:''};
// Official rate and deduction examples; fixed local inputs where necessary.
for(const [place,expected] of [['Arizona',12106.25],['Illinois',24750],['North Carolina',20708.125],['Virginia',27935.9],['Louisiana',14625],['Michigan',21003.5],['Kentucky',19869.2],['Colorado',21472]]){
 const r=E.calc({...s,place,localOverride:0});assert.ok(r.valid,place);near(r.state,expected);near(r.cash,r.gross-r.practice-r.tax-r.payroll-r.personal);
}
near(E.calc({...s,place:'Illinois',gross:250000}).state,(250000-2850)*.0495);
near(E.calc({...s,place:'Illinois',gross:250001}).state,250001*.0495);
for(const place of ['Michigan','Kentucky','Colorado']){const r=E.calc({...s,place});assert.equal(r.valid,false);assert.ok(r.state>0);assert.match(r.missing.join(' '),/city\/county/);}
const co=E.calc({...s,place:'Colorado',localOverride:0});near(co.payroll-E.calc(s).payroll,792.45);
assert.equal(E.calc({...s,place:'Arizona',kind:'business'}).valid,false);
// Independently known amortization cases and zero-interest edge case.
near(P.payment(100000,6,360),599.5505251527569);
let loan=P.debtSchedule(12000,0,1,1000);near(loan.payment,2000);assert.equal(loan.months,6);near(loan.interest,0);near(loan.total,12000);
const ordinary=P.debtSchedule(215000,6,10),fast=P.debtSchedule(215000,6,10,1000);assert.ok(fast.months<ordinary.months);assert.ok(fast.interest<ordinary.interest);near(ordinary.payments.reduce((a,b)=>a+b,0),ordinary.total,.01);
assert.equal(P.debtSchedule(-1,6,10),null);assert.equal(P.payment(1000,-1,12),null);
const mortgage=P.mortgage({country:'CA'},{...P.defaults(),homePrice:300000,downPercent:0,mortgageRate:2.5,mortgageYears:25,propertyTax:0,homeInsurance:0,maintenance:0,hoa:0,closingCosts:0});near(mortgage.pi,1343.898156,.01);
const paid=P.mortgage({country:'US'},{...P.defaults(),downPercent:100});near(paid.pi,0);
// Debt releases payments back into investable surplus after payoff.
const net={country:'US',place:'Oklahoma',kind:'net',gross:180000,budget:5000};const p={...P.defaults(),budgetMode:'total',partnerNet:12000,debt:12000,debtRate:0,debtYears:1,netReturn:0,horizon:2,moveCost:12000};
const r=P.calculate(net,E.calc(net),p,{unit:1});assert.ok(r.valid);near(r.left,10000);near(r.afterMove,9000);near(r.final.assets,240000);near(r.final.debt,0);near(r.hourly,180000/2300);near(r.committedHourly,180000/2484);
const short=P.calculate(net,E.calc(net),{...p,debtExtra:1000},{unit:1});near(short.afterMove,9000); // same principal repaid in year one
assert.equal(P.calculate(net,E.calc(net),{...p,hours:0},{unit:1}).valid,false);
assert.equal(P.calculate(net,E.calc(net),{...p,budgetMode:'itemized',rent:''},{unit:1}).valid,false);
const item=P.calculate(net,E.calc(net),{...P.defaults(),budgetMode:'itemized',rent:2000,food:700,transport:600,utilities:100,children:0,other:600},{unit:1});near(item.living,4000);near(item.left,11000);
const d=P.calculate({...net,budget:20000},E.calc(net),{...P.defaults(),budgetMode:'total',netReturn:0,horizon:1},{unit:1});near(d.final.assets,-60000);
const target=250000,floor=P.solveGross(s,target);assert.ok(floor>target);near(E.calc({...s,gross:floor}).cash,target,.01);assert.equal(P.solveGross({...s,federalOverride:10000},target),null);assert.equal(P.solveGross(net,target),null);
// Housing coverage and source revisions; counts refer to state/area rows, not unique national markets.
const h=LAYERS_DATA.housingUS;assert.equal(new Set(h.map(x=>x.state)).size,51);assert.equal(h.length,3006);assert.equal(LAYERS_DATA.housingCA.length,17);
for(const row of h){assert.equal(row.rents.length,5);assert.ok(row.rents.every(x=>Number.isInteger(x)&&x>0));}
near(h.find(x=>x.state==='California'&&x.area.startsWith('San Luis Obispo')).rents[2],2434);
near(h.find(x=>x.state==='Massachusetts'&&x.area.startsWith('Boston-Cambridge')).rents[2],2837);
near(h.find(x=>x.state==='New Hampshire'&&x.area.startsWith('Boston-Cambridge')).rents[2],2837);
console.log('PASS: eight state tax models, local-tax gating, exemption cliff, FAMLI, loan amortization/payoff, mortgage convention, budgets, debt release, projections, income solver, invalid inputs and housing coverage.');
