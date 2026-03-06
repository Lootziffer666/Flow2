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
    message: 'Änderungen übernommen.',
  };
}

module.exports = {
  getVerifiedCandidates,
  promoteFromWizard,
};
