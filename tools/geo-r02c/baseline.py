"""GEO-R02C-P0 baseline diagnostics of the canonical R1 artifacts (read-only) -> docs/geo-r02c-p0/baseline/.
Every figure that R1 also reports is cross-checked against R1's committed outputs; mismatches are reported, never tuned away.
Form statistics are indicators for review, not acceptance targets."""
from pathlib import Path
import argparse,csv,json,subprocess,sys,time
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parent/'lib'));sys.path.insert(0,str(Path(__file__).resolve().parent/'env'))
from common import ROOT,NX,NZ,CELL,load_grid,load_features,load_mask,sha256,surface,coords,write_png,hillshade,downsample,diverging
from hydro import sink_report,r1_convention_sinks,d8_receivers,wet_mask
from form import curvature_classes,slope_bins,creases,transect,ridge_profile,flank_fall
from routes import route_profile
from los import reveal_report
from fingerprint import fingerprint
from shapely.geometry import LineString

PROTECTED=['public/geo-r02b','docs/geo-r02b','docs/geo-r02b-r1','tools/geo-r02b','tools/geo-r02b-r1','src/world']
REGIONS={'island':None,'A1-window':'mask','north-massif':(-2000,1700,2200,4000),'central-valley':(-300,900,-800,900),'hidden-fold':(700,2000,-600,700),'south-shoulder':(-2000,500,-3500,-1400)}

def protected_hashes():
 files=subprocess.run(['git','ls-files',*PROTECTED],cwd=ROOT,capture_output=True,text=True,check=True).stdout.split()
 files+=[f for f in subprocess.run(['git','ls-files','tests'],cwd=ROOT,capture_output=True,text=True,check=True).stdout.split() if not f.startswith('tests/geo-r02c')]
 return {f:sha256(ROOT/f) for f in sorted(files)}

def region_mask(spec,land,mask):
 if spec is None:return land
 if spec=='mask':return land&mask['inside']
 X,Z=coords();x0,x1,z0,z1=spec;return land&(X>=x0)&(X<=x1)&(Z>=z0)&(Z<=z1)

def authored_left_check(f):
 """Assert R1's UV side convention: side>=0 (flankWidthLeftM) is the WORLD-right side of the polyline."""
 r=f['ridges'][0];p=np.array(r['points'])[:,[0,2]];a,b=p[0],p[1];t=b-a;world_left=np.array([-t[1],t[0]]);q=a+world_left/np.linalg.norm(world_left)
 uv=lambda w:np.array([(w[0]+3000)/10,(4000-w[1])/10]);ta=uv(b)-uv(a);side=np.dot(uv(q)-uv(a),np.array([-ta[1],ta[0]]))
 assert side<0,'expected the world-left point to be on R1 UV right side';return 'verified: R1 flankWidthLeftM applies to the world-right side of the authored ridge direction'

