# FLOW Release Gates — Graph Milestone

**Status:** DRAFT.
**Bound to:** `GRAPH_VALIDATION_MEMO.md` §6.
**Enforcement:** these gates must be encoded in `scripts/release/check_gates.py`
before any graph-related milestone is declared.

---

## Preamble

This document defines the hard criteria that separate "graph logic is implemented
and interesting" from "graph-aware normalization is ready to ship." Passing gates
G1–G7 is the minimum bar. No gate has an exception clause. No gate can be
waived by qualitative argument. All gates must pass on the same run.

A passing test suite that does not exercise the evidence sources listed below
is not evidence of gate passage.

---

## Gate table

| Gate | Criterion | Threshold | Evidence source | Fail condition | Rationale |
|---|---|---|---|---|---|
| **G1** | Graph builder implemented | Working code with contract tests green | `packages/flow/src/conllGraph.js` exists; `tests/contracts/test_conllu_schema.js` + `test_parallel_schema.js` + `test_bond_drift_schema.js` all pass | File missing OR any contract test fails | There is no graph without code. Threshold is existence + test coverage, not quality. |
| **G2** | No-touch Accuracy | ≥ 0.97 | §3.2 no-touch stratum (D-category, ≥ 6 000 items) of `docs/flow/DATASET_SPEC_PARALLEL_BENCHMARK.md` | < 0.97, OR dataset has < 2 000 items in the no-touch stratum | False-positive rate on clean input is the first protection against a repair system becoming a rewrite system. |
| **G3** | False-shift Rate | ≤ 0.02 | Full §3.2 set (≥ 20 000 items), scorer `scripts/benchmark/score_flow_benchmark.py` | > 0.02 on any run; OR dataset < 20 000 items | Boundary discipline is non-negotiable. |
| **G4** | Bond-Drift Critical violations | = 0 | Critical Set of §3.3 bond-drift baseline (500 items, `drift_allowed=false`, `critical=true`) | ≥ 1 violation in the Critical Set; OR dataset absent | A system that damages core grammatical relations in its repair output is unsafe. |
| **G5** | Multi-pass Stability | 100 % — both text and `bond_id` lists identical across two consecutive runs | Re-run of §3.2 + §3.3, compared pair-by-pair | Any diff in output text OR any diff in `bond_id` lists | Instability makes drift measurement unrepeatable and CI unreliable. |
| **G6** | All annotation policies signed off | Four documents exist and are not tagged DRAFT | `ANNOTATION_POLICY_NOTOUCH.md`, `ANNOTATION_POLICY_AMBIGUITY.md`, `ANNOTATION_POLICY_DRIFT.md`, `ANNOTATION_POLICY_DEPREL.md` — all must have a `Status: FINAL` header | Any policy absent OR tagged DRAFT or STUB | Policies are prerequisites to labeling; if they are not final, data produced under them is not trustworthy. |
| **G7** | Datasets at minimum scale | Three datasets meet size targets | §3.1 ≥ 10 000 sentences; §3.2 ≥ 20 000 pairs; §3.3 ≥ 2 000 pairs, with substrata meeting spec minima | Any dataset below target; any required substratum below minimum | Gate metrics computed on undersized data are statistically meaningless. |

---

## What does not count as gate evidence

The following categories of evidence are explicitly rejected for any gate:

- Unit tests with handwritten inputs (proves rule was written as intended, not
  that it is correct).
- Benchmark sample runs with N < 100 (no statistical power).
- Qualitative assessment ("the output looks better on a few examples").
- A CI run that is green because graph-touching tests were skipped.
- Drift metrics produced without the §3.3 baseline corpus.
- No-touch metrics produced without the §3.2 no-touch stratum.
- Graph output produced by a parser not validated against the §3.1 gold set.

---

## Gate execution procedure

Once all seven gates are codified in `scripts/release/check_gates.py`:

1. Run the scorer on the frozen test splits of §3.2 and §3.3.
2. Record all seven metrics.
3. Compare against thresholds above.
4. Print a binary PASS / FAIL for each gate.
5. Exit non-zero if any gate fails.

CI should run this script on every PR that touches `packages/flow/src/`,
`packages/flow/test/`, `scripts/benchmark/`, or `data/`.

---

## Note on currently unmet gates

At time of writing (HEAD `be5f9ca`):

| Gate | Status |
|---|---|
| G1 | **FAIL** — `conllGraph.js` does not exist |
| G2 | **UNMEASURABLE** — §3.2 dataset does not exist |
| G3 | **UNMEASURABLE** — §3.2 dataset does not exist |
| G4 | **UNMEASURABLE** — §3.3 dataset does not exist |
| G5 | **PARTIAL** — text-level stability proven on 200 sentences; graph stability not measurable |
| G6 | **FAIL** — policies are STUB or absent |
| G7 | **FAIL** — all three datasets absent |

Current passing: **0 of 7 gates**.
