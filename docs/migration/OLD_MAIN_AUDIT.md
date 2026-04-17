# OLD_MAIN Audit (Migration-Readiness)

## Executive verdict
`old_main/` is **mixed legacy residue**. Safe mechanical cleanup is now largely complete for `old_main/concepts/` and legacy helper residue, but a small set of runtime/launcher/history files still requires explicit disposition decisions.

**Deletion readiness:** **not yet** (for full `old_main/`), while `old_main/concepts/` is now migration-cleaned.

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
- **Mixed area:** concept material has been moved to `docs/archive/**`; some archived artifacts still require manual keep/discard review.

## Verified transfer findings (hard evidence)
1. `old_main/concepts/Logiktest.md` was byte-identical to `data/benchmark/examples/manual_debug/Logiktest.md` and has been removed from `old_main`.
2. `old_main/concepts/Testsatz_1_de.md` was byte-identical to `data/benchmark/examples/manual_debug/Testsatz_1_de.md` and has been removed from `old_main`.
3. `old_main/concepts/Regeldatenbank für orthografische Normalisierung und Zielhypothesenbildung.md` content appears transferred (semantically and text-heavy) to `database/rules/Erweitertes_Regelwerk.md`; old copy is archived.
4. Rule examples from `old_main/normalizer.js` are represented in current FLOW rule/test files (`packages/flow/src/rules.sn.js`, `packages/flow/test/test_normalization.js`, etc.).

## Top deletion risks
1. **Archived concept binaries** (`docs/archive/old_main_binaries/*.docx|*.xlsx`) have no verified current equivalents.
2. `old_main/concepts/PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md` may contain planning context not captured elsewhere.
3. `old_main/tasks.md` may contain unresolved migration intentions.
4. Legacy launcher flow (`FLOW.ahk` + `launcher.js` + BAT files) documents a historical integration path that may still matter for some users.
5. Remaining `old_main` runtime/history files (`FLOW.ahk`, `launcher.js`, `normalizer.js`, `tasks.md`) still need explicit ownership decisions.

## Top safe-drop candidates (after verification)
1. `old_main/node_modules/**` (vendored deps snapshot)
2. `old_main/package-lock.json`
3. `old_main/.gitignore` (local artifact ignore)
4. Windows convenience wrappers (`KLICK_MICH.bat`, `TEST_PIPELINE.bat`) if AHK path is intentionally retired
5. `images.jpeg` if confirmed unused as documentation asset

## Top migration candidates
1. Archived binaries in `docs/archive/old_main_binaries/` need keep/discard owner decisions.
2. `old_main/tasks.md` -> reviewed extraction into `docs/migration/` decision log.
3. `old_main/README.md` -> archive-only (historical, not canonical architecture).
4. `old_main/FLOW.ahk` -> archive with deprecation note if no maintained desktop hotkey path exists.

## What must happen before `old_main/` deletion is safe
1. Create and approve an **archive decision** for all unique concept binaries (keep/discard with owner sign-off).
2. Explicitly mark launcher stack (`FLOW.ahk`, BAT wrappers, `launcher.js`) as deprecated or preserve as archived integration recipe.
3. Record disposition for `tasks.md` and PRD/concept Markdown that is not clearly migrated.
4. Remove `old_main/node_modules/**` from consideration as code truth source (explicitly generated/vendor residue).
5. Run one final path-owner review against `OLD_MAIN_FILE_MATRIX.md` classifications.
