#!/usr/bin/env python3
"""
flow-db export_benchmark
=========================
Export FLOW_CORE and FLOW_HELL benchmark sets to JSONL or CSV.

By default, only 'approved' benchmark items are exported.
Use --include-candidates to also include 'candidate' items (e.g., for review).

Commands
--------
export      Export benchmark items to a file.
summary     Print a summary of what would be exported without writing a file.

Usage
-----
    python -m src.export_benchmark export \\
        --db PATH \\
        --family {FLOW_CORE,FLOW_HELL,ALL} \\
        --out PATH \\
        [--format {jsonl,csv}] \\
        [--include-candidates]

    python -m src.export_benchmark summary --db PATH [--family F]

Each row in the export contains:
  - benchmark classification  (family, bucket, gold_type, risk flags)
  - error pair                (error_form, target_form, variant_type)
  - provenance                (source_name, language, corpus_name)
  - curation metadata         (ambiguity_level, why_hard, naive_failure_mode)
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.database import connect
from src.benchmark_taxonomy import BENCHMARK_FAMILIES

_EXPORT_COLUMNS = [
    'benchmark_item_id',
    'benchmark_family',
    'bucket',
    'gold_type',
    'ambiguity_level',
    'circularity_risk',
    'idempotence_risk',
    'downstream_poison_risk',
    'duplicate_risk',
    'why_hard',
    'naive_failure_mode',
    'curator_notes',
    'error_case_id',
    'error_form',
    'target_form',
    'variant_type',
    'correction_level',
    'has_context',
    'requires_context',
    'observed_count',
    'ec_review_status',
    'ec_gold_score',
    'source_name',
    'language',
    'corpus_name',
]

_EXPORT_SQL = """
    SELECT
        bi.id                       AS benchmark_item_id,
        bi.benchmark_family,
        bi.bucket,
        bi.gold_type,
        bi.ambiguity_level,
        bi.circularity_risk,
        bi.idempotence_risk,
        bi.downstream_poison_risk,
        bi.duplicate_risk,
        bi.why_hard,
        bi.naive_failure_mode,
        bi.curator_notes,
        ec.id                       AS error_case_id,
        ec.error_form,
        ec.target_form,
        ec.variant_type,
        ec.correction_level,
        ec.has_context,
        ec.requires_context,
        ec.observed_count,
        ec.review_status            AS ec_review_status,
        ec.gold_score               AS ec_gold_score,
        s.source_name,
        s.language,
        s.corpus_name
    FROM benchmark_items bi
    JOIN error_cases ec ON ec.id = bi.error_case_id
    JOIN sources s ON s.id = ec.source_id
    WHERE bi.review_status {status_filter}
    {family_filter}
    ORDER BY bi.benchmark_family, bi.bucket, bi.id
"""


def _build_query(family: str, include_candidates: bool) -> tuple[str, list]:
    status_filter = "IN ('candidate', 'approved')" if include_candidates else "= 'approved'"
    params: list = []

    if family and family != 'ALL':
        if family not in BENCHMARK_FAMILIES:
            raise ValueError(f"Unknown family {family!r}. Use FLOW_CORE, FLOW_HELL, or ALL.")
        family_filter = "AND bi.benchmark_family = ?"
        params.append(family)
    else:
        family_filter = ""

    sql = _EXPORT_SQL.format(status_filter=status_filter, family_filter=family_filter)
    return sql, params


def export_benchmark(
    con,
    family: str = 'ALL',
    out_path: str | Path = None,
    fmt: str = 'jsonl',
    include_candidates: bool = False,
) -> int:
    """Export benchmark items to a file.

    Returns the number of rows written.
    """
    sql, params = _build_query(family, include_candidates)
    rows = con.execute(sql, params).fetchall()

    if not rows:
        label = family if family != 'ALL' else 'any family'
        mode = 'approved + candidate' if include_candidates else 'approved'
        print(f"[export] No {mode} benchmark items found for {label}.")
        return 0

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    written = 0
    if fmt == 'jsonl':
        with out.open('w', encoding='utf-8') as f:
            for row in rows:
                record = dict(zip(_EXPORT_COLUMNS, row))
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
                written += 1
    elif fmt == 'csv':
        with out.open('w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=_EXPORT_COLUMNS)
            writer.writeheader()
            for row in rows:
                writer.writerow(dict(zip(_EXPORT_COLUMNS, row)))
                written += 1
    else:
        raise ValueError(f"Unknown format: {fmt!r}. Use 'jsonl' or 'csv'.")

    print(f"[export] {written} rows → {out}")
    return written


def print_summary(con, family: str = 'ALL') -> None:
    """Print a summary of what would be exported without writing a file."""
    for status_label, include_cands in [('approved', False), ('+candidates', True)]:
        sql, params = _build_query(family, include_cands)
        rows = con.execute(sql, params).fetchall()
        counts: dict[tuple, int] = {}
        for row in rows:
            key = (row[1], row[2] or '(unset)', row[3])  # family, bucket, gold_type
            counts[key] = counts.get(key, 0) + 1

        if not counts:
            print(f"[{status_label}] No items.")
            continue

        print(f"\n── {status_label} ({len(rows)} total) ──")
        print(f"  {'FAMILY':<12}  {'BUCKET':<26}  {'GOLD_TYPE':<16}  {'N':>5}")
        print("  " + "-" * 64)
        for (fam, bkt, gt), n in sorted(counts.items()):
            print(f"  {fam:<12}  {bkt:<26}  {gt:<16}  {n:>5}")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="FLOW Benchmark Export",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command")

    p_export = sub.add_parser("export", help="Export benchmark items to file")
    p_export.add_argument("--db", required=True, metavar="PATH")
    p_export.add_argument(
        "--family", default="ALL",
        help="FLOW_CORE, FLOW_HELL, or ALL (default: ALL)",
    )
    p_export.add_argument("--out", required=True, metavar="PATH", help="Output file path")
    p_export.add_argument("--format", choices=["jsonl", "csv"], default="jsonl")
    p_export.add_argument(
        "--include-candidates", action="store_true",
        help="Include 'candidate' items in addition to approved ones",
    )

    p_summary = sub.add_parser("summary", help="Summarise exportable items without writing")
    p_summary.add_argument("--db", required=True, metavar="PATH")
    p_summary.add_argument("--family", default="ALL")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    con = connect(args.db)

    if args.command == "export":
        export_benchmark(
            con,
            family=args.family,
            out_path=args.out,
            fmt=args.format,
            include_candidates=args.include_candidates,
        )

    elif args.command == "summary":
        print_summary(con, family=args.family)

    con.close()


if __name__ == "__main__":
    main()
