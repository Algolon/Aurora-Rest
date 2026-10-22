"""Independent canonical-heightfield diagnostics, not a water-flow simulation."""
from pathlib import Path
import os,sys,json,csv,math,hashlib,heapq
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.ndimage import label
from scipy.spatial import cKDTree
from shapely.geometry import Polygon
from shapely import contains_xy
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/geo-r02b-r1';PUBLIC=ROOT/'public/geo-r02b';f=json.loads((PUBLIC/'features.json').read_text());H=np.fromfile(PUBLIC/'terrain.f32',dtype='<f4').reshape(2001,1501);W=np.fromfile(PUBLIC/'water-surface.f32',dtype='<f4').reshape(H.shape)
def sample(q,field=H):
 q=np.asarray(q);gx=np.clip((q[...,0]+3000)/4,0,1499.99999);gz=np.clip((4000-q[...,1])/4,0,1999.99999);i=gx.astype(int);j=gz.astype(int);u=gx-i;v=gz-j;a=field[j,i];b=field[j+1,i];c=field[j,i+1];d=field[j+1,i+1];return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))
def contact(q):
 height=sample(q);on=np.zeros(len(q),bool)
 for d in f['decks']:
  A=np.array(d['a']);B=np.array(d['b']);v=B-A;length=np.linalg.norm(v);t=np.sum((q-A)*v,axis=1)/(v@v);dist=np.linalg.norm(q-A-t[:,None]*v,axis=1);hit=(t>=0)&(t<=1)&(dist<=d['halfWidthM']);dh=np.interp(t*length,[0,d['rampM'],length-d['rampM'],length],[d['endLevelsM'][0],d['levelM'],d['levelM'],d['endLevelsM'][1]]);height=np.where(hit,np.maximum(height,dh),height);on|=hit
 return height,on

def flood(g):
 nr,nc=g.shape;seen=np.zeros(g.shape,bool);filled=g.copy();heap=[]
 for j in range(nr):
  for i in [0,nc-1]:seen[j,i]=True;heapq.heappush(heap,(float(g[j,i]),j,i))
 for i in range(1,nc-1):
  for j in [0,nr-1]:seen[j,i]=True;heapq.heappush(heap,(float(g[j,i]),j,i))
 while heap:
  h,j,i=heapq.heappop(heap)
  for dj,di in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
   y=j+dj;x=i+di
   if y<0 or y>=nr or x<0 or x>=nc or seen[y,x]:continue
   seen[y,x]=True;filled[y,x]=max(g[y,x],h);heapq.heappush(heap,(float(filled[y,x]),y,x))
 return filled-g
