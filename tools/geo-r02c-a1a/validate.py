"""GEO-R02C-A1a geographic validation of one composed variant against canonical R1 (measurement only).
Composes the variant from public/geo-r02c-a1a/manifest.json + patch (the same path the viewer uses), then checks:
protected classes unchanged, outside-window bytes unchanged, crest lower bounds, dry sinks (priority flood), wet cells,
drainage destination per cell, trail centrelines, coastline, seam/continuity indicators and design envelopes.
Usage: python3 tools/geo-r02c-a1a/validate.py v2   -> docs/geo-r02c-a1a/validation/v2.json"""
from pathlib import Path
import hashlib,json,sys
import numpy as np
HERE=Path(__file__).resolve().parent;sys.path.insert(0,str(HERE/'lib'));sys.path.insert(0,str(HERE))
from grid import ROOT,J,I,NX,NZ,CELL,load_r1,surface,sub_coords  # noqa: E402
from r1_masks import load as load_constraints  # noqa: E402
sys.path.insert(0,str(ROOT/'tools/geo-r02c/lib'))
from hydro import fill_depth,sink_components,wet_mask  # noqa: E402
from drainage import destination  # noqa: E402
VAR=ROOT/'public/geo-r02c-a1a';DOC=ROOT/'docs/geo-r02c-a1a/validation'

