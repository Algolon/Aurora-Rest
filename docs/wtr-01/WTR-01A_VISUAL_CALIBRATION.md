# WTR-01A — Premium Nordic Water Visual Calibration

**Status:** TECHNICAL PASS · VISUAL REVIEW CANDIDATE · **ART APPROVAL PENDING**  
**Protected parent:** WTR-01R `90037110189f5a51d2f4fdad5790b84a05df36fd`  
**Working branch:** `art/wtr-01a-nordic-water-calibration` (isolated; not merged or deployed)  
**Art direction:** Believable Nature, Sculpted for Wonder.

## Evidence (genuine Three.js/WebGL; no conceptual stand-ins)

- **A1 candidates:** [48-image true Chromium/WebGL study](https://github.com/Algolon/Aurora-Rest/actions/runs/39928990327), [artifact / image gallery](https://github.com/Algolon/Aurora-Rest/actions/runs/39928990327/artifacts/12490349113).
- **Selected look:** [44-image full renderer review](https://github.com/Algolon/Aurora-Rest/actions/runs/39930044710), [artifact / image gallery](https://github.com/Algolon/Aurora-Rest/actions/runs/39930044710/artifacts/12491725297).
- **Source tests/build:** [36/36 tests + successful Vite/TypeScript](https://github.com/Algolon/Aurora-Rest/actions/runs/39930044843).

Each artifact includes `index.html` (browsable original PNGs) and `manifest.json` (sha256 per frame, camera, study, quality, daylight, fixed animation time, renderer, draws/triangles, terrain digest and water visibility). Art comparison sheets, if created, are assemblies of original real WebGL captures only.

## A. Baseline diagnosis

The original WTR-01R material was fully reproducible with six canonical views, Low/Medium/High and Sun A/B. Visual differences originate in the *shader*, not geography. The original surface normal consists of two (Medium) or three (High) analytic, uniformly repeating waves with fixed direction/frequency relationships. Directional specular highlights accentuate their phase interference; from elevated Windward and High Tarn views, the result produces consistent diagonal stripe/banding patterns. The clipped shoreline's stair-stepped edges already exist in R1 geometry and were not edited. The Home Cove original walking camera sees a narrow water strip: that is a camera/terrain relationship, not evidence the water shader is absent.

## B. A/B/C selection — direct WebGL review

| Variant | Real change | Observed result | Decision |
|---|---|---|---|
| **Original WTR-01R** | Exactly protected sinusoidal wave equations and original `PALETTE` | Strong, repetitive diagonal interference, especially in Sun A and elevated Windward; persistent High Tarn far-ridge bands | Matched baseline retained |
| **A — conservative** | Frequency/direction/amplitude ratios only, no additional domain variation | Stripe contrast diminished, but visually recognisable parallel regularity remains | Not selected |
| **B — multiscale** | Restrained slow directional drift with broad and fine analytic normals, lower fine-wave amplitudes | Substantial reduction in regular interference; more coherent wind response but some distant bands persist | Promising alternative |
| **C — screen stable** | Identical B wave composition, independently filtered at pixel phase footprint via `fwidth` | Best panoramic calm and least distant alias/shimmer; near-water appearance close to B | **Selected foundation** |
| **Selected Nordic** | C waves plus independently switchable regional palette and broader/softer analytic highlights | Windward Sun A repeating bright bands substantially reduced; High Tarn becomes quieter; Home Cove slightly more muted and sheltered | **Visual review candidate**, not owner approved |

**Why C, not simply the most complex variant?** C's derivative damping improves the specific panoramic banding that remained in B, as seen in matched genuine WebGL captures. It adds no texture, buffer or geometry; only shader fragment derivatives. Under many medium-distance views B and C are nearly indistinguishable, so the perceptual gain is localised rather than universal. A strong alternative is B for devices where derivative cost is significant: this remains selectable and should be profiled on hardware before production.

## C. Regional and lighting calibration

The new `NORDIC_PALETTE` is separate from untouched `PALETTE`. The shader's new `final` setting selects the calibrated style; `original` is a live, parameter-identical WTR-01R reference. A/B/C are also preserved and selectable.

- **Home Cove:** preserved documented *approximate* sheltered mask (not distance-to-shore or bathymetry). Slightly stronger cove dampening, soft muted cyan/green sea and lower animation speed. At walking height the water is still largely a horizon strip; the additional dry-ground camera at approximately x=1718, z=-1972 m and eye y≈4.13 m is real and shown, but does **not** yet frame an artistically generous expanse of water. Do not count this as solved.
- **Windward Coast:** moderate cooler blue-gray tonal direction; C broad/secondary ripples remain animated but reduced interference; softer/wider highlight response under both Sun A and Sun B. Sun A formerly produced very regular bright checker/band interference; it now has broader, less periodic bands. Still visually restrained for an exposed northern sea.
- **High Tarn:** colder, calm restrained profile with fine ripples and gentle light response. From panorama, obvious repeated scallop bands fade considerably without flat uniform opacity. From walking height the surface is calm, perhaps too flat for final art quality.
- **Lower Lakes:** coherent restrained family adjustment. Not independently accepted or geographically reviewed in this milestone.
- **Channels:** palette intentionally unchanged. No flow implementation.

These changes affect shading only, with no invented bathymetry, foam, screen-space reflection or water-height displacement. Global tone mapping, ambient/environment lighting and R1 terrain stay unchanged.

## D. Tests, shader stability and renderer performance

**Source:** 36/36 Node tests pass; full TypeScript/Vite build succeeds. Existing fog-uniform, `<common>`, logarithmic-depth, disposal, canonical-hash tests retained; new tests validate study IDs, all quality/profile combinations, finite bounded parameters, nonzero wind, and reversible original/final palette switching.

**True browser:** 48 A1 candidate renders + 44 full final renders in Chromium (1600×900, SwiftShader), with no uncaught JS errors, no GLSL compile errors and no screenshot timeouts. Selected capture matrix: 6 unchanged source cameras × (baseline, final Low, final Medium, original High, final High) = 30; Sun A High original/final × 3 = 6; selected temporal t=1.5,3 × 3 = 6; supplementary Home Cove original/final = 2; total **44**.

**Visibility:** actual GPU framebuffer before/after water read-back at fixed 256×144 passes in the selected render: Home Cove elevated 15,093/36,864 pixels, Windward shore 9,940, High Tarn panorama 27,980. The same locations have matched original controls. This measures *on-screen render contribution*, not artistic quality.

**Renderer telemetry:** 15–131 observed draw calls and approximately 371,857–2,691,857 total visible triangles depending on camera, unchanged relative to baseline. No added water passes, textures, geometries or postprocessing. In wave-only captures the renderer reported 2 shader programs; final matrix including Lambert baseline and custom water variants reported 2–3. Switching study updates material uniforms without creating a new water GPU program. Medium uses two analytic waves and High three; Low skips ripple normals. High produces relatively subtle additional detail, so its value over Medium is **not proven on hardware**.

**Not proven:** desktop or Android FPS, GPU shader timings, shader cost on mobile, real-time gameplay motion/temporal stability under hardware frame pacing. The SwiftShader driver emitted four `ReadPixels` synchronization-stall warnings when the QA harness deliberately read back GPU pixels. This is not a runtime shader error and not a general FPS measurement. Per-frame renderer snapshots do not establish performance goals.

## E. Integration boundaries and known visual defects

- Original six canonical cameras are preserved and matched exactly; extra Home Cove camera is separately labeled and excluded from strict six-camera before/after acceptance.
- Some coast triangles still show stepped/jagged clipped water boundaries. These were visible in R1 baseline, are geologic/hydrologic rather than shader repairs, and remain protected.
- Ambient terrain is still neutral clay with no full MAT-01 materials; final perceived water/land coherence needs separate evaluation when approved materials are available.
- The selected look is a meaningful improvement over the old procedural stripes, but **premium stylized Nordic water is not conclusively established**. Home Cove at eye height still lacks surface readability; High Tarn may be overly smooth; exposed Windward motion can be too reserved.
- No source changes to `src/geo-r02b`, `public/geo-r02b`, GEO-R02C, MAT-01, POP-01/02 or production game entrypoints. No merge, deployment or WTR-02/03.

## F. Safe handoff

**TECHNICAL PASS** for the isolated visual-review shader and browser evidence.  
**VISUAL REVIEW CANDIDATE** for the selected `final` profile (improved, not conclusively premium).  
**ART APPROVED:** **NO**, requires the owner's explicit judgment of the genuine matched WebGL images.

Recommended next decision: owner compares Sun A Windward and High Tarn panorama first, then checks the very limited Home Cove walking-height composition. If further refinements are authorized, prioritize the perceptual scale of shore-level water and MAT-01 coherence rather than more shader complexity. WTR-02, WTR-03 and canonical remeshing remain deferred.

### Reproduction

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4173
# load http://127.0.0.1:4173/wtr-01.html
# independently select original / A / B / C / final in "Wave study"
# final evidence: node tools/wtr-01a/capture.mjs --final
# original A1 candidate evidence: node tools/wtr-01a/capture.mjs
```

GitHub Actions `.github/workflows/wtr-01a-review.yml` runs the full selected WebGL capture on this isolated branch and retains a browsable artifact. The branch is committed via the GitHub API without a local editable worktree in this chat environment; remote HEAD and exact ancestry can be verified through GitHub compare.
