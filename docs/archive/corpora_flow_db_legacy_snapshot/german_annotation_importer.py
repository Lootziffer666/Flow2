"""Importer for German annotated CSV files with flexible column aliases."""
from __future__ import annotations
import sqlite3
from src.importers.base import read_csv_rows

COLUMN_ALIASES = {
    "document_id": ["document_id", "external_doc_id", "doc_id", "dokument_id", "text_id"],
    "segment_text": ["segment_text", "sentence", "satz", "context", "kontext", "raw_text"],
    "error_form": ["error_form", "fehlerform", "fehler", "wrong", "token_error"],
    "target_form": ["target_form", "korrektur", "ziel_form", "correct", "normalization", "target"],
    "error_type": ["error_type", "fehlertyp", "category", "label"],
    "review_status": ["review_status", "review", "status"],
    "gold_score": ["gold_score", "gold", "score"],
    "informant_group": ["informant_group", "gruppe", "group_label"],
    "variant_type": ["variant_type", "variant", "varianten_typ"],
    "observed_count": ["observed_count", "count", "anzahl", "freq"],
    "span_start": ["span_start", "start", "offset_start"],
    "span_end": ["span_end", "end", "offset_end"],
    "pos_tag": ["pos_tag", "pos"],
    "phoneme_sequence": ["phoneme_sequence", "phonemes"],
    "grapheme_sequence": ["grapheme_sequence", "graphemes"],
    "morpheme_segmentation": ["morpheme_segmentation", "morphemes"],
    "morpheme_tags": ["morpheme_tags", "morph_tags"],
    "is_named_entity": ["is_named_entity", "named_entity"],
    "is_real_word_confusion": ["is_real_word_confusion", "real_word_confusion"],
}

def _pick(row: dict, logical_name: str, default=None):
    for alias in COLUMN_ALIASES[logical_name]:
        if alias in row and row[alias] not in (None, ""):
            return row[alias]
    return default

def _to_int(value, default=0):
    if value in (None, ""):
        return default
    return int(value)

def _to_bool(value, default=0):
    if value in (None, ""):
        return default
    if isinstance(value, int):
        return 1 if value else 0
    return 1 if str(value).strip().lower() in {"1", "true", "yes", "y", "ja"} else 0

def _guess_variant_type(error_form: str, target_form: str, given: str | None) -> str:
    if given:
        return given
    ef, tf = error_form.strip(), target_form.strip()
    if " " in ef and " " not in tf:
        return "token_split"
    if " " not in ef and " " in tf:
        return "token_merge"
    return "misspelling"

def _guess_error_type(error_form: str, target_form: str, given: str | None) -> str:
    if given:
        return given
    ef, tf = error_form.strip(), target_form.strip()
    if ef.lower() == tf.lower() and ef != tf:
        return "capitalization"
    return "orthographic"

def _ensure_document_segment(
    con: sqlite3.Connection,
    source_id: int,
    external_doc_id: str | None,
    segment_text: str | None,
) -> tuple[int | None, int | None]:
    if not external_doc_id and not segment_text:
        return None, None
    doc_key = external_doc_id or "generated"
    con.execute(
        "INSERT OR IGNORE INTO documents (source_id, external_doc_id, has_context) VALUES (?, ?, 1)",
        (source_id, doc_key),
    )
    document_id = con.execute(
        "SELECT id FROM documents WHERE source_id=? AND external_doc_id=?",
        (source_id, doc_key),
    ).fetchone()[0]
    segment_id = None
    if segment_text:
        cur = con.execute(
            "INSERT INTO segments (document_id, raw_text, normalized_text, confidence) VALUES (?, ?, ?, ?)",
            (document_id, segment_text, segment_text, 1.0),
        )
        segment_id = cur.lastrowid
    return document_id, segment_id

