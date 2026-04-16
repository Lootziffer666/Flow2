#!/usr/bin/env node
'use strict';
/**
 * LRS Dataset Evaluation — FLOW DE Pipeline
 *
 * Führt alle 70 LRS-Testsätze durch die FLOW-Pipeline (DE),
 * protokolliert jede einzelne Regelentscheidung pro Stage und
 * erstellt einen vollständigen Abdeckungsbericht.
 *
 * Usage:
 *   cd /home/user/FLOW-SPIN-SMASH/packages/flow
 *   node eval_lrs.js > ../../corpora/synthetical/LRS_flow_eval_report.md
 */

const fs   = require('fs');
const path = require('path');

// ─── Dataset ─────────────────────────────────────────────────────────────────
const DATASET = path.join(__dirname, '../../corpora/synthetical/LRS_Orthographic_Normalization_Dataset_german_1.md');
const raw     = fs.readFileSync(DATASET, 'latin1');
// File contains a sequence of JSON objects separated by commas — wrap into array
const entries = JSON.parse('[' + raw.trim().replace(/,\s*$/, '') + ']');

// ─── Rule modules ─────────────────────────────────────────────────────────────
const SN_RULES           = require('./src/rules.sn');
const SL_RULES           = require('./src/rules.sl');
const MO_RULES           = require('./src/rules.mo');
const PG_RULES           = require('./src/rules.pg');
const { getPunctRules }  = require('./src/rules.punct');
const { GR_RULES, contextWindowRules } = require('@loot/loom');
const { applyRulesWithHits, normalizeWhitespace, normalizeSentenceStarts } = require('./src/ruleEngine');

// ─── Active CTX rules (DE + both, not disabled) ───────────────────────────────
const ACTIVE_CTX_DE = contextWindowRules.filter(
  r => (r.lang === 'de' || r.lang === 'both') && !r.disabledByDefault
);

// ─── Protected spans (replicated from ruleEngine.js) ─────────────────────────
const PROTECTED_PATTERNS = [
  /`[^`]+`/g,
  /\b[A-Z]{2,}[A-Za-z0-9_]*\b/g,
  /\bhttps?:\/\/[^\s]+/g,
  /\b[A-Za-z0-9._%+-]+@[^\s]+/g,
];

function getProtectedSpans(text) {
  const spans = [];
  for (const pat of PROTECTED_PATTERNS) {
    const re = new RegExp(pat.source, pat.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length });
      if (!re.global) break;
    }
  }
  spans.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const s of spans) {
    if (!merged.length || s.start > merged[merged.length - 1].end) {
      merged.push({ ...s });
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, s.end);
    }
  }
  return merged;
}

// ─── Core: apply rules, track which ones fired ───────────────────────────────
function applyRulesWithDetails(text, rules, stageName) {
  let result = String(text);
  const fired = [];

  for (const rule of rules || []) {
    const from = rule.from || rule.pattern;
    const to   = rule.to ?? rule.replacement;
    if (!(from instanceof RegExp) || typeof to === 'undefined') continue;

    const before = result;
    // Use global clone so we don't exhaust lastIndex
    const re = new RegExp(from.source, from.flags);
    result = result.replace(re, to);
    if (result !== before) {
      fired.push({
        id:    rule.id   || `${stageName}:/${from.source}/`,
        desc:  rule.description || rule.id || from.source,
        before,
        after: result,
      });
    }
  }

  return { text: result, fired };
}

function applyToUnprotected(text, rules, stageName) {
  const source = String(text);
  const spans  = getProtectedSpans(source);

  if (!spans.length) return applyRulesWithDetails(source, rules, stageName);

  let cursor = 0;
  const allFired = [];
  let output = '';

  for (const span of spans) {
    const chunk = source.slice(cursor, span.start);
    const r     = applyRulesWithDetails(chunk, rules, stageName);
    output += r.text;
    allFired.push(...r.fired);
    output += source.slice(span.start, span.end);
    cursor = span.end;
  }

  const tail = source.slice(cursor);
  const tr   = applyRulesWithDetails(tail, rules, stageName);
  output += tr.text;
  allFired.push(...tr.fired);

  return { text: output, fired: allFired };
}

// ─── Run full DE pipeline with stage-by-stage capture ────────────────────────
function runPipeline(input) {
  const stages = [];

  function step(name, rules) {
    const prev  = stages.length ? stages[stages.length - 1].output : input;
    const r     = applyToUnprotected(prev, rules, name);
    stages.push({ name, input: prev, output: r.text, fired: r.fired });
    return r.text;
  }

  step('PUNCT', getPunctRules('de'));
  step('CTX',   ACTIVE_CTX_DE);
  step('SN',    SN_RULES);
  step('SL',    SL_RULES);
  step('MO',    MO_RULES);
  step('PG',    PG_RULES);
  step('GR',    GR_RULES);

  // POST: whitespace + sentence-start capitalisation
  const prevPost = stages[stages.length - 1].output;
  const wsOut    = normalizeWhitespace(prevPost);
  const final    = normalizeSentenceStarts(wsOut, 'de');
  stages.push({
    name:  'POST',
    input: prevPost,
    output: final,
    fired: (final !== prevPost)
      ? [{ id: 'post-normalize', desc: 'Whitespace + Satzanfang-Großschreibung', before: prevPost, after: final }]
      : [],
  });

  return { stages, final };
}

// ─── Simple token-level diff ──────────────────────────────────────────────────
function tokenDiff(a, b) {
  const aW = a.split(/\s+/).filter(Boolean);
  const bW = b.split(/\s+/).filter(Boolean);
  const diffs = [];
  const max = Math.max(aW.length, bW.length);
  for (let i = 0; i < max; i++) {
    const wa = aW[i] || '∅';
    const wb = bW[i] || '∅';
    if (wa !== wb) diffs.push(`\`${wa}\`→\`${wb}\``);
  }
  return diffs;
}

