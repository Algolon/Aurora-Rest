# ROCK-R01F — Approved A | Natural Reference → 3D Feasibility Gate

**Owner selection:** Variant A — Nordic Weathered Corestone, based on Myrstigen's weathered nonmirrored short joint and Kummakivi's uninterrupted bulky form, 24 October 2026.

## What is authorized
The design direction A is APPROVED for a focused next-stage test. This does not mean an existing scan matches A or is already a game asset.

## New development strategy (avoid the failed G01/G02 sculpt-loop)
1. Preserve R01E's 2D sheet. Assess if actual **licensed 3D scan geometry** offers the missing geological surface complexity and continuous mass.
2. Use established CC0 public model(s), cite the original creator and source. These are *not* Myrstigen or Kummakivi, and cannot be represented as 3D reconstructions of either.
3. Start with **one** source-model trial. Inspect neutral clay geometry and front/side/rear/top consistency, compare shape to variant A. No new triangle slicing, sphere-plus-noise, height-grid or fabricated fractures.
4. Report the gap to selected A. If scan doesn't match, **reject it as a shape source** and don't force the scan into a different shape by programmatic hacks.
5. Recommended follow-up if chosen geometry isn't good enough: an interactive human-authored Blender shape sculpt using R01E sheets, or locate an accurately licensed multi-view scan *of a naturally similar specimen*. Keep Three.js for runtime QA; do not pretend scripted meshes equal artist sculpting.

## First execution checkpoint
This branch tests one available real 3D model: **Poly Haven / Rico Cilliers — Boulder 01**. Official listing https://polyhaven.com/a/boulder_01 identifies a natural rock object, CC0, real-world scale, ~124K source tris and provides clay/front/side/top photographic scan preview images. The model is NOT Nordic geological proof. For automation, use publicly available 12.9 MB GLB derivative listed at https://www.innerscene.com/tools/library/3d-parts/boulder-c2eeb692 (credited to Poly Haven). 
The workflow **must** verify actual binary GLB content, metadata, source SHA-256, surface triangle count and multi-angle neutral materialless geometry. Retain and upload provenance and source model separately from production assets. If third-party download fails, mark BLOCKED rather than fabricate a scan result.
The Python auditor captures neutral projected geometry previews, **NOT genuine WebGL and NOT a Blender .blend**; this distinction must be explicit in every review.

## Pass/fail art criteria
- One asymmetric wide/low mass with a naturally variable broad surface, rather than two stacked peaks.
- At least one genuine localized joint or sheltered pocket in the actual scanned geometry (not texture only).
- Heavy plausible ground contact, no uniformly beveled foot.
- Front, side and rear naturally consistent.
- Shape similarity to selected A must be assessed by owner from real images.

## Gates
**Tech source pass ≠ art approval.** No register, merge, deployment, environmental integration, textures or redesign during this stage. Preserve G1/G01/G01R/G02/G02R and the original R01E 2D decisions unchanged.
