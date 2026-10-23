"""Builds docs/geo-r02c-a1c/review.html from the measured data and the art notes.
--a1a-base / --a1b-base set where the page finds the committed A1a M0 and A1b-alpha captures (defaults: the repository copies).
Usage: python3 tools/geo-r02c-a1c/build_review.py [--a1a-base PATH] [--a1b-base PATH] [--out FILE]"""
from pathlib import Path
import argparse,html,json
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-a1c'
a=argparse.ArgumentParser();a.add_argument('--a1a-base',default='../geo-r02c-a1a/captures');a.add_argument('--a1b-base',default='../geo-r02c-a1b-alpha/captures');a.add_argument('--out',default=str(DOC/'review.html'));args=a.parse_args()
J=lambda p:json.loads((DOC/p).read_text())
val=J('validation/s1.json')['checks'];val0=J('validation/m0.json')['checks'];ev=J('data/evidence-s1.json');px=J('data/pixel_diff.json')['views'];notes=J('art-notes.json');feas=J('feasibility/feasibility.json');run=J('run-log.json');e=html.escape
man=json.loads((ROOT/'public/geo-r02c-a1c/manifest.json').read_text())['variants'];spec=json.loads((ROOT/'tools/geo-r02c-a1c/specs/a1c-s1.json').read_text())
CAMS=[c for f in ('geo-r02c-a1a','geo-r02c-a1b','geo-r02c-a1c') for c in json.loads((ROOT/'tools'/f/'cameras.json').read_text())['cameras']];names={c['id']:c['name'] for c in CAMS}
order=['a1a-birchwood','a1a-valley-shoulder','a1c-west-coast','a1c-tarn-east','a1a-tarn-overlook','a1b-face-from-upper-route','a1a-west-arm','a1a-oblique-se','a1a-oblique-n']
def loc(v,m,view):
 own=DOC/'captures'/v/m/f'{view}.jpg'
 if own.exists():return f'captures/{v}/{m}/{view}.jpg'
 if v=='a1a-m0':return f'{args.a1a_base}/m0/{m}/{view}.jpg' if (ROOT/'docs/geo-r02c-a1a/captures/m0'/m/f'{view}.jpg').exists() else f'{args.a1b_base}/a1a-m0/{m}/{view}.jpg'
 if v=='a1b-alpha':return f'{args.a1b_base}/a1b-alpha/{m}/{view}.jpg'
SRC={view:{m:{v:loc(v,m,view) for v in ('a1a-m0','a1b-alpha','a1c-s1')} for m in ('clayA','clayB')} for view in order}
opts=''.join(f'<option value="{v}">{e(names.get(v,v))}</option>' for v in order)
ok=lambda b:'<span class="ok">pass</span>' if b else '<span class="bad">fail</span>'
d=man['s1']['declared'];t=val['transitions'];s=val['summit']
checks=[('Empty overlay M0 = canonical R1 (byte for byte)',val0['pass'] and man['m0']['terrainSha256']==man['m0']['baseTerrainSha256']),
 ('Outside the window unchanged',val['outsideWindowBboxUnchanged']),
 ('Every protected class except crest unchanged, cell for cell (sea, lakes, wet, valley floors, divides, corridors, zones, water surface)',val['protectedUnchangedExceptDeclaredCrest']),
 (f'Every changed cell declared in the overlay manifest ({d["crestCellsRaised"]:,} crest + {d["shoulderCellsChanged"]:,} shoulder)',val['allChangedCellsDeclared']),
 (f'Crest raise-only, never below its lower bound (0 lowered, max +{val["crestRelease"]["maxCrestRaiseM"]:.1f} m)',val['crestRelease']['crestCellsLowered']==0 and val['crestCellsBelowBound']==0),
 (f'Summit position and height unchanged ({s["heightR1M"]:.2f} m); nearest change {s["closestChangeToSummitM"]:.0f} m away',s['unchanged'] and s['windowMaximumUnchanged']),
 (f'Nearest change {s["closestChangeToTrailM"]:.1f} m from the peak-ascent / tarn-ascent centrelines (required ≥ 135 m)',s['closestChangeToTrailM']>=135),
 ('No new dry sinks (priority flood)',val['newDrySinkCells1cm']==0),('No drainage-destination change (no catchment rerouted)',val['drainageDestinationChangedCells']==0),
 ('Water, lakes and channel beds unchanged',val['wetCellsChanged']==0),('Land/sea and coast 0–150 m unchanged',val['landSeaSignChanged']==0 and val['coastBand0to150Changed']==0),
 ('Route centrelines unchanged (Δ = 0 m on all six) and cross-slope unchanged at 8 m and 20 m',max(val['routeCentrelineMaxChangeM'].values())==0 and all(o['maxChange']==0 for r in val['routeCrossSlope'].values() for o in r.values())),
 (f'Smooth transitions: fade gradient max {t["deltaGradientFade"]["max"]:.3f} ≤ core {t["deltaGradientCore"]["max"]:.3f}; curvature {t["deltaCurvatureFade"]["max"]:.3f} ≤ {t["deltaCurvatureCore"]["max"]:.3f}',t['smooth']),
 ('Deterministic generation (2 runs, identical SHA-256)',run['deterministic']),(e(run['tests']),run['testsPass']),(e(run['build']),run['buildPass'])]
