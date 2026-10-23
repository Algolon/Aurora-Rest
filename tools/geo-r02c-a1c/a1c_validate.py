"""GEO-R02C-A1c geographic validation. Runs the A1a validation (tools/geo-r02c-a1a/validate.py) unchanged on the A1c manifest.
That suite reports the raised crest cells as a changed protected class, which is expected under the declared R-B trial; the
A1c pass is therefore defined explicitly and is stricter everywhere else:
- every protected class except 'crest' unchanged, cell for cell (water, lakes, valley floors, divides, corridors, zones, ...);
- crest cells change only if declared, only upwards, and stay above their R1 lower bound;
- summit cell and window maximum unchanged; no raised cell within 150 m of the summit or 135 m of a trail centreline;
- no new dry sinks, no drainage-destination change, wet cells, land/sea and coast unchanged, route centrelines unchanged;
- smooth transitions: delta gradient and curvature in fade zones no higher than in the core of the edit;
- route cross-slope (left minus right, 8 m and 20 m either side) reported for every route, before and after.
Usage: python3 tools/geo-r02c-a1c/a1c_validate.py s1  -> docs/geo-r02c-a1c/validation/s1.json"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;A1A=HERE.parent/'geo-r02c-a1a';sys.path[:0]=[str(A1A/'lib'),str(A1A)]
import validate as A  # noqa: E402
from grid import ROOT,J,I,CELL,load_r1,surface  # noqa: E402
from r1_masks import load as load_constraints  # noqa: E402
A.VAR=ROOT/'public/geo-r02c-a1c';A.DOC=ROOT/'docs/geo-r02c-a1c/validation';A.HERE=HERE
SUMMIT=(-520.,2770.)

def cross_slopes(H,routes):
 out={}
 for r in routes:
  p=np.array(r['points2'],float);t=np.gradient(p,axis=0);t/=np.linalg.norm(t,axis=1,keepdims=True)+1e-9;n=np.c_[-t[:,1],t[:,0]];row={}
  for o in (8,20):
   a=surface(H,p[:,0]+n[:,0]*o,p[:,1]+n[:,1]*o);b=surface(H,p[:,0]-n[:,0]*o,p[:,1]-n[:,1]*o);row[f'{o}m']=np.abs(a-b)/(2*o)
  out[r['id']]=row
 return out

def extra(vid,res):
 R1=load_r1();H,entry=A.compose(vid,R1);z=np.load(HERE/'.cache'/f'{vid}.npz');D=z['D'].astype(float);w=z['M'].astype(float);dl=z['delta'].astype(float)
 c=load_constraints();ck=res['checks'];features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
 pc=ck['protectedClassChangedCells'];ck['protectedUnchangedExceptDeclaredCrest']=all(v==0 for k,v in pc.items() if k!='crest')
 diff=(H!=R1);sub=diff[J,I];crest=z['cls_crest'];dh=H[J,I].astype(float)-R1[J,I].astype(float)
 decl=json.loads((A.VAR/entry['declared']['file']).read_text()) if entry.get('declared') else {'crestRaised':[],'shoulderChanged':[]}
 dset={(j,i) for j,i,_ in decl['crestRaised']}|{(j,i) for j,i,_ in decl['shoulderChanged']};jj,ii=np.nonzero(diff)
 ck['allChangedCellsDeclared']=bool(len(jj)==len(dset) and all((int(a),int(b)) in dset for a,b in zip(jj,ii)))
 ck['crestRelease']={'crestCellsRaised':int((sub&crest&(dh>0)).sum()),'crestCellsLowered':int((sub&crest&(dh<0)).sum()),'crestCellsBelowBound':ck['crestCellsBelowBound'],
  'maxCrestRaiseM':float(dh[sub&crest].max()) if (sub&crest).any() else 0.}
 X=(np.arange(I.start,I.stop)*CELL-3000.)[None,:];Z=(4000.-np.arange(J.start,J.stop)*CELL)[:,None];dsum=np.hypot(X-SUMMIT[0],Z-SUMMIT[1])
 from shapely.geometry import LineString;from shapely import distance as sd_,points
 Pc=points(np.c_[np.broadcast_to(X,sub.shape)[sub],np.broadcast_to(Z,sub.shape)[sub]])
 dtr=np.minimum(sd_(LineString(next(r for r in features['routes'] if r['id']=='peak-ascent')['points2']),Pc),sd_(LineString(next(r for r in features['routes'] if r['id']=='tarn-ascent')['points2']),Pc)) if sub.any() else np.array([1e9])
 i0=int(round((SUMMIT[0]+3000)/4));j0=int(round((4000-SUMMIT[1])/4));sH=H[J,I]
 ck['summit']={'heightR1M':float(R1[j0,i0]),'heightVariantM':float(H[j0,i0]),'unchanged':bool(H[j0,i0]==R1[j0,i0]),'windowMaximumUnchanged':bool(sH.max()==R1[J,I].max() and np.argmax(sH)==np.argmax(R1[J,I])),
  'closestChangeToSummitM':float(dsum[sub].min()) if sub.any() else None,'closestChangeToTrailM':float(dtr.min())}
 core=(w>=1)&(np.abs(D)>0);trans=(w>0)&(w<1)&(np.abs(D)>0)
 gy,gx=np.gradient(dl,CELL);g=np.hypot(gx,gy);lap=np.abs(np.gradient(gx,CELL,axis=1)+np.gradient(gy,CELL,axis=0))
 q=lambda a,m:{'cells':int(m.sum()),'p99':float(np.percentile(a[m],99)) if m.any() else 0.,'max':float(a[m].max()) if m.any() else 0.}
 ck['transitions']={'deltaGradientFade':q(g,trans),'deltaGradientCore':q(g,core),'deltaCurvatureFade':q(lap,trans),'deltaCurvatureCore':q(lap,core),
  'designedVolumeM3':float(np.abs(D[np.abs(D)>0]).sum()*16),'appliedVolumeM3':float(np.abs(dl).sum()*16)}
 t=ck['transitions'];t['smooth']=bool(t['deltaGradientFade']['max']<=t['deltaGradientCore']['max']+1e-9 and t['deltaCurvatureFade']['max']<=t['deltaCurvatureCore']['max']+1e-9)
 cs0=cross_slopes(R1.astype(float),features['routes']);cs1=cross_slopes(H.astype(float),features['routes'])
 ck['routeCrossSlope']={r:{o:{'p95Before':round(float(np.percentile(cs0[r][o],95)),3),'p95After':round(float(np.percentile(cs1[r][o],95)),3),'maxChange':round(float(np.abs(cs1[r][o]-cs0[r][o]).max()),4)} for o in cs0[r]} for r in cs0}
 dst=ck['summit']['closestChangeToTrailM'];ck['pass']=bool(ck['outsideWindowBboxUnchanged'] and ck['protectedUnchangedExceptDeclaredCrest'] and ck['allChangedCellsDeclared'] and ck['crestRelease']['crestCellsLowered']==0
  and ck['crestCellsBelowBound']==0 and ck['summit']['unchanged'] and ck['summit']['windowMaximumUnchanged'] and (ck['summit']['closestChangeToSummitM'] or 1e9)>=150 and dst>=135
  and ck['newDrySinkCells1cm']==0 and ck['drainageDestinationChangedCells']==0 and ck['wetCellsChanged']==0 and ck['landSeaSignChanged']==0 and ck['coastBand0to150Changed']==0
  and max(ck['routeCentrelineMaxChangeM'].values())==0 and t['smooth'])
 ck['a1aStrictPassNote']='The unmodified A1a suite reports pass = false whenever crest cells change; under the declared R-B trial the A1c pass above applies instead.'
 return res

if __name__=='__main__':
 vid=sys.argv[1];res=A.validate(vid);a1a_pass=res['checks']['pass'];res=extra(vid,res);res['checks']['a1aStrictPass']=a1a_pass
 (A.DOC/f'{vid}.json').write_text(json.dumps(res,indent=1)+'\n');c=res['checks']
 print(json.dumps({k:c[k] for k in ('pass','a1aStrictPass','protectedClassChangedCells','allChangedCellsDeclared','crestRelease','summit','newDrySinkCells1cm','drainageDestinationChangedCells','drainageTransitions(1=HighTarn,2=sea,3=other)','wetCellsChanged','routeCentrelineMaxChangeM','transitions','deltaStats')},indent=0)[:4000])
