import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path("scripts/benchmark/score_flow_benchmark.py")
spec = importlib.util.spec_from_file_location("score_flow_benchmark", MODULE_PATH)
score = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = score
spec.loader.exec_module(score)


class ScoreFlowBenchmarkTests(unittest.TestCase):
    def test_evaluate_basic_public_metrics(self) -> None:
        items = [
            {
                "id": "FLOW-A-0001",
                "source_sentence": "Das ist ein Feler.",
                "primary_gold_target": "Das ist ein Fehler.",
                "alternative_targets": [],
                "required_edits": [{"start": 12, "end": 17, "source": "Feler", "target": "Fehler"}],
                "optional_edits": [],
                "forbidden_edits": [],
                "no_touch": False,
            },
            {
                "id": "FLOW-D-0002",
                "source_sentence": "mach ich später, ok?",
                "primary_gold_target": "mach ich später, ok?",
                "alternative_targets": [],
                "required_edits": [],
                "optional_edits": [],
                "forbidden_edits": [],
                "no_touch": True,
            },
        ]

        predictions = [
            {
                "id": "FLOW-A-0001",
                "prediction": "Das ist ein Fehler.",
                "meta": {
                    "expected_bindings": 10,
                    "preserved_bindings": 9,
                    "repairable_graph": True,
                    "improved_graph": True,
                    "second_pass_prediction": "Das ist ein Fehler.",
                },
            },
            {
                "id": "FLOW-D-0002",
                "prediction": "mach ich später, ok?",
                "meta": {
                    "expected_bindings": 10,
                    "preserved_bindings": 10,
                    "repairable_graph": True,
                    "improved_graph": True,
                    "second_pass_prediction": "mach ich später, ok?",
                },
            },
        ]

        result = score.evaluate(items, predictions)

        self.assertEqual(result["public_metrics"]["edit_recall"], 1.0)
        self.assertEqual(result["public_metrics"]["no_op_accuracy"], 1.0)
        self.assertEqual(result["private_metrics"]["idempotence"], 1.0)
        self.assertGreaterEqual(result["counts"]["tp"], 1)

    def test_false_shift_rate_case_based(self) -> None:
        items = [
            {
                "id": "FLOW-C-0003",
                "source_sentence": "Das war gut.",
                "primary_gold_target": "Das war gut.",
                "alternative_targets": [],
                "required_edits": [],
                "optional_edits": [],
                "forbidden_edits": [{"reason": "style_normalization", "pattern": "Das war sehr gut."}],
                "no_touch": True,
            }
        ]
        predictions = [
            {
                "id": "FLOW-C-0003",
                "prediction": "Das war sehr gut.",
                "meta": {"second_pass_prediction": "Das war sehr gut."},
            }
        ]

        result = score.evaluate(items, predictions)
        self.assertEqual(result["private_metrics"]["false_shift_rate"], 1.0)


if __name__ == "__main__":
    unittest.main()
