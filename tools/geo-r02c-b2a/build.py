"""GEO-R02C-B2a North massif candidate: the B1.1 massif (same generator, explicit authored end caps) with the four geographic corrections
of the B2a design master (tools/geo-r02c-b2a/design/north-massif-b2a.json):
  D1 coastal / corridor terminal profiles, D2 Western Col (south-east arm start cap, col level, plateau start),
  D3 primary approach + optional summit scramble with modelled trail benches, D4 natural outlet for the tarn-rim hollow.
  python3 tools/geo-r02c-b2a/build.py [--repeat 2]
Outputs public/geo-r02c-b2a/{manifest.json,a.patch.f32,routes.json} and tools/geo-r02c-b2a/.cache/a.npz (git-ignored).
The canonical R1 files and the B1.1 reference (public/geo-r02c-b01, tools/geo-r02c-b01) are only read."""
from pathlib import Path
import argparse,hashlib,json,sys
import numpy as np
from scipy.ndimage import distance_transform_edt
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(ROOT/'tools/geo-r02c/lib')]
from massif import build_body,smoothstep,epsilon_fill  # noqa: E402
from b2a import terminal_factor,carve_outlet,apply_bench  # noqa: E402
from route import route_b2a,walk_test,hiking_grades,bilinear  # noqa: E402
NX,NZ,CELL=1501,2001,4.;R1_SHA='fc8fd6da0472bc3eda7dd9d1f2f8f9bfd15b2bb55998db1333cbd6256b1f946a';B11_SHA='86e89c1e955ef44b252111d87cfce1194eae55efac479bb1a3b069966ce7323d'
DESIGN=HERE/'design/north-massif-b2a.json';OUT=ROOT/'public/geo-r02c-b2a';CACHE=HERE/'.cache'
sha=lambda b:hashlib.sha256(b).hexdigest()

def poly_mask(poly,X,Z):
 from shapely import contains_xy;from shapely.geometry import Polygon
 return contains_xy(Polygon(poly),X,Z)
def line_dist(pts,X,Z):
 from shapely import distance,points;from shapely.geometry import LineString
 return distance(LineString(pts),points(np.c_[X.ravel(),Z.ravel()])).reshape(X.shape)

def weights(design,R1,WS,features,J,I,X,Z):
 sa=design['studyArea'];inside=poly_mask(sa['polygon'],X,Z)
 din=distance_transform_edt(inside)*CELL;w=smoothstep(din/sa['featherM']);core=smoothstep(din/design['base']['coreDistanceM'])
 land=R1>0;dcoast=(distance_transform_edt(land)*CELL)[J,I]
 w*=smoothstep((dcoast-sa['coastFreezeM'])/sa['coastFeatherM']);a,b=design['base']['coastTaperM'];coast_taper=smoothstep((dcoast-a)/(b-a))
 prot={p['id']:p for p in sa['protected']};lake=next(l for l in features['lakes'] if l['id']=='high-tarn')
 inl=poly_mask(lake['boundary'],X,Z);dl=distance_transform_edt(~inl)*CELL;p=prot['high-tarn'];w*=smoothstep((dl-p['bufferM'])/p['featherM'])
 dg=None
 for cid in ('tarn-inlet-w','windward-gully'):
  c=next(c for c in features['channels'] if c['id']==cid);p=prot[cid];d=line_dist(np.array(c['points'])[:,[0,2]],X,Z);w*=smoothstep((d-p['bufferM'])/p['featherM'])
  if cid=='windward-gully':dg=d
 p=prot['routes-outside']
 for r in features['routes']:
  if r['id']=='peak-ascent':continue
  d=line_dist(r['points2'],X,Z);w*=smoothstep((d-p['bufferM'])/p['featherM'])
 wet=np.isfinite(WS[J,I]);w[wet]=0.;w[~land[J,I]]=0.
 return w,core*coast_taper,inside,dcoast,dg

def condition(sub,es,WS_sub):
 seed=~es|(sub<=0)|np.isfinite(WS_sub);Fs=epsilon_fill(sub.astype(np.float32).astype(float),seed);return np.where(es,Fs,sub),np.where(es,Fs-sub,0.)

