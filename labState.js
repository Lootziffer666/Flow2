const crypto = require('node:crypto');
const { runCorrection } = require('./pipeline');

function createRunStore() {
  let runCounter = 0;
  let artifactCounter = 0;

  const state = {
    mode: 'mode-suite',
    runs: [],
    promotedArtifact: null,
    benchmarkJob: null,
    auditLog: [],
  };

  function createRun(inputText) {
    const { corrected } = runCorrection(inputText);
    runCounter += 1;

    const run = {
      run_id: `run-${String(runCounter).padStart(4, '0')}`,
      input_text: String(inputText),
      corrected_text: corrected,
      created_at: new Date().toISOString(),
      status: 'draft',
    };

    state.runs.unshift(run);
    return run;
  }

  function verifyRun(runId) {
    const run = state.runs.find((entry) => entry.run_id === runId);
    if (!run) return null;
    run.status = 'verified';
    return run;
  }

  function getPromotableRuns() {
    return state.runs.filter((run) => run.status === 'verified');
  }

  function promoteVerifiedRun(runId, actor = 'suite-user') {
    const run = state.runs.find((entry) => entry.run_id === runId);
    if (!run || run.status !== 'verified') {
      return null;
    }

    artifactCounter += 1;
    const createdAt = new Date().toISOString();
    const artifact = {
      artifact_id: `artifact-${String(artifactCounter).padStart(4, '0')}`,
      source_run_id: run.run_id,
      created_at: createdAt,
    };

    const protocolHash = `placeholder-${crypto
      .createHash('sha1')
      .update(`protocol:${run.run_id}`)
      .digest('hex')
      .slice(0, 12)}`;

    const benchmarkSuiteHash = `placeholder-${crypto
      .createHash('sha1')
      .update('benchmark-suite:v1')
      .digest('hex')
      .slice(0, 12)}`;

    state.promotedArtifact = artifact;
    state.benchmarkJob = {
      job_id: `bench-${artifact.artifact_id}`,
      status: 'pending',
      suite_ref: 'FLOW-MVP-benchmark-scaffold',
    };

    state.auditLog.unshift({
      actor,
      timestamp: createdAt,
      source_run_id: run.run_id,
      artifact_id: artifact.artifact_id,
      protocol_hash: protocolHash,
      benchmark_suite_hash: benchmarkSuiteHash,
    });

    state.mode = 'mode-lab';
    return artifact;
  }

  function setModeSuite() {
    state.mode = 'mode-suite';
  }


  return {
    state,
    createRun,
    verifyRun,
    getPromotableRuns,
    promoteVerifiedRun,
    setModeSuite,
  };
}

module.exports = {
  createRunStore,
};
