"""GEO-R02C-B1 North massif candidate: composes the authored massif into the canonical island and writes the variant.
  python3 tools/geo-r02c-b01/build.py [--repeat 2]
Outputs public/geo-r02c-b01/{manifest.json,b1.patch.f32,routes.json} and tools/geo-r02c-b01/.cache/b1.npz (git-ignored).
The canonical R1 files are only read. M0 is the empty variant (parity with R1)."""
from pathlib import Path
import argparse,hashlib,json,sys
import numpy as np
from scipy.ndimage import distance_transform_edt
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(ROOT/'tools/geo-r02c/lib')]
from massif import build_body,smoothstep,epsilon_fill  # noqa: E402
NX,NZ,CELL=1501,2001,4.;R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a'
DESIGN=HERE/'design/north-massif-b1.json';OUT=ROOT/'public/geo-r02c-b01';CACHE=HERE/'.cache'

def poly_mask(poly,X,Z):
 from shapely import contains_xy;from shapely.geometry import Polygon
 return contains_xy(Polygon(poly),X,Z)

def line_dist(pts,X,Z):
 from shapely import distance,points;from shapely.geometry import LineString
 return distance(LineString(pts),points(np.c_[X.ravel(),Z.ravel()])).reshape(X.shape)

def weights(design,R1,WS,features,J,I,X,Z):
 sa=design['studyArea'];inside=poly_mask(sa['polygon'],X,Z)
 din=distance_transform_edt(inside)*CELL;w=smoothstep(din/sa['featherM']);core=smoothstep(din/design['base']['coreDistanceM'])
 land=R1>0;dcoast=(distance_transform_edt(land)*CELL)[J,I]
 w*=smoothstep((dcoast-sa['coastFreezeM'])/sa['coastFeatherM']);a,b=design['base']['coastTaperM'];coast_taper=smoothstep((dcoast-a)/(b-a))
 prot={p['id']:p for p in sa['protected']};lake=next(l for l in features['lakes'] if l['id']=='high-tarn')
 inl=poly_mask(lake['boundary'],X,Z);dl=distance_transform_edt(~inl)*CELL;p=prot['high-tarn'];w*=smoothstep((dl-p['bufferM'])/p['featherM'])
 for cid in ('tarn-inlet-w','windward-gully'):
  c=next(c for c in features['channels'] if c['id']==cid);p=prot[cid];d=line_dist(np.array(c['points'])[:,[0,2]],X,Z);w*=smoothstep((d-p['bufferM'])/p['featherM'])
 p=prot['routes-outside']
 for r in features['routes']:
  if r['id']=='peak-ascent':continue
  d=line_dist(r['points2'],X,Z);w*=smoothstep((d-p['bufferM'])/p['featherM'])
 wet=np.isfinite(WS[J,I]);w[wet]=0.;w[~land[J,I]]=0.
 return w,core*coast_taper,inside

