"""Terrain-only line-of-sight proxies for the three hero moments (no vegetation, no atmosphere).
A target point counts as visible when no terrain sample along the eye->target ray rises above the ray."""
import numpy as np
from shapely.geometry import Polygon,LineString
from shapely import contains_xy
from common import surface

def visible_fraction(H,ox,oz,tx,tz,eye=1.75,target_lift=1.,step=6.):
 oy=surface(H,[ox],[oz])[0]+eye;ty=surface(H,tx,tz)+target_lift;d=np.hypot(tx-ox,tz-oz);n=int(max(2,d.max()/step))
 s=(np.arange(1,n)/n)[None,:];blocked=np.zeros(len(tx),bool)
 for k in range(0,len(tx),2048):
  sl=slice(k,k+2048);xs=ox+(tx[sl]-ox)[:,None]*s;zs=oz+(tz[sl]-oz)[:,None]*s;ys=oy+(ty[sl]-oy)[:,None]*s
  blocked[sl]=(surface(H,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
 return float(1-blocked.mean())

def grid_in(poly,step):
 b=poly.bounds;xs,zs=np.meshgrid(np.arange(b[0],b[2],step),np.arange(b[1],b[3],step));xs=xs.ravel();zs=zs.ravel();m=contains_xy(poly,xs,zs);return xs[m],zs[m]

def along(H,line,tx,tz,start,end,step):
 out=[]
 for s in np.arange(start,end+1e-6,step):
  p=line.interpolate(min(s,line.length));out.append({'distanceM':round(float(s),1),'x':round(p.x,1),'z':round(p.y,1),'visiblePercent':round(100*visible_fraction(H,p.x,p.y,tx,tz),1)})
 return out

def reveal_report(H,f):
 route={r['id']:LineString(r['points2']) for r in f['routes']};hero=route['hero']
 valley=Polygon(next(v for v in f['valleys'] if v['id']=='central-trough')['boundary']);lake=Polygon(next(l for l in f['lakes'] if l['id']=='hidden-lake')['boundary'])
 vx,vz=grid_in(valley,40);lx,lz=grid_in(lake,16)
 xs,zs=np.meshgrid(np.arange(-2600,2600,50.),np.arange(-500,2400,50.));xs=xs.ravel();zs=zs.ravel();land=surface(H,xs,zs)>0
 west=land&(xs<-150);east=land&(xs>250);nx,nz=np.meshgrid(np.arange(-1500,2200,60.),np.arange(1300,3600,60.));nx=nx.ravel();nz=nz.ravel();nl=surface(H,nx,nz)>0
 end=hero.length
 return {'method':'terrain-only line of sight on the rendered triangle surface; eye 1.75 m, target +1 m, 6 m ray steps; a proxy, not a walkthrough',
  'centralValleyFloorAlongHero':along(H,hero,vx,vz,0,end,200),
  'cairnAscentFinal1600m':{'westOfDivide':along(H,hero,xs[west],zs[west],end-1600,end,100),'eastOfDivide':along(H,hero,xs[east],zs[east],end-1600,end,100),
   'northLandscape':along(H,hero,nx[nl],nz[nl],end-1600,end,100)},
  'hiddenLakeFromHero':along(H,hero,lx,lz,0,end,150),'hiddenLakeAlongHiddenLoop':along(H,route['hidden-loop'],lx,lz,0,route['hidden-loop'].length,100)}
