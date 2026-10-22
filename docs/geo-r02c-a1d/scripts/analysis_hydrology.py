"""D3: hydrological cross-sections and catchment analysis for the two High Tarn inlet sources (measured on R1; no terrain generated).
Outputs: data/hydrology-north-sources.json, images/hydro-*.svg, images/hydro-north-drainage-base.png."""
from a1d_common import *
from a1d_svg import panel,ORANGE,TARN
from PIL import Image

Hh=terrain();dest=drainage_destination();m=master();chan={c:channel_xyz(c) for c in ('tarn-inlet-n','tarn-inlet-w','windward-gully')}
EA,eap=ridge_line('n-east-arc');RL={rid:ridge_line(rid) for rid in ('n-east-arc','n-main','n-crown','n-west-spur','n-nw-cape')}
def nearest_crest(x,z):
 best=None
 for rid,(L,p) in RL.items():
  dd=L.distance(Point(x,z))
  if best is None or dd<best[1]:
   q=L.interpolate(L.project(Point(x,z)));k=int(np.argmin(np.hypot(p[:,0]-q.x,p[:,2]-q.y)));best=(rid,dd,q.x,q.y,float(p[k,1]))
 return best
# --- multiple-flow (Freeman, p=1.1) contributing area in a local box; D8 under-counts on divergent slopes
BX=(-400.,1700.,2150.,3050.);J=slice(int(j_of(BX[3])),int(j_of(BX[2]))+1);I=slice(int(i_of(BX[0])),int(i_of(BX[1]))+1)
h=Hh[J,I];ny,nx=h.shape;acc=np.full(h.shape,CELL*CELL)
for k in np.argsort(-h.ravel(),kind='stable'):
 j,i=divmod(int(k),nx);hv=h[j,i];ws=[];tg=[]
 for dj in(-1,0,1):
  for di in(-1,0,1):
   a,b=j+dj,i+di
   if (dj or di) and 0<=a<ny and 0<=b<nx and h[a,b]<hv:ws.append(((hv-h[a,b])/(CELL*np.hypot(dj,di)))**1.1);tg.append((a,b))
 if ws:
  ws=np.array(ws)/sum(ws)
  for wgt,(a,b) in zip(ws,tg):acc[a,b]+=acc[j,i]*wgt
def mfd_ha(x,z,rad=2):
 jj=int(j_of(z))-J.start;ii=int(i_of(x))-I.start;return float(acc[max(jj-rad,0):jj+rad+1,max(ii-rad,0):ii+rad+1].max()/1e4)
def stations(p,step_list):
 L=np.r_[0,np.cumsum(np.hypot(*np.diff(p[:,[0,2]],axis=0).T))];out=[]
 for s in step_list:
  k=min(int(np.searchsorted(L,s)),len(p)-1);x,y,z=p[k];nc=nearest_crest(x,z)
  out.append({'sM':int(s),'x':r(x),'z':r(z),'bedM':r(y),'mfdUpstreamHa':round(mfd_ha(x,z),2) if BX[0]<=x<=BX[1] and BX[2]<=z<=BX[3] else None,
   'nearestCrest':nc[0],'crestDistanceM':r(nc[1]),'crestAuthoredM':r(nc[4]),'bedBelowAuthoredCrestM':r(nc[4]-y)})
 return out,L
def local_relief(x,z,rad=12):
 j,i=int(j_of(z)),int(i_of(x));k=rad//4;blk=Hh[j-k:j+k+1,i-k:i+k+1];return r(blk.max()-Hh[j,i],2),r(Hh[j,i]-blk.min(),2)
def divide_distance(x,z,code,maxr=400):
 """Distance from (x,z) to the nearest cell whose D8 destination differs from `code` (the drainage divide)."""
 j,i=int(j_of(z)),int(i_of(x));k=maxr//4;blk=dest[j-k:j+k+1,i-k:i+k+1];jj,ii=np.nonzero(blk!=code)
 return r(np.hypot(jj-k,ii-k).min()*CELL) if len(jj) else None
res={'method':{'drainage':'D8 steepest descent on canonical R1 to its terminal (High Tarn / sea / other); measured, not designed',
 'area':'Freeman multiple-flow (p = 1.1) contributing area in box x -400..1700, z 2150..3050; channel cells already carry the 1.6 m R1 channel cut',
 'crest':'authored crest level = A-R1 ridge polyline height in public/geo-r02b/features.json; R1 = rendered terrain'},'sources':{}}
