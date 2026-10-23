# RECOVERY-R02 — ENV-P01 durable source recovery

Date: 2026-10-23. Repository: https://github.com/Algolon/Aurora-Rest.

Recovery branch: https://github.com/Algolon/Aurora-Rest/tree/recovery/env-p01-integrated-source.

This is a new recovery lineage anchored at verified GEO `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`. It contains the complete verified ENV snapshot, original tests/tools/provenance and evidence. It does not restore the original POP or historical ENV commit ancestry. No runtime source changes, merge, PR, release or deployment are part of RECOVERY-R02.

## Archive

Retained file: `recovery-evidence/Aurora-Rest-ENV-P01-Review.zip`, stored separately through Git LFS in the same repository.

Download: https://media.githubusercontent.com/media/Algolon/Aurora-Rest/recovery/env-p01-integrated-source/recovery-evidence/Aurora-Rest-ENV-P01-Review.zip

Size: **228018528 bytes**. SHA-256: **766c125658e27f6e3ecd5d1ecacd627e56a54cd6047d8798a9ec1c61ba89f32f**.

Nested source ZIP SHA-256: **4b1d1c1008626f22352fca876f132715890fb6c6def37f7409616f520f354878**.

For an immutable download, replace the branch component of the media URL with the exact recovery commit SHA from `git rev-parse HEAD`. The archive is a retained repository LFS object, not an expiring Actions artifact or a release. Retrieval requires Git LFS availability; a plain Git pointer or GitHub source ZIP alone is insufficient. The original ZIP contains the entire raw source and original 31 WebGL captures, review material and pre/post-resume records.

## Independent recovery procedure

Prerequisites: Git, Git LFS, Node.js 24 (validation used 24.16.0), npm and Python 3. Install Git LFS through its official distribution before cloning. Browser checks require Playwright Chromium or an explicit CHROME executable; install it with `npx playwright install chromium` after npm ci if needed.

```sh
git lfs install
git clone --single-branch --branch recovery/env-p01-integrated-source https://github.com/Algolon/Aurora-Rest.git Aurora-Rest-Recovery
cd Aurora-Rest-Recovery
git rev-parse HEAD
git lfs pull
git lfs fsck
python3 tools/recovery/verify-source.py
npm ci --no-audit --no-fund
npx tsc --noEmit
npm test
npm run build
node tools/recovery/browser.mjs
```

`npm test` deliberately exits 1 while the original POP Git-object gate is blocked: 73 pass, one historical parity comparison cannot run. Do not delete, skip, weaken or fabricate the missing Git object to make it green. Other failures require investigation. Browser output goes to docs/recovery/validation/browser unless RECOVERY_OUTPUT is set; direct fresh verification outputs outside the checkout to retain a clean tree.

To recover the exact original review workspace, extract the retained outer ZIP, verify its nested source ZIP hash, then extract the nested ZIP into a separate directory. SOURCE.json in the outer ZIP lists all 558 original paths/hashes. The verification script independently compares each checkout byte and each nested archive byte to that manifest. No Work chat, original temporary directory, dependency symlink or vanished Git common directory is required.

See SOURCE_PROVENANCE.md, SOURCE_MANIFEST.json and VALIDATION.md for limits and evidence. Continued development is conditional on acknowledging missing historical Git ancestry, existing renderer stalls and pending art/device acceptance. These limitations do not imply a source-code regression.
