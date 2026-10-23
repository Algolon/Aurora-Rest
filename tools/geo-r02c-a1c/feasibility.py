"""GEO-R02C-A1c silhouette feasibility (MEASURED, no terrain generated).
For each review viewpoint: the North Peak skyline (horizon point of maximum elevation angle per 0.1 deg azimuth on R1), what
forms it (which authored ridge crest, a flank/shoulder, or the frozen summit dome / corridor), and how far the R-B trial
envelope could move it: every crest point on a raise-eligible segment and every eligible shoulder cell is lifted by the full
+25 m (an upper bound), and the new horizon is the upper envelope of the old one and the lifted points.
Eligible = R1 crest band or A1a-free flank within 120 m of an eligible crest, inside window v2 with full freedom, >= 150 m
from the summit, >= 135 m from the peak-ascent / tarn-ascent centrelines (75 m corridor + 60 m fade), outside the frozen
zones (+40 m fade) and >= 300 m from the coast. For the two elevated obliques the outline of the massif itself is used (rays
restricted to the massif box), because the sea forms their true horizon. Pixels: 60 deg vertical FOV over 800 px (the review captures).
Outputs: docs/geo-r02c-a1c/feasibility/feasibility.json, eligible.npz"""
from pathlib import Path
import json,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'docs/geo-r02c-a1b-d/scripts'))
from b_common import r1,mask,ridge,route,surface,sub_coords,J,I,classify  # noqa: E402
from shapely.geometry import LineString,Point  # noqa: E402
from shapely import distance as sdist,points  # noqa: E402
from scipy import ndimage  # noqa: E402
OUT=ROOT/'docs/geo-r02c-a1c/feasibility';OUT.mkdir(parents=True,exist_ok=True)
ENV=25.;PXDEG=800/60.;SUMMIT=np.array([-520.,2770.])
R=r1();m=mask('v1');X,Z=sub_coords();C=np.load(ROOT/'tools/geo-r02c-a1a/.cache/r1-constraints-4m.npz')
RIDGES=['n-main','n-crown','n-west-spur','n-nw-cape','n-east-arc']
P=points(np.c_[X.ravel(),Z.ravel()])
dR={k:sdist(LineString(ridge(k)[:,[0,2]]),P).reshape(X.shape) for k in RIDGES}
dmin=np.min(np.stack(list(dR.values())),0);nearest=np.argmin(np.stack(list(dR.values())),0)
dtrail=np.minimum(sdist(LineString(route('peak-ascent')),P),sdist(LineString(route('tarn-ascent')),P)).reshape(X.shape)
dsum=np.hypot(X-SUMMIT[0],Z-SUMMIT[1]);sd=C['sd'][J,I]
zones=(np.hypot(X-1290,Z-2650)<240)|(np.hypot(X-750,Z-2172)<225)
# window weight: A1a mask is built as window*coast*class fades, so full window freedom = inside the window feather plateau
from mask import window_weight  # noqa: E402
ww,_=window_weight({'file':'docs/geo-r02c-a1d/data/window-v2-proposed.json'},X,Z)
base=(ww>=1)&(dsum>=150)&(dtrail>=135)&~zones&(sd>=300)&(R[J,I]>0)
crestE=base&C['crest'][J,I]
freeE=base&(m['M']>0.999)&(dmin<=120)&~C['crest'][J,I]
for k in ('cls_wet','cls_lake','cls_valley','cls_waterSurface','cls_divide'):freeE&=~m[k]
np.savez_compressed(OUT/'eligible.npz',crest=crestE,shoulder=freeE,nearest=nearest.astype('i1'))
VP={'birchwood':((-700.,300.),1.75,'Birchwood Forest'),'valley-shoulder':((-175.97,-155.95),1.75,'Central Valley shoulder'),'tarn-overlook':((700.,1950.),1.75,'High Tarn overlook'),
 'tarn-shore':((1080.,2420.),1.75,'High Tarn north shore'),'high-tarn':((1430.,1930.),1.75,'High Tarn east shore'),'approach-mid':((-581.,2341.),1.75,'Alpine ascent, mid'),
 'upper-trail':((-541.,2646.),1.75,'Alpine ascent, s = 2600 m'),'oblique-se':((700.,1650.),'abs:1450','South-east elevated oblique'),'oblique-n':((-250.,4300.),'abs:1300','Northern elevated oblique'),
 'west-coast':((-1520.,2060.),1.75,'Western windward coast (K3)')}
