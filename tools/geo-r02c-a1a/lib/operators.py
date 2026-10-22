"""A1a sculpt operators. Each returns a design displacement D (metres) on the window sub-grid; the overlay multiplies
by the freedom mask M. Deterministic: no random numbers; along-feature variation is a fixed sum of long-wavelength
sinusoids (>= 100 m), never micro-noise."""
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
from grid import CELL,surface

def smoothstep(t):t=np.clip(t,0.,1.);return t*t*(3-2*t)

def skew_bump(t,a,b):
 """0 at t=0 and t=1, peak 1 at t=a/(a+b). a > 1 keeps the start smooth; b > a gives a long gentle return."""
 t=np.clip(t,0.,1.);p=a/(a+b);return (t**a*(1-t)**b)/(p**a*(1-p)**b)

def modulation(s,terms):
 return 1.+sum(amp*np.sin(2*np.pi*s/wl+ph) for amp,wl,ph in terms)

def densify(points,step=2.):
 p=np.asarray(points,float);seg=np.hypot(*np.diff(p,axis=0).T);out=[p[0]]
 for k,L in enumerate(seg):
  n=max(1,int(np.ceil(L/step)));out.extend(p[k]+(p[k+1]-p[k])*(np.arange(1,n+1)/n)[:,None])
 q=np.array(out);s=np.r_[0,np.cumsum(np.hypot(*np.diff(q,axis=0).T))];return q,s

def line_frame(points,X,Z,max_d=400.):
 """Nearest-point frame: distance d, arc length s, signed side (+1 left of travel direction), along-overrun beyond the ends."""
 q,s=densify(points);tree=cKDTree(q);P=np.c_[X.ravel(),Z.ravel()];d,k=tree.query(P,distance_upper_bound=max_d)
 ok=np.isfinite(d);k=np.where(ok,k,0);t=q[np.minimum(k+1,len(q)-1)]-q[np.maximum(k-1,0)];t/=np.linalg.norm(t,axis=1)[:,None]+1e-12
 v=P-q[k];cross=t[:,0]*v[:,1]-t[:,1]*v[:,0];along=np.sum(t*v,axis=1)
 over=np.where(k==0,np.maximum(0,-along),np.where(k==len(q)-1,np.maximum(0,along),0.))
 sh=X.shape;return np.where(ok,d,np.inf).reshape(sh),s[k].reshape(sh),np.sign(cross).reshape(sh),over.reshape(sh),s[-1]

def _arm_line(op,ridge_points):
 """Arete polyline from the summit ('from') toward 'to' (either direction along the authored ridge) or for 'lengthM'."""
 q,s=densify(np.asarray(ridge_points)[:,[0,2]]);k0=int(np.argmin(np.hypot(*(q-op['from']).T)))
 if 'to' in op:
  k1=int(np.argmin(np.hypot(*(q-op['to']).T)));q=q[k0:k1+1] if k1>=k0 else q[k1:k0+1][::-1]
 else:
  q=q[k0:] if len(q)-k0>=k0 else q[:k0+1][::-1]
  s=np.r_[0,np.cumsum(np.hypot(*np.diff(q,axis=0).T))];q=q[s<=op['lengthM']]
 assert len(q)>10,'arete polyline too short: '+op['id']
 return q

