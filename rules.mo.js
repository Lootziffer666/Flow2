const MO_RULES = [
  { from: /\birgentwie\b/gi, to: 'irgendwie' },
  { from: /\beigendlich\b/gi, to: 'eigentlich' },
  { from: /\berklert\b/gi, to: 'erklärt' },
  { from: /\bgewessen\b/gi, to: 'gewesen' },
  { from: /\bwolte\b/gi, to: 'wollte' },
];

module.exports = MO_RULES;
