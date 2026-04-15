"""
Synthetic test dataset generator.

Queries the DB according to a profile spec, optionally augments the results,
and formats them for various target tools (flow-lab, LanguageTool, CSV, JS).
"""
from __future__ import annotations

import csv
import io
import json
import random
import re
import sqlite3
from datetime import datetime, timezone
from typing import Any

from src.generators.profiles import get_profile, PROFILES

# ── SQL builder ───────────────────────────────────────────────────────────────

_SELECT = """
SELECT
  ec.id,
  ec.language,
  ec.error_form,
  ec.target_form,
  ec.error_type,
  ec.variant_type,
  ec.correction_level,
  ec.informant_group,
  ec.review_status,
  ec.gold_score,
  ec.has_context,
  ec.is_tokenization_issue,
  ec.notes,
  s.source_name,
  s.corpus_name,
  d.external_doc_id,
  seg.raw_text    AS context_sentence,
  es.span_start,
  es.span_end
FROM error_cases ec
JOIN sources s ON s.id = ec.source_id
LEFT JOIN documents d ON d.id = ec.document_id
LEFT JOIN segments seg ON seg.id = ec.segment_id
LEFT JOIN error_spans es ON es.error_case_id = ec.id
"""


def _build_query(filters: dict, max_cases: int) -> tuple[str, list]:
    clauses: list[str] = [
        "ec.target_form IS NOT NULL",
        "ec.review_status != 'excluded'",
    ]
    params: list[Any] = []

    def _in(col: str, values: list) -> None:
        if values:
            phs = ",".join("?" * len(values))
            clauses.append(f"{col} IN ({phs})")
            params.extend(values)

    _in("ec.language", filters.get("languages") or [])
    _in("ec.variant_type", filters.get("variant_types") or [])
    _in("ec.review_status", filters.get("review_statuses") or [])
    _in("ec.informant_group", filters.get("informant_groups") or [])
    _in("ec.correction_level", filters.get("correction_levels") or [])

    min_gold = filters.get("min_gold")
    if min_gold is not None:
        clauses.append("ec.gold_score >= ?")
        params.append(int(min_gold))

    where = "WHERE " + "\n  AND ".join(clauses)
    sql = f"{_SELECT}\n{where}\nORDER BY ec.gold_score DESC, RANDOM()\nLIMIT ?"
    params.append(int(max_cases))
    return sql, params


def _fetch_cases(con: sqlite3.Connection, sql: str, params: list) -> list[dict]:
    con.row_factory = sqlite3.Row
    rows = con.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


# ── Augmentation ──────────────────────────────────────────────────────────────

_SENTENCE_TEMPLATES_DE = [
    "Der Schüler schrieb {error} in seinen Aufsatz.",
    "Sie korrigierte das Wort {error} sofort.",
    "Im Text stand {error} statt der richtigen Schreibweise.",
    "Das Wort {error} tauchte mehrmals auf.",
    "Er verwendete {error} ohne es zu bemerken.",
]

_SENTENCE_TEMPLATES_EN = [
    "The student wrote {error} in their essay.",
    "She corrected the word {error} immediately.",
    "The text contained {error} instead of the correct spelling.",
    "The word {error} appeared several times.",
    "He used {error} without noticing.",
]


def _sentence_for(error_form: str, language: str, seed: int) -> str:
    rng = random.Random(seed)
    templates = _SENTENCE_TEMPLATES_DE if language == "de" else _SENTENCE_TEMPLATES_EN
    return rng.choice(templates).format(error=error_form)


def _capitalize_variants(cases: list[dict]) -> list[dict]:
    """
    For each case whose error_form is all-lowercase, add an extra case with
    the error_form's first letter capitalised (and expected target adjusted).
    Only added when the capitalised form is meaningfully different.
    """
    extras: list[dict] = []
    for c in cases:
        ef = c["error_form"]
        tf = c["target_form"]
        if ef and tf and ef[0].islower():
            cap_ef = ef[0].upper() + ef[1:]
            cap_tf = tf[0].upper() + tf[1:] if tf else tf
            if cap_ef != ef:
                extra = dict(c)
                extra["id"] = f"{c['id']}_cap"
                extra["error_form"] = cap_ef
                extra["target_form"] = cap_tf
                extra["_synthetic"] = "capitalize_variant"
                extras.append(extra)
    return cases + extras


