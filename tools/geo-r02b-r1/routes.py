"""Search dry grade-limited alternatives. Never modifies the elevation field.
Original destinations retained; original reservations tried before expansion.
Crossings use explicitly exported decks and ramps, not water exemptions.
"""
from pathlib import Path
import os,sys,json,math,heapq,argparse
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from shapely import contains_xy
from shapely.geometry import Polygon
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2]);p.add_argument('--output',type=Path);args=p.parse_args();ROOT=args.root;OUT=args.output or ROOT/'public/geo-r02b';DOC=args.output or ROOT/'docs/geo-r02b-r1'
f=json.loads((OUT/'features.json').read_text());H=np.fromfile(OUT/'terrain.f32',dtype='<f4').reshape(2001,1501);W=np.fromfile(OUT/'water-surface.f32',dtype='<f4').reshape(2001,1501);m=json.loads((ROOT/'docs/geo-r02b/design-master-A-R1-v1.json').read_text())
def surface(q,field=H):
 q=np.asarray(q);gx=np.clip((q[...,0]+3000)/4,0,1499.99999);gy=np.clip((4000-q[...,1])/4,0,1999.99999);i=gx.astype(int);j=gy.astype(int);u=gx-i;v=gy-j;a=field[j,i];b=field[j+1,i];c=field[j,i+1];d=field[j+1,i+1];return np.where(u+v<=1,a+(c-a)*u+(b-a)*v,d+(b-d)*(1-u)+(c-d)*(1-v))
channels=[(c,np.array(c['points']),cKDTree(np.array(c['points'])[:,[0,2]])) for c in f['channels']]
lakes=[(l,Polygon(l['boundary'])) for l in f['lakes']]
def dry(q,margin=1.8):
 water=surface(q,W);water=np.where(np.isfinite(water),np.maximum(0,water),0);ok=surface(q)>water+.15
 for l,poly in lakes:ok&=~contains_xy(poly.buffer(margin),q[:,0],q[:,1])
 for c,p,tree in channels:
  d,k=tree.query(q);ok&=d>np.array(c['widthsM'])[k]/2+margin
 return ok
# Deck surface is a flat clear span with 18 m tapered approaches to the actual
# bank height. Ramps are diagnostic crossing geometry, not terrain edits.
decks=[]
for c in f['crossings']:
 stream,points,tree=next(t for t in channels if t[0]['id']==c['channelId']);q=np.array(c['position2']);_,near=tree.query(q);a=points[max(0,near-2)];b=points[min(len(points)-1,near+2)];direction=np.array([-(b[2]-a[2]),b[0]-a[0]]);direction/=np.linalg.norm(direction);half=stream['widthsM'][near]/2+12;A=q-direction*(half+18);B=q+direction*(half+18);level=max(points[near,1]+1.1,float(surface(q-direction*half))+.15,float(surface(q+direction*half))+.15)
 decks.append({'id':c['id'],'a':A.tolist(),'b':B.tolist(),'levelM':level,'waterLevelM':float(points[near,1]),'halfWidthM':1.75,'rampM':18,'endLevelsM':[float(surface(A)),float(surface(B))],'lengthM':float(2*(half+18)),'maxRampGrade':max(abs(level-float(surface(A))),abs(level-float(surface(B))))/18})
f['decks']=decks

def contact(q):
 h=surface(q);on=np.zeros(len(q),bool)
 for d in decks:
  A=np.array(d['a']);B=np.array(d['b']);v=B-A;length=np.linalg.norm(v);t=np.sum((q-A)*v,axis=1)/(v@v);dist=np.linalg.norm(q-A-t[:,None]*v,axis=1);hit=(t>=0)&(t<=1)&(dist<=d['halfWidthM']);along=t*length;dh=np.interp(along,[0,18,length-18,length],[*d['endLevelsM'][:1],d['levelM'],d['levelM'],d['endLevelsM'][1]]);h=np.where(hit,np.maximum(h,dh),h);on|=hit
 return h,on

def sample_line(a,b,step=1.):
 return np.linspace(a,b,max(2,int(np.ceil(np.linalg.norm(np.array(b)-a)/step))+1))
def feasible(a,b,limit,margin=1.8):
 q=sample_line(a,b,1.5);h,on=contact(q);return bool(np.all(dry(q,margin)|on) and np.max(np.abs(np.diff(h))/np.maximum(1e-8,np.linalg.norm(np.diff(q,axis=0),axis=1)))<=limit+1e-6)

