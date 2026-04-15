'use strict';

/**
 * LOOM — Basis-Testsuite
 *
 * Prüft: clauseDetector, chunker, structuralState, signalLayer
 */

const {
  detectClauses,
  splitSentences,
  chunkSentence,
  chunkText,
  STATES,
  diagnoseText,
  diagnoseFullText,
  deriveSignals,
  flowSignals,
  spinSignals,
  smashSignals,
} = require('../src/index.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function assertEq(a, b, label) {
  assert(a === b, `${label} (got: ${JSON.stringify(a)}, expected: ${JSON.stringify(b)})`);
}

// ── clauseDetector ────────────────────────────────────────────────────────────

console.log('\nclauseDetector');

{
  const result = detectClauses('Er ist müde. Sie arbeitet. Das ist gut.', 'de');
  assertEq(result.stats.totalSentences, 3, 'detectClauses: 3 sentences');
}

{
  const result = detectClauses('Er kommt, weil er müde ist.', 'de');
  assert(result.stats.complexSentences >= 1, 'detectClauses: complex sentence with "weil"');
}

{
  const sents = splitSentences('Hello world. How are you?');
  assertEq(sents.length, 2, 'splitSentences: 2 English sentences');
}

// ── chunker ───────────────────────────────────────────────────────────────────

console.log('\nchunker');

{
  const { tokens, chunks } = chunkSentence('Er liest das Buch.', 'de');
  assert(tokens.length >= 4, 'chunkSentence DE: tokens present');
  assert(chunks.length >= 1, 'chunkSentence DE: chunks produced');
  const hasPred = chunks.some(c => c.type === 'core.predicate');
  assert(hasPred, 'chunkSentence DE: predicate chunk found');
}

{
  const { chunks } = chunkSentence('She reads the book.', 'en');
  assert(chunks.some(c => c.type === 'core.predicate'), 'chunkSentence EN: predicate found');
}

{
  const result = chunkText('Er liest. Sie schreibt.', 'de');
  assertEq(result.length, 2, 'chunkText DE: 2 sentence results');
}

{
  // Subject detection
  const { chunks } = chunkSentence('Ich schreibe einen Brief.', 'de');
  const subject = chunks.find(c => c.type === 'core.subject');
  assert(subject !== undefined, 'chunkSentence: subject chunk present');
  assert(subject.text.toLowerCase().includes('ich'), 'chunkSentence: subject contains "ich"');
}

{
  // Copula → state type
  const { chunks } = chunkSentence('Er ist müde.', 'de');
  assert(chunks.some(c => c.type === 'state'), 'chunkSentence: copula → state chunk');
}

{
  // Subordinate clause → relation chunk
  const { chunks } = chunkSentence('Ich glaube, dass er kommt.', 'de');
  assert(chunks.some(c => c.type === 'relation'), 'chunkSentence: subordinate → relation chunk');
}

// ── structuralState ───────────────────────────────────────────────────────────

console.log('\nstructuralState');

{
  const result = diagnoseText('Der Mann kauft das Brot.', 'de');
  assertEq(result.state, STATES.STABIL, 'diagnoseText: simple sentence → stabil');
  assert(result.tokens.length > 0, 'diagnoseText: tokens present');
  assert(result.chunks.length > 0, 'diagnoseText: chunks present');
}

{
  const result = diagnoseText('He reads a book.', 'en');
  assertEq(result.state, STATES.STABIL, 'diagnoseText EN: → stabil');
}

{
  // Fragmented: no verb
  const result = diagnoseText('Keine Ahnung.', 'de');
  assert(
    result.state === STATES.FRAGMENTIERT || result.state === STATES.STABIL,
    'diagnoseText: verbless → fragmentiert or stabil (heuristic)'
  );
}

{
  const results = diagnoseFullText('Er kommt. Sie geht. Das ist schön.', 'de');
  assertEq(results.length, 3, 'diagnoseFullText: 3 results for 3 sentences');
  assert(results.every(r => r.state && r.sentence), 'diagnoseFullText: each result has state + sentence');
}

// ── signalLayer ───────────────────────────────────────────────────────────────

console.log('\nsignalLayer');

{
  const diag = diagnoseText('Er kauft das Buch.', 'de');
  const signals = deriveSignals(diag, 'de');

  assert('flow' in signals, 'deriveSignals: flow signals present');
  assert('spin' in signals, 'deriveSignals: spin signals present');
  assert('smash' in signals, 'deriveSignals: smash signals present');
}

{
  const diag = diagnoseText('Er liest.', 'de');
  const flow = flowSignals(diag, 'de');
  assert('sentenceComplexity' in flow, 'flowSignals: sentenceComplexity present');
  assert('confidenceHint' in flow, 'flowSignals: confidenceHint present');
  assertEq(flow.confidenceHint, 'high', 'flowSignals: simple sentence → high confidence');
}

{
  const diagArray = diagnoseFullText('Er kommt. Sie geht. Das ist schön.', 'de');
  const spin = spinSignals(diagArray, 'de');
  assert(Array.isArray(spin.sentenceStates), 'spinSignals: sentenceStates is array');
  assertEq(spin.sentenceStates.length, 3, 'spinSignals: 3 sentence states');
  assert(typeof spin.readabilityBurden === 'number', 'spinSignals: readabilityBurden is number');
  assert(typeof spin.rhythmScore === 'number', 'spinSignals: rhythmScore is number');
}

{
  const diagArray = diagnoseFullText('Laufen.', 'de');
  const smash = smashSignals(diagArray);
  assert('blockadeSignal' in smash, 'smashSignals: blockadeSignal present');
  assert(['low', 'medium', 'high'].includes(smash.blockadeSignal), 'smashSignals: valid level');
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests — ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
