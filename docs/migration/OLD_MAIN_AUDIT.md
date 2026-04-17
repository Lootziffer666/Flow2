# OLD_MAIN Audit (Migration-Readiness)

## Executive verdict
`old_main/` is **mixed legacy residue**: core runtime logic is largely migrated into monorepo packages, but several concept artifacts and legacy launch wrappers remain unique and require explicit archival/review decisions before deletion.

**Deletion readiness:** **not yet**.

## What `old_main/` appears to be historically
- An early standalone FLOW prototype with:
  - a compact deterministic normalizer (`normalizer.js`) and tiny wrapper pipeline,
  - local launcher tooling (`launcher.js`, AHK/BAT wrappers),
  - concept/PRD source material (Markdown + DOCX/XLSX),
  - an embedded `node_modules/` snapshot.
- It predates the current workspace split (`packages/flow`, `packages/loom`, `packages/shared`) and benchmark/database structure.

## Active truth vs legacy
- **Active truth now:** monorepo packages and tests (`packages/flow/**`, `packages/shared/**`, `packages/loom/**`, `scripts/**`, `database/**`).
- **Legacy residue:** `old_main` launcher wrappers, bundled deps, and historical planning/concept docs.
- **Mixed area:** concept Markdown where parts were copied into `database/rules/**`, but some documents only exist in `old_main/concepts/` (especially binary docs).

## Verified transfer findings (hard evidence)
1. `old_main/concepts/Logiktest.md` is byte-identical to `database/debug/Logiktest.md`.
2. `old_main/concepts/Testsatz_1_de.md` is byte-identical to `database/debug/Testsatz_1_de.md`.
3. `old_main/concepts/Regeldatenbank für orthografische Normalisierung und Zielhypothesenbildung.md` content appears transferred (semantically and text-heavy) to `database/rules/Erweitertes_Regelwerk.md`.
4. Rule examples from `old_main/normalizer.js` are represented in current FLOW rule/test files (`packages/flow/src/rules.sn.js`, `packages/flow/test/test_normalization.js`, etc.).

## Top deletion risks
1. **Unique concept binaries** (`.docx`, `.xlsx`) in `old_main/concepts/` have no verified current equivalents.
2. `old_main/concepts/PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md` may contain planning context not captured elsewhere.
3. `old_main/tasks.md` may contain unresolved migration intentions.
4. Legacy launcher flow (`FLOW.ahk` + `launcher.js` + BAT files) documents a historical integration path that may still matter for some users.
5. `old_main/concepts/Links_Quellen_Flow_NEU.md` is not byte-identical to `database/rules/Links_Quellen_NEU_DE.md`; dedupe decision is not yet explicit.

## Top safe-drop candidates (after verification)
1. `old_main/node_modules/**` (vendored deps snapshot)
2. `old_main/package-lock.json`
3. `old_main/.gitignore` (local artifact ignore)
4. Windows convenience wrappers (`KLICK_MICH.bat`, `TEST_PIPELINE.bat`) if AHK path is intentionally retired
5. `images.jpeg` if confirmed unused as documentation asset

## Top migration candidates
1. `old_main/concepts/*.docx` and `*.xlsx` -> archive bucket (`docs/archive/old_main_concepts/`) with explicit index.
2. `old_main/tasks.md` -> reviewed extraction into `docs/migration/` decision log.
3. `old_main/README.md` -> archive-only (historical, not canonical architecture).
4. `old_main/FLOW.ahk` -> archive with deprecation note if no maintained desktop hotkey path exists.

## What must happen before `old_main/` deletion is safe
1. Create and approve an **archive decision** for all unique concept binaries (keep/discard with owner sign-off).
2. Explicitly mark launcher stack (`FLOW.ahk`, BAT wrappers, `launcher.js`) as deprecated or preserve as archived integration recipe.
3. Record disposition for `tasks.md` and PRD/concept Markdown that is not clearly migrated.
4. Remove `old_main/node_modules/**` from consideration as code truth source (explicitly generated/vendor residue).
5. Run one final path-owner review against `OLD_MAIN_FILE_MATRIX.md` classifications.

