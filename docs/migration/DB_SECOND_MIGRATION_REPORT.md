# DB Second Migration Report

Date: 2026-04-17

## Scope

Second coherent migration block, following the first safe pass.

Goals in this block:
- move clearly Loom-owned language truth toward `loom-db`
- keep `corpora/` separate as raw input territory
- tighten `flow-db` and `database/` boundaries
- remove unnecessary migration compatibility indirection

No giant DB rewrite was performed.

---

## 1) What was moved toward the Loom-owned side

### A) Extracted shared language marker truth into `loom-db`

Moved:
- `packages/loom/src/markers.js`
-> `loom-db/language/markers.js`

Updated consumer:
- `packages/loom/src/structuralState.js`
  - now imports marker constants directly from `loom-db/language/markers.js`

Outcome:
- marker-set language truth is now explicitly Loom-owned outside product package internals.
- no compatibility forwarding/shim file was left behind at the old path.

---

## 2) What was moved into `flow-db`

No additional data moved into `flow-db` in this block.
Reason:
- prior pass already moved clear FLOW-owned runtime material (`datasets`, `tools`, legacy tooling tests).
- this block targeted Loom-side extraction + boundary cleanup.

---

## 3) What stayed in `corpora` and why

Kept in `corpora/`:
- raw/source corpora inputs and source-format assets.

Why:
- `corpora/` is explicitly a raw-input/source-corpus zone.
- it must remain separate from product DB runtime layers.

---

## 4) Whether `spin-db` and `smash-db` materially exist yet

- `spin-db`: **does not materially exist yet as a DB layer**.
  - SPIN data-like assets remain package-level (`packages/spin/src/*`).
- `smash-db`: **does not materially exist yet as a DB layer**.
  - SMASH data-like assets remain package-level (`packages/smash/*`).

No fake/substantive DB layers were invented in this block.

---

## 5) Compatibility shims/pointers removed

Removed:
- `database/debug/README.md` compatibility pointer.

Rationale:
- temporary migration continuity indirection was no longer needed.
- obsolete pointer paths were removed directly rather than preserved via compatibility layers.

No fallback path layer was introduced for moved Loom markers; references were updated directly.

---

## 6) What remains unresolved

1. Additional Loom-owned linguistic truth still package-embedded in `packages/loom/src/*` beyond extracted marker sets.
2. FLOW app-level boundary leak remains in `packages/flow/src/lexiconFallback.js` (direct corpus CSV usage).
3. Long-term curated destination for maintained `database/rules/*` remains intentionally unresolved (to avoid forced bad relocation).
4. Formal schema/runtime definitions for future `spin-db` and `smash-db` remain pending.

---

## 7) Checks run and results

1. Verified moved Loom marker path and removed old path.
2. Verified required migration/report docs exist.
3. Ran benchmark tests.
4. Ran legacy flow-db corpus pipeline tests.

(Exact command outputs are in task logs/CI logs.)

---

## 8) Known bugs / incomplete areas materially affecting current DB/data architecture

1. `packages/flow/src/lexiconFallback.js` still consumes `corpora/German_Annotation_V028.csv` directly.
   - this preserves behavior but keeps DB/app boundary coupling.

2. Only the Loom marker-set resource has been extracted so far.
   - broader Loom truth extraction remains incomplete by design.

3. `database/artifacts/*` remains historical/transitional; some artifacts contain legacy paths.
   - treated as archive outputs, not canonical runtime path truth.

---

## 9) Outcome summary

This migration block improved layered architecture by:
- creating and using a real `loom-db` location for extracted shared language marker truth,
- keeping `corpora` explicitly raw/source and separate from product DB runtime,
- removing obsolete compatibility pointer indirection,
- updating boundary docs and migration records in the same change.
