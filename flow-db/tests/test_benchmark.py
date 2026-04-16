"""
test_benchmark.py — Focused tests for the FLOW benchmark infrastructure.

Covers:
- Migration schema integrity (benchmark_items table, indexes, views)
- FLOW_CORE / FLOW_HELL seed data loading
- Benchmark item constraints (family, gold_type, ambiguity_level)
- Ingestion workflow (ingest_candidates: insert, skip duplicates)
- Curation (mark, bulk-approve, stats)
- Export filtering (approved-only, include-candidates, by family)
- Abstain handling (gold_type=abstain, target_form=NULL)
- No-touch handling (gold_type=no_touch, idempotence_risk)
- Idempotence_risk field preserved through export
- Provenance field presence in export output
- Taxonomy module (suggest_bucket, suggest_gold_type)
"""

from __future__ import annotations

import io
import json
import sqlite3
import sys
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.database import connect, init_db, seed_db, migrate_db, execute_script
from src.ingest_benchmark_candidates import ingest_candidates
from src.curate_benchmark import cmd_list, cmd_mark, cmd_bulk_approve, cmd_stats
from src.export_benchmark import export_benchmark, print_summary
from src.benchmark_taxonomy import (
    BENCHMARK_FAMILIES, GOLD_TYPES, VALID_BUCKETS,
    suggest_bucket, suggest_gold_type,
    FLOW_CORE_BUCKETS, FLOW_HELL_BUCKETS,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def seeded_db(tmp_path):
    """DB with schema + seed.sql applied."""
    db = tmp_path / "test.db"
    seed_db(db)
    return db


@pytest.fixture
def migrated_db(seeded_db):
    """DB with schema + seed + migration 001 applied."""
    migrate_db(seeded_db)
    return seeded_db


@pytest.fixture
def full_db(migrated_db):
    """DB with schema + seed + migrations + FLOW_CORE and FLOW_HELL seeds."""
    con = connect(migrated_db)
    execute_script(con, ROOT / "benchmarks" / "seed_flow_core.sql")
    execute_script(con, ROOT / "benchmarks" / "seed_flow_hell.sql")
    con.close()
    return migrated_db


# ── Schema: migration integrity ───────────────────────────────────────────────

class TestMigrationSchema:
    def test_benchmark_items_table_exists(self, migrated_db):
        con = connect(migrated_db)
        row = con.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='benchmark_items'"
        ).fetchone()
        assert row is not None, "benchmark_items table must exist after migration"
        con.close()

    def test_required_columns_present(self, migrated_db):
        con = connect(migrated_db)
        cols = {r[1] for r in con.execute("PRAGMA table_info(benchmark_items)")}
        required = {
            'id', 'error_case_id', 'benchmark_family', 'bucket', 'gold_type',
            'ambiguity_level', 'circularity_risk', 'idempotence_risk',
            'downstream_poison_risk', 'duplicate_risk',
            'why_hard', 'naive_failure_mode', 'curator_notes',
            'review_status', 'curated_at', 'curated_by', 'created_at',
        }
        missing = required - cols
        assert not missing, f"Missing columns: {missing}"
        con.close()

    def test_indexes_exist(self, migrated_db):
        con = connect(migrated_db)
        index_names = {r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='index'"
        )}
        for expected in ['idx_bi_family', 'idx_bi_family_bucket', 'idx_bi_review_status',
                         'idx_bi_gold_type', 'idx_bi_error_case']:
            assert expected in index_names, f"Missing index: {expected}"
        con.close()

    def test_views_exist(self, migrated_db):
        con = connect(migrated_db)
        view_names = {r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='view'"
        )}
        for v in ['v_flow_core', 'v_flow_hell', 'v_benchmark_curation_queue']:
            assert v in view_names, f"Missing view: {v}"
        con.close()

    def test_family_check_constraint(self, migrated_db):
        con = connect(migrated_db)
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
                "VALUES (1, 'INVALID_FAMILY', 'auto_repair')"
            )
        con.close()

    def test_gold_type_check_constraint(self, migrated_db):
        con = connect(migrated_db)
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
                "VALUES (1, 'FLOW_CORE', 'bad_type')"
            )
        con.close()

    def test_ambiguity_level_range_constraint(self, migrated_db):
        con = connect(migrated_db)
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO benchmark_items "
                "(error_case_id, benchmark_family, gold_type, ambiguity_level) "
                "VALUES (1, 'FLOW_CORE', 'auto_repair', 5)"
            )
        con.close()

    def test_review_status_check_constraint(self, migrated_db):
        con = connect(migrated_db)
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO benchmark_items "
                "(error_case_id, benchmark_family, gold_type, review_status) "
                "VALUES (1, 'FLOW_CORE', 'auto_repair', 'unknown_status')"
            )
        con.close()

    def test_unique_constraint_family_per_case(self, migrated_db):
        con = connect(migrated_db)
        con.execute(
            "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
            "VALUES (1, 'FLOW_CORE', 'auto_repair')"
        )
        con.commit()
        # Second insert of same (error_case_id, benchmark_family) must fail
        with pytest.raises(sqlite3.IntegrityError):
            con.execute(
                "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
                "VALUES (1, 'FLOW_CORE', 'no_touch')"
            )
        # But same case in a different family is allowed
        con.execute(
            "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
            "VALUES (1, 'FLOW_HELL', 'abstain')"
        )
        con.commit()
        con.close()

    def test_foreign_key_cascade_delete(self, migrated_db):
        """Deleting an error_case must cascade to benchmark_items."""
        con = connect(migrated_db)
        con.execute(
            "INSERT INTO benchmark_items (error_case_id, benchmark_family, gold_type) "
            "VALUES (1, 'FLOW_CORE', 'auto_repair')"
        )
        con.commit()
        con.execute("DELETE FROM error_cases WHERE id = 1")
        con.commit()
        remaining = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE error_case_id = 1"
        ).fetchone()[0]
        assert remaining == 0, "Cascade delete must remove benchmark_items"
        con.close()


