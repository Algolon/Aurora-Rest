"""GEO-R02C-A1c macro-massing overlay driver (schema aurora-terrain-overlay/1), built on the A1a overlay code without changing it.

H = R1 + W * D. D comes from the A1c operators (ridgeMassing raises; S2 also buttress cut-and-fill). W is an eligibility weight
built from the unchanged A1a protection classes and mask settings (asserted identical to A1a V1), with two differences that
make it stricter or that implement the trial R-B release explicitly:
- R-B (trial): R1 crest-band cells are not frozen here, so declared segments may RAISE them (never lower: D >= 0 on crest
  cells). Every other A1a class (water, lakes, valley floors, divides, corridor, zones, coast, sea, other equality) stays
  exactly zero, with the A1a fade distances.
- Stricter: zero within 139 m of the peak-ascent / tarn-ascent centrelines (75 m corridor + 60 m) with a further 60 m fade,
  and zero within 150 m of the summit with an 80 m fade, so nothing deforms around the frozen corridor or the summit dome.
Every raised crest cell and every changed shoulder cell is declared individually in public/geo-r02c-a1c/<id>.declared.json
(row, column, delta in metres), referenced from the manifest with its SHA-256.
Usage: python3 tools/geo-r02c-a1c/a1c_overlay.py tools/geo-r02c-a1c/specs/a1c-s1.json [--repeat 2]"""
from pathlib import Path
import argparse,hashlib,json,sys,time
import numpy as np
from scipy.ndimage import distance_transform_edt
HERE=Path(__file__).resolve().parent;A1A=HERE.parent/'geo-r02c-a1a'
sys.path[:0]=[str(HERE/'lib'),str(A1A/'lib'),str(A1A)]
from grid import ROOT,J,I,NX,NZ,CELL,R1_TERRAIN_SHA256,load_r1,sub_coords  # noqa: E402
from mask import protected_classes,window_weight,smoothstep  # noqa: E402
from r1_masks import load as load_constraints  # noqa: E402
from drainage import r1_divides,destination  # noqa: E402
from scipy.ndimage import gaussian_filter,binary_dilation  # noqa: E402
import overlay as a1a  # noqa: E402
from massing import ridge_massing,buttresses  # noqa: E402
OUT=ROOT/'public/geo-r02c-a1c';CACHE=HERE/'.cache';SUMMIT=(-520.,2770.)

def weight(spec,c,features):
 ms=spec['mask'];X,Z=sub_coords();W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX)[J,I]
 dv=r1_divides(A1A/'.cache')[J,I]&(c['ridgeD'][J,I]>ms['divideOffCrestM'])
 cls=protected_classes(c,J,I,X,Z,ms,features,None,dv,W);ww,_=window_weight(ms['window'],X,Z)
 sd=c['sd'][J,I];cb=ms['coast'];w=ww*np.where(sd<cb['frozenM'],0.,smoothstep((sd-cb['frozenM'])/(cb['taperToM']-cb['frozenM'])))
 for name,m in cls.items():
  if name in ('sea','crest') or not m.any():continue
  d=distance_transform_edt(~m)*CELL
  fmin=spec.get('raise',{}).get('minFadeM',0.)   # raises are larger than A1a cuts, so they may use wider (never narrower) fades
  w=w*(smoothstep((d-64.)/max(60.,fmin)) if name=='corridor' else smoothstep(d/max(ms['falloffM'][name],fmin)))
 w=w*smoothstep((np.hypot(X-SUMMIT[0],Z-SUMMIT[1])-150.)/80.)
 for name,m in cls.items():
  if name!='crest':w[m]=0.
 return w,cls

