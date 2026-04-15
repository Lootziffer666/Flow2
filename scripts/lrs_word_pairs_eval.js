'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runCorrection } = require('../packages/flow/src/pipeline');

const INPUT_CSV = path.join(process.cwd(), 'corpora/German_Annotation_V028.csv');
const OUTPUT_JSON = path.join(process.cwd(), 'database/artifacts/reports/lrs_word_pairs_eval.json');

function parseCsvSemicolonLatin1(filePath) {
  const raw = fs.readFileSync(filePath, 'latin1');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const header = lines[0].split(';').map((v) => v.trim());
  const idxCorrect = header.findIndex((h) => h === 'Correct_Word');
  const idxError = header.findIndex((h) => h === 'Error_Word');
  const idxType = header.findIndex((h) => h === 'Error_Type');

  if (idxCorrect === -1 || idxError === -1) {
    throw new Error('CSV headers not found: Correct_Word / Error_Word');
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(';');
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
    .replace(/[„“”"'`´]/g, '');
}

function evaluate(rows) {
  let exact = 0;
  const failures = [];

  for (const row of rows) {
    const result = runCorrection(row.error);
    const got = normalizeWord(result.corrected);
    const expected = normalizeWord(row.correct);

    if (got === expected) {
      exact += 1;
      continue;
    }

    failures.push({
      error: row.error,
      expected: row.correct,
      got: result.corrected,
      type: row.type,
      rule_hits: result.rule_hits,
    });
  }

  const total = rows.length;
  const passRate = total ? exact / total : 0;

  return {
    dataset: path.relative(process.cwd(), INPUT_CSV),
    total_pairs: total,
    exact_matches: exact,
    mismatches: total - exact,
    exact_match_rate: Number((passRate * 100).toFixed(2)),
    sample_failures: failures.slice(0, 50),
  };
}

function main() {
  const rows = parseCsvSemicolonLatin1(INPUT_CSV);
  const report = evaluate(rows);

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`LRS pairs evaluated: ${report.total_pairs}`);
  console.log(`Exact matches: ${report.exact_matches}`);
  console.log(`Mismatch: ${report.mismatches}`);
  console.log(`Exact match rate: ${report.exact_match_rate}%`);
  console.log(`Report: ${path.relative(process.cwd(), OUTPUT_JSON)}`);
}

main();
