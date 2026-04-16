-- FLOW_HELL Benchmark Seed — v1
--
-- Starter set of genuinely difficult cases for the FLOW_HELL family.
-- Real German (and one English) orthographic/normalization phenomena.
-- Provenance: hand-curated linguistic examples (documented per-case in notes).
-- All strings are single-line to remain compatible with executescript().

INSERT OR IGNORE INTO sources
  (source_name, source_file, resource_type, language, corpus_name,
   collection_type, informant_group, l1_or_l2, modality,
   license, review_status, gold_score, notes)
VALUES
  ('benchmark-hell-v1', 'benchmarks/seed_flow_hell.sql',
   'benchmark_profile', 'de', 'flow-hell',
   'hand_curated', 'unknown', 'unknown', 'written',
   'UNLICENSED', 'validated', 5,
   'Hand-curated FLOW_HELL cases. Real German normalization failure modes. Not from a single external corpus.');

-- H01: seit/seid — ABYSS
-- Homophonous pair: seit (preposition "since") vs seid (2nd pl. of sein).
-- Impossible to resolve at token level without context.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, review_status, gold_score, is_real_word_confusion, requires_context, notes)
SELECT s.id, 'de', 'seid', NULL, 'real_word_confusion', 'uncertain',
  'real_word_confusion', 'validated', 5, 1, 1,
  'ABYSS: seid/seit homophone. No correction possible without context.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H02: weis — ABYSS
-- Ambiguous: weiß (white/know), Weis (surname), dialectal usage.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, review_status, gold_score, is_real_word_confusion, requires_context, notes)
SELECT s.id, 'de', 'weis', NULL, 'real_word_confusion', 'uncertain',
  'real_word_confusion', 'validated', 5, 1, 1,
  'ABYSS: weis ambiguous — weiß (target), Weis (surname), dialectal. PG fires incorrectly on surname.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H03: iPhone — MIRAGE
-- Brand name with intentional non-standard internal capitalization.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, is_named_entity, review_status, gold_score, notes)
SELECT s.id, 'de', 'iPhone', 'iPhone', 'proper_name', 'orthographic',
  'proper_name_misspelling', 1, 'validated', 5,
  'MIRAGE: brand name with non-standard camelCase. DE capitalizer produces Iphone (wrong).'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H04: GmbH — MIRAGE
-- German legal abbreviation. Must not be altered.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, is_named_entity, review_status, gold_score, notes)
SELECT s.id, 'de', 'GmbH', 'GmbH', 'abbreviation', 'orthographic',
  'proper_name_misspelling', 1, 'validated', 5,
  'MIRAGE: legal abbreviation, internal capitalization legally mandated. Never alter.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H05: weiter gegangen — HYDRA
-- Token-merge candidate, but split is grammatically valid in some constructions.
-- Merge changes meaning; also interacts with GR capitalization rules.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, requires_context, review_status, gold_score, notes)
SELECT s.id, 'de', 'weiter gegangen', NULL, 'tokenization', 'uncertain',
  'token_merge', 1, 'validated', 5,
  'HYDRA: token_merge fires but conflicts with verb separability; merge changes structure/meaning.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H06: das das — WALL
-- GR rule (das→dass) must fire on the right token; position undetermined without wider context.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, requires_context, review_status, gold_score, notes)
SELECT s.id, 'de', 'das das', NULL, 'real_word_confusion', 'uncertain',
  'real_word_confusion', 1, 'validated', 5,
  'WALL: GR rule (das->dass) cannot determine correct token without clause structure context.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H07: Bach — POISON
-- Common noun (stream) and famous surname. PG near-matches (Back, Pack) are wrong.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, is_named_entity, review_status, gold_score, notes)
SELECT s.id, 'de', 'Bach', 'Bach', 'proper_name', 'orthographic',
  'proper_name_misspelling', 1, 'validated', 5,
  'POISON: common noun (stream) and surname. PG: Bach->Back/Pack/Buch all semantically wrong.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';

