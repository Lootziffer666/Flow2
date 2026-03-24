'use strict';

/**
 * Kölner Phonetik (Cologne Phonetics) – Hans Postel, 1969
 *
 * Deterministischer Algorithmus zur phonetischen Kodierung deutschsprachiger
 * Zeichenketten. Ähnliche Wörter (insbesondere lautnahe LRS-Verwechslungen)
 * erhalten denselben Code.
 *
 * Anwendungsfall in FLOW:
 *   Die PG-Stufe (Phonem-Graphem-Korrespondenz) adressiert Fehler wie
 *   "ferig" → "fertig" oder "gelsen" → "gelesen".
 *   Mit der Kölner Phonetik kann geprüft werden, ob ein unbekanntes Wort
 *   phonetisch zu einem bekannten Wort passt – ohne ML, vollständig lokal
 *   und deterministisch.
 *
 *   Hinweis: Elisionsfehler (Auslassung eines Phonems wie in "ferig" → "fertig")
 *   ergeben unterschiedliche Codes (374 vs. 3724), aber einen langen gemeinsamen
 *   Präfix, der von `findPhoneticMatch` ausgewertet wird.
 *   Homophone-Fehler wie "gelsen" ↔ "gelesen" oder "weis" ↔ "weiß" ergeben
 *   identische Codes.
 *
 * Referenz: H. Postel, "Die Kölner Phonetik", IBM-Nachrichten 19 (1969), S. 925–931.
 */

// Vokal-Menge (für Kontext-Prüfungen)
const VOWELS = new Set(['A', 'E', 'I', 'J', 'O', 'U', 'Y']);

// Buchstaben, nach denen C als /s/ gilt (→ Code 8)
const C_SOFT_AFTER = new Set(['S', 'Z']);

// Buchstaben, vor denen C als /k/ gilt (→ Code 4)
const C_HARD_BEFORE = new Set(['A', 'H', 'K', 'L', 'O', 'Q', 'R', 'U', 'X']);

/**
 * Normalisiert einen Buchstaben auf seine Basis-Form für die Phonetik:
 * Ä→AE, Ö→OE, Ü→UE, ß→SS, PH→F (als Vorverarbeitung).
 */
function normalizeUmlauts(text) {
  return String(text)
    .toUpperCase()
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .replace(/ß/g, 'SS')
    .replace(/PH/g, 'FF'); // PH → FF (beide → Code 3)
}

/**
 * Gibt den Kölner-Phonetik-Code für einen einzelnen Buchstaben zurück,
 * abhängig vom Vorgänger- und Nachfolger-Buchstaben.
 *
 * @param {string} ch       - Aktueller Buchstabe (Großbuchstabe)
 * @param {string} prev     - Vorgänger-Buchstabe ('' wenn Wortanfang)
 * @param {string} next     - Nachfolger-Buchstabe ('' wenn Wortende)
 * @returns {string|null}   - Einstelliger Code oder null (→ Zeichen wird ignoriert)
 */
function charCode(ch, prev, next) {
  if (VOWELS.has(ch)) return '0';
  if (ch === 'H') return null; // stumm

  switch (ch) {
    case 'B':
      return '1';
    case 'P':
      return next === 'H' ? '3' : '1'; // PH → 3 (aber PH wurde schon zu FF normalisiert)
    case 'D':
    case 'T':
      return (next === 'C' || next === 'S' || next === 'Z') ? '8' : '2';
    case 'F':
    case 'V':
    case 'W':
      return '3';
    case 'G':
    case 'K':
    case 'Q':
      return '4';
    case 'C': {
      // Am Wortanfang: C vor A, H, K, L, O, Q, R, U, X → 4
      // Nach S oder Z: → 8
      // Vor A, H, K, O, Q, U, X: → 4
      // Sonst: → 8
      if (C_SOFT_AFTER.has(prev)) return '8';
      if (prev === '' || C_HARD_BEFORE.has(next)) return '4';
      return '8';
    }
    case 'X':
      // Nach C, K, Q → 8; sonst → 48
      return (prev === 'C' || prev === 'K' || prev === 'Q') ? '8' : '48';
    case 'L':
      return '5';
    case 'M':
    case 'N':
      return '6';
    case 'R':
      return '7';
    case 'S':
    case 'Z':
      return '8';
    default:
      return null; // Sonderzeichen, Ziffern etc. ignorieren
  }
}

/**
 * Kodiert einen deutschen Begriff nach der Kölner Phonetik.
 *
 * @param {string} word - Eingabe (beliebige Groß-/Kleinschreibung, Umlaute erlaubt)
 * @returns {string}    - Phonetik-Code (z. B. "657" für "Müller")
 */
function kölnerPhonetik(word) {
  if (!word || typeof word !== 'string') return '';

  const normalized = normalizeUmlauts(word.trim());
  if (!normalized) return '';

  const chars = [...normalized]; // korrekte Iteration über Multibyte-Zeichen
  const raw = [];

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const prev = i === 0 ? '' : chars[i - 1];
    const next = i < chars.length - 1 ? chars[i + 1] : '';
    const code = charCode(ch, prev, next);
    if (code !== null) raw.push(...code); // 'X' außerhalb von CKQ → '4','8'
  }

  if (!raw.length) return '';

  // Schritt 1: Aufeinanderfolgende gleiche Codes zusammenfassen (deduplication)
  const deduped = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    if (raw[i] !== deduped[deduped.length - 1]) {
      deduped.push(raw[i]);
    }
  }

  // Schritt 2: Alle '0' (Vokale) entfernen – außer am Wortanfang
  const first = deduped[0];
  const rest = deduped.slice(1).filter((c) => c !== '0');

  return first === '0' ? ['0', ...rest].join('') : [first, ...rest].join('');
}

/**
 * Prüft, ob zwei Wörter phonetisch äquivalent sind (gleicher Kölner-Code).
 *
 * @param {string} a - Erstes Wort
 * @param {string} b - Zweites Wort
 * @returns {boolean}
 */
function phoneticallyEqual(a, b) {
  const codeA = kölnerPhonetik(a);
  const codeB = kölnerPhonetik(b);
  return codeA !== '' && codeB !== '' && codeA === codeB;
}

/**
 * Gibt aus einer Kandidatenliste das Wort zurück, das phonetisch identisch
 * zur Eingabe ist (gleicher Kölner-Code). Elisionsfehler (fehlende Phoneme)
 * ergeben unterschiedliche Codes und werden von dieser Funktion nicht abgedeckt;
 * dafür sind die direkten PG-Regeln in `rules.pg.js` zuständig.
 *
 * @param {string}   input      - Unbekanntes / falsch geschriebenes Wort
 * @param {string[]} candidates - Liste bekannter korrekter Wörter
 * @returns {string|null}       - Erster Kandidat mit identischem Code oder null
 */
function findPhoneticMatch(input, candidates) {
  if (!input || !Array.isArray(candidates) || candidates.length === 0) return null;

  const inputCode = kölnerPhonetik(input);
  if (!inputCode) return null;

  for (const candidate of candidates) {
    const candidateCode = kölnerPhonetik(candidate);
    if (candidateCode && candidateCode === inputCode) return candidate;
  }

  return null;
}

module.exports = {
  kölnerPhonetik,
  phoneticallyEqual,
  findPhoneticMatch,
};
