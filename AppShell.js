const { createRunStore } = require('./labState');
const { submitSuiteRun, listSuiteRuns, renderSuiteRunsPage } = require('./SuiteRunsPage');
const { getVerifiedCandidates, promoteFromWizard, renderPromoteWizard } = require('./PromoteWizard');
const { getLabConsoleModel, renderLabConsolePage } = require('./LabConsolePage');

function createAppShell() {
  const store = createRunStore();
  const uiState = {
    message: '',
    selectedPromotionRunId: '',
  };

  function runSuiteSubmission(inputText) {
    if (store.state.mode !== 'mode-suite') {
      return {
        ok: false,
        message: 'Suite-Modus erforderlich.',
      };
    }
    const result = submitSuiteRun(store, inputText);
    uiState.message = result.message;
    return result;
  }

  function verifyRun(runId) {
    const run = store.verifyRun(runId);
    if (run) {
      uiState.message = 'Verifiziert.';
      uiState.selectedPromotionRunId = run.run_id;
    }
    return run;
  }

  function promoteRun(runId, actor) {
    const outcome = promoteFromWizard(store, runId, actor);
    uiState.message = outcome.message;
    return outcome;
  }

  function selectPromotionRun(runId) {
    uiState.selectedPromotionRunId = runId;
  }

  function promoteSelectedRun(actor = 'suite-user') {
    if (!uiState.selectedPromotionRunId) {
      return {
        ok: false,
        message: 'Kein verifizierter Run ausgewählt.',
      };
    }
    return promoteRun(uiState.selectedPromotionRunId, actor);
  }

  function render() {
    if (store.state.mode === 'mode-lab') {
      return renderLabConsolePage(getLabConsoleModel(store));
    }

    return renderSuiteRunsPage(store, {
      message: uiState.message,
      promoteWizardHtml: renderPromoteWizard(store, uiState.selectedPromotionRunId),
    });
  }

  return {
    get mode() {
      return store.state.mode;
    },
    get modeClass() {
      return store.state.mode;
    },
    get modeClassName() {
      return store.state.mode;
    },
    runSuiteSubmission,
    verifyRun,
    promoteRun,
    selectPromotionRun,
    promoteSelectedRun,
    render,
    getSuiteRuns: () => listSuiteRuns(store),
    getVerifiedCandidates: () => getVerifiedCandidates(store),
    getLabConsoleModel: () => getLabConsoleModel(store),
  };
}

module.exports = {
  createAppShell,
};
