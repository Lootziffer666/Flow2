Act as a principal NLP evaluation engineer and benchmark architect.

Task:
Redesign the benchmark and evaluation logic for FLOW so that it no longer treats sentence-level “gold / partial / failed” as the primary truth signal.

Goal:
Build a precise, implementation-ready benchmark and scoring design for a German orthographic normalization engine that prioritizes:
- correct repair
- non-invasiveness
- minimality
- stability / idempotence
- boundary discipline
over naive full-sentence exact match.

Important context:
FLOW is not supposed to behave like a generic grammar checker.
FLOW is a repair system, not a rewriting system.
A correctly untouched sentence is a success.
A partially repaired sentence must not be scored like a total failure.
Sentence exact match may remain as a secondary metric, but must not be the primary metric.

What I want you to produce:
Create a concrete benchmark and evaluation specification that I can actually use in the repo.
Do not give generic NLP benchmark advice.
Do not explain broad theory unless needed for a concrete decision.
Do not drift into full GEC framing unless explicitly justified.

Required deliverable:
Produce a single structured design document with the following sections:

1. Benchmark philosophy
- Explain why sentence-level gold/partial/failed is too coarse as the main signal for FLOW.
- Define the evaluation priorities for FLOW.
- State explicitly what “success” means for FLOW.

2. Test classes
Define four benchmark classes, sharpened for implementation:

A. Orthographic Core
- spelling mistakes
- vowel length / Dehnung
- Schärfung
- capitalization
- simple split/merge cases
- clearly orthographic non-word cases

B. Orthography-Adjacent Morph Surface Cases
- cases that touch endings, participle-like forms, infinitive-with-zu-like surface forms, or morphology-shaped spelling
- but must not silently turn into broad grammar correction
- clearly define what belongs here and what does not

C. Contextual / Real-Word Boundary Cases
- existing words that are wrong in context
- ambiguous target hypotheses
- context-dependent confusions
- define how they are scored and when abstention is better than forced correction

D. Non-Invasiveness / Do-Not-Touch Cases
- ellipses
- fragmentation
- intentional style breaks
- multilingual traces
- idiomatic deviations
- deliberate informal writing
- define how to test correct non-intervention

3. Annotation model for benchmark items
For every benchmark item, define which labels/fields should exist.
At minimum include:
- id
- category
- source sentence
- primary gold target
- optional alternative acceptable targets
- required edits
- optional edits
- forbidden edits
- no-touch flag
- ambiguity flag
- difficulty
- notes / rationale

4. Evaluation units
Define three evaluation layers:
- edit level
- sentence level
- corpus level

Be explicit:
- the smallest meaningful unit is the edit
- sentence-level exact match is secondary
- corpus-level behavior must capture both repair and restraint

5. Core metrics
Define the exact metric set FLOW should use.
At minimum include:
- Edit Precision
- Edit Recall
- F0.5
- Sentence Exact Match
- Overcorrection Rate
- No-op Accuracy
- Minimality Score
- Stability / Idempotence
- Invasiveness
- Repair Rate
- False-Shift Rate

For each metric:
- define it precisely
- explain why it matters for FLOW
- explain what failure mode it catches
- explain whether higher or lower is better

6. Metric formulas
Provide concrete formulas or pseudocode-level definitions for each metric.
Do not leave them hand-wavy.
Minimality must not reward laziness.
Make sure Invasiveness and Overcorrection are distinct.
Make sure No-op Accuracy and Idempotence are distinct.
Define how False-Shift Rate is counted.

7. Scoring philosophy
Specify which metrics are:
- primary
- secondary
- dashboard-only

Recommended direction:
- primary = edit quality + restraint + stability
- secondary = sentence exactness
- dashboard-only = simple gold/near-gold/failed summaries

But do not just copy this blindly; validate and refine it.

8. Difficulty logic
Define how difficulty should be assigned.
Do not make it a vague human guess.
Use concrete factors such as:
- number of required edits
- ambiguity
- split/merge complexity
- real-word involvement
- overlapping error types
- forbidden-edit temptation
- style-preservation pressure

9. Benchmark composition
Design a realistic first internal benchmark.
State how many examples should exist per class for v1.
Recommend a balanced first pass.
Include a dedicated “do not touch” set.
Include a hard-cases set.
Include an ambiguity set.

10. Output format
Recommend a practical benchmark file structure for the repo.
Prefer something implementation-friendly.
Suggest exact files, for example:
- benchmark_spec.md
- benchmark_schema.json
- benchmark_items.jsonl
- scoring_rules.md
- metrics_reference.md
- examples/

If useful, also propose a machine-readable item schema.

11. Guardrails
State explicitly what must never happen:
- full grammar-checker drift
- rewarding unnecessary rewrites
- punishing correct abstention
- treating one missed edit as complete sentence failure
- hiding ambiguity
- merging style normalization into orthographic repair

12. Final recommendation
End with a concise recommended benchmark model for FLOW:
- what to measure first
- what to show in dashboards
- what to optimize for
- what not to optimize for

Critical constraints:
- Keep FLOW’s identity intact: repair, not beautification.
- Prioritize precision over aggressive correction.
- Respect deliberate stylistic deviation.
- Non-intervention can be a success.
- Partial repair must be visible as progress, not collapse into failure.
- Sentence exact match must not dominate the benchmark logic.
- Be skeptical of any metric that rewards broad rewriting.

Important working style:
- Be concrete.
- Make decisions.
- If a tradeoff exists, state it clearly.
- Prefer practical benchmark architecture over academic generality.
- Where useful, include concise examples.
- Do not produce filler.
- Do not drift into implementation of the correction engine itself unless needed for scoring logic.

Expected output quality:
This should read like a benchmark redesign memo that a serious repo could adopt directly.

After writing the design, also create the first repo-ready artifact set:

- docs/benchmark/FLOW_BENCHMARK_SPEC.md
- docs/benchmark/METRICS_REFERENCE.md
- docs/benchmark/SCORING_RULES.md
- docs/benchmark/BENCHMARK_SCHEMA.json
- data/benchmark/flow_benchmark_items.sample.jsonl

Use a consistent schema.
Populate the sample JSONL with at least 12 illustrative items across all four benchmark classes.
Mark required edits, optional edits, forbidden edits, ambiguity, and no-touch cases explicitly.
Keep examples concise but realistic.