crows=''.join(f'<tr><td>{x}</td><td>{ok(b)}</td></tr>' for x,b in checks)
VO=['birchwood','valley-shoulder','west-coast','high-tarn','tarn-overlook','tarn-shore','approach-mid','upper-trail','oblique-se','oblique-n']
def frow(k):
 v=feas['viewpoints'][k];sk=ev['skylines'][k];vs=ev['viewshed'].get(k);fr=sum(x for a_,x in v['skylineFormedByPct'].items() if 'frozen' in a_)
 return f'<tr><td>{e(v["name"])}</td><td class="n">{v["distanceToSummitM"]/1000:.1f} km</td><td class="n">{fr:.0f} %</td><td class="n">{v["envelopeShiftPx"]["max"]:g}</td><td class="n">{sk["maxShiftPx"]:g}</td><td class="n">{sk["widthShiftOver3pxDeg"]:g}°</td><td class="n">{(str(vs["newlyHiddenHa"])+" / "+str(vs["newlyVisibleHa"])) if vs else "–"}</td></tr>'
segrows=''.join(f'<tr><td>{e(g["id"])}</td><td>{e(g["ridge"])}</td><td class="n">+{max(p[1] for p in g["profile"]):g} m</td><td class="n">{g["profile"][0][0]:g}–{g["profile"][-1][0]:g} m</td><td class="n">{g["widthM"]["left"]} / {g["widthM"]["right"]} m</td><td>{e(g.get("character",""))}</td></tr>' for op in spec['operators'] for g in op.get('segments',[]))
crest=''.join(f'<tr><td>{e(r)}</td><td class="n">{x["crestCells"]}</td><td class="n">{next(p["raisedLengthOver2mM"] for p in ev["crestProfiles"] if p["ridge"]==r)} m</td><td class="n">+{x["maxRaiseM"]} m</td></tr>' for r,x in ev['affectedCrest'].items())
pxrows=''.join(f'<tr><td>{e(names.get(v,v))}</td>'+''.join(f'<td class="n">{px[v][m]["a1b-alpha"]} / {px[v][m]["a1c-s1"]}</td>' for m in ('clayA','clayB'))+'</tr>' for v in order if v in px)
sheets={p.name for p in (DOC/'images').glob('compare-*.jpg')}
def sheet(view,mode,cap=''):n=f'compare-{view}-{mode}.jpg';return f'<figure><img src="images/{n}" alt="{e(names.get(view,view))}, {mode}: M0, A1b-α and S1" loading="lazy">{f"<figcaption>{e(cap)}</figcaption>" if cap else ""}</figure>' if n in sheets else ''
artrows=''.join(f'<tr><th scope="row">{e(q)}</th><td>{e(a_)}</td></tr>' for q,a_ in notes['questions'])
xs=sorted(p.name for p in (DOC/'images').glob('xsec-s1-*.svg'));cr=sorted(p.name for p in (DOC/'images').glob('crest-s1-*.svg'))
page=f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>North Peak A1c Massing</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: field-survey review sheet (same system as the A1b-α page). One reading column with full-width plates; data set in mono. */
:root{{--bg:#f2f4f4;--plate:#fff;--ink:#1a2226;--muted:#56646b;--line:#d5dcde;--accent:#1d6a86;--soft:#e1eef3;--alpha:#c2410c;--okc:#1f7a4d;--badc:#b42318;
 --f-d:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--f-b:"Source Sans 3","Segoe UI",system-ui,sans-serif;--f-m:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--alpha:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--alpha:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--ink);font:400 1.05rem/1.6 var(--f-b);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 4rem}}