def faces(X,Z,op,ridges,R1full,M=None,report=None,crest_band_m=10.):
 """Face-cut sculpt of several aretes at once. Each arete i proposes a face target T_i hanging from the R1 height at
 the edge of its frozen crest band (designed drop profile, PCHIP knots, per side). Every other authored ridge proposes
 'keep R1'. Targets are blended with weights exp(-(d_i - d_min)/tau) (smooth partition of unity over ridge proximity),
 so faces meet in soft couloir creases and never undercut a neighbouring ridge or divide. Surface = min(R1, T).
 A face is sculpted only if at least op['minFaceFreedom'] of its band (10-150 m from the crest) is unprotected in M:
 a mostly frozen face would otherwise be cut only in the sliver the mask leaves, and take the mask's shape."""
 from scipy.interpolate import PchipInterpolator
 P=np.c_[X.ravel(),Z.ravel()];R=R1full[np.rint((4000-Z)/CELL).astype(int),np.rint((X+3000)/CELL).astype(int)].astype(float).ravel()
 lines=[];props=[];used=[]
 for arm in op['arms']:
  q=_arm_line(arm,ridges[arm['ridge']]);used.append(q);d,sa,side,over,L=line_frame(q,X,Z,max_d=2000.)
  d=d.ravel();sa=sa.ravel();side=side.ravel();over=over.ravel()
  tree=cKDTree(q);_,k=tree.query(P);t=q[np.minimum(k+1,len(q)-1)]-q[np.maximum(k-1,0)];t/=np.linalg.norm(t,axis=1)[:,None]+1e-12
  n=np.c_[-t[:,1],t[:,0]]*side[:,None];edge=surface(R1full,q[k,0]+n[:,0]*crest_band_m,q[k,1]+n[:,1]*crest_band_m)
  along=smoothstep(sa/arm.get('startRampM',1e-6))*(1-smoothstep((sa-(L-arm['endRampM']))/arm['endRampM']))*(1-smoothstep(over/40.))
  T=R.copy()
  for key,sgn in (('left',1),('right',-1)):
   sp=arm.get(key)
   if not sp:continue
   if M is not None:
    band=((side==sgn)&(d>crest_band_m)&(d<150)&(over<1)).reshape(X.shape);free=float((M[band]>0).mean()) if band.any() else 0.
    ok=free>=op['minFaceFreedom']
    if report is not None:report[f"{arm['id']}-{key}"]={'unprotectedFraction':round(free,3),'sculpted':ok}
    if not ok:continue
   kn=np.array(sp['profile']);f=PchipInterpolator(kn[:,0],kn[:,1]);dd=np.maximum(0,d-crest_band_m);se=(kn[-1,1]-kn[-2,1])/(kn[-1,0]-kn[-2,0])
   drop=np.where(dd<=kn[-1,0],f(np.minimum(dd,kn[-1,0])),kn[-1,1]+(dd-kn[-1,0])*se)*modulation(sa,sp.get('mod',[]))
   cut=np.minimum(0,edge-drop-R);cut=-arm['maxCutM']*(1-np.exp(cut/arm['maxCutM']))
   T=np.where((side==sgn)&(d>crest_band_m),R+cut*along,T)
  lines.append(d);props.append(T)
 # every other authored ridge (including the parts of n-main / n-crown outside the sculpted arms) keeps R1
 other=[]
 for rid,pts in ridges.items():
  q,_=densify(np.asarray(pts)[:,[0,2]])
  for u in used:
   du,_=cKDTree(u).query(q);q=q[du>1.]
  if len(q):other.append(q)
 do,_=cKDTree(np.vstack(other)).query(P);lines.append(do);props.append(R)
 Dm=np.vstack(lines);dmin=Dm.min(axis=0);w=np.exp(-(Dm-dmin)/op['blendTauM']);w/=w.sum(axis=0)
 T=(w*np.vstack(props)).sum(axis=0);k=op['footSoftM']
 # soft minimum of R1 and the blended face target: the face foot becomes a smooth concave curve, never a fold line
 cut=np.minimum(0,-k*np.logaddexp(-R/k,-T/k)+k*np.log(2.)*np.exp(-np.abs(T-R)/k)-R).reshape(X.shape)
 return gaussian_filter(cut,op.get('smoothCells',1.))

def cirque(X,Z,R1sub,op):
 """C1-type cirque as a target surface T (excavation only): elliptical-distance bowl rho with an irregular plan outline
 (low-order angular harmonics), a slightly U-shaped floor graded toward the lip, and a concave headwall rising with rho.
 Surface = min(R1, T). The cut fades out across the lip (flow-aligned), so the downstream side opens onto the existing
 slope as an amphitheatre threshold instead of closing into a crater rim."""
 cx,cz=op['centre'];dx=X-cx;dz=Z-cz;th=np.arctan2(dz,dx)
 shape=1+sum(a*np.cos(k*th+ph) for a,k,ph in op['outlineHarmonics'])
 rho=np.hypot(dx/op['rxM'],dz/op['rzM'])/shape
 az=np.radians(op['flowAzimuthDeg']);u=dx*np.sin(az)+dz*np.cos(az);v=-dx*np.cos(az)+dz*np.sin(az)
 lipx=op['lipX'];span=op['floorLengthM'];f=op['lipM']+(op['floorWestM']-op['lipM'])*np.clip((lipx-X)/span,0,1)+op['floorDishM']*np.clip(np.abs(v)/op['rzM'],0,1)**2
 T=f+op['headwallCoeffM']*np.maximum(0,rho-1)**op['headwallExponent']
 D=np.minimum(0.,T-R1sub)*(1-smoothstep((rho-op['fadeStartRho'])/op['fadeWidthRho']))
 D=D*(1-smoothstep((u-(op['lipU']-op['lipFadeM']))/(op['lipFadeM']+op['lipOvershootM'])))
 D=gaussian_filter(D,op['rimSmoothCells']);return np.minimum(D,0.)

