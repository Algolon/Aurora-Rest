"""Shared read-only helpers for the GEO-R02C-A1b-D design analysis (DESIGN ONLY: no terrain is generated or written).
Reads the pushed A1a checkpoint (feature/geo-r02c-a1a-form-study @ 80553e2): canonical R1, the committed V1-V3 patches
and the A1a mask cache. World metres: x east, z north; grid 1501 x 2001 at 4 m, x = 4i - 3000, z = 4000 - 4j."""
from pathlib import Path
import json,sys,functools,os
import numpy as np
PKG=Path(__file__).resolve().parents[1]
ROOT=Path(os.environ.get('A1A_ROOT',PKG.parents[1]))   # repository root (docs/geo-r02c-a1b-d/ -> ../..)
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'));sys.path.insert(0,str(ROOT/'tools/geo-r02c-a1a/lib'));sys.path.insert(0,str(ROOT/'tools/geo-r02c-a1a'))
from common import surface,hillshade  # noqa: E402,F401
from grid import NX,NZ,CELL,J,I,load_r1,sub_coords  # noqa: E402,F401
DATA=PKG/'data';IMG=PKG/'images';EVID=PKG/'evidence'
VFOV=60.;VIEW_H=800;PX_PER_DEG=VIEW_H/VFOV   # viewer camera: 60 deg vertical FOV, 1280 x 800 captures
CLASSES=['sea','lake','wet','valley','otherEquality','crest','corridor','zone','divide','waterSurface']
@functools.lru_cache(None)
def r1():return load_r1().astype(float)
@functools.lru_cache(None)
def variant(v):
 from validate import compose
 return compose(v,load_r1())[0].astype(float)
@functools.lru_cache(None)
def mask(v='v1'):
 """A1a freedom mask M and protected classes on the window sub-grid J x I (rows 0..575, cols 250..1175)."""
 z=np.load(ROOT/f'tools/geo-r02c-a1a/.cache/{v}.npz');return {k:z[k] for k in z.files}
@functools.lru_cache(None)
def features():return json.loads((ROOT/'public/geo-r02b/features.json').read_text())
def by_id(kind):return {e['id']:e for e in features()[kind]}
def route(rid):return np.array(by_id('routes')[rid]['points2'],float)
def ridge(rid):return np.array(by_id('ridges')[rid]['points'],float)
def channel(cid):return np.array(by_id('channels')[cid]['points'],float)
def cell_of(x,z):
 """Window sub-grid indices (row, col) of world points, or -1 outside the window box."""
 j=np.rint((4000.-np.asarray(z))/CELL).astype(int)-J.start;i=np.rint((np.asarray(x)+3000.)/CELL).astype(int)-I.start
 ok=(j>=0)&(j<J.stop-J.start)&(i>=0)&(i<I.stop-I.start);return np.where(ok,j,-1),np.where(ok,i,-1)
def classify(x,z,v='v1'):
 """Protection label per world point, using the A1a mask (first matching class in CLASSES order); 'free' when M > 0."""
 m=mask(v);j,i=cell_of(x,z);out=np.full(len(j),'outside window',dtype=object);ok=j>=0
 M=np.zeros(len(j));M[ok]=m['M'][j[ok],i[ok]]
 for k in np.nonzero(ok)[0]:
  lab='free' if M[k]>0 else 'fade (M = 0, unclassified)'
  if M[k]==0:
   for c in CLASSES:
    if m['cls_'+c][j[k],i[k]]:lab=c;break
  out[k]=lab
 return out,M
def arclen(p):return np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))]
def dump(name,obj):(DATA/name).write_text(json.dumps(obj,indent=1)+'\n')
def r(x,n=1):return round(float(x),n)
