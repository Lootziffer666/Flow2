// SN = syntaktische Normalisierung / Wortgrenzen und lokale Fügungen
const SN_RULES = [
  // Bekannte Zusammenschreibungen (Worttrennung)
  { from: /\bgarnich\b/gi,       to: 'gar nicht' },
  { from: /\bgarnicht\b/gi,      to: 'gar nicht' },
  { from: /\bgarkein\b/gi,       to: 'gar kein' },
  { from: /\bausversehen\b/gi,   to: 'aus Versehen' },
  { from: /\baufeinmal\b/gi,     to: 'auf einmal' },
  { from: /\bzuende\b/gi,        to: 'zu Ende' },
  { from: /\bzuhause\b/gi,       to: 'zu Hause' },
  { from: /\bnix\b/gi,           to: 'nichts' },

  // Falsch zusammengeschriebene Komposita
  { from: /\bweiter gegangen\b/gi, to: 'weitergegangen' },
  { from: /\brunter nemen\b/gi,    to: 'runternehmen' },
  { from: /\bhats\b/gi,            to: 'hat es' },

  // dass-Konjunktion nach Kognitions- und Kommunikationsverben
  // Einfaches Wortgrenzenmuster: (verb) das → (verb), dass
  { from: /\b(dachte|gemerkt|gesagt|gewusst|gehört|glaube|glaubte|merkte|wusste|hoffte|dachten)\s+das\b/gi, to: '$1, dass' },

  // Präpositionalgruppen mit großzuschreibendem Substantiv
  // 'hause' nach räumlicher Präposition ist immer Dativ von 'Haus'
  { from: /\b(nach|von|bei)\s+hause\b/gi, to: '$1 Hause' },

  // seit/seid-Verwechslung: 'Ihr seit' ist immer Fehler – 'seid' ist die korrekte Form
  { from: /\bIhr\s+seit\b/g, to: 'Ihr seid' },
];

module.exports = SN_RULES;
