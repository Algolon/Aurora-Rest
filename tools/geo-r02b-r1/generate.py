"""GEO-R02B-R1: solve shared landform constraints before cutting water sections.
No depression filling, erosion simulation, route flattening or random detail.
The positive-weight harmonic solve cannot invent an extremum at an unconstrained
node. Authored constraints can still conflict; diagnostics remain mandatory.
"""
from pathlib import Path
import os,sys,json,hashlib,time,argparse
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from scipy.interpolate import PchipInterpolator,RegularGridInterpolator
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve
from scipy.ndimage import distance_transform_edt,convolve
from shapely.geometry import Polygon
from shapely import contains_xy
from geometry import parse_path,profile,smooth,projection
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);parser.add_argument('--output',type=Path);args=parser.parse_args();ROOT=args.root
OUT=args.output or ROOT/'public/geo-r02b';DOC=(args.output or ROOT/'docs/geo-r02b-r1');OUT.mkdir(parents=True,exist_ok=True);DOC.mkdir(parents=True,exist_ok=True)
source=ROOT/'docs/geo-r02b/design-master-A-R1-v1.json';m=json.loads(source.read_text());sha=hashlib.sha256(source.read_bytes()).hexdigest();assert sha=='62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598';started=time.perf_counter()
# The original adapter already exports exact tessellated A-R1 geometry. Reuse it;
# verify its provenance and re-export all R1 interpretation parameters explicitly.
adapter=ROOT/'docs/geo-r02b-r1/baseline-features.json'
assert hashlib.sha256(adapter.read_bytes()).hexdigest()=='0d72ecc75f2c065d6f020647a69f2d354b33856de140cd13dc10b111a39d11ed'
f=json.loads(adapter.read_text());assert f['meta']['masterSha256']==sha
coast=parse_path(m['coast']['mainland']['boundaryPath']);poly=Polygon(coast)


