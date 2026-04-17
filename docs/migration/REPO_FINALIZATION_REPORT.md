# Repository Finalization Report

Date: 2026-04-17

## 1) SPIN reclassification and rehome

`docs/research/spin/` was misclassified and has been split by actual content type.

### Reclassified destinations

- **Active SPIN concept/product docs** moved to:
  - `docs/product/spin/`
  - includes SPIN PDFs used as active product/concept framing.
- **Prototype + patch zip artifacts** moved to:
  - `docs/archive/spin_artifacts/`
  - includes non-canonical bundle artifacts (`*.zip`).
- **Research root cleanup**:
  - `docs/research/spin/` removed.
  - `docs/research/README.md` updated to reflect the new split.
- **Package cross-reference**:
  - `packages/spin/README.md` now points to both active docs and archived artifacts.

Result: SPIN material is no longer broadly mislabeled as pure research.

## 2) `database/` absorption into `flow-db/`

Canonical DB home remains `flow-db/`; additional DB-relevant clusters were absorbed.

### Moved into `flow-db/`

- `database/tools/*` -> `flow-db/tools/*`
- `database/tests/test_corpus_pipeline.py` -> `flow-db/tests/legacy_tools/test_corpus_pipeline.py`
- `database/datasets/*` -> `flow-db/datasets/*`

### Kept outside `flow-db/` and why

- `database/rules/`
  - Maintained human-readable rule/reference documentation; not runtime DB schema/migrations/importers.
- `database/artifacts/`
  - Generated/historical artifacts and reports retained for traceability.
- `database/debug/README.md`
  - Compatibility pointer documentation only.

`database/README.md` and `flow-db/README.md` were updated to describe this boundary explicitly.

## 3) Remaining `old_main` runtime artifacts removed

Removed remaining runtime leftovers:

- `old_main/FLOW.ahk`
- `old_main/launcher.js`
- `old_main/normalizer.js`
- `old_main/package.json`
- `old_main/node_modules/` (including residual lock metadata)

Non-runtime leftovers were archived to:

- `docs/archive/old_main_runtime_leftovers/`
  - `README.md` (historical)
  - `tasks.md`
  - `images.jpeg`
  - plus archive README documenting the classification.

`old_main/` directory now removed.

## 4) Remaining intentionally transitional material

The following remains intentionally transitional/supporting:

- `database/rules/` (reference/rationale docs)
- `database/artifacts/` (historical generated outputs)
- `database/debug/README.md` (compatibility pointer)

These are documented as non-canonical runtime DB sources; canonical DB runtime truth is under `flow-db/`.

## 5) Definition-of-done check

- SPIN material no longer mislabeled as pure research: **done**.
- Active SPIN docs and artifact bundles separated honestly: **done**.
- `database/` reduced further in favor of `flow-db/` where appropriate: **done**.
- Remaining `old_main` runtime leftovers removed: **done**.
- Finalization report exists at `docs/migration/REPO_FINALIZATION_REPORT.md`: **done**.
