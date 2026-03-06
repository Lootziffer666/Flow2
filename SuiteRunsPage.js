const { createRandomLrsInputs } = require('./benchmarkInputs');

const CORE_PRESET_INPUTS = [
  {
    key: 'reference-de',
    label: 'Referenzsatz DE',
    text: 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind aber irgentwie hat es sich nich so angefühlt. dann bin ich einfach weiter gegangen obwohl ich garnich wusste ob das so sin macht und keiner hats mir richtig erklert.',
  },
  {
    key: 'test-de-short',
    label: 'Testsatz DE Kurz',
    text: 'obwol ich mir zimlich sicher wahr das ich den schlüssel auf den tisch gelegt habe konnte ich in heute morgen nirgens finden.',
  },
  {
    key: 'test-en-short',
    label: 'Testsatz EN Kurz',
    text: 'even thow i studdied reely hard for the math test yesturday i still got sum qwestions rong becuz i gits cunfused.',
  },
];

const PRESET_INPUTS = [...CORE_PRESET_INPUTS, ...createRandomLrsInputs(200)];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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

function getPresetInputs() {
  return PRESET_INPUTS;
}

function renderSuiteRunsPage(store, options = {}) {
  const runs = listSuiteRuns(store);
  const message = options.message || '';
  const wizard = options.promoteWizardHtml || '';
  const inputText = options.inputText || '';
  const selectedPresetKey = options.selectedPresetKey || '';

  const presetOptions = PRESET_INPUTS.map((preset) => {
    const selected = preset.key === selectedPresetKey ? ' selected' : '';
    return `<option value="${preset.key}"${selected}>${preset.label}</option>`;
  }).join('');

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
  <pre class="bg-card border-border">${escapeHtml(run.corrected_text)}</pre>
  <div>Zeichen Input: ${run.input_length_chars}</div>
  <div>Zeichen Output: ${run.output_length_chars}</div>
  <div>Tokens Input: ${run.input_token_count}</div>
  <div>Tokens Output: ${run.output_token_count}</div>
  <div>Geändert: ${run.changed ? 'Ja' : 'Nein'}</div>
  <div>Regelklassen</div>
  <div>SN: ${run.rule_hits_SN}</div>
  <div>SL: ${run.rule_hits_SL}</div>
  <div>MO: ${run.rule_hits_MO}</div>
  <div>PG: ${run.rule_hits_PG}</div>
  <div>Gesamt: ${run.rule_hits_total}</div>
  ${verifyControl}
</li>`;
    })
    .join('');

  return `
<section class="mode-suite bg-background text-foreground" data-view="suite-runs">
  <h2>Suite</h2>
  <label for="preset-input">Vorlage wählen</label>
  <select id="preset-input" name="preset-input">${presetOptions}</select>
  <label for="suite-input">Eingabe</label>
  <textarea id="suite-input" name="suite-input">${escapeHtml(inputText)}</textarea>
  <button data-action="submit-run" class="bg-primary text-primary-foreground">Verarbeiten</button>
  <div class="bg-status-neutral" data-role="message">${message}</div>
  <ul>${runItems}</ul>
  ${wizard}
</section>`;
}

module.exports = {
  submitSuiteRun,
  listSuiteRuns,
  getPresetInputs,
  renderSuiteRunsPage,
};
