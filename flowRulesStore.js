const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_RULES_PATH = path.join(process.cwd(), 'flow_rules.json');

function normalizeRules(data) {
  const safeData = data && typeof data === 'object' ? data : {};
  const exceptionsRaw = safeData.exceptions && typeof safeData.exceptions === 'object'
    ? safeData.exceptions
    : {};
  const contextRulesRaw = Array.isArray(safeData.contextRules) ? safeData.contextRules : [];

  const exceptions = Object.fromEntries(
    Object.entries(exceptionsRaw)
      .filter(([key, value]) => typeof key === 'string' && typeof value === 'string')
      .map(([key, value]) => [key.toLowerCase().trim(), value])
  );

  const contextRules = contextRulesRaw
    .filter((rule) => rule && typeof rule === 'object')
    .map((rule) => ({
      trigger: String(rule.trigger ?? rule.Trigger ?? '').trim(),
      replace: String(rule.replace ?? rule.Replace ?? '').trim(),
    }))
    .filter((rule) => rule.trigger && rule.replace);

  return { exceptions, contextRules };
}

function loadRules(rulesPath = DEFAULT_RULES_PATH) {
  if (!fs.existsSync(rulesPath)) {
    return { exceptions: {}, contextRules: [] };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    return normalizeRules(parsed);
  } catch {
    return { exceptions: {}, contextRules: [] };
  }
}

function saveRules(rules, rulesPath = DEFAULT_RULES_PATH) {
  const normalized = normalizeRules(rules);
  fs.writeFileSync(rulesPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
}

function addException(original, corrected, rulesPath = DEFAULT_RULES_PATH) {
  const rules = loadRules(rulesPath);
  const key = String(original ?? '').toLowerCase().trim();
  const value = String(corrected ?? '').trim();
  if (!key || !value) return rules;
  rules.exceptions[key] = value;
  return saveRules(rules, rulesPath);
}

function addContextRule(trigger, replace, rulesPath = DEFAULT_RULES_PATH) {
  const rules = loadRules(rulesPath);
  const normalizedRule = {
    trigger: String(trigger ?? '').trim(),
    replace: String(replace ?? '').trim(),
  };
  if (!normalizedRule.trigger || !normalizedRule.replace) return rules;

  rules.contextRules = [normalizedRule, ...rules.contextRules.filter((rule) =>
    !(rule.trigger.toLowerCase() === normalizedRule.trigger.toLowerCase() &&
      rule.replace.toLowerCase() === normalizedRule.replace.toLowerCase())
  )];

  return saveRules(rules, rulesPath);
}

module.exports = {
  DEFAULT_RULES_PATH,
  loadRules,
  saveRules,
  addException,
  addContextRule,
};
