# Dataset Spec — Source→Target Parallel Benchmark

**Status:** DRAFT.
**Contract:** `data/contracts/flow_parallel.schema.json`
**Rationale:** see `GRAPH_VALIDATION_MEMO.md` §3.2. Replaces the 12-item sample at
`data/benchmark/flow_benchmark_items.sample.jsonl` once populated; does not
redefine its schema.

---

## 1. Purpose
Measure, at statistically useful scale, whether FLOW repairs what it should
and leaves alone what it must. This set is the evidence source for gates
**G2** (no-touch accuracy) and **G3** (false-shift rate).

## 2. Scale and stratification
Total: **20 000 sentence pairs**, German, same domain as §3.1 of the CoNLL-U
spec. Stratification is by *category* inherited from the existing benchmark
spec (`docs/benchmark/FLOW_BENCHMARK_SPEC.md`):

| Category | Count | Definition (per existing spec) |
|---|---:|---|
| A — orthographic core | 6 000 | non-word / Dehnung / Schärfung / sentence-internal capitalization |
| B — orthography-adjacent morph surface | 4 000 | participle surface, ending surface, `zu`-infinitive surface |
| C — contextual / real-word confusion | 4 000 | `das`/`dass`, `seit`/`seid`, `wider`/`wieder`, homophones |
| D — no-touch | 6 000 | deliberate informal / code-mix / fragment / quoted nonstandard |

Counts are **minimums per release**; oversampling allowed, under-sampling is a
release blocker.

## 3. Record schema (per JSONL line)
Fields (all required unless marked *optional*):

| Field | Type | Constraint |
|---|---|---|
| `id` | string | `^FLOW-[ABCD]-\d{6}$` |
| `category` | enum | `A` / `B` / `C` / `D` |
| `subtype` | string | stable vocabulary; list frozen per category |
| `source_sentence` | string | verbatim input |
| `primary_gold_target` | string | the target FLOW should produce on a single pass |
| `alternative_targets` | array<string> | *optional*; each string is an independently acceptable target |
| `required_edits` | array<Edit> | edits that MUST occur for the prediction to count as repaired |
| `optional_edits` | array<Edit> | edits allowed but not required; presence never harmful |
| `forbidden_edits` | array<ForbiddenEdit> | edits that MUST NOT occur |
| `no_touch` | bool | true iff the entire sentence must be returned unchanged |
| `ambiguity_flag` | bool | true iff the item appears in a `C`-style ambiguity set |
| `difficulty` | int | 1–5 |
| `tags` | array<string> | free; used only for slicing |
| `notes` | string | *optional*; human-readable rationale |

`Edit` subschema:
```
{ "edit_id": string,
  "level":   "char" | "token" | "span",
  "start":   int, "end": int,
  "source":  string, "target": string,
  "type":    enum,  // spelling | dehnung | capitalization | morph_surface |
                    // token_split | token_merge | real_word_context |
                    // punctuation_minor
  "boundary_scope": enum  // orthographic_core | orthography_adjacent | contextual
}
```

`ForbiddenEdit` subschema:
```
{ "constraint_id": string,
  "start": int, "end": int,
  "pattern": string,  // descriptive; not a regex
  "reason":  enum     // grammar_shift | style_normalization |
                     // semantic_rewrite | register_formalization
}
```

## 4. Annotation protocol
- Two independent annotators per item; disagreement resolved by senior annotator.
- Agreement metric: **exact-match on `required_edits` and `forbidden_edits` sets**,
  not on `primary_gold_target`. Target agreement ≥ 0.90 (Jaccard).
- Policy dependencies:
  - `no_touch` labels bound by `ANNOTATION_POLICY_NOTOUCH.md`.
  - `ambiguity_flag` and `alternative_targets` bound by `ANNOTATION_POLICY_AMBIGUITY.md`.
  - Category assignment bound by `ANNOTATION_POLICY_STYLE_BOUNDARY.md`.

## 5. Splits
- `dev` : `test` = 50 : 50, stratified on `category × subtype`.
- **No train split.** This set is evaluation-only. Rule changes that iteratively
  fit to `dev` must be reported; test must never be consulted during development.

## 6. Validation (CI-blocking)
1. JSON Schema validation against `flow_parallel.schema.json`.
2. Stratum counts meet §2 minimums.
3. For every `required_edit`, applying it to `source_sentence` yields a string
   present in `{primary_gold_target} ∪ alternative_targets`.
4. For every `forbidden_edit`, the declared span intersects `source_sentence`
   validly.
5. If `no_touch == true`: `required_edits` and `optional_edits` are empty, and
   `primary_gold_target == source_sentence`.

## 7. Relationship to CoNLL-U gold (§3.1)
A subset ≥ 5 000 of these items must have a matching CoNLL-U annotation of
both `source_sentence` and `primary_gold_target`, linked by `source_id` in the
CoNLL-U `MISC` field. This subset is the only evidence source for graph-side
metrics (G4 baseline, G5 stability).
