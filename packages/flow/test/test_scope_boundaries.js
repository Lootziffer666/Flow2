const assert = require('node:assert/strict');
const { runCorrection } = require('../src/pipeline');

// Korrekte Sätze dürfen nicht stilistisch umgeschrieben werden.
const unchangedCases = [
  'Ich schreibe heute ruhig und konzentriert weiter.',
  'Der Text bleibt mein Text, auch wenn ich überarbeite.',
  'Wir prüfen zuerst die Struktur und entscheiden dann bewusst.',
  'Dieses System unterstützt, aber es ersetzt keine Autorschaft.',
];

for (const input of unchangedCases) {
  const result = runCorrection(input);
  assert.equal(result.corrected, input, `Unveränderter Satz wurde umgeschrieben: ${input}`);
  assert.equal(result.scope, 'normalization');
  assert.ok(Array.isArray(result.applied_stages));
}

// Echte Normalisierung bleibt aktiv.
const typoInput = 'ich hab das gestern gelsen';
const typoResult = runCorrection(typoInput);
assert.equal(typoResult.corrected, 'Ich habe das gestern gelesen');
assert.ok(typoResult.rule_hits.PG > 0 || typoResult.rule_hits.SN > 0 || typoResult.rule_hits.SL > 0 || typoResult.rule_hits.MO > 0);

console.log('Scope boundary tests passed.');
