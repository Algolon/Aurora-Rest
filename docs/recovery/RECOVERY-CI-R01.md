# RECOVERY-CI-R01 — actionable current-source CI

Date: 2026-10-23. Protected starting checkpoint: `74eeffe7a5c7e010bd6bad23e296064fdeee67fa` on `recovery/env-p01-integrated-source`. Work branch: `fix/recovery-ci-r01`. No merge, deployment, runtime or visual change.

Recovered-byte equivalence and historical ancestry are separate claims. The 558 original file contents, archive and nested snapshot remain hash-verifiable. This does not recover POP commit `4d562187c10e64884e2193a0b09ced6eed3b4b08` or prove its Git ancestry. The historical comparison remains **BLOCKED** while that object is unavailable.

## Reproduce

Install Git LFS, retrieve the full LFS checkout, use Node 24 and run `npm ci --no-audit --no-fund` and `npx playwright install --with-deps chromium`.

```sh
# Current development entry point; includes mandatory historical audit reporting.
RECOVERY_CI_OUTPUT=/tmp/aurora-rest-ci node tools/recovery/current-ci.mjs

# Separately execute the unchanged original historical assertion.
RECOVERY_CI_OUTPUT=/tmp/aurora-rest-audit node tools/recovery/historical-audit.mjs

# Independently verify all retained original contents and both ZIP layers.
python3 tools/recovery/verify-source.py
```

The historical command exits **2 for BLOCKED**, 1 for unexpected failure and 0 only for a successful original Git-object comparison. It always executes the original assertion; the missing-object preflight is not a substitute pass. A restored Git object is compared normally, and byte mismatches fail. Fetch original history from an independently verified canonical source if it becomes available; never fabricate the object.

The current-source command checks source/archive integrity, all 73 currently verifiable original tests, explicit typecheck, production build, actual ENV WebGL, three forest/valley re-entry cycles, material switches, six profile resource recreations and teardown. Any current-source failure fails CI. Unexpected historical audit failures also fail CI. Only the specifically identified unavailable-object condition is reported as BLOCKED independently of current-source success.

`provenance.json`, `provenance.md`, original historical test output and individual check logs are written every run. GitHub Actions publishes the summary and uploads evidence including actual canvas PNGs and browser results. The historical status is mandatory in the same report as the current-source result; a current-source PASS is never a claim of historical parity. Missing audit execution, malformed partition boundaries or changed original ENV test bytes fail the runner. Artifact upload fails if evidence is absent.

## Preservation details

`tests/env-p01.test.ts`, `package.json`, source manifests, protected baseline manifests and every runtime/source asset remain unchanged. The original historical assertion stays verbatim in the original ENV file. `test-partition.mjs` verifies that file's original SHA-256, extracts exactly that assertion into a temporary historical test, and executes the remaining three ENV tests alongside all other original tests. No test is marked skipped. Temporary files are cleaned up.

The sole original file relocated is `.github/workflows/checks.yml`: its exact original bytes are retained at `docs/recovery/original/checks.yml`, with its original hash still checked by `verify-source.py` against the unmodified manifest and nested ZIP. A new active workflow occupies its former path. Thus **557 original paths are unchanged and all 558 original file contents are retained unchanged**. Both the original package command and workflow remain available as historical evidence. `npm test` still invokes the unmodified original suite, intended for the original layout/history; use the documented current-source entry point for development.

Some original integrity assertions cover the old workflow. To preserve these assertions without weakening their baselines, the test runner builds a temporary view: original test files are copied unchanged, all source/data directories point to the live checkout, and the preserved workflow is supplied at its original path. The active workflow is exercised separately by GitHub Actions. No runtime file or original baseline hash is substituted. The verifier's only path translation is explicit and fixed to that one workflow.

Earlier RECOVERY-R02 documents and validation outputs describe the historical checkpoint; their statements about red CI remain accurate for that checkpoint. This document supersedes those operational instructions for development on this branch. All previous ancestry, renderer stall, art and physical-device limitations remain open. Software WebGL smoke evidence does not establish Android performance or art acceptance.

## Observed validation

The untouched starting checkpoint reproduced 74 tests: 73 pass, one fail, zero skips. The sole failure was the original historical ENV comparison: `git ls-tree` exited 128 with `fatal: not a tree object`; `git cat-file -e` also confirmed the POP object was unavailable. Baseline output is retained with the CI-R01 evidence. Final validation results and remote commit are recorded in the handoff and CI artifacts.

Local final result: **current source PASS / historical audit BLOCKED**. All 558 retained original contents and both archive layers verify. The functional partition passes 73/73 with zero skips, typecheck and production build pass. Chromium 151.0.7922.34 / ANGLE Vulkan SwiftShader passes all four browser invariants, three re-entry cycles and six profile recreations with zero errors; the final high profile retains 25 geometries and 13 textures. Ground-level and elevated canvas captures and complete machine-readable results are in `validation/ci-r01/`. The captured head is the protected starting checkpoint plus the CI-R01 working changes committed together with this evidence. Coverage guards were separately rerun after addition: 73/73 with zero skips; the standalone historical audit returns BLOCKED / exit 2.
