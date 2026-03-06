/*
LAB Console Model Builder

This module prepares the model for the Lab console view.
It does not render UI components. Rendering is handled by the UI layer.
*/
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
      input_length_chars: entry.input_length_chars,
      output_length_chars: entry.output_length_chars,
      input_token_count: entry.input_token_count,
      output_token_count: entry.output_token_count,
      changed: entry.changed,
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
      return `
<li class="bg-card border-border" data-artifact-id="${entry.artifact_id}">
  <div>artifact_id: ${entry.artifact_id}</div>
  <div>Lauf: ${entry.source_run_id}</div>
  <div>Erstellt: ${entry.created_at}</div>
  <div>Zeichen Input: ${entry.input_length_chars}</div>
  <div>Zeichen Output: ${entry.output_length_chars}</div>
  <div>Tokens Input: ${entry.input_token_count}</div>
  <div>Tokens Output: ${entry.output_token_count}</div>
  <div>Geändert: ${entry.changed ? 'Ja' : 'Nein'}</div>
  <div class="bg-status-neutral">${selected}</div>
</li>`;
    })
    .join('');

  const comparisonColumns = (model.comparison_rows || [])
    .map((entry) => {
      const audit = entry.latest_audit_entry;
      const bench = entry.benchmark_job || { job_id: '-', status: '-', suite_ref: '-' };

      return `
<li class="bg-card border-border" data-compare-artifact-id="${entry.artifact_id}">
  <h4>${entry.artifact_id}</h4>
  <div>source_run_id: ${entry.source_run_id}</div>
  <div>created_at: ${entry.created_at}</div>
  <div>Zeichen Input: ${entry.input_length_chars}</div>
  <div>Zeichen Output: ${entry.output_length_chars}</div>
  <div>Tokens Input: ${entry.input_token_count}</div>
  <div>Tokens Output: ${entry.output_token_count}</div>
  <div>Geändert: ${entry.changed ? 'Ja' : 'Nein'}</div>
  <div>benchmark_job: ${bench.job_id} / ${bench.status} / ${bench.suite_ref}</div>
  <div>Protokoll:</div>
  <code class="code-block">${audit ? audit.protocol_hash : '-'}</code>
  <div>benchmark_suite_hash:</div>
  <code class="code-block">${audit ? audit.benchmark_suite_hash : '-'}</code>
</li>`;
    })
    .join('');

  return `
<section class="mode-lab bg-background text-foreground" data-view="lab-console">
  <h2>Lab</h2>
  <div class="bg-card border-border">artifact_id: ${model.artifact_id || '-'}</div>
  <div class="bg-card border-border">source_run_id: ${model.source_run_id || '-'}</div>
  <div class="bg-card border-border">created_at: ${model.created_at || '-'}</div>
  <div class="bg-card border-border">Zeichen Input: ${model.artifact ? model.artifact.input_length_chars : '-'}</div>
  <div class="bg-card border-border">Zeichen Output: ${model.artifact ? model.artifact.output_length_chars : '-'}</div>
  <div class="bg-card border-border">Tokens Input: ${model.artifact ? model.artifact.input_token_count : '-'}</div>
  <div class="bg-card border-border">Tokens Output: ${model.artifact ? model.artifact.output_token_count : '-'}</div>
  <div class="bg-card border-border">Geändert: ${model.artifact ? (model.artifact.changed ? 'Ja' : 'Nein') : '-'}</div>
  <div class="bg-card border-border">benchmark_job: ${benchmark.job_id} / ${benchmark.status} / ${benchmark.suite_ref}</div>

  <h3>Artefakte</h3>
  <ul>${artifactItems}</ul>

  <h3>Vergleich</h3>
  <div class="bg-status-neutral">Ausgewählt: ${(model.selected_artifact_ids || []).join(', ') || '-'}</div>
  <ul>${comparisonColumns}</ul>
</section>`;
}

module.exports = {
  getLabConsoleModel,
  renderLabConsolePage,
};
