"""Writes image-inventory.md: every image and data file in the dossier with its kind (measured / design target / reference) and source."""
from a1d_common import *
DESC={
 'overlay-v1-on-ar1':('design target over A-R1','Annotated concept v1 over the approved A-R1 map (legend included)','overlay.py'),
 'overlay-v1-on-r1-clay':('design target over R1','Same annotations over the R1 clay hillshade','overlay.py'),
 'base-ar1':('reference','A-R1 map crop, design extent, 2 px/4 m','bases.py'),'base-r1-hillshade':('measured R1','R1 clay hillshade, design extent','bases.py'),
 'profile-T1-c1-nordbotn':('measured R1 + design target','T1 W→E at z 2930 through C1 (true scale)','profiles.py'),
 'profile-T2-c2-vastra-tarnbotn':('measured R1 + design target','T2 W→E at z 2530 through C2-a (true scale)','profiles.py'),
 'profile-G1-tarn-inlet-w-gully':('measured R1 + design target','G1 gully trial section on tarn-inlet-w (true scale)','profiles.py'),
 'profile-T4-c4-vindbotn-deferred':('measured R1 + design target','T4 C4 study (deferred)','profiles.py'),
 'profile-T5-inlet-n-option-a-not-recommended':('measured R1 + design target','T5 v0 option A divide raise (not recommended)','profiles.py'),
 'hydro-north-map':('measured R1','D3 map: R1 drainage destination, contours, authored catchment 01, crest anomaly, sources, candidate heads','hydro_map.py'),
 'hydro-north-drainage-base':('measured R1','Base raster for the hydrology map','analysis_hydrology.py'),
 'hydro-catchment01-missing':('measured R1','Mask: authored catchment 01 cells R1 does not drain to High Tarn (8 m px, x −600…1792, z 1500…3192)','analysis_hydrology.py'),
 'hydro-H1-source-n-ns':('measured R1','H1 N→S through ht-source-n with drainage strip','analysis_hydrology.py'),
 'hydro-H2-inlet-n-long':('measured R1','H2 tarn-inlet-n long profile vs nearest authored crest, MFD areas, candidate head','analysis_hydrology.py'),
 'hydro-H3-source-w-we':('measured R1','H3 W→E through ht-source-w (saddle + knob)','analysis_hydrology.py'),
 'hydro-H4-c2-ns':('measured R1','H4 N→S through v0 C2 showing the divide and the crest below the v0 floor','analysis_hydrology.py'),
 'silhouettes':('measured R1 (zones = design)','Skylines from ten approaches coloured by A1-D zone','analysis_silhouettes.py'),
 'window-v2-validation':('measured R1 + design','Window v2 ring/feather/core, coastal band, features and protected items','analysis_design_checks.py')}
rows=['# A1-D image and data inventory','','Kinds: **measured R1** = computed from committed R1/A-R1 artifacts; **design target** = hand-specified intent, not generated terrain; **reference** = existing material (A-R1 map, P0 captures). Sizes in KB.','',
 '## Images','','| File | Kind | Shows | Made by | KB |','|---|---|---|---|---|']
for p in sorted(IMG.glob('*.*')):
 k=DESC.get(p.stem,('','','')) 
 rows.append(f'| [`images/{p.name}`](images/{p.name}) | {k[0]} | {k[1]} | `scripts/{k[2]}` | {p.stat().st_size//1024} |')
ev=json.loads((DATA/'evidence-sources.json').read_text())
for p in sorted((IMG/'evidence').glob('*.jpg')):rows.append(f'| [`images/evidence/{p.name}`](images/evidence/{p.name}) | reference (P0 capture) | downscaled copy of `{ev[p.stem]["source"]}` | `scripts/evidence.py` | {p.stat().st_size//1024} |')
rows+=['','## Data','','| File | Content |','|---|---|']
DD={'a1d-concept-v1.json':'Concept v1 design targets with status per feature','a1d-concept-v0.json':'Concept v0 as reviewed (superseded)','hydrology-north-sources.json':'D3: sources, crest fidelity, n-east-arc anomaly, catchment 01 comparison, relocation candidates',
 'design-checks.json':'D5/D6/D7: feature clearance, protected items, grid zones, B1 vs route, C2 catchment','silhouettes.json':'Approach skylines, summit line of sight, cirque visibility','profiles.json':'Five section studies: lines, control points, max lowering/raise',
 'window-v2-proposed.json':'Window v2 proposal (polygon, ring, feather, coastal band)','evidence-sources.json':'Source P0 capture of each evidence frame'}
for p in sorted(DATA.glob('*.json')):rows.append(f'| [`data/{p.name}`](data/{p.name}) | {DD.get(p.name,"")} |')
rows+=['','## Superseded v0 (preserved unchanged)','','| File | Content |','|---|---|']
for p in sorted((OUT/'v0').glob('*')):rows.append(f'| [`v0/{p.name}`](v0/{p.name}) | v0 as reviewed on 22 Oct 2026 |')
(OUT/'image-inventory.md').write_text('\n'.join(rows)+'\n');print(len(rows))
