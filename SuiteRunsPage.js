function submitSuiteRun(store, inputText) {
  const run = store.createRun(inputText);
  return {
    run,
    message: 'Text verarbeitet.',
    classes: {
      container: 'bg-background text-foreground',
      card: 'bg-card border-border',
      action: 'bg-primary text-primary-foreground',
      status: 'bg-status-neutral',
    },
  };
}

function listSuiteRuns(store) {
  return store.state.runs;
}

module.exports = {
  submitSuiteRun,
  listSuiteRuns,
};
