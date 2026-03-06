const { createRunStore } = require('./labState');
const { submitSuiteRun, listSuiteRuns } = require('./SuiteRunsPage');
const { getVerifiedCandidates, promoteFromWizard } = require('./PromoteWizard');
const { getLabConsoleModel } = require('./LabConsolePage');

function createAppShell() {
  const store = createRunStore();

  function runSuiteSubmission(inputText) {
    if (store.state.mode !== 'mode-suite') {
      return {
        ok: false,
        message: 'Suite-Modus erforderlich.',
      };
    }
    return submitSuiteRun(store, inputText);
  }

  function verifyRun(runId) {
    return store.verifyRun(runId);
  }

  function promoteRun(runId, actor) {
    return promoteFromWizard(store, runId, actor);
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
    getSuiteRuns: () => listSuiteRuns(store),
    getVerifiedCandidates: () => getVerifiedCandidates(store),
    getLabConsoleModel: () => getLabConsoleModel(store),
  };
}

module.exports = {
  createAppShell,
};
