"""Builds docs/geo-r02c-b01/review.html (self-contained review page; images are referenced relatively from docs/geo-r02c-b01/).
Usage: python3 tools/geo-r02c-b01/build_review.py [--out FILE]"""
from pathlib import Path
import argparse,html,json
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-b01'
a=argparse.ArgumentParser();a.add_argument('--out',default=str(DOC/'review.html'));args=a.parse_args()
J=lambda p:json.loads((DOC/p).read_text());e=html.escape
val=J('validation/b1.json');fin=J('validation/b1.1-final.json');trv=J('validation/traversal.json');dchg=J('data/design-changes-b1.0-to-b1.1.json');cks=J('data/checksums.json');sk=J('data/skylines.json')['views'];notes=J('art-notes.json');run=J('run-log.json')
man=json.loads((ROOT/'public/geo-r02c-b01/manifest.json').read_text())['variants'];design=json.loads((ROOT/'tools/geo-r02c-b01/design/north-massif-b1.json').read_text())
CAMS=[c for f in ('geo-r02c-a1a','geo-r02c-a1b','geo-r02c-a1c','geo-r02c-b01') for c in json.loads((ROOT/'tools'/f/'cameras.json').read_text())['cameras']];names={c['id']:c['name'] for c in CAMS}
order=['a1a-birchwood','a1a-valley-shoulder','a1a-tarn-overlook','a1c-tarn-east','b01-route-b11','b01-route-shoulder','a1a-approach-upper','a1a-approach-mid','a1c-west-coast','a1a-oblique-se','a1a-oblique-n','b01-oblique-sw','b01-route-fjell']
opts=''.join(f'<option value="{v}">{e(names.get(v,v))}</option>' for v in order)
ok=lambda b:'<span class="ok">pass</span>' if b else '<span class="bad">fail</span>'
pv=val['preserved'];hy=val['hydrology'];bd=val['boundary'];rt=val['route'];rc=rt['candidate'];ch=val['changes']
checks=[('M0 (empty variant) = canonical R1, byte for byte',val['parity']['m0EqualsR1']),('Nothing changes outside the study area',pv['changedCellsOutsideStudyArea']==0),
 ('Coastline (land/sea) and the 0–70 m coast band unchanged',pv['landSeaSignChanged']==0 and pv['coastBand0to70mChanged']==0),('Every water cell unchanged (lakes, channels, surface)',pv['waterCellsChanged']==0),
 ('High Tarn, its 360 m level, shoreline and 150 m around it unchanged',pv['highTarnLakeAnd150mChanged']==0),('tarn-inlet-w and windward-gully corridors (40 m) unchanged',pv['tarn-inlet-wCorridor40mChanged']==0 and pv['windward-gullyCorridor40mChanged']==0),
 ('All other route centrelines unchanged (Δ = 0 m) and walkable on B1',all(v==0 for k,v in pv['routeCentrelineMaxChangeM'].items() if k!='peak-ascent') and all(v==-1 for v in rt['otherRoutesWalkTestOnB1'].values())),
 (f"North Peak is the island maximum at {val['summit']['b1M']} m, {val['summit']['offsetFromApprovedM']} m from the approved position",val['summit']['islandMaximumIsNorthPeak'] and val['summit']['offsetFromApprovedM']<=30),
 ('No new dry closed depressions (whole island, priority flood)',hy['newDrySinkCells1cm']==0),(f"No new unresolved drainage ({hy['unresolvedCellsB1']} cells, all on R1 too)",hy['unresolvedCellsB1']<=hy['unresolvedCellsR1']),
 ('Candidate peak-ascent walks end to end (viewer walk rule emulated: 0.65 m steps, grade ≤ 0.7)',rt['walkTestCandidateOnB1']==-1),
 (f"Candidate hiking grade (10 m): p95 {rc['hikingGrade10m']['p95Main']}, {rc['hikingGrade10m']['shareMainOver30Pct']*100:.1f} % above 0.30; summit scramble max {rc['hikingGrade10m']['maxSummitScramble']}",rc['hikingGrade10m']['p95Main']<=0.30),
 (f"Boundary seam: largest cluster where B1 adds steepness over R1 in the blend band {bd['largestAddedSteepClusterHa']} ha (limit 0.25 ha)",bd['pass']),
 ('Deterministic generation (2 runs, identical SHA-256)',run['deterministic']),(e(run['tests']),run['testsPass']),(e(run['build']),run['buildPass'])]
