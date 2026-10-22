"""GEO-R02C-P0: is the R1 4 m stage a converged solution of its own 4 m constraints?

Inputs: the canonical R1 binary (read-only) and stage dumps from r1_stages.py (Linux replay).
Produces: residual statistics, a Jacobi continuation curve, a converged obstacle solve of the full
island (M0c) and of the A1 window with a frozen R1 ring (M0w, the null re-solve control), and their
geometric differences from R1. Converged surfaces are written ONLY to --tmp (outside the repo).
Nothing here modifies or replaces the R1 baseline.
"""
from pathlib import Path
import argparse,json,sys,time
import numpy as np
from scipy import ndimage
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import cg
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lib'))
from common import ROOT,NX,NZ,load_grid,load_mask,stats,write_png,diverging,hillshade,downsample,sha256
from hydro import sink_report
from form import curvature_classes

K4=np.array([[0,.25,0],[.25,0,.25],[0,.25,0]])
def mean4(H):return ndimage.convolve(H,K4,mode='nearest')

def solve_obstacle(H0,frozen,crest,bound,tol=1e-7,max_outer=30,log=None):
 """Converge 4*h - sum(neighbours) = 0 on cells that are neither frozen nor active crest obstacles,
 using R1's 'nearest' edge semantics; crest cells keep h >= bound via an active set (as R1's coarse stage)."""
 H=H0.copy();active=crest&(H0<=bound+1e-6);outer=[]
 idx=np.arange(H.size).reshape(H.shape)
 for it in range(max_outer):
  fixed=frozen|active;H[active]=bound[active]
  free=~fixed;n=int(free.sum());pos=np.full(H.size,-1,np.int64);pos[idx[free]]=np.arange(n)
  j,i=np.nonzero(free);diag=np.full(n,4.);rows=[];cols=[];rhs=np.zeros(n)
  for dj,di in ((-1,0),(1,0),(0,-1),(0,1)):
   jj=np.clip(j+dj,0,NZ-1);ii=np.clip(i+di,0,NX-1);same=(jj==j)&(ii==i);diag-=same
   nb=idx[jj,ii];nbfree=free[jj,ii]&~same;rhs+=np.where(~nbfree&~same,H[jj,ii],0.)
   rows.append(np.arange(n)[nbfree]);cols.append(pos[nb[nbfree]])
  A=coo_matrix((np.r_[diag,-np.ones(sum(len(r) for r in rows))],(np.r_[np.arange(n),np.concatenate(rows)],np.r_[np.arange(n),np.concatenate(cols)])),shape=(n,n)).tocsr()
  t=time.perf_counter();count=[0]
  x,info=cg(A,rhs,x0=H[free],rtol=0,atol=tol*np.sqrt(n),maxiter=200000,callback=lambda _:count.__setitem__(0,count[0]+1))
  H[free]=x;res=float(np.abs(A@x-rhs).max())
  m=mean4(H);release=active&(m>bound+1e-4);add=crest&~active&(H<bound-1e-4)
  outer.append({'outer':it,'freeCells':n,'cgIterations':count[0],'cgInfo':int(info),'maxResidual':res,'seconds':round(time.perf_counter()-t,1),
   'released':int(release.sum()),'added':int(add.sum())})
  if log:log(outer[-1])
  if not (release|add).any():break
  active=(active&~release)|add
 return H,outer

def residual_report(H,eq,crest,bound,mainland):
 r=mean4(H)-H;free=mainland&~eq&~(crest&(np.abs(H-bound)<1e-6))
 return {'freeCells':int(free.sum()),'absResidual':stats(r[free])}

