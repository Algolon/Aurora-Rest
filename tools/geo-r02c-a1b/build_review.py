"""Builds docs/geo-r02c-a1b-alpha/review.html from the measured data and the art notes.
--a1a-base sets where the page finds the committed A1a captures (default: ../geo-r02c-a1a/captures, i.e. inside the repository).
Usage: python3 tools/geo-r02c-a1b/build_review.py [--a1a-base PATH] [--out FILE]"""
from pathlib import Path
import argparse,html,json
ROOT=Path(__file__).resolve().parents[2];DOC=ROOT/'docs/geo-r02c-a1b-alpha'
a=argparse.ArgumentParser();a.add_argument('--a1a-base',default='../geo-r02c-a1a/captures');a.add_argument('--out',default=str(DOC/'review.html'));args=a.parse_args()
J=lambda p:json.loads((DOC/p).read_text())
val=J('validation/alpha.json')['checks'];val0=J('validation/m0.json')['checks'];ev=J('data/evidence.json');px=J('data/pixel_diff.json')['views'];notes=J('art-notes.json')
pas=J('validation/passability.json');run=J('run-log.json');e=html.escape
man=json.loads((ROOT/'public/geo-r02c-a1b/manifest.json').read_text())['variants']
CAMS=[c for c in json.loads((ROOT/'tools/geo-r02c-a1a/cameras.json').read_text())['cameras']]+json.loads((ROOT/'tools/geo-r02c-a1b/cameras.json').read_text())['cameras']
names={c['id']:c['name'] for c in CAMS}
order=['a1a-birchwood','a1a-valley-shoulder','a1a-tarn-overlook','a1a-tarn-shore','a1a-approach-mid','a1a-approach-upper','a1b-face-from-upper-route','a1b-face-from-route','a1a-oblique-se','a1a-oblique-c1','a1a-oblique-n','a1a-west-arm','a1a-summit-into-c1','a1a-ncrown-ridge','a1a-c1-floor','a1a-c1-lip','a1a-g1-upstream','a1a-g1-downstream']
avail={v:[m for m in ('clayA','clayB','standard') if (DOC/'captures/a1b-alpha'/m/f'{v}.jpg').exists()] for v in order}
opts=''.join(f'<option value="{v}">{e(names.get(v,v))}</option>' for v in order if avail[v])
def pxrow(v):
 r=px.get(v,{});cells=''.join(f'<td class="n">{r.get(m,{}).get("a1a-v1","–")} / {r.get(m,{}).get("a1b-alpha","–")}</td>' for m in ('clayA','clayB','standard'));return f'<tr><td>{e(names.get(v,v))}</td>{cells}</tr>'
vis=ev['visibilityOfChanges'];vrow=lambda k,l:f'<tr><td>{l}</td><td class="n">{vis["a1a-v1"]["visiblePct"][k]} %</td><td class="n">{vis["a1b-alpha"]["visiblePct"][k]} %</td></tr>'
VL=[('birchwood','Birchwood'),('valley-shoulder','Central Valley shoulder'),('central-valley','Central Valley floor'),('tarn-overlook','High Tarn overlook'),('high-tarn','High Tarn east shore'),('tarn-shore','High Tarn north shore'),
 ('approach-mid','Route, mid approach'),('approach-upper','Route, upper approach'),('face-from-route','A1b trail camera s = 900 m'),('face-from-upper-route','A1b trail camera s = 2600 m')]
mt=val['maskTransition'];ok=lambda b:'<span class="ok">pass</span>' if b else '<span class="bad">fail</span>'
checks=[('Empty overlay M0 = canonical R1 (byte for byte)',val0['pass'] and man['m0']['terrainSha256']==man['m0']['baseTerrainSha256']),('Protected cells unchanged (all A1a classes, cell by cell)',val['protectedUnchanged']),
 ('Outside the window unchanged',val['outsideWindowBboxUnchanged']),('Crest cells unchanged and above their lower bound',val['crestCellsChanged']==0 and val['crestCellsBelowBound']==0),
 ('Summit position and height unchanged',val['summit']['unchanged'] and val['summit']['windowMaximumUnchanged']),('±75 m peak-ascent corridor and High Tarn seam unchanged',val['protectedClassChangedCells'].get('corridor')==0 and val['seamZoneCellsChanged']==0),
 ('No new dry sinks (priority flood)',val['newDrySinkCells1cm']==0),('No drainage-destination change (no catchment rerouted)',val['drainageDestinationChangedCells']==0),
 ('Water, lakes and channel beds unchanged',val['wetCellsChanged']==0),('Land/sea and coast 0–150 m unchanged',val['landSeaSignChanged']==0 and val['coastBand0to150Changed']==0),
 ('Route centrelines unchanged (Δ = 0 m on all six)',max(val['routeCentrelineMaxChangeM'].values())==0),('Walking test identical on M0 and A1b-α, all routes passable',pas['identical'] and pas['allPassable']),
 (f'No mask-shaped edge (mask trimmed {mt["attenuatedSharePct"]:.2f} % of the cut, max {mt["maxAttenuationM"]:.2f} m)',mt['noMaskShapedEdge']),('Deterministic generation (2 runs, identical SHA-256)',run['deterministic']),
 ('Viewer reports the active hash and the R1 baseline separately',pas['variants']['a1b-alpha']['identity']['activeTerrain']=='a1b-alpha'),(e(run['tests']),run['testsPass']),(e(run['build']),run['buildPass'])]
