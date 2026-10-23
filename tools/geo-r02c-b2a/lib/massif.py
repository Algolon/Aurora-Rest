"""GEO-R02C-B2a regional massif authoring (copied from tools/geo-r02c-b01/lib/massif.py, which stays the B1.1 reference; B2a adds
explicit ridge start/end caps, coastal terminal profiles and declared outlets). Original description:
GEO-R02C-B1 regional massif authoring: builds the North Peak heightfield from the derived design master
(tools/geo-r02c-b2a/design/north-massif-b2a.json). Structures first, then the integration with R1:

  base     R1 lowered by a smooth core bump (0 at the study-area edge and near the coast): the regional lowland envelope
  ridges   authored crest lines (PCHIP crest profile through summits and saddles, asymmetric concave flanks, limited reach)
  body     smooth-max of base and every ridge and buttress
  cirques  bowl + trough surfaces carved with a smooth-min (floor, concave headwall that reaches the rim level at the rim distance)
  detail   one seeded flank-rib field and crest roughness (low amplitude, slope-masked), talus limit, light smoothing
  blend    R1 + w (H - R1), w = 1 inside the study area, smoothstep to 0 at its edge, at the coast and on protected features

Every step is deterministic (fixed seed, no simulation)."""
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import gaussian_filter,distance_transform_edt

def smoothstep(t):t=np.clip(t,0.,1.);return t*t*(3-2*t)
def smax(a,b,k):h=np.maximum(k-np.abs(a-b),0.)/k;return np.maximum(a,b)+h*h*k*.25
def smin(a,b,k):h=np.maximum(k-np.abs(a-b),0.)/k;return np.minimum(a,b)-h*h*k*.25

def polyline_frame(knots,X,Z):
 """Nearest point on a polyline: arclength s, distance d, side (+1 left of travel), and t outside the ends (m beyond)."""
 P=np.asarray(knots,float)[:,:2];L=np.r_[0,np.cumsum(np.hypot(*np.diff(P,axis=0).T))]
 best=np.full(X.shape,np.inf);S=np.zeros(X.shape);side=np.ones(X.shape);beyond=np.zeros(X.shape);bS=np.zeros(X.shape);bE=np.zeros(X.shape)
 for k in range(len(P)-1):
  a,b=P[k],P[k+1];ab=b-a;l2=ab@ab;t=((X-a[0])*ab[0]+(Z-a[1])*ab[1])/l2
  tc=np.clip(t,0,1);px=a[0]+tc*ab[0];pz=a[1]+tc*ab[1];d=np.hypot(X-px,Z-pz)
  m=d<best;best[m]=d[m];S[m]=(L[k]+tc*np.sqrt(l2))[m]
  cr=ab[0]*(Z-a[1])-ab[1]*(X-a[0]);side[m]=np.where(cr>=0,1.,-1.)[m]
  o0=np.where(k==0,np.maximum(-t,0),0);o1=np.where(k==len(P)-2,np.maximum(t-1,0),0);beyond[m]=((o0+o1)*np.sqrt(l2))[m];bS[m]=(o0*np.sqrt(l2))[m];bE[m]=(o1*np.sqrt(l2))[m]
 polyline_frame.last=(bS,bE)
 return S,best,side,beyond,L

