"""GEO-R02C-A1a: extract R1's 4 m constraint classes (READ-ONLY, in memory).

The audited R1 generator is hash-checked and only its setup and constraints() definition are executed, in memory,
with one asserted patch that copies constraint masks at the end of constraints(); no R1 file is modified and the
R1 solve is not run. Outputs go to tools/geo-r02c-a1a/.cache/ (git-ignored).

Platform note (P0 reproducibility.md): Linux and the canonical macOS run classify constraints identically except
four north-west coast nodes (inside the frozen 0-150 m coastal band) and the Birchwood-upper seam values (outside the
A1 window). verify() checks every equality-constrained cell inside the window against the committed canonical terrain."""
from pathlib import Path
import hashlib,json,sys,time,tempfile
import numpy as np
ROOT=Path(__file__).resolve().parents[2];GEN=ROOT/'tools/geo-r02b-r1/generate.py';CACHE=Path(__file__).resolve().parent/'.cache'
R1_GENERATOR_SHA256='61d2f8ab591bdb222da6b5fe3ecc0332dbb5a4586d156306a5f99c0675b8d25a'
R1_TERRAIN_SHA256='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a'
KEEP=['target','fixed','land','sd','crest','priority','lakehit','lakeinside','wet','valleyhit','waterd','ridgeD']
def extract():
 src=GEN.read_bytes();assert hashlib.sha256(src).hexdigest()==R1_GENERATOR_SHA256,'R1 generator differs from the audited source'
 src=src.decode();cut='T,F,L,SD,RD,CREST=constraints(16)';assert src.count(cut)==1
 head=src[:src.index(cut)];anchor=' return target.reshape(shape),fixed.reshape(shape)';assert head.count(anchor)==1
 head=head.replace(anchor,' _OUT[cell]={k:np.asarray(v).reshape(shape).copy() for k,v in locals().items() if k in _KEEP and np.size(v)==np.prod(shape)}\n'+anchor)
 g={'__name__':'r1_constraints_only','__file__':str(GEN),'_OUT':{},'_KEEP':KEEP};argv=sys.argv
 with tempfile.TemporaryDirectory() as tmp:
  sys.path.insert(0,str(GEN.parent));sys.argv=[str(GEN),'--root',str(ROOT),'--output',tmp];t=time.perf_counter()
  try:exec(compile(head,str(GEN)+' [constraints only]','exec'),g);g['constraints'](4)
  finally:sys.argv=argv
 out=g['_OUT'][4];out['seconds']=np.array(time.perf_counter()-t);return out
def load():
 f=CACHE/'r1-constraints-4m.npz'
 if not f.exists():
  CACHE.mkdir(exist_ok=True);np.savez_compressed(f,**extract())
 z=np.load(f);return {k:z[k] for k in z.files}
KNOWN_PLATFORM_COAST_NODES=[(-1684,2808),(-1756,2712),(-1768,2696),(-1792,2664)]  # P0 reproducibility.md, mechanism B
def verify(c,H,window_bbox=(-2000,1700,1700,4000)):
 """Equality cells (fixed minus crest) inside the window bbox must equal float32(target) exactly in the canonical terrain,
 except offshore island footprints (R1 writes islands after the solve) and the four known macOS/Linux coast nodes."""
 x0,x1,z0,z1=window_bbox;J=slice(int((4000-z1)/4),int((4000-z0)/4)+1);I=slice(int((x0+3000)/4),int((x1+3000)/4)+1)
 eq=(c['fixed']&~c['crest'])[J,I];t=c['target'][J,I].astype('<f4');h=H[J,I];crest=c['crest'][J,I];land=c['land'][J,I]
 mm=eq&(h!=t);island=mm&~land&(h>0);coastline=mm&~island&(np.abs(c['sd'][J,I])<1e-6)  # nodes ON the coastline polyline
 known=int(coastline.sum());jj,ii=np.nonzero(coastline);xs=(ii+I.start)*4-3000;zs=4000-(jj+J.start)*4
 return {'equalityCellsInWindowBbox':int(eq.sum()),'matchExactly':int((eq&~mm).sum()),'islandFootprintCells':int(island.sum()),
  'coastlineCoincidentNodes':known,'coastlineNodesMaxDiffM':float(np.abs(h[coastline]-t[coastline]).max()) if known else 0.,'p0KnownPlatformNodesAmongThem':int(sum(any(abs(x-a)<1 and abs(z-b)<1 for a,b in KNOWN_PLATFORM_COAST_NODES) for x,z in zip(xs,zs))),'unexplainedMismatches':int(mm.sum()-island.sum()-known),
  'crestCellsInWindowBbox':int(crest.sum()),'crestBelowBound':int((h[crest]<t[crest]).sum())}
if __name__=='__main__':
 c=load();H=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(2001,1501)
 assert hashlib.sha256(H.tobytes()).hexdigest()==R1_TERRAIN_SHA256
 print(json.dumps({'extractSeconds':round(float(c['seconds']),1),**verify(c,H)}))
