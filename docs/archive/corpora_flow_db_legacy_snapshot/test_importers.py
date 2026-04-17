from pathlib import Path
from src.database import connect, execute_script, SCHEMA_PATH
from src.importers.lexicon_importer import import_lexicon_csv
from src.importers.error_pairs_importer import import_error_pairs_csv
from src.importers.context_importer import import_context_segments_csv
from src.importers.german_annotation_importer import import_german_annotations_csv

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

def write_csv(path: Path, text: str):
    path.write_text(text, encoding="utf-8")

def test_importers_and_views(tmp_path):
    con = setup_db(tmp_path)

    lex = tmp_path / "lex.csv"
    write_csv(lex, "canonical_form,variant_form,variant_type,observed_count,review_status,gold_score,requires_context\n"
                   "definitely,definately,misspelling,12,validated,5,0\n")
    pairs = tmp_path / "pairs.csv"
    write_csv(pairs, "error_form,target_form,error_type,variant_type,observed_count,review_status,gold_score,informant_group\n"
                     "schule,Schule,capitalization,misspelling,4,validated,4,l2\n")
    ctx = tmp_path / "ctx.csv"
    write_csv(ctx, "external_doc_id,segment_text,normalized_text,error_form,target_form,span_start,span_end,speaker,review_status,gold_score\n"
                   "doc-1,We met some times last year.,We met sometimes last year.,some times,sometimes,7,17,child,light_reviewed,3\n")

    assert import_lexicon_csv(con, str(lex), source_id=1, language="en") == 1
    assert import_error_pairs_csv(con, str(pairs), source_id=2, language="de") == 1
    assert import_context_segments_csv(con, str(ctx), source_id=3, language="en") == 1

    lex_count = con.execute("SELECT COUNT(*) FROM lexicon_variants WHERE variant_form='definately'").fetchone()[0]
    err_count = con.execute("SELECT COUNT(*) FROM error_cases").fetchone()[0]
    bench_count = con.execute("SELECT COUNT(*) FROM v_benchmark_error_cases").fetchone()[0]
    norm_rows = con.execute("SELECT error_form, normalized_form FROM v_normalization_candidates ORDER BY error_case_id").fetchall()

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
        "dok-8,er hat den Baler gesehen.,Baler,Baller,orthographic,2,raw_imported,11,16,NOUN,balɐ,b-a-l-e-r,ball-er,N;SG,child\n"
    )

    inserted = import_german_annotations_csv(con, str(de_csv), source_id=4, language="de")
    assert inserted == 2

    row = con.execute(
        "SELECT error_form, target_form, has_context, review_status, gold_score FROM error_cases WHERE source_id=4 ORDER BY id LIMIT 1"
    ).fetchone()
    assert tuple(row) == ("schule", "Schule", 1, "validated", 4)

    doc_count = con.execute("SELECT COUNT(*) FROM documents WHERE source_id=4").fetchone()[0]
    span_count = con.execute("SELECT COUNT(*) FROM error_spans es JOIN error_cases ec ON ec.id = es.error_case_id WHERE ec.source_id=4").fetchone()[0]
    lf_count = con.execute("SELECT COUNT(*) FROM linguistic_features lf JOIN error_cases ec ON ec.id = lf.error_case_id WHERE ec.source_id=4").fetchone()[0]
    off = con.execute(
        "SELECT off.has_capitalization_relevance FROM orthographic_feature_flags off JOIN error_cases ec ON ec.id = off.error_case_id WHERE ec.source_id=4 AND ec.error_form='schule'"
    ).fetchone()[0]

    assert doc_count == 2
    assert span_count == 2
    assert lf_count == 2
    assert off == 1
