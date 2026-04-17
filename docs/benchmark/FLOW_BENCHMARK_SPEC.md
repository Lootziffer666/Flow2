# FLOW Benchmark Redesign Spec (v1)

## 1) Benchmark philosophy

Sentence-level `gold/partial/failed` is too coarse for FLOW because:
- one sentence can contain multiple independent repair opportunities;
- a system can correctly fix 2 of 3 edits and still be meaningful progress;
- a no-touch sentence is a true success if FLOW correctly abstains;
- sentence exactness over-rewards rewriting behavior that FLOW should avoid.

### Evaluation priorities (ordered)
1. **Correct repair** of required orthographic edits.
2. **Non-invasiveness** on untouched and style-preserving spans.
3. **Minimality**: do exactly what is needed, no gratuitous rewrite.
4. **Stability / idempotence**: second pass should not keep changing text.
5. **Boundary discipline**: avoid grammar/style drift outside orthographic scope.

### FLOW success definition
A sentence is successful when FLOW applies required orthographic repairs and avoids forbidden or unnecessary changes. Full sentence exact match is a bonus, not the primary truth signal.

---

## 2) Test classes

### A. Orthographic Core
Includes only clear orthographic targets with strong lexical certainty:
- misspellings / non-words (`Feler`→`Fehler`)
- Dehnung/length (`faren`→`fahren`)
- Schärfung (`komen`→`kommen`)
- capitalization (`ich mag berlin`→`ich mag Berlin`)
- simple split/merge (`zu hause`↔`zuhause` where context is clear)

Excludes grammar rewrites (word order, tense selection, agreement reanalysis).

### B. Orthography-Adjacent Morph Surface Cases
Allowed: spelling-like fixes that touch morphology-shaped surfaces:
- participle-like spellings (`gehn`→`gehen`, if listed as required/optional)
- ending spelling surfaces (`interresant`→`interessant`)
- infinitive-with-zu surface spacing/hyphenation where orthographic rule is explicit

Not allowed:
- broad conjugation corrections (`ich gehst`→`ich gehe`)
- syntactic grammar rewrites
- stylistic formalization

### C. Contextual / Real-Word Boundary Cases
Cases where source token is a valid word but wrong in context (`seid/seit`, `das/dass`, `wider/wieder`).
- Must be explicitly marked `ambiguity_flag` when multiple plausible repairs exist.
- If confidence is low and ambiguity unresolved, abstention can be preferred.
- Scoring supports alternative acceptable targets and optional edits.

### D. Non-Invasiveness / Do-Not-Touch Cases
Cases where correction should not happen:
- ellipses / fragments
- deliberate informal writing
- multilingual traces / code-switching
- idiomatic deviations
- intentional style breaks

Success here is correct non-intervention.

---

## 3) Annotation model for benchmark items

Each item uses one JSON object with fields:

- `id` (string)
- `category` (`A|B|C|D`)
- `subtype` (string)
- `source_sentence` (string)
- `primary_gold_target` (string)
- `alternative_targets` (array[string], optional)
- `required_edits` (array[Edit])
- `optional_edits` (array[Edit])
- `forbidden_edits` (array[EditConstraint])
- `no_touch` (boolean)
- `ambiguity_flag` (boolean)
- `difficulty` (integer 1..5)
- `difficulty_factors` (object)
- `notes` (string)

`Edit`:
- `edit_id`, `level` (`token|char|span`), `start`, `end`, `source`, `target`, `type`, `boundary_scope`

`EditConstraint`:
- `constraint_id`, `start`, `end`, `pattern`, `reason`

---

## 4) Evaluation units

### Edit level (primary atomic unit)
Smallest meaningful unit = one annotated edit alignment.
- Count TP/FP/FN at edit level using span + target matching with normalization rules.

### Sentence level (secondary)
- Sentence Exact Match: predicted sentence equals any acceptable target.
- Sentence Repair Profile: `all_required_fixed`, `some_required_fixed`, `none_fixed`, plus `has_forbidden_change`.

### Corpus level (decision level)
Aggregate behavior must jointly capture:
- repair quality
- restraint on no-touch/ambiguous contexts
- stability across repeat runs

---

## 5) Core metrics

1. **Edit Precision** (higher better)
   - Correct predicted edits over all predicted edits.
   - Catches over-editing.

2. **Edit Recall** (higher better)
   - Correct predicted edits over all required edits.
   - Catches under-repair.

3. **F0.5** (higher better)
   - Precision-weighted harmonic mean for FLOW’s precision-first identity.
   - Penalizes reckless correction more than missed low-confidence fixes.

