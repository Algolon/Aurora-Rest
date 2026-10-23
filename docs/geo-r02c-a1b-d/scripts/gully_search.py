"""MEASURED: candidate reaches for a corrected G1 gully. For every R1 channel inside window v2, every 8 m: bed height, the frozen
wet-section edge on each side (R1 'wet' constraint), side relief (highest ground 25-110 m out minus bed), 'cut room' (how far the
ground 4-44 m beyond the wet edge could be lowered while still falling >= 5 % toward the channel), the A1a protection of the wall
zone, and terrain-only visibility of the walls from the 12 player viewpoints. Output: data/gully_search.json"""
from b_common import *
from shapely.geometry import Polygon,Point
from shapely import contains_xy
C=np.load(ROOT/'tools/geo-r02c-a1a/.cache/r1-constraints-4m.npz');WET=C['wet'];VAL=C['valleyhit'];LAKE=C['lakehit'];SD=C['sd']
WIN=Polygon(json.loads((ROOT/'docs/geo-r02c-a1d/data/window-v2-proposed.json').read_text())['polygon'])
vis=json.loads((DATA/'visibility.json').read_text());VPS={k:v['xz'] for k,v in vis['viewpoints'].items()}
GRP={'far':['birchwood','valley-shoulder','central-valley'],'tarn':['tarn-overlook','high-tarn','tarn-shore'],'route':[k for k in VPS if k.startswith('route-')]}
R=r1();m=mask('v1')
def g(A,x,z):
 j=np.clip(np.rint((4000-np.asarray(z))/4).astype(int),0,NZ-1);i=np.clip(np.rint((np.asarray(x)+3000)/4).astype(int),0,NX-1);return A[j,i]
def los(ox,oz,tx,tz,lift=1.):
 oy=surface(R,[ox],[oz])[0]+1.75;ty=surface(R,tx,tz)+lift;d=np.hypot(tx-ox,tz-oz);n=int(max(2,d.max()/6));s=(np.arange(1,n)/n)[None,:]
 xs=ox+(tx-ox)[:,None]*s;zs=oz+(tz-oz)[:,None]*s;ys=oy+(ty-oy)[:,None]*s;return ~(surface(R,xs.ravel(),zs.ravel()).reshape(xs.shape)>ys+.05).any(axis=1)
def prot(x,z):
 lab,M=classify(x,z);return np.array([l in ('zone','lake','corridor','sea','otherEquality','outside window') for l in lab])
