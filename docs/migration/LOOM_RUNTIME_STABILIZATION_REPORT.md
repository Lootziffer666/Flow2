# LOOM Runtime Stabilization Report

Date: 2026-04-17

## Scope

Runtime correctness fix only.

This task repaired the LOOM runtime export surface so current test expectations are coherent.
No broad DB-layer restructuring was performed in this change.

---

## Root cause

`packages/loom/src/index.js` had been reduced to:
- `module.exports = require('@loot/shared')`

As a result, LOOM-specific APIs were not exported from the package surface, including:
- `chunkSentence`
- `chunkText`
- structural-state and signal-layer functions

`packages/loom/test/test_loom.js` imports `chunkSentence` from `packages/loom/src/index.js`, so it failed with:

`TypeError: chunkSentence is not a function`

Root-cause classification:
- stale/incomplete index export surface
- likely introduced by recent restructuring where the LOOM package entry was narrowed to shared exports only

---

## Files changed

1. `packages/loom/src/index.js`
   - now composes and exports:
     - `@loot/shared` exports
     - `clauseDetector` exports
     - `chunker` exports
     - `structuralState` exports
     - `signalLayer` exports

2. `packages/loom/index.mjs`
   - aligned ESM entry to re-export from `src/index.js` via `createRequire`
   - exposes the same LOOM surface (including `chunkSentence`)

---

## Pre-existing vs newly introduced

- Failure state was **pre-existing at task start** (reproduced before changes).
- This fix restores expected LOOM runtime API shape and resolves the observed test failure.

---

## Checks run and results

1. Reproduction (before fix)
   - `node packages/loom/test/test_loom.js`
   - Result: failed with `TypeError: chunkSentence is not a function`

2. Validation (after fix)
   - `node packages/loom/test/test_loom.js`
   - Result: passed (`31 tests — 31 passed, 0 failed`)

---

## Still-open adjacent LOOM runtime risks

1. LOOM entry-surface drift risk
   - If future refactors modify `src/index.js` again, package surface may regress.
   - Recommendation: keep `test_loom.js` in CI gate to protect API contract.

2. Export parity risk (CJS vs ESM)
   - `index.mjs` now mirrors `src/index.js`; future additions should update both intentionally.

