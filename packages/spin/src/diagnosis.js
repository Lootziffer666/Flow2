/**
 * SPIN Diagnose-Engine — 6 Diagnosezustände
 *
 * Prioritätsreihenfolge (hart, gemäß Spec):
 * 1. performativ_instabil — Selbstreferenz + Negation (Paradox)
 * 2. normativ_selbstannullierend — Normative Aussage annulliert sich selbst
 * 3. konfliktaer — Zwei Bewertungen, unaufgelöste Polarität
 * 4. formal_stabil_semantisch_leer — Grammatisch korrekt, Platzhalter-Subjekt
 * 5. mehrkernig — Mehrere Prädikate ohne Subordination
 * 6. stabil — Keine strukturellen Spannungen
 *
 * Rückgabe: { state: string, note: string, signal_source: { loom: string[], spin: string[] } }
 */

import {
  META_MARKERS,
  NULL_MARKERS,
  NEGATIVE_POLARITY,
  NORM_NEGATORS,
} from './config.js';

import { detectClauses } from '@loot/loom';

/**
 * Gibt den Text eines Chunks als String zurück.
 * @param {object} chunk - Chunk-Objekt mit tokenIds
 * @param {object[]} tokens - Token-Array
 * @returns {string}
 */
export function getChunkText(chunk, tokens) {
  return chunk.tokenIds
    .map(tId => tokens.find(t => t.id === tId).text)
    .join(' ');
}

/**
 * Gibt den Text eines Chunks in Kleinbuchstaben zurück.
 * @param {object} chunk
 * @param {object[]} tokens
 * @returns {string}
 */
function chunkTextLower(chunk, tokens) {
  return getChunkText(chunk, tokens).toLowerCase();
}

/**
 * Bestimmt die Polarität eines Chunks (positive/negative).
 * @param {object} chunk
 * @param {object[]} tokens
 * @returns {'positive'|'negative'}
 */
function polarity(chunk, tokens) {
  const text = chunkTextLower(chunk, tokens);
  return NEGATIVE_POLARITY.some(k => text.includes(k)) ? 'negative' : 'positive';
}

// --- Diagnosefunktionen ---

function isPerformativeInstable(orderedChunks, tokens) {
  const fullText = orderedChunks.map(c => chunkTextLower(c, tokens)).join(' ');
  const hasSelfRef = META_MARKERS.some(m => fullText.includes(m));
  const hasNegation = NULL_MARKERS.some(n => fullText.includes(n));
  return hasSelfRef && hasNegation;
}

function isNormativeSelfAnnulling(orderedChunks, tokens) {
  const hasNorm = orderedChunks.some(c => c.type === 'judgement.normative');
  if (!hasNorm) return false;
  const fullText = orderedChunks.map(c => chunkTextLower(c, tokens)).join(' ');
  return NORM_NEGATORS.some(k => fullText.includes(k));
}

function isConflictual(orderedChunks, tokens) {
  const norms = orderedChunks.filter(c => c.type === 'judgement.normative');
  const socials = orderedChunks.filter(c => c.type === 'evaluation.social');

  if (norms.length >= 2 && polarity(norms[0], tokens) !== polarity(norms[1], tokens)) {
    return true;
  }
  if (socials.length >= 2 && polarity(socials[0], tokens) !== polarity(socials[1], tokens)) {
    return true;
  }
  return false;
}

function isFormallyStableSemanticallyEmpty(orderedChunks, tokens) {
  const subject = orderedChunks.find(c => c.type === 'core.subject');
  if (!subject) return false;
  const subjectText = chunkTextLower(subject, tokens).trim();
  if (['es', 'dies', 'das'].includes(subjectText)) {
    const hasConcrete = orderedChunks.some(c =>
      ['core.object', 'state'].includes(c.type)
    );
    return !hasConcrete;
  }
  return false;
}

function isMulticore(orderedChunks, tokens) {
  const predicates = orderedChunks.filter(c => c.type === 'core.predicate');
  if (predicates.length <= 1) return false;
  const sentenceText = tokens.map(t => t.text).join(' ');
  const clauseAnalysis = detectClauses(sentenceText, 'de');
  const firstSentence = clauseAnalysis.sentences?.[0];
  const subordinated = Boolean(firstSentence && firstSentence.subordinateClauses.length > 0);
  return !subordinated;
}

function withSources(state, note, loomSignals = [], spinSignals = []) {
  return {
    state,
    note,
    signal_source: {
      loom: loomSignals,
      spin: spinSignals,
    },
  };
}

/**
 * Führt die Diagnose auf geordneten Chunks durch.
 * Prioritätsreihenfolge gemäß Spec (hart).
 *
 * @param {object[]} orderedChunks - Chunks in aktueller Reihenfolge
 * @param {object[]} tokens - Token-Array
 * @returns {{ state: string, note: string }}
 */
export function runDiagnosis(orderedChunks, tokens) {
  if (isPerformativeInstable(orderedChunks, tokens)) {
    return withSources(
      'performativ_instabil',
      'Der Satz referenziert auf seine eigene Unmöglichkeit. Selbstreferenz und Auflösung gleichzeitig.',
      [],
      ['meta_markers', 'null_markers']
    );
  }

  if (isNormativeSelfAnnulling(orderedChunks, tokens)) {
    return withSources(
      'normativ_selbstannullierend',
      'Eine normative Aussage wird im gleichen Satz durch sich selbst außer Kraft gesetzt.',
      [],
      ['normative_chunk', 'norm_negators']
    );
  }

  if (isConflictual(orderedChunks, tokens)) {
    return withSources(
      'konfliktaer',
      'Zwei Bewertungen mit entgegengesetzter Polarität stehen unaufgelöst nebeneinander.',
      [],
      ['chunk_polarity']
    );
  }

  if (isFormallyStableSemanticallyEmpty(orderedChunks, tokens)) {
    return withSources(
      'formal_stabil_semantisch_leer',
      'Der Satz ist grammatisch korrekt, aber das Subjekt ist ein Platzhalter ohne externe Referenz.',
      [],
      ['subject_placeholder', 'local_chunk_context']
    );
  }

  if (isMulticore(orderedChunks, tokens)) {
    return withSources(
      'mehrkernig',
      'Mehrere gleichrangige Prädikatskerne ohne Subordination identifiziert.',
      ['clause_subordination'],
      ['predicate_count']
    );
  }

  return withSources(
    'stabil',
    'Keine strukturellen Spannungen erkannt.',
    ['clause_subordination'],
    ['chunk_consistency']
  );
}
