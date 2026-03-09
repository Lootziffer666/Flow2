// pipeline.js
// Einstiegspunkt für die Korrektur-Pipeline

const { runNormalization } = require('./ruleEngine.js');
const { loadRules, addException, addContextRule } = require('./flowRulesStore');

function applyLearnedRules(text, rules) {
  const source = String(text ?? '');
  const normalizedKey = source.toLowerCase();

  if (rules.exceptions[normalizedKey]) {
    return rules.exceptions[normalizedKey];
  }

  const matchedContextRule = rules.contextRules.find((rule) =>
    normalizedKey.includes(rule.trigger.toLowerCase())
  );

  if (matchedContextRule) {
    return matchedContextRule.replace;
  }

  return runNormalization(source);
}

function runCorrection(text, options = {}) {
  const source = String(text ?? '');
  const rules = loadRules(options.rulesPath);
  const corrected = applyLearnedRules(source, rules);
  return { corrected };
}

function learnException(original, corrected, options = {}) {
  return addException(original, corrected, options.rulesPath);
}

function learnContextRule(trigger, replace, options = {}) {
  return addContextRule(trigger, replace, options.rulesPath);
}

module.exports = { runCorrection, learnException, learnContextRule };
