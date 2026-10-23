"""Projection of world points into the A1a review captures (1280 x 800, 60 deg vertical FOV), reproducing src/geo-r02b/main.ts:
the scene is mirrored in x (scene.scale.x = -1); walk cameras sit at the recorded 'camera' position and look along (yaw, pitch)."""
import numpy as np,json
from b_common import ROOT
W,H,FOV=1280,800,60.
def cam_from_capture(cap):
 c=np.array(cap['camera'],float);yaw=cap['yaw'];pitch=cap['pitch']
 if 'aerial' in cap and cap['aerial']:
  t=np.array(cap['aerial']['target'],float);t=np.array([-t[0],t[1],t[2]])
 else:
  t=c+np.array([-np.sin(yaw)*np.cos(pitch),np.sin(pitch),np.cos(yaw)*np.cos(pitch)])*100
 f=t-c;f/=np.linalg.norm(f);r=np.cross(f,[0,1,0]);r/=np.linalg.norm(r);u=np.cross(r,f);return c,f,r,u
def project(cap,xyz):
 """World (x east, y up, z north) -> pixel (px, py) and depth; NaN behind the camera."""
 c,f,r,u=cam_from_capture(cap);P=np.asarray(xyz,float).reshape(-1,3).copy();P[:,0]*=-1;v=P-c
 d=v@f;t=np.tan(np.radians(FOV/2));xn=(v@r)/d/(t*W/H);yn=(v@u)/d/t
 px=(xn+1)/2*W;py=(1-yn)/2*H;bad=d<=0;px[bad]=np.nan;py[bad]=np.nan;return px,py,d
def capture(variant,mode,view):
 for f in sorted((ROOT/'docs/geo-r02c-a1a/captures').glob(f'capture-manifest-{variant}-*.json')):
  for c in json.loads(f.read_text())['captures']:
   if c['mode']==mode and c['view']==view:return c
 raise KeyError((variant,mode,view))
