# ENV-R02B — Final art review (genuine WebGL evidence)

**Decision: ART REJECT.** Technical completion: PASS. Do not adopt in production, merge, or deploy.

**Candidate/source:** `ea40102184f406b9a7abdf4502b37d8262302b75` on `art/env-r02b-birchwood-composition`, derived from recovered `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.

**Primary evidence:** [ENV-R02B WebGL validation](https://github.com/Algolon/Aurora-Rest/actions/runs/40028423173) (success), artifact `env-r02b-webgl-ea40102184f406b9a7abdf4502b37d8262302b75` (eight original screenshots plus `report.json`); [recovery-source validation](https://github.com/Algolon/Aurora-Rest/actions/runs/40028423224) (success). The original recovered source remains byte-identical; historical POP Git ancestry remains separately BLOCKED as previously reported. Source screenshot rendering used headless SwiftShader, not physical Android.

## Matched camera findings

| Camera | Removed tree descriptors | Real pixel difference (any RGB channel) | Verdict |
|---|---:|---:|---|
| forest-interior | 8 (7 birch, 1 pine) | 1.97% | Small change; poor ground-to-canopy layering still dominates |
| forest-edge | 8 | 4.56% | Small gap; not a compelling or obviously naturally shaped clearing |
| forest-landscape | 8 | 0.40% | Little improvement in macro grove rhythm |
| forest-corridor | 0 | 0.00% | **No change to the intended corridor** |

Pixel percentages are a supplemental local PNG comparison derived from the genuine paired WebGL captures; they are not CI acceptance criteria. Real captured view references are saved in the linked GitHub Action artifact. The local probe removes eight instances total in the reviewed area, not 8 per camera. Independent original ID/transform preservation and A/B/A canvas restoration passed. Each frame uses its own set of active source chunks; the corridor review camera did not include removals.

## Artistic assessment

The scene does not exhibit a convincing composition of protective woodland enclosure, glade and reveal. The image remains a fairly evenly distributed collection of sparse tree instances above the same dark forest floor. Simply deleting eight trees does not address lack of tree clusters, shrub/understory hierarchy or spatial design. The corridor camera is wholly unchanged. The current proof is therefore **valuable as a negative test, not an approved composition**.

## Spatial delta

See `SPATIAL_DELTA_LEDGER.json` for the eight exact IDs and deterministic worldspace x/z derived from the original POP lattice. The CI report documents family totals (seven birch and one pine), but not species per ID, so the ledger deliberately avoids guessing per-ID species.

## Next responsible direction

Stop material-only and removal-only iteration. Next study should begin from a fixed *walking-height* forest-to-valley storyboard with reference-led authored grove placement/negative space, not automatically more deletions. Establish a locally designed canopy/understory rhythm using existing assets, and verify the connection to the intended corridor camera before running more costly WebGL integration. Address existing POP page activation costs independently before an interactive long walk. No more GEO or unrelated asset expansion under this scope.
