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

module.exports = {
  getLabConsoleModel,
};
