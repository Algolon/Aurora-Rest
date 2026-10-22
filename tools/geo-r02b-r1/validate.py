"""Measure the generated field and actual raster-triangle contact; no flow simulation."""
from pathlib import Path
import os,sys,json,math,hashlib,heapq,csv
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import label,maximum_filter
from shapely.geometry import Polygon,LineString,Point
from shapely import contains_xy
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/geo-r02b-r1';data=json.loads((ROOT/'public/geo-r02b/features.json').read_text());grid=data['meta']['grid'];H=np.fromfile(ROOT/'public/geo-r02b/terrain.f32',dtype='<f4').reshape(grid['height'],grid['width']);CELL=4.
def surface(x,z,step=4):
 x=np.asarray(x);z=np.asarray(z);gx=np.clip((x+3000)/step,0,6000/step-1e-8);gz=np.clip((4000-z)/step,0,8000/step-1e-8);i=gx.astype(int);j=gz.astype(int);u=gx-i;v=gz-j;k=int(step/4)
 a=H[j*k,i*k];b=H[(j+1)*k,i*k];c=H[j*k,(i+1)*k];d=H[(j+1)*k,(i+1)*k]
 return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))
channels=[];trees={};bankchecks=[]
for c in data['channels']:
 p=np.array(c['points']);tree=cKDTree(p[:,[0,2]]);trees[c['id']]=tree;bed=surface(p[:,0],p[:,2]);clear=p[:,1]-bed
 interior=np.ones(len(p),bool);interior[:8]=False;interior[-8:]=False;valid=clear[interior];seg=np.linalg.norm(np.diff(p[:,[0,2]],axis=0),axis=1);bedchange=np.diff(bed)
 channels.append({'id':c['id'],'samples':len(p),'minInteriorWaterDepthM':float(min(valid)),'samplesWithBedAboveWater':int(np.sum(valid<-.05)),'maxBedRiseBetweenSamplesM':float(max(0,np.max(bedchange))),'maxDownhillBedGrade':float(max(0,np.max(-bedchange/np.maximum(seg,.001)))),'resolvedWaterSurfaceNonIncreasing':bool(np.all(np.diff(p[:,1])<1e-5)),'lengthM':float(sum(seg))})
 # Banks outside the wet width are geometric checks, not flooding predictions.
 tangent=np.gradient(p[:,[0,2]],axis=0);norm=np.column_stack([-tangent[:,1],tangent[:,0]]);norm/=np.linalg.norm(norm,axis=1)[:,None];w=np.array(c['widthsM'])/2+12
 banks=np.concatenate([p[:,[0,2]]+norm*w[:,None],p[:,[0,2]]-norm*w[:,None]]);expected=np.tile(p[:,1],2);values=surface(banks[:,0],banks[:,1]);eligible=np.ones(len(banks),bool)
 for lake in data['lakes']:eligible&=~contains_xy(Polygon(lake['boundary']),banks[:,0],banks[:,1])
 for other in data['channels']:
  if other['id']==c['id']:continue
  op=np.array(other['points']);dd,ii=cKDTree(op[:,[0,2]]).query(banks);eligible&=dd>np.array(other['widthsM'])[ii]/2+4
 for k in [0,len(p)]:eligible[k:k+15]=False;eligible[k+len(p)-15:k+len(p)]=False
 bankchecks.append({'id':c['id'],'bankSamplesBelowWater':int(np.sum((values<expected-.25)&eligible)),'eligibleSamples':int(eligible.sum()),'excludedLakeJunctionAndEndSamples':int((~eligible).sum()),'note':'Lakes, other wet channels and 30 m source/outlet caps excluded; neither flood extent nor bankfull prediction.'})
