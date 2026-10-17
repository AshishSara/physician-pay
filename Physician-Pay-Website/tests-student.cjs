const assert=require('node:assert/strict');
require('./dist/data.js');require('./dist/model-data.js');require('./dist/layers-data.js');
const E=require('./dist/engine.js'),P=require('./dist/planner.js'),B=require('./dist/benchmarks.js');
const near=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const net={country:'US',place:'Oklahoma',kind:'net',gross:120000,extraNetCosts:12000,budget:4000,health:99999,overhead:90,liability:25000};
const plan={...P.defaults(),budgetMode:'total',partnerNet:12000,debt:12000,debtRate:0,debtYears:1};
const cash=E.calc(net),base=P.monthly(net,cash,plan,null);

// Entered take-home already includes taxes and insurance. Only explicit extra costs
// are deducted; debt is its own cash-flow line, outside the living budget.
assert.equal(base.valid,true);assert.equal(cash.federal,null);
near(base.physicianMonthly,9000);near(base.partnerMonthly,1000);near(base.household,10000);
near(base.living,4000);near(base.debt.payment,1000);near(base.left,5000);
near(P.monthly(net,cash,{...plan,debt:0},null).left,6000);
assert.deepEqual(P.monthly(net,cash,plan,{unit:7}),base); // Entered cash costs do not scale with PPP.

// Zero is a deliberate amount; an empty selected budget or required input is incomplete.
for(const zero of [0,'0']){
 const emptyCosts=P.monthly({...net,budget:zero},cash,{...plan,partnerNet:zero,debt:zero},null);
 assert.equal(emptyCosts.valid,true);near(emptyCosts.left,9000);
}
assert.equal(P.monthly({...net,budget:''},cash,plan,null).valid,false);
assert.equal(P.monthly(net,cash,{...plan,partnerNet:''},null).valid,false);
assert.equal(P.monthly(net,cash,{...plan,partnerNet:-1},null).valid,false);
assert.equal(P.monthly(net,cash,{...plan,debt:''},null).valid,false);
assert.equal(P.monthly(net,cash,{...plan,budgetMode:'itemized',rent:''},null).valid,false);
const freeRent=P.monthly(net,cash,{...plan,budgetMode:'itemized',rent:0,food:0,transport:0,utilities:0,children:0,other:0},null);
assert.equal(freeRent.valid,true);near(freeRent.living,0);near(freeRent.left,9000);

// Optional work, moving and investment assumptions must not hide monthly cash flow.
for(const [key,value] of [['hours',0],['weeks',''],['commute',-1],['assets',''],['investPercent',101],['netReturn',''],['horizon',''],['moveCost',-1]]){
 const optionalInvalid={...plan,[key]:value};
 assert.deepEqual(P.monthly(net,cash,optionalInvalid,null),base,key);
 assert.equal(P.calculate(net,cash,optionalInvalid,null).valid,false,key);
}

// Modeled living costs need valid price data; an entered budget does not.
const modeled=P.monthly(net,cash,{...plan,budgetMode:'modeled'},{unit:1.5},2000);
near(modeled.living,3000);near(modeled.left,6000);
near(P.monthly(net,cash,{...plan,budgetMode:'modeled'},{unit:1.8},2000).living,3600);
for(const price of [null,{unit:0},{unit:NaN},{unit:Infinity}])assert.equal(P.monthly(net,cash,{...plan,budgetMode:'modeled'},price).valid,false);

// Ownership spending includes monthly housing costs, while upfront costs stay separate.
const owner={...plan,budgetMode:'itemized',housingMode:'own',homePrice:120000,downPercent:100,propertyTax:1200,homeInsurance:1200,maintenance:1200,hoa:100,mortgageInsurance:0,closingCosts:1000,food:200,transport:100,utilities:100,children:0,other:200};
const ownership=P.monthly(net,cash,owner,null);
near(ownership.housing.monthly,400);near(ownership.housing.upfront,121000);near(ownership.living,1000);near(ownership.left,8000);
assert.equal(P.monthly(net,cash,{...owner,homePrice:''},null).valid,false);

// A surplus is not floored at zero, and the last debt payment cannot exceed the loan.
near(P.monthly({...net,budget:15000},cash,{...plan,partnerNet:0,debt:0},null).left,-6000);
const capped=P.monthly(net,cash,{...plan,debt:1000,debtExtra:1000},null);
near(capped.debt.payment,1000);assert.equal(capped.debt.months,1);near(capped.left,5000);

