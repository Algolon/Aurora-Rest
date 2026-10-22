"""GEO-R02C-P0: attribute canonical (macOS) vs Linux R1 terrain differences.

No Mac intermediate arrays exist. Evidence used:
 1. float32 canonical vs float32 Linux replay (the exported files).
 2. Equality cells: R1 resets them to their target after every Jacobi sweep, so a canonical value on such a cell
    is the Mac target. Inverting R1's own formulas shows which input (land flag, distance) the Mac must have used.
 3. Tie exposure: closed rings repeat their first vertex, so R1's KD nearest-vertex lookup can tie exactly; R1's
    projection() then inspects only the segments next to whichever duplicate is returned.
 4. Counterfactual replays (r1_stages.py --counterfactual-...) that change ONE mechanism and are compared with the
    canonical binary. A counterfactual that reproduces the canonical bytes supports, but does not prove, the Mac path.
"""
from pathlib import Path
import argparse,json,sys
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree
from shapely.geometry import LineString,Point,Polygon
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'lib'))
from common import ROOT,NX,NZ,load_grid,stats,x_of,z_of,write_png,diverging,downsample,sha256
sys.path.insert(0,str(ROOT/'tools/geo-r02b-r1'))
from geometry import parse_path,projection  # R1's own helpers, imported read-only

def grid(a):return a.reshape(NZ,NX)
def components(d,threshold):
 lab,n=ndimage.label(d>threshold,structure=np.ones((3,3)));out=[]
 for k in range(1,n+1):
  m=lab==k;j,i=np.nonzero(m);out.append({'xRange':[float(x_of(i.min())),float(x_of(i.max()))],'zRange':[float(z_of(j.max())),float(z_of(j.min()))],'cells':int(m.sum()),'maxAbsDiffM':round(float(d[m].max()),5)})
 return sorted(out,key=lambda c:-c['maxAbsDiffM'])
def compare(C,X):
 d=np.abs(C-X);return {'cellsDiffering':int((d>0).sum()),'over1e-4':int((d>1e-4).sum()),'over1mm':int((d>1e-3).sum()),'over1cm':int((d>.01).sum()),
  'over10cm':int((d>.1).sum()),'maxAbsDiffM':float(d.max()),'componentsOver1cm':components(d,.01)}

