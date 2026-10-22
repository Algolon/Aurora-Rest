"""Overlay freedom mask M (0..1) on the A1 window sub-grid. M is exactly 0 on every protected cell, so H = R1 + M*D never
moves a protected cell. Protected: outside window v2 and its 8 m ring, coast 0-150 m, every R1 equality cell (lakes,
channel sections, valley floors, pass, coast fringe) unless released by the spec, every R1 crest lower-bound cell, trail
corridors and frozen zones. Each class fades in over its own distance so edits meet protected terrain smoothly."""
import json
import numpy as np
import shapely
from shapely.geometry import Polygon,LineString,Point
from scipy.ndimage import distance_transform_edt
from grid import CELL,ROOT,sub_coords

def smoothstep(t):t=np.clip(t,0.,1.);return t*t*(3-2*t)

def window_weight(spec_window,X,Z):
 w=json.loads((ROOT/spec_window['file']).read_text());poly=Polygon(w['polygon']);ring,feather=w['frozenRingM'],w['featherM']
 pts=shapely.points(X.ravel(),Z.ravel());inside=(shapely.contains(poly,pts)|shapely.touches(poly,pts)).reshape(X.shape)
 edge=shapely.distance(poly.exterior,pts).reshape(X.shape)
 return np.where(inside&(edge>=ring),smoothstep((edge-ring)/feather),0.),{'polygon':w['polygon'],'ringM':ring,'featherM':feather}

def protected_classes(c,J,I,X,Z,spec,features,release=None,divides=None,water=None):
 """Boolean protected masks per class on the sub-grid. release: boolean sub-grid of valley-floor cells released by an operator."""
 fixed=c['fixed'][J,I];crest=c['crest'][J,I];land=c['land'][J,I];lake=c['lakehit'][J,I];wet=c['wet'][J,I];valley=c['valleyhit'][J,I]
 eq=fixed&~crest
 cls={'sea':~land,'lake':eq&lake,'wet':eq&wet&~lake,'valley':eq&valley&~lake&~wet,'crest':crest}
 cls['otherEquality']=eq&land&~cls['lake']&~cls['wet']&~cls['valley']
 if release is not None:cls['valley']=cls['valley']&~release
 routes={r['id']:r for r in features['routes']};pts=shapely.points(X.ravel(),Z.ravel());corr=np.zeros(X.shape,bool)
 for rid,half in spec['corridors'].items():corr|=(shapely.distance(LineString(routes[rid]['points2']),pts).reshape(X.shape)<half)
 cls['corridor']=corr;zones=np.zeros(X.shape,bool)
 for z in spec['frozenZones']:zones|=np.hypot(X-z['centre'][0],Z-z['centre'][1])<z['radiusM']
 cls['zone']=zones
 if divides is not None:cls['divide']=divides  # R1 catchment divides (D8 destination boundaries): no rerouting
 if water is not None:cls['waterSurface']=np.isfinite(water)&land  # every cell where R1 defines a water surface
 return cls

def freedom(c,J,I,spec,features,release=None,falloff_override=None,divides=None,water=None):
 """Returns (M, report). falloff_override: optional (region_bool, {class: metres}) for a released operator region."""
 X,Z=sub_coords(J,I);ww,winfo=window_weight(spec['window'],X,Z)
 sd=c['sd'][J,I];cb=spec['coast'];wc=np.where(sd<cb['frozenM'],0.,smoothstep((sd-cb['frozenM'])/(cb['taperToM']-cb['frozenM'])))
 cls=protected_classes(c,J,I,X,Z,spec,features,release,divides,water);M=ww*wc;fall=spec['falloffM']
 for name,mask in cls.items():
  if name=='sea' or not mask.any():continue
  d=distance_transform_edt(~mask)*CELL;f=np.full(X.shape,float(fall[name]))
  if falloff_override is not None and name in falloff_override[1]:f=np.where(falloff_override[0],falloff_override[1][name],f)
  M=M*smoothstep(d/f)
 for name,mask in cls.items():M[mask]=0.  # exact zero on every protected cell, whatever the falloff arithmetic gives
 rep={'window':winfo,'protectedCells':{k:int(v.sum()) for k,v in cls.items()},'freeCells':int((M>0).sum())}
 return M,cls,rep
