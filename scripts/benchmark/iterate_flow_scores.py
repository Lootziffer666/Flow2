#!/usr/bin/env python3
"""Run multiple scoring iterations and compare score progression.

Example:
python scripts/benchmark/iterate_flow_scores.py \
  --items data/benchmark/flow_benchmark_items.sample.jsonl \
  --predictions data/benchmark/flow_benchmark_predictions.sample.jsonl \
  --predictions runs/model_v2.jsonl
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path


def _load_score_module():
    module_path = Path(__file__).resolve().parent / "score_flow_benchmark.py"
    spec = importlib.util.spec_from_file_location("score_flow_benchmark", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Compare FLOW score iterations")
    p.add_argument("--items", required=True)
    p.add_argument("--predictions", action="append", required=True, help="Prediction JSONL path (repeatable)")
    p.add_argument("--pretty", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    score_module = _load_score_module()
    items = score_module.read_jsonl(Path(args.items))

    runs = []
    for pred_path in args.predictions:
        preds = score_module.read_jsonl(Path(pred_path))
        result = score_module.evaluate(items, preds)
        runs.append(
            {
                "predictions": pred_path,
                "public": result["public_metrics"],
                "private": result["private_metrics"],
                "gate_pass": result["gates"]["status"]["all_public_targets_pass"],
            }
        )

    print(json.dumps({"runs": runs}, indent=2 if args.pretty else None, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
