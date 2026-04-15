# Evolution Workflow

## 1) Change Intake (deterministic)
1. **Feature Proposal**
   - Capture: scope, affected modules, explicit non-goals.
   - Mandatory references: current baseline artifact(s), test suite version, benchmark suite version.
2. **Test Definition Before Code**
   - Add/update deterministic checks for expected behavior.
   - Include negative checks (no silent drift, no snapshot mutation, no audit rewrite).
3. **Implementation (smallest patch)**
   - Apply minimal-invasive change set.
   - Preserve engine/UI separation and snapshot-first rendering path.
4. **Benchmark Run**
   - Execute full benchmark suite against current branch.
   - Compare with locked baseline metrics and regression thresholds.
5. **Promotion Decision**
   - Promote only if tests pass, benchmark gates pass, and audit integrity checks pass.

---

# Feature Integrationsprozess

## Required Pipeline
1. **Proposal Record**
   - `feature_id`, author, timestamp, target files, risk class.
2. **Pre-merge Validation**
   - Run deterministic unit/integration tests.
   - Run benchmark dataset categories (correctness/change/stability/performance).
3. **Snapshot Contract Check**
   - Every promoted artifact must keep immutable snapshot payload.
4. **Audit Contract Check**
   - Ensure append-only behavior: only append entries, never edit historical entries.
5. **Merge Gate**
   - All checks green + no benchmark regression above threshold.

---

# Benchmark Gatekeeping

## Gate Set
1. **Functional Gate**
   - All deterministic tests must pass.
2. **Determinism Gate**
   - Same input => same `corrected_text`, `rule_hits`, metadata.
3. **Regression Gate**
   - Compare candidate vs baseline artifact metrics:
     - correctness metrics (orthography/syntax proxy sets),
     - change-control metrics (unnecessary changes),
     - rule-hit distribution stability,
     - throughput and memory envelope.
4. **Safety Gate**
   - Escaping and legacy-fallback tests pass.

## Gate Outcome
- **PASS**: eligible for promotion.
- **HOLD**: minor drift, requires maintainer review.
- **FAIL**: automatic block + rollback candidate.

---

# Artifact Lifecycle

## Artifact Generation
- Create artifact from verified run only.
- Persist immutable snapshot:
  - input/corrected text,
  - token and char metadata,
  - changed flag,
  - rule-hit metadata per class and total.

## Artifact Promotion
- Promotion writes a new audit entry.
- Artifact ID and source run ID are fixed after creation.

## Artifact Comparison
- Compare only persisted snapshot values (no recompute from current runtime state).
- Keep comparison deterministic and reproducible.

## Artifact History
- Maintain append-only artifact list.
- Never rewrite historical artifacts; supersede with new artifacts.

---

# Rollback Mechanismus

## Trigger
- Test failure after merge candidate build.
- Benchmark regression over threshold.
- Audit integrity violation.
- Snapshot contract violation.

## Steps
1. Mark candidate artifact state as rejected.
2. Re-promote last known good baseline artifact.
3. Append rollback audit entry with reason code and timestamp.
4. Re-run deterministic smoke tests and benchmark quick suite.
5. Lock deployment path until failing feature branch is corrected.

## Invariants
- Logs remain append-only.
- Rollback creates new entries; it does not modify history.
- Reproducibility preserved by fixed dataset versions and deterministic engine behavior.

---

# Operativer Merge-Gate (Phase 5)

Ab sofort ist der Gate-Lauf im Repo als ausführbarer Check hinterlegt.

## Pflichtkommando vor Merge

```bash
npm run gate:phase5
```

## Was der Gate-Lauf prüft

1. **Functional Gate**
   - `test:shared`
   - `test:flow`
   - `test:smash`
2. **Determinism Gate**
   - identische Eingabe liefert identisches `corrected`, `rule_hits`, `scope`, `applied_stages`
3. **Regression Gate**
   - no-change Samples bleiben unverändert
   - bekannte Fehlerfälle werden weiterhin korrigiert
4. **Snapshot + Audit Gate**
   - promoted snapshots bleiben unverändert
   - Audit-Chain bleibt append-only konsistent

Die technische Umsetzung liegt in:

- `scripts/phase5_quality_gate.js`
