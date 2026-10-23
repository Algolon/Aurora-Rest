# AURORA REST — GEO-R02C-A1b Player-Visible Summit and Face Study (implementation prompt, NOT executed)

> **Status, 23 Oct 2026:** kept as written for review. A1b-α was later approved as one limited experiment on the A2 south-west face, on its own branch. **B-β and R-A are not approved**, so the B-β section below is void.

Project: Aurora Rest · Repository: `Algolon/Aurora-Rest` · Art direction: *Believable Nature, Sculpted for Wonder.*

## Context you must read first

- A1a overlay platform and its rejected variants: branch `feature/geo-r02c-a1a-form-study` @ `80553e2d5af88fa16ea5ef3db6b0adcbd4b529c3` (`docs/geo-r02c-a1a/README.md`, `review.html`). The variants V1–V3 are immutable evidence; do not modify or delete them.
- A1b-D redesign dossier: visibility and protection maps, matched failure captures, concept sections, decisions. It is not committed yet; commit it as `docs/geo-r02c-a1b-d/` on the A1b branch as the first commit (scripts read the A1a checkpoint read-only; set `A1A_ROOT` to the repository root).
- Key measured facts this experiment answers to:
  - V1–V3 changed **0.00 %** of pixels in the Birchwood, Central Valley shoulder, west-arm and route captures; V1 moved the North Peak skyline by **≤ 0.43 px** from every approach.
  - Far skylines are **62–82 % R1 crest band** (lower bound, raise-only); route skylines are **30–69 % trail corridor**.
  - **69–75 %** of the massif cells visible from the far approaches are editable in A1a, and V1 touched **none** of them: the face gate (≥ 75 % free) rejected the A2 south-west (69 %) and A3 south (70 %) faces, and the operator only sculpted north/east faces.

## Git

1. Verify `git remote -v` = `https://github.com/Algolon/Aurora-Rest`, a clean worktree, and that `origin/feature/geo-r02c-a1a-form-study` = `80553e2…`.
2. Create `feature/geo-r02c-a1b-visible-summit` from `80553e2` in a separate worktree. **This needs a one-time AGENTS.md exception (branch not based on `main`), which must be granted explicitly before you start.**
3. Do not change the R1, P0, A1-D or A1a branches. Do not modify `docs/geo-r02b/design-master-A-R1-v1.json`, the R1 generator or binaries, or any existing test. Do not merge, deploy or push without further authorization.

## Scope: two variants only (family A, player-visible summit and faces)

Start from M0 (= canonical R1, `fc8fd6da…`), not from V1. Re-prove empty-overlay parity first; if M0 ≠ R1 byte for byte, STOP.

**B-α — visible face relief, current protections (no new release).**
- Target cells = A1a-editable (M > 0) cells within 700 m of the summit that are visible (terrain-only line of sight, eye 1.75 m) from Birchwood, the Central Valley shoulder, the Central Valley floor or the peak-ascent route points s = 1300–2750 m. Reuse `docs/geo-r02c-a1b-d/scripts/visibility.py` to build this target mask deterministically.
- Faces: A2 south-west, A3 south (below the corridor), summit south face below the corridor. Face gate 0.75 → 0.60 for these targeted faces only; record the change.
- Operator: cut-only couloir / buttress rhythm across each face. Couloirs 60–90 m wide, 9–16 m deep, uneven spacing (about 55–80 m), oriented down the fall line and fading out 40 m before the crest band and before the valley floor. Buttresses stay at R1. Walls ≤ 45°. No noise.
- Expected: skyline unchanged (0 px); in-face relief visible from the approaches.

**B-β — B-α plus the summit block (only if release R-A is granted in writing).**
- Peak-ascent corridor within 450 m of the summit and above 780 m: ±75 m (+60 m fade) → ±20 m (+20 m smoothstep fade). Everywhere else the corridor is unchanged.
- Flanks outside ±20 m cut towards 40° (≤ 25 m), crest-band cells never lowered and blended over 20 m, fading out by 190 m from the trail (see `csec-summit-block`).
- Passability gate (fail = STOP): route centreline Δ = 0 m everywhere; grade unchanged; tread cross-slope within ±3 m unchanged (≤ 0.01 change); `walkRouteForTest('peak-ascent')` reaches the end with `blockedAt = -1`.

If R-A is not granted, deliver M0 and B-α only.

## Validation per variant (A1a suite, unchanged and not weakened)

Protected classes unchanged (except the R-A corridor change in B-β, reported cell by cell); outside the window byte-identical; crest ≥ bound; wet cells, lakes, beds and water surfaces unchanged; land/sea and coast 0–150 m unchanged; zero new dry sinks; zero D8 drainage-destination changes; route centrelines Δ = 0; determinism (two runs, identical SHA-256); `npm test` and `npm run build` pass; default viewer path pixel-identical (8/8 R1 views).

## Evidence (metrics are supplemental)

- Real Three.js captures, clay sun A/B and standard, for M0 / B-α / B-β: all 16 A1a cameras plus 4 new walk cameras on the peak-ascent route at s = 2300, 2500, 2650 and 2800 m, each looking at the summit block and at the A2 south-west face.
- For every view: pixel change against M0 (|Δ| > 12 after a 3 × 3 median, as in `pixel_diff.py`). Visibility gate: B-α must change ≥ 1 % of frame pixels in at least two of Birchwood, Central Valley shoulder, approach-upper and the new route cameras; otherwise report "not visible" and STOP before any further tuning.
- Matched sections: `csec-a2-face`, `csec-summit-block` re-measured on the generated terrain, with the concept targets dashed.
- Review page comparing M0 / B-α / B-β side by side, with the A1a V1 captures as the "before" reference.

## Stop conditions

Parity fails; frozen terrain changes outside the declared release; a new sink; any bed, lake or water-surface change; a drainage-destination change; the passability gate fails; a design-master edit becomes necessary; only noise or masking would make it acceptable; the visibility gate fails. Preserve a diagnostic checkpoint and report; do not force acceptance.

## Out of scope

C1-R, any cirque, G1′/G2, crest raises, A2 route, Cairn col, coast, vegetation and assets, deployment.

STOP after presenting M0 / B-α / (B-β) for independent artistic and technical review.