crows=''.join(f'<tr><td>{x}</td><td>{ok(b)}</td></tr>' for x,b in checks)
hrows=''.join(f"<tr><td>{e(h['id'])} {e(h['name'])}</td><td class='n'>{h['authoredM']}</td><td class='n'>{h['b1M']}</td><td class='n'>{h['r1M']}</td></tr>" for h in val['hierarchy'])
tr=hy['drainageTransitionsHa(1=HighTarn,2=sea,3=other,0=unresolved)'];lbl={'1':'High Tarn','2':'sea','3':'other (main river system)','0':'unresolved'}
trows=''.join(f"<tr><td>{lbl[k.split('->')[0]]} → {lbl[k.split('->')[1]]}</td><td class='n'>{v} ha</td></tr>" for k,v in tr.items())
artrows=''.join(f'<tr><th scope="row">{e(q)}</th><td>{e(x)}</td></tr>' for q,x in notes['questions'])
sheets={p.name for p in (DOC/'images').glob('compare-*.jpg')}
def sheet(v,m,cap=''):n=f'compare-{v}-{m}.jpg';return f'<figure><img src="images/{n}" alt="{e(names.get(v,v))}, {m}: M0, B1.0 and B1.1" loading="lazy">{f"<figcaption>{e(cap)}</figcaption>" if cap else ""}</figure>' if n in sheets else ''
SRC={v:{m:{k:(f'captures/{k}/{m}/{v}.jpg' if (DOC/f'captures/{k}/{m}/{v}.jpg').exists() else None) for k in ('b01-m0','b01-b1.0','b01-b1')} for m in ('clayA','clayB')} for v in order}
page=f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>North Peak B1 Massif</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: field-survey review sheet (same system as the A1b-alpha and A1c pages). One reading column with full-width plates. */
:root{{--bg:#f2f4f4;--plate:#fff;--ink:#1a2226;--muted:#56646b;--line:#d5dcde;--accent:#1d6a86;--soft:#e1eef3;--hot:#c2410c;--okc:#1f7a4d;--badc:#b42318;
 --f-d:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--f-b:"Source Sans 3","Segoe UI",system-ui,sans-serif;--f-m:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--hot:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--hot:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--ink);font:400 1.05rem/1.6 var(--f-b);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 4rem}}
