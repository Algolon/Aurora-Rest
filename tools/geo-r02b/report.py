"""Build the review report from measured artifacts. No terrain/source edits."""
from pathlib import Path
import json,hashlib,html,csv,math,subprocess
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02b';v=json.loads((DOC/'terrain-validation.json').read_text());g=json.loads((DOC/'generation.json').read_text());r=json.loads((DOC/'evidence/runtime.json').read_text());pre=json.loads((DOC/'source-preflight.json').read_text());d=json.loads((ROOT/'public/geo-r02b/features.json').read_text())
assert r['measurements'][0]['terrainSha256']==g['terrainSha256']==v['terrainSha256'],'Evidence/terrain hashes disagree; recapture the current field.'
assert len(r['measurements'])==8 and all(x['passed'] for x in r['checks']) and not r['errors']
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,row))+' |' for row in rows)
def pct(x):return f'{x*100:.1f}%'
bankfails=sum(c['bankSamplesBelowWater'] for c in v['bankChecks']);channelcount=sum(c['samplesWithBedAboveWater'] for c in v['channels']);lakefail=sum(l['innerShoreBedAboveWaterCount']+l['unintendedLowRimSamples25m'] for l in v['lakes'])
report=f'''# GEO-R02B — Concept A-R1 terrain skeleton, checkpoint 1

**Recommendation: preserve this review checkpoint; do not accept the terrain for world population.** A-R1's geographic identity is reproduced in a real Three.js scene, but full catchment drainage, the six walking centreline reservations and the naturalness of the 3D landforms do not pass. Artistic approval remains with the user.

The eight images below are unretouched browser-rendered WebGL captures. They are neither concept images nor heightmap visualizations. The neutral material makes structural defects visible. [Open the visual review](review.html) or run the separate [prototype entry](../../geo-r02b.html).

## Source, scope and ancestry

- Approved source: `aurora-rest-concept-a-r1`, schema {pre['schemaVersion']}, revision {pre['revision']}. Master SHA-256: `{g['masterSha256']}`.
- The approved master is copied byte-for-byte in [design-master-A-R1-v1.json](design-master-A-R1-v1.json). Its original [plan geometry checks](geometry-check-A-R1.json) are retained separately from the new terrain checks. Original A/B/C and R1 artifacts were not edited.
- Runtime base: `c3621ea7d73334d6cd16b5af096d3f933a249845`. Primary WORLD-01B checkout was clean at this SHA. Remote verified as `https://github.com/Algolon/Aurora-Rest.git`; existing branches/worktrees and AGENTS/project instructions inspected before implementation.
- Observed default `main`: `d543f66a85f120a182eebe56e2d24f5770f250fb`, containing only README. User explicitly approved the narrow AGENTS §2 exception to branch from the runtime checkpoint. Branch: `codex/geo-r02b-a-r1-terrain-skeleton`.
- No merge, deployment, release, asset population or production geography change. The existing `src/world`, `src/render`, main application and WORLD-01B tests remain untouched. The new entry is `geo-r02b.html`; Vite builds both entries.
- Reused architecture principles: tiled BufferGeometry, continuous shared height sampling, skirts, walk/fly/survey controls and browser QA. The prototype does not call WORLD-01B's Gaussian/elliptical terrain or its water generation. No Feh Lu We dependency or assets were introduced.

The source recheck passes its documented geometric tolerance. It finds all **16 ridge branches, 64 shared crest nodes, eight catchments, 13 channels, four lakes, 10 islets, six walking reservations and crossings M1/H1/H2**. Crest references, water graph descent/acyclicity, lake inlets/spills, rings and overlap were checked. Tessellating the analytic coast independently produces a {pre['catchmentBoundaryHausdorffM']:.3f} m boundary difference against the catchment rings and {pre['catchmentCoverageDifferenceM2']:.1f} m² symmetric difference. This is explicitly within a 0.5 m curve tessellation tolerance; it is not a claim of mathematically identical polylines. See [source-preflight.json](source-preflight.json).

## Terrain that is implemented

The 6 × 8 km envelope and transformation remain `x = 10u - 3000`, `z = 4000 - 10v`. Canonical rows run southward, with north at positive world z and east at positive world x. The orthographic camera displays north up/east right. The mirrored rendering transform is applied consistently to cameras and the scene; authored coordinates are not changed.

A deterministic 1501 × 2001 float32 elevation field at 4 m spacing combines the approved coastline signed-distance field, all connected ridge branches with asymmetric compact flank profiles, independently authored valley floor polygons/axes/widths, the two basin envelopes, four irregular lake shapes and a saddle constraint. Shape-preserving cubic crest heights interpolate the actual crest knots. Closest-segment projection removes nearest-vertex ridge height steps. Low-amplitude seeded detail refines exposed flanks; it does not define the coast or major landforms. No Gaussian hills or elliptical lake primitives are used.

All 13 channels carve the field before their water ribbons are built from the same path/height samples. Broad valley floors are independent of river width. Hidden Fold's outlet gorge and the two independent western woodland drainage systems remain separate. The dry hiking reservations never flatten terrain.

The canonical finite height range is {v['heightRangeM'][0]:.2f} to {v['heightRangeM'][1]:.2f} m. The runtime uses 4 m nearby and 16 m distant tiles, 8 m in survey mode, with continuous per-tile triangle contact sampling and skirts. This is a validation prototype, not a final terrain engine or optimization pass. Coarser meshes and skirts still show seams/shore artifacts in some views; validating the canonical field does not certify every distant rendered water edge.

### Explicit prototype departures

1. Streams narrower than 16 m are temporarily resolved at **16 m wetted width**, allowing four canonical cells across. Eleven channel segments are affected. Authored and resolved widths are exported separately. This exaggerates mountain streams and needs conforming sub-grid water/terrain geometry before final approval.
2. Indicative bed depths receive `max(0.25 m, local water grade × 4 m × 0.7)` of raster interpolation allowance. Original and resolved depths are both exported. This preserves water-surface levels but can make small gullies too deep.
3. Lake margins transition to lake level over an authored interpretation of 55–300 m around the exact vector shore. The two basin envelopes support the upland shelf/enclosed basin before outlet carving. These broad profiles still require sculptural review.
4. Offshore island heights (22–78 m) are provisional polygon-distance rock volumes. Their approved footprints/groups are preserved; detailed outcrop geology is not validated.
5. The three flat, 3.5 m wide diagnostic crossing decks are explicit proposals at the named crossing locations. They are not approved bridges. Reservations need approach bends to meet decks; automatic walking along the original drawn centreline does not establish those approaches.

No approved river centreline, water-surface control elevation, coastline ring, lake boundary or master coordinate was silently moved. `junctionCorrections` in the generation record is empty: the final geometry did not require the provisional inlet level reconciliation. Initial inlet/shore errors were resolved through basin support, bank/shore treatment and raster depth allowance. All interpretation parameters live in the new generator, while the original master remains immutable.

## Water and terrain checks

These are geometric measurements of the generated field, **not** erosion, discharge, flood, tidal or fluid simulation. See [terrain-validation.json](terrain-validation.json).

- {channelcount} sampled channel interiors have terrain above their resolved water level. All 13 resolved water-surface profiles are non-increasing downstream.
- {lakefail} failures across the tested lake inner-shore and non-outlet rim probes. High Tarn remains 360 m, Hidden lake 118 m, upper Birchwood lake 86 m, lower lake 48 m. Spill/inlet controls retain their approved relationships.
- {bankfails} eligible bank probes remain below the adjacent water-surface level. Lake areas, other channel junctions and short source/outlet caps are excluded explicitly. These residual bank issues are a technical blocker, not a flooding result.
- Bed samples may have small upward raster ripples even though the water surface descends. The table records their measured maximum; zero centreline exposure is not proof of a hydraulically smooth bed or full wetted-section containment.

'''
report+=table(['Channel','Length m','Minimum sampled water depth m','Maximum bed rise between samples m'],[[c['id'],f"{c['lengthM']:.0f}",f"{c['minInteriorWaterDepthM']:.3f}",f"{c['maxBedRiseBetweenSamplesM']:.3f}"] for c in v['channels']])
report+='''

A separate 20 m steepest-neighbour D8 diagnostic tests which system terrain points reach. Reaching an authored lake/channel then follows its separately checked downstream graph. This is a coarse diagnostic, not the actual watershed boundary or proof of catchment fidelity. Class 06 accepts the windward gully **or direct coast**, consistent with independent minor coastal drainage.

'''
report+=table(['Catchment','Reaches intended system','Unresolved closed descent'],[[c['id'],pct(c['fractionReachingExpectedSystem']),pct(c['fractionUnresolvedClosed'])] for c in v['downhillCatchmentChecks20m']])
report+=f'''

Priority flood identifies **{v['closedDepressions20m']['count']} unintended closed depressions** deeper than 2 m and at least 800 m², excluding designed water. These were recorded rather than automatically filled, because blind filling could destroy the approved ridges and passes. Full drainage acceptance fails.

'''
report+=table(['Deepest location x/z m','Affected area m²','Fill depth to escape m'],[[str(s['deepestXZ']),s['areaM2'],s['maximumFillDepthM']] for s in v['closedDepressions20m']['largestProblems']])
report+='''

The largest upper-central pockets require a terrain cross-section study and an explicit local gully/outlet connection into the existing upper-main valley. The dry side of the saddle must remain intact. The western lake catchments need slope/divide refinement rather than being forced into the main river. Mirelands needs a connected low terrace/channel cross-section without raised banks trapping adjacent low ground. These are proposed corrections for user review, not performed master edits.

## Saddle and walking reservations

'''
report+=table(['Pass location','Measured m'],[[k,f'{val:.2f}'] for k,val in v['pass'].items()])
report+='''

Cairn Saddle is a real local low point between its two tested high flanks. However, its south flank and east/west approaches miss the proposed elevations: south 285 m proposed; west approach 170 m; east approach 155 m. The prototype measures different values above. A pass existing in 3D does not yet mean the complete approach route is feasible.

The following grades are sampled on the actual 4 m raster triangles along the original drawn centrelines, with diagnostic deck contact where they intersect. Very large maxima can reflect an unaligned channel/deck approach or a cut bank; they are **not** recommended hiking gradients. None of the six complete centrelines is accepted. The wet-crossing conflicts partly result from the prototype's widened streams and provisional deck orientation. These failures describe this terrain interpretation; they do not automatically invalidate or authorize edits to the approved A-R1 plan. [hiking-profiles.csv](hiking-profiles.csv) and the JSON contain positions and conflict examples.

'''
report+=table(['Reservation','Length km','Target grade','P95 grade','Over target samples','Wet samples','P10 dry width through centreline m'],[[x['id'],f"{x['planLengthM']/1000:.2f}",pct(x['targetMaxGrade']),pct(x['p95Grade']),pct(x['fractionOverTarget']),x['submergedSamples'],f"{x['p10DryLowSlopeWidthM']:.0f}"] for x in v['routes']])
report+='''

Width is a sampled contiguous dry cross-section through the proposed centreline with at most 35% transverse slope, not the sum of disconnected dry patches. The separate widest contiguous span is also recorded in JSON. It is not a final construction width or a guarantee of an entire 3D route. The inspection controller blocks terrain steps above 70% grade; that permissive limit is not the 25–30% hiking target. Local browser walking/contact was checked only at Central Valley; no claim of end-to-end traversal is made.

'''
report+=table(['Crossing','Deck level m','Water m','Length m','Bank steps m'],[[x['id'],f"{x['levelM']:.2f}",f"{x['waterLevelM']:.2f}",f"{x['lengthM']:.1f}",'/'.join(f'{z:.2f}' for z in x['bankStepsM'])] for x in v['crossings']])
report+='''

Proposed localized corrections, without flattening mountains:

- **Hero/M1:** bend the reserved route onto the perpendicular crossing and back to the dry terrace. Then inspect the steep western climb into the Central Valley and the upper approach to Cairn Saddle. Use the 130 m reservation first; request a small corridor amendment only if a measured candidate cannot fit.
- **Hidden loop/H1/H2:** provide switchback approaches into the 3.5 m deck alignments; the original centreline crosses outside parts of the decks. Preserve the basin enclosure and outlet gorge. Any gorge side ledge needs a section, not an arbitrary tunnel.
- **Tarn/peak:** test longer contour-following ascents and genuine rock saddles. The 110/150 m envelopes may be insufficient for the desired grades; an expanded reservation or a declared steep optional summit route is preferable to lowering the massif.
- **West cape/South Shoulder:** move short steep portions laterally onto a shoulder/contour bench where the measured reservation allows. Retain their coastal side-route identity.

## Actual 3D review against A-R1 and the illustration

The outline, western bays/capes, four island groups, southeastern Home Cove, northern massif/tarn, western woodland lakes, eastern enclosed basin, broad central lowland, southwestern shoulder and eastern sandy coastal setting retain their approved geographic relationships. The orthographic survey is the strongest result; it does not establish scenic quality.

Compared with the original illustration, the prototype lacks the intended interlocking rock buttresses, asymmetric subsidiary gullies, varied glacial valley sides and readable landscape reveals. Some northern forms still look like extruded crest profiles or pyramidal faces. The Central Valley is broad but parts of its flanks read as uniform walls. High Tarn has a supported elevated basin but overly engineered gullies/shore transitions. Its inlet visibly follows a raised spine in places rather than a convincing valley; centreline bed clearance does not resolve that landform failure. Hidden Fold's enclosure is legible; the transitions need sculpting. South Shoulder is connected as a lower branch system but too smooth. The sandy east coast and Home Cove remain too flat to convey their intended coastal composition. Mirelands has low relief and a connected authored channel, while its surrounding drainage is not fully correct.

These are terrain-form issues visible with neutral material. Adding plants or rock assets would not resolve them. No production vegetation, weather, style lighting or population pass was started. Art fidelity is **not accepted**.

'''
for x in r['measurements']:
 id=x['view']['id'];report+=f"### {x['view']['name']}\n\n![Actual browser capture: {x['view']['name']}](evidence/{id}.png)\n\n"