def gully(X,Z,R1full,op,channel,released_region):
 """G1: replace R1's flat valley-floor bench along one reach with an asymmetric V-gully. Bed and the R1 channel section
 (wet band) are untouched (mask). Target = soft-min(reconstructed hillslope, wall rising from the wet-band edge)."""
 pts=np.array(channel['points']);xz=pts[:,[0,2]];lvl=pts[:,1];q,s=densify(xz);L=s[-1]
 tree=cKDTree(q);P=np.c_[X.ravel(),Z.ravel()];d,k=tree.query(P,distance_upper_bound=op['halfWidthM']+20);ok=np.isfinite(d);k=np.where(ok,k,0)
 t=q[np.minimum(k+1,len(q)-1)]-q[np.maximum(k-1,0)];t/=np.linalg.norm(t,axis=1)[:,None]+1e-12;n=np.c_[-t[:,1],t[:,0]]
 v=P-q[k];side=np.sign(t[:,0]*v[:,1]-t[:,1]*v[:,0]);sk=s[k];level=np.interp(sk,np.r_[0,np.cumsum(np.hypot(*np.diff(xz,axis=0).T))],lvl)
 # bend direction from tangents 30 m up/downstream: outside of the bend is opposite the turning side
 kb=np.searchsorted(s,np.clip(sk-30,0,L));ka=np.searchsorted(s,np.clip(sk+30,0,L));ta=q[np.minimum(ka+1,len(q)-1)]-q[ka];tb=q[np.minimum(kb+1,len(q)-1)]-q[kb]
 turn=np.tanh((tb[:,0]*ta[:,1]-tb[:,1]*ta[:,0])/(np.linalg.norm(ta,axis=1)*np.linalg.norm(tb,axis=1)+1e-12)*op['bendGain'])
 outer=-turn*side  # +1 where this cell's side is the outside of the bend
 ang=np.radians(op['wallMidDeg']+op['wallBendDeg']*outer)*modulation(sk,op['angleMod'])
 sample=op['hillSampleM'];hl=surface(R1full,q[k,0]+n[:,0]*sample,q[k,1]+n[:,1]*sample);hr=surface(R1full,q[k,0]-n[:,0]*sample,q[k,1]-n[:,1]*sample)
 hill=hl+(hr-hl)*(sample-side*d)/(2*sample)
 wall=level+op['bankRiseM']+np.maximum(0,d-op['bankEdgeM'])*np.tan(ang)
 kk=op['kneeSoftM']*modulation(sk,op['kneeMod']);T=-kk*np.logaddexp(-hill/kk,-wall/kk)  # smooth minimum
 a,b=op['reachFraction'][0]*L,op['reachFraction'][1]*L;ramp=smoothstep((sk-a)/op['rampM'])*(1-smoothstep((sk-(b-op['rampM']))/op['rampM']))
 R=surface(R1full,P[:,0],P[:,1]);inside=ok&(d<=op['halfWidthM'])
 D=np.zeros(len(P));D[inside]=((T-R)*ramp)[inside];D=D.reshape(X.shape)
 inreach=(ok&(sk>=a)&(sk<=b)&(d<=op['halfWidthM'])).reshape(X.shape)
 # nearest-point frames jump across the inside of channel bends; smoothing removes those one-cell steps
 # (applied before the freedom mask, so protected cells stay exactly unchanged)
 return gaussian_filter(D,op['smoothCells'])*released_region,inreach
