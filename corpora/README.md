# Corpora Root

Raw and imported corpora inputs used for research, rule development, and benchmark generation.

Role in structure:
- `corpora/` = source inputs / raw corpora
- `data/benchmark/` = curated benchmark data assets
- `flow-db/` = canonical DB implementation and data-model runtime

Notes:
- Legacy duplicate DB starter code previously under `corpora/flow-db/` was archived to `docs/archive/corpora_flow_db_legacy_snapshot/` during the first safe DB migration block.
- `corpora/` should remain source-input oriented; it is not the canonical DB runtime code home.