def main():
 p=argparse.ArgumentParser();p.add_argument('--dumps',type=Path,required=True);p.add_argument('--tmp',type=Path,required=True)
 p.add_argument('--doc',type=Path,default=ROOT/'docs/geo-r02c-p0/convergence');p.add_argument('--jacobi',type=int,nargs='*',default=[1000,3000,10000])
 a=p.parse_args();a.tmp.mkdir(parents=True,exist_ok=True);a.doc.mkdir(parents=True,exist_ok=True);log=lambda d:print(json.dumps(d),flush=True)
 canon_path=ROOT/'public/geo-r02b/terrain.f32';C=load_grid(canon_path)
 S=np.load(a.dumps/'stages.npz');c4=np.load(a.dumps/'constraints4.npz')
 T4=c4['target'].reshape(NZ,NX);fixed4=c4['fixed'].reshape(NZ,NX);crest=c4['crest'].reshape(NZ,NX);land=c4['land'].reshape(NZ,NX)
 eq=fixed4&~crest;bound=T4;J240=S['jacobi240'];final=S['final'];islands=final!=J240;mainland=land&~islands
 W=load_grid(ROOT/'public/geo-r02b/water-surface.f32')
 out={'canonicalSha256':sha256(canon_path),'linuxReplaySha256':sha256(a.dumps/'replay/terrain.f32'),
  'note':'Masks and targets come from the Linux replay. Cells whose canonical value differs from the Linux equality target are listed separately (platform classification differences).'}
 platform_eq=eq&(np.abs(C-T4)>1e-4)&mainland;out['equalityCellsDifferingCanonicalVsLinux']=int(platform_eq.sum())
 # 1. residuals of the shipped surfaces
 out['residualCanonical']=residual_report(C,eq|platform_eq,crest,bound,mainland)
 out['residualLinuxReplay']=residual_report(J240,eq,crest,bound,mainland)
 # 2. Jacobi continuation exactly as R1 iterates (fixed cells reset, crest max-clamped)
 H=J240.copy();done=0;curve=[];t=time.perf_counter()
 for target in sorted(a.jacobi):
  for _ in range(target-done):H=np.where(eq,T4,mean4(H));H=np.where(crest,np.maximum(H,T4),H)
  done=target;d=(H-J240)[mainland];curve.append({'extraIterations':target,**{k:round(v,4) for k,v in stats(d).items() if k!='n'},'meanSignedM':round(float(d.mean()),4),
   'cellsMovedOver1m':int((np.abs(d)>1).sum()),'secondsCumulative':round(time.perf_counter()-t,1)});log(curve[-1])
 out['jacobiContinuation']=curve
 # 3. converged full-island obstacle solve (M0c); islands and sea stay frozen at R1's values
 t=time.perf_counter();M0c,outer=solve_obstacle(J240,eq|~mainland,crest&mainland,bound,log=log);M0c=np.where(islands,final,M0c)
 np.save(a.tmp/'M0c.npy',M0c.astype(np.float32));d=(M0c-J240)[mainland]
 out['converged']={'outerIterations':outer,'seconds':round(time.perf_counter()-t,1),'differenceFromLinuxR1':{**stats(d),'meanSignedM':float(d.mean()),
  'fractionLowered':float((d<-.01).mean()),'fractionRaised':float((d>.01).mean()),'cellsOver1m':int((np.abs(d)>1).sum()),'cellsOver5m':int((np.abs(d)>5).sum())},
  'residualAfter':residual_report(M0c,eq,crest,bound,mainland)}
 # geometric implications
 out['converged']['curvatureLinuxR1']=curvature_classes(J240,mainland);out['converged']['curvatureM0c']=curvature_classes(M0c,mainland)
 rep,_=sink_report(M0c,W);out['converged']['sinksM0c']={k:rep[k] for k in ('maxFillDepthM','cellsAbove1cm')}|{'checks':[{kk:c[kk] for kk in ('thresholdM','minAreaM2','count')} for c in rep['checks']]}
 # 4. windowed null re-solve against the CANONICAL binary (M0w): outside window + frozen ring = canonical bytes
 mk=load_mask(ROOT/'tools/geo-r02c/masks/A1-window-v1.json');domain=mk['inside']&~mk['ring']&mainland
 eqc=(eq|platform_eq)&domain;frozen=~domain|eqc;H0=np.where(eqc,C,C)
 t=time.perf_counter();M0w,outer=solve_obstacle(H0,frozen,crest&domain,bound,log=log);np.save(a.tmp/'M0w.npy',M0w.astype(np.float32))
 dw=(M0w-C);out['windowNullResolve']={'outerIterations':outer,'seconds':round(time.perf_counter()-t,1),
  'outsideWindowMaxAbsDiff':float(np.abs(dw[~mk['inside']]).max()),'ringMaxAbsDiff':float(np.abs(dw[mk['ring']]).max()),
  'insideWindow':{**stats(dw[domain]),'meanSignedM':float(dw[domain].mean()),'cellsOver1m':int((np.abs(dw[domain])>1).sum())},
  'featherBand':stats(dw[mk['feather']&mainland]),'core':stats(dw[mk['core']&mainland])}
 rep,_=sink_report(M0w,W);out['windowNullResolve']['sinks']={'maxFillDepthM':rep['maxFillDepthM'],'checks':[{kk:c[kk] for kk in ('thresholdM','minAreaM2','count')} for c in rep['checks']]}
 # maps (diagnostic images, not engine renders)
 lim=5.;write_png(a.doc/'diff-M0c-minus-R1.png',downsample(diverging(np.where(mainland,M0c-J240,np.nan),lim),2))
 write_png(a.doc/'diff-M0w-minus-R1.png',downsample(diverging(np.where(mainland,M0w-C,np.nan),lim),2))
 for name,H in (('hillshade-R1.png',C),('hillshade-M0c.png',M0c)):
  g=(hillshade(H)*255).astype(np.uint8);write_png(a.doc/name,downsample(np.stack([g,g,g],-1),2))
 out['maps']={'diffLimitM':lim,'colour':'red = converged higher than R1, blue = lower; diagnostic heightfield maps, not browser renders'}
 (a.doc/'convergence.json').write_text(json.dumps(out,indent=1)+'\n');print('wrote',a.doc/'convergence.json')

if __name__=='__main__':main()
