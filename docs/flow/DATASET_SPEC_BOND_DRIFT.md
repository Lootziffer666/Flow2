# Dataset Spec — Bond-Drift Baselines

**Status:** DRAFT. **Blocking dependency:** `ANNOTATION_POLICY_DRIFT.md` must
be signed off before a single item is labeled.
**Contract:** `data/contracts/bond_drift.schema.json`
**Rationale:** see `GRAPH_VALIDATION_MEMO.md` §3.3.

---

## 1. Purpose
Evidence source for gate **G4 — Bond-Drift Critical violations = 0**.
Without this set, drift detection is a mechanism without a judgment.

## 2. Scale
**2 000 pairs** of (baseline_conllu, candidate_conllu). Each pair is:
- a single German sentence at the `# text` level,
- two CoNLL-U blocks:
  - `baseline_conllu`: the sentence parsed in its source form,
  - `candidate_conllu`: the sentence parsed in its FLOW-output form (or a
    synthetic candidate constructed for drift testing),
- a binary label `drift_allowed`,
- a free-text `drift_reason` referencing the clause in
  `ANNOTATION_POLICY_DRIFT.md` that justified the label.

## 3. Stratification
Half the set is `drift_allowed = true`, half `drift_allowed = false`.
Within `drift_allowed = false`, a **Critical Set** of 500 items where drift
affects a core grammatical relation (root, nsubj, obj, iobj). Gate G4 binds on
the Critical Set specifically.

| Subset | Count |
|---|---:|
| `drift_allowed = true` | 1 000 |
| `drift_allowed = false` (non-critical) | 500 |
| `drift_allowed = false` (Critical) | 500 |

## 4. Record schema (per JSONL line)
```
{
  "pair_id":         string,   // ^BD-\d{6}$
  "sent_id":         string,   // matches §3.1 sent_id if derived
  "text":            string,
  "baseline_conllu": string,   // multi-line CoNLL-U block
  "candidate_conllu":string,   // multi-line CoNLL-U block
  "drift_allowed":   bool,
  "critical":        bool,     // true iff member of Critical Set
  "drift_reason":    string,   // cites a section id from ANNOTATION_POLICY_DRIFT.md
  "edges_changed":   array<{
      "token_id": int,
      "field":    "HEAD" | "DEPREL" | "UPOS",
      "baseline": string,
      "candidate":string
  }>,
  "annotator":       string,
  "double_annotated":bool
}
```

`edges_changed` is computed mechanically (diff of the two CoNLL-U blocks); it
is not a judgment. The judgment lives in `drift_allowed` + `drift_reason`.

## 5. Annotation protocol
- Each pair annotated by one primary; 20 % double-annotated.
- Adjudication on disagreement; inter-annotator agreement target ≥ 0.95
  (Cohen's κ on `drift_allowed`).
- `drift_reason` must cite a section id in `ANNOTATION_POLICY_DRIFT.md`.
  Free-text reasons without a citation are rejected at validation.

## 6. Construction sources
- 1 000 pairs: natural FLOW outputs on the §3.2 parallel benchmark, re-parsed.
- 1 000 pairs: synthetic — deliberately constructed candidates derived from
  gold by applying one rule-class edit in isolation (to probe whether that
  class of edit is ever allowed to drift dependencies).

## 7. Validation (CI-blocking)
1. Both CoNLL-U blocks are valid trees (udapi check).
2. `edges_changed` matches a deterministic diff of the two blocks.
3. Every `drift_reason` references a live section id in
   `ANNOTATION_POLICY_DRIFT.md` (resolved at validation time, not annotation time).
4. Counts in §3 met within ±2 %.

## 8. What this set cannot do
- It cannot prove semantic correctness of dependency parses.
- It cannot stand in for §3.1 — gold trees are still required to ground the
  parser output `baseline_conllu` before drift from it is measured at all.
- It cannot evaluate the drift *detector*; that is a unit-level concern once
  `conllGraph.js` + `compareBondIntegrity` exist.