# ── Seed data loading ─────────────────────────────────────────────────────────

class TestSeedData:
    def test_flow_core_seed_inserts_items(self, full_db):
        con = connect(full_db)
        n = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE benchmark_family='FLOW_CORE'"
        ).fetchone()[0]
        assert n >= 3, f"Expected at least 3 FLOW_CORE items, got {n}"
        con.close()

    def test_flow_hell_seed_inserts_items(self, full_db):
        con = connect(full_db)
        n = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE benchmark_family='FLOW_HELL'"
        ).fetchone()[0]
        assert n >= 5, f"Expected at least 5 FLOW_HELL items, got {n}"
        con.close()

    def test_flow_core_approved_items_have_buckets(self, full_db):
        con = connect(full_db)
        rows = con.execute(
            "SELECT bucket FROM benchmark_items "
            "WHERE benchmark_family='FLOW_CORE' AND review_status='approved'"
        ).fetchall()
        assert len(rows) >= 3
        for r in rows:
            assert r[0] is not None and r[0] in VALID_BUCKETS, \
                f"Invalid or missing bucket: {r[0]!r}"
        con.close()

    def test_flow_hell_seed_all_buckets_populated(self, full_db):
        con = connect(full_db)
        buckets = {r[0] for r in con.execute(
            "SELECT DISTINCT bucket FROM benchmark_items WHERE benchmark_family='FLOW_HELL'"
        )}
        expected = {'ABYSS', 'MIRAGE', 'HYDRA', 'WALL', 'POISON', 'LOOP'}
        missing = expected - buckets
        assert not missing, f"FLOW_HELL seed is missing buckets: {missing}"
        con.close()

    def test_abstain_cases_have_null_target(self, full_db):
        con = connect(full_db)
        rows = con.execute(
            """
            SELECT ec.target_form
            FROM benchmark_items bi
            JOIN error_cases ec ON ec.id = bi.error_case_id
            WHERE bi.gold_type = 'abstain'
            """
        ).fetchall()
        assert len(rows) >= 1
        for r in rows:
            assert r[0] is None, \
                f"abstain case must have NULL target_form, got {r[0]!r}"
        con.close()

    def test_no_touch_cases_have_form_equals_target(self, full_db):
        con = connect(full_db)
        rows = con.execute(
            """
            SELECT ec.error_form, ec.target_form
            FROM benchmark_items bi
            JOIN error_cases ec ON ec.id = bi.error_case_id
            WHERE bi.gold_type = 'no_touch'
            """
        ).fetchall()
        assert len(rows) >= 1
        for error_form, target_form in rows:
            assert target_form is not None and error_form == target_form, \
                f"no_touch case must have error_form == target_form; got {error_form!r} → {target_form!r}"
        con.close()

    def test_idempotence_risk_preserved(self, full_db):
        con = connect(full_db)
        row = con.execute(
            "SELECT idempotence_risk FROM benchmark_items WHERE bucket='LOOP' AND review_status='approved'"
        ).fetchone()
        assert row is not None, "LOOP bucket must have at least one approved item"
        assert row[0] == 1, "LOOP items must have idempotence_risk=1"
        con.close()

    def test_provenance_fields_present(self, full_db):
        con = connect(full_db)
        rows = con.execute(
            """
            SELECT s.source_name, s.language
            FROM benchmark_items bi
            JOIN error_cases ec ON ec.id = bi.error_case_id
            JOIN sources s ON s.id = ec.source_id
            """
        ).fetchall()
        for source_name, language in rows:
            assert source_name, "source_name must not be empty"
            assert language, "language must not be empty"
        con.close()


