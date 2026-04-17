const assert = require('node:assert/strict');
const { runCorrection } = require('../src/pipeline');

const sampleConllu = `
# sent_id = 1
# text = Ich gehe heute.
1\tIch\tich\tPRON\tPPER\tCase=Nom|Number=Sing\t2\tnsubj\t_\t_
2\tgehe\tgehen\tVERB\tVVFIN\tMood=Ind|Tense=Pres\t0\troot\t_\t_
3\theute\theute\tADV\tADV\t_\t2\tadvmod\t_\t_
4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_
`;

const scenarios = [
  {
    input: 'Er hat vor zugehen.',
    options: { language: 'de' },
  },
  {
    input: 'Und dann ... keine Ahnung.',
    options: { language: 'de' },
  },
  {
    input: 'ich gehe heute.',
    options: { language: 'de', includeConllGraph: true, conllu: sampleConllu },
  },
];

for (const scenario of scenarios) {
  const baseline = runCorrection(scenario.input, scenario.options);
  for (let i = 0; i < 15; i += 1) {
    const run = runCorrection(scenario.input, scenario.options);
    assert.equal(run.corrected, baseline.corrected);
    assert.deepEqual(run.applied_stages, baseline.applied_stages);
    assert.deepEqual(run.rule_hits, baseline.rule_hits);
    assert.deepEqual(Boolean(run.conll_graph), Boolean(baseline.conll_graph));
    if (baseline.conll_graph) {
      assert.equal(run.conll_graph.nodes.length, baseline.conll_graph.nodes.length);
      assert.equal(run.conll_graph.edges.length, baseline.conll_graph.edges.length);
      assert.deepEqual(
        run.conll_graph.edges.map((edge) => edge.bond_id),
        baseline.conll_graph.edges.map((edge) => edge.bond_id),
      );
    }
  }
}

console.log('Multi-pass stability test passed.');
