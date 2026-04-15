"""Importer integration tests — happy paths, edge cases, and error recovery."""
from pathlib import Path

import pytest

from src.database import connect, execute_script, SCHEMA_PATH
from src.importers.base import (
    clean,
    correction_level_for,
    safe_bool,
    safe_int,
)
from src.importers.lexicon_importer import import_lexicon_csv
from src.importers.error_pairs_importer import import_error_pairs_csv
from src.importers.context_importer import import_context_segments_csv
from src.importers.german_annotation_importer import import_german_annotations_csv


# ── Fixtures ──────────────────────────────────────────────────────────────────

def setup_db(tmp_path: Path):
    db = tmp_path / "t.db"
    con = connect(db)
    execute_script(con, SCHEMA_PATH)
    con.execute("INSERT INTO sources (source_name, resource_type, language) VALUES ('lex','lexicon','en')")
    con.execute("INSERT INTO sources (source_name, resource_type, language) VALUES ('pairs','error_pairs','en')")
    con.execute("INSERT INTO sources (source_name, resource_type, language) VALUES ('ctx','context_segments','en')")
    con.execute("INSERT INTO sources (source_name, resource_type, language) VALUES ('de_csv','error_pairs','de')")
    con.commit()
    return con


def write_csv(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


# ── base.py unit tests ────────────────────────────────────────────────────────

def test_base_safe_int():
    assert safe_int("5") == 5
    assert safe_int("0") == 0
    assert safe_int("", default=7) == 7
    assert safe_int(None) is None
    with pytest.raises(ValueError):
        safe_int("not_a_number")


def test_base_safe_bool():
    assert safe_bool("1") == 1
    assert safe_bool("yes") == 1
    assert safe_bool("true") == 1
    assert safe_bool("ja") == 1
    assert safe_bool("0") == 0
    assert safe_bool("false") == 0
    assert safe_bool("") == 0
    assert safe_bool(None) == 0
    assert safe_bool(1) == 1
    assert safe_bool(0) == 0


def test_base_clean():
    assert clean("  hello  ") == "hello"
    assert clean(None) == ""
    assert clean("") == ""
    assert clean("x", default="fallback") == "x"
    assert clean(None, default="fallback") == "fallback"


def test_base_correction_level_for():
    assert correction_level_for("token_split") == "tokenization"
    assert correction_level_for("token_merge") == "tokenization"
    assert correction_level_for("separator_substitution") == "tokenization"
    assert correction_level_for("misspelling") == "orthographic"
    assert correction_level_for("regional") == "orthographic"


# ── Existing integration tests (preserved) ───────────────────────────────────

def test_importers_and_views(tmp_path):
    con = setup_db(tmp_path)

    lex = tmp_path / "lex.csv"
    write_csv(
        lex,
        "canonical_form,variant_form,variant_type,observed_count,review_status,gold_score,requires_context\n"
        "definitely,definately,misspelling,12,validated,5,0\n",
    )
    pairs = tmp_path / "pairs.csv"
    write_csv(
        pairs,
        "error_form,target_form,error_type,variant_type,observed_count,review_status,gold_score,informant_group\n"
        "schule,Schule,capitalization,misspelling,4,validated,4,l2\n",
    )
    ctx = tmp_path / "ctx.csv"
    write_csv(
        ctx,
        "external_doc_id,segment_text,normalized_text,error_form,target_form,span_start,span_end,speaker,review_status,gold_score\n"
        "doc-1,We met some times last year.,We met sometimes last year.,some times,sometimes,7,17,child,light_reviewed,3\n",
    )

    inserted_lex, _ = import_lexicon_csv(con, str(lex), source_id=1, language="en")
    inserted_pairs, _ = import_error_pairs_csv(con, str(pairs), source_id=2, language="de")
    inserted_ctx, _ = import_context_segments_csv(con, str(ctx), source_id=3, language="en")

    assert inserted_lex == 1
    assert inserted_pairs == 1
    assert inserted_ctx == 1

    lex_count = con.execute(
        "SELECT COUNT(*) FROM lexicon_variants WHERE variant_form='definately'"
    ).fetchone()[0]
    err_count = con.execute("SELECT COUNT(*) FROM error_cases").fetchone()[0]
    bench_count = con.execute("SELECT COUNT(*) FROM v_benchmark_error_cases").fetchone()[0]
    norm_rows = con.execute(
        "SELECT error_form, normalized_form FROM v_normalization_candidates ORDER BY error_case_id"
    ).fetchall()

    assert lex_count == 1
    assert err_count >= 2
    assert bench_count >= 2
    assert ("schule", "Schule") in {(r[0], r[1]) for r in norm_rows}
    assert ("some times", "sometimes") in {(r[0], r[1]) for r in norm_rows}


def test_german_annotation_importer_aliases_and_features(tmp_path):
    con = setup_db(tmp_path)
    de_csv = tmp_path / "de_annotations.csv"
    write_csv(
        de_csv,
        "dokument_id,satz,fehlerform,korrektur,fehlertyp,gold_score,review_status,start,end,pos,phonemes,graphemes,morphemes,morph_tags,gruppe\n"
        "dok-7,ich gehe in die schule.,schule,Schule,capitalization,4,validated,17,23,NOUN,ʃuːlə,sch-u-le,schul-e,N;SG,l2\n"
        "dok-8,er hat den Baler gesehen.,Baler,Baller,orthographic,2,raw_imported,11,16,NOUN,balɐ,b-a-l-e-r,ball-er,N;SG,child\n",
    )

    inserted, skipped = import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    assert inserted == 2
    assert skipped == 0

    row = con.execute(
        "SELECT error_form, target_form, has_context, review_status, gold_score"
        " FROM error_cases WHERE source_id=4 ORDER BY id LIMIT 1"
    ).fetchone()
    assert tuple(row) == ("schule", "Schule", 1, "validated", 4)

    doc_count = con.execute("SELECT COUNT(*) FROM documents WHERE source_id=4").fetchone()[0]
    span_count = con.execute(
        "SELECT COUNT(*) FROM error_spans es"
        " JOIN error_cases ec ON ec.id = es.error_case_id WHERE ec.source_id=4"
    ).fetchone()[0]
    lf_count = con.execute(
        "SELECT COUNT(*) FROM linguistic_features lf"
        " JOIN error_cases ec ON ec.id = lf.error_case_id WHERE ec.source_id=4"
    ).fetchone()[0]
    off = con.execute(
        "SELECT off.has_capitalization_relevance"
        " FROM orthographic_feature_flags off"
        " JOIN error_cases ec ON ec.id = off.error_case_id"
        " WHERE ec.source_id=4 AND ec.error_form='schule'"
    ).fetchone()[0]

    assert doc_count == 2
    assert span_count == 2
    assert lf_count == 2
    assert off == 1


# ── Lexicon importer edge cases ───────────────────────────────────────────────

def test_lexicon_missing_canonical_form_skipped(tmp_path):
    con = setup_db(tmp_path)
    lex = tmp_path / "missing_col.csv"
    write_csv(
        lex,
        "canonical_form,variant_form,variant_type\n"
        ",wrod,misspelling\n"       # empty canonical_form → skip
        "good,goood,misspelling\n",
    )
    inserted, skipped = import_lexicon_csv(con, str(lex), source_id=1, language="en")
    assert inserted == 1
    assert skipped == 1


def test_lexicon_invalid_variant_type_defaults_to_misspelling(tmp_path):
    con = setup_db(tmp_path)
    lex = tmp_path / "inv_vt.csv"
    write_csv(
        lex,
        "canonical_form,variant_form,variant_type\n"
        "word,wrod,totally_invalid_type\n",
    )
    inserted, skipped = import_lexicon_csv(con, str(lex), source_id=1, language="en")
    assert inserted == 1
    assert skipped == 0
    row = con.execute(
        "SELECT variant_type FROM lexicon_variants WHERE variant_form='wrod'"
    ).fetchone()
    assert row[0] == "misspelling"


def test_lexicon_duplicate_variant_ignored(tmp_path):
    con = setup_db(tmp_path)
    lex = tmp_path / "dup.csv"
    # Same canonical_form + variant_form + variant_type twice — second INSERT OR IGNORE
    write_csv(
        lex,
        "canonical_form,variant_form,variant_type\n"
        "definitely,definately,misspelling\n"
        "definitely,definately,misspelling\n",
    )
    inserted, skipped = import_lexicon_csv(con, str(lex), source_id=1, language="en")
    # Both rows count as "inserted" in our loop (the second is a no-op)
    assert inserted == 2
    count = con.execute(
        "SELECT COUNT(*) FROM lexicon_variants WHERE variant_form='definately'"
    ).fetchone()[0]
    assert count == 1


def test_lexicon_malformed_count_still_inserts(tmp_path):
    """safe_int returns None for bad values; the row still inserts with NULL observed_count."""
    con = setup_db(tmp_path)
    lex = tmp_path / "bad_count.csv"
    write_csv(
        lex,
        "canonical_form,variant_form,variant_type,observed_count\n"
        "word,wrod,misspelling,NOT_A_NUMBER\n",
    )
    with pytest.raises(ValueError):
        # safe_int raises ValueError on non-numeric input (by design)
        safe_int("NOT_A_NUMBER")
    # The importer catches that ValueError and skips the row
    inserted, skipped = import_lexicon_csv(con, str(lex), source_id=1, language="en")
    assert skipped == 1


# ── Error-pairs importer edge cases ──────────────────────────────────────────

def test_error_pairs_invalid_informant_group_defaults_to_unknown(tmp_path):
    con = setup_db(tmp_path)
    pairs = tmp_path / "bad_group.csv"
    write_csv(
        pairs,
        "error_form,target_form,informant_group\n"
        "schule,Schule,robots\n",
    )
    inserted, skipped = import_error_pairs_csv(con, str(pairs), source_id=2, language="de")
    assert inserted == 1
    assert skipped == 0
    row = con.execute(
        "SELECT informant_group FROM error_cases WHERE error_form='schule'"
    ).fetchone()
    assert row[0] == "unknown"


def test_error_pairs_missing_error_form_skipped(tmp_path):
    con = setup_db(tmp_path)
    pairs = tmp_path / "no_ef.csv"
    write_csv(
        pairs,
        "error_form,target_form\n"
        ",Schule\n"          # empty error_form → skip
        "schule,Schule\n",
    )
    inserted, skipped = import_error_pairs_csv(con, str(pairs), source_id=2, language="de")
    assert inserted == 1
    assert skipped == 1


# ── Context importer edge cases ───────────────────────────────────────────────

def test_context_missing_external_doc_id_skipped(tmp_path):
    con = setup_db(tmp_path)
    ctx = tmp_path / "no_doc.csv"
    write_csv(
        ctx,
        "external_doc_id,segment_text,error_form,target_form\n"
        ",We met some times.,some times,sometimes\n"   # empty doc id → skip
        "doc-1,We go there.,there,their\n",
    )
    inserted, skipped = import_context_segments_csv(con, str(ctx), source_id=3, language="en")
    assert inserted == 1
    assert skipped == 1


def test_context_token_split_detection(tmp_path):
    con = setup_db(tmp_path)
    ctx = tmp_path / "split.csv"
    write_csv(
        ctx,
        "external_doc_id,segment_text,error_form,target_form\n"
        "doc-1,We met some times.,some times,sometimes\n",
    )
    import_context_segments_csv(con, str(ctx), source_id=3, language="en")
    row = con.execute(
        "SELECT variant_type, is_tokenization_issue FROM error_cases WHERE error_form='some times'"
    ).fetchone()
    assert row[0] == "token_split"
    assert row[1] == 1


def test_context_token_merge_detection(tmp_path):
    con = setup_db(tmp_path)
    ctx = tmp_path / "merge.csv"
    write_csv(
        ctx,
        "external_doc_id,segment_text,error_form,target_form\n"
        "doc-1,He wentintohouse.,wentintohouse,went into house\n",
    )
    import_context_segments_csv(con, str(ctx), source_id=3, language="en")
    row = con.execute(
        "SELECT variant_type FROM error_cases WHERE error_form='wentintohouse'"
    ).fetchone()
    assert row[0] == "token_merge"


# ── German annotation importer edge cases ────────────────────────────────────

def test_german_importer_no_doc_id_does_not_create_phantom_document(tmp_path):
    """Rows without external_doc_id must NOT create a 'generated' phantom document."""
    con = setup_db(tmp_path)
    de_csv = tmp_path / "no_doc.csv"
    write_csv(
        de_csv,
        "fehlerform,korrektur\n"
        "schule,Schule\n"
        "komen,kommen\n",
    )
    inserted, skipped = import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    assert inserted == 2
    assert skipped == 0
    doc_count = con.execute(
        "SELECT COUNT(*) FROM documents WHERE source_id=4"
    ).fetchone()[0]
    assert doc_count == 0  # no phantom documents


def test_german_importer_normalized_text_is_null(tmp_path):
    """segments.normalized_text must be NULL — not a copy of the raw erroneous text."""
    con = setup_db(tmp_path)
    de_csv = tmp_path / "with_doc.csv"
    write_csv(
        de_csv,
        "dokument_id,satz,fehlerform,korrektur\n"
        "dok-1,ich gehe in die schule.,schule,Schule\n",
    )
    import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    row = con.execute(
        "SELECT normalized_text FROM segments"
        " WHERE document_id IN (SELECT id FROM documents WHERE source_id=4)"
    ).fetchone()
    assert row[0] is None


def test_german_importer_consonant_doubling_heuristic(tmp_path):
    con = setup_db(tmp_path)
    de_csv = tmp_path / "doubling.csv"
    write_csv(
        de_csv,
        "fehlerform,korrektur\n"
        "komen,kommen\n"    # doubled m in target → flag
        "Masse,Maße\n",     # no consonant doubling difference → no flag
    )
    import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    rows = {
        r[0]: r[1]
        for r in con.execute(
            "SELECT ec.error_form, off.has_consonant_doubling"
            " FROM error_cases ec"
            " JOIN orthographic_feature_flags off ON off.error_case_id = ec.id"
            " WHERE ec.source_id=4"
        ).fetchall()
    }
    assert rows["komen"] == 1
    assert rows["Masse"] == 0


def test_german_importer_capitalization_heuristic(tmp_path):
    con = setup_db(tmp_path)
    de_csv = tmp_path / "cap.csv"
    write_csv(
        de_csv,
        "fehlerform,korrektur\n"
        "schule,Schule\n",   # differs only in capitalisation → flag
    )
    import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    row = con.execute(
        "SELECT off.has_capitalization_relevance"
        " FROM orthographic_feature_flags off"
        " JOIN error_cases ec ON ec.id = off.error_case_id"
        " WHERE ec.source_id=4 AND ec.error_form='schule'"
    ).fetchone()
    assert row[0] == 1


def test_german_importer_alias_berichtigung(tmp_path):
    """'berichtigung' column header must be recognised as target_form alias."""
    con = setup_db(tmp_path)
    de_csv = tmp_path / "alias.csv"
    write_csv(
        de_csv,
        "fehlerform,berichtigung\n"
        "schule,Schule\n",
    )
    inserted, skipped = import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    assert inserted == 1
    assert skipped == 0
    row = con.execute(
        "SELECT target_form FROM error_cases WHERE source_id=4"
    ).fetchone()
    assert row[0] == "Schule"


def test_german_importer_no_linguistic_features_when_absent(tmp_path):
    """Rows with no linguistic columns must not insert into linguistic_features."""
    con = setup_db(tmp_path)
    de_csv = tmp_path / "no_ling.csv"
    write_csv(
        de_csv,
        "fehlerform,korrektur\n"
        "schule,Schule\n",
    )
    import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    lf_count = con.execute(
        "SELECT COUNT(*) FROM linguistic_features lf"
        " JOIN error_cases ec ON ec.id = lf.error_case_id WHERE ec.source_id=4"
    ).fetchone()[0]
    assert lf_count == 0
