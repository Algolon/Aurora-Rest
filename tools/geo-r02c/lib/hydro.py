"""Drainage diagnostics on the canonical grid: priority-flood sink depths and D8 outlets.
Measurement only: nothing here fills, breaches or edits terrain."""
import heapq
import numpy as np
from scipy import ndimage
from common import NX,NZ,CELL,x_of,z_of

N8=((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1))

def wet_mask(H,W):return np.isfinite(W)&(H<W)

def fill_depth(H,outlets):
 """Priority-flood (8-connected) spill depth above terrain; outlets drain freely. Grid border is always an outlet."""
 seed=outlets.copy();seed[0,:]=seed[-1,:]=seed[:,0]=seed[:,-1]=True;nz,nx=H.shape
 F=H.copy();done=seed.copy();Hl=H.tolist();Fl=F.tolist();dl=done.tolist()
 heap=[(Hl[j][i],j,i) for j,i in zip(*np.nonzero(seed))];heapq.heapify(heap);pop=heapq.heappop;push=heapq.heappush
 while heap:
  h,j,i=pop(heap)
  for dj,di in N8:
   a=j+dj;b=i+di
   if 0<=a<nz and 0<=b<nx and not dl[a][b]:
    dl[a][b]=True;v=Hl[a][b];v=h if h>v else v;Fl[a][b]=v;push(heap,(v,a,b))
 return np.array(Fl)-H

def sink_components(depth,threshold,min_area_m2=0.,cell=CELL,eligible=None):
 lab,n=ndimage.label((depth>threshold)&(True if eligible is None else eligible),structure=np.ones((3,3)))
 if n==0:return []
 idx=np.arange(1,n+1);area=ndimage.sum(np.ones_like(depth),lab,idx)*cell*cell;mx=ndimage.maximum(depth,lab,idx)
 com=ndimage.center_of_mass(np.ones_like(depth),lab,idx);out=[]
 for k in range(n):
  if area[k]>=min_area_m2:out.append({'x':round(float(com[k][1]*cell-3000),1),'z':round(float(4000-com[k][0]*cell),1),'areaM2':float(area[k]),'maxDepthM':round(float(mx[k]),4)})
 return sorted(out,key=lambda s:-s['maxDepthM'])

def r1_convention_sinks(H,W):
 """Exact re-statement of R1 integrity.py: border-only priority flood on 20/8/4 m subsamples; material = depth > 2 m and
 area >= 800 m2, smaller = depth > 0.1 m and area >= 64 m2; cells with g <= 0.2 m or g < water + 0.15 m are excluded."""
 out=[]
 for cell in (20,8,4):
  k=cell//4;g=H[::k,::k];w=W[::k,::k];depth=fill_depth(g,np.zeros(g.shape,bool));wet=np.isfinite(w)&(g<w+.15);ok=(g>.2)&~wet
  out.append({'cellM':cell,'material':len(sink_components(depth,2.,800,cell,ok)),'smaller':len(sink_components(depth,.1,64,cell,ok)),'maxDryDepthM':float(depth[ok].max())})
 return out

def sink_report(H,W):
 """Dry sinks with ocean + all water as outlets (R1 convention), plus wet-only basins for context."""
 wet=wet_mask(H,W);depth=fill_depth(H,(H<=0)|wet)
 checks=[{'thresholdM':.1,'minAreaM2':64},{'thresholdM':.5,'minAreaM2':0},{'thresholdM':2.,'minAreaM2':800},{'thresholdM':.01,'minAreaM2':0}]
 out=[]
 for c in checks:
  comps=sink_components(depth,c['thresholdM'],c['minAreaM2']);out.append({**c,'count':len(comps),'components':comps[:20]})
 return {'convention':'8-connected priority flood; ocean (H<=0), all wet cells (H<W) and grid border are outlets','maxFillDepthM':float(depth.max()),
  'cellsAbove1cm':int((depth>.01).sum()),'checks':out},depth

def d8_receivers(H):
 """Steepest-descent receiver index per cell (-1 = no lower neighbour). Ties resolve in N8 order."""
 best=np.zeros_like(H);rec=np.full(H.shape,-1,np.int64);idx=np.arange(H.size).reshape(H.shape)
 P=np.pad(H,1,mode='edge');I=np.pad(idx,1,mode='edge')
 for dj,di in N8:
  nb=P[1+dj:1+dj+NZ,1+di:1+di+NX];drop=(H-nb)/(CELL*np.hypot(dj,di));hit=drop>best
  best=np.where(hit,drop,best);rec=np.where(hit,I[1+dj:1+dj+NZ,1+di:1+di+NX],rec)
 return rec

def d8_outlets(H,W):
 """Terminal cell reached by D8 descent; ocean and wet cells terminate. Returns flat terminal index per cell."""
 rec=d8_receivers(H).ravel();term=(wet_mask(H,W)|(H<=0)).ravel()|(rec<0)
 target=np.where(term,np.arange(H.size),rec)
 for _ in range(64):
  nxt=target[target]
  if np.array_equal(nxt,target):break
  target=nxt
 return target.reshape(H.shape)
