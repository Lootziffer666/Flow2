# Synthetic Dataset Multi-Cycle Run Summary

## Session

- Branch: `claude/confident-fermi-rpeJt`
- Sessions executed: `run-20260425T222429Z` (cycles 1–12), `run-20260425T222602Z` (cycles 13–20)
- Cycles run: **20**
- Latest commit: `6371799ca1d37895abd36c8fa4095c3dc0b31c46`

## Detected dataset types

Inferred from `scripts/benchmark/generate_flow_synthetic_sentences.py::PROFILES`:

| profile               | language | difficulty | voice    | theme    |
| --------------------- | -------- | ---------- | -------- | -------- |
| flow-de-easy-neutral  | de       | easy       | neutral  | everyday |
| flow-de-medium-mixed  | de       | medium     | mixed    | everyday |
| flow-de-hard-mixed    | de       | hard       | mixed    | mixed    |
| flow-en-easy-neutral  | en       | easy       | neutral  | everyday |
| flow-en-medium-teen   | en       | medium     | teen     | school   |
| flow-en-hard-mixed    | en       | hard       | mixed    | mixed    |

## Pipeline

1. **Generate** — `generate_flow_synthetic_sentences.generate_records_for_profile(profile, seed_offset=cycle*1000+idx*7)` per type, with retry on small candidate pools.
2. **Refine** — whitespace normalization, exact-duplicate removal (id and source), schema validation (all required fields, ≥3 tokens, sentence-final punctuation), near-duplicate detection (token-Jaccard ≥ 0.92, min 4 tokens).
3. **Validate** — every accepted record passes the schema check; near-duplicates are quarantined to `*.quarantine.jsonl` instead of being silently dropped.
4. **Save** — accepted batches written to `data/synthetic/<profile>/<YYYY-MM-DD>/cycle_<NNNN>_<UTC_TS>.jsonl`; per-cycle metrics appended to `data/synthetic/_run_log.jsonl` and `data/synthetic/_sessions/<session_id>.jsonl`.
5. **Commit + push** — one commit per cycle on `claude/confident-fermi-rpeJt`, push retried once with intermediate fetch on failure.

## Totals (across 20 cycles)

- Accepted records: **34,199** (theoretical max with 6 types × 300 × 20 = 36,000)
- Near-duplicate quarantined: **1**
- Schema rejections: **0**
- Hard failures (cycles 6, 8–12, before retry path was added): 6, all on `flow-de-hard-mixed`
- Soft retries (cycles 16–18, 20, after retry path): 7, all on `flow-de-hard-mixed`, recovered on a later seed offset

### Per-type totals

| profile               | cycles ok | accepted | quarantined | soft retries | hard failures |
| --------------------- | --------: | -------: | ----------: | -----------: | ------------: |
| flow-de-easy-neutral  | 20        | 5,999    | 1           | 0            | 0             |
| flow-de-medium-mixed  | 20        | 6,000    | 0           | 0            | 0             |
| flow-de-hard-mixed    | 14        | 4,200    | 0           | 7            | 6             |
| flow-en-easy-neutral  | 20        | 6,000    | 0           | 0            | 0             |
| flow-en-medium-teen   | 20        | 6,000    | 0           | 0            | 0             |
| flow-en-hard-mixed    | 20        | 6,000    | 0           | 0            | 0             |

## Files created

- `scripts/benchmark/synthetic_pipeline.py` — orchestrator (run-cycle, run-loop).
- `scripts/benchmark/generate_flow_synthetic_sentences.py` — extended with `--seed-offset`, `--out`, `BUILDERS` registry, `generate_records_for_profile()`. Canonical run (`seed_offset=0`, default out-path) is byte-identical.
- `data/synthetic/<profile>/2026-04-25/cycle_*.jsonl` — 114 accepted batch files (20 per profile except `flow-de-hard-mixed` with 14).
- `data/synthetic/_run_log.jsonl` — 20 cycle metric records.
- `data/synthetic/_sessions/run-*.jsonl` — per-session cycle log.
- 1 quarantine file in `flow-de-easy-neutral/.../cycle_0007_*.quarantine.jsonl`.

## Quality gates applied

| gate                                                  | status                                       |
| ----------------------------------------------------- | -------------------------------------------- |
| malformed JSON / JSONL                                | none in accepted batches                     |
| missing required fields                               | 0 schema rejections                          |
| exact duplicates                                      | dropped during refinery                      |
| strong near-duplicates                                | 1 quarantined (Jaccard ≥ 0.92)               |
| meta-commentary, headers, numbering                   | not produced — generator is template-driven  |
| sentence fragments                                    | rejected by `[\.!?]$` end check              |
| obvious grammar collapse                              | not applicable — non-corruption profile      |
| corruption profile mismatch                           | not applicable — these are clean source seeds |

## Unresolved issues

- **`flow-de-hard-mixed` candidate pool is right at the edge** of `TARGET_COUNT=300`. Cycles 6 and 8–12 (run before the retry fix in commit `f380f94`) lost this profile entirely. After the fix, cycles 16–18 and 20 each had to retry once before a viable seed offset was found. The right structural fix is to add a few more template combinations (filler in any one slot) so the materializer has headroom; this was not done to keep the patch minimal, since the spec explicitly forbids resurrecting deleted folder structures and asks for the smallest viable patch.
- **Cross-cycle overlap is high by construction.** The curated template space yields a ceiling of ~360 deduped sentences for the easier German profiles and ~300–360 for `flow-de-hard-mixed`. Running far beyond ~10 distinct cycles produces diminishing marginal diversity. Per-cycle internal diversity is preserved (frame caps at 180 and opening cap at 40). Cross-cycle near-duplicate detection was deliberately *not* applied — the spec asks for 300 sentences per type per cycle, and quarantining cross-cycle repeats would have collapsed later cycles to near-zero accepted rows.

## Recommended next step before merge

1. **Backfill `flow-de-hard-mixed` cycles 6, 8–12.** A small `backfill-type` subcommand on `synthetic_pipeline.py` could regenerate just the missing profile for those cycle numbers without touching the existing accepted batches (which the spec forbids overwriting). This is a 30-line addition and makes the per-cycle row count uniform.
2. **Expand the `flow-de-hard-mixed` template pool.** Add one more slot value to either frame so the worst-case materialized pool clears 360 across the seed range, removing the retry/failure cluster.
3. **Run a final `validate_flow_benchmark.py`-style sanity pass** if these synthetic batches are eventually promoted to feed the canonical `flow_synthetic_sentence_producer.jsonl`. They currently use a different ID prefix (`<profile>-c<NNNN>-<NNNNNN>`) and live under `data/synthetic/`, so they don't conflict with the canonical inventory at `data/benchmark/flow_synthetic_sentence_producer.jsonl`.
