# DB Layer Audit

Date: 2026-04-17

## 1) Canonical DB-layer model (confirmed)

This audit uses the already-confirmed architecture model:

1. **`loom-db`** = canonical language knowledge base (cross-product linguistic truth).
2. **`flow-db`** = FLOW-specific LRS/dyslexia normalization, error/corpus/benchmark assistive layer.
3. **`spin-db`** = SPIN-specific expression/transformation knowledge layer.
4. **`smash-db`** = SMASH-specific blockage/intervention knowledge layer.

Constraint: product layers (`flow-db`, future `spin-db`, future `smash-db`) must not silently duplicate canonical language truth that should live in `loom-db`.

---

## 2) Cluster classification (current state)

Legend for status:
- **correct** = currently in the best available location
- **misplaced** = should eventually move
- **transitional** = intentionally retained while migration is incomplete
- **ambiguous** = requires explicit ownership decision

### A. DB runtime + schemas + importers

| Cluster / files | What it is | Assigned layer | Current place correct? | Canonicality / status | Intended target | Migration mode |
|---|---|---|---|---|---|---|
| `flow-db/schema.sql`, `flow-db/migrations/*`, `flow-db/src/database.py`, `flow-db/src/importers/*`, `flow-db/src/base.py` | FLOW DB runtime schema + ingestion stack | `flow-db` | Yes | canonical + correct | keep | none |
| `flow-db/src/benchmark_taxonomy.py`, `flow-db/src/ingest_benchmark_candidates.py`, `flow-db/src/export_benchmark.py`, `flow-db/benchmarks/*` | FLOW-specific benchmark curation/export model | `flow-db` | Yes | canonical + correct | keep | none |
| `flow-db/tests/*`, `flow-db/tests/legacy_tools/*`, `flow-db/tools/*` | DB tests and ingestion/support tooling | `flow-db` | Yes | canonical with legacy sub-scope | keep | none |
| `database/rules/*` | Maintained rule/rationale/reference docs for FLOW normalization decisions | `shared_supporting` (FLOW-adjacent) | **Yes for now** | transitional but intentionally maintained | keep where-is until curated move decision | human judgment |
| `database/artifacts/*` | Generated reports/manifests/pattern bundles from prior pipeline runs | `archive` | Mostly yes | transitional/archive | keep; later move selected useful pieces into versioned outputs | mostly automatic |

### B. Corpora / raw data / benchmark assets

| Cluster / files | What it is | Assigned layer | Current place correct? | Canonicality / status | Intended target | Migration mode |
|---|---|---|---|---|---|---|
| `flow-db/datasets/*` | FLOW DB-ingested corpus sources and robustness sets | `flow-db` | Yes | canonical for FLOW DB runtime inputs | keep | none |
| `data/benchmark/*` | Curated benchmark items/predictions + manual examples | `flow-db` (data feeder) | Yes | canonical benchmark data asset root | keep path, keep ownership under FLOW | none |
| `docs/benchmark/*`, `scripts/benchmark/*`, `tests/benchmark/*` | Benchmark spec, validator/scorer tooling and tests | `shared_supporting` (FLOW benchmark infra) | Yes | canonical tooling/docs, not DB runtime tables | keep | none |
| `corpora/*` (general raw corpora trees) | Raw external corpora and reference dumps | `shared_supporting` | Yes | source inputs (non-canonical DB runtime) | keep as source-of-truth raw inputs | none |
| `docs/archive/corpora_flow_db_legacy_snapshot/*` | Archived legacy duplicate/starter copy formerly under `corpora/flow-db/` | `archive` | Yes | archived non-canonical snapshot | keep archived, no runtime use | none |
| `corpora/litkey-db/Litkey-DB.xlsx` | Source spreadsheet-like corpus asset | `shared_supporting` | Yes | raw source asset | keep in corpora | none |

### C. Product runtime knowledge embedded in packages

