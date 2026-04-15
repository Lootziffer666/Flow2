"""Importer for German annotated CSV files with flexible column aliases."""
from __future__ import annotations
import logging
import sqlite3

from src.importers.base import (
    clean,
    correction_level_for,
    one,
    read_csv_rows,
    safe_bool,
    safe_int,
    TOKENIZATION_TYPES,
    VALID_INFORMANT_GROUPS,
    VALID_REVIEW_STATUSES,
)

_log = logging.getLogger(__name__)

# ── Column alias map ──────────────────────────────────────────────────────────

COLUMN_ALIASES: dict[str, list[str]] = {
    "document_id":          ["document_id", "external_doc_id", "doc_id", "dokument_id", "text_id"],
    "segment_text":         ["segment_text", "sentence", "satz", "context", "kontext", "raw_text"],
    "error_form":           ["error_form", "fehlerform", "fehler", "wrong", "token_error"],
    "target_form":          ["target_form", "korrektur", "ziel_form", "correct", "normalization",
                             "target", "berichtigung", "richtig"],
    "error_type":           ["error_type", "fehlertyp", "category", "label"],
    "review_status":        ["review_status", "review", "status"],
    "gold_score":           ["gold_score", "gold", "score"],
    "informant_group":      ["informant_group", "gruppe", "group_label"],
    "variant_type":         ["variant_type", "variant", "varianten_typ"],
    "observed_count":       ["observed_count", "count", "anzahl", "freq"],
    "span_start":           ["span_start", "start", "offset_start"],
    "span_end":             ["span_end", "end", "offset_end"],
    "pos_tag":              ["pos_tag", "pos"],
    "phoneme_sequence":     ["phoneme_sequence", "phonemes"],
    "grapheme_sequence":    ["grapheme_sequence", "graphemes"],
    "morpheme_segmentation":["morpheme_segmentation", "morphemes"],
    "morpheme_tags":        ["morpheme_tags", "morph_tags"],
    "edit_distance":        ["edit_distance", "levenshtein", "abstand"],
    "is_named_entity":      ["is_named_entity", "named_entity"],
    "is_real_word_confusion":["is_real_word_confusion", "real_word_confusion"],
}

# ── Alias picker ──────────────────────────────────────────────────────────────

def _pick(row: dict, logical_name: str, default=None):
    """Return the first non-empty alias value for *logical_name*, or *default*."""
    for alias in COLUMN_ALIASES[logical_name]:
        v = row.get(alias)
        if v not in (None, ""):
            return v
    return default

# ── Heuristics ────────────────────────────────────────────────────────────────

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
    if error_form.lower() == target_form.lower() and error_form != target_form:
        return "capitalization"
    return "orthographic"


def _has_consonant_doubling(error_form: str, target_form: str) -> int:
    """
    Return 1 if target_form contains a doubled consonant that appears only once
    in error_form (i.e. the error omits the doubling).

    Example: "komen" → "kommen"  → 1  (doubled m in target, single m in error)
             "Masse" → "Maße"    → 0  (no consonant doubling difference)
    """
    tf = target_form.lower()
    ef = error_form.lower()
    for i in range(len(tf) - 1):
        c = tf[i]
        if c.isalpha() and tf[i + 1] == c:
            doubled = c + c
            if doubled not in ef and c in ef:
                return 1
    return 0

# ── Document / segment creation ───────────────────────────────────────────────

def _ensure_document_segment(
    con: sqlite3.Connection,
    source_id: int,
    external_doc_id: str | None,
    segment_text: str | None,
) -> tuple[int | None, int | None]:
    """
    Create a document (and optionally a segment) row if *external_doc_id* is given.

    When *external_doc_id* is absent we cannot safely create a uniquely
    addressable document, so (None, None) is returned rather than generating a
    phantom "generated" document that would collapse all such rows into one.
    """
    if not external_doc_id:
        return None, None

    con.execute(
        "INSERT OR IGNORE INTO documents"
        " (source_id, external_doc_id, has_context) VALUES (?, ?, 1)",
        (source_id, external_doc_id),
    )
    document_id = one(
        con,
        "SELECT id FROM documents WHERE source_id=? AND external_doc_id=?",
        (source_id, external_doc_id),
        context=f"document {external_doc_id!r}",
    )

    segment_id: int | None = None
    if segment_text:
        cur = con.execute(
            "INSERT INTO segments"
            " (document_id, raw_text, normalized_text, confidence)"
            " VALUES (?, ?, NULL, ?)",
            (document_id, segment_text, 1.0),
        )
        segment_id = cur.lastrowid

    return document_id, segment_id

# ── Main importer ─────────────────────────────────────────────────────────────