for cid,node in (('tarn-inlet-n','ht-source-n'),('tarn-inlet-w','ht-source-w'),('windward-gully','windward-source')):
 p=chan[cid];x,y,z=p[0];nc=nearest_crest(x,z);st,L=stations(p,[0,25,50,100,150,200,250,300,400])
 code=int(dest[int(j_of(z)),int(i_of(x))])
 res['sources'][node]={'channel':cid,'x':r(x),'z':r(z),'authoredSourceLevelM':r(y),'r1GroundM':r(h_at(x,z)[0]),
  'localHighM':{'riseToMaxWithin12m':local_relief(x,z)[0],'dropToMinWithin12m':local_relief(x,z)[1]},
  'nearestAuthoredCrest':{'ridge':nc[0],'distanceM':r(nc[1]),'authoredLevelM':r(nc[4]),'r1AtCrestM':r(h_at(nc[2],nc[3])[0]),'sourceAboveAuthoredCrestM':r(y-nc[4])},
  'drainsTo':{1:'High Tarn',2:'sea'}.get(code,'other'),'distanceToDrainageDivideM':divide_distance(x,z,code),'channelLengthM':r(L[-1]),'stations':st}
# n-east-arc crest anomaly beside source-n
an=[]
for s in np.arange(1500,1921,20):
 q=EA.interpolate(s);k=int(np.argmin(np.hypot(eap[:,0]-q.x,eap[:,2]-q.y)));an.append({'sM':int(s),'x':r(q.x),'z':r(q.y),'authoredM':r(eap[k,1]),'r1M':r(h_at(q.x,q.y)[0]),'excessM':r(h_at(q.x,q.y)[0]-eap[k,1])})
res['nEastArcAnomaly']={'note':'R1 holds every northern crest at its authored level (within 4 m) except here, where the 640 m source constraint lifts the crest','samples':an,
 'maxExcessM':max(a['excessM'] for a in an),'lengthOver10mM':20*sum(a['excessM']>10 for a in an)}
# whole-ridge check for the claim above
chk={}
for rid,(Lr,p) in RL.items():
 ex=[]
 for s in np.arange(0,Lr.length,20):
  q=Lr.interpolate(s);k=int(np.argmin(np.hypot(p[:,0]-q.x,p[:,2]-q.y)));ex.append(float(h_at(q.x,q.y)[0]-p[k,1]))
 ex=np.array(ex);chk[rid]={'samples':len(ex),'maxAbsExcessM':r(np.abs(ex).max()),'samplesOver4m':int((np.abs(ex)>4).sum())}
res['crestFidelity']=chk
# v0 cirques against the measured divide and crests
v0={c['id']:c for c in concept('v0')['features']['cirques']}
def ellipse_cells(x,z,rx,rz):
 xs,zs=np.meshgrid(np.arange(x-rx,x+rx+1,8.),np.arange(z-rz,z+rz+1,8.));m_=((xs-x)/rx)**2+((zs-z)/rz)**2<=1;return xs[m_],zs[m_]
cv={}
for cid in ('C2','C3'):
 x,z,rx,rz=v0[cid]['floor'];xs,zs=ellipse_cells(x,z,rx,rz);codes=dest[j_of(zs),i_of(xs)]
 nc=nearest_crest(x,z)
 cv[cid]={'floorCentre':[x,z],'floorDrainsToTarnPct':r(100*(codes==1).mean()),'floorDrainsToSeaPct':r(100*(codes==2).mean()),
  'centreToNearestCrestM':r(nc[1]),'nearestCrest':nc[0],'authoredCrestLevelM':r(nc[4]),'v0FloorM':v0[cid]['floorM']}
# authored crest north of the v0 C2 floor
cv['C2']['crestNorthOfFloor']=[{'x':int(xq),'authoredM':r(eap[int(np.argmin(np.abs(eap[:,0]-xq)+np.abs(eap[:,2]-2770)))][1])} for xq in (100,200,300,400,500,600)]
res['v0CirqueChecks']=cv
# relocation candidates for the inlet-n head (design-master question, not an A1 edit)
st,_=stations(chan['tarn-inlet-n'],range(0,420,10))
def first(cond):
 for s_ in st:
  if cond(s_):return s_
res['inletNHeadCandidates']={'note':'first station along the authored channel where the bed sits below the nearest authored crest by the stated margin and distance',
 'headroom20m_dist80m':first(lambda s_:s_['bedBelowAuthoredCrestM']>=20 and s_['crestDistanceM']>=80),
 'headroom40m_dist120m':first(lambda s_:s_['bedBelowAuthoredCrestM']>=40 and s_['crestDistanceM']>=120),
 'headroom60m_dist150m':first(lambda s_:s_['bedBelowAuthoredCrestM']>=60 and s_['crestDistanceM']>=150)}
