const assert = require('node:assert/strict');
const { applyNormalizationToUi } = require('./uiBinding');

const input = 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind';
const expected = 'Ich habe das gestern gelesen und dachte, dass wir vielleicht schon fertig sind';

let uiText = '';
let uiStatus = '';

const returned = applyNormalizationToUi(
  input,
  (value) => {
    uiText = value;
  },
  (status) => {
    uiStatus = status;
  }
);

assert.equal(returned, expected);
assert.equal(uiText, expected);
assert.equal(uiStatus, 'Text aktualisiert.');

console.log('UI integration test passed.');
