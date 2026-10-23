"""GEO-R02C-A1b-alpha visible-face operator (cut-only couloir / buttress relief on one measured, player-visible face).

Each couloir follows a real fall line of R1: it is traced by steepest descent on R1 smoothed at ~120 m support, starting a
fixed offset below the authored crest on the chosen side. Its depth ramps in only beyond the crest band, holds, and tapers
out into the face (a talus cone), so the crest, its lower bound and the summit never move. Cross-sections are rounded and
slightly asymmetric; depth, width, length and spacing are set per couloir in the spec (no noise, no repetition).
Buttresses between couloirs are left at R1. The operator returns D <= 0 only; the A1a freedom mask M still gates every cell."""
import numpy as np
from scipy import ndimage
import shapely
from shapely.geometry import LineString,Point

def smoothstep(t):t=np.clip(t,0.,1.);return t*t*(3-2*t)

class _Smooth:
 """R1 smoothed with a Gaussian of sigma = smoothM, sampled bilinearly (for fall-line tracing only)."""
 def __init__(self,R1,smoothM,cell=4.):self.H=ndimage.gaussian_filter(R1.astype(float),smoothM/cell);self.cell=cell
 def __call__(self,x,z):return ndimage.map_coordinates(self.H,[[(4000.-z)/self.cell],[(x+3000.)/self.cell]],order=1)[0]

def trace_fall_line(S,x,z,length,step=4.):
 pts=[(x,z)];s=0.
 while s<length:
  e=2.;gx=(S(x+e,z)-S(x-e,z))/(2*e);gz=(S(x,z+e)-S(x,z-e))/(2*e);g=np.hypot(gx,gz)
  if g<1e-4:break
  x-=gx/g*step;z-=gz/g*step;s+=step;pts.append((x,z))
 return np.array(pts)

def couloir_lines(op,ridges,R1):
 S=_Smooth(R1,op['traceSmoothM']);crest=LineString(np.array(ridges[op['ridge']])[:,[0,2]]);s0=crest.project(Point(*op['summit']))
 out=[]
 for c in op['couloirs']:
  s=s0+c['sFromSummitM'];p=crest.interpolate(s);q=crest.interpolate(s+2.);r_=crest.interpolate(s-2.)
  t=np.array([q.x-r_.x,q.y-r_.y]);t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])*op['side']   # side: +1 left of the crest direction, -1 right
  seed=np.array([p.x,p.y])+n*(op['seedOffsetM']+c.get('extraOffsetM',0.))
  if 'joins' in c:   # tributary: a curved path from its own head into a major couloir (quadratic Bezier, bent along the fall line)
   major=out[c['joins']['couloir']]['line'];ml=LineString(major);j=ml.interpolate(c['joins']['atM']);end=np.array([j.x,j.y])
   fl=trace_fall_line(S,seed[0],seed[1],np.hypot(*(end-seed))*.5);ctrl=fl[-1];tt=np.linspace(0,1,64)[:,None]
   line=(1-tt)**2*seed+2*(1-tt)*tt*ctrl+tt**2*end
  else:line=trace_fall_line(S,seed[0],seed[1],c['lengthM'])
  out.append({'spec':c,'seed':seed,'line':line})
 return out

def visible_faces(X,Z,op,ridges,R1,report=None):
 """D (<= 0) on the sub-grid X, Z for op (type 'visibleFaces')."""
 D=np.zeros(X.shape);lines=couloir_lines(op,ridges,R1);rep=[]
 crest=LineString(np.array(ridges[op['ridge']])[:,[0,2]])
 for cl in lines:
  c=cl['spec'];L=LineString(cl['line']);length=L.length
  wmax=max(b for _,b in c['widthAt']) if 'widthAt' in c else max(c['halfWidthM']);b=np.array(L.buffer(wmax*(1+abs(c.get('skew',0)))+8).bounds);box=(X>=b[0])&(X<=b[2])&(Z>=b[1])&(Z<=b[3])
  if not box.any():continue
  P=shapely.points(X[box],Z[box]);t=shapely.line_locate_point(L,P);near=shapely.line_interpolate_point(L,t)
  nx=X[box]-shapely.get_x(near);nz=Z[box]-shapely.get_y(near)
  tan=np.stack([shapely.get_x(shapely.line_interpolate_point(L,np.minimum(t+2,length)))-shapely.get_x(shapely.line_interpolate_point(L,np.maximum(t-2,0))),
                shapely.get_y(shapely.line_interpolate_point(L,np.minimum(t+2,length)))-shapely.get_y(shapely.line_interpolate_point(L,np.maximum(t-2,0)))],-1)
  tan/=np.linalg.norm(tan,axis=-1,keepdims=True)+1e-9;sn=tan[:,0]*nz-tan[:,1]*nx            # signed offset from the axis
  along=np.clip(nx*tan[:,0]+nz*tan[:,1],None,0)                                              # beyond the top end only
  frac=t/length
  if 'widthAt' in c:w=np.interp(frac,[a for a,_ in c['widthAt']],[b for _,b in c['widthAt']])          # half-width (m) by fraction of length
  elif len(c['halfWidthM'])==2:w=np.interp(frac,[0,.55,1],c['halfWidthM']+[c['halfWidthM'][1]*.85])
  else:w=np.interp(frac,np.linspace(0,1,len(c['halfWidthM'])),c['halfWidthM'])
  prof=np.interp(frac,[a for a,_ in c['depthAt']],[b for _,b in c['depthAt']]) if 'depthAt' in c else 1.   # depth multiplier by fraction
  sk=c.get('skew',0.);wl=w*(1+sk);wr=w*(1-sk);u=np.where(sn<0,sn/wl,sn/wr);u=np.hypot(u,along/(w*.6))
  fromCrest=shapely.distance(crest,P)   # true distance to the authored crest: no cut within rampInM[0] (crest band 10 m + A1a fade 6 m < 18 m)
  ramp=smoothstep((fromCrest-op['rampInM'][0])/(op['rampInM'][1]-op['rampInM'][0]))
  tail=1-smoothstep((t-(length-c['tailM']))/c['tailM']) if 'joins' not in c else np.ones_like(t);head=smoothstep(t/c['headM']) if 'headM' in c else 1.;depth=c['depthM']*ramp*tail*head*prof
  cut=-depth*np.clip(1-u*u,0,1)**op['crossExponent']
  sub=D[box];D[box]=np.minimum(sub,cut)
  rep.append({'sFromSummitM':c['sFromSummitM'],'seed':[round(float(v),1) for v in cl['seed']],'end':[round(float(v),1) for v in cl['line'][-1]],'tracedLengthM':round(float(length),1),'depthM':c['depthM']})
 if op.get('smoothCells'):D=np.minimum(0.,ndimage.gaussian_filter(D,op['smoothCells']))
 if report is not None:report['couloirs']=rep
 return D