-- H08: weiss → weiß — LOOP
-- Valid correction, but ß/ss rule pair risks oscillation in two-pass normalization.
INSERT OR IGNORE INTO error_cases
  (source_id, language, error_form, target_form, error_type, correction_level,
   variant_type, review_status, gold_score, notes)
SELECT s.id, 'de', 'weiss', 'weiß', 'orthographic', 'orthographic',
  'misspelling', 'validated', 4,
  'LOOP: weiss->weiß valid. ß-expansion rule in wrong direction creates oscillation risk.'
FROM sources s WHERE s.source_name = 'benchmark-hell-v1';


-- ── benchmark_items ───────────────────────────────────────────────────────────

-- H01: seid — ABYSS
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'ABYSS', 'abstain',
  3, 0, 0, 0,
  'seid (2nd pl. of sein) and seit (prep. since) are homophonous. No token-level disambiguation.',
  'PG rule fires: seid->seit or seit->seid, wrong ~50% of the time.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'seid'
  AND ec.notes LIKE 'ABYSS:%';

-- H02: weis — ABYSS
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'ABYSS', 'abstain',
  3, 0, 0, 1,
  'weis is ambiguous: weiß (correct spelling), Weis (surname), dialectal. PG fires wrong in name context.',
  'PG corrects weis->weiß in "Herr Weis" — changes a person''s name.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'weis'
  AND ec.notes LIKE 'ABYSS:%';

-- H03: iPhone — MIRAGE
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'MIRAGE', 'no_touch',
  0, 0, 0, 1,
  'Brand name with intentional internal lowercase (camelCase trade mark). Capitalization rules must not apply.',
  'DE capitalization rule: iPhone->Iphone or iphone. Both are wrong and damage the identifier.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'iPhone'
  AND ec.notes LIKE 'MIRAGE:%';

-- H04: GmbH — MIRAGE
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'MIRAGE', 'no_touch',
  0, 0, 0, 1,
  'Legal abbreviation: internal capitalization legally mandated. No normalization rule should fire.',
  'ALL-CAPS or mixed-case rules produce gmbh/GMBH/Gmbh — all legally wrong.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'GmbH'
  AND ec.notes LIKE 'MIRAGE:%';

-- H05: weiter gegangen — HYDRA
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'HYDRA', 'abstain',
  2, 0, 0, 1,
  'Token-merge rule conflicts with German verb separability. Merging changes grammatical structure/meaning.',
  'Merge fires: "weiter gegangen"->"weitergegangen". Wrong in "Wir sind weiter gegangen als geplant".',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'weiter gegangen'
  AND ec.notes LIKE 'HYDRA:%';

-- H06: das das — WALL
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'WALL', 'abstain',
  3, 1, 0, 1,
  'GR rule (das->dass) cannot determine correct token position without clause structure.',
  'Rule fires on both tokens: "das das"->"dass dass". Or fires on wrong position.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'das das'
  AND ec.notes LIKE 'WALL:%';

-- H07: Bach — POISON
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'POISON', 'no_touch',
  1, 0, 0, 1,
  'Bach is both a common noun (stream) and a famous surname. PG near-matches are semantically wrong.',
  'PG fires: Bach->Back (baking), Bach->Pack (mob). Wrong in "Am Bach entlang" and "J.S. Bach".',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'Bach'
  AND ec.notes LIKE 'POISON:%';

-- H08: weiss → weiß — LOOP
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk, downstream_poison_risk,
   why_hard, naive_failure_mode, review_status, curator_notes, curated_by)
SELECT ec.id,
  'FLOW_HELL', 'LOOP', 'auto_repair',
  1, 1, 1, 0,
  'weiss->weiß is valid. Risk: ß-expansion rule in wrong context creates oscillation (weiss->weiß->weiss).',
  'Correction is valid once. A second-pass ß-expansion rule may undo it. Idempotence test required.',
  'approved', 'seed-hell-v1', 'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'weiss'
  AND ec.target_form = 'weiß'
  AND ec.notes LIKE 'LOOP:%';
