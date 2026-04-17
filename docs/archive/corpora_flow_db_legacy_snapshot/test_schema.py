import sqlite3
from pathlib import Path
import pytest
from src.database import connect, execute_script, SCHEMA_PATH, SEED_PATH

def make_db(tmp_path: Path):
    db = tmp_path / "t.db"
    con = connect(db)
    execute_script(con, SCHEMA_PATH)
    return con

def test_foreign_keys_enabled(tmp_path):
    con = make_db(tmp_path)
    assert con.execute("PRAGMA foreign_keys").fetchone()[0] == 1

def test_tables_and_seed(tmp_path):
    con = make_db(tmp_path)
    execute_script(con, SEED_PATH)
    count = con.execute("SELECT COUNT(*) FROM sources").fetchone()[0]
    assert count >= 4
    names = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='view'")}
    assert {"v_normalization_candidates", "v_benchmark_error_cases", "v_research_cases_enriched"} <= names

def test_constraints_gold_and_review(tmp_path):
    con = make_db(tmp_path)
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("INSERT INTO sources (source_name, resource_type, language, gold_score) VALUES ('x','lexicon','en',9)")
    with pytest.raises(sqlite3.IntegrityError):
        con.execute("INSERT INTO sources (source_name, resource_type, language, review_status) VALUES ('y','lexicon','en','bad')")