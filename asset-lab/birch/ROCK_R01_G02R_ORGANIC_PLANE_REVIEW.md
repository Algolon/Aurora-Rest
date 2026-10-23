# AURORA REST — ROCK-R01-G02R
## Organic Plane Refinement · Genuine Three.js/WebGL First Art Review

**Owner request:** Explicitly execute the G02R work order; focus on organic G1-like unequal face sizes and directional variation.
**Date:** 24 October 2026 (Europe/Amsterdam); GitHub Actions recorded execution in UTC.
**Art direction:** Believable Nature, Sculpted for Wonder.
**Design reference:** B1 / The Sheltered Fault. **Visual north star:** original left-hand R04/G1 sculptural boulder.
**Implementation branch:** \`art/rock-r01-g02r-organic-plane-refinement\`.
**Protected source checkpoint:** \`69dfc8fd58be58c588d007d3f962c7df9e20be5a\`.
**Validated implementation SHA:** \`009826c2498746b53c31b892ad68d3010c1e52fb\`.
**Genuine technical CI:** [run 40035072804, success](https://github.com/Algolon/Aurora-Rest/actions/runs/40035072804).
**Evidence:** [17 original Three.js/WebGL screenshot PNGs and metrics.json, artifact 12536298328](https://github.com/Algolon/Aurora-Rest/actions/runs/40035072804/artifacts/12536298328).
**Disposition:** **TECHNICAL PASS · ART NOT APPROVED — owner art review pending.** The first G02R render gate has been reached; **stop now**.

## 1. Scope protection

This phase introduced only ADDITIVE source files and an isolated experimental viewer/CI.
- New core: \`rocks/r01/g02rOrganicCore.ts\`
- New Three.js adapter: \`rocks/r01/g02rGeometry.ts\`
- New review page: \`rocks/r01/g02r-showroom.ts\`, \`rock-g02r.html\`, \`vite.g02r.config.ts\`
- New screenshot runner: \`scripts/capture-rock-g02r.mjs\`
- New scope-preserving CI: \`.github/workflows/rock-r01-g02r.yml\`
- New geometry tests: \`tests/rock-r01-g02r.test.ts\`
- Work order: \`rocks/r01/ROCK_R01_G02R_WORK_ORDER.md\`

All original G1/R04, G01, G01R, G02, A2 T1, F01 and approved tree/grass/world/POP source files are read-only and unchanged. Scope guard against the protected source checkpoint PASSED. No merge/deployment, no population registration and no editable source replacement.

## 2. Actual sculptural change from G02

**G02 prior failure:** a regularly arranged 6 × 4 top grid with nearly uniform face relationships; two peak-like volumes; repeated vertical lower skirt and a conspicuous V-notch.

**G02R authored implementation:**
- Replaces G02 grid with **31 hand-placed irregular 3D controls** and **44 fixed, non-grid upper surface triangles**, with a much wider spread in their effective face areas.
- Establishes several adjacent high left/rear crown controls rather than a single isolated top spike; the right side falls into a distinctly lower shoulder.
- Recesses one localized front transition to avoid a full-depth central V.
- Uses 16 asymmetrically placed upper outline anchors and tapered, slightly irregular ground contacts.
- Breaks the side skirt at only 5 selectively authored local relief points rather than using a constant mid-ring.
- Preserves a single continuous non-convex closed outside shell and the exact same source-owned Three.js BufferGeometry/A2 T1 compatibility.
- No procedural random noise, automatic hull clipping, runtime tessellation generator or copied G1 vertex locations. The fixed upper triangular links were validated against an offline geometry prototype, not generated at runtime.

This is still an **experimental low-detail authored approximation**, not a proof of premium sculptural quality.

## 3. Verified technical results

| Criterion | Observed |
|---|---:|
| Full automated tests | **67/67 passed, zero skips** |
| TypeScript | PASS |
| Isolated Vite showroom build | PASS |
| Genuine Chromium/Three.js WebGL2 screenshots | **17 captures** |
| Browser console/page/HTTP errors | **0** |
| Render triangles | **102** |
| Unindexed GPU attribute vertices | **306** |
| Authored 3D control vertices | **53** |
| Upper surface panel triangles | **44** |
| 90th/10th percentile upper triangle area ratio | **3.766** |
| World units (width × height × depth) | **3.567 × 2.342 × 2.970 metres** |
| Topology | One connected, consistently wound closed genus-zero shell (automated edge/Euler/volume checks) |
| Normals, UV, RGB vertex colors | Finite; validated |
| Real browser A2 T1 material compatibility | Rendering passed, source unchanged |
| Resource ownership | Three.js geometry disposability unit-tested |
| Original G1 vs G02R | Captured side by side, same renderer/camera/light/scale |
| Original G02 vs G02R | Captured side by side, same renderer/camera/light/scale |
| Physical GPU, Android FPS | **NOT TESTED** |
| Production collision, streaming/LODs, exhaustive self-intersection | **NOT TESTED** |

Note: More unequal triangle **areas** are not necessarily convincing authored geological **planes**. The reported area ratio is one geometric diagnostic only and must not be mistaken for an artistic success metric.

## 4. Genuine visual evidence

Primary frames (inside linked WebGL evidence artifact):
- \`G1-versus-G02R-neutral.png\`: original approved-look R04/G1 benchmark LEFT, G02R RIGHT.
- \`G02-versus-G02R-neutral.png\`: predecessor G02 LEFT, G02R RIGHT.
- \`G1-versus-G02R-rear.png\`, \`G02-versus-G02R-rear.png\`.
- \`G02R-neutral-front.png\`, \`G02R-neutral-rear.png\`, left/right/top/human/frontThreeQuarter/rearThreeQuarter.
- \`G02R-neutral-grazing.png\`, \`G02R-neutral-wireframe.png\`.
- \`G02R-A2-T1.png\`, \`G02R-A2-T1-rear.png\`.
- \`G02R-nature-context.png\`, \`metrics.json\`.

These images are **actual Three.js WebGL2 captures using software SwiftShader**, not prompt-generated design sketches or physical mobile GPU tests.

## 5. Artistic diagnosis

### Confirmed improvement over G02

1. **Face areas genuinely vary more** (90th/10th ~3.77); no equally spaced 6×4 cell pattern.
2. **Broad, weathered crown** rather than two symmetrical peak points; larger quiet upper planes and a reduced V-notch.
3. **Lower right shoulder** is subdued relative to the main high left mass.
4. G02R is closer to a singular mound/boulder than G02's conspicuous dual peaks, and the silhouette is less modular.

### Remaining blocking defects (benchmark = left-hand G1)

1. **The front lower skirt is still a band.** Even with tapering and sparse relief vertices, the lower front presents a broadly uniform low-poly wall with repeated large wedge/triangle rhythm. This visually persists even when face sizes are varied.
2. **Weak localized geological carving.** The new seam is too subtle/obscured from the benchmark frontal view. It does not reproduce G1's legible local recessed fold and asymmetrical transitional mass arrangement.
3. **Simple mound/roof silhouette.** G02R is one broad hump with a large planar upper slope and flatish rear ridge. It loses the mass-to-mass sculptural tension that makes G1 distinctive.
4. **No intentionally composed large polygonal geological slabs on the FRONT.** Many differently sized triangles are still not equivalent to large authored, interconnected stone planes. The face normals create abrupt long front facets and a distinct top/bottom boundary.
5. **Side/rear silhouette still generic.** The first rear-3/4 image reads as a low-poly mound, not as a weathered glacial erratic with directional fracture flow. T1 granite alone cannot fix this.

### Disposition

**TECHNICAL PASS. ART REJECT RECOMMENDED for inclusion into the Aurora Nature Asset Library**; user holds final review authority.

The targeted iteration answered the owner's specific geometric question: *unequal face areas alone do NOT produce the organic plane hierarchy of original G1*. G02R is a step beyond G02 in shape asymmetry and reduction of the twin-peak motif, yet is still far from the character and authored localized carving of G1. Continuing to refine this same panel graph by adjusting more vertices would likely reproduce the progress loop the owner wanted to avoid.

## 6. Next strategic choice (NOT AUTHORIZED in G02R)

Freeze the technically verified G02R prototype; **do not integrate or merge**. If owner wants rock development to continue, the recommendation is a change of **sculptural construction workflow**, rather than G02R2 from the same topology:

- G1-first *form grammar* study: identify 3–4 actual dominant uninterrupted stone planes, one bounded shallow recess, 2–3 large anisotropic silhouette transitions, and a shared heavy base.
- Author and inspect those dominant planes and folds as true edit-controlled surfaces in a manual mesh workflow, with real Three.js front and rear QA. A Blender editable blockout may be evaluated if it speeds art direction; retain the Three.js showroom/runtime/QA and no production integration until art approval.
- Only after multi-angle G1-comparable clay approval should normals/microdetail/T1 be considered.

**Stop condition reached:** first real WebGL visual review. No automatic further geometry iteration, F01 registry mutation, island integration, merge or deployment.
