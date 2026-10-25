# AURORA REST — ROCK-R01H | Verified Specimen-Centric Source Acquisition Gate
**Date:** 26 October 2026 / Europe-Amsterdam (GitHub runner records UTC)
**Owner-approved artwork direction:** ROCK-REF-R01E **A — Nordic Weathered Corestone**; Myrstigen (short weathered fracture) + Kummakivi (continuous heavy asymmetrical mass).
**Protected source:** ROCK-R01G-B published review \`eb80cca2b3a04d77ec37ac93daa98c18ee4906cc\`.
**Research branch:** \`research/rock-r01h-specimen-scan-acquisition\`
**Technical provenance CI:** [Run 40243217496, SUCCESS](https://github.com/Algolon/Aurora-Rest/actions/runs/40243217496)
**Raw verified public metadata:** [GitHub Actions artifact 12617317830](https://github.com/Algolon/Aurora-Rest/actions/runs/40243217496/artifacts/12617317830)
**Disposition:** **REAL NAMED SCAN SOURCE IDENTIFIED — AUTHORIZED SOURCE DOWNLOAD BLOCKED BY LOGIN — NO MODEL BYTES ACQUIRED.**

## 1. BREAKTHROUGH — The actual chosen specimen Kummakivi exists as an accessible-listed/downloadable CC BY 3D model

**Primary source P0:**
- **Exact live model page:** https://sketchfab.com/3d-models/kummakivi-d8e3b15292df46f096faf488eeeb5ca0
- **Sketchfab official Data API model UID:** \`d8e3b15292df46f096faf488eeeb5ca0\`
- **Public uploader:** \`thesidekick\` / Lassi Kaukonen
- **Full title:** Kummakivi
- **Reported face count:** **1,001,255** triangles; ~one million is **original public model listing data**, NOT a demonstrated real-world scale or retopologized game mesh.
- **Official Data API says:** \`isDownloadable: true\`; license **CC Attribution**, license slug \`by\`, link http://creativecommons.org/licenses/by/4.0/.
- **Identity in public description:** famous named Kummakivi balancing rock in Ruokolahti, Finland; this genuinely matches the exact named specimen in R01C, unlike all earlier generic Poly Haven rocks.
- **CRUCIAL LIMITS:** Public metadata does NOT prove that the model is a photogrammetry-derived scan, complete 360° coverage, separable from the pedestal, free from holes, printable/watertight or artistically usable for variant A. Inspect real bytes before claiming any of these.
- **Rights:** CC BY allows reuse/adaptation with suitable author/model/source attribution; check any additional platform NoAI settings when proceeding with AI-assisted modification. Photo licenses and any other in-scene third-party works are separate.
- **This is NOT a model of Myrstigen and does NOT establish a Bohus-granite material property.** Kummakivi geology is mixed granite–cordierite–mica gneiss.

**What this confirms:** The specimen-led workflow can replace random-rock asset shopping; the preferred real morphological reference has an actual, identified authored 3D model that may be useful for a future game asset.

## 2. Other named and metadata-verified original source objects

The official PUBLIC Sketchfab Data API (\`/v3/search\` and \`/v3/models/{UID}\`) was queried through a reproducible Python CI. Source title, owner, UID, license, downloadability and triangle count were obtained. Do NOT confuse official public metadata with possessing/downloaded geometry.

| Rank | Specimen | Sketchfab source UID | Creator | Reported triangles | Rights and usability |
|---|---|---|---|---:|---|
| P0 | **Kummakivi**, Finland | \`d8e3b15292df46f096faf488eeeb5ca0\` | \`thesidekick\` | **1,001,255** | CC BY 4.0; downloadable=true; access blocked pending login |
| P1 | **Cloughmore Stone** (Northern Ireland) | \`9a74494d93024599ae1655d908f34c03\` | \`mcg3d\` / Conor Graham | **170,960** | CC BY; downloadable=true; natural granite, scale ~5×3.2×2.3m reported by publisher |
| P2 | **The Cumberland Stone** (Scotland) | \`07773239237e4edf87dbeeb0ed69b619\` | \`hugoandersonwhymark\` | **2,000,000** | CC BY; downloadable=true; photogrammetry, carved historic inscriptions |
| P3 | **Split Granite Boulder** (Tasmania) | \`31df74c9a9754dc0816dcc618f01659c\` | \`QCAGriffithU\` | **250,000** | CC BY; downloadable=true; non-Nordic natural split specimen |
| P4 | **Glacial Boulder in Cannock Chase** (England) | \`d68f2ebf97484d9990d6d36883f0da1e\` | \`chrisbibb\` | **421,383** | CC BY; downloadable=true; photo reconstruction with admitted artifacts, relocated onto plinth |

**Alternative P1 direct page:** https://sketchfab.com/3d-models/glacial-erratic-the-cloughmore-stone-rostrover-9a74494d93024599ae1655d908f34c03
**P2 direct page:** https://sketchfab.com/3d-models/the-cumberland-stone-culloden-moor-scotland-07773239237e4edf87dbeeb0ed69b619
**P3 direct page:** https://sketchfab.com/3d-models/split-granite-boulder-31df74c9a9754dc0816dcc618f01659c
**P4 direct page:** https://sketchfab.com/3d-models/glacial-boulder-in-cannock-chase-staffordshire-d68f2ebf97484d9990d6d36883f0da1e

**Excluded false positive:** another model also named "Kummakivi" \`69a7652806354e5cb78d298276f2708f\`, by dayvi: 75 faces, \`isDownloadable=false\`, no CC license in public record. It is a Blockbench reconstruction and must not be mistaken for the authentic specimen-based model.

## 3. Authorized acquisition analysis

**Official Sketchfab Download API:** https://sketchfab.com/developers/download-api/downloading-models
Sketchfab explicitly REQUIRES the downloading user to authenticate with a Sketchfab account. The \`GET https://api.sketchfab.com/v3/models/{UID}/download\` endpoint requires authorization (OAuth token). The downloadable glTF archive is accessed through an ephemeral URL granted only after authentication.

**Thus:** Model rights are VERIFIED (CC BY) and the model is publicly marked downloadable, but **unrestricted anonymous retrieval is not granted**. Github bot in this source-only research branch does not have the user OAuth authorization and cannot fetch permitted source bytes. We did NOT attempt to scrape embedded model tiles, reverse-engineer the Sketchfab viewer, retrieve protected model source from undocumented endpoints or impersonate a user's account. No file or preview has been falsely described as acquired.

**Owner action to unblock (one-time, free Sketchfab account/login where available):**
1. Open the direct [Kummakivi model page](https://sketchfab.com/3d-models/kummakivi-d8e3b15292df46f096faf488eeeb5ca0).
2. Log in / create a free account if requested, select **Download 3D Model**.
3. Choose the platform-provided **glTF ZIP** archive; preserve attribution.
4. Upload the unmodified archive to this ChatGPT project/conversation. If upload exceeds app limits, use the supported GitHub branch route by adding the archive as an isolated GitHub release asset or a file under a research-only path, and share the concrete artifact path.
**Do not paste tokens, credentials or temporary authenticated URLs in chat/GitHub.**

## 4. Prepared importer gate (no model pretending)

A source QA tool is now supplied in \`inspect_authorized_gltf.py\`. It accepts an **official unmodified glTF ZIP or GLB** after the authorized source is available. It:
- Checks archive structure, refuses directory traversal, excessive ZIP decompression and symlinks.
- Hashes the original bytes, records file manifests and actual source glTF JSON scene structures.
- Checks each geometry buffer exists and is sufficiently sized when metadata provides \`byteLength\`.
- Records actual primitive index accessors, positions/normals and reported source-space attribute min/max where present.
- Marks **watertightness, shape accuracy, known rock separation, WebGL art review** as *unverified* until real geometry rendering/mesh analysis.

**Next after actual source file:** use existing isolated Three.js GLTFLoader/GLB pipeline from R01G-B, staged neutral A2-compatible white vertex color copy, 7–8 genuine WebGL angles, owner A-sheet comparison, and **separate ART APPROVE** only if visually appropriate. A 1 million triangle source is not an automatically acceptable game runtime asset; any simplification requires a separate benchmark and documented process. No site model may be silently retitled original Aurora geometry.

## 5. What was executed and protected

- Created isolated research branch.
- Saved validated explicit acquisition/review instructions and strict no-rip policy.
- Ran GitHub Actions scan of FIVE real-world named specimens via the **official public Sketchfab API**, including actual Kummakivi.
- GitHub Actions green, official metadata retained as JSON and human-readable table in artifact.
- Prepared authorized source QA tooling for future legitimate downloaded model.
- **No source ZIP/GLB acquired**, no imported THREE mesh, **no WebGL claims for Kummakivi**, no new natural rock geometry and no modified G1/G01/G02/F01/world files.
- No Blender, merge or deployment.

## 6. Owner decision and hard stop

**Scientific/source gate: PASS** — authentic named specimen model verified, correct full model ID, creator, licensing and public downloadability.

**Acquisition gate: BLOCKED pending authenticated original ZIP supplied by user or properly connected licensed provider.**

**Geometry/visual art gate: NOT STARTED.**

Stop, preserve exact link. **Do not execute another generic asset search, invent a new GLB, or claim ROCK-R01H created Aurora Corestone A.** The only actionable next step is acquisition of the original authorized Kummakivi source and its first neutral Three.js form review.
