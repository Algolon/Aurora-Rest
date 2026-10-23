// MAT-01 review gallery: builds docs/mat-01/review.html from the capture manifest (portable, relative image paths).
// Usage: node tools/mat-01/gallery.mjs [docs/mat-01]
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const dir=process.argv[2]??'docs/mat-01',m=JSON.parse(readFileSync(`${dir}/evidence/manifest.json`,'utf8'));
const check=existsSync(`${dir}/browser-check.json`)?JSON.parse(readFileSync(`${dir}/browser-check.json`,'utf8')):null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GROUPS=[['before-after','Before / after (matched camera, lighting and terrain)','Each row: existing plain GEO-R02B material · Option A vertex colour from the same classification · MAT-01 hybrid material.'],
 ['materials','Material studies','Close-up, walking height and elevated views of each reference material at a location where it dominates.'],
 ['scenes','Terrain integration scenes','Birchwood, Central Valley, Home Cove and High Tarn on the real R1 terrain.'],
 ['transitions','Transition studies',''],['comparison','Material comparison on identical terrain','One material forced everywhere; same camera and light.'],
 ['lighting','Lighting modes',''],['triplanar','Selective triplanar investigation',''],
 ['diagnostics','Technical diagnostics','Debug views are exact unlit shader outputs written after tone mapping.'],['invariance','Tile-boundary and LOD invariance','']];
const fig=s=>`<figure><a href="evidence/${esc(s.file)}"><img loading="lazy" src="evidence/${esc(s.file)}" alt="${esc(s.caption)}"></a><figcaption><code>${esc(s.file)}</code> ${esc(s.caption)}</figcaption></figure>`;
let body='';
for(const [g,title,intro] of GROUPS){const shots=m.shots.filter(s=>s.group===g);if(!shots.length&&g!=='invariance')continue;
 body+=`<section><h2>${esc(title)}</h2>${intro?`<p>${esc(intro)}</p>`:''}`;
 if(g==='before-after'){const views=[...new Set(shots.map(s=>s.view))];for(const v of views)body+=`<div class="row3">${shots.filter(s=>s.view===v).map(fig).join('')}</div>`;}
 else body+=`<div class="grid">${shots.map(fig).join('')}</div>`;
 if(g==='invariance')body+=`<div class="grid">${m.diffs.map(d=>`<figure><a href="evidence/${esc(d.file)}"><img loading="lazy" src="evidence/${esc(d.file)}" alt="${esc(d.caption)}"></a><figcaption><code>${esc(d.file)}</code> ${esc(d.caption)}<br>max Δ ${d.maxDelta} · mean Δ ${d.meanDelta} · pixels Δ&gt;4: ${d.over4} · Δ&gt;16: ${d.over16} of ${d.pixels}</figcaption></figure>`).join('')}</div>`;
 body+='</section>';}
const meas=m.measurements??{};
const bench=meas.softwareBenchmark?.results??{};
body+=`<section><h2>Measurements</h2><p>${esc(meas.softwareBenchmark?.note??'')}</p><table><tr><th>view / profile</th><th>ms per frame (software)</th><th>compile ms</th><th>draw calls</th><th>triangles</th><th>material GPU memory</th></tr>${Object.entries(bench).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${v.msPerFrameSoftware}</td><td>${v.compileMs??''}</td><td>${v.calls??''}</td><td>${v.triangles?.toLocaleString?.('en')??''}</td><td>${v.materialMemoryBytes?(v.materialMemoryBytes.total/1048576).toFixed(1)+' MiB':''}</td></tr>`).join('')}</table>
<p>GPU ↔ CPU parity: ${esc(JSON.stringify(meas.gpuCpuParity??{}))}</p><p>Resource lifecycle: ${esc(JSON.stringify(meas.lifecycle??{}))}</p></section>`;
if(check)body+=`<section><h2>Browser gate (${check.pass?'PASS':'FAIL'})</h2><table><tr><th>check</th><th>result</th><th>detail</th></tr>${check.checks.map(c=>`<tr><td>${esc(c.name)}</td><td>${c.pass?'pass':'FAIL'}</td><td><code>${esc(JSON.stringify(c.detail)).slice(0,400)}</code></td></tr>`).join('')}</table></section>`;
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MAT-01 review gallery</title>
<style>:root{--bg:#f4f5f2;--fg:#1d2420;--mut:#5a665f;--card:#fff;--line:#d8ddd8}@media(prefers-color-scheme:dark){:root{--bg:#161a18;--fg:#e4e9e5;--mut:#9aa8a0;--card:#202623;--line:#36403b}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:16px}h1{margin:.2em 0}h2{margin-top:2em;border-bottom:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}.row3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
@media(max-width:800px){.row3{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden}
img{width:100%;display:block}figcaption{padding:6px 8px;font-size:12px;color:var(--mut)}code{font-size:11px}table{border-collapse:collapse;width:100%;font-size:12px;display:block;overflow-x:auto}td,th{border:1px solid var(--line);padding:4px 6px;text-align:left}</style></head>
<body><main><h1>Aurora Rest · MAT-01 terrain material review</h1>
<p>Genuine, unretouched Chromium WebGL2 screenshots of the MAT-01 Three.js review page (<code>mat-01.html</code>) on the real GEO-R02B-R1 terrain. Renderer: <code>${esc(meas.runtime?.renderer??'')}</code> (software). Commit <code>${esc(m.gitHead)}</code>, ${esc(m.browser)}, ${m.viewport.width}×${m.viewport.height}. Technical review only — art approval is a separate owner decision.</p>
<p>${esc(m.packaging??'')} Data maps in <code>classification/</code> and texture sheets in <code>textures/</code> are data images, not renders.</p>
${body}</main></body></html>`;
writeFileSync(`${dir}/review.html`,html);console.log('wrote',`${dir}/review.html`,m.shots.length,'shots',m.diffs.length,'diffs');
