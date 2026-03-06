const crypto = require('node:crypto');
const { runCorrection } = require('./pipeline');

function countWhitespaceTokens(text) {
  const value = String(text).trim();
  if (!value) return 0;
  return value.split(/\s+/).length;
}

function createRunStore() {
  let runCounter = 0;
  let artifactCounter = 0;

  const state = {
    mode: 'mode-suite',
    runs: [],
    promotedArtifact: null,
    promotedArtifacts: [],
    selectedArtifactIds: [],
    benchmarkJobs: {},
    benchmarkJob: null,
    auditLog: [],
  };

  function createRun(inputText) {
    const { corrected } = runCorrection(inputText);
    runCounter += 1;

    const sourceText = String(inputText);
    const correctedText = String(corrected);

    const run = {
      run_id: `run-${String(runCounter).padStart(4, '0')}`,
      input_text: sourceText,
      corrected_text: correctedText,
      created_at: new Date().toISOString(),
      status: 'draft',
      input_length_chars: sourceText.length,
      output_length_chars: correctedText.length,
      input_token_count: countWhitespaceTokens(sourceText),
      output_token_count: countWhitespaceTokens(correctedText),
      changed: sourceText !== correctedText,
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

  function setComparisonSelection(artifactIds) {
    const allowed = new Set(state.promotedArtifacts.map((artifact) => artifact.artifact_id));
    state.selectedArtifactIds = artifactIds.filter((artifactId) => allowed.has(artifactId));
    return state.selectedArtifactIds;
  }

  function toggleComparisonSelection(artifactId) {
    if (!state.promotedArtifacts.some((artifact) => artifact.artifact_id === artifactId)) {
      return state.selectedArtifactIds;
    }

    if (state.selectedArtifactIds.includes(artifactId)) {
      state.selectedArtifactIds = state.selectedArtifactIds.filter((id) => id !== artifactId);
      return state.selectedArtifactIds;
    }

    state.selectedArtifactIds = [...state.selectedArtifactIds, artifactId];
    return state.selectedArtifactIds;
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
      input_length_chars: run.input_length_chars,
      output_length_chars: run.output_length_chars,
      input_token_count: run.input_token_count,
      output_token_count: run.output_token_count,
      changed: run.changed,
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

    const benchmarkJob = {
      job_id: `bench-${artifact.artifact_id}`,
      status: 'pending',
      suite_ref: 'FLOW-MVP-benchmark-scaffold',
    };

    state.promotedArtifact = artifact;
    state.promotedArtifacts.unshift(artifact);
    state.benchmarkJobs[artifact.artifact_id] = benchmarkJob;
    state.benchmarkJob = benchmarkJob;

    state.auditLog.unshift({
      actor,
      timestamp: createdAt,
      source_run_id: run.run_id,
      artifact_id: artifact.artifact_id,
      protocol_hash: protocolHash,
      benchmark_suite_hash: benchmarkSuiteHash,
    });

    if (!state.selectedArtifactIds.includes(artifact.artifact_id)) {
      state.selectedArtifactIds = [...state.selectedArtifactIds, artifact.artifact_id];
    }

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
    setComparisonSelection,
    toggleComparisonSelection,
    promoteVerifiedRun,
    setModeSuite,
  };
}

module.exports = {
  createRunStore,
};
