###Steps

1. Read: 
 -`packages/flow`
 -`packages/spin`
 -`packages/shared`
 -`database`
  to develop a deep understanding of my project.

2. Find working files:
  -`corpora`


3. Move folder content from `corpora/flow-db` to `/flow-db`

4. Build DB according the rules.

  -

### Role
Act as an experienced SQLite / Python principal engineer joining an existing codebase mid-stream. Your job is to **review, extend, and harden the current implementation**, not to start from scratch.

### Task
Take the existing SQLite Fehlerkorpus / Benchmark starter project and evolve it into a cleaner, more robust v2 that preserves the current working architecture while improving schema quality, importer consistency, CLI ergonomics, and test coverage.

### Context
- Repository scope: whole project.
- This is **an existing starter implementation**, not a greenfield repo.
- Existing files already present in `corpora\flow-db`:
  - `schema.sql`
  - `seed.sql`
  - `src/database.py`
  - `src/importers/base.py`
  - `src/importers/lexicon_importer.py`
  - `src/importers/error_pairs_importer.py`
  - `src/importers/context_importer.py`
  - `src/importers/german_annotation_importer.py`
  - `tests/test_schema.py`
  - `tests/test_importers.py`
  - `README.md`

### Current implementation summary
The current project already contains a solid SQLite-first v1 with:
- `sources`, `participants`, `documents`, `segments`
- `lexicon_entries`, `lexicon_variants`
- `error_cases`, `error_spans`
- `linguistic_features`, `orthographic_feature_flags`
- `benchmark_collections`, `benchmark_subsets`, `corpus_profiles`
- views:
  - `v_normalization_candidates`
  - `v_benchmark_error_cases`
  - `v_research_cases_enriched`

There is already:
- a small CLI in `corpora/flow-db`
- seed data
- importers for:
  - lexicon CSV
  - flat error-pair CSV
  - contextual segment CSV
  - German annotated CSV with flexible aliases
- tests that cover:
  - schema creation
  - FK activation
  - basic constraints
  - importer success paths
  - basic view behavior

### Important constraint
Do **not** rewrite the project as an ORM app or replace the overall design. Work incrementally from the current code. Prefer targeted refactors and schema-safe improvements.

### Existing behavior you must preserve unless there is a strong reason to change it
1. SQLite-first design using `sqlite3`
2. Foreign keys enabled per connection
3. `error_cases` as the central operational table
4. Lexicon data remains separate from `error_cases`
5. Views remain the main export surface for:
   - normalization
   - benchmark slices
   - research joins
6. Importers remain lightweight and file-driven
7. No external network calls

### What is already good and should generally be kept
- Pragmatic normalized schema
- Clear split between metadata, lexicon, cases, deep annotations, benchmark/profile layers
- Review and quality modeling via `review_status` and `gold_score`
- Context-aware flags like `has_context`, `requires_context`, `is_tokenization_issue`
- Flexible German CSV importer with alias mapping
- Minimal CLI for init / seed / import

### What now needs improvement
Please inspect the existing implementation and improve it in a focused way. Prioritize the following areas:

#### 1. Schema consistency and data integrity
Review whether the current schema and importers are fully aligned.
Look for issues such as:
- duplicated enum/check logic across tables
- nullable vs non-nullable mismatches
- fields present in schema but inconsistently populated by importers
- risky uniqueness behavior
- missing useful indexes
- review/quality defaults that should be centralized
- ambiguous coupling between `error_type`, `variant_type`, and `correction_level`

Make pragmatic improvements without overengineering.

#### 2. Importer robustness
Harden the current importers so they fail less noisily and behave more consistently.
Improve things like:
- row validation
- stripping / normalization of inputs
- clearer handling of missing required columns
- better type conversion for ints / booleans
- better shared helper functions in `base.py`
- reducing duplicated logic across importers
- safer commits / transactions
- avoiding accidental partial corruption on malformed rows

#### 3. German annotation importer quality
The German importer is already the most advanced one. Improve it carefully.
Potential targets:
- better alias coverage
- clearer heuristics
- extracting more linguistic feature fields if present
- making document/segment creation more deterministic
- better span handling
- less duplication in guessed `variant_type` / `error_type`
- more explicit notes / provenance

#### 4. CLI and developer ergonomics
Improve `src/database.py` while keeping it simple.
Possible improvements:
- better error messages
- cleaner command dispatch
- optional command to inspect counts / quick stats
- optional command to validate schema or smoke-test DB
- minor cleanup of imports and unused code
- more maintainable internal structure

#### 5. Test coverage
Expand tests meaningfully.
Add tests for:
- malformed CSV inputs
- constraint failures
- alias coverage in German importer
- tokenization cases
- capitalization heuristics
- context document/segment creation
- importer behavior for optional linguistic feature columns
- benchmark and normalization views with edge cases
- duplicate handling for lexicon imports

#### 6. Documentation
Update README so it matches the actual code after your changes.

### Domain / modeling requirements to preserve
The data model must continue to support these use cases:
- `Normalization Core DB`
- `Benchmark DB`
- `Research DB`

