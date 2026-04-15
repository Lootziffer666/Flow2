'use strict';

/**
 * LOOM Marker-Sets
 *
 * Zentrale Listen für die Diagnose-Erkennung.
 * Können von Konsumenten überschrieben werden (markers-Argument in diagnoseChunks).
 */

/** Selbstreferenz-Marker (für performativ_instabil) */
const META_MARKERS_DEFAULT = [
  // Deutsch
  'satz', 'sprache', 'bedeutung', 'wahrheit', 'ausdruck', 'aussage', 'wort',
  // Englisch
  'sentence', 'language', 'meaning', 'truth', 'expression', 'statement', 'word',
];

/** Negations-/Nullifikations-Marker (für performativ_instabil) */
const NULL_MARKERS_DEFAULT = [
  // Deutsch
  'schweigt', 'zerfällt', 'verpufft', 'unlesbar', 'ohne bedeutung', 'schweigen',
  'bedeutungslos', 'ungültig', 'nichtig', 'leer',
  // Englisch
  'meaningless', 'invalid', 'empty', 'void', 'null', 'silence', 'dissolves',
];

/** Negations-Marker für Polarität (für konfliktaer & normativ_selbstannullierend) */
const NEGATIVE_POLARITY_DEFAULT = [
  // Deutsch
  'nicht', 'kein', 'nie', 'niemals', 'verweigert', 'scheitert',
  'unmöglich', 'falsch', 'schlecht', 'untragbar', 'ablehnt', 'versagt',
  // Englisch
  'not', 'no', 'never', 'refuses', 'fails', 'impossible',
  'wrong', 'bad', 'unacceptable', 'rejects', 'denies',
];

/** Marker für normativ_selbstannullierend */
const NORM_NEGATORS_DEFAULT = [
  // Deutsch
  'nicht gültig', 'nichtig', 'ohne grundlage', 'existiert nicht',
  'keinerlei gültigkeit', 'keine regeln', 'ohne wert', 'bedeutungslos',
  // Englisch
  'not valid', 'void', 'no basis', 'does not exist', 'no validity',
  'no rules', 'no value', 'meaningless',
];

module.exports = {
  META_MARKERS_DEFAULT,
  NULL_MARKERS_DEFAULT,
  NEGATIVE_POLARITY_DEFAULT,
  NORM_NEGATORS_DEFAULT,
};
