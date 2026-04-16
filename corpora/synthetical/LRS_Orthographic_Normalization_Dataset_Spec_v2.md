# LRS Orthographic Normalization Dataset Spec v2
Chat ID: chat-2026-04-16-lrs-zh1-zh2-dataset-spec-v2

## 1. Purpose

This document defines a new dataset specification for **German orthographic normalization** in the context of **LRS / dyslexia**, designed to be **informed by Litkey, Falko, and RUEG**, but not to imitate them blindly.

The goal is to produce a dataset that is:

- strict enough for reproducible annotation
- useful for rule-based, hybrid, and ML systems
- suitable for benchmarking
- explicit about scope boundaries
- robust against drift into grammar correction, stylistic rewriting, or semantic repair

This specification is intentionally written as a **working design memo**, not as a literature survey.

---

## 2. Design Principles

### 2.1 Core principle
The dataset is for **orthographic normalization**, not for broad correction.

### 2.2 Scope principle
The dataset must clearly distinguish between:

- **orthographic normalization**
- **grammar correction**
- **lexical substitution**
- **stylistic rewriting**
- **semantic repair**
- **register adaptation**

Only the first belongs to the primary task.

### 2.3 Dual target principle
The dataset contains two normalization targets:

- **ZH1** = conservative orthographic normalization
- **ZH2** = extended orthographic normalization

ZH2 is **not** a license for grammar correction.

### 2.4 Ambiguity principle
If the intended target cannot be recovered with sufficient confidence, the dataset must prefer:

- explicit uncertainty
- alternative hypotheses
- abstention

over forced certainty.

### 2.5 LRS relevance principle
The error model must prioritize phenomena that are particularly relevant for German LRS/dyslexia, while still allowing overlap with general orthographic acquisition data.

---

## 3. What is inherited from Litkey, Falko, and RUEG

### 3.1 Litkey-inspired components
Adopt:

- target-hypothesis logic
- strict separation of orthography from grammar
- character-level alignment between raw and normalized form
- strong focus on child writing and orthographic development
- orthographically relevant feature perspective

Do not adopt blindly:

- single-target-only design
- assumption that all relevant cases are word-level simple substitutions

### 3.2 Falko-inspired components
Adopt:

- stand-off or graph-friendly multilayer annotation design
- explicit separation of orthographic and grammatical layers
- clear distinction between identification and categorization

Do not adopt blindly:

- full L2 error architecture
- categories outside orthography unless explicitly added as secondary analysis layers

### 3.3 RUEG-inspired components
Adopt:

- strict “orthography-first, no broad grammar repair” boundary
- explicit policy-based treatment of reduced forms and variant-like spellings
- caution around over-normalization

Do not adopt blindly:

- spoken-language priorities where they conflict with the written LRS normalization task
- blanket exclusion of punctuation if punctuation is part of the orthographic benchmark design

---

## 4. Task Definition

### 4.1 Input
The dataset contains German written text from one or more of the following:

- children in school-age writing contexts
- adolescents
- adults with LRS/dyslexia
- mixed school and everyday writing contexts

### 4.2 Intended noise profile
The dataset targets:

- orthographic misspellings
- phonographic spellings
- segmentation problems
- capitalization instability
- punctuation instability
- morphographically relevant misspellings
- orthographically encoded real-word confusions, when policy permits

The dataset does **not** primarily target:

- syntax correction
- content repair
- style smoothing
- paraphrase
- readability simplification

### 4.3 Unit of annotation
The primary annotation unit is:

- document
- sentence
- token
- edit relation

Character-level alignment is required for corrected tokens or spans.

---

## 5. Hard Scope Boundary

This section is normative.

### 5.1 In scope
Allowed primary-task operations include:

- correction of misspelled word forms
- correction of capitalization
- correction of orthographic segmentation where the intended form is clear
- correction of standard German orthographic markers such as:
  - vowel length marking
  - consonant doubling
  - ie
  - Dehnungs-h
  - ß/ss
  - ck/tz
- correction of punctuation, but only according to the defined ZH1/ZH2 policy

### 5.2 Out of scope
Not allowed as orthographic normalization:

