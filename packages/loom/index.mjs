/**
 * @loot/loom — ESM wrapper
 *
 * Re-exportiert alle CJS-Exporte als benannte ES-Module.
 * Erlaubt: import { diagnoseText, STATES } from '@loot/loom'
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const loom = require('./src/index.js');

export const detectClauses          = loom.detectClauses;
export const splitSentences         = loom.splitSentences;
export const SUBORDINATING_DE       = loom.SUBORDINATING_DE;
export const COORDINATING_DE        = loom.COORDINATING_DE;
export const SUBORDINATING_EN       = loom.SUBORDINATING_EN;
export const COORDINATING_EN        = loom.COORDINATING_EN;

export const chunkSentence          = loom.chunkSentence;
export const chunkText              = loom.chunkText;
export const tokenizeText           = loom.tokenizeText;
export const tagTokens              = loom.tagTokens;
export const TAG                    = loom.TAG;
export const COPULA_DE              = loom.COPULA_DE;
export const COPULA_EN              = loom.COPULA_EN;

export const STATES                 = loom.STATES;
export const diagnoseChunks         = loom.diagnoseChunks;
export const diagnoseText           = loom.diagnoseText;
export const diagnoseFullText       = loom.diagnoseFullText;
export const getChunkText           = loom.getChunkText;

export const flowSignals            = loom.flowSignals;
export const spinSignals            = loom.spinSignals;
export const smashSignals           = loom.smashSignals;
export const deriveSignals          = loom.deriveSignals;

export const META_MARKERS_DEFAULT      = loom.META_MARKERS_DEFAULT;
export const NULL_MARKERS_DEFAULT      = loom.NULL_MARKERS_DEFAULT;
export const NEGATIVE_POLARITY_DEFAULT = loom.NEGATIVE_POLARITY_DEFAULT;
export const NORM_NEGATORS_DEFAULT     = loom.NORM_NEGATORS_DEFAULT;

// @loot/shared re-exports (LOOM is a superset of shared)
export const filterByConfidence    = loom.filterByConfidence;
export const errorProfile          = loom.errorProfile;
export const DEFAULT_MIN_CONFIDENCE = loom.DEFAULT_MIN_CONFIDENCE;
export const kölnerPhonetik        = loom.kölnerPhonetik;
export const phoneticallyEqual     = loom.phoneticallyEqual;
export const findPhoneticMatch     = loom.findPhoneticMatch;
export const contextWindowRules    = loom.contextWindowRules;
export const GR_RULES              = loom.GR_RULES;
