# S1R — pre-edit art diagnosis

Starting checkpoint `7ed1d43aa5e6577bba5238dfa53be645523c110f`. This diagnosis precedes artistic mesh edits. The actual original `.blend` was opened and inspected; neutral baseline renders are captured before modification. `s1-inspection.json` records its named source vertices, polygon boundaries, collections, material slots and modifiers.

## Preserve

- All nine ground vertices **a–i**, their flat Z=0 support polygon, ground pivot and identity transforms.
- The left-biased high point **K**, compact descending crown-to-right silhouette and metre scale.
- Existing right shoulder **C/D/R**, its shared topological connection, lower **cl/dl/el**, and the supported right flank. **S** may lift slightly to clarify the shared upper ridge; it remains the same vertex, not a new shoulder solid.
- Large right-side and lower mass distribution; no new object, Boolean, hull, noise, smoothing or broad subdivision.
- Original S1 files, all original reference meshes, A2 T1 and nature sources.

## Front — one purposeful oblique cleavage

The broad `main frontal cleavage` (al/bl/B/A) currently dominates a quiet near-vertical face. Split **al–A** and **bl–B** at unequal elevations, add named **FRONT_LEFT_BREAK / FRONT_RIGHT_BREAK**, connect them through the existing face, and shift the shared ridge modestly toward the front. This creates two unequal large/medium planes rather than a uniform triangle fan. Neighbor faces share the inserted boundary vertices. Move **A/B** slightly to carry the roof into this fracture and preserve the integrated R/C shoulder.

## Left and rear — one wrapping structural change

The `west broad plane` and `broad rear plane` lack a strong secondary direction. Insert **LEFT_REAR_BREAK** on gl–G, **LEFT_SIDE_BREAK** on hl–H, and **REAR_BREAK** on fl–F. Connect the left pair through the original west face and continue from LEFT_REAR_BREAK to REAR_BREAK through the original rear face. Offset those points outward by a few centimetres, with deliberately unequal heights. Move upper **G/H/I/F** to make the rear-left crest and its supporting faces distinct. This is a shared-edge crease across existing surfaces, not an applied slab or an independent volume. Keep the ground contour unchanged.

## Crown and roof — broad directed planes, no accidental triangulation

Retain **K**. Broaden and stagger **J/N**, lower the right-side crown transition **L/M** slightly, and lift **S** modestly. The original roof (B/R/S/L/K) deviates ~86 mm from its polygon plane; crown (J/K/L/M/N) ~71 mm. Split those two explicitly along the intended crest directions. Other materially nonplanar polygons will receive explicit face splits, preserving broad planar n-gons where already valid. Runtime polygons will be triangulated before normal/UV generation so each exported hard plane matches its actual triangle geometry. No smooth normals will disguise warped faces.

## Edge treatment and guardrails

Replace the original five uniform 18 mm selections with a smaller named crest selection, approximately 14–25 mm depending on the role. Front fracture stays sharp; exposed crown lips receive restrained weathering. Do not bevel every edge.

Remain within 5–10% of 2.080 × 1.647 × 1.547 m. Reject spike-like crown changes, a detached-looking shoulder, point contact, or a gain in the front view that damages left/rear/top. One S1R candidate only. Compare original and refinement at identical camera, light, material, metric scale and resolution; do not infer ART APPROVE from topology.