sink_reports=[];sink_markers=[]
for cell in [20,8,4]:
 g=H[::cell//4,::cell//4];water=W[::cell//4,::cell//4];depth=flood(g);wet=np.isfinite(water)&(g<water+.15);bad=(depth>2)&(g>.2)&~wet;labels,n=label(bad,structure=np.ones((3,3)));sinks=[]
 for k in range(1,n+1):
  mask=labels==k;area=int(mask.sum())*cell**2
  if area<800:continue
  j,i=np.unravel_index(np.argmax(np.where(mask,depth,-1)),g.shape);item={'deepestXZ':[int(i*cell-3000),int(4000-j*cell)],'areaM2':area,'maxDepthM':float(depth[mask].max())};sinks.append(item)
  if cell==4:sink_markers.append([item['deepestXZ'][0],float(g[j,i]),item['deepestXZ'][1]])
 micro=(depth>.1)&(g>.2)&~wet;ml,mn=label(micro,structure=np.ones((3,3)));areas=np.bincount(ml.ravel())*cell**2;maxima=np.zeros(mn+1);np.maximum.at(maxima,ml.ravel(),depth.ravel());eligible=(areas>=64)&(np.arange(mn+1)>0);micro_items=[]
 for mi in np.where(eligible)[0]:
  mm=ml==mi;jj0,ii0=np.unravel_index(np.argmax(np.where(mm,depth,-1)),g.shape);micro_items.append({'deepestXZ':[int(ii0*cell-3000),int(4000-jj0*cell)],'maximumDepthM':float(maxima[mi]),'areaM2':int(areas[mi])})
 micro_count=int(eligible.sum());micro_max=float(maxima[eligible].max()) if micro_count else 0.;micro_area=int(areas[eligible].sum())
 sink_reports.append({'cellM':cell,'thresholdM':2,'minimumAreaM2':800,'count':len(sinks),'sinks':sinks,'smallerDepressionsAbove0_1mAnd64m2':{'count':micro_count,'maximumDepthM':micro_max,'totalAreaM2':micro_area,'locations':micro_items}});print('priority flood',cell,'m:',len(sinks),flush=True)
# Include small residual dry depressions in the browser overlay as well.
for item in sink_reports[-1]['smallerDepressionsAbove0_1mAnd64m2']['locations']:
 x,z=item['deepestXZ'];sink_markers.append([x,float(H[round((4000-z)/4),round((x+3000)/4)]),z])
# Real D8 directions on 4 m grid, displayed sparsely; no authored arrows substituted.
arrows=[]
for j in range(10,1990,20):
 for i in range(10,1490,20):
  h=H[j,i]
  if h<=.2:continue
  candidates=[((float(h)-float(H[j+dj,i+di]))/(4*math.hypot(dj,di)),dj,di) for dj,di in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]];grade,dj,di=max(candidates)
  if grade>1e-5:arrows.append([i*4-3000,float(h),4000-j*4,di,-dj])
