"""GEO-R02C-P0: replay the unmodified R1 generator and dump every stage.

The R1 source is hash-checked, then patched IN MEMORY ONLY at asserted anchor
strings that append copies of intermediate arrays; no R1 statement is changed.
All output (stage arrays, replayed terrain) goes to --out, which must lie
outside the repository. The replay counts as faithful only when its terrain
digest equals an unmodified run on the same environment (--expect).
"""
from pathlib import Path
import argparse,hashlib,json,os,sys,time
import numpy as np

R1_GENERATOR_SHA256='61d2f8ab591bdb222da6b5fe3ecc0332dbb5a4586d156306a5f99c0675b8d25a'
# Named constraint intermediates worth keeping (all length len(xy) inside constraints()).
KEEP=['land','sd','cd','target','fixed','priority','ridgeD','waterd','wetbed','wet','valley_floor','valleyhit',
      'lakebed','lakehit','lakeinside','width','nearest','second','owner','coastgrade','rocky','beach','crest']

def tie_aware_geometry(gen_dir,only_first_points=None):
 """COUNTERFACTUAL ONLY: R1's geometry module with projection() also checking the segments next to every
 KD vertex tied for nearest (closed rings repeat their first vertex, creating exact ties). Not used for R1.
 only_first_points: restrict the change to polylines whose first vertex matches one of these UV points."""
 import importlib.util
 from scipy.spatial import cKDTree
 spec=importlib.util.spec_from_file_location('geometry',gen_dir/'geometry.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 original=mod.projection
 def projection(points,values,xy):
  if only_first_points is not None and not any(np.allclose(points[0],q,atol=1e-9) for q in only_first_points):return original(points,values,xy)
  dd,ii=cKDTree(points).query(xy,k=2,workers=2);tie=np.abs(dd[:,0]-dd[:,1])<=1e-12
  best=np.full(len(xy),np.inf);value=np.zeros(len(xy));where=np.zeros_like(xy);segment=np.zeros(len(xy),int);fraction=np.zeros(len(xy))
  for idx,use in ((ii[:,0],np.ones(len(xy),bool)),(ii[:,1],tie)):
   for offset in [-1,0]:
    k=np.clip(idx+offset,0,len(points)-2);a=points[k];d=points[k+1]-a;t=np.clip(np.sum((xy-a)*d,axis=1)/np.maximum(1e-12,np.sum(d*d,axis=1)),0,1);p=a+d*t[:,None];dist=np.sum((xy-p)**2,axis=1);hit=use&(dist<best)
    best=np.where(hit,dist,best);value=np.where(hit,values[k]*(1-t)+values[k+1]*t,value);where=np.where(hit[:,None],p,where);segment=np.where(hit,k,segment);fraction=np.where(hit,t,fraction)
  return np.sqrt(best)*10,value,where,segment,fraction
 mod.projection=projection;return mod

def patch(src,anchor,addition,where='before'):
 assert src.count(anchor)==1,f'anchor not unique or missing: {anchor!r}'
 return src.replace(anchor,addition+anchor if where=='before' else anchor+addition)

def main():
 p=argparse.ArgumentParser()
 p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[3])
 p.add_argument('--out',type=Path,required=True)
 p.add_argument('--expect',help='terrain SHA-256 of an unmodified run in this environment')
 p.add_argument('--counterfactual-tie-aware-projection',action='store_true',help='diagnostic hypothesis test; output is NOT R1')
 p.add_argument('--tie-aware-lakes',nargs='*',help='restrict the counterfactual to these lake rings (design-master ids)')
 a=p.parse_args();root=a.root.resolve();out=a.out.resolve()
 assert root not in out.parents and out!=root,'--out must be outside the repository'
 gen=root/'tools/geo-r02b-r1/generate.py'
 assert hashlib.sha256(gen.read_bytes()).hexdigest()==R1_GENERATOR_SHA256,'R1 generator differs from the audited source'
 src=gen.read_text()
 src=patch(src,' return target.reshape(shape),fixed.reshape(shape)',' _L=dict(locals());_LOCALS[cell]={k:_L[k].copy() for k in _KEEP if k in _L and isinstance(_L[k],np.ndarray)};\n')
 src=patch(src,'T[~F]=spsolve(A,rhs);',' _ITER.append({"active":active.copy(),"F":F.copy()});',where='after')
 src=patch(src,' mean=convolve(T,',' _ITER[-1]["T"]=T.copy();\n')
 src=patch(src,'kernel=np.array([[0,.25,0],[.25,0,.25],[0,.25,0]])\nfor iteration in range(240):','_STAGE["coarse"]=T.copy();_STAGE["upsample"]=H.copy()\n')
 src=patch(src,'islands=[]\n','_STAGE["jacobi240"]=H.copy()\n')
 src=patch(src,'assert np.isfinite(H).all()','_STAGE["final"]=H.copy()\n')
 (out/'replay').mkdir(parents=True,exist_ok=True)
 g={'__name__':'r1_replay','__file__':str(gen),'_LOCALS':{},'_ITER':[],'_STAGE':{},'_KEEP':KEEP}
 sys.path.insert(0,str(gen.parent));argv=sys.argv
 if a.counterfactual_tie_aware_projection:
  only=None
  if a.tie_aware_lakes:
   sys.path.insert(0,str(gen.parent));from geometry import parse_path
   master=json.loads((root/'docs/geo-r02b/design-master-A-R1-v1.json').read_text())
   only=[parse_path(l['boundaryPath'])[0] for l in master['hydrology']['lakes'] if l['id'] in a.tie_aware_lakes];assert len(only)==len(a.tie_aware_lakes)
  sys.modules['geometry']=tie_aware_geometry(gen.parent,only)
 sys.argv=[str(gen),'--root',str(root),'--output',str(out/'replay')];started=time.perf_counter()
 try:exec(compile(src,str(gen)+' [instrumented]','exec'),g)
 finally:sys.argv=argv
 seconds=time.perf_counter()-started
 for cell,L in g['_LOCALS'].items():np.savez_compressed(out/f'constraints{cell}.npz',**L)
 np.savez_compressed(out/'stages.npz',**g['_STAGE'])
 np.savez_compressed(out/'active_set.npz',**{f'{k}{i}':v for i,it in enumerate(g['_ITER']) for k,v in it.items()})
 digest=hashlib.sha256((out/'replay/terrain.f32').read_bytes()).hexdigest()
 report={'generatorSha256':R1_GENERATOR_SHA256,'counterfactualTieAwareProjection':a.counterfactual_tie_aware_projection,'tieAwareLakes':a.tie_aware_lakes,'replayTerrainSha256':digest,'expectedSha256':a.expect,
  'faithful':None if a.expect is None else digest==a.expect,'activeSetIterations':len(g['_ITER']),
  'secondsIncludingDumps':round(seconds,1),'stages':sorted(g['_STAGE']),'constraintCells':sorted(g['_LOCALS'])}
 (out/'replay-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
 if a.expect and digest!=a.expect:sys.exit('replay is not faithful to the unmodified run')

if __name__=='__main__':main()
