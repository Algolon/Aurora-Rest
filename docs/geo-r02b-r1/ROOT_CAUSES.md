# GEO-R02B-R1 diagnosis — before correction

Baseline 7438e6a is preserved in Git. The original eight browser images and reports in docs/geo-r02b remain unchanged. The original generator was instrumented in a temporary directory. Its output SHA-256 exactly reproduced the checkpoint binary. Stage measurements are in root-measurements.json, stage-depressions.json and before-sections.csv. Coordinates are east x / north z in metres.

## Closed depressions: all seven are real sampled terrain defects

The 4 m escape-depth probes below confirm the original 20 m flags. These locations are outside the four intentional lake polygons. They are not intentional endorheic basins or grid-only artifacts. The instrumented stages isolate creation/amplification; priority flood is used only to measure, never to fill the landscape.

| Location x/z | 20 m / 4 m escape depth | First cause and amplification | Correction / adjacent effects |
|---|---|---|---|
|800 / 1040|58.63 / 58.60 m|Compact ridge support leaves a 54 m inter-ridge pocket; basin support raises its barrier, independent valley blending raises escape depth from 27 to 56 m; river support adds 3 m. Nearby main water is 191 m at 266 m distance.|Solve flank elevations jointly between eastern crest and upper valley; raises the missing hillside broadly, changes Tarn approach panorama. No isolated drain drilled through ridge.|
|340 / 1120|42.00 / 42.03 m|Valley blend creates 32 m enclosure west of main upper course; pass reduces it slightly; channel support raises barrier to 42 m. Nearest river is 171 m versus local 97 m.|Joint saddle/valley solution replaces contradictory height functions; affects eastern saddle approach and Tarn ascent.|
|-400 / 820|7.53 / 7.76 m|No closed depression before river support. Elevated Birchwood inlet support dams lower woodland at the lake-rim transition.|Connect upland inlet cross-section to woodland flanks; preserve independent western lake outlet.|
|160 / -1220|3.99 / 3.99 m|Broad Mire floor initially drains; support berms on main/south tributary create closed dry-side pocket.|One floodplain/channel cross-section; no late bank raising. May alter M1 approaches.|
|1160 / -900|3.81 / 4.61 m|Ridge maximum union leaves 4.51 m pocket; valley blend partly reduces it; noise slightly deepens it.|Joint eastern slope-to-lowland interpolation without added noise; affects southern Hidden Fold approach.|
|580 / -1880|2.96 / 2.93 m|Mire floor drains before support; late river support creates barrier above 4.90 m terrace.|Continuous low-gradient floodplain grading to channel; preserve wetland identity.|
|1160 / -1920|2.48 / 2.49 m|Same late support barrier on the opposite lower Mire terrace.|Same shared floodplain constraint, retain Home Cove regional position.|

## Shore, valley walls and rendering

1. Valley targets sample the nearest axis vertex, while ridge targets use continuous segment projection. Valley levels therefore contain quantization steps. Broad floors are blended across a raster signed-distance mask with steep boundary weights, producing repetitive walls where the carved floor differs greatly from a ridge maximum. Correct by continuous segment projections and one constrained field, with broad valley-floor constraints and free connected flanks.
2. River support raises terrain before forcibly overwriting its bed inside a Boolean width. The transverse discontinuity and nearest-vertex water level can produce steep bank steps. Fix with a continuous channel cross-section and shared longitudinal profile; do not raise banks after valley construction.
3. The final coastline attenuation is applied after channels, lowering banks and modifying beds at coastal mouths. Original 81 low-bank probes concentrate on western mouths/gullies (40 upper Birchwood, 12 lower, 20 windward) with 9 elsewhere. Fix coast before water constraints and inspect complete ribbon widths, not only channel centres.
4. Lake inner bowl and forced two-cell outside buffer have an abrupt transition to the outer ramp. Coarse 16 m meshes cannot resolve an 8 m buffer or 16 m stream. Fix signed continuous shoreline sections and use canonical 4 m mesh for this integrity checkpoint.
5. All tile edges have 32 m skirts, including same-resolution neighbours; this adds duplicate coplanar faces and does not repair coarse water intersections. The curved valley walls are not solely skirts (they do not follow 400 m tile lines). Remove skirts, use identical shared boundary vertices and consistent 4 m mesh; test actual indexed edge adjacency and raycast contact.
6. Ridge max-union makes independent compact tent flanks meet in angular seams. Gaps between them default to low coastal base even beside upland streams. Solve all crest branches, lake shores, valley floors and coastline simultaneously; keep asymmetric authored ridge spacing and original elevations. No Gaussian hills or procedural noise introduced.

## Routes and named crossings

All six original route grades were measured on the rendered triangle diagonal. Hero and Hidden loop have water/deck alignment conflicts in addition to terrain slope. M1/H1/H2 decks are perpendicular to rivers; original paths approach them obliquely, sometimes leave their 3.5 m width, and fall into the channel. Other very steep samples arise from valley boundaries and narrow ridge profiles. Peak ascent switches direction without contour-following elevation control. Tarn ascent and South Shoulder repeatedly traverse steep flanks; west cape has a short slope conflict.

Correct terrain first. Then search dry, grade-constrained routes within the original reservations; keep endpoints and discovery waypoints, guide crossings through their actual deck endpoints. Report any expanded reservation or unavoidable summit conflict explicitly. No trail lowering of mountain elevations. Compare original and candidate profiles on the same final field; do not conflate mesh tests with route acceptance.
