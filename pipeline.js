// pipeline.js
// Einstiegspunkt für die Korrektur-Pipeline

const { runNormalizationWithMetadata } = require('./ruleEngine.js');
const {
  DEFAULT_RULES_PATH,
  loadRules,
  addException,
  addContextRule,
  normalizeLanguage,
} = require('./flowRulesStore');

const EMPTY_RULE_HITS = Object.freeze({
  SN: 0,
  SL: 0,
  MO: 0,
  PG: 0,
  total: 0,
});

function resolveRulesPath(options = {}) {
  return options.rulesPath || process.env.FLOW_RULES_PATH || DEFAULT_RULES_PATH;
}

function resolveLanguage(options = {}) {
  return normalizeLanguage(options.language || process.env.FLOW_LANGUAGE || 'de');
}

function getLearnedReplacement(text, rules) {
  const source = String(text ?? '').trim();
  const normalizedKey = source.toLowerCase();

  if (!normalizedKey) return null;

  if (rules.exceptions[normalizedKey]) {
    return {
      corrected: rules.exceptions[normalizedKey],
      source: 'exception',
    };
  }

  const matchedContextRule = rules.contextRules.find((rule) =>
    normalizedKey.includes(String(rule.trigger).toLowerCase())
  );

  if (matchedContextRule) {
    return {
      corrected: matchedContextRule.replace,
      source: 'context',
    };
  }

  return null;
}

function runCorrection(text, options = {}) {
  const source = String(text ?? '');
  if (!source.trim()) {
    return {
      corrected: '',
      rule_hits: { ...EMPTY_RULE_HITS },
      applied_learning: null,
      language: resolveLanguage(options),
    };
  }

  const rulesPath = resolveRulesPath(options);
  const language = resolveLanguage(options);
  const rules = loadRules(rulesPath, language);
  const learned = getLearnedReplacement(source, rules);

  if (learned) {
    return {
      corrected: learned.corrected,
      rule_hits: { ...EMPTY_RULE_HITS },
      applied_learning: learned.source,
      language,
    };
  }

  const normalized = runNormalizationWithMetadata(source, { language });
  return {
    corrected: normalized.corrected,
    rule_hits: normalized.rule_hits,
    applied_learning: null,
    language,
  };
}

function learnException(original, corrected, options = {}) {
  return addException(original, corrected, resolveRulesPath(options), resolveLanguage(options));
}

function learnContextRule(trigger, replace, options = {}) {
  return addContextRule(trigger, replace, resolveRulesPath(options), resolveLanguage(options));
}

module.exports = {
  runCorrection,
  learnException,
  learnContextRule,
  resolveRulesPath,
  resolveLanguage,
  EMPTY_RULE_HITS,
};
