"""Build portable gallery and exact spatial mismatch diagnostics from real renderer readbacks."""
from pathlib import Path
import json,hashlib,html
import numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path('docs/env-p01');ev=root/'evidence';r=json.loads((ev/'runtime.json').read_text())
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
summary=[]
for dataset in r['diagnostics']:
 view=dataset['view'];points=dataset['points'];counts={};flags=[]
 for p in points:
  f=p['family'];w=p['ground']['weights'];counts.setdefault(f,{'total':0,'meadowDominant':0,'bedrockDominant':0,'forestBelowHalf':0});q=counts[f];q['total']+=1
  if p['ground']['dominant']=='meadow-turf':q['meadowDominant']+=1
  if p['ground']['dominant']=='bedrock':q['bedrockDominant']+=1
  if w['forest-floor']<.5:q['forestBelowHalf']+=1
  mismatch=(f in ['birch','pine'] and w['meadow-turf']>.5) or (f=='grass' and w['bedrock']>.5)
  if mismatch:flags.append(p['id'])
 trees=np.array([[p['x'],p['z']] for p in points if p['family'] in ['birch','pine']]);probes=[p for p in points if p['family']=='grass'];open_floor=0
 for p in probes:
  if len(trees) and p['ground']['weights']['forest-floor']>.65 and np.min(np.sum((trees-np.array([p['x'],p['z']]))**2,axis=1))>12**2:open_floor+=1
 summary.append({'forestFloorInLowTreeOccupancyProbes':open_floor,'openProbeDefinition':'Grass descriptor with >65% forest floor and no active tree center within 12m. Occupancy proxy only; not a canopy or glade boundary.', 'view':view,'counts':counts,'mismatchCount':len(flags),'mismatchIds':flags,'definition':'Tree on >50% meadow or grass on >50% bedrock. Diagnostic threshold, not automatic invalid placement.'})
 if view=='forest-landscape':
  im=Image.new('RGB',(1000,1000),'#202b29');d=ImageDraw.Draw(im);xs=[p['x'] for p in points];zs=[p['z'] for p in points];west=min(xs)-4;north=max(zs)+4;span=max(max(xs)-west,north-min(zs))+4
  colors={'forest-floor':'#465237','meadow-turf':'#99ac60','coastal-sand':'#c3b492','bedrock':'#868b8c'}
  for p in points:
   x=40+(p['x']-west)/span*900;y=70+(north-p['z'])/span*850;d.ellipse((x-3,y-3,x+3,y+3),fill=colors[p['ground']['dominant']])
   if p['family'] in ['birch','pine']:d.ellipse((x-4,y-4,x+4,y+4),outline='#ffffff')
   if p['id'] in flags:d.line((x-5,y-5,x+5,y+5),fill='#ff7369',width=2);d.line((x-5,y+5,x+5,y-5),fill='#ff7369',width=2)
  d.text((30,15),'MAT / POP mismatch map — data diagnostic, not a WebGL render',font=font,fill='white')

  for i,(name,color) in enumerate(colors.items()):d.rectangle((30+i*235,45,44+i*235,59),fill=color);d.text((50+i*235,44),name,font=small,fill='white')
  d.text((30,940),'White ring: tree | red cross: flagged disagreement | north up | x east / z north',font=small,fill='white')
  d.text((30,965),f'west {west:.1f} m / north {north:.1f} m / span {span:.1f} m | '+str(len(flags))+' flags',font=small,fill='white')
  im.save(ev/'ecological-mismatch-map.png')
(root/'ecological-mismatches.json').write_text(json.dumps(summary,indent=2))
views=['forest-landscape','forest-interior','forest-edge','forest-close-birch','forest-close-grass','forest-corridor','valley-landscape']
thumbw=560;thumbh=385
sheet=Image.new('RGB',(thumbw*2, (thumbh+40)*len(views)+50),'#142126');d=ImageDraw.Draw(sheet);d.text((16,12),'ENV-P01 | Original POP neutral / Faithful MAT-01 | genuine WebGL',font=font,fill='white')
for row,v in enumerate(views):
 for col,mode in enumerate(['neutral','faithful']):
  p=ev/(v+'-'+mode+'.png')
  if not p.exists():continue
  im=Image.open(p).convert('RGB');im.thumbnail((thumbw,thumbh));sheet.paste(im,(col*thumbw,50+row*(thumbh+40)));d.text((col*thumbw+12,50+row*(thumbh+40)+thumbh+7),v+' / '+mode,font=small,fill='white')
