/* 2025 single-filer scenario model. Pure functions; all values annual/local currency. */
(function(root){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function progressive(income,brackets){return brackets.reduce((sum,[floor,rate],i)=>sum+Math.max(0,Math.min(income,brackets[i+1]?.[0]??Infinity)-floor)*rate,0);}
const FED_US=[[0,.10],[11925,.12],[48475,.22],[103350,.24],[197300,.32],[250525,.35],[626350,.37]];
const FED_CA=[[0,.145],[57375,.205],[114750,.26],[177882,.29],[253414,.33]];
const NY=[[0,.04],[8500,.045],[11700,.0525],[13900,.055],[80650,.06],[215400,.0685],[1077550,.0965],[5000000,.103],[25000000,.109]];
const OK=[[0,.0025],[1000,.0075],[2500,.0175],[3750,.0275],[4900,.0375],[7200,.0475]];
const CAL=[[0,.01],[11079,.02],[26264,.04],[41452,.06],[57542,.08],[72724,.093],[371479,.103],[445771,.113],[742953,.123]];
const zeroStates=['Alaska','Florida','Nevada','New Hampshire','South Dakota','Tennessee','Texas','Washington','Wyoming'];
function nyTax(agi,taxable){let tax=progressive(taxable,NY);if(agi<=107650)return tax;if(agi>25000000)return taxable*.109;
 if(taxable<=215400)return tax+(.06*taxable-tax)*clamp((agi-107650)/50000,0,1);
 const [threshold,base,benefit]=taxable<=1077550?[215400,568,1831]:taxable<=5000000?[1077550,2399,30172]:[5000000,32571,32500];
 return tax+base+benefit*(Math.round(clamp((agi-threshold)/50000,0,1)*10000)/10000);
}
function healthON(x){if(x<=20000)return 0;if(x<=36000)return Math.min(300,.06*(x-20000));if(x<=48000)return Math.min(450,300+.06*(x-36000));if(x<=72000)return Math.min(600,450+.25*(x-48000));if(x<=200000)return Math.min(750,600+.25*(x-72000));return Math.min(900,750+.25*(x-200000));}
function calc(s,data=root.PAY_DATA){
 if(s.kind==='net'){
  const cash=Number(s.gross),extra=Number(s.extraNetCosts??0);
  if(!Number.isFinite(cash)||cash<=0||cash>10000000||!Number.isFinite(extra)||extra<0||extra>cash)return {valid:false,missing:['Enter positive take-home cash and additional costs between zero and that amount.'],warnings:[]};
  return {valid:true,missing:[],warnings:['Entered take-home: taxes, practice costs and insurance are assumed already accounted for. Only the explicit additional-cost field is deducted.'],gross:cash,overhead:0,liability:0,professional:0,practice:0,personal:extra,profit:cash,agi:null,federal:null,state:null,payroll:null,local:null,tax:0,cash:cash-extra,direct:true};
 }
 const warnings=[],missing=[];const business=s.kind==='business';
 for(const key of ['healthPremium','healthOutOfPocket','disability'])if(s[key]!=null&&(!Number.isFinite(Number(s[key]))||Number(s[key])<0||Number(s[key])>10000000))return {valid:false,missing:['Individual insurance and health amounts must be non-negative.'],warnings:[]};
 for(const key of ['gross','overhead','liability','reimbursement','licence','tail','health']){const value=Number(s[key]);if(!Number.isFinite(value)||value<0||value>10000000||(key==='overhead'&&value>95))return {valid:false,missing:['Enter non-negative amounts; practice overhead must be between 0% and 95%.'],warnings:[]};}
 const gross=Number(s.gross),overhead=business?gross*Number(s.overhead)/100:0;
 const liability=Math.max(0,Number(s.liability)-Number(s.reimbursement));
 const countedProfessional=!s.professionalMode||s.professionalMode==='separate';
 const professional=countedProfessional?liability+Number(s.licence)+Number(s.tail):0;
 const practice=overhead+(business?professional:0),profit=gross-practice;
 const personal=Number(s.health)+(business?0:professional);
 if(!Number.isFinite(gross)||gross<=0||gross>10000000||!Number.isFinite(profit)||profit<0)return {valid:false,missing:['Enter gross income above zero and expenses no greater than income.'],warnings:[]};
 let federal=0,state=null,payroll=0,local=0,agi=profit;
 if(s.country==='US'){
  const payrollBase=business?profit*.9235:gross;
  const regularPayroll=Math.min(payrollBase,176100)*(business?.124:.062)+payrollBase*(business?.029:.0145);
  payroll=regularPayroll+Math.max(0,payrollBase-200000)*.009;
  agi=profit-(business?regularPayroll/2:0);
  federal=progressive(Math.max(0,agi-15750),FED_US);
  if(zeroStates.includes(s.place))state=0;
  if(s.place==='New York'){
   state=nyTax(agi,Math.max(0,agi-8000));
   if(s.cityTax==='nyc')local=progressive(Math.max(0,agi-8000),[[0,.03078],[12000,.03762],[25000,.03819],[50000,.03876]]);
   if(!business)payroll+=Math.min(gross*.00388,354.53);
   if(business && s.localOverride==='')missing.push('Enter all local/business taxes, including any MCTMT or NYC unincorporated business tax, in the local-tax field.');
  }
  if(s.place==='Oklahoma')state=progressive(Math.max(0,agi-7350),OK);
  if(s.place==='California'){
   const taxable=Math.max(0,agi-5706);
   const credit=Math.max(0,153-6*Math.ceil(Math.max(0,agi-252203)/2500));
   state=Math.max(0,progressive(taxable,CAL)-credit)+Math.max(0,taxable-1000000)*.01;
   if(!business)payroll+=gross*.012;
  }
  const extraState=root.LAYERS_DATA?.taxes?.[s.place];
  if(extraState){
   let deduction=extraState.deduction;
   if(extraState.exemptionCutoff&&agi>extraState.exemptionCutoff)deduction=0;
   if(extraState.deductionCutoff&&agi>extraState.deductionCutoff)deduction=extraState.highIncomeDeduction;
   const taxable=Math.max(0,agi-deduction);
   state=extraState.brackets?progressive(taxable,extraState.brackets):taxable*extraState.rate;
   if(!business&&extraState.payrollRate)payroll+=Math.min(gross,extraState.payrollCap)*extraState.payrollRate;
   if(extraState.local&&s.localOverride==='')missing.push('Enter total city/county income or occupational tax for this location (0 only if none applies).');
   warnings.push(extraState.note);
  }
  if(['Alaska','Washington'].includes(s.place)&&s.payrollOverride==='')missing.push('Enter your total payroll/social contributions for this state; its state-specific payroll programs are not modeled.');
  if(state===null&&s.stateOverride==='')missing.push('Enter annual state income tax. This state does not yet have a verified automatic tax model.');
  if(!extraState&&!zeroStates.includes(s.place)&&!['New York','Oklahoma','California'].includes(s.place)&&s.payrollOverride==='')missing.push('Enter total payroll/social contributions, including any state disability or paid-leave premiums.');
  if(!extraState&&!zeroStates.includes(s.place)&&!['New York','Oklahoma','California'].includes(s.place)&&s.localOverride==='')missing.push('Enter local income/business tax (0 only if none applies).');
  warnings.push('Single, under 65, full-year resident; standard deduction. No itemized/SALT deductions, retirement contributions, investment income, tax credits or cross-border tax rules. Use tax overrides for a personalized calculation.');
  if(business)warnings.push('Sole-proprietor model: no corporation, QBI deduction or state pass-through election. At lower physician incomes, omitting QBI may overstate federal tax.');
  if(business&&s.place!=='New York'&&s.localOverride==='')missing.push('Enter applicable local/other business taxes, including any gross-receipts taxes (0 only if none applies).');
  if(s.place==='New York')warnings.push('NYC resident tax applies only when selected. NY PFL is included for employees; any disability deduction or other local tax belongs in the overrides.');
 }else{
  if(s.place==='QC'){
   federal=null;payroll=null;
   if(s.federalOverride==='')missing.push('Enter federal tax after the Quebec abatement.');
   if(s.stateOverride==='')missing.push('Enter Quebec income tax plus applicable health-services/drug-plan contributions.');
   if(s.payrollOverride==='')missing.push('Enter QPP, QPIP and any EI contributions. Quebec is a manual-tax scenario.');
  }else{
   const contributionBase=clamp(profit-3500,0,67800);
   const baseCPP=contributionBase*.0495,enhanced=contributionBase*.01+clamp(profit-71300,0,9900)*.04;
   const cpp=(baseCPP+enhanced)*(business?2:1),ei=business?0:Math.min(profit,65700)*.0164;
   payroll=cpp+ei;agi=profit-enhanced*(business?2:1)-(business?baseCPP:0);
   const fedBpa=16129-(16129-14538)*clamp((agi-177882)/(253414-177882),0,1);
   federal=Math.max(0,progressive(agi,FED_CA)-.145*(fedBpa+baseCPP+ei+(business?0:Math.min(profit,1471))));
   const p=data.caTax[s.place];let bpa=p.bpa;
   if(s.place==='MB')bpa*=1-clamp((agi-200000)/200000,0,1);
   state=Math.max(0,progressive(agi,p.brackets)-p.brackets[0][1]*(bpa+baseCPP+ei));
   if(s.place==='ON')state+=Math.max(0,state-5710)*.20+Math.max(0,state-7307)*.36+healthON(agi);
   if(agi<50000)warnings.push('Below CAD 50,000 taxable income: low-income reductions and refundable credits are omitted; replace tax totals for an accurate low-income result.');
  }
  warnings.push('Full-year resident, under 65; sole proprietor or employee. No corporation/dividend strategy, RRSP, tuition, spouse/dependant credits or cross-border rules. Self-employed EI is not assumed.');
 }
 for(const [key,name] of [['federalOverride','federal'],['stateOverride','state'],['payrollOverride','payroll'],['localOverride','local']]){
  if(s[key]!==''&&s[key]!=null){let v=Number(s[key]);if(!Number.isFinite(v)||v<0)missing.push('Tax overrides must be non-negative annual amounts.');else{if(name==='federal')federal=v;if(name==='state')state=v;if(name==='payroll')payroll=v;if(name==='local')local=v;}}
 }
 if(Number(s.reimbursement)>Number(s.liability))warnings.push('Reimbursement exceeds the entered liability cost; liability expense is floored at zero.');
 if(['federalOverride','stateOverride','payrollOverride','localOverride'].some(k=>s[k]!==''&&s[k]!=null))warnings.push('Entered tax overrides are fixed amounts. They do not recalculate when you change income or expenses.');
 const valid=!missing.length;
 const tax=(federal??0)+(state??0)+local;
 const cash=valid?gross-practice-personal-tax-payroll:null;
 return {valid,missing,warnings,gross,overhead,liability,professional,practice,personal,profit,agi,federal,state,payroll,local,tax,cash};
}
function power(s,result,data=root.PAY_DATA){
 if(!result.valid)return null;
 if(s.country==='US'){
  const metro=data.metro.find(m=>m.name===s.priceArea);const index=metro?.index??data.rpp[s.place];
  return {value:result.cash/(index/100),index,label:'U.S.-average-price dollars',area:metro?.name??s.place,kind:'rpp'};
 }
 const basket=data.mbm.find(m=>m.name===s.priceArea);const toronto=data.mbm.find(m=>m.name==='Toronto, Ontario');
 if(!basket)return null;
 return {value:result.cash*toronto.basket/basket.basket,index:basket.basket/toronto.basket*100,label:'Toronto-basket-equivalent CAD',area:basket.name,kind:'mbm',basket:basket.basket};
}
function localPrice(s,data=root.PAY_DATA,model=root.MODEL_DATA){
 const ca=s.country==='CA';
 const basket=ca?data.mbm.find(m=>m.name===s.priceArea):null;
 const metro=ca?null:data.metro.find(m=>m.name===s.priceArea);
 const reference=Number(s.referenceBasket||model.referenceBasket);
 let factor=ca?(basket?basket.basket/reference:null):(metro?.index??data.rpp[s.place])/100;
 if(s.priceOverride!==''&&s.priceOverride!=null)factor=Number(s.priceOverride)/100;
 if(!Number.isFinite(factor)||factor<=0||factor>10||!Number.isFinite(reference)||reference<=0)return null;
 const ppp=ca?data.ppp:1;
 const adjustment=Number(s.priceAdjustment??0);
 if(!Number.isFinite(adjustment)||adjustment<=-100||adjustment>500)return null;
 return {factor,ppp,unit:ppp*factor*(1+adjustment/100),index:100*factor,area:ca?basket?.name??s.priceArea:metro?.name??s.place,reference,basket:basket?.basket,custom:s.priceOverride!==''&&s.priceOverride!=null,adjustment};
}
function commonPower(s,result,data=root.PAY_DATA,model=root.MODEL_DATA){
 if(!result.valid)return null;
 const price=localPrice(s,data,model);if(!price)return null;
 return {...price,value:result.cash/price.unit,national:result.cash/price.ppp};
}
function cmpa(s,model=root.MODEL_DATA){const mapping=model.cmpaMap[s.specialty];if(!mapping)return null;const region=s.place==='QC'?0:s.place==='ON'?1:['BC','AB'].includes(s.place)?2:3;return {code:mapping[0],fee:model.cmpaGroups[mapping[1]][region]};}
root.PayEngine={calc,power,localPrice,commonPower,cmpa,progressive,nyTax,healthON,zeroStates};
if(typeof module!=='undefined')module.exports=root.PayEngine;
})(globalThis);
