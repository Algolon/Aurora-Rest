"""A-R1 curve adapter extracted unchanged from GEO-R02B; units UV (10 m)."""
import re
import numpy as np
from shapely.geometry import LineString,Point
def parse_path(d):
 ts=re.findall(r'[MLQCZ]|-?\d+(?:\.\d+)?',d);p=np.zeros(2);out=[];i=0
 while i<len(ts):
  op=ts[i];i+=1
  if op=='Z':break
  n={'M':2,'L':2,'Q':4,'C':6}[op];vals=np.array(list(map(float,ts[i:i+n])));i+=n;q=vals[-2:]
  if op=='M':out.append(q.copy())
  else:
   steps=max(8,int(np.linalg.norm(q-p)*5))
   for t in np.linspace(0,1,steps+1)[1:]:
    a=1-t
    if op=='L':pt=p*a+q*t
    elif op=='Q':pt=a*a*p+2*a*t*vals[:2]+t*t*q
    else:pt=a**3*p+3*a*a*t*vals[:2]+3*a*t*t*vals[2:4]+t**3*q
    if not out or np.linalg.norm(pt-out[-1])>1e-8:out.append(pt)
  p=q.copy()
 return np.array(out)
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def profile(feature,pathkey,knotskey,valueskey):
 pts=parse_path(feature[pathkey]);line=LineString(pts);kp=np.array(feature[knotskey]);kdist=np.array([line.project(Point(p)) for p in kp]);ds=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))]
 values=np.interp(ds,kdist,np.array(feature[valueskey],float));return pts,values,ds,kdist


from scipy.spatial import cKDTree
def projection(points,values,xy):
 """Continuous nearest-segment projection; KD lookup never supplies elevation."""
 _,idx=cKDTree(points).query(xy,workers=2);best=np.full(len(xy),np.inf);value=np.zeros(len(xy));where=np.zeros_like(xy);segment=np.zeros(len(xy),int);fraction=np.zeros(len(xy))
 for offset in [-1,0]:
  k=np.clip(idx+offset,0,len(points)-2);a=points[k];d=points[k+1]-a;t=np.clip(np.sum((xy-a)*d,axis=1)/np.maximum(1e-12,np.sum(d*d,axis=1)),0,1);p=a+d*t[:,None];dist=np.sum((xy-p)**2,axis=1);hit=dist<best
  best=np.minimum(best,dist);value=np.where(hit,values[k]*(1-t)+values[k+1]*t,value);where=np.where(hit[:,None],p,where);segment=np.where(hit,k,segment);fraction=np.where(hit,t,fraction)
 return np.sqrt(best)*10,value,where,segment,fraction
