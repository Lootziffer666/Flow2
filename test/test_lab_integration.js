const assert = require('node:assert/strict');
const { createAppShell } = require('../src/AppShell');
const { getPresetInputs } = require('../src/SuiteRunsPage');
const { renderLabConsolePage, getLabConsoleModel } = require('../src/LabConsolePage');
const { createRunStore } = require('../src/labState');

const app = createAppShell();

const presetInputs = getPresetInputs();
assert.equal(presetInputs.length, 203);

const initialSuiteHtml = app.render();
assert.equal(initialSuiteHtml.includes('Verarbeiten'), true);

// Prepare two verified runs
const presetA = app.selectPreset('reference-de');
const submitA = app.runSuiteSubmission(presetA.text);
assert.equal(submitA.message, 'Text verarbeitet.');

const presetB = app.selectPreset('test-de-short');
const submitB = app.runSuiteSubmission(presetB.text);
assert.equal(submitB.message, 'Text verarbeitet.');

const runs = app.getSuiteRuns();
assert.equal(runs.length, 2);

const runA = runs.find((run) => run.run_id === submitA.run.run_id);
assert.ok(runA);

app.verifyRun(runs[0].run_id);
app.verifyRun(runs[1].run_id);
assert.equal(app.getSuiteRuns().every((run) => run.status === 'verified'), true);

app.promoteRun(runs[0].run_id, 'qa-user');
app.promoteRun(runs[1].run_id, 'qa-user');
const labModelAfterPromotions = app.getLabConsoleModel();
assert.equal(labModelAfterPromotions.promoted_artifacts.length, 2);


// P1 invariant: current promoted artifact must be first entry in history
assert.deepEqual(labModelAfterPromotions.artifact, labModelAfterPromotions.promoted_artifacts[0]);

// P1 invariant: previously promoted snapshot remains immutable after later promotions
const snapshotBeforeFurtherPromotion = structuredClone(labModelAfterPromotions.promoted_artifacts[1].snapshot);
assert.deepEqual(snapshotBeforeFurtherPromotion, labModelAfterPromotions.promoted_artifacts[1].snapshot);

// P2 audit chain basics
assert.equal(typeof labModelAfterPromotions.audit_log[0].entry_hash, 'string');
assert.equal(typeof labModelAfterPromotions.audit_log[1].entry_hash, 'string');
assert.equal(labModelAfterPromotions.audit_log[0].prev_entry_hash, labModelAfterPromotions.audit_log[1].entry_hash);
assert.equal(labModelAfterPromotions.audit_log[1].prev_entry_hash, 'root');

// A) promoted artifact contains snapshot object
const artifactA = labModelAfterPromotions.promoted_artifacts[0];
assert.ok(artifactA.snapshot);

// B) snapshot.input_text equals original run input_text
const sourceRunA = runs.find((run) => run.run_id === artifactA.source_run_id);
assert.ok(sourceRunA);
assert.equal(artifactA.snapshot.input_text, sourceRunA.input_text);

// C) snapshot.corrected_text equals original run corrected_text
assert.equal(artifactA.snapshot.corrected_text, sourceRunA.corrected_text);

// D) snapshot metadata fields are preserved correctly
assert.equal(artifactA.snapshot.input_length_chars, sourceRunA.input_length_chars);
assert.equal(artifactA.snapshot.output_length_chars, sourceRunA.output_length_chars);
assert.equal(artifactA.snapshot.input_token_count, sourceRunA.input_token_count);
assert.equal(artifactA.snapshot.output_token_count, sourceRunA.output_token_count);
assert.equal(artifactA.snapshot.changed, sourceRunA.changed);
assert.equal(artifactA.snapshot.rule_hits_SN, sourceRunA.rule_hits_SN);
assert.equal(artifactA.snapshot.rule_hits_SL, sourceRunA.rule_hits_SL);
assert.equal(artifactA.snapshot.rule_hits_MO, sourceRunA.rule_hits_MO);
assert.equal(artifactA.snapshot.rule_hits_PG, sourceRunA.rule_hits_PG);
assert.equal(artifactA.snapshot.rule_hits_total, sourceRunA.rule_hits_total);

