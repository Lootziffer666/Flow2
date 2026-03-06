// SL – Syllabische Normalisierung
// Vokallänge, Silbenstruktur-Fehler (Einfügung, Auslassung, Vertauschung)

const SL_RULES = [
  { from: /\bvilleicht\b/gi, to: 'vielleicht' },  // Vokalvertauschung
  { from: /\bvieleicht\b/gi, to: 'vielleicht' },  // Vokaleinfügung
  { from: /\bwier\b/gi, to: 'wir' },              // Vokaleinfügung
  { from: /\bwolte\b/gi, to: 'wollte' },          // Konsonantenverdopplung fehlt
  { from: /\btrozdem\b/gi, to: 'trotzdem' },      // Konsonantenverdopplung fehlt
];

module.exports = SL_RULES;
