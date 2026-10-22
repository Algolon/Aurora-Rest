"""Annotated D3 hydrology map over measured R1 drainage (blue tint = drains to High Tarn, grey = sea, beige = other catchment;
contours 10 m / 50 m). Base raster from analysis_hydrology.py. Output: images/hydro-north-map.svg (+ .png via render_png.mjs)."""
from a1d_common import *
HY=json.loads((DATA/'hydrology-north-sources.json').read_text());C=concept('v1');V0={c['id']:c for c in concept('v0')['features']['cirques']}
bx0,bx1,bz0,bz1=-400.,1700.,2150.,3050.;S_=0.5;w=int((bx1-bx0)*S_)+2;h=int((bz1-bz0)*S_)+2
def Q(x,z):return ((x-bx0)*S_,(bz1-z)*S_)
def P(pts):return ' '.join(f'{Q(x,z)[0]:.1f},{Q(x,z)[1]:.1f}' for x,z in pts)
def T(x,z,t,col,dx=5,dy=4,size=11,anchor=''):
 q=Q(x,z);a=f' text-anchor="{anchor}"' if anchor else ''
 return f'<text x="{q[0]+dx:.1f}" y="{q[1]+dy:.1f}" font-size="{size}" font-weight="700" fill="{col}" stroke="#fff" stroke-width="3" paint-order="stroke"{a}>{t}</text>'
o=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {w} {h+86}" font-family="system-ui,sans-serif">',f'<rect width="{w}" height="{h+86}" fill="#fffdf9"/>',
 f'<image href="hydro-north-drainage-base.png" xlink:href="hydro-north-drainage-base.png" x="0" y="0" width="{w}" height="{h}"/>']
G=Polygon(next(c for c in features()['catchments'] if c['id']=='01')['rings'][0])
o.append(f'<polyline points="{P(G.exterior.coords)}" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-dasharray="10 4"/>')
for rid in('n-main','n-crown','n-east-arc'):
 L,_=ridge_line(rid);o.append(f'<polyline points="{P(L.coords)}" fill="none" stroke="#7c2d12" stroke-width="2" stroke-dasharray="5 3"/>')
an=[(a['x'],a['z']) for a in HY['nEastArcAnomaly']['samples'] if a['excessM']>10];o.append(f'<polyline points="{P(an)}" fill="none" stroke="#dc2626" stroke-width="6" opacity=".8" stroke-linecap="round"/>')
for cid in('tarn-inlet-w','tarn-inlet-n'):o.append(f'<polyline points="{P(channel_xyz(cid)[:,[0,2]])}" fill="none" stroke="#0e7490" stroke-width="2.4"/>')
for cid in('C2','C3'):
 x,z,rx,rz=V0[cid]['floor'];q=Q(x,z);o.append(f'<ellipse cx="{q[0]:.1f}" cy="{q[1]:.1f}" rx="{rx*S_:.1f}" ry="{rz*S_:.1f}" fill="none" stroke="#57534e" stroke-width="1.6" stroke-dasharray="4 3"/>')
 o.append(T(x+rx,z+rz,f'v0 {cid}','#57534e',0,0,10))
c2=next(c for c in C['cirques'] if c['id']=='C2');x,z,rx,rz=c2['floor'];q=Q(x,z)
o.append(f'<ellipse cx="{q[0]:.1f}" cy="{q[1]:.1f}" rx="{rx*S_:.1f}" ry="{rz*S_:.1f}" fill="#c2410c" fill-opacity=".2" stroke="#c2410c" stroke-width="2"/>');o.append(T(x-rx,z-rz,'v1 C2 floor','#c2410c',-10,14,11))
o.append(f'<polyline points="{P(c2["head"])}" fill="none" stroke="#c2410c" stroke-width="3"/>')
o.append(f'<polyline points="{P([(120,2640),(250,2668),(380,2650)])}" fill="none" stroke="#c2410c" stroke-width="2.5" stroke-dasharray="2 3"/>');o.append(T(250,2668,'C2-b rim (option)','#c2410c',-40,-8,10))
for k,(nid,lab) in enumerate((('ht-source-n','source-n 640 m'),('ht-source-w','source-w 620 m'))):
 s=HY['sources'][nid];q=Q(s['x'],s['z']);o.append(f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="5" fill="#0e7490" stroke="#fff" stroke-width="1.5"/>');o.append(T(s['x'],s['z'],lab,'#0e4f5c',8,(-8 if k==0 else 16),11))
for key,lab in(('headroom20m_dist80m','20 m'),('headroom40m_dist120m','40 m'),('headroom60m_dist150m','60 m')):
 c=HY['inletNHeadCandidates'][key];q=Q(c['x'],c['z']);o.append(f'<rect x="{q[0]-4:.1f}" y="{q[1]-4:.1f}" width="8" height="8" fill="#16a34a" stroke="#fff"/>')
c=HY['inletNHeadCandidates']['headroom40m_dist120m'];o.append(T(c['x'],c['z'],f'candidate heads s≈150–220 m ({HY["inletNHeadCandidates"]["headroom20m_dist80m"]["bedM"]:.0f}–{HY["inletNHeadCandidates"]["headroom60m_dist150m"]["bedM"]:.0f} m)','#166534',-12,4,10.5,'end'))
for nm,a,b in(('H1',(1290,2950),(1290,2300)),('H3',(-300,2540),(900,2540)),('H4',(300,3050),(300,2350))):
 o.append(f'<line x1="{Q(*a)[0]:.1f}" y1="{Q(*a)[1]:.1f}" x2="{Q(*b)[0]:.1f}" y2="{Q(*b)[1]:.1f}" stroke="#111827" stroke-width="1.2" stroke-dasharray="6 3"/>');o.append(T(*a,nm,'#111827',4,12,11))
o.append(T(an[len(an)//2][0],an[len(an)//2][1],f'crest +{HY["nEastArcAnomaly"]["maxExcessM"]:.0f} m (R1 knob)','#b91c1c',10,-8,11))
y=h+14
for k,(sw,txt) in enumerate((('<rect width="22" height="11" fill="#cddef0"/>','drains to High Tarn (R1, D8)'),('<rect width="22" height="11" fill="#d6d6d2"/>','drains to the sea'),('<rect width="22" height="11" fill="#ece8e0"/>','other catchment'),
 ('<line x1="0" x2="22" y1="6" y2="6" stroke="#7c2d12" stroke-width="2" stroke-dasharray="5 3"/>','authored crest'),('<line x1="0" x2="22" y1="6" y2="6" stroke="#dc2626" stroke-width="5"/>','crest > 10 m above authored'),('<rect width="9" height="9" fill="#16a34a"/>','candidate head (headroom 20/40/60 m)'),('<line x1="0" x2="22" y1="6" y2="6" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="8 3"/>','authored A-R1 High Tarn catchment (01)'))):
 cx=10+(k%3)*int(w/3);cy=y+(k//3)*18;o.append(f'<g transform="translate({cx},{cy})">{sw}<text x="30" y="10" font-size="11" fill="#1f1d1a">{txt}</text></g>')
o.append(f'<text x="10" y="{h+80}" font-size="10.5" fill="#55504a">D3 · measured R1 drainage and contours (10 m, 50 m bold); v0 shapes dashed grey; v1 C2 orange; x −400…1700, z 2150…3050, north up</text></svg>')
(IMG/'hydro-north-map.svg').write_text('\n'.join(o));print('ok',w,h)
