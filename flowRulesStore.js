const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_RULES_PATH = path.join(process.cwd(), 'flow_rules.json');

function emptyRules() {
  return { exceptions: {}, contextRules: [] };
}

function normalizeRules(data) {
  const safeData = data && typeof data === 'object' ? data : {};
  const exceptionsRaw = safeData.exceptions && typeof safeData.exceptions === 'object'
    ? safeData.exceptions
    : {};
  const contextRulesRaw = Array.isArray(safeData.contextRules) ? safeData.contextRules : [];

  const exceptions = Object.fromEntries(
    Object.entries(exceptionsRaw)
      .filter(([key, value]) => typeof key === 'string' && typeof value === 'string')
      .map(([key, value]) => [key.toLowerCase().trim(), value.trim()])
      .filter(([key, value]) => key && value)
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

function normalizeLanguage(lang) {
  const value = String(lang || 'de').toLowerCase();
  return value === 'en' ? 'en' : 'de';
}

function loadRaw(rulesPath = DEFAULT_RULES_PATH) {
  if (!rulesPath || !fs.existsSync(rulesPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(rulesPath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function loadRules(rulesPath = DEFAULT_RULES_PATH, language = 'de') {
  const lang = normalizeLanguage(language);
  const parsed = loadRaw(rulesPath);

  if (parsed.languages && typeof parsed.languages === 'object') {
    return normalizeRules(parsed.languages[lang]);
  }

  if (lang === 'de') return normalizeRules(parsed);
  return emptyRules();
}

function saveRulesForLanguage(rules, rulesPath = DEFAULT_RULES_PATH, language = 'de') {
  const lang = normalizeLanguage(language);
  const normalized = normalizeRules(rules);
  const targetDir = path.dirname(rulesPath);
  fs.mkdirSync(targetDir, { recursive: true });

  const parsed = loadRaw(rulesPath);
  const next = {
    languages: {
      de: emptyRules(),
      en: emptyRules(),
      ...(parsed.languages && typeof parsed.languages === 'object' ? parsed.languages : {}),
      [lang]: normalized,
    },
  };

  if (!parsed.languages && Object.keys(parsed).length > 0) {
    next.languages.de = normalizeRules(parsed);
  }

  fs.writeFileSync(rulesPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return normalized;
}

function addException(original, corrected, rulesPath = DEFAULT_RULES_PATH, language = 'de') {
  const rules = loadRules(rulesPath, language);
  const key = String(original ?? '').toLowerCase().trim();
  const value = String(corrected ?? '').trim();
  if (!key || !value) return rules;
  rules.exceptions[key] = value;
  return saveRulesForLanguage(rules, rulesPath, language);
}

function addContextRule(trigger, replace, rulesPath = DEFAULT_RULES_PATH, language = 'de') {
  const rules = loadRules(rulesPath, language);
  const normalizedRule = {
    trigger: String(trigger ?? '').trim(),
    replace: String(replace ?? '').trim(),
  };
  if (!normalizedRule.trigger || !normalizedRule.replace) return rules;

  rules.contextRules = [normalizedRule, ...rules.contextRules.filter((rule) =>
    !(rule.trigger.toLowerCase() === normalizedRule.trigger.toLowerCase() &&
      rule.replace.toLowerCase() === normalizedRule.replace.toLowerCase())
  )];

  return saveRulesForLanguage(rules, rulesPath, language);
}

module.exports = {
  DEFAULT_RULES_PATH,
  loadRules,
  addException,
  addContextRule,
  normalizeRules,
  normalizeLanguage,
};
