"""Shared helpers for the GEO-R02C-A1-D design dossier (DESIGN ONLY).
Reads the canonical R1 artifacts and the A-R1 design master; never writes outside docs/geo-r02c-a1d/.
World metres: x east, z north. Grid 1501 x 2001, 4 m: x = 4i - 3000, z = 4000 - 4j. Planning UV: u = (x+3000)/10, v = (4000-z)/10."""
from pathlib import Path
import json,sys,functools
import numpy as np
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from common import load_grid,load_features,surface,hillshade,i_of,j_of,R1_DIR,CELL  # noqa: E402,F401
from shapely.geometry import Polygon,LineString,Point  # noqa: E402,F401
OUT=ROOT/'docs/geo-r02c-a1d';IMG=OUT/'images';DATA=OUT/'data'
X0,X1,Z0,Z1=-2100.,1800.,1200.,4000.   # design-map extent (world m)
PX=0.25                                  # SVG px per metre -> 975 x 700
W=int((X1-X0)*PX);H=int((Z1-Z0)*PX)
def to_px(x,z):return ((np.asarray(x)-X0)*PX,(Z1-np.asarray(z))*PX)
def ar1_px(x,z):
 """World -> pixel in docs/geo-r02b/reference-a-r1.png (map frame cols 200-1799, rows 334-2465 = UV 600 x 800)."""
 u=(np.asarray(x)+3000)/10;v=(4000-np.asarray(z))/10;return 200+u*1600/600,334+v*2132/800
@functools.lru_cache(None)
def terrain():return load_grid(R1_DIR/'terrain.f32')
@functools.lru_cache(None)
def water():return load_grid(R1_DIR/'water-surface.f32')
@functools.lru_cache(None)
def features():return load_features()
@functools.lru_cache(None)
def master():return json.loads((ROOT/'docs/geo-r02b/design-master-A-R1-v1.json').read_text())
@functools.lru_cache(None)
def concept(version='v1'):return json.loads((DATA/f'a1d-concept-{version}.json').read_text())
def by_id(kind):return {e['id']:e for e in features()[kind]}
def coast():return Polygon(features()['coast'])
def ridge_line(rid):p=np.array(by_id('ridges')[rid]['points']);return LineString(p[:,[0,2]]),p
def channel_xyz(cid):return np.array(by_id('channels')[cid]['points'])
def h_at(x,z):return surface(terrain(),np.atleast_1d(x),np.atleast_1d(z))
def section(a,b,step=8.):
 """R1 heights along a straight line a->b on the rendered triangle surface."""
 a=np.array(a,float);b=np.array(b,float);n=int(np.hypot(*(b-a))//step)+1;t=np.linspace(0,1,n)
 p=a+(b-a)*t[:,None];return np.hypot(*(p-a).T),h_at(p[:,0],p[:,1]),p
def drainage_destination():
 """Per-cell terminal of D8 descent on R1: 1 = High Tarn, 2 = sea, 3 = other lake, 0 = unresolved.
 D8 stops at any wet cell; wet channel cells are resolved to where their channel ends (High Tarn inlet, coast, other lake)."""
 from hydro import d8_outlets
 from scipy.spatial import cKDTree
 Hh=terrain();Ww=water();out=d8_outlets(Hh,Ww);tj,ti=np.unravel_index(out,Hh.shape);wl=Ww[tj,ti];th=Hh[tj,ti]
 code=np.where(th<=0,2,np.where(np.isfinite(wl),3,0))
 nodes=by_id('nodes');chans=features()['channels']
 def chan_dest(c):
  k=nodes[c['toNode']]['kind'];t=c['toNode']
  if t.startswith('ht-'):return 1
  if k=='coastal-outlet' or t.endswith('-out'):return 2
  return 3
 pts=np.vstack([np.array(c['points'])[:,[0,2]] for c in chans]);lab=np.concatenate([[chan_dest(c)]*len(c['points']) for c in chans])
 tree=cKDTree(pts);wet_t=np.isfinite(wl)&(th>0)
 ux,uz=-3000.+4*ti[wet_t],4000.-4*tj[wet_t];dd,ii=tree.query(np.c_[ux,uz])
 lake=np.abs(wl[wet_t]-360)<.01
 code[wet_t]=np.where(dd<=24,lab[ii],np.where(lake,1,3))
 # High Tarn lake cells themselves
 code[wet_t]=np.where((dd>24)&lake,1,code[wet_t]);return code
def write_json(name,obj):(DATA/name).write_text(json.dumps(obj,indent=1,ensure_ascii=False)+'\n')
def r(v,n=1):return round(float(v),n)
