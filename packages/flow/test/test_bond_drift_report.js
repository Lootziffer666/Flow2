const assert = require('node:assert/strict');
const { runCorrection, buildConllGraphFromText, compareBondIntegrity } = require('../src/pipeline');

const baseConllu = `
1\tIch\tich\tPRON\tPPER\tCase=Nom|Number=Sing\t2\tnsubj\t_\t_
2\tgehe\tgehen\tVERB\tVVFIN\tMood=Ind|Tense=Pres\t0\troot\t_\t_
3\theute\theute\tADV\tADV\t_\t2\tadvmod\t_\t_
4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_
`;

const nextConllu = `
1\tIch\tich\tPRON\tPPER\tCase=Nom|Number=Sing\t2\tnsubj\t_\t_
2\tgehe\tgehen\tVERB\tVVFIN\tMood=Ind|Tense=Pres\t0\troot\t_\t_
3\tmorgen\tmorgen\tADV\tADV\t_\t2\tadvmod\t_\t_
4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_
`;

const baseGraph = buildConllGraphFromText(baseConllu);
const nextGraph = buildConllGraphFromText(nextConllu);
const drift = compareBondIntegrity(baseGraph, nextGraph);
assert.equal(drift.has_drift, true);
assert.ok(drift.added.length > 0 || drift.removed.length > 0 || drift.changed_weight.length > 0);

const correction = runCorrection('ich gehe heute.', {
  language: 'de',
  includeConllGraph: true,
  conllu: nextConllu,
  bondBaselineConllu: baseConllu,
});

assert.ok(correction.bond_drift_report);
assert.equal(correction.bond_drift_report.has_drift, true);
console.log('Bond drift report test passed.');
