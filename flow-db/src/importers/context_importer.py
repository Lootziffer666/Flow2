"""Importer for contextual segments with optional span metadata."""
from __future__ import annotations
import logging
import sqlite3

from src.importers.base import (
    clean,
    correction_level_for,
    one,
    read_csv_rows,
    require_columns,
    safe_int,
    TOKENIZATION_TYPES,
    VALID_REVIEW_STATUSES,
)

_log = logging.getLogger(__name__)


def import_context_segments_csv(
    con: sqlite3.Connection,
    file_path: str,
    source_id: int,
    language: str,
) -> tuple[int, int]:
    """
    Import contextual error segments, creating documents and segments as needed.

    Required columns : external_doc_id, segment_text, error_form, target_form
    Optional columns : normalized_text, span_start, span_end, speaker,
                       review_status, gold_score

    Returns (inserted, skipped).
    """
    inserted = 0
    skipped = 0

    for i, row in enumerate(read_csv_rows(file_path), start=1):
        try:
            require_columns(
                row,
                ["external_doc_id", "segment_text", "error_form", "target_form"],
                row_num=i,
            )

            ext = clean(row["external_doc_id"])
            segment_text = clean(row["segment_text"])
            error_form = clean(row["error_form"])
            target_form = clean(row["target_form"])
            normalized_text = clean(row.get("normalized_text")) or None
            speaker = clean(row.get("speaker")) or None

            review_status = clean(row.get("review_status"), "raw_imported")
            if review_status not in VALID_REVIEW_STATUSES:
                review_status = "raw_imported"
            gold = safe_int(row.get("gold_score"), 0)

            # Detect tokenization type
            ef_has_space = " " in error_form
            tf_has_space = " " in target_form
            if ef_has_space and not tf_has_space:
                variant_type = "token_split"
            elif not ef_has_space and tf_has_space:
                variant_type = "token_merge"
            else:
                variant_type = "misspelling"

            correction_level = correction_level_for(variant_type)
            is_tok = 1 if variant_type in TOKENIZATION_TYPES else 0

            # Ensure document row
            con.execute(
                "INSERT OR IGNORE INTO documents"
                " (source_id, external_doc_id, has_context) VALUES (?, ?, 1)",
                (source_id, ext),
            )
            document_id = one(
                con,
                "SELECT id FROM documents WHERE source_id=? AND external_doc_id=?",
                (source_id, ext),
                context=f"document {ext!r}",
            )

            # Insert segment
            cur = con.execute(
                "INSERT INTO segments"
                " (document_id, speaker, raw_text, normalized_text, confidence)"
                " VALUES (?, ?, ?, ?, ?)",
                (document_id, speaker, segment_text, normalized_text, 1.0),
            )
            segment_id = cur.lastrowid

            # Insert error case
            cur = con.execute(
                """
                INSERT INTO error_cases
                  (source_id, document_id, segment_id, language,
                   error_form, target_form, error_type, correction_level,
                   orthographic_target, grammatical_status, informant_group,
                   variant_type, review_status, gold_score,
                   has_context, is_tokenization_issue, requires_context)
                VALUES (?, ?, ?, ?, ?, ?, 'contextual_error', ?, ?, 'unknown', 'unknown',
                        ?, ?, ?, 1, ?, 1)
                """,
                (
                    source_id, document_id, segment_id, language,
                    error_form, target_form,
                    correction_level, target_form,
                    variant_type, review_status, gold,
                    is_tok,
                ),
            )
            case_id = cur.lastrowid

            # Optional span
            span_start = safe_int(row.get("span_start"))
            span_end = safe_int(row.get("span_end"))
            if span_start is not None and span_end is not None:
                con.execute(
                    "INSERT INTO error_spans"
                    " (error_case_id, span_start, span_end, error_form, target_form)"
                    " VALUES (?, ?, ?, ?, ?)",
                    (case_id, span_start, span_end, error_form, target_form),
                )

            inserted += 1

        except (ValueError, KeyError, sqlite3.IntegrityError) as exc:
            _log.warning("Skipping row %d: %s", i, exc)
            skipped += 1

    con.commit()
    if skipped:
        _log.warning("Context import: %d row(s) skipped due to errors", skipped)
    return inserted, skipped
