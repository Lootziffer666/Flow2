import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { DatabaseSync } from 'node:sqlite';

const require = createRequire(import.meta.url);
const { runCorrection } = require('../../packages/flow/src/pipeline.js');

const [dbArg, outArg] = process.argv.slice(2);
const dbPath = dbArg ? path.resolve(process.cwd(), dbArg) : null;
const outPath = outArg ? path.resolve(process.cwd(), outArg) : null;

const normalize = (t) => (t || '').trim().toLowerCase();

async function main() {
  if (!dbPath || !outPath) {
    throw new Error('Usage: node database/tools/benchmark_flow_spin.mjs <dbPath> <outPath>');
  }

  const db = new DatabaseSync(dbPath, { readonly: true });
  const rows = db
    .prepare(`SELECT id,input_text,expected_text FROM samples WHERE expected_text!='' LIMIT 80`)
    .all();
  if (!rows.length) {
    fs.writeFileSync(outPath, JSON.stringify({ status: 'not executed', reason: 'no samples', cases: 0 }, null, 2));
    return;
  }
  let pass = 0;
  const failures = [];
  for (const r of rows) {
    const corrected = runCorrection(r.input_text).corrected;
    const ok = normalize(corrected) === normalize(r.expected_text);
    if (ok) pass += 1;
    else failures.push({ id: r.id, input: r.input_text.slice(0, 120), got: corrected.slice(0, 120), expected: r.expected_text.slice(0, 120) });
  }
  const out = {
    status: 'executed',
    cases: rows.length,
    passed: pass,
    failed: rows.length - pass,
    pass_rate: `${((pass / rows.length) * 100).toFixed(2)}%`,
    failure_buckets: {
      mismatch: failures.length,
    },
    failures: failures.slice(0, 25),
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  db.close();
}

main().catch((e) => {
  fs.writeFileSync(outPath, JSON.stringify({ status: 'not executed', reason: String(e) }, null, 2));
  process.exit(1);
});
