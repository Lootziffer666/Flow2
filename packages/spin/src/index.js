/**
 * SPIN — Hauptmodul
 *
 * Exportiert alle öffentlichen APIs des SPIN-Systems.
 * Einstiegspunkt für programmatische Nutzung und LOOM-Anbindung.
 *
 * Grammar-Module kommen aus @loot/loom (Shared Engine).
 * SPIN-lokale Module: phonotactics, rules.en.gr
 */

export { CHUNK_TYPES, DOGMA_RULES, META_MARKERS, NULL_MARKERS } from './config.js';

export { runDiagnosis, getChunkText, STATES } from './diagnosis.js';

// LOOM API — direkt nutzbar für Konsumenten von @loot/spin
export {
  diagnoseText,
  diagnoseFullText,
  chunkSentence,
  chunkText,
  spinSignals,
  deriveSignals,
} from '@loot/loom';

export { earcon } from './earcons.js';

export { initSpin, parseSentence } from './ui.js';

// Shared Engine (@loot/loom) — ehemals ./grammar/
export {
  detectClauses,
  splitSentences,
  GR_RULES,
  contextWindowRules,
} from '@loot/loom';

// SPIN-lokale Module (noch nicht in Shared)
export {
  checkPhonotactics,
  analyzeTextPhonotactics,
  sonorityProfile,
  featureDistance,
  VOICING_PAIRS,
} from './phonotactics.js';

export { EN_GR_RULES } from './rules.en.gr.js';

export {
  NODE_TYPES,
  LINK_TYPES,
  createGraph,
  addNode,
  getNode,
  setProperty,
  removeNode,
  link,
  getLinks,
  removeLink,
  findNodes,
  getNeighbors,
  exportGraph,
  importGraph,
  mergeGraph,
} from './nodes.js';