def search(start,end,guide,radius,limit):
 cell=8.;xmin=max(-2992,math.floor((guide[:,0].min()-radius)/cell)*cell);xmax=min(2992,math.ceil((guide[:,0].max()+radius)/cell)*cell);zmin=max(-3992,math.floor((guide[:,1].min()-radius)/cell)*cell);zmax=min(3992,math.ceil((guide[:,1].max()+radius)/cell)*cell)
 xx,zz=np.meshgrid(np.arange(xmin,xmax+1,cell),np.arange(zmin,zmax+1,cell));nr,nc=xx.shape;q=np.column_stack([xx.ravel(),zz.ravel()]);dguide=cKDTree(guide).query(q)[0];ok=(dguide<=radius)&dry(q);h=surface(q);indices=np.where(ok)[0];tree=cKDTree(q[indices]);_,ns=tree.query(start,k=min(30,len(indices)));_,ne=tree.query(end,k=min(30,len(indices)));starts=[int(indices[i]) for i in np.atleast_1d(ns) if feasible(start,q[indices[i]],limit)];ends={int(indices[i]) for i in np.atleast_1d(ne) if feasible(q[indices[i]],end,limit)}
 if not starts or not ends:return None
 offsets=[(a,b) for a in range(-3,4) for b in range(-3,4) if (a or b) and math.gcd(abs(a),abs(b))==1 and a*a+b*b<=13];dist=np.full(len(q),np.inf);parent=np.full(len(q),-1,int);queue=[];target=np.array(end)
 for k in starts:dist[k]=np.linalg.norm(q[k]-start);heapq.heappush(queue,(dist[k]+np.linalg.norm(q[k]-target),k))
 closed=np.zeros(len(q),bool);cache={};found=None
 while queue:
  _,k=heapq.heappop(queue)
  if closed[k]:continue
  if k in ends:found=k;break
  closed[k]=True;j,i=divmod(k,nc)
  for dj,di in offsets:
   jj=j+dj;ii=i+di
   if not 0<=jj<nr or not 0<=ii<nc:continue
   n=jj*nc+ii
   if closed[n] or not ok[n]:continue
   length=cell*math.hypot(dj,di);grade=abs(h[n]-h[k])/length
   if grade>limit:continue
   cost=dist[k]+length*(1+.20*(dguide[n]/max(radius,1))**2+1.5*grade**2)
   if cost>=dist[n]:continue
   key=(min(k,n),max(k,n))
   if key not in cache:cache[key]=feasible(q[k],q[n],limit)
   if not cache[key]:continue
   dist[n]=cost;parent[n]=k;heapq.heappush(queue,(cost+np.linalg.norm(q[n]-target),n))
 if found is None:return None
 path=[target];k=found
 while k>=0:path.append(q[k]);k=parent[k]
 path.append(np.array(start));return np.array(path[::-1])

def xz(uv):return np.array([uv[0]*10-3000,4000-uv[1]*10])
reports=[]
# Preserve itinerary landmarks, but intermediate drawing knots remain movable.
important={'hero':[0,10,13,15,18,19],'tarn-ascent':[0,7],'peak-ascent':[0,14],'hidden-loop':[0,3,6,8,10,15],'west-cape-spur':[0,7],'south-shoulder-loop':[0,4,6,10,12]}
for route in f['routes']:
 original=np.array(route.get('originalPoints2',route['points2']));route['originalPoints2']=original.tolist();master=next(r for r in m['walking']['corridors'] if r['id']==route['id']);waypoints=[xz(master['knotsUV'][k]) for k in important[route['id']]]
 # Insert deck ends in itinerary order; keep crossing coordinates unchanged.
 events=[(int(np.argmin(np.linalg.norm(original-q,axis=1))),q,None) for q in waypoints]
 names=['M1'] if route['id']=='hero' else ['H2','H1'] if route['id']=='hidden-loop' else []
 for name in names:
  d=next(x for x in decks if x['id']==name);A=np.array(d['a']);B=np.array(d['b']);ia=int(np.argmin(np.linalg.norm(original-A,axis=1)));ib=int(np.argmin(np.linalg.norm(original-B,axis=1)))
  if ia>ib:A,B=B,A;ia,ib=ib,ia
  events.extend([(ia,A,name+'-a'),(ib,B,name+'-b')])
 events.sort(key=lambda v:v[0]);joined=[];legs=[]
 for (ia,a,na),(ib,b,nb) in zip(events,events[1:]):
  if na and nb and na[:-2]==nb[:-2]:
   path=np.array([a,b]);radius=0;status='crossing' if feasible(a,b,route['targetMaxGrade']) else 'crossing conflict'
  else:
   guide=original[max(0,ia-10):min(len(original),ib+11)];path=None;radius=route['widthM']/2
   for radius in [route['widthM']/2,150.,300.]:
    path=search(a,b,guide,radius,route['targetMaxGrade']*.98)
    if path is not None:break
   status='candidate' if path is not None else 'no feasible dry grade-limited connection in tested 300 m search'
   if path is None:path=np.vstack([a,original[ia:ib+1],b])
  joined.extend(path if not joined else path[1:]);legs.append({'start':a.tolist(),'end':b.tolist(),'searchRadiusM':radius,'status':status})
 # Keep dense polyline; no spline that could cut switchbacks across steep ground.
 dense=[]
 for a,b in zip(joined,joined[1:]):dense.extend(sample_line(np.array(a),np.array(b))[:-1])
 dense.append(joined[-1]);dense=np.array(dense);hh,on=contact(dense);grade=np.abs(np.diff(hh))/np.maximum(1e-8,np.linalg.norm(np.diff(dense,axis=0),axis=1));dryok=dry(dense)|on;departure=cKDTree(original).query(dense)[0]
 route['points2']=np.round(dense,4).tolist();route['candidateStatus']='pass grade and dry centreline; width review separate' if np.all(dryok) and np.max(grade)<=route['targetMaxGrade']+1e-4 else 'design conflict remains';reports.append({'id':route['id'],'status':route['candidateStatus'],'legs':legs,'lengthM':float(np.linalg.norm(np.diff(dense,axis=0),axis=1).sum()),'maximumDepartureM':float(departure.max()),'outsideOriginalReservationFraction':float(np.mean(departure>route['widthM']/2)),'maxGrade':float(grade.max()),'p95Grade':float(np.percentile(grade,95)),'wetSamples':int((~dryok).sum()),'endpointsPreserved':bool(np.linalg.norm(dense[0]-original[0])<.01 and np.linalg.norm(dense[-1]-original[-1])<.01)});print(route['id'],reports[-1]['status'],round(grade.max(),3),flush=True)
f['routeSearch']={'method':'8 m visibility graph, 1.5 m edge tests, 1 m final profiles; original width then 150/300 m search radius; no terrain edits','reports':reports};(OUT/'features.json').write_text(json.dumps(f,separators=(',',':')));(DOC/'route-candidates.json').write_text(json.dumps({'routes':reports,'crossings':decks},indent=2)+'\n')
