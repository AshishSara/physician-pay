"""Build price calibration from official 2024 basket and July 2024 population rows.
Inputs copied with the project as research/anchors.json; re-run without downloads.
"""
import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]
a=json.loads((p/'research/anchors.json').read_text())
a['referenceBasket']=sum(r['population']*r['basket'] for r in a['anchors'])/sum(r['population'] for r in a['anchors'])
(p/'dist/model-data.js').write_text('globalThis.MODEL_DATA = '+json.dumps(a,ensure_ascii=False,indent=2)+';\n')
print('Canadian model reference basket:',a['referenceBasket'])