def flow_cap(R1sub,delta,eps=0.02,iters=400):
 """Hydrological guarantee: every cell keeps draining to its R1 D8 receiver. With r(c) the steepest-descent neighbour of c on R1,
 each receiver's delta is capped so that H[r] <= H[c] - eps for all of its donors c (iterated until stable). A raise can then never
 dam a flow path or create a closed depression; it only ever makes downhill paths steeper."""
 h=R1sub;ny,nx=h.shape;best=np.zeros(h.shape);rj=np.full(h.shape,-1);ri=np.full(h.shape,-1)
 for dj in (-1,0,1):
  for di in (-1,0,1):
   if not(dj or di):continue
   sh=np.full(h.shape,np.inf);sh[max(-dj,0):ny-max(dj,0),max(-di,0):nx-max(di,0)]=h[max(dj,0):ny-max(-dj,0),max(di,0):nx-max(-di,0)]
   g=(h-sh)/np.hypot(dj,di);k=g>best;best[k]=g[k];rj[k]=(np.arange(ny)[:,None]+dj+np.zeros((1,nx),int))[k];ri[k]=(np.arange(nx)[None,:]+di+np.zeros((ny,1),int))[k]
 has=rj>=0;cj,ci=np.nonzero(has);tj,ti=rj[has],ri[has];d=delta.copy();n=0
 for n in range(iters):
  cap=np.full(h.shape,np.inf);np.minimum.at(cap,(tj,ti),h[cj,ci]+d[cj,ci]-eps-h[tj,ti])
  nd=np.minimum(d,np.maximum(cap,np.minimum(d,0.)))
  if np.array_equal(nd,d):break
  d=nd
 return d,n

def build(spec,c,R1,features):
 assert spec['mask']==json.loads((A1A/'specs/a1a-v1.json').read_text())['mask'],'A1c must use the A1a V1 mask settings unchanged'
 X,Z=sub_coords();w,cls=weight(spec,c,features);ridges={r['id']:r['points'] for r in features['ridges']};rep={'operators':{}};D=np.zeros(X.shape)
 for op in spec['operators']:
  r={}
  if op['type']=='ridgeMassing':D=np.maximum(D,ridge_massing(X,Z,op,ridges,r))
  elif op['type']=='buttresses':D=D+buttresses(X,Z,op,ridges,R1,r)
  else:raise ValueError('unknown A1c operator '+op['type'])
  rep['operators'][op['id']]=r
 crest=cls['crest'];D=np.where(crest,np.maximum(D,0.),D)            # crest cells: raise only (R1 lower bound)
 delta=w*D;sub=R1[J,I].astype(float);top=float(R1.max())
 if spec.get('raise',{}).get('flowPreserving',False):
  capped,it=flow_cap(sub,delta);rep['flowCap']={'cellsReduced':int((capped<delta-1e-6).sum()),'maxReductionM':float((delta-capped).max()),'iterations':it};delta=capped
 if spec.get('raise',{}).get('destinationPreserving',False):
  # hydrology guarantee 2: no cell may change drainage destination (High Tarn / sea / other). Where one would, the edit is attenuated
  # smoothly around it (Gaussian, sigma 12 m) and the check is repeated; the cap above is re-applied after each step.
  Wf=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX).astype(float);d0=destination(R1.astype(float),Wf,features);hist=[]
  for it in range(24):
   Ht=R1.astype(float).copy();Ht[J,I]=sub+delta;Ht=Ht.astype('<f4').astype(float);d1=destination(Ht,Wf,features);chg=(d0!=d1)[J,I];hist.append(int(chg.sum()))
   if not chg.any():break
   att=gaussian_filter(binary_dilation(chg,iterations=1).astype(float),3.);att=np.clip(att/max(att.max(),1e-9)*1.3,0,1)
   delta=delta*(1-att)
   if spec['raise'].get('flowPreserving',False):delta,_=flow_cap(sub,delta)
  rep['destinationPreserving']={'changedCellsPerIteration':hist}
 over=(delta>0)&((sub+delta)>=top-1.);rep['summitGuardCells']=int(over.sum())   # no raised cell may reach the summit height (design keeps 150 m clear)
 delta=np.where(over,np.maximum(0.,np.minimum(delta,top-1.-sub)),delta)
 return D,w,delta,cls,rep

