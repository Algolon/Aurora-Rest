"""GEO-R02C-P0 platform probe (read-only, ~seconds): run on macOS and Linux and diff the JSON outputs.
Tests the open hypotheses in docs/geo-r02c-p0/reproducibility.md without regenerating terrain:
 1. Are R1's tessellated ring/coast vertices bit-identical across platforms? (SHA-256 of parse_path output bytes)
 2. Which duplicate seam vertex does cKDTree return at the Birchwood-upper rim cells?
 3. How does shapely classify the four coast-coincident grid nodes?
Usage: python3 tools/geo-r02c/repro/platform_probe.py > probe-<platform>.json
"""
from pathlib import Path
import hashlib,json,platform,sys
import numpy as np
ROOT=Path(__file__).resolve().parents[3];sys.path.insert(0,str(ROOT/'tools/geo-r02b-r1'))
from geometry import parse_path,projection
from scipy.spatial import cKDTree
from shapely.geometry import Polygon
from shapely import contains_xy
import scipy,shapely

m=json.loads((ROOT/'docs/geo-r02b/design-master-A-R1-v1.json').read_text())
U4=np.arange(0,600.001,.4);V4=np.arange(0,800.001,.4)  # exactly how R1 constraints(4) builds node coordinates
def uv(x,z):return np.array([[U4[int(round((x+3000)/4))],V4[int(round((4000-z)/4))]]])
out={'platform':platform.platform(),'machine':platform.machine(),'numpy':np.__version__,'scipy':scipy.__version__,'shapely':shapely.__version__,'geos':shapely.geos_version_string,'rings':{}}
coast=parse_path(m['coast']['mainland']['boundaryPath']);out['coastVerticesSha256']=hashlib.sha256(np.ascontiguousarray(coast,'<f8').tobytes()).hexdigest()
for l in m['hydrology']['lakes']:
 p=parse_path(l['boundaryPath']);out['rings'][l['id']]={'vertices':len(p),'sha256':hashlib.sha256(np.ascontiguousarray(p,'<f8').tobytes()).hexdigest()}
# Birchwood-upper rim cells where the canonical (macOS) and Linux values differ (docs/geo-r02c-p0/reproducibility/platform-diff.json)
bu=next(l for l in m['hydrology']['lakes'] if l['id']=='birch-upper-lake');p=parse_path(bu['boundaryPath']);ring=np.vstack([p,p[0]]);tree=cKDTree(ring)
cells=[(-956.,708.),(-956.,704.),(-952.,704.),(-960.,700.),(-956.,700.)];out['birchUpperSeam']=[]
for x,z in cells:
 dd,ii=tree.query(uv(x,z)[0],k=3);d,_,_,seg,_=projection(ring,np.zeros(len(ring)),uv(x,z))
 out['birchUpperSeam'].append({'x':x,'z':z,'nearestVertexIndices':ii.tolist(),'nearestVertexDistancesUV':[float(v) for v in dd],'r1ProjectionDistanceM':float(d[0]),'segment':int(seg[0])})
poly=Polygon(coast);out['coastNodes']=[{'x':x,'z':z,'containsXY':bool(contains_xy(poly,*uv(x,z)[0]))} for x,z in [(-1684.,2808.),(-1756.,2712.),(-1768.,2696.),(-1792.,2664.)]]
print(json.dumps(out,indent=1))
