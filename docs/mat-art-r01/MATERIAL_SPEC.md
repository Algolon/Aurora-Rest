# MAT-ART-R01 — Material-art specification: *Soft Sculpted Nordic Ground*

One direction, two material families (`forest-floor`, `meadow-turf`). Implemented as the isolated review
variant **B** in `src/mat-art-r01/variant.ts`; variant **A** is the untouched MAT-01 material.
The diagnosis that motivates every choice below is in [DIAGNOSIS.md](DIAGNOSIS.md).

## Design hypothesis

The mismatch is a **frequency-and-value** problem in the albedo, not a normal-map, tiling or shader problem.
MAT-01 meadow turf puts 63% of its luminance variance below 2.5 cm and 86% below 6 cm, which lands at or
below screen-pixel Nyquist at walking distance (a pixel is 5–25 mm on the ground at 3–5 m). The existing
vegetation carries detail only in geometry silhouettes (vertex colours plus an ≈8 m tint field). So the ground
reads as photographic speckle beneath assets that read as sculpted forms.

The fix: move ground contrast **out of the grain/blade bands and into tuft/clump/patch bands (6 cm – 1 m+)**,
lower the value range, and pull the palette toward the grass assets' greens. The ground becomes a painted
sward that implies grass, and the 3D tufts carry the blade silhouettes.

## Shared visual language (both families)

| Element | Treatment |
| --- | --- |
| Primary shape | **R4:** meadow tufts are fans of 3–5 tapered, pointed blades from one root (≈6–24 cm long, 1.5–5.5 cm wide at the root), lean-aligned and overlapping; forest moss forms irregular ≈20–40 cm mats of tiny tufts in random directions, the same vocabulary at moss scale. (R1 used soft rounded ellipses and cushions, which read as leaves or clover at 1–3 m.) |
| Shading cue | Blades run dark at the root and light at the tip, with one side catching the light; soil clods and leaves keep the fixed-side dome gradient. No per-pixel noise |
| Microdetail | Crisp but wide: blades ≥ 1.4 px at the tip with a 1 px anti-aliased edge; accents at 26–28% opacity near the tuft tone. Per 512² tile the meadow has 5,940 blades in 1,500 tufts plus 522 strokes, about 32% of MAT-01's 20,400 marks, each mark much wider and lower in contrast |
| Value structure | Narrow: under-layers are mid-dark olive or warm humus, never near-black soil between blades |
| Within-tile structure | Luminance equalisation weakened (0.9 at 1/8 tile → 0.65 at 1/4 tile) so clump rhythm survives; tile-scale blotches are still removed |
| Cavity AO | Softer (gain 2.6 → 1.6, floor 0.35 → 0.55): it shades clump feet, not every blade gap |
| Detail normals | Reduced, from domes rather than strokes (meadow slope RMS 0.66 → 0.24) |

## Palette hierarchy

- **Meadow turf:** olive-moss core (`#505b3b` → `#778153`), restrained dry-straw accents (`#989569`, `#ac9e7a`) in
  loose groups. Shifted from MAT-01's yellow-olive and dark-brown soil toward the grass assets' base greens
  (`#2e4e36`, `#46663c`, `#9fac68`) so tuft bases grow out of the ground instead of sitting on it.
- **Forest floor:** warm humus browns (`#4a4231`–`#5a4c39`) with soft clump-scale clods; muted moss (`#5c6743`–`#6b764c`, never lime);
  birch leaves as fewer, larger, muted-gold ovals in drifts.
- The families stay distinct in hue (brown humus versus green sward) but share value range, shape scale and lighting cue.

## Parameter changes (final B, vs A)

Numeric parameters are R1's and were unchanged by R2–R4, which changed only the shape vocabulary (rows marked R4).

Values are the final variant after the single R1 colour refinement; the first-comparison values are shown in brackets where R1 changed them.