out={'method':__doc__.strip(),'channels':{}}
for ch in features()['channels']:
 P=np.array(ch['points'])[:,[0,2]]
 if not contains_xy(WIN,P[:,0],P[:,1]).any():continue
 s=arclen(P);S=np.arange(0,s[-1],8.);X=np.interp(S,s,P[:,0]);Z=np.interp(S,s,P[:,1]);inw=contains_xy(WIN,X,Z)
 rows=[]
 for k in range(len(S)):
  t=np.array([X[min(k+1,len(S)-1)]-X[max(k-1,0)],Z[min(k+1,len(S)-1)]-Z[max(k-1,0)]]);t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])
  d=np.arange(-160,161,4.);px=X[k]+d*n[0];pz=Z[k]+d*n[1];h=surface(R,px,pz);bed=surface(R,[X[k]],[Z[k]])[0];wet=g(WET,px,pz);val=g(VAL,px,pz)
  side={}
  for sg,name in ((-1,'left'),(1,'right')):
   dd=d*sg;sel=dd>=0;ds=dd[sel];hs=h[sel];ws=wet[sel];vs_=val[sel]
   o=np.argsort(ds);ds,hs,ws,vs_=ds[o],hs[o],ws[o],vs_[o]
   we=ds[np.argmax(~ws)] if (~ws).any() else 160.;ve=ds[np.argmax(~vs_)] if (~vs_).any() else 160.
   hwe=np.interp(we,ds,hs);far=(ds>=25)&(ds<=110);rel=float(hs[far].max()-bed)
   cz=(ds>=we+4)&(ds<=we+44);floor=hwe+.05*(ds[cz]-we);cut=float(np.mean(np.maximum(0,hs[cz]-floor))) if cz.any() else 0.
   side[name]={'wetEdgeM':float(we),'valleyBandEdgeM':float(ve),'reliefM':rel,'cutRoomM':cut}
  wx=X[k]+np.array([-40,40])*n[0];wz=Z[k]+np.array([-40,40])*n[1]
  rows.append({'s':float(S[k]),'x':float(X[k]),'z':float(Z[k]),'bed':float(bed),'inWindow':bool(inw[k]),'coastDistM':float(g(SD,X[k],Z[k])),
   'lake':bool(g(LAKE,X[k],Z[k])),'wallProtected':bool(prot(wx,wz).any()),**{f'{a}_{b}':v for a,dct in side.items() for b,v in dct.items()}})
 # visibility of walls every 24 m
 sel=list(range(0,len(rows),3));vx=[];vz=[]
 for k in sel:
  t=np.array([X[min(k+1,len(S)-1)]-X[max(k-1,0)],Z[min(k+1,len(S)-1)]-Z[max(k-1,0)]]);t/=np.linalg.norm(t);n=np.array([-t[1],t[0]])
  for o in (-35,35):vx.append(X[k]+o*n[0]);vz.append(Z[k]+o*n[1])
 vx=np.array(vx);vz=np.array(vz);V={gname:np.zeros(len(vx),bool) for gname in GRP}
 for gname,ids in GRP.items():
  for vid in ids:V[gname]|=los(*VPS[vid],vx,vz)
 for q,k in enumerate(sel):
  for gname in GRP:rows[k]['vis_'+gname]=bool(V[gname][2*q]|V[gname][2*q+1])
 for k in range(len(rows)):
  kk=sel[min(range(len(sel)),key=lambda q:abs(sel[q]-k))]
  for gname in GRP:rows[k]['vis_'+gname]=rows[kk]['vis_'+gname]
 # reaches: contiguous samples with one-side (hillside) relief >= 25 m, walls unprotected, in window, not lake, >= 300 m from coast
 ok=np.array([q['inWindow'] and not q['lake'] and not q['wallProtected'] and q['coastDistM']>300 and max(q['left_reliefM'],q['right_reliefM'])>=25 for q in rows])
 reaches=[];k=0
 while k<len(ok):
  if ok[k]:
   e=k
   while e+1<len(ok) and ok[e+1]:e+=1
   if (e-k)*8>=120:
    R_=rows[k:e+1];reaches.append({'sM':[r(R_[0]['s']),r(R_[-1]['s'])],'lengthM':r((e-k)*8),'from':[r(R_[0]['x']),r(R_[0]['z'])],'to':[r(R_[-1]['x']),r(R_[-1]['z'])],
     'bedM':[r(R_[0]['bed']),r(R_[-1]['bed'])],'gradientPct':r(100*(R_[0]['bed']-R_[-1]['bed'])/max(8,(e-k)*8)),
     'reliefMinMedianM':[r(np.median([q['left_reliefM'] for q in R_])),r(np.median([q['right_reliefM'] for q in R_]))],
     'cutRoomMedianM':[r(np.median([q['left_cutRoomM'] for q in R_])),r(np.median([q['right_cutRoomM'] for q in R_]))],
     'wetEdgeMedianM':[r(np.median([q['left_wetEdgeM'] for q in R_])),r(np.median([q['right_wetEdgeM'] for q in R_]))],
     'valleyBandMedianM':[r(np.median([q['left_valleyBandEdgeM'] for q in R_])),r(np.median([q['right_valleyBandEdgeM'] for q in R_]))],
     'visiblePct':{gname:r(100*np.mean([q['vis_'+gname] for q in R_])) for gname in GRP}})
   k=e+1
  else:k+=1
 G1=[q for q in rows if 0.35*s[-1]<=q['s']<=0.65*s[-1]] if ch['id']=='tarn-inlet-w' else None
 out['channels'][ch['id']]={'lengthM':r(s[-1]),'samplesInWindow':int(inw.sum()),'reaches':reaches,
  'summary':{'reliefMedianM':[r(np.median([q['left_reliefM'] for q in rows if q['inWindow']])),r(np.median([q['right_reliefM'] for q in rows if q['inWindow']]))]},
  **({'a1aG1Reach':{'reliefMedianM':[r(np.median([q['left_reliefM'] for q in G1])),r(np.median([q['right_reliefM'] for q in G1]))],
    'cutRoomMedianM':[r(np.median([q['left_cutRoomM'] for q in G1])),r(np.median([q['right_cutRoomM'] for q in G1]))],
    'wallProtectedPct':r(100*np.mean([q['wallProtected'] for q in G1])),'visiblePct':{gname:r(100*np.mean([q['vis_'+gname] for q in G1])) for gname in GRP}}} if G1 else {}),
  'samples':[{k:(r(v,2) if isinstance(v,float) else v) for k,v in q.items()} for q in rows[::2]]}
 o=out['channels'][ch['id']];print(ch['id'],o['lengthM'],o['samplesInWindow'],o['summary'],o.get('a1aG1Reach'))
 for q in reaches:print('   reach',q)
dump('gully_search.json',out)