// Reusing monthly cash flow preserves the established first-year and projection output.
const projected=P.calculate(net,cash,{...plan,moveCost:12000,netReturn:0,horizon:2},null);
near(projected.left,5000);near(projected.afterMove,4000);near(projected.final.assets,120000);near(projected.final.debt,0);
for(const key of ['living','housing','debt','household','left'])assert.deepEqual(projected[key],base[key]);

const employee={country:'US',place:'Oklahoma',kind:'employee',gross:500000,overhead:0,liability:0,reimbursement:0,licence:0,tail:0,health:4440,professionalMode:'employer',federalOverride:'',stateOverride:'',payrollOverride:'',localOverride:'',budget:4000};
// The same national pay benchmark survives a state change; local taxes can change.
const national={...employee,specialty:'Family medicine',benchmarkBasis:'national'};
const ok={...national},california={...national,place:'California'};B.apply(ok);B.apply(california);
assert.equal(ok.gross,330216);assert.equal(california.gross,ok.gross);
assert.notEqual(E.calc(ok).cash,E.calc(california).cash);
const missingTax={...employee,place:'Massachusetts'},incomplete=E.calc(missingTax);
assert.equal(incomplete.valid,false);assert.equal(P.monthly(missingTax,incomplete,plan,null).valid,false);
const missingPay={...employee,specialty:'Cardiology',benchmarkBasis:'national'};B.apply(missingPay);
assert.equal(missingPay.gross,'');assert.equal(P.monthly(missingPay,E.calc(missingPay),plan,null).valid,false);

// Lower-pay stress must rerun tax and overhead; it cannot just scale take-home cash.
const salaryResult=E.calc(employee),salaryMonthly=P.monthly(employee,salaryResult,plan,null),before=JSON.stringify({employee,plan});
const calls=[],recordingEngine={calc:scenario=>{calls.push(scenario);return E.calc(scenario);}};
const stresses=P.monthlyStress(employee,salaryResult,plan,null,5000,recordingEngine);
assert.deepEqual(stresses.map(row=>[row.id,row.label,row.valid,row.reason]),[['lower-pay','10% lower pay',true,''],['higher-costs','Living costs +15%',true,'']]);
assert.equal(calls.length,1);near(calls[0].gross,450000);
const lowerResult=E.calc({...employee,gross:450000});
near(stresses[0].left,lowerResult.cash/12-4000); // Partner's 1,000 offsets the 1,000 loan payment.
assert.ok(Math.abs(stresses[0].left-(salaryResult.cash*.9/12-4000))>100);
near(stresses[1].left,salaryMonthly.left-600);
assert.equal(JSON.stringify({employee,plan}),before);
const practice={...employee,country:'CA',place:'BC',kind:'business',overhead:30,professionalMode:'included'};
const practiceRows=P.monthlyStress(practice,E.calc(practice),plan,null);
near(practiceRows[0].left,P.monthly({...practice,gross:450000},E.calc({...practice,gross:450000}),plan,null).left);

// Known take-home and fixed-tax scenarios still allow a living-cost stress, but
// cannot produce a lower-gross-pay result without independently recomputed taxes.
const forbiddenEngine={calc:()=>{throw new Error('Unexpected tax recalculation');}};
for(const scenario of [net,{...employee,federalOverride:0},{...employee,stateOverride:15000},{...employee,payrollOverride:10000},{...employee,localOverride:100}]){
 const result=E.calc(scenario),current=P.monthly(scenario,result,plan,null);
 const rows=P.monthlyStress(scenario,result,plan,null,5000,forbiddenEngine);
 assert.equal(rows[0].valid,false);assert.equal(rows[0].left,null);assert.match(rows[0].reason,/Known take-home|Fixed tax overrides/);
 assert.equal(rows[1].valid,true);near(rows[1].left,current.left-600);
}
assert.equal(P.monthlyStress({...employee,localOverride:0},E.calc({...employee,localOverride:0}),plan,null)[0].valid,true);
const noIncome=P.monthlyStress(missingTax,incomplete,plan,null,5000,forbiddenEngine);
assert.ok(noIncome.every(row=>!row.valid&&row.left===null&&row.reason));
const unavailableEngine={calc:()=>({valid:false})};
const unavailable=P.monthlyStress(employee,salaryResult,plan,null,5000,unavailableEngine);
assert.equal(unavailable[0].valid,false);assert.equal(unavailable[0].left,null);assert.equal(unavailable[1].valid,true);
assert.equal(P.monthlyStress(net,cash,{...plan,horizon:''},null)[1].valid,true);

console.log('PASS: student monthly cash flow, known-net accounting, separate debt, zero/blank inputs, deficits, price independence, optional-input isolation, ownership, debt caps, projections, benchmark scope, missing inputs and guarded stress recalculation.');
