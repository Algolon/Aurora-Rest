"""GEO-R02C-A1b-alpha geographic validation. Runs the A1a validation (tools/geo-r02c-a1a/validate.py) unchanged on the A1b
manifest, then adds checks specific to this experiment:
- maskTransition: how much of the designed cut the A1a mask attenuated, and whether the result is steeper or sharper where
  the mask fades (0 < M < 1) than inside the free face (a mask-shaped edge would show up here);
- summit position and height, crest cells and the High Tarn seam zone unchanged;
- terrain-only visibility of the changed cells from the review viewpoints.
Usage: python3 tools/geo-r02c-a1b/a1b_validate.py alpha  -> docs/geo-r02c-a1b-alpha/validation/alpha.json"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;A1A=HERE.parent/'geo-r02c-a1a';sys.path[:0]=[str(A1A/'lib'),str(A1A)]
import validate as A  # noqa: E402  (A1a checks, unmodified)
from grid import ROOT,J,I,NX,NZ,CELL,load_r1,surface  # noqa: E402
from r1_masks import load as load_constraints  # noqa: E402
A.VAR=ROOT/'public/geo-r02c-a1b';A.DOC=ROOT/'docs/geo-r02c-a1b-alpha/validation';A.HERE=HERE
VIEWPOINTS={'birchwood':(-700.,300.),'valley-shoulder':(-175.97,-155.95),'central-valley':(90.,80.),'tarn-overlook':(700.,1950.),'high-tarn':(1430.,1930.),
 'tarn-shore':(1080.,2420.),'approach-mid':(-581.,2341.),'approach-upper':(-542.,2579.),'face-from-route':(-396.,1683.),'face-from-upper-route':(-541.,2646.)}
SUMMIT=(-520.,2770.)

def visible_share(H,ox,oz,tx,tz):
 oy=surface(H,[ox],[oz])[0]+1.75;ty=surface(H,tx,tz)+.5;d=np.hypot(tx-ox,tz-oz);n=int(max(2,d.max()/6));s=(np.arange(1,n)/n)[None,:];vis=np.zeros(len(tx),bool)
 for k in range(0,len(tx),1500):
  sl=slice(k,k+1500);xs=ox+(tx[sl]-ox)[:,None]*s;zs=oz+(tz[sl]-oz)[:,None]*s;ys=oy+(ty[sl]-oy)[:,None]*s
  vis[sl]=~(surface(H,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
 return float(vis.mean())

def extra(vid,res):
 R1=load_r1();H,_=A.compose(vid,R1);z=np.load(HERE/'.cache'/f'{vid}.npz');D=z['D'].astype(float);M=z['M'].astype(float);dl=z['delta'].astype(float);c=load_constraints();ck=res['checks']
 cut=D<0;trans=(M>0)&(M<1)&cut;inner=(M>=1)&cut
 gy,gx=np.gradient(dl,CELL);g=np.hypot(gx,gy);lap=np.abs(np.gradient(gx,CELL,axis=1)+np.gradient(gy,CELL,axis=0))
 def q(a,m):return {'cells':int(m.sum()),'p99':float(np.percentile(a[m],99)) if m.any() else 0.,'max':float(a[m].max()) if m.any() else 0.}
 ck['maskTransition']={'designedCutVolumeM3':float(-D[cut].sum()*16),'appliedCutVolumeM3':float(-dl[cut].sum()*16),
  'attenuatedSharePct':float(100*(1-dl[cut].sum()/D[cut].sum())) if cut.any() else 0.,'maxAttenuationM':float(((M-1)*D)[cut].max()) if cut.any() else 0.,
  'deltaGradientInFade':q(g,trans),'deltaGradientInFreeFace':q(g,inner),'deltaCurvatureInFade':q(lap,trans),'deltaCurvatureInFreeFace':q(lap,inner)}
 mt=ck['maskTransition'];mt['noMaskShapedEdge']=bool(mt['deltaGradientInFade']['max']<=mt['deltaGradientInFreeFace']['max'] and mt['deltaCurvatureInFade']['max']<=mt['deltaCurvatureInFreeFace']['max'])
 i0=int(round((SUMMIT[0]+3000)/4));j0=int(round((4000-SUMMIT[1])/4));sub=H[J,I];am=np.unravel_index(np.argmax(sub),sub.shape)
 ck['summit']={'heightR1M':float(R1[j0,i0]),'heightVariantM':float(H[j0,i0]),'unchanged':bool(H[j0,i0]==R1[j0,i0]),'windowMaximumAt':[float(I.start+am[1])*4-3000,4000-float(J.start+am[0])*4],
  'windowMaximumUnchanged':bool(sub.max()==R1[J,I].max() and (np.argmax(sub)==np.argmax(R1[J,I])))}
 crest=c['crest'];ck['crestCellsChanged']=int((H[crest]!=R1[crest]).sum())
 ck['seamZoneCellsChanged']=res['checks']['protectedClassChangedCells'].get('zone',None)
 jj,ii=np.nonzero(np.abs(H-R1)>1);sel=slice(None,None,max(1,len(jj)//3000));tx=ii[sel]*4.-3000;tz=4000.-jj[sel]*4.
 ck['changedCellsVisiblePct']={k:round(100*visible_share(R1,x,z_,tx,tz),1) for k,(x,z_) in VIEWPOINTS.items()} if len(jj) else {}
 ck['pass']=bool(ck['pass'] and ck['summit']['unchanged'] and ck['summit']['windowMaximumUnchanged'] and ck['crestCellsChanged']==0 and (ck['seamZoneCellsChanged'] in (0,None)) and mt['noMaskShapedEdge']
  and ck['drainageDestinationChangedCells']==0)
 ck['passDefinition']='A1a pass AND summit + window maximum unchanged AND crest cells unchanged AND seam zone unchanged AND no drainage-destination change AND no mask-shaped edge'
 return res

if __name__=='__main__':
 vid=sys.argv[1];res=A.validate(vid);res=extra(vid,res);(A.DOC/f'{vid}.json').write_text(json.dumps(res,indent=1)+'\n')
 c=res['checks'];print(json.dumps({k:c[k] for k in c if k not in('sinksR1','sinksVariant','sinksBox')},indent=0)[:3500])
