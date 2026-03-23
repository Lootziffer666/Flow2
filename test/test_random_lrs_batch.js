const assert = require('node:assert/strict');
const { runCorrection } = require('../src/pipeline');
const { createRandomLrsInputs } = require('../src/benchmarkInputs');

const batch = createRandomLrsInputs(200);
assert.equal(batch.length, 200);

let changedCount = 0;
for (const sample of batch) {
  const input = sample.text;
  const { corrected } = runCorrection(input);

  if (corrected !== input) {
    changedCount += 1;
  }
}

assert.equal(changedCount, 200);
console.log('Random LRS batch test passed (200/200 changed).');
