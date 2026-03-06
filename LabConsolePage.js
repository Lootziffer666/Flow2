/*
LAB Console Model Builder

This module prepares the model for the Lab console view.
It does not render UI components. Rendering is handled by the UI layer.
*/
function getLabConsoleModel(store) {
  const artifact = store.state.promotedArtifact;

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
    benchmark_job: store.state.benchmarkJob,
    audit_log: store.state.auditLog,
  };
}

function renderLabConsolePage(model) {
  const benchmark = model.benchmark_job || { job_id: '-', status: '-', suite_ref: '-' };
  const auditRows = (model.audit_log || [])
    .map(
      (entry) => `
<li class="bg-card border-border">
  <div>actor: ${entry.actor}</div>
  <div>timestamp: ${entry.timestamp}</div>
  <div>source_run_id: ${entry.source_run_id}</div>
  <div>artifact_id: ${entry.artifact_id}</div>
  <div>Protokoll:</div>
  <code class="code-block">${entry.protocol_hash}</code>
  <div>benchmark_suite_hash:</div>
  <code class="code-block">${entry.benchmark_suite_hash}</code>
</li>`
    )
    .join('');

  return `
<section class="mode-lab bg-background text-foreground" data-view="lab-console">
  <h2>Lab</h2>
  <div class="bg-card border-border">artifact_id: ${model.artifact_id || '-'}</div>
  <div class="bg-card border-border">source_run_id: ${model.source_run_id || '-'}</div>
  <div class="bg-card border-border">created_at: ${model.created_at || '-'}</div>
  <div class="bg-card border-border">benchmark_job: ${benchmark.job_id} / ${benchmark.status} / ${benchmark.suite_ref}</div>
  <ul>${auditRows}</ul>
</section>`;
}

module.exports = {
  getLabConsoleModel,
  renderLabConsolePage,
};