write_json('hydrology-north-sources.json',res)

# ---------- sections ----------
def strip_for(pts):return dest[j_of(pts[:,1]),i_of(pts[:,0])]
def crest_mark(a,b,rid,label):
 """Vertical marker where section a-b crosses an authored crest, drawn at the authored crest level."""
 Ls=LineString([a,b]);Lr,p=ridge_line(rid);ip=Ls.intersection(Lr)
 if ip.is_empty:return []
 ip=list(getattr(ip,'geoms',[ip]))[0];dd=Point(a).distance(ip);k=int(np.argmin(np.hypot(p[:,0]-ip.x,p[:,2]-ip.y)));lv=float(p[k,1])
 return [(dd,lv,label)]
def marks_svg(marks):
 def f(X,Y):
  return ''.join(f'<line x1="{X(dd)-9:.1f}" x2="{X(dd)+9:.1f}" y1="{Y(lv):.1f}" y2="{Y(lv):.1f}" stroke="{TARN}" stroke-width="3"/><text x="{X(dd)+11:.1f}" y="{Y(lv)+4:.1f}" fill="{TARN}" font-size="10.5">{t}</text>' for dd,lv,t in marks)
 return f
out={}
a,b=(1290,2950),(1290,2300);d,hh,pts=section(a,b);mk=crest_mark(a,b,'n-east-arc','authored n-east-arc crest 553 m')
src=res['sources']['ht-source-n']
out['hydro-H1-source-n-ns']=panel('H1 · N→S at x = 1290 through the tarn-inlet-n source: an authored 640 m source on a 553 m crest',d,[(hh,'r1')],
 [(Point(a).distance(Point(1290,2650)),'source 640 m (authored)'),(370,f'R1 knob: crest up to +{res["nEastArcAnomaly"]["maxExcessM"]:.0f} m above authored'),(40,'north face → sea'),(560,'channel → High Tarn')],'N','S',strip_for(pts),extra=[marks_svg(mk)])
p=chan['tarn-inlet-n'];Lc=np.r_[0,np.cumsum(np.hypot(*np.diff(p[:,[0,2]],axis=0).T))];crestlv=np.array([nearest_crest(x,z)[4] for x,_,z in p[::4]])
gr=h_at(p[:,0],p[:,2]);cand=res['inletNHeadCandidates']['headroom40m_dist120m']
nts=[(0,'source 640 m · 0.1 ha'),(100,f'{st[10]["mfdUpstreamHa"]} ha'),(200,f'{st[20]["mfdUpstreamHa"]} ha'),(300,f'{st[30]["mfdUpstreamHa"]} ha')]
if cand:nts.append((cand['sM'],f'candidate head s≈{cand["sM"]} m, bed {cand["bedM"]:.0f} m'))
out['hydro-H2-inlet-n-long']=panel('H2 · tarn-inlet-n long profile: bed (grey) vs nearest authored crest level (blue dots); MFD area labelled',Lc,[(gr,'r1'),(np.interp(Lc,Lc[::4],crestlv),'ref')],nts,'source','High Tarn inlet 360 m')
a,b=(-300,2540),(900,2540);d,hh,pts=section(a,b)
out['hydro-H3-source-w-we']=panel('H3 · W→E at z = 2540 through the tarn-inlet-w source: summit flank → 615 m saddle → 621 m source knob → tarn side',d,[(hh,'r1')],
 [(Point(a).distance(Point(420,2540)),'source 620 m on a low knob'),(Point(a).distance(Point(300,2540)),'saddle ~615 m'),(80,'summit SE flank'),(1050,'gully → tarn')],'W','E',strip_for(pts))
a,b=(300,3050),(300,2350);d,hh,pts=section(a,b);mk=crest_mark(a,b,'n-east-arc','authored crest ~600 m')
x0,z0,rx,rz=v0['C2']['floor'];fl0=Point(a).distance(Point(300,z0+rz));fl1=Point(a).distance(Point(300,z0-rz))
def floor_box(X,Y):return f'<rect x="{X(fl0):.1f}" y="{Y(624):.1f}" width="{X(fl1)-X(fl0):.1f}" height="{Y(617)-Y(624):.1f}" fill="{ORANGE}" fill-opacity=".25" stroke="{ORANGE}" stroke-dasharray="4 3"/><text x="{X(fl0):.1f}" y="{Y(624)-6:.1f}" fill="{ORANGE}" font-size="10.5">v0 C2 floor 617–624 m (superseded)</text>'
out['hydro-H4-c2-ns']=panel('H4 · N→S at x = 300 through v0 Västra tarnbotn: the floor straddles the tarn/sea divide, above the crest to its north',d,[(hh,'r1')],
 [(60,'sea face'),(Point(a).distance(Point(300,2612)),'R1 divide'),(640,'tarn side')],'N','S',strip_for(pts),extra=[marks_svg(mk),floor_box])
