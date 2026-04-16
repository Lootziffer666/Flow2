// MO = morphologische Normalisierung / Stammprinzip und Flexionsformen
const MO_RULES = [
  // nd/nt-Verwechslung im Wortstamm
  { from: /\birgentwie\b/gi,   to: 'irgendwie' },
  { from: /\birgentwann\b/gi,  to: 'irgendwann' },
  { from: /\beigendlich\b/gi,  to: 'eigentlich' },

  // Konsonantenkombinationen / Stammschreibung
  { from: /\berklert\b/gi,     to: 'erklärt' },
  { from: /\bgewessen\b/gi,    to: 'gewesen' },
  { from: /\banderst\b/gi,     to: 'anders' },
  { from: /\babents\b/gi,      to: 'abends' },
  { from: /\bdrausen\b/gi,     to: 'draußen' },

  // wider/wieder: häufige LRS-Verwechslung; "wider" ist gültiges Wort (gegen),
  // im Kindertext aber fast ausschließlich Fehler für "wieder"
  { from: /\bwider\b/gi,       to: 'wieder' },

  // Fallback Doppelkonsonant (SL läuft zuerst, MO fängt verbleibende Fälle)
  { from: /\bwolte\b/gi,       to: 'wollte' },
];

module.exports = MO_RULES;