def run(spec_path):
 t0=time.perf_counter();spec=json.loads(Path(spec_path).read_text());assert spec['schema']==a1a.SCHEMA
 R1=load_r1();assert hashlib.sha256(R1.tobytes()).hexdigest()==R1_TERRAIN_SHA256==spec['base']['terrainSha256']
 c=load_constraints();features=json.loads((ROOT/'public/geo-r02b/features.json').read_text());t1=time.perf_counter()
 D,w,delta,cls,rep=build(spec,c,R1,features);H,changed=a1a.compose(R1,delta)
 return spec,H,changed,D,w,delta,cls,rep,hashlib.sha256(H.tobytes()).hexdigest(),{'loadS':round(t1-t0,2),'buildS':round(time.perf_counter()-t1,2)}

def write(spec,H,changed,D,w,delta,cls,rep,sha,timing,spec_path):
 OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True);vid=spec['id'];R1=load_r1()
 entry={'id':vid,'label':spec['label'],'spec':str(Path(spec_path).resolve().relative_to(ROOT)),'specSha256':hashlib.sha256(Path(spec_path).read_bytes()).hexdigest(),
  'baseTerrainSha256':R1_TERRAIN_SHA256,'terrainSha256':sha,'changedCells':int(changed.sum()),'grid':{'width':NX,'height':NZ,'cellM':4},
  'release':'R-B trial (raise-only crest cells on declared segments); not a crest revision, not a design-master change'}
 if changed.any():
  jj,ii=np.nonzero(changed);j0,j1=int(jj.min()+J.start),int(jj.max()+J.start);i0,i1=int(ii.min()+I.start),int(ii.max()+I.start)
  patch=H[j0:j1+1,i0:i1+1].astype('<f4').tobytes();(OUT/f'{vid}.patch.f32').write_bytes(patch)
  entry['patch']={'file':f'{vid}.patch.f32','rows':[j0,j1],'cols':[i0,i1],'sha256':hashlib.sha256(patch).hexdigest(),'bytes':len(patch)}
  dh=(H[J,I].astype(float)-R1[J,I].astype(float));crest=cls['crest']&changed;sh=changed&~cls['crest']
  rows=lambda m:[[int(j+J.start),int(i+I.start),round(float(dh[j,i]),2)] for j,i in zip(*np.nonzero(m))]
  decl={'schema':'aurora-a1c-declared-cells/1','variant':vid,'note':'Every cell this variant changes, as [row, column, delta m] on the canonical 1501 x 2001 grid.','crestRaised':rows(crest),'shoulderChanged':rows(sh)}
  raw=json.dumps(decl,separators=(',',':')).encode();(OUT/f'{vid}.declared.json').write_bytes(raw)
  entry['declared']={'file':f'{vid}.declared.json','sha256':hashlib.sha256(raw).hexdigest(),'crestCellsRaised':int(crest.sum()),'shoulderCellsChanged':int(sh.sum()),
   'maxRaiseM':round(float(dh.max()),2),'maxLoweringM':round(float(-dh.min()),2),'changedHa':round(float(changed.sum())*16/1e4,2),'crestCellsLoweredMustBe0':int((crest&(dh<0)).sum())}
 else:entry['patch']=None;entry['declared']=None
 man=OUT/'manifest.json';m=json.loads(man.read_text()) if man.exists() else {'schema':'aurora-terrain-variants/1','base':'public/geo-r02b/terrain.f32','baseTerrainSha256':R1_TERRAIN_SHA256,
  'note':'Review-only A1c macro-massing trial variants (R-B trial raises). Compose by copying each patch block into the canonical R1 grid; never overwrite R1.','variants':{}}
 m['variants'][vid]=entry;man.write_text(json.dumps(m,indent=1)+'\n')
 np.savez_compressed(CACHE/f'{vid}.npz',D=D.astype('<f4'),M=w.astype('<f4'),delta=delta.astype('<f4'),changed=changed,**{'cls_'+k:v for k,v in cls.items()})
 (CACHE/f'{vid}-report.json').write_text(json.dumps({**rep,'timing':timing},indent=1));return entry

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('spec');a.add_argument('--repeat',type=int,default=1);args=a.parse_args()
 shas=[];last=None
 for k in range(args.repeat):last=run(args.spec);shas.append(last[8])
 assert len(set(shas))==1,f'non-deterministic overlay: {shas}'
 e=write(*last,args.spec);e['deterministicRuns']=len(shas);print(json.dumps({k:v for k,v in e.items() if k!='grid'}))
