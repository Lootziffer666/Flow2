#!/usr/bin/env python3
"""
flow-db ingest_benchmark_candidates
====================================
Promotes existing error_cases to benchmark_items for curation.

Commands
--------
ingest          Promote error_cases from DB into benchmark_items.
list-sources    List available sources with error_case counts.

Usage
-----
    python -m src.ingest_benchmark_candidates ingest \\
        --db PATH --family {FLOW_CORE,FLOW_HELL} \\
        [--source-id ID] [--language LANG] \\
        [--batch-id LABEL] [--dry-run]

    python -m src.ingest_benchmark_candidates list-sources --db PATH

Notes
-----
- Ingestion is idempotent: running twice with the same arguments skips
  rows that already exist in benchmark_items.
- For FLOW_CORE, bucket and gold_type are suggested heuristically based
  on variant_type. All results are inserted with review_status='candidate'
  and must be reviewed before export.
- For FLOW_HELL, bucket is left NULL (must be set during curation).
  The FLOW_HELL family requires explicit curator intent.
- Does NOT automatically promote to 'approved'. Use curate_benchmark to
  mark items as approved after human review.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.database import connect
from src.benchmark_taxonomy import (
    BENCHMARK_FAMILIES,
    suggest_bucket,
    suggest_gold_type,
)

# ── Candidate query ───────────────────────────────────────────────────────────

_CANDIDATE_SQL = """
    SELECT
        ec.id,
        ec.error_form,
        ec.target_form,
        ec.variant_type,
        ec.correction_level,
        ec.has_context,
        ec.review_status,
        ec.gold_score,
        s.source_name,
        s.language
    FROM error_cases ec
    JOIN sources s ON s.id = ec.source_id
    WHERE ec.review_status != 'excluded'
    {extra}
    ORDER BY ec.id
"""


def _build_candidate_query(source_id=None, language=None):
    conditions = []
    params = []
    if source_id is not None:
        conditions.append("AND ec.source_id = ?")
        params.append(source_id)
    if language is not None:
        conditions.append("AND s.language = ?")
        params.append(language)
    extra = "\n    ".join(conditions)
    return _CANDIDATE_SQL.format(extra=extra), params


def _already_classified(con, error_case_id: int, family: str) -> bool:
    row = con.execute(
        "SELECT id FROM benchmark_items WHERE error_case_id=? AND benchmark_family=?",
        (error_case_id, family),
    ).fetchone()
    return row is not None


# ── Public API ────────────────────────────────────────────────────────────────

def ingest_candidates(
    con,
    family: str,
    source_id: int | None = None,
    language: str | None = None,
    batch_id: str | None = None,
    dry_run: bool = False,
) -> tuple[int, int]:
    """Promote eligible error_cases into benchmark_items with 'candidate' status.

    Returns (inserted, skipped). Skipped means the combination
    (error_case_id, benchmark_family) already exists.
    """
    if family not in BENCHMARK_FAMILIES:
        raise ValueError(f"Unknown benchmark family: {family!r}. Choose from: {sorted(BENCHMARK_FAMILIES)}")

    sql, params = _build_candidate_query(source_id=source_id, language=language)
    rows = con.execute(sql, params).fetchall()

    inserted = 0
    skipped = 0
    notes = f"batch:{batch_id}" if batch_id else None

    for row in rows:
        ec_id = row[0]
        error_form = row[1]
        target_form = row[2]
        variant_type = row[3] or ''

        if _already_classified(con, ec_id, family):
            skipped += 1
            continue

        # Heuristic suggestions — review_status stays 'candidate'
        bucket = suggest_bucket(variant_type) if family == 'FLOW_CORE' else None
        ambiguity = 2 if variant_type == 'real_word_confusion' else 0
        gold_type = suggest_gold_type(variant_type, target_form, ambiguity_level=ambiguity)

        if dry_run:
            print(
                f"  [dry-run] ec_id={ec_id:>4}  family={family:<10}  "
                f"bucket={str(bucket):<28}  gold_type={gold_type:<16}  "
                f"error={error_form!r:<20}  target={str(target_form)!r}"
            )
            inserted += 1
            continue

        con.execute(
            """
            INSERT OR IGNORE INTO benchmark_items
                (error_case_id, benchmark_family, bucket, gold_type,
                 ambiguity_level, review_status, curator_notes)
            VALUES (?, ?, ?, ?, ?, 'candidate', ?)
            """,
            (ec_id, family, bucket, gold_type, ambiguity, notes),
        )
        inserted += 1

    if not dry_run:
        con.commit()

    return inserted, skipped


# ── CLI helpers ───────────────────────────────────────────────────────────────

def _cmd_list_sources(con) -> None:
    rows = con.execute(
        """
        SELECT s.id, s.source_name, s.language, s.resource_type,
               COUNT(ec.id) AS ec_count
        FROM sources s
        LEFT JOIN error_cases ec ON ec.source_id = s.id
        GROUP BY s.id
        ORDER BY s.id
        """
    ).fetchall()
    print(f"\n{'ID':>4}  {'SOURCE':<32}  {'LANG':>4}  {'TYPE':<22}  {'CASES':>6}")
    print("-" * 76)
    for r in rows:
        print(f"{r[0]:>4}  {r[1]:<32}  {r[2]:>4}  {r[3]:<22}  {r[4]:>6}")
    print()


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="FLOW Benchmark Candidate Ingestion",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command")

    p_ingest = sub.add_parser("ingest", help="Promote error_cases to benchmark candidates")
    p_ingest.add_argument("--db", required=True, metavar="PATH")
    p_ingest.add_argument(
        "--family", required=True, choices=sorted(BENCHMARK_FAMILIES),
        metavar="FAMILY",
    )
    p_ingest.add_argument("--source-id", type=int, default=None, metavar="ID")
    p_ingest.add_argument("--language", default=None, metavar="LANG")
    p_ingest.add_argument(
        "--batch-id", default=None, metavar="LABEL",
        help="Label stored in curator_notes for traceability",
    )
    p_ingest.add_argument("--dry-run", action="store_true")

    p_ls = sub.add_parser("list-sources", help="List available sources and error_case counts")
    p_ls.add_argument("--db", required=True, metavar="PATH")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    con = connect(args.db)

    if args.command == "list-sources":
        _cmd_list_sources(con)

    elif args.command == "ingest":
        prefix = "[dry-run] " if args.dry_run else ""
        desc_parts = [f"family={args.family}"]
        if args.source_id is not None:
            desc_parts.append(f"source_id={args.source_id}")
        if args.language:
            desc_parts.append(f"language={args.language}")
        if args.batch_id:
            desc_parts.append(f"batch={args.batch_id!r}")

        print(f"{prefix}Ingesting: {', '.join(desc_parts)}")

        inserted, skipped = ingest_candidates(
            con,
            family=args.family,
            source_id=args.source_id,
            language=args.language,
            batch_id=args.batch_id,
            dry_run=args.dry_run,
        )
        print(f"{prefix}Inserted: {inserted}  Already exists (skipped): {skipped}")

    con.close()


if __name__ == "__main__":
    main()
