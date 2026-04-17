'use strict';

/**
 * LOOM Structural State Layer
 *
 * Klassifiziert strukturelle Zustände eines Textes oder Chunk-Sets.
 * Verallgemeinerte Version der SPIN-Diagnose-Engine, einsetzbar ohne UI.
 *
 * Zustände (Priorität absteigend):
 *   1. performativ_instabil       — Selbstreferenz + Negation (Paradox)
 *   2. normativ_selbstannullierend — Normative Aussage negiert sich selbst
 *   3. konfliktaer                — Unaufgelöste gegensätzliche Polarität
 *   4. formal_stabil_semantisch_leer — Korrekt, aber semantisch leer
 *   5. ueberladen                 — Zu viele Kerne, Leselast kritisch
 *   6. mehrkernig                 — Mehrere Predikate ohne Subordination
 *   7. fragmentiert               — Kein erkennbarer Prädikatkern
 *   8. stabil                     — Keine strukturellen Spannungen
 *
 * Kann auf:
 *   a) Chunk-Array + Token-Array arbeiten (wie SPIN)
 *   b) Reinen Text (auto-Chunking via chunkSentence)
 *
 * Rückgabe: { state, note, signals: { ... } }
 */

const {
  META_MARKERS_DEFAULT,
  NULL_MARKERS_DEFAULT,
  NEGATIVE_POLARITY_DEFAULT,
  NORM_NEGATORS_DEFAULT,
} = require('../../../loom-db/language/markers');

const { chunkSentence } = require('./chunker');

// ---------------------------------------------------------------------------
// Zustandskonstanten
// ---------------------------------------------------------------------------

const STATES = {
  PERFORMATIV_INSTABIL:             'performativ_instabil',
  NORMATIV_SELBSTANNULLIEREND:      'normativ_selbstannullierend',
  KONFLIKTAER:                      'konfliktaer',
  FORMAL_STABIL_SEMANTISCH_LEER:    'formal_stabil_semantisch_leer',
  UEBERLADEN:                       'ueberladen',
  MEHRKERNIG:                       'mehrkernig',
  FRAGMENTIERT:                     'fragmentiert',
  STABIL:                           'stabil',
};

// ---------------------------------------------------------------------------
// Chunk-Text-Helfer
// ---------------------------------------------------------------------------

function getChunkText(chunk, tokens) {
  return chunk.tokenIds
    .map(id => {
      const t = tokens.find(tok => tok.id === id);
      return t ? t.text : '';
    })
    .filter(Boolean)
    .join(' ');
}

function chunkTextLower(chunk, tokens) {
  return getChunkText(chunk, tokens).toLowerCase();
}

// ---------------------------------------------------------------------------
// Polaritäts-Helfer
// ---------------------------------------------------------------------------

function polarity(chunk, tokens, negativeMarkers) {
  const text = chunkTextLower(chunk, tokens);
  return negativeMarkers.some(k => text.includes(k)) ? 'negative' : 'positive';
}

// ---------------------------------------------------------------------------
// Diagnosefunktionen (auf Chunks)
// ---------------------------------------------------------------------------

function isPerformativeInstable(chunks, tokens, metaMarkers, nullMarkers) {
  const fullText = chunks.map(c => chunkTextLower(c, tokens)).join(' ');
  const hasSelfRef = metaMarkers.some(m => fullText.includes(m));
  const hasNegation = nullMarkers.some(n => fullText.includes(n));
  return hasSelfRef && hasNegation;
}

function isNormativeSelfAnnulling(chunks, tokens, normNegators) {
  const hasNorm = chunks.some(c => c.type === 'judgement.normative');
  if (!hasNorm) return false;
  const fullText = chunks.map(c => chunkTextLower(c, tokens)).join(' ');
  return normNegators.some(k => fullText.includes(k));
}

function isConflictual(chunks, tokens, negativePolarity) {
  const norms = chunks.filter(c => c.type === 'judgement.normative');
  const socials = chunks.filter(c => c.type === 'evaluation.social');

  if (norms.length >= 2 &&
      polarity(norms[0], tokens, negativePolarity) !== polarity(norms[1], tokens, negativePolarity)) {
    return true;
  }
  if (socials.length >= 2 &&
      polarity(socials[0], tokens, negativePolarity) !== polarity(socials[1], tokens, negativePolarity)) {
    return true;
  }
  return false;
}

function isFormallyStableSemanticallyEmpty(chunks, tokens) {
  const subject = chunks.find(c => c.type === 'core.subject');
  if (!subject) return false;
  const subjectText = chunkTextLower(subject, tokens).trim();
  if (['es', 'dies', 'das', 'it', 'this', 'that'].includes(subjectText)) {
    const hasConcrete = chunks.some(c => ['core.object', 'state'].includes(c.type));
    return !hasConcrete;
  }
  return false;
}

function isMulticore(chunks) {
  const predicates = chunks.filter(c => c.type === 'core.predicate');
  const relations = chunks.filter(c => c.type === 'relation');
  // Multiple predicates without subordination = multi-core
  return predicates.length > 1 && relations.length === 0;
}

