-- FLOW_CORE Benchmark Seed — v1
--
-- Classifies the existing seeded error_cases (from seed.sql) as FLOW_CORE
-- benchmark items. All references use SELECT-based lookup (content-stable,
-- not ID-fragile) so this remains correct even if seed data is reloaded.
--
-- Sources used (already in seed.sql):
--   holbrook-missp    (source_id=2, child EN error pairs)
--   holbrook-tagged   (source_id=3, contextual EN segments)
--   German_Annotation_V028 (source_id=4, German annotated pairs)
--
-- All items start as 'approved' because these cases are simple, documented
-- reference examples with clear gold corrections. Curator: seed-v1.

-- ── English: definately → definitely ─────────────────────────────────────────
-- Classic pg_confusion: medial vowel insertion error ("ately" vs "itely").
-- Very high confidence correction. No context required.
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk,
   review_status, curator_notes, curated_by)
SELECT
  ec.id,
  'FLOW_CORE',
  'pg_confusion',
  'auto_repair',
  0, 0, 0,
  'approved',
  'seed-v1: common English misspelling, clear gold target',
  'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'definately'
  AND ec.target_form = 'definitely';

-- ── English: some times → sometimes ──────────────────────────────────────────
-- Segmentation / token_split. Context available (has_context=1).
-- Correction is safe in this context; requires_context=1 is noted.
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk,
   review_status, curator_notes, curated_by)
SELECT
  ec.id,
  'FLOW_CORE',
  'segmentation',
  'auto_repair',
  0, 0, 0,
  'approved',
  'seed-v1: token_split adverb, clear gold target, context present',
  'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'some times'
  AND ec.target_form = 'sometimes';

-- ── German: schule → Schule ───────────────────────────────────────────────────
-- German noun capitalization (orthographic_convention).
-- Correction is always safe for common nouns in isolation.
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk,
   review_status, curator_notes, curated_by)
SELECT
  ec.id,
  'FLOW_CORE',
  'orthographic_convention',
  'auto_repair',
  0, 0, 0,
  'approved',
  'seed-v1: German noun capitalization, unambiguous',
  'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'schule'
  AND ec.target_form = 'Schule';

-- ── German: komen → kommen ────────────────────────────────────────────────────
-- Consonant doubling omission (orthographic_convention).
-- gold_score in error_cases is 1 (raw_imported), so we mark as 'needs_review'
-- until the underlying error_case is validated. Still useful as a
-- regression candidate.
INSERT OR IGNORE INTO benchmark_items
  (error_case_id, benchmark_family, bucket, gold_type,
   ambiguity_level, circularity_risk, idempotence_risk,
   review_status, curator_notes, curated_by)
SELECT
  ec.id,
  'FLOW_CORE',
  'orthographic_convention',
  'auto_repair',
  0, 1, 0,
  'needs_review',
  'seed-v1: consonant doubling; circularity_risk=1 because kommen appears in GR_RULES; '
  'needs_review until error_case validated (gold_score=1)',
  'seed-v1'
FROM error_cases ec
WHERE ec.error_form = 'komen'
  AND ec.target_form = 'kommen';
