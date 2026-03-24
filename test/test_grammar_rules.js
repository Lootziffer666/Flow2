'use strict';

const assert = require('node:assert/strict');
const { runNormalization } = require('../src/ruleEngine');
const { runCorrection } = require('../src/pipeline');

// --- KOMMA_NEBENSATZ: Komma vor unterordnenden Konjunktionen ---

// Grundfall: "dass" ohne vorherigem Komma
assert.ok(
  runNormalization('ich denke dass du recht hast').includes(', dass'),
  'GR komma: Komma vor "dass" eingefügt'
);

// "weil" – kausaler Nebensatz
assert.ok(
  runNormalization('er bleibt zuhause weil er krank ist').includes(', weil'),
  'GR komma: Komma vor "weil" eingefügt'
);

// "obwohl" – konzessiver Nebensatz
assert.ok(
  runNormalization('sie geht einkaufen obwohl es regnet').includes(', obwohl'),
  'GR komma: Komma vor "obwohl" eingefügt'
);

// "ob" – indirekter Fragesatz
assert.ok(
  runNormalization('ich weiß nicht ob er kommt').includes(', ob'),
  'GR komma: Komma vor "ob" eingefügt'
);

// Komma bereits vorhanden → kein Doppel-Komma
const alreadyComma = runNormalization('ich sage, dass es stimmt');
assert.ok(!alreadyComma.includes(',,'), 'GR komma: kein Doppel-Komma wenn Komma bereits vorhanden');

// Überkorrektur bei "und wenn" / "oder wenn" verhindern
const undWenn = runNormalization('er kommt und wenn er da ist bleiben wir');
assert.ok(!undWenn.includes('und, wenn'), 'GR komma-undo: kein "und, wenn"');

const oderOb = runNormalization('ich frage mich ob du kommst oder ob du bleibst');
// "oder ob" should not produce "oder, ob"
assert.ok(!oderOb.includes('oder, ob'), 'GR komma-undo: kein "oder, ob"');

// --- APOSTROPH_GENITIV ---

// Deutsch: kein Apostroph im Genitiv (englischer Einfluss)
assert.equal(
  runNormalization("Karl's Buch liegt auf dem Tisch"),
  'Karls Buch liegt auf dem Tisch',
  'GR apostroph: Karl\'s → Karls'
);

assert.equal(
  runNormalization("Maria's Tasche ist rot"),
  'Marias Tasche ist rot',
  'GR apostroph: Maria\'s → Marias'
);

// Namen die auf s/z/x enden bleiben unberührt (Klaus', Marx')
const klausResult = runNormalization("Klaus' Auto steht draußen");
assert.ok(!klausResult.includes("Klauss"), 'GR apostroph: Klaus\' nicht zu "Klauss" verfälscht');

// --- WORD_REPEAT: Doppeltes Funktionswort ---

assert.equal(
  runNormalization('die die Katze sitzt'),
  'Die Katze sitzt',
  'GR repeat: "die die" → "die" (+ Satzanfang-Großschreibung)'
);

assert.equal(
  runNormalization('mit mit dem Hund gehen'),
  'Mit dem Hund gehen',
  'GR repeat: "mit mit" → "mit" (+ Satzanfang-Großschreibung)'
);

// --- GETRENNTSCHREIBUNG: Konnektoren ---

assert.equal(
  runNormalization('er hat gewonnen so dass wir feiern'),
  runNormalization('er hat gewonnen sodass wir feiern'),
  'GR getrennt: "so dass" → "sodass"'
);
assert.ok(
  runNormalization('er hat gewonnen so dass wir feiern').includes('sodass'),
  'GR getrennt: so dass → sodass (Inhalt)'
);

assert.ok(
  runNormalization('an statt zu warten ging er').toLowerCase().includes('anstatt'),
  'GR getrennt: an statt → anstatt'
);

assert.ok(
  runNormalization('auf Grund des Wetters blieben wir').toLowerCase().includes('aufgrund'),
  'GR getrennt: auf Grund → aufgrund'
);

assert.ok(
  runNormalization('er hat es mit Hilfe seiner Freunde geschafft').includes('mithilfe'),
  'GR getrennt: mit Hilfe → mithilfe'
);

// --- ALS_WIE: redundantes "als wie" ---

assert.ok(
  runNormalization('er ist größer als wie sein Bruder').includes('größer als sein'),
  'GR als-wie: "als wie" → "als"'
);

// --- rule_hits enthält GR-Zähler ---

const result = runCorrection('er bleibt zuhause weil er krank ist');
assert.ok(typeof result.rule_hits.GR === 'number', 'rule_hits.GR vorhanden');
assert.ok(result.rule_hits.GR >= 1, 'rule_hits.GR >= 1 nach Komma-Einfügung');

console.log('Grammar rules tests passed.');
