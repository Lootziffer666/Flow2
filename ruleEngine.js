const SN_RULES = require('./rules.sn');
const SL_RULES = require('./rules.sl');
const MO_RULES = require('./rules.mo');
const PG_RULES = require('./rules.pg');

function applyRules(text, rules) {
  return rules.reduce((currentText, rule) => currentText.replace(rule.from, rule.to), text);
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

function runNormalization(text = '') {
  const source = String(text);
  const snApplied = applyRules(source, SN_RULES);
  const slApplied = applyRules(snApplied, SL_RULES);
  const moApplied = applyRules(slApplied, MO_RULES);
  const pgApplied = applyRules(moApplied, PG_RULES);

  return normalizeSentenceStarts(normalizeWhitespace(pgApplied));
}

module.exports = {
  applyRules,
  runNormalization,
};
