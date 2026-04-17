import importlib.util
import sys
import unittest
from pathlib import Path


MODULE_PATH = Path("scripts/benchmark/validate_flow_benchmark.py")
spec = importlib.util.spec_from_file_location("validate_flow_benchmark", MODULE_PATH)
validate = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = validate
spec.loader.exec_module(validate)


class ValidateFlowBenchmarkTests(unittest.TestCase):
    def test_semantic_checks_duplicate_and_notouch_conflict(self) -> None:
        rows = [
            {
                "id": "FLOW-A-0001",
                "no_touch": True,
                "required_edits": [{"edit_id": "e1"}],
                "optional_edits": [],
                "difficulty_factors": {"required_edit_count": 1},
            },
            {
                "id": "FLOW-A-0001",
                "no_touch": False,
                "required_edits": [],
                "optional_edits": [],
                "difficulty_factors": {"required_edit_count": 0},
            },
        ]

        issues = validate.semantic_checks(rows)

        self.assertTrue(any("Duplicate id" in issue for issue in issues))
        self.assertTrue(
            any("no_touch=true must not include required/optional edits" in issue for issue in issues)
        )

    def test_semantic_checks_required_count_mismatch(self) -> None:
        rows = [
            {
                "id": "FLOW-B-0002",
                "no_touch": False,
                "required_edits": [{"edit_id": "e1"}, {"edit_id": "e2"}],
                "optional_edits": [],
                "difficulty_factors": {"required_edit_count": 1},
            }
        ]

        issues = validate.semantic_checks(rows)
        self.assertTrue(any("required_edit_count=1" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