lakechecks=[];lakepolys={l['id']:Polygon(l['boundary']) for l in data['lakes']}
for l in data['lakes']:
 p=np.array(l['boundary']);poly=lakepolys[l['id']];inside=poly.buffer(-12);out=poly.buffer(25).exterior;po=np.array(out.coords);outside_h=surface(po[:,0],po[:,1]);allowed=np.zeros(len(po),bool)
 for c in data['channels']:
  for endpoint in [c['points'][0],c['points'][-1]]:
   if abs(endpoint[1]-l['level'])<.1:allowed|=np.hypot(po[:,0]-endpoint[0],po[:,1]-endpoint[2])<45
 q=np.array(inside.exterior.coords) if not inside.is_empty else p;values=surface(q[:,0],q[:,1]);
 lakechecks.append({'id':l['id'],'levelM':l['level'],'innerShoreSamples':len(q),'innerShoreBedAboveWaterCount':int(np.sum(values>l['level']+.05)),'minInteriorDepthM':float(l['level']-np.max(values)),'unintendedLowRimSamples25m':int(np.sum((outside_h<l['level']-.25)&~allowed)),'rimSampleCount':len(po),'maxLowRimDeficitM':float(max(0,l['level']-np.min(outside_h[~allowed])))})
# Exact named crossing decks match the prototype geometry.
decks=data.get('decks',[])
def waterlevel(xz):
 level=np.zeros(len(xz));wet=np.zeros(len(xz),bool)
 for lake in data['lakes']:
  hit=contains_xy(lakepolys[lake['id']],xz[:,0],xz[:,1]);level=np.where(hit,lake['level'],level);wet|=hit
 for stream in data['channels']:
  d,idx=trees[stream['id']].query(xz);p=np.array(stream['points']);width=np.array(stream['widthsM']);hit=d<width[idx]/2;wet|=hit;level=np.where(hit,np.maximum(level,p[idx,1]),level)
 return level,wet
