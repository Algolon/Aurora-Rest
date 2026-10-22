"""Route measurements on the rendered triangle surface. R1's definitions are reproduced exactly (contact incl. decks,
+/-1.7 m transverse probe); additional tread-width probes are diagnostic proposals, not adopted acceptance criteria."""
import numpy as np
from common import surface

# Proposed (not adopted) route classes from the GEO-R02C plan; tread width in metres.
ROUTE_CLASS={'hero':'lowland-valley','west-cape-spur':'lowland-valley','hidden-loop':'upland-traverse','south-shoulder-loop':'upland-traverse',
 'tarn-ascent':'alpine','peak-ascent':'alpine'}
TREAD={'lowland-valley':3.,'upland-traverse':2.,'alpine':1.5}

def contact(H,f,q):
 q=np.asarray(q,float);h=surface(H,q[:,0],q[:,1]);on=np.zeros(len(q),bool)
 for d in f.get('decks',[]):
  A=np.array(d['a']);B=np.array(d['b']);v=B-A;length=np.linalg.norm(v);t=np.sum((q-A)*v,axis=1)/(v@v);dist=np.linalg.norm(q-A-t[:,None]*v,axis=1)
  hit=(t>=0)&(t<=1)&(dist<=d['halfWidthM']);dh=np.interp(t*length,[0,d['rampM'],length-d['rampM'],length],[d['endLevelsM'][0],d['levelM'],d['levelM'],d['endLevelsM'][1]])
  h=np.where(hit,np.maximum(h,dh),h);on|=hit
 return h,on

def water_at(W,q):
 w=surface(W,q[:,0],q[:,1]);return np.where(np.isfinite(w),np.maximum(0,w),0)

def route_profile(H,W,f,route):
 p=np.array(route['points2'],float);height,on=contact(H,f,p);water=water_at(W,p);ds=np.linalg.norm(np.diff(p,axis=0),axis=1)
 grade=np.abs(np.diff(height))/np.maximum(ds,1e-8);wet=(height<water+.12)&~on
 t=np.gradient(p,axis=0);n=np.column_stack([-t[:,1],t[:,0]]);n/=np.maximum(1e-8,np.linalg.norm(n,axis=1))[:,None]
 def cross(half):
  hl,_=contact(H,f,p+n*half);hr,_=contact(H,f,p-n*half);wl=water_at(W,p+n*half);wr=water_at(W,p-n*half)
  return np.abs(hl-hr)/(2*half),(hl>wl+.12)&(hr>wr+.12)
 c17,dry17=cross(1.7);cls=ROUTE_CLASS.get(route['id'],'unclassified');tread=TREAD.get(cls,2.)
 probes={}
 for half in (.75,1.,1.5):
  c,dry=cross(half);probes[f'+-{half}m']={'p50':float(np.percentile(c,50)),'p90':float(np.percentile(c,90)),'p99':float(np.percentile(c,99)),'max':float(c.max()),
   'fractionOver35pct':float((c>.35).mean()),'dryBandFraction':float(dry.mean())}
 tc,_=cross(tread/2);cut=tc*tread/2
 return {'id':route['id'],'proposedClass':cls,'samples':len(p),'lengthM':float(ds.sum()),'maxGrade':float(grade.max()),'p95Grade':float(np.percentile(grade,95)),
  'targetGrade':route['targetMaxGrade'],'overGradeSamples':int((grade>route['targetMaxGrade']+1e-4).sum()),'wetSamples':int(wet.sum()),
  'r1TransverseProbe':{'halfWidthM':1.7,'maxTransverseGrade':float(c17.max()),'widthAndTransverse35PercentPassFraction':float((dry17&(c17<=.35)).mean()),'dryBandFraction':float(dry17.mean())},
  'treadProbes':probes,'proposedTreadM':tread,'balancedBenchCutM':{'p50':float(np.percentile(cut,50)),'p95':float(np.percentile(cut,95)),'max':float(cut.max()),'fractionOver0_8m':float((cut>.8).mean())},
  '_series':{'height':height,'grade':grade,'wet':wet,'cross17':c17}}
