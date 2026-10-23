# ENV-R02C — Authored Birchwood Gateway A2, final visual review

**Result: TECHNICAL PASS / ART REVISE (not approved for production).**  
Code checkpoint: `68e49ae12e89797752968a9813ab87afce6eef93`. Recovery-derived source baseline: `bced77ca3ca0539f7137cd9f066e6220518cf4a8`. No merge or deployment.

## Evidence — genuine software-WebGL
- [A2 WebGL CI, exact code checkpoint](https://github.com/Algolon/Aurora-Rest/actions/runs/40039048971): **SUCCESS**; matched A/B/A at `gateway-approach`, `gateway-trail`, `gateway-reveal` with pixel-identical restoration of the canonical OFF state, preserved original descriptor IDs and terrain geometry, zero captured browser errors.
- [Archived original PNG pairs and raw report.json](https://github.com/Algolon/Aurora-Rest/actions/runs/40039048971/artifacts/12538568132): six genuine 1280x900 WebGL screenshots and machine-readable results. NOT AI-generated visuals.
- [Original 558-file recovery/source CI for A2](https://github.com/Algolon/Aurora-Rest/actions/runs/40039049035): SUCCESS. Historical vanished POP Git ancestry remains separately **BLOCKED**, not repaired.
- Prior A1 art evidence: [run 40037539244](https://github.com/Algolon/Aurora-Rest/actions/runs/40037539244), recorded as superseded by A2 route correction.

## Geographic correction from A1 to A2
The forest anchor (-740,-50) is ~458m from the actual provisional corridor camera (-350,-290). A1 visual route had crossed the canonical hero path at (-350,-290) but diverged ~51–52m at the ends, with camera headings partly facing away. **All five authored A2 route waypoints lie on the verified existing hero path (zero perpendicular distance at available GEO precision)**. A2 cameras now face along its north-east tangent. This improves the validity of the visual test; it does not approve an entire Birchwood-to-Central-Valley itinerary or add a rendered physical trail.

## Matched capture evaluation

| Camera | Changed pixels* | Draw calls, A→B | Submitted triangles, A→B | Artistic observation |
|---|---:|---:|---:|---|
| gateway-approach | 31.7% | 78→81 | 342,045→379,453 | Stronger irregular tree groups, but still weak canopy enclosure over broad ground |
| gateway-trail | 7.6% | 66→68 | 305,905→327,937 | Clearer cluster on left; actual walking route is not visually drawn or legible |
| gateway-reveal | 9.9% | 52→64 | 289,953→316,385 | Better one-sided birch framing, but no compelling scenic reward at the release |

\*Percentage of PNG pixels with a maximum channel difference exceeding 8/255, from the recorded genuine, aligned WebGL A/B images. This is a change magnitude **not** an art quality score.

In each matched camera window the stream holds 3,181 original canonical descriptors. The candidate adds **256 review-only** objects (67 trees, 189 source-grass instances) with distinct `env-r02c:` IDs, and suppresses exactly **five** original tree instances *only at rendering*. The original descriptors are unchanged. The three views show the same loaded composition inventory, not three independent sets of 256 additions. No terrain, rock, tree mesh, grass mesh, material definition, canonical region, population seed, lighting or water change is present.

## Art direction verdict
**Meaningful composition improvement versus R02B, but not adequate for art approval.**

- Better: recognisable irregularly grouped trees; improved depth/rhythm at entry, a denser grove at the route hinge, and selective frame on the reveal side.
- Still weak: much of the first-person view remains exposed open hillside, not sheltered woodland. Clusters are assembled from repeated original trees and do not yet achieve a coherent premium Nordic mixed-age structure.
- Major blocker: original source grass is not the required dwarf-shrub/bilberry/moss/heather middle layer. Understory still appears as isolated tufts; the broad dark forest ground remains prominent. Do **not** mislabel this asset workaround as credible botanical groundcover.
- The preview contains **no rendered trail surface**, so navigation legibility cannot be judged from these images; canonical waypoints align, but a visual or walkable final path is not approved.
- The release lacks a distinctive topographic or landmark reveal. No Central Valley panorama or Android real-device performance validation is claimed.

**Decision:** keep A2 as the leading authored **design reference**, not a production-approved landscape. Do not merge or deploy it. Do not continue blind tree-density or terrain-material micro-iterations.

## Bounded next step (separate approval)
An `ENV-R02D` **first-person woodland cohesion proof** limited to one 60–100 m corridor segment, with a hand-approved low vegetation/ground-level hierarchy and a readable path cue. Prioritise visual storyboard and deliberate massing over algorithm development. Reuse current models where credible; a genuinely low-shrub botanical asset would need its own bounded source-asset approval, not an uncontrolled Blender loop. Validate A/B/A and Android later, separately. No island-scale ecology refactor, new terrain sculpt or production merge is authorised here.

**Spatial-delta provenance:** all 256 candidate addition IDs and 5 temporarily hidden original IDs are recorded in the WebGL `report.json`. Exact authored world X/Z are deterministically calculated by `src/env-r02c/design.ts` and `composition.ts`; original tree coordinates from the protected POP lattice. These are renderer-only instances, not edits to canonical population.
