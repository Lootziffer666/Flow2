/**
 * SPIN Diagnose-Engine
 *
 * Delegiert die Strukturzustandsklassifikation an @loot/loom (diagnoseChunks).
 * LOOM liefert 8 Zustände; SPIN re-exportiert alle für die Arbeitsoberfläche.
 *
 * Zustandsliste (Priorität absteigend):
 *   1. performativ_instabil          — Selbstreferenz + Negation (Paradox)
 *   2. normativ_selbstannullierend   — Normative Aussage negiert sich selbst
 *   3. konfliktaer                   — Unaufgelöste gegensätzliche Polarität
 *   4. formal_stabil_semantisch_leer — Grammatisch korrekt, semantisch leer
 *   5. ueberladen                    — 3+ Prädikatskerne (LOOM, neu)
 *   6. mehrkernig                    — Mehrere Prädikate ohne Subordination
 *   7. fragmentiert                  — Kein Prädikat erkannt (LOOM, neu)
 *   8. stabil                        — Keine strukturellen Spannungen
 *
 * Rückgabe: { state: string, note: string, signals?: object }
 */

import {
  diagnoseChunks as _loomDiagnoseChunks,
  getChunkText as _loomGetChunkText,
  STATES,
} from '@loot/loom';

import {
  META_MARKERS,
  NULL_MARKERS,
  NEGATIVE_POLARITY,
  NORM_NEGATORS,
} from './config.js';

// Re-export STATES so SPIN UI code can reference canonical state names
export { STATES };

/**
 * Gibt den Text eines Chunks als String zurück.
 * Delegiert an @loot/loom.
 *
 * @param {object} chunk - Chunk-Objekt mit tokenIds
 * @param {object[]} tokens - Token-Array
 * @returns {string}
 */
export function getChunkText(chunk, tokens) {
  return _loomGetChunkText(chunk, tokens);
}

/**
 * Führt die Strukturdiagnose auf geordneten Chunks durch.
 *
 * Übergibt SPIN-lokale Marker (aus config.js) an LOOMs diagnoseChunks,
 * sodass die Diagnose die SPIN-spezifischen Markerlisten verwendet.
 *
 * @param {object[]} orderedChunks - Chunks in aktueller Reihenfolge
 * @param {object[]} tokens - Token-Array
 * @returns {{ state: string, note: string, signals?: object }}
 */
export function runDiagnosis(orderedChunks, tokens) {
  return _loomDiagnoseChunks(orderedChunks, tokens, {
    meta:     META_MARKERS,
    null:     NULL_MARKERS,
    negative: NEGATIVE_POLARITY,
    norm:     NORM_NEGATORS,
  });
}