def main():
 p=argparse.ArgumentParser();p.add_argument('--dumps',type=Path,required=True,help='r1_stages.py output of the unmodified replay')
 p.add_argument('--counterfactual',type=Path,nargs='*',default=[],help='r1_stages.py outputs of counterfactual replays')
 p.add_argument('--doc',type=Path,default=ROOT/'docs/geo-r02c-p0/reproducibility');a=p.parse_args();a.doc.mkdir(parents=True,exist_ok=True)
 canon=ROOT/'public/geo-r02b/terrain.f32';C=load_grid(canon);L=load_grid(a.dumps/'replay/terrain.f32');L4=dict(np.load(a.dumps/'constraints4.npz'))
 eq=grid(L4['fixed'])&~grid(L4['crest']);d=C-L
 out={'canonicalSha256':sha256(canon),'linuxReplaySha256':sha256(a.dumps/'replay/terrain.f32'),'replayReport':json.loads((a.dumps/'replay-report.json').read_text())}
 out['canonicalVsLinux']=compare(C,L);out['canonicalVsLinux']['absDiffOfDifferingCells']=stats(np.abs(d[d!=0]))
 T4=grid(L4['target']);crest=grid(L4['crest'])
 out['crestAtBound']={'linux':int((crest&(np.abs(L-T4)<1e-3)).sum()),'canonical':int((crest&(np.abs(C-T4)<1e-3)).sum()),'xor':int((crest&((np.abs(L-T4)<1e-3)^(np.abs(C-T4)<1e-3))).sum())}
 # --- mechanism A: coastline nodes (land/sea classification of boundary-coincident grid nodes)
 sd=grid(L4['sd']);land=grid(L4['land']);cd=grid(L4['cd']);coast=[]
 for j,i in zip(*np.nonzero(eq&(np.abs(d)>1e-3)&(np.abs(sd)<1e-6))):
  sea=-max(.3,cd[j,i]*.08);landv=sd[j,i]*grid(L4['coastgrade'])[j,i]
  coast.append({'x':float(x_of(i)),'z':float(z_of(j)),'signedCoastDistanceM':float(sd[j,i]),'linuxLand':bool(land[j,i]),'linux':float(L[j,i]),'canonical':float(C[j,i]),
   'canonicalEqualsOppositeBranch':bool(abs(C[j,i]-(sea if land[j,i] else landv))<1e-5)})
 out['mechanismCoastNodes']={'cells':coast,'verified':'nodes lie on the coast polyline within 1e-12 m; canonical value equals the formula of the opposite land/sea branch',
  'unverified':'why the Mac classifies them differently (ULP-level differences in tessellated coast vertices or in the point-in-polygon predicate)'}
 # --- mechanism B: exact KD-vertex ties at closed-ring seams (R1 projection inspects segments of one duplicate only)
 master=json.loads((ROOT/'docs/geo-r02b/design-master-A-R1-v1.json').read_text());rings=[]
 X=(np.arange(NX)*4.)/10;Z=(np.arange(NZ)*4.)/10
 for l in master['hydrology']['lakes']:
  ring_pts=parse_path(l['boundaryPath']);ring=np.vstack([ring_pts,ring_pts[0]]);poly=Polygon(ring_pts);b=poly.buffer(3.3).bounds  # 33 m: R1 lake hit band at 4 m
  ii=np.nonzero((X>=b[0])&(X<=b[2]))[0];jj=np.nonzero((Z>=b[1])&(Z<=b[3]))[0];J,I=np.meshgrid(jj,ii,indexing='ij');xy=np.column_stack([X[I.ravel()],Z[J.ravel()]])
  dd,_=cKDTree(ring).query(xy,k=2);tie=np.abs(dd[:,0]-dd[:,1])<=1e-12;dr,_,_,_,_=projection(ring,np.zeros(len(ring)),xy)
  line=LineString(ring);exact=np.array([line.distance(Point(q))*10 for q in xy[tie]]);err=np.abs(dr[tie]-exact)
  band=np.array([poly.exterior.distance(Point(q))*10<=32 or poly.contains(Point(q)) for q in xy[tie]])
  rings.append({'lake':l['id'],'ringVertices':len(ring),'distinctVertices':int(len(np.unique(ring,axis=0))),'gridCellsWithExactNearestVertexTie':int(tie.sum()),
   'tiedCellsInsideConstraintBand':int(band.sum()),'tiedCellsWithProjectionErrorOver1cm':int((err>.01).sum()),'maxProjectionErrorM':float(err.max()) if err.size else 0.})
 out['mechanismRingSeamTies']={'rings':rings,'verified':'every closed ring repeats its first vertex; exact KD ties exist on grid cells near each seam; R1 projection() can then return a distance that is not the nearest-segment distance',
  'unverified':'why cKDTree resolves the Birchwood-upper ties differently on macOS while High Tarn and Birchwood-lower ties resolve the same way on both platforms'}
 # --- Birchwood-upper rim cells: invert R1's outside-lake formula level-0.65+0.065*d to the distance each platform used
 bu=next(l for l in master['hydrology']['lakes'] if l['id']=='birch-upper-lake');rp=parse_path(bu['boundaryPath']);ring=np.vstack([rp,rp[0]]);poly=Polygon(rp)
 sel=eq&(np.abs(d)>1e-3)&(np.abs(sd)>=1e-6);rows=[]
 for j,i in zip(*np.nonzero(sel)):
  q=np.array([x_of(i)+3000,4000-z_of(j)])/10
  if poly.contains(Point(q)):continue
  exact=poly.exterior.distance(Point(q))*10;inv=lambda v:(v-(bu['levelM']-.65))/.065
  rows.append({'x':float(x_of(i)),'z':float(z_of(j)),'exactDistanceM':round(exact,4),'canonicalImpliedDistanceM':round(inv(C[j,i]),4),'linuxImpliedDistanceM':round(inv(L[j,i]),4)})
 if rows:
  ce=np.array([r['canonicalImpliedDistanceM']-r['exactDistanceM'] for r in rows]);le=np.array([r['linuxImpliedDistanceM']-r['exactDistanceM'] for r in rows])
  out['birchUpperRimInversion']={'outsideLakeEqualityCells':len(rows),'canonicalMinusExactM':stats(ce),'linuxMinusExactM':stats(le),'examples':rows[:8]}
 # --- counterfactuals
 out['counterfactuals']=[]
 for cf in a.counterfactual:
  r=json.loads((cf/'replay-report.json').read_text());X2=load_grid(cf/'replay/terrain.f32')
  out['counterfactuals'].append({'dir':cf.name,'tieAwareLakes':r.get('tieAwareLakes'),'terrainSha256':r['replayTerrainSha256'],'vsCanonical':compare(C,X2)})
 write_png(a.doc/'canonical-minus-linux.png',downsample(diverging(np.where(d!=0,d,np.nan),.05),2))
 (a.doc/'platform-diff.json').write_text(json.dumps(out,indent=1)+'\n')
 print(json.dumps({'canonicalVsLinux':{k:v for k,v in out['canonicalVsLinux'].items() if k!='componentsOver1cm'},'crest':out['crestAtBound'],'coast':len(coast),'rings':rings,
  'cf':[{'dir':c['dir'],**{k:v for k,v in c['vsCanonical'].items() if k!='componentsOver1cm'}} for c in out['counterfactuals']],'birch':out.get('birchUpperRimInversion',{}).get('canonicalMinusExactM')},indent=1))

if __name__=='__main__':main()