for k,v in out.items():(IMG/f'{k}.svg').write_text(v)
# drainage base raster for the hydrology map (x -400..1700, z 2150..3050), 1 px = 2 m
sub=Hh[J,I];dd_=dest[J,I];hs=hillshade(sub,315,40);base=np.where(dd_[...,None]==1,[205,222,240],np.where(dd_[...,None]==2,[214,214,210],[236,232,224])).astype(float)
img=base*(0.62+0.38*hs[...,None]);cont=(np.floor(sub/10)!=np.floor(np.roll(sub,1,0)/10))|(np.floor(sub/10)!=np.floor(np.roll(sub,1,1)/10));img[cont]*=0.78
c50=(np.floor(sub/50)!=np.floor(np.roll(sub,1,0)/50))|(np.floor(sub/50)!=np.floor(np.roll(sub,1,1)/50));img[c50]*=0.6;img[sub<=0]=[60,90,110]
Image.fromarray(img.clip(0,255).astype(np.uint8)).resize((sub.shape[1]*2,sub.shape[0]*2),Image.NEAREST).save(IMG/'hydro-north-drainage-base.png')


# ---------- authored High Tarn catchment (A-R1 catchment 01) vs R1 drainage ----------
from shapely import contains_xy
cat=next(c for c in features()['catchments'] if c['id']=='01');G=Polygon(cat['rings'][0])
xs_,zs_=np.meshgrid(np.arange(-600,1800,8.),np.arange(1500,3200,8.));inA=contains_xy(G,xs_,zs_);dd_=dest[j_of(zs_),i_of(xs_)];inR=dd_==1;ha=64/1e4
miss=inA&~inR;west=xs_<450
c2=next(c for c in concept('v1')['cirques'] if c['id']=='C2');hw=Polygon(list(c2['head'])+[(40,2560),(-200,2530)])
inHW=contains_xy(hw,xs_,zs_)
res['authoredCatchment01']={'note':'A-R1 catchment 01 (High Tarn) polygon from public/geo-r02b/features.json vs R1 D8 drainage, 8 m sampling',
 'authoredHa':r(inA.sum()*ha),'r1DrainsToHighTarnHa':r(inR.sum()*ha),'authoredButNotDrainingToTarnHa':r(miss.sum()*ha),
 'ofWhichToSeaHa':r((miss&(dd_==2)).sum()*ha),'ofWhichToOtherHa':r((miss&(dd_==3)).sum()*ha),'ofWhichWestOfX450Ha':r((miss&west).sum()*ha),
 'r1TarnOutsideAuthoredHa':r((inR&~inA).sum()*ha),
 'northOfZ2300':{'note':'inflow side only (excludes the outlet glen south of the lake, where polygon conventions may differ)','authoredHa':r((inA&(zs_>=2300)).sum()*ha),'notDrainingToTarnHa':r((miss&(zs_>=2300)).sum()*ha),'toSeaHa':r((miss&(zs_>=2300)&(dd_==2)).sum()*ha),'toOtherHa':r((miss&(zs_>=2300)&(dd_==3)).sum()*ha)},
 'c2HeadwallZoneHa':r(inHW.sum()*ha),'c2HeadwallZoneInsideAuthored01Pct':r(100*(inHW&inA).sum()/max(inHW.sum(),1)),'c2HeadwallZoneNotDrainingToTarnNowHa':r((inHW&~inR).sum()*ha),
 'interpretation':'R1 honours the authored source and crest LEVELS; where those conflict with the authored catchment polygon (source-w 620 m above the 597 m n-east-arc section; source-n 640 m above a 553 m crest) the drainage follows the levels'}
write_json('hydrology-north-sources.json',res)
from PIL import Image as _I
m=np.zeros(xs_.shape+(4,),np.uint8);m[miss]=[220,38,38,70]
_I.fromarray(m[::-1]).save(IMG/'hydro-catchment01-missing.png')  # overlay raster: x -600..1792, z 1500..3192 (8 m px), rows north-up
print(json.dumps(res['authoredCatchment01'],indent=0))
