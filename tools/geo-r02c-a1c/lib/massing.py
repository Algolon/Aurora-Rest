"""GEO-R02C-A1c macro-massing operators (trial R-B raises; no crest moves, no lowering of crest cells).

ridgeMassing: broad raises centred on an authored crest line. Along the crest, a piecewise smoothstep profile of raise (m)
against arclength; across it, the full raise within coreM of the crest line, falling with a smoothstep to zero at a
separately chosen width on each flank, so a raised segment thickens the whole arm as a shoulder instead of standing up as a
wall. Several segments combine by maximum. The crest line itself never moves.
buttress (S2 only): a broad cut-and-fill flank structure attached to a ridge: a raised spur along a fall line that starts on
the crest shoulder, with a matching shallow hollow beside it, both fading out on the face."""
import numpy as np
import shapely
from shapely.geometry import LineString,Point

def smoothstep(t):t=np.clip(t,0.,1.);return t*t*(3-2*t)

def profile(s,pts):
 """Piecewise smoothstep interpolation of [[s, value], ...] (value held flat outside the range)."""
 xs=np.array([p[0] for p in pts],float);ys=np.array([p[1] for p in pts],float);s=np.asarray(s,float)
 k=np.clip(np.searchsorted(xs,s)-1,0,len(xs)-2);t=smoothstep((s-xs[k])/(xs[k+1]-xs[k]));v=ys[k]+(ys[k+1]-ys[k])*t
 return np.where(s<=xs[0],ys[0],np.where(s>=xs[-1],ys[-1],v))

def _frame(L,X,Z,box):
 P=shapely.points(X[box],Z[box]);t=shapely.line_locate_point(L,P);near=shapely.line_interpolate_point(L,t)
 a=shapely.line_interpolate_point(L,np.minimum(t+3,L.length));b=shapely.line_interpolate_point(L,np.maximum(t-3,0))
 tx=shapely.get_x(a)-shapely.get_x(b);tz=shapely.get_y(a)-shapely.get_y(b);n=np.hypot(tx,tz)+1e-9;tx/=n;tz/=n
 ox=X[box]-shapely.get_x(near);oz=Z[box]-shapely.get_y(near);return t,tx*oz-tz*ox,np.hypot(ox,oz)   # arclength, signed offset (+ = left), distance

def ridge_massing(X,Z,op,ridges,report=None):
 R=np.zeros(X.shape);rep=[]
 for seg in op['segments']:
  L=LineString(np.array(ridges[seg['ridge']])[:,[0,2]]);s0=L.project(Point(*seg['origin'])) if 'origin' in seg else 0.
  wl,wr=seg['widthM']['left'],seg['widthM']['right'];core=seg.get('coreM',12.)
  b=np.array(L.buffer(max(wl,wr)+8).bounds);box=(X>=b[0])&(X<=b[2])&(Z>=b[1])&(Z<=b[3])
  t,sn,dist=_frame(L,X,Z,box);s=t-s0
  w=np.where(sn>=0,wl,wr);cross=np.where(dist<=core,1.,smoothstep(1-(dist-core)/(w-core)))
  lo,hi=seg['profile'][0][0],seg['profile'][-1][0];along=np.where((s>=lo)&(s<=hi),profile(s,seg['profile']),0.)
  # ends of the line: no extrapolated "caps" beyond the polyline ends
  endcap=(t<=0.5)|(t>=L.length-.5);r=np.where(endcap,0.,along*cross)
  sub=R[box];R[box]=np.maximum(sub,r)
  rep.append({'id':seg['id'],'ridge':seg['ridge'],'sRangeM':[lo,hi],'maxRaiseM':max(p[1] for p in seg['profile']),'widthM':seg['widthM']})
 if report is not None:report['segments']=rep
 return R

def buttresses(X,Z,op,ridges,R1,report=None):
 """S2: broad attached spurs (fill) with a hollow beside each (cut); each defined by a polyline that starts on a ridge shoulder."""
 D=np.zeros(X.shape);rep=[]
 for b_ in op['buttresses']:
  L=LineString(b_['line']);bb=np.array(L.buffer(b_['halfWidthM']*2.6+8).bounds);box=(X>=bb[0])&(X<=bb[2])&(Z>=bb[1])&(Z<=bb[3])
  t,sn,dist=_frame(L,X,Z,box);f=t/L.length
  amp=profile(f,b_['raiseAt']);w=b_['halfWidthM']*profile(f,b_.get('widthAt',[[0,1],[1,1]]))
  spur=amp*np.clip(1-(dist/w)**2,0,1)**2
  side=b_['hollowSide'];hc=sn*side;hollow=-b_['hollowDepthM']*profile(f,b_['hollowAt'])*np.clip(1-((hc-1.6*w)/(0.9*w))**2,0,1)**2*(hc>0)
  sub=D[box];D[box]=sub+spur+hollow
  rep.append({'id':b_['id'],'lengthM':round(float(L.length)),'maxRaiseM':max(p[1] for p in b_['raiseAt']),'hollowDepthM':b_['hollowDepthM']})
 if report is not None:report['buttresses']=rep
 return D
