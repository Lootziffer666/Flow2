#!/usr/bin/env python3
"""Score FLOW benchmark predictions with edit-centric metrics.

Predictions JSONL format (one line per item):
{
  "id": "FLOW-A-0001",
  "prediction": "Das ist ein Fehler.",
  "meta": {
    "expected_bindings": 10,
    "preserved_bindings": 9,
    "repairable_graph": true,
    "improved_graph": true
  }
}
"""

from __future__ import annotations

import argparse
import difflib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

SHIFT_REASONS = {
    "grammar_shift",
    "style_normalization",
    "semantic_rewrite",
    "register_formalization",
}

@dataclass(frozen=True)
class Edit:
    start: int
    end: int
    source: str
    target: str


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Score FLOW benchmark predictions")
    p.add_argument("--items", required=True, help="Benchmark items JSONL")
    p.add_argument("--predictions", required=True, help="Prediction JSONL")
    p.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    return p.parse_args()


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no} invalid JSON: {exc}") from exc
    return rows


def diff_edits(source: str, prediction: str) -> list[Edit]:
    matcher = difflib.SequenceMatcher(a=source, b=prediction)
    edits: list[Edit] = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        edits.append(Edit(start=i1, end=i2, source=source[i1:i2], target=prediction[j1:j2]))
    return edits


def normalize_gold(edits: Iterable[dict]) -> list[Edit]:
    return [
        Edit(
            start=int(e["start"]),
            end=int(e["end"]),
            source=str(e.get("source", "")),
            target=str(e.get("target", "")),
        )
        for e in edits
    ]


def metric_div(num: float, den: float) -> float:
    return float(num) / den if den else 0.0


def f05(precision: float, recall: float) -> float:
    denom = (0.25 * precision) + recall
    return (1.25 * precision * recall) / denom if denom else 0.0