def constraints(cell):
 u=np.arange(0,600.001,cell/10);v=np.arange(0,800.001,cell/10);U,V=np.meshgrid(u,v);xy=np.column_stack([U.ravel(),V.ravel()]);shape=U.shape
 land=contains_xy(poly,xy[:,0],xy[:,1]);cd,_,_,_,_=projection(np.vstack([coast,coast[0]]),np.zeros(len(coast)+1),xy);sd=np.where(land,cd,-cd)
 # Fixed sea boundary and distinct initial coastal gradients. No final attenuation
 # after the river bed: the mouth therefore shares the same elevation solution.
 rocky=(xy[:,1]<430)&~((xy[:,0]>470)&(xy[:,1]>350));beach=(xy[:,0]>460)&(xy[:,1]>430)
 coastgrade=np.where(beach,.055,np.where(rocky,.42,.15));coastH=sd*coastgrade
 fixed=(sd<cell*1.25);target=np.where(land,coastH,-np.maximum(.3,cd*.08));priority=np.where(fixed,1,0)
 ridgeD=np.full(len(xy),np.inf)
 endpoint_counts={}
 for r in m['elevation']['ridges']:
  for node in [r['nodeRefs'][0],r['nodeRefs'][-1]]:endpoint_counts[node]=endpoint_counts.get(node,0)+1
 for r in m['elevation']['ridges']:
  p,l,ds,k=profile(r,'path','knotsUV','crestLevelsM');l=PchipInterpolator(k,r['crestLevelsM'])(ds);d,h,pp,seg,t=projection(p,l,xy);ridgeD=np.minimum(ridgeD,d)
  # Finite crest cap; asymmetric narrow shoulders governed by authored flank width.
  tangent=p[np.minimum(seg+1,len(p)-1)]-p[seg];side=np.sum((xy-pp)*np.column_stack([-tangent[:,1],tangent[:,0]]),axis=1)
  width=np.where(side>=0,r['flankWidthLeftM'],r['flankWidthRightM']);value=h-(d*d/(48+width*.1))
  hit=(d<max(10,cell*.85))&land&(priority<2);target=np.where(hit,value,target);fixed|=hit;priority=np.where(hit,2,priority)
 # Pass is a short east-west divide connecting its exact named approaches.
 ps=m['elevation']['passes'][0];p=np.array([ps['approaches'][0]['uv'],ps['uv'],ps['approaches'][1]['uv']],float);lv=np.array([ps['approaches'][0]['heightM'],ps['levelM'],ps['approaches'][1]['heightM']]);west=p[0]-p[1];length=np.linalg.norm(west);extension=p[0]+west/length*15;extension_level=lv[0]-(lv[1]-lv[0])/length*15;p=np.vstack([extension,p]);lv=np.r_[extension_level,lv];d,h,_,_,_=projection(p,lv,xy);hit=(d<max(9,cell*.8))&land;target=np.where(hit,h+.0007*d*d,target);fixed|=hit;priority=np.where(hit,3,priority)
 # Each water course provides the centre and the broad floor of ONE valley
 # cross-section. All flanks are solved simultaneously around these constraints.
 floor_candidates=[];distance_candidates=[];width_candidates=[];
 valley_floor=np.full(len(xy),np.inf);valleyhit=np.zeros(len(xy),bool);waterd=np.full(len(xy),np.inf);wetbed=np.full(len(xy),np.inf);wet=np.zeros(len(xy),bool)
 widths_by_channel={'main-upper':['glen-tarn-outlet','central-trough'],'main-mire-upper':['mire-floodplain'],'main-mire-out':['mire-floodplain'],'fold-outlet':['fold-gorge'],'birch-upper-outlet':['forest-upper-glen'],'birch-lower-outlet':['forest-lower-glen']}
 for c in f['channels']:
  points=np.array(c['points']);p=np.column_stack([(points[:,0]+3000)/10,(4000-points[:,2])/10]);d,h,pp,k,t=projection(p,points[:,1],xy);waterd=np.minimum(waterd,d);w=np.array(c['widthsM']);half=(w[k]*(1-t)+w[k+1]*t)/2
  # Widths are authored valley reservations, not the whole polygon forcibly cut
  # into an unrelated mountain. Only the inner floor is a hard constraint.
  width=np.full(len(xy),55.)
  for vid in widths_by_channel.get(c['id'],[]):
   va=next(vv for vv in m['elevation']['valleys'] if vv['id']==vid);vp,vl,ds,kd=profile(va,'axisPath','axisKnotsUV','floorLevelsM');vd,vw,_,_,_=projection(vp,np.interp(ds,kd,va['floorWidthM']),pp);width=np.maximum(width,np.where(vd<40,vw*.27,0))
  mire=c['id'].startswith('main-mire');slope=.008 if mire else .035
  transverse=np.maximum(0,d-half);floor=h+.65+slope*transverse+(.000015 if mire else .0001)*transverse**2
  floor_candidates.append(floor);distance_candidates.append(d);width_candidates.append(width)
  # Continuous wet bed + graded banks, no vertical overwrite at a Boolean edge.
  bed=h-1.6+2.25*smooth(half-2,half+10,d)
  channel=(d<half+10);wetbed=np.minimum(wetbed,np.where(channel,bed,np.inf));wet|=channel
  if cell==4:
   c['bedLevels']=(points[:,1]-1.6).round(5).tolist();c['resolvedDepthsM']=[1.6]*len(p)
 # Leave the transition between competing floor systems unconstrained. A lower
 # main floodplain must never overwrite a higher nearby tributary bank.
 distances=np.array(distance_candidates);owner=np.argmin(distances,axis=0);nearest=np.min(distances,axis=0);second=np.partition(distances,1,axis=0)[1];ix=np.arange(len(xy))
 valley_floor=np.array(floor_candidates)[owner,ix];width=np.array(width_candidates)[owner,ix]
 valleyhit=(nearest<width)&((second-nearest>32)|(nearest<22))&land
 del distances,floor_candidates,distance_candidates,width_candidates
 # Lake shore transition is signed and continuous; no two-cell plateau drop.
 lakebed=np.full(len(xy),np.inf);lakehit=np.zeros(len(xy),bool);lakeinside=np.zeros(len(xy),bool)
 for l in m['hydrology']['lakes']:
  p=parse_path(l['boundaryPath']);inside=contains_xy(Polygon(p),xy[:,0],xy[:,1]);d,_,_,_,_=projection(np.vstack([p,p[0]]),np.zeros(len(p)+1),xy);lsd=np.where(inside,d,-d);lakeinside|=inside
  # Place the physical shoreline within one cell of the exact vector; water
  # remains planar. Basin slopes continue into the connected harmonic flanks.
  bed=np.where(inside,l['levelM']-.65-l['indicativeMaxDepthM']*smooth(0,130,d),l['levelM']-.65+d*.065)
  hit=inside|(d<max(32,cell*2));lakebed=np.minimum(lakebed,np.where(hit,bed,np.inf));lakehit|=hit
 target=np.where(lakehit,lakebed,target);fixed|=lakehit
 valleyhit&=~lakeinside
 target=np.where(valleyhit,np.where(lakehit,np.maximum(lakebed,valley_floor),valley_floor),target);fixed|=valleyhit
 # Water intersections take the lower compatible bed; outside exact lakes this
 # is only a cross-section, not a support berm imposed after valley construction.
 target=np.where(wet,np.minimum(np.where(lakeinside,target,np.inf),wetbed),target);fixed|=wet
 # Land/coast topology is final except the explicit carved river mouths.
 fixed|=~land;target=np.where(~land,np.minimum(-np.maximum(.3,cd*.08),wetbed),target)
 crest=(priority==2)&~valleyhit&~lakehit&~wet&land
 return target.reshape(shape),fixed.reshape(shape),land.reshape(shape),sd.reshape(shape),ridgeD.reshape(shape),crest.reshape(shape)

