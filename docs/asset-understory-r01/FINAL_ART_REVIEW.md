# ASSET-UNDERSTORY-R01 — FINAL VISUAL REVIEW: A1 / A1R

**Decision: TECHNICAL PASS / ART REVISE — NO PRODUCTION APPROVAL.**

The entire work is preserved on isolated branch `art/asset-understory-r01-reference-showroom`. **One original specimen candidate + one bounded morphology correction; no further sculpting/parameter loops authorized.**

## Evidence and provenance

Protected original recovery commit: `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
Original first proof: `63d6b3aeac5c13742a27b35e09cb1e04a3840f63`.
A1R final geometry checkpoint: `7c5dc6d095dd0546ca835eee218b5fbc83c0d9c7`.

- [A1 true WebGL and unit/build pipeline](https://github.com/Algolon/Aurora-Rest/actions/runs/40085021143): PASS. [A1 artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/40085021143/artifacts/12557205172) contains original screenshots and JSON stats.
- [A1R true WebGL and unit/build pipeline](https://github.com/Algolon/Aurora-Rest/actions/runs/40085308649): PASS. [A1R artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/40085308649/artifacts/12556942251) contains **six original genuine Chromium/SwiftShader WebGL screenshots** and JSON report, no browser exceptions.
- Recovery/source validation [A1](https://github.com/Algolon/Aurora-Rest/actions/runs/40085021181) PASS. Source guard for A1R [run 40085308623](https://github.com/Algolon/Aurora-Rest/actions/runs/40085308623) (validate workflow state independently). Branch diff from protected recovery includes **only new files**. Missing historical POP ancestors remain separately BLOCKED; not reconstructed.
- All photo references are web links only, with no copied external image or texture asset in the source tree.

## Geometry, performance, source and lifecycle

| Test | A1 | A1R |
|---|---:|---:|
| Specimens | 3 species × 3 deterministic variants | 3 × 3 |
| Showroom draw calls | 10 | 10 |
| Showroom submitted triangles | 32,244 | 39,220 |
| Browser JS errors | 0 | 0 |
| Original nature-library assets affected | 0 | 0 |
| Typecheck / unit / build / WebGL / dispose | PASS | PASS |

Numbers refer to actual showroom canvas with 9 specimen meshes and one diagnostic neutral ground, **not** full Aurora world/device FPS. No Android GPU benchmark.

## Artist's observations from the real screenshots

1. **Bilberry — improved but still stylized placeholder.** More foliage and irregular twig bases make the shrub less like a bare broom, but its branches remain too straight, overall canopy patchiness too transparent, individual leaves too discretely spaced relative to documented dense clonal understory. Small-scale species differentiation is readable. **ART REVISE.**
2. **Lingonberry — useful footprint and habit study, not final morphology.** Satellite root centers remove the central 'spider star', foliage is darker and the shape creeps along ground. Still needs connected evergreen colony foliage, thicker/rounder leaf grouping, and believable rhizome density; looks sparse as an individual specimen. **ART REVISE.**
3. **Feathermoss — a meaningful morphology correction, but no natural carpet.** A1 upright sprays looked like miniature conifers and were rejected. A1R feathery sprigs now spread laterally as reference intended, but read as isolated fern-shaped graphics over a smooth material, not interlocking moss/litter at ground scale. The empty substrate gaps remain. **ART REVISE / NOT APPROVED** for production forest ground.
4. **Showroom only.** This is a low-level silhouette/scale and material color exercise. No claim of validated forest-floor density, natural sunlight, production PBR, collision, LOD behavior, alpha shadows, mobile FPS, species fidelity at botanical identification resolution or mixed-environment integration.

## Art direction decision and stopping rule

**Preserve the source as a technical and botanical study checkpoint but DO NOT copy these geometries to the Aurora Nature Asset Library or merge/deploy them.** The new leaf/sprig geometry was authored specifically for review; a successful technical test is not art approval.

**Next recommended design direction is NOT another procedural-specimen iteration.** Gather reference-led patches at full **patch/colony** scale: bilberry and lingonberry with overlapping rhizome beds, feather moss as a near-continuous ground micro-surface interspersed with litter, stones and small gaps. Establish close-camera visual acceptance with photographs and fixed size yardsticks before a new implementation. Only after a patch composition is visually approved should this area be revisited as a controlled asset study or world integration. No Blender micro-management loops.

## Scope/invariants

Only ten new file paths on the isolated branch plus this final review. Original 558 file contents and GEO, POP, MAT, terrain, lighting and game navigation untouched. No merge, no deployment, no publication. Project art direction remains **Believable Nature, Sculpted for Wonder**.
