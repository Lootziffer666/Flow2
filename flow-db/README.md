# SQLite Fehlerkorpus / Benchmark — v2

A pragmatic SQLite-first corpus toolkit supporting three concurrent use cases:

- **Normalization Core DB** — via `v_normalization_candidates`
- **Benchmark DB** — via `v_benchmark_error_cases`
- **Research DB** — via `v_research_cases_enriched`

---

## Architecture

The data model deliberately separates concerns into five layers:

| Layer | Tables |
|-------|--------|
| Resource metadata | `sources`, `documents`, `segments`, `participants` |
| Lexicon / variants | `lexicon_entries`, `lexicon_variants` |
| Operative error cases | `error_cases`, `error_spans` |
| Deep annotation | `linguistic_features`, `orthographic_feature_flags` |
| Benchmark / profile | `benchmark_collections`, `benchmark_subsets`, `corpus_profiles` |

Key design assumptions:

- `error_cases` is the central operational table.
- Lexica are modelled independently and are **not** automatically mirrored into `error_cases`.
- Review status (`review_status`) and gold quality (`gold_score 0–5`) are tracked on every main entity.
- Tokenization issues and context-dependency are explicitly flagged (`is_tokenization_issue`, `requires_context`, `has_context`).

---

## Directory Layout

```
flow-db/
  schema.sql              # DDL, constraints, indexes, views
  seed.sql                # Representative sample data
  conftest.py             # sys.path fixture (makes `import src` work for pytest)
  src/
    __init__.py
    database.py           # Connection helper + CLI
    importers/
      __init__.py
      base.py             # Shared utilities: safe_int, safe_bool, clean, etc.
      lexicon_importer.py
      error_pairs_importer.py
      context_importer.py
      german_annotation_importer.py
  tests/
    __init__.py
    test_schema.py
    test_importers.py
```

---

## Setup

```bash
cd flow-db
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -U pip pytest
```

---

## CLI Usage

All commands are run from the `flow-db/` directory.

### Initialize a database

```bash
python -m src.database init --db corpus.db
```

### Apply schema + seed data

```bash
python -m src.database seed --db corpus.db
```

### Print row counts (stats)

```bash
python -m src.database stats --db corpus.db
```

### Import a CSV file

```bash
python -m src.database import \
  --db corpus.db \
  --type german_annotations \
  --file ../corpora/German_Annotation_V028.csv \
  --source-id 1 \
  --language de
```

`--type` choices: `lexicon` | `error_pairs` | `context` | `german_annotations`

Each import reports `inserted` and `skipped` counts:

```
[import] german_annotations → 1024 inserted, 3 skipped
```

---

## Running Tests

```bash
cd flow-db
pytest tests/ -v
```

---

## Expected CSV Formats

### Lexicon (`--type lexicon`)

```
canonical_form,variant_form,variant_type,observed_count,review_status,gold_score,requires_context
definitely,definately,misspelling,12,validated,5,0
```

Required: `canonical_form`, `variant_form`

### Error pairs (`--type error_pairs`)

```
error_form,target_form,error_type,variant_type,observed_count,review_status,gold_score,informant_group
schule,Schule,capitalization,misspelling,4,validated,4,l2
```

Required: `error_form`

### Context segments (`--type context`)

```
external_doc_id,segment_text,normalized_text,error_form,target_form,span_start,span_end,speaker,review_status,gold_score
doc-1,We met some times last year.,We met sometimes last year.,some times,sometimes,7,17,child,light_reviewed,3
```

Required: `external_doc_id`, `segment_text`, `error_form`, `target_form`

### German annotations (`--type german_annotations`)

Accepts flexible header aliases so that variant CSV exports can be imported
without renaming columns. Key aliases:

| Logical field | Accepted column names |
|---|---|
| error_form | `error_form`, `fehlerform`, `fehler`, `wrong`, `token_error` |
| target_form | `target_form`, `korrektur`, `ziel_form`, `correct`, `normalization`, `target`, `berichtigung`, `richtig` |
| document_id | `document_id`, `external_doc_id`, `doc_id`, `dokument_id`, `text_id` |
| segment_text | `segment_text`, `sentence`, `satz`, `context`, `kontext`, `raw_text` |
| review_status | `review_status`, `review`, `status` |
| gold_score | `gold_score`, `gold`, `score` |
| informant_group | `informant_group`, `gruppe`, `group_label` |

Optional linguistic columns: `pos_tag`/`pos`, `phoneme_sequence`/`phonemes`,
`grapheme_sequence`/`graphemes`, `morpheme_segmentation`/`morphemes`,
`morpheme_tags`/`morph_tags`, `edit_distance`/`levenshtein`/`abstand`

Minimum viable row: just `fehlerform` + `korrektur`.

---

## v2 Changes (over v1)

### Directory structure fixed
v1 files were flat; all Python files now live under `src/importers/` as the
import paths already assumed.

### Shared importer utilities (`src/importers/base.py`)
Extracted shared helpers used by all importers:
- `safe_int(value, default)` — safe integer conversion
- `safe_bool(value, default)` — truthy string/int to 0/1
- `clean(value, default)` — strip with None guard
- `require_columns(row, cols, row_num)` — validate required fields per row
- `correction_level_for(variant_type)` — centralised tokenization detection
- Shared frozensets: `TOKENIZATION_TYPES`, `VALID_VARIANT_TYPES`, `VALID_INFORMANT_GROUPS`, `VALID_REVIEW_STATUSES`

### Importer robustness
All importers now:
- Validate required columns per row (bad rows are skipped with a warning)
- Use `safe_int` / `safe_bool` instead of bare `int()` that would crash
- Validate enum fields (`informant_group`, `variant_type`, `review_status`) and default gracefully
- Return `(inserted, skipped)` tuples so callers know how many rows were problematic
- Recover from row-level errors without aborting the entire import

### German importer bug fixes
- **Phantom document collapse fixed**: rows without `external_doc_id` no longer
  all collapse into a single `"generated"` document; `(None, None)` is returned
  instead.
- **`normalized_text` corrected**: segment rows now store `NULL` for
  `normalized_text` rather than copying the raw erroneous text.
- **Consonant-doubling heuristic improved**: uses bigram comparison
  (`"komen"→"kommen"` fires; `"Masse"→"Maße"` does not) instead of a fragile
  substring search.
- **New aliases added**: `berichtigung`, `richtig` for target_form;
  `edit_distance`/`levenshtein`/`abstand` for linguistic features.

### Schema additions
- Three new indexes: `idx_lex_var_entry`, `idx_error_cases_source`, `idx_error_cases_variant_type`
- `documents` table gains `CHECK (has_context = 0 OR external_doc_id IS NOT NULL)`
  to enforce that context documents always have an addressable ID.

### CLI enhancements
- `stats` subcommand prints per-table row counts and `error_cases` breakdowns
- `init` and `seed` print confirmation messages
- `import` prints `inserted` / `skipped` summary
- File-not-found check with clear error message

### Test coverage
Tests expanded from 5 to 24. New coverage includes:
- base.py helper unit tests
- Malformed-input row-skipping behaviour
- Invalid enum defaulting
- Token-split and token-merge detection
- German heuristics (capitalisation, consonant doubling)
- Phantom document prevention
- `normalized_text` correctness
- Column alias coverage (`berichtigung`)
- View filter thresholds (`excluded`, `gold_score < 2`)
- New schema indexes and constraints

---

## Notes

- Foreign keys are enabled on every connection.
- No external network calls are made.
- No external Python packages are required beyond `pytest` for tests.
- The schema is intentionally not over-normalised: it is pragmatic enough for
  consistency while remaining easy to query directly.