// ─── Escape markdown table cell ───────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/\|/g, '\\|');
}

// ─── Generate report ──────────────────────────────────────────────────────────
const lines = [];

lines.push('# LRS Flow Evaluation Report');
lines.push('');
lines.push(`**Dataset:** LRS Orthographic Normalization Dataset German v1 (${entries.length} Sätze)`);
lines.push(`**Pipeline:** PUNCT → CTX → SN → SL → MO → PG → GR → POST`);
lines.push(`**CTX aktiv (DE):** ${ACTIVE_CTX_DE.map(r => r.id).join(', ')}`);
lines.push(`**CTX deaktiviert (disabledByDefault):** de-weil-dass, de-dem-hause, de-seit-seid`);
lines.push('');
lines.push('---');
lines.push('');

const summary = { perfect: 0, partial: 0, none: 0 };
const allMissed = {};    // error_type → count missed
const ruleFreq  = {};    // rule_id → { stage, count, desc }

function trackRule(stage, hit) {
  const key = hit.id;
  if (!ruleFreq[key]) ruleFreq[key] = { stage, count: 0, desc: hit.desc };
  ruleFreq[key].count++;
}

for (const entry of entries) {
  const { id, noisy_text, clean_text, error_types, theme } = entry;

  const { stages, final } = runPipeline(noisy_text);

  // Collect per-rule frequencies
  for (const stage of stages) {
    for (const hit of stage.fired) trackRule(stage.name, hit);
  }

  const isPerfect = final === clean_text;
  const isChanged = final !== noisy_text;
  if (isPerfect)       summary.perfect++;
  else if (isChanged)  summary.partial++;
  else                 summary.none++;

  // Track missed error types
  if (!isPerfect) {
    for (const et of error_types) {
      allMissed[et] = (allMissed[et] || 0) + 1;
    }
  }

  const matchLabel = isPerfect ? '✅ vollständig' : isChanged ? '⚠️ partiell' : '❌ keine Änderung';

  lines.push(`## ${id} — ${theme}`);
  lines.push('');
  lines.push(`**Fehlertypen:** ${error_types.join(' · ')}`);
  lines.push('');
  lines.push('| Rolle | Text |');
  lines.push('|---|---|');
  lines.push(`| Input (noisy) | \`${esc(noisy_text)}\` |`);
  lines.push(`| FLOW output   | \`${esc(final)}\` |`);
  lines.push(`| Gold (clean)  | \`${esc(clean_text)}\` |`);
  lines.push(`| Übereinstimmung | ${matchLabel} |`);
  lines.push('');

  // Stage breakdown
  const activeStages = stages.filter(s => s.fired.length > 0);
  if (activeStages.length === 0) {
    lines.push('_Keine Regeländerungen ausgelöst._');
  } else {
    lines.push('### Regelentscheidungen');
    lines.push('');
    for (const stage of activeStages) {
      lines.push(`**${stage.name}** (${stage.fired.length} Regel${stage.fired.length === 1 ? '' : 'n'})`);
      lines.push('');
      for (const hit of stage.fired) {
        lines.push(`- \`${hit.id}\` — ${hit.desc}`);
        // Compute what specifically changed at token level
        const changes = tokenDiff(hit.before, hit.after);
        if (changes.length <= 8) {
          lines.push(`  - Änderung: ${changes.join(', ')}`);
        } else {
          lines.push(`  - Vorher: \`${hit.before.slice(0, 120)}\``);
          lines.push(`  - Nachher: \`${hit.after.slice(0, 120)}\``);
        }
      }
      lines.push('');
    }
  }

  // Gap analysis
  if (!isPerfect) {
    lines.push('### Abweichung von Gold');
    lines.push('');
    const gapDiffs = tokenDiff(final, clean_text);
    if (gapDiffs.length > 0 && gapDiffs.length <= 20) {
      lines.push('Token-Differenzen (FLOW→Gold):');
      lines.push('');
      for (const d of gapDiffs) lines.push(`- ${d}`);
    } else {
      lines.push(`- Vorher (FLOW): \`${final.slice(0, 200)}\``);
      lines.push(`- Nachher (Gold): \`${clean_text.slice(0, 200)}\``);
    }
    lines.push('');

    // ZH1 scope note: classify what's missing
    const scopeNotes = [];
    if (error_types.includes('Groß-/Kleinschreibung')) {
      scopeNotes.push('Groß-/Kleinschreibung: POST-Stage kapitalisiert nur Satzanfang, nicht alle Nomen');
    }
    if (error_types.includes('Verbform') || error_types.includes('Flexion')) {
      scopeNotes.push('Verbform/Flexion: außerhalb ZH1-Scope (grammatische Morphologie, kein FLOW-Fall)');
    }
    if (error_types.includes('das/dass')) {
      scopeNotes.push('das/dass: CTX-Regel de-weil-dass vorhanden aber deaktiviert (disabledByDefault)');
    }
    if (error_types.includes('seid/seit') || error_types.includes('Seid/Seit')) {
      scopeNotes.push('seid/seit: CTX-Regel de-seit-seid vorhanden aber deaktiviert (Homonyme-Grenzfall)');
    }
    if (error_types.includes('Worttrennung')) {
      scopeNotes.push('Worttrennung: partiell abgedeckt (SN kennt nur wenige feste Zusammenschreibungen)');
    }
    if (error_types.includes('lautnahe Schreibung') || error_types.includes('f/v-Verwechslung')) {
      scopeNotes.push('Lautnahe Schreibung / f/v: PG-Regeln decken nur explizit gelistete Formen ab');
    }
    if (error_types.includes('Doppelkonsonanten')) {
      scopeNotes.push('Doppelkonsonanten: SL/MO decken nur explizit gelistete Formen (wollte, trotzdem) ab');
    }
    if (error_types.includes('wahr/war')) {
      scopeNotes.push('wahr/war: Homophones Paar, kein regelbasierter Kontexttest vorhanden');
    }
    if (error_types.includes('wen/wenn') || error_types.includes('dan/dann')) {
      scopeNotes.push('wen/wenn / dan/dann: Doppelkonsonant-Regel nicht in Regelwerk vorhanden');
    }
    if (error_types.includes('Zeichensetzung')) {
      scopeNotes.push('Zeichensetzung: GR-Regel komma-nebensatz greift bei expliziten Subordinatoren (dass/weil/obwohl/wenn/falls/...)');
    }

    if (scopeNotes.length > 0) {
      lines.push('**ZH1-Scope-Analyse:**');
      lines.push('');
      for (const n of scopeNotes) lines.push(`- ${n}`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
lines.push('## Zusammenfassung');
lines.push('');
lines.push('### Trefferquote');
lines.push('');
lines.push('| Kategorie | Anzahl | Anteil |');
lines.push('|---|---|---|');
lines.push(`| ✅ Vollständige Gold-Übereinstimmung | ${summary.perfect} | ${(summary.perfect/entries.length*100).toFixed(1)}% |`);
lines.push(`| ⚠️ Partielle Korrekturen           | ${summary.partial} | ${(summary.partial/entries.length*100).toFixed(1)}% |`);
lines.push(`| ❌ Keine Änderung                   | ${summary.none}    | ${(summary.none/entries.length*100).toFixed(1)}% |`);
lines.push('');
lines.push('### Häufigste Regelauslösungen (über alle 70 Sätze)');
lines.push('');
lines.push('| Stage | Regel-ID | Beschreibung | Auslösungen |');
lines.push('|---|---|---|---|');
const sortedRules = Object.entries(ruleFreq).sort((a, b) => b[1].count - a[1].count);
for (const [id, info] of sortedRules) {
  lines.push(`| ${info.stage} | \`${id}\` | ${info.desc} | ${info.count} |`);
}
lines.push('');
lines.push('### Nicht vollständig korrigierte Fehlerklassen');
lines.push('');
lines.push('(Jede Zeile = mindestens ein Satz hatte diesen Fehlertyp und ist nicht identisch mit Gold)');
lines.push('');
lines.push('| Fehlertyp | Sätze mit Abweichung |');
lines.push('|---|---|');
const sortedMissed = Object.entries(allMissed).sort((a, b) => b[1] - a[1]);
for (const [et, cnt] of sortedMissed) {
  lines.push(`| ${et} | ${cnt} |`);
}
lines.push('');
lines.push('### Pipeline-Abdeckung');
lines.push('');
lines.push('| Stage | Regel-IDs | Abgedeckte Phänomene |');
lines.push('|---|---|---|');
lines.push('| PUNCT | de-punct-anfuehrungszeichen, universal-punct-ellipsis, universal-punct-em-dash-* | Typografische Anführungszeichen, Ellipsis, Gedankenstrich |');
lines.push('| CTX   | universal-space-before-punct, universal-multiple-spaces | Leerzeichen vor Satzzeichen, doppelte Leerzeichen |');
lines.push('| CTX (deaktiviert) | de-weil-dass, de-seit-seid, de-dem-hause | das/dass nach weil/ob; seid/seit; Dativ-Formen |');
lines.push('| SN    | garnich, garnicht, ausversehen, aufeinmal, zuende, weiter-gegangen, hats, dachte/gesagt/gewusst/gehört-dass | Getrennt-/Zusammenschreibung, Worttrennung, dass-Konjunktion |');
lines.push('| SL    | villeicht/vieleicht, wier, wolte, trozdem, dan→dann, wen→wenn, gebrant→gebrannt | Silbenstruktur, Doppelkonsonanten, Vokalfolgen |');
lines.push('| MO    | irgentwie, irgentwann, eigendlich, obwol→obwohl, erklert, gewessen, wolte | Morphologische Stammformen, nd/nt-Verwechslung |');
lines.push('| PG    | gelsen, ferig, weis→weiß, shule→Schule, nich→nicht, hab→habe | Phonem-Graphem-Korrespondenz, sh/sch-Verwechslung |');
lines.push('| GR    | komma-nebensatz (+damit), word-repeat, sodass, apostroph-genitiv, als-wie | Kommasetzung, Wortwiederholung, Zusammenschreibung |');
lines.push('| POST  | normalizeSentenceStarts, normalizeWhitespace | Satzanfang-Großschreibung, Whitespace |');
lines.push('');
lines.push('### Strukturelle Lücken (nicht abgedeckt durch FLOW DE v0.5)');
lines.push('');
lines.push('| Lücke | Grund |');
lines.push('|---|---|');
lines.push('| Substantiv-Großschreibung (alle Nomen) | Erfordert POS-Tagging; nicht in regelbasiertem System lösbar |');
lines.push('| Verbformen (hatt→hat, wahren→waren) | Grammatische Morphologie außerhalb ZH1-Scope |');
lines.push('| Flexionsendungen (meinen, habe) | Grammatische Morphologie außerhalb ZH1-Scope |');
lines.push('| das/dass (kontextabhängig) | de-weil-dass deaktiviert; allgemein-kontextuell nicht lösbar |');
lines.push('| seid/seit | de-seit-seid deaktiviert; Homophones Paar |');
lines.push('| wen/wenn, dan/dann | Doppelkonsonant-Regel fehlt im Regelwerk |');
lines.push('| wahr/war, anderst/anders | Kein Kontextmodell für Homonyme |');
lines.push('| wider/wieder | Homophones Paar; "wider" ist gültiges deutsches Wort (gegen/contrary) |');
lines.push('| gar keinen / gar kein (zusammengeschrieben) | Nur 1× in Datensatz; Einzelfall |');
lines.push('| Lautnahe Schreibvarianten (verbleibend) | PG-Lexikon abgedeckt für: shule, weis, hab, gelsen, ferig, nigh |');
lines.push('| f/v-Verwechslung (for→vor, fergeßen→vergessen) | "for" ist englisches Wort; globale f/v-Regel zu riskant |');
lines.push('| wen→wenn: bekanntes falsch-positiv | Akkusativ "wen" (wen rufst du an?) wird ebenfalls korrigiert |');

process.stdout.write(lines.join('\n') + '\n');