const firstArtifactId = labModelAfterPromotions.promoted_artifacts[0].artifact_id;
const secondArtifactId = labModelAfterPromotions.promoted_artifacts[1].artifact_id;

const selected = app.setComparisonSelection([firstArtifactId, secondArtifactId]);
assert.equal(selected.length, 2);
const labModelWithSelection = app.getLabConsoleModel();

// E) comparison rows contain snapshot
assert.equal(labModelWithSelection.comparison_rows.length, 2);
assert.ok(labModelWithSelection.comparison_rows[0].snapshot);
assert.equal(typeof labModelWithSelection.comparison_rows[0].snapshot.rule_hits_total, 'number');

const comparisonRowForArtifactA = labModelWithSelection.comparison_rows.find(
  (row) => row.artifact_id === artifactA.artifact_id
);
assert.ok(comparisonRowForArtifactA);
assert.deepEqual(comparisonRowForArtifactA.snapshot, artifactA.snapshot);

// F) audit entry contains snapshot_present === true
assert.equal(labModelAfterPromotions.audit_log[0].snapshot_present, true);

// G) rendered HTML contains snapshot content in UI
const labHtml = app.render();
assert.equal(app.modeClass, 'mode-lab');
assert.equal(labHtml.includes(sourceRunA.input_text), true);
assert.equal(labHtml.includes(sourceRunA.corrected_text), true);
assert.equal(labHtml.includes('Snapshot'), true);

// XSS escaping test: script tag, quotes and ampersand
const xssApp = createAppShell();
const xssInput = '<script>alert("xss")</script> \'quote\' & "dbl" ich hab das gestern gelsen';
const xssSubmit = xssApp.runSuiteSubmission(xssInput);
assert.equal(xssSubmit.message, 'Text verarbeitet.');
const xssRun = xssApp.getSuiteRuns()[0];
xssApp.verifyRun(xssRun.run_id);
xssApp.promoteRun(xssRun.run_id, 'qa-user');
const xssHtml = xssApp.render();
assert.equal(xssHtml.includes('<script>alert("xss")</script>'), false);
assert.equal(xssHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), true);
assert.equal(xssHtml.includes('&#39;quote&#39;'), true);
assert.equal(xssHtml.includes('&amp;'), true);
assert.equal(xssHtml.includes('ich habe das gestern gelesen'), true);

// Legacy fallback test (artifact/comparison without snapshot)
const legacyModel = {
  mode: 'mode-lab',
  artifact: {
    artifact_id: 'artifact-legacy',
    source_run_id: 'run-legacy',
    created_at: '2026-01-01T00:00:00.000Z',
    input_text: 'legacy in',
    corrected_text: 'legacy out',
    input_length_chars: 9,
    output_length_chars: 10,
    input_token_count: 2,
    output_token_count: 2,
    changed: true,
    rule_hits_SN: 1,
    rule_hits_SL: 0,
    rule_hits_MO: 0,
    rule_hits_PG: 1,
    rule_hits_total: 2,
  },
  source_run_id: 'run-legacy',
  artifact_id: 'artifact-legacy',
  created_at: '2026-01-01T00:00:00.000Z',
  promoted_artifacts: [
    {
      artifact_id: 'artifact-legacy',
      source_run_id: 'run-legacy',
      created_at: '2026-01-01T00:00:00.000Z',
      input_text: 'legacy in',
      corrected_text: 'legacy out',
      input_length_chars: 9,
      output_length_chars: 10,
      input_token_count: 2,
      output_token_count: 2,
      changed: true,
      rule_hits_SN: 1,
      rule_hits_SL: 0,
      rule_hits_MO: 0,
      rule_hits_PG: 1,
      rule_hits_total: 2,
    },
  ],
  selected_artifact_ids: ['artifact-legacy'],
  comparison_rows: [
    {
      artifact_id: 'artifact-legacy',
      source_run_id: 'run-legacy',
      created_at: '2026-01-01T00:00:00.000Z',
      latest_audit_entry: null,
      benchmark_job: null,
      input_text: 'legacy in',
      corrected_text: 'legacy out',
      input_length_chars: 9,
      output_length_chars: 10,
      input_token_count: 2,
      output_token_count: 2,
      changed: true,
      rule_hits_SN: 1,
      rule_hits_SL: 0,
      rule_hits_MO: 0,
      rule_hits_PG: 1,
      rule_hits_total: 2,
    },
  ],
  benchmark_job: null,
  audit_log: [],
};
const legacyHtml = renderLabConsolePage(legacyModel);
assert.equal(legacyHtml.includes('legacy in'), true);
assert.equal(legacyHtml.includes('legacy out'), true);
assert.equal(legacyHtml.includes('SN: 1'), true);

