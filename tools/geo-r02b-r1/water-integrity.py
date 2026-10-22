"""Actual clipped-water surface checks and explicit legacy bank-probe diagnosis."""
from pathlib import Path
import os,sys,json
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import label
from shapely.geometry import Polygon
from shapely import contains_xy
ROOT=Path(__file__).resolve().parents[2];P=ROOT/'public/geo-r02b';D=ROOT/'docs/geo-r02b-r1';f=json.loads((P/'features.json').read_text());H=np.fromfile(P/'terrain.f32',dtype='<f4').reshape(2001,1501);W=np.fromfile(P/'water-surface.f32',dtype='<f4').reshape(H.shape)
def sample(q,field):
 q=np.asarray(q);gx=np.clip((q[...,0]+3000)/4,0,1499.99999);gz=np.clip((4000-q[...,1])/4,0,1999.99999);i=gx.astype(int);j=gz.astype(int);u=gx-i;v=gz-j;a=field[j,i];b=field[j+1,i];c=field[j,i+1];d=field[j+1,i+1];return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))
wet=np.isfinite(W)&(H<W);components,count=label(wet,structure=np.ones((3,3)));coast=Polygon(f['coast']);channels=[];bank_flags=[];lakepolys=[Polygon(l['boundary']) for l in f['lakes']]
for c in f['channels']:
 p=np.array(c['points']);q=p[:,[0,2]];actual=sample(q,W);bed=sample(q,H);jj=np.rint((4000-q[:,1])/4).astype(int);ii=np.rint((q[:,0]+3000)/4).astype(int);classes=components[jj,ii];positive_ids=np.unique(classes[classes>0]);channels.append({'id':c['id'],'minActualDepthM':float(np.nanmin(actual-bed)),'nonfiniteActualSurfaceSamples':int((~np.isfinite(actual)).sum()),'maxActualSurfaceRiseM':float(max(0,np.nanmax(np.diff(actual)))),'maxDifferenceFromAuthoredSurfaceM':float(np.nanmax(np.abs(actual-p[:,1]))),'wetComponentIds':positive_ids.tolist(),'sourceComponent':int(classes[0]),'outletComponent':int(classes[-1]),'sameConnectedWetComponent':bool(len(positive_ids)==1 and classes[0]>0 and classes[-1]>0)})
 tangent=np.gradient(q,axis=0);normal=np.column_stack([-tangent[:,1],tangent[:,0]]);normal/=np.linalg.norm(normal,axis=1)[:,None];width=np.array(c['widthsM'])/2+12;banks=np.concatenate([q+normal*width[:,None],q-normal*width[:,None]]);expected=np.tile(p[:,1],2);terrain=sample(banks,H);eligible=np.ones(len(banks),bool)
 for lake in lakepolys:eligible&=~contains_xy(lake,banks[:,0],banks[:,1])
 near_junction=np.zeros(len(banks),bool)
 for other in f['channels']:
  if other['id']==c['id']:continue
  op=np.array(other['points']);dd,idx=cKDTree(op[:,[0,2]]).query(banks);half=np.array(other['widthsM'])[idx]/2;eligible&=dd>half+4;near_junction|=dd<half+32
 for k in [0,len(p)]:eligible[k:k+15]=False;eligible[k+len(p)-15:k+len(p)]=False
 actual_bank=sample(banks,W);outside=~contains_xy(coast,banks[:,0],banks[:,1]);flags=np.where((terrain<expected-.25)&eligible)[0]
 for k in flags:
  classification='outside authored coast / ocean-side normal probe' if outside[k] else 'overlapping tributary cross-section' if near_junction[k] else 'lower actual surface from projection' if np.isfinite(actual_bank[k]) and terrain[k]>=actual_bank[k]-.05 else 'actual wet cross-section outside original nominal bank probe' if np.isfinite(actual_bank[k]) and terrain[k]<actual_bank[k] else 'unresolved reference-bank geometry'
  bank_flags.append({'channel':c['id'],'xz':banks[k].round(3).tolist(),'authoredReferenceM':float(expected[k]),'terrainM':float(terrain[k]),'actualSurfaceM':float(actual_bank[k]) if np.isfinite(actual_bank[k]) else None,'classification':classification})
counts={k:sum(b['classification']==k for b in bank_flags) for k in sorted(set(b['classification'] for b in bank_flags))}
lakes=[]
for lake in f['lakes']:
 poly=Polygon(lake['boundary']).buffer(-12);points=np.array(poly.exterior.coords);levels=sample(points,W);lakes.append({'id':lake['id'],'levelM':lake['level'],'maxInteriorSurfaceDeviationM':float(np.nanmax(np.abs(levels-lake['level']))),'nonfiniteSamples':int((~np.isfinite(levels)).sum())})
result={'scope':'Actual raster water surface and connected submerged nodes, plus exact legacy low-bank probes. Connectivity is geometric and does not imply hydraulic simulation.','channels':channels,'lakes':lakes,'legacyLowBankCount':len(bank_flags),'legacyLowBankClassifications':counts,'legacyLowBankLocations':bank_flags,'waterMesh':f['waterMesh']};(D/'water-integrity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'bankClassifications':counts,'channels':channels,'lakes':lakes},indent=2))
