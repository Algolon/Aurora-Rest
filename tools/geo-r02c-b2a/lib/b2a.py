"""GEO-R02C-B2a geographic corrections on top of the B1.1 massif (each one declared in the B2a design master):
  terminal_factor  D1: authored terminal profiles. The authored difference to R1 decays smoothly to zero over a per-structure
                   terminal length before the frozen coast band, and over a declared length before protected corridors,
                   instead of being squeezed into the short blend feather.
  carve_outlet     D4: a natural outlet for a closed hollow: least-cut breach path from the hollow floor to freely draining ground,
                   carved as a small gully with a descending bed (editable cells only).
  apply_bench      D3: a trail bench (cut and fill) along route traverses on steep side-slope: a level tread core and
                   smooth cut/fill transitions, modelled in the rendered heightfield.
All deterministic."""
import heapq
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter1d
from massif import smoothstep

def _seg_dist(P,X,Z):
 P=np.asarray(P,float);best=np.full(X.shape,np.inf)
 for a,b in zip(P[:-1],P[1:]):
  ab=b-a;l2=ab@ab;t=np.clip(((X-a[0])*ab[0]+(Z-a[1])*ab[1])/l2,0,1);best=np.minimum(best,np.hypot(X-a[0]-t*ab[0],Z-a[1]-t*ab[1]))
 return best

def terminal_factor(design,X,Z,dcoast,dgully):
 """Multiplier T in [0, 1] for (authored - R1). Coast: smoothstep over [freeze, L], where L blends the declared terminal lengths of the
 nearby structures (inverse-square distance weights, so neighbouring arms can end differently without a seam between them)."""
 tc=design['terminals'];freeze=design['studyArea']['coastFreezeM'];num=np.zeros(X.shape);den=np.zeros(X.shape)
 geo={r['id']:np.array(r['knots'])[:,:2] for r in design['ridges']+design['buttresses']}
 for c in design['cirques']:
  o=np.asarray(c['outDir'],float);o/=np.linalg.norm(o);f=np.asarray(c['floorXZ'],float);geo[c['id']]=np.array([f,f+o*(c['floorRadiusM']+c['troughLengthM'])])
 for sid,L in tc['coastTerminalM'].items():
  if sid=='default':continue
  w=1./(_seg_dist(geo[sid],X,Z)+60.)**2;num+=w*L;den+=w
 w0=1./(tc['defaultInfluenceM']+60.)**2;L=(num+w0*tc['coastTerminalM']['default'])/(den+w0)
 T=smoothstep((dcoast-freeze)/np.maximum(L-freeze,1.))
 # protected summits near the coast keep their authored height: the arms taper only beyond them
 for s in design['summits']:
  if s['id'] in tc.get('protectSummits',[]):r0,fd=tc['summitProtectM'];T=np.maximum(T,1-smoothstep((np.hypot(X-s['xz'][0],Z-s['xz'][1])-r0)/fd))
 T*=smoothstep((dgully-tc['corridorBufferM'])/tc['corridorTerminalM'])
 return T,L

def _flood(H,seed):
 nz,nx=H.shape;F=H.copy();done=seed.copy();heap=[(F[j,i],j,i) for j,i in zip(*np.nonzero(seed))];heapq.heapify(heap)
 while heap:
  h,j,i=heapq.heappop(heap)
  for dj in (-1,0,1):
   for di in (-1,0,1):
    a=j+dj;b=i+di
    if (dj or di) and 0<=a<nz and 0<=b<nx and not done[a,b]:
     done[a,b]=True;F[a,b]=max(F[a,b],h);heapq.heappush(heap,(F[a,b],a,b))
 return F

