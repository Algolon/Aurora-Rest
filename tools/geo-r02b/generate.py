"""A-R1 authored terrain skeleton, offline reproducible generation (not erosion).
Requires numpy, scipy and shapely. AURO​RA_PY_TOOLS may name a local library folder.
"""
from pathlib import Path
import os,sys,json,hashlib,math,time,re
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
from scipy.spatial import cKDTree
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import distance_transform_edt,convolve
from shapely.geometry import Polygon,LineString,Point
from shapely import contains_xy
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/geo-r02b';OUT.mkdir(parents=True,exist_ok=True)
DOC=ROOT/'docs/geo-r02b';source=DOC/'design-master-A-R1-v1.json';m=json.loads(source.read_text());started=time.perf_counter()
assert m['masterId']=='aurora-rest-concept-a-r1' and m['revision']=='GEO-R02A-R1.1'
CELL=4.;NX=1501;NZ=2001
u=np.arange(NX,dtype=float)*CELL/10;v=np.arange(NZ,dtype=float)*CELL/10
U,V=np.meshgrid(u,v);X=U.ravel();Y=V.ravel();XY=np.column_stack([X,Y]);shape=U.shape

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
def smooth(a,b,x):
 t=np.clip((x-a)/(b-a),0,1);return t*t*(3-2*t)
def signed_distance(poly):
 mask=contains_xy(poly,X,Y).reshape(shape)
 # Half-cell convention puts sea-level contour between opposite-signed cells.
 inside=distance_transform_edt(mask)*CELL-CELL/2;outside=distance_transform_edt(~mask)*CELL-CELL/2
 return np.where(mask,inside,-outside).ravel(),mask.ravel()
def profile(feature,pathkey,knotskey,valueskey):
 pts=parse_path(feature[pathkey]);line=LineString(pts);kp=np.array(feature[knotskey]);kdist=np.array([line.project(Point(p)) for p in kp]);ds=np.r_[0,np.cumsum(np.linalg.norm(np.diff(pts,axis=0),axis=1))]
 values=np.interp(ds,kdist,np.array(feature[valueskey],float));return pts,values,ds,kdist

def ridge_query(pts,levels):
 # The KD tree only locates candidate segments; closest segment projection is
 # continuous. Never quantize crest elevation to the nearest sampled vertex.
 _,idx=query(pts);best=np.full(X.shape,np.inf);outp=np.zeros((len(X),2));outt=np.zeros((len(X),2));outlevel=np.zeros(X.shape)
 for offset in [-1,0]:
  seg=np.clip(idx+offset,0,len(pts)-2);a=pts[seg];b=pts[seg+1];delta=b-a
  t=np.clip(((XY-a)*delta).sum(axis=1)/np.maximum(1e-14,(delta*delta).sum(axis=1)),0,1);projected=a+delta*t[:,None];d2=((XY-projected)**2).sum(axis=1);hit=d2<best
  best=np.where(hit,d2,best);outp=np.where(hit[:,None],projected,outp);outt=np.where(hit[:,None],delta,outt);outlevel=np.where(hit,levels[seg]*(1-t)+levels[seg+1]*t,outlevel)
 return np.sqrt(best)*10,outp,outt,outlevel

def query(pts):
 tree=cKDTree(pts);return tree.query(XY,workers=2)
def worlds(pts,levels=None):
 if levels is None:return [[round(10*a-3000,4),round(4000-10*b,4)] for a,b in pts]
 return [[round(10*a-3000,4),round(float(h),5),round(4000-10*b,4)] for (a,b),h in zip(pts,levels)]
def noise(x,y,seed=26092026):
 ix=np.floor(x).astype(np.int64);iy=np.floor(y).astype(np.int64);fx=x-ix;fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy)
 def h(a,b):
  z=(a*374761393+b*668265263+seed*1442695041)&0xffffffff;z=((z^(z>>13))*1274126177)&0xffffffff;return ((z^(z>>16))&0xffffffff)/4294967295*2-1
 return (h(ix,iy)*(1-fx)+h(ix+1,iy)*fx)*(1-fy)+(h(ix,iy+1)*(1-fx)+h(ix+1,iy+1)*fx)*fy
