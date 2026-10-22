"""Builds docs/geo-r02c-a1a/review.html from the committed evidence: capture manifests, validation reports, sections,
maps, manifest and the run log. Every number on the page is read from those files."""
from pathlib import Path
import json,html,sys
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-a1a';HERE=Path(__file__).resolve().parent
man=json.loads((ROOT/'public/geo-r02c-a1a/manifest.json').read_text());cams=json.loads((HERE/'cameras.json').read_text())['cameras']
caps=[]
for f in sorted((DOC/'captures').glob('capture-manifest-*.json')):caps+=json.loads(f.read_text())['captures']
have={(c['variant'],c['mode'],c['view']) for c in caps}
val={v:json.loads((DOC/f'validation/{v}.json').read_text()) for v in ('m0','v1','v2','v3')}
sec=json.loads((DOC/'sections.json').read_text());run=json.loads((DOC/'run-log.json').read_text())
notes=json.loads((DOC/'art-notes.json').read_text())
V=[('m0','M0','R1 as committed (empty overlay)'),('v1','V1','ridge and flank sculpting'),('v2','V2','V1 + C1 Nordbotn'),('v3','V3','V2 + G1 gully study')]
def e(s):return html.escape(str(s))
rows=''
for v,short,lab in V:
 c=val[v]['checks'];d=c['deltaStats'];m=man['variants'][v]
 rows+=(f"<tr><td><b>{short}</b> · {e(lab)}</td><td class=mono>{m['terrainSha256'][:16]}…</td><td>{m['changedCells']:,}</td><td>{d['changedHa']}</td>"
  f"<td>{d['minM']:.1f} / +{d['maxM']:.1f}</td><td>{'✔' if c['protectedUnchanged'] else '✘'}</td><td>{c['newDrySinkCells1cm']}</td><td>{c['wetCellsChanged']}</td>"
  f"<td>{c['drainageDestinationChangedCells']}</td><td>{max(c['routeCentrelineMaxChangeM'].values()):.0f}</td><td>{c['coastBand0to150Changed']}</td><td>{d['maxDeltaGradient']:.2f}</td><td class={'ok' if c['pass'] else 'bad'}>{'pass' if c['pass'] else 'FAIL'}</td></tr>")
