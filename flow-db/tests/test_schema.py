"""Schema integrity tests — structure, constraints, views, indexes."""
import sqlite3
from pathlib import Path

import pytest

from src.database import connect, execute_script, SCHEMA_PATH, SEED_PATH


def make_db(tmp_path: Path) -> sqlite3.Connection:
    db = tmp_path / "t.db"
    con = connect(db)
    execute_script(con, SCHEMA_PATH)
    return con


def _add_source(con: sqlite3.Connection, name: str = "src") -> int:
    con.execute(
        "INSERT INTO sources (source_name, resource_type, language) VALUES (?, 'lexicon', 'en')",
        (name,),
    )
    return con.execute(
        "SELECT id FROM sources WHERE source_name=?", (name,)
    ).fetchone()[0]


# ── Existing tests ────────────────────────────────────────────────────────────

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
        con.execute(
            "INSERT INTO sources (source_name, resource_type, language, gold_score)"
            " VALUES ('x','lexicon','en',9)"
        )
    with pytest.raises(sqlite3.IntegrityError):
        con.execute(
            "INSERT INTO sources (source_name, resource_type, language, review_status)"
            " VALUES ('y','lexicon','en','bad')"
        )


# ── New tests ─────────────────────────────────────────────────────────────────

def test_new_indexes_exist(tmp_path):
    con = make_db(tmp_path)
    indexes = {
        r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='index'")
    }
    assert "idx_lex_var_entry" in indexes
    assert "idx_error_cases_source" in indexes
    assert "idx_error_cases_variant_type" in indexes


def test_documents_null_doc_id_with_context_rejected(tmp_path):
    con = make_db(tmp_path)
    src_id = _add_source(con)
    # has_context=1 with NULL external_doc_id must be rejected by CHECK constraint
    with pytest.raises(sqlite3.IntegrityError):
        con.execute(
            "INSERT INTO documents (source_id, has_context) VALUES (?, 1)",
            (src_id,),
        )
    # has_context=0 with NULL external_doc_id is fine
    con.execute(
        "INSERT INTO documents (source_id, has_context) VALUES (?, 0)",
        (src_id,),
    )


def test_variant_type_constraint(tmp_path):
    con = make_db(tmp_path)
    src_id = _add_source(con)
    con.execute(
        "INSERT INTO lexicon_entries (source_id, canonical_form, language) VALUES (?, 'word', 'en')",
        (src_id,),
    )
    entry_id = con.execute("SELECT id FROM lexicon_entries").fetchone()[0]
    with pytest.raises(sqlite3.IntegrityError):
        con.execute(
            "INSERT INTO lexicon_variants (lexicon_entry_id, variant_form, variant_type)"
            " VALUES (?, 'wrd', 'nonexistent_type')",
            (entry_id,),
        )


def test_informant_group_constraint(tmp_path):
    con = make_db(tmp_path)
    src_id = _add_source(con)
    with pytest.raises(sqlite3.IntegrityError):
        con.execute(
            "INSERT INTO error_cases"
            " (source_id, language, error_form, informant_group)"
            " VALUES (?, 'en', 'x', 'robot')",
            (src_id,),
        )


def test_view_excluded_status_filtered(tmp_path):
    con = make_db(tmp_path)
    execute_script(con, SEED_PATH)
    src_id = con.execute("SELECT id FROM sources LIMIT 1").fetchone()[0]
    con.execute(
        "INSERT INTO error_cases (source_id, language, error_form, review_status)"
        " VALUES (?, 'en', 'xyzexcluded', 'excluded')",
        (src_id,),
    )
    rows = con.execute(
        "SELECT error_form FROM v_normalization_candidates WHERE error_form='xyzexcluded'"
    ).fetchall()
    assert len(rows) == 0


def test_view_benchmark_gold_score_threshold(tmp_path):
    con = make_db(tmp_path)
    execute_script(con, SEED_PATH)
    src_id = con.execute("SELECT id FROM sources LIMIT 1").fetchone()[0]
    # gold_score=1 is below the threshold of 2; review_status=validated is fine
    con.execute(
        "INSERT INTO error_cases"
        " (source_id, language, error_form, target_form, review_status, gold_score)"
        " VALUES (?, 'en', 'lowscore', 'lowscore_target', 'validated', 1)",
        (src_id,),
    )
    rows = con.execute(
        "SELECT error_form FROM v_benchmark_error_cases WHERE error_form='lowscore'"
    ).fetchall()
    assert len(rows) == 0
