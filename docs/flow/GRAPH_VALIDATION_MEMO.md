# FLOW Graph Validation Memo

**Scope:** release-readiness review of FLOW's *graph-aware* normalization claim.
**Status date:** 2026-04-16
**Audience:** FLOW maintainers, reviewers, internal validators.

This memo is written to prevent self-deception, not enable it. Read the Executive
Verdict before anything else.

---

## 1. Executive Verdict

### 1.1 What is actually in the repo (verified by file inspection, HEAD `be5f9ca`)

**Implemented mechanics (exist as code and run):**
- Regex-based staged normalization pipeline: `PUNCT → CTX → SN → SL → MO → PG → GR → POST`
  (`packages/flow/src/ruleEngine.js`, `packages/flow/src/pipeline.js`).
- Protected-span masking for code/URLs/all-caps tokens.
- LOOM structural labeler (`packages/loom/src/structuralState.js`) producing discrete
  states (`stabil`, `konfliktaer`, `fragmentiert`, …) used as a confidence hint for
  context rules.
- Rule-hit bookkeeping per stage; learned-exception + context-rule store
  (`flowRulesStore.js`); lexicon/corpus fallback (`lexiconFallback.js`).
- Edit-centric benchmark scorer consuming JSONL predictions
  (`scripts/benchmark/score_flow_benchmark.py`).

**Validated capability (evidence exists in tests):**
- Idempotent rule application on a 200-sentence LRS random batch
  (`packages/flow/test/test_random_lrs_batch.js`) — proves mechanical stability of
  regex substitution, not linguistic correctness.
- 33/33 rule-debug checks (`packages/flow/test/test_rules_debug.js`) — proves
  individual rules match the strings they were written to match; tautological.
- 8/12 exact matches on the 12-item benchmark sample — sample size too small for
  any statistical claim.

**Unproven assumptions — flagged explicitly:**
- There is **no in-domain CoNLL-U gold set** in the repo.
- There is **no graph construction code** in the repo (see §1.2).
- There is **no drift-baseline corpus** and **no drift acceptability policy**.
- Multi-pass stability is verified only for the regex pipeline, not for any graph.
- The benchmark spec (`docs/benchmark/FLOW_BENCHMARK_SPEC.md`) references
  "Node Preservation" and "Graph Repair Success" as private metrics 12 and 13;
  these are consumed as prediction-side metadata fields
  (`meta.repairable_graph`, `meta.improved_graph`) — the scorer does not compute
  them, and no code in the repo computes them either.

### 1.2 Critical finding — cited artifacts do not exist

The originating brief references six files as "repository evidence":

| Cited path | Exists in HEAD? | Exists in git history? |
|---|---|---|
| `packages/flow/src/conllGraph.js` | **No** | No |
| `packages/flow/src/pipeline.js` | Yes | Yes |
| `packages/flow/test/test_bond_drift_report.js` | **No** | No |
| `packages/flow/test/test_multi_pass_stability.js` | **No** | No |
| `packages/flow/test/test_conll_graph.js` | **No** | No |
| `scripts/benchmark/score_flow_benchmark.py` | Yes | Yes |

Four of the six files are absent. No `compareBondIntegrity` function exists
anywhere in the source tree. There is no dependency-graph builder. There is no
bond/drift comparator. This is not a naming difference — `grep -r` across the
monorepo for `conll`, `DEPREL`, `bondDrift`, `compareBondIntegrity` returns zero
matches in production code.

**Consequence:** any discussion of "graph-aware" FLOW behavior at this moment
is a discussion of an unimplemented system. The rest of this memo therefore
treats "graph logic" as a prospective component whose acceptance criteria must
be fixed *before* anyone writes it, not after.

### 1.3 Blunt summary

- Present and working: regex pipeline with auxiliary structural labels.
- Present and unvalidated beyond tautology: rule coverage, LOOM labels.
- Absent entirely: CoNLL graph, bond-drift report, graph-driven decision logic,
  matching test suite, the datasets any of the above would be validated against.

Do not describe FLOW as "graph-aware" in release materials until §6 gates pass.

---

## 2. Current State Assessment

### 2.1 What the pipeline does today
`pipeline.js::runCorrection` resolves language/rules, checks for a learned
exception or context rule (exact-string or substring match), otherwise calls
`ruleEngine.js::runNormalizationWithMetadata`. That function:
1. Runs protected-span detection.
2. Optionally calls LOOM `diagnoseText` + `flowSignals` to compute a
   `confidenceHint` ∈ {`low`, `medium`, `high`} — used only to raise minimum
   confidence for context-window rules.
