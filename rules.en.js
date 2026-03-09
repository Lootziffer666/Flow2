const RULES_EN = [
  { from: /\bteh\b/gi, to: 'the' },
  { from: /\brecieve\b/gi, to: 'receive' },
  { from: /\bseperate\b/gi, to: 'separate' },
  { from: /\bdefinately\b/gi, to: 'definitely' },
  { from: /\boccured\b/gi, to: 'occurred' },
  { from: /\bcoudl\b/gi, to: 'could' },
  { from: /\bwoudl\b/gi, to: 'would' },
  { from: /\bshoudl\b/gi, to: 'should' },
  { from: /\bdont\b/gi, to: "don't" },
  { from: /\bcant\b/gi, to: "can't" },
];

module.exports = RULES_EN;
