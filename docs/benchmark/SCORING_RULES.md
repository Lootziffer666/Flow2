# FLOW Scoring Rules (v1)

## 1. Edit extraction

1. Compute diff from `source_sentence` to `prediction`.
2. Convert diff into normalized edit objects (`start`, `end`, `source`, `target`).
3. Token-index and char-index both supported; canonical scorer uses char spans.

## 2. Edit matching

A predicted edit matches a gold edit when:
- span overlap is exact OR maps to same token span after normalization;
- replacement target matches expected target (case-sensitive unless item config sets case-insensitive);
- edit type is compatible (e.g., `capitalization` can match char-case flip).

Matching priority:
1. required edits
2. optional edits
3. otherwise FP

One predicted edit can satisfy at most one gold edit (greedy best match by exact span then longest overlap).

## 3. Optional edits

- Optional edits do **not** create FN when missing.
- Optional edits matched by prediction are counted as correct but not required.
- Optional edits never justify edits outside their annotated span.

## 4. Forbidden edits

If prediction triggers any `forbidden_edits` constraint:
- mark `ForbiddenHit = true` for the item.
- increment false-shift event if constraint reason is boundary shift (`grammar_shift`, `style_normalization`, etc.).

## 5. No-touch behavior

For `no_touch=true` items:
- expected prediction is exact source copy.
- any change contributes to overcorrection and invasiveness.
- exact copy counts toward `unchanged_correct` for No-op Accuracy (`unchanged_correct / total_correct`).

## 6. Ambiguity behavior

For `ambiguity_flag=true` items:
- accept `primary_gold_target` OR any `alternative_targets` for sentence-level exact match.
- required edits remain authoritative for edit metrics.
- if annotation indicates abstention-acceptable, zero-edit output is not penalized as FN for marked optional-only ambiguity items.

## 7. Corpus reporting blocks

Scorer must emit:
- public metrics block
- private structure metrics block
- per-class metrics (A/B/C/D)
- per-difficulty bucket metrics (1..5)
- ambiguity slice
- no-touch slice
- hard-case slice

Private structure block fields:
- `node_preservation = preserved_bindings / expected_bindings`
- `graph_repair_success = improved_graphs / repairable_graphs`
- `idempotence = unchanged_second_pass / total_cases`
- `minimality = needed_edit_count / total_edit_count`
- `false_shift_rate = wrong_target_hypotheses / total_cases`

## 8. Legacy dashboard mapping (dashboard-only)

For compatibility, derive:
- `gold`: sentence exact + no forbidden hit
- `partial`: at least one required edit fixed, not exact OR forbidden hit absent
- `failed`: zero required edits fixed on required-edit sentences OR severe forbidden hit

These buckets are descriptive only and cannot be the gating objective.

## 9. Praktische Reihenfolge (Runbook)

1. Build small goldset with explicit edits, no-op sentences, and boundary cases.
2. Score public metrics first for external comparability.
3. Score private structure metrics second to expose graph/node health.
4. Always run mandatory second-pass idempotence check.
5. Keep hard cases as a separate stress-set, not a dominant main-score slice.

## 10. CLI commands (repo-ready)

Validate schema + semantic sanity:

```bash
python scripts/benchmark/validate_flow_benchmark.py \
  --schema docs/benchmark/BENCHMARK_SCHEMA.json \
  --items data/benchmark/flow_benchmark_items.sample.jsonl
```

Score predictions against benchmark items:

```bash
python scripts/benchmark/score_flow_benchmark.py \
  --items data/benchmark/flow_benchmark_items.sample.jsonl \
  --predictions data/benchmark/flow_benchmark_predictions.sample.jsonl \
  --pretty
```

Run score iterations across multiple prediction files:

```bash
python scripts/benchmark/iterate_flow_scores.py \
  --items data/benchmark/flow_benchmark_items.sample.jsonl \
  --predictions data/benchmark/flow_benchmark_predictions.sample.jsonl \
  --predictions data/benchmark/flow_benchmark_predictions.sample.jsonl \
  --pretty
```