3. Applies regex rule packs in fixed order on unprotected text slices.
4. Normalizes whitespace and sentence-initial capitalization.
5. Optionally consults corpus-pair / lexicon fallbacks if the pipeline produced
   no textual change.

Decisions are made entirely by regex + fallback lookup. LOOM labels modulate
context-rule activation thresholds; they never override or replace a rule
outcome.

### 2.2 What "graph construction" currently amounts to
Nothing in the normalization path. The closest analogue is
`packages/spin/src/nodes.js::createGraph` — a generic SPIN story-graph helper
operating on an unrelated domain object model. It has no CoNLL-U input, no
dependency relations, and is not imported by FLOW.

### 2.3 What the benchmark scorer actually measures
`score_flow_benchmark.py` computes character-level edit diffs
(`difflib.SequenceMatcher`) between `source` and `prediction`, classifies them
against required/optional/forbidden edit sets declared on benchmark items, and
aggregates per category. Node-preservation and graph-repair metrics are read
from prediction `meta` fields; the scorer trusts them. Nothing in-repo produces
those fields.

### 2.4 What the current tests prove and do not prove
- `test_random_lrs_batch.js`: that running regex rules on 200 noisy sentences
  produces *some* change for each. Proves: mechanism fires. Does **not** prove:
  changes were correct.
- `test_rules_debug.js`: that each of 33 hand-written regex rules matches its
  hand-written input. Proves: rule authored as written. Does **not** prove:
  rule is semantically correct or non-overtriggering.
- Benchmark sample (12 items, 8 exact): that the pipeline handles the specific
  errors the sample was written to probe. Does **not** prove: category coverage
  at any scale; statistical stability; or generalization.

No repo test today measures false-positive rate, no-touch accuracy, false-shift
rate, multi-pass stability across graph states, or bond drift.

---

## 3. Data Prerequisites

Three distinct datasets are required before any "graph-aware" claim is
defensible. None are currently present.

### 3.1 Gold CoNLL-U (in-domain German)
Concrete spec: `docs/flow/DATASET_SPEC_CONLLU.md`.
Contract schema: `data/contracts/conllu_gold.schema.json`.

Summary: 10 000 sentences, full UD 2.x columns (ID, FORM, LEMMA, UPOS, XPOS,
FEATS, HEAD, DEPREL, DEPS, MISC). Stratified with minima of 2 000 no-touch /
2 000 ambiguity / 1 000 hard-structural. Double-annotation on ≥10% with
agreement thresholds listed in the spec.

### 3.2 Source→Target Parallel Benchmark
Concrete spec: `docs/flow/DATASET_SPEC_PARALLEL_BENCHMARK.md`.
Contract schema: `data/contracts/flow_parallel.schema.json`.

Summary: 20 000 pairs, schema aligned with existing sample
(`data/benchmark/flow_benchmark_items.sample.jsonl`) plus `alternative_targets`,
`required_edits`, `forbidden_edits`, `no_touch` as first-class fields.
Per-category minima defined in the spec.

### 3.3 Bond-Drift Baseline Corpus
Concrete spec: `docs/flow/DATASET_SPEC_BOND_DRIFT.md`.
Contract schema: `data/contracts/bond_drift.schema.json`.

Summary: 2 000 labeled `(baseline_conllu, candidate_conllu)` pairs with a
binary `drift_allowed` label and a free-text `drift_reason`. Prerequisite:
the *classification policy* from §4.5 must exist before labeling begins.

---

## 4. Annotation Policy Requirements

Scaling annotation without written policy scales noise at the same rate as
coverage. The following policy documents are prerequisites to labeling work,
not deliverables after it.

### 4.1 DEPREL consistency
Document: `docs/flow/ANNOTATION_POLICY_DEPREL.md` (**not drafted — listed as
a gap in §7; requires a UD-experienced annotator lead**).

Must decide: which of the well-known UD ambiguity sets the project resolves
one way rather than both (`obj` vs `iobj` with dative, `advcl` vs `xcomp` for
`zu`-infinitives, `parataxis` vs `conj` for loose juxtapositions, `mark` vs
`case` for German `um…zu`). Must freeze a version of the German UD guidelines
as the reference.

### 4.2 No-touch
Document: `docs/flow/ANNOTATION_POLICY_NOTOUCH.md` (drafted stub).

Must decide: what counts as a deliberate informal register, what counts as a
structural error that happens to look informal, and which markers are
non-negotiable no-touch (ellipsis as pause, code-mix, intentional lowercase,
fragment replies, quoted nonstandard material).

Cannot be left to annotator intuition.

