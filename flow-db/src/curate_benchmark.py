#!/usr/bin/env python3
"""
flow-db curate_benchmark
========================
Manual curation workflow for benchmark items.

Commands
--------
list            List benchmark items filtered by family / status.
mark            Update classification fields on a single item.
bulk-approve    Approve all candidate items in a family (+ optional bucket).
stats           Print curation statistics.

Usage
-----
    python -m src.curate_benchmark list   --db PATH [--family F] [--status S] [--limit N]
    python -m src.curate_benchmark mark   --db PATH --id ID [options] [--curator NAME]
    python -m src.curate_benchmark bulk-approve --db PATH --family F [--bucket B] [--yes]
    python -m src.curate_benchmark stats  --db PATH

mark options
    --family        {FLOW_CORE,FLOW_HELL}
    --bucket        Bucket label (see benchmark_taxonomy.py)
    --gold-type     {auto_repair,suggestion_only,abstain,no_touch}
    --ambiguity     {0,1,2,3}
    --circularity-risk {0,1}
    --idempotence-risk {0,1}
    --downstream-poison-risk {0,1}
    --duplicate-risk {0,1}
    --why-hard      Free-text explanation
    --naive-failure-mode  How a naive corrector fails
    --notes         Curator notes
    --status        {candidate,approved,rejected,needs_review}
    --curator       Curator identifier (stored in curated_by)
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.database import connect
from src.benchmark_taxonomy import BENCHMARK_FAMILIES, GOLD_TYPES, VALID_BUCKETS

_VALID_STATUSES = frozenset({'candidate', 'approved', 'rejected', 'needs_review'})

_NOW = lambda: datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


# ── Commands ──────────────────────────────────────────────────────────────────

def cmd_list(con, family=None, status=None, limit=50) -> None:
    conditions, params = [], []
    if family:
        conditions.append("bi.benchmark_family = ?")
        params.append(family)
    if status:
        conditions.append("bi.review_status = ?")
        params.append(status)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    rows = con.execute(
        f"""
        SELECT
            bi.id, bi.benchmark_family, bi.bucket, bi.gold_type,
            bi.ambiguity_level, bi.review_status,
            ec.error_form, ec.target_form, ec.variant_type,
            s.language
        FROM benchmark_items bi
        JOIN error_cases ec ON ec.id = bi.error_case_id
        JOIN sources s ON s.id = ec.source_id
        {where}
        ORDER BY bi.benchmark_family, bi.bucket, bi.id
        LIMIT ?
        """,
        params + [limit],
    ).fetchall()

    h_id, h_fam, h_bkt, h_gt, h_amb, h_st, h_err, h_tgt = (
        'ID', 'FAMILY', 'BUCKET', 'GOLD_TYPE', 'AMB', 'STATUS', 'ERROR_FORM', 'TARGET_FORM'
    )
    print(
        f"\n{h_id:>5}  {h_fam:<10}  {h_bkt:<26}  {h_gt:<16}  "
        f"{h_amb:>3}  {h_st:<13}  {h_err:<20}  {h_tgt}"
    )
    print("-" * 110)
    for r in rows:
        bucket = (r[2] or '(unset)')[:24]
        err = (r[6] or '')[:18]
        tgt = (r[7] or '-')[:18]
        print(
            f"{r[0]:>5}  {r[1]:<10}  {bucket:<26}  {r[3]:<16}  "
            f"{r[4]:>3}  {r[5]:<13}  {err:<20}  {tgt}"
        )
    print(f"\n{len(rows)} items shown (limit={limit})\n")


def cmd_mark(con, item_id: int, updates: dict, curator: str | None = None) -> None:
    if not updates:
        print("No updates specified. Use --help to see available options.")
        return

    now = _NOW()
    set_clauses = [f"{col} = ?" for col in updates]
    params = list(updates.values())

    set_clauses.append("curated_at = ?")
    params.append(now)

    if curator:
        set_clauses.append("curated_by = ?")
        params.append(curator)

    params.append(item_id)
    cursor = con.execute(
        f"UPDATE benchmark_items SET {', '.join(set_clauses)} WHERE id = ?",
        params,
    )
    con.commit()

    if cursor.rowcount == 0:
        print(f"[warn] No benchmark_item with id={item_id} found.")
    else:
        changes = ", ".join(f"{k}={v!r}" for k, v in updates.items())
        print(f"Updated id={item_id}: {changes}")


def cmd_bulk_approve(
    con, family: str, bucket: str | None = None, curator: str | None = None, yes: bool = False
) -> None:
    conditions = ["bi.review_status = 'candidate'", "bi.benchmark_family = ?"]
    params: list = [family]
    if bucket:
        conditions.append("bi.bucket = ?")
        params.append(bucket)

    where = " AND ".join(conditions)
    count = con.execute(
        f"SELECT COUNT(*) FROM benchmark_items bi WHERE {where}", params
    ).fetchone()[0]

    if count == 0:
        print("No candidate items found matching the given criteria.")
        return

    desc = f"family={family}" + (f", bucket={bucket}" if bucket else "")
    print(f"About to approve {count} candidate item(s) ({desc}).")

    if not yes:
        confirm = input("Confirm? [y/N] ").strip().lower()
        if confirm != 'y':
            print("Aborted.")
            return

    now = _NOW()
    curator_clause = ", curated_by = ?" if curator else ""
    curator_params = [curator] if curator else []

    con.execute(
        f"""
        UPDATE benchmark_items
        SET review_status = 'approved', curated_at = ? {curator_clause}
        WHERE {where}
        """,
        [now] + curator_params + params,
    )
    con.commit()
    print(f"Approved {count} item(s).")


def cmd_stats(con) -> None:
    total = con.execute("SELECT COUNT(*) FROM benchmark_items").fetchone()[0]
    print(f"\n=== Benchmark Curation Statistics  (total: {total}) ===\n")

    print("family × review_status:")
    for r in con.execute("""
        SELECT benchmark_family, review_status, COUNT(*) AS n
        FROM benchmark_items
        GROUP BY benchmark_family, review_status
        ORDER BY benchmark_family, review_status
    """):
        print(f"  {r[0]:<12}  {r[1]:<15}  {r[2]:>5}")

    print("\nfamily × bucket:")
    for r in con.execute("""
        SELECT benchmark_family, COALESCE(bucket,'(unset)'), COUNT(*) AS n
        FROM benchmark_items
        GROUP BY benchmark_family, bucket
        ORDER BY benchmark_family, bucket
    """):
        print(f"  {r[0]:<12}  {r[1]:<28}  {r[2]:>5}")

    print("\ngold_type distribution:")
    for r in con.execute("""
        SELECT gold_type, COUNT(*) AS n
        FROM benchmark_items
        GROUP BY gold_type
        ORDER BY n DESC
    """):
        print(f"  {r[0]:<22}  {r[1]:>5}")

    print("\nambiguity_level distribution:")
    for r in con.execute("""
        SELECT ambiguity_level, COUNT(*) AS n
        FROM benchmark_items
        GROUP BY ambiguity_level
        ORDER BY ambiguity_level
    """):
        print(f"  level={r[0]}  {r[1]:>5}")

    print()


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="FLOW Benchmark Curation CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    sub = parser.add_subparsers(dest="command")

    # list
    p_list = sub.add_parser("list", help="List benchmark items")
    p_list.add_argument("--db", required=True, metavar="PATH")
    p_list.add_argument("--family", choices=sorted(BENCHMARK_FAMILIES), default=None)
    p_list.add_argument("--status", choices=sorted(_VALID_STATUSES), default=None)
    p_list.add_argument("--limit", type=int, default=50)

    # mark
    p_mark = sub.add_parser("mark", help="Update a single benchmark item")
    p_mark.add_argument("--db", required=True, metavar="PATH")
    p_mark.add_argument("--id", dest="item_id", type=int, required=True, metavar="ID")
    p_mark.add_argument("--family", choices=sorted(BENCHMARK_FAMILIES), default=None)
    p_mark.add_argument("--bucket", default=None)
    p_mark.add_argument("--gold-type", dest="gold_type", choices=sorted(GOLD_TYPES), default=None)
    p_mark.add_argument("--ambiguity", type=int, choices=[0, 1, 2, 3], default=None)
    p_mark.add_argument("--circularity-risk", dest="circularity_risk", type=int, choices=[0,1], default=None)
    p_mark.add_argument("--idempotence-risk", dest="idempotence_risk", type=int, choices=[0,1], default=None)
    p_mark.add_argument("--downstream-poison-risk", dest="downstream_poison_risk", type=int, choices=[0,1], default=None)
    p_mark.add_argument("--duplicate-risk", dest="duplicate_risk", type=int, choices=[0,1], default=None)
    p_mark.add_argument("--why-hard", dest="why_hard", default=None)
    p_mark.add_argument("--naive-failure-mode", dest="naive_failure_mode", default=None)
    p_mark.add_argument("--notes", default=None)
    p_mark.add_argument("--status", choices=sorted(_VALID_STATUSES), default=None)
    p_mark.add_argument("--curator", default=None)

    # bulk-approve
    p_bulk = sub.add_parser("bulk-approve", help="Approve all candidates in a family/bucket")
    p_bulk.add_argument("--db", required=True, metavar="PATH")
    p_bulk.add_argument("--family", required=True, choices=sorted(BENCHMARK_FAMILIES))
    p_bulk.add_argument("--bucket", default=None)
    p_bulk.add_argument("--curator", default=None)
    p_bulk.add_argument("--yes", action="store_true", help="Skip confirmation prompt")

    # stats
    p_stats = sub.add_parser("stats", help="Print curation statistics")
    p_stats.add_argument("--db", required=True, metavar="PATH")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    con = connect(args.db)

    if args.command == "list":
        cmd_list(con, family=args.family, status=args.status, limit=args.limit)

    elif args.command == "mark":
        col_map = {
            'benchmark_family': args.family,
            'bucket': args.bucket,
            'gold_type': args.gold_type,
            'ambiguity_level': args.ambiguity,
            'circularity_risk': args.circularity_risk,
            'idempotence_risk': args.idempotence_risk,
            'downstream_poison_risk': args.downstream_poison_risk,
            'duplicate_risk': args.duplicate_risk,
            'why_hard': args.why_hard,
            'naive_failure_mode': args.naive_failure_mode,
            'curator_notes': args.notes,
            'review_status': args.status,
        }
        updates = {k: v for k, v in col_map.items() if v is not None}
        cmd_mark(con, args.item_id, updates, curator=args.curator)

    elif args.command == "bulk-approve":
        cmd_bulk_approve(
            con,
            family=args.family,
            bucket=args.bucket,
            curator=args.curator,
            yes=args.yes,
        )

    elif args.command == "stats":
        cmd_stats(con)

    con.close()


if __name__ == "__main__":
    main()