sheet.save(ev/'contact-sheet.jpg',quality=92)
files=[]
for p in sorted(ev.rglob('*.png')):files.append({'path':str(p.relative_to(root)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'width':Image.open(p).width,'height':Image.open(p).height})
(root/'capture-manifest.json').write_text(json.dumps({'source':r['source'],'files':files,'capture':'Real Three.js/WebGL canvas readback; ecological map explicitly data-only'},indent=2))
css='body{margin:0;background:#122025;color:#eef2e9;font:16px system-ui}main{max-width:1500px;margin:auto;padding:30px}h1{font-size:34px}p{max-width:1000px;line-height:1.6}a{color:#c6df97}section{margin:36px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}img{width:100%;display:block}figure{margin:0}figcaption{padding:10px;background:#24383b}code{overflow-wrap:anywhere}nav{display:flex;gap:24px;flex-wrap:wrap}'
s='<html><head><meta charset="utf-8"><title>Aurora Rest — ENV-P01 review</title><style>'+css+'</style></head><body><main><p><strong>Source-history delivery blocked after resume.</strong> Renderer and source snapshot preserved. See <a href="RECOVERY_STATUS.md">recovery status</a> and <a href="REVIEW_ADDENDUM.md">Gate A/B/C assessment</a>.</p><h1>ENV-P01 · Birchwood ground & nature</h1><p>Believable Nature, Sculpted for Wonder. Faithful integration of original POP-02A nature and MAT-01 ground on canonical geography. Art approval remains an owner decision.</p><p>1600 × 1100 lossless PNGs captured from genuine Three.js/WebGL2. SwiftShader software rendering; no Android performance claim. Placement and terrain unchanged. No optional lookdev candidate retained.</p><nav>'+''.join('<a href="'+p+'">'+p+'</a>' for p in ['REVIEW_ADDENDUM.md','RECOVERY_STATUS.md','mat-source-evidence/index.html','INTEGRATION.md','VISUAL_REVIEW.md','PERFORMANCE.md','NEXT_STEPS.md','evidence/runtime.json','ecological-mismatches.json'])+'</nav>'
for v in views:
 s+='<section><h2>'+html.escape(v)+'</h2><div class="pair">'
 for mode in ['neutral','faithful']:
  p='evidence/'+v+'-'+mode+'.png';s+='<figure><a href="'+p+'"><img loading="lazy" src="'+p+'"></a><figcaption>'+mode+'</figcaption></figure>'
 s+='</div></section>'
s+='<section><h2>Walking-height contact sheet</h2><img src="evidence/walking-height-contact-sheet.jpg"><h2>Elevated transition comparison</h2><img src="evidence/elevated-transition-comparison.jpg"><h2>Projected discrepancy overlay</h2><img src="evidence/ecological-overlay.png"></section>'
s+='<section><h2>Ecological classifications</h2><div class="pair"><img src="evidence/forest-overhead-weights.png"><img src="evidence/ecological-mismatch-map.png"></div><p>Left: genuine WebGL classification view. Right: spatial data visualization; red crosses indicate threshold disagreements, not invalid placements.</p></section><section><h2>Reproducible camera replay</h2><p>Five recorded route samples near Birchwood. Segmented visual replay, not real-time FPS; no physical tree or rock collision.</p>'
for i in range(5):s+='<a href="evidence/walking/frame-'+str(i)+'.png"><img loading="lazy" src="evidence/walking/frame-'+str(i)+'.png"></a>'
s+='</section><section><h2>Outward ecotone review</h2><div class="pair"><img src="evidence/forest-ecotone-outward-neutral.png"><img src="evidence/forest-ecotone-outward-faithful.png"></div></section>'
s+='<section><h2>Forest to meadow camera replay</h2>'
for i in range(5):s+='<img loading="lazy" src="evidence/walking/ecotone-'+str(i)+'.png">'
s+='</section><p>Source: <code>'+r['source']+'</code>. See package SOURCE.json for the preserved snapshot and Git recovery blocker.</p></main></body></html>'
(root/'review.html').write_text(s)
print('Gallery, contact sheet and diagnostic report written')
