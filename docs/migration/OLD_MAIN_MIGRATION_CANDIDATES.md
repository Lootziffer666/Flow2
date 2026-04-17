# OLD_MAIN Migration Candidates (Non-trivial / Non-safe-drop)

This file lists only `old_main` content that is **not clearly safe to drop**.
No moves are performed here.

## Destination: `docs/archive`
- `old_main/README.md` (historical product framing)
- `old_main/FLOW.ahk` (historical desktop integration)
- `old_main/concepts/Systematische Matrix zur orthografischen Normalisierung in Korpora.docx`
- `old_main/concepts/Regeldatenbank zur orthografischen Normalisierung und Zielhypothesenerstellung.docx`
- `old_main/concepts/Linguistische Normalisierung und Orthografische Zielhypothesen.docx`
- `old_main/concepts/Orthografische Normalisierung und Ambiguitätsmatrix der Zielhypothese 1.docx`
- `old_main/concepts/Matrix der orthografischen Ersetzungsregeln zur linguistischen Normalisierung (1).xlsx`
- `old_main/concepts/Herausforderungen der Orthografie_ Dyslexie im Englischen.md`
- `old_main/concepts/Das Stammprinzip bei der Korrektur von Auslautverhärtungen.md`

## Destination: `docs/architecture`
- `old_main/concepts/PRD_ Orthografische Normalisierung bei LRS – Status Phase 0.md`
  - Action: extract still-valid design decisions into current architecture docs.
- `old_main/tasks.md`
  - Action: convert unresolved items into explicit migration/deprecation checklist.

## Destination: `scripts` (only if explicitly needed)
- `old_main/launcher.js`
  - Current status: legacy file-based wrapper; no evidence it is active.
  - Action: keep as archived reference unless a maintained file-IO bridge is required.

## Destination: `packages/flow` (reference-only, no direct copy)
- `old_main/normalizer.js`
  - Current status: logic mostly decomposed across `packages/flow/src/rules.*` and engine layers.
  - Action: use only as historical rule provenance; do not reintroduce monolith.

## Discard after archival review (candidate)
- `old_main/images.jpeg` (unknown provenance)
- windows wrappers: `old_main/KLICK_MICH.bat`, `old_main/TEST_PIPELINE.bat`
  - only after `FLOW.ahk` archival decision is finalized.

