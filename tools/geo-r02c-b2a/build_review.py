"""Builds docs/geo-r02c-b2a/review.html (self-contained review page; images are referenced relatively from docs/geo-r02c-b2a/).
Every number on the page is read from the committed validation and data files; the art verdict and gates come from art-notes.json.
Usage: python3 tools/geo-r02c-b2a/build_review.py [--out FILE]"""
from pathlib import Path
import argparse,html,json
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-b2a'
a=argparse.ArgumentParser();a.add_argument('--out',default=str(DOC/'review.html'));args=a.parse_args()
J=lambda p:json.loads((DOC/p).read_text());e=html.escape
val=J('validation/a.json');fin=J('validation/a-final.json');trv=J('validation/traversal.json');sky=J('data/skyline-regression.json');sa=J('data/seam-area-cross-check.json')
dchg=J('data/design-changes-b1.1-to-b2a.json');cks=J('data/checksums.json');notes=J('art-notes.json');run=J('run-log.json')
b11=json.loads((ROOT/'docs/geo-r02c-b01/validation/b1.1-final.json').read_text());b11v=json.loads((ROOT/'docs/geo-r02c-b01/validation/b1.json').read_text())
man=json.loads((ROOT/'public/geo-r02c-b2a/manifest.json').read_text())['variants']['a'];design=json.loads((ROOT/'tools/geo-r02c-b2a/design/north-massif-b2a.json').read_text())
CAMS=[c for f in ('geo-r02c-a1a','geo-r02c-a1b','geo-r02c-a1c','geo-r02c-b01','geo-r02c-b2a') for c in json.loads((ROOT/'tools'/f/'cameras.json').read_text())['cameras']];names={c['id']:c['name'] for c in CAMS}
order=['a1a-birchwood','a1a-valley-shoulder','a1a-oblique-n','a1a-oblique-se','b2a-col-south','b2a-seam-nw','b2a-seam-north','b2a-seam-gully','b2a-outlet','b2a-switchbacks','b2a-route-upper','b2a-route-viewpoint','b2a-route-scramble','b01-route-b11']
opts=''.join(f'<option value="{v}">{e(names.get(v,v))}</option>' for v in order)
ST={'pass':'ok','fail':'bad','partial':'bad','conditional':'bad'}
pill=lambda s:f'<span class="{ST.get(s.split()[0].lower(),"bad")}">{e(s)}</span>'
sheets={p.name for p in (DOC/'images').glob('compare-*.jpg')}
def sheet(v,m,cap=''):n=f'compare-{v}-{m}.jpg';return f'<figure><img src="images/{n}" alt="{e(names.get(v,v))}, {m}: B1.1 and B2a" loading="lazy">{f"<figcaption>{e(cap)}</figcaption>" if cap else ""}</figure>' if n in sheets else ''
SRC={v:{m:{k:(f'captures/{k}/{m}/{v}.jpg' if (DOC/f'captures/{k}/{m}/{v}.jpg').exists() else None) for k in ('b01-b1','b2a-a')} for m in ('clayA','clayB')} for v in order}
col=fin['B_westernCol'];c11=b11['B_westernCol'];pa=fin['D_route']['peak-ascent'];ps=fin['D_route']['peak-scramble'];r11=b11['D_route'];o1=man['stages']['D4'][0];hy=val['hydrology'];pv=val['preserved']
TW='usableTreadWidthM(cross-slope <= 0.5 both sides, sampled every 5 m)'
d1rows=''.join(f"<tr><td class='n'>{s['seam']}</td><td class='n'>{s['xz'][0]}, {s['xz'][1]}</td><td class='n'>{c['areaHa']} ha</td><td class='n'>{s['b11']['addedSlopeOver05Ha']} → {s['b2a']['addedSlopeOver05Ha']} ha</td><td class='n'>{s['b11']['maxAddedSlope']} → {s['b2a']['maxAddedSlope']}</td></tr>" for s,c in zip(sa['seams'],b11['A_seams']['clusters']))
skrows=''.join(f"<tr><td>{e(k.replace('-',' '))}</td><td class='n'>{v['maxShiftOutsideAllowedPx']} px</td><td class='n'>{v['summitShiftPx']} px</td><td class='n'>{v['maxShiftPerAllowedWindowPx']['D2-western-col']} px</td><td class='n'>{v['maxShiftPerAllowedWindowPx']['D1-west-arm-terminal']} px</td><td>{pill('pass' if v['pass'] else 'fail')}</td></tr>" for k,v in sky['views'].items())
def hist(h):return ' · '.join(f'{k}: {v} m' for k,v in h.items() if v)
walks=trv['variants'].get('b2a-a',{}).get('walks',{});coll=trv['variants'].get('b2a-a',{}).get('collision') or {}
wrows=''.join(f"<tr><td>{e(k)}</td><td class='n'>{'none' if v['blockedAt']==-1 else v['blockedAt']}</td><td class='n'>{v['endDistanceM']:.2f} m</td><td class='n'>{v['samples']}</td></tr>" for k,v in walks.items())
gaterows=''.join(f"<tr><td>{e(g)}</td><td>{e(c)}</td><td>{e(r)}</td><td>{pill(s)}</td></tr>" for g,c,r,s in notes['gates'])
artrows=''.join(f'<tr><th scope="row">{e(q)}</th><td>{e(x)}</td></tr>' for q,x in notes['questions'])
page=f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>North Peak B2a Integration</title>
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
<header><div class="eyebrow">Aurora Rest · GEO-R02C · B2a · geographic integration and hiking quality</div><h1>North Peak B2a Integration</h1>
<p class="col">B2a corrects four defects of the protected B1.1 massif: coastal seams (D1), the Western Col / Vesttind hierarchy (D2), the hiking route (D3) and a dry hollow (D4). It does not redesign the mountain. B2a is derived from B1.1 and versioned separately (design {e(design['revision'])}). It is compared with B1.1 in real Three.js captures from identical cameras under both clay presets.</p>
<div class="chips"><span class="chip">{e(run['branch'])}</span><span class="chip">base {e(run['base'][:10])} (B1.1)</span><span class="chip">B2a {man['terrainSha256'][:12]}…</span><span class="chip">B1.1 {man['referenceTerrainSha256'][:12]}… untouched</span><span class="chip">R1 fc8fd6da… untouched</span><span class="chip">no merge, no deployment</span></div></header>
<section><div class="verdict col"><b class="v">{e(notes['verdict'])}</b>{''.join(f'<p>{e(p)}</p>' for p in notes['summary'])}</div></section>
<section><div class="col"><h2>1 · Acceptance gates</h2><p>Each gate is reported separately. None is relaxed to pass, and a failed criterion stays failed even though every automated test passes.</p></div>
<div class="tbl"><table><tr><th>Gate</th><th>Criterion</th><th>Result</th><th>Status</th></tr>{gaterows}</table></div></section>
<section><div class="col"><h2>2 · Compare real renders</h2><p>Real Three.js captures. Aerial cameras are fixed in the world, so B1.1 and B2a frames are pixel-registered. Walk cameras stand 1.75 m above whichever terrain is loaded, so a B2a route camera shows the B1.1 terrain at the same place, not on a B1.1 route. Clay material only: no vegetation, texture or trail ribbon.</p></div>
<div class="ctl"><label class="lbl" for="view">Viewpoint</label><select id="view">{opts}</select><span class="lbl">Light</span><button type="button" data-mode="clayA" aria-pressed="false">Clay sun A (WNW, low)</button><button type="button" data-mode="clayB" aria-pressed="true">Clay sun B (SE)</button><button type="button" id="blink" aria-pressed="false">Blink in place</button></div>
<div class="cmp" id="cmp"><figure><img id="imgL" alt="B1.1 capture" width="1280" height="800"><figcaption id="capL">B1.1</figcaption></figure><figure id="figR"><img id="imgR" alt="B2a capture" width="1280" height="800"><figcaption id="capR">B2a</figcaption></figure></div>
<h3>Matched sheets (B1.1 | B2a, with an enlarged crop)</h3>
{sheet('a1a-birchwood','clayA','Birchwood, the primary identity view. The only skyline change outside the summit is the west arm end (D1 window).')}{sheet('a1a-valley-shoulder','clayB','Central Valley shoulder.')}{sheet('a1a-oblique-n','clayA','Elevated north oblique: the lee cirques and the north coast terminals.')}{sheet('a1a-oblique-se','clayB','Elevated south-east oblique.')}</section>
<section><div class="col"><h2>3 · D1 · Coastal and corridor seams</h2><p>Same criterion as B1.1, same 0.25 ha limit: blend-band cells where the candidate is steeper than R1 + 0.5 and steeper than the core p99. B1.1 had four clusters over the limit. B2a has <b>{fin['A_seams']['failingClusters']}</b>. The largest remaining cluster is {max([c['areaHa'] for c in fin['A_seams']['clusters']] or [0])} ha at {fin['A_seams']['clusters'][0]['xz'] if fin['A_seams']['clusters'] else '–'}, and the total added-steep band area is {fin['A_seams']['totalAddedSteepHa']} ha.</p>
<p>The fix is in the geometry: {e(fin['A_seams']['b2aCorrection'])} The windward-gully seam is handled by its own corridor taper; the coastline and the frozen 0–70 m coast band are byte-identical to R1.</p>
<p>Band-independent cross-check, so the fix cannot simply have moved steepness out of the measured band: the area within 220 m of each B1.1 seam where slope exceeds R1 by more than 0.5, anywhere.</p></div>
<div class="tbl"><table><tr><th>Seam</th><th>B1.1 location</th><th>B1.1 cluster</th><th>Added-slope area, B1.1 → B2a</th><th>Max added slope</th></tr>{d1rows}</table></div>
<p class="col">Most of the remaining added-slope area around seams 1 and 2 is the authored arm flank above the band, not a step at the coast. It is reduced, not eliminated.</p>
<figure><img src="images/seams-b2a.png" alt="Hillshade crops of the four B1.1 seams, B1.1 and B2a" loading="lazy"></figure>
{sheet('b2a-seam-nw','clayA','North-west arm terminal (seams 1 and 2).')}{sheet('b2a-seam-north','clayB','North headland (seam 4).')}{sheet('b2a-seam-gully','clayA','Windward-gully corridor transition (seam 3).')}</section>
<section><div class="col"><h2>4 · D2 · Western Col and Vesttind</h2><p><b>Cause in B1.1.</b> {e(col['b11Cause'])}</p>
<p><b>Reconciliation.</b> The B1.1 design asked for a 668 m col and about 56 m of Vesttind prominence. With Vesttind achieved at {col['vesttindB1M']} m, 56 m means a col near 680 m, so the col target was raised to 680 m rather than lowering Vesttind or touching North Peak. {e(col['b2aCorrection'])}</p></div>
<div class="tbl"><table><tr><th>Measure</th><th>B1.1</th><th>B2a</th></tr>
<tr><td>Real low point of the S0–S1 crest</td><td class="n">{c11['lowestPointOnArmCrestS0toS1']['levelM']} m at {c11['lowestPointOnArmCrestS0toS1']['xz']}</td><td class="n">{col['lowestPointOnArmCrestS0toS1']['levelM']} m at {col['lowestPointOnArmCrestS0toS1']['xz']}</td></tr>
<tr><td>Height at the authored col point (−770, 2690)</td><td class="n">{c11['b1LevelAtAuthoredPointM']} m</td><td class="n">{col['b1LevelAtAuthoredPointM']} m</td></tr>
<tr><td>Vesttind</td><td class="n">{c11['vesttindB1M']} m</td><td class="n">{col['vesttindB1M']} m</td></tr>
<tr><td>Vesttind prominence above the col</td><td class="n">{c11['vesttindProminenceAboveColM']} m</td><td class="n">{col['vesttindProminenceAboveColM']} m (target ≈ 55–56 m)</td></tr>
<tr><td>North Peak summit</td><td class="n">{b11v['summit']['b1M']} m</td><td class="n">{val['summit']['b1M']} m, island maximum: {val['summit']['islandMaximumIsNorthPeak']}</td></tr>
<tr><td>Drainage on either side of the col (30 m)</td><td colspan="2">north: code {col['drainageEitherSide']['north (30 m)']}, south: code {col['drainageEitherSide']['south (30 m)']} ({e(col['drainageEitherSide']['codes'])})</td></tr></table></div>
<p class="col">The real col is 40 m west of the authored point, where the Vestfjell plateau shoulder still holds the crest. The authored point itself stands {col['b1LevelAtAuthoredPointM']} m high. The prominence target is met; the col's position is not exact.</p>
<figure><img src="images/col-b2a.svg" alt="Crest profile North Peak to Vesttind and a north-south section through the col, B1.1 and B2a" loading="lazy"></figure>
{sheet('b2a-col-south','clayA','Western Col and Vesttind from the south.')}{sheet('b2a-col-south','clayB','')}
<div class="col"><h3>Skyline regression against B1.1</h3><p>Measured skylines (terrain ray cast, eye 1.75 m). Two windows may change, and each is declared with its reason: the D2 col and the D1 west-arm terminal beyond Vesttind's protected core. Everywhere else the tolerance is {sky['tolerancePx']} px, and the summit tolerance is {sky['summitTolerancePx']} px.</p></div>
<div class="tbl"><table><tr><th>View</th><th>Max shift outside windows</th><th>Summit</th><th>D2 window</th><th>D1 window</th><th>Status</th></tr>{skrows}</table></div>
<div class="grid2"><figure><img src="images/skyline-b2a-birchwood.svg" alt="Skyline B1.1 and B2a from Birchwood" loading="lazy"></figure><figure><img src="images/skyline-b2a-valley-shoulder.svg" alt="Skyline B1.1 and B2a from the Central Valley shoulder" loading="lazy"></figure></div></section>
<section><div class="col"><h2>5 · D3 · Hiking route</h2><p>Split into two routes with their own limits, both re-planned on the final rendered surface. The primary approach (<code>peak-ascent</code>, limit 0.30) follows the R1 alignment to the edited terrain. It then climbs to the highest node reachable within {design['route']['viewpointSearchM']} m of the declared Vestfjell shoulder viewpoint. The optional scramble (<code>peak-scramble</code>, limit 0.50) is a separate, explicitly identified route from the viewpoint to the summit. Grades are measured over 10 m on the rendered SW-diagonal triangle surface.</p></div>
<div class="tbl"><table><tr><th>Measure</th><th>B1.1 route (to summit)</th><th>B2a primary approach</th><th>B2a optional scramble</th></tr>
<tr><td>Length / climb</td><td class="n">{r11['lengthM']} m / {r11['climbM']} m</td><td class="n">{pa['lengthM']} m / {pa['climbM']} m</td><td class="n">{ps['lengthM']} m / {ps['climbM']} m</td></tr>
<tr><td>End</td><td class="n">summit</td><td class="n">viewpoint {pa['endM']} m, {val['route']['endDistanceToSummitM']} m from the summit</td><td class="n">summit {ps['endM']} m</td></tr>
<tr><td>Hiking grade (10 m) max / p95</td><td class="n">{b11v['route']['candidate']['hikingGrade10m']['maxMain']} / {b11v['route']['candidate']['hikingGrade10m']['p95Main']} (summit section max {r11['summitScramble']['maxGrade']})</td><td class="n">{pa['hikingGrade10mMax']} / {pa['p95']}</td><td class="n">{ps['hikingGrade10mMax']} / {ps['p95']}</td></tr>
<tr><td>Above the route's own limit</td><td class="n">{r11['over30PctOutsideScrambleM']} m over 0.30 outside the scramble</td><td class="n">{pa['overLimitM']} m over 0.30</td><td class="n">{ps['overLimitM']} m over 0.50 (in {len(ps['sectionsOverLimit'])} sections)</td></tr>
<tr><td>Terrain cross-slope ±2 m over 0.5 (new section)</td><td class="n">{r11['crossSlopeNewSection']['2m']['shareOver0.5']*100:.1f} %</td><td class="n">{pa['crossSlopeNewSection']['2m']['shareOver0.5']*100:.1f} %</td><td class="n">{ps['crossSlopeNewSection']['2m']['shareOver0.5']*100:.1f} %</td></tr>
<tr><td>Modelled tread cross-slope ±0.75 m: p95 / share over 0.15</td><td class="n">not modelled</td><td class="n">{pa['crossSlopeNewSection']['0.75m']['p95']} / {pa['crossSlopeNewSection']['0.75m']['shareOver0.15']*100:.0f} %</td><td class="n">{ps['crossSlopeNewSection']['0.75m']['p95']} / {ps['crossSlopeNewSection']['0.75m']['shareOver0.15']*100:.0f} %</td></tr>
<tr><td>Usable tread (cross-slope ≤ 0.5 both sides): share under 2 m</td><td class="n">{r11[TW]['shareBelow2m']*100:.1f} %</td><td class="n">{pa[TW]['shareBelow2m']*100:.1f} %</td><td class="n">{ps[TW]['shareBelow2m']*100:.1f} %</td></tr></table></div>
<p class="col">Primary grade histogram: {e(hist(pa['hikingGrade10mHistogramM']))}. Scramble: {e(hist(ps['hikingGrade10mHistogramM']))}.</p>
<p class="col"><b>Tread versus terrain.</b> {e(fin['D_route']['note'])} The bench is cut and filled in the rendered heightfield along {val['route']['candidate']['bench'][0]['benchedLengthM']} m, at most {val['route']['candidate']['bench'][0]['maxCutM']} m cut and {val['route']['candidate']['bench'][0]['maxFillM']} m fill. {val['route']['candidate']['bench'][0]['hairpinNodesKept']} nodes at switchback interiors are deliberately left as terrain. A 4 m grid cannot represent a 1–2 m tread, so tread comfort is reported as measured, not claimed: the primary tread stays below 0.5 cross-slope everywhere, but about half of it is above a comfortable 0.15.</p>
<figure><img src="images/route-b2a.svg" alt="Elevation profiles of the primary approach and the scramble coloured by hiking grade" loading="lazy"></figure>
<figure><img src="images/diff-b2a.png" alt="B2a minus B1.1 height difference with both routes and the D1 to D4 locations" loading="lazy"><figcaption>Plan: B2a − B1.1 with the primary approach (yellow), the scramble (orange) and the B1.1 route (white). The primary approach is routed on triangle edges only, which keeps the measured grade exact but gives it a grid-aligned plan with long straight legs; its lower switchbacks detour east to x ≈ −33.</figcaption></figure>
<div class="col"><h3>Genuine browser traversal on <code>?terrain=b2a-a</code></h3><p>The viewer's own <code>walkRouteForTest</code> (0.65 m sub-steps, a step is refused above grade 0.7) in the running Three.js viewer.</p></div>
<div class="tbl"><table><tr><th>Route</th><th>Blocked at</th><th>End distance</th><th>Points</th></tr>{wrows}</table></div>
<p class="col">Collision consistency (rendered vs canonical surface along each B2a route): {e('; '.join(f"{k} {v['maxCanonicalVsRenderedM']:.3f} m, water above terrain {v['maxWaterAboveTerrainM']:.1f} m" for k,v in coll.items()))}.</p>
{sheet('b2a-switchbacks','clayB','Switchbacks and benched traverses of the primary approach (elevated).')}{sheet('b2a-route-upper','clayA','On the primary approach, upper section.')}{sheet('b2a-route-viewpoint','clayB','At the primary approach viewpoint, looking at the Western Col and Vesttind.')}{sheet('b2a-route-scramble','clayA','On the optional scramble at the North gap, looking up the north arête.')}</section>
<section><div class="col"><h2>6 · D4 · Dry hollow outlet</h2><p>B1.1 left a {b11['C_hydrology']['dryHollows'][0]['areaHa']} ha closed hollow at (187, 2311), which priority flooding had filled by {b11['C_hydrology']['dryHollows'][0]['conditionedFillDepthM']} m. B2a gives it a natural outlet instead of a new tarn. A least-cut breach path runs {o1['pathLengthM']} m from the hollow floor ({o1['floorM']} m) to freely draining ground at {o1['outletEndXZ']}. It is carved as a small gully with a {o1['bedGrade']*100:.2f} % bed, cutting at most {o1['maxCutM']} m over {o1['carvedCells']} cells. Remaining dry hollows: {len(fin['C_hydrology']['dryHollows'])}. New dry sinks on the whole island: {hy['newDrySinkCells1cm']}.</p>
<p>The outlet path is smoothed in plan before carving. The first carve followed the 8-connected grid staircase, and with a bed narrower than a cell it aliased into a comb of notches. That was an implementation defect; it was fixed without changing any design parameter.</p></div>
<figure><img src="images/outlet-b2a.png" alt="Hillshade of the hollow and its outlet with flow paths, B1.1 and B2a" loading="lazy"></figure>
{sheet('b2a-outlet','clayA','Hollow outlet, elevated close-up.')}{sheet('b2a-outlet','clayB','')}
<div class="col"><h3>Drainage</h3><p>{hy['drainageDestinationChangedHa']} ha change their drainage destination relative to R1 (B1.1: {b11v['hydrology']['drainageDestinationChangedHa']} ha). High Tarn's catchment is {hy['highTarnCatchmentHa']['r1']} → {hy['highTarnCatchmentHa']['b1']} ha (B1.1: {b11v['hydrology']['highTarnCatchmentHa']['b1']} ha). Unresolved cells: {hy['unresolvedCellsB1']}, all present on R1 too. {e(fin['C_hydrology']['lakeAndRiverLevels'])}.</p></div></section>
<section><div class="col"><h2>7 · Artistic evaluation</h2><p>Judged on the real captures under both sun presets.</p></div><div class="tbl"><table><tbody>{artrows}</tbody></table></div></section>
<section><div class="col"><h2>8 · Engineering, validation and reproducibility</h2></div>
<div class="tbl"><table><tr><th>Check</th><th>Result</th></tr>
<tr><td>Nothing changes outside the study area; coastline and the 0–70 m coast band unchanged</td><td>{pill('pass' if pv['changedCellsOutsideStudyArea']==0 and pv['landSeaSignChanged']==0 and pv['coastBand0to70mChanged']==0 else 'fail')}</td></tr>
<tr><td>Every water cell, High Tarn (360 m) and 150 m around it, and both protected corridors unchanged</td><td>{pill('pass' if pv['waterCellsChanged']==0 and pv['highTarnLakeAnd150mChanged']==0 and pv['tarn-inlet-wCorridor40mChanged']==0 and pv['windward-gullyCorridor40mChanged']==0 else 'fail')}</td></tr>
<tr><td>All other route centrelines unchanged (Δ 0 m) and walkable</td><td>{pill('pass' if all(v==0 for k,v in pv['routeCentrelineMaxChangeM'].items() if k!='peak-ascent') and all(v==-1 for v in val['route']['otherRoutesWalkTestOnB1'].values()) else 'fail')}</td></tr>
<tr><td>Recomposition in memory equals the committed terrain</td><td>{pill('pass' if fin['recomposedEqualsCommitted'] else 'fail')}</td></tr>
<tr><td>Deterministic generation ({run['deterministicRuns']} runs, identical SHA-256)</td><td>{pill('pass' if run['deterministic'] else 'fail')}</td></tr>
<tr><td>{e(run['tests'])}</td><td>{pill('pass' if run['testsPass'] else 'fail')}</td></tr><tr><td>{e(run['build'])}</td><td>{pill('pass' if run['buildPass'] else 'fail')}</td></tr>
<tr><td>Protected files byte-identical to the B1.1 checkpoint (R1, A-R1 master, B1.1 design, patch, routes and evidence)</td><td>{pill('pass' if run['protectedUnchanged'] else 'fail')}</td></tr></table></div>
<p class="col">B2a changes {val['changes']['changedHa']} ha relative to R1 (B1.1: {b11v['changes']['changedHa']} ha). Full reports: <code>validation/a.json</code>, <code>validation/a-final.json</code>, <code>validation/traversal.json</code>, <code>data/skyline-regression.json</code>, <code>data/seam-area-cross-check.json</code>, <code>run-log.json</code>.</p></section>
<section><div class="col"><h2>9 · Design master B1.1 → B2a</h2><p>Every field that differs between the protected B1.1 design (<code>tools/geo-r02c-b01/design/north-massif-b1.json</code>, unchanged) and the B2a design. {e(design['revisionNote'])}</p></div>
<div class="tbl"><table class="defects"><colgroup><col style="width:28%"><col style="width:30%"><col></colgroup><tr><th>Field</th><th>B1.1</th><th>B2a</th></tr>{''.join(f"<tr><td><code>{e(c['path'])}</code></td><td>{e(str(c['b1.1'])[:110])}</td><td>{e(str(c['b2a'])[:160])}</td></tr>" for c in dchg if c['path'] not in ('revisionNote','status','designId'))}</table></div></section>
<section><div class="col"><h2>10 · Known-defect register</h2></div><div class="tbl"><table class="defects"><colgroup><col style="width:3.5rem"><col style="width:8rem"><col style="width:38%"><col></colgroup><tr><th>ID</th><th>Severity</th><th>Defect</th><th>Where it goes</th></tr>{''.join(f"<tr><td class='n'>{e(d['id'])}</td><td>{e(d['severity'])}</td><td>{e(d['title'])}</td><td>{e(d['next'])}</td></tr>" for d in notes['defects'])}</table></div></section>
<section class="col"><h2>11 · Remaining work for B2b</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['b2b'])}</ul></section>
<section><div class="col"><h2>12 · Provenance and checksums</h2><p>Branch {e(run['branch'])} from {e(run['base'])} (B1.1), created as the explicitly authorised one-time exception to AGENTS.md. Real Three.js captures are under <code>captures/</code>; each manifest records the frame's terrain SHA-256. Measured figures are <code>images/diff-b2a.png</code>, <code>seams-b2a.png</code>, <code>col-b2a.svg</code>, <code>outlet-b2a.png</code>, <code>route-b2a.svg</code> and <code>skyline-b2a-*.svg</code>. There is no design-only imagery on this page.</p></div>
<div class="tbl"><table><tr><th>Artifact</th><th>SHA-256</th></tr>{''.join(f"<tr><td><code>{e(k)}</code></td><td><code>{v}</code></td></tr>" for k,v in cks['key'].items())}</table></div><p class="col">The full list of {cks['fileCount']} files is in <code>data/checksums.json</code>.</p></section>
<section class="col"><h2>Limitations</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['limitations'])}</ul></section>
</div>
<script>
(function(){{
 var SRC={json.dumps(SRC)};var st={{view:document.getElementById('view').value,mode:'clayB',blink:false,show:'b2a-a'}};var NAME={{'b01-b1':'B1.1 (protected baseline)','b2a-a':'B2a candidate'}};var timer=null;
 function set(s,v){{var i=document.getElementById('img'+s),u=SRC[st.view][st.mode][v];i.style.visibility=u?'visible':'hidden';if(u)i.src=u;i.alt=NAME[v]+' capture';document.getElementById('cap'+s).textContent=NAME[v]+(u?'':' · not captured');}}
 function draw(){{document.querySelectorAll('[data-mode]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.mode===st.mode));}});
  document.getElementById('blink').setAttribute('aria-pressed',String(st.blink));document.getElementById('figR').hidden=st.blink;
  if(st.blink){{set('L',st.show);}}else{{set('L','b01-b1');set('R','b2a-a');}}}}
 document.getElementById('view').addEventListener('change',function(ev){{st.view=ev.target.value;draw();}});
 document.querySelectorAll('[data-mode]').forEach(function(b){{b.addEventListener('click',function(){{st.mode=b.dataset.mode;draw();}});}});
 document.getElementById('blink').addEventListener('click',function(){{st.blink=!st.blink;clearInterval(timer);if(st.blink){{timer=setInterval(function(){{st.show=st.show==='b2a-a'?'b01-b1':'b2a-a';draw();}},900);}}draw();}});draw();
}})();
</script>'''
Path(args.out).write_text(page);print('wrote',args.out,len(page))
