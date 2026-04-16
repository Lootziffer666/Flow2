"""SQLite helper and CLI for schema, seed, migrate, import, stats, and benchmark operations."""
from __future__ import annotations
import argparse
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema.sql"
SEED_PATH = ROOT / "seed.sql"
MIGRATIONS_DIR = ROOT / "migrations"
DEFAULT_DB = ROOT / "corpus.db"

# ── Connection ────────────────────────────────────────────────────────────────

def connect(db_path: str | Path = DEFAULT_DB) -> sqlite3.Connection:
    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON;")
    return con

def execute_script(con: sqlite3.Connection, path: str | Path) -> None:
    con.executescript(Path(path).read_text(encoding="utf-8"))

# ── Core operations ───────────────────────────────────────────────────────────

def init_db(db_path: str | Path = DEFAULT_DB) -> None:
    with connect(db_path) as con:
        execute_script(con, SCHEMA_PATH)
    print(f"[init] schema applied → {db_path}")

def seed_db(db_path: str | Path = DEFAULT_DB) -> None:
    with connect(db_path) as con:
        execute_script(con, SCHEMA_PATH)
        execute_script(con, SEED_PATH)
    print(f"[seed] schema + seed applied → {db_path}")

def migrate_db(db_path: str | Path = DEFAULT_DB) -> None:
    """Apply all SQL migration files from migrations/ in lexicographic order.

    Migration files must be idempotent (use IF NOT EXISTS, INSERT OR IGNORE, etc.).
    """
    if not MIGRATIONS_DIR.exists():
        print(f"[migrate] No migrations/ directory found at {MIGRATIONS_DIR}")
        return
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not files:
        print("[migrate] No migration files found.")
        return
    with connect(db_path) as con:
        for f in files:
            execute_script(con, f)
            print(f"[migrate] Applied → {f.name}")
    print(f"[migrate] Done → {db_path}")

def stats_db(db_path: str | Path = DEFAULT_DB) -> None:
    """Print row counts for every table and a few breakdown sub-queries."""
    tables = [
        "sources", "participants", "documents", "segments",
        "lexicon_entries", "lexicon_variants",
        "error_cases", "error_spans",
        "linguistic_features", "orthographic_feature_flags",
        "benchmark_collections", "benchmark_subsets", "corpus_profiles",
        "benchmark_items",
    ]
    with connect(db_path) as con:
        print(f"\n── Stats: {db_path} ──")
        for table in tables:
            n = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  {table:<32} {n:>6}")

        # Error-case breakdowns
        ec = con.execute("SELECT COUNT(*) FROM error_cases").fetchone()[0]
        if ec:
            print("\n  error_cases by language:")
            for row in con.execute(
                "SELECT language, COUNT(*) FROM error_cases GROUP BY language ORDER BY 2 DESC"
            ):
                print(f"    {row[0]:<10} {row[1]:>6}")
            print("\n  error_cases by review_status:")
            for row in con.execute(
                "SELECT review_status, COUNT(*) FROM error_cases GROUP BY review_status ORDER BY 2 DESC"
            ):
                print(f"    {row[0]:<20} {row[1]:>6}")
        print()

# ── Import dispatcher ─────────────────────────────────────────────────────────

def _import_file(
    con: sqlite3.Connection,
    kind: str,
    file_path: str | Path,
    source_id: int,
    language: str,
) -> tuple[int, int]:
    if kind == "lexicon":
        from src.importers.lexicon_importer import import_lexicon_csv
        return import_lexicon_csv(con, file_path, source_id, language)
    elif kind == "error_pairs":
        from src.importers.error_pairs_importer import import_error_pairs_csv
        return import_error_pairs_csv(con, file_path, source_id, language)
    elif kind == "context":
        from src.importers.context_importer import import_context_segments_csv
        return import_context_segments_csv(con, file_path, source_id, language)
    elif kind == "german_annotations":
        from src.importers.german_annotation_importer import import_german_annotations_csv
        return import_german_annotations_csv(con, file_path, source_id, language or "de")
    else:
        raise ValueError(f"Unsupported import type: {kind!r}")

# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    p = argparse.ArgumentParser(description="flow-db corpus management CLI")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="Apply schema to a new or existing DB")
    p_init.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")

    p_seed = sub.add_parser("seed", help="Apply schema and insert seed data")
    p_seed.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")

    p_migrate = sub.add_parser("migrate", help="Apply SQL migrations from migrations/")
    p_migrate.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")

    p_bm = sub.add_parser("benchmark-seed", help="Apply benchmark seed SQL files")
    p_bm.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")
    p_bm.add_argument(
        "--file", required=True, metavar="SQL",
        help="Benchmark seed SQL file (e.g. benchmarks/seed_flow_core.sql)",
    )

    p_imp = sub.add_parser("import", help="Import a CSV file")
    p_imp.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")
    p_imp.add_argument(
        "--type",
        choices=["lexicon", "error_pairs", "context", "german_annotations"],
        required=True,
        metavar="TYPE",
    )
    p_imp.add_argument("--file", required=True, metavar="CSV")
    p_imp.add_argument("--source-id", type=int, required=True, metavar="ID")
    p_imp.add_argument("--language", required=True, metavar="LANG")

    p_stats = sub.add_parser("stats", help="Print row counts for all tables")
    p_stats.add_argument("--db", default=str(DEFAULT_DB), metavar="PATH")

    args = p.parse_args()

    if args.cmd == "init":
        init_db(args.db)
    elif args.cmd == "seed":
        seed_db(args.db)
    elif args.cmd == "migrate":
        migrate_db(args.db)
    elif args.cmd == "benchmark-seed":
        sql_path = Path(args.file)
        if not sql_path.exists():
            print(f"[error] File not found: {sql_path}", file=sys.stderr)
            sys.exit(1)
        with connect(args.db) as con:
            execute_script(con, sql_path)
        print(f"[benchmark-seed] Applied → {sql_path.name}")
    elif args.cmd == "stats":
        stats_db(args.db)
    elif args.cmd == "import":
        file_path = Path(args.file)
        if not file_path.exists():
            print(f"[error] File not found: {file_path}", file=sys.stderr)
            sys.exit(1)
        with connect(args.db) as con:
            inserted, skipped = _import_file(
                con, args.type, file_path, args.source_id, args.language
            )
        print(f"[import] {args.type} → {inserted} inserted, {skipped} skipped")

if __name__ == "__main__":
    main()