- changing tense
- changing person/number agreement
- changing case marking for grammatical reasons
- changing word order
- replacing one lexical item with another because it “sounds better”
- semantic completion of missing ideas
- stylistic elevation or simplification
- rewriting colloquial text into formal prose unless the change is explicitly classified as orthographic and allowed by policy

### 5.3 Borderline zone
The following require explicit policy decisions and may not be handled ad hoc:

- das/dass
- seit/seid
- wider/wieder
- den/denn
- reduced forms such as:
  - hab
  - nich
  - nen
  - ne
  - n
- punctuation beyond sentence-final punctuation
- orthographically plausible real-word errors

---

## 6. ZH1 and ZH2: Final Operational Definition

## 6.1 ZH1 = Conservative Orthographic Normalization

### Function
ZH1 provides the **minimal standard orthographic target** that corrects clear orthographic violations while avoiding grammatical or interpretive overreach.

### Rule
ZH1 makes the **smallest set of changes required** to produce a standard orthographic form, provided the intended target is sufficiently recoverable.

### Allowed in ZH1
ZH1 may correct:

- non-word misspellings with a clear intended target
- capitalization errors
- clear orthographic segmentation errors
- clear orthographic punctuation errors of the lowest-risk type
- clear phonographic spellings where the lexical target is recoverable
- orthographic markers such as:
  - Doppelkonsonanten
  - ie
  - Dehnungs-h
  - ß/ss
  - ck/tz

### Forbidden in ZH1
ZH1 may not:

- normalize reduced colloquial forms into fuller forms unless the reduced form itself is orthographically defective
- resolve grammatical real-word confusions purely from syntax
- change morphology beyond orthographic repair of the same intended form
- change lexical choice
- restore omitted function words unless omission is itself represented as an orthographic segmentation issue with high confidence
- add interpretive punctuation that requires syntactic reconstruction

### Punctuation in ZH1
Allowed:

- sentence-final punctuation, if clearly missing
- obvious repeated punctuation collapse when trivial

Not allowed by default:

- broad comma repair
- punctuation reconstruction requiring syntactic analysis

### Reduced forms in ZH1
ZH1 preserves reduced forms if they are **valid intended forms of the raw register** and are not merely misspelled.

Examples:

- `nich` -> may stay `nich` in ZH1 if the project treats it as reduced colloquial form rather than misspelling
- `gesehn` -> may become `gesehen` in ZH1 if classified as orthographic non-standard spelling with clear target
- `hab` -> stays `hab` in ZH1 unless explicitly misspelled relative to the target register policy

### Real-word confusions in ZH1
By default: **do not normalize**.

Examples:
- `seid` vs `seit`
- `das` vs `dass`

Reason:
These require grammatical disambiguation and introduce scope drift.

### Unclear intention in ZH1
If the intended target is not sufficiently clear:

- leave ZH1 empty or NULL
- attach uncertainty flag
- optionally attach alternative candidate list

---

## 6.2 ZH2 = Extended Orthographic Normalization

### Function
ZH2 provides a **stronger but still orthography-bounded normalization target**.

ZH2 exists to support systems that need a more resolved target than ZH1, while still avoiding full grammar correction.

### Rule
ZH2 may apply all ZH1 operations plus a restricted set of additional orthography-adjacent normalizations that are policy-defined and reproducible.

### Allowed in ZH2
ZH2 may additionally normalize:

- selected real-word confusions that are treated as orthographically encoded function-word errors and are contextually unambiguous
- selected reduced forms, if and only if the project policy explicitly classifies them as normalization targets
- a broader but still limited punctuation set
- standardized segmentation choices where standard orthography requires a preferred form

### Forbidden in ZH2
ZH2 still may not:

- perform broad grammatical correction
- repair agreement
- repair case based on syntax
- change sentence structure
- rewrite register freely
- substitute words for semantic plausibility
- expand colloquial language into a formal version without explicit orthographic policy

### Punctuation in ZH2
Allowed:

- sentence-final punctuation
- low-risk comma restoration in highly controlled cases, if the project includes punctuation as part of orthographic normalization
- normalization of obvious duplicated or malformed punctuation

