'use strict';

/**
 * Contract test — FLOW Parallel Benchmark Schema
 *
 * Validates that the existing sample JSONL and schema are internally consistent.
 * STATUS: STUB — extends to real data once §3.2 collection begins.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH   = path.resolve(__dirname, '../../data/contracts/flow_parallel.schema.json');
const SAMPLE_PATH   = path.resolve(__dirname, '../../data/benchmark/flow_benchmark_items.sample.jsonl');

const ID_PATTERN = /^FLOW-[ABCD]-\d{4,6}$/;

function validateItem(item, idx) {
  const errs = [];
  if (!ID_PATTERN.test(item.id))
    errs.push(`id format wrong: ${item.id}`);
  if (!['A','B','C','D'].includes(item.category))
    errs.push(`unknown category: ${item.category}`);
  if (typeof item.source_sentence !== 'string' || !item.source_sentence)
    errs.push('source_sentence missing or empty');
  if (typeof item.primary_gold_target !== 'string' || !item.primary_gold_target)
    errs.push('primary_gold_target missing or empty');
  if (!Array.isArray(item.required_edits))
    errs.push('required_edits must be array');
  if (!Array.isArray(item.optional_edits))
    errs.push('optional_edits must be array');
  if (!Array.isArray(item.forbidden_edits))
    errs.push('forbidden_edits must be array');
  if (typeof item.no_touch !== 'boolean')
    errs.push('no_touch must be boolean');
  if (item.no_touch) {
    if (item.required_edits.length > 0)
      errs.push('no_touch=true but required_edits non-empty');
    if (item.primary_gold_target !== item.source_sentence)
      errs.push('no_touch=true but primary_gold_target != source_sentence');
  }
  return errs;
}

function run() {
  // Schema must load and have both $defs.
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  if (!schema.$defs || !schema.$defs.Edit)
    throw new Error('Schema missing $defs.Edit');
  if (!schema.$defs.ForbiddenEdit)
    throw new Error('Schema missing $defs.ForbiddenEdit');
  console.log('PASS: flow_parallel.schema.json structure valid');

  // Sample items must conform.
  const lines = fs.readFileSync(SAMPLE_PATH, 'utf8').split('\n').filter(Boolean);
  let failures = 0;
  lines.forEach((line, idx) => {
    const item = JSON.parse(line);
    const errs = validateItem(item, idx);
    if (errs.length) {
      console.error(`FAIL item ${idx} (${item.id}):`, errs.join('; '));
      failures++;
    }
  });
  if (failures) throw new Error(`${failures} items failed schema validation`);
  console.log(`PASS: ${lines.length} sample items valid`);
}

try {
  run();
} catch (err) {
  console.error('FAIL:', err.message);
  process.exit(1);
}
