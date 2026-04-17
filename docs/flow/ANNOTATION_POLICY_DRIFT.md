# Annotation Policy — Drift Acceptability

**Status:** STUB. Must reach FINAL before a single item in §3.3 (bond-drift
baseline corpus) is labeled.
**Scope:** defines when a dependency-level change between baseline and candidate
CoNLL-U parses is labeled `drift_allowed = true` vs `drift_allowed = false`,
and when a violation is designated `critical`.
**Bound to:** `RELEASE_GATES_GRAPH.md` gate G4, G6;
`DATASET_SPEC_BOND_DRIFT.md` §4.

---

## 1. Why this policy must exist before labeling

Bond-drift measurement without an acceptability taxonomy is a syntactic diff,
not a judgment. Two parses that differ in HEAD by one token may represent a
legitimate change caused by repairing a misspelled verb, or they may represent
structural damage. Only a written policy distinguishes these.

Gate G4 (Bond-Drift Critical violations = 0 in the Critical Set) is logically
empty until this policy defines what `critical = true` means.

---

## 2. Dependency-edit taxonomy

The following classification applies to every entry in `edges_changed` within a
bond-drift pair. An item's `drift_allowed` label is determined by the
**worst-case** change: if any single edge change is classified as CRITICAL, the
item receives `critical = true` and `drift_allowed = false`.

### DRIFT-2.1 — Allowed: local relabeling preserving structure

A change where HEAD stays the same but DEPREL changes, AND the new DEPREL is
in the same broad class as the old one AND the predicate-argument structure of
the clause is preserved.

Allowed examples:
- `nmod` → `obl` when the governing noun is repaired to a verb form.
- `mark` → `case` in a `zu`-infinitive when the repair clarifies the split.
- `flat` → `compound` where a merged compound is split by the repair.

Not covered: any change to DEPREL that reassigns grammatical function (subject,
object, oblique complement) of the dependent.

### DRIFT-2.2 — Allowed: attachment shift within same clause preserving function

HEAD changes to a different token, but:
- both the original and new HEAD are in the same clause,
- the grammatical function of the dependent (its DEPREL) is unchanged,
- the predicate-argument structure of the clause is unchanged.

Example: repair of a misspelled conjunction causes a coordination to re-attach
to the correct conjunct. The `conj` relation is preserved; only the HEAD index
changes.

### DRIFT-2.3 — Allowed: subtree relocation without function change

An entire subtree moves because its governor was repaired (e.g., a compound is
split, so the subtree of the second element detaches from the first and attaches
to a new governor). Allowed if:
- the moved subtree's internal structure is unchanged,
- the DEPREL of the subtree root is unchanged,
- the new governor is the semantically appropriate head.

### DRIFT-2.4 — NOT allowed: grammatical function reassignment

HEAD changes AND DEPREL changes such that the dependent's grammatical function
changes (e.g., from object to subject, from complement to adjunct, from
modifier to head). This is structural damage regardless of whether the surface
text is improved.

All DRIFT-2.4 cases receive `drift_allowed = false`.

### DRIFT-2.5 — CRITICAL: core argument reassignment

A special case of DRIFT-2.4 where the reassigned edge involves one of:
- `nsubj`, `nsubjpass`, `csubj` (subject)
- `obj`, `iobj` (object)
- `root`
- `ccomp`, `xcomp` (clausal complement)

These affect the core predicate-argument structure of the clause. All DRIFT-2.5
cases receive `critical = true` and `drift_allowed = false`.

### DRIFT-2.6 — NOT allowed: UPOS class change without corresponding repair

UPOS changes (verb → noun, noun → adjective) where the surface text of that
token was NOT touched by the FLOW repair. A parser re-analyzing a token's class
based on neighboring repairs is a sign of overreach by the repair; label as
`drift_allowed = false`. UPOS changes on the token that was directly repaired
may be allowed under DRIFT-2.1/2.2.

---

## 3. Critical Set definition

An item enters the Critical Set (`critical = true`) if and only if at least one
edge in `edges_changed` is classified DRIFT-2.5.

The Critical Set is the evidence source for gate G4. A FLOW system that damages
any core argument in any Critical Set item fails G4, regardless of how many
non-critical items pass.

---

## 4. Gray areas requiring senior adjudication

- GRAY-1: Copula constructions where the repair changes a predicate noun to a
  predicate adjective — `nsubj` stays, but `obj` may become `nmod`. Escalate.
- GRAY-2: Repairs that change `zu + infinitive` from one attachment site to
  another — could be DRIFT-2.2 (same function) or DRIFT-2.4 (function change).
  Escalate.
- GRAY-3: Tokenization splits that move a prefix from one token to another —
  the prefix's DEPREL may become `compound:prt` rather than `dep`. Escalate.

---

## 5. Annotation procedure

1. Annotator receives a pair `(baseline_conllu, candidate_conllu)` with
   `edges_changed` pre-computed by the diff tool.
2. For each entry in `edges_changed`, annotator assigns a DRIFT-2.x class.
3. Item label:
   - If all entries ∈ {DRIFT-2.1, DRIFT-2.2, DRIFT-2.3}: `drift_allowed = true`.
   - If any entry = DRIFT-2.4: `drift_allowed = false`, `critical = false`.
   - If any entry = DRIFT-2.5: `drift_allowed = false`, `critical = true`.
   - If any entry = DRIFT-2.6: `drift_allowed = false`, `critical = false`.
4. `drift_reason` must cite the DRIFT-2.x code (e.g., `DRIFT-2.5`) plus one
   free-text sentence. Citations-only without explanation are rejected.

---

## 6. What remains [TBD]

| Decision | Blocking what | Owner |
|---|---|---|
| GRAY-1 copula treatment | items involving copula repairs | [TBD] |
| GRAY-2 `zu`-infinitive attachment | items involving infinitive splits | [TBD] |
| GRAY-3 prefix split tokenization | items involving compound splits | [TBD] |
| Frozen UD-German DEPREL inventory | DRIFT-2.1/2.2 class assignment | `ANNOTATION_POLICY_DEPREL.md` (not yet drafted) |
| Diff tool specification | pre-computation of `edges_changed` | engineer |

---

## 7. Relationship to ANNOTATION_POLICY_DEPREL.md

This policy depends on a frozen DEPREL inventory that does not yet exist.
The DRIFT-2.x class decisions in §2 are defined in terms of grammatical
functions (`nsubj`, `obj`, etc.) that are only meaningful relative to a
consistent DEPREL labeling scheme. If DEPREL consistency is low in the §3.1
gold data, DRIFT-2.4/2.5 classifications will be noisy.

`ANNOTATION_POLICY_DEPREL.md` is a prerequisite to FINAL status for this policy.
