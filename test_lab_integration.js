const assert = require('node:assert/strict');
const { createAppShell } = require('./AppShell');

const app = createAppShell();

// A) Suite rendering path creates a run after submission
const initialSuiteHtml = app.render();
assert.equal(initialSuiteHtml.includes('data-view="suite-runs"'), true);
assert.equal(initialSuiteHtml.includes('mode-suite'), true);

const input = 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind';
const submission = app.runSuiteSubmission(input);
assert.equal(submission.message, 'Text verarbeitet.');

const corrected = submission.run.corrected_text;
assert.equal(corrected.includes('Ich habe'), true);
assert.equal(corrected.includes('gelesen'), true);
assert.equal(corrected.includes('dass wir vielleicht'), true);
assert.equal(corrected.includes('fertig'), true);

const runs = app.getSuiteRuns();
assert.equal(runs.length, 1);
assert.equal(runs[0].input_text, input);
assert.equal(runs[0].status, 'draft');

// B) Verify action changes run status to verified
app.verifyRun(runs[0].run_id);
assert.equal(app.getSuiteRuns()[0].status, 'verified');

// C) Promote UI only includes verified runs
const suiteHtmlWithVerified = app.render();
assert.equal(suiteHtmlWithVerified.includes('data-view="promote-wizard"'), true);
assert.equal(suiteHtmlWithVerified.includes(runs[0].run_id), true);

// D) Promotion switches mode to mode-lab
const promoted = app.promoteSelectedRun('qa-user');
assert.equal(promoted.ok, true);
assert.equal(app.modeClass, 'mode-lab');

// E) Lab rendering model contains artifact_id and audit log
const labModel = app.getLabConsoleModel();
assert.ok(labModel.artifact_id);
assert.equal(Array.isArray(labModel.audit_log), true);
assert.equal(labModel.audit_log.length > 0, true);

const labHtml = app.render();
assert.equal(labHtml.includes('data-view="lab-console"'), true);
assert.equal(labHtml.includes('artifact_id:'), true);
assert.equal(labHtml.includes('source_run_id:'), true);
assert.equal(labHtml.includes('Protokoll:'), true);
assert.equal(labHtml.includes('code-block'), true);

console.log('LAB integration test passed.');
