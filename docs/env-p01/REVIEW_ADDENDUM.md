# ENV-P01 review addendum — evidence alignment and acceptance

## Completion assessment

The integration and visual review are complete in the surviving source snapshot. Final milestone completion is **blocked on restoration of the exact local Git history**, not on an unimplemented forest renderer. See RECOVERY_STATUS.md. Do not report a final clean branch or invent a replacement final SHA.

| Gate | Evidence | Assessment |
|---|---|---|
| A — Forest Floor Cohesion | Seven matched original cameras, walking-height sheet, elevated transition sheet, original MAT source evidence, shadow on/off pair | Functional integration passes; visual candidate remains conditional |
| B — Ecological Consistency | Full-descriptor parity against original POP viewer, unchanged mesh-buffer hashes, projected diagnostic overlay and discrepancy JSON | Diagnostic gate passes; meaningful ecological disagreement remains |
| C — Technical Integration Cost | Classification/texture timings, allocation counts, shader/call/triangle deltas, profile cycles, API-return observations and page-activation stalls | Measured in software WebGL; hardware performance pending; source-history delivery gate blocked |

**Technical Pass:** observed in the original tested integration; source snapshot rebuild passes. Current full regression result is 73/74 because the exact-POP Git-object comparison cannot run without the vanished Git common directory. The same full suite passed 74/74 before resume. Neither result is concealed or substituted for the other.

**Visual Review Candidate:** conditional. Material continuity is better, but ecological edges, panoramic floor value and foreground/midground composition are not yet convincing enough for final art acceptance.

**Art Approval:** pending explicit owner review. Neither MAT-01 nor ENV-P01 is automatically art approved.

## Verified sources and evidence alignment

Initial verified POP: `4d562187c10e64884e2193a0b09ced6eed3b4b08`. Exact original placement and camera parity was measured in `evidence/supplement.json`, not reconstructed from a new population implementation. The surviving source/protected data and genuine PNGs are preserved. POP remote availability was rechecked after resume: missing. Its historical local checkpoint requires recovery material to restore ancestry.

MAT remote was independently fetched again at exact `ae8a9c17781cdaa85c9e55696697c6213a860ef6`. `mat-source-evidence/manifest.json` contains the original blob IDs and SHA-256 of the requested gallery and seven renderer files. `mat-source-evidence/index.html` presents the selected evidence. The archived original gallery may reference additional MAT captures that are not copied here; it is retained as provenance, not misrepresented as a complete second gallery.

| Original MAT evidence | What it establishes | ENV observation |
|---|---|---|
| m01-walk.jpg | Litter/moss/humus detail in the actual material shader | Same detail now surrounds genuine tree contacts and grass; original material definitions retained |
| m01-elevated.jpg, birchwood-overview.jpg | Broad dark forest-floor regions already visible without trees | Dark mass remains after integration; not caused by new population rules or a mirrored query |
| m02-walk.jpg | Turf detail has appreciable close-range contrast | Meadow remains technically functional; no isolated turf redesign undertaken |
| tr-forest-meadow.jpg | Existing material blend and boundary behavior | Material boundary does not automatically follow POP tree groups |
| tr-wet-shore.jpg | Existing coast/wetness presentation is a source candidate | Read-only evidence; no WTR or shoreline integration/calibration added |
| island-dominant.png | Original material-classification distribution | Classification checksum remains unchanged; MAT is appearance/diagnostics only |

These source and ENV cameras/lighting are different. This is qualitative source-evidence alignment, not a false pixel-matched comparison between two different viewers. Actual matched before/after evidence uses identical ENV cameras with original POP settings.

## Gate A findings, in priority order

1. Keep the integrated floor as a reproducible reference: trunk contact, leaf litter and moss now visually connect the trees to the landscape.
2. Resolve edge intent before global exposure changes. The material forest mass extends into open ground and fails to follow some tree groups.
3. Reassess M01 panoramic value in MAT-01R. Both the original material gallery and integrated elevated views show a dark mass; real shadows intensify it.
4. Review grass-to-ground detail scale and fade. Individual tufts remain isolated against a broad detailed plane. No density increase or new understory was used to mask this.
5. Improve composition through a separately reviewed local ecology decision. Existing tree silhouettes are readable, but a convincing sequence of enclosure, glade and open terrain is still provisional.

## Gate B discrepancy report

At the original landscape review region, 170 of 738 active tree descriptors fall on >50% meadow terrain. At the original edge region the discrepancy is larger (see JSON). This is a disagreement between provisional ecological interpretations, not evidence of a coordinate inversion. Some grass descriptors also fall on bedrock-dominant classification.

`evidence/ecological-overlay.png` projects flagged descriptor ground contacts through the actual overhead camera onto a genuine WebGL PNG. Red rings flag trees on meadow; yellow crosses flag grass on bedrock. Projection uses canonical triangle elevations and recorded camera quaternion/FOV. It does not perform an occlusion test or claim all descriptors are currently rendered. `overlay-projection.json` makes the annotation reproducible.

`ecological-mismatches.json` additionally measures forest-floor samples with low nearby tree occupancy. These are proxies, not automatic glade definitions or instructions to delete litter. The original POP seed, density, IDs, transforms, source geometry, slope queries and water exclusions remain preserved in the renderer implementation.

## Gate C implications

The first matched landscape keeps 85 calls, 471,677 triangles and 13 renderer geometry allocations in both modes. MAT adds one shader program; renderer texture count changes 7→12. The adapter owns four explicit MAT textures; the additional observed internal allocation is not independently attributed. High-profile texture allocation is estimated at 41.22 MiB. The same terrain vertex/normal/index buffers are reused (about 3.01 MiB of ground buffer data; no extra terrain mesh). Total resident GPU geometry bytes are not measured.

The original run reached ready at 10.39 s; MAT preparation was 6.67 s, including 2.95 s classification and 1.69 s synthesis. Separate sequential POP/ENV load observations are reported in PERFORMANCE.md with cache/order caveats. Render/finish API-return samples are not verified GPU frame times and must not be used to conclude that high is faster than neutral or to choose Android settings. PNG readback timings expose much larger queued-work costs.

The largest recorded page construction observation was 7,072 ms in software WebGL. It remains a known POP activation limitation. No activation refactoring is claimed. Profile disposal/recreation and full teardown passed in the captured session; post-resume region re-entry is separately recorded in evidence/resume-browser.json.

## Smallest next steps

First restore the missing POP/ENV Git objects and finalize preservation. Then owner review of this evidence. After approval of a narrow next scope: local ecological edge reconciliation, followed by integrated M01 tonal/detail calibration. Keep activation refactoring and physical Android measurements as independent technical milestones. No new meshes, MAT-02, WTR integration or geography edits were performed.
