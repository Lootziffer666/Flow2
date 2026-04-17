# Annotation Policy — No-Touch

**Status:** STUB. Must reach FINAL before any labeling of §3.2 D-category items begins.
**Scope:** defines when `no_touch = true` is assigned to a benchmark item.
**Bound to:** `RELEASE_GATES_GRAPH.md` gate G6; `DATASET_SPEC_PARALLEL_BENCHMARK.md` §4.

---

## 1. Purpose of this policy

`no_touch = true` is a first-class success condition for FLOW, not a fallback.
A prediction that changes a `no_touch` sentence is a **false positive by
definition**, regardless of whether the change is linguistically defensible.
This policy defines the exact class of inputs that must produce no change.

Without this policy, annotators apply inconsistent intuitions and G2
(No-touch Accuracy ≥ 0.97) measures an incoherent mixture of categories.

---

## 2. Binding no-touch classes

An item receives `no_touch = true` if and only if it belongs to **one or more**
of the following classes. Class membership is determined before any linguistic
analysis; it is a policy choice, not a correctness judgment.

### NT-1: Deliberate informal register
Text that is grammatically nonstandard but communicatively intentional in a
clearly informal register. Markers:
- Consistent lowercase throughout a multi-word utterance (not random casing).
- Colloquial contractions that are lexicalized in informal German: *n*, *mal*,
  *ne*, *nix*, *isses* as standalone utterances or consistent-register use.
- Register markers: *voll* as degree adverb before English loanwords,
  *krass*, *mega*, *halt* as discourse particle.

**NOT covered by NT-1:**
- Random or inconsistent lowercase that co-occurs with clear spelling errors
  (those are A-category repair candidates, not no-touch).
- Isolated informal lexemes inside an otherwise standard-German sentence that
  also contains a non-word spelling error.

### NT-2: Code-mixed / multilingual trace
Text containing deliberate use of a word from another language (most commonly
English) where that word is not a German borrowing. The non-German token must
be identifiable as intentional by local context or repeated pattern.
FLOW must not translate, substitute, or annotate such tokens.

Example: *Das war voll nice heute.* — "nice" is intentional.
Counter-example: *for der Tür* — "for" is a phonetic substitution for "vor";
this is a PG-layer error, not code-mix.

**Decision required [TBD]:** how to distinguish phonetic substitution of German
words using English letter sequences from genuine code-mix. Provisional rule:
if the token has a phonetically close German counterpart and the surrounding
context is otherwise German, treat as error; if the token is semantically
opaque without knowing the English word, treat as code-mix.

### NT-3: Fragment / ellipsis as deliberate incompleteness
Short utterances that are syntactically incomplete by conventional grammar but
complete as communicative acts: reply fragments, exclamations, topic-drops.
Markers:
- No verb present; utterance is a noun phrase or adverb phrase functioning as
  a complete turn.
- Sentence-final `...` or `–` used as a trailing-off marker (not a spelling error).
- Parenthetical asides `(...)`, `[...]` functioning as meta-comments.

**NOT covered by NT-3:** sentences that are incomplete due to truncation artifact
in the corpus (these should be excluded, not labeled no-touch).

### NT-4: Quoted or attributed nonstandard material
Text that is explicitly a quotation of a child's speech, a word-for-word
transcription, or an example of the error being discussed. The attribution
must be visible in the surrounding sentence or item annotation.

**Decision required [TBD]:** quoted speech embedded mid-sentence, where the
surrounding sentence itself contains repairable errors. Current provisional:
treat the quote span as protected (analogous to a protected-span in the
pipeline) and label only the surrounding text.

---

## 3. Non-binding considerations (must not determine label alone)

The following observations are relevant context but insufficient on their own to
assign `no_touch = true`:

- "The text reads naturally." Natural texts can still contain repair targets.
- "The author probably intended this." Intent cannot be verified from text alone.
- "Changing it would alter the meaning." Meaning-preservation is a correctness
  constraint, not a no-touch designation.

---

## 4. Edge cases requiring senior adjudication

The following case types must be escalated; annotators must not resolve them
independently:

- EC-1: Utterance belongs to NT-1 (informal) AND contains a clear non-word
  spelling error. Escalate — do not split the item.
- EC-2: Utterance is labeled NT-2 (code-mix) but the English token could also
  be a phonetic substitution (see §2, NT-2 decision required).
- EC-3: Utterance contains a deliberate sentence-initial lowercase token that
  is also a known LRS error pattern (e.g., sentence begins with *ich*).
  Provisional: if all other words in the sentence are also lowercase and the
  register is otherwise NT-1, label as no-touch. Otherwise label as D-adjacent
  ambiguity.

---

## 5. Consistency check at labeling time

A `no_touch = true` item must satisfy all of the following mechanically:
- `required_edits` is empty.
- `optional_edits` is empty.
- `primary_gold_target == source_sentence`.

If any of these fail, the no-touch label is incorrect. These are enforced by
the schema validator.

---

## 6. What remains [TBD]

| Decision | Blocking what | Owner |
|---|---|---|
| NT-2: phonetic substitution vs code-mix boundary | labeling of C/D overlap items | [TBD] |
| NT-4: quoted mid-sentence speech spans | labeling of nested-quote items | [TBD] |
| EC-1 resolution procedure | ~5 % of items estimated to land here | senior annotator lead |
