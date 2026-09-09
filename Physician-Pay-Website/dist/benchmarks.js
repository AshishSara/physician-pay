/* Published medians only. Never turn suppressed/top-coded values into a numeric median. */
(function(root){
'use strict';
const stateCodes={'Anesthesia':'29-1211','Cardiology':'29-1212','Dermatology':'29-1213','Emergency medicine':'29-1214','Family medicine':'29-1215','Internal medicine':'29-1216','Neurology':'29-1217','Obstetrics/gynecology':'29-1218','Pediatrics':'29-1221','Pathology':'29-1222','Psychiatry':'29-1223','Radiology':'29-1224','Physicians — all other':'29-1229','Ophthalmology':'29-1241','Orthopedic surgery':'29-1242','Pediatric surgery':'29-1243','Surgeons — all other':'29-1249'};
const amgaAliases={'Pediatrics':'Pediatrics — general','Obstetrics/gynecology':'Obstetrics and gynecology'};
const blsAliases={'Pediatrics — general':'Pediatrics','Obstetrics and gynecology':'Obstetrics/gynecology'};
const sources={ca:'https://www.cihi.ca/sites/default/files/document/npdb-payments-data-tables-2023-en.xlsx',amga:'https://amga.org/about-amga/newsroom/press-releases/2025/june/new-amga-survey-notes-significant-gains-in-physician-compensation',bls:'https://www.bls.gov/oes/special-requests/oesm25st.zip'};
function specialties(country,d=root.PAY_DATA){return [...new Set([...d.ca.map(r=>r.specialty),...(country==='US'?[...d.amga.map(r=>r[0]),...Object.keys(stateCodes)]:[])])].sort();}
function normalize(spec,country,d=root.PAY_DATA){const list=specialties(country,d);if(list.includes(spec))return spec;const alias=blsAliases[spec];return list.includes(alias)?alias:'Family medicine';}
function get(s,d=root.PAY_DATA){
 if(s.country==='CA'){
  const r=d.ca.find(x=>x.province===s.place&&x.specialty===s.specialty),value=typeof r?.median==='number'&&Number.isFinite(r.median)&&r.median>0?r.median:null;
  return {value,kind:'business',quality:'clinical-gross',badge:'Provincial gross clinical median',scope:d.provinces[s.place],year:'2023–24',url:sources.ca,range:value&&typeof r.p40==='number'&&typeof r.p60==='number'?[r.p40,r.p60]:null,note:value?`CIHI ${d.provinces[s.place]} ${s.specialty}: gross payments before practice expenses, not a salary or full-time-only cohort.${s.place==='ON'?' Ontario payments are underreported.':''}${s.place==='PE'?' Includes short-term/locum payees.':''}`:`No numeric total-clinical median is published for ${s.specialty} in ${d.provinces[s.place]} in this dataset. Choose custom income to enter an offer; a missing figure is never zero.`};
 }
 const mode=s.benchmarkBasis||'auto',amga=d.amga.find(r=>r[0]===(amgaAliases[s.specialty]||s.specialty));
 if(mode!=='state'&&amga)return {value:amga[1],kind:'employee',quality:'national-group',badge:'National compensation median',scope:'United States · participating medical groups',year:'2024 compensation',url:sources.amga,note:`AMGA ${amga[0]} median. This is a national medical-group benchmark, not a measured ${s.place} median. State selection changes taxes and prices; the national pay figure stays the same. Not a guaranteed starting salary.`};
 const code=stateCodes[blsAliases[s.specialty]||s.specialty],row=d.us.find(r=>r.state===s.place&&r.code===code),text=String(row?.median??'').replaceAll(',',''),value=/^\d+(\.\d+)?$/.test(text)&&Number(text)>0?Number(text):null;
 if(mode!=='national'&&value)return {value,kind:'employee',quality:'broad-state-wage',badge:'State wage median · broader workforce',scope:s.place,year:'May 2025',url:sources.bls,note:`BLS ${s.place}: ${row.specialty}. Includes trainees and mixed career stages; excludes self-employed physicians and some compensation. This is not an attending-only salary estimate.${mode==='auto'?' No AMGA median is available here; this is the broader state-wage fallback.':''}`};
 return {value:null,kind:'employee',quality:'unavailable',badge:'No numeric median available',scope:s.place,year:mode==='national'?'2024 compensation':'May 2025 / 2024 compensation',url:mode==='national'?sources.amga:sources.bls,note:`No usable ${mode==='national'?'AMGA national':'numeric published'} median is available for this selection.${text==='#'?' The BLS result is a lower bound, not an exact median.':''} Enter a custom offer or choose another benchmark source. The previous specialty’s income is cleared.`};
}
function apply(s,d=root.PAY_DATA){const b=get(s,d);s.incomeMode='benchmark';s.kind=b.kind;s.gross=b.value===null?'':Math.round(b.value);s.source=`${b.badge} · ${b.year}. ${b.note}`;return b;}
root.PayBenchmarks={get,apply,specialties,normalize};if(typeof module!=='undefined')module.exports=root.PayBenchmarks;
})(globalThis);
