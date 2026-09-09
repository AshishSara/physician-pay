from pathlib import Path
import json,re
root=Path(__file__).resolve().parent
lines=json.loads((root/'hud-lines.json').read_text())
states={s.upper():s for s in 'Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|District of Columbia|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming'.split('|')}
rows=[];state=None;nonmetro=False
for key,line in sorted(lines.items(),key=lambda x:int(x[0])):
 text=line.strip();header=text.replace(' continued','')
 if header in states:state=states[header];continue
 if text in ['AMERICAN SAMOA','GUAM','NORTHERN MARIANA ISL','PUERTO RICO','VIRGIN ISLANDS']:state=None
 if text.startswith('NONMETROPOLITAN COUNTIES'):nonmetro=True
 elif text.startswith('METROPOLITAN FMR AREAS'):nonmetro=False
 if not state:continue
 for m in re.finditer(r'(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)',text):
  name=m[1].strip().rstrip('.');rents=[int(m[i]) for i in range(2,7)]
  if nonmetro:name+=' (nonmetro county / equivalent)'
  assert len(name)<130,(state,name)
  rows.append({'state':state,'area':name,'rents':rents,'line':int(key),'revised':False})
# Restore four names truncated at the print schedule column edge.
for r in rows:
 r['area']=r['area'].replace('Nashville-Davidson--Murfreesboro--Franklin, TN HMF','Nashville-Davidson--Murfreesboro--Franklin, TN HMFA')
# Apply every April 28, 2025 revision in HUD's Federal Register table.
rev=[]
for m in re.finditer(r'^L\d+: (.+?)\s+\|\s+\$?([\d,]+)\s+\|\s+\$?([\d,]+)\s+\|\s+\$?([\d,]+)\s+\|\s+\$?([\d,]+)\s+\|\s+\$?([\d,]+)',(root/'hud-revisions.txt').read_text(),re.M):
 name=m[1];vals=[int(m[i].replace(',','')) for i in range(2,7)];name=name.replace('HUD Metro FMR Area','HMFA')
 if name.endswith('County, MT'):matches=[r for r in rows if r['state']=='Montana' and r['area'].split(' (')[0]==name.replace(' County, MT','')]
 else:matches=[r for r in rows if r['area']==name]
 assert matches,(name,vals)
 for r in matches:r['rents']=vals;r['revised']=True
 rev.append(name)
assert len(states)==len(set(r['state'] for r in rows))
keys=[(r['state'],r['area']) for r in rows];assert len(keys)==len(set(keys))
assert all(all(100<=n<=20000 for n in r['rents']) for r in rows)
rows.sort(key=lambda r:(r['state'],r['area']))
(root/'housing-us.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('HUD areas',len(rows),'states/DC',len(set(r['state'] for r in rows)),'revised areas',len(rev))
for s in ['Oklahoma','New York','Massachusetts','Montana']:
 print(s,[(r['area'],r['rents'][2]) for r in rows if r['state']==s][:4])