.wrap{{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:3rem}}.col{{max-width:72ch}}
header{{padding-block:2.4rem 1.2rem;border-bottom:1px solid var(--line)}}.eyebrow{{font:600 .8rem/1 var(--f-m);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}}
h1{{font:700 clamp(2.2rem,6vw,3.6rem)/1 var(--f-d);margin:.5rem 0 .7rem;text-wrap:balance}}h2{{font:700 clamp(1.6rem,3.4vw,2.2rem)/1.05 var(--f-d);margin:0 0 .6rem;text-wrap:balance}}h3{{font:600 1.3rem/1.2 var(--f-d);margin:1.4rem 0 .4rem}}
.chips{{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.9rem}}.chip{{font:600 .76rem/1 var(--f-m);padding:.42rem .6rem;border:1px solid var(--line);border-radius:3px;background:var(--plate);color:var(--muted);overflow-wrap:anywhere}}
.verdict{{border-left:4px solid var(--alpha);background:var(--plate);border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:1rem 1.2rem}}
.verdict b.v{{font:700 1.6rem/1.05 var(--f-d);color:var(--alpha);display:block;margin-bottom:.4rem}}
figure{{margin:.8rem 0;background:var(--plate);border:1px solid var(--line);padding:.5rem}}figure img{{display:block;width:100%;height:auto}}figcaption{{font-size:.9rem;color:var(--muted);padding:.45rem .2rem 0}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:1rem}}.grid2 figure{{margin:0}}
.tbl{{overflow-x:auto;border:1px solid var(--line);background:var(--plate);margin:.8rem 0}}table{{border-collapse:collapse;width:100%;font-size:.95rem}}
th,td{{text-align:left;padding:.5rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}}th{{font:600 .76rem/1.2 var(--f-m);letter-spacing:.04em;text-transform:uppercase;color:var(--muted);background:var(--soft)}}
tbody th{{font:600 .95rem/1.4 var(--f-b);text-transform:none;letter-spacing:0;color:var(--ink);background:transparent;width:30%}}td.n{{font-family:var(--f-m);font-variant-numeric:tabular-nums;white-space:nowrap}}tr:last-child td,tr:last-child th{{border-bottom:0}}
.ok{{font:600 .8rem/1 var(--f-m);color:var(--okc)}}.bad{{font:600 .8rem/1 var(--f-m);color:var(--badc)}}
.ctl{{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.6rem 0}}.ctl>*{{min-width:0}}select,button{{font:600 .9rem/1 var(--f-m);padding:.55rem .7rem;border:1px solid var(--line);background:var(--plate);color:var(--ink);border-radius:3px}}select{{max-width:100%}}
button{{cursor:pointer}}button[aria-pressed="true"]{{background:var(--accent);border-color:var(--accent);color:var(--bg)}}button:focus-visible,select:focus-visible{{outline:3px solid var(--accent);outline-offset:2px}}
.cmp{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:.8rem}}.cmp figure{{margin:0}}.lbl{{font:600 .78rem/1 var(--f-m);text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}}
code{{font-family:var(--f-m);font-size:.88em;overflow-wrap:anywhere}}.wrap>*{{min-width:0}}ul.tight{{margin:.4rem 0;padding-left:1.2rem}}ul.tight li{{margin:.25rem 0}}
</style>
<div class="wrap">
<header><div class="eyebrow">Aurora Rest · GEO-R02C · A1c · macro-massing &amp; silhouette study</div><h1>North Peak A1c Massing</h1>
<p class="col">Can the authorised R-B trial, with raise-only crest and shoulder changes of up to +25 m on secondary segments and every other protection kept, change how North Peak reads as a mountain? A feasibility study on R1, then one candidate (S1, asymmetric ridge massing), compared with canonical R1 (M0) and the rejected A1b-α face study using the same cameras, sun presets and clay material.</p>
<div class="chips"><span class="chip">{e(run['branch'])}</span><span class="chip">S1 {man['s1']['terrainSha256'][:12]}…</span><span class="chip">R1 fc8fd6da… untouched</span><span class="chip">design master untouched</span><span class="chip">S2 not generated</span><span class="chip">R-A, R-C not implemented</span></div></header>
<section><div class="verdict col"><b class="v">{e(notes['verdict'])}</b>{''.join(f'<p>{e(p)}</p>' for p in notes['summary'])}</div></section>
<section><div class="col"><h2>1 · Feasibility: what the envelope can reach</h2><p>For each viewpoint, measured on R1: which terrain forms the North Peak skyline, and how far it could move if every eligible crest and shoulder point were raised the full 25 m (an upper bound with no hydrology guarantees). The second value is S1 as built.</p></div>
<figure><img src="images/feasibility.svg" alt="Bar charts: skyline composition per viewpoint and maximum skyline shift for the +25 m upper bound and for S1" loading="lazy"><figcaption>From the two identity views (Birchwood, Central Valley shoulder), half the skyline is frozen and the upper bound is under 10 px: at 2.5–2.9 km, 25 m subtends about 0.5°. The large near-field bounds (tarn overlook, ascent) mostly vanish once drainage destinations are preserved.</figcaption></figure>
<div class="tbl"><table><tr><th>Viewpoint</th><th>Distance</th><th>Skyline frozen</th><th>Upper bound, px</th><th>S1, px</th><th>S1 width &gt; 3 px</th><th>Viewshed hidden / new, ha</th></tr>{''.join(frow(k) for k in VO)}</table></div></section>
<section><div class="col"><h2>2 · Compare real renders</h2><p>Same camera, sun and material for every variant. Walk cameras stand 1.75 m above the loaded terrain. Clay only: no standard-material gallery, per the brief, because the first images showed no meaningful improvement.</p></div>
<div class="ctl"><label class="lbl" for="view">Viewpoint</label><select id="view">{opts}</select>
<span class="lbl">Light</span><button type="button" data-mode="clayA" aria-pressed="false">Clay sun A (WNW, low)</button><button type="button" data-mode="clayB" aria-pressed="true">Clay sun B (SE)</button></div>
<div class="cmp"><figure><img id="imgL" alt="M0 capture" width="1280" height="800"><figcaption id="capL">M0 = R1</figcaption></figure><figure><img id="imgR" alt="S1 capture" width="1280" height="800"><figcaption id="capR">A1c S1</figcaption></figure></div>
<div class="ctl"><span class="lbl">Left</span><button type="button" data-side="L" data-v="a1a-m0" aria-pressed="true">M0</button><button type="button" data-side="L" data-v="a1b-alpha" aria-pressed="false">A1b-α</button><button type="button" data-side="L" data-v="a1c-s1" aria-pressed="false">S1</button>
<span class="lbl">Right</span><button type="button" data-side="R" data-v="a1a-m0" aria-pressed="false">M0</button><button type="button" data-side="R" data-v="a1b-alpha" aria-pressed="false">A1b-α</button><button type="button" data-side="R" data-v="a1c-s1" aria-pressed="true">S1</button></div>
<h3>Matched sheets (M0 | A1b-α | S1), with a crop of the massif</h3>
{sheet('a1a-birchwood','clayA','Birchwood: the identity view. S1 adds small dark humps on both arms; the skyline moves at most 4.2 px.')}{sheet('a1a-valley-shoulder','clayB','Central Valley shoulder: no readable change (0.01 % of pixels).')}
{sheet('a1c-west-coast','clayB','Western coast: the one view where S1 visibly lifts a skyline (the west-spur saddle, ~15 px). A soft lift, not a new profile.')}{sheet('a1a-oblique-se','clayA','South-east oblique: the raised faces read as lumps, and the drainage-preserving attenuation leaves a hook-shaped notch (centre right).')}
{sheet('a1c-tarn-east','clayB','High Tarn east shore: faint steps on the skyline beside the summit.')}{sheet('a1a-oblique-n','clayB')}</section>
<section><div class="col"><h2>3 · Artistic evaluation</h2><p>Judged on the real captures under both sun presets. Pixel counts show visibility only, not quality.</p></div>
<div class="tbl"><table><tbody>{artrows}</tbody></table></div>
<div class="tbl"><table><tr><th>View · pixels changed vs M0 (A1b-α / S1), %</th><th>Clay A</th><th>Clay B</th></tr>{pxrows}</table></div>
<p class="col"><b>S2:</b> {e(notes['s2'])}</p></section>
<section><div class="col"><h2>4 · S1 terrain</h2><p>Six declared raise segments on four ridges. The profile gives the designed crest raise along the ridge from its origin; the flow cap and drainage-destination guarantee then reduce it where needed.</p></div>
<div class="tbl"><table><tr><th>Segment</th><th>Ridge</th><th>Designed peak</th><th>Span along ridge</th><th>Flank widths L / R</th><th>Intended character</th></tr>{segrows}</table></div>
<div class="tbl"><table><tr><th>Ridge</th><th>Crest cells raised</th><th>Crest length raised &gt; 2 m</th><th>Max crest raise</th></tr>{crest}</table></div>
<p class="col">In total {man['s1']['changedCells']:,} cells change ({d['changedHa']} ha, of which {ev['changedHa']} ha by more than 5 cm), all raised, maximum +{d['maxRaiseM']} m. The full cell list is <code>public/geo-r02c-a1c/s1.declared.json</code>.</p>
<figure><img src="images/maps-s1.png" alt="Plan view: hillshade of M0 and S1 with the difference map" loading="lazy"><figcaption>Plan view and difference map: six separate patches. The 150 m summit freeze and the A3 trail corridor prevent any of them from joining the summit.</figcaption></figure>
<figure><img src="images/skylines-s1.svg" alt="Before and after skylines for each viewpoint" loading="lazy"><figcaption>Before/after skylines (terrain ray cast, actual S1 terrain).</figcaption></figure>
<div class="grid2">{''.join(f'<figure><img src="images/{n}" alt="Crest profile {e(n[9:-4])}" loading="lazy"></figure>' for n in cr)}</div>
<div class="grid2">{''.join(f'<figure><img src="images/{n}" alt="Cross-section {e(n[8:-4])}" loading="lazy"></figure>' for n in xs)}</div></section>
<section><div class="col"><h2>5 · Technical gates</h2><p>The unmodified A1a suite reports pass = false because crest cells change; the A1c pass applies under the declared R-B trial and is otherwise stricter.</p></div><div class="tbl"><table><tr><th>Gate</th><th>Result</th></tr>{crows}</table></div>
<p class="col">Full reports: <code>validation/s1.json</code>, <code>validation/m0.json</code>, <code>feasibility/feasibility.json</code>, <code>data/evidence-s1.json</code>, <code>data/pixel_diff.json</code>, <code>run-log.json</code>.</p></section>
<section class="col"><h2>Limitations</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['limitations'])}</ul></section>
<section class="col"><h2>Recommendation</h2>{''.join(f'<p>{e(x)}</p>' for x in notes['recommendation'])}</section>
</div>
<script>
(function(){{
 var SRC={json.dumps(SRC)};var st={{view:document.getElementById('view').value,mode:'clayB',L:'a1a-m0',R:'a1c-s1'}};
 var NAME={{'a1a-m0':'M0 = R1','a1b-alpha':'A1b-α (rejected)','a1c-s1':'A1c S1'}};
 function draw(){{document.querySelectorAll('[data-mode]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.mode===st.mode));}});
  ['L','R'].forEach(function(s){{var i=document.getElementById('img'+s);i.src=SRC[st.view][st.mode][st[s]];i.alt=NAME[st[s]]+' capture';document.getElementById('cap'+s).textContent=NAME[st[s]];
   document.querySelectorAll('[data-side="'+s+'"]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.v===st[s]));}});}});}}
 document.getElementById('view').addEventListener('change',function(ev){{st.view=ev.target.value;draw();}});
 document.querySelectorAll('[data-mode]').forEach(function(b){{b.addEventListener('click',function(){{st.mode=b.dataset.mode;draw();}});}});
 document.querySelectorAll('[data-side]').forEach(function(b){{b.addEventListener('click',function(){{st[b.dataset.side]=b.dataset.v;draw();}});}});draw();
}})();
</script>'''
Path(args.out).write_text(page);print('wrote',args.out,len(page))
