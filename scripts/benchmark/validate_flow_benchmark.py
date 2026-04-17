#!/usr/bin/env python3
"""Validate FLOW benchmark JSONL items against JSON Schema.

Usage:
  python scripts/benchmark/validate_flow_benchmark.py \
    --schema docs/benchmark/BENCHMARK_SCHEMA.json \
    --items data/benchmark/flow_benchmark_items.sample.jsonl
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate FLOW benchmark dataset")
    parser.add_argument("--schema", required=True, help="Path to benchmark JSON schema")
    parser.add_argument("--items", required=True, help="Path to benchmark JSONL items")
    return parser.parse_args()


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON at line {line_no}: {exc}") from exc
            rows.append(row)
    return rows


def semantic_checks(rows: list[dict]) -> list[str]:
    issues: list[str] = []
    seen_ids: set[str] = set()

    for idx, row in enumerate(rows, start=1):
        row_id = row.get("id", f"<missing-id:{idx}>")
        if row_id in seen_ids:
            issues.append(f"Duplicate id: {row_id}")
        seen_ids.add(row_id)

        no_touch = bool(row.get("no_touch", False))
        req = row.get("required_edits", [])
        opt = row.get("optional_edits", [])

        if no_touch and (req or opt):
            issues.append(f"{row_id}: no_touch=true must not include required/optional edits")

        factors = row.get("difficulty_factors", {})
        req_count = factors.get("required_edit_count")
        if isinstance(req_count, int) and req_count != len(req):
            issues.append(
                f"{row_id}: difficulty_factors.required_edit_count={req_count} "
                f"but required_edits has {len(req)} entries"
            )

    return issues


def main() -> int:
    args = parse_args()
    schema_path = Path(args.schema)
    items_path = Path(args.items)

    schema = load_json(schema_path)
    rows = load_jsonl(items_path)

    try:
        import jsonschema
    except Exception as exc:  # pragma: no cover
        print(
            "ERROR: jsonschema is required for schema validation. "
            "Install with: pip install jsonschema",
            file=sys.stderr,
        )
        print(f"Import failure: {exc}", file=sys.stderr)
        return 2

    validator = jsonschema.Draft202012Validator(schema)
    schema_errors: list[str] = []
    for i, row in enumerate(rows, start=1):
        for err in validator.iter_errors(row):
            path = ".".join(str(p) for p in err.path)
            schema_errors.append(f"line={i} id={row.get('id')} path={path} msg={err.message}")

    semantic_issues = semantic_checks(rows)

    if schema_errors or semantic_issues:
        print("Validation FAILED")
        for msg in schema_errors:
            print(f"[schema] {msg}")
        for msg in semantic_issues:
            print(f"[semantic] {msg}")
        return 1

    print(f"Validation OK: {len(rows)} items")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
