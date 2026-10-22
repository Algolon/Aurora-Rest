"""D5 / D6 / D7 checks on concept v1, measured against canonical R1 (no terrain generated).
Outputs: data/design-checks.json, images/window-v2-validation.png."""
from a1d_common import *
import shapely
from shapely.ops import substring
from hydro import d8_receivers
from PIL import Image,ImageDraw
C=concept('v1');WIN=json.loads((DATA/'window-v2-proposed.json').read_text());poly=Polygon(WIN['polygon']);ring,fea=WIN['frozenRingM'],WIN['featherM']
Hh=terrain();R=by_id('routes');co=coast();cl=co.exterior;dest=drainage_destination()
def ell(x,z,rx,rz,n=72):t=np.linspace(0,2*np.pi,n,endpoint=False);return Polygon(np.c_[x+rx*np.cos(t),z+rz*np.sin(t)])
geoms={}
for c in C['cirques']:
 if c['status'] in('proposed','option','conditional'):
  geoms[c['id']+' floor']=ell(*c['floor']);geoms[c['id']+' headwall']=LineString(c['head']);geoms[c['id']+' lip']=LineString(c['lip'])
for b in C['buttresses']:
 for k,l in enumerate(b.get('lines',[b.get('line')])):geoms[f"{b['id']}{'' if k==0 else '.'+str(k+1)}"]=LineString(l)
for a in C['aretes']:
 rid='n-crown' if a['ridge']=='n-crown' else 'n-main';L,_=ridge_line(rid)
 seg=L if rid=='n-crown' else substring(L,*((L.project(Point(-710,2570)),L.project(Point(-520,2770))) if a['id']=='A3' else (L.project(Point(-520,2770)),L.project(Point(-230,2540)))))
 geoms[a['id']+' sharpening band (60 m)']=seg.buffer(60)
ch=channel_xyz('tarn-inlet-w');Lc=LineString(ch[:,[0,2]]);geoms['G1 trial reach']=substring(Lc,.35*Lc.length,.65*Lc.length)
res={'window':{'valid':poly.is_valid,'areaHa':r(poly.area/1e4),'ringM':ring,'featherM':fea},'featureClearance':{}}
for k,g in geoms.items():
 inside=poly.contains(g);dmin=poly.exterior.distance(g)
 res['featureClearance'][k]={'insideWindow':bool(inside),'minDistanceToEdgeM':r(dmin),'inCore':bool(inside and dmin>=ring+fea),
  'minCoastDistanceM':r(cl.distance(g)),'coastWeight':r(np.clip((cl.distance(g)-150)/150,0,1),2)}
# protected items vs window zones
def zone_of(g):
 if not poly.intersects(g):return 'outside'
 d=poly.exterior.distance(g)
 return 'core' if poly.contains(g) and d>=ring+fea else ('feather/ring' if poly.intersects(g) else 'outside')
prot={'ht-spill (880,1850)':Point(880,1850),'glen-tarn-outlet valley':Polygon(by_id('valleys')['glen-tarn-outlet']['boundary']),
 'High Tarn lake':Polygon(by_id('lakes')['high-tarn']['boundary'])}
pr={}
for k,g in prot.items():
 pr[k]={'zone':zone_of(g),'areaInsideWindowPct':r(100*g.intersection(poly).area/g.area) if g.area else None,'distanceToWindowM':r(poly.distance(g))}
for rid in('peak-ascent','tarn-ascent'):
 L=LineString(R[rid]['points2']);core=poly.buffer(-(ring+fea));pr[rid+' route']={'lengthM':r(L.length),'insideWindowM':r(L.intersection(poly).length),'inCoreM':r(L.intersection(core).length),'inFeatherOrRingM':r(L.intersection(poly).length-L.intersection(core).length)}
for cid in('tarn-inlet-w','tarn-inlet-n','windward-gully'):
 L=LineString(channel_xyz(cid)[:,[0,2]]);core=poly.buffer(-(ring+fea));pr[cid]={'insideWindowM':r(L.intersection(poly).length),'inCoreM':r(L.intersection(core).length)}
