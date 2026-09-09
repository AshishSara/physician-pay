from pathlib import Path
import zipfile,re,sys
from html.parser import HTMLParser
root=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'release';out.mkdir(parents=True,exist_ok=True)
html=(root/'dist/index.html').read_text()
class Check(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.assets=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if t=='script' and 'src' in a:self.assets.append(a['src'])
  if t=='link' and a.get('rel')=='stylesheet':self.assets.append(a['href'])
c=Check();c.feed(html);assert len(c.ids)==len(set(c.ids))
for f in c.assets:assert (root/'dist'/f).is_file(),f
for name in [x.removeprefix('./') for x in c.assets if x.endswith('.js')]:
 html=html.replace(f'<script src="./{name}"></script>','<script>\n'+(root/'dist'/name).read_text().replace('</script','<\\/script')+'\n</script>')
html=html.replace('<link rel="stylesheet" href="./style.css">','<style>\n'+(root/'dist/style.css').read_text()+'\n</style>')
assert not re.search(r'<script[^>]*src=',html)
(out/'Physician-Pay.html').write_text(html)
with zipfile.ZipFile(out/'Physician-Pay-Website.zip','w',zipfile.ZIP_DEFLATED) as z:
 z.write(out/'Physician-Pay.html','index.html')
 for f in sorted((root/'dist').iterdir()):z.write(f,'dist/'+f.name)
 for f in ['tests.cjs','tests-model.cjs','tests-benchmarks.cjs','tests-planner.cjs','PHYSICIAN-PAY.md','PUBLISH.md']:
  source=root/f
  if f=='PHYSICIAN-PAY.md' and not source.exists():source=root/'README.md'
  z.write(source,'README.md' if f=='PHYSICIAN-PAY.md' else f)
 for f in ['anchors.json','build-model.py','build-housing.py','build-layers.py','housing-us.json','hud-lines.json','hud-revisions.txt','RESEARCH-NOTES.md']:
  z.write(root/'research'/f,'research/'+f)
 z.write(root/'package.py','package.py')
 z.writestr('.nojekyll','')
 z.writestr('VERSION.txt','Version 4 · 2026-09-09\nStatic GitHub Pages upload package; index.html is standalone.\n')
# Parse the final file and verify that every bundled script is syntactically valid separately.
for i,code in enumerate(re.findall(r'<script>(.*?)</script>',html,re.S)):
 import subprocess,tempfile
 with tempfile.NamedTemporaryFile('w',suffix='.js') as f:
  f.write(code);f.flush();subprocess.run(['node','--check',f.name],check=True)
print('PASS: unique static IDs, all local assets present, standalone scripts parse, complete source ZIP.')
for f in out.iterdir():print(f.name,f.stat().st_size)
