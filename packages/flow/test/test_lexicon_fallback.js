'use strict';

const assert = require('node:assert/strict');
const { runCorrection } = require('../src/pipeline');

const fallbackCases = [
  ['Bak', 'bank'],
  ['Nes', 'nest'],
  ['Bain', 'bein'],
];

for (const [input, expectedLower] of fallbackCases) {
  const result = runCorrection(input);
  assert.equal(
    String(result.corrected).toLowerCase(),
    expectedLower,
    `Fallback sollte "${input}" -> "${expectedLower}" korrigieren`
  );
  assert.ok(['corpus_pair', 'lexicon'].includes(result.applied_learning));
  assert.ok(Array.isArray(result.applied_stages) && result.applied_stages.includes('LEXICON'));
}

const validWord = runCorrection('Bus');
assert.equal(validWord.corrected, 'Bus', 'Korrektes Wort darf nicht umkorrigiert werden');
assert.equal(validWord.applied_learning, null, 'Korrektes Wort darf keinen Fallback markieren');

console.log('Lexicon fallback tests passed.');
