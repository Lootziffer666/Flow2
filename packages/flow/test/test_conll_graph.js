const assert = require('node:assert/strict');
const { parseConllu, buildConllGraphFromText, runCorrection } = require('../src/pipeline');

const sampleConllu = `
# sent_id = 1
# text = Ich gehe heute.
1\tIch\tich\tPRON\tPPER\tCase=Nom|Number=Sing\t2\tnsubj\t_\t_
2\tgehe\tgehen\tVERB\tVVFIN\tMood=Ind|Tense=Pres\t0\troot\t_\t_
3\theute\theute\tADV\tADV\t_\t2\tadvmod\t_\t_
4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_
`;

const sentences = parseConllu(sampleConllu);
assert.equal(sentences.length, 1);
assert.equal(sentences[0].tokens.length, 4);

const graph = buildConllGraphFromText(sampleConllu, { windowSize: 2 });
assert.ok(graph.nodes.length >= 4);
assert.ok(graph.edges.some((edge) => edge.type === 'dependency' && edge.relation === 'nsubj'));
assert.ok(graph.edges.some((edge) => edge.type === 'window_cooccurrence'));
assert.equal(graph.relation_stage, 'post_conllu_parse_pre_grammar');
assert.ok(graph.bond_integrity.raw_edge_count >= graph.bond_integrity.merged_edge_count);
assert.ok(graph.edges.every((edge) => typeof edge.bond_id === 'string' && edge.bond_id.length > 0));

const correction = runCorrection('ich gehe heute.', {
  language: 'de',
  includeConllGraph: true,
  conllu: sampleConllu,
});

assert.ok(correction.conll_graph);
assert.ok(correction.conll_graph.nodes.length >= 4);
assert.equal(correction.conll_graph.relation_stage, 'post_conllu_parse_pre_grammar');
console.log('CoNLL graph test passed.');
