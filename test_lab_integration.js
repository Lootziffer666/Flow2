const assert = require('node:assert/strict');
const { createAppShell } = require('./AppShell');
const { getPresetInputs } = require('./SuiteRunsPage');

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

// A) run creation stores metadata correctly
const runA = runs.find((run) => run.run_id === submitA.run.run_id);
assert.ok(runA);
assert.equal(runA.input_length_chars, String(runA.input_text).length);
assert.equal(runA.output_length_chars, String(runA.corrected_text).length);
assert.equal(typeof runA.input_token_count, 'number');
assert.equal(typeof runA.output_token_count, 'number');

// B) changed === true when corrected_text differs from input_text
assert.equal(runA.changed, true);
assert.notEqual(runA.input_text, runA.corrected_text);

const suiteHtmlWithRuns = app.render();
assert.equal(suiteHtmlWithRuns.includes('Zeichen Input:'), true);
assert.equal(suiteHtmlWithRuns.includes('Zeichen Output:'), true);
assert.equal(suiteHtmlWithRuns.includes('Tokens Input:'), true);
assert.equal(suiteHtmlWithRuns.includes('Tokens Output:'), true);
assert.equal(suiteHtmlWithRuns.includes('Geändert:'), true);

app.verifyRun(runs[0].run_id);
app.verifyRun(runs[1].run_id);
assert.equal(app.getSuiteRuns().every((run) => run.status === 'verified'), true);

app.promoteRun(runs[0].run_id, 'qa-user');
app.promoteRun(runs[1].run_id, 'qa-user');
const labModelAfterPromotions = app.getLabConsoleModel();
assert.equal(labModelAfterPromotions.promoted_artifacts.length, 2);

// C) promoted artifacts carry metadata
const artifactA = labModelAfterPromotions.promoted_artifacts[0];
assert.ok(artifactA.artifact_id);
assert.equal(typeof artifactA.input_length_chars, 'number');
assert.equal(typeof artifactA.output_length_chars, 'number');
assert.equal(typeof artifactA.input_token_count, 'number');
assert.equal(typeof artifactA.output_token_count, 'number');
assert.equal(typeof artifactA.changed, 'boolean');

const firstArtifactId = labModelAfterPromotions.promoted_artifacts[0].artifact_id;
const secondArtifactId = labModelAfterPromotions.promoted_artifacts[1].artifact_id;

const selected = app.setComparisonSelection([firstArtifactId, secondArtifactId]);
assert.equal(selected.length, 2);
const labModelWithSelection = app.getLabConsoleModel();
assert.equal(labModelWithSelection.comparison_rows.length, 2);
assert.equal(typeof labModelWithSelection.comparison_rows[0].input_length_chars, 'number');
assert.equal(typeof labModelWithSelection.comparison_rows[0].output_length_chars, 'number');
assert.equal(typeof labModelWithSelection.comparison_rows[0].input_token_count, 'number');
assert.equal(typeof labModelWithSelection.comparison_rows[0].output_token_count, 'number');
assert.equal(typeof labModelWithSelection.comparison_rows[0].changed, 'boolean');

// D) comparison output contains metadata for selected artifacts
const labHtml = app.render();
assert.equal(app.modeClass, 'mode-lab');
assert.equal(labHtml.includes(firstArtifactId), true);
assert.equal(labHtml.includes(secondArtifactId), true);
assert.equal(labHtml.includes('Zeichen Input:'), true);
assert.equal(labHtml.includes('Tokens Output:'), true);
assert.equal(labHtml.includes('Geändert:'), true);

// E) submit button label now renders "Verarbeiten"
assert.equal(initialSuiteHtml.includes('>Verarbeiten<'), true);

console.log('LAB integration test passed.');