And these material types:
- lexicon-style canonical form → variants
- flat error pairs
- contextual error segments
- German annotated error CSVs
- future transcript-like and benchmark-profile-like inputs

The project should still respect these principles:
- raw form and normalized target are distinct
- orthography should not be blindly merged with grammar
- uncertain or review-heavy data should stay flagged
- source provenance is first-class
- informant groups matter:
  - `child`
  - `dyslexia`
  - `l2`
  - `general_adult`
  - `unknown`

### Current schema concepts you should work with
These tables already exist and should generally stay, though they may be refined:
- `sources`
- `participants`
- `documents`
- `segments`
- `lexicon_entries`
- `lexicon_variants`
- `error_cases`
- `error_spans`
- `linguistic_features`
- `orthographic_feature_flags`
- `benchmark_collections`
- `benchmark_subsets`
- `corpus_profiles`

These core enums/check domains already exist and should be treated as first-class concepts:
- `review_status`:
  - `raw_imported`
  - `light_reviewed`
  - `validated`
  - `excluded`
- `informant_group`:
  - `child`
  - `dyslexia`
  - `l2`
  - `general_adult`
  - `unknown`
- `variant_type` includes:
  - `misspelling`
  - `regional`
  - `real_word_confusion`
  - `apostrophe_omission`
  - `apostrophe_confusion`
  - `token_split`
  - `token_merge`
  - `separator_substitution`
  - `proper_name_misspelling`
  - `geographic_name_misspelling`
  - `demonym_misspelling`
  - `child_phonological_form`
  - `annotator_interpretation`
  - `uncertain_interpretation`

### Current files and responsibilities
Use the current code as the baseline:

#### `src/importers/base.py`
Currently provides:
- CSV row reading
- helper `one(...)`

Consider whether this should become the shared place for:
- required-column validation
- safe int/bool parsing
- normalized string extraction
- shared row-cleaning helpers

#### `src/importers/lexicon_importer.py`
Currently:
- inserts `lexicon_entries`
- inserts `lexicon_variants`
- infers `is_tokenization_issue` from `variant_type`
- uses defaults for `review_status`, `gold_score`, `requires_context`

Improve robustness and duplicate handling.

#### `src/importers/error_pairs_importer.py`
Currently:
- writes directly to `error_cases`
- infers `correction_level`
- flags tokenization/context requirements from `variant_type`

Improve consistency with other importers and schema semantics.

#### `src/importers/context_importer.py`
Currently:
- creates `documents`
- creates `segments`
- creates `error_cases`
- optionally creates `error_spans`
- derives token split heuristic from error/target spacing

Review for correctness, duplication, and context semantics.

#### `src/importers/german_annotation_importer.py`
Currently:
- supports flexible aliases
- creates `documents`/`segments` if context is present
- guesses `variant_type`
- guesses `error_type`
- optionally inserts `linguistic_features`
- inserts simple German orthographic flags

This file should likely be refactored, but not thrown away.

#### `src/database.py`
Currently:
- manages connection
- executes schema/seed scripts
- provides CLI commands:
  - `init`
  - `seed`
  - `import`

Potentially extend with a small `stats` or `check` command if useful.

#### `schema.sql`
Currently defines the full DDL, indexes, and the three views.

#### `seed.sql`
Currently inserts representative examples such as:
- `definately -> definitely`
- `behaviour -> behavior`
- `some times -> sometimes`
- German capitalization and consonant-doubling examples

### Expected Output
- Provide a **unified diff patch** against the current project.
- Do not regenerate the whole repo from scratch unless a file genuinely needs replacement.
- Start with a brief architecture/code review summary:
  - what is already good
  - what is inconsistent or fragile
  - what you will change
- Then provide the patch.
- Add or update tests proving the changes.
- Keep the patch focused and maintainable.

### Guidance for Codex
1. Think step-by-step using **Structured CoT** (review → plan → patch).
2. Run a **self-critique loop**: generate → review → improve once.
3. Prefer minimal, high-value changes over broad rewrites.
4. Preserve backward compatibility where reasonable.
5. When changing schema behavior, also update:
   - seed data
   - importers
   - tests
   - README
6. Avoid introducing heavy dependencies.
7. Use Python standard library unless there is a compelling reason otherwise.
8. Keep the project easy to run locally.
9. Never expose secrets, credentials, or user data.

### Concrete goals
Please aim to deliver most or all of the following:

- tighter shared importer utilities in `src/importers/base.py`
- cleaner importer logic with less duplication
- better validation of CSV inputs
- clearer error messages for malformed imports
- improved tests for unhappy paths and edge cases
- minor schema tightening where justified
- README updated to match actual CLI and importer expectations
- optional tiny CLI enhancement for stats/checks

### Non-goals
- No ORM migration
- No FastAPI / web service
- No Dockerization unless already present
- No background jobs
- No external services
- No redesign into a generic framework

### Setup Script (if needed)
```bash
python -m venv .venv
. .venv/bin/activate || source .venv/bin/activate
python -m pip install -U pip pytest
