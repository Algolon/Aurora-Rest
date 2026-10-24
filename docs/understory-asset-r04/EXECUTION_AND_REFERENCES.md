# UNDERSTORY-ASSET-R04 — Source-informed Moss/Humus Substrate + Leaf-Dense Bilberry

**Art status: PENDING ACTUAL RENDER REVIEW.** Do not conflate passing CI with botanical or artistic approval.

## Context

- Protected original recovery: bced77ca3ca0539f7137cd9f066e6220518cf4a8
- Reviewed R02 authored forest floor (ART REVISE): bec87c4c5674e8c5bfb96dcebe0e04bb80e3b1de
- User-accepted R03 2D visual target & photographic registry: 360ee5bc77940eb3bc7cacadcea623bfba68fc63
- One isolated branch from R03. The existing R01, R02 and R03 sources are retained unchanged.
- Art direction: **Believable Nature, Sculpted for Wonder**.

## Tasks, carried out in order

1. Verify R03 and unchanged recovery baseline; use actual botany as references, not AI concept images as evidence of ecology.
2. Design TWO intentionally distinct original specimen objects, with documented real-scale bounds, whose underlying source can later be ported separately.
3. **Substrate:** 2.4×2.4 m owned local geometry; multiscale nonperiodic humus/litter vertex colour; several overlapping low moss cushions; reclining pinnate feather-moss mesh repeated in an owned InstancedMesh; pine needle / leaf fragments. No copied source photos, atlas, tileable PBR or Blender. Must look layered at eye and macro scale, not checkerboard or white road.
4. **Dwarf shrub:** one compact ~0.25–0.50m deciduous Vaccinium myrtillus with 5 rhizomatous growth origins, 34 angled shoots and >600 tiny individual leaf laminae. Natural form and negative space, but should read full (not 3D grass, a star-rosette, or tiny plastic tree). No new textures or scan models.
5. Show each side-by-side in a separate exact-source comparison: A is unchanged R01 moss and bilberry references, B is new R04 substrate and new R04 bilberry. **A and B are research-stage comparators, not the full Birchwood scene.**
6. Validate separate deterministic geometry, bounds, draw calls, triangles, no runtime errors, lifecycle disposal; capture true headless Chromium WebGL A/B/A at five identical camera positions. This is SwiftShader, NOT an Android GPU FPS certification.
7. Art-direct the real screenshots, decide separately for substrate and bilberry: GO / REVISE / REJECT. Preserve all evidence. NO auto-approval from metrics.
8. Stop after one candidate unless a clear, bounded major defect merits exactly one corrective pass. Avoid repeated vertex or sculpt parameter loops.

## Reference basis & photographic rights

- [USFS FEIS, Vaccinium myrtillus](https://research.fs.usda.gov/feis/species-reviews/vacmyr): green angled shoots, alternate ovate/elliptic 1–3 cm leaves; rhizomes.
- [USFS FEIS, Pleurozium schreberi](https://research.fs.usda.gov/feis/species-reviews/plesch): lateral branching and potential carpet formation in shaded, late-succession forest.
- [Annals of Botany, feather mosses in Sweden](https://pmc.ncbi.nlm.nih.gov/articles/PMC5691860/): moss-boundary layer over soil, feathery branch/leaf development.
- See the archived R03 [photo licensing register](../understory-art-r03/SOURCE_PHOTOGRAPHY_REGISTER.md). No source photo was redistributed or used as a pixel-based source texture, so no licensed scan or photo-driven PBR deliverable is claimed.

## Technical budgets and isolation

- B-mode full showroom <= 170,000 source-submitted triangles and <= 11 draw calls, excluding GPU actual overdraw.
- Assets instantiated locally, own and dispose geometry + materials; don't modify original world materials or create an ambient/scatter system.
- Base and new scene differ visually; turning B off restores bit-identical A screenshot from unchanged cameras.
- Protected original source files and runtime untouched. No world integration, asset library registration, merge or deployment.

## Visual acceptance

A substrate passes art only if its moss-mat silhouette and humus/needle contact read organically, without evenly spaced star spikes or dark smooth void. A bilberry passes only if irregular canopy/negative space reads as a leafy rhizomatous dwarf shrub at walk and macro distances and small stems don't read like reeds. One green CI does not resolve these gates.

## Honest limitations

This is original authored Three.js geometry plus vertex colours, not a photo-real scan, licensed PBR material set, real moss microphotography, physically measured surface reflectance, authored LOD family, or proven real-device mobile performance. The generated R03 2D art targets are a visual goal; they do not guarantee this study's aesthetic quality.