res['protectedItems']=pr
# grid zone counts (vectorised distance)
xs=np.arange(-2000,1701,4.);zs=np.arange(1700,4001,4.);XX,ZZ=np.meshgrid(xs,zs);pts=shapely.points(XX.ravel(),ZZ.ravel())
ins=shapely.contains(poly,pts)|shapely.touches(poly,pts);dd=shapely.distance(poly.exterior,pts);hh=surface(Hh,XX.ravel(),ZZ.ravel());land=hh>0
cdist=shapely.distance(cl,pts)
zones={'ring':ins&(dd<ring),'feather':ins&(dd>=ring)&(dd<ring+fea),'core':ins&(dd>=ring+fea)}
res['gridCells4m']={k:{'cells':int(v.sum()),'landCells':int((v&land).sum()),'landCellsCoastFrozen0to150':int((v&land&(cdist<150)).sum()),'landCellsCoastTaper150to300':int((v&land&(cdist>=150)&(cdist<300)).sum())} for k,v in zones.items()}
res['reflexCorner']={'xz':[450,1950],'note':'Euclidean distance gives rounded feather contours around the reflex corner; an axis-aligned (Chebyshev) feather would leave a sharp inward notch there'}
res['p0MaskLoaderLimitation']='tools/geo-r02c/lib/common.py load_mask() reads xMin/xMax/zMin/zMax boxes only; window v2 needs a polygon mask implementation (A1 prerequisite)'
# D6: C1 vs coastal band, plus v0 comparison
v0c1=next(c for c in concept('v0')['features']['cirques'] if c['id']=='C1')
res['C1coastal']={'v1':{k:res['featureClearance'][k] for k in ('C1 floor','C1 lip','C1 headwall')},
 'v0':{'lipMinCoastDistanceM':r(cl.distance(LineString(v0c1['lip']))),'floorMinCoastDistanceM':r(cl.distance(ell(*v0c1['floor'])))},
 'verdict':'v1 C1 lies entirely beyond 300 m from the coast (taper weight 1.0); the outflow continues on unedited R1 slope through the taper and frozen band'}
# D5: B1 vs peak-ascent
pa=LineString(R['peak-ascent']['points2']);b1=next(b for b in C['buttresses'] if b['id']=='B1');B1=LineString(b1['line']);rec=d8_receivers(Hh).ravel()
v0b1=LineString(next(b for b in concept('v0')['features']['buttresses'] if b[0].startswith('B1'))[1])
hits=0;seeds=0
for s in np.linspace(0,B1.length,12):
 q=B1.interpolate(s)
 for off in(-30,30):
  k=int(j_of(q.y))*1501+int(i_of(q.x+off));seeds+=1
  for _ in range(150):
   j,i=divmod(k,1501)
   if pa.distance(Point(-3000+4*i,4000-4*j))<75:hits+=1;break
   if rec[k]<0:break
   k=int(rec[k])
res['B1route']={'v1MinDistanceToCentrelineM':r(B1.distance(pa)),'v0MinDistanceToCentrelineM':r(v0b1.distance(pa)),'corridorHalfWidthM':75,
 'requiredM':100,'v1Passes':bool(B1.distance(pa)>=100),'R1FlowSeedsReachingCorridorWithin600m':f'{hits}/{seeds}',
 'side':'east of the route (right-hand side when climbing)'}
# C2-b catchment transfer and C2-a design catchment (estimates on R1 drainage)
rim=LineString([(120,2640),(250,2668),(380,2650)]);cells=[]
for x in np.arange(120,381,4.):
 zr=np.interp(x,[120,250,380],[2640,2668,2650])
 for z in np.arange(2560,zr,4.):
  if dest[j_of(z),i_of(x)]==2:cells.append((x,z))
