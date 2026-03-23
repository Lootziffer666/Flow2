// Debug-only. Kein CI-Test. Fuer Regelentwicklung.
// Aufruf: node debug_rule_checks.js

const { runNormalization } = require('../src/ruleEngine.js');

const checks = [
  { input: 'ich hab das', contains: 'habe das', label: 'PG: hab -> habe' },
  { input: 'gelsen', contains: 'gelesen', label: 'PG: gelsen -> gelesen' },
  { input: 'er dachte das hier', contains: 'dachte, dass hier', label: 'SN: dachte das -> dachte, dass' },
  { input: 'wier kommen', contains: 'wir kommen', label: 'SL: wier -> wir' },
  { input: 'villeicht', contains: 'vielleicht', label: 'SL: villeicht -> vielleicht' },
  { input: 'bin ferig', contains: 'fertig', label: 'PG: ferig -> fertig' },
  { input: 'irgentwie', contains: 'irgendwie', label: 'MO: irgentwie -> irgendwie' },
  { input: 'keiner hats mir', contains: 'hat es mir', label: 'SN: hats -> hat es' },
  { input: 'sich nich so', contains: 'nicht so', label: 'PG: nich -> nicht' },
  { input: 'weiter gegangen', contains: 'weitergegangen', label: 'SN: weiter gegangen -> weitergegangen' },
  { input: 'ich garnich wusste', contains: 'gar nicht wusste', label: 'SN: garnich -> gar nicht' },
  { input: 'richtig erklert', contains: 'erklärt', label: 'MO: erklert -> erklärt' },
];

console.log('--- EINZELNE REGELPR\u00dcFUNGEN ---\n');

let passed = 0;
for (const check of checks) {
  const result = runNormalization(check.input).toLowerCase();
  const ok = result.includes(check.contains.toLowerCase());
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${check.label}`);
  if (!ok) {
    console.log(`       Eingabe:    "${check.input}"`);
    console.log(`       Erwartet:   "${check.contains}"`);
    console.log(`       Ergebnis:   "${runNormalization(check.input)}"`);
  }
  if (ok) passed++;
}

console.log(`\n${passed}/${checks.length} Einzelpr\u00fcfungen bestanden.`);

// Optionaler Volltext-Debug mit wortweisem Diff
const input = 'ich hab das gestern gelsen und dachte das wier villeicht schon ferig sind aber irgentwie hat es sich nich so angef\u00fchlt. dann bin ich einfach weiter gegangen obwohl ich garnich wusste ob das so sin macht und keiner hats mir richtig erklert.';
const expected = 'Ich habe das gestern gelesen und dachte, dass wir vielleicht schon fertig sind aber irgendwie hat es sich nicht so angef\u00fchlt. Dann bin ich einfach weitergegangen obwohl ich gar nicht wusste ob das so sin macht und keiner hat es mir richtig erkl\u00e4rt.';
const actual = runNormalization(input);

console.log('\n--- VOLLTEXT-DIFF ---\n');
const expectedWords = expected.split(' ');
const actualWords = actual.split(' ');
const maxLen = Math.max(expectedWords.length, actualWords.length);
let mismatches = 0;
for (let i = 0; i < maxLen; i++) {
  const e = expectedWords[i] || '(fehlt)';
  const a = actualWords[i] || '(fehlt)';
  if (e !== a) {
    console.log(`  Pos ${i + 1}: erwartet="${e}"  tatsaechlich="${a}"`);
    mismatches++;
  }
}
if (mismatches === 0) {
  console.log('  Keine Abweichungen.');
} else {
  console.log(`  ${mismatches} abweichende Position(en).`);
}