# ── Ingestion ─────────────────────────────────────────────────────────────────

class TestIngestion:
    def test_ingest_flow_core_inserts_candidates(self, migrated_db):
        con = connect(migrated_db)
        inserted, skipped = ingest_candidates(con, family='FLOW_CORE')
        assert inserted >= 1
        assert skipped == 0
        n = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE benchmark_family='FLOW_CORE'"
        ).fetchone()[0]
        assert n == inserted
        con.close()

    def test_ingest_is_idempotent(self, migrated_db):
        con = connect(migrated_db)
        i1, s1 = ingest_candidates(con, family='FLOW_CORE')
        i2, s2 = ingest_candidates(con, family='FLOW_CORE')
        assert i2 == 0, "Second ingest must insert 0 (all already exist)"
        assert s2 == i1, "Second ingest must report all as skipped"
        con.close()

    def test_ingest_flow_hell_leaves_bucket_null(self, migrated_db):
        con = connect(migrated_db)
        ingest_candidates(con, family='FLOW_HELL')
        rows = con.execute(
            "SELECT bucket FROM benchmark_items WHERE benchmark_family='FLOW_HELL'"
        ).fetchall()
        assert len(rows) >= 1
        for r in rows:
            assert r[0] is None, "FLOW_HELL ingestion must leave bucket=NULL"
        con.close()

    def test_ingest_by_language_filter(self, migrated_db):
        con = connect(migrated_db)
        inserted, _ = ingest_candidates(con, family='FLOW_CORE', language='de')
        rows = con.execute(
            """
            SELECT s.language
            FROM benchmark_items bi
            JOIN error_cases ec ON ec.id = bi.error_case_id
            JOIN sources s ON s.id = ec.source_id
            WHERE bi.benchmark_family = 'FLOW_CORE'
            """
        ).fetchall()
        assert all(r[0] == 'de' for r in rows), "Language filter must restrict to DE only"
        con.close()

    def test_ingest_dry_run_inserts_nothing(self, migrated_db):
        con = connect(migrated_db)
        ingest_candidates(con, family='FLOW_CORE', dry_run=True)
        n = con.execute("SELECT COUNT(*) FROM benchmark_items").fetchone()[0]
        assert n == 0, "Dry-run must not insert any rows"
        con.close()

    def test_ingest_all_candidates_have_status_candidate(self, migrated_db):
        con = connect(migrated_db)
        ingest_candidates(con, family='FLOW_CORE')
        statuses = {r[0] for r in con.execute(
            "SELECT DISTINCT review_status FROM benchmark_items"
        )}
        assert statuses == {'candidate'}, \
            f"Ingestion must only produce 'candidate' items, got: {statuses}"
        con.close()

    def test_ingest_invalid_family_raises(self, migrated_db):
        con = connect(migrated_db)
        with pytest.raises(ValueError, match="Unknown benchmark family"):
            ingest_candidates(con, family='INVALID')
        con.close()


# ── Export filtering ──────────────────────────────────────────────────────────