coastpts=parse_path(m['coast']['mainland']['boundaryPath']);mainpoly=Polygon(coastpts);coastd,mainmask=signed_distance(mainpoly);landmask=mainmask.copy()
H=14+np.clip(coastd,0,1500)*.045;H=np.where(mainmask,H,-12-np.minimum(40,-coastd*.02))
base=H.copy();ridge_export=[];ridge_nearest=np.full(X.shape,1e8)
for r in m['elevation']['ridges']:
 pts,levels,ds,kdist=profile(r,'path','knotsUV','crestLevelsM');levels=PchipInterpolator(kdist,r['crestLevelsM'])(ds);dm,pp,tangent,crest=ridge_query(pts,levels);side=(X-pp[:,0])*(-tangent[:,1])+(Y-pp[:,1])*tangent[:,0]
 width=np.where(side>=0,r['flankWidthLeftM'],r['flankWidthRightM'])
 # Piecewise compact rock/flank profile. No isolated Gaussian primitives.
 span=width*2.15;t=np.clip(dm/span,0,1);cross=np.maximum(0,1-t**.9)**1.45
 # End taper is provided by descending authored endpoints and cross-distance, not circular hill envelopes.
 local_base=np.minimum(80,base);candidate=local_base+(crest-local_base)*cross
 H=np.maximum(H,np.where(mainmask,candidate,H));ridge_nearest=np.minimum(ridge_nearest,dm)
 ridge_export.append({'id':r['id'],'points':worlds(pts,levels),'family':r['family'],'flankWidthsM':[r['flankWidthLeftM'],r['flankWidthRightM']]})
# Basin envelopes support the upland shelf / enclosed valley before carving
# their explicitly defined outlet valleys. These are authored irregular polygons.
basin_export=[]
for basin in m['elevation']['basins']:
 lake=next(l for l in m['hydrology']['lakes'] if l['basinId']==basin['id'])
 boundary=parse_path(basin['boundaryPath']);sd,inside=signed_distance(Polygon(boundary))
 lake_sd,_=signed_distance(Polygon(parse_path(lake['boundaryPath'])))
 floor=lake['levelM']+np.maximum(0,-lake_sd)*.12
 influence=smooth(-120,90,sd)
 H=np.maximum(H,H*(1-influence)+floor*influence)
 basin_export.append({'id':basin['id'],'boundary':worlds(boundary),'spillNode':basin['spillNode'],'lakeId':lake['id']})
# Independent authored valley floors precede channel carving. Broad troughs have real lateral width.
valley_export=[];valley_weight=np.zeros(X.shape)
for va in m['elevation']['valleys']:
 pts,levels,ds,kdist=profile(va,'axisPath','axisKnotsUV','floorLevelsM');dist,idx=query(pts);sd,inside=signed_distance(Polygon(parse_path(va['floorBoundaryPath'])))
 influence=smooth(-100,65,sd);valley_weight=np.maximum(valley_weight,influence)
 widths=np.interp(ds,kdist,np.array(va['floorWidthM']))[idx]
 cross=np.clip(dist*10/np.maximum(30,widths/2),0,2)
 # Dry terrace rises laterally; a floor is not a narrow river-shaped trench.
 relief=2+np.minimum(18,widths*.012)*cross**1.8
 if va['id']=='mire-floodplain':relief=.7+2*cross**1.6
 target=levels[idx]+relief
 H=H*(1-influence)+target*influence
 valley_export.append({'id':va['id'],'axis':worlds(pts,levels),'boundary':worlds(parse_path(va['floorBoundaryPath'])),'widthsM':va['floorWidthM']})
# Pass constraints: lower along N/S, higher along E/W. This is an authored saddle, not trail flattening.
ps=m['elevation']['passes'][0];p=np.array(ps['uv']);north=np.array(ps['northHighPoint']['uv'])-p;axis=north/np.linalg.norm(north);east=np.array([-axis[1],axis[0]])
dx=X-p[0];dy=Y-p[1];along=(dx*axis[0]+dy*axis[1])*10;across=(dx*east[0]+dy*east[1])*10
longspan=np.where(along>=0,math.dist(ps['northHighPoint']['uv'],ps['uv'])*10,math.dist(ps['southHighPoint']['uv'],ps['uv'])*10)
gain=np.where(along>=0,115,70)*(along/longspan)**2
fall=np.where(across>=0,60*(across/240)**2,45*(across/380)**2)
passH=215+gain-fall;weight=(1-smooth(210,400,np.abs(along)))*(1-smooth(180,430,np.abs(across)))
H=H*(1-weight)+passH*weight
lake_export=[];lake_distance=np.full(X.shape,1e8);lake_masks=[];lake_polygons=[];lake_level_field=np.full(X.shape,np.inf)
for l in m['hydrology']['lakes']:
 pts=parse_path(l['boundaryPath']);poly=Polygon(pts);lake_polygons.append((l['id'],poly,l['levelM']));sd,inside=signed_distance(poly);lake_masks.append(inside);lake_level_field=np.where(inside,l['levelM'],lake_level_field);lake_distance=np.minimum(lake_distance,np.abs(sd));level=l['levelM'];depth=l['indicativeMaxDepthM']
 # Raise the irregular basin shelf when necessary, then cut its actual lake shape.
 outside=np.maximum(0,-sd);rim=level+outside*.10;blend=1-smooth(55,300,outside)
 H=np.where(~inside,H*(1-blend)+rim*blend,H)
 bowl=level-.35-depth*smooth(0,85,np.maximum(0,sd))
 # Conservative one-cell shore buffer prevents raster triangles standing through a precise vector shore.
 shelfbuffer=(~inside)&(sd>-CELL*2);H=np.where(shelfbuffer,np.minimum(H,level-.3),H)
 H=np.where(inside,bowl,H)
 lake_export.append({'id':l['id'],'name':l['name'],'level':level,'boundary':worlds(pts),'spillNode':l['spillNode'],'inletNodes':l['inletNodes']})
