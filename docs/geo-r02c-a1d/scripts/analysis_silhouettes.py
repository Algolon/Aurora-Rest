"""North Peak silhouettes from approach directions on canonical R1 (terrain only: no vegetation, haze or curvature),
and visibility of the cirque zones (C1, C2 proposed; C4 deferred). Measured, not designed.
Outputs: data/silhouettes.json, images/silhouettes.svg."""
from a1d_common import *
from los import visible_fraction
from shapely.ops import substring
from shapely import contains_xy
Hh=terrain();C=concept('v1');SUM=np.array([-520.,2770.])
VP=[('valley-shoulder','P0 np-from-valley-shoulder',(-175.97,-155.95),1.75,'S'),('birchwood','P0 np-from-birchwood',(-700.,300.),1.75,'SSW'),
 ('cairn-col','P0 np-from-cairn-col (A2 context)',(40.,920.),1.75,'S'),('route-mid','peak-ascent s = 1825 m',(-581.,2341.),1.75,'S, near'),
 ('tarn-overlook','P0 np-from-tarn-overlook',(700.,1950.),1.75,'SE'),('K1','A1-D K1 High Tarn north shore',(1080.,2420.),1.75,'E'),
 ('east-ridge','n-east-arc high point',(870.,2880.),1.75,'ENE, high'),('K3','A1-D K3 windward coast',(-1520.,2060.),1.75,'WSW'),
 ('sea-north','sea, 3 m above water',(-300.,3900.),3.,'N, from the water'),('sea-northeast','NE bay, 3 m above water',(200.,3500.),3.,'NE, from the water')]
def ell(x,z,rx,rz,n=72):t=np.linspace(0,2*np.pi,n,endpoint=False);return Polygon(np.c_[x+rx*np.cos(t),z+rz*np.sin(t)])
cq={c['id']:c for c in C['cirques']};L,_=ridge_line('n-main');Lc,_=ridge_line('n-crown')
ZONES=[('summit',Point(*SUM).buffer(60)),
 ('A1',substring(Lc,0,Lc.length-200).buffer(60)),('A2',substring(L,L.project(Point(-520,2770)),L.project(Point(-230,2540))).buffer(60)),
 ('A3',substring(L,L.project(Point(-710,2570)),L.project(Point(-520,2770))).buffer(60)),
 ('C1',ell(*cq['C1']['floor']).union(LineString(cq['C1']['head']).buffer(60))),('C2',ell(*cq['C2']['floor']).union(LineString(cq['C2']['head']).buffer(60))),
 ('C4 (deferred)',ell(*cq['C4']['floor']).buffer(80)),('B1',LineString(next(b for b in C['buttresses'] if b['id']=='B1')['line']).buffer(40)),
 ('massif, unsculpted',Polygon([(-1500,2150),(900,2150),(900,3300),(-1500,3300)]))]
COLS={'summit':'#111827','A1':'#7f1d1d','A2':'#c2410c','A3':'#ca8a04','C1':'#0f766e','C2':'#7c3aed','C4 (deferred)':'#a8a29e','B1':'#be123c','massif, unsculpted':'#64748b','foreground / other':'#cbd5e1'}
def zone(x,z):
 for n,g in ZONES:
  if contains_xy(g,x,z):return n
 return 'foreground / other'
def skyline(ox,oz,eye,az0,half=30.,step=.25):
 oy=float(surface(Hh,[ox],[oz])[0]) if eye<2.5 else 0.;oy+=eye;azs=np.arange(az0-half,az0+half+1e-9,step);ds=np.r_[np.arange(12,1500,4.),np.arange(1500,7000,8.)]
 out=[]
 for a in azs:
  t=np.radians(a);xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds;ok=(xs>-3000)&(xs<3000)&(zs>-4000)&(zs<4000)
  h=surface(Hh,xs[ok],zs[ok]);ang=np.degrees(np.arctan2(h-oy,ds[ok]));k=int(np.argmax(ang))
  out.append((float(a),float(ang[k]),float(xs[ok][k]),float(zs[ok][k]),float(ds[ok][k])))
 return out,oy
res={'method':'terrain-only skyline (max elevation angle per azimuth, 0.25 deg steps, rays to 7 km) on the rendered R1 triangles; zone = which A1-D design zone forms the skyline point; no vegetation, haze or earth curvature','viewpoints':{}}
svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {H}" font-family="system-ui,sans-serif" font-size="11">','<rect class="bg" width="900" height="{H}" fill="#fffdf9"/>',
 '<text x="16" y="20" font-size="13" font-weight="700" fill="currentColor">North Peak silhouettes on R1 from ten approaches: which A1-D zone forms the skyline</text>']
