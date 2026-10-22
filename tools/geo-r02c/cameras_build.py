"""Derive the GEO-R02C fixed review cameras from R1 route geometry (read-only) -> tools/geo-r02c/cameras.json.
Yaw follows the R1 viewer: 0 looks north (+z), pi/2 looks east (+x). Positions are world metres; uv is the
viewer's planning coordinate (u=(x+3000)/10, v=(4000-z)/10). Each camera records how it was derived."""
from pathlib import Path
import json,math,sys
import numpy as np
from shapely.geometry import LineString,Point,Polygon
sys.path.insert(0,str(Path(__file__).resolve().parent/'lib'))
from common import ROOT,load_features,load_grid,surface

f=load_features();H=load_grid(ROOT/'public/geo-r02b/terrain.f32');W=load_grid(ROOT/'public/geo-r02b/water-surface.f32')
route={r['id']:LineString(r['points2']) for r in f['routes']}
def at(rid,dist):p=route[rid].interpolate(dist);return p.x,p.y
def yaw_to(x,z,tx,tz):return math.atan2(tx-x,tz-z)
def cam(id,name,group,x,z,yaw,pitch,source):
 x,z=round(float(x),2),round(float(z),2)  # round first so xz, uv and groundM describe the same point
 h=float(surface(H,[x],[z])[0]);w=float(np.nan_to_num(surface(W,[x],[z])[0],nan=-1e9))
 assert h>max(0.,w)+.15,f'{id} is not on dry ground ({h:.2f} m, water {w:.2f} m)'
 return {'id':id,'name':name,'group':group,'uv':[round((x+3000)/10,4),round((4000-z)/10,4)],'xz':[x,z],
  'yaw':round(yaw,4),'pitch':pitch,'kind':'walk','groundM':round(h,2),'source':source}
hero=route['hero'];end=hero.length;peak=(-520.,2770.);cams=[]
# Hero Reveal 01: Birchwood -> Central Valley shoulder (line-of-sight proxy: 0-1 % at 2.4-3.2 km, 97 % at 3.4 km).
T=(350.,250.)
for id,d,label in (('cv-before',2800,'before'),('cv-partial',3200,'partial'),('cv-full',3400,'full')):
 x,z=at('hero',d);cams.append(cam(id,f'Central Valley approach · {label}','reveal-central-valley',x,z,yaw_to(x,z,*T),.02,f'hero route at {d} m, facing ({T[0]:.0f}, {T[1]:.0f})'))
# Hero Reveal 02: Cairn ascent from the east; the route ends on the col (40, 920).
col=(40.,920.)
for id,back,label in (('cairn-below-400',400,'400 m below the col'),('cairn-below-100',100,'100 m below the col')):
 x,z=at('hero',end-back);cams.append(cam(id,f'Cairn ascent · {label}','reveal-cairn',x,z,yaw_to(x,z,*col),.03,f'hero route at {end-back:.0f} m (end {end:.0f} m), facing the col'))
cams.append(cam('cairn-col-west','Cairn col · facing west','reveal-cairn',*col,-math.pi/2,.0,'pass point, facing the far (west) side'))
cams.append(cam('cairn-col-north','Cairn col · facing north','reveal-cairn',*col,0.,.04,'pass point, facing North Peak'))
# Secret Reveal 03: Hidden Fold.
lake=Polygon(next(l for l in f['lakes'] if l['id']=='hidden-lake')['boundary']);c=lake.centroid
d_hero=[hero.project(Point(c.x,c.y))];x,z=at('hero',d_hero[0])
cams.append(cam('fold-from-hero','Hidden Fold · from the hero route (concealment check)','reveal-hidden-fold',x,z,yaw_to(x,z,c.x,c.y),.02,f'hero route point nearest the lake ({d_hero[0]:.0f} m)'))
x,z=at('hidden-loop',1200);cams.append(cam('fold-rim-entry','Hidden Fold · rim entry','reveal-hidden-fold',x,z,yaw_to(x,z,c.x,c.y),-.06,'hidden-loop at 1200 m (first sight of the lake)'))
def dry_outside(direction):
 """First dry point stepping outward from the shore along a direction (avoids the SW outlet channel)."""
 q=lake.exterior.interpolate(lake.exterior.project(Point(c.x+direction[0]*600,c.y+direction[1]*600)));v=np.array([q.x-c.x,q.y-c.y]);v/=np.linalg.norm(v)
 for step in range(20,160,10):
  x,z=q.x+v[0]*step,q.y+v[1]*step
  if surface(H,[x],[z])[0]>max(0.,np.nan_to_num(surface(W,[x],[z])[0],nan=-1e9))+.5:return x,z,step
 raise AssertionError('no dry shore point')
x,z,step=dry_outside((1.,0.))
cams.append(cam('fold-lake-shore','Hidden Fold · east shore facing the western walls','reveal-hidden-fold',x,z,yaw_to(x,z,c.x-400,c.y),.03,f'first dry point {step} m outside the eastern lake shore'))
x,z=at('hidden-loop',2950);cams.append(cam('fold-gorge-upstream','Hidden Fold · outlet valley looking upstream','reveal-hidden-fold',x,z,yaw_to(x,z,c.x,c.y),.02,'hidden-loop at 2950 m'))
# North Peak silhouettes from four approaches.
for id,(x,z),name in (('np-from-valley-shoulder',at('hero',3400),'Central Valley shoulder'),('np-from-tarn-overlook',at('tarn-ascent',route['tarn-ascent'].length),'High Tarn overlook (tarn-ascent end)'),
  ('np-from-cairn-col',col,'Cairn col'),('np-from-birchwood',(-700.,300.),'Birchwood edge')):
 cams.append(cam(id,f'North Peak silhouette · {name}','silhouette-north-peak',x,z,yaw_to(x,z,*peak),.06,f'facing North Peak summit {peak}'))
out={'schema':'aurora-rest-review-cameras/1','terrainSha256':f['meta']['terrainSha256'],'yawConvention':'0 = north (+z), pi/2 = east (+x); matches src/geo-r02b/main.ts',
 'eyeHeightM':1.75,'cameras':cams}
(Path(__file__).resolve().parent/'cameras.json').write_text(json.dumps(out,indent=1)+'\n');print(len(cams),'cameras')
