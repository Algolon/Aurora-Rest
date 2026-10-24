# ROCK-R01G — Original Natural Boulder Creation / Native Blender Studio

## Current truthful progress
**Owner approved the A direction**. R01G has been initiated on its own source-protected branch.

This folder currently contains a **REAL BLENDER STUDIO GENERATOR**, work order, and neutral art QA. It generates a native, editable .blend file with the scale, stage, reference guides, lighting, eight cameras and one **featureless ellipsoid clearly marked PLACEHOLDER**.

**IMPORTANT:** neither a true hand-sculpted R01G rock nor approved game-quality 3D geometry yet exists. A scripted placeholder is not a manual original boulder; this explicitly prevents repeating the G01–G02R mistake.

## Open the native .blend starter without touching the repository
Download the GitHub Actions artifact "Aurora-ROCK-R01G-Blender-Sculpt-Studio" from the R01G branch workflow. Unzip it, open the \`.blend\` using Blender on the Mac. Use the existing R01E reference sheets and actual Myrstigen/Kummakivi photos for **human-guided sculpting**.

The R01E source vector boards reside in this repo:
\`asset-lab/birch/rocks/reference/R01E-01-Natural-Shape-Variants.svg\`
\`asset-lab/birch/rocks/reference/R01E-02-Multi-View-Shape-Handoff.svg\`

If running Blender locally, macOS Blender binary path is usually:
\`/Applications/Blender.app/Contents/MacOS/Blender\`.
To rebuild locally without any downloaded artifact:
\`"/Applications/Blender.app/Contents/MacOS/Blender" --background --python asset-lab/birch/rocks/r01g/build_blender_studio.py -- --out ROCK-R01G-A-STUDIO-PLACEHOLDER.blend --refs ./reference-pngs\`

## Actual human sculpting sequence
1. Turn the placeholder into ONE broad asymmetrical natural boulder with Grab and Clay Strips. Sculpt by rotating the view; NEVER leave a symmetrical UV-sphere look.
2. Widen/flatten the crown organically, taper lower subordinate right side into same stone. Build 3–5 *continuous surface directions*, not three connected ellipsoids and not a low-poly roof.
3. Carve ONE short partly sheltered weathering cleft with hand-guided Draw Sharp/Crease and soften unequal lips with Smooth; do not apply a procedural fissure stamp.
4. Use a temporary textured/matte clay neutral; no final stone shader, moss/grass assets or noise. Ensure broad partly embedded natural ground contact.
5. Save the actual sculpt to **ROCK-R01G-A-sculpt-v01.blend** with a clear artist handoff. Do not overwrite the placeholder as if approved.
6. Produce a multi-angle review front, front¾, right, rear¾, rear, left, top and human-height with neutral clay. Mark rear/side as artist hypotheses because Myrstigen photo coverage is insufficient.

## Art gate
Before attempting any GLB / Aurora world / asset library:
- One single boulder at 20m, not a miniature mountain or stacked blobs.
- Natural changing surfaces at 10m with broad uninterrupted curvature; not low-poly radial ribbons.
- At 5m one real local, irregular, sheltered cleft with uneven rims; not an artificial V-gouge.
- Natural grounded base from all angles, no flat skirt.
- Owner confirms ART APPROVE after real neutral-view screenshots.

## Safety / scope
No production integrations, no merges, no deployments and no modifications to G1/G01/G01R/G02/G02R. New work only inside \`rocks/r01g/\` and dedicated CI workflow. Do not auto-sculpt a new random procedural substitute.
