// PG – Phonem-Graphem-Korrespondenz
// Phonetisch motivierte Schreibweisen

const PG_RULES = [
  { from: /\bgelsen\b/gi, to: 'gelesen' },  // Vokal-Auslassung
  { from: /\bferig\b/gi, to: 'fertig' },    // Konsonant-Auslassung
  { from: /\bweis\b/gi, to: 'weiß' },       // ss/s-Ersatz
  { from: /\bnich\b/gi, to: 'nicht' },      // Auslaut-Auslassung
  { from: /\bhab\b/gi, to: 'habe' },        // Endsilben-Auslassung
];

module.exports = PG_RULES;