Not allowed:

- full syntactic punctuation reconstruction

### Real-word confusions in ZH2
Allowed only if all three conditions hold:

1. the confusion type is explicitly whitelisted
2. the context is sufficiently unambiguous
3. the change stays within orthographic / function-word normalization policy

Recommended whitelist for possible ZH2 treatment:

- das/dass
- seit/seid
- wider/wieder

Optional, but not required.

### Reduced forms in ZH2
Only normalize reduced forms if the project adopts a **reduced-form normalization policy**.

Recommended strict policy:
- do **not** expand reduced forms such as `hab`, `nen`, `ne`, `nich` by default
- only normalize them if they are being treated as explicit orthographic targets in a dedicated variant layer

Reason:
Otherwise ZH2 slides into register normalization.

### Critical anti-drift rule for ZH2
ZH2 is **not** “make it look like polished standard German”.

ZH2 is:
- stronger orthographic normalization
- not stylistic cleanup
- not grammar repair
- not formalization

---

## 7. Decision Table: What belongs where

| Phenomenon | ZH1 | ZH2 | Notes |
|---|---:|---:|---|
| `färt` -> `fährt` | yes | yes | clear orthography |
| `imer` -> `immer` | yes | yes | clear orthography |
| `gesehn` -> `gesehen` | yes | yes | if treated as orthographic non-standard spelling |
| lowercase noun -> standard noun capitalization | yes | yes | standard orthography |
| missing final period | yes | yes | low-risk punctuation |
| broad comma reconstruction | no | maybe | only if project includes limited punctuation normalization |
| `das` -> `dass` | no | maybe | only if whitelisted and unambiguous |
| `seit` -> `seid` | no | maybe | only if whitelisted and unambiguous |
| `hab` -> `habe` | no | no by default | register/morphology drift risk |
| `nen` -> `einen` | no | no by default | grammar/register drift risk |
| `ich gehen` -> `ich gehe` | no | no | grammar correction |
| `Auto kaput` -> `Auto kaputt` | yes | yes | orthography |
| `wider` -> `wieder` | no | maybe | policy case |
| reordering words | no | no | out of scope |

---

## 8. Error Taxonomy for German LRS / Dyslexia

This taxonomy is intended for annotation and evaluation. Multiple labels may apply to one token or span.

### 8.1 PG_PHONO
Phonographic spelling.

Definition:
A spelling that reflects plausible sound-based encoding but not standard orthography.

Examples:
- `wale` for `Wahl`
- `fatar` for `Vater`

### 8.2 V_LEN
Vowel length marking error.

Definition:
The spelling incorrectly represents vowel quantity or the orthographic means used to represent it.

Examples:
- `Mite` for `Miete`
- `Ofen` vs `Offen` confusion when orthographically misencoded

### 8.3 C_DOUBLE
Consonant doubling error.

Definition:
Missing or superfluous doubled consonant.

Examples:
- `komen` for `kommen`
- `immerr` for `immer`

### 8.4 H_DEHN
Dehnungs-h error.

Definition:
Missing, added, or misplaced length-marking `h`.

Examples:
- `zan` for `Zahn`
- `sehn` depending on policy and target

### 8.5 IE_ERR
`ie` / simple vowel sequence error.

Examples:
- `libe` for `Liebe`
- `filen` for `fielen`

### 8.6 SS_SZ
`ss/ß` confusion.

Examples:
- `Strase` for `Straße`
- `muss` / `muß` type normalization contexts depending on standard policy

### 8.7 CK_TZ
`ck/tz` representation error.

Examples:
- `bakken`-like overgeneralization
- `plaz` for `Platz`

### 8.8 CAP
Capitalization error.

Subtypes may include:
- CAP_NOUN
- CAP_SENT
- CAP_NAME

### 8.9 SEG_SPLIT
Incorrect split of a word or unit.

Examples:
- `zu hause` when target policy requires `zuhause`
- `kennen lernen` depending on standard reference policy

### 8.10 SEG_MERGE
Incorrect merge.

Examples:
- `immerwieder`
- `indem` vs `in dem` requires caution and may be ambiguous

