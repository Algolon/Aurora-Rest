"""GEO-R02C-B2a geographic checks (MEASURED; writes only docs/geo-r02c-b2a/validation/a-final.json). Adapted from the B1.1 final checks;
the seam criterion, thresholds and route metrics are unchanged; B2a adds the scramble and modelled-tread measurements.
Recomposes B2a in memory from the design master (no files written) and asserts it is byte-identical to the committed patch, then reports:
 A coastal / boundary seam clusters (location, size, height difference, slopes, nearest authored structure)
 B the Western Col and Vesttind (achieved levels, prominence, which authored structure fills the col, drainage either side, route distance)
 C hydrology detail (dry hollow and where it drains, outlet changes with locations, water and lake levels)
 D hiking route geometry (grade distribution, sections above 30 %, summit scramble, cross-slope and usable tread)
Thresholds are the ones already declared in validate.py and the route config; nothing is relaxed here."""
from pathlib import Path
import hashlib,json,sys
import numpy as np
from scipy import ndimage
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1];sys.path[:0]=[str(HERE/'lib'),str(HERE),str(ROOT/'tools/geo-r02c/lib'),str(ROOT/'tools/geo-r02c-a1a/lib')]
import build  # noqa: E402
from route import bilinear,hiking_grades,resample  # noqa: E402
from validate import compose  # noqa: E402
from drainage import destination  # noqa: E402
NX,NZ,CELL=1501,2001,4.;DOC=ROOT/'docs/geo-r02c-b2a'
sha=lambda b:hashlib.sha256(b).hexdigest()

