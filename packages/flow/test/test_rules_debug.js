const { runNormalization } = require('../src/ruleEngine');

const checks = [
  // PG rules
  { input: 'ich hab das', expectContains: 'habe das', label: 'PG hab -> habe' },
  { input: 'gelsen', expectContains: 'gelesen', label: 'PG gelsen -> gelesen' },
  { input: 'weis er noch', expectContains: 'weiß er noch', label: 'PG weis -> weiß' },
  { input: 'in der shule lernen', expectContains: 'in der Schule lernen', label: 'PG shule -> Schule' },

  // SN rules
  { input: 'er dachte das noch', expectContains: 'dachte, dass noch', label: 'SN dachte das -> dachte, dass' },
  { input: 'sie hat gesagt das wir', expectContains: 'gesagt, dass wir', label: 'SN gesagt das -> gesagt, dass' },
  { input: 'weiter gegangen', expectContains: 'weitergegangen', label: 'SN weiter gegangen -> weitergegangen' },
  { input: 'hab ich ausversehen', expectContains: 'aus Versehen', label: 'SN ausversehen -> aus Versehen' },
  { input: 'garnicht mehr', expectContains: 'gar nicht mehr', label: 'SN garnicht -> gar nicht' },

  // SL rules
  { input: 'wier kommen', expectContains: 'wir kommen', label: 'SL wier -> wir' },
  { input: 'er wolte gehen', expectContains: 'wollte gehen', label: 'SL wolte -> wollte' },
  { input: 'dan kam er', expectContains: 'dann kam er', label: 'SL dan -> dann' },
  { input: 'wen es regnet', expectContains: 'wenn es regnet', label: 'SL wen -> wenn' },
  { input: 'der balon gebrant', expectContains: 'gebrannt', label: 'SL gebrant -> gebrannt' },
  { input: 'trozdem weiter', expectContains: 'trotzdem weiter', label: 'SL trozdem -> trotzdem' },

  // MO rules
  { input: 'irgentwie falsch', expectContains: 'irgendwie falsch', label: 'MO irgentwie -> irgendwie' },
  { input: 'irgentwann später', expectContains: 'irgendwann später', label: 'MO irgentwann -> irgendwann' },
  { input: 'obwol ich', expectContains: 'obwohl ich', label: 'MO obwol -> obwohl' },
  { input: 'eigendlich nicht', expectContains: 'eigentlich nicht', label: 'MO eigendlich -> eigentlich' },

  // PG new rules (benchmark-driven)
  { input: 'Das ist ein Feler.', expectContains: 'Fehler', label: 'PG feler -> Fehler' },
  { input: 'Wir faren morgen los.', expectContains: 'fahren', label: 'PG faren -> fahren' },
  { input: 'Das ist interresant.', expectContains: 'interessant', label: 'PG interresant -> interessant' },
  { input: 'ist gegangn', expectContains: 'gegangen', label: 'PG gegangn -> gegangen' },
  { input: 'for der Tür', expectContains: 'vor der', label: 'PG for -> vor' },
  { input: 'er hat gesakt', expectContains: 'gesagt', label: 'PG gesakt -> gesagt' },
  { input: 'fergeßen haben', expectContains: 'vergessen', label: 'PG fergeßen -> vergessen' },
  { input: 'anfangen zu kucken', expectContains: 'gucken', label: 'PG kucken -> gucken' },

  // SN new rules (benchmark-driven)
  { input: 'ich glaube das er', expectContains: 'glaube, dass er', label: 'SN glaube das -> glaube, dass' },
  { input: 'nach hause gehen', expectContains: 'nach Hause', label: 'SN nach hause -> nach Hause' },
  { input: 'Ihr seit pünktlich', expectContains: 'Ihr seid', label: 'SN Ihr seit -> Ihr seid' },

  // MO new rules
  { input: 'drausen spielen', expectContains: 'draußen', label: 'MO drausen -> draußen' },
  { input: 'anderst als', expectContains: 'anders als', label: 'MO anderst -> anders' },
  { input: 'wider da sein', expectContains: 'wieder da', label: 'MO wider -> wieder' },
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