def compose(design):
 R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX);WS=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX)
 features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
 poly=np.array(design['studyArea']['polygon'],float);pad=8
 i0=int((poly[:,0].min()+3000)//CELL)-pad;i1=int((poly[:,0].max()+3000)//CELL)+pad;j0=int((4000-poly[:,1].max())//CELL)-pad;j1=int((4000-poly[:,1].min())//CELL)+pad
 J=slice(j0,j1+1);I=slice(i0,i1+1);jj,ii=np.meshgrid(np.arange(j0,j1+1),np.arange(i0,i1+1),indexing='ij');X=ii*CELL-3000.;Z=4000.-jj*CELL
 w,core,inside=weights(design,R1.astype(float),WS,features,J,I,X,Z)
 R1s=R1[J,I].astype(float);Hn,body,base,parts=build_body(design,R1s,X,Z,core,np.ones_like(core),base_seed=(w<=0)|(R1s<=0)|np.isfinite(WS[J,I]))
 H=R1.astype(float).copy();H[J,I]=R1s+w*(Hn-R1s)
 # Hydrological conditioning: remove dry closed depressions created by the authoring (priority flood, epsilon gradient), only where w > 0.
 edit=np.zeros(H.shape,bool);edit[J,I]=w>0;sub=H[J,I];es=edit[J,I]
 seed=~es|(sub<=0)|np.isfinite(WS[J,I])  # seeds: unchanged cells, sea and water (and the sub-grid border)
 Fs=epsilon_fill(sub.astype(np.float32).astype(float),seed);dep=np.where(es,Fs-sub,0.)
 Hf=H.copy();Hf[J,I]=np.where(es,Fs,sub)
 H32=Hf.astype(np.float32);H32[~edit]=R1[~edit]
 return R1,H32,dict(J=J,I=I,X=X,Z=Z,w=w,core=core,inside=inside,Hn=Hn,body=body,base=base,parts=parts,fill=dep,features=features,WS=WS)

def sha(b):return hashlib.sha256(b).hexdigest()

def write(R1,H,ctx,design,routes=None):
 OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True)
 ch=np.nonzero(H!=R1);j0,j1,i0,i1=ch[0].min(),ch[0].max(),ch[1].min(),ch[1].max();block=np.ascontiguousarray(H[j0:j1+1,i0:i1+1]).astype('<f4')
 (OUT/'b1.patch.f32').write_bytes(block.tobytes());tsha=sha(H.astype('<f4').tobytes())
 dsha=sha(DESIGN.read_bytes());d=(H.astype(float)-R1.astype(float))
 entry={'id':'b1','label':'B1 · authored North massif candidate','design':'tools/geo-r02c-b01/design/north-massif-b1.json','designSha256':dsha,'baseTerrainSha256':R1_SHA,'terrainSha256':tsha,
  'changedCells':int(len(ch[0])),'patch':{'file':'b1.patch.f32','rows':[int(j0),int(j1)],'cols':[int(i0),int(i1)],'sha256':sha(block.tobytes()),'bytes':int(block.nbytes)},
  'stats':{'maxRaiseM':round(float(d.max()),2),'maxLoweringM':round(float(-d.min()),2),'changedHa':round(len(ch[0])*16/1e4,2),'changedOver1mHa':round(float((np.abs(d)>1).sum())*16/1e4,2),
   'summitM':round(float(H.max()),2),'summitXZ':[float(np.unravel_index(H.argmax(),H.shape)[1]*4-3000),float(4000-np.unravel_index(H.argmax(),H.shape)[0]*4)]},
  'routes':'routes.json' if routes is not None else None,'status':'experimental candidate; not art-approved; R1 unchanged'}
 m0={'id':'m0','label':'B01 M0 · canonical R1 (empty variant)','baseTerrainSha256':R1_SHA,'terrainSha256':R1_SHA,'changedCells':0,'patch':None}
 (OUT/'manifest.json').write_text(json.dumps({'schema':'aurora-terrain-variants/1','family':'b01','baseTerrainSha256':R1_SHA,'variants':{'m0':m0,'b1':entry}},indent=1)+'\n')
 if routes is not None:(OUT/'routes.json').write_text(json.dumps(routes,indent=0)+'\n')
 np.savez_compressed(CACHE/'b1.npz',H=H,**{k:ctx[k] for k in ('w','core','inside','Hn','body','base','fill')},J=[ctx['J'].start,ctx['J'].stop],I=[ctx['I'].start,ctx['I'].stop])
 return entry

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--repeat',type=int,default=1);a.add_argument('--no-route',action='store_true');args=a.parse_args()
 design=json.loads(DESIGN.read_text());shas=[]
 for _ in range(args.repeat):
  R1,H,ctx=compose(design);routes=None
  if not args.no_route:
   from route import candidate_routes;routes=candidate_routes(H,ctx)
  e=write(R1,H,ctx,design,routes);shas.append(e['terrainSha256'])
 assert len(set(shas))==1,'non-deterministic output';e['deterministicRuns']=len(shas);print(json.dumps(e,indent=0))
