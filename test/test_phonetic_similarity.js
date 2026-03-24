'use strict';

const assert = require('node:assert/strict');
const {
  kölnerPhonetik,
  phoneticallyEqual,
  findPhoneticMatch,
} = require('../src/phoneticSimilarity');

// --- kölnerPhonetik: Basisfälle ---

// Klassische Beispiele aus der Literatur
assert.equal(kölnerPhonetik('Müller'), kölnerPhonetik('Miller'), 'Müller ≡ Miller (Code 657)');
assert.equal(kölnerPhonetik('Meier'), kölnerPhonetik('Meyer'), 'Meier ≡ Meyer (Code 67)');
assert.equal(kölnerPhonetik('Meier'), kölnerPhonetik('Maier'), 'Meier ≡ Maier (Code 67)');

// LRS-relevante Homophone – PG-Stufe (identische Codes)
assert.equal(
  kölnerPhonetik('gelsen'),
  kölnerPhonetik('gelesen'),
  'LRS homophone: gelsen ≡ gelesen (Code 4586 – fehlende Silbe ergibt gleichen Code)'
);
assert.equal(
  kölnerPhonetik('weis'),
  kölnerPhonetik('weiß'),
  'LRS: weis ≡ weiß (ß→SS, gleicher Code 38)'
);

// Elisionsfehler "ferig" vs "fertig": NICHT identisch (t fehlt → anderer Code)
// ferig=374, fertig=3724 – unterschiedliche Codes, aber langer gemeinsamer Präfix
assert.notEqual(
  kölnerPhonetik('ferig'),
  kölnerPhonetik('fertig'),
  'Elision: ferig ≢ fertig (t fehlt → Codes verschieden)'
);
assert.equal(kölnerPhonetik('ferig'), '374', 'ferig → Code 374');
assert.equal(kölnerPhonetik('fertig'), '3724', 'fertig → Code 3724');

// Stimmlose Paare (B↔P, D↔T, G↔K, S↔Z) – PG-Fehlerklasse
assert.equal(kölnerPhonetik('Bach'), kölnerPhonetik('Pack'), 'B↔P: Bach ≡ Pack (Code 14)');
assert.equal(kölnerPhonetik('Tag'), kölnerPhonetik('Tak'), 'D↔T: Tag ≡ Tak (Code 24)');
assert.equal(kölnerPhonetik('sein'), kölnerPhonetik('Zein'), 'S↔Z: sein ≡ Zein (Code 86)');

// Umlaut-Normalisierung
assert.equal(kölnerPhonetik('Ärger'), kölnerPhonetik('Aerger'), 'Ä→AE');
assert.equal(kölnerPhonetik('Öl'), kölnerPhonetik('Oel'), 'Ö→OE');
assert.equal(kölnerPhonetik('Über'), kölnerPhonetik('Ueber'), 'Ü→UE');

// ß → SS
assert.equal(kölnerPhonetik('weiß'), kölnerPhonetik('weiss'), 'ß→SS');

// Leere Eingabe
assert.equal(kölnerPhonetik(''), '', 'Leere Eingabe → leerer Code');
assert.equal(kölnerPhonetik(null), '', 'null → leerer Code');

// Wortanfang mit Vokal bleibt als 0 erhalten
assert.ok(kölnerPhonetik('Affe').startsWith('0'), 'Vokal am Wortanfang → Code beginnt mit 0');

// --- phoneticallyEqual ---

assert.ok(phoneticallyEqual('gelsen', 'gelesen'), 'phoneticallyEqual: gelsen ≡ gelesen');
assert.ok(phoneticallyEqual('Müller', 'Miller'), 'phoneticallyEqual: Müller ≡ Miller');
assert.ok(!phoneticallyEqual('ferig', 'fertig'), 'phoneticallyEqual: ferig ≢ fertig (Elision)');
assert.ok(!phoneticallyEqual('Hund', 'Katze'), 'phoneticallyEqual: Hund ≢ Katze');
assert.ok(!phoneticallyEqual('', 'test'), 'phoneticallyEqual: Leerstring → false');
assert.ok(!phoneticallyEqual('test', ''), 'phoneticallyEqual: Leerstring → false');

// --- findPhoneticMatch ---

// Exakter phonetischer Treffer: gelsen → gelesen
assert.equal(
  findPhoneticMatch('gelsen', ['gelesen', 'gesehen', 'getan']),
  'gelesen',
  'findPhoneticMatch: gelsen → gelesen (exakter Code-Match)'
);

// Elisionsfehler ferig ≠ fertig: kein exakter Code-Match (374 ≠ 3724)
// → PG-Regeln in rules.pg.js decken diesen Fall direkt ab
assert.equal(
  findPhoneticMatch('ferig', ['fertig', 'feierlich', 'perfekt']),
  null,
  'findPhoneticMatch: ferig → null (Elision, kein exakter Code-Match)'
);

// Kein Kandidat passt
assert.equal(
  findPhoneticMatch('xyz', ['Hund', 'Katze', 'Vogel']),
  null,
  'findPhoneticMatch: kein Match → null'
);

// Leere Kandidatenliste
assert.equal(findPhoneticMatch('gelsen', []), null, 'findPhoneticMatch: leere Liste → null');
assert.equal(findPhoneticMatch('', ['gelesen']), null, 'findPhoneticMatch: leere Eingabe → null');

console.log('Phonetic similarity tests passed.');
