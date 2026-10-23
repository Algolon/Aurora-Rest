"""MEASURED: could a player ever see the NE hollow (proposed C1-R site)? Terrain-only visibility of the hollow footprint
(25 m grid) from points every 60 m along the A1 (n-crown) and A2 (n-main SE arm) crests and from the summit, eye 1.75 m.
Output: data/c1_overlook.json"""
from b_common import *
from shapely.geometry import Polygon,LineString
from shapely import contains_xy
hol=json.loads((DATA/'hollows.json').read_text())['hollows']['NE'];P=Polygon(hol['footprint'])
b=P.bounds;gx,gz=np.meshgrid(np.arange(b[0],b[2],25.),np.arange(b[1],b[3],25.));m=contains_xy(P,gx,gz);tx=gx[m];tz=gz[m];R=r1()
upper=np.array([surface(R,[x],[z])[0]>=560 for x,z in zip(tx,tz)])
def vis(ox,oz):
 oy=surface(R,[ox],[oz])[0]+1.75;ty=surface(R,tx,tz)+1;d=np.hypot(tx-ox,tz-oz);n=int(max(2,d.max()/5));s=(np.arange(1,n)/n)[None,:]
 xs=ox+(tx-ox)[:,None]*s;zs=oz+(tz-oz)[:,None]*s;ys=oy+(ty-oy)[:,None]*s;return ~(surface(R,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
out={'method':__doc__.strip(),'targets':int(m.sum()),'upperTargets(>=560m, cirque zone)':int(upper.sum()),'points':[]}
for rid,label in (('n-crown','A1'),('n-main','A2')):
 p=ridge(rid)[:,[0,2]];L=LineString(p);s0=L.project(LineString([(-520,2770),(-520,2770.1)]).interpolate(0))
 for s in np.arange(0,520,60.):
  if rid=='n-main':s_=s0+s
  else:s_=s
  q=L.interpolate(s_) if rid=='n-main' else L.interpolate(s);
  if rid=='n-main' and np.hypot(q.x+230,q.y-2540)<30:break
  v=vis(q.x,q.y);out['points'].append({'arm':label,'sFromSummitM':int(s),'xz':[r(q.x),r(q.y)],'heightM':r(surface(R,[q.x],[q.y])[0]),'visibleAllPct':r(100*v.mean()),'visibleCirqueZonePct':r(100*v[upper].mean())})
  print(out['points'][-1])
dump('c1_overlook.json',out)