def carve_outlet(H,X,Z,w,seed,o,cell=4.):
 """Returns (carved H, report). H, X, Z, w and seed are study-area sub-grids; seed marks cells that drain freely by definition."""
 from scipy import ndimage
 F=_flood(H,seed);dep=F-H;j0=int(np.argmin(np.hypot(X-o['nearXZ'][0],Z-o['nearXZ'][1])[...]));j0,i0=np.unravel_index(j0,H.shape)
 lab,_=ndimage.label(dep>0.3,structure=np.ones((3,3)));k=lab[j0,i0]
 if k==0:
  near=np.argmin(np.where(lab>0,np.hypot(X-o['nearXZ'][0],Z-o['nearXZ'][1]),np.inf));k=lab.flat[near]
 basin=lab==k;bj,bi=np.nonzero(basin);m=np.argmin(H[basin]);sj,si=bj[m],bi[m];floor=float(H[sj,si]);spill=float(F[sj,si])
 # least-cut path (Dijkstra): cost = horizontal length * (1 + cut depth above the basin floor), editable cells only
 nz,nx=H.shape;cost=np.full(H.shape,np.inf);cost[sj,si]=0;prev={};heap=[(0.,sj,si)];goal=None;lim=o.get('searchRadiusCells',120)
 while heap:
  c,j,i=heapq.heappop(heap)
  if c>cost[j,i]:continue
  if not basin[j,i] and H[j,i]<floor-o.get('dropM',1.5) and dep[j,i]<0.05:goal=(j,i);break
  for dj in (-1,0,1):
   for di in (-1,0,1):
    a=j+dj;b=i+di
    if not(dj or di) or not(0<=a<nz and 0<=b<nx) or abs(a-sj)>lim or abs(b-si)>lim or w[a,b]<=0:continue
    L=cell*np.hypot(dj,di);nc=c+L*(1+max(0.,H[a,b]-floor))
    if nc<cost[a,b]:cost[a,b]=nc;prev[(a,b)]=(j,i);heapq.heappush(heap,(nc,a,b))
 if goal is None:return H,{'status':'no outlet path within the editable area','floorM':floor,'spillM':spill}
 path=[goal]
 while path[-1]!=(sj,si):path.append(prev[path[-1]])
 path=path[::-1];P=np.array([[X[j,i],Z[j,i]] for j,i in path]);s=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))]
 tgt=float(H[goal]);g=min(o['bedGrade'],max((floor-tgt)/max(s[-1],1.)*0.9,0.002));bed=floor-g*s
 # carve along the smoothed path polyline, not its 8-connected grid staircase (a sub-cell channel following the staircase
 # aliases into a comb of notches): densify to 0.25 m, smooth the plan with sigma 6 m, keep both ends
 sd=np.arange(0,s[-1]+.25,.25);P=np.c_[np.interp(sd,s,P[:,0]),np.interp(sd,s,P[:,1])];bed=floor-g*sd
 P=np.c_[gaussian_filter1d(P[:,0],24,mode='nearest'),gaussian_filter1d(P[:,1],24,mode='nearest')]
 tree=cKDTree(P);d,ix=tree.query(np.c_[X.ravel(),Z.ravel()],distance_upper_bound=o['widthM']*1.5);d=d.reshape(H.shape);ix=ix.reshape(H.shape)
 near=np.isfinite(d)&(w>0);b=np.where(near,bed[np.clip(ix,0,len(bed)-1)],np.inf)
 chan=b+np.maximum(d-o['bedHalfWidthM'],0)*o['sideSlope'];Hn=np.where(near,np.minimum(H,chan),H)
 rep={'status':'outlet carved','floorM':round(floor,2),'previousSpillM':round(spill,2),'previousFillDepthM':round(spill-floor,2),'basinHa':round(float(basin.sum())*cell*cell/1e4,2),
  'pathLengthM':round(float(s[-1]),1),'bedGrade':round(g,4),'maxCutM':round(float((H-Hn).max()),2),'carvedCells':int((Hn<H).sum()),'outletEndXZ':[round(float(P[-1,0])),round(float(P[-1,1]))]}
 return Hn,rep

def apply_bench(H,X,Z,w,P,cfg,surface,cell=4.):
 """Trail bench along one route polyline P ([x, z], 1 m spacing) on the sub-grid H. Where the terrain cross-slope at +-4 m exceeds
 cfg['benchWhereCrossSlope'], grid nodes within cfg['treadHalfWidthM'] of the centreline are set to a smoothed tread level and nodes
 out to treadHalfWidthM + cutFillM are blended back to the terrain (cut-and-fill). Editable cells only. surface(x, z) samples H."""
 P=np.asarray(P,float);t=np.gradient(P,axis=0);t/=np.linalg.norm(t,axis=1,keepdims=True)+1e-9;n=np.c_[-t[:,1],t[:,0]]
 h=surface(P[:,0],P[:,1]);a=surface(P[:,0]+4*n[:,0],P[:,1]+4*n[:,1]);b=surface(P[:,0]-4*n[:,0],P[:,1]-4*n[:,1]);cross=np.abs(a-b)/8
 need=np.clip(gaussian_filter1d((cross>cfg['benchWhereCrossSlope']).astype(float),8)*3,0,1);hs=gaussian_filter1d(h,cfg['treadSmoothM'])
 need*=smoothstep((np.arange(len(P))-cfg.get('rampInSkipM',10))/cfg.get('rampInM',20))  # no bench where the new section joins the kept R1 alignment
 tree=cKDTree(P);R=cfg['treadHalfWidthM']+cfg['cutFillM'];d,ix=tree.query(np.c_[X.ravel(),Z.ravel()],distance_upper_bound=R);d=d.reshape(H.shape);ix=ix.reshape(H.shape)
 m=np.isfinite(d)&(w>0);ixc=np.clip(ix,0,len(P)-1);wt=np.where(m,need[ixc]*(1-smoothstep((d-cfg['treadHalfWidthM'])/cfg['cutFillM'])),0.)
 # hairpins: a node within reach of two legs (path points far apart along the route) is left as terrain, so the bench never steps
 # between the legs of a switchback; the route there runs on the original, grade-checked surface
 flat=np.nonzero(m.ravel())[0];pts=np.c_[X.ravel()[flat],Z.ravel()[flat]];hp=0
 for k,nb in zip(flat,tree.query_ball_point(pts,R)):
  if nb and max(nb)-min(nb)>2*R+10:wt.flat[k]=0.;hp+=1
 Hb=np.where(m,H+wt*(np.where(m,hs[ixc],H)-H),H)
 return Hb,{'hairpinNodesKept':hp,'benchedLengthM':int((need>0.5).sum()),'routeLengthM':int(len(P)),'nodesChanged':int((np.abs(Hb-H)>0.01).sum()),'maxCutM':round(float(np.max(H-Hb)),2),'maxFillM':round(float(np.max(Hb-H)),2)}
