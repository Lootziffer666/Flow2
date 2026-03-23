const { runNormalization } = require('../src/ruleEngine');

const checks = [
  { input: 'ich hab das', expectContains: 'habe das', label: 'PG hab -> habe' },
  { input: 'gelsen', expectContains: 'gelesen', label: 'PG gelsen -> gelesen' },
  { input: 'er dachte das noch', expectContains: 'dachte, dass noch', label: 'SN dachte das -> dachte, dass' },
  { input: 'wier kommen', expectContains: 'wir kommen', label: 'SL wier -> wir' },
  { input: 'irgentwie', expectContains: 'irgendwie', label: 'MO irgentwie -> irgendwie' },
  { input: 'weiter gegangen', expectContains: 'weitergegangen', label: 'SN weiter gegangen -> weitergegangen' },
];

console.log('Debug rule checks');
let passed = 0;

for (const { input, expectContains, label } of checks) {
  const output = runNormalization(input);
  const ok = output.toLowerCase().includes(expectContains.toLowerCase());
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`);
  if (!ok) {
    console.log(`  input:  ${input}`);
    console.log(`  output: ${output}`);
    console.log(`  need:   ${expectContains}`);
  } else {
    passed += 1;
  }
}

console.log(`\n${passed}/${checks.length} checks passed.`);
