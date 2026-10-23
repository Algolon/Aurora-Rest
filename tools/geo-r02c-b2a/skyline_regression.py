"""GEO-R02C-B2a skyline regression against the protected B1.1 baseline (MEASURED, terrain ray cast, eye 1.75 m, 60° vertical FOV over 800 px).
For each identity view the B1.1 and B2a skylines are compared per 0.05° of azimuth. A declared window around the Western Col / Vesttind
(the D2 correction) may change; everywhere else the skyline must stay within TOLERANCE_PX, and the North Peak summit must not move.
  python3 tools/geo-r02c-b2a/skyline_regression.py  -> docs/geo-r02c-b2a/data/skyline-regression.json (exit 1 on regression)"""
from pathlib import Path
import json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib')]
from route import bilinear  # noqa: E402
NX,NZ=1501,2001;PX=800/60.;TOLERANCE_PX=1.0;SUMMIT_TOLERANCE_PX=0.25
VIEWS={'birchwood':(-700.,300.),'valley-shoulder':(-175.97,-155.95),'tarn-overlook':(700.,1950.)}
ALLOWED=[{'id':'D2-western-col','xz':[[-1060,2460],[-1060,2760],[-640,2760],[-640,2460]],
 'why':'D2 directly affects the S0-S1 crest from 120 m west of the summit to the Vestfjell plateau start: the south-east arm start cap removes the B1.1 spill-over cone behind the summit, the col is opened and the plateau start moved. North Peak itself (x > -640) stays guarded.'},
 {'id':'D1-west-arm-terminal','xz':[[-1750,2500],[-1750,2850],[-1100,2850],[-1100,2500]],
 'why':'D1 directly affects the west arm beyond the protected 90 m core of Vesttind (the terminal taper fades in between 90 and 210 m): this is the artificially high arm end that formed the 2.08 ha coastal seam, and its terminal profile now descends to the R1 coast. Vesttind itself stays guarded.'}]
def load(fam,vid):
 R=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX).copy();e=json.loads((ROOT/f'public/geo-r02c-{fam}/manifest.json').read_text())['variants'][vid];p=e['patch']
 if p:(j0,j1),(i0,i1)=p['rows'],p['cols'];R[j0:j1+1,i0:i1+1]=np.fromfile(ROOT/f'public/geo-r02c-{fam}'/p['file'],'<f4').reshape(j1-j0+1,i1-i0+1)
 return R.astype(float)
def skyline(H,ox,oz,az):
 eye=float(bilinear(H,ox,oz))+1.75;r=np.arange(60,4200,4.);el=np.full(az.shape,-90.);at=np.zeros((len(az),2))
 for k,a in enumerate(az):
  x=ox+np.sin(a)*r;z=oz+np.cos(a)*r;e=np.degrees(np.arctan2(bilinear(H,x,z)-eye,r));m=int(np.argmax(e));el[k]=e[m];at[k]=(x[m],z[m])
 return el,at
def main():
 from shapely import contains_xy;from shapely.geometry import Polygon
 B11=load('b01','b1');B2=load('b2a','a');out={'method':__doc__.split('\n')[0],'tolerancePx':TOLERANCE_PX,'summitTolerancePx':SUMMIT_TOLERANCE_PX,'allowedWindows':ALLOWED,'views':{}};ok=True
 for v,(ox,oz) in VIEWS.items():
  a0=np.arctan2(-520-ox,2770-oz);az=a0+np.radians(np.arange(-18,18.001,.05));e1,p1=skyline(B11,ox,oz,az);e2,p2=skyline(B2,ox,oz,az);d=(e2-e1)*PX
  allowed=np.zeros(az.shape,bool)
  for w in ALLOWED:allowed|=contains_xy(Polygon(w['xz']),p1[:,0],p1[:,1])|contains_xy(Polygon(w['xz']),p2[:,0],p2[:,1])
  per={w['id']:round(float(np.abs(d[contains_xy(Polygon(w['xz']),p1[:,0],p1[:,1])|contains_xy(Polygon(w['xz']),p2[:,0],p2[:,1])]).max()),2) if (contains_xy(Polygon(w['xz']),p1[:,0],p1[:,1])|contains_xy(Polygon(w['xz']),p2[:,0],p2[:,1])).any() else 0. for w in ALLOWED}
  ks=int(np.argmax(e1));summit=float((e2[ks]-e1[ks])*PX);outside=np.abs(d[~allowed]);res={'maxShiftOutsideAllowedPx':round(float(outside.max()),2),'meanShiftOutsideAllowedPx':round(float(outside.mean()),3),'maxShiftPerAllowedWindowPx':per,
   'maxShiftInsideAllowedPx':round(float(np.abs(d[allowed]).max()),2) if allowed.any() else 0.,'allowedWidthDeg':round(float(allowed.sum()*.05),2),'summitShiftPx':round(summit,3),
   'pass':bool(outside.max()<=TOLERANCE_PX and abs(summit)<=SUMMIT_TOLERANCE_PX)}
  out['views'][v]=res;ok&=res['pass']
 out['pass']=bool(ok);(ROOT/'docs/geo-r02c-b2a/data').mkdir(parents=True,exist_ok=True);(ROOT/'docs/geo-r02c-b2a/data/skyline-regression.json').write_text(json.dumps(out,indent=1)+'\n')
 print(json.dumps(out['views'],indent=0));return ok
if __name__=='__main__':sys.exit(0 if main() else 1)
