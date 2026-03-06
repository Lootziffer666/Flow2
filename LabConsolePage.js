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

function normalizeArtifactSnapshot(entry) {
  const source = entry && entry.snapshot ? entry.snapshot : entry || {};
  const hasChanged = Object.prototype.hasOwnProperty.call(source, 'changed');

  return {
    input_text: source.input_text ?? '',
    corrected_text: source.corrected_text ?? '',
    input_length_chars: source.input_length_chars ?? 0,
    output_length_chars: source.output_length_chars ?? 0,
    input_token_count: source.input_token_count ?? 0,
    output_token_count: source.output_token_count ?? 0,
    changed: hasChanged ? Boolean(source.changed) : undefined,
    rule_hits_SN: source.rule_hits_SN ?? 0,
    rule_hits_SL: source.rule_hits_SL ?? 0,
    rule_hits_MO: source.rule_hits_MO ?? 0,
    rule_hits_PG: source.rule_hits_PG ?? 0,
    rule_hits_total: source.rule_hits_total ?? 0,
  };
}

function renderChanged(value) {
  if (value === undefined) return '-';
  return value ? 'Ja' : 'Nein';
}

function getLabConsoleModel(store) {
  const artifact = store.state.promotedArtifact;
  const promotedArtifacts = store.state.promotedArtifacts || [];
  const selectedArtifactIds = store.state.selectedArtifactIds || [];

  const comparisonArtifacts = promotedArtifacts.filter((entry) => selectedArtifactIds.includes(entry.artifact_id));

  const comparisonRows = comparisonArtifacts.map((entry) => {
    const latestAudit = store.state.auditLog.find((audit) => audit.artifact_id === entry.artifact_id) || null;
    const benchmarkJob = (store.state.benchmarkJobs || {})[entry.artifact_id] || null;

    return {
      artifact_id: entry.artifact_id,
      source_run_id: entry.source_run_id,
      created_at: entry.created_at,
      benchmark_job: benchmarkJob,
      latest_audit_entry: latestAudit,
      snapshot: normalizeArtifactSnapshot(entry),
    };
  });

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
  };
}

