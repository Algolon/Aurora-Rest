"""GEO-R02C-B1 independent validation (MEASURED on the composed terrain from the committed patch, not on the build cache).
  python3 tools/geo-r02c-b2a/validate.py  -> docs/geo-r02c-b2a/validation/a.json
Classes of result: 'preserved' (must be identical to R1), 'regenerated' (allowed to change under the B0/B1 authorization, reported),
'expected difference' (an R1 rule that encodes the superseded North Peak design)."""
from pathlib import Path
import hashlib,json,sys
import numpy as np
from scipy import ndimage
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(ROOT/'tools/geo-r02c/lib'),str(ROOT/'tools/geo-r02c-a1a/lib')]
from hydro import fill_depth,wet_mask,d8_receivers  # noqa: E402
from drainage import destination  # noqa: E402
from route import walk_test,hiking_grades,bilinear  # noqa: E402
NX,NZ,CELL=1501,2001,4.;R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a'
VAR=ROOT/'public/geo-r02c-b2a';DOC=ROOT/'docs/geo-r02c-b2a'
sha=lambda b:hashlib.sha256(b).hexdigest()

def compose(vid):
 R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX);m=json.loads((VAR/'manifest.json').read_text());e=m['variants'][vid];H=R1.copy()
 if e['patch']:
  p=e['patch'];raw=(VAR/p['file']).read_bytes();assert sha(raw)==p['sha256'];(j0,j1),(i0,i1)=p['rows'],p['cols'];H[j0:j1+1,i0:i1+1]=np.frombuffer(raw,'<f4').reshape(j1-j0+1,i1-i0+1)
 assert sha(H.astype('<f4').tobytes())==e['terrainSha256'],vid;return R1,H,e

def accumulation(H,box):
 j0,j1,i0,i1=box;sub=H[j0:j1,i0:i1].astype(float);nz,nx=sub.shape;rec=np.full(sub.size,-1);best=np.zeros(sub.shape);idx=np.arange(sub.size).reshape(sub.shape)
 P=np.pad(sub,1,mode='edge');Ip=np.pad(idx,1,mode='edge')
 for dj,di in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
  nb=P[1+dj:1+dj+nz,1+di:1+di+nx];drop=(sub-nb)/(CELL*np.hypot(dj,di));hit=drop>best;best=np.where(hit,drop,best);rec=np.where(hit.ravel(),Ip[1+dj:1+dj+nz,1+di:1+di+nx].ravel(),rec)
 order=np.argsort(-sub.ravel(),kind='stable');acc=np.ones(sub.size)
 for k in order:
  r=rec[k]
  if r>=0:acc[r]+=acc[k]
 return acc.reshape(sub.shape)*CELL*CELL