# Add bounded geological detail, suppressed on authored floors, crests and water margins.
detail=(noise((X*.8+Y*.3)/8,(Y*.8-X*.3)/3)*2.1+noise(X/3.1,Y/2.8,26092031)*.8)
gate=(1-valley_weight)*smooth(5,55,ridge_nearest)*smooth(12,90,lake_distance)*smooth(20,100,coastd)
H+=detail*gate
junction_corrections=[];lake_union=np.isfinite(lake_level_field);channel_export=[];channel_distance=np.full(X.shape,1e8);channel_min=np.full(X.shape,np.inf);channel_bank=np.full(X.shape,np.inf);channel_active=np.zeros(X.shape,bool);deviations=[]
for c in m['hydrology']['channels']:
 pts,levels,ds,kdist=profile(c,'path','knotsUV','waterLevelsM')
 # A vector inlet can intersect its lake before its nominal endpoint. Reconcile
 # the actual shoreline junction explicitly, without moving the approved path.
 for lake_id,poly,lake_level in lake_polygons:
  hit=contains_xy(poly,pts[:,0],pts[:,1]);incoming=(levels>lake_level+.01)&hit
  if np.any(incoming):
   entry=int(np.where(hit)[0][0]);start=max(0,entry-1)
   while start>0 and (ds[entry]-ds[start])*10<180:start-=1
   original=levels.copy();levels[start:entry+1]=np.linspace(levels[start],lake_level,entry-start+1);levels[hit]=np.minimum(levels[hit],lake_level)
   junction_corrections.append({'channel':c['id'],'lake':lake_id,'kind':'water-level reconciliation at actual vector shoreline intersection','affectedLengthM':round(float((ds[-1]-ds[start])*10),2),'maxLevelAdjustmentM':round(float(np.max(np.abs(original-levels))),3),'pathUnchanged':True})
 depths=np.interp(ds,kdist,c['indicativeDepthM']);authored_depths=depths.copy();local_grade=np.abs(np.gradient(levels,ds*10));depths+=np.maximum(.25,local_grade*CELL*.7);widths=np.interp(ds,kdist,c['channelWidthsM'])
 effective=np.maximum(widths,16.) # 4 cells across; explicit resolution departure, recorded below.
 if np.any(widths<16):deviations.append({'id':c['id'],'kind':'greybox minimum resolved wetted width','authoredMinM':float(min(widths)),'prototypeMinM':16,'reason':'4 m canonical cells; refine conforming banks before final small streams'})
 dist,idx=query(pts);dm=dist*10;channel_distance=np.minimum(channel_distance,dm);half=effective[idx]/2;bank=np.maximum(14,effective[idx]);level=levels[idx];depth=depths[idx]
 within=dm<=half+CELL*1.5;bankmask=dm<half+bank+8
 # Supported gully / valley cross-sections, rather than a raised blue strip.
 # Width follows gradient class; no route elevations enter this operation.
 flank_slope=np.where(level>250,.26,np.where(level>80,.16,.055))
 support=level+1.5+np.maximum(0,dm-half)*flank_slope
 influence=1-smooth(half+bank+12,half+bank+180,dm)
 H=np.where(~lake_union,np.maximum(H,H*(1-influence)+support*influence),H)
 bed=level-depth+depth*.12*(np.minimum(dm,half)/half)**2
 target=level+1.2+np.maximum(0,dm-half)*.075
 # At junctions choose the lower consistent bed; never sum drainage cuts.
 channel_min=np.minimum(channel_min,np.where(within,bed,np.inf));channel_active|=within
 channel_bank=np.minimum(channel_bank,np.where(bankmask,target,np.inf))
 channel_export.append({'id':c['id'],'fromNode':c['fromNode'],'toNode':c['toNode'],'points':worlds(pts,levels),'bedLevels':np.round(levels-depths,5).tolist(),'authoredDepthsM':np.round(authored_depths,4).tolist(),'resolvedDepthsM':np.round(depths,4).tolist(),'authoredWidthsM':np.round(widths,4).tolist(),'widthsM':np.round(effective,4).tolist(),'regime':c['regime'],'catchmentId':c['catchmentId']})
