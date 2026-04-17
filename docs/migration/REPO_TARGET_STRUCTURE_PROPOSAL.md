# Repo Target Structure Proposal

## Target principles
- Keep runtime/package truth in `packages/*`.
- Keep canonical DB system in `flow-db/`.
- Keep documentation in `docs/*`, data in `data/*`, raw corpora in `corpora/*`.
- Keep `database/rules` as rule documentation/reference area with explicit canonical hierarchy.
- Keep FLOW domain focus explicit: broadly usable, LRS/Dyslexia-prioritized.

## Proposed structure (high-level)

- `flow-db/` → canonical DB home (schema, migrations, ingest/export scripts, DB tests)
- `packages/loom/` → engine home (including migrated `lab/`)
- `packages/flow/` → FLOW product/app layer (no engine lab dumping ground)
- `packages/spin/` → active SPIN package truth
- `data/benchmark/` → benchmark data assets (JSONL etc.)
- `docs/benchmark/` → benchmark specs/schemas/scoring docs
- `docs/architecture/` → architecture and repo-structure docs
- `docs/product/` → product positioning/roadmaps
- `docs/research/` → research papers/background references
- `docs/archive/` → historical/legacy artifacts
- `corpora/` → raw corpus inputs
- `database/` → rules docs + transitional research/support assets (not canonical DB runtime)

## Explicit answers

### 1) What belongs in `/docs` and what does not
Belongs: architecture/product/research/migration/spec documents.
Does not belong: operational datasets and runtime artifacts.

### 2) What is the canonical main rule artifact
`database/rules/Aktuellstes_Regelwerk.md` is the canonical baseline rulework doc.

### 3) How `Erweitertes_Regelwerk.md` relates
`database/rules/Erweitertes_Regelwerk.md` is extension/supporting layer (background, matrices, long-form rationale), not competing canonical truth.

### 4) Where source/reference links belong
Maintain under `database/rules/Links_Quellen_NEU_DE.md` (and EN companion), referenced by `database/rules/README.md`.

### 5) Where benchmark assets belong
- data assets: `data/benchmark/`
- schema/spec/scoring docs: `docs/benchmark/`
- DB benchmark tooling/integration: `flow-db/benchmarks` and related DB scripts.

### 6) Where fixtures/examples belong
- executable tests: `packages/*/test`
- benchmark fixtures/examples: `data/benchmark/examples/` (or equivalent benchmark data subfolders)
- manual debug examples: benchmark/examples area, not generic `database/debug`.

### 7) How `packages/flow/lab` should move
Move to `packages/loom/lab` with import/reference updates in scripts/tests. Keep behavior unchanged.

### 8) What `docs/Spin` should become
Treat as research/legacy packs and move under `docs/research/spin/` (or archive subpath). Active SPIN truth remains in `packages/spin`.

### 9) How `flow-db` relates to `database`, `data/benchmark`, `corpora`
- `flow-db`: canonical DB implementation and lifecycle.
- `corpora`: raw source inputs.
- `data/benchmark`: benchmark data assets used for evaluation.
- `database`: supporting/transitional datasets, rule docs, and tooling not defining canonical DB runtime.

### 10) What becomes archive-only
- old_main historical artifacts already under `docs/archive/old_main_*`.
- legacy SPIN PDF/ZIP packs in docs after migration to research/archive buckets.

## Safe automatable steps enabled by this proposal
1. Move `packages/flow/lab` → `packages/loom/lab` and update refs.
2. Move `docs/Spin` → `docs/research/spin`.
3. Rehome `database/debug` to benchmark examples area with compatibility note.
4. Add boundary READMEs for `database/`, `corpora/`, and `data/benchmark/`.
5. Add/refresh docs index files under new docs categories.