| Cluster / files | What it is | Assigned layer | Current place correct? | Canonicality / status | Intended target | Migration mode |
|---|---|---|---|---|---|---|
| `packages/flow/src/rules.*.js`, `packages/flow/src/ruleEngine.js` | FLOW runtime correction rules and deterministic repair logic | `flow-db` (logical ownership), currently app runtime | Ambiguous but acceptable | canonical runtime behavior, not DB-serialized yet | later expose rule metadata through `flow-db` or shared registry | human judgment |
| `packages/flow/src/lexiconFallback.js` | Runtime fallback using CSV corpus (`corpora/German_Annotation_V028.csv`) and inferred maps | `flow-db` with potential `loom-db` overlap | **Partially misplaced** | transitional; embeds dataset-derived lexicon logic in app layer | migrate fallback data provisioning to DB/API boundary | human-guided (risk) |
| `packages/flow/src/flowRulesStore.js` | Local JSON exception/context rule storage (`flow_rules.json`) | `flow-db` (or shared app config) | Ambiguous | transitional mutable store, not centrally governed | define whether this becomes DB-backed or remains local user config | human judgment |
| `loom-db/language/markers.js`, `packages/loom/src/structuralState.js`, `packages/loom/src/signalLayer.js` | Core structural/linguistic marker knowledge and cross-product signaling | `loom-db` + loom runtime | Yes (partial extraction complete) | markers canonicalized in loom-db; remaining Loom heuristics still package-embedded | continue controlled Loom extraction | human-guided |
| `packages/spin/src/rules.en.gr.js` and SPIN diagnosis/config files | SPIN-specific transformation/diagnostic rule assets | `spin-db` (logical future) | Partially | currently in app package only; no `spin-db` layer exists | future extraction of data-like rule assets to `spin-db` | human-guided |
| `packages/smash/src/signalBridge.js` + smash packs | SMASH blockage hints and intervention assets | `smash-db` (logical future) | Partially | currently package-level only; no DB layer exists | future `smash-db` for intervention metadata + eligibility rules | human-guided |
| `packages/loom/lab/*` | Evaluation/lab state and benchmark run orchestration UI logic | `shared_supporting` | Yes | tooling layer, not canonical DB storage | keep | none |

---

## 3) Misplacements and duplicates

### Confirmed duplicates/misplacements

1. **Former `corpora/flow-db/*` duplicate was archived to `docs/archive/corpora_flow_db_legacy_snapshot/*`.**
   - Classification: `archive`.
   - Action status: completed in first safe migration block; keep as non-canonical historical snapshot.

2. **`packages/flow/src/lexiconFallback.js` directly consumes corpus CSV as runtime lexical source.**
   - Classification: transitional + potential layer leak.
   - Risk: product runtime may silently own language truth that should be governed by Loom and/or curated in DB.

3. **`database/artifacts/reports/flow_longtexts_test_report.json` still references old dataset path (`database/datasets/...`) in artifact contents.**
   - Classification: `archive`/transitional artifact mismatch (historical output).
   - Action: do not hand-edit artifact history; regenerate in future pipeline if needed.

### High-risk duplication zones (semantic)

- **Cross-product linguistic markers vs product rules:**
  - `loom-db/language/markers.js` (cross-product marker lists)
  - `packages/flow/src/rules.*.js` (product repair rules)
  - `packages/spin/src/rules.en.gr.js` (SPIN transformation rules)
- Risk: canonical language knowledge could drift across packages without `loom-db` normalization.

---

## 4) Transitional leftovers

1. `database/rules/*` is intentionally retained and actively maintained documentation.
2. `database/artifacts/*` is historical/support output retained for traceability.
3. `docs/archive/corpora_flow_db_legacy_snapshot/*` preserves legacy duplicate material after cleanup.
4. Product package rule assets are still code-first (not DB-first), pending formal extraction strategy.

---

## 5) Human-decision-required items

1. **Ownership boundary: language truth vs product behavior.**
   - Decide what subset of rule/marker knowledge is truly cross-product canonical (`loom-db`) vs product-specific (`flow-db`/`spin-db`/`smash-db`).

2. **`database/rules` future home.**
   - Current location is coherent and maintained.
   - Do not move by naming symmetry alone.
   - Decide whether to keep as doc domain or mirror selected curated parts into machine-readable DB resources.

3. **`flowRulesStore` persistence model.**
   - Decide if user/project exceptions remain local file config or become DB-governed records.

4. **Legacy duplicate disposition follow-up.**
   - Archived snapshot exists; any retained unique value should be curated into canonical homes explicitly.

5. **Whether `spin-db` and `smash-db` start as DB runtimes or curated resource registries first.**

---

## 6) Layer-specific conclusion snapshot

### What should eventually move into `loom-db`

- Additional cross-product linguistic truth beyond the extracted marker set now in `loom-db/language/markers.js`.
- Any future shared lexicon/variant truth that is not FLOW-specific remediation policy.

### What must remain in `flow-db`

- LRS/dyslexia-oriented error cases and correction targets.
- FLOW benchmark taxonomy/families and curated benchmark items.
- FLOW-specific corpus profiles, correction-level metadata, and assistive normalization datasets.

### Does real `spin-db` already exist?

- **Not yet as a DB layer.**
- Existing material is package-level (`packages/spin/src/*`) and should be treated as pre-DB assets.

### Does real `smash-db` already exist?

- **Not yet as a DB layer.**
- Existing material is package-level intervention prototype logic/assets (`packages/smash/*`).

### What is still missing for `spin-db` / `smash-db`

- Explicit schema/resource model.
- Canonical storage location(s).
- Import/export and curation pipeline.
- Layer-boundary contract with Loom (what is inherited vs product-owned).
