import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const loom = require('./src/index.js');

export const {
  detectClauses,
  splitSentences,
  SUBORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_DE,
  COORDINATING_EN,
  chunkSentence,
  chunkText,
  tokenizeText,
  tagTokens,
  TAG,
  STATES,
  diagnoseChunks,
  diagnoseText,
  diagnoseFullText,
  getChunkText,
  flowSignals,
  spinSignals,
  smashSignals,
  deriveSignals,
  filterByConfidence,
  errorProfile,
  koelnerPhonetik,
  phoneticallyEqual,
  findPhoneticMatch,
  contextWindowRules,
  GR_RULES,
} = loom;

export default loom;
