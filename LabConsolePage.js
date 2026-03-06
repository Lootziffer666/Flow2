/*
LAB Console Model Builder

This module prepares the model for the Lab console view.
It does not render UI components. Rendering is handled by the UI layer.
*/
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function previewText(value, maxLength = 280) {
  const text = String(value ?? '');
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

function normalizeNumericField(value) {
  return value === null || value === undefined ? '-' : value;
}

function normalizeArtifactSnapshot(entry) {
  const source = entry && entry.snapshot ? entry.snapshot : entry || {};
  const hasChanged = Object.prototype.hasOwnProperty.call(source, 'changed');

  return {
    input_text: source.input_text ?? '',
    corrected_text: source.corrected_text ?? '',
    input_length_chars: normalizeNumericField(source.input_length_chars),
    output_length_chars: normalizeNumericField(source.output_length_chars),
    input_token_count: normalizeNumericField(source.input_token_count),
    output_token_count: normalizeNumericField(source.output_token_count),
    changed: hasChanged ? Boolean(source.changed) : undefined,
    rule_hits_SN: normalizeNumericField(source.rule_hits_SN),
    rule_hits_SL: normalizeNumericField(source.rule_hits_SL),
    rule_hits_MO: normalizeNumericField(source.rule_hits_MO),
    rule_hits_PG: normalizeNumericField(source.rule_hits_PG),
    rule_hits_total: normalizeNumericField(source.rule_hits_total),
  };
}

function renderChanged(value) {
  if (value === undefined) return '-';
  return value ? 'Ja' : 'Nein';
}

function renderSnapshotTextPreview(snapshot) {
  return `
  <div>Eingabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.input_text))}</pre>
  <div>Ausgabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.corrected_text))}</pre>`;
}

function renderSnapshotTextDetail(snapshot) {
  return `
  <div class="bg-card border-border">Eingabe:</div>
  <pre class="code-block">${escapeHtml(snapshot.input_text)}</pre>
  <div class="bg-card border-border">Ausgabe:</div>
  <pre class="code-block">${escapeHtml(snapshot.corrected_text)}</pre>`;
}


function renderEvaluationSection(summary, evaluation) {
  if (!summary || !evaluation) return '';

  const delta = evaluation.metrics && evaluation.metrics.baseline_delta ? evaluation.metrics.baseline_delta : {};
  const integrity = {
    determinism_ok: Boolean(evaluation.metrics && evaluation.metrics.determinism_ok),
    audit_chain_ok: Boolean(evaluation.metrics && evaluation.metrics.audit_chain_ok),
    dataset_hash: evaluation.dataset_hash || summary.dataset_hash || '-',
    metrics_hash: evaluation.metrics_hash || summary.metrics_hash || '-',
  };

  return `
  <h3>Evaluation Summary</h3>
  <div class="bg-card border-border">Suite: ${escapeHtml(summary.benchmark_suite_id)} / ${escapeHtml(summary.benchmark_suite_version)}</div>
  <div class="bg-card border-border">Baseline: ${escapeHtml(summary.baseline_artifact_id || '-')}</div>
  <div class="bg-card border-border">Candidate: ${escapeHtml(evaluation.candidate_artifact_id || '-')}</div>
  <div class="bg-card border-border">Gate: ${escapeHtml(summary.gate_result || evaluation.gate_result || '-')}</div>
  <div class="bg-card border-border">Gate-Reasons: ${escapeHtml((evaluation.gate_reasons || []).join(', ') || '-')}</div>

  <h3>Baseline-Delta</h3>
  <div class="bg-card border-border">Δ changed_rate: ${escapeHtml(delta.changed_rate ?? '-')}</div>
  <div class="bg-card border-border">Δ SN_share: ${escapeHtml(delta.SN_share ?? '-')}</div>
  <div class="bg-card border-border">Δ SL_share: ${escapeHtml(delta.SL_share ?? '-')}</div>
  <div class="bg-card border-border">Δ MO_share: ${escapeHtml(delta.MO_share ?? '-')}</div>
  <div class="bg-card border-border">Δ PG_share: ${escapeHtml(delta.PG_share ?? '-')}</div>
  <div class="bg-card border-border">Δ token_delta: ${escapeHtml(delta.token_delta ?? '-')}</div>
  <div class="bg-card border-border">Δ char_delta: ${escapeHtml(delta.char_delta ?? '-')}</div>
  <div class="bg-card border-border">same_output_rate: ${escapeHtml(evaluation.metrics && evaluation.metrics.same_output_rate !== undefined ? evaluation.metrics.same_output_rate : '-')}</div>

  <h3>Integrität</h3>
  <div class="bg-card border-border">Determinismus: ${escapeHtml(integrity.determinism_ok ? 'ok' : 'fail')}</div>
  <div class="bg-card border-border">Audit-Chain: ${escapeHtml(integrity.audit_chain_ok ? 'ok' : 'fail')}</div>
  <div class="bg-card border-border">dataset_hash: ${escapeHtml(integrity.dataset_hash)}</div>
  <div class="bg-card border-border">metrics_hash: ${escapeHtml(integrity.metrics_hash)}</div>`;
}

function renderSnapshotMetrics(snapshot, className = '') {
  const prefix = className ? ` class="${className}"` : '';
  return `
  <div${prefix}>Zeichen Input: ${escapeHtml(snapshot.input_length_chars)}</div>
  <div${prefix}>Zeichen Output: ${escapeHtml(snapshot.output_length_chars)}</div>
  <div${prefix}>Tokens Input: ${escapeHtml(snapshot.input_token_count)}</div>
  <div${prefix}>Tokens Output: ${escapeHtml(snapshot.output_token_count)}</div>
  <div${prefix}>Geändert: ${escapeHtml(renderChanged(snapshot.changed))}</div>
  <div${prefix}>SN: ${escapeHtml(snapshot.rule_hits_SN)}</div>
  <div${prefix}>SL: ${escapeHtml(snapshot.rule_hits_SL)}</div>
  <div${prefix}>MO: ${escapeHtml(snapshot.rule_hits_MO)}</div>
  <div${prefix}>PG: ${escapeHtml(snapshot.rule_hits_PG)}</div>
  <div${prefix}>Gesamt: ${escapeHtml(snapshot.rule_hits_total)}</div>`;
}

function getLabConsoleModel(store) {
  const artifact = store.state.promotedArtifact;
  const promotedArtifacts = store.state.promotedArtifacts || [];
  const selectedArtifactIds = store.state.selectedArtifactIds || [];
  const auditByArtifactId = Object.create(null);

  for (const entry of store.state.auditLog || []) {
    if (entry && entry.artifact_id && !auditByArtifactId[entry.artifact_id]) {
      auditByArtifactId[entry.artifact_id] = entry;
    }
  }

  const comparisonArtifacts = promotedArtifacts.filter((entry) => selectedArtifactIds.includes(entry.artifact_id));

  const comparisonRows = comparisonArtifacts.map((entry) => {
    const benchmarkJob = (store.state.benchmarkJobs || {})[entry.artifact_id] || null;

    return {
      artifact_id: entry.artifact_id,
      source_run_id: entry.source_run_id,
      created_at: entry.created_at,
      benchmark_job: benchmarkJob,
      latest_audit_entry: auditByArtifactId[entry.artifact_id] || null,
      snapshot: normalizeArtifactSnapshot(entry),
    };
  });

  const evaluationSummary = artifact && artifact.evaluation_summary ? artifact.evaluation_summary : null;
  const currentEvaluationId = evaluationSummary
    ? evaluationSummary.evaluation_id
    : (artifact ? (store.state.artifactEvaluations || {})[artifact.artifact_id] : null);
  const currentEvaluation = currentEvaluationId
    ? (store.state.benchmarkEvaluations || {})[currentEvaluationId] || null
    : null;

  return {
    mode: store.state.mode,
    classes: {
      container: 'mode-lab bg-background text-foreground',
      card: 'bg-card border-border',
      status: 'bg-status-neutral',
      code: 'code-block',
    },
    artifact,
    source_run_id: artifact ? artifact.source_run_id : null,
    artifact_id: artifact ? artifact.artifact_id : null,
    created_at: artifact ? artifact.created_at : null,
    promoted_artifacts: promotedArtifacts,
    selected_artifact_ids: selectedArtifactIds,
    comparison_rows: comparisonRows,
    benchmark_job: store.state.benchmarkJob,
    audit_log: store.state.auditLog,
    evaluation_summary: evaluationSummary,
    current_evaluation: currentEvaluation,
  };
}

function renderLabConsolePage(model) {
  const benchmark = model.benchmark_job || { job_id: '-', status: '-', suite_ref: '-' };
  const selectedIds = Array.isArray(model.selected_artifact_ids) ? model.selected_artifact_ids : [];

  const artifactItems = (model.promoted_artifacts || [])
    .map((entry) => {
      const selected = selectedIds.includes(entry.artifact_id) ? 'Ausgewählt' : '';
      const snapshot = normalizeArtifactSnapshot(entry);

      return `
<li class="bg-card border-border" data-artifact-id="${escapeHtml(entry.artifact_id || '-')}">
  <div>artifact_id: ${escapeHtml(entry.artifact_id || '-')}</div>
  <div>Lauf: ${escapeHtml(entry.source_run_id || '-')}</div>
  <div>Erstellt: ${escapeHtml(entry.created_at || '-')}</div>
  <div>Snapshot</div>${renderSnapshotTextPreview(snapshot)}
  <div>Regelklassen</div>${renderSnapshotMetrics(snapshot)}
  <div class="bg-status-neutral">${escapeHtml(selected)}</div>
</li>`;
    })
    .join('');

  const comparisonColumns = (model.comparison_rows || [])
    .map((entry) => {
      const audit = entry.latest_audit_entry;
      const bench = entry.benchmark_job || { job_id: '-', status: '-', suite_ref: '-' };
      const snapshot = normalizeArtifactSnapshot(entry);

      return `
<li class="bg-card border-border" data-compare-artifact-id="${escapeHtml(entry.artifact_id || '-')}">
  <h4>${escapeHtml(entry.artifact_id || '-')}</h4>
  <div>source_run_id: ${escapeHtml(entry.source_run_id || '-')}</div>
  <div>created_at: ${escapeHtml(entry.created_at || '-')}</div>${renderSnapshotTextPreview(snapshot)}
  <div>Regelklassen</div>${renderSnapshotMetrics(snapshot)}
  <div>benchmark_job: ${escapeHtml(bench.job_id)} / ${escapeHtml(bench.status)} / ${escapeHtml(bench.suite_ref)}</div>
  <div>Protokoll:</div>
  <code class="code-block">${escapeHtml(audit ? audit.protocol_hash : '-')}</code>
  <div>benchmark_suite_hash:</div>
  <code class="code-block">${escapeHtml(audit ? audit.benchmark_suite_hash : '-')}</code>
</li>`;
    })
    .join('');

  const selectedSnapshot = normalizeArtifactSnapshot(model.artifact);
  const evaluationSection = renderEvaluationSection(model.evaluation_summary, model.current_evaluation);

  return `
<section class="mode-lab bg-background text-foreground" data-view="lab-console">
  <h2>Lab</h2>
  <div class="bg-card border-border">artifact_id: ${escapeHtml(model.artifact_id || '-')}</div>
  <div class="bg-card border-border">source_run_id: ${escapeHtml(model.source_run_id || '-')}</div>
  <div class="bg-card border-border">created_at: ${escapeHtml(model.created_at || '-')}</div>${renderSnapshotTextDetail(selectedSnapshot)}
  ${renderSnapshotMetrics(selectedSnapshot, 'bg-card border-border')}
  <div class="bg-card border-border">benchmark_job: ${escapeHtml(benchmark.job_id)} / ${escapeHtml(benchmark.status)} / ${escapeHtml(benchmark.suite_ref)}</div>${evaluationSection}

  <h3>Artefakte</h3>
  <ul>${artifactItems}</ul>

  <h3>Vergleich</h3>
  <div class="bg-status-neutral">Ausgewählt: ${escapeHtml(selectedIds.join(', ') || '-')}</div>
  <ul>${comparisonColumns}</ul>
</section>`;
}

module.exports = {
  getLabConsoleModel,
  renderLabConsolePage,
};