### 4.3 Ambiguity
Document: `docs/flow/ANNOTATION_POLICY_AMBIGUITY.md` (drafted stub).

Must decide: when two targets are both defensible, whether the item carries an
`alternative_targets` array, an `ambiguity_flag`, both, or is excluded. Must
fix a policy for the `das / dass`, `wider / wieder`, `seit / seid` confusion
sets — whether abstention counts as success, correction counts as success, or
both score equally under a tolerance margin.

### 4.4 Style vs orthography boundary
Document: `docs/flow/ANNOTATION_POLICY_STYLE_BOUNDARY.md` (not drafted — see §7).

Must decide: which orthographic classes are in-scope (non-word, Dehnung,
Schärfung, capitalization of nouns, hard compound spelling) and which surface
patterns that look orthographic are actually grammar/style (subjunctive form,
tense change, valency rewrite, register normalization).

### 4.5 Drift acceptability
Document: `docs/flow/ANNOTATION_POLICY_DRIFT.md` (drafted stub).

Must decide: the dependency-edit taxonomy for allowable drift (e.g., a changed
`HEAD` that preserves the predicate-argument structure of the clause is
allowable; a changed `HEAD` that re-attaches a subject is not). Without this,
§3.3 cannot be labeled.

---

## 5. Hard Acceptance Metrics

Concrete operationalization in `docs/flow/RELEASE_GATES_GRAPH.md`.

**Primary (graph milestone release blockers):**

1. **No-touch Accuracy** — on the no-touch subset of §3.2, fraction of items
   where `prediction == source` exactly (after whitespace trim). Target ≥ 0.97.

2. **False-shift Rate** — on the full §3.2 set, fraction of items where any
   applied edit intersects a span with a forbidden-edit reason in
   {`grammar_shift`, `style_normalization`, `semantic_rewrite`,
   `register_formalization`}. Target ≤ 0.02.

3. **Bond-Drift Violation Rate (Critical Set)** — on the "drift_not_allowed"
   subset of §3.3, fraction of items where any dependency edge differs between
   baseline and candidate CoNLL-U. Target = 0.

4. **Multi-pass Stability** — for every item in §3.2 and §3.3, two pipeline
   runs must produce identical output text and (once the graph builder exists)
   identical `bond_id` lists. Target = 100 %.

**Secondary (reported but not blocking at this milestone):**
- Edit Precision / Edit Recall / F₀.₅ (already definable on §3.2).
- Overcorrection Rate = (applied edits outside required ∪ optional) / applied edits.
- No-op Accuracy = P(no change | all required edits empty and all forbidden edits present).
- Minimality = mean character-level edit-distance ratio on correctly-repaired items.

Promotion from secondary to primary requires a separate review; none of the
secondaries gate this milestone on their own.

---

## 6. Go / No-Go Gate

See `docs/flow/RELEASE_GATES_GRAPH.md` for the binding table. Summary:

| # | Criterion | Threshold | Evidence source | Fail condition |
|---|---|---|---|---|
| G1 | Graph builder implemented | working code + contract tests | `packages/flow/src/conllGraph.js` + `tests/contracts/*` | file missing OR contract tests fail |
| G2 | No-touch Accuracy | ≥ 0.97 | §3.2 no-touch subset run | < 0.97 on ≥ 2 000 items |
| G3 | False-shift Rate | ≤ 0.02 | §3.2 full set | > 0.02 |
| G4 | Bond-Drift Critical violations | = 0 | §3.3 critical subset | ≥ 1 violation |
| G5 | Multi-pass Stability | 100 % | re-run of §3.2 + §3.3 | any diff in text or bond_ids |
| G6 | Annotation policies frozen | all of §4 exist and are signed off | `docs/flow/ANNOTATION_POLICY_*.md` | any required policy absent or tagged DRAFT |
| G7 | Datasets at size | §3.1 ≥ 10 000; §3.2 ≥ 20 000; §3.3 ≥ 2 000 | corpus manifest | any below target |

"Interesting graph behavior" does not count. Anecdotal improvement on a dozen
sentences does not count. A green unit-test suite over fictitious inputs does
not count.

---

## 7. Gap Analysis

