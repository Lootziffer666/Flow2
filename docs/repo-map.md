# Repository Map (DB/Data/Knowledge Focus)

## Canonical ownership

- `flow-db/` — canonical FLOW DB runtime + FLOW-owned DB data layer.
- `database/` — supporting/transitional docs + artifacts (non-canonical runtime).
- `corpora/` — raw/source corpora inputs.
- `data/benchmark/` — curated FLOW benchmark datasets.
- `docs/benchmark/` + `scripts/benchmark/` + `tests/benchmark/` — benchmark specs/tooling/tests (supporting infra).

## Product/runtime packages (current state)

- `packages/loom/` — LOOM runtime diagnostics/signals (contains Loom-owned language truth candidates to later externalize into future `loom-db`).
- `packages/flow/` — FLOW runtime repair logic (FLOW-specific behavior; some data-like resources still app-embedded).
- `packages/spin/` — SPIN runtime transformation/diagnostic package (no standalone `spin-db` yet).
- `packages/smash/` — SMASH runtime intervention package (no standalone `smash-db` yet).

## Archive and migration notes

- `docs/archive/corpora_flow_db_legacy_snapshot/` — archived legacy duplicate of former `corpora/flow-db/` starter bundle.
- `docs/migration/DB_LAYER_AUDIT.md` — current DB-layer classification baseline.
- `docs/migration/DB_LAYER_MIGRATION_PLAN.md` — staged migration strategy.
- `docs/migration/DB_FIRST_SAFE_MIGRATION_REPORT.md` — execution report for first safe migration block.
