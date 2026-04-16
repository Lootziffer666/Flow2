-- Migration 001: Benchmark Classification Layer
--
-- Adds benchmark_items table: per-case classification of error_cases into
-- FLOW_CORE / FLOW_HELL benchmark families, with gold_type, risk flags,
-- and curation metadata.
--
-- Does NOT modify existing tables. Backward-compatible.
-- Existing benchmark_collections / benchmark_subsets remain unchanged.

CREATE TABLE IF NOT EXISTS benchmark_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_case_id INTEGER NOT NULL REFERENCES error_cases(id) ON DELETE CASCADE,

  -- Classification
  benchmark_family TEXT NOT NULL CHECK (benchmark_family IN ('FLOW_CORE', 'FLOW_HELL')),
  bucket TEXT,
  -- FLOW_CORE buckets: pg_confusion, orthographic_convention, morphology_near_surface,
  --   segmentation, punctuation_near_surface, abstention, no_touch, overcorrection_trap
  -- FLOW_HELL buckets: HYDRA, ABYSS, POISON, MIRAGE, LOOP, WALL

  -- Gold target type
  gold_type TEXT NOT NULL CHECK (gold_type IN (
    'auto_repair', 'suggestion_only', 'abstain', 'no_touch'
  )),
  -- auto_repair      = correction is clear and safe to apply automatically
  -- suggestion_only  = correction is likely right but requires human confirmation
  -- abstain          = no correction should be attempted; ambiguity is real
  -- no_touch         = form is correct as-is; changing it would be wrong

  -- Risk and quality flags (all 0/1)
  ambiguity_level INTEGER NOT NULL DEFAULT 0 CHECK (ambiguity_level BETWEEN 0 AND 3),
  -- 0=clear, 1=minor, 2=significant, 3=genuinely_unclear

  circularity_risk INTEGER NOT NULL DEFAULT 0 CHECK (circularity_risk IN (0,1)),
  -- 1 = error_form or target_form appears in rule corpus (eval may be circular)

  idempotence_risk INTEGER NOT NULL DEFAULT 0 CHECK (idempotence_risk IN (0,1)),
  -- 1 = applying correction twice may produce a different result

  downstream_poison_risk INTEGER NOT NULL DEFAULT 0 CHECK (downstream_poison_risk IN (0,1)),
  -- 1 = locally plausible fix likely causes downstream damage

  duplicate_risk INTEGER NOT NULL DEFAULT 0 CHECK (duplicate_risk IN (0,1)),
  -- 1 = suspected near-duplicate of another benchmark item

  -- Diagnostic annotations (FLOW_HELL primarily)
  why_hard TEXT,
  naive_failure_mode TEXT,
  -- naive_failure_mode: how a simple rule-based corrector would fail on this case

  -- Curation tracking
  curator_notes TEXT,
  review_status TEXT NOT NULL DEFAULT 'candidate' CHECK (review_status IN (
    'candidate', 'approved', 'rejected', 'needs_review'
  )),
  curated_at TEXT,
  curated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  -- One classification per family per error case
  UNIQUE (error_case_id, benchmark_family)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_bi_family
  ON benchmark_items(benchmark_family);

CREATE INDEX IF NOT EXISTS idx_bi_family_bucket
  ON benchmark_items(benchmark_family, bucket);

CREATE INDEX IF NOT EXISTS idx_bi_review_status
  ON benchmark_items(review_status);

CREATE INDEX IF NOT EXISTS idx_bi_gold_type
  ON benchmark_items(gold_type);

CREATE INDEX IF NOT EXISTS idx_bi_error_case
  ON benchmark_items(error_case_id);

-- ── Views ─────────────────────────────────────────────────────────────────────

-- Approved FLOW_CORE export set
CREATE VIEW IF NOT EXISTS v_flow_core AS
SELECT
  bi.id                         AS benchmark_item_id,
  bi.benchmark_family,
  bi.bucket,
  bi.gold_type,
  bi.ambiguity_level,
  bi.circularity_risk,
  bi.idempotence_risk,
  bi.downstream_poison_risk,
  bi.why_hard,
  bi.naive_failure_mode,
  bi.curator_notes,
  ec.id                         AS error_case_id,
  ec.error_form,
  ec.target_form,
  ec.variant_type,
  ec.correction_level,
  ec.has_context,
  ec.requires_context,
  ec.observed_count,
  ec.review_status              AS ec_review_status,
  ec.gold_score                 AS ec_gold_score,
  s.source_name,
  s.language,
  s.corpus_name
FROM benchmark_items bi
JOIN error_cases ec ON ec.id = bi.error_case_id
JOIN sources s ON s.id = ec.source_id
WHERE bi.benchmark_family = 'FLOW_CORE'
  AND bi.review_status = 'approved';

-- Approved FLOW_HELL export set
CREATE VIEW IF NOT EXISTS v_flow_hell AS
SELECT
  bi.id                         AS benchmark_item_id,
  bi.benchmark_family,
  bi.bucket,
  bi.gold_type,
  bi.ambiguity_level,
  bi.circularity_risk,
  bi.idempotence_risk,
  bi.downstream_poison_risk,
  bi.why_hard,
  bi.naive_failure_mode,
  bi.curator_notes,
  ec.id                         AS error_case_id,
  ec.error_form,
  ec.target_form,
  ec.variant_type,
  ec.correction_level,
  ec.has_context,
  ec.requires_context,
  ec.observed_count,
  ec.review_status              AS ec_review_status,
  ec.gold_score                 AS ec_gold_score,
  s.source_name,
  s.language,
  s.corpus_name
FROM benchmark_items bi
JOIN error_cases ec ON ec.id = bi.error_case_id
JOIN sources s ON s.id = ec.source_id
WHERE bi.benchmark_family = 'FLOW_HELL'
  AND bi.review_status = 'approved';

-- All candidates and needs_review items (curation queue)
CREATE VIEW IF NOT EXISTS v_benchmark_curation_queue AS
SELECT
  bi.id                         AS benchmark_item_id,
  bi.benchmark_family,
  COALESCE(bi.bucket, '(unset)') AS bucket,
  bi.gold_type,
  bi.ambiguity_level,
  bi.review_status,
  ec.error_form,
  ec.target_form,
  ec.variant_type,
  ec.review_status              AS ec_review_status,
  ec.gold_score                 AS ec_gold_score,
  s.source_name,
  s.language
FROM benchmark_items bi
JOIN error_cases ec ON ec.id = bi.error_case_id
JOIN sources s ON s.id = ec.source_id
WHERE bi.review_status IN ('candidate', 'needs_review')
ORDER BY bi.benchmark_family, bi.bucket, bi.id;
