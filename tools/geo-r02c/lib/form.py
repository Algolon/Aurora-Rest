"""Landform measurements. These are INDICATORS for review, never acceptance targets."""
import numpy as np
from scipy import ndimage
from shapely.geometry import LineString
from common import CELL,NX,NZ,i_of,j_of,surface,x_of,z_of

def curvature_classes(H,mask,smooth_cells=1.5,eps=2e-4,min_slope=.05):
 """Principal-curvature classes on ~12 m smoothed terrain over mask cells with slope > min_slope."""
 Hs=ndimage.gaussian_filter(H,smooth_cells);hz,hx=np.gradient(Hs,CELL);hzz,hzx=np.gradient(hz,CELL);hxz,hxx=np.gradient(hx,CELL)
 lap=hxx+hzz;disc=np.sqrt(((hxx-hzz)/2)**2+hxz**2);k1=lap/2+disc;k2=lap/2-disc;slope=np.hypot(hx,hz)
 sel=mask&(slope>min_slope);n=int(sel.sum())
 cls={'convex':(k1<-eps)&(k2<-eps),'concave':(k1>eps)&(k2>eps),'saddle':(k1>eps)&(k2<-eps),'planar':(np.abs(k1)<eps)&(np.abs(k2)<eps)}
 out={k:round(100*float((v&sel).sum())/max(1,n),2) for k,v in cls.items()}
 out['cylindrical']=round(100-sum(out.values()),2);return {'cells':n,'percent':out,'smoothingM':smooth_cells*CELL,'epsilonPerM':eps,'minSlope':min_slope}

def slope_bins(H,mask):
 hz,hx=np.gradient(H,CELL);s=np.hypot(hx,hz)[mask];edges=[0,.05,.15,.3,.45,.7,np.inf]
 return {f'{edges[k]}-{edges[k+1]}':round(100*float(((s>=edges[k])&(s<edges[k+1])).mean()),2) for k in range(len(edges)-1)}

def creases(H,mask,threshold):
 """Clusters where a cell departs from its 8-neighbour mean by more than threshold (slope breaks, knife crests)."""
 k=np.ones((3,3))/8;k[1,1]=0;res=H-ndimage.convolve(H,k,mode='nearest');m=mask&(np.abs(res)>threshold)
 lab,n=ndimage.label(ndimage.binary_dilation(m,iterations=2));return {'thresholdM':threshold,'cells':int(m.sum()),'clusters':int(n),'maxResidualM':float(np.abs(res[mask]).max()) if mask.any() else 0.},res

def transect(H,a,b,step=4.):
 a=np.asarray(a,float);b=np.asarray(b,float);n=max(2,int(np.hypot(*(b-a))/step)+1);t=np.linspace(0,1,n)
 x=a[0]+(b[0]-a[0])*t;z=a[1]+(b[1]-a[1])*t;return {'distanceM':(t*np.hypot(*(b-a))).round(2).tolist(),'heightM':surface(H,x,z).round(3).tolist()}

def ridge_profile(H,points,fractions=np.linspace(.2,.8,9),offsets=(-200,-100,-50,-20,-8,0,8,20,50,100,200)):
 """Mean height relative to crest along crest normals; left = +normal side of the authored polyline direction."""
 p=np.asarray(points,float);L=LineString(p[:,[0,-1]]) if p.shape[1]==3 else LineString(p);rows=[]
 for f in fractions:
  a=np.array(L.interpolate(f,normalized=True).coords[0]);b=np.array(L.interpolate(min(1,f+.005),normalized=True).coords[0])
  tg=(b-a)/max(1e-9,np.linalg.norm(b-a));n=np.array([-tg[1],tg[0]]);q=a+np.outer(offsets,n)
  h=surface(H,q[:,0],q[:,1]);rows.append(h-surface(H,[a[0]],[a[1]])[0])
 return {'offsetsM':list(offsets),'meanRelativeHeightM':np.mean(rows,axis=0).round(2).tolist()}

def authored_left_world_sign():
 """R1 measures side in planning UV (v points south): side>=0 -> flankWidthLeftM. With world z = 4000-10v that
 UV-left normal is the world RIGHT normal, i.e. negative offsets in ridge_profile. Verified against R1's formula."""
 return -1

def flank_fall(H,points,near=40.,far=240.):
 """Mean fall per metre between near and far offsets, reported in R1's authored left/right convention."""
 prof=ridge_profile(H,points,offsets=(-far,-near,near,far));m=prof['meanRelativeHeightM']
 world_right=(m[1]-m[0])/(far-near);world_left=(m[2]-m[3])/(far-near);s=authored_left_world_sign()
 left,right=(world_right,world_left) if s<0 else (world_left,world_right)
 return {'authoredLeftFallPerM':round(left,3),'authoredRightFallPerM':round(right,3)}
