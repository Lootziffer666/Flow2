// SN = Syntaktische Normalisierung
// Wortgrenzen, Komposita, Konjunktionen auf Phrasenebene

const SN_RULES = [
  { from: /\bgarnich\b/gi, to: "gar nicht" },
  { from: /\bzuende\b/gi, to: "zu Ende" },
  { from: /\bweiter gegangen\b/gi, to: "weitergegangen" },
  { from: /\bhats\b/gi, to: "hat es" },
  { from: /\b(dachte|gemerkt)\s+das\b/gi, to: "$1, dass" },
];

module.exports = { SN_RULES };
