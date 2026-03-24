'use strict';

/**
 * Confidence-Threshold-Filter für FLOW-Regeln
 *
 * Inspiriert von Constraint Grammar (CG, Karlsson 1990):
 * In CG können Regeln unterschiedlich sicher sein; schwache Regeln werden
 * erst angewendet, wenn stärkere Constraints bereits gefeuert haben.
 *
 * FLOW-Anwendung:
 * Regeln in `contextWindowRules.js` tragen bereits ein `confidence`-Feld
 * (0.0–1.0). Dieser Filter erlaubt es, zur Laufzeit einen Mindestschwellenwert
 * zu setzen: Regeln unterhalb des Schwellenwerts werden übersprungen.
 *
 * Das entspricht dem OT-Prinzip (Optimality Theory): Regeln mit höherem
 * Rank (→ höherer Konfidenz) haben immer Vorrang.
 *
 * Verwendung:
 *   const { filterByConfidence } = require('./confidenceFilter');
 *   const safeRules = filterByConfidence(contextWindowRules, 0.90);
 */

const DEFAULT_MIN_CONFIDENCE = 0.80;

/**
 * Gibt die Regeln zurück, deren `confidence`-Wert >= minConfidence ist.
 * Regeln ohne `confidence`-Feld werden als voll vertrauenswürdig behandelt
 * (confidence = 1.0), sofern sie nicht explizit `disabledByDefault: true` tragen.
 *
 * @param {Array}  rules          - Regeln mit optionalem `confidence`-Feld
 * @param {number} minConfidence  - Mindestschwellenwert (0.0–1.0); Standard 0.80
 * @returns {Array}               - Gefilterte Regeln
 */
function filterByConfidence(rules, minConfidence = DEFAULT_MIN_CONFIDENCE) {
  if (!Array.isArray(rules)) return [];
  const threshold = typeof minConfidence === 'number' ? minConfidence : DEFAULT_MIN_CONFIDENCE;

  return rules.filter((rule) => {
    if (!rule || typeof rule !== 'object') return false;
    if (rule.disabledByDefault === true) return false;

    // Regeln ohne confidence-Feld gelten als vollständig vertrauenswürdig
    const confidence = typeof rule.confidence === 'number' ? rule.confidence : 1.0;
    return confidence >= threshold;
  });
}

/**
 * Gibt ein Error-Profil zurück, das aus dem `rule_hits`-Objekt einer
 * Pipeline-Ausgabe ableitet, welche Fehlerklasse(n) dominant sind.
 *
 * Basiert auf der dysorthografischen Typisierung (Scheerer-Neumann, HSP):
 *   SN ≈ syntaktische Fügungsfehler
 *   SL ≈ silbische Strategie (Vokalfehler)
 *   MO ≈ morphematische Strategie (Stammfehler)
 *   PG ≈ alphabetische/phonetische Strategie (Laut-Buchstabe-Fehler)
 *   CTX ≈ Kontextfehler (Verwechslung grammatischer Formen)
 *
 * @param {object} ruleHits - Das `rule_hits`-Objekt aus pipeline.runCorrection()
 * @returns {object}        - { dominant: string[], profile: object }
 */
function errorProfile(ruleHits) {
  if (!ruleHits || typeof ruleHits !== 'object') {
    return { dominant: [], profile: {} };
  }

  const stages = ['SN', 'SL', 'MO', 'PG', 'CTX', 'EN'];
  const profile = {};
  let maxHits = 0;

  for (const stage of stages) {
    const hits = typeof ruleHits[stage] === 'number' ? ruleHits[stage] : 0;
    profile[stage] = hits;
    if (hits > maxHits) maxHits = hits;
  }

  const dominant = maxHits === 0
    ? []
    : stages.filter((s) => profile[s] === maxHits);

  return { dominant, profile };
}

module.exports = {
  filterByConfidence,
  errorProfile,
  DEFAULT_MIN_CONFIDENCE,
};
