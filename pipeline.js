// pipeline.js
// Einstiegspunkt für die Korrektur-Pipeline

const { runNormalization } = require('./ruleEngine.js');

function runCorrection(text) {
  const corrected = runNormalization(text);
  return { corrected };
}

module.exports = { runCorrection };