def _wrap_in_sentence(cases: list[dict]) -> list[dict]:
    """
    For standalone word cases (no context_sentence), generate a synthetic
    sentence containing the error form.
    """
    result: list[dict] = []
    for i, c in enumerate(cases):
        if c.get("context_sentence"):
            result.append(c)
        else:
            c = dict(c)
            c["context_sentence"] = _sentence_for(c["error_form"], c["language"], seed=i)
            c["_synthetic"] = c.get("_synthetic", "") + "_sentence_wrapped"
            result.append(c)
    return result


def _add_negatives(cases: list[dict], ratio: float) -> list[dict]:
    """
    Add negative examples: already-correct forms that flow should leave unchanged.
    Negative = input equals expected (correct spellings that must not be altered).
    """
    n_negatives = max(1, int(len(cases) * ratio))
    targets = [c["target_form"] for c in cases if c.get("target_form")]
    if not targets:
        return cases

    rng = random.Random(42)
    chosen = rng.sample(targets, min(n_negatives, len(targets)))
    negatives = [
        {
            "id": f"neg_{i}",
            "language": cases[i % len(cases)]["language"],
            "error_form": form,
            "target_form": form,
            "error_type": "no_error",
            "variant_type": None,
            "correction_level": "orthographic",
            "informant_group": "unknown",
            "review_status": "validated",
            "gold_score": 5,
            "has_context": 0,
            "is_tokenization_issue": 0,
            "notes": "synthetic negative — should not be modified",
            "source_name": "synthetic",
            "corpus_name": None,
            "external_doc_id": None,
            "context_sentence": None,
            "span_start": None,
            "span_end": None,
            "_synthetic": "negative",
        }
        for i, form in enumerate(chosen)
    ]
    return cases + negatives


def _augment(cases: list[dict], aug: dict) -> list[dict]:
    if aug.get("capitalize_variants"):
        cases = _capitalize_variants(cases)
    if aug.get("wrap_in_sentence"):
        cases = _wrap_in_sentence(cases)
    if aug.get("include_negatives") and aug.get("negative_ratio", 0) > 0:
        cases = _add_negatives(cases, aug["negative_ratio"])
    return cases


# ── Output formatters ─────────────────────────────────────────────────────────

def _make_key(c: dict) -> str:
    return f"db_{c['id']}" if not str(c["id"]).startswith(("neg_", "db_")) else str(c["id"])


def format_flow_lab_json(cases: list[dict], meta: dict) -> dict:
    """
    Flow Lab–compatible JSON.

    Top-level structure mirrors benchmarkInputs.js expectations:
    - `meta`: generation metadata
    - `cases`: array of {key, label, text, expected, ...} objects
    - `segments`: pre-split into flow lab segment keys (core_de, regression_de, …)
    """
    lab_segment = meta.get("lab_segment", "core_de")

    case_list = []
    segment_texts: list[str] = []

    for c in cases:
        key = _make_key(c)
        text = c.get("context_sentence") or c["error_form"]
        expected = c.get("context_sentence", "").replace(
            c["error_form"], c["target_form"]
        ) if c.get("context_sentence") else c["target_form"]

        case_list.append({
            "key": key,
            "label": f"{c['variant_type'] or 'case'}: {c['error_form']} → {c['target_form']}",
            "text": text,
            "expected": expected or text,
            "language": c["language"],
            "variant_type": c["variant_type"],
            "error_type": c["error_type"],
            "gold_score": c["gold_score"],
            "source": c["source_name"],
            "is_negative": c.get("_synthetic") == "negative",
            "has_context": bool(c.get("context_sentence")),
        })
        segment_texts.append(text)

    return {
        "meta": {
            **meta,
            "total_cases": len(case_list),
            "negative_cases": sum(1 for c in case_list if c["is_negative"]),
        },
        "cases": case_list,
        # Lab segment format: { segment_name: [text, text, ...] }
        "segments": {
            lab_segment: segment_texts,
            "no_change": [c["text"] for c in case_list if c["is_negative"]],
        },
    }