| Parameter | forest-floor A → B | meadow-turf A → B | Why |
| --- | --- | --- | --- |
| `tileM` | 2.2 → 2.6 m | 2.6 → 3.0 m | Larger sculpted shapes at the same texel budget; anti-tiling unchanged |
| `palette` | 10 stops; moss stops muted (R1: −15% sat., −3° hue) | 8 → 10 stops, narrower value; R1: −20% saturation, −7° hue toward olive moss | Value/hue cohesion with assets |
| `normalStrength` | 0.9 → 0.6 | 0.75 → 0.5 | Normals were a minor contributor (D1); kept as soft relief |
| `macroTint` | `[1.14,1,.84]/[.8,1.04,.84]` → `[1.1,1,.86]/[.84,1.04,.88]` (first B `[1.08,1,.88]/[.86,1.03,.9]`) | `[1.24,1.08,.72]/[.8,1,.86]` → `[1.2,1.07,.78]/[.84,1,.9]` (first B `[1.12,1.05,.84]/[.86,1,.92]`) | Keep ≈80% of the landscape hue swing on a desaturated base; the first B lost the massing |
| `exposureTint` | `[1.08,1.02,.9]` → `[1.06,1.02,.92]` | `[1.18,1,.74]` → `[1.14,1.02,.8]` | Softer exposure cast |
| `patch` | tint `[.8,1.18,.74]`, 9 m, 50% → `[.84,1.12,.82]`, 11 m, 50% | `[.95,.76,.6]`, 6 m, 22% → `[1.12,1.03,.78]`, 8 m, 34% | Broad massing; meadow patches become sunlit sward rather than brown holes; greener forest patches narrow the family hue gap |
| `mesoAmount` | 0.4 → 0.36 (first B 0.3) | 0.45 → 0.45 (first B 0.35) | First B's reduction removed too much landscape-scale variation |
| relief (synthesis) | 0.025 → 0.022 m | 0.03 → 0.02 m | Soft relief |
| equalise (synthesis) | 0.9 @ 1/8 → 0.65 @ 1/4 | same | Keep clump rhythm inside the tile |
| cavity AO gain/floor | 2.6/0.35 → 1.6/0.55 | same | Shade clump feet, not blade gaps |
| Generator marks (R4, counted) | 1,700 crumbs + 22 twigs + ≤110 leaves → 700 soft needles + 220 clods + 14 twigs + 70 leaves + 1,309 moss tufts (5,255 blades) in mats | 3,400 soil + 17,000 blades + 300 clover → 90 soil mottles + 1,500 tufts (5,940 blades) + 522 accent and dry-straw strokes | Shape before stroke; one vocabulary for both families |

Per 512² reference tile. Unchanged: material ids and order, seeds, `mesoScale`, `heightBlend`, roughness, wet tint,
triplanar/streak flags, classification, blending logic, shader, texture format, coastal sand and bedrock.

## Repetition strategy

The shader's world-space anti-tiling second sample, meso noise and patch masks are unchanged. Stronger in-tile
shapes raise the repetition risk, so tiles grow (2.6 m and 3.0 m), luminance is still equalised above ¼ tile,
and clump placement is driven by tileable cover fields rather than a regular lattice. Repetition is checked in
the elevated and 15–50 m views (Phase D).

## Expected relationship with existing assets

- 3D grass tufts (vertex colour, 7–20 blades, 0.2–0.65 m) provide blade silhouettes; the ground supplies the sward
  beneath them at a matching shape scale and colour family.
- Trees and rocks keep their materials; the ground's broad patch/meso massing matches the trees' ≈8 m tint field.
- Beyond the 3D grass fade distance the ground must continue the same mid-green sward rather than switching to a
  yellow-olive carpet. This is checked at the meadow transition and grassland views.

## Known trade-offs

- Less literal close-up information: at 1 m the meadow shows painted tufts, not blades. That is intentional.
- A stronger in-texture shape scale is more prone to visible repetition than speckle noise.
- The classification places meadow-turf under parts of the birchwood corridor. Because classification is
  protected, the woodland shows meadow turf there, and the meadow material must therefore also read acceptably
  beneath birches.
