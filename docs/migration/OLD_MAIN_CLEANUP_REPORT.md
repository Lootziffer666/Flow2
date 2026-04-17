# OLD_MAIN Cleanup Report

## Scope
Safe automatable migration/cleanup of `old_main`, with special focus on `old_main/concepts/`.
No active package architecture refactor was performed.

## Actions taken

### 1) Files deleted from `old_main`
- Safe duplicates / migrated files:
  - `old_main/concepts/Logiktest.md`
  - `old_main/concepts/Testsatz_1_de.md`
  - `old_main/pipeline.js`
  - `old_main/test.js`
  - `old_main/tokenizer.js`
- Legacy safe-to-drop helpers/stubs:
  - `old_main/grammar.js`
  - `old_main/safeFixes.js`
  - `old_main/KLICK_MICH.bat`
  - `old_main/TEST_PIPELINE.bat`
  - `old_main/.gitignore`
  - `old_main/package-lock.json`
  - `old_main/node_modules/**`

### 2) Files archived

#### Archived text concepts
Moved to `docs/archive/old_main_concepts/`:
- `Das Stammprinzip bei der Korrektur von Auslautverhärtungen.md`
- `Herausforderungen der Orthografie_ Dyslexie im Englischen.md`
- `PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md`
- `Regeldatenbank für orthografische Normalisierung und Zielhypothesenbildung.md`
- `Links_Quellen_Flow_NEU.md`

Manifest: `docs/archive/old_main_concepts/ARCHIVE_MANIFEST.md`.

#### Archived binary artifacts
Moved to `docs/archive/old_main_binaries/`:
- `Systematische Matrix zur orthografischen Normalisierung in Korpora.docx`
- `Regeldatenbank zur orthografischen Normalisierung und Zielhypothesenerstellung.docx`
- `Linguistische Normalisierung und Orthografische Zielhypothesen.docx`
- `Orthografische Normalisierung und Ambiguitätsmatrix der Zielhypothese 1.docx`
- `Matrix der orthografischen Ersetzungsregeln zur linguistischen Normalisierung (1).xlsx`

Manifest: `docs/archive/old_main_binaries/ARCHIVE_MANIFEST.md`.

### 3) Files merged
- `old_main/concepts/Links_Quellen_Flow_NEU.md` vs `database/rules/Links_Quellen_NEU_DE.md` was compared.
- URL sets matched after normalization (escaped markdown characters handling).
- No missing links required merge into maintained file.
- Old file archived; maintained canonical file remains `database/rules/Links_Quellen_NEU_DE.md`.

### 4) Canonicality clarification added
- Added `database/rules/README.md` clarifying canonical relation:
  - `Aktuellstes_Regelwerk.md` = canonical baseline
  - `Erweitertes_Regelwerk.md` = extended/background
  - link-list docs = reference catalogs

## Files still requiring manual decision
Remaining in `old_main/` (intentional hold):
- `old_main/FLOW.ahk`
- `old_main/launcher.js`
- `old_main/normalizer.js`
- `old_main/package.json`
- `old_main/README.md`
- `old_main/tasks.md`
- `old_main/images.jpeg`

Reason: these require product/ownership judgment (historical integration path, provenance, or unresolved planning value).

## Migration-readiness recommendations

### Can `old_main/concepts/` now be deleted?
**Yes.**
- All concept files have either been deduped/deleted or archived.
- `old_main/concepts/` no longer contains active source content.

### Can full `old_main/` now be deleted?
**Not yet.**
- Remaining files still need explicit keep/archive/discard decisions.
- Especially `FLOW.ahk`, `launcher.js`, `normalizer.js`, and `tasks.md` should be dispositioned first.

## Rationale summary
- Mechanical, low-risk cleanup was automated.
- Historically valuable material was preserved via archive manifests.
- Canonical active paths outside `old_main` were kept untouched.
- Remaining risk is now concentrated into a small, explicit set of judgment-based files.

