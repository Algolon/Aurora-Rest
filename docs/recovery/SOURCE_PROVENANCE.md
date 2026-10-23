# RECOVERY-R02 source provenance

This preserves original source bytes, not the unavailable original POP Git history. All 558 files match the source snapshot manifest. Path-based classifications describe their role; they do not establish an unavailable author's commit.

## Independently retrievable references

- GEO: `90d0cb745e8e51a3dc737bd4dc11d6f8c322758b`, tree `4e78a70d6a8365666a28d54b6baf1b5e5928b45b`.
- MAT: `ae8a9c17781cdaa85c9e55696697c6213a860ef6`, tree `f3bedcb17a05b5d1474925cf73df4d66df5d8c96`.

Both were fetched from the canonical repository and independently checked through GitHub's Git commit API. All available remote branch tips were compared by path and blob; exact matching full revision IDs are recorded per file in SOURCE_MANIFEST.json. All 293 GEO anchor files exist unchanged in the snapshot; no anchor file was omitted. GEO is therefore a compatible conservative parent, selected under the explicit RECOVERY-R02 instruction rather than the generic default-branch rule.

## Classification

- Existing canonical GEO foundation: 293 files.
- Review/test/tool artifacts: 193 files.
- MAT-01 source integrated into ENV-P01: 22 files.
- ENV-P01 integration changes: 5 files.
- Original or inherited POP-01 / POP-02A source: 45 files.

Unknown role classification: 0. Independent original Git authorship remains unverified for snapshot-only files, including POP viewers/generation/integration source. A classification based on a report or import path is not independent proof of original ancestry. The per-file basis field distinguishes those cases from exact upstream matches. Package manifests and configuration are integration packaging; Vite configuration is the sole changed file relative to the GEO parent, with all other recovered files added.

## MAT and nature-library comparisons

All 22 entries in the original ENV provenance manifest match both pinned MAT Git blobs and SHA-256. All 23 source entries in the POP provenance manifest were compared with their independently retrievable pinned upstream revisions and original source paths. Of these, 22 match recovered bytes exactly; the grass batch adapter differs through the preserved, documented POP compatibility patch. Applying that exact patch to upstream reproduces recovered bytes. See UPSTREAM_COMPARISON.json for every hash, revision and path. No source adapter was newly implemented or changed during recovery.

The recovered POP protected-file hashes and deterministic/lifecycle tests remain available. Snapshot-only POP source is verified against original SOURCE.json, but full comparison against POP commit `4d562187c10e64884e2193a0b09ced6eed3b4b08` is blocked: GitHub Git commit API returns 404, no POP/ENV remote branch is advertised, and direct upload-pack fetch reports “not our ref”. Historical ENV `73fcfa7d237092f335c86f8afa024ee7ae1ddb49` is a reported former checkpoint, not restored ancestry. This recovery does not manufacture either original object or parentage.

## Preservation and translation

The original 228,018,528-byte ZIP and raw extraction were retained untouched outside the recovery checkout. Both outer and nested ZIPs pass CRC, duplicate-name, traversal and symlink checks. The nested archive has exactly the 558 expected files and no extras. The nine separately supplied ZIPs independently cover all 558 files with matching hashes; their checksums and inventories are in SPLIT_ARCHIVE_VERIFICATION.json. The intact original review ZIP is the canonical retained archive.

ARCHIVE_INVENTORY.json records original ZIP permissions and sizes. Outer files have regular-file 0644 mode; nested source files supply permission bits 0600 without file-type bits or executable flags. Reconstructed Git files are regular 100644, including scripts invoked through their interpreters. There are no symlinks or executable source entries to preserve. ZIP original permissions remain in the retained archive. This mode normalization is the only filesystem metadata translation.

Git LFS stores the intact ZIP and newly added review PNG/JPG/MP4 media. Their checkout bytes remain identical; Git trees contain LFS pointer blobs for these paths. Existing GEO evidence and canonical runtime binaries remain in their original ordinary Git representation. The manifest records original source blob IDs; media pointer IDs differ intentionally. No archive, dependency directory or build output is blindly added to ordinary Git history.

Original exclusions are node_modules, dist, unavailable .git metadata and generated/cache files not present in SOURCE.json. The original .gitignore is unchanged. No manifest-listed file is excluded from the recovery checkout. New additions are .gitattributes, recovery documentation/manifests/validation scripts/results, and the retained original ZIP under recovery-evidence/. Recovery validation outputs are separate from historical ENV evidence. Historical reports are retained verbatim and must be read as historical observations.

Two original whitespace findings are preserved intentionally: the compatibility patch and src/nature-library/grass/geometry.ts contain trailing whitespace. They are original snapshot bytes, not recovery edits. Newly authored recovery files pass whitespace validation.

Fresh-clone correction: four original validation .log files matched the unchanged *.log ignore rule during initial staging. RECOVERY explicitly tracks them, preserving all original bytes; final manifest verification now covers all 558 files from GitHub. No manifest-listed original file remains excluded.
