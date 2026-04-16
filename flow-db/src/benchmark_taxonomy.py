"""
FLOW Benchmark Taxonomy — v1

Defines benchmark families, category/bucket labels, and their meanings.

FLOW_CORE: Reliable, regression-friendly cases with clear gold corrections.
FLOW_HELL: Deliberately difficult cases exposing normalization failure modes.

This module is import-only. No side effects.
"""

# ── Families ──────────────────────────────────────────────────────────────────

BENCHMARK_FAMILIES = frozenset({'FLOW_CORE', 'FLOW_HELL'})

# ── Gold types ────────────────────────────────────────────────────────────────

GOLD_TYPES = frozenset({'auto_repair', 'suggestion_only', 'abstain', 'no_touch'})

GOLD_TYPE_DESCRIPTIONS = {
    'auto_repair': (
        'Correction is clear, safe, and can be applied automatically. '
        'The target_form is the unambiguous canonical form.'
    ),
    'suggestion_only': (
        'Correction is plausible but should not be applied without human review. '
        'Often used for medium-confidence phonetic suggestions.'
    ),
    'abstain': (
        'No correction should be attempted. Ambiguity is real and unresolvable '
        'at the token level, or context required is not available.'
    ),
    'no_touch': (
        'Form is correct as-is. Changing it would be an error. '
        'Includes: protected names, brand terms, intentional non-standard forms, '
        'legal abbreviations, code-switch material.'
    ),
}

# ── Ambiguity levels ──────────────────────────────────────────────────────────

AMBIGUITY_LEVELS = {
    0: 'clear — gold correction is unambiguous',
    1: 'minor — small doubt but gold is defensible',
    2: 'significant — reasonable curators might disagree',
    3: 'genuinely_unclear — abstain is the only honest answer',
}

# ── FLOW_CORE buckets ─────────────────────────────────────────────────────────

FLOW_CORE_BUCKETS = {
    'pg_confusion': (
        'Phonetically-grounded confusion (Cologne Phonetics group): '
        'forms that sound identical or nearly identical under German phonetics. '
        'Examples: weis→weiß, gelsen→gelesen, ferig→fertig, das→dass (PG-adjacent).'
    ),
    'orthographic_convention': (
        'Pure orthographic convention with no phonetic ambiguity: '
        'ß/ss distinction, German noun capitalization, Umlaut forms (ae→ä, oe→ö, ue→ü). '
        'Gold correction is nearly always clear.'
    ),
    'morphology_near_surface': (
        'Surface morphology errors: weak verb endings, haben/habe, sein/seien, '
        'adjective agreement at the form level (not the syntactic level). '
        'Distinguished from deep morphology by surface-predictability.'
    ),
    'segmentation': (
        'Token split or merge: some times→sometimes, weiter gegangen→weitergegangen, '
        'Fußball→Fuß Ball (reverse split). '
        'Has_context flag may be set when disambiguation requires sentence context.'
    ),
    'punctuation_near_surface': (
        'Punctuation changes adjacent to orthographic normalization: '
        'comma insertion before dass, sentence-final period, colon spacing. '
        'Must not include pure grammar/syntax punctuation rules.'
    ),
    'abstention': (
        'Gold type is abstain. Ambiguous or context-dependent forms where '
        'forcing a correction would be wrong. '
        'Examples: seit/seid, real_word_confusion pairs.'
    ),
    'no_touch': (
        'Gold type is no_touch. Form is correct as-is. '
        'Overcorrection traps, protected names, intentional non-standard forms.'
    ),
    'overcorrection_trap': (
        'Superficially "wrong" but must not be corrected: loanwords with '
        'non-German capitalization rules, code-switch terms, proper nouns, '
        'technical identifiers. Distinct from no_touch in that the trap is '
        'specifically about a rule firing incorrectly.'
    ),
}

# ── FLOW_HELL buckets ─────────────────────────────────────────────────────────

