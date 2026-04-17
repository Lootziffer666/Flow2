const assert = require('node:assert/strict');
const { runCorrection } = require('../src/pipeline');

const input = 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind aber irgentwie hat es sich nich so angefühlt. dann bin ich einfach weiter gegangen obwohl ich garnich wusste ob das so sin macht und keiner hats mir richtig erklert.';

const expected = 'Ich habe das gestern gelesen und dachte, dass wir vielleicht schon fertig sind aber irgendwie hat es sich nicht so angefühlt. Dann bin ich einfach weitergegangen, obwohl ich gar nicht wusste, ob das so sin macht und keiner hat es mir richtig erklärt.';

const { corrected } = runCorrection(input);

assert.equal(corrected, expected);

const splitInfinitive = runCorrection('Er hat vor zugehen.');
assert.equal(splitInfinitive.corrected, 'Er hat vor zu gehen.');

const keepLiteralEllipsis = runCorrection('Und dann ... keine Ahnung.');
assert.equal(keepLiteralEllipsis.corrected, 'Und dann ... keine Ahnung.');

const keepInformalLowercase = runCorrection('mach ich später, ok?');
assert.equal(keepInformalLowercase.corrected, 'mach ich später, ok?');

console.log('Normalization MVP test passed.');