def crest_profile(knots,rough_amp,rough_wl,rng):
 K=np.asarray(knots,float);L=np.r_[0,np.cumsum(np.hypot(*np.diff(K[:,:2],axis=0).T))];f=PchipInterpolator(L,K[:,2])
 n=int(L[-1]//rough_wl)+3;ph=rng.uniform(0,1,n)*2-1
 def rough(s):  # smooth 1D value noise, zero at every knot so summits and saddles keep their authored levels
  u=s/rough_wl;i=np.floor(u).astype(int).clip(0,n-2);fr=u-i;w=fr*fr*(3-2*fr);v=ph[i]*(1-w)+ph[i+1]*w
  dk=np.min(np.abs(s[...,None]-L),axis=-1);return rough_amp*v*smoothstep(dk/25.)
 return lambda s,d=0.:f(np.clip(s,0,L[-1]))+rough(s)*np.exp(-np.asarray(d)/40.)

def flank_drop(d,p):
 g0,g1,Lc,pl=p['g0'],p['g1'],p['decayM'],p.get('plateauM',0.)
 dp=np.maximum(d-pl,0.);return .04*np.minimum(d,pl)+g1*dp+(g0-g1)*Lc*(1-np.exp(-dp/Lc))

def ridge_height(r,X,Z,rng,st,reach,g_far=0.):
 S,d,side,beyond,L=polyline_frame(r['knots'],X,Z);crest=crest_profile(r['knots'],st['crestRoughnessM'],st['crestRoughnessWavelengthM'],rng)
 left=r.get('flankLeft',r.get('flank'));right=r.get('flankRight',r.get('flank'))
 var=st.get('flankVariation',0.)  # flank width and steepness vary along the ridge (seeded, low frequency): no extruded cross-section
 if var:
  n=int(L[-1]//st['flankVariationWavelengthM'])+3;ph=rng.uniform(-1,1,(2,n));u=S/st['flankVariationWavelengthM'];i=np.floor(u).astype(int).clip(0,n-2);f=u-i;f=f*f*(3-2*f)
  m=[1+var*(ph[k][i]*(1-f)+ph[k][i+1]*f) for k in (0,1)]
  scale=lambda p,mm:{**p,'decayM':p['decayM']*mm,'g1':p['g1']/np.sqrt(mm)}
  drop=np.where(side>0,flank_drop(d,scale(left,m[0])),flank_drop(d,scale(right,m[1])))
  # B2a: explicit, authored end caps (only where a ridge declares them; B1.1 ridges without them keep their B1.1 shape)
  bS,bE=polyline_frame.last
  for key,b in (('startCap',bS),('endCap',bE)):
   if key in r:drop=drop+r[key]['grade']*np.maximum(b-r[key]['taperM'],0.)
 else:drop=np.where(side>0,flank_drop(d,left),flank_drop(d,right))+.9*np.maximum(beyond-r.get('endTaperM',120),0)
 return crest(S,d)-drop-g_far*np.maximum(d-reach,0.),d

def cirque_surface(c,X,Z):
 o=np.asarray(c['outDir'],float);o/=np.linalg.norm(o);n=np.array([-o[1],o[0]]);cx,cz=c['floorXZ']
 u=(X-cx)*o[0]+(Z-cz)*o[1];v=(X-cx)*n[0]+(Z-cz)*n[1];r0=c['floorRadiusM'];hw=c['troughHalfWidthM']
 K=(c['rimM']-c['floorM'])/(c['rimDistanceM']-r0)**c['wallP']
 wid=np.where(u<=0,r0,r0+(hw-r0)*smoothstep(u/max(c['troughLengthM'],1)))
 rho=np.where(u<=0,np.hypot(u,v),np.abs(v));wall=K*np.maximum(rho-wid,0)**c['wallP']
 floor=c['floorM']-c['floorTiltOut']*np.clip(u,0,r0)-c['troughGrade']*np.maximum(u-r0,0)
 lift=smoothstep((u-r0-c['troughLengthM'])/180.)*600  # trough fades out downslope
 return floor+wall+lift

def rib_field(shape,cell,wl,amp,rng):
 a=gaussian_filter(rng.standard_normal(shape),wl/cell/4.);a/=a.std()+1e-9
 b=gaussian_filter(rng.standard_normal(shape),wl/cell/9.);b/=b.std()+1e-9
 return amp*(.75*a+.25*b)

def talus(H,g,cell,iters=40):
 H=H.copy();lim=[(dj,di,g*cell*np.hypot(dj,di)) for dj in (-1,0,1) for di in (-1,0,1) if dj or di]
 for _ in range(iters):
  P=np.pad(H,1,mode='edge');m=H.copy()
  for dj,di,l in lim:m=np.minimum(m,P[1+dj:1+dj+H.shape[0],1+di:1+di+H.shape[1]]+l)
  if np.array_equal(m,H):break
  H=m
 return H

def build_body(design,R1s,X,Z,core,coast_taper,cell=4.,base_seed=None):
 st=design['structure'];rng=np.random.default_rng(st['noiseSeed'])
 bs=design['base'];base=gaussian_filter(R1s,bs['baseSmoothCells'])*core+R1s*(1-core)-bs['lowerM']*core*coast_taper*smoothstep((Z-bs['lowerTaperSouth'][0])/(bs['lowerTaperSouth'][1]-bs['lowerTaperSouth'][0]))*smoothstep((bs['lowerTaperEast'][0]-X)/(bs['lowerTaperEast'][0]-bs['lowerTaperEast'][1]))
 if base_seed is not None:base=epsilon_fill(base,base_seed,0.01)  # the lowland envelope drains on its own before any structure is added
 parts={};H=base.copy()
 dmin=np.full(X.shape,np.inf)
 for r in design['ridges']:h,dd=ridge_height(r,X,Z,rng,st,r.get('reachM',bs['ridgeReachM']),bs['farGrad']);dmin=np.minimum(dmin,dd);parts[r['id']]=h;H=smax(H,h,design['base']['blendK'])
 for b in design['buttresses']:h,dd=ridge_height(b,X,Z,rng,st,b.get('reachM',bs['buttressReachM']),bs['farGrad']);dmin=np.minimum(dmin,dd);parts[b['id']]=h;H=smax(H,h,design['base']['blendK'])
 # raise cap relative to R1: large on the authored crests, small away from them (the lower slopes keep their R1 character)
 cap=R1s+bs['raiseCapM'][0]+bs['raiseCapM'][1]*np.exp(-dmin/bs['raiseCapDecayM']);H=smin(H,cap,20.)
 body=H.copy()
 keep=np.ones(X.shape)  # carving fades out near every authored summit so the summit hierarchy keeps its levels
 for s in design['summits']:keep=np.minimum(keep,smoothstep((np.hypot(X-s['xz'][0],Z-s['xz'][1])-bs['summitKeepM'][0])/(bs['summitKeepM'][1]-bs['summitKeepM'][0])))
 for c in design['cirques']:cs=cirque_surface(c,X,Z);parts[c['id']]=cs;Hc=smin(H,cs,bs['carveK']);H=H+keep*(Hc-H)
 gy,gx=np.gradient(H,cell);slope=np.clip(np.hypot(gx,gy)/0.8,0,1)
 H=H+rib_field(H.shape,cell,st['flankRibWavelengthM'],st['flankRibAmplitudeM'],rng)*slope*core
 H=talus(H,st['maxGradient'],cell);H=gaussian_filter(H,st['smoothingSigmaCells'])
 return H,body,base,parts

def epsilon_fill(H,seed,eps=1e-3):
 """Priority flood with an epsilon gradient (8-connected): every non-seed cell ends strictly above the cell it drains to, so the
 conditioned surface has no closed depressions and no flats. Seeds (unchanged terrain, sea, water, grid border) are never raised."""
 import heapq
 nz,nx=H.shape;seed=seed.copy();seed[0,:]=seed[-1,:]=seed[:,0]=seed[:,-1]=True
 F=H.tolist();done=seed.tolist();heap=[(F[j][i],j,i) for j,i in zip(*np.nonzero(seed))];heapq.heapify(heap)
 N8=((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1));pop=heapq.heappop;push=heapq.heappush
 while heap:
  h,j,i=pop(heap)
  for dj,di in N8:
   a=j+dj;b=i+di
   if 0<=a<nz and 0<=b<nx and not done[a][b]:
    done[a][b]=True;v=F[a][b]
    if v<=h+eps:v=h+eps;F[a][b]=v
    push(heap,(v,a,b))
 return np.array(F)
