// SL = syllabische Ebene / Silbenstruktur, Vokalfolgen, Schärfung
const SL_RULES = [
  // Vokalfolgen / Vokalqualität
  { from: /\bvilleicht\b/gi,  to: 'vielleicht' },
  { from: /\bvieleicht\b/gi,  to: 'vielleicht' },
  { from: /\bvileicht\b/gi,   to: 'vielleicht' },
  { from: /\bwier\b/gi,       to: 'wir' },

  // Fehlende Schärfung / Doppelkonsonant
  { from: /\bwolte\b/gi,      to: 'wollte' },
  { from: /\btrozdem\b/gi,    to: 'trotzdem' },
  { from: /\bdan\b/gi,        to: 'dann' },
  { from: /\bgebrant\b/gi,    to: 'gebrannt' },
  { from: /\bmuste\b/gi,      to: 'musste' },
  { from: /\bmusten\b/gi,     to: 'mussten' },
  { from: /\bmanchma\b/gi,    to: 'manchmal' },

  // Fehlender Konsonant am Wortende
  { from: /\bobwol\b/gi,      to: 'obwohl' },

  // Konjunktions-Doppelkonsonant: wen → wenn
  // (LRS-typische Verwechslung; Risiko: Akkusativ 'wen' – selten im Kindertext)
  { from: /\bwen\b/gi,        to: 'wenn' },
];

module.exports = SL_RULES;
