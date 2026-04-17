"""Importer for canonical_form -> variants CSV files."""
from __future__ import annotations
import sqlite3
from src.importers.base import read_csv_rows

def import_lexicon_csv(con: sqlite3.Connection, file_path: str, source_id: int, language: str) -> int:
    """
    Expected columns:
    canonical_form,variant_form,variant_type,observed_count,review_status,gold_score,requires_context
    """
    inserted = 0
    for row in read_csv_rows(file_path):
        con.execute(
            "INSERT OR IGNORE INTO lexicon_entries (source_id, canonical_form, language) VALUES (?, ?, ?)",
            (source_id, row["canonical_form"].strip(), language),
        )
        entry_id = con.execute(
            "SELECT id FROM lexicon_entries WHERE source_id=? AND canonical_form=?",
            (source_id, row["canonical_form"].strip()),
        ).fetchone()[0]
        con.execute(
            """
            INSERT OR IGNORE INTO lexicon_variants
            (lexicon_entry_id, variant_form, variant_type, observed_count, review_status, gold_score, requires_context, is_tokenization_issue)
            VALUES (?, ?, ?, ?, COALESCE(?, 'raw_imported'), COALESCE(?, 0), COALESCE(?, 0),
                    CASE WHEN ? IN ('token_split','token_merge','separator_substitution') THEN 1 ELSE 0 END)
            """,
            (
                entry_id,
                row["variant_form"].strip(),
                row.get("variant_type", "misspelling"),
                int(row["observed_count"]) if row.get("observed_count") else None,
                row.get("review_status"),
                int(row["gold_score"]) if row.get("gold_score") else 0,
                int(row["requires_context"]) if row.get("requires_context") else 0,
                row.get("variant_type", "misspelling"),
            ),
        )
        inserted += 1
    con.commit()
    return inserted