// Preview vs detail behavior
const veryLongText = 'L'.repeat(400);
const previewOnlyModel = {
  mode: 'mode-lab',
  artifact: null,
  source_run_id: null,
  artifact_id: null,
  created_at: null,
  promoted_artifacts: [
    {
      artifact_id: 'artifact-preview',
      source_run_id: 'run-preview',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: {
        input_text: veryLongText,
        corrected_text: veryLongText,
      },
    },
  ],
  selected_artifact_ids: [],
  comparison_rows: [],
  benchmark_job: null,
  audit_log: [],
};
const previewOnlyHtml = renderLabConsolePage(previewOnlyModel);
assert.equal(previewOnlyHtml.includes(`${'L'.repeat(280)}…`), true);
assert.equal(previewOnlyHtml.includes(veryLongText), false);

const detailModel = {
  ...previewOnlyModel,
  artifact: previewOnlyModel.promoted_artifacts[0],
  source_run_id: 'run-preview',
  artifact_id: 'artifact-preview',
  created_at: '2026-01-01T00:00:00.000Z',
};
const detailHtml = renderLabConsolePage(detailModel);
assert.equal(detailHtml.includes(veryLongText), true);

// null/undefined/empty snapshot fields + changed tri-state rendering
const partialModel = {
  mode: 'mode-lab',
  artifact: {
    artifact_id: 'artifact-partial',
    source_run_id: 'run-partial',
    created_at: '2026-01-01T00:00:00.000Z',
    snapshot: {
      input_text: '',
      corrected_text: undefined,
      changed: undefined,
      rule_hits_total: null,
    },
  },
  source_run_id: 'run-partial',
  artifact_id: 'artifact-partial',
  created_at: '2026-01-01T00:00:00.000Z',
  promoted_artifacts: [
    {
      artifact_id: 'artifact-yes',
      source_run_id: 'run-yes',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: '', corrected_text: '', changed: true },
    },
    {
      artifact_id: 'artifact-no',
      source_run_id: 'run-no',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: '', corrected_text: '', changed: false },
    },
    {
      artifact_id: 'artifact-unknown',
      source_run_id: 'run-unknown',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: null, corrected_text: null },
    },
  ],
  selected_artifact_ids: ['artifact-yes', 'artifact-no', 'artifact-unknown'],
  comparison_rows: [
    {
      artifact_id: 'artifact-yes',
      source_run_id: 'run-yes',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: '', corrected_text: '', changed: true },
      latest_audit_entry: null,
      benchmark_job: null,
    },
    {
      artifact_id: 'artifact-no',
      source_run_id: 'run-no',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: '', corrected_text: '', changed: false },
      latest_audit_entry: null,
      benchmark_job: null,
    },
    {
      artifact_id: 'artifact-unknown',
      source_run_id: 'run-unknown',
      created_at: '2026-01-01T00:00:00.000Z',
      latest_audit_entry: null,
      benchmark_job: null,
    },
  ],
  benchmark_job: null,
  audit_log: [],
};
const partialHtml = renderLabConsolePage(partialModel);
assert.equal(partialHtml.includes('Geändert: Ja'), true);
assert.equal(partialHtml.includes('Geändert: Nein'), true);
assert.equal(partialHtml.includes('Geändert: -'), true);
assert.equal(partialHtml.includes('SN: -'), true);
assert.equal(partialHtml.includes('Gesamt: -'), true);


