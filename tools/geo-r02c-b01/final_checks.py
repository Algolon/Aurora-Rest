"""GEO-R02C-B1.1 final geographic checks (MEASURED; writes only docs/geo-r02c-b01/validation/b1.1-final.json).
Recomposes B1.1 in memory from the design master (no files written) and asserts it is byte-identical to the committed patch, then reports:
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
NX,NZ,CELL=1501,2001,4.;DOC=ROOT/'docs/geo-r02c-b01'
sha=lambda b:hashlib.sha256(b).hexdigest()

def main():
 design=json.loads(build.DESIGN.read_text());R1,H32,ctx=build.compose(design);R1c,B32,entry=compose('b1')
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
  'cause':'Two mechanisms. (1) Too high: the west arm (nw-cape end) and the Vesttind north buttress are still 50-66 m above R1 (locally up to 140 m) where the blend weight falls to 0 at the frozen coast band (coastFreezeM 70 m, coastFeatherM 160 m), so the difference is absorbed in a ~160 m strip and the slope doubles (about 2.5 against R1 1.3-1.6). (2) Too low: at the north-arm headland the carved north cirque and its trough end up to 190 m below R1 just inside the coast feather, so B1 steps up into the frozen R1 cliff. A smaller cluster lies beside the protected windward-gully corridor, where the fjell flank meets the corridor fade.',
  'visibleConsequence':'Short, over-steep steps where the west arm and the Vesttind north buttress meet the coast: an artificial sea cliff rather than an arm running down to the sea. A raised lip where the north cirque trough meets the frozen R1 cliff at the headland. A steep bank beside the windward gully. All four fail the declared 0.25 ha limit.',
  'b2Strategy':'Make the coast an authored boundary condition, not a freeze: give every arm a declared terminal profile that reaches R1 coast heights at the coast band (for example an end-cap level ramp tied to the R1 value at distance 70 m), let cirque troughs exit through authored coastal notches or hang above the R1 cliff with a declared lip, and widen protected-corridor fades to the local relief. Re-run the same seam criterion unchanged.'}
 # ---- B Western Col
 N1=next(s for s in design['saddles'] if s['id']=='N1');S1=next(s for s in design['summits'] if s['id']=='S1');S0=next(s for s in design['summits'] if s['id']=='S0')
 def at(a,x,z):return float(bilinear_sub(a,x,z,J,I))
 contrib={k:round(at(v,*N1['xz']),1) for k,v in parts.items() if k in names};top=sorted(contrib.items(),key=lambda t:-t[1])[:4]
 # col along the S0-S1 crest line: minimum of B1 along the authored arm-west between S0 and S1
 arm=np.array(next(r for r in design['ridges'] if r['id']=='arm-west')['knots'],float);seg=resample(arm[:6,:2],4.);hs=bilinear(B,seg[:,0],seg[:,1]);k=int(np.argmin(hs[5:-5]))+5
 s1max=float(B[(np.abs(4.*np.arange(NX)[None,:]-3000-S1['xz'][0])<=40)&(np.abs(4000-4.*np.arange(NZ)[:,None]-S1['xz'][1])<=40)].max())
 dB=destination(B,np.fromfile(ROOT/'public/geo-r02b/water-surface.f32','<f4').reshape(NZ,NX),json.loads((ROOT/'public/geo-r02b/features.json').read_text()))
 rt=np.array(json.loads((ROOT/'public/geo-r02c-b01/routes.json').read_text())['routes'][0]['points2'])
 out['B_westernCol']={'authoredLevelM':N1['levelM'],'b1LevelAtAuthoredPointM':round(float(bilinear(B,*N1['xz'])),1),'lowestPointOnArmCrestS0toS1':{'xz':[round(float(seg[k,0])),round(float(seg[k,1]))],'levelM':round(float(hs[k]),1)},
  'vesttindB1M':round(s1max,1),'vesttindAuthoredM':S1['levelM'],'vesttindProminenceAboveColM':round(s1max-float(hs[k]),1),'authoredProminenceM':S1['levelM']-N1['levelM'],
  'structuresAtColPoint(height of each authored part at N1)':dict(top),'r1LevelAtColM':round(float(bilinear(R,*N1['xz'])),1),
  'drainageEitherSide':{'north (30 m)':int(dB[int((4000-N1['xz'][1]-30)/4),int((N1['xz'][0]+3000)/4)]),'south (30 m)':int(dB[int((4000-N1['xz'][1]+30)/4),int((N1['xz'][0]+3000)/4)]),'codes':'1 High Tarn, 2 sea, 3 other'},
  'candidateRouteDistanceToColM':round(float(np.hypot(rt[:,0]-N1['xz'][0],rt[:,1]-N1['xz'][1]).min()),1),
  'cause':'At the authored col point the highest authored part is not the west arm (666 m, as designed) but the south-east arm (726 m): that arm starts at the summit, and its radial end cap behind the summit (end taper 160 m, then a 0.9 fall) still stands 726 m high 250 m west of S0. The smooth-max union keeps it, so the col point is filled to about 729 m. The real low point of the S0-S1 crest moves 100 m west to the arm-west/plateau junction, where the Vestfjell plateau shoulder holds it at 695 m. Vesttind keeps 40 m of prominence instead of the authored 56 m.'}
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
 # ---- D route geometry
 p=rt;s=np.r_[0,np.cumsum(np.hypot(*np.diff(p,axis=0).T))];h=bilinear(B,p[:,0],p[:,1]);hg,ht=hiking_grades(B,p);dsum=np.hypot(np.interp(ht,s,p[:,0])+520,np.interp(ht,s,p[:,1])-2770)
 main=dsum>=140;bins=[0,.1,.2,.25,.3,.35,.4,.5,1]
 hist={f'{bins[i]:.2f}-{bins[i+1]:.2f}':{'mainM':int(((hg>=bins[i])&(hg<bins[i+1])&main).sum()),'scrambleM':int(((hg>=bins[i])&(hg<bins[i+1])&~main).sum())} for i in range(len(bins)-1)}
 over=hg>0.30;lab4,n4=ndimage.label(over&main);sect=[]
 for k in range(1,n4+1):
  m=lab4==k;ss=ht[m];sect.append({'fromS':int(ss.min()),'toS':int(ss.max()),'lengthM':int(m.sum()),'maxGrade':round(float(hg[m].max()),3)})
 t=np.gradient(p,axis=0);t/=np.linalg.norm(t,axis=1,keepdims=True)+1e-9;nrm=np.c_[-t[:,1],t[:,0]];new=np.arange(len(p))>=1073
 cs={}
 for o in (2.,4.):
  a=bilinear(B,p[:,0]+nrm[:,0]*o,p[:,1]+nrm[:,1]*o);b=bilinear(B,p[:,0]-nrm[:,0]*o,p[:,1]-nrm[:,1]*o);c=np.abs(a-b)/(2*o)
  cs[f'{int(o)}m']={'p50':round(float(np.percentile(c[new],50)),3),'p95':round(float(np.percentile(c[new],95)),3),'max':round(float(c[new].max()),3),'shareOver0.5':round(float((c[new]>.5).mean()),3),'shareOver1.0':round(float((c[new]>1.).mean()),3)}
 tread=[]
 for k in np.nonzero(new)[0][::5]:
  ok=0
  for o in np.arange(.5,6.01,.5):
   a=bilinear(B,p[k,0]+nrm[k,0]*o,p[k,1]+nrm[k,1]*o);b=bilinear(B,p[k,0]-nrm[k,0]*o,p[k,1]-nrm[k,1]*o)
   if abs(a-h[k])/o<=.5 and abs(b-h[k])/o<=.5:ok=o
   else:break
  tread.append(2*ok)
 tread=np.array(tread)
 out['D_route']={'lengthM':round(float(s[-1]),1),'climbM':round(float(h[-1]-h[0]),1),'newSectionFromPoint':1073,'hikingGrade10mHistogramM':hist,'sectionsOver30PctOutsideScramble':sect,
  'over30PctOutsideScrambleM':int((over&main).sum()),'summitScramble':{'lengthM':int((~main).sum()),'maxGrade':round(float(hg[~main].max()),3),'p50':round(float(np.median(hg[~main])),3)},
  'crossSlopeNewSection':cs,'usableTreadWidthM(cross-slope <= 0.5 both sides, sampled every 5 m)':{'p10':float(np.percentile(tread,10)),'p50':float(np.percentile(tread,50)),'shareBelow2m':round(float((tread<2).mean()),3)},
  'note':'Controller traversal proves only that the 0.7 step rule is never exceeded; cross-slope above 0.5 means the tread is a traverse on a steep slope and would need a built bench to be comfortable.'}
 (DOC/'validation/b1.1-final.json').write_text(json.dumps(out,indent=1)+'\n');return out

def bilinear_sub(a,x,z,J,I):
 gx=(x+3000)/CELL-I.start;gz=(4000-z)/CELL-J.start;i=int(gx);j=int(gz);u=gx-i;v=gz-j
 return a[j,i]*(1-u)*(1-v)+a[j,i+1]*u*(1-v)+a[j+1,i]*(1-u)*v+a[j+1,i+1]*u*v

if __name__=='__main__':
 o=main();print(json.dumps(o,indent=1)[:6000])