def compose(design):
 R1=np.fromfile(ROOT/'public/geo-r02b/terrain.f32','<f4').reshape(NZ,NX);WS=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX)
 features=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
 poly=np.array(design['studyArea']['polygon'],float);pad=8
 i0=int((poly[:,0].min()+3000)//CELL)-pad;i1=int((poly[:,0].max()+3000)//CELL)+pad;j0=int((4000-poly[:,1].max())//CELL)-pad;j1=int((4000-poly[:,1].min())//CELL)+pad
 J=slice(j0,j1+1);I=slice(i0,i1+1);jj,ii=np.meshgrid(np.arange(j0,j1+1),np.arange(i0,i1+1),indexing='ij');X=ii*CELL-3000.;Z=4000.-jj*CELL
 w,core,inside,dcoast,dgully=weights(design,R1.astype(float),WS,features,J,I,X,Z)
 R1s=R1[J,I].astype(float);Hn,body,base,parts=build_body(design,R1s,X,Z,core,np.ones_like(core),base_seed=(w<=0)|(R1s<=0)|np.isfinite(WS[J,I]))
 stages={}
 # D1: authored terminal profiles before the frozen coast band and the protected windward-gully corridor
 T,Lterm=terminal_factor(design,X,Z,dcoast,dgully);HnT=R1s+T*(Hn-R1s);stages['D1']={'cellsTapered':int(((T<0.999)&(w>0)).sum()),'maxHeightChangeVsUntaperedM':round(float(np.abs(HnT-Hn)[w>0].max()),1)}
 sub=R1s+w*(HnT-R1s);es=w>0
 # D4: natural outlets for declared hollows (on the blended surface, before conditioning)
 outlets=[]
 for o in design.get('outlets',[]):
  sub,rep=carve_outlet(sub,X,Z,w,(w<=0)|(sub<=0)|np.isfinite(WS[J,I]),o);rep['id']=o['id'];outlets.append(rep)
 stages['D4']=outlets
 sub,dep=condition(sub,es,WS[J,I])
 H=R1.astype(float).copy();H[J,I]=sub;edit=np.zeros(H.shape,bool);edit[J,I]=es;H32=H.astype(np.float32);H32[~edit]=R1[~edit];ctx=dict(edit=edit,J=J,I=I,X=X,Z=Z,w=w,core=core,inside=inside,Hn=Hn,HnT=HnT,T=T,Lterm=Lterm,body=body,base=base,parts=parts,
  fill=dep,features=features,WS=WS,stages=stages,R1=R1)
 return R1,H32,ctx

def finish(R1,H32,ctx,design):
 """D3: route search on the conditioned surface, trail benches, final conditioning, verification."""
 rt=route_b2a(H32,ctx,design)
 if 'primary' not in rt:return H32,{'status':rt.get('status')}
 J,I,X,Z,w=ctx['J'],ctx['I'],ctx['X'],ctx['Z'],ctx['w'];H=H32.astype(float);bench=[];cfg=design['route']['bench'];k=rt['sharedWithR1Points']-1
 P=np.r_[rt['primary'][k:],rt['scramble'][1:]]  # one continuous bench: primary new section + scramble (no conflict at the viewpoint)
 sub=H[J,I];Hb,rep=apply_bench(sub,X,Z,w,P,cfg,lambda x,z:bilinear(H,x,z));H[J,I]=Hb;rep['route']='primary new section + scramble';bench.append(rep)
 es=w>0;sub,dep2=condition(H[J,I],es,ctx['WS'][J,I]);H[J,I]=sub;H32=H.astype(np.float32);H32[~ctx['edit']]=R1[~ctx['edit']]  # exact R1 outside the editable cells
 # the routes are planned again on the final (benched, conditioned) surface, so every grade and step check is on the terrain that is walked
 rt2=route_b2a(H32,ctx,design)
 if 'primary' not in rt2:return H32,{'status':'after bench: '+str(rt2.get('status'))}
 rt=rt2;prim,scr=rt['primary'],rt['scramble']
 # (A regraded, modelled tread was tried and removed: on the 4 m grid, nodes between two close switchback legs receive two target heights
 # and block the walk. Exact grades come instead from routing along rendered triangle edges, where the surface is linear.)
 Hf=H32.astype(float)
 def stats(P):
  g,_=hiking_grades(Hf,P);return {'lengthM':int(len(P)),'walkTestBlockedAt':int(walk_test(Hf,P)),'hikingGrade10mMax':round(float(g.max()),3),'p95':round(float(np.percentile(g,95)),3),'over030M':int((g>0.30).sum())}
 ctx['stages']['D3']={'bench':bench,'postBenchFillCells':int((dep2>0.05).sum()),'primary':stats(prim),'scramble':stats(scr)}
 routes={'routes':[{'id':'peak-ascent','replaces':'peak-ascent','role':'primary hiking approach to the Vestfjell shoulder viewpoint','points2':[[round(float(x),2),round(float(z),2)] for x,z in prim]},
  {'id':'peak-scramble','adds':True,'role':'optional alpine summit scramble (viewpoint to North Peak)','targetMaxGrade':0.5,'points2':[[round(float(x),2),round(float(z),2)] for x,z in scr]}],
  'report':{'sharedWithR1Points':rt['sharedWithR1Points'],'viewpointXZ':rt['viewpointXZ'],'viewpointM':rt['viewpointM'],'declaredViewpointXZ':design['route']['viewpointXZ'],**ctx['stages']['D3']}}
 return H32,routes

def write(R1,H,ctx,design,routes):
 OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(exist_ok=True)
 ch=np.nonzero(H!=R1);j0,j1,i0,i1=ch[0].min(),ch[0].max(),ch[1].min(),ch[1].max();block=np.ascontiguousarray(H[j0:j1+1,i0:i1+1]).astype('<f4')
 (OUT/'a.patch.f32').write_bytes(block.tobytes());tsha=sha(H.astype('<f4').tobytes());d=(H.astype(float)-R1.astype(float))
 entry={'id':'a','label':'B2a · North massif geographic integration','design':'tools/geo-r02c-b2a/design/north-massif-b2a.json','designSha256':sha(DESIGN.read_bytes()),'baseTerrainSha256':R1_SHA,
  'referenceTerrainSha256':B11_SHA,'terrainSha256':tsha,'changedCells':int(len(ch[0])),'patch':{'file':'a.patch.f32','rows':[int(j0),int(j1)],'cols':[int(i0),int(i1)],'sha256':sha(block.tobytes()),'bytes':int(block.nbytes)},
  'stats':{'maxRaiseM':round(float(d.max()),2),'maxLoweringM':round(float(-d.min()),2),'changedHa':round(len(ch[0])*16/1e4,2),'summitM':round(float(H.max()),2),
   'summitXZ':[float(np.unravel_index(H.argmax(),H.shape)[1]*4-3000),float(4000-np.unravel_index(H.argmax(),H.shape)[0]*4)]},'stages':{k:v for k,v in ctx['stages'].items() if k!='D3'},
  'routes':'routes.json','status':'experimental B2a candidate; not approved; R1 and B1.1 unchanged'}
 m0={'id':'m0','label':'B2a M0 · canonical R1 (empty variant)','baseTerrainSha256':R1_SHA,'terrainSha256':R1_SHA,'changedCells':0,'patch':None}
 (OUT/'manifest.json').write_text(json.dumps({'schema':'aurora-terrain-variants/1','family':'b2a','baseTerrainSha256':R1_SHA,'variants':{'m0':m0,'a':entry}},indent=1)+'\n')
 (OUT/'routes.json').write_text(json.dumps(routes,indent=0)+'\n')
 np.savez_compressed(CACHE/'a.npz',H=H,**{k:ctx[k] for k in ('w','core','inside','Hn','HnT','T','Lterm','fill')},J=[ctx['J'].start,ctx['J'].stop],I=[ctx['I'].start,ctx['I'].stop])
 return entry

if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--repeat',type=int,default=1);args=a.parse_args();design=json.loads(DESIGN.read_text());shas=[]
 for _ in range(args.repeat):
  R1,H,ctx=compose(design);H,routes=finish(R1,H,ctx,design)
  if 'routes' not in routes:print(json.dumps(routes));sys.exit(2)
  e=write(R1,H,ctx,design,routes);shas.append(e['terrainSha256'])
 assert len(set(shas))==1,'non-deterministic output';e['deterministicRuns']=len(shas);print(json.dumps(e,indent=0));print(json.dumps(routes['report'],indent=0))
