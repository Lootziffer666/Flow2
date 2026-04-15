"""
Predefined benchmark profiles for synthetic dataset generation.

Each profile models the correction scope of a known NLP tool or use case,
mapping it onto the DB's schema concepts (variant_type, informant_group, etc.).
"""
from __future__ import annotations

# ── Profile registry ──────────────────────────────────────────────────────────

PROFILES: dict[str, dict] = {

    "grammarly": {
        "id": "grammarly",
        "name": "Grammarly-style",
        "icon": "✏️",
        "color": "#38a169",
        "inspiration": "Modeled after Grammarly's correction scope: English-first, "
                       "high-confidence spelling + style suggestions with context.",
        "description": (
            "English spelling errors, real-word confusions, apostrophe issues "
            "and regional variants. Prefers validated, high-gold cases. "
            "Includes sentence context where available."
        ),
        "filters": {
            "languages": ["en"],
            "variant_types": [
                "misspelling", "real_word_confusion", "regional",
                "apostrophe_omission", "apostrophe_confusion",
            ],
            "min_gold": 3,
            "review_statuses": ["validated", "light_reviewed"],
            "informant_groups": [],           # all groups
            "correction_levels": ["orthographic"],
        },
        "augmentation": {
            "capitalize_variants": True,      # add UPPER / Title variants
            "wrap_in_sentence": False,
            "include_negatives": True,        # add already-correct forms
            "negative_ratio": 0.15,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 200,
            "lab_segment": "core_de",         # logical segment name for flow lab
        },
    },

    "languagetool": {
        "id": "languagetool",
        "name": "LanguageTool-style",
        "icon": "🔧",
        "color": "#dd6b20",
        "inspiration": "Modeled after LanguageTool: multi-language, multi-error-type, "
                       "rule-based correction with span offsets.",
        "description": (
            "German and English, broad error types including tokenization. "
            "Lower gold threshold to include more real-world cases. "
            "Exports span offsets when available."
        ),
        "filters": {
            "languages": ["de", "en"],
            "variant_types": [
                "misspelling", "real_word_confusion", "apostrophe_omission",
                "apostrophe_confusion", "token_split", "token_merge",
                "separator_substitution", "child_phonological_form",
            ],
            "min_gold": 2,
            "review_statuses": ["validated", "light_reviewed", "raw_imported"],
            "informant_groups": [],
            "correction_levels": ["orthographic", "tokenization"],
        },
        "augmentation": {
            "capitalize_variants": False,
            "wrap_in_sentence": True,
            "include_negatives": True,
            "negative_ratio": 0.10,
        },
        "output": {
            "default_format": "languagetool-json",
            "default_size": 300,
            "lab_segment": "regression_de",
        },
    },

    "aspell": {
        "id": "aspell",
        "name": "Aspell-style",
        "icon": "📖",
        "color": "#3182ce",
        "inspiration": "Modeled after GNU Aspell: pure dictionary-lookup spell checking, "
                       "no context required, high precision.",
        "description": (
            "Pure spelling errors — misspellings, proper name and geographic "
            "misspellings. High gold threshold. Context-independent. "
            "Best for standalone-word benchmarking."
        ),
        "filters": {
            "languages": ["en", "de"],
            "variant_types": [
                "misspelling", "proper_name_misspelling",
                "geographic_name_misspelling", "demonym_misspelling",
            ],
            "min_gold": 4,
            "review_statuses": ["validated"],
            "informant_groups": [],
            "correction_levels": ["orthographic"],
        },
        "augmentation": {
            "capitalize_variants": True,
            "wrap_in_sentence": False,
            "include_negatives": False,
            "negative_ratio": 0.0,
        },
        "output": {
            "default_format": "csv",
            "default_size": 500,
            "lab_segment": "core_de",
        },
    },

    "flow_standard": {
        "id": "flow_standard",
        "name": "Flow Standard",
        "icon": "🌊",
        "color": "#805ad5",
        "inspiration": "Balanced benchmark for the full flow normalization pipeline "
                       "(German + English, all orthographic correction types).",
        "description": (
            "Balanced mix of German and English orthographic errors. "
            "Includes tokenization, capitalization, and consonant-doubling cases. "
            "Uses both context and standalone cases."
        ),
        "filters": {
            "languages": ["de", "en"],
            "variant_types": [],              # all types
            "min_gold": 2,
            "review_statuses": ["validated", "light_reviewed"],
            "informant_groups": [],
            "correction_levels": [],          # all levels
        },
        "augmentation": {
            "capitalize_variants": False,
            "wrap_in_sentence": False,
            "include_negatives": True,
            "negative_ratio": 0.20,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 250,
            "lab_segment": "stress_de",
        },
    },

    "flow_german_l2": {
        "id": "flow_german_l2",
        "name": "Flow German L2",
        "icon": "🇩🇪",
        "color": "#319795",
        "inspiration": "German as a second language: typical L2 orthographic transfer "
                       "errors, capitalization and consonant-doubling mistakes.",
        "description": (
            "German L2 learner errors only. Capitalisation, consonant doubling, "
            "and phonological transfer misspellings. Sentence context "
            "strongly preferred."
        ),
        "filters": {
            "languages": ["de"],
            "variant_types": [
                "misspelling", "child_phonological_form",
                "annotator_interpretation",
            ],
            "min_gold": 2,
            "review_statuses": ["validated", "light_reviewed", "raw_imported"],
            "informant_groups": ["l2"],
            "correction_levels": ["orthographic"],
        },
        "augmentation": {
            "capitalize_variants": True,
            "wrap_in_sentence": True,
            "include_negatives": True,
            "negative_ratio": 0.25,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 200,
            "lab_segment": "core_de",
        },
    },

    "flow_german_child": {
        "id": "flow_german_child",
        "name": "Flow German Child",
        "icon": "🧒",
        "color": "#d53f8c",
        "inspiration": "German child writing: phonologically motivated spellings, "
                       "common school-text errors, split/merge issues.",
        "description": (
            "German child-written errors including phonological forms, "
            "token splits, and capitalization. Suitable for testing "
            "correction of early-literacy writing."
        ),
        "filters": {
            "languages": ["de", "en"],
            "variant_types": [
                "misspelling", "child_phonological_form",
                "token_split", "token_merge",
            ],
            "min_gold": 2,
            "review_statuses": ["validated", "light_reviewed"],
            "informant_groups": ["child", "dyslexia"],
            "correction_levels": [],
        },
        "augmentation": {
            "capitalize_variants": False,
            "wrap_in_sentence": True,
            "include_negatives": True,
            "negative_ratio": 0.20,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 150,
            "lab_segment": "regression_de",
        },
    },

    "flow_tokenization": {
        "id": "flow_tokenization",
        "name": "Flow Tokenization",
        "icon": "✂️",
        "color": "#d69e2e",
        "inspiration": "Targeted at token boundary normalization: split words "
                       "(some times → sometimes) and merged tokens.",
        "description": (
            "Token split, token merge, and separator substitution cases only. "
            "Both languages. Context required for accurate boundary correction."
        ),
        "filters": {
            "languages": ["de", "en"],
            "variant_types": [
                "token_split", "token_merge", "separator_substitution",
            ],
            "min_gold": 2,
            "review_statuses": ["validated", "light_reviewed"],
            "informant_groups": [],
            "correction_levels": ["tokenization"],
        },
        "augmentation": {
            "capitalize_variants": False,
            "wrap_in_sentence": True,
            "include_negatives": True,
            "negative_ratio": 0.30,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 100,
            "lab_segment": "edge",
        },
    },

    "flow_gold_benchmark": {
        "id": "flow_gold_benchmark",
        "name": "Flow Gold Benchmark",
        "icon": "🏆",
        "color": "#b7791f",
        "inspiration": "Strict gold-standard benchmark: only validated, high-confidence "
                       "cases for reproducible regression testing.",
        "description": (
            "Validated gold cases only (gold_score ≥ 4). All languages and "
            "error types. No ambiguous or uncertain cases. Suitable for "
            "deterministic regression suites."
        ),
        "filters": {
            "languages": [],                  # all languages
            "variant_types": [],              # all types
            "min_gold": 4,
            "review_statuses": ["validated"],
            "informant_groups": [],
            "correction_levels": [],
        },
        "augmentation": {
            "capitalize_variants": False,
            "wrap_in_sentence": False,
            "include_negatives": True,
            "negative_ratio": 0.20,
        },
        "output": {
            "default_format": "flow-lab-json",
            "default_size": 300,
            "lab_segment": "no_change",
        },
    },
}


def get_profile(profile_id: str) -> dict:
    if profile_id not in PROFILES:
        raise KeyError(f"Unknown profile: {profile_id!r}. Available: {list(PROFILES)}")
    return PROFILES[profile_id]


def list_profiles() -> list[dict]:
    """Return profile summaries (no internal SQL details)."""
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "icon": p["icon"],
            "color": p["color"],
            "description": p["description"],
            "inspiration": p["inspiration"],
            "default_format": p["output"]["default_format"],
            "default_size": p["output"]["default_size"],
        }
        for p in PROFILES.values()
    ]
