"""Importer for canonical_form → variants CSV files."""
from __future__ import annotations
import logging
import sqlite3

from src.importers.base import (
    clean,
    correction_level_for,
    one,
    read_csv_rows,
    require_columns,
    safe_bool,
    safe_int,
    TOKENIZATION_TYPES,
    VALID_REVIEW_STATUSES,
    VALID_VARIANT_TYPES,
)

_log = logging.getLogger(__name__)


def import_lexicon_csv(
    con: sqlite3.Connection,
    file_path: str,
    source_id: int,
    language: str,
) -> tuple[int, int]:
    """
    Import canonical forms and their spelling variants from a CSV file.

    Required columns : canonical_form, variant_form
    Optional columns : variant_type, observed_count, review_status,
                       gold_score, requires_context

    Returns (inserted, skipped).
    """
    inserted = 0
    skipped = 0

    for i, row in enumerate(read_csv_rows(file_path), start=1):
        try:
            require_columns(row, ["canonical_form", "variant_form"], row_num=i)

            canonical = clean(row["canonical_form"])
            variant = clean(row["variant_form"])

            variant_type = clean(row.get("variant_type"), "misspelling")
            if variant_type not in VALID_VARIANT_TYPES:
                _log.warning(
                    "Row %d: unknown variant_type %r — defaulting to 'misspelling'",
                    i, variant_type,
                )
                variant_type = "misspelling"

            review_status = clean(row.get("review_status"), "raw_imported")
            if review_status not in VALID_REVIEW_STATUSES:
                review_status = "raw_imported"

            gold = safe_int(row.get("gold_score"), 0)
            requires_ctx = safe_bool(row.get("requires_context"), 0)
            observed = safe_int(row.get("observed_count"))
            is_tok = 1 if variant_type in TOKENIZATION_TYPES else 0

            con.execute(
                "INSERT OR IGNORE INTO lexicon_entries"
                " (source_id, canonical_form, language) VALUES (?, ?, ?)",
                (source_id, canonical, language),
            )
            entry_id = one(
                con,
                "SELECT id FROM lexicon_entries WHERE source_id=? AND canonical_form=?",
                (source_id, canonical),
                context=f"lexicon_entry for {canonical!r}",
            )
            con.execute(
                """
                INSERT OR IGNORE INTO lexicon_variants
                  (lexicon_entry_id, variant_form, variant_type, observed_count,
                   review_status, gold_score, requires_context, is_tokenization_issue)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (entry_id, variant, variant_type, observed,
                 review_status, gold, requires_ctx, is_tok),
            )
            inserted += 1

        except (ValueError, KeyError, sqlite3.IntegrityError) as exc:
            _log.warning("Skipping row %d: %s", i, exc)
            skipped += 1

    con.commit()
    if skipped:
        _log.warning("Lexicon import: %d row(s) skipped due to errors", skipped)
    return inserted, skipped
