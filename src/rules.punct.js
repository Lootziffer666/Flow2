'use strict';

/**
 * PUNCT – Typografische Interpunktions-Normalisierung
 *
 * LanguageTool-inspirierte Interpunktionsregeln.
 * Bildet die erste Pipelinestufe (vor SN/SL/MO/PG/GR).
 *
 * Prinzip: Rein formale Zeichenebene, kein linguistisches Parsing nötig.
 * Regeln mit `lang: 'both'` gelten für DE und EN.
 * Regeln mit `lang: 'de'` gelten nur für die deutsche Pipeline.
 *
 * Abgedeckte Fehlerklassen (vgl. LanguageTool TYPOGRAPHY-Kategorie):
 *   ANFÜHRUNGSZEICHEN_DE  – deutsche Anführungszeichen „..." statt "..."
 *   AUSLASSUNGSZEICHEN    – typografisches Auslassungszeichen … statt ...
 *   GEDANKENSTRICH        – typografischer Gedankenstrich – statt --
 *   LEERZEICHEN_DOPPELT   – mehrere aufeinanderfolgende Leerzeichen
 */

const PUNCT_RULES = [
  // -----------------------------------------------------------------------
  // ANFÜHRUNGSZEICHEN_DE
  // Deutsche Anführungszeichen: "Text" → „Text"
  // Nur in ungeschützten Textbereichen (Code in Backticks bleibt unberührt).
  // Maximale Länge 300 Zeichen – verhindert Backtracking über Absätze.
  // lang: 'de' – englische Texte benutzen " " (nicht „ ")
  // -----------------------------------------------------------------------
  {
    id: 'de-punct-anfuehrungszeichen',
    lang: 'de',
    from: /"([^"\n]{1,300})"/g,
    to: '„$1"',
    confidence: 0.90,
  },

  // -----------------------------------------------------------------------
  // AUSLASSUNGSZEICHEN
  // Drei aufeinanderfolgende Punkte → typografisches Auslassungszeichen.
  // Gilt für DE und EN; URLs/Code sind bereits durch Protected Spans gesichert.
  // -----------------------------------------------------------------------
  {
    id: 'universal-punct-ellipsis',
    lang: 'both',
    from: /\.{3}/g,
    to: '…',
    confidence: 0.95,
  },

  // -----------------------------------------------------------------------
  // GEDANKENSTRICH (doppelter Bindestrich)
  // Schreibmaschinen-Ersatz „--" → typografischer Gedankenstrich „–"
  // Leerzeichen um den Strich bleiben erhalten ($1, $2).
  // -----------------------------------------------------------------------
  {
    id: 'universal-punct-em-dash-double',
    lang: 'both',
    from: /(\s)--(\s)/g,
    to: '$1–$2',
    confidence: 0.95,
  },
  // Einzelner Bindestrich mit Leerzeichen als Gedankenstrich
  // Nur wenn zwischen zwei Wörtern: „Wort - Wort" → „Wort – Wort"
  {
    id: 'universal-punct-em-dash-single',
    lang: 'both',
    from: /(\w) - (\w)/g,
    to: '$1 – $2',
    confidence: 0.85,
  },
];

/**
 * Gibt die PUNCT-Regeln für eine bestimmte Sprache zurück.
 * Regeln mit `lang: 'both'` gelten für alle Sprachen.
 *
 * @param {string} lang - 'de' oder 'en'
 * @returns {{ from: RegExp, to: string }[]}
 */
function getPunctRules(lang) {
  const langValue = String(lang || 'de').toLowerCase() === 'en' ? 'en' : 'de';
  return PUNCT_RULES.filter(
    (rule) => !rule.lang || rule.lang === 'both' || rule.lang === langValue
  );
}

module.exports = PUNCT_RULES;
module.exports.getPunctRules = getPunctRules;
