"""MEASURED: the two broad hollows of the North Peak (NE hollow between A1 n-crown and A2/n-east-arc; NW hollow north-west
of the summit). Thalweg = steepest descent on the ~120 m-smoothed R1 surface; cross-sections perpendicular to it.
Output: data/hollows.json"""
from b_common import *
from scipy import ndimage
g=np.load(DATA/'geomorph.npz');H=g['H'];x0,x1,z0,z1=g['box'];Hs=ndimage.gaussian_filter(H,30/4);plan=g['plan'];aspect=g['aspect']
vis=json.loads((DATA/'visibility.json').read_text());vs=np.load(DATA/'viewshed.npz')
def hs_at(x,z):
 j=(z1-z)/4;i=(x-x0)/4;return ndimage.map_coordinates(Hs,[[j],[i]],order=1)[0]
W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX)
def raw(x,z):return surface(r1(),np.atleast_1d(x),np.atleast_1d(z))
def thalweg(x,z,step=8.,n=400):
 P=[(x,z)]
 for _ in range(n):
  e=2.;gx=(hs_at(x+e,z)-hs_at(x-e,z))/(2*e);gz=(hs_at(x,z+e)-hs_at(x,z-e))/(2*e);gn=np.hypot(gx,gz)
  if gn<1e-3 or raw(x,z)[0]<=1 or not (x0+300<x<x1-300 and z0+300<z<z1-300):break
  if np.isfinite(W[int((4000-z)/4),int((x+3000)/4)]):break
  x-=gx/gn*step;z-=gz/gn*step;P.append((x,z))
 return np.array(P)
GROUPS={'far':['birchwood','valley-shoulder','central-valley'],'tarn':['tarn-overlook','high-tarn','tarn-shore'],'route':[k for k in vis['viewpoints'] if k.startswith('route-')]}
def vis_share(poly_pts):
 from shapely.geometry import Polygon;from shapely import contains_xy
 P=Polygon(poly_pts);gx=vs['gx'];gz=vs['gz'];inside=contains_xy(P,gx,gz);land=surface(r1(),gx[inside],gz[inside])>0
 return {gname:r(100*np.mean(np.any([vs[k][inside][land] for k in ks],axis=0))) for gname,ks in GROUPS.items()}
out={'method':'Thalweg by steepest descent on R1 smoothed with a 30 m gaussian (about 120 m support); sections every 80 m perpendicular to the thalweg, '
 'rims = highest point within 260 m either side; depth = mean rim height minus thalweg height; plan curvature sign from geomorph.npz (<0 hollow). '
 'Visibility = share of land cells inside the hollow footprint visible from any viewpoint of each group (terrain only).','hollows':{}}
for hid,seed,lbl in [('NE','(-330,2900)','NE hollow between A1 (n-crown) and A2/n-east-arc; contains the A1-D/A1a C1 ellipse'),
                     ('NW','(-760,2900)','NW hollow under the summit north-west face, between n-main west arm / n-nw-cape and the north dome'),
                     ('TW','(-60,2620)','tarn-inlet-w head basin (A1-D C2 site) between A2 and n-east-arc, draining to High Tarn')]:
 sx,sz=eval(seed);T=thalweg(sx,sz);s=arclen(T);secs=[];foot_l=[];foot_r=[]
 for k in range(0,len(T),10):
  if k+1>=len(T):break
  t=T[min(k+1,len(T)-1)]-T[max(k-1,0)];t=t/np.linalg.norm(t);nrm=np.array([-t[1],t[0]]);d=np.arange(-260,261,4.)
  pts=T[k]+d[:,None]*nrm;h=raw(pts[:,0],pts[:,1]);L=h[d<0];R=h[d>0];hl=L.max();hr=R.max();dl=-d[d<0][np.argmax(L)];dr=d[d>0][np.argmax(R)]
  secs.append({'sM':r(s[k]),'xz':[r(T[k][0]),r(T[k][1])],'thalwegM':r(raw(*T[k])[0]),'rimLeftM':r(hl),'rimRightM':r(hr),'rimDistLeftM':r(dl),'rimDistRightM':r(dr),
   'widthRimToRimM':r(dl+dr),'depthBelowRimsM':r((hl+hr)/2-raw(*T[k])[0]),'shallowSideDepthM':r(min(hl,hr)-raw(*T[k])[0])})
  foot_l.append(T[k]-nrm*min(dl,200));foot_r.append(T[k]+nrm*min(dr,200))
 poly=foot_l+foot_r[::-1]
 j=((z1-T[:,1])/4).astype(int);i=((T[:,0]-x0)/4).astype(int)
 out['hollows'][hid]={'label':lbl,'seed':seed,'thalwegLengthM':r(s[-1]),'thalwegTopM':r(raw(*T[0])[0]),'thalwegEnd':[r(T[-1][0]),r(T[-1][1])],'thalwegEndHeightM':r(raw(*T[-1])[0]),
  'meanAspectDeg':r(np.degrees(np.angle(np.mean(np.exp(1j*np.radians(aspect[j,i])))))%360),'planCurvatureMean':float(np.mean(plan[j,i])),
  'thalweg':[[r(a),r(b)] for a,b in T[::5]],'sections':secs,'visibleSharePct':vis_share(poly),'footprint':[[r(a),r(b)] for a,b in poly]}
 h=out['hollows'][hid];print(hid,h['thalwegLengthM'],h['thalwegTopM'],'->',h['thalwegEndHeightM'],h['thalwegEnd'],'aspect',h['meanAspectDeg'],'vis',h['visibleSharePct'])
 for q in secs:print('  ',q['sM'],q['xz'],'th',q['thalwegM'],'rims',q['rimLeftM'],q['rimRightM'],'w',q['widthRimToRimM'],'depth',q['depthBelowRimsM'],'shallow',q['shallowSideDepthM'])
dump('hollows.json',out)