camopts=''.join(f'<option value="{c["id"]}">{e(c["name"])}</option>' for c in cams)
capjson=json.dumps(sorted([list(k) for k in have]))
secfigs=''.join(f'<figure><a href="images/section-{k}.svg" target="_blank" rel="noopener"><img src="images/section-{k}.png" alt="{e(s["title"])}" loading="lazy"></a><figcaption><b>{e(s["title"])}</b>. Max change vs M0: '+', '.join(f'{vv.upper()} {s["maxChangeM"][vv]:.1f} m' for vv in ('v1','v2','v3'))+(' · dashed = approved A1-D design target (authored, not terrain)' if s['designTarget'] else '')+'</figcaption></figure>' for k,s in sec.items())
artrows=''.join(f"<tr><td><b>{e(n['criterion'])}</b></td>"+''.join(f"<td>{e(n[v])}</td>" for v in ('v1','v2','v3'))+"</tr>" for n in notes['criteria'])
page=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover"><title>North Peak Form Study</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600&display=swap" rel="stylesheet">
<style>
:root{{--bg:#f6f4ef;--surface:#fffdf9;--surface-2:#efebe3;--ink:#1f1d1a;--ink-2:#55504a;--line:#ddd6ca;--accent:#c2410c;--accent-ink:#9a3412;--ok:#3f6212;--bad:#b91c1c;--chip:#f1e6da;--blue:#2f6fb0}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#171614;--surface:#201e1b;--surface-2:#2a2723;--ink:#ece8e1;--ink-2:#b2aba0;--line:#3a3631;--accent:#fb923c;--accent-ink:#fdba74;--ok:#a3c46a;--bad:#f87171;--chip:#3a2d22;--blue:#7fb2e5}}}}
:root[data-theme="dark"]{{--bg:#171614;--surface:#201e1b;--surface-2:#2a2723;--ink:#ece8e1;--ink-2:#b2aba0;--line:#3a3631;--accent:#fb923c;--accent-ink:#fdba74;--ok:#a3c46a;--bad:#f87171;--chip:#3a2d22;--blue:#7fb2e5}}
*{{box-sizing:border-box}}html{{-webkit-text-size-adjust:100%}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 Inter,system-ui,sans-serif}}
.wrap{{max-width:1180px;margin:0 auto;padding:30px max(16px,env(safe-area-inset-right)) 80px max(16px,env(safe-area-inset-left))}}
h1,h2,h3{{font-family:"Source Serif 4",Georgia,serif;font-weight:600;line-height:1.2}}h1{{font-size:clamp(28px,4.2vw,40px);margin:8px 0 10px}}
h2{{font-size:24px;margin:52px 0 10px;padding-top:12px;border-top:1px solid var(--line)}}h3{{font-size:17px;margin:20px 0 6px}}
p{{margin:0 0 12px}}.lede{{font-size:17px;color:var(--ink-2);max-width:72ch}}.eyebrow{{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2);font-weight:600}}
.chips{{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}}.chip{{background:var(--chip);color:var(--accent-ink);border-radius:999px;padding:3px 10px;font-size:12.5px;font-weight:600}}
.chip.blue{{background:color-mix(in srgb,var(--blue) 16%,transparent);color:var(--blue)}}
.card{{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:14px 0}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:14px}}
.tbl{{width:100%;overflow-x:auto}}table{{border-collapse:collapse;width:100%;font-size:13px;min-width:760px}}th,td{{text-align:left;vertical-align:top;padding:7px 8px;border-bottom:1px solid var(--line)}}
th{{background:var(--surface-2);color:var(--ink-2);font-size:12px;font-weight:600}}.mono{{font-family:ui-monospace,Menlo,monospace;font-size:12px}}.ok{{color:var(--ok);font-weight:700}}.bad{{color:var(--bad);font-weight:700}}
code{{font-family:ui-monospace,Menlo,monospace;font-size:.86em;background:var(--surface-2);padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}}
figure{{margin:12px 0}}figure img{{width:100%;height:auto;display:block;border-radius:8px;border:1px solid var(--line);background:#fffdf9}}figcaption{{font-size:13px;color:var(--ink-2);margin-top:6px}}
.ctl{{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:10px 0}}select{{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);max-width:100%}}
.seg{{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:3px;background:var(--surface);gap:2px;flex-wrap:wrap}}
.seg button{{font:inherit;font-size:13px;border:0;background:transparent;color:var(--ink-2);padding:5px 12px;border-radius:999px;cursor:pointer}}.seg button[aria-pressed="true"]{{background:var(--ink);color:var(--bg)}}
.pair{{display:grid;grid-template-columns:1fr 1fr;gap:8px}}@media (max-width:700px){{.pair{{grid-template-columns:1fr}}}}
.pair figure{{margin:0}}.tag{{font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;background:var(--surface-2);color:var(--ink-2)}}
.note{{border-left:3px solid var(--accent);padding:4px 0 4px 14px;color:var(--ink-2);margin:12px 0}}.stop{{background:var(--ink);color:var(--bg);border-radius:12px;padding:18px 20px;margin-top:40px}}.stop h3{{margin-top:0;color:var(--bg)}}
ul{{padding-left:22px}}li{{margin:3px 0}}
</style></head><body><div class="wrap">
<div class="eyebrow">Aurora Rest · GEO-R02C-A1a · first sculptural form study · {e(run['date'])}</div>
<h1>North Peak form study: M0 / V1 / V2 / V3</h1>
<p class="lede">{e(notes['lede'])}</p>
<div class="chips"><span class="chip">Generated terrain, rendered in the real Three.js viewer</span><span class="chip blue">R1 and the design master untouched</span><span class="chip">Review-only variants (opt-in)</span><span class="chip">Awaiting independent review</span></div>
<div class="card"><b>Provenance.</b> Branch <code>feature/geo-r02c-a1a-form-study</code> from the approved A1-D checkpoint <code>15c0977</code> (R1 <code>b6784a9</code> and P0 <code>90d0cb7</code> verified as ancestors). Variants are exact float32 patches on the immutable R1 grid (<code>public/geo-r02c-a1a/</code>); the viewer composes them only with <code>?terrain=a1a-v1|v2|v3|m0</code> and refuses any composition whose SHA-256 differs from the manifest. <b>Generated terrain</b> is everything rendered or plotted as solid lines here; <b>authored design targets</b> appear only as dashed lines in the sections.</div>

<h2>1. Verdict at a glance</h2>
<div class="tbl"><table><tr><th>Criterion</th><th>V1 · ridges</th><th>V2 · + C1</th><th>V3 · + G1</th></tr>{artrows}</table></div>
<p class="note">{e(notes['overall'])}</p>

<h2>2. Real renders from fixed viewpoints</h2>
<p>Same cameras, viewport (1280 × 800), sun presets and materials for every variant; walk cameras stand 1.75 m above the loaded variant's ground. Pick a viewpoint and a lighting mode, then two variants to compare.</p>
<div class="ctl"><select id="cam" aria-label="Viewpoint">{camopts}</select>
<div class="seg" id="mode" role="group" aria-label="Lighting"><button aria-pressed="true" data-v="clayB">Clay sun B (SE)</button><button aria-pressed="false" data-v="clayA">Clay sun A (WNW)</button><button aria-pressed="false" data-v="standard">Standard</button></div></div>
<div class="ctl"><span class="tag">left</span><div class="seg" id="left">{''.join(f'<button aria-pressed="{str(v=="m0").lower()}" data-v="{v}">{s}</button>' for v,s,_ in V)}</div>
<span class="tag">right</span><div class="seg" id="right">{''.join(f'<button aria-pressed="{str(v=="v2").lower()}" data-v="{v}">{s}</button>' for v,s,_ in V)}</div></div>
<div class="pair"><figure><img id="imgL" alt=""><figcaption id="capL"></figcaption></figure><figure><img id="imgR" alt=""><figcaption id="capR"></figcaption></figure></div>

<h2>3. Terrain difference and form maps (top-down, x −900…1000, z 2150…3300)</h2>
<div class="grid2">
<figure><img src="images/map-hillshade-m0.png" alt="M0 hillshade" loading="lazy"><figcaption><b>M0</b> R1 clay hillshade</figcaption></figure>
<figure><img src="images/map-hillshade-v3.png" alt="V3 hillshade" loading="lazy"><figcaption><b>V3</b> same lighting (includes V1 and V2)</figcaption></figure>
<figure><img src="images/map-delta-v1.png" alt="V1 difference" loading="lazy"><figcaption><b>V1 − M0</b>: blue = lowered, red = raised, ±40 m colour scale</figcaption></figure>
<figure><img src="images/map-delta-v2.png" alt="V2 difference" loading="lazy"><figcaption><b>V2 − M0</b></figcaption></figure>
<figure><img src="images/map-delta-v3.png" alt="V3 difference" loading="lazy"><figcaption><b>V3 − M0</b> (G1 fill shows red)</figcaption></figure>
<figure><img src="images/map-freedom-mask-v3.png" alt="Freedom mask" loading="lazy"><figcaption><b>Freedom mask M (V3)</b>: green = editable (brightness = weight); dark = protected (crest bands, trail corridors, water, divides, frozen zones, coast, outside window)</figcaption></figure>
</div>

<h2>4. Matched cross-sections</h2>
<p>Solid = generated terrain (M0 grey, V1 blue, V2 orange, V3 green; later variants overdraw earlier ones where identical). Dashed black = approved A1-D design target. True scale unless stated.</p>
{secfigs}

<h2>5. Geographic and hydrological validation</h2>
<div class="tbl"><table><tr><th>Variant</th><th>Terrain SHA-256</th><th>Changed cells</th><th>ha</th><th>Δ min / max (m)</th><th>Protected unchanged</th><th>New dry sink cells</th><th>Wet cells changed</th><th>Cells rerouted</th><th>Trail centreline Δ (m)</th><th>Coast 0–150 m changed</th><th>Max |∇Δ|</th><th>Result</th></tr>{rows}</table></div>
<p>Protected classes checked cell by cell: sea, lakes, channel sections, valley floors (except the declared G1 release), other R1 equality cells, crest lower-bound bands, trail corridors, frozen zones, catchment divides off the crests, and every cell with an R1 water surface. Also: crest cells never below bound, land/sea sign unchanged, the outside of the window box byte-identical. Independent check in <code>tests/geo-r02c-a1a.test.ts</code>: the P0 priority flood gives maximum spill depth = R1's 0.033 m and zero new cells over 1 cm for every variant.</p>

<h2>6. Parity, determinism and cost</h2>
<div class="grid2"><div class="card"><b>Empty-overlay parity.</b> M0 runs the whole pipeline (constraints, mask, operators = none, compose) and writes no patch; its terrain SHA-256 is <code>{man['variants']['m0']['terrainSha256']}</code> = canonical R1. The TypeScript test composes M0 through the viewer's code path and gets the same hash.</div>
<div class="card"><b>Determinism.</b> {e(run['determinism'])}</div>
<div class="card"><b>Generation cost.</b> {e(run['cost'])}</div>
<div class="card"><b>Tests and build.</b> {e(run['tests'])}</div><div class="card"><b>Default viewer path.</b> {e(run['defaultViewerPath'])}</div></div>

<h2>7. Remaining defects, trade-offs and recommendations</h2>
{notes['defectsHtml']}

<div class="stop"><h3>Stopped for independent artistic and technical review</h3><p style="margin:0">A1a study only. C2-a, B1–B3, towers, A2/Cairn Saddle, coast refinement and nature assets were not started. Nothing was merged, deployed or pushed.</p></div>
</div>
<script>
const CAPS=new Set({capjson}.map(x=>x.join('|')));const L={{m0:'M0 · R1',v1:'V1 · ridges',v2:'V2 · + C1',v3:'V3 · + G1'}};
const st={{cam:document.getElementById('cam').value,mode:'clayB',left:'m0',right:'v2'}};
function seg(id,key){{const g=document.getElementById(id);g.addEventListener('click',ev=>{{const b=ev.target.closest('button');if(!b)return;for(const o of g.querySelectorAll('button'))o.setAttribute('aria-pressed',String(o===b));st[key]=b.dataset.v;show();}});}}
function src(v){{let m=st.mode;if(!CAPS.has([v,m,st.cam].join('|')))m='clayB';return CAPS.has([v,m,st.cam].join('|'))?{{src:`captures/${{v}}/${{m}}/${{st.cam}}.jpg`,m}}:null;}}
function put(side,v){{const s=src(v),img=document.getElementById('img'+side),cap=document.getElementById('cap'+side);if(s){{img.src=s.src;img.alt=L[v]+' '+st.cam;cap.innerHTML='<b>'+L[v]+'</b> · '+s.m+(s.m!==st.mode?' (no '+st.mode+' capture for this view)':'');}}else{{img.removeAttribute('src');cap.textContent='not captured';}}}}
function show(){{put('L',st.left);put('R',st.right);}}
document.getElementById('cam').addEventListener('change',e=>{{st.cam=e.target.value;show();}});seg('mode','mode');seg('left','left');seg('right','right');show();
</script></body></html>'''
(DOC/'review.html').write_text(page);print('review.html',len(page))