y0=34
for vid,label,(ox,oz),eye,direction in VP:
 az0=float(np.degrees(np.arctan2(SUM[0]-ox,SUM[1]-oz)));dist=float(np.hypot(SUM[0]-ox,SUM[1]-oz));half=40. if dist<1200 else 25.
 sky,oy=skyline(ox,oz,eye,az0,half);zs=[zone(p[2],p[3]) for p in sky]
 sumang=float(np.degrees(np.arctan2(900-oy,dist)));los=visible_fraction(Hh,ox,oz,np.array([SUM[0]]),np.array([SUM[1]]),eye=eye,target_lift=2.)
 near=[z for p,z in zip(sky,zs) if abs(p[0]-az0)<=12]
 share={z:r(100*near.count(z)/len(near)) for z in sorted(set(near),key=lambda q:-near.count(q))}
 massif=[p[0] for p,z in zip(sky,zs) if z!='foreground / other']
 # cirque-zone visibility
 vis={}
 for cid in ('C1','C2','C4'):
  g=ZONES[[n for n,_ in ZONES].index(cid if cid!='C4' else 'C4 (deferred)')][1];b=g.bounds;gx,gz=np.meshgrid(np.arange(b[0],b[2],25.),np.arange(b[1],b[3],25.));m=contains_xy(g,gx,gz)
  vis[cid]=r(100*visible_fraction(Hh,ox,oz,gx[m],gz[m],eye=eye,target_lift=1.,step=8.))
 res['viewpoints'][vid]={'label':label,'xz':[ox,oz],'eyeM':r(oy),'approach':direction,'distanceToSummitM':round(dist),'summitBearingDeg':r(az0),
  'summitLineOfSight':bool(los>0.5),'summitElevationAngleDeg':r(sumang,2),'skylineShareWithin12degPct':share,
  'massifSkylineWidthDeg':r(max(massif)-min(massif)) if massif else 0.,'cirqueZoneVisiblePct':vis}
 # panel
 ph=110;angs=np.array([p[1] for p in sky]);lo=min(angs.min(),sumang)-.5;hi=max(angs.max(),sumang)+1.2
 X=lambda a:60+(a-(az0-half))/(2*half)*820;Y=lambda v:y0+ph-(v-lo)/(hi-lo)*(ph-26)
 svg.append(f'<text x="16" y="{y0+16}" font-size="12" font-weight="700" fill="currentColor">{label} · {direction} · {dist/1000:.1f} km</text>')
 svg.append(f'<text x="884" y="{y0+16}" text-anchor="end" font-size="11" fill="currentColor" opacity=".75">summit {"in view" if los>0.5 else "hidden"} · skyline massif width {res["viewpoints"][vid]["massifSkylineWidthDeg"]:.0f}°</text>')
 base=Y(lo)
 for k in range(len(sky)-1):
  c=COLS[zs[k]];svg.append(f'<path d="M{X(sky[k][0]):.1f},{Y(sky[k][1]):.1f}L{X(sky[k+1][0]):.1f},{Y(sky[k+1][1]):.1f}L{X(sky[k+1][0]):.1f},{base:.1f}L{X(sky[k][0]):.1f},{base:.1f}Z" fill="{c}" fill-opacity=".22" stroke="none"/><line x1="{X(sky[k][0]):.1f}" y1="{Y(sky[k][1]):.1f}" x2="{X(sky[k+1][0]):.1f}" y2="{Y(sky[k+1][1]):.1f}" stroke="{c}" stroke-width="2.4"/>')
 sx,sy=X(az0),Y(sumang);svg.append(f'<path d="M{sx:.1f},{sy-7:.1f}L{sx+6:.1f},{sy+4:.1f}L{sx-6:.1f},{sy+4:.1f}Z" fill="{"#111827" if los>0.5 else "none"}" stroke="#111827" stroke-width="1.2"/>')
 svg.append(f'<text x="60" y="{base+12:.1f}" font-size="10" fill="currentColor" opacity=".6">{(az0-half)%360:.0f}°</text><text x="880" y="{base+12:.1f}" text-anchor="end" font-size="10" fill="currentColor" opacity=".6">{(az0+half)%360:.0f}° (bearing; vertical ×{820/(2*half)/((ph-26)/(hi-lo)):.1f})</text>')
 y0+=ph+30
leg=list(COLS.items());y=y0+4;x=16
for n,c in leg:
 svg.append(f'<rect x="{x}" y="{y}" width="12" height="10" fill="{c}"/><text x="{x+16}" y="{y+9}" fill="currentColor" font-size="11">{n}</text>');x+=len(n)*6.4+40
 if x>760:x=16;y+=16
svg.append(f'<text x="16" y="{y+30}" font-size="10.5" fill="currentColor" opacity=".7">Filled triangle = summit in line of sight; hollow = hidden. Terrain only (no trees, haze or curvature). Zones are A1-D v1 design zones drawn over R1, not new terrain.</text></svg>')
Hs=y+42;(IMG/'silhouettes.svg').write_text('\n'.join(svg).replace('{H}',str(Hs)))
write_json('silhouettes.json',res)
for k,v in res['viewpoints'].items():print(k,v['summitLineOfSight'],v['distanceToSummitM'],v['massifSkylineWidthDeg'],v['skylineShareWithin12degPct'],v['cirqueZoneVisiblePct'])
