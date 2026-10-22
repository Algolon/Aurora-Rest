# GEO-R02B-R1 — remaining issues and review decisions

No issue in this file is treated as accepted merely because software tests pass. Source master and original checkpoint are preserved.

## 1. Walking width / natural cross-slope

All six candidate centrelines are dry and meet their authored 25–30% longitudinal limits. The additional 3.4 m band / ≤35% transverse-slope diagnostic does not pass everywhere. It is a conservative trail-feasibility probe, not a claim that a 110–160 m geographic reservation must be level. Full one-metre positions are in route-profiles-full.csv and representative positions below; purple browser markers show them.

|Route|Samples failing band/transverse probe|Example east / north m|Cross-grade at example|
|---|---|---|---|
|hero|12.8%|[683.0769, -1163.6923]|37.4%|
|tarn-ascent|24.2%|[373.7931, 988.6897]|35.0%|
|peak-ascent|51.1%|[-568.0, 2104.0]|35.8%|
|hidden-loop|25.4%|[1444.0, -564.0]|35.0%|
|west-cape-spur|0.6%|[-478.3448, -209.1034]|21.0%|
|south-shoulder-loop|15.9%|[-1416.0, -2456.0]|35.6%|

Proposed corrections for review: local trail ledges on Hero and Hidden Fold, contour alternatives for Tarn ascent, a separately authored summit traverse for Peak ascent, a short bank-side relocation on West Cape and contour-bench options on South Shoulder. Keep destinations and major landforms. Do not flatten a mountain or regard these planner polylines as finished trails. Expanded reservations are measured in route-candidates.json and need visual approval.

## 2. Actual raster-water elevations

Authored profiles descend, all 13 channels belong to connected submerged geometry, and the four lake interiors are planar at their approved levels. The actual raster water surface has the following small rises between authored path samples:

|Channel|Start east / north m|Rise|Actual water elevation pair|
|---|---|---|---|
|main-upper|589.08 / -766.89|0.02703 m|14.01208 → 14.03911 m|
|south-fen-tributary|699.65 / -1493.57|0.00118 m|6.63866 → 6.63984 m|

The geometric shoreline clip eliminates terrain piercing its water surface, but does not establish perfect hydraulic gradients. Proposed correction: use a junction-aware continuous channel parameterization / conforming water mesh at finer local resolution. Recheck all bank intersections if this changes; do not just lower isolated water vertices. The maximum source-profile deviation reaches about 1.06 m at a steep Tarn inlet transition because the surface is resampled to 4 m triangles. Lake levels remain exact. No fluid, flood or erosion simulation is claimed.

The old 59 low-bank flags are explicitly classified in water-integrity.json: 51 ocean-side normal probes, six overlapping tributary sections, one lower projected water reference, and one actual wet section outside the nominal bank probe. The last lies at the Windward gully mouth, x=-1608.245 / z=1658.948 m (terrain 1.047 m, actual water 1.159 m). Review its rocky chute / wetted width rather than automatically raising a bank.

## 3. Coast and source conflict

Coast median / P95 normal offsets are about 0.52 / 1.67 m. Fourteen exceptions exceed 4 m or lack a zero crossing inside the 16 m normal probe; coordinates are in integrity.json, concentrated at the four river mouths. Review their rocky chute / estuary notches and water interfaces. Do not replace the rocky coast with uniform smoothing.

The South low-tail endpoint (x=450, z=-3440 m) proposes +8 m outside the approved coast and measures below sea level. This is an input-design conflict. Proposed correction: move the final crest point inland or terminate it on the coast in an independently versioned design correction. Original A-R1 is not edited.

## 4. Geomorphology and visual quality

The repeating large valley walls and raised river-support dams are reduced, and Cairn's constraints now connect to its western side valley. However, actual browser views still show overly smooth mountain flanks, engineered-looking inlet shoulders, weak secondary buttresses/gullies and small local constraint/tessellation marks. High Tarn's inlet still reads as a ribbon in places; Home Cove and Mirelands remain visually flat. These are visible terrain defects and are not art-approved.

Next correction proposal: author coherent secondary valley and spur constraints around North Peak / Tarn and South Shoulder, then solve the same shared field and repeat the matched ground views. Review the panoramic composition before adding any noise or nature assets. Watershed mask fidelity also remains incomplete: parts of the western catchment masks drain directly to coast rather than their named lakes. Treat the old catchment boundaries as authored intent until regenerated divide lines are reviewed against the field.

## 5. Acceptance boundary

The original seven depressions are removed, including the smaller 0.68 m western pass artifact discovered during R1. Both tested thresholds report zero dry sinks at 4, 8 and 20 m. This is bounded geometric evidence, not a guarantee against every sub-grid hollow.

Technical source, deterministic regeneration, tests and build are checkpointed. Performance uses software WebGL; no physical Android validation or final optimization is claimed. Stop at visual and technical review of GEO-R02B-R1. Do not start population, merge, deploy or GEO-R02C.