routes=[];csvrows=[]
for route in data['routes']:
 p=np.array(route['points2']);height=surface(p[:,0],p[:,1]);water,wet=waterlevel(p);deckmask=np.zeros(len(p),bool)
 for deck in decks:
  A=np.array(deck['a']);B=np.array(deck['b']);dv=B-A;tt=((p-A)*dv).sum(axis=1)/(dv@dv);dd=np.linalg.norm(p-A-tt[:,None]*dv,axis=1);on=(tt>=0)&(tt<=1)&(dd<1.75);length=np.linalg.norm(dv);along=tt*length;dh=np.interp(along,[0,deck['rampM'],length-deck['rampM'],length],[deck['endLevelsM'][0],deck['levelM'],deck['levelM'],deck['endLevelsM'][1]]);height=np.where(on,np.maximum(height,dh),height);deckmask|=on
 seg=np.linalg.norm(np.diff(p,axis=0),axis=1);grade=np.abs(np.diff(height))/np.maximum(seg,1e-8);bad=np.where(grade>route['targetMaxGrade'])[0];sub=(height<water+.12)&wet&~deckmask
 tangent=np.gradient(p,axis=0);normal=np.column_stack([-tangent[:,1],tangent[:,0]]);normal/=np.maximum(1e-6,np.linalg.norm(normal,axis=1))[:,None]
 widths=[];widest=[]
 for i in range(0,len(p),15):
  offsets=np.arange(-route['widthM']/2,route['widthM']/2+1,4);q=p[i]+normal[i]*offsets[:,None];hh=surface(q[:,0],q[:,1]);ww,wetq=waterlevel(q);gg=np.abs(np.gradient(hh,offsets));ok=(~wetq)&(hh>.15)&(gg<.35)
  runs=[];start=None
  for k,val in enumerate(np.r_[ok,False]):
   if val and start is None:start=k
   if not val and start is not None:runs.append((start,k-1));start=None
  widest.append(max([max(0,(b-a)*4) for a,b in runs],default=0));centre=int(np.argmin(np.abs(offsets)));widths.append(max([max(0,(b-a)*4) for a,b in runs if a<=centre<=b],default=0))
 conflicts=[{'x':round(float(p[i,0]),2),'z':round(float(p[i,1]),2),'grade':round(float(grade[i]),3)} for i in bad[::max(1,len(bad)//12)][:12]]
 routes.append({'id':route['id'],'planLengthM':float(sum(seg)),'targetMaxGrade':route['targetMaxGrade'],'maxMeasuredTriangleGrade':float(max(grade)),'p95Grade':float(np.percentile(grade,95)),'fractionOverTarget':float(np.mean(grade>route['targetMaxGrade'])),'submergedSamples':int(np.sum(sub)),'deckSamples':int(np.sum(deckmask)),'sampleCount':len(p),'reservedWidthM':route['widthM'],'p10DryLowSlopeWidthM':float(np.percentile(widths,10)),'p10WidestContiguousDryLowSlopeSpanM':float(np.percentile(widest,10)),'widthMethod':'4 m cross-section samples; <=35% transverse grade; contiguous span through centreline plus widest contiguous span. Water crossings need their 3.5 m decks and separate approaches.','conflictExamples':conflicts,'status':'pass on proposed centreline' if len(bad)==0 and not np.any(sub) else 'requires local realignment/crossing review; terrain not flattened'})
 for i in range(0,len(p),5):csvrows.append([route['id'],p[i,0],p[i,1],height[i],float(grade[min(i,len(grade)-1)]),bool(wet[i])])
# Priority flood on a 20 m diagnostic grid identifies closed depressions outside designed water.
G=H[::5,::5].astype(float);nr,nc=G.shape;seen=np.zeros(G.shape,bool);filled=G.copy();heap=[]
for j in range(nr):
 for i in [0,nc-1]:seen[j,i]=True;heapq.heappush(heap,(float(G[j,i]),j,i))
for i in range(nc):
 for j in [0,nr-1]:
  if not seen[j,i]:seen[j,i]=True;heapq.heappush(heap,(float(G[j,i]),j,i))
while heap:
 level0,j,i=heapq.heappop(heap)
 for dj,di in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
  y=j+dj;x=i+di
  if y<0 or y>=nr or x<0 or x>=nc or seen[y,x]:continue
  seen[y,x]=True;filled[y,x]=max(G[y,x],level0);heapq.heappush(heap,(float(filled[y,x]),y,x))
XX,ZZ=np.meshgrid(np.arange(nc)*20-3000,4000-np.arange(nr)*20);pts=np.column_stack([XX.ravel(),ZZ.ravel()]);water,wet=waterlevel(pts);depth=filled-G;depression=(depth>2)&(G>.2)&(~wet.reshape(G.shape));labels,count=label(depression);sinks=[]
for id in range(1,count+1):
 mask=labels==id;area=int(mask.sum())*400
 if area<800:continue
 yy,xx=np.unravel_index(np.argmax(np.where(mask,depth,-1)),G.shape);sinks.append({'areaM2':area,'maximumFillDepthM':round(float(depth[mask].max()),3),'deepestXZ':[int(XX[yy,xx]),int(ZZ[yy,xx])]})
sinks.sort(key=lambda s:s['maximumFillDepthM'],reverse=True)
# Heightfield-derived downhill endpoint classification at 20 m, explicitly distinct from designed masks.
terminal=np.zeros(len(pts),np.int16);root={'main-upper':1,'main-mire-upper':1,'main-mire-out':1,'fold-inlet':1,'fold-outlet':1,'tarn-inlet-w':1,'tarn-inlet-n':1,'south-fen-tributary':1,'birch-upper-in':2,'birch-upper-outlet':2,'birch-lower-in':3,'birch-lower-outlet':3,'windward-gully':4}
for stream in data['channels']:
 dd,ii=trees[stream['id']].query(pts);terminal[dd<max(14,max(stream['widthsM'])/2)]=root[stream['id']]
for lake in data['lakes']:terminal[contains_xy(lakepolys[lake['id']],pts[:,0],pts[:,1])]=1 if lake['id'] in ['high-tarn','hidden-lake'] else 2 if lake['id']=='birch-upper-lake' else 3
terminal[G.ravel()<=0]=5
nextnode=np.arange(nr*nc);flat=G.ravel();bestGrade=np.zeros(len(flat))
for dj,di in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
 jj=np.clip(np.arange(nr)[:,None]+dj,0,nr-1);ii=np.clip(np.arange(nc)[None,:]+di,0,nc-1);idx=(jj*nc+ii).ravel();drop=(flat-flat[idx])/(20*math.hypot(di,dj));lower=drop>bestGrade+1e-8;nextnode[lower]=idx[lower];bestGrade[lower]=drop[lower]
endpoint=terminal.copy()
for k in np.argsort(flat):
 if endpoint[k]==0 and nextnode[k]!=k:endpoint[k]=endpoint[nextnode[k]]
catchmentchecks=[]
for catch in data['catchments']:
 inside=np.zeros(len(pts),bool)
 for ring in catch['rings']:inside|=contains_xy(Polygon(ring),pts[:,0],pts[:,1])
 expected={'01':[1],'02':[1],'03':[1],'04':[2],'05':[3],'06':[4,5],'07':[5],'08':[5]}[catch['id']];n=int(inside.sum());catchmentchecks.append({'id':catch['id'],'samples':n,'acceptedTerminalClasses':expected,'fractionReachingExpectedSystem':float(np.mean(np.isin(endpoint[inside],expected))) if n else None,'fractionUnresolvedClosed':float(np.mean(endpoint[inside]==0)) if n else None,'note':'20 m D8 downhill diagnostic; reaching a designed lake/channel uses its separately checked downstream graph, not a hydrologic simulation'})
anchors=[]
for a in data['anchors']:
 x,z=a['xzM'];anchors.append({'id':a['id'],'xzM':[x,z],'terrainM':float(surface(x,z)),'proposalM':a['heightProposalM']})
ps=data['pass'];passpoints=[('saddle',ps['uv']),('north-flank',ps['northHighPoint']['uv']),('south-flank',ps['southHighPoint']['uv'])]+[(f'approach-{i}',p['uv']) for i,p in enumerate(ps['approaches'])];passcheck={n:float(surface(p[0]*10-3000,4000-p[1]*10)) for n,p in passpoints}
result={'scope':'Actual generated continuous field and matching raster-triangle sampling. Authored water levels are not a full fluid simulation.','masterSha256':data['meta']['masterSha256'],'terrainSha256':hashlib.sha256(H.astype('<f4').tobytes()).hexdigest(),'finite':bool(np.all(np.isfinite(H))),'heightRangeM':[float(H.min()),float(H.max())],'channels':channels,'bankChecks':bankchecks,'lakes':lakechecks,'crossings':decks,'routes':routes,'pass':passcheck,'passLowerThanBothFlanks':passcheck['saddle']<min(passcheck['north-flank'],passcheck['south-flank']),'closedDepressions20m':{'thresholdDepthM':2,'minimumAreaM2':800,'count':len(sinks),'largestProblems':sinks[:30]},'downhillCatchmentChecks20m':catchmentchecks,'anchorMeasurements':anchors,'renderedContactNote':'Node tests raycast actual Three.js geometry at 4/8/16 m; these diagnostics use identical cell diagonals.'}
(OUT/'terrain-validation.json').write_text(json.dumps(result,indent=2)+'\n')
with (OUT/'hiking-profiles.csv').open('w') as f:
 w=csv.writer(f,lineterminator="\n");w.writerow(['route','east_m','north_m','terrain_or_deck_m','grade','in_designed_water']);w.writerows(csvrows)
print(json.dumps({'channelsAboveWater':sum(c['samplesWithBedAboveWater'] for c in channels),'lakeShoreFailures':sum(c['innerShoreBedAboveWaterCount'] for c in lakechecks),'lowRimSamples':sum(c['unintendedLowRimSamples25m'] for c in lakechecks),'pass':passcheck,'routeStatus':[{k:r[k] for k in ['id','maxMeasuredTriangleGrade','fractionOverTarget','submergedSamples']} for r in routes],'closedDepressions':len(sinks),'catchmentChecks':catchmentchecks},indent=2))
