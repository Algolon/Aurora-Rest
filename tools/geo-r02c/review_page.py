"""Build docs/geo-r02c-p0/review.html: a static gallery of the matched P0 captures (relative paths, no server needed)."""
from pathlib import Path
import html,json,sys
sys.path.insert(0,str(Path(__file__).resolve().parent/'lib'))
from common import ROOT

DOC=ROOT/'docs/geo-r02c-p0';man=json.loads((DOC/'captures/capture-manifest.json').read_text());cams={c['id']:c for c in json.loads((ROOT/'tools/geo-r02c/cameras.json').read_text())['cameras']}
inv=json.loads((DOC/'captures/default-viewer-identity.json').read_text()) if (DOC/'captures/default-viewer-identity.json').exists() else None
modes=['standard','clayA','clayB'];label={'standard':'Standard (R1 material)','clayA':'Clay · sun A (WNW 18°)','clayB':'Clay · sun B (SE 35°)'}
by={(c['mode'],c['view']):c for c in man['captures']}
views=[];[views.append(c['view']) for c in man['captures'] if c['view'] not in views]
groups={'R1 matched views':[v for v in views if v not in cams]}
for v in views:
 if v in cams:groups.setdefault({'reveal-central-valley':'Hero reveal 01 · Central Valley approach','reveal-cairn':'Hero reveal 02 · Cairn ascent','reveal-hidden-fold':'Secret reveal 03 · Hidden Fold','silhouette-north-peak':'North Peak silhouettes'}[cams[v]['group']],[]).append(v)
rows=[]
for g,vs in groups.items():
 rows.append(f'<h2>{html.escape(g)}</h2>')
 for v in vs:
  meta=cams.get(v);sub=html.escape(meta['name']+' — '+meta['source']) if meta else 'R1 review camera (unchanged specification)'
  cells=''.join(f'<figure><a href="captures/{by[(m,v)]["file"]}"><img loading="lazy" src="captures/{by[(m,v)]["file"]}" alt="{html.escape(v)} {m}"></a><figcaption>{label[m]}</figcaption></figure>' for m in modes if (m,v) in by)
  rows.append(f'<section><h3>{html.escape(v)}</h3><p class="sub">{sub}</p><div class="grid">{cells}</div></section>')
idline=('<p><b>Default viewer unchanged:</b> '+html.escape(inv['summary'])+'</p>') if inv else ''
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GEO-R02C-P0 review</title>
<style>:root{{--bg:#eceeea;--fg:#1f2a29;--muted:#5b6563;--card:#fff;--line:#d4d8d3}}@media (prefers-color-scheme:dark){{:root{{--bg:#151a1a;--fg:#e6ebe9;--muted:#9aa6a3;--card:#1f2626;--line:#2e3736}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}}main{{max-width:1500px;margin:auto;padding:16px}}
.note{{background:var(--card);border-left:4px solid #c08a2e;padding:10px 14px}}.sub{{color:var(--muted);margin:.2em 0 .6em}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}}figure{{margin:0;background:var(--card);border:1px solid var(--line)}}img{{width:100%;display:block}}figcaption{{padding:4px 8px;color:var(--muted);font-size:13px}}
section{{margin:18px 0}}h3{{margin:.2em 0}}</style></head><body><main>
<h1>Aurora Rest · GEO-R02C-P0 baseline renders</h1>
<p class="note">Canonical R1 terrain (SHA-256 <code>fc8fd6da…1f946a</code>), unchanged. Actual Chromium WebGL screenshots of the Three.js viewer ({html.escape(man['browser'])}, {html.escape(man['captures'][0]['renderer'])}), unretouched, {man['viewport']['width']}×{man['viewport']['height']}.
The UI overlay is hidden by CSS for these captures. Clay modes are opt-in review renders; geometry is identical in all three columns. No terrain was sculpted in P0.</p>{idline}
<p><a href="README.md">P0 report</a> · <a href="convergence.md">Convergence</a> · <a href="reproducibility.md">Reproducibility</a> · <a href="captures/capture-manifest.json">Capture manifest</a></p>
{''.join(rows)}</main></body></html>'''
(DOC/'review.html').write_text(page);print('wrote',DOC/'review.html',len(man['captures']),'captures')