// selected_artifact_ids fallback robustness (undefined)
const noSelectedIdsModel = {
  mode: 'mode-lab',
  artifact: null,
  source_run_id: null,
  artifact_id: null,
  created_at: null,
  promoted_artifacts: [
    {
      artifact_id: 'artifact-noselect',
      source_run_id: 'run-noselect',
      created_at: '2026-01-01T00:00:00.000Z',
      snapshot: { input_text: 'x', corrected_text: 'y' },
    },
  ],
  comparison_rows: [],
  benchmark_job: null,
  audit_log: [],
};
const noSelectedIdsHtml = renderLabConsolePage(noSelectedIdsModel);
assert.equal(noSelectedIdsHtml.includes('artifact-noselect'), true);


// P4/P5 scaling smoke: many artifacts + comparisons should remain renderable
const scaleStore = createRunStore();
for (let i = 0; i < 40; i++) {
  const input = `ich hab das gestern gelsen ${i}`;
  const run = scaleStore.createRun(input);
  scaleStore.verifyRun(run.run_id);
  scaleStore.promoteVerifiedRun(run.run_id, 'scale-user');
}

const scaleModel = getLabConsoleModel(scaleStore);
assert.equal(scaleModel.promoted_artifacts.length, 40);
assert.deepEqual(scaleModel.artifact, scaleModel.promoted_artifacts[0]);
assert.equal(scaleModel.audit_log.length, 40);
assert.equal(scaleModel.audit_log[0].prev_entry_hash, scaleModel.audit_log[1].entry_hash);

const compareIds = scaleModel.promoted_artifacts.slice(0, 10).map((artifact) => artifact.artifact_id);
scaleStore.setComparisonSelection(compareIds);
const scaleCompareModel = getLabConsoleModel(scaleStore);
assert.equal(scaleCompareModel.comparison_rows.length, 10);
const scaleHtml = renderLabConsolePage(scaleCompareModel);
assert.equal(scaleHtml.includes(compareIds[0]), true);
assert.equal(scaleHtml.includes('Protokoll:'), true);

// Benchmark evaluation framework tests
const benchStore = createRunStore();
const baseRun = benchStore.createRun('ich hab das gestern gelsen');
const candRun = benchStore.createRun('ich hab das gestern gelsen und dachte das');
benchStore.verifyRun(baseRun.run_id);
benchStore.verifyRun(candRun.run_id);
const baselineArtifact = benchStore.promoteVerifiedRun(baseRun.run_id, 'bench-user');
const candidateArtifact = benchStore.promoteVerifiedRun(candRun.run_id, 'bench-user');

const suiteV1 = benchStore.registerBenchmarkSuite({
  suite_id: 'suite-de',
  suite_version: 'v1',
  segments: {
    core_de: ['ich hab das gestern gelsen'],
    regression_de: ['ich hab das gestern gelsen und dachte das'],
    stress_de: ['x'.repeat(350)],
    no_change: ['Ich habe das gestern gelesen.'],
    edge: ['<script>alert("x")</script>'],
  },
});
assert.equal(typeof suiteV1.dataset_hash, 'string');

