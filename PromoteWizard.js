function getVerifiedCandidates(store) {
  return store.getPromotableRuns();
}

function promoteFromWizard(store, runId, actor = 'suite-user') {
  const promoted = store.promoteVerifiedRun(runId, actor);
  if (!promoted) {
    return {
      ok: false,
      message: 'Nur verifizierte Runs können übernommen werden.',
    };
  }

  return {
    ok: true,
    artifact: promoted,
    message: 'Übernommen.',
  };
}

function renderPromoteWizard(store, selectedRunId = '') {
  const candidates = getVerifiedCandidates(store);

  if (candidates.length === 0) {
    return `
<section class="bg-card border-border" data-view="promote-wizard">
  <h3>Promote Wizard</h3>
  <div class="bg-status-neutral">Keine verifizierten Runs verfügbar.</div>
  <button class="bg-primary text-primary-foreground" disabled>Übernehmen</button>
</section>`;
  }

  const options = candidates
    .map((run) => {
      const selected = run.run_id === selectedRunId ? ' selected' : '';
      return `<option value="${run.run_id}"${selected}>${run.run_id} (${run.created_at})</option>`;
    })
    .join('');

  return `
<section class="bg-card border-border" data-view="promote-wizard">
  <h3>Promote Wizard</h3>
  <label for="promote-candidate">Verifizierte Runs</label>
  <select id="promote-candidate" name="promote-candidate">${options}</select>
  <button data-action="promote" class="bg-primary text-primary-foreground">Übernehmen</button>
</section>`;
}

module.exports = {
  getVerifiedCandidates,
  promoteFromWizard,
  renderPromoteWizard,
};
