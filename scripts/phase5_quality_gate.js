'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { runCorrection } = require('../packages/flow/src/pipeline');
const { createRunStore } = require('../packages/flow/lab/labState');

function runCmd(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function functionalGate() {
  runCmd('npm', ['run', 'test:shared']);
  runCmd('npm', ['run', 'test:flow']);
  runCmd('npm', ['test', '-w', 'packages/smash']);
}

function determinismGate() {
  const input = 'ich hab das gestern gelsen und dachte das wier zu spät sind';
  const a = runCorrection(input);
  const b = runCorrection(input);

  assert.equal(a.corrected, b.corrected, 'Determinism gate: corrected text drift');
  assert.deepEqual(a.rule_hits, b.rule_hits, 'Determinism gate: rule hits drift');
  assert.equal(a.scope, b.scope, 'Determinism gate: scope drift');
  assert.deepEqual(a.applied_stages, b.applied_stages, 'Determinism gate: stage drift');
}

function regressionGate() {
  const noChangeCases = [
    'Ich schreibe heute ruhig weiter.',
    'Der Ablauf bleibt nachvollziehbar und stabil.',
  ];

  for (const sample of noChangeCases) {
    const out = runCorrection(sample);
    assert.equal(out.corrected, sample, `Regression gate: no-change sample mutated (${sample})`);
  }

  const mustChange = runCorrection('ich hab das gestern gelsen');
  assert.equal(mustChange.corrected, 'Ich habe das gestern gelesen', 'Regression gate: expected correction missing');
}

function snapshotAndAuditGate() {
  const store = createRunStore();

  const run1 = store.createRun('ich hab das gestern gelsen');
  const run2 = store.createRun('ich hab das gestern ferig gemacht');

  store.verifyRun(run1.run_id);
  store.verifyRun(run2.run_id);

  const artifact1 = store.promoteVerifiedRun(run1.run_id, 'phase5-gate');
  const snapshot1 = structuredClone(artifact1.snapshot);

  store.promoteVerifiedRun(run2.run_id, 'phase5-gate');

  assert.deepEqual(artifact1.snapshot, snapshot1, 'Snapshot gate: promoted snapshot mutated');

  const integrity = store.getAuditChainIntegrity();
  assert.equal(integrity.audit_chain_ok, true, 'Audit gate: append-only chain broken');
}

function main() {
  functionalGate();
  determinismGate();
  regressionGate();
  snapshotAndAuditGate();
  console.log('Phase 5 quality gate passed.');
}

main();
