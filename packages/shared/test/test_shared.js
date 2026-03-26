'use strict';

const assert = require('node:assert/strict');
const shared = require('../src/index');

// ═══════════════════════════════════════════════════════════════════════
// Barrel-Export: alle erwarteten Symbole vorhanden
// ═══════════════════════════════════════════════════════════════════════

const expectedExports = [
  'detectClauses', 'splitSentences',
  'SUBORDINATING_DE', 'COORDINATING_DE', 'SUBORDINATING_EN', 'COORDINATING_EN',
  'filterByConfidence', 'errorProfile', 'DEFAULT_MIN_CONFIDENCE',
  'kölnerPhonetik', 'phoneticallyEqual', 'findPhoneticMatch',
  'contextWindowRules',
  'GR_RULES',
];

for (const name of expectedExports) {
  assert.ok(name in shared, `Export "${name}" vorhanden`);
}

// ═══════════════════════════════════════════════════════════════════════
// clauseDetector
// ═══════════════════════════════════════════════════════════════════════

const clauses = shared.detectClauses('Ich gehe, weil es regnet.', 'de');
assert.equal(clauses.sentences.length, 1, 'Ein Satz erkannt');
assert.equal(clauses.sentences[0].complexity, 'complex', 'Nebensatz mit "weil" → complex');
assert.ok(
  clauses.sentences[0].subordinateClauses.some(c => c.conjunction === 'weil'),
  '"weil" als Konjunktion erkannt'
);

const split = shared.splitSentences('Erster Satz. Zweiter Satz.');
assert.equal(split.length, 2, 'splitSentences: 2 Saetze');

assert.ok(shared.SUBORDINATING_DE.has('dass'), 'SUBORDINATING_DE enthaelt "dass"');
assert.ok(shared.COORDINATING_EN.has('and'), 'COORDINATING_EN enthaelt "and"');

// EN-Modus
const enClauses = shared.detectClauses('I left because it was late.', 'en');
assert.equal(enClauses.sentences[0].complexity, 'complex', 'EN: "because" → complex');

// ═══════════════════════════════════════════════════════════════════════
// confidenceFilter
// ═══════════════════════════════════════════════════════════════════════

assert.equal(typeof shared.DEFAULT_MIN_CONFIDENCE, 'number');
assert.ok(shared.DEFAULT_MIN_CONFIDENCE >= 0 && shared.DEFAULT_MIN_CONFIDENCE <= 1);

const rules = [
  { id: 'high', confidence: 0.99 },
  { id: 'low', confidence: 0.50 },
  { id: 'off', confidence: 0.99, disabledByDefault: true },
];

const filtered = shared.filterByConfidence(rules, 0.90);
assert.equal(filtered.length, 1, 'Nur high (>=0.90, nicht disabled)');
assert.equal(filtered[0].id, 'high');

assert.deepEqual(shared.filterByConfidence(null), []);
assert.deepEqual(shared.filterByConfidence([], 0), []);

const profile = shared.errorProfile({ SN: 1, SL: 0, MO: 3, PG: 3, CTX: 0, EN: 0 });
assert.ok(profile.dominant.includes('MO'));
assert.ok(profile.dominant.includes('PG'));

// ═══════════════════════════════════════════════════════════════════════
// phoneticSimilarity
// ═══════════════════════════════════════════════════════════════════════

assert.equal(
  shared.kölnerPhonetik('Müller'),
  shared.kölnerPhonetik('Miller'),
  'Mueller ≡ Miller'
);

assert.ok(shared.phoneticallyEqual('gelsen', 'gelesen'), 'gelsen ≡ gelesen');
assert.ok(!shared.phoneticallyEqual('ferig', 'fertig'), 'ferig ≢ fertig (Elision)');

assert.equal(
  shared.findPhoneticMatch('gelsen', ['gelesen', 'gesehen', 'getan']),
  'gelesen'
);
assert.equal(shared.findPhoneticMatch('xyz', ['Hund', 'Katze']), null);

assert.equal(shared.kölnerPhonetik(''), '');
assert.equal(shared.kölnerPhonetik(null), '');

// ═══════════════════════════════════════════════════════════════════════
// contextWindowRules
// ═══════════════════════════════════════════════════════════════════════

assert.ok(Array.isArray(shared.contextWindowRules), 'contextWindowRules ist Array');
assert.ok(shared.contextWindowRules.length > 0, 'mindestens eine Regel');
assert.ok(
  shared.contextWindowRules.every(r => r.id && r.pattern && r.confidence !== undefined),
  'Alle Regeln haben id, pattern, confidence'
);

// ═══════════════════════════════════════════════════════════════════════
// GR_RULES
// ═══════════════════════════════════════════════════════════════════════

assert.ok(Array.isArray(shared.GR_RULES), 'GR_RULES ist Array');
assert.ok(shared.GR_RULES.length > 0, 'mindestens eine GR-Regel');
assert.ok(
  shared.GR_RULES.every(r => r.id && r.from && r.to !== undefined),
  'Alle GR-Regeln haben id, from, to'
);

// Smoke-Test: sodass-Regel funktioniert
const sodassRule = shared.GR_RULES.find(r => r.id === 'de-gr-sodass');
assert.ok(sodassRule, 'sodass-Regel vorhanden');
assert.ok('so dass'.match(sodassRule.from), 'sodass-Regel matcht "so dass"');

console.log('@loot/shared: all tests passed.');
