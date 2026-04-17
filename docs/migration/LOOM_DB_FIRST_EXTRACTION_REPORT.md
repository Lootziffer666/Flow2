# LOOM DB First Extraction Report

Date: 2026-04-17

## Scope

First real Loom-owned knowledge extraction pass.

This pass is intentionally narrow:
- externalize clearly general, cross-product language/text truth,
- keep runtime correctness stable,
- avoid broad architecture/DB overhauls.

---

## 1) Loom-owned candidate classification

### safe_to_extract_now

1. **Clause connector knowledge (DE/EN subordinating + coordinating conjunction sets)**
   - Why safe: language-general, cross-product, deterministic, non-product-specific.
   - Previous location: `packages/loom/src/clauseDetector.js` and duplicated subset in `packages/loom/src/chunker.js`.

2. **Previously extracted marker-set knowledge** (already done in earlier pass)
   - `loom-db/language/markers.js`

### keep_embedded_for_now

1. Heuristic POS tagging lists in `packages/loom/src/chunker.js` (pronouns, auxiliaries, determiners, prepositions)
   - Keep for now due broader behavioral coupling and larger extraction surface.

2. Structural-state decision heuristics in `packages/loom/src/structuralState.js`
   - Keep for now; requires a more explicit schema/contract pass.

### flow_specific_not_loom

1. `packages/flow/src/rules.*.js`, `packages/flow/src/ruleEngine.js`
   - FLOW product behavior, not Loom canonical layer.

2. FLOW benchmark/error/corpus data in `flow-db/*`, `data/benchmark/*`
   - product-specific by design.

### unresolved

1. Extent/timing for extracting additional chunker lexical sets into `loom-db`.
2. Final structured data model for larger Loom heuristics beyond list-based resources.

---

## 2) What was actually moved/externalized into `loom-db`

### New Loom-owned resource

- Added: `loom-db/language/clause_connectors.js`
  - canonical DE/EN subordinating and coordinating connector sets
  - exports both list forms and `Set` forms for runtime use

### Runtime consumers updated

- `packages/loom/src/clauseDetector.js`
  - now imports clause connector sets from `loom-db/language/clause_connectors.js`
  - local embedded connector lists removed

- `packages/loom/src/chunker.js`
  - now imports subordinate connector sets from `loom-db/language/clause_connectors.js`
  - local duplicate subordinate connector sets removed

No compatibility shim/forwarding layer was introduced.

---

## 3) What intentionally remained embedded

- Chunker lexical/POS heuristic tables (pronouns, auxiliaries, determiners, prepositions)
- structural-state and signal-layer heuristic logic

Reason:
- extraction would be larger and riskier than this first Loom pass,
- this block targeted only the most semantically obvious, low-risk shared truth.

---

## 4) What was judged FLOW-specific and left out of Loom

- FLOW correction rules and product pipeline behavior (`packages/flow/src/*`)
- FLOW benchmark and error/corpus product data (`flow-db/*`, `data/benchmark/*`)

These were intentionally not moved.

---

## 5) Checks run and results

1. LOOM runtime surface test:
   - `node packages/loom/test/test_loom.js`
   - Result: passed (`31 tests — 31 passed, 0 failed`)

2. Benchmark test suite:
   - `python -m unittest discover -s tests/benchmark -p 'test_*.py'`
   - Result: passed

3. flow-db legacy tooling test:
   - `python -m pytest flow-db/tests/legacy_tools/test_corpus_pipeline.py -q`
   - Result: passed

---

## 6) Unresolved/risky candidates for next Loom pass

1. Broader extraction of chunker lexical/POS knowledge into Loom-owned resources.
2. Externalization strategy for structural heuristics without overfitting to current code shape.
3. Contracting Loom resource versioning/provenance for non-list heuristics.

---

## 7) Outcome summary

This first Loom extraction pass successfully:
- materialized another real Loom-owned canonical resource block (`clause_connectors`),
- removed duplicated connector truth from package internals,
- kept product-specific FLOW material out of Loom,
- preserved runtime behavior and test stability.