| Gap | Category | Why it matters | False confidence it would otherwise create |
|---|---|---|---|
| `conllGraph.js` does not exist | code | there is no graph to reason about | that "FLOW is graph-aware" in any sense |
| `compareBondIntegrity` does not exist | code | drift cannot be measured | that drift analysis is live |
| No CoNLL-U gold in-domain | data | graph output cannot be scored | that LAS/UAS are implicitly acceptable |
| No source→target parallel set at size | data | no-touch / false-shift rates cannot be estimated | that benchmark-sample score generalizes |
| No bond-drift baseline corpus | data | G4 is unmeasurable | that drift logic, once written, is correct |
| No DEPREL consistency policy | policy | gold annotation will be internally inconsistent | that annotator agreement scores mean anything |
| No no-touch policy | policy | no-touch labels conflate intent categories | that G2 measures what its name suggests |
| No ambiguity policy | policy | `alternative_targets` will be used inconsistently | that recall metrics are comparable across items |
| No style-boundary policy | policy | category A/B/C boundaries drift by annotator | that category-level scores are comparable |
| No drift-acceptability policy | policy | G4 cannot be labeled | that any drift threshold is defensible |
| No contract tests over schemas | tests | malformed data can enter pipeline silently | that pipeline inputs are typed |
| No multi-pass stability test over graphs | tests | G5 is unmeasurable | that repeated runs match beyond text |
| No overcorrection test harness | tests | regressions in forbidden-edit behavior go unseen | that adding rules is always safe |
| No release-gate script | release | gate values live in a README, not in CI | that `npm test` green means "shippable" |

---

## 8. Repo-Ready Artifact Plan

Files created by this memo (draft or stub, each clearly marked):

| Path | Purpose | State |
|---|---|---|
| `docs/flow/GRAPH_VALIDATION_MEMO.md` | this memo | complete |
| `docs/flow/DATASET_SPEC_CONLLU.md` | CoNLL-U gold schema + splits | draft |
| `docs/flow/DATASET_SPEC_PARALLEL_BENCHMARK.md` | source→target schema + splits | draft |
| `docs/flow/DATASET_SPEC_BOND_DRIFT.md` | baseline/candidate schema + labels | draft |
| `docs/flow/RELEASE_GATES_GRAPH.md` | binding release-gate table | draft |
| `docs/flow/ANNOTATION_POLICY_NOTOUCH.md` | no-touch labeling policy | stub |
| `docs/flow/ANNOTATION_POLICY_AMBIGUITY.md` | ambiguity handling policy | stub |
| `docs/flow/ANNOTATION_POLICY_DRIFT.md` | drift acceptability policy | stub |
| `data/contracts/conllu_gold.schema.json` | JSON Schema for §3.1 manifests | stub |
| `data/contracts/flow_parallel.schema.json` | JSON Schema for §3.2 items | stub |
| `data/contracts/bond_drift.schema.json` | JSON Schema for §3.3 pairs | stub |

Files *not* created by this memo but tracked as required before G1–G7 can close:

| Path | Reason absent |
|---|---|
| `packages/flow/src/conllGraph.js` | needs a CoNLL-U ingestor and a relation builder; neither of which should be written before §4.1 policy is signed off |
| `packages/flow/test/test_conll_graph.js` | dependency of above |
| `packages/flow/test/test_bond_drift_report.js` | dependency of §3.3 and §4.5 |
| `packages/flow/test/test_multi_pass_stability.js` | meaningful only after the graph exists; a text-only multipass check is trivially green today and would be misleading |
| `docs/flow/ANNOTATION_POLICY_DEPREL.md` | requires a UD-experienced annotator lead |
| `docs/flow/ANNOTATION_POLICY_STYLE_BOUNDARY.md` | requires a FLOW-scope review with at least one linguist |
| `scripts/release/check_gates.py` | binds §6 to CI; write once G7 datasets exist |

---

## 9. Adversarial Conclusion

**What can be claimed today**
- FLOW is a staged regex pipeline with learned-exception / lexicon fallback and
  a structural-label advisor.
- It is idempotent on the 200-sentence random LRS batch it is tested against.
- It repairs 8 of 12 errors on its current 12-item benchmark sample and leaves
  one explicitly-no-touch item alone.

**What cannot be claimed today**
- That FLOW is "graph-aware" or "graph-driven" in any operational sense.
- That FLOW's no-touch accuracy is high in aggregate. It has never been measured
  on more than twelve sentences.
- That FLOW's false-shift rate is under any particular threshold.
- That any drift measurement, bond-integrity measurement, or multi-pass graph
  stability measurement has ever been performed.

**Minimum evidence that would upgrade the claim**
1. `conllGraph.js` exists and passes contract tests over the §3.1 schema.
2. Signed-off annotation policies from §4.2, §4.3, §4.5.
3. One run of the scorer on a §3.2 set of ≥ 2 000 items showing G2, G3 met.
4. One run of the drift comparator on a §3.3 set showing G4 met.
5. A re-run of all of the above producing identical output and identical
   `bond_id` lists (G5).

Until all five are in the repo, "graph-aware" is aspiration, not description.