FLOW_HELL_BUCKETS = {
    'HYDRA': (
        'Multiple rule families interact with the same surface form. '
        'Fixing one error activates another rule, or the fix is valid under '
        'one rule family but wrong under another. '
        'Example: a token-split form that also has a PG error inside one token; '
        'fixing the split creates a new misspelling-like pattern.'
    ),
    'ABYSS': (
        'Gold is abstain because the ambiguity is genuine and unresolvable '
        'without broader context that is not available. No correction should '
        'be attempted. '
        'Example: "seit" vs "seid" — preposition vs verb form, '
        'indistinguishable at the token level in many contexts. '
        'ABYSS differs from WALL: in ABYSS, even a full document might not resolve it; '
        'in WALL, a longer context window would.'
    ),
    'POISON': (
        'A locally plausible fix causes downstream damage: changes sentence '
        'meaning, corrupts a named entity, breaks a technical reference, '
        'or introduces a new error. The fix looks right in isolation but is wrong. '
        'Example: "Bach" corrected via PG to "Back" (phonetically close, '
        'but Bach is both a surname and a common noun meaning stream).'
    ),
    'MIRAGE': (
        'Looks wrong but must not be changed. Protected form, intentional '
        'non-standard, code-switch, brand name, or legal term. '
        'A naive rule-based corrector fires on it incorrectly. '
        'Example: "iPhone" — the lowercase "P" is intentional and must be preserved. '
        '"GmbH" — a legal abbreviation that must not be expanded or altered.'
    ),
    'LOOP': (
        'Oscillation or idempotence risk: applying the correction produces '
        'an output that triggers the same rule again (oscillation), or two '
        'rules alternate in a cycle. '
        'Example: a rule that normalizes "ss→ß" at word boundaries may cycle '
        'with an environment where ß is re-expanded to "ss" by another rule.'
    ),
    'WALL': (
        'Cannot be resolved safely without broader context that is not '
        'available in the current input window. Abstention is the only safe answer. '
        'Differs from ABYSS: in WALL, a longer context window would resolve it; '
        'in ABYSS, even a full document might not. '
        'Example: "Fahren wir" — capitalization depends on whether this is '
        'the start of a question, an imperative, or a sub-clause.'
    ),
}

# ── Validation sets ───────────────────────────────────────────────────────────

VALID_CORE_BUCKETS = frozenset(FLOW_CORE_BUCKETS)
VALID_HELL_BUCKETS = frozenset(FLOW_HELL_BUCKETS)
VALID_BUCKETS = VALID_CORE_BUCKETS | VALID_HELL_BUCKETS

# ── Heuristic helpers ─────────────────────────────────────────────────────────

# Mapping from error_cases.variant_type to the most likely FLOW_CORE bucket.
# These are suggestions only — always review before accepting.
VARIANT_TYPE_TO_CORE_BUCKET = {
    'misspelling':                'pg_confusion',
    'child_phonological_form':    'pg_confusion',
    'orthographic':               'orthographic_convention',
    'capitalization':             'orthographic_convention',
    'consonant_doubling':         'orthographic_convention',
    'umlauts':                    'orthographic_convention',
    'hyphenation':                'orthographic_convention',
    'apostrophe_omission':        'orthographic_convention',
    'apostrophe_confusion':       'orthographic_convention',
    'morphological':              'morphology_near_surface',
    'token_split':                'segmentation',
    'token_merge':                'segmentation',
    'separator_substitution':     'segmentation',
    'punctuation':                'punctuation_near_surface',
    'real_word_confusion':        'abstention',
    'uncertain_interpretation':   'abstention',
    'annotator_interpretation':   'abstention',
    'regional':                   'no_touch',
    'proper_name_misspelling':    'no_touch',
    'geographic_name_misspelling':'no_touch',
    'demonym_misspelling':        'no_touch',
}


def suggest_bucket(variant_type: str) -> str | None:
    """Suggest a FLOW_CORE bucket based on variant_type.

    Returns None if no mapping is available.
    Always treat the result as a suggestion — it must be reviewed.
    """
    return VARIANT_TYPE_TO_CORE_BUCKET.get(str(variant_type or ''))


def suggest_gold_type(
    variant_type: str,
    target_form: str | None,
    ambiguity_level: int = 0,
) -> str:
    """Heuristic gold_type suggestion based on variant_type and target availability.

    Always treat the result as a suggestion — it must be reviewed.
    In particular: real_word_confusion and ambiguity >= 2 should almost always
    be manually confirmed as 'abstain'.
    """
    if ambiguity_level >= 2:
        return 'abstain'
    if variant_type in ('real_word_confusion', 'uncertain_interpretation', 'annotator_interpretation'):
        return 'abstain'
    if variant_type in ('regional', 'proper_name_misspelling', 'geographic_name_misspelling',
                        'demonym_misspelling'):
        return 'no_touch'
    if not target_form or not str(target_form).strip():
        return 'abstain'
    return 'auto_repair'
