PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_file TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'lexicon','error_pairs','context_segments','transcript','benchmark_profile','research_schema','paper','mixed'
  )),
  language TEXT NOT NULL,
  corpus_name TEXT,
  collection_type TEXT,
  informant_group TEXT NOT NULL DEFAULT 'unknown' CHECK (informant_group IN (
    'child','dyslexia','l2','general_adult','unknown'
  )),
  l1_or_l2 TEXT CHECK (l1_or_l2 IN ('l1','l2','mixed','unknown')),
  modality TEXT CHECK (modality IN ('written','spoken','mixed','unknown')),
  license TEXT,
  review_status TEXT NOT NULL DEFAULT 'raw_imported' CHECK (review_status IN (
    'raw_imported','light_reviewed','validated','excluded'
  )),
  gold_score INTEGER NOT NULL DEFAULT 0 CHECK (gold_score BETWEEN 0 AND 5),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_name, source_file)
);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  participant_code TEXT NOT NULL,
  group_label TEXT,
  l1_or_l2 TEXT CHECK (l1_or_l2 IN ('l1','l2','mixed','unknown')),
  metadata_json TEXT,
  UNIQUE(source_id, participant_code)
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  external_doc_id TEXT,
  title TEXT,
  participant_id INTEGER REFERENCES participants(id) ON DELETE SET NULL,
  grade TEXT,
  timepoint TEXT,
  age_raw TEXT,
  has_context INTEGER NOT NULL DEFAULT 1 CHECK (has_context IN (0,1)),
  metadata_json TEXT,
  UNIQUE(source_id, external_doc_id)
);