def compose(vid,R1):
 m=json.loads((VAR/'manifest.json').read_text());e=m['variants'][vid];H=R1.copy()
 if e['patch']:
  p=e['patch'];raw=(VAR/p['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==p['sha256']
  (j0,j1),(i0,i1)=p['rows'],p['cols'];H[j0:j1+1,i0:i1+1]=np.frombuffer(raw,'<f4').reshape(j1-j0+1,i1-i0+1)
 sha=hashlib.sha256(H.tobytes()).hexdigest();assert sha==e['terrainSha256'],'composed terrain does not match the manifest';return H,e

def sinks_local(H,W,box):
 j0,j1,i0,i1=box;h=H[j0:j1,i0:i1].astype(float);w=W[j0:j1,i0:i1];wet=wet_mask(h,w);depth=fill_depth(h,(h<=0)|wet)
 return depth,[{'thresholdM':t,'count':len(cs),'components':cs[:10]} for t,a in ((.01,0),(.1,64),(.5,0),(2.,800)) for cs in [sink_components(depth,t,a)]]

def validate(vid):
 R1=load_r1();W=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX).astype(float);H,entry=compose(vid,R1)
 c=load_constraints();features=json.loads((ROOT/'public/geo-r02b/features.json').read_text());cache=np.load(HERE/'.cache'/f'{vid}.npz')
 diff=H!=R1;res={'variant':vid,'label':entry['label'],'terrainSha256':entry['terrainSha256'],'changedCells':int(diff.sum()),'checks':{}};ck=res['checks']
 outside=np.ones(H.shape,bool);outside[J,I]=False;ck['outsideWindowBboxUnchanged']=int(diff[outside].sum())==0
 sub=diff[J,I];prot={k[4:]:cache[k] for k in cache.files if k.startswith('cls_')}
 ck['protectedClassChangedCells']={k:int((sub&v).sum()) for k,v in prot.items()};ck['protectedUnchanged']=all(v==0 for v in ck['protectedClassChangedCells'].values())
 ck['changedOnlyWhereMaskPositive']=int((sub&(cache['M']<=0)).sum())==0
 crest=c['crest'];ck['crestCellsBelowBound']=int((H[crest]<c['target'][crest].astype('<f4')).sum())
 ck['wetCellsChanged']=int((wet_mask(H.astype(float),W)!=wet_mask(R1.astype(float),W)).sum())
 ck['landSeaSignChanged']=int(((H>0)!=(R1>0)).sum())
 sd=c['sd'];ck['coastBand0to150Changed']=int((diff&(sd<150)).sum())
 # trail centrelines: heights along every route vertex
 rt={}
 for r in features['routes']:
  p=np.array(r['points2']);a=surface(H,p[:,0],p[:,1]);b=surface(R1,p[:,0],p[:,1]);rt[r['id']]=float(np.abs(a-b).max())
 ck['routeCentrelineMaxChangeM']=rt
 # dry sinks around the changed region (+300 m margin), R1 vs variant on the same box
 if diff.any():
  jj,ii=np.nonzero(diff);box=(max(0,jj.min()-75),min(NZ,jj.max()+76),max(0,ii.min()-75),min(NX,ii.max()+76))
  d0,s0=sinks_local(R1,W,box);d1,s1=sinks_local(H,W,box)
  ck['sinksBox']={'rows':[int(box[0]),int(box[1])],'cols':[int(box[2]),int(box[3])]};ck['sinksR1']=s0;ck['sinksVariant']=s1
  ck['newDrySinkCells1cm']=int(((d1>.01)&~(d0>.01)).sum());ck['maxNewFillDepthM']=float(np.where(d0>.01,0,d1).max())
 else:ck['newDrySinkCells1cm']=0;ck['maxNewFillDepthM']=0.
 # drainage destination per cell (High Tarn / sea / other)
 d0=destination(R1.astype(float),W,features);d1=destination(H.astype(float),W,features);ch=(d0!=d1)
 trans={}
 for a,b in zip(d0[ch],d1[ch]):trans[f'{int(a)}->{int(b)}']=trans.get(f'{int(a)}->{int(b)}',0)+1
 ck['drainageDestinationChangedCells']=int(ch.sum());ck['drainageTransitions(1=HighTarn,2=sea,3=other)']=trans;ck['drainageChangedHa']=round(ch.sum()*16/1e4,3)
 # continuity / seams inside the window sub-grid
 delta=(H[J,I].astype(float)-R1[J,I].astype(float));gx=np.abs(np.diff(delta,axis=1))/CELL;gz=np.abs(np.diff(delta,axis=0))/CELL
 h=H[J,I].astype(float);sx=np.abs(np.diff(h,axis=1))/CELL;sz=np.abs(np.diff(h,axis=0))/CELL;r=R1[J,I].astype(float);rx=np.abs(np.diff(r,axis=1))/CELL;rz=np.abs(np.diff(r,axis=0))/CELL
 ck['deltaStats']={'minM':float(delta.min()),'maxM':float(delta.max()),'changedHa':round(sub.sum()*16/1e4,2),'maxDeltaGradient':float(max(gx.max(),gz.max())),
  'cellsDeltaGradientOver1':int((gx>1).sum()+(gz>1).sum())}
 ck['slopeStats']={'r1MaxCellSlope':float(max(rx.max(),rz.max())),'variantMaxCellSlope':float(max(sx.max(),sz.max())),
  'variantCellEdgesOver45deg':int((sx>1).sum()+(sz>1).sum()),'r1CellEdgesOver45deg':int((rx>1).sum()+(rz>1).sum()),
  'variantCellEdgesOver60deg':int((sx>np.tan(np.radians(60))).sum()+(sz>np.tan(np.radians(60))).sum())}
 ck['pass']=bool(ck['outsideWindowBboxUnchanged'] and ck['protectedUnchanged'] and ck['changedOnlyWhereMaskPositive'] and ck['crestCellsBelowBound']==0 and ck['wetCellsChanged']==0
  and ck['landSeaSignChanged']==0 and ck['coastBand0to150Changed']==0 and max(rt.values())==0 and ck['newDrySinkCells1cm']==0)
 DOC.mkdir(parents=True,exist_ok=True);(DOC/f'{vid}.json').write_text(json.dumps(res,indent=1)+'\n');return res

if __name__=='__main__':
 r=validate(sys.argv[1]);c=r['checks'];print(json.dumps({k:c[k] for k in c if k not in('sinksR1','sinksVariant')}))
