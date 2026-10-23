# RECOVERY-R02 validation

2026-10-23, local macOS ARM64, Node.js 24.16.0 / npm 11.13.0.

| Check | Observed result |
| --- | --- |
| Original outer ZIP / nested ZIP CRC and safe paths | PASS |
| Original source manifest | PASS, 558/558 exact sizes and SHA-256; no missing/extra source files |
| Nine separately supplied ZIP parts | PASS, 558 unique files matching the same source manifest |
| GEO anchor | PASS, 293/293 original files retained byte-identically |
| MAT imports | PASS, 22/22 pinned Git blob and SHA-256 comparisons |
| Nature upstream | PASS, 22 exact files plus one exactly reproduced historical grass compatibility patch |
| npm ci | PASS, 28 packages installed from unchanged lockfile |
| npx tsc --noEmit | PASS |
| npm test | 73 PASS; one historical Git-object parity test BLOCKED (test process exits 1) |
| Production build | PASS; existing >500 kB chunk advisory |
| Production preview WebGL | PASS, actual Three.js canvas captures and no browser/network errors |
| Re-entry | PASS, three valley/forest cycles preserve full placement hash and GPU geometry/texture counters |
| Material toggles | PASS, neutral/weights/material preserve full placements and terrain geometry |
| Resource lifecycle | PASS, six balanced/mobile/high recreate operations, owner count 1; stable high-profile counters; teardown succeeds |

Browser: Chromium 151.0.7922.34 using ANGLE Vulkan SwiftShader. New ground-level forest and elevated forest/valley PNGs are genuine canvas readbacks from the built combined ENV viewer, distinct from preserved historical evidence. See validation/browser/result.json. This is software WebGL smoke evidence, not physical desktop/Android performance qualification or art approval.

The 74th test remains unchanged at tests/env-p01.test.ts. It compares original POP Git tree/blobs against recovered source. GitHub API 404 and upload-pack “not our ref” confirm its original object is unavailable. It is explicitly blocked, not a demonstrated source regression. Full suite and preserved CI therefore remain red until original history is supplied; no automatic pass substitution is introduced. Deterministic population, cross-chunk/worker behavior, protected sources, geometry and lifecycle assertions in the remaining original tests pass. See validation/tests.txt, typecheck.txt, build.txt and results.json.

Initial Chromium launch was denied by the execution sandbox; the same check succeeded with the required process permission. No source change was needed. The original preserved reentry tool was not run in-place because it overwrites historical resume-browser.json; tools/recovery/browser.mjs checks the same invariants plus material/profile operations and writes separate RECOVERY results.

Fresh GitHub checkout validation completed at `f93f0dd5e004355b90a96bc1098e0942c0556d99`; see FRESH_CLONE.json and validation/fresh/. The independent HTTPS clone uses no shared Git alternates or LFS storage. All 558 source files, the full LFS archive and nested snapshot verify. A separate npm ci, typecheck, production build and actual production WebGL/lifecycle checks pass. The unchanged suite returns the same 73 pass / one blocked Git-object test. The checkout remains clean. The first clone exposed four .log files excluded by the original ignore rule; explicit tracked additions corrected this without altering the original .gitignore or bytes. A separate direct media-URL curl returned HTTP 200 but was stopped after slow partial transfer; it is not counted as full archive validation. Full independent archive validation came from the clean clone GitHub LFS download.

Decision: **CONDITIONAL GO for further development from the recovered source**. Durable source recovery and independent GitHub retrieval are verified. Original POP/ENV ancestry remains unavailable, so full historical parity and green CI are not claimed. Existing page-activation stalls, final art acceptance and physical Android performance remain open. No merge, PR, deployment or release was performed or authorized. Subsequent audit-only commits add this validation record without changing any original snapshot bytes; the final branch HEAD must also be fetched and verified before handoff.

GitHub CI at source checkpoint: https://github.com/Algolon/Aurora-Rest/actions/runs/40004967778 — observed 73 passing tests and exactly the missing-original-POP tree failure. CI build step is not reached because npm test exits 1; local independent fresh-checkout typecheck/build both pass. No workflow or historical gate was weakened.
