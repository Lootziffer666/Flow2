// SN = syntaktische Normalisierung / Wortgrenzen und lokale Fügungen
const SN_RULES = [
  { from: /\bgarnich\b/gi, to: 'gar nicht' },
  { from: /\bgarnicht\b/gi, to: 'gar nicht' },
  { from: /\bgarkein\b/gi, to: 'gar kein' },
  { from: /\bausversehen\b/gi, to: 'aus Versehen' },
  { from: /\bzuende\b/gi, to: 'zu Ende' },
  { from: /\bzuhause\b/gi, to: 'zu Hause' },
  { from: /\b(vor)\s+zugehen\b/gi, to: '$1 zu gehen' },
  { from: /\brunter nemen\b/gi, to: 'runternehmen' },
  { from: /\bweiter gegangen\b/gi, to: 'weitergegangen' },
  { from: /\bhats\b/gi, to: 'hat es' },
  { from: /\b(dachte|gemerkt)\s+das\b/gi, to: '$1, dass' },
  { from: /\bnix\b/gi, to: 'nichts' },
];

module.exports = SN_RULES;
