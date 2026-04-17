"""Importer for contextual segments with optional span metadata."""
from __future__ import annotations
import sqlite3
from src.importers.base import read_csv_rows

def import_context_segments_csv(con: sqlite3.Connection, file_path: str, source_id: int, language: str) -> int:
    """
    Expected columns:
    external_doc_id,segment_text,normalized_text,error_form,target_form,span_start,span_end,speaker,review_status,gold_score
    """
    inserted = 0
    for row in read_csv_rows(file_path):
        ext = row["external_doc_id"].strip()
        con.execute(
            "INSERT OR IGNORE INTO documents (source_id, external_doc_id, has_context) VALUES (?, ?, 1)",
            (source_id, ext),
        )
        document_id = con.execute(
            "SELECT id FROM documents WHERE source_id=? AND external_doc_id=?",
            (source_id, ext),
        ).fetchone()[0]
        cur = con.execute(
            """
            INSERT INTO segments (document_id, speaker, raw_text, normalized_text, confidence)
            VALUES (?, ?, ?, ?, ?)
            """,
            (document_id, row.get("speaker"), row["segment_text"], row.get("normalized_text"), 1.0),
        )
        segment_id = cur.lastrowid
        variant_type = "token_split" if " " in row["error_form"].strip() and row["target_form"].strip().replace(" ", "") == row["target_form"].strip() else "misspelling"
        cur = con.execute(
            """
            INSERT INTO error_cases
            (source_id, document_id, segment_id, language, error_form, target_form, error_type, correction_level,
             orthographic_target, grammatical_status, informant_group, variant_type, review_status, gold_score,
             has_context, is_tokenization_issue, requires_context)
            VALUES (?, ?, ?, ?, ?, ?, 'contextual_error',
                    CASE WHEN ?='token_split' THEN 'tokenization' ELSE 'orthographic' END,
                    ?, 'unknown', 'unknown', ?, COALESCE(?, 'raw_imported'), COALESCE(?, 0), 1,
                    CASE WHEN ?='token_split' THEN 1 ELSE 0 END, 1)
            """,
            (
                source_id, document_id, segment_id, language, row["error_form"].strip(), row["target_form"].strip(),
                variant_type, row["target_form"].strip(), variant_type, row.get("review_status"),
                int(row["gold_score"]) if row.get("gold_score") else 0, variant_type
            ),
        )
        case_id = cur.lastrowid
        if row.get("span_start") and row.get("span_end"):
            con.execute(
                "INSERT INTO error_spans (error_case_id, span_start, span_end, error_form, target_form) VALUES (?, ?, ?, ?, ?)",
                (case_id, int(row["span_start"]), int(row["span_end"]), row["error_form"].strip(), row["target_form"].strip()),
            )
        inserted += 1
    con.commit()
    return inserted