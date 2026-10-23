# ENV-R02A — Birchwood ecotone ground-only pilot

Status: **candidate only; ART NOT APPROVED**. Created from recovered baseline `bced77ca3ca0539f7137cd9f066e6220518cf4a8`.
Original 558 source files, POP population and GEO binary surfaces **must remain byte identical**.

## Intent and visual hypothesis
VIS-R01 diagnosed forest-floor areas disconnected from the natural woodland spatial rhythm. Test a single designed elliptical glade at the existing Birchwood forest-edge review camera (forest anchor + 85m east / -40m north). Transform up to 52% of local forest-floor weight into meadow-turf, with a compact supported sculptural falloff. **No increase in population density, no material palette change, no new asset**. This is a falsifiable *ground-only* composition candidate; trees may continue to stand on meadow and mismatch counts might increase. Do not interpret artistic intent as ecological truth.

## Protected files and isolation
- The existing `env-p01.html`, `src/env-p01/`, `src/pop-01/`, `src/pop-02a/`, `src/terrain-material/`, terrain and water artifacts, canonical seeds and IDs are unchanged.
- Separate review entry: `env-r02a.html`, `src/env-r02a/{main,ground,ecotone}.ts`.
- Build with `npx vite build --config vite.env-r02a.config.ts`; use `npx vite --config vite.env-r02a.config.ts` to review.
- Baseline is OFF by default. To see candidate, choose **Faithful MAT-01** and activate **R02A authored forest-edge ground**. Neutral baseline remains unaffected.
- The original classification checksum remains as baseline. Variant has a versioned `rulesVersion`; `snapshot.ground.pilotAudit` reports changed nodes and transferred weight units. Both renderer and CPU query use the same active classification.

## Acceptance gates
- A/B/A canonical restoration byte-identical from matching WebGL camera and identical population descriptors, geometry, draw calls and tris.
- Candidate local edit, no changes outside 120×80m core radii, no change to sand/bedrock/wetness or canonical classifier.
- Check `forest-edge`, `forest-interior`, `forest-landscape` on actual WebGL output. Check aesthetic quality at walking height, elevated scale and across an outward ecotone view.
- Beware: a pure reduction in dark floor **can worsen tree-on-meadow ecology**. If forest trees now look disconnected or visual improvement is weak, **REJECT** instead of expanding the mask or changing POP.
- Hardware FPS and long corridor walk remain unverified.

## Evidence
GitHub Actions `ENV-R02A isolated visual pilot` stores three camera pairs and a JSON report. Original recovery workflow independently checks 558 preserved contents and current source validity. Neither CI result confers art approval. No merge, deploy or production adoption is authorized.
