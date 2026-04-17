'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { runCorrection } = require('../packages/flow/src/pipeline');

const DATASET_DIR = path.join(process.cwd(), 'flow-db/datasets/robustness/flow_longtexts');
const REPORT_PATH = path.join(process.cwd(), 'database/artifacts/reports/flow_longtexts_test_report.json');

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function listLongtexts() {
  if (!fs.existsSync(DATASET_DIR)) return [];
  return fs.readdirSync(DATASET_DIR)
    .filter((name) => /^\d{2}_.+\.md$/i.test(name))
    .sort()
    .map((name) => path.join(DATASET_DIR, name));
}

function evaluateFile(filePath) {
  const input = fs.readFileSync(filePath, 'utf8');
  const inputWords = wordCount(input);

  const t0 = performance.now();
  const first = runCorrection(input);
  const t1 = performance.now();

  const corrected = String(first.corrected || '');
  const correctedWords = wordCount(corrected);
  const changed = corrected !== input;

  const t2 = performance.now();
  const second = runCorrection(corrected);
  const t3 = performance.now();

  const secondCorrected = String(second.corrected || '');
  const deterministic = secondCorrected === corrected;

  return {
    file: path.relative(process.cwd(), filePath),
    input_words: inputWords,
    corrected_words: correctedWords,
    changed,
    deterministic,
    rule_hits_total: first.rule_hits?.total ?? null,
    run_ms: Number((t1 - t0).toFixed(2)),
    rerun_ms: Number((t3 - t2).toFixed(2)),
    applied_stages: first.applied_stages || [],
    scope: first.scope || null,
    applied_learning: first.applied_learning || null,
  };
}

function buildReport(results) {
  const total = results.length;
  const changed = results.filter((r) => r.changed).length;
  const deterministic = results.filter((r) => r.deterministic).length;

  const runTimes = results.map((r) => r.run_ms);
  const avgRun = runTimes.length ? runTimes.reduce((a, b) => a + b, 0) / runTimes.length : 0;
  const maxRun = runTimes.length ? Math.max(...runTimes) : 0;

  const failures = results
    .filter((r) => !r.deterministic || r.input_words < 2000)
    .map((r) => ({
      file: r.file,
      reason: !r.deterministic ? 'non_deterministic_rerun' : 'input_too_short',
      input_words: r.input_words,
    }));

  return {
    dataset_dir: path.relative(process.cwd(), DATASET_DIR),
    tested_files: total,
    changed_files: changed,
    deterministic_files: deterministic,
    deterministic_rate: Number((total ? (deterministic / total) * 100 : 0).toFixed(2)),
    average_run_ms: Number(avgRun.toFixed(2)),
    max_run_ms: Number(maxRun.toFixed(2)),
    failures,
    results,
  };
}

function main() {
  const files = listLongtexts();
  if (!files.length) {
    throw new Error(`No longtext files found in ${DATASET_DIR}`);
  }

  const results = files.map(evaluateFile);
  const report = buildReport(results);

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Longtext files tested: ${report.tested_files}`);
  console.log(`Deterministic reruns: ${report.deterministic_files}/${report.tested_files} (${report.deterministic_rate}%)`);
  console.log(`Changed files: ${report.changed_files}`);
  console.log(`Average runtime: ${report.average_run_ms} ms`);
  console.log(`Max runtime: ${report.max_run_ms} ms`);
  console.log(`Report: ${path.relative(process.cwd(), REPORT_PATH)}`);

  if (report.failures.length) {
    console.error('Failures detected:', report.failures.length);
    process.exit(1);
  }
}

main();
