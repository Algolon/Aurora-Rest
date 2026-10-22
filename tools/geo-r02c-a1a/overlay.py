"""GEO-R02C-A1a incremental terrain overlay (schema aurora-terrain-overlay/1).

H = R1 + M * D, where R1 is the committed canonical terrain (never re-solved, never overwritten), D is the design
displacement built from the spec's operators and M is the freedom mask (exactly 0 on every protected cell).
Only cells whose float32 value actually changes are written; every other cell keeps R1's bytes. An empty operator
list therefore reproduces R1 byte for byte.

Output per variant: public/geo-r02c-a1a/<id>.patch.f32 (row-major float32 of the changed bounding box) and an entry in
public/geo-r02c-a1a/manifest.json with the full-terrain SHA-256. Diagnostics (D, M, Delta) go to .cache/ (git-ignored).
Usage: python3 tools/geo-r02c-a1a/overlay.py tools/geo-r02c-a1a/specs/a1a-v2.json [--repeat 2]"""
from pathlib import Path
import argparse,hashlib,json,sys,time
import numpy as np
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE/'lib'));sys.path.insert(0,str(HERE))
from grid import ROOT,J,I,NX,NZ,R1_TERRAIN_SHA256,load_r1,sub_coords  # noqa: E402
from mask import freedom  # noqa: E402
import operators as ops  # noqa: E402
from r1_masks import load as load_constraints  # noqa: E402
from drainage import r1_divides  # noqa: E402
OUT=ROOT/'public/geo-r02c-a1a';CACHE=HERE/'.cache'
SCHEMA='aurora-terrain-overlay/1'

def build(spec,c,R1,features):
 X,Z=sub_coords();R1sub=R1[J,I].astype(float);D=np.zeros(X.shape);Dc=None;Dg=None;release=None;override=None;ridges={r['id']:r['points'] for r in features['ridges']}
 for op in spec['operators']:  # the gully releases R1 valley-floor cells, so it must run before the mask is built
  if op['type']=='gully':
   ch=next(x for x in features['channels'] if x['id']==op['channel']);Dg,inreach=ops.gully(X,Z,R1.astype(float),op,ch,1.)
   release=inreach&c['valleyhit'][J,I];override=(inreach,op['falloffOverrideM'])
 dv=(r1_divides(CACHE)[J,I]&(c['ridgeD'][J,I]>spec['mask']['divideOffCrestM'])) if spec['mask'].get('protectDivides') else None  # crests hold their own divides
 W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX)[J,I]
 M,cls,rep=freedom(c,J,I,spec['mask'],features,release,override,dv,W);rep['faces']={}
 for op in spec['operators']:
  kind=op['type']
  if kind=='faces':D=np.minimum(D,ops.faces(X,Z,op,ridges,R1,M,rep['faces']))
  elif kind=='cirque':Dc=ops.cirque(X,Z,R1sub,op)
  elif kind=='gully':pass
  else:raise ValueError('unknown operator '+kind)
 if Dc is not None:D=np.where(Dc<0,np.minimum(D,Dc),D)
 if Dg is not None:D=np.where(override[0],Dg,D)
 return D,M,cls,rep

def compose(R1,delta):
 H=R1.copy();sub=H[J,I];new=(R1[J,I].astype(float)+delta).astype('<f4');changed=(delta!=0)&(new!=sub);sub[changed]=new[changed];return H,changed

def run(spec_path):
 t0=time.perf_counter();spec=json.loads(Path(spec_path).read_text());assert spec['schema']==SCHEMA
 R1=load_r1();assert hashlib.sha256(R1.tobytes()).hexdigest()==R1_TERRAIN_SHA256==spec['base']['terrainSha256']
 c=load_constraints();features=json.loads((ROOT/'public/geo-r02b/features.json').read_text());t1=time.perf_counter()
 D,M,cls,rep=build(spec,c,R1,features);delta=D*M;H,changed=compose(R1,delta);t2=time.perf_counter()
 sha=hashlib.sha256(H.tobytes()).hexdigest();timing={'loadS':round(t1-t0,2),'buildAndComposeS':round(t2-t1,2)}
 return spec,H,changed,D,M,delta,cls,rep,sha,timing

def write(spec,H,changed,D,M,delta,cls,rep,sha,timing,spec_path):
 OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True);vid=spec['id']
 entry={'id':vid,'label':spec['label'],'spec':str(Path(spec_path).resolve().relative_to(ROOT)),'specSha256':hashlib.sha256(Path(spec_path).read_bytes()).hexdigest(),
  'baseTerrainSha256':R1_TERRAIN_SHA256,'terrainSha256':sha,'changedCells':int(changed.sum()),'grid':{'width':NX,'height':NZ,'cellM':4},'timing':timing}
 if changed.any():
  jj,ii=np.nonzero(changed);j0,j1=int(jj.min()+J.start),int(jj.max()+J.start);i0,i1=int(ii.min()+I.start),int(ii.max()+I.start)
  patch=H[j0:j1+1,i0:i1+1].astype('<f4').tobytes();(OUT/f'{vid}.patch.f32').write_bytes(patch)
  entry['patch']={'file':f'{vid}.patch.f32','rows':[j0,j1],'cols':[i0,i1],'sha256':hashlib.sha256(patch).hexdigest(),'bytes':len(patch)}
 else:entry['patch']=None
 man=OUT/'manifest.json';m=json.loads(man.read_text()) if man.exists() else {'schema':'aurora-terrain-variants/1','base':'public/geo-r02b/terrain.f32','baseTerrainSha256':R1_TERRAIN_SHA256,
  'note':'Review-only A1a form-study variants. Compose by copying each patch block into the canonical R1 grid; never overwrite R1.','variants':{}}
 m['variants'][vid]=entry;man.write_text(json.dumps(m,indent=1)+'\n')
 np.savez_compressed(CACHE/f'{vid}.npz',D=D.astype('<f4'),M=M.astype('<f4'),delta=delta.astype('<f4'),changed=changed,**{'cls_'+k:v for k,v in cls.items()})
 (CACHE/f'{vid}-mask-report.json').write_text(json.dumps(rep,indent=1));return entry

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('spec');a.add_argument('--repeat',type=int,default=1);args=a.parse_args()
 shas=[];last=None
 for k in range(args.repeat):
  last=run(args.spec);shas.append(last[8])
 assert len(set(shas))==1,f'non-deterministic overlay: {shas}'
 e=write(*last,args.spec);e['deterministicRuns']=len(shas);print(json.dumps(e))
