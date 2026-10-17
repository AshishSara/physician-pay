/* Planning mathematics. Real/local cash; no investment or tax forecast. */
(function(root){
'use strict';
const num=x=>Number(x),finite=(x,lo=0,hi=1e8)=>x!==''&&Number.isFinite(num(x))&&num(x)>=lo&&num(x)<=hi;
function defaults(){return {budgetMode:'modeled',housingMode:'rent',rent:'',rentNote:'Enter a local quote or load a published housing reference.',housingArea:'',bedrooms:2,food:700,transport:600,utilities:250,children:0,other:950,homePrice:750000,downPercent:20,mortgageRate:6,mortgageYears:25,propertyTax:6000,homeInsurance:1800,mortgageInsurance:0,maintenance:7500,hoa:0,closingCosts:15000,debt:0,debtRate:6,debtYears:10,debtExtra:0,hours:50,weeks:46,commute:4,partnerNet:0,assets:0,investPercent:100,netReturn:3,horizon:10,moveCost:0};}
function payment(principal,rate,months){if(!finite(principal)||!finite(rate,0,50)||!finite(months,1,600))return null;const r=num(rate)/1200;return r?num(principal)*r/(-Math.expm1(-num(months)*Math.log1p(r))):num(principal)/num(months);}
function debtSchedule(principal,rate,years,extra=0){if(!finite(principal)||!finite(rate,0,50)||!finite(years,1,50)||!finite(extra))return null;const scheduled=payment(principal,rate,num(years)*12),pay=scheduled+num(extra),payments=[];let balance=num(principal),interest=0;for(let m=0;balance>.005&&m<600;m++){const charge=balance*num(rate)/1200;const paid=Math.min(pay,balance+charge);balance=Math.max(0,balance+charge-paid);interest+=charge;payments.push(paid);}return {payment:payments[0]??0,scheduled,months:payments.length,interest,total:num(principal)+interest,payments,balance};}
function mortgage(s,p){const fields=[['homePrice',1,1e8],['downPercent',0,100],['mortgageRate',0,50],['mortgageYears',1,50],['propertyTax',0,1e7],['homeInsurance',0,1e7],['mortgageInsurance',0,1e6],['maintenance',0,1e7],['hoa',0,1e6],['closingCosts',0,1e7]];if(fields.some(([k,l,h])=>!finite(p[k],l,h)))return null;const principal=num(p.homePrice)*(1-num(p.downPercent)/100);const nominal=s.country==='CA'?1200*(Math.pow(1+num(p.mortgageRate)/200,1/6)-1):num(p.mortgageRate);const pi=payment(principal,nominal,num(p.mortgageYears)*12);return {pi,principal,monthly:pi+(num(p.propertyTax)+num(p.homeInsurance)+num(p.maintenance))/12+num(p.hoa)+num(p.mortgageInsurance),upfront:num(p.homePrice)*num(p.downPercent)/100+num(p.closingCosts)};}
// Monthly cash flow does not depend on optional work-hour or projection assumptions.
function monthly(s,r,p,price,lifestyle=5000){
 if(!r?.valid||!Number.isFinite(r.cash))return {valid:false,error:'Complete the income and tax calculation above first.'};
 if(!finite(p.partnerNet,0,1e7))return {valid:false,error:'Enter other household take-home as a non-negative annual amount.'};
 const debt=debtSchedule(p.debt,p.debtRate,p.debtYears,p.debtExtra);if(!debt)return {valid:false,error:'Enter valid debt terms: balance ≥ 0, interest 0–50%, term 1–50 years, extra payment ≥ 0.'};
 let living,housing=null;
 if(p.budgetMode==='modeled'){if(!price||!Number.isFinite(price.unit)||price.unit<=0||!finite(lifestyle))return {valid:false,error:'Enter a valid shared lifestyle target and local price assumptions.'};living=num(lifestyle)*price.unit;}
 else if(p.budgetMode==='total'){if(!finite(s.budget))return {valid:false,error:'Enter your total monthly living costs in the budget field below.'};living=num(s.budget);}
 else if(p.budgetMode==='itemized'){
  if(['food','transport','utilities','children','other'].some(k=>!finite(p[k])))return {valid:false,error:'Enter each household category; use 0 only when no cost applies.'};
  if(p.housingMode==='own'){housing=mortgage(s,p);if(!housing)return {valid:false,error:'Check home price, down payment, interest and ownership costs.'};}
  else {if(!finite(p.rent))return {valid:false,error:'Enter monthly rent or load a published housing reference.'};housing={monthly:num(p.rent),upfront:0};}
  living=housing.monthly+['food','transport','utilities','children','other'].reduce((t,k)=>t+num(p[k]),0);
 }else return {valid:false,error:'Choose a valid household budget mode.'};
 const physicianMonthly=r.cash/12,partnerMonthly=num(p.partnerNet)/12,household=(r.cash+num(p.partnerNet))/12,left=household-living-debt.payment;
 return {valid:true,living,housing,debt,household,left,physicianMonthly,partnerMonthly};
}
function calculate(s,r,p,price,lifestyle=5000){
 const budget=monthly(s,r,p,price,lifestyle);if(!budget.valid)return budget;
 const fields=[['hours',1,120],['weeks',1,52],['commute',0,40],['assets',0,1e8],['investPercent',0,100],['netReturn',-10,15],['horizon',1,40],['moveCost',0,1e7]];
 if(fields.some(([k,l,h])=>!finite(p[k],l,h)))return {valid:false,error:'Check work hours, weeks, savings, return and moving-cost inputs.'};
 const {living,housing,debt,household,left}=budget;
 const afterMove=household-living-(debt.payments.slice(0,12).reduce((a,b)=>a+b,0)+num(p.moveCost))/12;
 const contribution=Math.max(0,left)*num(p.investPercent)/100,work=num(p.hours)*num(p.weeks),committed=(num(p.hours)+num(p.commute))*num(p.weeks);
 // Constant nominal household cash and living costs; fixed-rate debt.
 // Return is specified net of investment tax and fees. No inflation or pay growth is simulated.
 const rate=Math.pow(1+num(p.netReturn)/100,1/12)-1;let assets=num(p.assets),points=[{year:0,assets,debt:num(p.debt),net:assets-num(p.debt)}],remaining=num(p.debt);
 for(let m=1;m<=Math.round(num(p.horizon)*12);m++){
  const paid=debt.payments[m-1]??0;remaining=Math.max(0,remaining*(1+num(p.debtRate)/1200)-paid);
  const available=household-living-paid-(m===1?num(p.moveCost):0);
  const flow=available<0?available:available*num(p.investPercent)/100;
  assets=assets*(1+rate)+flow;
  if(m%12===0)points.push({year:m/12,assets,debt:remaining,net:assets-remaining});
 }
 return {valid:true,living,housing,debt,household,left,afterMove,contribution,work,committed,hourly:r.cash/work,committedHourly:r.cash/committed,powerHourly:price?r.cash/price.unit/committed:null,buffer:living+debt.payment>0?num(p.assets)/(living+debt.payment):null,savingsRate:household>0?left/household:null,points,final:points.at(-1),cashTarget:12*(living+debt.payment)-num(p.partnerNet)};
}
function variableTaxes(s){return s.kind!=='net'&&['federalOverride','stateOverride','payrollOverride','localOverride'].every(k=>s[k]===''||s[k]==null||k==='localOverride'&&Number(s[k])===0);}
function monthlyStress(s,r,p,price,lifestyle=5000,engine=root.PayEngine){
 const base=monthly(s,r,p,price,lifestyle),rows=[{id:'lower-pay',label:'10% lower pay',valid:false,left:null,reason:''},{id:'higher-costs',label:'Living costs +15%',valid:false,left:null,reason:''}];
 if(!base.valid)return rows.map(row=>({...row,reason:base.error}));
 if(!variableTaxes(s))rows[0].reason=s.kind==='net'?'Known take-home: gross income and taxes cannot be recalculated.':'Fixed tax overrides must be recalculated for a change in pay.';
 else{
  const lower={...s,gross:num(s.gross)*.9},result=engine.calc(lower),budget=monthly(lower,result,p,price,lifestyle);
  if(budget.valid)Object.assign(rows[0],{valid:true,left:budget.left});
  else rows[0].reason=budget.error;
 }
 // Only living costs change; debt payments and household income remain fixed.
 Object.assign(rows[1],{valid:true,left:base.left-base.living*.15});
 return rows;
}
function solveGross(s,target,engine=root.PayEngine){if(!variableTaxes(s)||!finite(target,-1e7,1e7))return null;let lo=1,hi=1e7;const top=engine.calc({...s,gross:hi});if(!top.valid||top.cash<target)return null;for(let i=0;i<55;i++){const mid=(lo+hi)/2,r=engine.calc({...s,gross:mid});if(!r.valid){lo=mid;continue;}if(r.cash>=target)hi=mid;else lo=mid;}return hi;}
root.PayPlanner={defaults,payment,debtSchedule,mortgage,monthly,calculate,monthlyStress,solveGross,variableTaxes};if(typeof module!=='undefined')module.exports=root.PayPlanner;
})(globalThis);
