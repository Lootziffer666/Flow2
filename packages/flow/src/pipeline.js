'use strict';

const { runNormalizationWithMetadata } = require('./ruleEngine.js');
const {
  DEFAULT_RULES_PATH,
  loadRules,
  addException,
  addContextRule,
  normalizeLanguage,
} = require('./flowRulesStore');
const { errorProfile } = require('@loot/loom');

const EMPTY_RULE_HITS = Object.freeze({
  EN: 0,
  CTX: 0,
  SN: 0,
  SL: 0,
  MO: 0,
  PG: 0,
  GR: 0,
  PUNCT: 0,
  total: 0,
});

function asOptions(langOrOptions) {
  if (typeof langOrOptions === 'string') {
    return { language: langOrOptions };
  }

  return langOrOptions || {};
}

function resolveRulesPath(options = {}) {
  return options.rulesPath || process.env.FLOW_RULES_PATH || DEFAULT_RULES_PATH;
}

function resolveLanguage(langOrOptions) {
  const options = asOptions(langOrOptions);
  return normalizeLanguage(options.language || options.lang || process.env.FLOW_LANGUAGE || 'de');
}

function resolveEnPreset(options = {}) {
  return options.enPreset || process.env.FLOW_EN_PRESET || 'en-core-safe';
}

function getLearnedReplacement(text, rules) {
  const source = String(text ?? '').trim();
  const normalizedKey = source.toLowerCase();
  if (!normalizedKey) return null;

  if (rules.exceptions[normalizedKey]) {
    return { corrected: rules.exceptions[normalizedKey], source: 'exception' };
  }

  const matchedContextRule = rules.contextRules.find((rule) =>
    normalizedKey.includes(String(rule.trigger).toLowerCase())
  );

  if (matchedContextRule) {
    return { corrected: matchedContextRule.replace, source: 'context' };
  }

  return null;
}

function runCorrection(text, langOrOptions) {
  const source = String(text ?? '');
  const options = asOptions(langOrOptions);
  const language = resolveLanguage(options);

  if (!source.trim()) {
    return {
      corrected: '',
      rule_hits: { ...EMPTY_RULE_HITS },
      applied_learning: null,
      language,
      lang: language,
    };
  }

  const rulesPath = resolveRulesPath(options);
  const rules = loadRules(rulesPath, language);
  const learned = getLearnedReplacement(source, rules);

  if (learned) {
    return {
      corrected: learned.corrected,
      rule_hits: { ...EMPTY_RULE_HITS },
      applied_learning: learned.source,
      language,
      lang: language,
    };
  }

  const normalized = runNormalizationWithMetadata(source, {
    language,
    enPreset: resolveEnPreset(options),
  });

  return {
    corrected: normalized.corrected,
    rule_hits: normalized.rule_hits || { ...EMPTY_RULE_HITS },
    scope: normalized.scope || 'normalization',
    applied_stages: normalized.applied_stages || [],
    applied_learning: null,
    language,
    lang: language,
    loom_signals: normalized.loom_signals || null,
  };
}

function learnException(original, corrected, langOrOptions) {
  const options = asOptions(langOrOptions);
  return addException(
    original,
    corrected,
    resolveRulesPath(options),
    resolveLanguage(options)
  );
}

function learnContextRule(trigger, replace, langOrOptions) {
  const options = asOptions(langOrOptions);
  return addContextRule(
    trigger,
    replace,
    resolveRulesPath(options),
    resolveLanguage(options)
  );
}

module.exports = {
  runCorrection,
  learnException,
  learnContextRule,
  resolveRulesPath,
  resolveLanguage,
  resolveEnPreset,
  errorProfile,
  EMPTY_RULE_HITS,
};
