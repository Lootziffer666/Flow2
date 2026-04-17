# LOOM DB Second Extraction Report

Date: 2026-04-17

## Scope

Second narrow Loom-owned knowledge extraction pass.

This pass focuses only on clearly general lexical/POS helper tables in LOOM chunking code:
- pronouns
- auxiliaries
- determiners
- prepositions
- copula/state-verb helper sets

No structural heuristics, scoring logic, or FLOW-specific behavior was moved.

---

## 1) Candidate classification (from `packages/loom/src/chunker.js`)

### safe_to_extract_now

1. **Pronoun sets (`PRONOUNS_DE`, `PRONOUNS_EN`)**
   - Deterministic lexical lookup knowledge.
   - Language-general and cross-product reusable.

2. **Auxiliary sets (`AUXILIARIES_DE`, `AUXILIARIES_EN`)**
   - Deterministic POS support tables.
   - General language knowledge, not product behavior.

3. **Determiner sets (`DETERMINERS_DE`, `DETERMINERS_EN`)**
   - Deterministic lexical category lookup.
   - Cross-product linguistic helper knowledge.

4. **Preposition sets (`PREPOSITIONS_DE`, `PREPOSITIONS_EN`)**
   - Deterministic lexical category lookup.
   - General helper data; no signal/scoring behavior embedded.

5. **Copula/state verb sets (`COPULA_DE`, `COPULA_EN`)**
   - Deterministic lexical helper truth used for chunk type selection.
   - General language knowledge, low-risk to externalize with lexical block.

### keep_embedded_for_now

1. **`VERB_SUFFIXES_DE`**
   - Morphological heuristic list tightly coupled to current chunker verb-guess logic.
   - Kept embedded until a dedicated heuristic-contract pass.

2. **Regex-based POS heuristics and chunk-construction behavior**
   - Structural behavior logic, not a pure lookup resource.

### not_general_enough

1. None in this narrow pass.

### unresolved

1. Whether adjective/adverb suffix heuristics should later be represented as Loom data resources or remain runtime heuristics.

---

## 2) What was extracted into `loom-db`

### New resource

- Added `loom-db/language/lexical_pos.js` with canonical DE/EN lists + Set exports for:
  - pronouns
  - auxiliaries
  - determiners
  - prepositions
  - copula/state verbs

### Runtime consumers updated

- `packages/loom/src/chunker.js`
  - now imports lexical/POS sets from `loom-db/language/lexical_pos.js`
  - duplicate embedded lexical tables removed from chunker

No compatibility shims/pointers/fallback paths were introduced.

---

## 3) What intentionally remained embedded

- `VERB_SUFFIXES_DE` (German finite-verb suffix heuristic table)
- POS regex heuristics and chunk-building control logic

Reason:
- these are behavior-coupled heuristic mechanics rather than plain shared lexical lookup tables.

---

## 4) Duplicate embedded knowledge removed

Removed from `packages/loom/src/chunker.js`:
- local pronoun sets
- local auxiliary sets
- local determiner sets
- local preposition sets
- local copula sets

Canonical source is now `loom-db/language/lexical_pos.js`.

---

## 5) Checks run and results

1. `node packages/loom/test/test_loom.js`
   - Result: passed.

2. `python -m unittest discover -s tests/benchmark -p 'test_*.py'`
   - Result: passed.

---

## 6) Unresolved candidates for possible third Loom pass

1. Verb/adjective/adverb suffix heuristic tables and whether they should be modeled as Loom-owned heuristic resources.
2. Potential extraction of additional deterministic lexical classes (if clearly separated from behavior logic).

---

## 7) Outcome summary

This second extraction pass externalized one coherent lexical/POS support block into `loom-db`, removed duplicate package-embedded lexical tables from LOOM chunking runtime, preserved behavior by direct consumer rewiring, and kept structural heuristics intentionally embedded.
