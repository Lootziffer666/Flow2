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

function renderSuiteRunsPage(store, options = {}) {
  const runs = listSuiteRuns(store);
  const message = options.message || '';
  const wizard = options.promoteWizardHtml || '';

  const runItems = runs
    .map((run) => {
      const verifyControl =
        run.status === 'draft'
          ? `<button data-action="verify" data-run-id="${run.run_id}" class="bg-primary text-primary-foreground">Verifizieren</button>`
          : '<span class="bg-status-neutral">Verifiziert.</span>';

      return `
<li class="bg-card border-border" data-run-id="${run.run_id}">
  <div>run_id: ${run.run_id}</div>
  <div>created_at: ${run.created_at}</div>
  <div>status: ${run.status}</div>
  <pre class="bg-card border-border">${run.corrected_text}</pre>
  ${verifyControl}
</li>`;
    })
    .join('');

  return `
<section class="mode-suite bg-background text-foreground" data-view="suite-runs">
  <h2>Suite</h2>
  <label for="suite-input">Eingabe</label>
  <textarea id="suite-input" name="suite-input"></textarea>
  <button data-action="submit-run" class="bg-primary text-primary-foreground">Run erstellt.</button>
  <div class="bg-status-neutral" data-role="message">${message}</div>
  <ul>${runItems}</ul>
  ${wizard}
</section>`;
}

module.exports = {
  submitSuiteRun,
  listSuiteRuns,
  renderSuiteRunsPage,
};
