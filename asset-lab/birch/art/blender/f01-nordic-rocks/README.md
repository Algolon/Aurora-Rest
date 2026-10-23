# F01 preserved Blender sources — ART NOT APPROVED

R2 and R3 are frozen technical pilot assets. The owner requested completion of the existing implementation without further sculptural iterations. Technical validity is separate from art acceptance.

- `broad-glacial/aurora-broad-glacial.blend` / `.glb`: independently authored R2, initial candidate retained.
- `sculptural/aurora-sculptural.blend` / `.glb`: independently authored R3, one crown correction completed before the freeze.
- R1 is referenced unchanged at `../s1r-sculptural-polish/aurora-rock-s1r.glb`; its original Blender file is preserved there.

Verified native environment: macOS arm64, Blender 5.2.2 LTS, build `d13f752e3b9c`. Blender background execution, bpy, Cycles rendering and built-in glTF export ran locally. CI validates static exports; it does not validate editable Blender projects.

Each new project has `01 EDITABLE`, `02 EXPORT` and `03 STUDIO` collections. The editable mesh is hidden to prevent duplicate rendering: unhide it and hide the runtime mesh to edit. Named vertex groups identify structural points; `geological_patch` and `source_patch_boundaries` preserve the original patch design. Source objects have no opaque modifiers. Warped faces are explicitly split; retained patch metadata explains their relationship. The evaluated export is a separate mesh, with selective one-segment bevels and flat triangle normals.

`build-f01.py` contains separate explicit shared-vertex cages for the two assets. There is no randomized primitive, imported G1 geometry, CSG or separate intersecting shoulder. R2 has three 35 mm bevels; R3 has three 28 mm bevels. Scripts reproduce saved outputs; manually editing the cage requires updating its explicit point/face definition before rebuilding. Export collection is an evaluated snapshot, not a live modifier link.

From `asset-lab/birch`, reproduce deliberately, only when a new task authorizes changes:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python art/blender/f01-nordic-rocks/build-f01.py
```

Read-only validation of the saved projects and corresponding GLBs:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --threads 6 --python art/blender/f01-nordic-rocks/validate-saved.py
```

Exports are glTF 2.0 binary, metric, Y-up, origin at the resting ground plane, identity object transforms, one mesh/primitive/material, UVMap and Color attributes, normals, no cameras/lights/animations. Blender import object dimensions are recorded in its local Z-up mesh basis; the independent Node tests validate actual runtime Y-up dimensions.

`geometry-metrics.json` records native source/export checks; `saved-project-validation.json` proves independent reopen and matching GLB triangle positions. `renders/` contains eight genuine neutral Cycles renders per final model. R3 `initial-review/` preserves its pre-correction metrics and two renders; initial Three.js captures are in `../../../f01-evidence/initial-review/`.

Iteration ledger: R2 one initial candidate, zero corrections; R3 one initial candidate, one correction lowering structural point W from 3.08 to 2.86 m. No further art changes are authorized. Both new shapes: **ART NOT APPROVED**.
