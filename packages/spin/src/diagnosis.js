/**
 * SPIN Diagnose-Engine
 *
 * Delegiert an @loot/loom (diagnoseChunks) für die Strukturdiagnose.
 * Marker-Sets kommen aus ./config.js (SPIN-lokale Konfiguration).
 *
 * Rückgabe: { state: string, note: string }
 */

import {
  META_MARKERS,
  NULL_MARKERS,
  NEGATIVE_POLARITY,
  NORM_NEGATORS,
} from './config.js';

import {
  diagnoseChunks as _loomDiagnoseChunks,
  getChunkText as _loomGetChunkText,
} from '@loot/loom';

/**
 * Gibt den Text eines Chunks als String zurück.
 * @param {object} chunk - Chunk-Objekt mit tokenIds
 * @param {object[]} tokens - Token-Array
 * @returns {string}
 */
export function getChunkText(chunk, tokens) {
  return _loomGetChunkText(chunk, tokens);
}

/**
 * Führt die Diagnose auf geordneten Chunks durch.
 * Delegiert an @loot/loom mit SPIN-lokalen Marker-Konfigurationen.
 *
 * @param {object[]} orderedChunks - Chunks in aktueller Reihenfolge
 * @param {object[]} tokens - Token-Array
 * @returns {{ state: string, note: string }}
 */
export function runDiagnosis(orderedChunks, tokens) {
  const result = _loomDiagnoseChunks(orderedChunks, tokens, {
    meta: META_MARKERS,
    null: NULL_MARKERS,
    negativePol: NEGATIVE_POLARITY,
    normNeg: NORM_NEGATORS,
  });
  return { state: result.state, note: result.note };
}
