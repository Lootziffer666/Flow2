'use strict';

const shared = require('@loot/shared');
const { chunkSentence, chunkText } = require('./chunker');
const { diagnoseText, diagnoseFullText } = require('./structuralState');
const { flowSignals, spinSignals, smashSignals, deriveSignals } = require('./signalLayer');

/**
 * Builds a BindingGraph for a single sentence.
 *
 * This is the primary entry point for the relational layer.
 * The BindingGraph contains LinguisticObjects (chunks) and their
 * explicit Bindings — independent of token boundaries and surface form.
 *
 * @param {string} sentence
 * @param {string} [lang]  'de' | 'en'
 * @returns {{ surface: string, lang: string, chunks: Array, bindings: Array }}
 */
function buildBindingGraph(sentence, lang = 'de') {
  const { tokens, chunks, bindings } = chunkSentence(sentence, lang);
  return {
    surface:  sentence,
    lang:     String(lang || 'de').toLowerCase().startsWith('en') ? 'en' : 'de',
    tokens,
    chunks,
    bindings,
  };
}

module.exports = {
  // Shared linguistic engine (GR_RULES, contextWindowRules, clauseDetector, etc.)
  ...shared,

  // LOOM structural analysis
  diagnoseText,
  diagnoseFullText,

  // LOOM signal layers
  flowSignals,
  spinSignals,
  smashSignals,
  deriveSignals,

  // Relational layer — primary working surface
  buildBindingGraph,
  chunkSentence,
  chunkText,
};
