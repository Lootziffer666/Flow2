const crypto = require('node:crypto');
const { runCorrection } = require('../../flow/src/pipeline');

function countWhitespaceTokens(text) {
  const value = String(text).trim();
  if (!value) return 0;
  return value.split(/\s+/).length;
}

function createAuditEntryHash(entry) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(entry))
    .digest('hex');
}

function createTextHash(text) {
  return crypto
    .createHash('sha1')
    .update(String(text ?? ''))
    .digest('hex');
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx];
}

const REQUIRED_SEGMENTS = ['core_de', 'regression_de', 'stress_de', 'no_change', 'edge'];
const ALLOWED_SIZE_CLASSES = new Set(['S', 'M', 'L']);
const ALLOWED_GATE_RESULTS = new Set(['pass', 'warn', 'fail']);

function normalizeSuiteSegments(segments = {}) {
  const normalized = {};
  for (const key of REQUIRED_SEGMENTS) {
    const value = segments[key];
    normalized[key] = Array.isArray(value)
      ? value.map((item) => String(item ?? ''))
      : [];
  }
  return normalized;
}

function computeMetricsHash(metrics) {
  return createTextHash(stableStringify(metrics || {}));
}


function createRunStore() {
  let runCounter = 0;
  let artifactCounter = 0;
  let evaluationCounter = 0;

  const state = {
    mode: 'mode-suite',
    runs: [],
    promotedArtifact: null,
    promotedArtifacts: [],
    selectedArtifactIds: [],
    benchmarkJobs: {},
    benchmarkJob: null,
    benchmarkSuites: {},
    benchmarkEvaluations: {},
    artifactEvaluations: {},
    auditLog: [],
  };

  function appendAuditEvent(payload) {
    const timestamp = payload.timestamp || new Date().toISOString();
    const previousAuditHash = state.auditLog[0] ? state.auditLog[0].entry_hash : 'root';
    const auditBase = {
      ...payload,
      timestamp,
      prev_entry_hash: previousAuditHash,
    };

    const auditEntry = {
      ...auditBase,
      entry_hash: createAuditEntryHash(auditBase),
    };

    state.auditLog.unshift(auditEntry);
    return auditEntry;
  }

  function getAuditChainIntegrity() {
    let brokenLinks = 0;

    for (let i = 0; i < state.auditLog.length; i += 1) {
      const current = state.auditLog[i];
      const expectedPrev = state.auditLog[i + 1] ? state.auditLog[i + 1].entry_hash : 'root';
      if (current.prev_entry_hash !== expectedPrev) {
        brokenLinks += 1;
      }
    }

    return {
      audit_chain_ok: brokenLinks === 0,
      audit_chain_broken_links: brokenLinks,
    };
  }

  function createRun(inputText) {
    const { corrected, rule_hits } = runCorrection(inputText);
    runCounter += 1;

    const sourceText = String(inputText);
    const correctedText = String(corrected);

    const run = {
      run_id: `run-${String(runCounter).padStart(4, '0')}`,
      input_text: sourceText,
      corrected_text: correctedText,
      created_at: new Date().toISOString(),
      status: 'draft',
      input_length_chars: sourceText.length,
      output_length_chars: correctedText.length,
      input_token_count: countWhitespaceTokens(sourceText),
      output_token_count: countWhitespaceTokens(correctedText),
      changed: sourceText !== correctedText,
      rule_hits_SN: rule_hits.SN,
      rule_hits_SL: rule_hits.SL,
      rule_hits_MO: rule_hits.MO,
      rule_hits_PG: rule_hits.PG,
      rule_hits_total: rule_hits.SN + rule_hits.SL + rule_hits.MO + rule_hits.PG,
    };

    state.runs.unshift(run);
    return run;
  }

  function verifyRun(runId) {
    const run = state.runs.find((entry) => entry.run_id === runId);
    if (!run) return null;
    run.status = 'verified';
    return run;
  }

  function getPromotableRuns() {
    return state.runs.filter((run) => run.status === 'verified');
  }

  function setComparisonSelection(artifactIds) {
    const allowed = new Set(state.promotedArtifacts.map((artifact) => artifact.artifact_id));
    state.selectedArtifactIds = artifactIds.filter((artifactId) => allowed.has(artifactId));
    return state.selectedArtifactIds;
  }

  function toggleComparisonSelection(artifactId) {
    if (!state.promotedArtifacts.some((artifact) => artifact.artifact_id === artifactId)) {
      return state.selectedArtifactIds;
    }

    if (state.selectedArtifactIds.includes(artifactId)) {
      state.selectedArtifactIds = state.selectedArtifactIds.filter((id) => id !== artifactId);
      return state.selectedArtifactIds;
    }

    state.selectedArtifactIds = [...state.selectedArtifactIds, artifactId];
    return state.selectedArtifactIds;
  }

  function promoteVerifiedRun(runId, actor = 'suite-user') {
    const run = state.runs.find((entry) => entry.run_id === runId);
    if (!run || run.status !== 'verified') {
      return null;
    }

    artifactCounter += 1;
    const createdAt = new Date().toISOString();
    const snapshot = Object.freeze({
      input_text: run.input_text ?? '',
      corrected_text: run.corrected_text ?? '',
      input_length_chars: run.input_length_chars ?? 0,
      output_length_chars: run.output_length_chars ?? 0,
      input_token_count: run.input_token_count ?? 0,
      output_token_count: run.output_token_count ?? 0,
      changed: Boolean(run.changed),
      rule_hits_SN: run.rule_hits_SN ?? 0,
      rule_hits_SL: run.rule_hits_SL ?? 0,
      rule_hits_MO: run.rule_hits_MO ?? 0,
      rule_hits_PG: run.rule_hits_PG ?? 0,
      rule_hits_total: run.rule_hits_total ?? 0,
    });

    const artifact = Object.freeze({
      artifact_id: `artifact-${String(artifactCounter).padStart(4, '0')}`,
      source_run_id: run.run_id,
      created_at: createdAt,
      snapshot,
    });

    const protocolHash = `placeholder-${crypto
      .createHash('sha1')
      .update(`protocol:${run.run_id}`)
      .digest('hex')
      .slice(0, 12)}`;

    const benchmarkSuiteHash = `placeholder-${crypto
      .createHash('sha1')
      .update('benchmark-suite:v1')
      .digest('hex')
      .slice(0, 12)}`;

    const benchmarkJob = {
      job_id: `bench-${artifact.artifact_id}`,
      status: 'pending',
      suite_ref: 'FLOW-MVP-benchmark-scaffold',
    };

    state.promotedArtifacts.unshift(artifact);
    state.promotedArtifact = state.promotedArtifacts[0] || null;
    state.benchmarkJobs[artifact.artifact_id] = benchmarkJob;
    state.benchmarkJob = benchmarkJob;

    appendAuditEvent({
      actor,
      source_run_id: run.run_id,
      artifact_id: artifact.artifact_id,
      protocol_hash: protocolHash,
      benchmark_suite_hash: benchmarkSuiteHash,
      snapshot_present: true,
    });

    if (!state.selectedArtifactIds.includes(artifact.artifact_id)) {
      state.selectedArtifactIds = [...state.selectedArtifactIds, artifact.artifact_id];
    }

    state.mode = 'mode-lab';
    return artifact;
  }

  function setModeSuite() {
    state.mode = 'mode-suite';
  }

  function computeDatasetHash(segments) {
    return crypto
      .createHash('sha1')
      .update(stableStringify(segments || {}))
      .digest('hex');
  }

  function registerBenchmarkSuite({ suite_id, suite_version, segments, created_at }) {
    if (!suite_id || !suite_version) {
      throw new Error('registerBenchmarkSuite requires suite_id and suite_version');
    }

    const key = `${suite_id}:${suite_version}`;
    const normalizedSegments = normalizeSuiteSegments(segments);
    const suite = Object.freeze({
      suite_id: String(suite_id),
      suite_version: String(suite_version),
      dataset_hash: computeDatasetHash(normalizedSegments),
      segments: Object.freeze(normalizedSegments),
      created_at: created_at || new Date().toISOString(),
    });

    state.benchmarkSuites[key] = suite;
    return suite;
  }

  function aggregateBenchmarkMetrics(input = {}, legacyBaselineMetrics = null) {
    const runsInput = Array.isArray(input)
      ? input
      : (input && Array.isArray(input.runs) ? input.runs : []);
    const baselineRunsInput = Array.isArray(input && input.baselineRuns)
      ? input.baselineRuns
      : null;
    const auditLogInput = Array.isArray(input && input.auditLog)
      ? input.auditLog
      : state.auditLog;
    const baselineMetrics = baselineRunsInput
      ? aggregateBenchmarkMetrics({ runs: baselineRunsInput, auditLog: [] })
      : legacyBaselineMetrics;

    const caseResults = runsInput;
    const totalRuns = caseResults.length;
    const changedTrue = caseResults.filter((entry) => Boolean(entry.changed)).length;

    const tokenDeltas = caseResults.map((entry) => Number(entry.token_delta || 0));
    const charDeltas = caseResults.map((entry) => Number(entry.char_delta || 0));
    const absTokenRatios = caseResults.map((entry) => {
      const denominator = Math.max(1, Number(entry.input_token_count || 0));
      return Math.abs(Number(entry.token_delta || 0)) / denominator;
    });

    const totalRuleHits = caseResults.reduce((sum, entry) => sum + Number(entry.rule_hits_total || 0), 0);
    const sumSN = caseResults.reduce((sum, entry) => sum + Number(entry.rule_hits_SN || 0), 0);
    const sumSL = caseResults.reduce((sum, entry) => sum + Number(entry.rule_hits_SL || 0), 0);
    const sumMO = caseResults.reduce((sum, entry) => sum + Number(entry.rule_hits_MO || 0), 0);
    const sumPG = caseResults.reduce((sum, entry) => sum + Number(entry.rule_hits_PG || 0), 0);

    const byInput = new Map();
    for (const entry of caseResults) {
      const inputKey = String(entry.input_text ?? '');
      const outputHash = createTextHash(entry.corrected_text ?? '');
      if (!byInput.has(inputKey)) {
        byInput.set(inputKey, new Set());
      }
      byInput.get(inputKey).add(outputHash);
    }

    let deterministicGroups = 0;
    let deterministicFailures = 0;
    for (const hashes of byInput.values()) {
      if (hashes.size > 1) deterministicFailures += 1;
      deterministicGroups += 1;
    }

    const noChangeCases = caseResults.filter((entry) => entry.segment === 'no_change');
    const noChangeChanged = noChangeCases.filter((entry) => Boolean(entry.changed)).length;
    const changedRateNoChange = noChangeCases.length ? noChangeChanged / noChangeCases.length : 0;

    const outputFingerprint = caseResults
      .map((entry) => ({
        input_hash: createTextHash(entry.input_text ?? ''),
        output_hash: createTextHash(entry.corrected_text ?? ''),
      }))
      .sort((a, b) => (a.input_hash + a.output_hash).localeCompare(b.input_hash + b.output_hash));

    const metrics = {
      changed_true: changedTrue,
      total_runs: totalRuns,
      changed_rate: totalRuns ? changedTrue / totalRuns : 0,
      token_delta: tokenDeltas.reduce((a, b) => a + b, 0),
      token_delta_mean: totalRuns ? tokenDeltas.reduce((a, b) => a + b, 0) / totalRuns : 0,
      char_delta: charDeltas.reduce((a, b) => a + b, 0),
      char_delta_mean: totalRuns ? charDeltas.reduce((a, b) => a + b, 0) / totalRuns : 0,
      abs_token_change_ratio_mean: absTokenRatios.length
        ? absTokenRatios.reduce((a, b) => a + b, 0) / absTokenRatios.length
        : 0,
      abs_token_change_ratio_p50: percentile(absTokenRatios, 0.5),
      abs_token_change_ratio_p95: percentile(absTokenRatios, 0.95),
      token_delta_p50: percentile(tokenDeltas, 0.5),
      token_delta_p95: percentile(tokenDeltas, 0.95),
      char_delta_p50: percentile(charDeltas, 0.5),
      char_delta_p95: percentile(charDeltas, 0.95),
      rule_hits_total_mean: totalRuns ? totalRuleHits / totalRuns : 0,
      SN_share: totalRuleHits ? sumSN / totalRuleHits : 0,
      SL_share: totalRuleHits ? sumSL / totalRuleHits : 0,
      MO_share: totalRuleHits ? sumMO / totalRuleHits : 0,
      PG_share: totalRuleHits ? sumPG / totalRuleHits : 0,
      rule_shares: {
        SN: totalRuleHits ? sumSN / totalRuleHits : 0,
        SL: totalRuleHits ? sumSL / totalRuleHits : 0,
        MO: totalRuleHits ? sumMO / totalRuleHits : 0,
        PG: totalRuleHits ? sumPG / totalRuleHits : 0,
      },
      determinism_ok: deterministicFailures === 0,
      determinism_fail_groups: deterministicFailures,
      determinism: {
        repeated_input_groups: deterministicGroups,
        stable_output_hash_groups: deterministicGroups - deterministicFailures,
        unstable_output_hash_groups: deterministicFailures,
        output_hash_consistent: deterministicFailures === 0,
      },
      changed_rate_no_change: changedRateNoChange,
      output_fingerprint: outputFingerprint,
    };

    const auditIntegrity = (() => {
      let broken = 0;
      for (let i = 0; i < auditLogInput.length; i += 1) {
        const current = auditLogInput[i];
        const expectedPrev = auditLogInput[i + 1] ? auditLogInput[i + 1].entry_hash : 'root';
        if (current && current.prev_entry_hash !== expectedPrev) {
          broken += 1;
        }
      }
      return {
        chain_consistent: broken === 0,
        broken_links: broken,
      };
    })();

    metrics.audit_integrity = auditIntegrity;

    if (baselineMetrics) {
      const baseMap = new Map(baselineMetrics.output_fingerprint.map((entry) => [entry.input_hash, entry.output_hash]));
      let sameCount = 0;
      let overlap = 0;
      for (const item of outputFingerprint) {
        if (baseMap.has(item.input_hash)) {
          overlap += 1;
          if (baseMap.get(item.input_hash) === item.output_hash) {
            sameCount += 1;
          }
        }
      }

      metrics.baseline_delta = {
        changed_rate: metrics.changed_rate - Number(baselineMetrics.changed_rate || 0),
        SN_share: metrics.SN_share - Number(baselineMetrics.SN_share || 0),
        SL_share: metrics.SL_share - Number(baselineMetrics.SL_share || 0),
        MO_share: metrics.MO_share - Number(baselineMetrics.MO_share || 0),
        PG_share: metrics.PG_share - Number(baselineMetrics.PG_share || 0),
        token_delta: metrics.token_delta - Number(baselineMetrics.token_delta || 0),
        char_delta: metrics.char_delta - Number(baselineMetrics.char_delta || 0),
      };
      metrics.drift_vs_baseline = {
        changed_rate_delta: metrics.changed_rate - Number(baselineMetrics.changed_rate || 0),
        SN_share_delta: metrics.SN_share - Number(baselineMetrics.SN_share || 0),
        SL_share_delta: metrics.SL_share - Number(baselineMetrics.SL_share || 0),
        MO_share_delta: metrics.MO_share - Number(baselineMetrics.MO_share || 0),
        PG_share_delta: metrics.PG_share - Number(baselineMetrics.PG_share || 0),
        token_delta_mean_delta: metrics.token_delta_mean - Number(baselineMetrics.token_delta_mean || 0),
        char_delta_mean_delta: metrics.char_delta_mean - Number(baselineMetrics.char_delta_mean || 0),
      };
      metrics.same_output_rate = overlap ? sameCount / overlap : 0;
      metrics.same_output_rate_vs_baseline = overlap ? sameCount / overlap : 0;
      metrics.no_change_regression = metrics.changed_rate_no_change - Number(baselineMetrics.changed_rate_no_change || 0);
    }

    metrics.evaluation_result_hash = computeMetricsHash({
      output_fingerprint: metrics.output_fingerprint,
      determinism: metrics.determinism,
      changed_rate: metrics.changed_rate,
      rule_shares: metrics.rule_shares,
    });

    return metrics;
  }

  function evaluateBenchmarkGates(metrics, thresholds = {}) {
    const gateReasons = [];
    let gateResult = 'pass';

    const hardNoDeterminism = metrics.determinism && metrics.determinism.output_hash_consistent === false;
    const hardAuditFail = metrics.audit_integrity && metrics.audit_integrity.chain_consistent === false;

    if (hardNoDeterminism) {
      gateReasons.push('determinism_failed');
      gateResult = 'fail';
    }

    if (hardAuditFail) {
      gateReasons.push('audit_chain_inconsistent');
      gateResult = 'fail';
    }

    const softThresholds = {
      rule_share_drift_warn: thresholds.rule_share_drift_warn ?? 0.2,
      no_change_regression_warn: thresholds.no_change_regression_warn ?? 0.05,
      no_change_regression_fail: thresholds.no_change_regression_fail ?? 0.15,
    };

    const baselineDelta = metrics.drift_vs_baseline || metrics.baseline_delta || {};
    const maxRuleShareDrift = Math.max(
      Math.abs(Number(baselineDelta.SN_share_delta || baselineDelta.SN_share || 0)),
      Math.abs(Number(baselineDelta.SL_share_delta || baselineDelta.SL_share || 0)),
      Math.abs(Number(baselineDelta.MO_share_delta || baselineDelta.MO_share || 0)),
      Math.abs(Number(baselineDelta.PG_share_delta || baselineDelta.PG_share || 0))
    );

    if (maxRuleShareDrift >= softThresholds.rule_share_drift_warn && gateResult !== 'fail') {
      gateReasons.push('rule_class_drift');
      gateResult = 'warn';
    }

    const noChangeRegression = Number(metrics.no_change_regression || 0);
    if (noChangeRegression >= softThresholds.no_change_regression_fail) {
      gateReasons.push('no_change_regression_fail');
      gateResult = 'fail';
    } else if (noChangeRegression >= softThresholds.no_change_regression_warn && gateResult === 'pass') {
      gateReasons.push('no_change_regression_warn');
      gateResult = 'warn';
    }

    return {
      gate_result: gateResult,
      gate_reasons: gateReasons,
    };
  }

  function normalizeCaseResult(raw) {
    const input = String(raw.input_text ?? '');
    const output = String(raw.corrected_text ?? '');
    const inputTokens = raw.input_token_count ?? countWhitespaceTokens(input);
    const outputTokens = raw.output_token_count ?? countWhitespaceTokens(output);
    const tokenDelta = raw.token_delta ?? outputTokens - inputTokens;
    const charDelta = raw.char_delta ?? output.length - input.length;
    return {
      input_text: input,
      corrected_text: output,
      input_token_count: inputTokens,
      output_token_count: outputTokens,
      token_delta: tokenDelta,
      char_delta: charDelta,
      changed: raw.changed ?? input !== output,
      segment: raw.segment || 'core_de',
      rule_hits_SN: raw.rule_hits_SN ?? 0,
      rule_hits_SL: raw.rule_hits_SL ?? 0,
      rule_hits_MO: raw.rule_hits_MO ?? 0,
      rule_hits_PG: raw.rule_hits_PG ?? 0,
      rule_hits_total: raw.rule_hits_total
        ?? (raw.rule_hits_SN ?? 0) + (raw.rule_hits_SL ?? 0) + (raw.rule_hits_MO ?? 0) + (raw.rule_hits_PG ?? 0),
    };
  }

  function getArtifactById(artifactId) {
    return state.promotedArtifacts.find((entry) => entry.artifact_id === artifactId) || null;
  }

  function attachEvaluationSummary(artifactId, summary) {
    state.promotedArtifacts = state.promotedArtifacts.map((artifact) => {
      if (artifact.artifact_id !== artifactId) return artifact;
      return Object.freeze({
        ...artifact,
        evaluation_summary: Object.freeze({ ...summary }),
      });
    });

    state.promotedArtifact = state.promotedArtifacts[0] || null;
  }

  function runBenchmarkEvaluation({
    benchmark_suite_id,
    benchmark_suite_version,
    baseline_artifact_id,
    candidate_artifact_id,
    size_class,
    case_results,
    baseline_case_results,
    thresholds,
    actor = 'benchmark-runner',
  }) {
    const suiteKey = `${benchmark_suite_id}:${benchmark_suite_version}`;
    const suite = state.benchmarkSuites[suiteKey];
    if (!suite) {
      return { ok: false, reason: 'benchmark_suite_not_found' };
    }

    if (!ALLOWED_SIZE_CLASSES.has(size_class)) {
      return { ok: false, reason: 'invalid_size_class' };
    }

    const baselineArtifact = getArtifactById(baseline_artifact_id);
    const candidateArtifact = getArtifactById(candidate_artifact_id);
    if (!baselineArtifact || !candidateArtifact) {
      return { ok: false, reason: 'artifact_not_found' };
    }

    const normalizedCases = (case_results || []).map(normalizeCaseResult);
    const normalizedBaselineCases = (baseline_case_results || case_results || []).map(normalizeCaseResult);

    const baselineMetrics = aggregateBenchmarkMetrics({ runs: normalizedBaselineCases, auditLog: state.auditLog });
    const candidateMetrics = aggregateBenchmarkMetrics({
      runs: normalizedCases,
      baselineRuns: normalizedBaselineCases,
      auditLog: state.auditLog,
    }, baselineMetrics);

    const gate = evaluateBenchmarkGates(candidateMetrics, thresholds);
    const metricsHash = computeMetricsHash(candidateMetrics);

    evaluationCounter += 1;
    const normalizedGateResult = ALLOWED_GATE_RESULTS.has(gate.gate_result) ? gate.gate_result : 'fail';

    const evaluation = {
      evaluation_id: `evaluation-${String(evaluationCounter).padStart(4, '0')}`,
      benchmark_suite_id,
      benchmark_suite_version,
      dataset_hash: suite.dataset_hash,
      baseline_artifact_id,
      candidate_artifact_id,
      size_class,
      metrics: candidateMetrics,
      gate_result: normalizedGateResult,
      gate_reasons: gate.gate_reasons,
      metrics_hash: metricsHash,
      created_at: new Date().toISOString(),
    };

    state.benchmarkEvaluations[evaluation.evaluation_id] = evaluation;
    state.artifactEvaluations[candidate_artifact_id] = evaluation.evaluation_id;

    const evaluationSummary = {
      evaluation_id: evaluation.evaluation_id,
      benchmark_suite_id,
      benchmark_suite_version,
      baseline_artifact_id,
      gate_result: normalizedGateResult,
      metrics_hash: metricsHash,
      dataset_hash: suite.dataset_hash,
    };

    attachEvaluationSummary(candidate_artifact_id, evaluationSummary);

    appendAuditEvent({
      event_type: 'benchmark_compare',
      actor,
      artifact_id: candidate_artifact_id,
      baseline_artifact_id,
      benchmark_suite_id,
      benchmark_suite_version,
      dataset_hash: suite.dataset_hash,
      metrics_hash: metricsHash,
      evaluation_id: evaluation.evaluation_id,
      gate_result: normalizedGateResult,
    });

    return {
      ok: true,
      evaluation,
      evaluation_summary: evaluationSummary,
    };
  }

  function compareArtifactsOnBenchmark({
    benchmark_suite_id,
    benchmark_suite_version,
    baseline_artifact_id,
    candidate_artifact_id,
    actor = 'benchmark-runner',
  }) {
    const evaluations = Object.values(state.benchmarkEvaluations);
    const baselineEval = evaluations
      .filter(
        (entry) => entry.candidate_artifact_id === baseline_artifact_id
          && entry.benchmark_suite_id === benchmark_suite_id
          && entry.benchmark_suite_version === benchmark_suite_version
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    const candidateEval = evaluations
      .filter(
        (entry) => entry.candidate_artifact_id === candidate_artifact_id
          && entry.benchmark_suite_id === benchmark_suite_id
          && entry.benchmark_suite_version === benchmark_suite_version
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

    if (!baselineEval || !candidateEval) {
      return { ok: false, reason: 'evaluation_not_found' };
    }

    if (baselineEval.dataset_hash !== candidateEval.dataset_hash) {
      return { ok: false, reason: 'dataset_mismatch' };
    }

    const baselineMetrics = baselineEval.metrics;
    const candidateMetrics = candidateEval.metrics;
    const deltas = {
      changed_rate: Number(candidateMetrics.changed_rate || 0) - Number(baselineMetrics.changed_rate || 0),
      SN_share: Number(candidateMetrics.SN_share || 0) - Number(baselineMetrics.SN_share || 0),
      SL_share: Number(candidateMetrics.SL_share || 0) - Number(baselineMetrics.SL_share || 0),
      MO_share: Number(candidateMetrics.MO_share || 0) - Number(baselineMetrics.MO_share || 0),
      PG_share: Number(candidateMetrics.PG_share || 0) - Number(baselineMetrics.PG_share || 0),
      token_delta: Number(candidateMetrics.token_delta || 0) - Number(baselineMetrics.token_delta || 0),
      char_delta: Number(candidateMetrics.char_delta || 0) - Number(baselineMetrics.char_delta || 0),
    };

    const baselineMap = new Map((baselineMetrics.output_fingerprint || []).map((entry) => [entry.input_hash, entry.output_hash]));
    let overlap = 0;
    let sameOutput = 0;
    for (const item of candidateMetrics.output_fingerprint || []) {
      if (baselineMap.has(item.input_hash)) {
        overlap += 1;
        if (baselineMap.get(item.input_hash) === item.output_hash) {
          sameOutput += 1;
        }
      }
    }

    const sameOutputRate = overlap ? sameOutput / overlap : 0;
    const result = {
      ok: true,
      benchmark_suite_id,
      benchmark_suite_version,
      dataset_hash: baselineEval.dataset_hash,
      baseline_artifact_id,
      candidate_artifact_id,
      same_output_rate: sameOutputRate,
      deltas,
    };

    appendAuditEvent({
      event_type: 'benchmark_compare',
      actor,
      artifact_id: candidate_artifact_id,
      baseline_artifact_id,
      benchmark_suite_id,
      benchmark_suite_version,
      dataset_hash: baselineEval.dataset_hash,
      metrics_hash: createTextHash(stableStringify(result)),
      evaluation_id: candidateEval.evaluation_id,
      gate_result: candidateEval.gate_result,
    });

    return result;
  }

  function appendBenchmarkPromoteDecision({
    artifact_id,
    baseline_artifact_id,
    benchmark_suite_id,
    benchmark_suite_version,
    evaluation_id,
    gate_result,
    actor = 'benchmark-runner',
  }) {
    const evaluation = state.benchmarkEvaluations[evaluation_id];
    if (!evaluation) return null;

    return appendAuditEvent({
      event_type: 'benchmark_promote_decision',
      actor,
      artifact_id,
      baseline_artifact_id,
      benchmark_suite_id,
      benchmark_suite_version,
      dataset_hash: evaluation.dataset_hash,
      metrics_hash: evaluation.metrics_hash,
      evaluation_id,
      gate_result,
    });
  }

  return {
    state,
    createRun,
    verifyRun,
    getPromotableRuns,
    setComparisonSelection,
    toggleComparisonSelection,
    promoteVerifiedRun,
    setModeSuite,
    registerBenchmarkSuite,
    computeDatasetHash,
    computeMetricsHash,
    aggregateBenchmarkMetrics,
    evaluateBenchmarkGates,
    runBenchmarkEvaluation,
    compareArtifactsOnBenchmark,
    appendBenchmarkAuditEvent: appendAuditEvent,
    appendBenchmarkPromoteDecision,
    getAuditChainIntegrity,
  };
}

module.exports = {
  createRunStore,
};
