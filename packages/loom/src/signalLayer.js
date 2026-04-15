'use strict';

/**
 * LOOM Signal Layer
 *
 * Leitet produktspezifische Signale aus der Strukturanalyse ab.
 * Jede Produktschicht konsumiert andere Signalklassen:
 *
 *   FLOW  — Reparaturbedarf, Komplexitätshinweise
 *   SPIN  — Ausdrucks- und Lastsignale für die Arbeitsoberfläche
 *   SMASH — Blockade- oder Festhängesignale
 *
 * Eingabe: Ergebnis von diagnoseText() / diagnoseFullText()
 * Ausgabe: { flow, spin, smash }
 */

const { STATES } = require('./structuralState');
const { detectClauses } = require('./clauseDetector');

// ---------------------------------------------------------------------------
// FLOW-Signale
// ---------------------------------------------------------------------------

/**
 * Leitet FLOW-Signale aus dem Strukturdiagnoseergebnis ab.
 *
 * FLOW interessiert sich primär für:
 *   - Sentence-Komplexität (beeinflusst, ob Kontext für Korrektur nötig ist)
 *   - Mehrkernigkeit (Tokengrenze-Unsicherheit bei Token-Split-Korrekturen)
 *   - Fragmentierung (ggf. fehlende Satzzeichen)
 *
 * @param {object} diagResult  - Rückgabe von diagnoseText()
 * @param {string} [lang]
 * @returns {object}
 */
function flowSignals(diagResult, lang = 'de') {
  const { state, signals } = diagResult;

  // Clause-level complexity from clauseDetector
  const clauseInfo = detectClauses(diagResult.sentence || '', lang);
  const sentenceComplexity = clauseInfo.sentences.length > 0
    ? clauseInfo.sentences[0].complexity
    : 'simple';

  return {
    // Structural complexity informs context-window rule selection
    sentenceComplexity,
    hasSubordinateClauses: clauseInfo.stats.allSubordinatingConjunctions.length > 0,

    // Multi-core: token splits/merges more likely in compound structures
    isMulticore:  state === STATES.MEHRKERNIG || state === STATES.UEBERLADEN,
    isFragmented: state === STATES.FRAGMENTIERT,

    // Confidence hint: lower confidence for structurally ambiguous sentences
    confidenceHint: _flowConfidenceHint(state),

    // Raw signals for extensibility
    predicateCount: signals ? signals.predicateCount : 0,
    hasSubordination: signals ? signals.hasSubordination : false,
  };
}

function _flowConfidenceHint(state) {
  switch (state) {
    case STATES.STABIL:                       return 'high';
    case STATES.FRAGMENTIERT:                 return 'low';
    case STATES.MEHRKERNIG:                   return 'medium';
    case STATES.UEBERLADEN:                   return 'low';
    case STATES.KONFLIKTAER:                  return 'medium';
    case STATES.PERFORMATIV_INSTABIL:         return 'low';
    case STATES.FORMAL_STABIL_SEMANTISCH_LEER: return 'medium';
    default:                                  return 'medium';
  }
}

// ---------------------------------------------------------------------------
// SPIN-Signale
// ---------------------------------------------------------------------------

/**
 * Leitet SPIN-Signale ab.
 *
 * SPIN interessiert sich für:
 *   - Strukturzustand (primäres Diagnose-Signal)
 *   - Leselast-Schätzung (Satzlänge × Komplexität)
 *   - Rhythmus-Marker (Satzlänge, Chunk-Balance)
 *
 * @param {object|Array} diagResult  - einzelne Diagnose oder Array von Diagnosen (Text)
 * @param {string} [lang]
 * @returns {object}
 */
function spinSignals(diagResult, lang = 'de') {
  // Normalize to array for multi-sentence text
  const results = Array.isArray(diagResult) ? diagResult : [diagResult];

  const stateDistribution = _countStates(results);
  const avgTokens = _avgTokenCount(results);
  const readabilityBurden = _readabilityBurden(results, lang);
  const rhythmScore = _rhythmScore(results);

  return {
    // Per-sentence states for visualization
    sentenceStates: results.map(r => ({ sentence: r.sentence || '', state: r.state, note: r.note })),

    // Aggregate signals
    stateDistribution,

    // Load and rhythm
    readabilityBurden,  // 0.0–1.0 (low to high)
    rhythmScore,        // 0.0–1.0 (monotone to varied)
    avgTokensPerSentence: avgTokens,

    // Flags for SPIN UI
    hasConflict:         stateDistribution[STATES.KONFLIKTAER] > 0,
    hasMulticore:        (stateDistribution[STATES.MEHRKERNIG] || 0) + (stateDistribution[STATES.UEBERLADEN] || 0) > 0,
    hasSemanticEmpty:    stateDistribution[STATES.FORMAL_STABIL_SEMANTISCH_LEER] > 0,
    hasSelfContradiction:
      (stateDistribution[STATES.PERFORMATIV_INSTABIL] || 0) +
      (stateDistribution[STATES.NORMATIV_SELBSTANNULLIEREND] || 0) > 0,
  };
}