report+='''## Verification, reproducibility and stop

- `npm test`: **21/21 pass**. Nineteen tests concern the unchanged WORLD-01B implementation. The two new tests raycast real Three.js geometry against contact interpolation at 4/8/16 m, including edges/diagonals and coordinate bounds. They do not assert that A-R1 hiking or drainage passes.
- `npm run build`: passes TypeScript and the Vite production build for both entries. Vite reports the shared Three.js chunk above 500 kB; no optimization gate is claimed.
- Source preflight passes the documented 0.5 m tessellation tolerance. All generated heights are finite.
- Browser camera checks: real WASD fly movement, drag look, survey/ground switching, all three overlays and local ground contact. Eight actual captures are tied to the source/terrain hashes in [runtime.json](evidence/runtime.json).
- Renderer is **SwiftShader software WebGL** in headless Chromium. Triangle/draw counts and the short settled-frame samples are diagnostic only, not desktop GPU or physical Android performance validation. Neither 60 FPS desktop nor 30 FPS Android is certified.
- Terrain SHA-256: `'''+g['terrainSha256']+'''`. An independent repeat generation reproduced the identical terrain and exported features against the implementation commit; see [verification-results.json](verification-results.json). Generation time is informational and is excluded from terrain identity.

Reproduce from this branch using Node 24 or newer and Python 3.11+:

```sh
npm ci
python3 -m venv /tmp/aurora-geo-r02b-venv
/tmp/aurora-geo-r02b-venv/bin/pip install -r tools/geo-r02b/requirements.txt
/tmp/aurora-geo-r02b-venv/bin/python tools/geo-r02b/preflight.py
/tmp/aurora-geo-r02b-venv/bin/python tools/geo-r02b/generate.py
/tmp/aurora-geo-r02b-venv/bin/python tools/geo-r02b/validate.py
npm test
npm run build
npm run dev -- --port 4197 --strictPort
# In another terminal, with an installed Playwright Chromium or CHROME path:
npm run geo:capture
/tmp/aurora-geo-r02b-venv/bin/python tools/geo-r02b/report.py
```

The supplied binary/features also allow `npm ci` plus `npm run dev -- --port 4197 --strictPort` without installing Python. Open `/geo-r02b.html`. `CHROME` overrides the browser executable; otherwise Playwright's installed browser is used, with a detected existing macOS headless Chromium 1234 fallback. `WORLD_URL` overrides the local URL. The generator can use `AURORA_PY_TOOLS` for an isolated Python library directory; the temporary local path is only a convenience, not a runtime dependency.

**Acceptance decision:** retain A-R1 as the geographic design baseline and keep this branch as a reproducible failed/pending terrain validation candidate. Do not start population or call the terrain art-approved. Next approval should cover a narrowly scoped terrain correction checkpoint addressing drainage pockets/banks, realistic flank transitions and measured route approaches. This milestone stops here: no merge or deployment.
'''
(DOC/'README.md').write_text(report)
# Compact visual review with all real captures and the actual approved plan.
figures=''.join(f'<figure id="{x["view"]["id"]}"><a href="evidence/{x["view"]["id"]}.png"><img src="evidence/{x["view"]["id"]}.png" loading="lazy" alt="{html.escape(x["view"]["name"])} — actual WebGL capture"></a><figcaption>{html.escape(x["view"]["name"])}</figcaption></figure>' for x in r['measurements'])
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Aurora Rest · GEO-R02B checkpoint 1</title><style>body{margin:0;background:#172421;color:#e9eee7;font:17px/1.6 system-ui}main{max-width:1440px;margin:auto;padding:32px}h1{font-size:clamp(28px,4vw,48px);line-height:1.1}a{color:#c9dfb0}p{max-width:85ch}.verdict{border-left:4px solid #dfb068;padding:12px 20px;background:#2c3429}nav{display:flex;gap:20px;flex-wrap:wrap}figure{margin:30px 0;background:#24362f;border:1px solid #506054}img{width:100%;display:block}figcaption{padding:10px 16px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}.pair img{height:650px;object-fit:contain;background:#dce3dc}@media(max-width:800px){main{padding:16px}.pair{grid-template-columns:1fr}.pair img{height:auto}}</style><main><p>AURORA REST · GEO-R02B · CHECKPOINT 1</p><h1>A-R1 in real 3D</h1><p class="verdict"><b>Review checkpoint — terrain not accepted.</b> Coastline and the authored structures are implemented. Drainage pockets, banks, walking approaches and terrain form still need correction. No merge, deployment or population.</p><nav><a href="README.md">Full technical and artistic review</a><a href="../../geo-r02b.html">Open live greybox</a><a href="terrain-validation.json">Measured terrain results</a><a href="hiking-profiles.csv">Walking profiles</a><a href="diagnostics.svg">2D diagnostic map</a></nav><p>Eight unretouched browser screenshots. Neutral terrain and simple water only. Ground captures use terrain contact at 1.75 m eye height. Software WebGL measurements are not physical Android performance evidence.</p><div class="pair"><figure><img src="reference-a-r1.png" alt="Approved A-R1 map"><figcaption>Approved A-R1 map · authored plan</figcaption></figure><figure><img src="../evidence/world-01b/reference-island.png" alt="Original concept illustration"><figcaption>Original concept illustration · artistic reference</figcaption></figure></div>'''+figures+'''<p>Coast identity is retained; scenic equivalence to the illustration is not established. Read the review before approving any continuation.</p></main></html>'''
(DOC/'review.html').write_text(page)
# Labelled planar scientific diagnostic; never presented as a runtime image.
parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1100" viewBox="0 0 1000 1100"><rect width="1000" height="1100" fill="#f1f3ee"/><g font-family="sans-serif" fill="#26372e"><text x="40" y="42" font-size="24">GEO-R02B · measured terrain conflicts</text><text x="40" y="70" font-size="14">2D diagnostic projection — NOT an engine screenshot. North up, east right. 6 × 8 km.</text></g>']
def xy(x,z):return 70+(x+3000)*.11,100+(4000-z)*.11
def path(points):return ' '.join(('M' if i==0 else 'L')+f'{xy(p[0],p[-1])[0]:.2f},{xy(p[0],p[-1])[1]:.2f}' for i,p in enumerate(points))
parts.append(f'<path d="{path(d["coast"])} Z" fill="#d5ddcf" stroke="#5b7465"/>')
for island in d['islands']:parts.append(f'<path d="{path(island["boundary"])} Z" fill="#d5ddcf" stroke="#5b7465"/>')
for c in d['channels']:parts.append(f'<path d="{path(c["points"])}" fill="none" stroke="#368198" stroke-width="1.5"/>')
for l in d['lakes']:parts.append(f'<path d="{path(l["boundary"])} Z" fill="#7fb5c0"/>')
for ridge in d['ridges']:parts.append(f'<path d="{path(ridge["points"])}" fill="none" stroke="#8a8f80" stroke-width="1"/>')
for route in d['routes']:parts.append(f'<path d="{path(route["points2"])}" fill="none" stroke="#b98036" stroke-width="1.2"/>')
with (DOC/'hiking-profiles.csv').open() as f:
 for row in csv.DictReader(f):
  target=next(x['targetMaxGrade'] for x in d['routes'] if x['id']==row['route'])
  if float(row['grade'])>target:
   x,y=xy(float(row['east_m']),float(row['north_m']));parts.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="1.6" fill="#bd4735"/>')
for i,sink in enumerate(v['closedDepressions20m']['largestProblems'],1):
 x,y=xy(*sink['deepestXZ']);parts.append(f'<circle cx="{x}" cy="{y}" r="9" fill="none" stroke="#925a9a" stroke-width="2"/><text x="{x+10}" y="{y-5}" font-family="sans-serif" font-size="13">S{i}</text>')
for cross in d['crossings']:
 x,y=xy(*cross['position2']);parts.append(f'<rect x="{x-4}" y="{y-4}" width="8" height="8" fill="#233e34"/><text x="{x+9}" y="{y+4}" font-size="14" font-family="sans-serif">{cross["id"]}</text>')
parts.append('<g font-family="sans-serif" font-size="14" fill="#26372e"><text x="760" y="125">Red: over route grade target</text><text x="760" y="153">Purple S: closed depressions</text><text x="760" y="181">Blue: authored water courses</text><text x="760" y="209">Ochre: hiking reservations</text><text x="760" y="237">Gray: crest network</text><text x="760" y="300">N ↑</text><text x="760" y="335">E →</text><text x="70" y="1030">Black squares: proposed diagnostic decks; approach continuity remains unresolved.</text><text x="70" y="1058">Sink IDs follow the measured depression table in README.md. Marker size is not sink area.</text></g><path d="M70,995 H180" stroke="#26372e" stroke-width="3"/><text x="70" y="987" font-family="sans-serif" font-size="14">1 km</text></svg>')
(DOC/'diagnostics.svg').write_text(''.join(parts))
acceptance={'checkpoint':'GEO-R02B first real 3D terrain validation','technicalAcceptance':False,'artisticAcceptance':'not recommended; user approval open','sourcePreflightPassed':pre['allChecksPassed'],'sampledStreamCentrelineExposureCount':channelcount,'lakeProbeFailures':lakefail,'residualBankProbeFailures':bankfails,'unintendedClosedDepressions20m':v['closedDepressions20m']['count'],'acceptedFullHikingCentrelines':0,'actualBrowserCaptures':8,'cameraChecksPassed':all(x['passed'] for x in r['checks']),'notValidated':['full wetted-section containment at every LOD','physical fluid/flood/tidal behavior','actual watershed boundaries','end-to-end A-R1 hiking traversal','physical Android or desktop GPU performance'],'stop':'Await visual review; no population, merge or deployment.'}
(DOC/'acceptance.json').write_text(json.dumps(acceptance,indent=2)+'\n')
paths=['src/geo-r02b','tools/geo-r02b','tests/geo-r02b.test.ts','geo-r02b.html','vite.config.ts','package.json','package-lock.json','public/geo-r02b','docs/geo-r02b']
files=[]
for entry in paths:
 p=ROOT/entry
 for file in sorted(p.rglob('*') if p.is_dir() else [p]):
  if file.is_file() and file.name!='checkpoint-manifest.json' and '__pycache__' not in str(file):files.append(file)
manifest={'schemaVersion':1,'checkpoint':'GEO-R02B-CP1','observedHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'runtimeSourceHead':r['observedHead'],'masterSha256':g['masterSha256'],'terrainSha256':g['terrainSha256'],'hashes':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}}
(DOC/'checkpoint-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(acceptance,indent=2))