4. **Sentence Exact Match** (higher better, secondary)
   - Fraction of sentences exactly matching any accepted target.
   - Useful for regression snapshots, not primary optimization.

5. **Overcorrection Rate** (lower better)
   - Rate of edits that modify spans with no allowed change.
   - Catches unnecessary intervention in otherwise fine text.

6. **No-op Accuracy** (higher better)
   - On `no_touch=true` items: unchanged output rate.
   - Catches invasiveness on deliberate style/fragment cases.

7. **Minimality Score** (higher better)
   - Ratio of needed edits to total edits actually made.
   - Captures whether FLOW repairs with surgical scope.

8. **Stability / Idempotence** (higher better)
   - Running FLOW twice should produce same output as once.
   - Catches oscillations/chained rewrites.

9. **Invasiveness** (lower better)
   - Character-span footprint changed outside required+optional edit spans.
   - Distinct from Overcorrection: measures magnitude, not just event count.

10. **Repair Rate** (higher better)
    - Share of sentences with at least one required edit correctly fixed and no forbidden edits.
    - Shows practical progress even without full exact match.

11. **False-Shift Rate** (lower better)
    - Rate of boundary/class shifts into grammar/style territory.
    - Catches grammar-checker drift.

12. **Node Preservation** (higher better, private)
    - Preserved internal node bindings over expected bindings.
    - Catches structural damage in FLOW’s internal graph.

13. **Graph Repair Success** (higher better, private)
    - Number of graphs improved by repair over graphs that are repairable.
    - Catches systems that output text changes without improving structure.

---

## 6) Metric formulas

Let per-item:
- `G_req` = set of required edits
- `G_opt` = optional edits
- `P` = predicted edits extracted by diff(source, prediction)
- `M(e_p, e_g)` true if aligned span and target match under normalization policy
- `ForbiddenHit` true if prediction triggers forbidden constraint

At corpus level:
- `TP = count(e_p in P where exists e_g in G_req with M(e_p,e_g))`
- `FP = count(e_p in P not matching any e in (G_req ∪ G_opt))`
- `FN = count(e_g in G_req with no matching e_p)`

### Edit Precision
`EP = TP / max(TP + FP, 1)`

### Edit Recall
`ER = TP / max(TP + FN, 1)`

### F0.5
`F0.5 = (1+0.5^2)*EP*ER / max(0.5^2*EP + ER, 1e-12)`

### Sentence Exact Match
For item `i`, `SEM_i = 1` if `prediction_i` equals `primary_gold_target_i` or any `alternative_targets_i`, else 0.
`SEM = mean_i(SEM_i)`

### Overcorrection Rate
Define `illegal_edit_count_i = count(e_p in P_i not matching any required/optional edit span+target and not pure formatting-equivalent)`.
`OCR = sum_i(illegal_edit_count_i) / max(sum_i(|P_i|), 1)`

### No-op Accuracy
On set `N = {i | no_touch_i = true}`:
`NOA = unchanged_correct / max(total_correct,1)`

Where:
- `unchanged_correct = count(i in N where prediction_i == source_i)`
- `total_correct = |N|`

### Minimality Score
`MS = needed_edit_count / max(total_edit_count,1)`

Where:
- `needed_edit_count = TP`
- `total_edit_count = TP + FP`

Guardrail: Minimality is never interpreted alone. It is read together with Edit Recall so laziness (`total_edit_count=0`) does not pass quality gates.

### Stability / Idempotence
Let `once_i = FLOW(source_i)` and `twice_i = FLOW(once_i)`.
`IDEMP = count(i where twice_i == once_i) / total_items`

### Invasiveness
For each item, compute changed character positions `C_i` from source→prediction.
Compute allowed positions `A_i` as union of required+optional edit spans.
`inv_chars_i = |C_i \ A_i|`
`changed_chars_i = |C_i|`
`INV = sum_i(inv_chars_i) / max(sum_i(changed_chars_i),1)`

### Repair Rate
On items with `|G_req_i| > 0`:
`RR = count(i where req_fixed_i >= 1 and ForbiddenHit_i = false) / max(count(|G_req|>0),1)`

### False-Shift Rate
Define forbidden shift labels in annotation (`grammar_shift`, `style_normalization`, `semantic_rewrite`, `register_formalization`).
`FSR = wrong_target_hypotheses / max(total_cases,1)`

Counting rule: increment `wrong_target_hypotheses` once per case whenever at least one predicted edit leaves orthographic scope.

