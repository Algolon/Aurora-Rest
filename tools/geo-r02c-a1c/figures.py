"""MEASURED: feasibility figure for GEO-R02C-A1c from feasibility.json (upper bound, no terrain generated) and evidence-s1.json
(actual S1 terrain). Left: what forms the North Peak skyline per viewpoint (frozen by the trial rules vs raise-eligible).
Right: maximum skyline shift in screen pixels at review size, +25 m upper bound vs S1 as built.
Output: docs/geo-r02c-a1c/images/feasibility.svg"""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-a1c'
f=json.loads((DOC/'feasibility/feasibility.json').read_text());e=json.loads((DOC/'data/evidence-s1.json').read_text())
ORDER=['birchwood','valley-shoulder','west-coast','high-tarn','tarn-overlook','tarn-shore','approach-mid','upper-trail','oblique-se','oblique-n']
INK,SEC,MUT,GRID,AX,SURF='#0b0b0b','#52514e','#898781','#e1e0d9','#c3c2b7','#fcfcfb'
FROZEN,CREST,SHOULDER,UB,S1='#b9b7ad','#1baf7a','#eda100','#2a78d6','#eb6834'
W,ROW,TOP,LX=1200,34,92,250;P1=(LX,LX+320);P2=(LX+430,W-110);XMAX=60
o=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {TOP+ROW*len(ORDER)+76}" font-family="DejaVu Sans,Arial,sans-serif" font-size="12">',
 f'<rect width="100%" height="100%" fill="{SURF}"/>',
 f'<text x="16" y="24" font-size="16" font-weight="bold" fill="{INK}">North Peak silhouette feasibility under the R-B trial envelope (+25 m, raise-only)</text>',
 f'<text x="16" y="44" fill="{SEC}">Measured on R1 and on the generated S1 terrain. Pixels at the review size (60° vertical FOV over 800 px).</text>',
 f'<text x="{P1[0]}" y="74" font-weight="bold" fill="{INK}">What forms the skyline (% of its width)</text>',
 f'<text x="{P2[0]}" y="74" font-weight="bold" fill="{INK}">Maximum skyline shift (px)</text>']
for n,(lab,c) in enumerate((('frozen: summit dome, trail corridor, frozen crest',FROZEN),('eligible crest',CREST),('eligible shoulder',SHOULDER))):
 o.append(f'<rect x="{P1[0]+n*0 }" y="{TOP+ROW*len(ORDER)+14+n*16}" width="10" height="10" rx="2" fill="{c}"/><text x="{P1[0]+16}" y="{TOP+ROW*len(ORDER)+23+n*16}" fill="{SEC}">{lab}</text>')
for n,(lab,c) in enumerate((('+25 m upper bound (every eligible point lifted the full 25 m)',UB),('S1 as built (after flow and drainage guarantees)',S1))):
 o.append(f'<rect x="{P2[0]}" y="{TOP+ROW*len(ORDER)+14+n*16}" width="10" height="10" rx="2" fill="{c}"/><text x="{P2[0]+16}" y="{TOP+ROW*len(ORDER)+23+n*16}" fill="{SEC}">{lab}</text>')
sx=lambda v:P2[0]+(P2[1]-P2[0])*min(v,XMAX)/XMAX
for t in range(0,XMAX+1,10):o.append(f'<line x1="{sx(t)}" x2="{sx(t)}" y1="{TOP-6}" y2="{TOP+ROW*len(ORDER)}" stroke="{GRID}"/><text x="{sx(t)}" y="{TOP+ROW*len(ORDER)+10}" fill="{MUT}" text-anchor="middle" font-size="10">{t}</text>')
for n,k in enumerate(ORDER):
 v=f['viewpoints'][k];y=TOP+n*ROW;comp=v['skylineFormedByPct'];fr=sum(x for a,x in comp.items() if 'frozen' in a);cr=comp.get('eligible crest',0);sh=comp.get('eligible shoulder',0)
 o.append(f'<text x="16" y="{y+14}" fill="{INK}">{v["name"]}</text><text x="16" y="{y+27}" fill="{MUT}" font-size="10">{v["distanceToSummitM"]/1000:.1f} km to summit</text>')
 x=P1[0];span=P1[1]-P1[0]
 for val,c,lab in ((fr,FROZEN,'frozen'),(cr,CREST,'eligible crest'),(sh,SHOULDER,'eligible shoulder')):
  w=span*val/100
  if w>2:o.append(f'<rect x="{x:.1f}" y="{y+4}" width="{w-2:.1f}" height="18" rx="3" fill="{c}"><title>{v["name"]}: {lab} {val:.1f} %</title></rect>')
  x+=w
 o.append(f'<text x="{P1[1]+6}" y="{y+17}" fill="{SEC}" font-size="11">{fr:.0f} % frozen</text>')
 ub=v['envelopeShiftPx']['max'];s1=e['skylines'][k]['maxShiftPx']
 for val,c,dy,lab in ((ub,UB,4,'upper bound'),(s1,S1,15,'S1')):
  o.append(f'<line x1="{P2[0]}" x2="{P2[1]}" y1="{y+dy+4}" y2="{y+dy+4}" stroke="transparent" stroke-width="10"><title>{v["name"]}: {lab} {val} px</title></line>')
  o.append(f'<rect x="{P2[0]}" y="{y+dy}" width="{max(sx(val)-P2[0],1):.1f}" height="9" rx="2" fill="{c}"><title>{v["name"]}: {lab} {val} px</title></rect>')
  o.append(f'<text x="{sx(val)+5:.1f}" y="{y+dy+8}" fill="{SEC}" font-size="10">{val:g}{" (clipped)" if val>XMAX else ""}</text>')
o.append(f'<text x="16" y="{TOP+ROW*len(ORDER)+68}" fill="{MUT}" font-size="10">Upper trail: the 108.7 px bound comes from shoulder points 76 m away over 3.3° of width only (p90 = 0 px).</text>')
o.append(f'<line x1="{P2[0]}" x2="{P2[0]}" y1="{TOP-6}" y2="{TOP+ROW*len(ORDER)}" stroke="{AX}"/></svg>')
(DOC/'images/feasibility.svg').write_text('\n'.join(o)+'\n');print('feasibility.svg')
