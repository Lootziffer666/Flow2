import json
import subprocess
import unittest


class IterateFlowScoresTests(unittest.TestCase):
    def test_iteration_output_contains_gate_status(self) -> None:
        cmd = [
            'python',
            'scripts/benchmark/iterate_flow_scores.py',
            '--items',
            'data/benchmark/flow_benchmark_items.sample.jsonl',
            '--predictions',
            'data/benchmark/flow_benchmark_predictions.sample.jsonl',
        ]
        out = subprocess.check_output(cmd, text=True)
        payload = json.loads(out)
        self.assertIn('runs', payload)
        self.assertEqual(len(payload['runs']), 1)
        self.assertIn('gate_pass', payload['runs'][0])


if __name__ == '__main__':
    unittest.main()