def main():
 p=argparse.ArgumentParser();p.add_argument('--out',type=Path,default=ROOT/'docs/geo-r02c-p0/baseline');a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
 t0=time.perf_counter();timing={};R1=ROOT/'public/geo-r02b'
 H=load_grid(R1/'terrain.f32');W=load_grid(R1/'water-surface.f32');f=load_features();mask=load_mask(ROOT/'tools/geo-r02c/masks/A1-window-v1.json')
 land=H>0;wet=wet_mask(H,W);dryland=land&~wet
 head=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,capture_output=True,text=True).stdout.strip()
 manifest={'gitHead':head,'r1Checkpoint':'b6784a992df75e3e628f8211c6aff6cbf9e8eb24','environment':fingerprint(),
  'canonicalArtifacts':{n:sha256(R1/n) for n in ('terrain.f32','features.json','water-mesh.f32','water-surface.f32','diagnostics.json')}|{'design-master-A-R1-v1.json':sha256(ROOT/'docs/geo-r02b/design-master-A-R1-v1.json')},
  'protectedFiles':protected_hashes()}
 (a.out/'baseline-manifest.json').write_text(json.dumps(manifest,indent=1)+'\n')
 # --- sinks: R1's own convention reproduced, plus a stricter whole-grid check
 s=time.perf_counter();r1s=r1_convention_sinks(H,W);rep,depth=sink_report(H,W);timing['sinksSeconds']=round(time.perf_counter()-s,1)
 recorded=json.loads((ROOT/'docs/geo-r02b-r1/integrity.json').read_text())
 sinks={'r1Convention':r1s,'r1Recorded':[{'cellM':x['cellM'],'material':x['count'],'smaller':x['smallerDepressionsAbove0_1mAnd64m2']['count']} for x in recorded['depressions']] if 'depressions' in recorded else 'see integrity.json',
  'strictConvention':rep}
 (a.out/'sinks.json').write_text(json.dumps(sinks,indent=1)+'\n')
 # --- water: R1's per-channel surface-rise and lake planarity definitions
 water=[]
 for c in f['channels']:
  q=np.array(c['points'])[:,[0,2]];act=surface(W,q[:,0],q[:,1]);rise=np.diff(act);k=int(np.nanargmax(rise))
  water.append({'id':c['id'],'maxActualSurfaceRiseM':float(max(0,np.nanmax(rise))),'at':{'x':float(q[k,0]),'z':float(q[k,1])},'nonfinite':int((~np.isfinite(act)).sum())})
 rec=json.loads((ROOT/'docs/geo-r02b-r1/water-integrity.json').read_text());recd={c['id']:c['maxActualSurfaceRiseM'] for c in rec['channels']}
 for w in water:w['r1RecordedRiseM']=recd.get(w['id']);w['matchesRecorded']=abs(w['maxActualSurfaceRiseM']-recd.get(w['id'],np.nan))<1e-9
 rb=d8_receivers(H);flat=dryland&(rb<0)
 hydro={'channels':water,'allMatchRecorded':all(w['matchesRecorded'] for w in water),'proposedRiseToleranceM':.05,'maxRiseM':max(w['maxActualSurfaceRiseM'] for w in water),
  'd8DryCellsWithoutLowerNeighbour':int(flat.sum()),'note':'catchment reach is reproduced by re-running R1 validate.py (byte-identical terrain-validation.json); see docs/geo-r02c-p0/README.md'}
 (a.out/'hydrology.json').write_text(json.dumps(hydro,indent=1)+'\n')
 # --- routes: reproduce R1 route-profiles-full.csv, then tread-width probes
 s=time.perf_counter();rows=list(csv.DictReader(open(ROOT/'docs/geo-r02b-r1/route-profiles-full.csv')));routes=[];maxdiff={'height_m':0.,'grade':0.,'transverse_grade':0.}
 for r in f['routes']:
  prof=route_profile(H,W,f,r);ser=prof.pop('_series');mine=[x for x in rows if x['route']==r['id']]
  assert len(mine)==prof['samples']
  maxdiff['height_m']=max(maxdiff['height_m'],float(np.max(np.abs(ser['height']-np.array([float(x['height_m']) for x in mine])))))
  g=np.r_[ser['grade'],ser['grade'][-1]];maxdiff['grade']=max(maxdiff['grade'],float(np.max(np.abs(g-np.array([float(x['grade']) for x in mine])))))
  maxdiff['transverse_grade']=max(maxdiff['transverse_grade'],float(np.max(np.abs(ser['cross17']-np.array([float(x['transverse_grade']) for x in mine])))))
  routes.append(prof)
 timing['routesSeconds']=round(time.perf_counter()-s,1)
 (a.out/'routes.json').write_text(json.dumps({'reproductionOfR1Csv':{'maxAbsDifference':maxdiff,'pass':all(v<1e-3 for v in maxdiff.values())},
  'classesAndTreadsAreProposals':True,'routes':routes},indent=1)+'\n')
 # --- form indicators
 s=time.perf_counter();form={'convention':authored_left_check(f),'regions':{}}
 for name,spec in REGIONS.items():
  m=region_mask(spec,dryland,mask);form['regions'][name]={'curvature':curvature_classes(H,m),'slopeBins':slope_bins(H,m)}
  cr,_=creases(H,m,1.);cr3,_=creases(H,m,3.);form['regions'][name]['creases']={'over1m':cr,'over3m':cr3}
 form['ridges']=[]
 for r in f['ridges']:
  fl=flank_fall(H,r['points']);w=r['flankWidthsM'];form['ridges'].append({'id':r['id'],'authoredFlankWidthsLeftRightM':w,**fl,'profile':ridge_profile(H,r['points'])})
 asym=[x for x in form['ridges'] if abs(x['authoredFlankWidthsLeftRightM'][0]-x['authoredFlankWidthsLeftRightM'][1])/max(x['authoredFlankWidthsLeftRightM'])>.15]
 agree=sum((x['authoredFlankWidthsLeftRightM'][0]<x['authoredFlankWidthsLeftRightM'][1])==(x['authoredLeftFallPerM']>x['authoredRightFallPerM']) for x in asym)
 form['authoredAsymmetryAgreement']={'ridgesWithAuthoredAsymmetryOver15pct':len(asym),'narrowerAuthoredSideIsSteeper':agree,
  'note':'indicator only; measured 40-240 m from the crest along the authored polyline, R1 left/right convention'}
 timing['formSeconds']=round(time.perf_counter()-s,1);(a.out/'form.json').write_text(json.dumps(form,indent=1)+'\n')
 # --- transects
 tdef=json.loads((ROOT/'tools/geo-r02c/transects.json').read_text())['transects'];tr={}
 for t in tdef:
  if t['type']=='line':pts=[t['a'],t['b']]
  elif t['type']=='polyline':pts=t['points']
  else:
   src=next(c for c in f['channels'] if c['id']==t['channel'])['points'] if t['type']=='channel-normal' else next(v for v in f['valleys'] if v['id']==t['valley'])['axis']
   L=LineString(np.array(src)[:,[0,2]]);c=np.array(L.interpolate(t['fraction'],normalized=True).coords[0]);d=np.array(L.interpolate(min(1,t['fraction']+.01),normalized=True).coords[0])
   tg=(d-c)/np.linalg.norm(d-c);n=np.array([-tg[1],tg[0]]);pts=[(c-n*t['halfLengthM']).tolist(),(c+n*t['halfLengthM']).tolist()]
  seg=[transect(H,pts[k],pts[k+1]) for k in range(len(pts)-1)];dist=[];hts=[];off=0.
  for sgm in seg:dist+= [off+x for x in sgm['distanceM']];hts+=sgm['heightM'];off=dist[-1]
  tr[t['id']]={'points':pts,'distanceM':[round(x,2) for x in dist],'heightM':hts,'note':t.get('note','')}
 (a.out/'transects.json').write_text(json.dumps(tr)+'\n')
 # --- reveals
 s=time.perf_counter();(a.out/'reveals.json').write_text(json.dumps(reveal_report(H,f),indent=1)+'\n');timing['revealsSeconds']=round(time.perf_counter()-s,1)
 # --- diagnostic maps (heightfield images, not browser renders)
 for name,az,alt in (('hillshade-sunA',290,18),('hillshade-sunB',135,35)):
  g=(np.where(land,hillshade(H,az,alt),.35)*255).astype(np.uint8);write_png(a.out/f'{name}.png',downsample(np.stack([g,g,g],-1),2))
 hz,hx=np.gradient(H,CELL);sl=np.hypot(hx,hz);cls=np.digitize(sl,[.05,.15,.3,.45,.7]);pal=np.array([[145,187,144],[217,213,125],[231,170,96],[202,106,83],[150,70,90],[90,40,80]],np.uint8)
 img=pal[cls];img[~land]=[60,100,113];write_png(a.out/'slope-classes.png',downsample(img,2))
 _,res=creases(H,dryland,1.);write_png(a.out/'crease-residual.png',downsample(diverging(np.where(dryland,res,np.nan),3.),2))
 timing['totalSeconds']=round(time.perf_counter()-t0,1);(a.out/'timing.json').write_text(json.dumps(timing,indent=1)+'\n');print(json.dumps(timing))

if __name__=='__main__':main()