### 8.11 G_OMIT
Grapheme omission.

### 8.12 G_ADD
Grapheme addition.

### 8.13 ORD_TRANS
Order/transposition error.

Examples:
- `Fruend` for `Freund`

### 8.14 VIS_CONF
Visually similar grapheme confusion.

Examples:
- `b/d`
- `rn/m`
- `u/n`

### 8.15 MORPH_ORTH
Morphographically relevant misspelling.

Definition:
The problem lies in an orthographic realization of a morphological pattern, without turning the task into grammar correction.

Examples:
- plural or adjectival ending misspellings where the intended form is recoverable

### 8.16 FW_CONF
Function-word confusion.

Examples:
- `das/dass`
- `seit/seid`

Default:
annotateable, but not necessarily normalizable in ZH1.

### 8.17 PUNC
Punctuation instability.

Subtypes:
- PUNC_FINAL
- PUNC_COMMA
- PUNC_REPEAT
- PUNC_MALFORMED

### 8.18 MULTI
Multiple overlapping error types in one token or span.

Use only when individual sublabels are also attached or when the annotation UI requires a bundle marker.

---

## 9. Data Model

## 9.1 Required layers

### Layer A: Document
Fields:
- doc_id
- source_type
- elicitation_context
- collection_mode
- metadata block

### Layer B: Sentence
Fields:
- sent_id
- raw_sentence
- zh1_sentence
- zh2_sentence
- sentence-level uncertainty flags

### Layer C: Token
Fields:
- token_id
- raw_form
- token offsets
- base tokenization id

### Layer D: Alignment / edit
Fields:
- edit_id
- source span
- target span
- edit type
- level (ZH1 or ZH2)
- confidence
- ambiguity flag

### Layer E: Error labels
Fields:
- error label(s)
- label scope
- annotator
- comment

### Layer F: Alternative hypotheses
Only for ambiguous cases.

Fields:
- alt_id
- candidate form
- target level
- confidence or rank
- rationale code

---

## 9.2 Supported mappings

The model must support:

- 1:1 token normalization
- 1:n split
- n:1 merge
- span-level edits
- empty target for abstention
- multiple candidates in ambiguous cases

This means a plain parallel raw/clean string pair is not enough as the master format.

---

## 10. Master Annotation Schema

## 10.1 Sentence table
Required fields:

- doc_id
- sent_id
- raw_sentence
- zh1_sentence
- zh2_sentence
- zh1_status
- zh2_status
- sentence_comment

Recommended status values:

- OK
- PARTIAL
- AMBIG
- ABSTAIN

## 10.2 Token table
Required fields:

- doc_id
- sent_id
- token_id
- raw_form
- raw_start
- raw_end
- base_tok_id
- source_tokenization_version

## 10.3 Edit table
Required fields:

- edit_id
- doc_id
- sent_id
- level
- src_token_span
- tgt_token_span
- src_char_span
- tgt_char_span
- raw_segment
- norm_segment
- edit_type
- error_labels
- confidence
- ambiguity_flag
- rationale_code
- comment

Recommended `edit_type` values:

- NONE
- SUBST
- INS
- DEL
- SPLIT
- MERGE
- TRANS
- MULTI

## 10.4 Metadata table
Required fields:

- doc_id
- source_type
- elicitation_context
- collection_mode
- writer_age_band
- writer_grade_band
- writer_l1_status
- lrs_status
- region_variety
- annotation_version

Recommended value sets:

### source_type
- school_text
- dictation
- copy_task
- chat
- note
- test_item
- adult_everyday
- unknown

### collection_mode
- handwriting
- keyboard
- tablet
- transcribed
- unknown

### writer_age_band
- u10
- 10_12
- 13_15
- 16_18
- adult
- unknown

### writer_l1_status
- de_l1
- multilingual
- unknown

### lrs_status
- diagnosed
- suspected
- none
- unknown

---

## 11. Metadata Policy

### 11.1 Essential metadata
Collect if possible:

- age band
- school grade band
- source type
- collection mode
- elicitation context
- broad L1 status
- LRS status in coarse categories