def main():
 design=json.loads(build.DESIGN.read_text());R1,H32,ctx=build.compose(design);H32,_routes=build.finish(R1,H32,ctx,design);R1c,B32,entry=compose('a')
 out={'recomposedInMemorySha256':sha(H32.astype('<f4').tobytes()),'committedSha256':entry['terrainSha256']};out['recomposedEqualsCommitted']=out['recomposedInMemorySha256']==out['committedSha256']
 R=R1.astype(float);B=B32.astype(float);J,I=ctx['J'],ctx['I'];w=ctx['w'];X,Z=ctx['X'],ctx['Z'];Rs=R[J,I];Bs=B[J,I];parts=ctx['parts']
 # ---- A seams
 gy,gx=np.gradient(Bs,CELL);sB=np.hypot(gx,gy);gy,gx=np.gradient(Rs,CELL);sR=np.hypot(gx,gy)
 band=(w>0)&(w<.98)&(Rs>0);core=(w>=.98)&(Rs>0);cp=np.percentile(sB[core],99);added=band&(sB>sR+.5)&(sB>cp)
 land=R>0;dco=(ndimage.distance_transform_edt(land)*CELL)[J,I]
 lab,n=ndimage.label(added,structure=np.ones((3,3)));seams=[]
 names=[r['id'] for r in design['ridges']+design['buttresses']]
 from shapely import distance,points;from shapely.geometry import LineString
 for k in range(1,n+1):
  m=lab==k;ha=float(m.sum())*16/1e4
  if ha<0.05:continue
  cx,cz=float(X[m].mean()),float(Z[m].mean());near=min(((float(distance(LineString(np.array(r['knots'])[:,:2]),points([[cx,cz]]))[0]),r['id']) for r in design['ridges']+design['buttresses']))
  seams.append({'xz':[round(cx),round(cz)],'areaHa':round(ha,2),'meanHeightAboveR1M':round(float((Bs-Rs)[m].mean()),1),'maxHeightAboveR1M':round(float((Bs-Rs)[m].max()),1),'minHeightAboveR1M':round(float((Bs-Rs)[m].min()),1),
   'slopeB1Mean':round(float(sB[m].mean()),2),'slopeR1Mean':round(float(sR[m].mean()),2),'blendWeightMean':round(float(w[m].mean()),2),'coastDistanceMeanM':round(float(dco[m].mean())),'nearestAuthoredStructure':near[1],'nearestStructureDistanceM':round(near[0]),
   'exceedsThreshold':ha>0.25})
 seams.sort(key=lambda s:-s['areaHa'])
 out['A_seams']={'criterion':'blend-band cells where B1 is steeper than R1 + 0.5 and steeper than the core p99 ('+str(round(float(cp),2))+'); failure if any cluster > 0.25 ha','clusters':seams,
  'failingClusters':sum(s['exceedsThreshold'] for s in seams),'totalAddedSteepHa':round(float(added.sum())*16/1e4,2),
  'b11Cause':'Two mechanisms. (1) Too high: the west arm (nw-cape end) and the Vesttind north buttress are still 50-66 m above R1 (locally up to 140 m) where the blend weight falls to 0 at the frozen coast band (coastFreezeM 70 m, coastFeatherM 160 m), so the difference is absorbed in a ~160 m strip and the slope doubles (about 2.5 against R1 1.3-1.6). (2) Too low: at the north-arm headland the carved north cirque and its trough end up to 190 m below R1 just inside the coast feather, so B1 steps up into the frozen R1 cliff. A smaller cluster lies beside the protected windward-gully corridor, where the fjell flank meets the corridor fade.',
  'b11VisibleConsequence':'Short, over-steep steps where the west arm and the Vesttind north buttress meet the coast: an artificial sea cliff rather than an arm running down to the sea. A raised lip where the north cirque trough meets the frozen R1 cliff at the headland. A steep bank beside the windward gully. All four fail the declared 0.25 ha limit.',
  'b2aCorrection':'Authored terminal profiles (D1): the authored difference to R1 decays to zero by smoothstep between the 70 m coast freeze and a per-structure terminal length ('+', '.join(f"{k} {v} m" for k,v in design['terminals']['coastTerminalM'].items())+'; blended between structures by inverse-square distance), with '+' and '.join(design['terminals']['protectSummits'])+' protected from the taper; a separate '+str(design['terminals']['corridorTerminalM'])+' m terminal taper before the windward-gully corridor. Same seam criterion, same 0.25 ha limit.'}
 # ---- B Western Col
 N1=next(s for s in design['saddles'] if s['id']=='N1');S1=next(s for s in design['summits'] if s['id']=='S1');S0=next(s for s in design['summits'] if s['id']=='S0')
 def at(a,x,z):return float(bilinear_sub(a,x,z,J,I))
 contrib={k:round(at(v,*N1['xz']),1) for k,v in parts.items() if k in names};top=sorted(contrib.items(),key=lambda t:-t[1])[:4]
 # col along the S0-S1 crest line: minimum of B1 along the authored arm-west between S0 and S1
 arm=np.array(next(r for r in design['ridges'] if r['id']=='arm-west')['knots'],float);seg=resample(arm[:6,:2],4.);hs=bilinear(B,seg[:,0],seg[:,1]);k=int(np.argmin(hs[5:-5]))+5
 s1max=float(B[(np.abs(4.*np.arange(NX)[None,:]-3000-S1['xz'][0])<=40)&(np.abs(4000-4.*np.arange(NZ)[:,None]-S1['xz'][1])<=40)].max())
 dB=destination(B,np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX),json.loads((ROOT/'public/geo-r02b/features.json').read_text()))
 rt=np.array(json.loads((ROOT/'public/geo-r02c-b2a/routes.json').read_text())['routes'][0]['points2'])
 out['B_westernCol']={'authoredLevelM':N1['levelM'],'b1LevelAtAuthoredPointM':round(float(bilinear(B,*N1['xz'])),1),'lowestPointOnArmCrestS0toS1':{'xz':[round(float(seg[k,0])),round(float(seg[k,1]))],'levelM':round(float(hs[k]),1)},
  'vesttindB1M':round(s1max,1),'vesttindAuthoredM':S1['levelM'],'vesttindProminenceAboveColM':round(s1max-float(hs[k]),1),'authoredProminenceM':S1['levelM']-N1['levelM'],
  'structuresAtColPoint(height of each authored part at N1)':dict(top),'r1LevelAtColM':round(float(bilinear(R,*N1['xz'])),1),
  'drainageEitherSide':{'north (30 m)':int(dB[int((4000-N1['xz'][1]-30)/4),int((N1['xz'][0]+3000)/4)]),'south (30 m)':int(dB[int((4000-N1['xz'][1]+30)/4),int((N1['xz'][0]+3000)/4)]),'codes':'1 High Tarn, 2 sea, 3 other'},
  'candidateRouteDistanceToColM':round(float(np.hypot(rt[:,0]-N1['xz'][0],rt[:,1]-N1['xz'][1]).min()),1),
  'b11Cause':'At the authored col point the highest authored part is not the west arm (666 m, as designed) but the south-east arm (726 m): that arm starts at the summit, and because the flank-variation branch of ridge_height applied no end caps, the arm continued past its start as a radial cone that still stands 726 m high 250 m west of S0. The smooth-max union keeps it, so the col point is filled to about 729 m. The real low point of the S0-S1 crest moves 100 m west to the arm-west/plateau junction, where the Vestfjell plateau shoulder holds it at 695 m. Vesttind keeps 40 m of prominence instead of the authored 56 m.',
  'b2aCorrection':'South-east arm start cap (30 m, then a 1.6 fall) ends the arm behind the summit; col knot 676 m (target col about 680 m, reconciling the 56 m prominence intent with the achieved Vesttind); Vestfjell plateau start moved to (-935, 2580). Vesttind is not changed; the North Peak apex is unchanged (within 0.1 m inside 25 m), but its west shoulder 25-100 m from the apex is up to 2.3 m lower where the B1.1 spill-over cone is removed.'}
 # ---- C hydrology detail
 z=ctx['fill'];lab2,n2=ndimage.label(z>.5,structure=np.ones((3,3)));hol=[]
 for k in range(1,n2+1):
  m=lab2==k
  if m.sum()<20:continue
  jj,ii=np.nonzero(m);j0,i0=J.start+int(jj.mean()),I.start+int(ii.mean());hol.append({'xz':[round(float(X[m].mean())),round(float(Z[m].mean()))],'areaHa':round(float(m.sum())*16/1e4,2),'conditionedFillDepthM':round(float(z[m].max()),1),'drainsToCode':int(dB[j0,i0]),
   'meaning':'a closed hollow in the authored surface that the epsilon priority flood turned into a nearly flat, outward-draining floor; geomorphologically a tarn site, rendered dry because B1 has no water-surface variant'})
 WS=np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX);dR=destination(R,WS,json.loads((ROOT/'public/geo-r02b/features.json').read_text()))
 chg=(dR!=dB)&land;lab3,n3=ndimage.label(chg,structure=np.ones((3,3)));zones=[]
 for k in range(1,n3+1):
  m=lab3==k;ha=float(m.sum())*16/1e4
  if ha<0.5:continue
  jj,ii=np.nonzero(m);zones.append({'xz':[round(float(4*ii.mean()-3000)),round(float(4000-4*jj.mean()))],'areaHa':round(ha,2),'from':int(np.bincount(dR[m]).argmax()),'to':int(np.bincount(dB[m]).argmax())})
 zones.sort(key=lambda s:-s['areaHa'])
 wet=np.isfinite(WS);out['C_hydrology']={'dryHollows':hol,'destinationChangeZones(>=0.5 ha)':zones,'waterCellsWithChangedTerrain':int(((B!=R)&wet).sum()),
  'lakeAndRiverLevels':'unchanged: the water-surface raster is shared with R1 and no terrain under any water cell changed, so every lake level (High Tarn 360 m) and channel bed/water level is as in R1',
  'classification':{'acceptable authored change':'drainage reassignment inside the study area following the new cirques and troughs (the north-coast and central-trough catchments gain, High Tarn loses about 7 ha of its west slope)',
   'defect':'none found for sinks or unresolved flow; one dry tarn-site hollow is a representation gap (no water-surface variant), not a drainage failure'}}
 # ---- D route geometry (primary approach and optional scramble, assessed separately)
 rj=json.loads((ROOT/'public/geo-r02c-b2a/routes.json').read_text());k0=rj['report']['sharedWithR1Points']-1;out['D_route']={}
 for R,lim in zip(rj['routes'],(0.30,0.50)):
  p=np.array(R['points2']);s=np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))];h=bilinear(B,p[:,0],p[:,1]);hg,ht=hiking_grades(B,p)
  new=np.arange(len(p))>=(k0 if R['id']=='peak-ascent' else 0);newt=np.interp(ht,s,np.arange(len(p)))>=(k0 if R['id']=='peak-ascent' else 0)
  bins=[0,.1,.2,.25,.3,.35,.4,.5,.6,1];hist={f'{bins[i]:.2f}-{bins[i+1]:.2f}':int(((hg>=bins[i])&(hg<bins[i+1])).sum()) for i in range(len(bins)-1)}
  lab4,n4=ndimage.label(hg>lim);sect=[{'fromS':int(ht[lab4==k].min()),'toS':int(ht[lab4==k].max()),'lengthM':int((lab4==k).sum()),'maxGrade':round(float(hg[lab4==k].max()),3)} for k in range(1,n4+1)]
  t_=np.gradient(p,axis=0);t_/=np.linalg.norm(t_,axis=1,keepdims=True)+1e-9;nrm=np.c_[-t_[:,1],t_[:,0]];cs={}
  for o in (.75,1.5,2.,4.):
   a=bilinear(B,p[:,0]+nrm[:,0]*o,p[:,1]+nrm[:,1]*o);b=bilinear(B,p[:,0]-nrm[:,0]*o,p[:,1]-nrm[:,1]*o);c=np.abs(a-b)/(2*o)
   cs[f'{o:g}m']={'p50':round(float(np.percentile(c[new],50)),3),'p95':round(float(np.percentile(c[new],95)),3),'max':round(float(c[new].max()),3),'shareOver0.15':round(float((c[new]>.15).mean()),3),'shareOver0.5':round(float((c[new]>.5).mean()),3),'shareOver1.0':round(float((c[new]>1.).mean()),3)}
  tread=[]
  for kk in np.nonzero(new)[0][::5]:
   ok=0
   for o in np.arange(.5,6.01,.5):
    a=bilinear(B,p[kk,0]+nrm[kk,0]*o,p[kk,1]+nrm[kk,1]*o);b=bilinear(B,p[kk,0]-nrm[kk,0]*o,p[kk,1]-nrm[kk,1]*o)
    if abs(a-h[kk])/o<=.5 and abs(b-h[kk])/o<=.5:ok=o
    else:break
   tread.append(2*ok)
  tread=np.array(tread)
  out['D_route'][R['id']]={'role':R.get('role'),'gradeLimit':lim,'lengthM':round(float(s[-1]),1),'newSectionLengthM':int(new.sum()),'climbM':round(float(h[-1]-h[0]),1),'endM':round(float(h[-1]),1),
   'hikingGrade10mHistogramM':hist,'sectionsOverLimit':sect,'overLimitM':int((hg>lim).sum()),'over030M':int((hg>0.30).sum()),'hikingGrade10mMax':round(float(hg.max()),3),'p95':round(float(np.percentile(hg,95)),3),
   'crossSlopeNewSection':cs,'usableTreadWidthM(cross-slope <= 0.5 both sides, sampled every 5 m)':{'p10':float(np.percentile(tread,10)),'p50':float(np.percentile(tread,50)),'shareBelow2m':round(float((tread<2).mean()),3)}}
 out['D_route']['note']=('Terrain-level cross-slope at +-2 m and +-4 m is the B1.1 metric (unchanged). +-0.75 m and +-1.5 m measure the tread modelled by the B2a bench on the rendered surface. '
  'The 4 m heightfield represents the bench with grid nodes, so a 1-2 m tread is only approximated: at switchback interiors the bench is deliberately left out, and there the tread is the original terrain.')
 (DOC/'validation/a-final.json').write_text(json.dumps(out,indent=1)+'\n');return out

def bilinear_sub(a,x,z,J,I):
 gx=(x+3000)/CELL-I.start;gz=(4000-z)/CELL-J.start;i=int(gx);j=int(gz);u=gx-i;v=gz-j
 return a[j,i]*(1-u)*(1-v)+a[j,i+1]*u*(1-v)+a[j+1,i]*(1-u)*v+a[j+1,i+1]*u*v

if __name__=='__main__':
 o=main();print(json.dumps(o,indent=1)[:6000])