class TestExport:
    def _insert_item(self, con, ec_id, family, gold_type, bucket, status='approved'):
        con.execute(
            """
            INSERT OR IGNORE INTO benchmark_items
              (error_case_id, benchmark_family, bucket, gold_type, review_status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (ec_id, family, bucket, gold_type, status),
        )
        con.commit()

    def test_export_approved_only_by_default(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        self._insert_item(con, 2, 'FLOW_CORE', 'auto_repair', 'segmentation', 'candidate')
        out = tmp_path / "core.jsonl"
        written = export_benchmark(con, family='FLOW_CORE', out_path=out)
        assert written == 1, "Only approved items should be exported by default"
        con.close()

    def test_export_includes_candidates_when_flagged(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        self._insert_item(con, 2, 'FLOW_CORE', 'auto_repair', 'segmentation', 'candidate')
        out = tmp_path / "core_all.jsonl"
        written = export_benchmark(con, family='FLOW_CORE', out_path=out, include_candidates=True)
        assert written == 2
        con.close()

    def test_export_family_filter(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        self._insert_item(con, 2, 'FLOW_HELL', 'abstain', 'ABYSS', 'approved')
        out_core = tmp_path / "core.jsonl"
        written = export_benchmark(con, family='FLOW_CORE', out_path=out_core)
        assert written == 1
        # Verify content is FLOW_CORE only
        line = json.loads(out_core.read_text().strip().splitlines()[0])
        assert line['benchmark_family'] == 'FLOW_CORE'
        con.close()

    def test_export_all_families(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        self._insert_item(con, 2, 'FLOW_HELL', 'abstain', 'ABYSS', 'approved')
        out = tmp_path / "all.jsonl"
        written = export_benchmark(con, family='ALL', out_path=out)
        assert written == 2
        con.close()

    def test_export_jsonl_has_required_fields(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        out = tmp_path / "check.jsonl"
        export_benchmark(con, family='FLOW_CORE', out_path=out)
        record = json.loads(out.read_text().strip())
        required_fields = {
            'benchmark_item_id', 'benchmark_family', 'bucket', 'gold_type',
            'ambiguity_level', 'circularity_risk', 'idempotence_risk',
            'downstream_poison_risk', 'error_form', 'target_form',
            'source_name', 'language',
        }
        missing = required_fields - set(record.keys())
        assert not missing, f"Export missing fields: {missing}"
        con.close()

    def test_export_csv_format(self, migrated_db, tmp_path):
        import csv
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'approved')
        out = tmp_path / "core.csv"
        export_benchmark(con, family='FLOW_CORE', out_path=out, fmt='csv')
        rows = list(csv.DictReader(out.open()))
        assert len(rows) == 1
        assert 'error_form' in rows[0]
        con.close()

    def test_export_provenance_fields_present(self, full_db, tmp_path):
        out = tmp_path / "provenance.jsonl"
        con = connect(full_db)
        export_benchmark(con, family='ALL', out_path=out)
        lines = out.read_text().strip().splitlines()
        assert len(lines) >= 1
        for line in lines:
            r = json.loads(line)
            assert r['source_name'], "source_name must be non-empty"
            assert r['language'], "language must be non-empty"
        con.close()

    def test_export_idempotence_risk_preserved(self, full_db, tmp_path):
        out = tmp_path / "hell.jsonl"
        con = connect(full_db)
        export_benchmark(con, family='FLOW_HELL', out_path=out)
        lines = out.read_text().strip().splitlines()
        loop_lines = [json.loads(l) for l in lines if json.loads(l)['bucket'] == 'LOOP']
        assert len(loop_lines) >= 1, "LOOP bucket must appear in export"
        assert all(r['idempotence_risk'] == 1 for r in loop_lines), \
            "LOOP items must have idempotence_risk=1 in export"
        con.close()

    def test_export_returns_zero_for_empty_set(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        out = tmp_path / "empty.jsonl"
        written = export_benchmark(con, family='FLOW_CORE', out_path=out)
        assert written == 0
        con.close()

    def test_rejected_items_not_exported(self, migrated_db, tmp_path):
        con = connect(migrated_db)
        self._insert_item(con, 1, 'FLOW_CORE', 'auto_repair', 'pg_confusion', 'rejected')
        out = tmp_path / "rejected.jsonl"
        written = export_benchmark(con, family='FLOW_CORE', out_path=out)
        assert written == 0, "Rejected items must not appear in approved export"
        con.close()


# ── Taxonomy module ───────────────────────────────────────────────────────────

class TestTaxonomy:
    def test_suggest_bucket_misspelling(self):
        assert suggest_bucket('misspelling') == 'pg_confusion'

    def test_suggest_bucket_token_split(self):
        assert suggest_bucket('token_split') == 'segmentation'

    def test_suggest_bucket_real_word_confusion(self):
        assert suggest_bucket('real_word_confusion') == 'abstention'

    def test_suggest_bucket_regional(self):
        assert suggest_bucket('regional') == 'no_touch'

    def test_suggest_bucket_unknown_returns_none(self):
        assert suggest_bucket('nonexistent_type') is None
        assert suggest_bucket('') is None
        assert suggest_bucket(None) is None

    def test_suggest_gold_type_clear_misspelling(self):
        assert suggest_gold_type('misspelling', 'kommen') == 'auto_repair'

    def test_suggest_gold_type_real_word_confusion(self):
        assert suggest_gold_type('real_word_confusion', 'seit') == 'abstain'

    def test_suggest_gold_type_no_target(self):
        assert suggest_gold_type('misspelling', None) == 'abstain'
        assert suggest_gold_type('misspelling', '') == 'abstain'

    def test_suggest_gold_type_high_ambiguity(self):
        assert suggest_gold_type('misspelling', 'kommen', ambiguity_level=2) == 'abstain'
        assert suggest_gold_type('misspelling', 'kommen', ambiguity_level=3) == 'abstain'

    def test_suggest_gold_type_regional(self):
        assert suggest_gold_type('regional', 'behaviour') == 'no_touch'

    def test_all_hell_buckets_defined(self):
        for bucket in ['HYDRA', 'ABYSS', 'POISON', 'MIRAGE', 'LOOP', 'WALL']:
            assert bucket in FLOW_HELL_BUCKETS, f"Missing FLOW_HELL bucket: {bucket}"
            assert FLOW_HELL_BUCKETS[bucket], f"Empty description for: {bucket}"

    def test_all_core_buckets_defined(self):
        for bucket in ['pg_confusion', 'orthographic_convention', 'segmentation',
                       'abstention', 'no_touch', 'overcorrection_trap']:
            assert bucket in FLOW_CORE_BUCKETS, f"Missing FLOW_CORE bucket: {bucket}"

    def test_valid_buckets_is_union(self):
        assert VALID_BUCKETS == frozenset(FLOW_CORE_BUCKETS) | frozenset(FLOW_HELL_BUCKETS)

    def test_benchmark_families_set(self):
        assert BENCHMARK_FAMILIES == frozenset({'FLOW_CORE', 'FLOW_HELL'})

    def test_gold_types_set(self):
        assert GOLD_TYPES == frozenset({'auto_repair', 'suggestion_only', 'abstain', 'no_touch'})


# ── View filtering ────────────────────────────────────────────────────────────

class TestViews:
    def test_v_flow_core_excludes_non_approved(self, full_db):
        con = connect(full_db)
        # The view only surfaces approved items. Count via view vs approved in table.
        view_count = con.execute("SELECT COUNT(*) FROM v_flow_core").fetchone()[0]
        table_approved = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE benchmark_family='FLOW_CORE' AND review_status='approved'"
        ).fetchone()[0]
        assert view_count == table_approved, \
            f"v_flow_core must show exactly the approved items: view={view_count}, table={table_approved}"
        # Verify needs_review (komen→kommen) does NOT appear in the view
        needs_review = con.execute(
            "SELECT COUNT(*) FROM benchmark_items WHERE benchmark_family='FLOW_CORE' AND review_status='needs_review'"
        ).fetchone()[0]
        assert needs_review >= 1, "Seed should include at least one needs_review item (komen→kommen)"
        assert view_count < (table_approved + needs_review), \
            "v_flow_core must exclude needs_review items"
        con.close()

    def test_v_flow_hell_only_hell_family(self, full_db):
        con = connect(full_db)
        rows = con.execute("SELECT benchmark_family FROM v_flow_hell").fetchall()
        assert len(rows) >= 1
        assert all(r[0] == 'FLOW_HELL' for r in rows)
        con.close()

    def test_v_benchmark_curation_queue_shows_candidates(self, full_db):
        con = connect(full_db)
        # Insert a candidate item manually
        con.execute(
            "INSERT OR IGNORE INTO benchmark_items "
            "(error_case_id, benchmark_family, gold_type, review_status) "
            "VALUES (1, 'FLOW_HELL', 'abstain', 'candidate')"
        )
        con.commit()
        rows = con.execute("SELECT * FROM v_benchmark_curation_queue").fetchall()
        assert len(rows) >= 1
        con.close()