### 11.2 Optional metadata
Possible:

- broad regional variety
- longitudinal wave
- institution code in anonymized form

### 11.3 Sensitive metadata
Use only if ethically justified and lawfully collected:

- diagnosis status
- support needs
- educational intervention status

Avoid detailed medical profiling unless absolutely necessary.

### 11.4 Avoid
Do not collect in the main benchmark dataset:

- full names
- exact addresses
- unnecessary family details
- excessive socioeconomic profiling
- precise school identifiers unless fully anonymized and justified

---

## 12. Sampling Strategy

### 12.1 Minimum balanced design
A useful first release should include:

- child school writing
- at least some adolescent or adult writing
- both elicited and more naturalistic text types
- both controlled and uncontrolled error environments

### 12.2 Recommended source mix
Include a mix of:

- picture-story or school narrative texts
- dictation-like texts
- free writing
- functional short texts
- spontaneous digital writing
- targeted phenomenon test items

### 12.3 Why mixed sampling matters
If the dataset contains only dictation:
- models may overfit to school-orthography patterns

If it contains only free digital writing:
- orthographic phenomena may be confounded with register and typing noise

If it contains only children:
- the benchmark may fail to represent adult LRS writing

---

## 13. Benchmark Design

## 13.1 Split policy
Use writer-disjoint splits.

No writer may appear across train/dev/test.

### 13.2 Required benchmark slices
At minimum:

- global test set
- hard-cases slice
- ambiguity slice
- segmentation slice
- punctuation slice
- function-word confusion slice
- phonographic slice

### 13.3 Difficulty levels
Recommended sentence or edit difficulty labels:

- EASY
- MEDIUM
- HARD
- EXTREME

Difficulty should not be guessed from intuition alone. It should be derived from factors such as:

- number of edits
- number of overlapping error types
- ambiguity
- segmentation complexity
- real-word confusion involvement

### 13.4 Metrics
Use at least:

- token exact match
- sentence exact match
- character error rate
- edit precision / recall / F1
- class-wise accuracy by error type

For ambiguity:
- allow multi-reference evaluation where appropriate
- or score primary plus acceptable alternatives

### 13.5 Evaluation against ZH1 and ZH2
Evaluate separately:

- ZH1 score
- ZH2 score

Do not collapse them into one target.

Reason:
A conservative system and an extended-normalization system solve different tasks.

---

## 14. File Format Recommendation

## 14.1 Primary working format
Use **JSONL** as the main implementation format.

Reason:
- flexible
- good for ML pipelines
- easy to version
- can carry nested edit structures
- easier than XML for engineering work

## 14.2 Corpus-analysis export
Provide a **CoNLL-style TSV export**.

Reason:
- convenient for annotation tools
- easy to inspect
- useful for token-level NLP workflows

## 14.3 Advanced interoperability export
Optional:
- CoNLL-RDF
- stand-off TEI/XML

Reason:
Best for graph-like relations, corpus querying, and complex split/merge annotation.

### Final recommendation
Do not use plain raw/clean text pairs as the master data model.

They may exist as convenience exports only.

---

## 15. Annotation Guidelines: Mandatory Decision Rules

This section is normative.

### Rule 1: Prefer orthographic interpretation over grammatical reinterpretation
If a token can be corrected as a straightforward orthographic error without reanalyzing the sentence grammatically, do that.

### Rule 2: Do not solve grammar unless the chosen target level explicitly permits a whitelisted orthography-adjacent case
This mainly affects ZH2 function-word confusions.

### Rule 3: If two or more plausible targets remain and context does not decide reliably, mark ambiguity
Do not silently guess.

### Rule 4: If the intended lexical target is not recoverable with sufficient confidence, abstain
Set target to NULL and mark uncertainty.

### Rule 5: Reduced forms require policy, not intuition
Do not expand colloquial reductions ad hoc.

### Rule 6: Punctuation beyond sentence-final marks requires policy, not personal style
Especially commas.

### Rule 7: Segmentations need explicit evidence
Do not merge or split aggressively if both interpretations are plausible.