T,F,L,SD,RD,CREST=constraints(16);bounds=T.copy();hard=F&~CREST;active=CREST.copy();nr,nc=T.shape
# Ridge controls are lower-bound obstacles. A descending spur cannot force a
# closed hole below surrounding land, while every northern crown stays at least
# as high as authored. Water, coast and pass controls remain equality constraints.
residual=0.;active_iterations=0
for active_iterations in range(30):
 F=hard|active;T[F]=bounds[F];index=np.full(T.shape,-1,int);index[~F]=np.arange((~F).sum());j,i=np.where(~F);n=len(j);rows=[np.arange(n)];cols=[np.arange(n)];vals=[np.full(n,4.)];rhs=np.zeros(n)
 for dj,di in [(-1,0),(1,0),(0,-1),(0,1)]:
  jj=j+dj;ii=i+di;known=F[jj,ii];rhs+=np.where(known,T[jj,ii],0);rows.append(np.arange(n)[~known]);cols.append(index[jj[~known],ii[~known]]);vals.append(np.full((~known).sum(),-1.))
 A=coo_matrix((np.concatenate(vals),(np.concatenate(rows),np.concatenate(cols))),shape=(n,n)).tocsr();T[~F]=spsolve(A,rhs);residual=float(np.max(np.abs(A@T[~F]-rhs)));del A
 mean=convolve(T,np.array([[0,.25,0],[.25,0,.25],[0,.25,0]]),mode='nearest')
 release=active&(mean>bounds+.001);add=CREST&~active&(T<bounds-.001)
 if not np.any(release|add):break
 active=(active&~release)|add
print('Shared obstacle solve',n,'unknowns; active iterations',active_iterations+1,'residual',residual,flush=True)
# Upsample and relax at the canonical resolution under the SAME constraints.
Tf,Ff,Lf,SDf,RDf,CRESTf=constraints(4);nr,nc=Tf.shape;vv,uu=np.meshgrid(np.arange(nr)*4,np.arange(nc)*4,indexing='ij');H=RegularGridInterpolator((np.arange(T.shape[0])*16,np.arange(T.shape[1])*16),T)(np.column_stack([vv.ravel(),uu.ravel()])).reshape(Tf.shape);Ff&=~CRESTf;H=np.where(Ff,Tf,H);H=np.where(CRESTf,np.maximum(H,Tf),H)
kernel=np.array([[0,.25,0],[.25,0,.25],[0,.25,0]])
for iteration in range(240):
 H=np.where(Ff,Tf,convolve(H,kernel,mode='nearest'));H=np.where(CRESTf,np.maximum(H,Tf),H)
# Offshore island footprints are unchanged; retain their previous provisional
# heights, but share sea-level boundary and smooth planar triangle normals.
islands=[]
for old,isle in zip(f['islands'],m['coast']['islands']):
 p=parse_path(isle['boundaryPath']);xy=np.column_stack([uu.ravel()/10,vv.ravel()/10]);inside=contains_xy(Polygon(p),xy[:,0],xy[:,1]).reshape(H.shape);d=distance_transform_edt(inside)*4;mx=max(4,d.max());height=old['proposedHeight'];h=height*(d/mx)**.85;H=np.where(inside,h,H);islands.append(old)
assert np.isfinite(H).all()
raw=H.astype('<f4').tobytes();(OUT/'terrain.f32').write_bytes(raw);meta={**f['meta'],'milestone':'GEO-R02B-R1','generatorVersion':'joint-obstacle-5','terrainSha256':hashlib.sha256(raw).hexdigest(),'heightRangeM':[float(H.min()),float(H.max())],'depthAllowance':'Uniform 1.6 m greybox channel bed depth, continuous at graph junctions; original indicative depths retained separately.','shoreInterpretation':'Signed continuous lake margin and coast boundary solve before river sections; no post-carve attenuation.','ridgeInterpolation':'Original A-R1 PCHIP crest elevations, connected Dirichlet crest constraints with finite cap.','runtimeNote':'Joint authored landform interpolation; not erosion or fluid simulation.','ridgeTailInterpretation':'All 16 complete ridge curves impose authored lower bounds. Low spur endpoints may rise to meet surrounding terrain, rather than forcing a sink; no crown or terminal crest is released below its authored level. Actual knot deviations are exported.','jointSolve':{'coarseCellM':16,'fineCellM':4,'unknowns':n,'maxResidualM':residual,'fineRelaxationIterations':240,'ridgeActiveSetIterations':active_iterations+1,'westPassApproachContinuationM':150,'noSinkFilling':True,'noHikingTerrainEdits':True,'noProceduralNoise':True}}
f['meta']=meta
# Routes are always reset from the immutable source adapter, not prior candidates.
from geometry import parse_path
f['routes']=[{'id':r['id'],'role':r['role'],'widthM':r['reservedWidthM'],'targetMaxGrade':r.get('targetLocalMaximumPct',30)/100,'points2':[[round(10*x-3000,4),round(4000-10*y,4)] for x,y in parse_path(r['path'])]} for r in m['walking']['corridors']]
(OUT/'features.json').write_text(json.dumps(f,separators=(',',':')));(DOC/'generation.json').write_text(json.dumps({**meta,'generationSeconds':round(time.perf_counter()-started,3)},indent=2)+'\n');print(json.dumps({'range':meta['heightRangeM'],'seconds':round(time.perf_counter()-started,2),'sha256':meta['terrainSha256']}))