def format_languagetool_json(cases: list[dict]) -> list[dict]:
    """
    Simplified LanguageTool annotation format.
    Each entry has the sentence text plus expected correction matches.
    """
    result: list[dict] = []
    for c in cases:
        sentence = c.get("context_sentence") or c["error_form"]
        offset = sentence.find(c["error_form"])
        if offset < 0:
            offset = 0

        entry: dict = {
            "text": sentence,
            "language": c["language"],
            "source": c["source_name"],
            "gold_score": c["gold_score"],
        }

        if c.get("_synthetic") != "negative":
            entry["expected_matches"] = [
                {
                    "offset": c["span_start"] if c.get("span_start") is not None else offset,
                    "length": len(c["error_form"]),
                    "replacements": [{"value": c["target_form"]}],
                    "ruleId": f"DB_{(c['variant_type'] or 'UNKNOWN').upper()}",
                    "message": f"Possible {c['variant_type'] or 'error'}: "
                               f"'{c['error_form']}' → '{c['target_form']}'",
                }
            ]
        else:
            entry["expected_matches"] = []  # no corrections expected

        result.append(entry)
    return result


def format_csv(cases: list[dict]) -> str:
    """Simple CSV: input, expected, language, variant_type, error_type, source, gold_score, context."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "input", "expected", "language", "variant_type", "error_type",
        "source", "gold_score", "context", "is_negative",
    ])
    for c in cases:
        writer.writerow([
            c["error_form"],
            c["target_form"],
            c["language"],
            c.get("variant_type") or "",
            c.get("error_type") or "",
            c.get("source_name") or "",
            c["gold_score"],
            c.get("context_sentence") or "",
            1 if c.get("_synthetic") == "negative" else 0,
        ])
    return buf.getvalue()


def format_flow_test_js(cases: list[dict], meta: dict) -> str:
    """
    JavaScript test file compatible with packages/flow/test/.
    Can be dropped into the flow test directory and run with node.
    """
    profile_name = meta.get("profile_name", "synthetic")
    generated_at = meta.get("generated_at", "")

    lines = [
        "// Auto-generated by flow-db dataset generator",
        f"// Profile : {profile_name}",
        f"// Generated: {generated_at}",
        f"// Cases   : {len(cases)} ({meta.get('total_cases', len(cases))} total, "
        f"{sum(1 for c in cases if c.get('_synthetic') == 'negative')} negatives)",
        "//",
        "// Usage: node <this_file>",
        "//        Or import as: const { cases } = require('./<this_file>')",
        "",
        "'use strict';",
        "const assert = require('node:assert/strict');",
        "const { runCorrection } = require('../src/pipeline');",
        "",
        "const cases = [",
    ]

    for c in cases:
        key = _make_key(c)
        text = c.get("context_sentence") or c["error_form"]
        expected = (
            c.get("context_sentence", "").replace(c["error_form"], c["target_form"])
            if c.get("context_sentence")
            else c["target_form"]
        ) or text
        variant = c.get("variant_type") or "misspelling"
        is_neg = c.get("_synthetic") == "negative"
        comment = " // negative — must not change" if is_neg else ""

        # JSON-safe escaping
        t_esc = json.dumps(text)
        e_esc = json.dumps(expected)
        k_esc = json.dumps(key)
        v_esc = json.dumps(variant)
        lang = json.dumps(c["language"])

        lines.append(
            f"  {{ key: {k_esc}, text: {t_esc}, expected: {e_esc}, "
            f"language: {lang}, type: {v_esc}, gold: {c['gold_score']} }},{comment}"
        )

    lines += [
        "];",
        "",
        "// Run assertions when executed directly",
        "if (require.main === module) {",
        "  let passed = 0; let failed = 0;",
        "  for (const c of cases) {",
        "    const { corrected } = runCorrection(c.text, c.language);",
        "    if (corrected === c.expected) {",
        "      passed++;",
        "    } else {",
        "      failed++;",
        "      console.error(`FAIL [${c.key}]`);",
        "      console.error(`  input   : ${c.text}`);",
        "      console.error(`  expected: ${c.expected}`);",
        "      console.error(`  got     : ${corrected}`);",
        "    }",
        "  }",
        "  console.log(`Results: ${passed} passed, ${failed} failed / ${cases.length} total`);",
        "  if (failed > 0) process.exit(1);",
        "}",
        "",
        "module.exports = { cases };",
    ]
    return "\n".join(lines) + "\n"


# ── Main entry point ──────────────────────────────────────────────────────────

def generate(
    con: sqlite3.Connection,
    profile_id: str,
    overrides: dict | None = None,
    max_cases: int | None = None,
    include_negatives: bool | None = None,
    add_variations: bool | None = None,
    wrap_sentences: bool | None = None,
    output_format: str | None = None,
    seed: int = 42,
) -> dict:
    """
    Generate a synthetic test dataset.

    Parameters
    ----------
    con             : open SQLite connection
    profile_id      : key from PROFILES
    overrides       : partial filter dict to override profile defaults
    max_cases       : upper bound on result size (before augmentation)
    include_negatives: whether to add negative examples
    add_variations  : whether to add capitalised variants
    wrap_sentences  : whether to wrap bare words in template sentences
    output_format   : 'flow-lab-json' | 'languagetool-json' | 'csv' | 'flow-test-js'
    seed            : random seed for reproducibility

    Returns
    -------
    dict with keys:
        format    : chosen output format
        data      : formatted payload (dict/list/str depending on format)
        meta      : generation metadata
        raw_count : number of DB rows before augmentation
        total_count: number of cases after augmentation
    """
    random.seed(seed)
    profile = get_profile(profile_id)
    filters = {**profile["filters"], **(overrides or {})}
    aug = dict(profile["augmentation"])

    if include_negatives is not None:
        aug["include_negatives"] = include_negatives
    if add_variations is not None:
        aug["capitalize_variants"] = add_variations
    if wrap_sentences is not None:
        aug["wrap_in_sentence"] = wrap_sentences

    n = max_cases if max_cases is not None else profile["output"]["default_size"]
    fmt = output_format or profile["output"]["default_format"]

    sql, params = _build_query(filters, n)
    raw_cases = _fetch_cases(con, sql, params)
    augmented = _augment(raw_cases, aug)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    meta = {
        "profile_id": profile_id,
        "profile_name": profile["name"],
        "generated_at": now,
        "db_filters": filters,
        "raw_count": len(raw_cases),
        "total_cases": len(augmented),
        "output_format": fmt,
        "lab_segment": profile["output"].get("lab_segment", "core_de"),
        "seed": seed,
    }

    if fmt == "flow-lab-json":
        data = format_flow_lab_json(augmented, meta)
    elif fmt == "languagetool-json":
        data = format_languagetool_json(augmented)
    elif fmt == "csv":
        data = format_csv(augmented)
    elif fmt == "flow-test-js":
        data = format_flow_test_js(augmented, meta)
    else:
        raise ValueError(f"Unknown output format: {fmt!r}")

    return {
        "format": fmt,
        "data": data,
        "meta": meta,
        "raw_count": len(raw_cases),
        "total_count": len(augmented),
    }


def preview(
    con: sqlite3.Connection,
    profile_id: str,
    overrides: dict | None = None,
    max_preview: int = 10,
) -> list[dict]:
    """Return up to *max_preview* raw cases for the GUI preview table."""
    profile = get_profile(profile_id)
    filters = {**profile["filters"], **(overrides or {})}
    sql, params = _build_query(filters, max_preview)
    return _fetch_cases(con, sql, params)
