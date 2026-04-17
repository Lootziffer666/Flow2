# DB First Safe Migration Report

Date: 2026-04-17

## Scope and intent

This report captures the **first safe DB migration block**.

This was intentionally limited to low-risk, semantically clear actions:
- reduce DB-runtime ownership ambiguity,
- strengthen `flow-db/` as canonical FLOW DB territory,
- clarify what remains in `database/`,
- avoid high-risk or speculative migrations.

No broad DB overhaul was performed.

---

## 1) What was moved into `flow-db`

No new runtime data trees were moved in this pass because prior passes had already moved clearly FLOW-owned runtime material into `flow-db` (`datasets`, `tools`, legacy tooling tests).

This pass focused on removing a duplicate non-canonical runtime code location that conflicted with `flow-db` ownership.

---

## 2) What changed in this first safe block

### A) Duplicate DB runtime bundle isolation

- Moved legacy duplicate starter bundle from:
  - `corpora/flow-db/`
- To archive:
  - `docs/archive/corpora_flow_db_legacy_snapshot/`

Rationale:
- `flow-db/` is the canonical runtime DB home.
- keeping runtime-like DB code under `corpora/` caused ownership ambiguity.

### B) Boundary documentation hardening

Updated docs/readmes to reflect the safer boundary:

- `corpora/README.md`
  - clarifies `corpora/` as source-input territory only
  - points legacy duplicate bundle to archive path
- `flow-db/README.md`
  - records first safe migration block and canonical ownership
- `database/README.md`
  - clarifies `database/` as support/transitional only
  - explicitly preserves maintained rule-doc location for now
- `docs/repo-map.md`
  - added DB/data/knowledge ownership map and archive pointers

### C) Audit/plan synchronization

- Updated `docs/migration/DB_LAYER_AUDIT.md` to reflect that former `corpora/flow-db` duplicate is now archived.
- Updated `docs/migration/DB_LAYER_MIGRATION_PLAN.md` to mark duplicate archive action as completed in this first safe block.

---

## 3) What remained in `database/`

Kept intentionally (no unsafe moves):

- `database/rules/` (maintained rule/reference docs)
- `database/artifacts/` (historical generated artifacts/reports)
- `database/debug/README.md` (compatibility pointer)

Reason:
- these are support/transitional/reference assets, not canonical runtime DB code,
- moving maintained rule docs now would be high-risk and semantically ambiguous.

---

## 4) What was intentionally not moved yet

1. `database/rules/*`
   - intentionally retained pending curated, human-reviewed migration strategy.

2. App-embedded FLOW fallback/rule resources in `packages/flow/*`
   - e.g., `lexiconFallback.js`, `flowRulesStore.js`.
   - requires behavior/quality validation before DB/API boundary changes.

3. Loom-owned language-truth candidates in `packages/loom/src/*`
   - requires explicit `loom-db` extraction design.

4. Any material that would require creating full `spin-db` or `smash-db`
   - deferred by design; no fabrication in this block.

---

## 5) Loom-owned material still awaiting later migration

Still code-embedded and awaiting later `loom-db` extraction design:

- `packages/loom/src/markers.js`
- `packages/loom/src/structuralState.js`
- `packages/loom/src/signalLayer.js`

These are treated as Loom-owned language/structure truth candidates and should be externalized in a later, dedicated migration phase.

---

## 6) Blockers and ambiguity zones

1. **Rule-doc destination ambiguity**
   - `database/rules` is maintained and currently coherent.
   - no safe automatic move target has been approved yet.

2. **Behavior-coupled app resources**
   - FLOW fallback/rule stores are tightly coupled to runtime behavior.
   - migration needs regression validation and explicit persistence contracts.

3. **Cross-layer language truth boundary**
   - requires explicit Loom canonical schema/resource contract to avoid duplication.

---

## 7) Checks run and results

1. Verified required docs now exist and moved/archived paths match expected structure.
2. Verified benchmark unit test suite still passes.
3. Verified legacy corpus-pipeline tests still pass.

(Exact commands and outputs are recorded in PR/check logs.)

---

## 8) Known bugs / incomplete areas that materially affect DB migration state

1. `packages/flow/src/lexiconFallback.js` still loads corpus CSV directly from `corpora/`.
   - This preserves behavior but keeps a transitional DB/app boundary leak.

2. Loom language-truth candidates remain package-embedded (`packages/loom/src/*`) rather than `loom-db`.
   - this is expected at current migration phase.

3. `database/artifacts/reports/flow_longtexts_test_report.json` contains historical paths from pre-move states.
   - treated as archival output, not canonical runtime path truth.

---

## 9) Outcome summary

This first safe migration block completed:
- duplicate DB runtime bundle isolation,
- clearer canonical ownership for `flow-db`,
- clearer support/transitional scope for `database`,
- synchronized migration docs/reporting,

without broad speculative restructuring.