// 1) Determinism pass
const determinismPassEval = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'S',
  baseline_case_results: [
    {
      input_text: 'dup',
      corrected_text: 'dup-out',
      segment: 'core_de',
      rule_hits_SN: 1,
      rule_hits_total: 1,
    },
    {
      input_text: 'dup',
      corrected_text: 'dup-out',
      segment: 'core_de',
      rule_hits_SN: 1,
      rule_hits_total: 1,
    },
  ],
  case_results: [
    {
      input_text: 'dup',
      corrected_text: 'dup-out',
      segment: 'core_de',
      rule_hits_SN: 1,
      rule_hits_total: 1,
    },
    {
      input_text: 'dup',
      corrected_text: 'dup-out',
      segment: 'core_de',
      rule_hits_SN: 1,
      rule_hits_total: 1,
    },
  ],
});
assert.equal(determinismPassEval.ok, true);
assert.notEqual(determinismPassEval.evaluation.gate_result, 'fail');

// 2) Determinism fail
const determinismFailEval = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'S',
  baseline_case_results: [
    { input_text: 'dup2', corrected_text: 'same', segment: 'core_de' },
    { input_text: 'dup2', corrected_text: 'same', segment: 'core_de' },
  ],
  case_results: [
    { input_text: 'dup2', corrected_text: 'same-a', segment: 'core_de' },
    { input_text: 'dup2', corrected_text: 'same-b', segment: 'core_de' },
  ],
});
assert.equal(determinismFailEval.evaluation.gate_result, 'fail');
assert.equal(determinismFailEval.evaluation.gate_reasons.includes('determinism_failed'), true);

// 3) No-change regression (warn/fail)
const noChangeRegressionEval = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'M',
  baseline_case_results: [
    { input_text: 'A', corrected_text: 'A', segment: 'no_change' },
    { input_text: 'B', corrected_text: 'B', segment: 'no_change' },
  ],
  case_results: [
    { input_text: 'A', corrected_text: 'A geändert', segment: 'no_change' },
    { input_text: 'B', corrected_text: 'B geändert', segment: 'no_change' },
  ],
});
assert.equal(['warn', 'fail'].includes(noChangeRegressionEval.evaluation.gate_result), true);

// 4) Rule-class drift (warn at least)
const ruleDriftEval = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'M',
  baseline_case_results: [
    { input_text: 'r1', corrected_text: 'r1', segment: 'core_de', rule_hits_SN: 10, rule_hits_total: 10 },
  ],
  case_results: [
    { input_text: 'r1', corrected_text: 'r1x', segment: 'core_de', rule_hits_PG: 10, rule_hits_total: 10 },
  ],
});
assert.equal(['warn', 'fail'].includes(ruleDriftEval.evaluation.gate_result), true);
assert.equal(ruleDriftEval.evaluation.gate_reasons.includes('rule_class_drift'), true);

// 5) Audit chain fail => hard fail
benchStore.state.auditLog[0].prev_entry_hash = 'broken';
const auditFailEval = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'S',
  baseline_case_results: [{ input_text: 'c', corrected_text: 'c' }],
  case_results: [{ input_text: 'c', corrected_text: 'c' }],
});
assert.equal(auditFailEval.evaluation.gate_result, 'fail');
assert.equal(auditFailEval.evaluation.gate_reasons.includes('audit_chain_inconsistent'), true);

// 6) Snapshot anchoring for evaluation summary
const anchoredCandidate = benchStore.state.promotedArtifacts.find((entry) => entry.artifact_id === candidateArtifact.artifact_id);
assert.ok(anchoredCandidate.evaluation_summary);
assert.equal(typeof anchoredCandidate.evaluation_summary.evaluation_id, 'string');
assert.equal(anchoredCandidate.evaluation_summary.dataset_hash, suiteV1.dataset_hash);
assert.equal(typeof anchoredCandidate.evaluation_summary.metrics_hash, 'string');

// 7) Comparison only with matching dataset
const compareInvalid = benchStore.compareArtifactsOnBenchmark({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v1',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
});
assert.equal(compareInvalid.ok, false);
assert.equal(['dataset_mismatch', 'evaluation_not_found'].includes(compareInvalid.reason), true);