def main():
 R1,H,e=compose('a');_,M0,_=compose('m0');WS=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX);features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
 design=json.loads((HERE/'design/north-massif-b2a.json').read_text());from shapely import contains_xy,distance,points;from shapely.geometry import Polygon,LineString
 R=R1.astype(float);B=H.astype(float);d=B-R;ch=d!=0;jj,ii=np.mgrid[0:NZ,0:NX];X=ii*CELL-3000.;Z=4000.-jj*CELL
 poly=Polygon(design['studyArea']['polygon']);inside=contains_xy(poly,X,Z);out={}
 out['parity']={'m0EqualsR1':bool(np.array_equal(M0,R1)),'m0Sha256':sha(M0.astype('<f4').tobytes())==R1_SHA}
 land=R>0;dco=ndimage.distance_transform_edt(land)*CELL
 lake=next(l for l in features['lakes'] if l['id']=='high-tarn');inl=contains_xy(Polygon(lake['boundary']),X,Z);dl=ndimage.distance_transform_edt(~inl)*CELL
 pres={'changedCellsOutsideStudyArea':int((ch&~inside).sum()),'landSeaSignChanged':int(((R>0)!=(B>0)).sum()),'coastBand0to70mChanged':int((ch&land&(dco<=70)).sum()),
  'waterCellsChanged':int((ch&np.isfinite(WS)).sum()),'highTarnLakeAnd150mChanged':int((ch&(dl<=150)).sum()),'highTarnLevelM':lake['level']}
 for cid in ('tarn-inlet-w','windward-gully'):
  c=next(c for c in features['channels'] if c['id']==cid);sel=(np.abs(X-np.mean(np.array(c['points'])[:,0]))<1200)&(np.abs(Z-np.mean(np.array(c['points'])[:,2]))<1200)
  dd=np.full(X.shape,1e9);dd[sel]=distance(LineString(np.array(c['points'])[:,[0,2]]),points(np.c_[X[sel],Z[sel]]));pres[f'{cid}Corridor40mChanged']=int((ch&(dd<=40)).sum())
 rc={}
 for r in features['routes']:
  p=np.array(r['points2']);dh=np.abs(bilinear(B,p[:,0],p[:,1])-bilinear(R,p[:,0],p[:,1]));rc[r['id']]=round(float(dh.max()),3)
 pres['routeCentrelineMaxChangeM']=rc;pres['pass']=bool(pres['changedCellsOutsideStudyArea']==0 and pres['landSeaSignChanged']==0 and pres['coastBand0to70mChanged']==0 and pres['waterCellsChanged']==0
  and pres['highTarnLakeAnd150mChanged']==0 and pres['tarn-inlet-wCorridor40mChanged']==0 and pres['windward-gullyCorridor40mChanged']==0 and all(v==0 for k,v in rc.items() if k!='peak-ascent'))
 out['preserved']=pres
 # hydrology on the whole island, ocean and all water as outlets
 wetR=wet_mask(R,WS);wetB=wet_mask(B,WS);depR=fill_depth(R,(R<=0)|wetR);depB=fill_depth(B,(B<=0)|wetB)
 newsink=(depB>.01)&(depR<=.01);lab,n=ndimage.label(newsink,structure=np.ones((3,3)))
 comps=[{'x':int(X[lab==k].mean()),'z':int(Z[lab==k].mean()),'areaM2':int((lab==k).sum()*16),'maxDepthM':round(float(depB[lab==k].max()),3)} for k in range(1,n+1)]
 dR=destination(R,WS,features);dB=destination(B,WS,features);dc=(dR!=dB)&land
 trans={f'{a}->{b}':round(float(((dR==a)&(dB==b)&land).sum())*16/1e4,2) for a in range(4) for b in range(4) if a!=b and ((dR==a)&(dB==b)&land).any()}
 hyd={'newDrySinkCells1cm':int(newsink.sum()),'newDrySinks':comps[:10],'maxDryFillDepthB1M':round(float(depB[land&~wetB].max()),3),'maxDryFillDepthR1M':round(float(depR[land&~wetR].max()),3),
  'drainageDestinationChangedHa':round(float(dc.sum())*16/1e4,2),'drainageTransitionsHa(1=HighTarn,2=sea,3=other,0=unresolved)':trans,
  'highTarnCatchmentHa':{'r1':round(float((dR==1).sum())*16/1e4,1),'b1':round(float((dB==1).sum())*16/1e4,1)},'unresolvedCellsB1':int(((dB==0)&land&~wetB).sum()),'unresolvedCellsR1':int(((dR==0)&land&~wetR).sum())}
 # authored flats left by the conditioning (tarn sites)
 z=np.load(HERE/'.cache/a.npz') if (HERE/'.cache/a.npz').exists() else None
 if z is not None:
  f=z['fill'];lab2,n2=ndimage.label(f>.5,structure=np.ones((3,3)));J0,I0=int(z['J'][0]),int(z['I'][0])
  hyd['conditionedHollows(tarn sites, dry in B1)']=[{'x':int((I0+np.nonzero(lab2==k)[1].mean())*4-3000),'z':int(4000-(J0+np.nonzero(lab2==k)[0].mean())*4),'areaHa':round(float((lab2==k).sum())*16/1e4,2),'fillDepthM':round(float(f[lab2==k].max()),1)} for k in range(1,n2+1) if (lab2==k).sum()>=20]
 box=(40,640,280,940);aR=accumulation(R,box);aB=accumulation(B,box);thr=5e4
 hyd['streamNetwork']={'thresholdHa':thr/1e4,'r1StreamCells':int((aR>thr).sum()),'b1StreamCells':int((aB>thr).sum()),'streamCellsOnlyR1':int(((aR>thr)&~(aB>thr)).sum()),'streamCellsOnlyB1':int(((aB>thr)&~(aR>thr)).sum())}
 np.savez_compressed(HERE/'.cache/streams.npz',aR=aR,aB=aB,box=box)
 hyd['pass']=bool(hyd['newDrySinkCells1cm']==0 and hyd['unresolvedCellsB1']<=hyd['unresolvedCellsR1'])
 out['hydrology']=hyd
 # boundary continuity: slopes in the blend band against R1 there and against the B1 core
 wz=np.zeros(X.shape);J,I=slice(int(z['J'][0]),int(z['J'][1])),slice(int(z['I'][0]),int(z['I'][1]));wz[J,I]=z['w']
 gy,gx=np.gradient(B,CELL);sB=np.hypot(gx,gy);gy,gx=np.gradient(R,CELL);sR=np.hypot(gx,gy);gy,gx=np.gradient(d,CELL);sD=np.hypot(gx,gy)
 band=(wz>0)&(wz<.98)&land;core=(wz>=.98)&land;lapB=np.abs(ndimage.laplace(B))/CELL**2
 q=lambda a,m:{'p50':round(float(np.percentile(a[m],50)),3),'p99':round(float(np.percentile(a[m],99)),3),'max':round(float(a[m].max()),3)}
 out['boundary']={'bandCells':int(band.sum()),'slopeB1Band':q(sB,band),'slopeR1Band':q(sR,band),'slopeB1Core':q(sB,core),'deltaGradientBand':q(sD,band),'curvatureB1Band':q(lapB,band),'curvatureB1Core':q(lapB,core),
  'note':'the blend band should not be steeper or more curved than the authored core; a seam would show as band slope/curvature above the core'}
 # seam criterion: slope that B1 adds in the band, beyond both R1 there (+0.5) and the authored core (p99). R1 itself is very steep
 # on the north coast and at incised channel banks, so raw band slope is not a seam indicator.
 cp=np.percentile(sB[core],99);added=band&(sB>sR+.5)&(sB>cp);lab,n=ndimage.label(added,structure=np.ones((3,3)));sizes=ndimage.sum(added,lab,range(1,n+1)) if n else np.array([])
 out['boundary'].update({'addedSteepBandHa':round(float(added.sum())*16/1e4,2),'largestAddedSteepClusterHa':round(float(sizes.max())*16/1e4 if n else 0.,2),'coreSlopeP99':round(float(cp),3),
  'criterion':'band cells where B1 is steeper than R1 + 0.5 and steeper than the core p99; pass if no such cluster exceeds 0.25 ha'})
 out['boundary']['pass']=bool(out['boundary']['largestAddedSteepClusterHa']<=0.25)
 # summit hierarchy achieved
 hier=[]
 for s in design['summits']+design['saddles']:
  x,zz=s['xz'];k=(np.abs(X-x)<=30)&(np.abs(Z-zz)<=30);v=float(B[k].max() if s in design['summits'] else bilinear(B,x,zz));hier.append({'id':s['id'],'name':s['name'],'authoredM':s['levelM'],'b1M':round(v,1),'r1M':round(float(bilinear(R,x,zz)),1)})
 out['hierarchy']=hier;jm,im=np.unravel_index(np.argmax(np.where(inside,B,-1)),B.shape)
 out['summit']={'b1M':round(float(B[jm,im]),2),'xz':[float(X[jm,im]),float(Z[jm,im])],'r1M':round(float(R.max()),2),'islandMaximumIsNorthPeak':bool(B.max()==B[jm,im]),'offsetFromApprovedM':round(float(np.hypot(X[jm,im]+520,Z[jm,im]-2770)),1)}
 # route
 rt=json.loads((VAR/'routes.json').read_text());p=np.array(rt['routes'][0]['points2']);pa=np.array(next(r for r in features['routes'] if r['id']=='peak-ascent')['points2'])
 hg,_=hiking_grades(B,p);out['route']={'candidate':rt['report'],'walkTestCandidateOnB1':int(walk_test(B,p)),'walkTestR1RouteOnB1':int(walk_test(B,pa)),'walkTestR1RouteOnR1':int(walk_test(R,pa)),
  'candidateMaxHikingGrade10m':round(float(hg.max()),3),'candidateStartsOnR1Route':bool(np.allclose(p[0],pa[0])),'endDistanceToSummitM':round(float(np.hypot(p[-1,0]-X[jm,im],p[-1,1]-Z[jm,im])),1),
  'otherRoutesWalkTestOnB1':{r['id']:int(walk_test(B,r['points2'])) for r in features['routes'] if r['id']!='peak-ascent'}}
 out['route']['pass']=bool(out['route']['walkTestCandidateOnB1']==-1 and all(v==-1 for v in out['route']['otherRoutesWalkTestOnB1'].values()))
 out['expectedDifferences']=['peak-ascent R1 alignment: blocked on B1 (superseded by the candidate alignment peak-ascent-b1)',
  'R1 North Peak crest lines and crest levels in features.json / the A-R1 master: superseded inside the study area by the derived master tools/geo-r02c-b2a/design/north-massif-b2a.json',
  'catchment rings in features.json describe R1 drainage; B1 drainage is recomputed here']
 out['changes']={'changedCells':int(ch.sum()),'changedHa':round(float(ch.sum())*16/1e4,2),'raisedOver1mHa':round(float((d>1).sum())*16/1e4,2),'loweredOver1mHa':round(float((d<-1).sum())*16/1e4,2),
  'maxRaiseM':round(float(d.max()),2),'maxLoweringM':round(float(-d.min()),2),'volumeRaisedM3':round(float(d[d>0].sum())*16),'volumeLoweredM3':round(float(-d[d<0].sum())*16)}
 out['terrainSha256']=e['terrainSha256'];out['pass']=bool(out['parity']['m0EqualsR1'] and pres['pass'] and hyd['pass'] and out['route']['pass'] and out['summit']['islandMaximumIsNorthPeak'])
 DOC.mkdir(parents=True,exist_ok=True);(DOC/'validation').mkdir(exist_ok=True);(DOC/'validation/a.json').write_text(json.dumps(out,indent=1)+'\n');return out

if __name__=='__main__':
 o=main();print(json.dumps({k:o[k] for k in ('pass','parity','preserved','summit','changes')},indent=0));print(json.dumps(o['hydrology'],indent=0)[:2500]);print(json.dumps(o['boundary'],indent=0));print(json.dumps(o['hierarchy']));print(json.dumps({k:v for k,v in o['route'].items() if k!='candidate'}))
