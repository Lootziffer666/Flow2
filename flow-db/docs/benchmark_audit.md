# FLOW Benchmark Infrastructure — Audit & Implementation Note

## What existed before this work

| Component | Status | Location |
|---|---|---|
| `error_cases` table (24 cols) | Operational | `schema.sql` |
| `benchmark_collections` + `benchmark_subsets` | Operational, thin | `schema.sql` |
| `v_benchmark_error_cases` view | Operational | `schema.sql` |
| Review/quality gate (`review_status` + `gold_score`) | Operational | `schema.sql` |
| 4 seeded error_cases (EN + DE) | Present | `seed.sql` |
| Importers: lexicon, error_pairs, context, german_annotations | Operational | `src/importers/` |
| Lab state with benchmark evaluation | Separate JS system | `packages/flow/lab/labState.js` |

**What was NOT present:**

- No per-case classification into benchmark families (FLOW_CORE / FLOW_HELL)
- No `gold_type` field (auto_repair / abstain / no_touch / suggestion_only)
- No risk flags (circularity_risk, idempotence_risk, downstream_poison_risk)
- No FLOW_HELL taxonomy or bucket definitions
- No ingestion workflow to promote error_cases to benchmark candidates
- No curation CLI
- No export commands for benchmark-ready output
- No migration infrastructure

## What was added

### Migration: `migrations/001_benchmark_items.sql`

New `benchmark_items` table linking `error_cases` to benchmark classification:

- `benchmark_family`: FLOW_CORE or FLOW_HELL
- `bucket`: taxonomy category label
- `gold_type`: auto_repair / suggestion_only / abstain / no_touch
- `ambiguity_level`: 0–3
- `circularity_risk`, `idempotence_risk`, `downstream_poison_risk`, `duplicate_risk`: 0/1 flags
- `why_hard`, `naive_failure_mode`: diagnostic text for FLOW_HELL
- `review_status`: candidate → approved / rejected / needs_review
- `curated_by`, `curated_at`: curation provenance

Three new views:
- `v_flow_core`: approved FLOW_CORE items with provenance join
- `v_flow_hell`: approved FLOW_HELL items with provenance join
- `v_benchmark_curation_queue`: items pending review

### Taxonomy: `src/benchmark_taxonomy.py`

Defines all bucket labels, descriptions, and heuristic helpers:
- `FLOW_CORE_BUCKETS`: 8 categories (pg_confusion, orthographic_convention, segmentation, …)
- `FLOW_HELL_BUCKETS`: 6 buckets (HYDRA, ABYSS, POISON, MIRAGE, LOOP, WALL)
- `suggest_bucket(variant_type)`: heuristic bucket suggestion from error_cases.variant_type
- `suggest_gold_type(variant_type, target_form, ambiguity_level)`: heuristic gold_type

### Ingestion: `src/ingest_benchmark_candidates.py`

Promotes existing `error_cases` to `benchmark_items` with `review_status='candidate'`.
- Idempotent (second run skips already-classified cases)
- Dry-run mode
- Filter by source_id and/or language
- Batch labeling via `--batch-id`
- FLOW_HELL ingestion leaves `bucket=NULL` (requires manual curation)

### Curation: `src/curate_benchmark.py`

CLI for reviewing and approving benchmark items:
- `list`: tabular view filtered by family/status
- `mark`: set any field on a single item (family, bucket, gold_type, risks, notes, status)
- `bulk-approve`: approve all candidates in a family/bucket (with confirmation)
- `stats`: counts by family, bucket, gold_type, ambiguity_level

### Export: `src/export_benchmark.py`

Exports approved benchmark items to JSONL or CSV:
- Exports only `review_status='approved'` by default
- `--include-candidates` flag for pre-approval review
- Filter by family or export ALL
- Each row includes: classification, error pair, provenance, risk flags, curator notes
- `summary` command for dry-run count

### Seed data

`benchmarks/seed_flow_core.sql`:
- 4 FLOW_CORE items from existing seeded error_cases
- 3 approved, 1 needs_review (komen→kommen, low gold_score, circularity noted)

`benchmarks/seed_flow_hell.sql`:
- New source `benchmark-hell-v1` with 8 hand-curated error_cases
- 8 FLOW_HELL items covering all 6 buckets: ABYSS×2, MIRAGE×2, HYDRA×1, WALL×1, POISON×1, LOOP×1
- All approved, all with explicit `why_hard` and `naive_failure_mode` documentation

### Database CLI additions (`src/database.py`)

- `migrate`: applies all SQL files from `migrations/` in order
- `benchmark-seed`: applies a single benchmark seed SQL file
- `stats` table list updated to include `benchmark_items`

## What was intentionally NOT changed

- `schema.sql`: unchanged (migration is additive via separate file)
- `seed.sql`: unchanged (benchmark seed is a separate layer)
- `benchmark_collections` / `benchmark_subsets`: not modified (different concern)
- `v_benchmark_error_cases`: not modified (still useful as quality-gate view independent of benchmark classification)
- `labState.js` (JS benchmark eval system): not touched (separate concern, not connected to flow-db yet)
- `corpora/German_Annotation_V028.csv`: not imported in this work (would add ~1024 candidates)
- LitKey, RUEG, Aspell corpora: not processed (future ingestion candidates)

## Architecture notes

**Relation to existing `v_benchmark_error_cases`:**
`v_benchmark_error_cases` is a quality gate over `error_cases` (review_status + gold_score >= 2).
`benchmark_items` is a _classification layer_ on top. The two are complementary:
- `v_benchmark_error_cases` = "these are potentially usable cases"
- `benchmark_items` = "these cases have been classified and curated for benchmark use"
A future `ingest_candidates` workflow could be restricted to `v_benchmark_error_cases` output for a tighter quality baseline.

**`labState.js` disconnection:**
The JS lab system (packages/flow/lab/) runs evaluations against abstract segment arrays.
It is not connected to `flow-db`. Bridging this (flow-db → labState benchmark suites) is a non-trivial next step and was not attempted here.

**Circular evaluation risk:**
`circularity_risk=1` should be set when the error_form or target_form appears in `GR_RULES`, `CONTEXT_RULES`, or the lexicon importer data. This is currently a manual flag — it is not automatically detected. A future audit tool could scan rules files and flag candidates automatically.

## Remaining gaps

1. **No batch importer for German_Annotation_V028.csv** as FLOW_HELL candidates — the 1024 rows contain real examples but need triage before benchmark classification
2. **No automatic circularity detection** — currently manual flag
3. **No connection between flow-db and labState.js** — benchmark export is not yet consumed by the evaluation runner
4. **No deduplication pass** — near-duplicate detection across benchmark_items is not implemented
5. **No coverage report** — no tooling to show which FLOW rule families are covered by current benchmark items
