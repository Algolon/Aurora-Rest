"""D8 drainage destination per cell (measurement): 1 High Tarn, 2 sea, 3 other lake/junction, 0 unresolved.
D8 stops at wet cells; wet channel cells resolve to where their channel ends."""
import json
import numpy as np
from scipy.spatial import cKDTree
from grid import ROOT,NX,NZ
import sys
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from hydro import d8_outlets  # noqa: E402
def destination(H,W,features):
 out=d8_outlets(H,W);tj,ti=np.unravel_index(out,H.shape);wl=W[tj,ti];th=H[tj,ti];code=np.where(th<=0,2,np.where(np.isfinite(wl),3,0))
 chans=features['channels'];lab=np.concatenate([[1 if c['toNode'].startswith('ht-') else 2 if c['toNode'].endswith('-out') else 3]*len(c['points']) for c in chans])
 tree=cKDTree(np.vstack([np.array(c['points'])[:,[0,2]] for c in chans]));wt=np.isfinite(wl)&(th>0)
 dd,ii=tree.query(np.c_[-3000.+4*ti[wt],4000.-4*tj[wt]]);lake=np.abs(wl[wt]-360)<.01;code[wt]=np.where(dd<=24,lab[ii],np.where(lake,1,3));return code
def r1_divides(cache_dir):
 """Cells on a boundary between different R1 drainage destinations (4-neighbourhood), cached."""
 f=cache_dir/'r1-divides.npy'
 if f.exists():return np.load(f)
 R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX).astype(float);W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX).astype(float)
 d=destination(R1,W,json.loads((ROOT/'public/geo-r02b/features.json').read_text()));b=np.zeros(d.shape,bool)
 b[:,1:]|=d[:,1:]!=d[:,:-1];b[:,:-1]|=d[:,1:]!=d[:,:-1];b[1:,:]|=d[1:,:]!=d[:-1,:];b[:-1,:]|=d[1:,:]!=d[:-1,:];b&=R1>0
 np.save(f,b);return b
