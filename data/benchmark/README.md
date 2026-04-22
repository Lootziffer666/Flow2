# Benchmark Data Root

Canonical location for benchmark data assets used by FLOW evaluation tooling.

- `flow_benchmark_items*.jsonl` — benchmark items.
- `flow_benchmark_predictions*.jsonl` — prediction files for scoring/iteration.
- `flow_synthetic_sentence_producer.jsonl` — synthetic sentence inventory generated for FLOW profile seeding.
- `examples/` — manual benchmark/debug examples and fixture-like samples.

Related docs and specs are in `docs/benchmark/`.
DB-facing benchmark workflows live under `flow-db/benchmarks/`.

For the rolling multi-cycle synthetic sentence output (same type taxonomy,
continuously extended), see `data/synthetic/README.md`.
