const SN_RULES = require('./rules.sn');
const SL_RULES = require('./rules.sl');
const MO_RULES = require('./rules.mo');
const PG_RULES = require('./rules.pg');
const EN_RULES = require('./rules.en');

function countRuleMatches(text, regex) {
  if (regex.global) {
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  return regex.test(text) ? 1 : 0;
}

function applyRulesWithHits(text, rules) {
  return rules.reduce(
    (state, rule) => {
      const ruleHits = countRuleMatches(state.text, rule.from);
      return {
        text: state.text.replace(rule.from, rule.to),
        hits: state.hits + ruleHits,
      };
    },
    { text, hits: 0 }
  );
}

function applyRules(text, rules) {
  return applyRulesWithHits(text, rules).text;
}

function normalizeWhitespace(text) {
  return text
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(\S)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSentenceStarts(text, language = 'de') {
  const startLetters = language === 'en' ? 'a-z' : 'a-zäöü';
  const startRegex = new RegExp(`^\\s*([${startLetters}])`, language === 'en' ? '' : 'u');
  const innerRegex = new RegExp(`([.!?]\\s+)([${startLetters}])`, language === 'en' ? 'g' : 'gu');

  return text
    .replace(startRegex, (match, letter) =>
      match.replace(letter, letter.toUpperCase())
    )
    .replace(
      innerRegex,
      (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`
    );
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildEnglishRules(options = {}) {
  const presetName = options.enPreset || 'en-core-safe';
  const preset = EN_RULES.presets?.[presetName] || EN_RULES.presets?.['en-core-safe'] || { enabledContextRuleIds: [] };
  const enabledIds = new Set(preset.enabledContextRuleIds || []);

  const exceptionRules = Object.entries(EN_RULES.exceptions || {})
    .filter(([from, to]) => typeof from === 'string' && typeof to === 'string')
    .map(([from, to]) => ({
      from: new RegExp(`\\b${escapeRegex(from)}\\b`, 'gi'),
      to,
    }));

  const contextRules = (EN_RULES.contextRules || [])
    .filter((rule) => rule && rule.kind === 'regex_replace' && typeof rule.pattern === 'string')
    .filter((rule) => enabledIds.has(rule.id) || !rule.disabledByDefault)
    .map((rule) => ({
      from: new RegExp(rule.pattern, rule.flags || 'g'),
      to: rule.replacement,
    }));

  return [...exceptionRules, ...contextRules];
}

function runNormalizationWithMetadata(text = '', options = {}) {
  const source = String(text);
  const language = String(options.language || 'de').toLowerCase();

  if (language === 'en') {
    const compiledRules = buildEnglishRules(options);
    const enApplied = applyRulesWithHits(source, compiledRules);
    const corrected = normalizeWhitespace(enApplied.text);

    return {
      corrected,
      rule_hits: {
        EN: enApplied.hits,
        SN: 0,
        SL: 0,
        MO: 0,
        PG: 0,
        total: enApplied.hits,
      },
    };
  }

  const snApplied = applyRulesWithHits(source, SN_RULES);
  const slApplied = applyRulesWithHits(snApplied.text, SL_RULES);
  const moApplied = applyRulesWithHits(slApplied.text, MO_RULES);
  const pgApplied = applyRulesWithHits(moApplied.text, PG_RULES);

  const corrected = normalizeSentenceStarts(
    normalizeWhitespace(pgApplied.text),
    'de'
  );

  return {
    corrected,
    rule_hits: {
      EN: 0,
      SN: snApplied.hits,
      SL: slApplied.hits,
      MO: moApplied.hits,
      PG: pgApplied.hits,
      total: snApplied.hits + slApplied.hits + moApplied.hits + pgApplied.hits,
    },
  };
}

function runNormalization(text = '', options = {}) {
  return runNormalizationWithMetadata(text, options).corrected;
}

module.exports = {
  applyRules,
  normalizeWhitespace,
  normalizeSentenceStarts,
  runNormalization,
  runNormalizationWithMetadata,
  buildEnglishRules,
};
