"""MEASURED: what protection options would unlock on each viewpoint's North Peak skyline and visible faces.
Re-uses data/visibility.json (skyline samples) and data/viewshed.npz. Options are evaluated by geometry only:
corridor half-width d from the peak-ascent / tarn-ascent centrelines; crest band = R1 crest lower-bound cells (raise-only).
Output: data/editability.json"""
from b_common import *
from shapely.geometry import LineString,Point
from shapely import distance as sdist,points
vis=json.loads((DATA/'visibility.json').read_text());vs=np.load(DATA/'viewshed.npz')
PA=LineString(route('peak-ascent'));TA=LineString(route('tarn-ascent'))
R1=r1();m=mask('v1')
def corr_d(x,z):p=points(np.c_[x,z]);return np.minimum(sdist(PA,p),sdist(TA,p))
def labels(x,z):return classify(x,z)[0]
out={'method':'For each skyline sample (0.5 deg spacing as stored) and each visible massif cell (8 m): its A1a protection label and its '
 'distance to the nearest ascent-route centreline. "Freed by corridor ±d" counts samples whose only protection is the corridor and that lie '
 'farther than d (+ a d/2 fade) from the centreline. Crest samples can only be raised (R1 lower bound).','viewpoints':{}}
gx=vs['gx'].ravel();gz=vs['gz'].ravel();glab=labels(gx,gz);gcd=corr_d(gx,gz)
for vid,v in vis['viewpoints'].items():
 sk=np.array(v['skyline']);x,z=sk[:,1],sk[:,2];lab=labels(x,z);cd=corr_d(x,z);n=len(lab)
 row={'skylineSamples':n,'now':{'editable':r(100*np.mean(lab=='free')),'crestRaiseOnly':r(100*np.mean(lab=='crest')),'corridor':r(100*np.mean(lab=='corridor'))}}
 for d in (35,20,12):row[f'corridor±{d}m']={'freedSkylinePct':r(100*np.mean((lab=='corridor')&(cd>d*1.5))),
   'editableSkylinePct':r(100*np.mean((lab=='free')|((lab=='corridor')&(cd>d*1.5))))}
 vv=vs[vid].ravel();L=glab[vv];C=gcd[vv]
 row['visibleCells']={'free':r(100*np.mean(L=='free')),'corridor':r(100*np.mean(L=='corridor')),'crest':r(100*np.mean(L=='crest')),
   **{f'freedByCorridor±{d}m':r(100*np.mean((L=='corridor')&(C>d*1.5))) for d in (35,20,12)}}
 # where are the free skyline samples? cluster centroids by 150 m bins
 fz=np.c_[x,z][lab=='free'];cl={}
 for p in fz:k=(int(p[0]//150),int(p[1]//150));cl.setdefault(k,[]).append(p)
 row['freeSkylineClusters']=[{'xz':[r(np.mean(np.array(c)[:,0])),r(np.mean(np.array(c)[:,1]))],'samples':len(c)} for c in sorted(cl.values(),key=len,reverse=True)[:4]]
 out['viewpoints'][vid]=row
 print(vid,row['now'],{k:row[k]['editableSkylinePct'] for k in row if k.startswith('corridor±')},'vis',row['visibleCells'],row['freeSkylineClusters'][:3],v['deltaHFor3pxM'])
dump('editability.json',out)
