"""A1-D v1 annotated design maps (DESIGN TARGETS drawn over the approved A-R1 map and over the R1 clay hillshade).
Line style encodes status: solid = proposed, dashed = conditional, dotted = option, grey = deferred / not recommended.
Outputs: images/overlay-v1-on-ar1.svg, images/overlay-v1-on-r1-clay.svg (rasterise with render_png.mjs)."""
from a1d_common import *
import math
from shapely.ops import substring
C=concept('v1');f=features();Hh=terrain();HYD=json.loads((DATA/'hydrology-north-sources.json').read_text())
WIN=json.loads((DATA/'window-v2-proposed.json').read_text())
def P(pts):return ' '.join(f'{to_px(x,z)[0]:.1f},{to_px(x,z)[1]:.1f}' for x,z in pts)
def T(x,z,txt,col,size=11,dx=4,dy=4,w=700,anchor=''):
 q=to_px(x,z);a=f' text-anchor="{anchor}"' if anchor else ''
 return f'<text x="{q[0]+dx:.1f}" y="{q[1]+dy:.1f}" font-size="{size}" font-weight="{w}" fill="{col}" stroke="#fff" stroke-width="3" paint-order="stroke"{a}>{txt}</text>'
DASH={'proposed':'','conditional':' stroke-dasharray="7 4"','option':' stroke-dasharray="2 3"','deferred':' stroke-dasharray="5 4"','not-recommended':' stroke-dasharray="3 3"','fixed':''}
GREY='#78716c';COL={'route':'#b4482f','cirque':'#c2410c','arete':'#7c2d12','buttress':'#9a3412','gully':'#0e7490','shoulder':'#a16207','window':'#111827','cam':'#6d28d9','frozen':'#2f6fb0','anom':'#dc2626'}
def ell(x,z,rx,rz):q=to_px(x,z);return q,rx*PX,rz*PX
def layer(base):
 o=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H+150}" width="{W}" height="{H+150}" font-family="system-ui,sans-serif">',
  f'<rect width="{W}" height="{H+150}" fill="#fffdf9"/><image href="{base}" xlink:href="{base}" x="0" y="0" width="{W}" height="{H}"/>',
  '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#2f6fb0" stroke-width="1.4" opacity=".55"/></pattern>'
  '<marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#0e7490"/></marker>'
  f'<clipPath id="mapclip"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath></defs><g clip-path="url(#mapclip)">']
 co=coast();clip=Polygon([(X0,Z0),(X1,Z0),(X1,Z1),(X0,Z1)])
 band=co.difference(co.buffer(-150)).intersection(clip);taper=co.buffer(-150).difference(co.buffer(-300)).intersection(clip)
 for g,fill,op in ((band,'url(#hatch)',1),(taper,'#2f6fb0',.10)):
  for pg in getattr(g,'geoms',[g]):
   if not pg.is_empty:o.append(f'<path d="M{P(pg.exterior.coords)}Z'+''.join(f' M{P(r_.coords)}Z' for r_ in pg.interiors)+f'" fill="{fill}" fill-opacity="{op}" fill-rule="evenodd"/>')
 ht=Polygon(by_id('lakes')['high-tarn']['boundary']);o.append(f'<path d="M{P(ht.buffer(32).exterior.coords)}Z" fill="#2f6fb0" fill-opacity=".28" stroke="#2f6fb0" stroke-width="1.5"/>')
 for fz in C['frozenZones']:
  q=to_px(*fz['centre']);o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{fz["radiusM"]*PX:.1f}" fill="#2f6fb0" fill-opacity=".08" stroke="#2f6fb0" stroke-width="1.6" stroke-dasharray="4 3"/>')
 o.append(T(565,2100,'seam clearance','#1e3a8a',10,0,0,600,'end'));o.append(T(1290,2650+215,'inlet-n frozen (D3)','#1e3a8a',10,-48,0,600))
 for rid,half in(('peak-ascent',75),('tarn-ascent',55)):
  L=LineString(by_id('routes')[rid]['points2']);corr=L.buffer(half).intersection(clip)
  for pg in getattr(corr,'geoms',[corr]):o.append(f'<path d="M{P(pg.exterior.coords)}Z" fill="{COL["route"]}" fill-opacity=".13"/>')
  o.append(f'<polyline points="{P(L.coords)}" fill="none" stroke="{COL["route"]}" stroke-width="2" stroke-dasharray="6 4"/>')
 for c in f['channels']:o.append(f'<polyline points="{P([(p[0],p[2]) for p in c["points"]])}" fill="none" stroke="{COL["gully"]}" stroke-width="1.8" opacity=".85"/>')
 for r_ in f['ridges']:o.append(f'<polyline points="{P([(p[0],p[2]) for p in r_["points"]])}" fill="none" stroke="#3f3f46" stroke-width="1" stroke-dasharray="2 2" opacity=".9"/>')
 # measured anomaly: n-east-arc crest lifted > 10 m above its authored level by the inlet-n source
 an=[(a['x'],a['z']) for a in HYD['nEastArcAnomaly']['samples'] if a['excessM']>10]
 o.append(f'<polyline points="{P(an)}" fill="none" stroke="{COL["anom"]}" stroke-width="6" opacity=".75" stroke-linecap="round"/>')
 o.append(T(an[0][0],an[0][1],f'R1 knob +{HYD["nEastArcAnomaly"]["maxExcessM"]:.0f} m','#b91c1c',10,-60,-10,700))
 v1=[(-2000,1500),(1700,1500),(1700,4000),(-2000,4000)];poly=Polygon(WIN['polygon']);inner=poly.buffer(-(WIN['frozenRingM']+WIN['featherM']))
 o.append(f'<polygon points="{P(v1)}" fill="none" stroke="{COL["window"]}" stroke-width="1.2" stroke-dasharray="8 5" opacity=".6"/>')
 o.append(f'<polygon points="{P(poly.exterior.coords)}" fill="none" stroke="{COL["window"]}" stroke-width="2.2"/><polygon points="{P(inner.exterior.coords)}" fill="none" stroke="{COL["window"]}" stroke-width="1" stroke-dasharray="3 3"/>')
 # aretes on the authored crest lines (A1 fades out in the coastal taper)
 Lm,_=ridge_line('n-main');Lc,_=ridge_line('n-crown')
 segs={'A1':substring(Lc,0,Lc.length-200),'A2':substring(Lm,Lm.project(Point(-520,2770)),Lm.project(Point(-230,2540))),'A3':substring(Lm,Lm.project(Point(-710,2570)),Lm.project(Point(-520,2770)))}
 for k,g in segs.items():o.append(f'<polyline points="{P(g.coords)}" fill="none" stroke="{COL["arete"]}" stroke-width="4.5" stroke-linecap="round"/>')
 o.append(T(*segs['A1'].interpolate(.55,normalized=True).coords[0],'A1',COL['arete'],12,-22,0));o.append(T(*segs['A2'].interpolate(.6,normalized=True).coords[0],'A2',COL['arete'],12,6,-4));o.append(T(*segs['A3'].interpolate(.5,normalized=True).coords[0],'A3',COL['arete'],12,-24,-4))
 for c in C['cirques']:
  st=c['status'];col=COL['cirque'] if st in('proposed','option','conditional') else GREY
  if 'floor' in c:
   q,rx,rz=ell(*c['floor']);o.append(f'<ellipse cx="{q[0]:.1f}" cy="{q[1]:.1f}" rx="{rx:.1f}" ry="{rz:.1f}" fill="{col}" fill-opacity="{.18 if col!=GREY else .08}" stroke="{col}" stroke-width="1.6"{DASH[st]}/>')
   o.append(T(*((c['floor'][0]+c['floor'][2]+90,c['floor'][1]+30) if c['id']=='C1' else (c['floor'][0],c['floor'][1]-c['floor'][3])),c['id']+('' if st=='proposed' else f' ({st})'),col,12,-10,16))
  if 'head' in c and st!='deferred':
   o.append(f'<polyline points="{P(c["head"])}" fill="none" stroke="{col}" stroke-width="3.2"{DASH[st]}/>')
   hp=np.array([to_px(*p) for p in c['head']]);cq=np.array(to_px(*c['floor'][:2]))
   for k in range(len(hp)-1):
    m=(hp[k]+hp[k+1])/2;d=cq-m;d/=np.linalg.norm(d)+1e-9;o.append(f'<line x1="{m[0]:.1f}" y1="{m[1]:.1f}" x2="{m[0]+d[0]*7:.1f}" y2="{m[1]+d[1]*7:.1f}" stroke="{col}" stroke-width="1.6"/>')
  if 'lip' in c and st!='deferred':
   (a,b)=c['lip'];m=((a[0]+b[0])/2,(a[1]+b[1])/2);fx,fz=c['floor'][:2];v=np.array(m)-np.array([fx,fz]);v=v/np.linalg.norm(v)*70
   o.append(f'<line x1="{to_px(*a)[0]:.1f}" y1="{to_px(*a)[1]:.1f}" x2="{to_px(*b)[0]:.1f}" y2="{to_px(*b)[1]:.1f}" stroke="#0e7490" stroke-width="3"/>')
   o.append(f'<line x1="{to_px(*m)[0]:.1f}" y1="{to_px(*m)[1]:.1f}" x2="{to_px(m[0]+v[0],m[1]+v[1])[0]:.1f}" y2="{to_px(m[0]+v[0],m[1]+v[1])[1]:.1f}" stroke="#0e7490" stroke-width="2" marker-end="url(#arr)"/>')
 q=to_px(1265,2690);o.append(f'<path d="M{q[0]-6},{q[1]-6}L{q[0]+6},{q[1]+6}M{q[0]+6},{q[1]-6}L{q[0]-6},{q[1]+6}" stroke="{GREY}" stroke-width="2.5"/>');o.append(T(1265,2690,'C3 (not recommended)',GREY,10,-150,18,600))
 for b in C['buttresses']:
  col=COL['buttress'] if b['status']!='deferred' else GREY
  for k,l in enumerate(b.get('lines',[b.get('line')])):
   o.append(f'<polyline points="{P(l)}" fill="none" stroke="{col}" stroke-width="{5 if b["status"]!="option" else 3.5}" stroke-linecap="round" opacity=".9"{DASH[b["status"]]}/>')
   if k==0:o.append(T(*l[-1],b['id']+('' if b['status']=='proposed' else f' ({b["status"]})'),col,10.5,4,10))
 for s in C['shoulders']:
  col=COL['shoulder'] if s['status'] in('fixed','option','proposed') else GREY;q=to_px(*s['xz'])
  o.append(f'<path d="M{q[0]-7:.1f},{q[1]+3:.1f} q7,-9 14,0" fill="none" stroke="{col}" stroke-width="2.4"/>');o.append(T(*s['xz'],s['id']+('' if s['status']=='proposed' else f' ({s["status"]})'),col,10.5,8,13))
 g1=next(g for g in C['gullies'] if g['id']=='G1');Lw=LineString(channel_xyz('tarn-inlet-w')[:,[0,2]]);tr=substring(Lw,.35*Lw.length,.65*Lw.length)
 o.append(f'<polyline points="{P(tr.coords)}" fill="none" stroke="#0e7490" stroke-width="6" opacity=".9" stroke-linecap="round"/>');o.append(T(*tr.interpolate(.5,normalized=True).coords[0],'G1 trial','#0e7490',10.5,8,12))
 q=to_px(-520,2770);o.append(f'<path d="M{q[0]:.1f},{q[1]-9:.1f}L{q[0]+8:.1f},{q[1]+6:.1f}L{q[0]-8:.1f},{q[1]+6:.1f}Z" fill="#111" stroke="#fff" stroke-width="1.5"/>');o.append(T(-520,2770,'North Peak 900 (fixed)','#111',12,10,-10))
 def cam(x,z,yaw,label,dash=''):
  q=to_px(x,z);e=to_px(x+math.sin(yaw)*240,z+math.cos(yaw)*240)
  o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="4" fill="{COL["cam"]}"/><line x1="{q[0]:.1f}" y1="{q[1]:.1f}" x2="{e[0]:.1f}" y2="{e[1]:.1f}" stroke="{COL["cam"]}" stroke-width="1.6"{dash}/>')
  o.append(T(x,z,label,COL['cam'],10,5,14,600))
 for k in C['cameras']:cam(*k['xz'],k['yaw'],k['id'],' stroke-dasharray="4 3"')
 cam(700,1950,-0.979,'P0 tarn-overlook')
 o.append('</g>')
 # legend strip
 y=H+14;items=[('frozen','#2f6fb0','hatch','coast 0–150 m frozen; 150–300 m taper'),('frozen','#2f6fb0','circle','frozen zones (seam, inlet-n head)'),('route','#b4482f','band','trail corridors (frozen)'),
  ('arete','#7c2d12','line','arêtes on authored crests (fixed)'),('cirque','#c2410c','ell','cirque floor + headwall (ticks downslope)'),('gully','#0e7490','line','channels; thick = G1 trial; arrow = lip outflow'),
  ('buttress','#9a3412','line','B1 conditional (dashed) · B2/B3 option (dotted)'),('anom','#dc2626','line','R1 crest anomaly (measured)'),('window','#111827','line','window v2 (solid) · feather edge · v1 (long dash)'),
  ('cam','#6d28d9','line','review cameras (K = proposed)'),('grey',GREY,'line','grey = deferred / not recommended'),('ms','#3f3f46','dot','A-R1 crest lines')]
 for k,(kind,col,shape,txt) in enumerate(items):
  cx=14+(k%3)*322;cy=y+(k//3)*24
  if shape=='hatch':o.append(f'<rect x="{cx}" y="{cy}" width="28" height="12" fill="url(#hatch)" stroke="{col}" stroke-width=".6"/>')
  elif shape=='circle':o.append(f'<circle cx="{cx+14}" cy="{cy+6}" r="6" fill="none" stroke="{col}" stroke-dasharray="3 2" stroke-width="1.5"/>')
  elif shape=='band':o.append(f'<rect x="{cx}" y="{cy}" width="28" height="12" fill="{col}" fill-opacity=".25"/>')
  elif shape=='ell':o.append(f'<ellipse cx="{cx+14}" cy="{cy+6}" rx="14" ry="6" fill="{col}" fill-opacity=".2" stroke="{col}"/>')
  elif shape=='dot':o.append(f'<line x1="{cx}" x2="{cx+28}" y1="{cy+6}" y2="{cy+6}" stroke="{col}" stroke-dasharray="2 2"/>')
  else:o.append(f'<line x1="{cx}" x2="{cx+28}" y1="{cy+6}" y2="{cy+6}" stroke="{col}" stroke-width="4"/>')
  o.append(f'<text x="{cx+36}" y="{cy+10}" font-size="11.5" fill="#1f1d1a">{txt}</text>')
 o.append(f'<text x="14" y="{H+140}" font-size="11" fill="#55504a">A1-D concept v1 · DESIGN TARGETS over {"the approved A-R1 map" if "ar1" in base else "the R1 clay hillshade"} · not generated terrain · x −2100…1800, z 1200…4000 m, north up</text></svg>')
 return '\n'.join(o)
for base,name in(('base-ar1.jpg','overlay-v1-on-ar1.svg'),('base-r1-hillshade.jpg','overlay-v1-on-r1-clay.svg')):(IMG/name).write_text(layer(base))
print('ok')
