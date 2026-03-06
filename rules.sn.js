// SN – Syntaktische Normalisierung
// Wortgrenzen, Komposita, Konjunktionen

const SN_RULES = [
  { from: /\bgarnich\b/gi, to: 'gar nicht' },              // Kompositum-Trennung
  { from: /\bzuende\b/gi, to: 'zu Ende' },                 // Kompositum-Trennung
  { from: /\bweiter gegangen\b/gi, to: 'weitergegangen' }, // Verschmelzung
  { from: /\bhats\b/gi, to: 'hat es' },                    // Klitisierung
  { from: /\b(dachte|gemerkt)\s+das\b/gi, to: '$1, dass' }, // Konjunktion + Komma
];

module.exports = SN_RULES;
