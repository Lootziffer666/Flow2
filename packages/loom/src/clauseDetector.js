'use strict';

/**
 * clauseDetector – Satz- und Teilsatz-Analyse
 *
 * Eigenständiges Modul für die Erkennung von Satzstrukturen.
 * Entwickelt mit Blick auf spätere Nutzung durch SPIN:
 *   SPIN zerlegt Sätze in Chunks (Subjekt, Prädikat, Objekt, …) und stellt
 *   Struktur visuell dar. Das clauseDetector-Modul liefert die rohe
 *   Satz-Topologie, die SPIN als Eingabe für das Chunking verwenden kann.
 *
 * Vorbild: Constraint Grammar (Karlsson 1990) – deterministisch, regelbasiert,
 * keine stochastischen Modelle. Jeder Ausgabewert ist auf eine explizite
 * Regel zurückführbar.
 *
 * Rückgabewert von detectClauses():
 * {
 *   sentences: [
 *     {
 *       text: string,
 *       complexity: 'simple' | 'compound' | 'complex' | 'compound-complex',
 *       subordinateClauses: Array<{ conjunction: string, charOffset: number }>,
 *       coordinatingJunctions: string[],
 *     }
 *   ],
 *   stats: {
 *     totalSentences: number,
 *     complexSentences: number,
 *     avgClausesPerSentence: number,
 *     allSubordinatingConjunctions: string[],
 *   }
 * }
 */

const {
  SUBORDINATING_DE,
  COORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_EN,
} = require('../../../loom-db/language/clause_connectors');

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/**
 * Zerlegt Text in einzelne Sätze (einfache Heuristik).
 * Teilt an `.`, `!`, `?` gefolgt von Leerzeichen und Großbuchstaben.
 *
 * @param {string} text
 * @returns {string[]}
 */
function splitSentences(text) {
  const src = String(text || '').trim();
  if (!src) return [];

  // Satzenden-Heuristik: Punkt/Ausrufe/Fragezeichen + Leerzeichen + Großbuchstabe
  const parts = src.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/u);
  return parts.map((s) => s.trim()).filter(Boolean);
}

/**
 * Findet alle unterordnenden Konjunktionen in einem Satz.
 *
 * @param {string} sentence
 * @param {Set<string>} conjunctionSet
 * @returns {Array<{ conjunction: string, charOffset: number }>}
 */
function findSubordinatingConjunctions(sentence, conjunctionSet) {
  const results = [];
  const lower = sentence.toLowerCase();

  for (const conj of conjunctionSet) {
    let searchFrom = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const idx = lower.indexOf(conj, searchFrom);
      if (idx === -1) break;

      // Wortgrenzen-Prüfung: Buchstabe davor und danach müssen Nicht-Wortzeichen sein
      const before = idx === 0 ? ' ' : lower[idx - 1];
      const after = idx + conj.length >= lower.length ? ' ' : lower[idx + conj.length];
      const isBoundaryBefore = /\W/.test(before);
      const isBoundaryAfter = /\W/.test(after);

      if (isBoundaryBefore && isBoundaryAfter) {
        results.push({ conjunction: conj, charOffset: idx });
      }
      searchFrom = idx + 1;
    }
  }

  // Sortiert nach Position
  results.sort((a, b) => a.charOffset - b.charOffset);
  return results;
}

/**
 * Findet alle beiordnenden Konjunktionen in einem Satz.
 *
 * @param {string} sentence
 * @param {Set<string>} conjunctionSet
 * @returns {string[]}
 */
function findCoordinatingJunctions(sentence, conjunctionSet) {
  const found = [];
  const lower = sentence.toLowerCase();

  for (const conj of conjunctionSet) {
    const idx = lower.indexOf(conj);
    if (idx === -1) continue;

    const before = idx === 0 ? ' ' : lower[idx - 1];
    const after = idx + conj.length >= lower.length ? ' ' : lower[idx + conj.length];
    if (/\W/.test(before) && /\W/.test(after)) {
      found.push(conj);
    }
  }

  return [...new Set(found)];
}

/**
 * Klassifiziert die Satzkomplexität basierend auf gefundenen Konjunktionen.
 *
 * @param {Array} subordinateClauses - gefundene unterordnende Konjunktionen
 * @param {string[]} coordinatingJunctions - gefundene beiordnende Konjunktionen
 * @returns {'simple'|'compound'|'complex'|'compound-complex'}
 */
function classifyComplexity(subordinateClauses, coordinatingJunctions) {
  const hasSub = subordinateClauses.length > 0;
  const hasCoord = coordinatingJunctions.length > 0;

  if (hasSub && hasCoord) return 'compound-complex';
  if (hasSub) return 'complex';
  if (hasCoord) return 'compound';
  return 'simple';
}

// ---------------------------------------------------------------------------
// Hauptfunktion
// ---------------------------------------------------------------------------

/**
 * Analysiert die Satz- und Teilsatzstruktur eines Textes.
 *
 * @param {string} text    - Eingabetext (normalisiert oder roh)
 * @param {string} [lang]  - 'de' (Standard) oder 'en'
 * @returns {{
 *   sentences: Array<{
 *     text: string,
 *     complexity: string,
 *     subordinateClauses: Array<{conjunction: string, charOffset: number}>,
 *     coordinatingJunctions: string[]
 *   }>,
 *   stats: {
 *     totalSentences: number,
 *     complexSentences: number,
 *     avgClausesPerSentence: number,
 *     allSubordinatingConjunctions: string[]
 *   }
 * }}
 */
function detectClauses(text, lang = 'de') {
  const langValue = String(lang || 'de').toLowerCase() === 'en' ? 'en' : 'de';
  const subConjSet = langValue === 'en' ? SUBORDINATING_EN : SUBORDINATING_DE;
  const coordConjSet = langValue === 'en' ? COORDINATING_EN : COORDINATING_DE;

  const sentences = splitSentences(String(text || ''));

  const analyzedSentences = sentences.map((sentText) => {
    const subordinateClauses = findSubordinatingConjunctions(sentText, subConjSet);
    const coordinatingJunctions = findCoordinatingJunctions(sentText, coordConjSet);
    const complexity = classifyComplexity(subordinateClauses, coordinatingJunctions);

    return {
      text: sentText,
      complexity,
      subordinateClauses,
      coordinatingJunctions,
    };
  });

  const complexSentences = analyzedSentences.filter(
    (s) => s.complexity === 'complex' || s.complexity === 'compound-complex'
  ).length;

  const totalClauseSegments = analyzedSentences.reduce(
    (sum, s) => sum + 1 + s.subordinateClauses.length,
    0
  );

  const allSubordinatingConjunctions = [
    ...new Set(
      analyzedSentences.flatMap((s) => s.subordinateClauses.map((c) => c.conjunction))
    ),
  ];

  return {
    sentences: analyzedSentences,
    stats: {
      totalSentences: analyzedSentences.length,
      complexSentences,
      avgClausesPerSentence:
        analyzedSentences.length > 0 ? totalClauseSegments / analyzedSentences.length : 0,
      allSubordinatingConjunctions,
    },
  };
}

module.exports = {
  detectClauses,
  splitSentences,
  SUBORDINATING_DE,
  COORDINATING_DE,
  SUBORDINATING_EN,
  COORDINATING_EN,
};