.wrap{{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:3rem}}.col{{max-width:72ch}}.wrap>*{{min-width:0}}
header{{padding-block:2.4rem 1.2rem;border-bottom:1px solid var(--line)}}.eyebrow{{font:600 .8rem/1 var(--f-m);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}}
h1{{font:700 clamp(2.2rem,6vw,3.6rem)/1 var(--f-d);margin:.5rem 0 .7rem;text-wrap:balance}}h2{{font:700 clamp(1.6rem,3.4vw,2.2rem)/1.05 var(--f-d);margin:0 0 .6rem;text-wrap:balance}}h3{{font:600 1.3rem/1.2 var(--f-d);margin:1.4rem 0 .4rem}}
.chips{{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.9rem}}.chip{{font:600 .76rem/1 var(--f-m);padding:.42rem .6rem;border:1px solid var(--line);border-radius:3px;background:var(--plate);color:var(--muted);overflow-wrap:anywhere}}
.verdict{{border-left:4px solid var(--hot);background:var(--plate);border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:1rem 1.2rem}}
.verdict b.v{{font:700 1.6rem/1.05 var(--f-d);color:var(--hot);display:block;margin-bottom:.4rem}}
figure{{margin:.8rem 0;background:var(--plate);border:1px solid var(--line);padding:.5rem}}figure img{{display:block;width:100%;height:auto}}figcaption{{font-size:.9rem;color:var(--muted);padding:.45rem .2rem 0}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:1rem}}.grid2 figure{{margin:0}}
.tbl{{overflow-x:auto;border:1px solid var(--line);background:var(--plate);margin:.8rem 0}}table{{border-collapse:collapse;width:100%;font-size:.95rem}}
th,td{{text-align:left;padding:.5rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}}th{{font:600 .76rem/1.2 var(--f-m);letter-spacing:.04em;text-transform:uppercase;color:var(--muted);background:var(--soft)}}
tbody th{{font:600 .95rem/1.4 var(--f-b);text-transform:none;letter-spacing:0;color:var(--ink);background:transparent;width:30%}}td.n{{font-family:var(--f-m);font-variant-numeric:tabular-nums;white-space:nowrap}}tr:last-child td,tr:last-child th{{border-bottom:0}}
.ok{{font:600 .8rem/1 var(--f-m);color:var(--okc)}}.bad{{font:600 .8rem/1 var(--f-m);color:var(--badc)}}
.ctl{{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.6rem 0}}.ctl>*{{min-width:0}}select,button{{font:600 .9rem/1 var(--f-m);padding:.55rem .7rem;border:1px solid var(--line);background:var(--plate);color:var(--ink);border-radius:3px}}select{{max-width:100%}}
button{{cursor:pointer}}button[aria-pressed="true"]{{background:var(--accent);border-color:var(--accent);color:var(--bg)}}button:focus-visible,select:focus-visible{{outline:3px solid var(--accent);outline-offset:2px}}
.cmp{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:.8rem}}.cmp figure{{margin:0}}.lbl{{font:600 .78rem/1 var(--f-m);text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}}
code{{font-family:var(--f-m);font-size:.88em;overflow-wrap:anywhere}}table.defects{{table-layout:fixed;min-width:640px}}ul.tight{{margin:.4rem 0;padding-left:1.2rem}}ul.tight li{{margin:.25rem 0}}
</style>
<div class="wrap">
<header><div class="eyebrow">Aurora Rest · GEO-R02C · B0/B1 · northern massif rebaseline</div><h1>North Peak B1 Massif</h1>
<p class="col">A first authored replacement for the North Peak macro-terrain, not another correction of the R1 mountain. The design is a derived design master that the terrain is generated from. The result is compared with canonical R1 (M0) in real Three.js captures from identical cameras under both clay presets, before (B1.0) and after (B1.1) the one permitted correction.</p>
<div class="chips"><span class="chip">{e(run['branch'])}</span><span class="chip">B1.1 {man['b1']['terrainSha256'][:12]}…</span><span class="chip">R1 fc8fd6da… untouched</span><span class="chip">A-R1 master untouched</span><span class="chip">derived master {e(design['revision'])}</span><span class="chip">no merge, no deployment</span></div></header>
<section><div class="verdict col"><b class="v">{e(notes['verdict'])}</b>{''.join(f'<p>{e(p)}</p>' for p in notes['summary'])}</div></section>
<section><div class="col"><h2>1 · B0 design target</h2><p>The authored intent: summit hierarchy, three different arms, saddles, cirques, buttresses, preserved areas and the route change. It is drawn over the R1 hillshade. These are design targets, not evidence that terrain exists.</p></div>
<figure><img src="images/design-plan.png" alt="Annotated design plan of the derived North massif master" loading="lazy"></figure>
<div class="grid2"><figure><img src="images/target-birchwood.svg" alt="Target skyline from Birchwood" loading="lazy"></figure><figure><img src="images/target-valley-shoulder.svg" alt="Target skyline from the Central Valley shoulder" loading="lazy"></figure></div></section>
<section><div class="col"><h2>2 · Compare real renders</h2><p>Real Three.js captures with identical camera positions for every variant. Walk cameras stand 1.75 m above the loaded terrain; aerial cameras are fixed in the world. Clay material only: no vegetation or texture hides the landform.</p></div>
<div class="ctl"><label class="lbl" for="view">Viewpoint</label><select id="view">{opts}</select><span class="lbl">Light</span><button type="button" data-mode="clayA" aria-pressed="false">Clay sun A (WNW, low)</button><button type="button" data-mode="clayB" aria-pressed="true">Clay sun B (SE)</button></div>
<div class="cmp"><figure><img id="imgL" alt="M0 capture" width="1280" height="800"><figcaption id="capL">M0 = R1</figcaption></figure><figure><img id="imgR" alt="B1.1 capture" width="1280" height="800"><figcaption id="capR">B1.1</figcaption></figure></div>
<div class="ctl"><span class="lbl">Left</span><button type="button" data-side="L" data-v="b01-m0" aria-pressed="true">M0</button><button type="button" data-side="L" data-v="b01-b1.0" aria-pressed="false">B1.0</button><button type="button" data-side="L" data-v="b01-b1" aria-pressed="false">B1.1</button>
<span class="lbl">Right</span><button type="button" data-side="R" data-v="b01-m0" aria-pressed="false">M0</button><button type="button" data-side="R" data-v="b01-b1.0" aria-pressed="false">B1.0</button><button type="button" data-side="R" data-v="b01-b1" aria-pressed="true">B1.1</button></div>
<h3>Matched sheets (M0 | B1.0 | B1.1)</h3>
{sheet('a1a-birchwood','clayA','Birchwood, the primary identity view.')}{sheet('a1a-valley-shoulder','clayB','Central Valley shoulder.')}{sheet('a1a-oblique-se','clayB','Elevated south-east oblique.')}{sheet('b01-oblique-sw','clayA','Elevated south-west oblique over the windward fjell.')}
{sheet('a1a-oblique-n','clayA','Elevated north oblique: the lee cirques.')}{sheet('a1a-tarn-overlook','clayB','High Tarn overlook.')}{sheet('a1c-tarn-east','clayA','High Tarn east shore.')}{sheet('b01-route-b11','clayA','On the B1.1 route, 356 m below the summit (camera added for this review; no B1.0 frame).')}{sheet('b01-route-shoulder','clayB','On the B1.1 route at the start of the summit scramble.')}{sheet('b01-route-fjell','clayA','Vestfjell plateau · OFF-ROUTE viewpoint, 132 m west of the B1.1 route.')}{sheet('a1c-west-coast','clayB','Western coast.')}</section>
<section><div class="col"><h2>3 · Artistic evaluation</h2><p>Judged on the real captures under both sun presets, not on displacement or pixel counts.</p></div><div class="tbl"><table><tbody>{artrows}</tbody></table></div></section>
<section><div class="col"><h2>4 · Terrain geometry</h2><p>B1.1 changes {ch['changedHa']} ha: {ch['raisedOver1mHa']} ha raised and {ch['loweredOver1mHa']} ha lowered by more than 1 m, between +{ch['maxRaiseM']} m and −{ch['maxLoweringM']} m. All changes are inside the study area.</p></div>
<figure><img src="images/maps-b1.png" alt="Hillshade M0, B1 and the height difference" loading="lazy"><figcaption>Hillshade M0 | B1 | height difference (red raised, blue lowered), with the candidate route in yellow.</figcaption></figure>
<div class="grid2"><figure><img src="images/skyline-b1-birchwood.svg" alt="Measured skyline from Birchwood" loading="lazy"><figcaption>Birchwood: maximum skyline shift {sk['birchwood']['maxShiftPx']} px, {sk['birchwood']['widthShiftOver3pxDeg']}° of width moving more than 3 px (A1c S1: 4.2 px).</figcaption></figure>
<figure><img src="images/skyline-b1-valley-shoulder.svg" alt="Measured skyline from the Central Valley shoulder" loading="lazy"><figcaption>Central Valley shoulder: {sk['valley-shoulder']['maxShiftPx']} px, {sk['valley-shoulder']['widthShiftOver3pxDeg']}° over 3 px (A1c S1: 2.7 px).</figcaption></figure></div>
<figure><img src="images/sections-b1.svg" alt="Four cross-sections M0 against B1" loading="lazy"></figure>
<div class="tbl"><table><tr><th>Summit / saddle</th><th>Authored, m</th><th>B1.1, m</th><th>R1, m</th></tr>{hrows}</table></div></section>
<section><div class="col"><h2>5 · Hydrology and walking route</h2><p>Drainage is recomputed, not frozen. B1 adds no dry closed depression. {hy['drainageDestinationChangedHa']} ha change their drainage destination. High Tarn's catchment goes from {hy['highTarnCatchmentHa']['r1']} to {hy['highTarnCatchmentHa']['b1']} ha, and its lake, level, shore and inlet channels are untouched.</p></div>
<div class="tbl"><table><tr><th>Destination change</th><th>Area</th></tr>{trows}</table></div>
<figure><img src="images/streams-b1.png" alt="D8 stream networks above 5 ha, M0 and B1" loading="lazy"><figcaption>Streams above 5 ha. The regenerated network follows the new cirques and troughs. One 0.4 ha conditioned hollow (6.6 m) remains, a dry tarn site, because B1 has no water-surface variant.</figcaption></figure>
<p class="col">Route: the R1 peak-ascent is blocked on B1 (point {rt['walkTestR1RouteOnB1']}) and is kept as reference (<code>peak-ascent-r1</code> in the viewer). The candidate follows R1 for its first {rc['sharedWithR1Points']} points, then climbs {rc['lengthM']} m in total to the summit. Hiking grade (10 m): p95 {rc['hikingGrade10m']['p95Main']}, max {rc['hikingGrade10m']['maxMain']}. Declared summit scramble (last {int(rc['summitScrambleM'])} m): max {rc['hikingGrade10m']['maxSummitScramble']}. The walk test passes end to end.</p></section>
<section><div class="col"><h2>6 · Validation and reproducibility</h2><p>Final check matrix. Failed geographic conditions stay failed even though every automated test passes; no threshold was changed.</p></div>
<div class="tbl"><table><tr><th>Final check</th><th>Status</th></tr>{''.join(f"<tr><td>{e(c)}</td><td>{'<span class=ok>pass</span>' if s=='pass' else ('<span class=bad>'+e(s)+'</span>')}</td></tr>" for c,s in run['checkMatrix'])}</table></div>
<div class="tbl"><table><tr><th>Check (first validation run)</th><th>Result</th></tr>{crows}</table></div>
<p class="col">Full reports: <code>validation/b1.json</code>, <code>data/skylines.json</code>, <code>run-log.json</code>, routes in <code>public/geo-r02c-b01/routes.json</code>. Expected differences, not regressions: {e('; '.join(val['expectedDifferences']))}.</p></section>
<section><div class="col"><h2>7 · Final validation detail</h2><p>The recomposition in memory equals the committed terrain: <b>{fin['recomposedEqualsCommitted']}</b>. Genuine in-browser traversal (the viewer's own <code>walkRouteForTest</code> on <code>?terrain=b01-b1</code>):</p></div>
<div class="tbl"><table><tr><th>Route on B1.1</th><th>Blocked at</th><th>End distance</th></tr>{''.join(f"<tr><td>{e(k)}</td><td class='n'>{'none' if v['blockedAt']==-1 else v['blockedAt']}</td><td class='n'>{v['endDistanceM']:.1f} m</td></tr>" for k,v in trv['variants']['b01-b1']['walks'].items())}</table></div>
<p class="col">Collision consistency along the candidate route: rendered vs canonical surface {trv['variants']['b01-b1']['collision']['maxCanonicalVsRenderedM']} m; eye height after the walks {trv['variants']['b01-b1']['eyeHeightAfterLastWalkM']} m. On M0 every R1 route walks end to end.</p>
<div class="tbl"><table><tr><th>Route geometry, new section</th><th>Value</th></tr>
<tr><td>Hiking grade (10 m) over 0.30 outside the scramble</td><td class="n">{fin['D_route']['over30PctOutsideScrambleM']} m, in {len(fin['D_route']['sectionsOver30PctOutsideScramble'])} sections</td></tr>
<tr><td>Declared summit scramble (within 140 m of the summit)</td><td class="n">{fin['D_route']['summitScramble']['lengthM']} m of path, median {fin['D_route']['summitScramble']['p50']}, max {fin['D_route']['summitScramble']['maxGrade']}</td></tr>
<tr><td>Cross-slope ±2 m: share above 0.5 / above 1.0</td><td class="n">{fin['D_route']['crossSlopeNewSection']['2m']['shareOver0.5']*100:.1f} % / {fin['D_route']['crossSlopeNewSection']['2m']['shareOver1.0']*100:.1f} %</td></tr>
<tr><td>Usable tread (cross-slope ≤ 0.5 both sides): median, share under 2 m</td><td class="n">{fin['D_route']['usableTreadWidthM(cross-slope <= 0.5 both sides, sampled every 5 m)']['p50']} m, {fin['D_route']['usableTreadWidthM(cross-slope <= 0.5 both sides, sampled every 5 m)']['shareBelow2m']*100:.1f} %</td></tr></table></div>
<p class="col">{e(fin['D_route']['note'])}</p>
<div class="tbl"><table><tr><th>Boundary seam cluster</th><th>Area</th><th>Mean / max above R1</th><th>Slope B1 / R1</th><th>Nearest structure</th></tr>{''.join(f"<tr><td class='n'>{s['xz'][0]}, {s['xz'][1]}</td><td class='n'>{s['areaHa']} ha</td><td class='n'>{s['meanHeightAboveR1M']} / {s['maxHeightAboveR1M']} m</td><td class='n'>{s['slopeB1Mean']} / {s['slopeR1Mean']}</td><td>{e(s['nearestAuthoredStructure'])}</td></tr>" for s in fin['A_seams']['clusters'])}</table></div>
<p class="col">{e(fin['A_seams']['cause'])}</p>
<p class="col">Western Col: authored {fin['B_westernCol']['authoredLevelM']} m. B1.1 is {fin['B_westernCol']['b1LevelAtAuthoredPointM']} m at the authored point, and the real low point is {fin['B_westernCol']['lowestPointOnArmCrestS0toS1']['levelM']} m at {fin['B_westernCol']['lowestPointOnArmCrestS0toS1']['xz']}. Vesttind's prominence is {fin['B_westernCol']['vesttindProminenceAboveColM']} m (authored {fin['B_westernCol']['authoredProminenceM']} m). {e(fin['B_westernCol']['cause'])}</p>
<div class="tbl"><table><tr><th>Drainage-destination change zone</th><th>Area</th><th>From → to</th></tr>{''.join(f"<tr><td class='n'>{z['xz'][0]}, {z['xz'][1]}</td><td class='n'>{z['areaHa']} ha</td><td>{lbl[str(z['from'])]} → {lbl[str(z['to'])]}</td></tr>" for z in fin['C_hydrology']['destinationChangeZones(>=0.5 ha)'])}</table></div>
<p class="col">{e(fin['C_hydrology']['lakeAndRiverLevels'])}. Acceptable authored change: {e(fin['C_hydrology']['classification']['acceptable authored change'])}. Defects: {e(fin['C_hydrology']['classification']['defect'])}.</p></section>
<section><div class="col"><h2>8 · B1.0 → B1.1: the one correction</h2><p>Every change to the design master between the initial candidate and the corrected one (data/design-changes-b1.0-to-b1.1.json). Original and revised plans below; both are design material, not terrain.</p></div>
<div class="tbl"><table><tr><th>Design master field</th><th>B1.0</th><th>B1.1</th></tr>{''.join(f"<tr><td><code>{e(c['path'])}</code></td><td>{e(str(c['b1.0'])[:90])}</td><td>{e(str(c['b1.1'])[:90])}</td></tr>" for c in dchg if c['path'] not in ('revisionNote',))}</table></div>
<div class="grid2"><figure><img src="images/design-plan-b1.0.png" alt="Original B1.0 design plan" loading="lazy"><figcaption>B1.0 design (original, superseded).</figcaption></figure><figure><img src="images/design-plan.png" alt="Revised B1.1 design plan" loading="lazy"><figcaption>B1.1 design (current).</figcaption></figure></div></section>
<section><div class="col"><h2>9 · Known-defect register</h2></div><div class="tbl"><table class="defects"><colgroup><col style="width:3.5rem"><col style="width:9rem"><col style="width:30%"><col></colgroup><tr><th>ID</th><th>Severity</th><th>Defect</th><th>Recommended B2 correction</th></tr>{''.join(f"<tr><td class='n'>{e(d['id'])}</td><td>{e(d['severity'])}</td><td>{e(d['title'])}</td><td>{e(d['b2'])}</td></tr>" for d in notes['defects'])}</table></div></section>
<section><div class="col"><h2>10 · Provenance and checksums</h2><p>Branch {e(run['branch'])}, base {e(run['base'])}. Real Three.js captures are under <code>captures/</code> (manifests carry each frame's terrain SHA-256). Design material is <code>images/design-plan*.png</code> and <code>images/target-*.svg</code>. Measured terrain figures are <code>maps-b1.png</code>, <code>sections-b1.svg</code>, <code>skyline-b1-*.svg</code> and <code>streams-b1.png</code>.</p></div>
<div class="tbl"><table><tr><th>Artifact</th><th>SHA-256</th></tr>{''.join(f"<tr><td><code>{e(k)}</code></td><td><code>{v}</code></td></tr>" for k,v in cks['key'].items())}</table></div><p class="col">The full list of {cks['fileCount']} files is in <code>data/checksums.json</code>.</p></section>
<section class="col"><h2>11 · Local design-authority changes</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['authorityChanges'])}</ul></section>
<section class="col"><h2>Limitations</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['limitations'])}</ul></section>
<section class="col"><h2>Suitability for B2 and recommendation</h2><p>{e(notes['suitableAsB2StartingPoint'])}</p>{''.join(f'<p>{e(x)}</p>' for x in notes['b2Recommendation'])}</section>
</div>
<script>
(function(){{
 var SRC={json.dumps(SRC)};var st={{view:document.getElementById('view').value,mode:'clayB',L:'b01-m0',R:'b01-b1'}};var NAME={{'b01-m0':'M0 = R1','b01-b1.0':'B1.0 initial','b01-b1':'B1.1 after correction'}};
 function draw(){{document.querySelectorAll('[data-mode]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.mode===st.mode));}});
  ['L','R'].forEach(function(s){{var i=document.getElementById('img'+s),u=SRC[st.view][st.mode][st[s]];i.style.visibility=u?'visible':'hidden';if(u)i.src=u;i.alt=NAME[st[s]]+' capture';document.getElementById('cap'+s).textContent=NAME[st[s]]+(u?'':' · not captured for this camera (added after B1.0)');
   document.querySelectorAll('[data-side="'+s+'"]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.v===st[s]));}});}});}}
 document.getElementById('view').addEventListener('change',function(ev){{st.view=ev.target.value;draw();}});
 document.querySelectorAll('[data-mode]').forEach(function(b){{b.addEventListener('click',function(){{st.mode=b.dataset.mode;draw();}});}});
 document.querySelectorAll('[data-side]').forEach(function(b){{b.addEventListener('click',function(){{st[b.dataset.side]=b.dataset.v;draw();}});}});draw();
}})();
</script>'''
Path(args.out).write_text(page);print('wrote',args.out,len(page))
