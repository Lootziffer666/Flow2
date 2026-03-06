// MO – Morphologische Normalisierung
// Stammprinzip, Flexion, Assimilation

const MO_RULES = [
  { from: /\birgentwie\b/gi, to: 'irgendwie' },   // Assimilation /d/ -> /t/
  { from: /\beigendlich\b/gi, to: 'eigentlich' },  // Assimilation /t/ -> /d/
  { from: /\berklert\b/gi, to: 'erklärt' },        // Umlaut-Auslassung
  { from: /\bgewessen\b/gi, to: 'gewesen' },       // Konsonantenverdopplung falsch
  { from: /\bwolte\b/gi, to: 'wollte' },           // Konsonantenverdopplung fehlt
];

module.exports = MO_RULES;
