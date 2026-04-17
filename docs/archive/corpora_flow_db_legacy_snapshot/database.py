"""SQLite helper and tiny CLI for schema, seed and imports."""
from __future__ import annotations
import argparse
import csv
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schema.sql"
SEED_PATH = ROOT / "seed.sql"
DEFAULT_DB = ROOT / "corpus.db"

def connect(db_path: str | Path = DEFAULT_DB) -> sqlite3.Connection:
    con = sqlite3.connect(str(db_path))
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON;")
    return con

def execute_script(con: sqlite3.Connection, path: str | Path) -> None:
    con.executescript(Path(path).read_text(encoding="utf-8"))

def init_db(db_path: str | Path = DEFAULT_DB) -> None:
    with connect(db_path) as con:
        execute_script(con, SCHEMA_PATH)

def seed_db(db_path: str | Path = DEFAULT_DB) -> None:
    with connect(db_path) as con:
        execute_script(con, SCHEMA_PATH)
        execute_script(con, SEED_PATH)

def _import_file(con: sqlite3.Connection, kind: str, file_path: str | Path, source_id: int, language: str) -> None:
    if kind == "lexicon":
        from src.importers.lexicon_importer import import_lexicon_csv
        import_lexicon_csv(con, file_path, source_id, language)
    elif kind == "error_pairs":
        from src.importers.error_pairs_importer import import_error_pairs_csv
        import_error_pairs_csv(con, file_path, source_id, language)
    elif kind == "context":
        from src.importers.context_importer import import_context_segments_csv
        import_context_segments_csv(con, file_path, source_id, language)
    elif kind == "german_annotations":
        from src.importers.german_annotation_importer import import_german_annotations_csv
        import_german_annotations_csv(con, file_path, source_id, language or "de")
    else:
        raise ValueError(f"Unsupported import type: {kind}")

def main() -> None:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init")
    p_init.add_argument("--db", default=str(DEFAULT_DB))

    p_seed = sub.add_parser("seed")
    p_seed.add_argument("--db", default=str(DEFAULT_DB))

    p_imp = sub.add_parser("import")
    p_imp.add_argument("--db", default=str(DEFAULT_DB))
    p_imp.add_argument("--type", choices=["lexicon", "error_pairs", "context", "german_annotations"], required=True)
    p_imp.add_argument("--file", required=True)
    p_imp.add_argument("--source-id", type=int, required=True)
    p_imp.add_argument("--language", required=True)

    args = p.parse_args()
    if args.cmd == "init":
        init_db(args.db)
    elif args.cmd == "seed":
        seed_db(args.db)
    elif args.cmd == "import":
        with connect(args.db) as con:
            _import_file(con, args.type, args.file, args.source_id, args.language)

if __name__ == "__main__":
    main()