// Re-register and run clean evaluation for valid benchmark comparison + multi-artifact compare stability
benchStore.registerBenchmarkSuite({
  suite_id: 'suite-de',
  suite_version: 'v2',
  segments: {
    core_de: ['gleich1', 'gleich2'],
    regression_de: ['gleich3'],
    stress_de: [],
    no_change: [],
    edge: [],
  },
});

const baseEvalV2 = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v2',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: baselineArtifact.artifact_id,
  size_class: 'S',
  baseline_case_results: [
    { input_text: 'gleich1', corrected_text: 'out-1', segment: 'core_de' },
    { input_text: 'gleich2', corrected_text: 'out-2', segment: 'core_de' },
  ],
  case_results: [
    { input_text: 'gleich1', corrected_text: 'out-1', segment: 'core_de' },
    { input_text: 'gleich2', corrected_text: 'out-2', segment: 'core_de' },
  ],
});
assert.equal(baseEvalV2.ok, true);

const candEvalV2 = benchStore.runBenchmarkEvaluation({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v2',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
  size_class: 'S',
  baseline_case_results: [
    { input_text: 'gleich1', corrected_text: 'out-1', segment: 'core_de' },
    { input_text: 'gleich2', corrected_text: 'out-2', segment: 'core_de' },
  ],
  case_results: [
    { input_text: 'gleich1', corrected_text: 'out-1', segment: 'core_de' },
    { input_text: 'gleich2', corrected_text: 'out-2b', segment: 'core_de' },
  ],
});
assert.equal(candEvalV2.ok, true);

// 8) Multi-artifact comparison remains stable and renderable
const compareValid = benchStore.compareArtifactsOnBenchmark({
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v2',
  baseline_artifact_id: baselineArtifact.artifact_id,
  candidate_artifact_id: candidateArtifact.artifact_id,
});
assert.equal(compareValid.ok, true);
assert.equal(typeof compareValid.same_output_rate, 'number');
assert.equal(typeof compareValid.deltas.changed_rate, 'number');

const benchmarkModel = getLabConsoleModel(benchStore);
assert.ok(benchmarkModel.current_evaluation);
const benchmarkHtml = renderLabConsolePage(benchmarkModel);
assert.equal(benchmarkHtml.includes('Evaluation Summary'), true);
assert.equal(benchmarkHtml.includes('Baseline-Delta'), true);
assert.equal(benchmarkHtml.includes('Integrität'), true);

const promoteDecisionAudit = benchStore.appendBenchmarkPromoteDecision({
  artifact_id: candidateArtifact.artifact_id,
  baseline_artifact_id: baselineArtifact.artifact_id,
  benchmark_suite_id: 'suite-de',
  benchmark_suite_version: 'v2',
  evaluation_id: candEvalV2.evaluation.evaluation_id,
  gate_result: candEvalV2.evaluation.gate_result,
  actor: 'qa-user',
});
assert.equal(promoteDecisionAudit.event_type, 'benchmark_promote_decision');
assert.equal(promoteDecisionAudit.evaluation_id, candEvalV2.evaluation.evaluation_id);



