// pipeline.js
// Einstiegspunkt für die Korrektur-Pipeline

const { runNormalizationWithMetadata } = require('./ruleEngine.js');

function runCorrection(text) {
  const { corrected, rule_hits } = runNormalizationWithMetadata(text);
  return { corrected, rule_hits };
}

module.exports = { runCorrection };