def import_german_annotations_csv(con: sqlite3.Connection, file_path: str, source_id: int, language: str = "de") -> int:
    """
    Flexible importer for German annotation CSVs such as German_Annotation_V028.csv.

    Minimal expected logical fields:
    - error_form / fehlerform
    - target_form / korrektur

    Optional aliases exist for document/context, spans, review, quality, and a few linguistic features.
    """
    inserted = 0
    for row in read_csv_rows(file_path):
        error_form = (_pick(row, "error_form") or "").strip()
        target_form = (_pick(row, "target_form") or "").strip()
        if not error_form or not target_form:
            continue

        variant_type = _guess_variant_type(error_form, target_form, _pick(row, "variant_type"))
        error_type = _guess_error_type(error_form, target_form, _pick(row, "error_type"))
        correction_level = "tokenization" if variant_type in {"token_split", "token_merge", "separator_substitution"} else "orthographic"
        has_context = 1 if (_pick(row, "document_id") or _pick(row, "segment_text")) else 0
        document_id, segment_id = _ensure_document_segment(
            con,
            source_id,
            (_pick(row, "document_id") or "").strip() or None,
            (_pick(row, "segment_text") or "").strip() or None,
        )

        cur = con.execute(
            """
            INSERT INTO error_cases
            (source_id, document_id, segment_id, language, error_form, target_form, error_type, correction_level,
             orthographic_target, grammatical_status, informant_group, variant_type, observed_count, review_status,
             gold_score, has_context, is_named_entity, is_real_word_confusion, is_tokenization_issue,
             requires_context, review_required, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?, ?, COALESCE(?, 'raw_imported'),
                    COALESCE(?, 0), ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                source_id,
                document_id,
                segment_id,
                language,
                error_form,
                target_form,
                error_type,
                correction_level,
                target_form,
                (_pick(row, "informant_group") or "unknown"),
                variant_type,
                _to_int(_pick(row, "observed_count"), None),
                _pick(row, "review_status"),
                _to_int(_pick(row, "gold_score"), 0),
                has_context,
                _to_bool(_pick(row, "is_named_entity"), 0),
                _to_bool(_pick(row, "is_real_word_confusion"), 0),
                1 if variant_type in {"token_split", "token_merge", "separator_substitution"} else 0,
                1 if has_context or variant_type == "uncertain_interpretation" else 0,
                1 if (_pick(row, "review_status") or "raw_imported") == "raw_imported" else 0,
                "imported_from_german_annotation_csv",
            ),
        )
        case_id = cur.lastrowid

        span_start = _pick(row, "span_start")
        span_end = _pick(row, "span_end")
        if span_start not in (None, "") and span_end not in (None, ""):
            con.execute(
                "INSERT INTO error_spans (error_case_id, span_start, span_end, error_form, target_form) VALUES (?, ?, ?, ?, ?)",
                (case_id, int(span_start), int(span_end), error_form, target_form),
            )

        if any(_pick(row, name) not in (None, "") for name in ["phoneme_sequence", "grapheme_sequence", "morpheme_segmentation", "morpheme_tags", "pos_tag"]):
            con.execute(
                """
                INSERT INTO linguistic_features
                (error_case_id, phoneme_sequence, grapheme_sequence, morpheme_segmentation, morpheme_tags, pos_tag)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    case_id,
                    _pick(row, "phoneme_sequence"),
                    _pick(row, "grapheme_sequence"),
                    _pick(row, "morpheme_segmentation"),
                    _pick(row, "morpheme_tags"),
                    _pick(row, "pos_tag"),
                ),
            )

        if language == "de":
            con.execute(
                """
                INSERT INTO orthographic_feature_flags
                (error_case_id, has_consonant_doubling, has_capitalization_relevance)
                VALUES (?, ?, ?)
                """,
                (
                    case_id,
                    1 if "ss" in target_form or "ll" in target_form or "mm" in target_form else 0,
                    1 if error_form.lower() == target_form.lower() and error_form != target_form else 0,
                ),
            )
        inserted += 1
    con.commit()
    return inserted
