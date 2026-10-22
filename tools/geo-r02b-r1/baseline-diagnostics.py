"""Consolidate exact original failure locations from preserved checkpoint 7438e6a.
This is a post-correction consolidation of baseline evidence, not a claim that
these added tables were exported before the R1 edits.
"""
from pathlib import Path
import os,sys,subprocess,json,hashlib
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from shapely.geometry import Polygon
from shapely import contains_xy
R=Path(__file__).resolve().parents[2];D=R/'docs/geo-r02b-r1';raw=subprocess.check_output(['git','show','7438e6a:public/geo-r02b/terrain.f32'],cwd=R);assert hashlib.sha256(raw).hexdigest()=='0e2788a52066463881d346dda4c7018b2155208c82916c5552e1824215fec462';H=np.frombuffer(raw,dtype='<f4').reshape(2001,1501);f=json.loads((D/'baseline-features.json').read_text());old=json.loads((R/'docs/geo-r02b/terrain-validation.json').read_text())
def sample(q,step=4):
 gx=np.clip((q[:,0]+3000)/step,0,6000/step-1e-8);gz=np.clip((4000-q[:,1])/step,0,8000/step-1e-8);i=gx.astype(int);j=gz.astype(int);u=gx-i;v=gz-j;k=step//4;a=H[j*k,i*k];b=H[(j+1)*k,i*k];c=H[j*k,(i+1)*k];d=H[(j+1)*k,(i+1)*k];return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))
banks=[];water_checks=[]
for c in f['channels']:
 p=np.array(c['points']);q=p[:,[0,2]];t=np.gradient(q,axis=0);n=np.column_stack([-t[:,1],t[:,0]]);n/=np.linalg.norm(n,axis=1)[:,None];w=np.array(c['widthsM'])/2+12;qq=np.concatenate([q+n*w[:,None],q-n*w[:,None]]);expected=np.tile(p[:,1],2);hh=sample(qq);eligible=np.ones(len(qq),bool)
 for l in f['lakes']:eligible&=~contains_xy(Polygon(l['boundary']),qq[:,0],qq[:,1])
 for other in f['channels']:
  if other['id']==c['id']:continue
  pp=np.array(other['points']);dd,ii=cKDTree(pp[:,[0,2]]).query(qq);eligible&=dd>np.array(other['widthsM'])[ii]/2+4
 for k in [0,len(p)]:eligible[k:k+15]=False;eligible[k+len(p)-15:k+len(p)]=False
 for k in np.where((hh<expected-.25)&eligible)[0]:banks.append({'channel':c['id'],'xz':qq[k].round(3).tolist(),'referenceWaterM':float(expected[k]),'terrainM':float(hh[k]),'deficitM':float(expected[k]-hh[k])})
 for step in [4,16]:
  count=0;maximum=0.;total=0
  for frac in [-.75,-.25,.25,.75]:
   qq=q+n*(np.array(c['widthsM'])/2*frac)[:,None];difference=sample(qq,step)-p[:,1];count+=int((difference>.05).sum());maximum=max(maximum,float(difference.max()));total+=len(qq)
  water_checks.append({'channel':c['id'],'meshStepM':step,'interiorWidthProbes':total,'terrainAboveWaterCount':count,'maxExposureM':maximum})
assert len(banks)==81
route_failures=[]
causes={'hero':'Largest spike is a Central Valley nearest-station jump across a broad concave axis bend (not the M1 deck). Separate M1 wet/deck-entry conflicts also exist. Shared field removes the valley discontinuity; ramps and route alignment resolve the crossing.','tarn-ascent':'Upper-glen and ridge flank transition; use a contour-following approach after joint terrain construction.','peak-ascent':'Compact maximum-union mountain flanks and drawn zigzags cross steep fall lines; preserve summit, search actual contours.','hidden-loop':'Oblique H1/H2 deck entry and gorge/basin flank transitions; align approaches and connect the actual outlet floor.','west-cape-spur':'Short woodland/headland flank grade; reposition onto a contour shoulder without flattening the cape.','south-shoulder-loop':'Uniform compact flank crossed directly on the lower massif; connect the massif and follow shoulders.'}
for route in f['routes']:
 q=np.array(route['points2']);height=sample(q)
 for deck in old['crossings']:
  a=np.array(deck['a']);b=np.array(deck['b']);dv=b-a;t=np.sum((q-a)*dv,axis=1)/(dv@dv);dist=np.linalg.norm(q-a-t[:,None]*dv,axis=1);hit=(t>=0)&(t<=1)&(dist<1.75);height=np.where(hit,np.maximum(height,deck['levelM']),height)
 ds=np.linalg.norm(np.diff(q,axis=0),axis=1);grade=np.abs(np.diff(height))/np.maximum(1e-8,ds);k=int(np.argmax(grade));reference=next(r for r in old['routes'] if r['id']==route['id']);assert abs(grade[k]-reference['maxMeasuredTriangleGrade'])<.001
 route_failures.append({'id':route['id'],'maximumFailureStartXZ':q[k].tolist(),'maximumFailureEndXZ':q[k+1].tolist(),'oldContactHeightsM':[float(height[k]),float(height[k+1])],'oldMaxGrade':float(grade[k]),'expectedMaxGrade':route['targetMaxGrade'],'oldWetSampleCount':reference['submergedSamples'],'diagnosisAndCorrection':causes[route['id']],'adjacentTerrainEffects':'Route search changes intermediate path positions; shared field changes ridge/valley transitions. No hiking operation changes terrain elevation. Exact departures and full-width conflicts are reported separately.'})
result={'baseline':'7438e6a','terrainSha256':hashlib.sha256(raw).hexdigest(),'measurementTiming':'Post-correction consolidation from immutable baseline; original causal stage analysis was performed before implementation.','originalLowBankCount':len(banks),'originalLowBankLocations':banks,'originalWettedMeshResolutionChecks':water_checks,'originalRouteFailures':route_failures};(D/'baseline-failure-locations.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'banks':len(banks),'routes':route_failures,'exposedWidthProbes4m':sum(r['terrainAboveWaterCount'] for r in water_checks if r['meshStepM']==4),'exposedWidthProbes16m':sum(r['terrainAboveWaterCount'] for r in water_checks if r['meshStepM']==16)},indent=2))