function renderLabConsolePage(model) {
  const benchmark = model.benchmark_job || { job_id: '-', status: '-', suite_ref: '-' };

  const artifactItems = (model.promoted_artifacts || [])
    .map((entry) => {
      const selected = model.selected_artifact_ids.includes(entry.artifact_id) ? 'Ausgewählt' : '';
      const snapshot = normalizeArtifactSnapshot(entry);

      return `
<li class="bg-card border-border" data-artifact-id="${escapeHtml(entry.artifact_id || '-')}">
  <div>artifact_id: ${escapeHtml(entry.artifact_id || '-')}</div>
  <div>Lauf: ${escapeHtml(entry.source_run_id || '-')}</div>
  <div>Erstellt: ${escapeHtml(entry.created_at || '-')}</div>
  <div>Snapshot</div>
  <div>Eingabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.input_text))}</pre>
  <div>Ausgabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.corrected_text))}</pre>
  <div>Zeichen Input: ${escapeHtml(snapshot.input_length_chars)}</div>
  <div>Zeichen Output: ${escapeHtml(snapshot.output_length_chars)}</div>
  <div>Tokens Input: ${escapeHtml(snapshot.input_token_count)}</div>
  <div>Tokens Output: ${escapeHtml(snapshot.output_token_count)}</div>
  <div>Geändert: ${escapeHtml(renderChanged(snapshot.changed))}</div>
  <div>Regelklassen</div>
  <div>SN: ${escapeHtml(snapshot.rule_hits_SN)}</div>
  <div>SL: ${escapeHtml(snapshot.rule_hits_SL)}</div>
  <div>MO: ${escapeHtml(snapshot.rule_hits_MO)}</div>
  <div>PG: ${escapeHtml(snapshot.rule_hits_PG)}</div>
  <div>Gesamt: ${escapeHtml(snapshot.rule_hits_total)}</div>
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
  <div>created_at: ${escapeHtml(entry.created_at || '-')}</div>
  <div>Eingabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.input_text))}</pre>
  <div>Ausgabe:</div>
  <pre class="code-block">${escapeHtml(previewText(snapshot.corrected_text))}</pre>
  <div>Zeichen Input: ${escapeHtml(snapshot.input_length_chars)}</div>
  <div>Zeichen Output: ${escapeHtml(snapshot.output_length_chars)}</div>
  <div>Tokens Input: ${escapeHtml(snapshot.input_token_count)}</div>
  <div>Tokens Output: ${escapeHtml(snapshot.output_token_count)}</div>
  <div>Geändert: ${escapeHtml(renderChanged(snapshot.changed))}</div>
  <div>Regelklassen</div>
  <div>SN: ${escapeHtml(snapshot.rule_hits_SN)}</div>
  <div>SL: ${escapeHtml(snapshot.rule_hits_SL)}</div>
  <div>MO: ${escapeHtml(snapshot.rule_hits_MO)}</div>
  <div>PG: ${escapeHtml(snapshot.rule_hits_PG)}</div>
  <div>Gesamt: ${escapeHtml(snapshot.rule_hits_total)}</div>
  <div>benchmark_job: ${escapeHtml(bench.job_id)} / ${escapeHtml(bench.status)} / ${escapeHtml(bench.suite_ref)}</div>
  <div>Protokoll:</div>
  <code class="code-block">${escapeHtml(audit ? audit.protocol_hash : '-')}</code>
  <div>benchmark_suite_hash:</div>
  <code class="code-block">${escapeHtml(audit ? audit.benchmark_suite_hash : '-')}</code>
</li>`;
    })
    .join('');

  const selectedSnapshot = normalizeArtifactSnapshot(model.artifact);

  return `
<section class="mode-lab bg-background text-foreground" data-view="lab-console">
  <h2>Lab</h2>
  <div class="bg-card border-border">artifact_id: ${escapeHtml(model.artifact_id || '-')}</div>
  <div class="bg-card border-border">source_run_id: ${escapeHtml(model.source_run_id || '-')}</div>
  <div class="bg-card border-border">created_at: ${escapeHtml(model.created_at || '-')}</div>
  <div class="bg-card border-border">Eingabe:</div>
  <pre class="code-block">${escapeHtml(selectedSnapshot.input_text)}</pre>
  <div class="bg-card border-border">Ausgabe:</div>
  <pre class="code-block">${escapeHtml(selectedSnapshot.corrected_text)}</pre>
  <div class="bg-card border-border">Zeichen Input: ${escapeHtml(selectedSnapshot.input_length_chars)}</div>
  <div class="bg-card border-border">Zeichen Output: ${escapeHtml(selectedSnapshot.output_length_chars)}</div>
  <div class="bg-card border-border">Tokens Input: ${escapeHtml(selectedSnapshot.input_token_count)}</div>
  <div class="bg-card border-border">Tokens Output: ${escapeHtml(selectedSnapshot.output_token_count)}</div>
  <div class="bg-card border-border">Geändert: ${escapeHtml(renderChanged(selectedSnapshot.changed))}</div>
  <div class="bg-card border-border">SN: ${escapeHtml(selectedSnapshot.rule_hits_SN)}</div>
  <div class="bg-card border-border">SL: ${escapeHtml(selectedSnapshot.rule_hits_SL)}</div>
  <div class="bg-card border-border">MO: ${escapeHtml(selectedSnapshot.rule_hits_MO)}</div>
  <div class="bg-card border-border">PG: ${escapeHtml(selectedSnapshot.rule_hits_PG)}</div>
  <div class="bg-card border-border">Gesamt: ${escapeHtml(selectedSnapshot.rule_hits_total)}</div>
  <div class="bg-card border-border">benchmark_job: ${escapeHtml(benchmark.job_id)} / ${escapeHtml(benchmark.status)} / ${escapeHtml(benchmark.suite_ref)}</div>

  <h3>Artefakte</h3>
  <ul>${artifactItems}</ul>

  <h3>Vergleich</h3>
  <div class="bg-status-neutral">Ausgewählt: ${escapeHtml((model.selected_artifact_ids || []).join(', ') || '-')}</div>
  <ul>${comparisonColumns}</ul>
</section>`;
}

module.exports = {
  getLabConsoleModel,
  renderLabConsolePage,
};
