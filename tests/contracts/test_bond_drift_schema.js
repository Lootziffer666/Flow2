'use strict';

/**
 * Contract test — Bond-Drift Baseline Schema
 *
 * STATUS: STUB — no §3.3 data exists yet. Currently only validates that the
 * schema file is loadable and structurally complete.
 *
 * When §3.3 data is collected, add fixture files under
 * tests/contracts/fixtures/bond_drift/ and extend the loop below.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, '../../data/contracts/bond_drift.schema.json');

function run() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

  const required = ['pair_id', 'text', 'baseline_conllu', 'candidate_conllu',
                    'drift_allowed', 'critical', 'drift_reason',
                    'edges_changed', 'annotator', 'double_annotated'];
  for (const field of required) {
    if (!schema.properties || !schema.properties[field]) {
      throw new Error(`Schema missing required property definition: ${field}`);
    }
  }

  if (!schema.$defs || !schema.$defs.EdgeChange)
    throw new Error('Schema missing $defs.EdgeChange');

  const fieldEnum = schema.$defs.EdgeChange.properties.field.enum;
  for (const f of ['HEAD', 'DEPREL', 'UPOS']) {
    if (!fieldEnum.includes(f)) throw new Error(`EdgeChange field enum missing: ${f}`);
  }

  console.log('PASS: bond_drift.schema.json — structure valid');
  console.log('NOTE: §3.3 dataset absent; add fixtures once ANNOTATION_POLICY_DRIFT.md is FINAL');
}

try {
  run();
} catch (err) {
  console.error('FAIL:', err.message);
  process.exit(1);
}
