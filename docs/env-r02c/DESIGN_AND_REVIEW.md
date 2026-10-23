# ENV-R02C — Birchwood Gateway, authored landscape design A1

**Status:** source-backed design candidate, NOT ART APPROVED. Default OFF. Parent `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
No original source file edited. No merge, deployment, terrain/biome changes or existing asset remodeling.

## Critical coordinate correction
Verified canonical GEO `public/geo-r02b/features.json` stores Birchwood anchor at **(-740,-50)**, while `reviewCameras()` uses closest hero route point **(-350,-290)** for the intended `forest-corridor` review. They are **~458m apart**. Earlier ENV-R02B eight-tree suppression was around Birchwood, leaving the corridor untouched. ENV-R02C deliberately locates the small design at the actual route camera, not the anchor.

## Authored landscape score: Enclosure — threshold — release
The playable concept follows the **verified hero-route tangent** from (-375,-357), through (-360,-312), past the camera (-350,-290) and toward (-328,-280) / (-300,-266), with an off-axis opening at (-316,-290). Earlier A1 crossed the hero trail instead of following it (its ends missed the route by ~51–52m). This A2 correction aligns the authored concept to the canonical centerline; do not claim the whole Birchwood-to-Central-Valley route is solved. This is a **local scenic narrative, not a finalized 458m path connection or final Central Valley vista**.
- **A** Sheltered birches (-378,-240): irregular tall white-trunk rhythm, no straight plantation row.
- **B** Mixed north edge (-338,-260): pine interruptions amongst birches; layered crown separation.
- **C** Eastern frame (-296,-285): delayed opening ahead, not a symmetric hallway.
- **D** Pine shelter (-390,-302): darker, heavier boundary and enclosure.
- **E** Young birch shelter (-358,-333): lower vegetative edge, nesting in existing ground.
- **F** Dark ridge edge (-314,-354): uneven trailing tree silhouettes instead of a flat line.
- **G1–G5** Existing source grass clusters act as provisional ground-cover *mass* at the route edges. These are **not real bilberry/heather/moss models**; those assets remain missing.

## Evidence-led morphology
Northern mountain birch woodlands have varied crown spacing and a meaningful dwarf-shrub/moss/lichen layer. Real ecological sources:
- https://iprdatabase.eu/db/recent/sites/c11-scandinavian-birch-forests-betula-pubescens-subsp-czerepanovii-with-dwarf-shrubs-mosses-and-lichens-empetrum-hermaphroditum-vaccinium-myrtillus-deschampsia-flexuosa-pleurozium-schreberi-dicranum-fuscescens-cladina-mitis-cladina-rangiferina
- https://research.slu.se/en/publications/understory-vegetation-as-a-forest-ecosystem-driver-evidence-from-/
- https://nsojournals.onlinelibrary.wiley.com/doi/10.1111/oik.09567

## Safety/implementation
- Separate `env-r02c.html` reviewer. Original `src/env-p01`, POP, MAT, GEO, asset library, original seed, origins and IDs unchanged.
- New `design.ts` contains specific, auditable authored metre locations, 6 groves and 5 cover patches. No world-scale ecology rule.
- Renderer-only new instances use existing birch/pine/grass geometry and separate `env-r02c:` IDs. Canonical source descriptors are unmodified.
- A narrow route/clearing removes only *rendered* source tree rows, preserving source IDs and positions in stream data.
- Terrain safety: test actual canonical `geo.sample()` for dry ground, slope, and water clearance before optional model is instantiated.
- Both A and B cameras/lighting/materials are identical. OFF returns exact source visuals.
- Preview entry is NOT deployed. `npx vite --config vite.env-r02c.config.ts`, then `/env-r02c.html`.
- All unapproved visuals/review-only geometries are restricted to this candidate branch.

## Art decision gate
**GO only if** the first-person path has meaningful enclosure, off-axis reveal, recognizable two-sided groves, and visible mid/near groundcover, and looks organically Nordic rather than stage-dressed. **REVISE/REJECT** if repeated tree patterns, excess sculptural symmetry, empty dark floor, awkward ground contact or unreadable route remain.

The next action must be an art review of *real* screenshots, not another procedural iteration on faith. A2 screenshots use three camera viewpoints following the actual hero route: gateway-approach, gateway-trail and gateway-reveal. The older forest-corridor camera heading was not aligned with this tangent and is not suitable as the primary A2 design proof. No device FPS claim.
