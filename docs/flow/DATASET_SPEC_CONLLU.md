# Dataset Spec — Gold CoNLL-U (In-Domain German)

**Status:** DRAFT. Placeholders marked `[TBD]` require sign-off before collection starts.
**Contract:** `data/contracts/conllu_gold.schema.json`
**Rationale:** see `GRAPH_VALIDATION_MEMO.md` §3.1.

---

## 1. Purpose
Provide the only acceptable ground truth for any graph-based metric on FLOW
output. Without this set, LAS/UAS/bond-integrity numbers are unfalsifiable.

## 2. Scale and stratification
Total: **10 000 sentences**, German, drawn from FLOW's operating domain
(LRS-typical children's texts, informal colloquial German, web chat excerpts;
**not** Wikipedia, **not** newspaper). Stratification:

| Stratum | Count | Definition |
|---|---:|---|
| `no_touch` | 2 000 | sentence is orthographically clean OR deliberately informal; should not be rewritten |
| `ambiguity` | 2 000 | at least one token has ≥ 2 defensible correction targets |
| `hard_structural` | 1 000 | sentence length ≥ 25 tokens OR embedding depth ≥ 3 OR non-projective edge present |
| `routine` | 5 000 | remainder; standard repair cases |

Stratum tags are exposed in `MISC` as `stratum=…`.

## 3. Record-level schema
Every sentence is a CoNLL-U block obeying UD 2.x. Required per token:

| Column | Constraint |
|---|---|
| ID | 1-indexed contiguous; multiword tokens allowed per UD spec |
| FORM | source form verbatim; no normalization |
| LEMMA | required; `_` not accepted |
| UPOS | from UD universal tagset; no custom values |
| XPOS | STTS tagset; required |
| FEATS | `_` allowed only if token carries no inflection; empty string forbidden |
| HEAD | required integer; exactly one `0` per tree (root) |
| DEPREL | from the UD-German DEPREL inventory frozen in `ANNOTATION_POLICY_DEPREL.md` |
| DEPS | enhanced deps optional; if present must be internally consistent |
| MISC | required keys: `stratum`, `source_id`; optional: `notes` |

Comment lines:
- `# sent_id = <stable_id>` — required, unique, `^[A-Z]{2,4}-\d{6}$`
- `# text = <raw>` — required
- `# text_lang = de` — required
- `# annotator = <id>` — required
- `# source = <dataset_tag>` — required
- `# double_annotated = true|false` — required

## 4. Annotation protocol
- Each sentence annotated by exactly one primary annotator.
- **10 % of each stratum** is double-annotated by a second annotator. Adjudication
  by a third, senior annotator on disagreement.
- Agreement thresholds (measured on double-annotated subset, must pass for
  release):
  - UPOS agreement ≥ 0.98 (Cohen's κ).
  - HEAD agreement ≥ 0.93 (labeled attachment).
  - DEPREL agreement ≥ 0.92 (Cohen's κ).
- Annotators must use the DEPREL inventory frozen in
  `ANNOTATION_POLICY_DEPREL.md`. Unfrozen labels are rejected at validation.

## 5. Splits
- `train` : `dev` : `test` = 80 : 10 : 10, **stratified** on the stratum tag.
- Splits by `sent_id` hash, not random — reproducible across collection rounds.
- Test split is frozen at v1 and never re-used for model/rule tuning.

## 6. Validation (CI-blocking)
Three validators must pass:
1. `udapi` valid-tree check (projective or non-projective allowed; no cycles).
2. Schema check against `data/contracts/conllu_gold.schema.json` on the
   manifest that lists sentences per stratum.
3. Stratum counts meet the table in §2 within ±1 %.

## 7. Known-hard labeling decisions (must be resolved in policy first)
- `zu` + infinitive: `mark` vs `case`. [TBD — §4.1 of memo]
- Ditransitive dative: `obj` vs `iobj`. [TBD]
- Parataxis vs `conj` for loose coordination. [TBD]
- Quoted child speech: treat as `parataxis` or `ccomp`. [TBD]
- Ellipsis handling per UD-German guidelines revision. [TBD]

## 8. Out of scope
- Semantic roles.
- Discourse relations.
- Coreference.
- Lemmatization of multiword tokens beyond UD default behavior.

Adding any of these later is a dataset v2, not an amendment.
