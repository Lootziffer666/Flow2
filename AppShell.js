const { createRunStore } = require('./labState');
const { submitSuiteRun, listSuiteRuns } = require('./SuiteRunsPage');
const { getVerifiedCandidates, promoteFromWizard } = require('./PromoteWizard');
const { getLabConsoleModel } = require('./LabConsolePage');

function createAppShell() {
  const store = createRunStore();

  function runSuiteSubmission(inputText) {
    store.setModeSuite();
    return submitSuiteRun(store, inputText);
  }

  function verifyRun(runId) {
    return store.verifyRun(runId);
  }

  function promoteRun(runId, actor) {
    return promoteFromWizard(store, runId, actor);
  }

  function openLabMode() {
    return store.setModeLab();
  }

  return {
    get mode() {
      return store.state.mode;
    },
    get modeClassName() {
      return store.state.mode;
    },
    runSuiteSubmission,
    verifyRun,
    promoteRun,
    openLabMode,
    getSuiteRuns: () => listSuiteRuns(store),
    getVerifiedCandidates: () => getVerifiedCandidates(store),
    getLabConsoleModel: () => getLabConsoleModel(store),
  };
}

module.exports = {
  createAppShell,
};