# A channel has banks and a cut bed; the water mesh is derived from the same samples.
nearbank=np.isfinite(channel_bank);H=np.where(nearbank&~lake_union,np.maximum(H,channel_bank),H)
H=np.where(channel_active,np.where(lake_union,np.minimum(H,channel_min),channel_min),H)
# Coast remains an independent authored boundary. Sand/lee transitions are wider than exposed capes.
shore_span=np.where((X<210)&(Y>100)&(Y<650),24.,68.);shore_span=np.where((X>470)&(Y>430),100.,shore_span)
shoreweight=smooth(0,shore_span,coastd);H=np.where(mainmask,H*shoreweight,-np.maximum(.3,-coastd*.08))
# Reapply the low outlet bed in the final shoreline transition while keeping exact sea-level topology.
# Islands use their own polygon SDF and a local elongated rock spine, never ellipses.
island_export=[]
for i,isle in enumerate(m['coast']['islands']):
 pts=parse_path(isle['boundaryPath']);poly=Polygon(pts);sd,inside=signed_distance(poly);landmask|=inside
 height=min(78,max(22,math.sqrt(poly.area)*2.2));mx=max(4,float(np.max(sd)));yy=height*np.clip(sd/mx,0,1)**.75
 H=np.where(inside,yy,H);island_export.append({'id':isle['id'],'boundary':worlds(pts),'proposedHeight':height})
H=np.where(landmask,H,-np.maximum(.2,-coastd*.08))
assert np.all(np.isfinite(H)) and np.max(H)<1200
# A very small numeric relaxation only outside constraints removes raster knots; no global terrain smoothing.
mask=(gate>.6)&(channel_distance>60)&(lake_distance>80)&mainmask
arr=H.reshape(shape);avg=convolve(arr,np.array([[0,1,0],[1,4,1],[0,1,0]])/8,mode='nearest');H=np.where(mask,H*.8+avg.ravel()*.2,H)
arr=H.reshape(shape).astype('<f4');raw=arr.tobytes();(OUT/'terrain.f32').write_bytes(raw)
meta={'schemaVersion':1,'milestone':'GEO-R02B','masterId':m['masterId'],'masterRevision':m['revision'],'masterSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'generatorVersion':'terrain-skeleton-4','grid':{'width':NX,'height':NZ,'cellM':CELL,'west':-3000,'north':4000,'rowDirection':'south','dataType':'float32-le'},'heightRangeM':[float(np.min(arr)),float(np.max(arr))],'terrainSha256':hashlib.sha256(raw).hexdigest(),'runtimeNote':'Greybox only; regenerated from explicit A-R1 constraints. Not an erosion or water-flow simulation.','resolutionDepartures':deviations,'junctionCorrections':junction_corrections,'ridgeInterpolation':'Shape-preserving cubic crest heights through authored knots, closest-segment projection; no nearest-vertex height steps.','shoreInterpretation':'Lake margins transition to the authored water level over 55–300 m outside the exact irregular shore. No new lake geometry.','depthAllowance':'Carving adds max(0.25 m, local water grade × 4 m × 0.7) to indicative depth for raster interpolation safety. Authored and resolved depths exported separately.'}
features={'meta':meta,'coast':worlds(coastpts),'islands':island_export,'basins':basin_export,'ridges':ridge_export,'valleys':valley_export,'lakes':lake_export,'channels':channel_export,'nodes':[{**n,'position':worlds([n['uv']],[n['levelM']])[0]} for n in m['hydrology']['nodes']],'routes':[{'id':r['id'],'role':r['role'],'widthM':r['reservedWidthM'],'targetMaxGrade':r.get('targetLocalMaximumPct',30)/100,'points2':worlds(parse_path(r['path']))} for r in m['walking']['corridors']],'crossings':[{**c,'position2':worlds([c['approxUV']])[0]} for c in m['walking']['crossings']],'anchors':m['anchors'],'pass':ps,'catchments':[{'id':c['id'],'name':c['name'],'rings':[worlds(r) for r in c['boundaryRings']]} for c in m['hydrology']['catchments']]}
(OUT/'features.json').write_text(json.dumps(features,separators=(',',':')))
(DOC/'generation.json').write_text(json.dumps({**meta,'generationSeconds':round(time.perf_counter()-started,3),'numpy':np.__version__,'channelsCarved':len(channel_export),'lakeBasins':len(lake_export),'ridgeBranches':len(ridge_export)},indent=2)+'\n')
print(json.dumps({'generated':str(OUT.relative_to(ROOT)),'grid':meta['grid'],'range':meta['heightRangeM'],'seconds':round(time.perf_counter()-started,2),'masterSha256':meta['masterSha256']}))
