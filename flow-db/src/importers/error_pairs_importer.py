"""Importer for flat error-pair CSV files into error_cases."""
from __future__ import annotations
import logging
import sqlite3

from src.importers.base import (
    clean,
    correction_level_for,
    read_csv_rows,
    require_columns,
    safe_int,
    TOKENIZATION_TYPES,
    VALID_INFORMANT_GROUPS,
    VALID_REVIEW_STATUSES,
)

_log = logging.getLogger(__name__)


def import_error_pairs_csv(
    con: sqlite3.Connection,
    file_path: str,
    source_id: int,
    language: str,
) -> tuple[int, int]:
    """
    Import error-target pairs directly into error_cases.

    Required columns : error_form
    Optional columns : target_form, error_type, variant_type, observed_count,
                       review_status, gold_score, informant_group

    Returns (inserted, skipped).
    """
    inserted = 0
    skipped = 0

    for i, row in enumerate(read_csv_rows(file_path), start=1):
        try:
            require_columns(row, ["error_form"], row_num=i)

            error_form = clean(row["error_form"])
            target_form = clean(row.get("target_form")) or None
            error_type = clean(row.get("error_type")) or None
            variant_type = clean(row.get("variant_type"), "misspelling")

            observed = safe_int(row.get("observed_count"))
            gold = safe_int(row.get("gold_score"), 0)

            review_status = clean(row.get("review_status"), "raw_imported")
            if review_status not in VALID_REVIEW_STATUSES:
                review_status = "raw_imported"

            informant_group = clean(row.get("informant_group"), "unknown")
            if informant_group not in VALID_INFORMANT_GROUPS:
                _log.warning(
                    "Row %d: unknown informant_group %r — defaulting to 'unknown'",
                    i, informant_group,
                )
                informant_group = "unknown"

            correction_level = correction_level_for(variant_type)
            is_tok = 1 if variant_type in TOKENIZATION_TYPES else 0
            requires_ctx = 1 if is_tok or variant_type == "uncertain_interpretation" else 0

            con.execute(
                """
                INSERT INTO error_cases
                  (source_id, language, error_form, target_form, error_type,
                   correction_level, orthographic_target, grammatical_status,
                   informant_group, variant_type, observed_count,
                   review_status, gold_score,
                   has_context, is_tokenization_issue, requires_context)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                (
                    source_id, language, error_form, target_form, error_type,
                    correction_level, target_form,
                    informant_group, variant_type, observed,
                    review_status, gold,
                    is_tok, requires_ctx,
                ),
            )
            inserted += 1

        except (ValueError, KeyError, sqlite3.IntegrityError) as exc:
            _log.warning("Skipping row %d: %s", i, exc)
            skipped += 1

    con.commit()
    if skipped:
        _log.warning("Error-pairs import: %d row(s) skipped due to errors", skipped)
    return inserted, skipped
