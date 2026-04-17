# Annotation Policy — Ambiguity

**Status:** STUB. Must reach FINAL before labeling of §3.2 C-category items or
any item with `ambiguity_flag = true`.
**Scope:** defines when an item receives `ambiguity_flag = true`, how
`alternative_targets` are populated, and how scoring handles ambiguous items.
**Bound to:** `RELEASE_GATES_GRAPH.md` gate G6; `DATASET_SPEC_PARALLEL_BENCHMARK.md` §4.

---

## 1. Purpose

Ambiguous items are those where two or more correction targets are each
defensible from text evidence alone, without access to speaker intent or
broader document context. Mis-labeling ambiguous items as unambiguous inflates
false-positive counts and makes G3 (False-shift Rate) meaningless.

This policy must be resolved before scoring, because scorer behavior on
`ambiguity_flag = true` items differs from behavior on unambiguous items (see §5).

---

## 2. Ambiguity types and handling

### AM-1: Closed-set real-word confusions
Word pairs that are both valid German words and phonetically or orthographically
close, where the correct member cannot be determined from the token alone.

| Pair | Default label | Condition for unambiguous labeling |
|---|---|---|
| `das` / `dass` | `ambiguity_flag = true` unless verb in preceding clause is in the fixed verb set | Preceding verb is in `{dachte, gesagt, gewusst, gemerkt, gehört, glaube, glaubte, hoffte, wusste}` → `dass` required; no ambiguity flag |
| `seit` / `seid` | `ambiguity_flag = true` unless explicit pronoun in same clause | Explicit `Ihr` or `ihr` precedes the token in same clause → `seid` required; no ambiguity flag |
| `wider` / `wieder` | always `ambiguity_flag = true` | No local context is sufficient. Both `wider` (against) and `wieder` (again) are valid. Abstention scores equally with correction (see §5). |
| `den` / `denn` | context-dependent | If token-final position with preceding verb: `denn`. If determiner position: `den`. If not determinable: ambiguity flag. |
| `man` / `Mann` | context-dependent | Lowercase `man` after sentence-initial cap: indefinite pronoun. All-lowercase context: depends on clause type. Escalate if unclear. |

**Decision required [TBD]:** the `das/dass` verb set must be frozen and versioned.
Current set is provisional (from `rules.sn.js`). The policy must enumerate the
complete set and define the expansion procedure.

### AM-2: Capitalization with semantic disambiguation
Cases where capitalization changes the lexical class but both readings are
grammatically valid in context.

Example: `er hat recht` — `Recht` (law, noun) vs `recht` (right, adjective)
— both valid; annotate as ambiguous unless article or adjective immediately precedes.

**Decision required [TBD]:** define a complete list of high-frequency
ambiguous capitalization pairs in German and their resolution heuristics.

### AM-3: Structural / tokenization ambiguity
Cases where a merged or split form changes grammatical structure and both
structures are defensible.

Example: `zurückzukommen` vs `zurück zu kommen` — in FLOW's operating domain,
`zu + infinitive` splits are permitted orthographically, but both forms are
standard depending on register.

These items receive:
- `required_edits: []` (no mandatory edit)
- `optional_edits: [the split or merge]`
- `ambiguity_flag: true`

### AM-4: Abstention-preferred items
Items where a system that makes no change is scored equally or better than one
that makes the "probable" correction. These form a distinct subset of ambiguous
items.

Criterion: `required_edits` is empty AND `optional_edits` contains the probable
correction AND annotators agreed ≥ 2:1 that abstention is acceptable.

Scoring behavior: prediction equals `source_sentence` → full score on this item.
Prediction equals `primary_gold_target` → also full score.
Prediction is anything else → evaluated against `forbidden_edits`.

---

## 3. Escalation list — must not be resolved by single annotator

- Any item where two annotators disagree on whether `das` or `dass` is required
  and the verb is not in the frozen verb set.
- Any item where the capitalization distinction changes word class (AM-2).
- Any item tagged with both AM-1 and NT-1 (no-touch) — possible overlap of
  informal register with a real-word error.

---

## 4. Item structure for ambiguous items

```
{
  "no_touch": false,
  "ambiguity_flag": true,
  "required_edits": [],            // empty for AM-4; may be non-empty for AM-1/AM-2
  "optional_edits": [ <probable edit> ],
  "alternative_targets": [ <abstention = source_sentence | other valid form> ],
  "primary_gold_target": <most probable target, determined by majority annotator vote>
}
```

When `required_edits` is non-empty for an ambiguous item, the scorer treats it
as a required repair with tolerance for alternative targets.

---

## 5. Scoring behavior for ambiguous items

The benchmark scorer (`scripts/benchmark/score_flow_benchmark.py`) must be
extended with the following rule once this policy is final:

- If `ambiguity_flag = true` and `required_edits` is empty:
  - Prediction in `{source_sentence} ∪ alternative_targets ∪ {primary_gold_target}` → full score.
  - Any other prediction → evaluated against `forbidden_edits` only.
- If `ambiguity_flag = true` and `required_edits` is non-empty:
  - Evaluated as standard item, but `alternative_targets` expand the acceptable target set.

This extension is not currently implemented. It is a STUB requirement until this
policy is finalized.

---

## 6. What remains [TBD]

| Decision | Blocking what | Owner |
|---|---|---|
| Frozen `das/dass` verb set | AM-1 labeling | [TBD] |
| Capitalization ambiguity pair list | AM-2 labeling | [TBD] |
| Scorer extension for ambiguous scoring | G3 measurement validity | engineer |
| `wider/wieder` — whether abstention is always full-score | item weighting in §3.2 | [TBD] |
