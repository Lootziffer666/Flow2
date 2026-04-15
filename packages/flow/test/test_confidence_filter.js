'use strict';

const assert = require('node:assert/strict');
const {
  filterByConfidence,
  errorProfile,
  DEFAULT_MIN_CONFIDENCE,
} = require('@loot/loom');
const { contextWindowRules } = require('@loot/loom');
const { runCorrection } = require('../src/pipeline');

// --- DEFAULT_MIN_CONFIDENCE ---
assert.equal(typeof DEFAULT_MIN_CONFIDENCE, 'number', 'DEFAULT_MIN_CONFIDENCE ist eine Zahl');
assert.ok(DEFAULT_MIN_CONFIDENCE >= 0 && DEFAULT_MIN_CONFIDENCE <= 1, '0–1 Bereich');

// --- filterByConfidence: Basis ---

const highConfidenceRules = [
  { id: 'r1', confidence: 0.99, pattern: /foo/g, replacement: 'bar' },
  { id: 'r2', confidence: 0.75, pattern: /baz/g, replacement: 'qux' },
  { id: 'r3', confidence: 0.85, pattern: /abc/g, replacement: 'def' },
];

const filtered90 = filterByConfidence(highConfidenceRules, 0.90);
assert.equal(filtered90.length, 1, 'Nur Regel mit confidence 0.99 überlebt bei Schwellenwert 0.90');
assert.equal(filtered90[0].id, 'r1');

const filtered80 = filterByConfidence(highConfidenceRules, 0.80);
assert.equal(filtered80.length, 2, 'Zwei Regeln >= 0.80');

const filteredAll = filterByConfidence(highConfidenceRules, 0.0);
assert.equal(filteredAll.length, 3, 'Alle Regeln bei Schwellenwert 0');

// --- filterByConfidence: disabledByDefault wird immer entfernt ---
const withDisabled = [
  { id: 'enabled', confidence: 0.99 },
  { id: 'disabled', confidence: 0.99, disabledByDefault: true },
];
const resultDisabled = filterByConfidence(withDisabled, 0.0);
assert.equal(resultDisabled.length, 1, 'disabledByDefault-Regeln werden gefiltert');
assert.equal(resultDisabled[0].id, 'enabled');

// --- filterByConfidence: Regeln ohne confidence-Feld gelten als 1.0 ---
const noConfidenceRule = [{ id: 'no-conf', pattern: /x/g, replacement: 'y' }];
assert.equal(
  filterByConfidence(noConfidenceRule, 0.95).length,
  1,
  'Regel ohne confidence-Feld bei Schwellenwert 0.95 → 1 Ergebnis (default=1.0)'
);

// --- filterByConfidence: Randfälle ---
assert.deepEqual(filterByConfidence(null, 0.9), [], 'null → leeres Array');
assert.deepEqual(filterByConfidence(undefined, 0.9), [], 'undefined → leeres Array');
assert.deepEqual(filterByConfidence([], 0.9), [], 'Leeres Array → leeres Array');
assert.deepEqual(filterByConfidence([null, undefined, 42], 0.0), [], 'Ungültige Einträge werden ignoriert');

// --- filterByConfidence auf echten contextWindowRules ---
const enabledRules = contextWindowRules.filter((r) => !r.disabledByDefault);
const allFiltered = filterByConfidence(contextWindowRules, 0.0);
assert.equal(
  allFiltered.length,
  enabledRules.length,
  'filterByConfidence(0) entspricht allen aktiven Regeln'
);

const strictFiltered = filterByConfidence(contextWindowRules, 0.98);
assert.ok(
  strictFiltered.every((r) => (r.confidence ?? 1.0) >= 0.98),
  'Strict-Filter: alle zurückgegebenen Regeln haben confidence >= 0.98'
);

// --- errorProfile ---

const hitsBothPgAndMo = { EN: 0, CTX: 0, SN: 1, SL: 0, MO: 3, PG: 3, total: 7 };
const profile1 = errorProfile(hitsBothPgAndMo);
assert.ok(profile1.dominant.includes('MO'), 'Dominante Fehlerklasse MO enthalten');
assert.ok(profile1.dominant.includes('PG'), 'Dominante Fehlerklasse PG enthalten');
assert.equal(profile1.profile.SN, 1, 'SN-Hits korrekt');
assert.equal(profile1.profile.MO, 3, 'MO-Hits korrekt');

const hitsNone = { EN: 0, CTX: 0, SN: 0, SL: 0, MO: 0, PG: 0, total: 0 };
const profile2 = errorProfile(hitsNone);
assert.deepEqual(profile2.dominant, [], 'Keine Hits → keine dominante Klasse');

assert.deepEqual(errorProfile(null), { dominant: [], profile: {} }, 'null → leeres Profil');
assert.deepEqual(errorProfile(undefined), { dominant: [], profile: {} }, 'undefined → leeres Profil');

// --- errorProfile aus echter Pipeline-Ausgabe ---
const result = runCorrection('ich hab das gestern gelsen und ferig', { language: 'de' });
const liveProfile = errorProfile(result.rule_hits);
assert.ok(Array.isArray(liveProfile.dominant), 'Dominante Klassen sind Array');
assert.ok(typeof liveProfile.profile === 'object', 'Profil ist Objekt');
// PG-Stufe sollte angeschlagen haben (hab → habe, gelsen → gelesen, ferig → fertig)
assert.ok(result.rule_hits.PG >= 1, 'PG-Stufe hat mindestens 1 Treffer');

console.log('Confidence filter tests passed.');
