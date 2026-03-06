// SL = syllabische Ebene / Silbenstruktur, Vokalfolgen, Schärfung
const SL_RULES = [
  { from: /\bvilleicht\b/gi, to: 'vielleicht' },
  { from: /\bvieleicht\b/gi, to: 'vielleicht' },
  { from: /\bwier\b/gi, to: 'wir' },
  { from: /\bwolte\b/gi, to: 'wollte' },
  { from: /\btrozdem\b/gi, to: 'trotzdem' },
];

module.exports = SL_RULES;
