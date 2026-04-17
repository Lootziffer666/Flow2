"""Importer for flat error-pair CSV files into error_cases."""
from __future__ import annotations
import sqlite3
from src.importers.base import read_csv_rows

def import_error_pairs_csv(con: sqlite3.Connection, file_path: str, source_id: int, language: str) -> int:
    """
    Expected columns:
    error_form,target_form,error_type,variant_type,observed_count,review_status,gold_score,informant_group
    """
    inserted = 0
    for row in read_csv_rows(file_path):
        variant_type = row.get("variant_type") or "misspelling"
        correction_level = "tokenization" if variant_type in {"token_split", "token_merge", "separator_substitution"} else "orthographic"
        con.execute(
            """
            INSERT INTO error_cases
            (source_id, language, error_form, target_form, error_type, correction_level, orthographic_target,
             grammatical_status, informant_group, variant_type, observed_count, review_status, gold_score,
             has_context, is_tokenization_issue, requires_context)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?, ?, COALESCE(?, 'raw_imported'), COALESCE(?, 0),
                    0, CASE WHEN ? IN ('token_split','token_merge','separator_substitution') THEN 1 ELSE 0 END,
                    CASE WHEN ? IN ('token_split','token_merge','separator_substitution','uncertain_interpretation') THEN 1 ELSE 0 END)
            """,
            (
                source_id, language, row["error_form"].strip(), row.get("target_form", "").strip() or None,
                row.get("error_type"), correction_level, row.get("target_form", "").strip() or None,
                row.get("informant_group", "unknown"), variant_type,
                int(row["observed_count"]) if row.get("observed_count") else None,
                row.get("review_status"), int(row["gold_score"]) if row.get("gold_score") else 0,
                variant_type, variant_type
            ),
        )
        inserted += 1
    con.commit()
    return inserted