# Full route profiles, dry width and transverse grade at the actual 3.5 m band.
profiles=[];fail=[];csvrows=[]
for route in f['routes']:
 p=np.array(route['points2']);height,on=contact(p);water=sample(p,W);water=np.where(np.isfinite(water),np.maximum(0,water),0);ds=np.linalg.norm(np.diff(p,axis=0),axis=1);grade=np.abs(np.diff(height))/np.maximum(ds,1e-8);wet=(height<water+.12)&~on;tangent=np.gradient(p,axis=0);norm=np.column_stack([-tangent[:,1],tangent[:,0]]);norm/=np.maximum(1e-8,np.linalg.norm(norm,axis=1))[:,None]
 # Three width probes, separate longitudinal target and natural transverse slope.
 left=p+norm*1.7;right=p-norm*1.7;hl,ol=contact(left);hr,orr=contact(right);wl=sample(left,W);wr=sample(right,W);drywidth=(hl>np.where(np.isfinite(wl),np.maximum(0,wl),0)+.12)&(hr>np.where(np.isfinite(wr),np.maximum(0,wr),0)+.12);cross=np.abs(hl-hr)/3.4;widthok=drywidth&(cross<=.35)
 bad=grade>route['targetMaxGrade']+1e-4
 for k in np.where(bad)[0][::5]:fail.append([float(p[k,0]),float(height[k]),float(p[k,1]),'grade'])
 for k in np.where(~widthok)[0][::30]:fail.append([float(p[k,0]),float(height[k]),float(p[k,1]),'width'])
 conflicts=[]
 for k in np.where(~widthok)[0][::max(1,int((~widthok).sum())//8)][:8]:conflicts.append({'xz':p[k].tolist(),'crossGrade':float(cross[k]),'dryBand':bool(drywidth[k])})
 profile={'id':route['id'],'lengthM':float(ds.sum()),'maxGrade':float(grade.max()),'p95Grade':float(np.percentile(grade,95)),'targetGrade':route['targetMaxGrade'],'overGradeSamples':int(bad.sum()),'wetSamples':int(wet.sum()),'dry3_4mBandFraction':float(drywidth.mean()),'widthAndTransverse35PercentPassFraction':float(widthok.mean()),'maxTransverseGrade':float(cross.max()),'widthConflicts':conflicts,'centrelinePass':not np.any(bad) and not np.any(wet),'fullCorridorPass':not np.any(bad) and not np.any(wet) and bool(np.all(widthok))};profiles.append(profile)
 distance=np.r_[0,np.cumsum(ds)]
 for k in range(len(p)):csvrows.append([route['id'],distance[k],*p[k],height[k],grade[min(k,len(grade)-1)],bool(wet[k]),float(cross[k]),bool(widthok[k])])
# Check A-R1 crest interpretation explicitly, including released terminal tails.
master=json.loads((ROOT/'docs/geo-r02b/design-master-A-R1-v1.json').read_text());crest=[]
for r in master['elevation']['ridges']:
 for uv,z in zip(r['knotsUV'],r['crestLevelsM']):
  q=[uv[0]*10-3000,4000-uv[1]*10];actual=float(sample(q));crest.append({'ridge':r['id'],'xz':q,'authoredM':z,'actualM':actual,'deltaM':actual-z})
# Canonical coast zero contour and source preservation, not just an image match.
coast=np.array(f['coast']);t=np.gradient(coast,axis=0);norm=np.column_stack([-t[:,1],t[:,0]]);norm/=np.maximum(1e-8,np.linalg.norm(norm,axis=1))[:,None];crossings=[];coast_exceptions=[]
for p,n in zip(coast[::5],norm[::5]):
 offsets=np.linspace(-16,16,65);q=p+n*offsets[:,None];hh=sample(q);k=np.where(hh[:-1]*hh[1:]<=0)[0]
 if len(k):
  oo=[offsets[i]-hh[i]*(offsets[i+1]-offsets[i])/(hh[i+1]-hh[i] or 1) for i in k];deviation=min(oo,key=abs);crossings.append(deviation)
  if abs(deviation)>4:coast_exceptions.append({'xz':p.tolist(),'offsetM':float(deviation)})
 else:coast_exceptions.append({'xz':p.tolist(),'offsetM':None})
result={'terrainSha256':hashlib.sha256(H.astype('<f4').tobytes()).hexdigest(),'scope':'Actual canonical triangle field; thresholded depressions and geometric water connectivity, not hydraulic simulation.','depressions':sink_reports,'routes':profiles,'crossings':f['decks'],'crestKnotMeasurements':crest,'coast':{'sampledNormals':len(coast[::5]),'zeroCrossingsWithin16m':len(crossings),'medianAbsoluteDeviationM':float(np.median(np.abs(crossings))),'p95AbsoluteDeviationM':float(np.percentile(np.abs(crossings),95)),'maxAbsoluteDeviationM':float(np.max(np.abs(crossings))),'exceptionsOver4mOrNoCrossingWithin16m':coast_exceptions},'waterMesh':f['waterMesh']}
(OUT/'integrity.json').write_text(json.dumps(result,indent=2)+'\n');(PUBLIC/'diagnostics.json').write_text(json.dumps({'arrows':arrows,'sinks':sink_markers,'routeFailures':fail,'summary':{'depressions4m':sink_reports[-1]['count'],'smallDepressions4m':sink_reports[-1]['smallerDepressionsAbove0_1mAnd64m2']['count'],'routesCentrelinePass':sum(r['centrelinePass'] for r in profiles),'routesFullWidthPass':sum(r['fullCorridorPass'] for r in profiles)}},separators=(',',':')))
with (OUT/'route-profiles-full.csv').open('w') as fp:
 w=csv.writer(fp,lineterminator='\n');w.writerow(['route','distance_m','x','z','height_m','grade','wet','transverse_grade','width_ok']);w.writerows(csvrows)
print(json.dumps({'coast':result['coast'],'routes':[{k:r[k] for k in ['id','maxGrade','wetSamples','widthAndTransverse35PercentPassFraction']} for r in profiles]},indent=2))