def evaluate(items: list[dict], predictions: list[dict]) -> dict:
    pred_by_id = {row["id"]: row for row in predictions}

    tp = fp = fn = 0
    sem_hits = 0
    all_pred_edits = 0
    no_touch_total = 0
    no_touch_unchanged = 0
    repairable_cases = 0
    repaired_cases = 0
    wrong_target_hypotheses = 0

    expected_bindings = 0
    preserved_bindings = 0
    repairable_graphs = 0
    improved_graphs = 0
    unchanged_second_pass = 0
    total_cases = len(items)
    row_stats: list[dict] = []

    for item in items:
        item_id = item["id"]
        pred_row = pred_by_id.get(item_id, {"id": item_id, "prediction": item["source_sentence"], "meta": {}})
        prediction = pred_row.get("prediction", item["source_sentence"])
        source = item["source_sentence"]

        gold_req = normalize_gold(item.get("required_edits", []))
        gold_opt = normalize_gold(item.get("optional_edits", []))
        pred_edits = diff_edits(source, prediction)
        all_pred_edits += len(pred_edits)

        # Gold matching with robust fallback:
        # if offsets are noisy in annotation, text-presence still captures whether intended repair happened.
        matched_req = 0
        for ge in gold_req:
            if ge.source in source and ge.target in prediction:
                matched_req += 1

        matched_opt = 0
        for oe in gold_opt:
            if oe.source in source and oe.target in prediction:
                matched_opt += 1

        local_tp = matched_req
        local_fn = max(len(gold_req) - matched_req, 0)
        local_fp = max(len(pred_edits) - matched_req - matched_opt, 0)

        tp += local_tp
        accepted_targets = [item["primary_gold_target"], *item.get("alternative_targets", [])]
        # Avoid penalizing diff fragmentation when prediction is an accepted full target.
        if prediction in accepted_targets:
            local_fp = 0

        fp += local_fp
        fn += local_fn

        if prediction in accepted_targets:
            sem_hits += 1

        if item.get("no_touch"):
            no_touch_total += 1
            if prediction == source:
                no_touch_unchanged += 1

        if len(gold_req) > 0:
            repairable_cases += 1
            if local_tp >= 1:
                repaired_cases += 1

        # False-shift (case-based): if forbidden shift pattern appears or if there are FPs on boundary-sensitive items.
        has_shift = False
        for c in item.get("forbidden_edits", []):
            reason = c.get("reason")
            pattern = c.get("pattern", "")
            if reason in SHIFT_REASONS and pattern and pattern in prediction:
                has_shift = True
                break
        if not has_shift and local_fp > 0 and any(c.get("reason") in SHIFT_REASONS for c in item.get("forbidden_edits", [])):
            has_shift = True
        if has_shift:
            wrong_target_hypotheses += 1

        meta = pred_row.get("meta", {}) or {}
        expected_bindings += int(meta.get("expected_bindings", 0))
        preserved_bindings += int(meta.get("preserved_bindings", 0))
        if bool(meta.get("repairable_graph", False)):
            repairable_graphs += 1
            if bool(meta.get("improved_graph", False)):
                improved_graphs += 1
        second_pass_prediction = meta.get("second_pass_prediction", prediction)
        if second_pass_prediction == prediction:
            unchanged_second_pass += 1

        row_stats.append(
            {
                "id": item_id,
                "category": item.get("category", "unknown"),
                "difficulty": int(item.get("difficulty", 0) or 0),
                "ambiguity_flag": bool(item.get("ambiguity_flag", False)),
                "no_touch": bool(item.get("no_touch", False)),
                "tp": local_tp,
                "fp": local_fp,
                "fn": local_fn,
                "pred_edits": len(pred_edits),
                "sem": 1 if prediction in accepted_targets else 0,
                "repairable": 1 if len(gold_req) > 0 else 0,
                "repaired": 1 if (len(gold_req) > 0 and local_tp >= 1) else 0,
                "shift": 1 if has_shift else 0,
            }
        )

    precision = metric_div(tp, tp + fp)
    recall = metric_div(tp, tp + fn)

    def aggregate(subset: list[dict]) -> dict:
        if not subset:
            return {
                "items": 0,
                "edit_precision": 0.0,
                "edit_recall": 0.0,
                "f0_5": 0.0,
                "no_op_accuracy": 0.0,
                "overcorrection_rate": 0.0,
                "sentence_exact_match": 0.0,
                "repair_rate": 0.0,
                "false_shift_rate": 0.0,
            }
        stp = sum(r["tp"] for r in subset)
        sfp = sum(r["fp"] for r in subset)
        sfn = sum(r["fn"] for r in subset)
        sedits = sum(r["pred_edits"] for r in subset)
        ssem = sum(r["sem"] for r in subset)
        sno_touch = [r for r in subset if r["no_touch"]]
        srepairable = [r for r in subset if r["repairable"]]
        precision_s = metric_div(stp, stp + sfp)
        recall_s = metric_div(stp, stp + sfn)
        return {
            "items": len(subset),
            "edit_precision": precision_s,
            "edit_recall": recall_s,
            "f0_5": f05(precision_s, recall_s),
            "no_op_accuracy": metric_div(sum(r["sem"] for r in sno_touch), len(sno_touch)),
            "overcorrection_rate": metric_div(sfp, sedits),
            "sentence_exact_match": metric_div(ssem, len(subset)),
            "repair_rate": metric_div(sum(r["repaired"] for r in srepairable), len(srepairable)),
            "false_shift_rate": metric_div(sum(r["shift"] for r in subset), len(subset)),
        }

    per_category = {
        key: aggregate([r for r in row_stats if r["category"] == key]) for key in ["A", "B", "C", "D"]
    }
    per_difficulty = {
        str(level): aggregate([r for r in row_stats if r["difficulty"] == level]) for level in [1, 2, 3, 4, 5]
    }
    ambiguity_slice = aggregate([r for r in row_stats if r["ambiguity_flag"]])
    no_touch_slice = aggregate([r for r in row_stats if r["no_touch"]])
    hard_case_slice = aggregate([r for r in row_stats if r["difficulty"] >= 4])

    gate_targets = {
        "edit_precision_min": 0.95,
        "edit_recall_min": 0.80,
        "no_op_accuracy_min": 0.95,
        "overcorrection_rate_max": 0.05,
    }
    gate_status = {
        "edit_precision": precision >= gate_targets["edit_precision_min"],
        "edit_recall": recall >= gate_targets["edit_recall_min"],
        "no_op_accuracy": metric_div(no_touch_unchanged, no_touch_total) >= gate_targets["no_op_accuracy_min"],
        "overcorrection_rate": metric_div(fp, all_pred_edits) <= gate_targets["overcorrection_rate_max"],
    }
    gate_status["all_public_targets_pass"] = all(gate_status.values())

    out = {
        "public_metrics": {
            "edit_precision": precision,
            "edit_recall": recall,
            "f0_5": f05(precision, recall),
            "no_op_accuracy": metric_div(no_touch_unchanged, no_touch_total),
            "overcorrection_rate": metric_div(fp, all_pred_edits),
            "sentence_exact_match": metric_div(sem_hits, len(items)),
            "repair_rate": metric_div(repaired_cases, repairable_cases),
        },
        "private_metrics": {
            "node_preservation": metric_div(preserved_bindings, expected_bindings),
            "graph_repair_success": metric_div(improved_graphs, repairable_graphs),
            "idempotence": metric_div(unchanged_second_pass, total_cases),
            "minimality": metric_div(tp, tp + fp),
            "false_shift_rate": metric_div(wrong_target_hypotheses, total_cases),
        },
        "counts": {
            "items": len(items),
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "all_pred_edits": all_pred_edits,
            "no_touch_total": no_touch_total,
            "no_touch_unchanged": no_touch_unchanged,
            "repairable_cases": repairable_cases,
            "repaired_cases": repaired_cases,
            "wrong_target_hypotheses": wrong_target_hypotheses,
            "expected_bindings": expected_bindings,
            "preserved_bindings": preserved_bindings,
            "repairable_graphs": repairable_graphs,
            "improved_graphs": improved_graphs,
            "unchanged_second_pass": unchanged_second_pass,
        },
        "slices": {
            "per_category": per_category,
            "per_difficulty": per_difficulty,
            "ambiguity_slice": ambiguity_slice,
            "no_touch_slice": no_touch_slice,
            "hard_case_slice": hard_case_slice,
        },
        "gates": {
            "targets": gate_targets,
            "status": gate_status,
        },
    }
    return out


def main() -> int:
    args = parse_args()
    items = read_jsonl(Path(args.items))
    preds = read_jsonl(Path(args.predictions))
    result = evaluate(items, preds)
    print(json.dumps(result, indent=2 if args.pretty else None, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