function _countStates(results) {
  const counts = {};
  for (const r of results) {
    counts[r.state] = (counts[r.state] || 0) + 1;
  }
  return counts;
}

function _avgTokenCount(results) {
  if (!results.length) return 0;
  const total = results.reduce((sum, r) => sum + (r.tokens ? r.tokens.length : 0), 0);
  return Math.round(total / results.length);
}

function _readabilityBurden(results, lang) {
  // Combine: avg sentence length + subordinate clause ratio + multicore ratio
  if (!results.length) return 0;

  const avgLen = _avgTokenCount(results);
  const complexCount = results.filter(r => {
    const s = r.state;
    return s === STATES.MEHRKERNIG || s === STATES.UEBERLADEN ||
           s === STATES.KONFLIKTAER || s === STATES.PERFORMATIV_INSTABIL;
  }).length;
  const complexRatio = complexCount / results.length;

  // Normalize: sentences > 20 tokens → high load
  const lengthScore = Math.min(avgLen / 25, 1.0);
  const burden = (lengthScore * 0.5) + (complexRatio * 0.5);
  return Math.round(burden * 100) / 100;
}

function _rhythmScore(results) {
  // Low score = monotone (all sentences same length)
  // High score = varied (diverse lengths)
  if (results.length < 2) return 0.5;

  const lengths = results.map(r => r.tokens ? r.tokens.length : 0);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: stdDev > 8 tokens = highly varied
  const score = Math.min(stdDev / 8, 1.0);
  return Math.round(score * 100) / 100;
}

// ---------------------------------------------------------------------------
// SMASH-Signale
// ---------------------------------------------------------------------------

/**
 * Leitet SMASH-Signale ab.
 *
 * SMASH interessiert sich für:
 *   - Blockade-Indikatoren (Fragmentierung, semantische Leere)
 *   - Strukturelle Spannung (Konflikt, Selbstwiderspruch)
 *   - Schreibzustand (Festhängen vs. Überladen)
 *
 * @param {object|Array} diagResult
 * @returns {object}
 */
function smashSignals(diagResult) {
  const results = Array.isArray(diagResult) ? diagResult : [diagResult];
  const stateDistribution = _countStates(results);
  const total = results.length;

  // Fragmentation risk: many fragments or semantically empty sentences
  const fragmentCount = (stateDistribution[STATES.FRAGMENTIERT] || 0) +
                        (stateDistribution[STATES.FORMAL_STABIL_SEMANTISCH_LEER] || 0);
  const fragmentationRisk = total > 0 ? fragmentCount / total : 0;

  // Structural tension: conflict + self-contradiction
  const tensionCount = (stateDistribution[STATES.KONFLIKTAER] || 0) +
                       (stateDistribution[STATES.PERFORMATIV_INSTABIL] || 0) +
                       (stateDistribution[STATES.NORMATIV_SELBSTANNULLIEREND] || 0);
  const structuralTensionScore = total > 0 ? tensionCount / total : 0;

  // Overload: too many cores
  const overloadCount = (stateDistribution[STATES.MEHRKERNIG] || 0) +
                        (stateDistribution[STATES.UEBERLADEN] || 0);
  const overloadScore = total > 0 ? overloadCount / total : 0;

  return {
    // Primary blockade signal
    blockadeSignal: _smashBlockadeLevel(fragmentationRisk, structuralTensionScore),

    // Detailed scores
    fragmentationRisk:      Math.round(fragmentationRisk * 100) / 100,
    structuralTensionScore: Math.round(structuralTensionScore * 100) / 100,
    overloadScore:          Math.round(overloadScore * 100) / 100,

    // Flags
    isFragmented:    fragmentationRisk > 0.4,
    isTense:         structuralTensionScore > 0.3,
    isOverloaded:    overloadScore > 0.4,

    stateDistribution,
  };
}

function _smashBlockadeLevel(fragmentRatio, tensionRatio) {
  const combined = (fragmentRatio * 0.6) + (tensionRatio * 0.4);
  if (combined > 0.6) return 'high';
  if (combined > 0.3) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Kombiniertes Signal für alle Produkte
// ---------------------------------------------------------------------------

/**
 * Leitet alle Signale auf einmal ab.
 *
 * @param {object|Array} diagResult  - Ergebnis von diagnoseText() oder diagnoseFullText()
 * @param {string} [lang]
 * @returns {{ flow: object, spin: object, smash: object }}
 */
function deriveSignals(diagResult, lang = 'de') {
  const isSingle = !Array.isArray(diagResult);
  const singleResult = isSingle ? diagResult : null;
  const arrayResult = isSingle ? [diagResult] : diagResult;

  return {
    flow:  flowSignals(singleResult || arrayResult[0], lang),
    spin:  spinSignals(arrayResult, lang),
    smash: smashSignals(arrayResult),
  };
}

module.exports = {
  flowSignals,
  spinSignals,
  smashSignals,
  deriveSignals,
};
