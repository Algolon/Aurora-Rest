# Aurora Rest — Project State (provisional)
Date: 2026-10-23. Source: checked GitHub branches and source reports, plus owner-provided handoffs.

**This is a preservation and cross-session handoff document, not approval to merge or deploy.** Maintained on an isolated docs-only branch based on main d543f66a85f120a182eebe56e2d24f5770f250fb.

## Vision and safeguards
Aurora Rest is a stylized, atmospheric Nordic island exploration world built with Three.js, TypeScript and Vite. Art direction: **Believable Nature, Sculpted for Wonder**. Protect the canonical GEO-R02B terrain, existing population identities, independently validated source branches and Feh-Lu-We. Technical Pass, Visual Candidate, Art Approval and Production Ready are distinct decisions.

## Verified GitHub checkpoints
| Milestone | Pinned source | Status / next action |
| --- | --- | --- |
| Main | d543f66a85f120a182eebe56e2d24f5770f250fb | Foundation only; not a combined production state |
| GEO-R02C-P0 | 90d0cb745e8e51a3dc737bd4dc11d6f8c322758b | Calibration base, geometry protected |
| GEO-R02C-A1D | 15c0977156edc2ded35f7440c84c46207177d06a | Art/design report; not canonical terrain |
| GEO-R02C-A1b-alpha | 154eb0706aee951d8ec3f3401f2c17b1940de468 | Experimental visible-face patch; owner art decision open / earlier alpha not accepted |
| MAT-01 | ae8a9c17781cdaa85c9e55696697c6213a860ef6 | GitHub CI success; architecture technically conditional; four materials art pending |
| WTR-01R | 90037110189f5a51d2f4fdad5790b84a05df36fd | Shader runtime repair and reference |
| WTR-01A | c4b60e8abede16b3ed30a739bde3561911b58d25 | GitHub CI success; calibrated C+Nordic water, art pending |
| Birch/Pine/Grass/Rock source families | Various isolated asset branches (see source index below) | Production integration independently validated in POP handoff, not newly merged |
| Experimental Blender hero rock S1 | 7ed1d43aa5e6577bba5238dfa53be645523c110f | Editable Blender/GLB and WebGL evidence; art conditional, not production asset |

## Handoff-only / source recovery critical
- POP-01 original: 4afbb6f9598a1611df53d0c9f61b6fd1845a3fc7; reported 42/42 tests, but original Git object ancestry not available from current GitHub branch list.
- POP-02A original: 4d562187c10e64884e2193a0b09ced6eed3b4b08; handoff reported 58/58 tests, real nature assets, deterministic ids and a software-WebGL render-page activation spike near 307.7 ms. Original feature branch and bundle were not available during 2026-10-23 verification.
- ENV-P01 original: no trustworthy final commit. Handoff reported 31 true WebGL frames, successful build, 289 successful hashes and 3 extra re-entry cycles, 74/74 tests before recovery and 73/74 after with only the original Git-object parity blocked. 170/738 trees on meadow-dominant ground; technical integration validated in tested scenes, visual candidate conditional, art pending.
- The ENV-P01 report says a complete source snapshot was written inside Aurora-Rest-ENV-P01-Review.zip. Its current durable availability is unverified. A handoff HTML is **not** the original source archive.

**Recovery gate:** locate/rearchive the surviving source snapshot; verify SHA-256 files and provenance (original POP vs ENV modified vs unknown); reconstitute on a new isolated recovery branch without inventing the original SHA or ancestry; rerun tests/browser checks; publish verified recoverable source and review evidence outside temporary Work links. No merge/deploy.

## MAT-01 facts and boundaries
MAT-01 uses a 4 m world-space material classification and shared CPU/GPU bilinear lookups (TerrainMaterialQuery). Materials: M01 Nordic Forest Floor, M02 Meadow Turf, M03 Coastal Sand, M04 Bedrock. Ecological intent masks are provisional. CPU/GPU parity, seams and resource lifecycle were checked. Approximate GPU texture memory high/balanced 41.2 MiB, mobile 10.3 MiB. Real Android GPU performance unmeasured. M01 appears dark at altitude; M02 detail may be busy; M03 edge soft; M04 close-up blurry. Do not start MAT-02 or rewrite ecologies before owner reviews combined ENV images. A separate low-risk material-cost study is safe on its own branch.

## WTR-01A facts and boundaries
C + Nordic Calibration reduces repetitive bright diagonal wave stripes in genuine WebGL comparisons, but Home Cove walking-height water composition, windward character and Medium/High value remain open. Water geometry unchanged. Do not start WTR-02 based on isolated shader evidence.

## Dependencies and next priority
1. **P0: ENV/POP source recovery and durable archive**, exact verification labels, isolated remote branch.
2. **P1: ENV-P01 owner art review**, with original 31 frames and 170/738 classification overlay; decide small M01/ecotone correction or undergrowth need.
3. **P2: POP-02B1** incremental render-page activation (only from recovered validated source) and **MAT-01P** independent fragment cost feasibility (from pinned MAT source). Both preserve existing asset/material appearance.
4. **P2 parallel non-code:** NATURE-REG-01 reference/design package, GEO-R02C sculptural feasibility studies, separate rock S1 owner art review.
5. **P3:** real Android/desktop profiling and restrained integration revisions after explicit owner decisions.
6. **Deferred:** MAT-02 material expansion; WTR-02 streams; final trails/biomes; broad integration/merge/deploy.

## Pinned evidence
- MAT report: https://github.com/Algolon/Aurora-Rest/blob/ae8a9c17781cdaa85c9e55696697c6213a860ef6/docs/mat-01/README.md
- MAT original WebGL gallery: https://github.com/Algolon/Aurora-Rest/blob/ae8a9c17781cdaa85c9e55696697c6213a860ef6/docs/mat-01/review.html
- MAT integration API: https://github.com/Algolon/Aurora-Rest/blob/ae8a9c17781cdaa85c9e55696697c6213a860ef6/docs/mat-01/INTEGRATION.md
- WTR-01A report: https://github.com/Algolon/Aurora-Rest/blob/c4b60e8abede16b3ed30a739bde3561911b58d25/docs/wtr-01/WTR-01A_VISUAL_CALIBRATION.md
- GEO-A1D report: https://github.com/Algolon/Aurora-Rest/blob/15c0977156edc2ded35f7440c84c46207177d06a/docs/geo-r02c-a1d/README.md
- S1 Blender rock report: https://github.com/Algolon/Aurora-Rest/blob/7ed1d43aa5e6577bba5238dfa53be645523c110f/asset-lab/birch/ASSET_01E2R_S1_BLENDER_SCULPT_REVIEW.md
- POP-01, POP-02A, ENV-P01 handoff HTML and the integrated walking contact sheet must be transferred as preserved evidence; they do not replace recovered source.

## Outstanding owner decisions / facts
- Is the complete ENV Review ZIP located, and which exact source recovery branch exists? Do not infer from a dead link.
- What part of POP Git ancestry can be truly verified?
- Which ENV material/ecotone changes are approved after real screenshot review?
- Are NATURE-REG-01 and GEO-R02C design outputs ready for adoption?
- Real device performance: not yet verified for integrated MAT/POP/WTR.

**Operational rule:** every new Work / Claude / ChatGPT session starts by reading this file and verifying live branch heads. This is a provisional snapshot, not a claim that all current source has been recovered.