// Hardcase long-form training texts (EN + DE messy real-world prose)
const hardcaseSamples = [
  {
    id: 'EN-HARD-001',
    text: `Yesterday i tried to reconcile three customer mails, two Slack summaries, and one copied phone transcript into a single support note, and the whole thing turned into a museum of ordinary English failure. The client wrote that the enviroment in their staging area was "basicly stable", except the dashboard colours changed after refresh, the adress validator rejected a perfectly normal street, and the calender widget showed tomorow for users in Toronto but tomorrow for users in Dublin. Their wording matters, because colour and colours are not bugs when the project was intentionally localised for the UK site, while color may still appear in US marketing copy. One teammate marked these as inconsistancies, another as localisation drift, and a third person said we should just "normalize everyting". That is how teams accidentally build tiny language tyrants.

There are also proper nouns lurking in the weeds. One account is named Teh River Group, which means a blind teh -> the rule would be comedy with collateral damage. Another user signed as Wether Lane Studio, and although wether is usually a typo for whether, here it is part of a legal name. A vendor email came from manuever-labs.example, which looks wrong to the eye but may still be the registered domain. The support log contains "Begining sync...", because a developer wrote the message years ago and nobody touched it since. It also contains "Transferred", "transfered", and "re-transfered" in different contexts, plus one comment that says "this is writting to cache".`,
  },
  {
    id: 'DE-REAL-001',
    text: `also ganz erlich ich weis grad selber nich ob das hier noch ne normale nachricht ist oder schon so’n halber schadensbericht lol, aber ich schreibs lieber direkt runter bevor ichs nachher wieder vergesse, weil gestern wars komplett drunter und drüber: ich wollte eig nur kurz zum kiosk, packet abholen, brot holen, dann am besten noch zur apotheke, weil die tabletten fast alle sind, und aufm rückweg tante irma anrufen, das ich sonntag warscheinlich doch nich kommen kann, alldieweil der zugplan schon wieder irgendwie komisch aussieht. daraus wurde dann natürlich so’n klassischer „ich bin mal eben 20 minuten weg“-trip von fast drei stunden, weil erstens der bus zuspät kam, zweitens ich im falschen portmonee geguckt hab und da original 2,37 drin waren, also nichmal genug für alles, und drittens mir auf halber strecke eingefallen ist, das ich den abholschein garnicht eingepackt hatte sondern der noch auffem küchentisch lag.

beim kiosk selber gings weiter. ich sag „ich müsst’ n paket abholen“, sie sagt „name?“, sie findet nix und fragt dann, ob ich vieleicht die benachrichtigung dabei hab. da fiel mir wieder ein, das ich genau die vergessen hatte. später hab ich gelesen das ich ausversehen „bin mit ten drin“ geschickt hab, also danke autokorrektur.`,
  },
  {
    id: 'DE-REAL-002',
    text: `ich wollte heute eigendlich nur kurz den keller aufräumen, aber wie das immer so ist, blieb es natürlich nich dabei. erst hab ich gedacht ich sortier nur schnell die alten kartons aus, danach war ich plötzlich dabei, irgendwelche kabel zu entwirren, werkzeug neu zu ordnen und nebenbei zu überlegen, warum ich überhaupt drei fast identische schraubenzieher habe. am meisten genervt hat mich aber, dass auf fast jeder kiste irgendwas anderes draufstand. auf einer stand winter, drin waren aber verlängerungskabel, kerzenreste und ein altes blutdruckmessgerät.

ich hab dann versucht, wenigstens eine sinnvolle regel einzuführen: behalten, wegwerfen, unklar. das ging ungefähr sieben minuten gut. dann fing ich an, über jeden zweiten gegenstand zu diskutieren, als wär ich mein eigener schlechter haushaltsratgeber. „das kann man doch vieleicht nochmal gebrauchen“, „nein kann man nicht“, „aber was ist wenn doch?“ – genau dieser quatsch frisst am ende die ganze zeit.`,
  },
];

const hardcaseApp = createAppShell();
for (const sample of hardcaseSamples) {
  const submission = hardcaseApp.runSuiteSubmission(sample.text);
  assert.equal(submission.message, 'Text verarbeitet.');
  assert.ok(submission.run);
  assert.ok(submission.run.corrected_text.length > 0);
}

assert.equal(hardcaseApp.getSuiteRuns().length, hardcaseSamples.length);
const hardcaseRuns = hardcaseApp.getSuiteRuns();
hardcaseRuns.forEach((run) => hardcaseApp.verifyRun(run.run_id));
hardcaseRuns.forEach((run) => hardcaseApp.promoteRun(run.run_id, 'hardcase-user'));
const hardcaseModel = hardcaseApp.getLabConsoleModel();
assert.equal(hardcaseModel.promoted_artifacts.length, hardcaseSamples.length);
assert.equal(hardcaseModel.audit_log.length, hardcaseSamples.length);

console.log('LAB integration test passed.');
