const PG_RULES = [
  { from: /\bgelsen\b/gi, to: 'gelesen' },
  { from: /\bferig\b/gi, to: 'fertig' },
  { from: /\bweis\b/gi, to: 'weiß' },
  { from: /\bnich\b/gi, to: 'nicht' },
  { from: /\bhab\b/gi, to: 'habe' },
];

module.exports = PG_RULES;
