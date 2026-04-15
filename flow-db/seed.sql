INSERT INTO sources
(source_name, source_file, resource_type, language, corpus_name, collection_type, informant_group, l1_or_l2, modality, license, review_status, gold_score, notes)
VALUES
('aspell-en', 'aspell_en.txt', 'lexicon', 'en', 'aspell', 'variant_lexicon', 'general_adult', 'unknown', 'written', 'unknown', 'validated', 4, 'English spelling lexicon'),
('holbrook-missp', 'holbrook.csv', 'error_pairs', 'en', 'holbrook', 'error_pairs', 'child', 'l1', 'written', 'unknown', 'light_reviewed', 3, 'Misspellings with counts'),
('holbrook-tagged', 'holbrook_tagged.csv', 'context_segments', 'en', 'holbrook', 'contextual_errors', 'child', 'l1', 'written', 'unknown', 'light_reviewed', 3, 'Contextual error segments'),
('German_Annotation_V028', 'German_Annotation_V028.csv', 'error_pairs', 'de', 'german_annotation', 'annotated_pairs', 'l2', 'l2', 'written', 'unknown', 'validated', 4, 'German annotated sample');

INSERT INTO lexicon_entries (source_id, canonical_form, language, domain_hint, usage_note)
VALUES
(1, 'definitely', 'en', 'general', 'canonical target'),
(1, 'behavior', 'en', 'general', 'US spelling'),
(1, 'sometimes', 'en', 'general', 'joined adverb');

INSERT INTO lexicon_variants
(lexicon_entry_id, variant_form, variant_type, observed_count, review_status, gold_score, is_named_entity, is_real_word_confusion, is_tokenization_issue, requires_context)
VALUES
(1, 'definately', 'misspelling', 12, 'validated', 5, 0, 0, 0, 0),
(2, 'behaviour', 'regional', 7, 'validated', 4, 0, 0, 0, 0),
(3, 'some times', 'token_split', 3, 'light_reviewed', 3, 0, 0, 1, 1);

INSERT INTO documents
(source_id, external_doc_id, title, grade, timepoint, age_raw, has_context, metadata_json)
VALUES
(3, 'doc-001', 'Holbrook sample', '3', 't1', '8;4', 1, '{"genre":"school_text"}');

INSERT INTO segments
(document_id, speaker, raw_text, normalized_text, comment_text, start_offset, end_offset, confidence)
VALUES
(1, 'child', 'I go there some times after school.', 'I go there sometimes after school.', 'token split in adverb', 0, 36, 0.98);

INSERT INTO error_cases
(source_id, document_id, segment_id, language, error_form, target_form, error_type, correction_level, orthographic_target, grammatical_status, informant_group, variant_type, observed_count, review_status, gold_score, has_context, is_tokenization_issue, requires_context, notes)
VALUES
(2, NULL, NULL, 'en', 'definately', 'definitely', 'spelling', 'orthographic', 'definitely', 'unknown', 'child', 'misspelling', 12, 'light_reviewed', 4, 0, 0, 0, 'common English misspelling'),
(3, 1, 1, 'en', 'some times', 'sometimes', 'tokenization', 'tokenization', 'sometimes', 'unknown', 'child', 'token_split', 3, 'validated', 3, 1, 1, 1, 'context-dependent split case'),
(4, NULL, NULL, 'de', 'schule', 'Schule', 'capitalization', 'orthographic', 'Schule', 'unknown', 'l2', 'misspelling', 4, 'validated', 4, 0, 0, 0, 'German capitalization'),
(4, NULL, NULL, 'de', 'komen', 'kommen', 'consonant_doubling', 'orthographic', 'kommen', 'unknown', 'l2', 'misspelling', 2, 'raw_imported', 1, 0, 0, 0, 'Double consonant omission');

INSERT INTO error_spans (error_case_id, span_start, span_end, error_form, target_form)
VALUES
(2, 11, 21, 'some times', 'sometimes');

INSERT INTO linguistic_features
(error_case_id, grapheme_sequence, pcu_sequence, syllable_structure, morpheme_segmentation, pos_tag, edit_distance, error_position, is_real_word_error, is_first_letter_error, is_last_letter_error)
VALUES
(1, 'd-e-f-i-n-a-t-e-l-y', 'DEF|IN|ATE|LY', 'CVC-CV-CVC-CV', 'definite+ly', 'ADV', 1, 'medial', 0, 0, 0),
(2, 'some|times', 'SOME|TIMES', 'CVCV-CVCVC', 'some+times', 'ADV', 1, 'boundary', 0, 0, 0),
(3, 'Schule', 'SCHU|LE', 'CV-CV', 'Schul+e', 'NOUN', 1, 'initial', 0, 1, 0),
(4, 'ko-men', 'KO|MEN', 'CV-CVC', 'komm+en', 'VERB', 1, 'medial', 0, 0, 0);

INSERT INTO orthographic_feature_flags
(error_case_id, has_consonant_doubling, has_capitalization_relevance)
VALUES
(3, 0, 1),
(4, 1, 0);

INSERT INTO benchmark_collections (source_id, name, language, description)
VALUES
(3, 'starter-benchmark-en', 'en', 'Minimal English benchmark slice');

INSERT INTO benchmark_subsets (benchmark_collection_id, name, slice_definition)
VALUES
(1, 'with-context', 'has_context=1'),
(1, 'clean-reviewed', 'review_status in light_reviewed,validated');

INSERT INTO corpus_profiles
(source_id, profile_name, language, error_rate, avg_edit_distance, split_word_rate, has_context, notes)
VALUES
(3, 'Holbrook profile sample', 'en', 0.07, 1.0, 0.15, 1, 'starter profile');