### Node Preservation (private structure metric)
`NP = preserved_bindings / max(expected_bindings,1)`

### Graph Repair Success (private structure metric)
`GRS = improved_graphs / max(repairable_graphs,1)`

---

## 7) Scoring philosophy

### Primary metrics (public, externally reported)
- Edit Precision
- F0.5
- Edit Recall
- Overcorrection Rate
- No-op Accuracy

### Primary metrics (private, architecture health)
- Node Preservation
- Graph Repair Success
- Stability / Idempotence
- Minimality Score
- False-Shift Rate

### Secondary metrics (track, not optimize first)
- Repair Rate
- Sentence Exact Match
- Invasiveness

### Dashboard-only metrics
- legacy `gold/partial/failed` buckets
- class-wise sentence pass summaries

Reason: public metrics keep FLOW comparable as a repair system; private metrics protect internal graph quality and boundary discipline. Sentence exactness remains visibility metric only.

---

## 8) Difficulty logic

Difficulty is computed, not guessed.

`difficulty_points =`
- `+1` if `required_edit_count >= 2`
- `+1` if includes split/merge
- `+1` if real-word contextual confusion
- `+1` if `ambiguity_flag = true`
- `+1` if overlapping edit types in same sentence
- `+1` if forbidden-edit temptation present
- `+1` if style-preservation pressure (`no_touch` with non-canonical surface)

Map to level:
- 0–1 → 1
- 2 → 2
- 3 → 3
- 4–5 → 4
- 6+ → 5

Store contributing booleans in `difficulty_factors` for auditability.

---

## 9) Benchmark composition (v1 internal)

Target size: **240 items**.

- Class A Orthographic Core: 80
- Class B Orthography-Adjacent Morph Surface: 50
- Class C Contextual/Real-Word Boundary: 50
- Class D Do-Not-Touch: 60

Cross-cut slices (overlapping tags):
- Ambiguity set: 30 (mostly C, some B)
- Hard-cases set (difficulty 4–5): 40
- Dedicated no-touch set: all 60 in D

Why this split:
- enough core signal for orthographic competence;
- strong restraint coverage to prevent checker drift;
- sufficient ambiguity and hard cases to test abstention logic.

---

## 10) Output format

Repository structure:

- `docs/benchmark/FLOW_BENCHMARK_SPEC.md`
- `docs/benchmark/METRICS_REFERENCE.md`
- `docs/benchmark/SCORING_RULES.md`
- `docs/benchmark/BENCHMARK_SCHEMA.json`
- `data/benchmark/flow_benchmark_items.sample.jsonl`
- `data/benchmark/flow_benchmark_predictions.sample.jsonl`
- `scripts/benchmark/validate_flow_benchmark.py`
- `scripts/benchmark/score_flow_benchmark.py`
- `scripts/benchmark/iterate_flow_scores.py`
- `data/benchmark/flow_benchmark_items.v1.jsonl` (future full set)
- `data/benchmark/examples/` (future curated examples)

Use JSONL (one item per line) for stream-safe ingestion and easy diff review.

---

## 11) Guardrails

Must never happen:
- benchmark rewards broad grammar rewrites;
- unnecessary rewrites increase score;
- correct abstention on ambiguous/no-touch gets penalized;
- one missed edit collapses sentence to total failure signal;
- ambiguity is hidden instead of encoded;
- style normalization is merged into orthographic repair success.

Operational guardrails:
- all contextual cases with unresolved ambiguity must include `alternative_targets` or optional-abstain note;
- no-touch items must contain explicit `forbidden_edits`;
- dashboard must show overcorrection and false-shift beside recall.

---

## 12) Final recommendation

Adopt an **edit-centric, restraint-aware benchmark**:
1. Measure public layer first: `Edit Precision`, `Edit Recall`, `F0.5`, `No-op Accuracy`, `Overcorrection`.
2. Measure private structure layer second: `Node Preservation`, `Graph Repair Success`, `Idempotence`, `Minimality`, `False-Shift`.
3. Show in dashboards: both layers + `Repair Rate`, `Sentence Exact Match`, class/difficulty breakdowns.
4. Run idempotence as mandatory second-pass check for every release candidate.
5. Keep hard cases as separate stress-set and do not let them dominate main score.
6. Optimize for: correct minimal repair with explicit boundary discipline.
7. Do not optimize for: generic sentence beautification, grammar polishing, or maximal rewrite coverage.

This keeps FLOW a repair engine: precise, conservative, stable.
