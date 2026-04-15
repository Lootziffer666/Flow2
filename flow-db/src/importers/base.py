"""Shared utilities for lightweight CSV-based importers."""
from __future__ import annotations
import csv
import sqlite3
from pathlib import Path
from typing import Iterable

# ── Enum domains (mirrors schema CHECK constraints) ───────────────────────────

TOKENIZATION_TYPES: frozenset[str] = frozenset({
    "token_split", "token_merge", "separator_substitution"
})

VALID_VARIANT_TYPES: frozenset[str] = frozenset({
    "misspelling", "regional", "real_word_confusion",
    "apostrophe_omission", "apostrophe_confusion",
    "token_split", "token_merge", "separator_substitution",
    "proper_name_misspelling", "geographic_name_misspelling", "demonym_misspelling",
    "child_phonological_form", "annotator_interpretation", "uncertain_interpretation",
})

VALID_INFORMANT_GROUPS: frozenset[str] = frozenset({
    "child", "dyslexia", "l2", "general_adult", "unknown"
})

VALID_REVIEW_STATUSES: frozenset[str] = frozenset({
    "raw_imported", "light_reviewed", "validated", "excluded"
})

# ── CSV reader ────────────────────────────────────────────────────────────────

def read_csv_rows(file_path: str | Path) -> Iterable[dict]:
    """Yield each CSV row as a dict, stripping BOM if present."""
    with open(file_path, "r", encoding="utf-8-sig", newline="") as f:
        yield from csv.DictReader(f)

# ── String helpers ────────────────────────────────────────────────────────────

def clean(value, default: str = "") -> str:
    """Strip a value and return it; return *default* when None or empty."""
    if value is None:
        return default
    s = str(value).strip()
    return s if s else default

# ── Type-safe converters ──────────────────────────────────────────────────────

def safe_int(value, default=None):
    """Convert *value* to int; return *default* when None/empty; raise ValueError on bad input."""
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ValueError(f"Expected integer, got {value!r}")

def safe_bool(value, default: int = 0) -> int:
    """Convert truthy strings/ints to 0/1; return *default* on None/empty."""
    if value in (None, ""):
        return default
    if isinstance(value, int):
        return 1 if value else 0
    return 1 if str(value).strip().lower() in {"1", "true", "yes", "y", "ja"} else 0

# ── Column validation ─────────────────────────────────────────────────────────

def require_columns(row: dict, cols: list[str], row_num: int = 0) -> None:
    """Raise ValueError if any column in *cols* is missing or blank in *row*."""
    missing = [c for c in cols if not clean(row.get(c))]
    if missing:
        label = f" (row {row_num})" if row_num else ""
        raise ValueError(f"Missing required columns{label}: {missing!r}")

# ── Domain helpers ────────────────────────────────────────────────────────────

def correction_level_for(variant_type: str) -> str:
    """Return 'tokenization' for tokenization variant types, else 'orthographic'."""
    return "tokenization" if variant_type in TOKENIZATION_TYPES else "orthographic"

# ── DB helper ─────────────────────────────────────────────────────────────────

def one(con: sqlite3.Connection, sql: str, params: tuple, context: str = "") -> int:
    """Fetch a single integer from *sql*; raise ValueError if no row returned."""
    row = con.execute(sql, params).fetchone()
    if row is None:
        label = f" [{context}]" if context else ""
        raise ValueError(f"Expected one row{label}: got none. SQL: {sql!r}")
    return int(row[0])
