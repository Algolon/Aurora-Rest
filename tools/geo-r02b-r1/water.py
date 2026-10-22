"""Clip diagnostic water to the canonical terrain triangles, not free ribbons.
All water-edge vertices interpolate the same terrain triangle and water plane.
This is surface geometry, not a hydraulic simulation or flood model.
"""
from pathlib import Path
import os,sys,json,argparse,hashlib
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from shapely.geometry import Polygon
from shapely import contains_xy
from geometry import projection
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);p.add_argument('--output',type=Path);args=p.parse_args();ROOT=args.root;OUT=args.output or ROOT/'public/geo-r02b';DOC=args.output or ROOT/'docs/geo-r02b-r1';f=json.loads((OUT/'features.json').read_text());H=np.fromfile(OUT/'terrain.f32',dtype='<f4').reshape(2001,1501);v,u=np.meshgrid(np.arange(2001)*.4,np.arange(1501)*.4,indexing='ij');xy=np.column_stack([u.ravel(),v.ravel()]);W=np.full(len(xy),np.nan);lake_inside=np.full(len(xy),np.nan)
for lake in f['lakes']:
 pts=np.array(lake['boundary']);uv=np.column_stack([(pts[:,0]+3000)/10,(4000-pts[:,1])/10]);poly=Polygon(uv);inside=contains_xy(poly,xy[:,0],xy[:,1]);margin=contains_xy(poly.buffer(1.6),xy[:,0],xy[:,1]);W[margin]=lake['level'];lake_inside[inside]=lake['level']
nearest=np.full(len(xy),np.inf)
for c in f['channels']:
 pp=np.array(c['points']);uv=np.column_stack([(pp[:,0]+3000)/10,(4000-pp[:,2])/10]);d,h,_,k,t=projection(uv,pp[:,1],xy);width=np.array(c['widthsM']);half=(width[k]*(1-t)+width[k+1]*t)/2;hit=(d<half+16)&(d<nearest);W[hit]=h[hit];nearest[hit]=d[hit]
W=np.where(np.isfinite(lake_inside),lake_inside,W);active=np.isfinite(W).reshape(H.shape)
# Ocean-side water is sea level, even where a nearest river sample is uphill.
# Without this boundary condition an interpolation apron floats above the sea
# outside rocky mouths. Canonical triangles connect the last rock chute to sea.
coast=Polygon(f['coast']);land=contains_xy(coast,xy[:,0]*10-3000,4000-xy[:,1]*10);sea_clamped=np.isfinite(W)&~land;W[~land]=0
W=W.reshape(H.shape);raw=W.astype('<f4').tobytes();(OUT/'water-surface.f32').write_bytes(raw)
# Candidate cells include the full finite water domain; its outer boundary must
# already lie on dry terrain. Clip each canonical SW diagonal triangle at H=W.
wet=np.isfinite(W)&(H<W);candidate=(wet[:-1,:-1]|wet[1:,:-1]|wet[:-1,1:]|wet[1:,1:])&(active[:-1,:-1]|active[1:,:-1]|active[:-1,1:]|active[1:,1:]);jj,ii=np.where(candidate);positions=[];edge_errors=[];open_domain=0;domain_examples=[];domain_above_sea=0
for j,i in zip(jj,ii):
 for corners in [[(j,i),(j,i+1),(j+1,i)],[(j,i+1),(j+1,i+1),(j+1,i)]]:
  vv=[np.array([k*4-3000,W[r,k],4000-r*4,H[r,k]],float) for r,k in corners]
  if not all(np.isfinite(q[1]) for q in vv):
   open_domain+=1;finite=[q for q in vv if np.isfinite(q[1])];positive=any(q[1]>.1 and q[1]>q[3] for q in finite);domain_above_sea+=int(positive)
   if positive and len(domain_examples)<30:domain_examples.append({'xz':[int(i*4-3000),int(4000-j*4)],'waterM':float(max(q[1] for q in finite)),'terrainM':float(H[j,i])})
   continue
  clipped=[]
  for a,b in zip(vv,vv[1:]+vv[:1]):
   da=a[1]-a[3];db=b[1]-b[3]
   if da>=0:clipped.append(a)
   if (da>=0)!=(db>=0):
    t=da/(da-db);q=a+(b-a)*t;clipped.append(q);edge_errors.append(abs(q[1]-q[3]))
  for k in range(1,len(clipped)-1):
   for q in [clipped[0],clipped[k],clipped[k+1]]:positions.extend([q[0],q[1]+.025,q[2]])
mesh=np.array(positions,dtype='<f4');(OUT/'water-mesh.f32').write_bytes(mesh.tobytes());f['waterMesh']={'file':'water-mesh.f32','vertices':len(positions)//3,'surfaceFile':'water-surface.f32','surfaceSha256':hashlib.sha256(raw).hexdigest(),'meshSha256':hashlib.sha256(mesh.tobytes()).hexdigest(),'method':'canonical-triangle H=W clipping; ocean-side boundary 0 m; water plane 0.025 m render offset','maxComputedShoreIntersectionErrorM':max(edge_errors,default=0),'openDomainTriangles':open_domain,'openDomainAboveSeaTriangles':domain_above_sea,'openDomainExamples':domain_examples};(OUT/'features.json').write_text(json.dumps(f,separators=(',',':')));(DOC/'water-mesh-validation.json').write_text(json.dumps(f['waterMesh'],indent=2)+'\n');print(f['waterMesh'])
