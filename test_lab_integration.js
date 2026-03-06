const assert = require('node:assert/strict');
const { createAppShell } = require('./AppShell');

const app = createAppShell();

// 1) Engine integration via Suite submission
const input = 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind';
const submission = app.runSuiteSubmission(input);
const corrected = submission.run.corrected_text;
assert.equal(corrected.includes('Ich habe'), true);
assert.equal(corrected.includes('gelesen'), true);
assert.equal(corrected.includes('dass wir vielleicht'), true);
assert.equal(corrected.includes('fertig'), true);

// 2) Suite run creation
const runs = app.getSuiteRuns();
assert.equal(runs.length, 1);
assert.equal(runs[0].input_text, input);
assert.equal(runs[0].status, 'draft');

// 3) Verified-only promotion
assert.equal(app.getVerifiedCandidates().length, 0);
const blocked = app.promoteRun(runs[0].run_id);
assert.equal(blocked.ok, false);

app.verifyRun(runs[0].run_id);
const verifiedCandidates = app.getVerifiedCandidates();
assert.equal(verifiedCandidates.length, 1);
assert.equal(verifiedCandidates[0].status, 'verified');

const promoted = app.promoteRun(runs[0].run_id, 'qa-user');
assert.equal(promoted.ok, true);

// 4) Lab mode structure
assert.equal(app.modeClassName, 'mode-lab');
const labModel = app.getLabConsoleModel();
assert.ok(labModel.artifact_id);
assert.equal(labModel.source_run_id, runs[0].run_id);
assert.equal(Array.isArray(labModel.audit_log), true);
assert.equal(labModel.audit_log.length > 0, true);
assert.ok(labModel.audit_log[0].protocol_hash.startsWith('placeholder-'));
assert.ok(labModel.audit_log[0].benchmark_suite_hash.startsWith('placeholder-'));

console.log('LAB integration test passed.');
