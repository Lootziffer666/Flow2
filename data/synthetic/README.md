# Synthetic Sentence Batches

Output root for the multi-cycle synthetic sentence pipeline driven by
`scripts/synthetic/run_sentence_cycles.py`.

## Layout

```
data/synthetic/
├── _run_logs/                  per-session run log + per-cycle stats + final summary
├── _seen/                      persistent cross-cycle fingerprint stores per type
└── <dataset_type>/
    └── <YYYY-MM-DD>/
        ├── cycle_<NNNN>_<UTC>.jsonl          accepted batch
        └── _rejected/
            └── cycle_<NNNN>_<UTC>.rejected.jsonl
```

Dataset types (6) inherited from
`scripts/benchmark/generate_flow_synthetic_sentences.py`:

- `flow-de-easy-neutral` — German, easy, neutral voice, everyday
- `flow-de-medium-mixed` — German, medium, mixed voice, everyday
- `flow-de-hard-mixed`   — German, hard, mixed voice, mixed themes
- `flow-en-easy-neutral` — English, easy, neutral voice, everyday
- `flow-en-medium-teen`  — English, medium, teen voice, school
- `flow-en-hard-mixed`   — English, hard, mixed voice, mixed themes

## Record schema (accepted JSONL)

```json
{
  "id": "<profile>-c<NNNN>-<NNNNNN>",
  "profile": "<dataset_type>",
  "cycle": 1,
  "language": "de|en",
  "difficulty": "easy|medium|hard",
  "voice": "neutral|mixed|teen",
  "realism": "high",
  "theme": "everyday|school|mixed",
  "form": "mixed",
  "source": "<sentence>"
}
```

## Quality gates

Each record must pass: no junk/meta markers, terminal punctuation, language
heuristic, length bounds per difficulty, exact dedup within batch and against
the persistent `_seen/` fingerprint store, and a per-12-word-prefix cluster
cap to avoid templated clustering.

Rejected records are preserved under `<date>/_rejected/` for auditability —
never silently dropped.

## Relation to `data/benchmark/`

`data/benchmark/flow_synthetic_sentence_producer.jsonl` is a curated,
fixed-size (300 per type) seed file. This directory is the **rolling,
multi-cycle** output intended to scale the sentence inventory over time
under the same type taxonomy.
