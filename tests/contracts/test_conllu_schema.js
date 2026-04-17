'use strict';

/**
 * Contract test — CoNLL-U Gold Manifest Schema
 *
 * Validates that sample manifest entries conform to
 * data/contracts/conllu_gold.schema.json.
 *
 * STATUS: STUB — currently only validates schema loading and structure.
 * Real data fixtures must be added once §3.1 collection begins.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../../data/contracts/conllu_gold.schema.json');

function run() {
  // Gate: schema file must exist and be valid JSON.
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const schema = JSON.parse(raw);

  const required = ['sent_id', 'stratum', 'conllu_path', 'text', 'text_lang',
                    'source', 'annotator', 'double_annotated'];
  for (const field of required) {
    if (!schema.properties || !schema.properties[field]) {
      throw new Error(`Schema missing required property definition: ${field}`);
    }
  }

  const stratumEnum = schema.properties.stratum.enum;
  const expectedStrata = ['no_touch', 'ambiguity', 'hard_structural', 'routine'];
  for (const s of expectedStrata) {
    if (!stratumEnum.includes(s)) {
      throw new Error(`Stratum enum missing value: ${s}`);
    }
  }

  console.log('PASS: conllu_gold.schema.json — structure valid');
  console.log('NOTE: no data fixtures exist yet; add samples under tests/contracts/fixtures/conllu/');
}

try {
  run();
} catch (err) {
  console.error('FAIL:', err.message);
  process.exit(1);
}