G01=Polygon(next(c for c in features()['catchments'] if c['id']=='01')['rings'][0])
res['C2']={'C2bCatchmentTransferHa':r(len(cells)*16/1e4,2),'C2bTransferInsideAuthoredCatchment01Pct':r(100*np.mean([G01.contains(Point(x,z)) for x,z in cells])),'note':'cells now draining to the sea that a 15-25 m north rim along (120,2640)-(250,2668)-(380,2650) would turn toward High Tarn',
 'C2aContributingAreaEstimateHa':r(((dest[j_of(np.arange(2440,2681,4.))[:,None],i_of(np.arange(-250,421,4.))[None,:]]==1).sum())*16/1e4,1),
 'C2aNote':'High Tarn-draining R1 cells in x -250..420, z 2440..2680, i.e. the bowl and headwall that a graded floor would gather to the source-w threshold (estimate)','sourceWNowHa':0.12}
write_json('design-checks.json',res)
# validation map (x -2100..1800, z 1500..4000), 1 px = 4 m
x0,x1,z0,z1=-2100.,1800.,1500.,4000.;J=slice(int(j_of(z1)),int(j_of(z0))+1);I=slice(int(i_of(x0)),int(i_of(x1))+1);sub=Hh[J,I]
hs=hillshade(sub,315,40);img=np.stack([hs*150+80]*3,-1);img[sub<=0]=[70,100,120]
XX2,ZZ2=np.meshgrid(np.arange(x0,x1+1,4.),np.arange(z1,z0-1,-4.));P2=shapely.points(XX2.ravel(),ZZ2.ravel())
ins2=(shapely.contains(poly,P2)|shapely.touches(poly,P2)).reshape(XX2.shape);d2=shapely.distance(poly.exterior,P2).reshape(XX2.shape)
c2=shapely.distance(cl,P2).reshape(XX2.shape);ld=sub>0
img[ins2&(d2>=ring+fea)&ld]=img[ins2&(d2>=ring+fea)&ld]*[.82,1,.82]
img[ins2&(d2<ring+fea)&(d2>=ring)&ld]=img[ins2&(d2<ring+fea)&(d2>=ring)&ld]*[1,.95,.7]
img[ins2&(d2<ring)]=[180,40,40]
cz=ld&(c2<150);img[cz]=img[cz]*[.7,.8,1.1];tz=ld&(c2>=150)&(c2<300);img[tz]=img[tz]*[.88,.93,1.05]
im=Image.fromarray(img.clip(0,255).astype(np.uint8));dr=ImageDraw.Draw(im)
def P(x,z):return ((x-x0)/4,(z1-z)/4)
for k,g in geoms.items():
 for gg in getattr(g,'geoms',[g]):
  cs=gg.exterior.coords if hasattr(gg,'exterior') else gg.coords;dr.line([P(a,b) for a,b in cs],fill=(194,65,12),width=2)
for rid,col in (('peak-ascent',(150,60,40)),('tarn-ascent',(150,60,40))):dr.line([P(a,b) for a,b in R[rid]['points2']],fill=col,width=1)
for k,g in prot.items():
 if hasattr(g,'exterior'):dr.line([P(a,b) for a,b in g.exterior.coords],fill=(30,80,160),width=2)
 else:q=P(g.x,g.y);dr.ellipse([q[0]-5,q[1]-5,q[0]+5,q[1]+5],outline=(30,80,160),width=2)
for f in C['frozenZones']:x,z=f['centre'];rr=f['radiusM']/4;q=P(x,z);dr.ellipse([q[0]-rr,q[1]-rr,q[0]+rr,q[1]+rr],outline=(30,80,160),width=2)
dr.line([P(a,b) for a,b in list(poly.exterior.coords)],fill=(17,24,39),width=2)
im=im.resize((im.width*2,im.height*2),Image.LANCZOS);im.save(IMG/'window-v2-validation.png')
print(json.dumps({k:res[k] for k in ('window','gridCells4m','B1route','C2','C1coastal')},indent=0));print(json.dumps(res['protectedItems'],indent=0))
print({k:(v['inCore'],v['minDistanceToEdgeM'],v['minCoastDistanceM']) for k,v in res['featureClearance'].items()})