def import_german_annotations_csv(
    con: sqlite3.Connection,
    file_path: str,
    source_id: int,
    language: str = "de",
) -> tuple[int, int]:
    """
    Flexible importer for German annotation CSVs (e.g. German_Annotation_V028.csv).

    Minimal required logical fields (via any supported alias):
      - error_form  / fehlerform
      - target_form / korrektur

    Optional: document context, span offsets, review quality, and linguistic
    feature columns (pos_tag, phoneme_sequence, grapheme_sequence,
    morpheme_segmentation, morpheme_tags, edit_distance).

    Returns (inserted, skipped).
    """
    inserted = 0
    skipped = 0

    for i, row in enumerate(read_csv_rows(file_path), start=1):
        try:
            error_form = clean(_pick(row, "error_form"))
            target_form = clean(_pick(row, "target_form"))
            if not error_form or not target_form:
                _log.warning("Row %d: missing error_form or target_form — skipping", i)
                skipped += 1
                continue

            variant_type = _guess_variant_type(
                error_form, target_form, _pick(row, "variant_type")
            )
            error_type = _guess_error_type(
                error_form, target_form, _pick(row, "error_type")
            )
            correction_level = correction_level_for(variant_type)

            external_doc_id = clean(_pick(row, "document_id")) or None
            segment_text = clean(_pick(row, "segment_text")) or None
            has_context = 1 if external_doc_id else 0

            document_id, segment_id = _ensure_document_segment(
                con, source_id, external_doc_id, segment_text
            )

            review_status = clean(_pick(row, "review_status"), "raw_imported")
            if review_status not in VALID_REVIEW_STATUSES:
                review_status = "raw_imported"
            gold = safe_int(_pick(row, "gold_score"), 0)

            informant_group = clean(_pick(row, "informant_group"), "unknown")
            if informant_group not in VALID_INFORMANT_GROUPS:
                informant_group = "unknown"

            is_tok = 1 if variant_type in TOKENIZATION_TYPES else 0
            requires_ctx = 1 if has_context or variant_type == "uncertain_interpretation" else 0
            review_required = 1 if review_status == "raw_imported" else 0

            cur = con.execute(
                """
                INSERT INTO error_cases
                  (source_id, document_id, segment_id, language,
                   error_form, target_form, error_type, correction_level,
                   orthographic_target, grammatical_status, informant_group,
                   variant_type, observed_count, review_status, gold_score,
                   has_context, is_named_entity, is_real_word_confusion,
                   is_tokenization_issue, requires_context, review_required, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?)
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
                    informant_group,
                    variant_type,
                    safe_int(_pick(row, "observed_count")),
                    review_status,
                    gold,
                    has_context,
                    safe_bool(_pick(row, "is_named_entity"), 0),
                    safe_bool(_pick(row, "is_real_word_confusion"), 0),
                    is_tok,
                    requires_ctx,
                    review_required,
                    "imported_from_german_annotation_csv",
                ),
            )
            case_id = cur.lastrowid

            # Optional span
            span_start = safe_int(_pick(row, "span_start"))
            span_end = safe_int(_pick(row, "span_end"))
            if span_start is not None and span_end is not None:
                con.execute(
                    "INSERT INTO error_spans"
                    " (error_case_id, span_start, span_end, error_form, target_form)"
                    " VALUES (?, ?, ?, ?, ?)",
                    (case_id, span_start, span_end, error_form, target_form),
                )

            # Optional linguistic features
            ling_fields = ["phoneme_sequence", "grapheme_sequence", "morpheme_segmentation",
                           "morpheme_tags", "pos_tag", "edit_distance"]
            if any(_pick(row, name) not in (None, "") for name in ling_fields):
                con.execute(
                    """
                    INSERT INTO linguistic_features
                      (error_case_id, phoneme_sequence, grapheme_sequence,
                       morpheme_segmentation, morpheme_tags, pos_tag, edit_distance)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        case_id,
                        _pick(row, "phoneme_sequence"),
                        _pick(row, "grapheme_sequence"),
                        _pick(row, "morpheme_segmentation"),
                        _pick(row, "morpheme_tags"),
                        _pick(row, "pos_tag"),
                        safe_int(_pick(row, "edit_distance")),
                    ),
                )

            # German orthographic flags
            if language == "de":
                con.execute(
                    """
                    INSERT INTO orthographic_feature_flags
                      (error_case_id, has_consonant_doubling, has_capitalization_relevance)
                    VALUES (?, ?, ?)
                    """,
                    (
                        case_id,
                        _has_consonant_doubling(error_form, target_form),
                        1 if error_form.lower() == target_form.lower() and error_form != target_form else 0,
                    ),
                )

            inserted += 1

        except (ValueError, KeyError, sqlite3.IntegrityError) as exc:
            _log.warning("Skipping row %d: %s", i, exc)
            skipped += 1

    con.commit()
    if skipped:
        _log.warning("German annotations import: %d row(s) skipped due to errors", skipped)
    return inserted, skipped
