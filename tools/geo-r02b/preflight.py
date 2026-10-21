"""Read-only source checks; saves a separate audit record, never rewrites the master."""
from pathlib import Path
import os,sys,json,hashlib,re
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from shapely.geometry import Polygon,LineString,Point
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02b';source=DOC/'design-master-A-R1-v1.json';m=json.loads(source.read_text())
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

errors=[]
def check(ok,label):
 if not ok:errors.append(label)
check(hashlib.sha256(source.read_bytes()).hexdigest()=='62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598','approved source hash')
check(m['masterId']=='aurora-rest-concept-a-r1' and m['revision']=='GEO-R02A-R1.1','source identity/revision')
main=Polygon(parse_path(m['coast']['mainland']['boundaryPath']));islands=[Polygon(parse_path(i['boundaryPath'])) for i in m['coast']['islands']]
check(main.is_valid and all(i.is_valid for i in islands),'valid coast polygons')
check(all(a.intersection(b).area<1e-8 for j,a in enumerate([main]+islands) for b in ([main]+islands)[j+1:]),'non-overlapping land rings')
expected={'ridges':16,'catchments':8,'channels':13,'lakes':4,'islands':10,'corridors':6,'crossings':3}
actual={key:len(m[section][key]) for section,key in [('elevation','ridges'),('hydrology','catchments'),('hydrology','channels'),('hydrology','lakes'),('coast','islands'),('walking','corridors'),('walking','crossings')]}
check(actual==expected,'complete inventory')
crest={n['id']:n for n in m['elevation']['crestNodes']}
for r in m['elevation']['ridges']:
 check(len(r['knotsUV'])==len(r['crestLevelsM'])==len(r['nodeRefs']),r['id']+' ridge attributes')
 for uv,h,ref in zip(r['knotsUV'],r['crestLevelsM'],r['nodeRefs']):check(ref in crest and np.linalg.norm(np.array(uv)-crest[ref]['uv'])<1e-6 and abs(h-crest[ref]['proposedLevelM'])<1e-6,r['id']+' shared crest topology')
nodes={n['id']:n for n in m['hydrology']['nodes']};adj={n:[] for n in nodes}
for c in m['hydrology']['channels']:
 check(c['fromNode'] in nodes and c['toNode'] in nodes,c['id']+' node references')
 check(len(c['knotsUV'])==len(c['waterLevelsM'])==len(c['channelWidthsM'])==len(c['indicativeDepthM']),c['id']+' aligned attributes')
 check(all(a>b for a,b in zip(c['waterLevelsM'],c['waterLevelsM'][1:])),c['id']+' proposed descent')
 for end,idx in [(c['fromNode'],0),(c['toNode'],-1)]:check(np.linalg.norm(np.array(c['knotsUV'][idx])-nodes[end]['uv'])<1e-6 and abs(c['waterLevelsM'][idx]-nodes[end]['levelM'])<1e-6,c['id']+' endpoint')
 adj[c['fromNode']].append(c['toNode'])
 # Lake hydraulic connections are edges separate from river centerlines.
for lake in m['hydrology']['lakes']:
 poly=Polygon(parse_path(lake['boundaryPath']));check(poly.is_valid and main.covers(poly),lake['id']+' lake geometry')
 for node in lake['inletNodes']+[lake['spillNode']]:check(poly.boundary.distance(Point(nodes[node]['uv']))<.03 and abs(nodes[node]['levelM']-lake['levelM'])<1e-6,lake['id']+' inlet/spill')
 for node in lake['inletNodes']:adj[node].append(lake['spillNode'])
seen=set();active=set()
def visit(n):
 if n in active:return False
 if n in seen:return True
 active.add(n);ok=all(visit(v) for v in adj[n]);active.remove(n);seen.add(n);return ok
check(all(visit(n) for n in nodes),'directed water graph acyclic')
catchpolys=[Polygon(r) for c in m['hydrology']['catchments'] for r in c['boundaryRings']];union=unary_union(catchpolys)
check(main.buffer(.05).covers(union) and union.buffer(.05).covers(main),'catchment coverage within 0.5 m curve tessellation tolerance')
check((sum(p.area for p in catchpolys)-union.area)*100<5,'catchment overlap')
result={'scope':'Source plan geometry and proposed elevation graph; independent of 3D terrain validity. Recheck of mandatory preflight inspected before implementation.','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'schemaVersion':m['schemaVersion'],'revision':m['revision'],'counts':actual,'allChecksPassed':not errors,'errors':errors,'catchmentCoverageDifferenceM2':main.symmetric_difference(union).area*100,'curveTessellationToleranceM':0.5,'catchmentBoundaryHausdorffM':main.boundary.hausdorff_distance(union.boundary)*10,'branchBase':'c3621ea7d73334d6cd16b5af096d3f933a249845','defaultBranchObserved':'d543f66a85f120a182eebe56e2d24f5770f250fb','ancestryException':'User explicitly approved c3621ea instead of main for codex/geo-r02b-a-r1-terrain-skeleton. Main contained only README; runtime checkpoint preserved.','coordinateTransform':{'x':'10*u - 3000','z':'4000 - 10*v','grid':[600,800],'planningEnvelopeM':[6000,8000]}}
(DOC/'source-preflight.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));assert not errors
