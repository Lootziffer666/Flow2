/**
 * @loot/shared — ESM Wrapper
 *
 * Re-exportiert alle Symbole aus dem CJS-Barrel fuer ESM-Konsumenten (SPIN).
 * Ermoeglicht: import { detectClauses } from '@loot/shared';
 */

import shared from './src/index.js';

export const {
  // clauseDetector
  detectClauses,
  splitSentences,
  SUBORDINATING_DE,
  COORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_EN,

  // confidenceFilter
  filterByConfidence,
  errorProfile,
  DEFAULT_MIN_CONFIDENCE,

  // phoneticSimilarity
  kölnerPhonetik,
  phoneticallyEqual,
  findPhoneticMatch,

  // contextWindowRules
  contextWindowRules,

  // rules.gr
  GR_RULES,
} = shared;

export default shared;