def eye(ox,oz,e):return float(e[4:]) if isinstance(e,str) else float(surface(R,[ox],[oz])[0])+e
lift_x=np.r_[X[crestE],X[freeE]];lift_z=np.r_[Z[crestE],Z[freeE]];lift_h=np.r_[R[J,I][crestE],R[J,I][freeE]]
lab_crest=np.r_[np.ones(crestE.sum(),bool),np.zeros(freeE.sum(),bool)]
def label(x,z):
 j=np.clip(np.rint((4000-z)/4).astype(int)-J.start,0,X.shape[0]-1);i=np.clip(np.rint((x+3000)/4).astype(int)-I.start,0,X.shape[1]-1)
 d=dmin[j,i];rid=np.array(RIDGES)[nearest[j,i]];out=[]
 for k in range(len(x)):
  if not((-1700<=x[k]<=1450) and (1450<=z[k]<=3500)):out.append('outside massif');continue
  if dsum[j[k],i[k]]<150:out.append('summit dome (frozen)');continue
  if dtrail[j[k],i[k]]<135:out.append('trail corridor (frozen)');continue
  if d[k]<=14:out.append(('eligible crest · ' if crestE[j[k],i[k]] else 'frozen crest · ')+rid[k])
  elif freeE[j[k],i[k]]:out.append('eligible shoulder · '+rid[k])
  else:out.append('other flank / foreground')
 return out
res={'method':__doc__.strip(),'envelopeM':ENV,'eligible':{'crestCells':int(crestE.sum()),'shoulderCells':int(freeE.sum()),
 'crestLengthByRidgeM':{k:round(float((crestE&(nearest==n)).sum()*16/20),0) for n,k in enumerate(RIDGES)}},'viewpoints':{}}
for vid,((ox,oz),e,name) in VP.items():
 oy=eye(ox,oz,e);az0=float(np.degrees(np.arctan2(SUMMIT[0]-ox,SUMMIT[1]-oz)));dist=float(np.hypot(*(SUMMIT-[ox,oz])));half=40. if dist>1500 else 75.
 if isinstance(e,str):half=30.
 azs=np.arange(az0-half,az0+half+1e-9,.1);ds=np.r_[np.arange(8,1500,4.),np.arange(1500,7000,8.)];ang=np.zeros(len(azs));hx=np.zeros(len(azs));hz=np.zeros(len(azs));hd=np.zeros(len(azs))
 for k,a in enumerate(azs):
  t=np.radians(a);xs=ox+np.sin(t)*ds;zs=oz+np.cos(t)*ds;ok=(np.abs(xs)<2998)&(np.abs(zs)<3998)
  if isinstance(e,str):ok&=(xs>=-1700)&(xs<=1450)&(zs>=1450)&(zs<=3500)   # elevated views: outline of the massif itself, not the sea horizon
  if not ok.any():ang[k]=-90;hx[k]=hz[k]=hd[k]=0;continue
  h=surface(R,xs[ok],zs[ok]);an=np.degrees(np.arctan2(h-oy,ds[ok]));q=int(np.argmax(an))
  ang[k],hx[k],hz[k],hd[k]=an[q],xs[ok][q],zs[ok][q],ds[ok][q]
 # lifted points (upper bound: full +25 m everywhere eligible); only points that are not occluded by R1 nearer than themselves
 dx=lift_x-ox;dz=lift_z-oz;dd=np.hypot(dx,dz);la=np.degrees(np.arctan2(dx,dz));la=(la-azs[0]+540)%360-180+azs[0]
 la_new=np.degrees(np.arctan2(lift_h+ENV-oy,dd));bins=np.clip(np.rint((la-azs[0])/.1).astype(int),0,len(azs)-1);inr=(la>=azs[0])&(la<=azs[-1])
 newang=ang.copy();np.maximum.at(newang,bins[inr],la_new[inr]);dpx=(newang-ang)*PXDEG
 lab=label(hx,hz);mass=np.array([l!='outside massif' and l!='other flank / foreground' for l in lab])
 from collections import Counter
 cnt=Counter(l.split(' · ')[0] for l,mm in zip(lab,mass) if mm);n=max(1,mass.sum())
 rid=Counter(l.split(' · ')[1] for l,mm in zip(lab,mass) if mm and ' · ' in l)
 res['viewpoints'][vid]={'name':name,'xz':[ox,oz],'eyeM':round(oy,1),'distanceToSummitM':round(dist),'massifSkylineWidthDeg':round(float(mass.sum()*.1),1),
  'skylineFormedByPct':{k:round(100*v/n,1) for k,v in cnt.most_common()},'skylineRidgesPct':{k:round(100*v/n,1) for k,v in rid.most_common()},
  'medianSkylineDistanceM':round(float(np.median(hd[mass]))) if mass.any() else None,
  'envelopeShiftPx':{'max':round(float(dpx.max()),1),'p90':round(float(np.percentile(dpx,90)),1),'widthOver3pxDeg':round(float((dpx>=3).sum()*.1),1),'widthOver8pxDeg':round(float((dpx>=8).sum()*.1),1)},
  'skyline':[[round(float(a),1),round(float(b),2),round(float(c),2)] for a,b,c in zip(azs[::5],ang[::5],newang[::5])]}
 v=res['viewpoints'][vid];print(f"{vid:15s} width {v['massifSkylineWidthDeg']:5.1f}°  {v['skylineFormedByPct']}  shift max {v['envelopeShiftPx']['max']:5.1f}px  ≥3px {v['envelopeShiftPx']['widthOver3pxDeg']}°  ≥8px {v['envelopeShiftPx']['widthOver8pxDeg']}°  ridges {v['skylineRidgesPct']}",flush=True)
(OUT/'feasibility.json').write_text(json.dumps(res,indent=1)+'\n');print(res['eligible'])
