# AURORA REST — ROCK-R01F | Selected-A Natural Geometry Feasibility Review

**Date:** 2026-10-24 · **Owner design selection:** R01E **A — Nordic Weathered Corestone** (APPROVED DIRECTION).
**Owner task:** formulate instructions and execute next step, avoiding the unsuccessful G01/G02 code-driven sculpt loop.
**Baseline:** R01E owner-design package commit \`93b1278d369492bb4c25f284a280387264595d09\`.
**Branch:** \`research/rock-r01f-reference-to-scan-pilot\`
**Technical source audit:** **PASS**, [GitHub Actions 40086963048](https://github.com/Algolon/Aurora-Rest/actions/runs/40086963048).
**CI artifact:** [original verified CC0 GLB + six automatically sampled-geometry preview PNGs + metadata](https://github.com/Algolon/Aurora-Rest/actions/runs/40086963048/artifacts/12557432288).
**Visual art conclusion:** **ART REJECT AS A MATCH FOR A**. Do not register as an Aurora rock.
**Important:** A was selected by owner; **NO 3D mesh of A was modeled**. This milestone tested a distinct real 3D source's suitability only.

## WHY THIS CHANGE OF EXECUTION METHOD
The user explicitly rejected further mesh-coordinate/triangle-pattern tweaking: earlier attempts G01/G01R/G02/G02R could make robust geometries but not naturally formed, regionally plausible stones. The approved R01E is evidence-led 2D. The chat runtime has no interactive Blender viewport/GUI or .blend authoring pipeline. Therefore claiming a "hand-sculpted Blender mesh" would be false.

This trial instead retrieved an **existing commercially usable CC0 3D source boulder** with actual continuous stone surface geometry and preserved source provenance, as a *feasibility comparator*. The model remains physically distinct from Myrstigen (SE), Kummakivi (FI), and SGU Hunnebo klovor, and its exact geological provenance is NOT known.

## SOURCE TRACEABILITY

- **Model:** Poly Haven **Boulder 01**, author **Rico Cilliers**, CC0.
- Official record: https://polyhaven.com/a/boulder_01
- License page: https://polyhaven.com/license
- Public GLB derivative/download record: https://www.innerscene.com/tools/library/3d-parts/boulder-c2eeb692
- Download endpoint: https://www.innerscene.com/api/library/boulder-c2eeb692/download
- Source file: \`boulder-01-original-CC0-from-polyhaven.glb\`, retained as CI artifact, **not checked into git or production**.
- File size: **13,535,324 bytes**.
- SHA-256: \`5f42904aaa3ab862cf5931808b8240a7e7fae2e988e17bb6c4fc3d272dc880f7\`.
- GLB magic/declared length/version validated: binary glTF v2.
- Geometry: **67,042 vertices**, **66,122 triangles** in the imported preview-level scene geometry.
- Source bounding dimensions before Aurora scaling: **1.27214 × 1.00383 × 1.83033 (source length units)**. The source listing estimates 127 × 183 × 100 cm (XYZ axis order differs).
- \`trimesh.is_watertight = false\` for source geometry. A natural environment model with an open/unsealed bottom should NOT be mistaken for approved physics collision.
- Scan provenance: Poly Haven states some natural models are photogrammetric, but this asset's precise per-model production method **has not been independently confirmed**. Call it a *published natural boulder 3D asset*, not a certified photogrammetric capture of either owner-selected specimen.

## RENDERING EVIDENCE: TWO SEPARATE EVIDENCE LAYERS

**CI:** 6 automatically generated 3D geometry previews via Matplotlib sampling a subset of original faces; the original GLB is never altered, but **sparse triangle sampling produces incomplete / visually weak images**. These verify basic source import, not final art. Metadata JSON included and scope protection passed.

**Local visual art review:** imported the same SHA-256-verified GLB into VTK 9.6, rendered **all original 66,122 faces** with flat neutral material, no scanned texture or invented geological additions. Produced matching front, front three-quarter, right, rear, rear three-quarter and top views plus a contact sheet and A-vs-source shape comparison. Real geometry rendered in software; **NOT WebGL**, NOT Blender modeling, NOT an R01E-A model. Those higher-quality images and source GLB are supplied separately in downloadable chat artifact (not copied into GitHub) and are the basis for the art disposition below.

No new mesh was sculpted, no triangle reshaping or inserted fractures, no material authoring or world placement.

## COMPARISON: OWNER'S SELECTED A VS THIS REAL 3D SOURCE

| Property | R01E A approved design | CC0 Boulder 01 observed | Decision |
|---|---|---|---|
| Primary mass | Broad, heavy, low, asymmetrical, continuous boulder | Jagged angular, high and cliff-like | **FAIL** |
| Joint | Short sheltered irregular split, not a canyon | Many deep rugged creases and stacked rock shears | **FAIL** |
| Large surface grammar | Quiet sweeping broad weathered areas with localized contrasting ridges | Densely broken irregular crystalline/cliff faces | **FAIL for A**, despite real 3D complexity |
| Right belly | Subordinate broad convex contact | Fragmented, oblique angular projecting faces | FAIL |
| Base | Embedded generous natural ground bearing | Model open/non-watertight and visibly cliff-edge-like | NOT SUITABLE without independent artistic work |
| Natural shape evidence | Myrstigen+Kummakivi references | Actual external scanned-looking/real-model geometry, geological origin unproven | Different exemplars — NEVER substitute |

**Conclusion:** Real 3D geometry alone is insufficient. Natural geological complexity can still be wrong for our *specific* approved weathered corestone. **Stop here rather than making this asset match by code-reshaping it.**

## Source protection and operational state

One isolated branch; only (a) workflow, (b) source downloader/diagnostic Python, (c) R01F brief, and (d) this review & proposed next instructions. No changes to approved G1, G01, G01R, G02, G02R, reference R01E, F01, WORLD/GEO/ENV/POP/MAT or main. Protected scope check PASS in CI. No 3D Aurora A files, merges or deployment. No new 3D asset integration.

## Next recommended action: R01G true artist-guided modeling
The creation method must be chosen deliberately. Either:
1. **Manual Blender modeling of one owner-selected A form**, by an artist in interactive Blender (not automatic high-frequency coordinate tweaks). Source 2D R01E + photo provenance R01C; silhouette and broad surfaces approved from neutral multi-view before any materials. This runtime cannot claim to interactively operate Blender.
2. **A specifically better-matched licensed natural rock 3D scan**, with broad low rounded corestone silhouette and true 360° surface coverage. Require multi-angle previews and legitimate reuse rights FIRST. The sourced specimen must remain identified as *not* Myrstigen/Kummakivi unless it truly is.

Current recommended path: (1) manual form construction with strict creative and evidence gate. A narrower, more carefully filtered natural-scan selection could be used as a true morphological reference if needed, but no new automatic search/model loop is authorized.

**STOP R01F:** technical feasibility verified; experimental source shape **ART REJECT**; no new Aurora model, integration, merge or deployment.
