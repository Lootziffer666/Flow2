'use strict';

/**
 * GR – Grammatik-Normalisierung
 *
 * LanguageTool-inspirierte Grammatikregeln für die deutsche Sprache.
 * Bildet die fünfte Pipelinestufe nach PG.
 *
 * Prinzip: nur Regeln, die deterministisch und für LRS-Texte hochrelevant sind.
 * Kein stochastisches Parsing, keine Modelle.
 *
 * Abgedeckte Fehlerklassen (vgl. LanguageTool DE-Kategorien):
 *   KOMMA_NEBENSATZ    – fehlendes Komma vor unterordnender Konjunktion
 *   APOSTROPH_GENITIV  – englisch-influenzierter Genitiv-Apostroph
 *   WORD_REPEAT        – Wortwiederholung bei Funktionswörtern
 *   GETRENNTSCHREIBUNG – falsch getrennte Komposita (Konnektoren)
 *   ALS_WIE            – redundantes „als wie" in Komparativen
 */

const GR_RULES = [
  // -----------------------------------------------------------------------
  // GETRENNTSCHREIBUNG – falsch getrennte Komposita und Konnektoren
  // Nach der Rechtschreibreform (1996/2006) sind folgende Formen normiert.
  // WICHTIG: Vor KOMMA_NEBENSATZ anwenden, damit „so dass" → „sodass"
  // erkannt wird, bevor die Komma-Regel ein Komma vor „dass" einfügt.
  // -----------------------------------------------------------------------
  {
    id: 'de-gr-sodass',
    from: /\bso\s+dass\b/gi,
    to: 'sodass',
    confidence: 0.95,
  },
  {
    id: 'de-gr-anstatt',
    from: /\ban\s+statt\b/gi,
    to: 'anstatt',
    confidence: 0.97,
  },
  {
    id: 'de-gr-aufgrund',
    from: /\bauf\s+[Gg]rund\b/g,
    to: 'aufgrund',
    confidence: 0.94,
  },
  {
    id: 'de-gr-mithilfe',
    from: /\bmit\s+[Hh]ilfe\b/g,
    to: 'mithilfe',
    confidence: 0.94,
  },
  {
    id: 'de-gr-zugunsten',
    from: /\bzu\s+[Gg]unsten\b/g,
    to: 'zugunsten',
    confidence: 0.94,
  },
  {
    id: 'de-gr-imstande',
    from: /\bim\s+[Ss]tande\b/g,
    to: 'imstande',
    confidence: 0.93,
  },
  {
    id: 'de-gr-instand',
    from: /\bin\s+[Ss]tand\b/g,
    to: 'instand',
    confidence: 0.92,
  },

  // -----------------------------------------------------------------------
  // KOMMA_NEBENSATZ
  // Fügt Komma vor unterordnender Konjunktion ein, wenn keines vorhanden.
  // Schritt 1: Komma überall hinzufügen (konservative Menge, hohe Konfidenz).
  // -----------------------------------------------------------------------
  {
    id: 'de-gr-komma-nebensatz',
    from: /([^\s,;:!?.()\[\]{}])(\s+)(dass|weil|obwohl|ob|wenn|falls|nachdem|bevor|sobald|solange|damit)\b/gi,
    to: '$1,$2$3',
    confidence: 0.88,
  },
  // Schritt 2: Überkorrektur entfernen, wenn eine beiordnende Konjunktion
  // unmittelbar vor der unterordnenden Konjunktion steht.
  // z. B. „und, wenn" → „und wenn"
  {
    id: 'de-gr-komma-nach-koordinator-undo',
    from: /\b(und|oder|aber|sondern|denn|weder|entweder),(\s+)(dass|weil|obwohl|ob|wenn|falls|nachdem|bevor|sobald|solange|damit)\b/gi,
    to: '$1$2$3',
    confidence: 0.99,
  },
  // Schritt 3: „auch wenn" bleibt ohne Komma.
  {
    id: 'de-gr-komma-nach-auch-undo',
    from: /\b(auch),(\s+)(dass|weil|obwohl|ob|wenn|falls|nachdem|bevor|sobald|solange|damit)\b/gi,
    to: '$1$2$3',
    confidence: 0.99,
  },

  // -----------------------------------------------------------------------
  // APOSTROPH_GENITIV
  // Deutsch nutzt keinen Apostroph im Genitiv: „Karls Buch" (korrekt),
  // „Karl's Buch" (falsch; englischer Einfluss).
  // Nur für großgeschriebene Namen, die NICHT auf s/z/x/ß enden.
  // -----------------------------------------------------------------------
  {
    id: 'de-gr-apostroph-genitiv',
    from: /\b([A-ZÄÖÜ][a-zäöü]*[^szxßSZX\s])'s\b/g,
    to: '$1s',
    confidence: 0.92,
  },

  // -----------------------------------------------------------------------
  // WORD_REPEAT
  // Wiederholung desselben Funktionsworts entfernen.
  // z. B. „die die Katze" → „die Katze"
  // Nur für eindeutige Funktionswörter (Artikel, Pronomina, Konjunktionen).
  // -----------------------------------------------------------------------
  {
    id: 'de-gr-word-repeat',
    from: /\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|und|oder|aber|ich|du|er|sie|es|wir|ihr|sie|auf|in|mit|von|zu|an|für|bei|nach|über|unter|vor|hinter|neben|zwischen)\s+\1\b/gi,
    to: '$1',
    confidence: 0.96,
  },

  // -----------------------------------------------------------------------
  // ALS_WIE – redundantes „als wie" im Komparativ
  // „größer als wie er" → „größer als er"
  // -----------------------------------------------------------------------
  {
    id: 'de-gr-als-wie',
    from: /\bals\s+wie\b/gi,
    to: 'als',
    confidence: 0.91,
  },
];

module.exports = GR_RULES;
