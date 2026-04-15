'use strict';

const SN_RULES = require('./rules.sn');
const SL_RULES = require('./rules.sl');
const MO_RULES = require('./rules.mo');
const PG_RULES = require('./rules.pg');
const EN_RULES = require('./rules.en');
const { getPunctRules } = require('./rules.punct');

// Shared engine (@loot/loom)
const {
  GR_RULES,
  contextWindowRules: CONTEXT_RULES,
  detectClauses,
} = require('@loot/loom');

// Protected Spans (Code, Pfade, Namen, UI-Labels etc.)
const PROTECTED_PATTERNS = [
  /`[^`]+`/g,
  /\b[A-Z]{2,}[A-Za-z0-9_]*\b/g,
  /\bhttps?:\/\/[^\s]+/g,
  /\b[A-Za-z0-9._%+-]+@[^\s]+/g,
];

function tokenize(text) {
  return String(text)
    .split(/(\s+|[.,;:!?()])/)
    .filter((token) => token.trim() !== '');
}

function isProtected(token) {
  if (!token) return false;
  return PROTECTED_PATTERNS.some((pattern) => {
    const local = new RegExp(pattern.source, pattern.flags);
    return local.test(token);
  });
}

function getProtectedSpans(text) {
  const spans = [];

  for (const pattern of PROTECTED_PATTERNS) {
    const local = new RegExp(pattern.source, pattern.flags);
    let match = local.exec(text);
    while (match) {
      spans.push({ start: match.index, end: match.index + match[0].length });
      if (!local.global) break;
      match = local.exec(text);
    }
  }

  spans.sort((a, b) => a.start - b.start);

  // merge overlaps
  const merged = [];
  for (const span of spans) {
    if (!merged.length || span.start > merged[merged.length - 1].end) {
      merged.push({ ...span });
      continue;
    }
    merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, span.end);
  }

  return merged;
}

function applyRulesWithHits(text, rules) {
  let result = String(text);
  let hits = 0;

  for (const rule of rules || []) {
    const from = rule.from || rule.pattern;
    const to = rule.to ?? rule.replacement;
    if (!(from instanceof RegExp) || typeof to === 'undefined') continue;

    const before = result;
    result = result.replace(from, to);
    if (result !== before) hits += 1;
  }

  return { text: result, hits };
}

function applyRulesToUnprotectedText(text, rules) {
  const source = String(text);
  const spans = getProtectedSpans(source);

  if (!spans.length) return applyRulesWithHits(source, rules);

  let cursor = 0;
  let hits = 0;
  let output = '';

  for (const span of spans) {
    const unprotectedChunk = source.slice(cursor, span.start);
    const applied = applyRulesWithHits(unprotectedChunk, rules);
    output += applied.text;
    hits += applied.hits;

    output += source.slice(span.start, span.end);
    cursor = span.end;
  }

  const tail = source.slice(cursor);
  const tailApplied = applyRulesWithHits(tail, rules);
  output += tailApplied.text;
  hits += tailApplied.hits;

  return { text: output, hits };
}


function normalizeWhitespace(text) {
  return String(text)
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(\S)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSentenceStarts(text, lang = 'de') {
  if (lang === 'en') {
    return String(text)
      .replace(/^\s*([a-z])/g, (match, ch) => match.replace(ch, ch.toUpperCase()))
      .replace(/([.!?]\s+)([a-z])/g, (match, prefix, ch) => `${prefix}${ch.toUpperCase()}`);
  }

  return String(text)
    .replace(/^\s*([a-zäöü])/u, (match, ch) => match.replace(ch, ch.toUpperCase()))
    .replace(/([.!?]\s+)([a-zäöü])/gu, (match, prefix, ch) => `${prefix}${ch.toUpperCase()}`);
}

function buildEnglishLexicalRules() {
  const exceptions = EN_RULES.exceptions || {};

  return Object.entries(exceptions)
    .filter(([from, to]) => typeof from === 'string' && typeof to === 'string')
    .map(([from, to]) => ({
      from: new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
      to,
    }));
}


function buildEnglishPresetContextRules(options = {}) {
  const enPreset = options.enPreset || 'en-core-safe';
  const enabledIds = new Set((EN_RULES.presets?.[enPreset]?.enabledContextRuleIds) || []);

  return (EN_RULES.contextRules || [])
    .filter((rule) => rule && rule.kind === 'regex_replace' && typeof rule.pattern === 'string')
    .filter((rule) => enabledIds.has(rule.id) || rule.disabledByDefault !== true)
    .map((rule) => ({
      id: rule.id,
      lang: 'en',
      pattern: new RegExp(rule.pattern, rule.flags || 'g'),
      replacement: rule.replacement,
    }));
}

/**
 * Baut die aktive Menge an Context-Window-Regeln auf.
 *
 * Wenn LOOM-Signale vorliegen (loomSignals), wird die Confidence-Schwelle
 * angepasst: bei strukturell fragmentierten oder überladenen Sätzen werden
 * unsichere Kontext-Regeln ausgeblendet (Minimum-Confidence steigt).
 *
 * @param {string} lang
 * @param {object} options
 * @param {object|null} loomSignals  - Ergebnis von flowSignals(), optional
 */
function buildContextRules(lang, options = {}, loomSignals = null) {
  const langValue = String(lang || 'de').toLowerCase();
  const minConf = confidenceThresholdFor(options.confidenceHint);

  // Minimum confidence for context rules; raised when LOOM signals low confidence
  let minConfidence = 0;
  if (loomSignals) {
    if (loomSignals.confidenceHint === 'low')    minConfidence = 0.90;
    else if (loomSignals.confidenceHint === 'medium') minConfidence = 0.70;
    // 'high' → keep all rules (minConfidence = 0)
  }

  const baseContext = CONTEXT_RULES
    .filter((rule) => rule && (rule.lang === langValue || rule.lang === 'both'))
    .filter((rule) => rule.disabledByDefault !== true)
    .filter((rule) => (rule.confidence ?? 1.0) >= minConfidence);

  if (langValue !== 'en') return baseContext;

  const enPresetContext = buildEnglishPresetContextRules(options);
  return [...baseContext, ...enPresetContext.filter((rule) => (rule.confidence ?? 1.0) >= minConf)];
}

function runMultiTokenNormalization(text, langOrOptions = 'de', maybeOptions = {}) {
  const source = String(text || '');
  const lang = typeof langOrOptions === 'string'
    ? langOrOptions
    : (langOrOptions.language || 'de');
  const options = typeof langOrOptions === 'string'
    ? maybeOptions
    : langOrOptions;

  const normalizedLang = String(lang || 'de').toLowerCase() === 'en' ? 'en' : 'de';

  // LOOM structural analysis — informs context-rule confidence gating
  let loomSignals = null;
  if (source.trim()) {
    try {
      const diagResult = diagnoseText(source, normalizedLang);
      loomSignals = flowSignals(diagResult, normalizedLang);
    } catch (_) {
      // LOOM signals are advisory; never let them block normalization
    }
  }

  // Tokenization retained for possible diagnostics/extensions.
  tokenize(source).forEach((token) => {
    isProtected(token);
  });

  // Compute LOOM structural signals for confidence-gated context rules.
  let loomDiag = null;
  let loomSig = null;
  try {
    loomDiag = diagnoseText(source, normalizedLang);
    loomSig = flowSignals(loomDiag, normalizedLang);
  } catch (_) {
    // LOOM signals are best-effort; never block normalization.
  }
  const enrichedOptions = loomSig
    ? { ...options, confidenceHint: loomSig.confidenceHint }
    : options;

  if (normalizedLang === 'de') {
    const punct = applyRulesToUnprotectedText(source, getPunctRules('de'));

    const deContextRules = buildContextRules('de', options, loomSignals);
    const deContext = applyRulesToUnprotectedText(punct.text, deContextRules);

    const sn = applyRulesToUnprotectedText(deContext.text, SN_RULES);
    const sl = applyRulesToUnprotectedText(sn.text, SL_RULES);
    const mo = applyRulesToUnprotectedText(sl.text, MO_RULES);
    const pg = applyRulesToUnprotectedText(mo.text, PG_RULES);
    const gr = applyRulesToUnprotectedText(pg.text, GR_RULES);

    const corrected = normalizeSentenceStarts(normalizeWhitespace(gr.text), 'de');

    return {
      corrected,
      scope: 'normalization',
      applied_stages: ['PUNCT', 'CTX', 'SN', 'SL', 'MO', 'PG', 'GR'],
      rule_hits: {
        EN: 0,
        CTX: deContext.hits,
        SN: sn.hits,
        SL: sl.hits,
        MO: mo.hits,
        PG: pg.hits,
        GR: gr.hits,
        PUNCT: punct.hits,
        total: punct.hits + deContext.hits + sn.hits + sl.hits + mo.hits + pg.hits + gr.hits,
      },
      loom_signals: loomSignals,
    };
  }

  const punct = applyRulesToUnprotectedText(source, getPunctRules('en'));

  const enContextRules = buildContextRules('en', options, loomSignals);
  const contextResult = applyRulesToUnprotectedText(punct.text, enContextRules);
  const lexicalRules = buildEnglishLexicalRules();
  const lexicalResult = applyRulesToUnprotectedText(contextResult.text, lexicalRules);

  const hits = contextResult.hits + lexicalResult.hits;
  const correctedEn = normalizeWhitespace(lexicalResult.text);

  return {
    corrected: correctedEn,
    scope: 'normalization',
    applied_stages: ['PUNCT', 'CTX', 'EN'],
    rule_hits: {
      EN: hits,
      SN: 0,
      SL: 0,
      MO: 0,
      PG: 0,
      GR: 0,
      CTX: contextResult.hits,
      PUNCT: punct.hits,
      total: hits + punct.hits,
    },
    loom_signals: loomSignals,
  };
}

function runNormalization(text, langOrOptions = 'de') {
  return runMultiTokenNormalization(text, langOrOptions).corrected;
}

module.exports = {
  runNormalization,
  runNormalizationWithMetadata: runMultiTokenNormalization,
  applyRulesWithHits,
  tokenize,
  isProtected,
  normalizeWhitespace,
  normalizeSentenceStarts,
  detectClauses,
};
