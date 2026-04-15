'use strict';

/**
 * @loot/shared — Shared Linguistic Engine
 *
 * Gemeinsame Module fuer FLOW und SPIN:
 * - clauseDetector: Satz- und Teilsatz-Analyse
 * - confidenceFilter: Confidence-Threshold-Filter (Constraint Grammar)
 * - phoneticSimilarity: Koelner Phonetik (Cologne Phonetics, Postel 1969)
 * - contextWindowRules: Multi-Token-Kontextregeln mit Konfidenzwerten
 * - rules.gr: Deutsche Grammatik-Normalisierungsregeln (LanguageTool-inspiriert)
 *
 * CJS-Einstiegspunkt (require). ESM-Wrapper: ../index.mjs
 */

const clauseDetector = require('./clauseDetector');
const confidenceFilter = require('./confidenceFilter');
const phoneticSimilarity = require('./phoneticSimilarity');
const contextWindowRules = require('./contextWindowRules');
const GR_RULES = require('./rules.gr');

module.exports = {
  // clauseDetector
  detectClauses: clauseDetector.detectClauses,
  splitSentences: clauseDetector.splitSentences,
  SUBORDINATING_DE: clauseDetector.SUBORDINATING_DE,
  COORDINATING_DE: clauseDetector.COORDINATING_DE,
  SUBORDINATING_EN: clauseDetector.SUBORDINATING_EN,
  COORDINATING_EN: clauseDetector.COORDINATING_EN,

  // confidenceFilter
  filterByConfidence: confidenceFilter.filterByConfidence,
  errorProfile: confidenceFilter.errorProfile,
  DEFAULT_MIN_CONFIDENCE: confidenceFilter.DEFAULT_MIN_CONFIDENCE,

  // phoneticSimilarity
  kölnerPhonetik: phoneticSimilarity.kölnerPhonetik,
  phoneticallyEqual: phoneticSimilarity.phoneticallyEqual,
  findPhoneticMatch: phoneticSimilarity.findPhoneticMatch,

  // contextWindowRules
  contextWindowRules,

  // rules.gr
  GR_RULES,
};