function isOverloaded(chunks) {
  // Too many cores: 3+ predicates = critically overloaded
  const predicates = chunks.filter(c => c.type === 'core.predicate');
  return predicates.length >= 3;
}

function isFragmented(chunks) {
  // No predicate at all = fragmented
  const hasPredicate = chunks.some(c => c.type === 'core.predicate' || c.type === 'state');
  return !hasPredicate && chunks.length > 0;
}

// ---------------------------------------------------------------------------
// Diagnose auf Chunk-Array
// ---------------------------------------------------------------------------

/**
 * Klassifiziert den Strukturzustand eines Chunk-Sets.
 *
 * @param {Array<{id, type, tokenIds, text}>} chunks
 * @param {Array<{id, text, tag}>} tokens
 * @param {object} [markers]  - Override-Marker (optional)
 * @returns {{ state: string, note: string, signals: object }}
 */
function diagnoseChunks(chunks, tokens, markers = {}) {
  const metaMarkers = markers.meta || META_MARKERS_DEFAULT;
  const nullMarkers = markers.null || NULL_MARKERS_DEFAULT;
  const negativePolarity = markers.negative || NEGATIVE_POLARITY_DEFAULT;
  const normNegators = markers.norm || NORM_NEGATORS_DEFAULT;

  const predicateCount = chunks.filter(c => c.type === 'core.predicate').length;
  const hasSubordination = chunks.some(c => c.type === 'relation');

  // Signals (intermediate results, useful for signalLayer)
  const signals = {
    predicateCount,
    hasSubordination,
    hasSubject: chunks.some(c => c.type === 'core.subject'),
    hasObject: chunks.some(c => c.type === 'core.object'),
    hasState: chunks.some(c => c.type === 'state'),
    hasRelation: hasSubordination,
    chunkCount: chunks.length,
  };

  if (isOverloaded(chunks)) {
    return {
      state: STATES.UEBERLADEN,
      note: `${predicateCount} Prädikatskerne ohne Subordination — Satz ist kritisch überladen.`,
      signals,
    };
  }

  if (isPerformativeInstable(chunks, tokens, metaMarkers, nullMarkers)) {
    return {
      state: STATES.PERFORMATIV_INSTABIL,
      note: 'Selbstreferenz und Auflösung gleichzeitig: der Satz referenziert seine eigene Unmöglichkeit.',
      signals,
    };
  }

  if (isNormativeSelfAnnulling(chunks, tokens, normNegators)) {
    return {
      state: STATES.NORMATIV_SELBSTANNULLIEREND,
      note: 'Eine normative Aussage wird im gleichen Satz durch sich selbst außer Kraft gesetzt.',
      signals,
    };
  }

  if (isConflictual(chunks, tokens, negativePolarity)) {
    return {
      state: STATES.KONFLIKTAER,
      note: 'Zwei Bewertungen mit entgegengesetzter Polarität stehen unaufgelöst nebeneinander.',
      signals,
    };
  }

  if (isFormallyStableSemanticallyEmpty(chunks, tokens)) {
    return {
      state: STATES.FORMAL_STABIL_SEMANTISCH_LEER,
      note: 'Grammatisch korrekt, aber das Subjekt ist ein Platzhalter ohne externe Referenz.',
      signals,
    };
  }

  if (isMulticore(chunks)) {
    return {
      state: STATES.MEHRKERNIG,
      note: `${predicateCount} gleichrangige Prädikatskerne ohne Subordination identifiziert.`,
      signals,
    };
  }

  if (isFragmented(chunks)) {
    return {
      state: STATES.FRAGMENTIERT,
      note: 'Kein Prädikat erkannt. Der Satz ist strukturell unvollständig.',
      signals,
    };
  }

  return {
    state: STATES.STABIL,
    note: 'Keine strukturellen Spannungen erkannt.',
    signals,
  };
}

// ---------------------------------------------------------------------------
// Diagnose auf reinem Text (auto-Chunking)
// ---------------------------------------------------------------------------

/**
 * Analysiert einen einzelnen Satz direkt aus Text.
 *
 * @param {string} sentence
 * @param {string} [lang]   'de' | 'en'
 * @param {object} [markers]
 * @returns {{ state, note, signals, tokens, chunks }}
 */
function diagnoseText(sentence, lang = 'de', markers = {}) {
  const { tokens, chunks } = chunkSentence(String(sentence || ''), lang);
  const result = diagnoseChunks(chunks, tokens, markers);
  return { ...result, tokens, chunks };
}

/**
 * Analysiert alle Sätze eines längeren Textes.
 *
 * @param {string} text
 * @param {string} [lang]
 * @param {object} [markers]
 * @returns {Array<{ sentence, state, note, signals, tokens, chunks }>}
 */
function diagnoseFullText(text, lang = 'de', markers = {}) {
  const { splitSentences } = require('./clauseDetector');
  const sentences = splitSentences(String(text || ''));
  return sentences.map(sentence => {
    const d = diagnoseText(sentence, lang, markers);
    return { sentence, ...d };
  });
}

module.exports = {
  STATES,
  diagnoseChunks,
  diagnoseText,
  diagnoseFullText,
  getChunkText,
};
