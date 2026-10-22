"""Rebuild the R1 review from measured data and unretouched browser captures."""
from pathlib import Path
import json,csv,hashlib,subprocess,html,sys,os
sys.path.insert(0,os.environ.get('AURORA_PY_TOOLS','/private/tmp/aurora-r02b-tools'))
import numpy as np
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'docs/geo-r02b-r1';B=ROOT/'docs/geo-r02b';P=ROOT/'public/geo-r02b'
def read(p):return json.loads(p.read_text())
f=read(P/'features.json');v=read(D/'terrain-validation.json');water_review=read(D/'water-integrity.json');i=read(D/'integrity.json');old=read(B/'terrain-validation.json');routes=read(D/'route-candidates.json')['routes'];runtime=read(D/'evidence/runtime.json');verification=read(D/'verification-results.json');head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
# Exportable scientific sections, explicitly separate from browser images.
newrows=list(csv.DictReader((D/'route-profiles-full.csv').open()));oldrows=list(csv.DictReader((B/'hiking-profiles.csv').open()));profile_svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1000" viewBox="0 0 1100 1000"><rect width="1100" height="1000" fill="#f6f4ee"/><g font-family="Arial" fill="#24363b"><text x="30" y="30" font-size="22">Six terrain / crossing elevation profiles</text><text x="30" y="53" font-size="13">red: original prototype / original centreline · blue: R1 candidate · purple: R1 width or transverse-slope conflict</text>']
for idx,r in enumerate(i['routes']):
 x=40+(idx%2)*540;y=90+(idx//2)*300;rr=[p for p in newrows if p['route']==r['id']];oo=[p for p in oldrows if p['route']==r['id']];a=np.array([[float(p['east_m']),float(p['north_m'])] for p in oo]);old_d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(a,axis=0),axis=1))] if len(a)>1 else np.array([0]);old_h=np.array([float(p['terrain_or_deck_m']) for p in oo]);new_d=np.array([float(p['distance_m']) for p in rr]);new_h=np.array([float(p['height_m']) for p in rr]);length=max(old_d.max(),new_d.max());lo=min(old_h.min(),new_h.min(),0);hi=max(old_h.max(),new_h.max())+10
 def point(d,h):return [x+45+d/length*440,y+190-(h-lo)/(hi-lo)*150]
 def path(ds,hs):return ' '.join(f'{xx:.2f},{yy:.2f}' for xx,yy in [point(d,h) for d,h in zip(ds,hs)])
 profile_svg.append(f'<text x="{x}" y="{y}" font-size="17">{html.escape(r["id"])}</text><text x="{x}" y="{y+21}" font-size="12">max {r["maxGrade"]*100:.1f}% / target {r["targetGrade"]*100:.0f}% · wet {r["wetSamples"]} · width pass {r["widthAndTransverse35PercentPassFraction"]*100:.1f}%</text><path d="M{x+45},{y+40}V{y+190}H{x+485}" fill="none" stroke="#9aa6a5"/><text x="{x}" y="{y+55}" font-size="11">{hi:.0f} m</text><text x="{x+45}" y="{y+210}" font-size="11">0</text><text x="{x+415}" y="{y+210}" font-size="11">{length/1000:.2f} km</text><polyline points="{path(old_d,old_h)}" fill="none" stroke="#bc7972" stroke-width="1.5"/><polyline points="{path(new_d,new_h)}" fill="none" stroke="#216d83" stroke-width="1.8"/>')
 for k in range(0,len(rr),10):
  if rr[k]['width_ok']=='False':
   xx,yy=point(new_d[k],new_h[k]);profile_svg.append(f'<circle cx="{xx:.2f}" cy="{yy:.2f}" r="1.6" fill="#a7448b"/>')
profile_svg.append('</g></svg>');(D/'route-profiles.svg').write_text(''.join(profile_svg))
sections=list(csv.DictReader((D/'before-sections.csv').open()));H=np.fromfile(P/'terrain.f32',dtype='<f4').reshape(2001,1501);svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1300"><rect width="1100" height="1300" fill="#f6f4ee"/><g font-family="Arial" fill="#24363b"><text x="30" y="28" font-size="22">Matched east–west sections through seven original depressions</text><text x="30" y="49" font-size="13">Measured canonical heights · red: checkpoint 7438e6a · blue: R1 · no conceptual imagery</text>']
for k in range(1,8):
 rr=[q for q in sections if int(q['sink'])==k];xx=np.array([float(q['x']) for q in rr]);zz=float(rr[0]['z']);before=np.array([float(q['coast']) for q in rr]);after=H[round((4000-zz)/4),np.rint((xx+3000)/4).astype(int)];lo=min(before.min(),after.min());hi=max(before.max(),after.max())+1;y=80+(k-1)*170
 def path(h):return ' '.join(f'{70+(x-xx[0])/1200*980:.2f},{y+130-(v-lo)/(hi-lo)*100:.2f}' for x,v in zip(xx,h))
 svg.append(f'<text x="35" y="{y}" font-size="15">{k} · north z = {zz:.0f} m · heights {lo:.0f}–{hi:.0f} m</text><polyline points="{path(before)}" fill="none" stroke="#bc7972" stroke-width="2"/><polyline points="{path(after)}" fill="none" stroke="#216d83" stroke-width="2"/><text x="70" y="{y+150}" font-size="11">east x {xx[0]:.0f} m</text><text x="945" y="{y+150}" font-size="11">{xx[-1]:.0f} m</text>')
svg.append('</g></svg>');(D/'depression-sections.svg').write_text(''.join(svg))
# Explicit acceptance gates: software passing does not accept geographic defects.
gates={'terrainContinuity':'pass shared canonical vertices/normals and finite field; local slope is measured separately','hydrology':'conditional: seven original large depressions removed; review small residual depressions, watershed fidelity and fine bed ripples','coast':'conditional: clipped water interfaces verified; inspect rocky mouth transitions and measured coast exceptions','geomorphology':'visual review required; joint flanks improve continuity, but smoothness and ridge control transitions remain visible','traversability':'centreline and runtime results below; full widths not accepted where transverse slope fails','visualQuality':'matched eight-view review required; no automatic art acceptance','regression':'source master, coast/lake/channel curves and regional identities retained; ridge elevations are constrained lower bounds, deviations measured','technical':'tests/build/reproducibility results recorded; browser evidence required; no physical Android validation'}
acceptance={'milestone':'GEO-R02B-R1','status':'review candidate — not fully accepted','gates':gates,'sourceHead':head,'terrainSha256':f['meta']['terrainSha256'],'centrelinePassCount':sum(r['centrelinePass'] for r in i['routes']),'fullWidthPassCount':sum(r['fullCorridorPass'] for r in i['routes']),'materialDepressions4m':i['depressions'][-1]['count'],'smallerDepressions4m':i['depressions'][-1]['smallerDepressionsAbove0_1mAnd64m2'],'noMergeOrDeployment':True};(D/'acceptance.json').write_text(json.dumps(acceptance,indent=2)+'\n')
route_table='\n'.join(f"|{r['id']}|{r['lengthM']/1000:.2f}|{r['maxGrade']*100:.1f}%|{r['targetGrade']*100:.0f}%|{r['wetSamples']}|{r['widthAndTransverse35PercentPassFraction']*100:.1f}%|" for r in i['routes'])
change_table='\n'.join(f"|{r['id']}|{r['maximumDepartureM']:.1f}|{r['outsideOriginalReservationFraction']*100:.2f}%|{r['endpointsPreserved']}|" for r in routes)
crest_worst=sorted(i['crestKnotMeasurements'],key=lambda r:abs(r['deltaM']),reverse=True)[:8]
crest_table='\n'.join(f"|{r['ridge']}|{r['xz']}|{r['authoredM']:.1f}|{r['actualM']:.1f}|{r['deltaM']:+.1f}|" for r in crest_worst)
catch_table='\n'.join(f"|{r['id']}|{r['fractionReachingExpectedSystem']*100:.1f}%|{r['fractionUnresolvedClosed']*100:.1f}%|" for r in v['downhillCatchmentChecks20m'])
banks=sum(r['bankSamplesBelowWater'] for r in v['bankChecks']);micro=i['depressions'][-1]['smallerDepressionsAbove0_1mAnd64m2'];controller=next((c for c in runtime['checks'] if c['name']=='six complete runtime controller route checks'),{})
md=f'''# GEO-R02B-R1 — Terrain integrity and organic landform correction

**Review candidate. The original seven large depressions are corrected; full artistic and walking-corridor approval remains open.** [Open matched before/after browser review](review.html). No merge, deployment, nature population or GEO-R02C work was performed.

## Evidence and preserved checkpoint

Baseline: `7438e6ae89a64f7ddeecd4b738e9480d9c713e7c` on `codex/geo-r02b-a-r1-terrain-skeleton`, remote `Algolon/Aurora-Rest`. Read-only preflight inspected all eight prior renders, complete local branch history, worktrees, instructions, generation ordering, original master and provenance. [Preflight](preflight.json), [root causes](ROOT_CAUSES.md), [stage-by-stage measurements](stage-depressions.json) and [cross-sections](depression-sections.svg) record the diagnosis before correction. Instrumenting the original generator reproduced its exact binary digest. Original GEO-R02B documentation, browser images and A-R1 files remain preserved. WORLD-01B source and original design outputs are unchanged.

Master `aurora-rest-concept-a-r1`, GEO-R02A-R1.1, SHA-256 `62cb154b4ab6473ae7e2507449cea5407774503cdc09fe42f09adbde0a0ec598`. The unchanged source adapter is pinned in [baseline-features.json](baseline-features.json). All 16 ridge branches, 13 channels, four lakes, eight catchments, four offshore island groups and six destinations are retained. North up/east right; 600 × 800 planning grid; `x=10u-3000`, `z=4000-10v`; 6 × 8 km envelope.

## Corrected construction

Independent maximum-union ridge tents, polygon valley cuts, raised channel supports and final coastal attenuation previously imposed contradictory elevations. The new generator solves a shared positive-weight harmonic field between authored crests, broad valley floors, lake shores, pass and coastline. All inland ridge controls outside explicit valley/water constraints impose lower bounds: low endpoints rise where required by connected terrain rather than forming pits, while high northern crowns retain their designed elevation. The coarse 16 m obstacle solve is refined at 4 m with the same constraints. The western Cairn approach continues 150 m down its existing side-valley direction, removing the artificial closed end cap while retaining its 170 m control. It does not fill depressions, erode the island, flatten routes or add procedural noise.

Channels use continuous closest-segment elevation projection and continuous transverse sections. Valley constraints leave a free transition between competing river systems, so the low main valley cannot overwrite a higher tributary bank. Lake rims remain above their level except at the cut inlet/outlet. Coastal gradients differ for exposed rock, sheltered coast and eastern sand. Coast conditions precede water sections; no attenuation modifies carved beds afterward.

Water is clipped against the exact canonical terrain triangles, with planar lakes and a continuous channel surface field. Ocean-side water is fixed at 0 m, preventing an uphill river interpolation apron from floating over the sea. The render offset is 0.025 m. The maximum computed terrain/water shoreline intersection error is {f['waterMesh']['maxComputedShoreIntersectionErrorM']:.2g} m; actual float32 vertices are independently checked against terrain in tests. Open domain triangles above sea: {f['waterMesh']['openDomainAboveSeaTriangles']}. The {f['waterMesh']['openDomainTriangles']} sea-level domain-edge triangles are covered by the ocean plane. This geometric check is not a discharge, flood or erosion simulation.

The integrity checkpoint renders the same 4 m canonical mesh used for contact. Mixed-resolution skirts are removed; neighbouring tile edge positions and normals match exactly. This costs performance and is not the final Android terrain renderer. Diagnostic crossing decks include measured bank-to-span ramps, with 3.5 m clear width. They remain greybox proposals.

Explicit interpretations: streams retain the prototype's minimum 16 m wetted planning width; bed depth is 1.6 m for this resolved grid. Small final streams need finer conforming geometry and depth review. Lake shores can move by several metres from their vector lines at grid resolution. Ridge curves and intended elevations remain in the source; actual terrain deviations below are not silently treated as source changes.

## Hydrology and coast

Material dry depressions (depth >2 m and area ≥800 m²): 0 at 20 m, 8 m and canonical 4 m sampling. All seven original pockets are absent. The smaller-depression check uses >0.1 m and ≥64 m²: **{micro['count']} residual components**, maximum {micro['maximumDepthM']:.3f} m, total {micro['totalAreaM2']} m². Their coordinates and areas are in [integrity.json](integrity.json). The unrestricted “no unintended closed depressions” claim remains limited by the stated resolution and secondary threshold. Any listed residual requires review.

The actual raster-surface profiles, connected wet components and lake planarity are checked independently in [water-integrity.json](water-integrity.json). All 13 authored water profiles descend; {sum(c['samplesWithBedAboveWater'] for c in v['channels'])} centreline samples stand above water. Lake inner-shore and non-outlet rim failures: {sum(c['innerShoreBedAboveWaterCount'] for c in v['lakes'])} / {sum(c['unintendedLowRimSamples25m'] for c in v['lakes'])}. Levels remain High Tarn 360 m, Hidden Fold 118 m, Birchwood 86 / 48 m. Fine bed rises are listed per segment in [terrain-validation.json](terrain-validation.json); tiny raster ripples are not described as perfect hydraulic validation.

The original bank-probe convention still reports {banks} low probes. Their measured classification is `{json.dumps(water_review["legacyLowBankClassifications"],separators=(",",":"))}`; all locations are in [water-integrity.json](water-integrity.json). It compares against the authored centre sample, including some probes beyond the coastline or in overlapping junction sections; it is retained for comparison, not erased. Clipped-interface and actual water-surface checks are additional evidence, not a claim that the old bank/flood assumptions were validated. Review rocky chutes, lower wetland junctions and physical bankfull widths separately.

Coast normal checks: median absolute zero-contour shift {i['coast']['medianAbsoluteDeviationM']:.2f} m, P95 {i['coast']['p95AbsoluteDeviationM']:.2f} m, maximum measured {i['coast']['maxAbsoluteDeviationM']:.2f} m; {i['coast']['zeroCrossingsWithin16m']} / {i['coast']['sampledNormals']} normals find a sea-level crossing within 16 m. All exceptions over 4 m or without a crossing are located in integrity.json. River-mouth notches and sharp local coastal geometry require visual review; broad A-R1 bays/capes are unchanged.

D8 catchment diagnostics remain approximate. Arrival at a designed channel follows its separately checked downstream graph. These values show watershed-mask mismatch and small closed descents; they are not a fluid simulation or a newly approved watershed plan.

|Catchment|Reaches intended system|Unresolved closed descent|
|---|---|---|
{catch_table}

## Six walking proposals and crossing constraints

All route elevations use the actual 4 m triangle diagonal and crossing ramps. [Full profiles](route-profiles.svg), [one-metre CSV](route-profiles-full.csv) and [candidate geometry / search legs](route-candidates.json) preserve exact measurements. The route planner modifies paths only. It tests the original reservation first, then reports controlled wider searches; no route changes terrain elevation.

|Route|Length km|Max grade|Target|Wet samples|3.4 m dry band with ≤35% transverse grade|
|---|---|---|---|---|---|
{route_table}

A centreline grade pass does not accept its whole walking width. Purple markers identify narrow or steep transverse sections. Longitudinal grades are feasible candidates where dry, but summit traverses and several flank sections still need a measured narrow trail bench or a different reservation. Broad mountain flattening is not proposed. Full-width approval is withheld wherever the table is below 100%; conflict coordinates and cross-grades are in integrity.json. The terrain foundation is therefore not certified as fully playable across all six corridors.

|Route|Maximum departure from original m|Samples outside original half-width|Original endpoints preserved|
|---|---|---|---|
{change_table}

M1/H1/H2 use the same authored crossing positions. Ramp lengths, levels, bank heights and grades are in [route-candidates.json](route-candidates.json). Browser controller traversal: `{json.dumps(controller.get('results',[]),separators=(',',':'))}`. This checks the actual walk collision function; width, water capacity and final bridge engineering remain separate gates.

## Geomorphology and regional review

The shared solution removes the large inter-ridge low pockets, the engineered channel support berms and repetitive valley boundary walls. Central Valley has a continuous broad floor; Hidden Fold's lake, enclosing crests and outlet gorge connect through one field. Cairn Saddle measures {v['pass']['saddle']:.2f} m, northern flank {v['pass']['north-flank']:.2f} m, southern flank {v['pass']['south-flank']:.2f} m; approaches {v['pass']['approach-0']:.2f} / {v['pass']['approach-1']:.2f} m. These closely match 215 / 330 / 285 / 170 / 155 m proposals.

The neutral ground views are the artistic decision evidence. Harmonic slopes can still be too smooth or show sharp changes at hard floor/crest constraints. North Peak needs review for asymmetric buttresses and subsidiary valley rhythm; South Shoulder for convincing lower rock structure; High Tarn for the transition from inlet gullies to its elevated basin. Home Cove and the eastern sandy zone remain deliberately unpopulated greybox landforms. Improved numerical continuity alone does not establish fidelity to the original illustration.

One source conflict remains at the South low tail: authored endpoint x=450 / z=-3440 m proposes +8 m outside the approved mainland footprint. Coastline authority is preserved there; its measured terrain is below sea level. Proposed source correction for review: move the endpoint inland or end the crest at the coast. The master is not edited.

Largest measured crest-knot deviations (positive values arise where a low authored tail sits inside a higher connected massif; water/valley intersections can override a crest equality):

|Ridge|x/z m|Authored m|Actual m|Difference m|
|---|---|---|---|---|
{crest_table}

## Actual browser comparison and diagnostics

Eight unretouched Chromium WebGL images use the original x/z, yaw, pitch, overview and oblique camera specifications at 1600 × 1200. Ground eye height follows the corrected ground +1.75 m; it is not a fixed absolute altitude. The review pairs them with the unchanged baseline images. Height, slope, downhill arrows, depression locations, river/terrain alignment and route conflicts are additional actual browser captures. Scientific SVG profiles are clearly labelled separately.

Browser errors: {len(runtime['errors'])}. Render system: {runtime['measurements'][0]['renderer']}. Software WebGL timings do not validate desktop hardware or physical Android performance. No physical Android measurements were made.

## Tests, reproducibility and stop

{verification['testsSummary']} {verification['buildSummary']} Nineteen retained tests concern WORLD-01B; five concern GEO-R02B/R1 mesh contact, edge continuity, source/digest preservation and actual clipped water geometry. Software tests do not accept artistic defects.

Terrain SHA-256: `{f['meta']['terrainSha256']}`. Independent repeat: {verification['reproducibilitySummary']}. [Verification details](verification-results.json) and [runtime evidence](evidence/runtime.json) record observed source hashes. The source implementation checkpoint used for captures is `{runtime['observedHead']}`.

Reproduce using Node 24+, Python with the pinned original `tools/geo-r02b/requirements.txt`, then:

```sh
npm ci
python3 tools/geo-r02b-r1/generate.py
python3 tools/geo-r02b-r1/water.py
python3 tools/geo-r02b-r1/routes.py
python3 tools/geo-r02b-r1/validate.py
python3 tools/geo-r02b-r1/water-integrity.py
python3 tools/geo-r02b-r1/integrity.py
npm test
npm run build
npm run dev -- --port 4197 --strictPort
# separate terminal; CHROME and WORLD_URL can override executable / local URL
node tools/geo-r02b-r1/capture.mjs
python3 tools/geo-r02b-r1/report.py
```

Recommendation: review the corrected geographic foundation visually and technically, while withholding full acceptance for the documented hydrological limits, catchment mismatch, route widths and remaining smooth/constraint-driven landform appearance. This checkpoint stops at GEO-R02B-R1. No merge, deployment or next milestone is authorized.
'''
(D/'README.md').write_text(md)
views=['overview','island-oblique','home-cove','central-valley','cairn-saddle','high-tarn','hidden-fold','mirelands'];gallery=''.join(f'<section><h2>{name.replace("-"," ").title()}</h2><div class="pair"><figure><a href="../geo-r02b/evidence/{name}.png"><img loading="lazy" src="../geo-r02b/evidence/{name}.png"></a><figcaption>Before · GEO-R02B / 7438e6a</figcaption></figure><figure><a href="evidence/{name}.png"><img loading="lazy" src="evidence/{name}.png"></a><figcaption>After · GEO-R02B-R1</figcaption></figure></div></section>' for name in views)
diag=''.join(f'<figure><a href="evidence/diagnostic-{name}.png"><img loading="lazy" src="evidence/diagnostic-{name}.png"></a><figcaption>{name}</figcaption></figure>' for name in ['height','slope','drainage','depressions','water','failures'])
(D/'review.html').write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Aurora Rest · GEO-R02B-R1 review</title><style>body{{margin:0;background:#e9ece7;color:#21383c;font:16px/1.5 system-ui}}main{{max-width:1500px;margin:auto;padding:30px}}h1,h2{{line-height:1.2}}a{{color:#175f76}}.pair,.diagnostics{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}figure{{margin:0;background:#fff;padding:7px}}img{{display:block;width:100%;height:auto}}figcaption{{padding:8px}}section{{margin:44px 0}}.notice{{background:#fff0cf;padding:20px;border-left:5px solid #b78431}}@media(max-width:850px){{.pair,.diagnostics{{grid-template-columns:1fr}}}}</style><main><h1>Aurora Rest · GEO-R02B-R1</h1><p class="notice"><b>Review candidate — full acceptance remains open.</b> Seven original large depressions corrected. Route centreline improvement is separate from route-width approval. Read <a href="README.md">the technical review</a>, <a href="ROOT_CAUSES.md">root causes</a> and <a href="acceptance.json">acceptance gates</a>.</p><p><a href="../../geo-r02b.html">Open interactive Three.js terrain</a> · <a href="#diagnostics">Diagnostics</a> · <a href="#profiles">Elevation profiles</a></p><p>Eight actual browser captures, matched cameras, 1600 × 1200. Click an image for its original. Ground cameras retain x/z and viewing angles; eye altitude follows the corrected ground.</p>{gallery}<section id="diagnostics"><h2>Actual browser diagnostics</h2><p>Height: blue low / red high. Slope: green &lt;12%, yellow &lt;25%, orange &lt;35%, red &lt;60%, purple steeper. Drainage arrows: sampled downhill directions. Gold depression crosses: seven original locations; red: remaining dry depressions including the smaller diagnostic threshold. River alignment: blue surface / orange bed. Route conflicts: green candidate / purple width or transverse slope / red longitudinal grade.</p><div class="diagnostics">{diag}</div></section><section id="profiles"><h2>Scientific diagnostic figures</h2><p>These plots are heightfield measurements, separate from the browser images.</p><img src="route-profiles.svg"><img src="depression-sections.svg"></section><section><h2>Geographic references</h2><div class="pair"><figure><img src="../geo-r02b/reference-a-r1.png"><figcaption>Approved A-R1 geography</figcaption></figure><figure><img src="../evidence/world-01b/reference-island.png"><figcaption>Original Aurora Rest illustration</figcaption></figure></div></section><p>Stop: GEO-R02B-R1 visual and technical review. No merge, deployment or world population.</p></main></html>''')
print('R1 report, matched browser gallery and scientific profiles written.')
