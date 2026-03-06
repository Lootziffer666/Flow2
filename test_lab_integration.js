const assert = require('node:assert/strict');
const { createAppShell } = require('./AppShell');
const { getPresetInputs } = require('./SuiteRunsPage');
const { renderLabConsolePage } = require('./LabConsolePage');

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

// F) audit entry contains snapshot_present === true
assert.equal(labModelAfterPromotions.audit_log[0].snapshot_present, true);

// G) rendered HTML contains snapshot content in UI
const labHtml = app.render();
assert.equal(app.modeClass, 'mode-lab');
assert.equal(labHtml.includes(sourceRunA.input_text), true);
assert.equal(labHtml.includes(sourceRunA.corrected_text), true);
assert.equal(labHtml.includes('Snapshot'), true);

// XSS escaping test
const xssApp = createAppShell();
const xssInput = '<script>alert("xss")</script> ich hab das gestern gelsen';
const xssSubmit = xssApp.runSuiteSubmission(xssInput);
assert.equal(xssSubmit.message, 'Text verarbeitet.');
const xssRun = xssApp.getSuiteRuns()[0];
xssApp.verifyRun(xssRun.run_id);
xssApp.promoteRun(xssRun.run_id, 'qa-user');
const xssHtml = xssApp.render();
assert.equal(xssHtml.includes('<script>alert("xss")</script>'), false);
assert.equal(xssHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), true);

// Legacy fallback test (artifact without snapshot)
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

console.log('LAB integration test passed.');