### Rule 8: Character-level alignment must follow the chosen normalized segment, not an imagined intermediate step
Annotation must reflect the actual labeled target.

---

## 16. Borderline Cases

### 16.1 `das/dass`
- ZH1: do not normalize
- ZH2: normalize only if explicitly whitelisted and unambiguous

### 16.2 `seit/seid`
- ZH1: do not normalize
- ZH2: same restriction as above

### 16.3 `hab`
- ZH1: preserve
- ZH2: preserve by default

### 16.4 `nich`
Two valid project policies exist:

Policy A:
- treat as reduced colloquial form, preserve in both ZH1 and ZH2

Policy B:
- treat as orthographic non-standard form, normalize in ZH2 only

Recommended default:
Policy A, unless the dataset explicitly includes reduced-form normalization.

### 16.5 `gesehn`
Recommended:
- ZH1: `gesehen`
- ZH2: `gesehen`

Reason:
This is plausibly treated as orthographic contraction-like misspelling rather than grammar repair.

### 16.6 `nen`
Recommended default:
- preserve in ZH1
- preserve in ZH2

Reason:
expansion typically requires grammar/register interpretation.

### 16.7 Missing comma before subordinate clause
- ZH1: no
- ZH2: only if punctuation is in scope and the case is trivial and policy-approved

---

## 17. Minimal Viable Dataset

A realistic v1 should include:

- raw sentence
- ZH1 sentence
- ZH2 sentence
- token-level alignment
- edit-level labels
- core error taxonomy
- uncertainty flags
- basic metadata

Core error labels for MVP:

- PG_PHONO
- V_LEN
- C_DOUBLE
- H_DEHN
- IE_ERR
- SS_SZ
- CK_TZ
- CAP
- SEG_SPLIT
- SEG_MERGE
- G_OMIT
- G_ADD
- ORD_TRANS
- FW_CONF
- PUNC

### MVP anti-overreach rule
Do not start with full grammar layers.

Keep grammar as an optional future auxiliary layer.

---

## 18. Full Version

A richer future version may add:

- multi-annotator adjudication
- alternative normalization hypotheses
- confidence calibration
- optional POS/morph tags as auxiliary layers
- longitudinal metadata
- dedicated reduced-form policy layer
- dedicated register/variation layer
- adult LRS subcorpus
- challenge subsets for extreme ambiguity and hard multi-error cases

---

## 19. Top Risks

1. **ZH2 scope drift**
   - greatest danger
   - turns dataset into vague correction corpus

2. **Forced certainty**
   - ambiguous cases normalized as if obvious

3. **Mixing register normalization with orthography**
   - especially reduced colloquial forms

4. **Benchmark leakage**
   - rules overfit to repeated writers or repeated prompts

5. **Annotation inconsistency**
   - no hard policy for borderline cases

---

## 20. Top Decisions That Matter Most

1. Whether function-word real-word confusions belong in ZH2
2. Whether reduced colloquial forms are preserved or normalized
3. How much punctuation belongs to the task
4. Whether ambiguity can produce NULL or alternative targets
5. Whether JSONL + edit graph is adopted as the master format

---

## 21. Final Recommendation

Build the dataset around the following stable core:

- **ZH1** = conservative orthographic normalization only
- **ZH2** = extended orthographic normalization, but still not grammar correction
- **writer-disjoint benchmarking**
- **token + edit + character alignment**
- **explicit ambiguity handling**
- **strict reduced-form policy**
- **strict punctuation policy**
- **JSONL master format with CoNLL-style export**

The best design is the one that remains boringly consistent under annotation pressure.

That means:

- fewer clever exceptions
- harder scope boundaries
- explicit abstention
- policy before intuition

If a case cannot be handled consistently by multiple annotators, it is not yet fully specified and should not be hidden inside ZH2.

---

## 22. Recommended Next Artifact

The next artifact to build from this spec should be:

**Annotation Manual v1**

It should include:

- 50–100 worked examples
- positive and negative examples per error class
- ZH1 vs ZH2 contrast examples
- abstention cases
- reduced-form policy examples
- punctuation policy examples
- annotator decision flowchart

Without that manual, the schema is only half alive.
