// ruleEngine.js
// Deterministischer ZH1-Regelmotor: SN -> SL -> MO -> PG

const { SN_RULES } = require('./rules.sn.js');
const { SL_RULES } = require('./rules.sl.js');
const { MO_RULES } = require('./rules.mo.js');
const { PG_RULES } = require('./rules.pg.js');

function applyRules(text, rules) {
  return rules.reduce((acc, rule) => acc.replace(rule.from, rule.to), text);
}

function runNormalization(text) {
  let result = text;

  result = applyRules(result, SN_RULES);
  result = applyRules(result, SL_RULES);
  result = applyRules(result, MO_RULES);
  result = applyRules(result, PG_RULES);

  // Satzanfänge großschreiben (Textanfang + nach Satzzeichen)
  result = result.replace(
    /(^|[.!?]\s+)([a-zäöüß])/g,
    (m, before, char) => before + char.toUpperCase()
  );

  // Whitespace-Cleanup
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

module.exports = { runNormalization };
