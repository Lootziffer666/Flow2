'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runCorrection } = require('../packages/flow/src/pipeline');

const INPUT_CSV = path.join(process.cwd(), 'corpora/German_Annotation_V028.csv');
const OUTPUT_JSON = path.join(process.cwd(), 'database/artifacts/reports/lrs_word_pairs_eval.json');

function splitSemicolonRow(row) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i];
    if (ch === '"') {
      const next = row[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ';' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current.trim());
  return out;
}

function parseCsvSemicolonLatin1(filePath) {
  const raw = fs.readFileSync(filePath, 'latin1');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const header = splitSemicolonRow(lines[0]);
  const idxCorrect = header.findIndex((h) => h === 'Correct_Word');
  const idxError = header.findIndex((h) => h === 'Error_Word');
  const idxType = header.findIndex((h) => h === 'Error_Type');

  if (idxCorrect === -1 || idxError === -1) {
    throw new Error('CSV headers not found: Correct_Word / Error_Word');
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = splitSemicolonRow(lines[i]);
    const correct = (parts[idxCorrect] || '').trim();
    const error = (parts[idxError] || '').trim();
    const type = idxType >= 0 ? (parts[idxType] || '').trim() : '';
    if (!correct || !error) continue;
    rows.push({ correct, error, type });
  }

  return rows;
}

function normalizeWord(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[„“”"'`´]/g, '')
    .replace(/\s+/g, ' ');
}

function toComparable(value) {
  return normalizeWord(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/ß/g, 'ss');
}

function wildcardPattern(value) {
  const escaped = toComparable(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/_/g, '[a-zäöü]')}$`, 'iu');
}

function isEquivalent(got, expected) {
  const gotCmp = toComparable(got);
  const expectedCmp = toComparable(expected);
  if (!gotCmp || !expectedCmp) return false;
  if (gotCmp === expectedCmp) return true;
  if (expectedCmp.includes('_')) {
    return wildcardPattern(expected).test(gotCmp);
  }
  return false;
}

function levenshtein(a, b) {
  const left = [...String(a || '')];
  const right = [...String(b || '')];
  const rows = left.length + 1;
  const cols = right.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[rows - 1][cols - 1];
}

function initTypeStat() {
  return {
    total: 0,
    strict_matches: 0,
    equivalent_matches: 0,
    improved: 0,
    unchanged: 0,
  };
}

function evaluate(rows) {
  let strictMatches = 0;
  let equivalentMatches = 0;
  let improved = 0;
  let unchanged = 0;

  const perErrorType = {};
  const failures = [];

  for (const row of rows) {
    const result = runCorrection(row.error);
    const gotRaw = String(result.corrected || '');
    const expectedRaw = String(row.correct || '');
    const inputRaw = String(row.error || '');

    const got = normalizeWord(gotRaw);
    const expected = normalizeWord(expectedRaw);
    const input = normalizeWord(inputRaw);

    const strictOk = got === expected;
    const equivalentOk = isEquivalent(got, expected);

    const distBefore = levenshtein(toComparable(input), toComparable(expected));
    const distAfter = levenshtein(toComparable(got), toComparable(expected));
    const improvedThisRow = distAfter < distBefore;
    const unchangedThisRow = toComparable(got) === toComparable(input);

    if (strictOk) strictMatches += 1;
    if (equivalentOk) equivalentMatches += 1;
    if (improvedThisRow) improved += 1;
    if (unchangedThisRow) unchanged += 1;

    const typeKey = row.type || 'unknown';
    if (!perErrorType[typeKey]) perErrorType[typeKey] = initTypeStat();
    const typeStat = perErrorType[typeKey];
    typeStat.total += 1;
    if (strictOk) typeStat.strict_matches += 1;
    if (equivalentOk) typeStat.equivalent_matches += 1;
    if (improvedThisRow) typeStat.improved += 1;
    if (unchangedThisRow) typeStat.unchanged += 1;

    if (!equivalentOk) {
      failures.push({
        error: row.error,
        expected: row.correct,
        got: result.corrected,
        type: row.type,
        distance_before: distBefore,
        distance_after: distAfter,
        improved: improvedThisRow,
        unchanged: unchangedThisRow,
        rule_hits: result.rule_hits,
      });
    }
  }

  const total = rows.length;
  const pct = (n) => Number(((total ? n / total : 0) * 100).toFixed(2));

  const perTypeSummary = Object.entries(perErrorType)
    .map(([type, stat]) => ({
      type,
      total: stat.total,
      strict_match_rate: Number(((stat.strict_matches / stat.total) * 100).toFixed(2)),
      equivalent_match_rate: Number(((stat.equivalent_matches / stat.total) * 100).toFixed(2)),
      improved_rate: Number(((stat.improved / stat.total) * 100).toFixed(2)),
      unchanged_rate: Number(((stat.unchanged / stat.total) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    dataset: path.relative(process.cwd(), INPUT_CSV),
    total_pairs: total,
    strict_exact_matches: strictMatches,
    strict_exact_rate: pct(strictMatches),
    equivalent_matches: equivalentMatches,
    equivalent_match_rate: pct(equivalentMatches),
    improved_vs_input: improved,
    improved_vs_input_rate: pct(improved),
    unchanged_outputs: unchanged,
    unchanged_output_rate: pct(unchanged),
    mismatch_after_equivalence: total - equivalentMatches,
    per_error_type: perTypeSummary,
    sample_failures: failures.slice(0, 100),
  };
}

function main() {
  const rows = parseCsvSemicolonLatin1(INPUT_CSV);
  const report = evaluate(rows);

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`LRS pairs evaluated: ${report.total_pairs}`);
  console.log(`Strict exact: ${report.strict_exact_matches} (${report.strict_exact_rate}%)`);
  console.log(`Equivalent: ${report.equivalent_matches} (${report.equivalent_match_rate}%)`);
  console.log(`Improved vs input: ${report.improved_vs_input} (${report.improved_vs_input_rate}%)`);
  console.log(`Unchanged outputs: ${report.unchanged_outputs} (${report.unchanged_output_rate}%)`);
  console.log(`Report: ${path.relative(process.cwd(), OUTPUT_JSON)}`);
}

main();
