const SN_RULES = require('./rules.sn');
const SL_RULES = require('./rules.sl');
const MO_RULES = require('./rules.mo');
const PG_RULES = require('./rules.pg');

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

function normalizeSentenceStarts(text) {
  return text
    .replace(/^\s*([a-zäöü])/u, (match, letter) => match.replace(letter, letter.toUpperCase()))
    .replace(/([.!?]\s+)([a-zäöü])/gu, (match, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

// ZH1-MVP: deterministische Reihenfolge ohne Scoring.
function runNormalizationWithMetadata(text = '') {
  const source = String(text);

  const snApplied = applyRulesWithHits(source, SN_RULES);
  const slApplied = applyRulesWithHits(snApplied.text, SL_RULES);
  const moApplied = applyRulesWithHits(slApplied.text, MO_RULES);
  const pgApplied = applyRulesWithHits(moApplied.text, PG_RULES);

  const corrected = normalizeSentenceStarts(normalizeWhitespace(pgApplied.text));

  return {
    corrected,
    rule_hits: {
      SN: snApplied.hits,
      SL: slApplied.hits,
      MO: moApplied.hits,
      PG: pgApplied.hits,
    },
  };
}

function runNormalization(text = '') {
  return runNormalizationWithMetadata(text).corrected;
}

module.exports = {
  applyRules,
  runNormalization,
  runNormalizationWithMetadata,
};