crows=''.join(f'<tr><td>{t}</td><td>{ok(b)}</td></tr>' for t,b in checks)
sheets=[p.name for p in sorted((DOC/'images').glob('compare-*.jpg'))]
def sheet(view,mode):n=f'compare-{view}-{mode}.jpg';return f'<figure><img src="images/{n}" alt="{e(names.get(view,view))}, {mode}: M0, A1a-V1 and A1b-α" loading="lazy"></figure>' if n in sheets else ''
artrows=''.join(f'<tr><th scope="row">{e(q)}</th><td>{e(a_)}</td></tr>' for q,a_ in notes['questions'])
page=f'''<title>North Peak A1b-α Faces</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: field-survey review sheet. One reading column with full-width comparison plates; data set in mono. */
:root{{--bg:#f2f4f4;--plate:#fff;--ink:#1a2226;--muted:#56646b;--line:#d5dcde;--accent:#1d6a86;--soft:#e1eef3;--alpha:#c2410c;--okc:#1f7a4d;--badc:#b42318;
 --f-d:"Barlow Condensed","Arial Narrow",Arial,sans-serif;--f-b:"Source Sans 3","Segoe UI",system-ui,sans-serif;--f-m:"JetBrains Mono",ui-monospace,Menlo,monospace}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--alpha:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#0f1517;--plate:#172024;--ink:#e3eaec;--muted:#9aa9af;--line:#2b373c;--accent:#6fb8d6;--soft:#16303a;--alpha:#f0a35a;--okc:#6ad6a0;--badc:#f07a66;color-scheme:dark}}
*{{box-sizing:border-box}}body{{background:var(--bg);color:var(--ink);font:400 1.05rem/1.6 var(--f-b);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 4rem}}
.wrap{{max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:3rem}}.col{{max-width:72ch}}
header{{padding-block:2.4rem 1.2rem;border-bottom:1px solid var(--line)}}.eyebrow{{font:600 .8rem/1 var(--f-m);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}}
h1{{font:700 clamp(2.2rem,6vw,3.6rem)/1 var(--f-d);margin:.5rem 0 .7rem;text-wrap:balance}}h2{{font:700 clamp(1.6rem,3.4vw,2.2rem)/1.05 var(--f-d);margin:0 0 .6rem;text-wrap:balance}}h3{{font:600 1.3rem/1.2 var(--f-d);margin:1.4rem 0 .4rem}}
.chips{{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.9rem}}.chip{{font:600 .76rem/1 var(--f-m);padding:.42rem .6rem;border:1px solid var(--line);border-radius:3px;background:var(--plate);color:var(--muted)}}
.verdict{{border-left:4px solid var(--alpha);background:var(--plate);border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:1rem 1.2rem}}
.verdict b.v{{font:700 1.6rem/1 var(--f-d);color:var(--alpha);display:block;margin-bottom:.4rem}}
figure{{margin:.8rem 0;background:var(--plate);border:1px solid var(--line);padding:.5rem}}figure img{{display:block;width:100%;height:auto}}figcaption{{font-size:.9rem;color:var(--muted);padding:.45rem .2rem 0}}
.grid2{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:1rem}}.grid2 figure{{margin:0}}
.tbl{{overflow-x:auto;border:1px solid var(--line);background:var(--plate);margin:.8rem 0}}table{{border-collapse:collapse;width:100%;font-size:.95rem}}
th,td{{text-align:left;padding:.5rem .7rem;border-bottom:1px solid var(--line);vertical-align:top}}th{{font:600 .76rem/1.2 var(--f-m);letter-spacing:.04em;text-transform:uppercase;color:var(--muted);background:var(--soft)}}
tbody th{{font:600 .95rem/1.4 var(--f-b);text-transform:none;letter-spacing:0;color:var(--ink);background:transparent;width:34%}}td.n{{font-family:var(--f-m);font-variant-numeric:tabular-nums;white-space:nowrap}}tr:last-child td,tr:last-child th{{border-bottom:0}}
.ok{{font:600 .8rem/1 var(--f-m);color:var(--okc)}}.bad{{font:600 .8rem/1 var(--f-m);color:var(--badc)}}
.ctl{{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;margin:.6rem 0}}select,button{{font:600 .9rem/1 var(--f-m);padding:.55rem .7rem;border:1px solid var(--line);background:var(--plate);color:var(--ink);border-radius:3px}}
button{{cursor:pointer}}button[aria-pressed="true"]{{background:var(--accent);border-color:var(--accent);color:var(--bg)}}button:focus-visible,select:focus-visible{{outline:3px solid var(--accent);outline-offset:2px}}
.cmp{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:.8rem}}.cmp figure{{margin:0}}.lbl{{font:600 .78rem/1 var(--f-m);text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}}
code{{font-family:var(--f-m);font-size:.88em;overflow-wrap:anywhere}}select{{max-width:100%}}.ctl>*{{min-width:0}}.wrap>*{{min-width:0}}.chip{{overflow-wrap:anywhere}}ul.tight{{margin:.4rem 0;padding-left:1.2rem}}ul.tight li{{margin:.25rem 0}}
</style>
<div class="wrap">
<header><div class="eyebrow">Aurora Rest · GEO-R02C · A1b-α · one limited experiment</div><h1>North Peak A1b-α Faces</h1>
<p class="col">Sculpting the face players actually see: couloir and buttress relief on the A2 south-west face, under every existing protection. Compared with canonical R1 (M0) and the rejected A1a-V1 ridge study, using the same cameras, sun presets and material.</p>
<div class="chips"><span class="chip">{e(run['branch'])}</span><span class="chip">A1b-α {man['alpha']['terrainSha256'][:12]}…</span><span class="chip">R1 fc8fd6da… untouched</span><span class="chip">β, R-A…R-H not implemented</span></div></header>
<section><div class="verdict col"><b class="v">{e(notes['verdict'])}</b>{''.join(f'<p>{e(p)}</p>' for p in notes['summary'])}</div></section>
<section><div class="col"><h2>Compare real renders</h2><p>Same camera, sun and material for every variant. Walk cameras stand 1.75 m above the loaded terrain.</p></div>
<div class="ctl"><label class="lbl" for="view">Viewpoint</label><select id="view">{opts}</select>
<span class="lbl">Light</span><button type="button" data-mode="clayA" aria-pressed="false">Clay sun A (WNW, low)</button><button type="button" data-mode="clayB" aria-pressed="true">Clay sun B (SE)</button><button type="button" data-mode="standard" aria-pressed="false">Standard</button></div>
<div class="cmp"><figure><img id="imgL" alt="M0 capture" width="1280" height="800"><figcaption id="capL">M0 = R1</figcaption></figure><figure><img id="imgR" alt="A1b-α capture" width="1280" height="800"><figcaption id="capR">A1b-α</figcaption></figure></div>
<div class="ctl"><span class="lbl">Left</span><button type="button" data-side="L" data-v="a1a-m0" aria-pressed="true">M0</button><button type="button" data-side="L" data-v="a1a-v1" aria-pressed="false">A1a-V1</button><button type="button" data-side="L" data-v="a1b-alpha" aria-pressed="false">A1b-α</button>
<span class="lbl">Right</span><button type="button" data-side="R" data-v="a1a-m0" aria-pressed="false">M0</button><button type="button" data-side="R" data-v="a1a-v1" aria-pressed="false">A1a-V1</button><button type="button" data-side="R" data-v="a1b-alpha" aria-pressed="true">A1b-α</button></div>
<p id="note" class="lbl"></p></section>
<section><div class="col"><h2>Artistic evaluation</h2><p>Judged on the real captures under both sun presets. Pixel counts below show visibility only, not quality.</p></div>
<div class="tbl"><table><tbody>{artrows}</tbody></table></div>
<h3>Matched sheets (M0 | A1a-V1 | A1b-α), with a crop of the face</h3>
{sheet('a1a-birchwood','clayB')}{sheet('a1a-birchwood','clayA')}{sheet('a1a-valley-shoulder','clayB')}{sheet('a1b-face-from-upper-route','clayA')}{sheet('a1b-face-from-upper-route','clayB')}{sheet('a1a-oblique-se','clayB')}{sheet('a1a-approach-upper','clayB')}{sheet('a1b-face-from-route','clayA')}{sheet('a1a-tarn-overlook','clayB')}</section>
<section><div class="col"><h2>Is it visible? Measured</h2><p>Share of each variant's changed terrain (more than 1 m) that a player at the viewpoint can see, from terrain-only line of sight.</p></div>
<div class="tbl"><table><tr><th>Viewpoint</th><th>A1a-V1</th><th>A1b-α</th></tr>{''.join(vrow(k,l) for k,l in VL)}</table></div>
<div class="tbl"><table><tr><th>View · pixels changed vs M0 (V1 / α)</th><th>Clay A</th><th>Clay B</th><th>Standard</th></tr>{''.join(pxrow(v) for v in order if v in px)}</table></div>
<div class="grid2"><figure><img src="images/visibility-far.png" alt="Far-approach visibility with V1 and A1b-α changes" loading="lazy"><figcaption>Far approaches: V1 (outline) is behind the summit, while A1b-α (orange) is on the visible face.</figcaption></figure>
<figure><img src="images/visibility-route.png" alt="Route visibility map" loading="lazy"><figcaption>Alpine route cameras.</figcaption></figure></div></section>
<section><div class="col"><h2>Terrain evidence</h2></div>
<figure><img src="images/face-maps.png" alt="Hillshade of the face for M0, V1, A1b-α and the difference map" loading="lazy"><figcaption>Plan view of the face: three major hourglass couloirs with branched heads, four minor ones, and buttresses kept at R1. From above, the set reads as more parallel than it does in perspective.</figcaption></figure>
<div class="grid2"><figure><img src="images/section-face-90m.svg" alt="Section across the face 90 m below the crest" loading="lazy"></figure><figure><img src="images/section-face-200m.svg" alt="Section across the face 200 m below the crest" loading="lazy"></figure>
<figure><img src="images/profile-couloir-2.svg" alt="Long profile of major couloir 2" loading="lazy"></figure><figure><img src="images/profile-couloir-1.svg" alt="Long profile of major couloir 1" loading="lazy"></figure></div></section>
<section><div class="col"><h2>Technical gates</h2></div><div class="tbl"><table><tr><th>Gate</th><th>Result</th></tr>{crows}</table></div>
<p class="col">Full reports: <code>validation/alpha.json</code>, <code>validation/m0.json</code>, <code>validation/passability.json</code>, <code>data/evidence.json</code>, <code>data/pixel_diff.json</code>.</p></section>
<section class="col"><h2>Limitations</h2><ul class="tight">{''.join(f'<li>{e(x)}</li>' for x in notes['limitations'])}</ul></section>
<section class="col"><h2>Recommendation</h2>{''.join(f'<p>{e(x)}</p>' for x in notes['recommendation'])}</section>
</div>
<script>
(function(){{
 var A1A="{args.a1a_base}",AV={json.dumps(avail)};var st={{view:document.getElementById('view').value,mode:'clayB',L:'a1a-m0',R:'a1b-alpha'}};
 var NAME={{'a1a-m0':'M0 = R1','a1a-v1':'A1a-V1 (rejected)','a1b-alpha':'A1b-α'}};
 function src(v,mode,view){{if(v==='a1b-alpha'||view.indexOf('a1b-')===0)return 'captures/'+v+'/'+mode+'/'+view+'.jpg';return A1A+'/'+(v==='a1a-m0'?'m0':'v1')+'/'+mode+'/'+view+'.jpg';}}
 function draw(){{var modes=AV[st.view]||[];if(modes.indexOf(st.mode)<0)st.mode=modes[modes.length>1?1:0];
  document.querySelectorAll('[data-mode]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.mode===st.mode));b.disabled=modes.indexOf(b.dataset.mode)<0;}});
  ['L','R'].forEach(function(s){{var i=document.getElementById('img'+s);i.src=src(st[s],st.mode,st.view);i.alt=NAME[st[s]]+' capture';document.getElementById('cap'+s).textContent=NAME[st[s]];
   document.querySelectorAll('[data-side="'+s+'"]').forEach(function(b){{b.setAttribute('aria-pressed',String(b.dataset.v===st[s]));}});}});
  document.getElementById('note').textContent=modes.length<3?'This viewpoint has no standard-material capture.':'';}}
 document.getElementById('view').addEventListener('change',function(ev){{st.view=ev.target.value;draw();}});
 document.querySelectorAll('[data-mode]').forEach(function(b){{b.addEventListener('click',function(){{st.mode=b.dataset.mode;draw();}});}});
 document.querySelectorAll('[data-side]').forEach(function(b){{b.addEventListener('click',function(){{st[b.dataset.side]=b.dataset.v;draw();}});}});draw();
}})();
</script>'''
Path(args.out).write_text(page);print('wrote',args.out,len(page))