CREATE TABLE IF NOT EXISTS segments (
  id INTEGER PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  speaker TEXT,
  raw_text TEXT NOT NULL,
  normalized_text TEXT,
  comment_text TEXT,
  start_offset INTEGER,
  end_offset INTEGER,
  confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE TABLE IF NOT EXISTS lexicon_entries (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  canonical_form TEXT NOT NULL,
  language TEXT NOT NULL,
  domain_hint TEXT,
  usage_note TEXT,
  UNIQUE(source_id, canonical_form)
);

CREATE TABLE IF NOT EXISTS lexicon_variants (
  id INTEGER PRIMARY KEY,
  lexicon_entry_id INTEGER NOT NULL REFERENCES lexicon_entries(id) ON DELETE CASCADE,
  variant_form TEXT NOT NULL,
  variant_type TEXT NOT NULL CHECK (variant_type IN (
    'misspelling','regional','real_word_confusion','apostrophe_omission','apostrophe_confusion',
    'token_split','token_merge','separator_substitution','proper_name_misspelling',
    'geographic_name_misspelling','demonym_misspelling','child_phonological_form',
    'annotator_interpretation','uncertain_interpretation'
  )),
  observed_count INTEGER,
  review_status TEXT NOT NULL DEFAULT 'raw_imported' CHECK (review_status IN (
    'raw_imported','light_reviewed','validated','excluded'
  )),
  gold_score INTEGER NOT NULL DEFAULT 0 CHECK (gold_score BETWEEN 0 AND 5),
  is_named_entity INTEGER NOT NULL DEFAULT 0 CHECK (is_named_entity IN (0,1)),
  is_real_word_confusion INTEGER NOT NULL DEFAULT 0 CHECK (is_real_word_confusion IN (0,1)),
  is_tokenization_issue INTEGER NOT NULL DEFAULT 0 CHECK (is_tokenization_issue IN (0,1)),
  requires_context INTEGER NOT NULL DEFAULT 0 CHECK (requires_context IN (0,1)),
  deprecated_term INTEGER NOT NULL DEFAULT 0 CHECK (deprecated_term IN (0,1)),
  sensitive_term INTEGER NOT NULL DEFAULT 0 CHECK (sensitive_term IN (0,1)),
  UNIQUE(lexicon_entry_id, variant_form, variant_type)
);

CREATE TABLE IF NOT EXISTS error_cases (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
  language TEXT NOT NULL,
  error_form TEXT NOT NULL,
  target_form TEXT,
  error_type TEXT,
  correction_level TEXT NOT NULL DEFAULT 'orthographic' CHECK (correction_level IN (
    'orthographic','tokenization','grammatical','uncertain'
  )),
  orthographic_target TEXT,
  grammatical_status TEXT CHECK (grammatical_status IN ('unknown','grammatical','ungrammatical')),
  informant_group TEXT NOT NULL DEFAULT 'unknown' CHECK (informant_group IN (
    'child','dyslexia','l2','general_adult','unknown'
  )),
  variant_type TEXT CHECK (variant_type IN (
    'misspelling','regional','real_word_confusion','apostrophe_omission','apostrophe_confusion',
    'token_split','token_merge','separator_substitution','proper_name_misspelling',
    'geographic_name_misspelling','demonym_misspelling','child_phonological_form',
    'annotator_interpretation','uncertain_interpretation'
  )),
  observed_count INTEGER,
  review_status TEXT NOT NULL DEFAULT 'raw_imported' CHECK (review_status IN (
    'raw_imported','light_reviewed','validated','excluded'
  )),
  gold_score INTEGER NOT NULL DEFAULT 0 CHECK (gold_score BETWEEN 0 AND 5),
  has_context INTEGER NOT NULL DEFAULT 0 CHECK (has_context IN (0,1)),
  is_named_entity INTEGER NOT NULL DEFAULT 0 CHECK (is_named_entity IN (0,1)),
  is_real_word_confusion INTEGER NOT NULL DEFAULT 0 CHECK (is_real_word_confusion IN (0,1)),
  is_tokenization_issue INTEGER NOT NULL DEFAULT 0 CHECK (is_tokenization_issue IN (0,1)),
  requires_context INTEGER NOT NULL DEFAULT 0 CHECK (requires_context IN (0,1)),
  review_required INTEGER NOT NULL DEFAULT 0 CHECK (review_required IN (0,1)),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS error_spans (
  id INTEGER PRIMARY KEY,
  error_case_id INTEGER NOT NULL REFERENCES error_cases(id) ON DELETE CASCADE,
  span_start INTEGER NOT NULL CHECK (span_start >= 0),
  span_end INTEGER NOT NULL CHECK (span_end >= span_start),
  error_form TEXT NOT NULL,
  target_form TEXT
);

CREATE TABLE IF NOT EXISTS linguistic_features (
  id INTEGER PRIMARY KEY,
  error_case_id INTEGER NOT NULL UNIQUE REFERENCES error_cases(id) ON DELETE CASCADE,
  phoneme_sequence TEXT,
  grapheme_sequence TEXT,
  pcu_sequence TEXT,
  syllable_structure TEXT,
  stress_pattern TEXT,
  morpheme_segmentation TEXT,
  morpheme_tags TEXT,
  pos_tag TEXT,
  edit_distance INTEGER CHECK (edit_distance IS NULL OR edit_distance >= 0),
  error_position TEXT,
  is_real_word_error INTEGER NOT NULL DEFAULT 0 CHECK (is_real_word_error IN (0,1)),
  is_first_letter_error INTEGER NOT NULL DEFAULT 0 CHECK (is_first_letter_error IN (0,1)),
  is_last_letter_error INTEGER NOT NULL DEFAULT 0 CHECK (is_last_letter_error IN (0,1))
);

CREATE TABLE IF NOT EXISTS orthographic_feature_flags (
  id INTEGER PRIMARY KEY,
  error_case_id INTEGER NOT NULL UNIQUE REFERENCES error_cases(id) ON DELETE CASCADE,
  has_consonant_doubling INTEGER NOT NULL DEFAULT 0 CHECK (has_consonant_doubling IN (0,1)),
  has_vowel_lengthening_h INTEGER NOT NULL DEFAULT 0 CHECK (has_vowel_lengthening_h IN (0,1)),
  has_syllable_separating_h INTEGER NOT NULL DEFAULT 0 CHECK (has_syllable_separating_h IN (0,1)),
  has_umlaut_relation INTEGER NOT NULL DEFAULT 0 CHECK (has_umlaut_relation IN (0,1)),
  has_final_devoicing_relation INTEGER NOT NULL DEFAULT 0 CHECK (has_final_devoicing_relation IN (0,1)),
  has_capitalization_relevance INTEGER NOT NULL DEFAULT 0 CHECK (has_capitalization_relevance IN (0,1)),
  has_marked_grapheme INTEGER NOT NULL DEFAULT 0 CHECK (has_marked_grapheme IN (0,1)),
  has_morpheme_constancy INTEGER NOT NULL DEFAULT 0 CHECK (has_morpheme_constancy IN (0,1))
);

CREATE TABLE IF NOT EXISTS benchmark_collections (
  id INTEGER PRIMARY KEY,
  source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  language TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS benchmark_subsets (
  id INTEGER PRIMARY KEY,
  benchmark_collection_id INTEGER NOT NULL REFERENCES benchmark_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slice_definition TEXT,
  UNIQUE(benchmark_collection_id, name)
);

CREATE TABLE IF NOT EXISTS corpus_profiles (
  id INTEGER PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  language TEXT,
  error_rate REAL,
  avg_edit_distance REAL,
  split_word_rate REAL,
  has_context INTEGER CHECK (has_context IN (0,1)),
  notes TEXT,
  UNIQUE(source_id, profile_name)
);

CREATE INDEX IF NOT EXISTS idx_sources_lang_type ON sources(language, resource_type);
CREATE INDEX IF NOT EXISTS idx_docs_source ON documents(source_id);
CREATE INDEX IF NOT EXISTS idx_segments_doc ON segments(document_id);
CREATE INDEX IF NOT EXISTS idx_lex_entry_canonical ON lexicon_entries(canonical_form, language);
CREATE INDEX IF NOT EXISTS idx_lex_var_form ON lexicon_variants(variant_form);
CREATE INDEX IF NOT EXISTS idx_error_cases_lookup ON error_cases(language, error_form, target_form);
CREATE INDEX IF NOT EXISTS idx_error_cases_review ON error_cases(review_status, gold_score);
CREATE INDEX IF NOT EXISTS idx_error_cases_segment ON error_cases(segment_id);
CREATE INDEX IF NOT EXISTS idx_error_spans_case ON error_spans(error_case_id);

CREATE VIEW IF NOT EXISTS v_normalization_candidates AS
SELECT
  ec.id AS error_case_id,
  ec.language,
  ec.error_form,
  COALESCE(ec.orthographic_target, ec.target_form, le.canonical_form) AS normalized_form,
  ec.variant_type,
  ec.error_type,
  ec.review_status,
  ec.gold_score,
  ec.has_context,
  s.source_name,
  s.corpus_name
FROM error_cases ec
JOIN sources s ON s.id = ec.source_id
LEFT JOIN lexicon_entries le
  ON le.source_id = ec.source_id AND le.canonical_form = ec.target_form
WHERE ec.review_status != 'excluded';

CREATE VIEW IF NOT EXISTS v_benchmark_error_cases AS
SELECT
  ec.id,
  ec.language,
  ec.error_form,
  ec.target_form,
  ec.error_type,
  ec.variant_type,
  ec.has_context,
  ec.segment_id,
  lf.edit_distance,
  s.source_name,
  s.informant_group
FROM error_cases ec
JOIN sources s ON s.id = ec.source_id
LEFT JOIN linguistic_features lf ON lf.error_case_id = ec.id
WHERE ec.review_status IN ('light_reviewed', 'validated')
  AND ec.gold_score >= 2
  AND ec.target_form IS NOT NULL;

CREATE VIEW IF NOT EXISTS v_research_cases_enriched AS
SELECT
  ec.*,
  s.source_name,
  s.resource_type,
  s.corpus_name,
  s.l1_or_l2,
  s.modality,
  d.external_doc_id,
  d.grade,
  d.timepoint,
  seg.raw_text AS segment_raw_text,
  seg.normalized_text AS segment_normalized_text,
  lf.phoneme_sequence,
  lf.grapheme_sequence,
  lf.pcu_sequence,
  lf.syllable_structure,
  lf.stress_pattern,
  lf.morpheme_segmentation,
  lf.morpheme_tags,
  lf.pos_tag,
  lf.edit_distance,
  off.has_consonant_doubling,
  off.has_vowel_lengthening_h,
  off.has_syllable_separating_h,
  off.has_umlaut_relation,
  off.has_final_devoicing_relation,
  off.has_capitalization_relevance,
  off.has_marked_grapheme,
  off.has_morpheme_constancy
FROM error_cases ec
JOIN sources s ON s.id = ec.source_id
LEFT JOIN documents d ON d.id = ec.document_id
LEFT JOIN segments seg ON seg.id = ec.segment_id
LEFT JOIN linguistic_features lf ON lf.error_case_id = ec.id
LEFT JOIN orthographic_feature_flags off ON off.error_case_id = ec.id;