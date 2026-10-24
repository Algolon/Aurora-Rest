# ENV-R02D — First-Person Woodland Cohesion: FINAL ART REVIEW (A1 and A1R)

**VERDICT: TECHNICAL PASS / PATH CONCEPT CONDITIONAL GO / ART REVISE (NOT APPROVED FOR PRODUCTION).**

Isolated prototype source: [`b6302bd10178a7d3ffa9d24c944a4dee774023d5`](https://github.com/Algolon/Aurora-Rest/commit/b6302bd10178a7d3ffa9d24c944a4dee774023d5) on `art/env-r02d-first-person-woodland-cohesion`, descended from R02C A2 `3239a6ebce5f41ab9b99a2624709d3b557b61f0e` and original protected recovery `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.

## Audited evidence
- A1 [original true WebGL A/B/A](https://github.com/Algolon/Aurora-Rest/actions/runs/40082487302) — PASS, preserved archived original screenshots and `report.json`. Recovery/source CI [PASS](https://github.com/Algolon/Aurora-Rest/actions/runs/40082487206).
- A1R **final** [true WebGL A/B/A](https://github.com/Algolon/Aurora-Rest/actions/runs/40083305449) — PASS, three 1280×900 pairs from `gateway-approach`, `gateway-trail`, `gateway-reveal`, original source IDs and terrain arrays identical, pixel-identical baseline after toggling back OFF, zero page errors. [Real raw screenshots and report artifact](https://github.com/Algolon/Aurora-Rest/actions/runs/40083305449/artifacts/12556331913).
- [A1R recovery and source CI](https://github.com/Algolon/Aurora-Rest/actions/runs/40083305420) — PASS, protected original 558 source files unchanged, no runtime merges/deployments. Historical missing POP ancestry separately remains BLOCKED.
- Viewer `env-r02d.html` is opt-in, default OFF and remains isolated. R02C A2 baseline copied not mutated.

## Real WebGL quantitative evidence

| Camera | R02C A2 baseline triangles | R02D A1R triangles | Draw calls A→B | A1R pixel change over A2 |
|---|---:|---:|---:|---:|
| sheltered approach | 379,453 | 384,503 | 81→84 | 14.19% |
| trail hinge | 327,937 | 332,987 | 68→71 | 16.72% |
| first reveal | 316,385 | 321,435 | 64→67 | 16.45% |

Percentages are the percentage of aligned genuine WebGL PNG pixels with maximum absolute RGB difference greater than 8/255. They are not aesthetic quality metrics.

The separate cohesion layer follows **86.67 m** of the existing exact `hero` route and adds **181 low leaf-sprig proxy instances**. It does not change 3,181 original canonical descriptors, 67 trees and 189 grass prototypes authored in R02C, terrain, MAT shaders, rocks, water, light or user walk physics. Layer adds **three draw calls and about 5,050 submitted triangles** in the measured camera views; remains under the provisional 750,000-triangle ceiling. This is a SwiftShader source-side observation, **not** physical Android device FPS.

## Artistic judgement

**A1 original: ART REJECT.** The footpath appeared overly pale/white, uniform and wide, almost like a concrete strip or floor highlight. Spiky geometric paper-star plants formed a repeated row. Heavy artificial decoration, no credible understorey.

**A1R single bounded correction: ART REVISE.**
- **Improved:** Narrower, darker and softly fading path is readable at walking height without dominating the frame. Using canonical terrain coordinates and real hero path is a viable technical technique. The corrected low proxies are less garish.
- **Still failing production art:** The path remains very even in width, reads partly as a transparent stripe rather than ground physically worn by walking, and does not integrate with heterogeneous stones/soil/leaf litter. Leaf-sprigs are clearly flat/angular prototypes scattered along the trail, not the multilayered *Vaccinium*, mosses, dwarf shrubs and litter characteristic of Scandinavian mixed woodland.
- **Primary larger issue remains:** Enclosure, vertical layering and near/mid/far depth still feel sparse; dark forest floor and open horizon dominate. First visual release is not a strong landmark or scenic moment.
- No approved final botanical asset, material decal, traversable tread width, physically validated trail, device performance, or forest-to-Valley journey is demonstrated.

## Decision and bounded handoff

**Keep A1R as a protected design/engineering reference for local readable path overlay. DO NOT MERGE, DEPLOY, OR ADOPT THE LEAF GEOMETRY AS AN OFFICIAL NATURE ASSET.**

Stop R02D here as agreed — no further parameters-only micro-iterations. Next milestone should not be another arbitrary foliage-density generator. It should define ONE real-reference-led, premium low Nordic understory asset-family study (bilberry/dwarf shrubs, moss/lichen/litter at natural scale) and a small authored ground-material edge treatment. Both should be independently visually approved BEFORE returning to this 86m demo and optionally testing the path as a subtle world-space ground-material modification. Preserve all old checkpoints and canonical terrain through subsequent studies.

## Source provenance and reversibility

Canonical viewer OFF -> R02C A2 toggle -> R02D toggle -> return to R02C A2 matches source A2 screenshots pixel-identically. Original protected source remains byte-identical. Source WebGL evidence is retained in GitHub Actions artifacts and not AI-generated.
